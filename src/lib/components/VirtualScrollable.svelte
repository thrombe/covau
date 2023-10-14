<script lang="ts">
    import type { RObject } from '../searcher/searcher.ts';

    import Observer from './Observer.svelte';
    import { tick } from 'svelte';
    import type { Unique } from '../virtual.ts';
    import Scrollbar from './Scrollbar.svelte';

    export let columns: number;
    export let item_height: number;
    export let items: Array<Unique<T, unknown>>;
    export let selected: number;

    export let selected_item: Unique<T, unknown> | null = null;
    export let end_reached = async () => {};
    export let on_keydown = async (_: KeyboardEvent, _a: () => Promise<void>) => {};
    export let on_item_click = async (_: Unique<T, unknown>) => {};
    export let end_is_visible = true;
    export let keyboard_control = true;
    export let width: number;
    export let height: number;

    type T = $$Generic;
    interface $$Slots {
        default: {
            item: T;
            index: number;
            item_width: number;
            item_height: number;
            selected: boolean;
            root: HTMLElement;
        };
    }

    $: margin = item_height * 2;
    $: item_width = width/columns;

    let start = 0;
    let end = 0;
    let visible = new Array<Unique<T, unknown>>();
    let edited = false;
    $: if (items) {
        edited = true;
    }
    $: if (width) {
        edited = true;
    }
    $: if (columns) {
        edited = true;
    }
    let grid: HTMLElement;

    let root: HTMLElement;

    let top_padding = 0;
    let bottom_padding = 0;
    let offset_observer = false;
    let on_update = async () => {
        if (!items) {
            return;
        }
        // let st = window.getComputedStyle(grid);
        // columns = st.getPropertyValue('grid-template-columns').split(' ').length;
        
        let s = Math.floor(root.scrollTop / item_height);
        let e = s + Math.ceil(root.clientHeight / item_height) + 1;
        let total_pos_req = Math.ceil(items.length / columns);

        if (total_pos_req * item_height > margin) {
            offset_observer = true;
        } else {
            offset_observer = false;
        }
        // console.log('bottom padding', bottom_padding, e, total_pos_req, offset_observer);

        s = Math.max(s-1, 0);
        top_padding = s * item_height;
        bottom_padding = Math.max(total_pos_req - e, 0) * item_height;

        if (start != s || end != e || edited) {
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

        if (event.key == 'ArrowLeft' || event.key == "h") {
            if (selected - 1 >= 0) {
                selected -= 1;
            }
        } else if (event.key == 'ArrowRight' || event.key == "l") {
            if (selected + 1 < items.length) {
                selected += 1;
            }
        } else if (event.key == 'ArrowUp' || event.key == "k") {
            if (selected - columns >= 0) {
                selected -= columns;
            }
        } else if (event.key == 'ArrowDown' || event.key == "j") {
            if (selected + 1 < items.length) {
                selected += columns;
            }
        } else {
            await on_keydown(event, try_scroll_into_view);
        }
        await tick();
        await try_scroll_into_view();

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
            event.preventDefault();
        }
    };
    $: if (height && width && root && items && columns) {
        on_update();
    }
    let _selected_item: HTMLElement | undefined;
    export const try_scroll_into_view = async () => {
        await tick();
        update_selected_item();

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

    const update_selected_item = () => {
        let ele = document.getElementById('selected');
        if (ele) {
            _selected_item = ele;
        } else {
            _selected_item = undefined;
        }
    };

    $: if (selected) {
        (async () => {
            await tick();
            update_selected_item();
        })();
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
        await try_scroll_into_view();
        await on_item_click(items[selected]);
    };

    const is_selected = (index: number, selected: number) => {
        let i = index + start * columns;
        return selected == i || (i == items.length - 1 && selected >= items.length);
    };

    $: scrollbar_total_height = items.length / columns * item_height;
</script>

<sbp class='flex flex-row h-full w-full'>
<cl on:scroll={on_update} bind:this={root} bind:clientHeight={height} bind:clientWidth={width}
    class='flex flex-row flex-wrap content-start overflow-y-auto h-full scrollbar-hide' 
    style='width: calc(100% - var(--scrollbar-width));'
>
    <pad style="height: {top_padding}px;" class='w-full mx-4' />
    <gd bind:this={grid}
        class='grid justify-evenly justify-items-center content-start overflow-visible w-full'
        style="
            --list-item-width: {item_width}px;
            grid-template-columns: repeat({columns}, minmax(var(--list-item-width), 1fr));
        "
    >
        {#each visible as item, i (item.id)}
            <sel
                id={is_selected(i, selected) ? 'selected' : ''}
                on:click={() => {
                    _on_item_click(i);
                }}
                on:keydown={() => {}}
                style="width: var(--list-item-width); height: {item_height}px;"
            >
                <slot
                    {item_width}
                    {item_height}
                    {root}
                    item={item.data}
                    index={i + start * columns}
                    selected={is_selected(i, selected)}
                />
            </sel>
        {/each}
    </gd>
    <pad style="height: {bottom_padding}px;" class='w-full' />

    <!-- observer -->
    <obs style="top: {offset_observer ? -margin : 0}px;" class='w-full relative' >
        <Observer enter_screen={end_reached} bind:visible={end_is_visible} {root} {margin} />
    </obs>
</cl>

    <sb class='h-full' style='width: var(--scrollbar-width);'>
        <Scrollbar {root} total_height={scrollbar_total_height} />
    </sb>
</sbp>

<svelte:window on:keydown={_on_keydown} />

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    /* For IE, Edge and Firefox */
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
</style>
