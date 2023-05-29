import type { RObject } from "./searcher";


type Constructor<T> = new (...args: any[]) => T;

const sleep = (ms: number) => {
    return new Promise(
        (r) => setTimeout(r, ms)
    )
};


export interface ISlow<T> {
    with_query(q: string): Promise<T | null>;
}
export function SlowSearch<T, S extends Constructor<{
    with_query(q: string): Promise<T | null>;
}>>(s: S) {
    return class extends s implements ISlow<T> {
        last_search: number = 0;
        search_generation: number = 0;
        async with_query(q: string) {
            this.search_generation += 1;
            let current_generation = this.search_generation;
            let del = 500;
            let now = Date.now();
            if (now - this.last_search < del) {
                await sleep(del);
            }

            // some other (concurrent) call to this method may change current_generation
            if (this.search_generation == current_generation) {
                this.last_search = Date.now();
                let r = await super.with_query(q);

                // to make sure that latest searches are not overwritten by searches that started earlier
                if (this.search_generation == current_generation) {
                    return r;
                }
            }
            return null;
        }
    } as S & Constructor<ISlow<T>>
}



export interface ISaved<T> {
    next_page(): Promise<RObject<T>[]>;

    search_results: RObject<T>[];
}
export function SavedSearch<T, S extends Constructor<{
    next_page(): Promise<RObject<T>[]>;
}>>(s: S) {
    return class extends s implements ISaved<T> {
        search_results: Array<RObject<T>>;

        // this essentially acts as an async semaphore
        last_op: Promise<RObject<T>[]>;

        constructor(...args: any[]) {
            super(...args);
            this.search_results = new Array();
            this.last_op = Promise.resolve([]);
        }

        override next_page = async () => {
            await this.last_op;
            this.last_op = super.next_page();
            let r = await this.last_op;
            this.search_results.push(...r);
            return this.search_results;
        }
    } as S & Constructor<ISaved<T>>
}


export interface IUnique<T> {
    next_page(): Promise<RObject<T>[]>;
}
export function UniqueSearch<T, S extends Constructor<{
    next_page(): Promise<RObject<T>[]>;
    get_key(t: RObject<T>): any;
}>>(s: S) {
    return class extends s implements IUnique<T> {
        uniq: Set<T>;
        constructor(...args: any[]) {
            super(...args);
            this.uniq = new Set();
        }

        async next_page() {
            let r = await super.next_page();
            let items = r.filter((item) => {
                let k = this.get_key(item);
                if (this.uniq.has(k)) {
                    return false;
                } else {
                    this.uniq.add(k);
                    return true;
                }
            });
            return items;
        }
    } as S & Constructor<IUnique<T>>
}



export abstract class Paged<T> {
    next_page_num: number = 0;
    has_next_page: boolean = true;
    query: string;
    constructor(q: string) {
        this.query = q;
    }

    // implementor must set has_next_page
    protected abstract search(page: number): Promise<RObject<T>[]>;
    abstract get_key(t: RObject<T>): unknown;

    async next_page() {
        // TODO: if this function is called multiple times really quickly, this has_next_page check fails as previous calls are still awaiting for io
        if (!this.has_next_page) {
            return new Array<RObject<T>>();
        }
        let r = await this.search(this.next_page_num);
        this.next_page_num += 1;
        return r;
    }
}


export abstract class Unpaged<T> {
    has_next_page: boolean = true;
    query: string;
    constructor(q: string) {
        this.query = q;
    }

    abstract next_page(): Promise<RObject<T>[]>;
    abstract get_key(t: RObject<T>): unknown;
}


export abstract class Offset<T> {
    curr_offset: number = 0;
    has_next_page: boolean = true;
    query: string;
    constructor(q: string) {
        this.query = q;
    }

    // implementor must set has_next_page
    protected abstract search(page: number): Promise<RObject<T>[]>;
    abstract get_key(t: RObject<T>): unknown;

    async next_page() {
        // TODO: if this function is called multiple times really quickly, this has_next_page check fails as previous calls are still awaiting for io
        if (!this.has_next_page) {
            return new Array<RObject<T>>();
        }
        let r = await this.search(this.curr_offset);
        this.curr_offset += r.length;
        return r;
    }
}


