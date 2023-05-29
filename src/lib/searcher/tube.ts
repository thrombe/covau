import type Search from "youtubei.js/dist/src/parser/ytmusic/Search";
import Innertube, { MusicShelfContinuation, UniversalCache, YTNodes } from "youtubei.js/web";
import { SavedSearch, SlowSearch, UniqueSearch, Unpaged } from "./mixins";
import type { Keyed, RObject, RSearcher } from "./searcher";
import type { SearchContinuation } from "youtubei.js/dist/src/parser/ytmusic/Search";

// https://github.com/LuanRT/YouTube.js/issues/321
export type MusicResponsiveListItem = YTNodes.MusicResponsiveListItem;

export class SongTube extends Unpaged<MusicResponsiveListItem> {
    tube: Innertube;

    constructor(q: string, tube: Innertube) {
        super(q);
        this.tube = tube;
    }

    private static async new_innertube_instance() {
        let yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            fetch: async (input, init) => {
                let url: string;
                if (typeof input === 'string') {
                    url = input;
                } else if (input instanceof URL) {
                    url = input.toString();
                } else {
                    url = input.url;
                }

                let headers = init?.headers
                    ? new Headers(init.headers)
                    : input instanceof Request
                        ? input.headers
                        : new Headers();
                let headers_copy = JSON.stringify([...headers]);

                headers.delete('user-agent');

                const request = new Request(
                    url,
                    input instanceof Request ? input : undefined
                );
                let req = {
                    url: url,
                    headers: headers_copy,
                    body: init?.body,
                    method: request.method
                };
                let res = await fetch('/.netlify/functions/fetch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req)
                });
                return res;
            }
        });
        return yt;
    }


    static async new(q: string) {
        const US = UniqueSearch<MusicResponsiveListItem, typeof SongTube>(SongTube);
        const SS = SavedSearch<MusicResponsiveListItem, typeof US>(US);
        return new SS(q, await this.new_innertube_instance());
    }

    static factory() {
        type R = RSearcher<MusicResponsiveListItem>;
        class Fac {
            include_adult: boolean = false;
            async with_query(q: string) {
                let t = await SongTube.new(q);
                return t as R | null;
            }
        }
        const SS = SlowSearch<R, typeof Fac>(Fac);
        return new SS();
    }

    static obj_type() {
        return null as unknown as MusicResponsiveListItem & Keyed;
    }


    results: Search | null = null;
    cont: SearchContinuation | null = null;
    pages: Array<MusicShelfContinuation> = new Array();
    async next_page() {
        if (this.query.length == 0 || !this.has_next_page) {
            this.has_next_page = false;
            return [];
        }
        let songs: Array<MusicResponsiveListItem>;
        if (this.results === null) {
            this.results = await this.tube.music.search(this.query, { type: 'song' });
            console.log(this.results);

            if (!this.results.songs) {
                this.has_next_page = false;
                return [];
            }

            let shelf = this.results.songs;

            songs = [...shelf.contents];
        } else {
            if (this.cont === null) {
                this.cont = await this.results.getContinuation();
            } else {
                this.cont = await this.cont.getContinuation();
            }
            console.log(this.cont)

            if (
                !this.cont.contents
                || !this.cont.contents.contents
                || !(this.cont.contents.contents.length > 0)
            ) {
                this.has_next_page = false;
                return [];
            }

            songs = [...this.cont.contents.contents.as(YTNodes.MusicResponsiveListItem)];
        }

        songs = songs.filter(e => !!e.id);
        let k = songs.map(e => {
            let p = e as RObject<MusicResponsiveListItem>;
            p.get_key = function() {
                if (!this.id) {
                    console.warn("item does not have an id :/", this);
                }
                return this.id;
            };
            return p;
        });

        this.has_next_page = this.results.has_continuation;
        console.log(k.map(e => e.id))
        return k;
    }

    get_key(t: RObject<MusicResponsiveListItem>) {
        if (!t.id) {
            console.warn("item does not have an id :/", t);
        }
        return t.id;
    }
}
