import { writable, type Writable } from "svelte/store";

interface ToastInfo {
    message: string,
    classes: string,
    timeout: number,
}
interface ToastEntry {
    toast: ToastInfo,
    id: number,
}

export class Toaster {
    active: Writable<ToastEntry[]>;
    next_id: number = 0;

    constructor() {
        this.active = writable([]);
    }

    async toast(t: ToastInfo) {
        let te = { toast: t, id: this.next_id };
        this.next_id += 1;
        // this.active.update(s => {
        //     s.push(te);
        //     return s;
        // });
        this.active.update(s => [te, ...s]);
        let p = new Promise(r => setTimeout(() => r(null), t.timeout));
        await p;
        this.active.update(s => s.filter(e => e.id != te.id));
    }
}
