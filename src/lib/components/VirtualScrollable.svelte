<script lang="ts">
    import Observer from './Observer.svelte';
    import { tick } from 'svelte';
    import type { Unique } from '../virtual';

    export let item_width: number;
    export let item_height: number;
    export let items: Array<Unique<T, unknown>>;
    export let selected: number;
    export let gap: number;

    export let selected_item: Unique<T, unknown> | null = null;
    export let end_reached = async () => {};
    export let on_keydown = async (_: KeyboardEvent, _a: () => Promise<void>) => {};
    export let on_item_click = async (t: Unique<T, unknown>) => {};
    export let end_is_visible = true;
    export let keyboard_control = true;

    type T = $$Generic;

    let width: number;
    let height: number;
    let columns = 1;

    $: margin = item_height * 2;

    let start = 0;
    let end = 0;
    let visible = new Array<Unique<T, unknown>>();
    let edited = false;
    $: if (items) {
        edited = true;
    }
    let grid: HTMLElement;

    let root: HTMLElement;

    let top_padding = 0;
    let bottom_padding = 0;
    let on_update = async () => {
        if (!items) {
            return;
        }
        let st = window.getComputedStyle(grid);
        columns = st.getPropertyValue('grid-template-columns').split(' ').length;
        // console.log(root.scrollTop, root.clientHeight, start, end, top_padding, bottom_padding);
        let s = Math.floor(root.scrollTop / item_height);
        top_padding = s * item_height;
        let e = start + Math.ceil(root.clientHeight / item_height) + 1;
        bottom_padding = (Math.ceil(items.length / columns) - e) * item_height;

        if ((start != s || end != e || edited) && items.length != 0) {
            start = s;
            end = e;
            edited = false;
            visible = items.slice(start * columns, Math.ceil(end) * columns);
        }
        // console.log("update", end, start, e, s, visible.length, items.length);
    };
    const _on_keydown = async (event: KeyboardEvent) => {
        if (!keyboard_control) {
            return;
        }
        if (document.activeElement?.tagName == 'INPUT') {
            if (event.key == 'Escape') {
                (document.activeElement as HTMLElement).blur();
            }
            return;
        }

        if (event.key == 'ArrowLeft') {
            if (selected - 1 >= 0) {
                selected -= 1;
            }
        } else if (event.key == 'ArrowRight') {
            if (selected + 1 < items.length) {
                selected += 1;
            }
        } else if (event.key == 'ArrowUp') {
            if (selected - columns >= 0) {
                selected -= columns;
            }
        } else if (event.key == 'ArrowDown') {
            if (selected + 1 < items.length) {
                selected += columns;
            }
        } else {
            await on_keydown(event, try_scroll_into_view);
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
            event.preventDefault();
        }
    };
    $: if (height && width && root && items) {
        on_update();
    }
    let _selected_item: HTMLElement;
    export const try_scroll_into_view = async () => {
        await tick();
        if (!(selected === undefined) && items) {
            // console.log(items[selected]);
        }
        if (_selected_item) {
            _selected_item.scrollIntoView({ block: 'nearest' });
        } else {
            let row = selected / columns;
            // if (row*item_height > root.scrollTop + root.clientHeight) {
            if (row * item_height > root.scrollTop) {
                root.scrollTo(0, Math.floor(row) * item_height - root.clientHeight + item_height);
            } else {
                root.scrollTo(0, Math.floor(row) * item_height);
            }
            on_update();
        }
    };
    $: if (!(selected === undefined)) {
        try_scroll_into_view();
    }

    $: if (_selected_item || items) {
        set_selected_item();
    }

    const set_selected_item = () => {
        let index = selected;
        if (selected >= items.length) {
            index = items.length - 1;
        }
        selected_item = items[index];
    };
    set_selected_item();

    const _on_item_click = async (i: number) => {
        selected = i + start * columns;
        await tick();
        await on_item_click(items[selected]);
    };
</script>

<cl on:scroll={on_update} bind:this={root} bind:clientWidth={width} bind:clientHeight={height}>
    <pad style="height: {top_padding}px; width: 100%;" />
    <gd style="--item-width: {item_width}px; --gap: {gap}px;" bind:this={grid}>
        {#each visible as item, i (item.id)}
            {#if selected == i + start * columns || (i + start * columns == items.length - 1 && selected >= items.length)}
                <sel bind:this={_selected_item}
                    on:keydown={() => {}}
                    on:click={() => {
                        _on_item_click(i);
                    }}
                    style="width: {item_width}px; height: {item_height}px;"
                >
                    <slot
                        {item_width}
                        {item_height}
                        {root}
                        item={item.data}
                        index={i + start * columns}
                        selected={true}
                    />
                </sel>
            {:else}
                <clk
                    on:click={() => {
                        _on_item_click(i);
                    }}
                    on:keydown={() => {}}
                    style="width: {item_width}px; height: {item_height}px;"
                >
                    <slot
                        {item_width}
                        {item_height}
                        {root}
                        item={item.data}
                        index={i + start * columns}
                        selected={false}
                    />
                </clk>
            {/if}
        {/each}
    </gd>
    <pad style="height: {bottom_padding}px; width: 100%;" />

    <!-- observer -->
    {#if bottom_padding < margin}
        <obs style="width: 100%;">
            <Observer enter_screen={end_reached} bind:visible={end_is_visible} {root} {margin} />
        </obs>
    {:else}
        <obs style="width: 100%; position: relative; top: -{margin}px;">
            <Observer enter_screen={end_reached} bind:visible={end_is_visible} {root} {margin} />
        </obs>
    {/if}
</cl>

<svelte:window on:keydown={_on_keydown} />

<style>
    cl {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: flex-start;

        overflow: auto;
        width: 100%;
        height: 100%;
    }

    gd {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--item-width), 1fr));
        align-content: start;
        justify-content: space-evenly;
        justify-items: center;
        row-gap: var(--gap);
        column-gap: var(--gap);
        padding: 0px;

        overflow: visible;
        width: calc(100% - var(--gap) * 0);
    }
</style>

