<script lang="ts" context="module">
    let img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
</script>

<script lang="ts">
    export let root: HTMLElement | undefined;
    export let total_height: number;

    let visible_height: number;

    
    $: if (visible_height || total_height) {
        thumb_height = visible_height * (visible_height / total_height);
    }

    // timeout to make sure the scrollbar is correctly synced (it does not get enough on:scroll events)
    let timeout: number;
    $: if (root) {
        root.onscroll = (e) => {
            clearTimeout(timeout);
            onscroll();
            timeout = setTimeout(onscroll, 200);
        };
    }

    const onscroll = () => {
        if (root && !dragging) {
            // inverse of the other calculation to set top_pad
            top_pad =
                (root.scrollTop * (visible_height - thumb_height)) /
                (total_height - visible_height);
        }
    };

    let top_pad = 0;
    let thumb_height: number;

    let dragging = false;
    let dragging_y: number | null = null;
    const mousemove = (e: MouseEvent) => {};
    const dragstart = (e: DragEvent) => {
        e.dataTransfer?.setDragImage(img, 0, 0);
        e.dataTransfer!.dropEffect = 'none';
        dragging = true;
    };
    const dragend = (e: DragEvent) => {
        dragging = false;
        dragging_y = null;
    };
    const dragover = (e: DragEvent) => {
        if (dragging && root) {
            if (!dragging_y) {
                dragging_y = e.clientY;
            } else {
                let del = e.clientY - dragging_y;
                if (top_pad + del + thumb_height <= visible_height && top_pad + del >= 0) {
                    top_pad += del;
                    dragging_y = e.clientY;
                } else {
                    if (top_pad + del < 0) {
                        top_pad = 0;
                    } else {
                        top_pad = visible_height - thumb_height;
                    }
                }

                root.scrollTop =
                    (total_height - visible_height) * (top_pad / (visible_height - thumb_height));
            }
        }
    };
</script>

<svelte:window on:mousemove={mousemove} on:dragover={dragover} />

<gutter bind:clientHeight={visible_height} draggable={false}>
    <top-pad style="height: {top_pad}px" />
    <thumb
        draggable={true}
        on:dragstart={dragstart}
        on:dragend={dragend}
        style="height: {thumb_height}px;"
    />
</gutter>

<style>
    gutter {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
    }

    thumb {
        background-color: #885555;
    }
</style>
