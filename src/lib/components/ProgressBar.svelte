<script lang="ts" context="module">
    let img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
</script>

<script lang="ts">
    export let progress: number;
    export let thumb_width: number;
    export let thumb_height: number;
    export let onchange: (progress: number) => Promise<void>;

    let thumb_progress = 0;
    let _progress = 0;

    $: if (typeof progress !== 'undefined') {
        if (!dragging && !wait_for_update) {
            thumb_progress = get_thumb_progress(progress);
        }
    }
    $: if (_progress) {
        thumb_progress = get_thumb_progress(_progress);
    }

    // OOF: player does not await for enough time after calling methods on it.
    // so wait for some hacky amount of time before
    // syncing progress bar to the 'progress' variable
    let wait_for_update = false;
    $: if (!dragging) {
        wait_for_update = true;
        setTimeout(() => {
            wait_for_update = false;
        }, 500);
    }

    const get_thumb_progress = (p: number) => {
        let tp: number;

        if (p * width < thumb_width / 2) {
            tp = 0;
        } else if (p * width + thumb_width / 2 > width) {
            tp = width - thumb_width;
        } else {
            tp = width * p - thumb_width / 2;
        }

        return tp / (width - thumb_width);
    };

    let width: number;

    let dragging = false;
    let dragging_x: number | null = null;
    const dragstart = (e: DragEvent) => {
        e.dataTransfer?.setDragImage(img, 0, 0);
        e.dataTransfer!.dropEffect = 'none';
        dragging = true;
        set_progress_at_click(e);
    };
    const dragend = async () => {
        await onchange(_progress);
        console.log('awaited');
        dragging = false;
        dragging_x = null;
    };
    const mousemove = (e: MouseEvent) => {};
    const dragover = async (e: DragEvent) => {
        if (dragging) {
            if (!dragging_x) {
                dragging_x = e.clientX;
            } else {
                let del = (e.clientX - dragging_x) / width;
                if (_progress + del <= 1 && _progress + del >= 0) {
                    _progress += del;
                    dragging_x = e.clientX;
                } else {
                    if (_progress + del < 0) {
                        _progress = 0;
                    } else {
                        _progress = 1;
                    }
                }
            }
        }
    };

    const set_progress_at_click = (e: MouseEvent | DragEvent) => {
        let rect: DOMRect = (e as any).target.getBoundingClientRect();
        let p = e.clientX - rect.x;
        p = p / width;
        _progress = p;
    };
    const onclick = async (e: MouseEvent | DragEvent) => {
        set_progress_at_click(e);
        dragging = true;
        await onchange(_progress);
        console.log('awaited');
        dragging = false;
    };
</script>

<svelte:window on:mousemove={mousemove} on:dragover={dragover} />

<bar
    bind:clientWidth={width}
    on:click={onclick}
    on:keydown={() => {}}
    draggable={true}
    on:dragstart={dragstart}
    on:dragend={dragend}
>
    <completed style="width: {thumb_progress * width}px;" />
    <thumb
        style="--thumb-width: {thumb_width}px;
            --thumb-height: {thumb_height}px;
            --prog: {thumb_progress * (width - thumb_width)}px;"
    />
</bar>

<style>
    bar {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: row;

        position: relative;
    }

    completed {
        background-color: #555588;
    }

    thumb {
        position: absolute;
        top: calc(50% - var(--thumb-height) / 2);
        left: var(--prog);
        width: var(--thumb-width);
        height: var(--thumb-height);

        background-color: #558855;
    }
</style>
