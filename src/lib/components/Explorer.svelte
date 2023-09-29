
<script lang="ts">
    import VirtualScrollable from './VirtualScrollable.svelte';
    import { tick } from 'svelte';
    import type { Unique } from '../virtual.ts';
    import type { Writable } from 'svelte/store';
    import type { RFactory, RObject, RSearcher } from '../searcher/searcher.ts';

    // OOF: extra prop to fix T as svelte does not recognise T properly here
    // just pass a variable with the required T type (undefined is fine too) and ignore it
    export let t: T;
    export let fac: Writable<RFactory<T> | null>;
    export let searcher: Writable<RSearcher<T>>;
    export let selected_item_index: number;
    export let selected_item: Unique<RObject<T>, unknown>;
    export let columns: number;
    export let item_height: number;
    export let search_query: string;
    export let gap: number;
    export let end_is_visible = true;
    export let on_item_click: (t: Unique<RObject<T>, unknown>) => Promise<void>;
    export let try_scroll_selected_item_in_view: () => Promise<void>;
    export let keyboard_control = true;

    type T = $$Generic;
    interface $$Slots {
        default: {
            item: RObject<T>;
            item_width: number;
            item_height: number;
            selected: boolean;
            root: HTMLElement;
            info_margin: number;
            info_width: number;
        };
        infobox: {};
    }

    let items = new Array<Unique<RObject<T>, number>>();

    const end_reached = async () => {
        while (true) {
            if (!end_is_visible || !$searcher.has_next_page) {
                break;
            }
            await next_page();
            await tick();
            await new Promise<void>(r => setTimeout(() => r(), 100));
            await tick();
        }
    };
    const next_page = async () => {
        let r = await $searcher.next_page();
        items = r.map((e: RObject<T>) => {
            return { id: e.get_key(), data: e } as Unique<RObject<T>, number>;
        });
    };
    export const search_objects = async () => {
        if ($fac) {
            let s = await $fac.with_query(search_query);
            if (!s) {
                return;
            }
            $searcher = s as RSearcher<T>;
        }
        await next_page();
        await tick();
        selected_item_index = 0;
        await try_scroll_selected_item_in_view();
        end_reached();
    };
    search_objects();

    let info_width = 0;
    let info_margin = 0;
    let show_item_info = false;
    $: if (show_item_info) {
        info_width = 350;
        info_margin = 20;
    } else {
        info_width = 0;
        info_margin = 0;
    }
</script>

<cl class="main" style="--info-width: {info_width}px; --info-margin: {info_margin}px;">
    <scrollable>
        <VirtualScrollable
            bind:items
            {gap}
            {columns}
            {item_height}
            {on_item_click}
            {end_reached}
            {keyboard_control}
            bind:try_scroll_into_view={try_scroll_selected_item_in_view}
            bind:selected={selected_item_index}
            bind:end_is_visible
            bind:selected_item
            let:item_width
            let:item_height
            let:root
            let:item
            let:selected
        >
            <slot
                {item}
                {item_width}
                {item_height}
                {selected}
                {root}
                {info_margin}
                {info_width}
            />
        </VirtualScrollable>
    </scrollable>

    {#if selected_item && show_item_info}
        <slot name="infobox" />
    {/if}
</cl>

<style>
    .main {
        width: 100%;
        height: 100%;

        flex-direction: column;
    }

    cl {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
    }

    scrollable {
        width: calc(100% - var(--info-width));
        height: 100%;
    }
</style>
