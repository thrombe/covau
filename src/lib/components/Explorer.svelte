
<script lang="ts">
    import VirtualScrollable from './VirtualScrollable.svelte';
    import { tick } from 'svelte';
    import type { Unique } from '../virtual';
    import type { Writable } from 'svelte/store';
    import type { RFactory, RObject, RSearcher } from '../searcher/searcher';

    // OOF: extra prop to fix T as svelte does not recognise T properly here
    // just pass a variable with the required T type (undefined is fine too) and ignore it
    export let t: T;
    export let fac: RFactory<T>;
    export let searcher: Writable<RSearcher<T>>;
    export let selected_item_index: number;
    export let selected_item: Unique<RObject<T>, unknown>;
    export let item_width: number;
    export let item_height: number;
    export let search_query: string;
    export let on_item_click: () => Promise<void>;
    export let on_keydown: (
        e: KeyboardEvent,
        scroll_selected_into_view: () => Promise<void>
    ) => Promise<void>;

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

    let search_objects = async () => {
        let s = await fac.with_query(search_query);
        if (!s) {
            return;
        }
        $searcher = s as RSearcher<T>;
        await next_page();
        await tick();
        selected_item_index = 0;
        await try_scroll_into_view();
        end_reached();
    };
    search_objects();

    let items = new Array<Unique<RObject<T>, number>>();

    let end_is_visible = true;
    let search_input: HTMLElement;
    const _on_keydown = async (
        event: KeyboardEvent,
        scroll_selected_into_view: () => Promise<void>
    ) => {
        if (event.key == 'i') {
            show_item_info = !show_item_info;
        } else if (event.key == '?') {
            selected_item_index = 0;
            await tick();
            await scroll_selected_into_view();
            search_input.focus();
            event.preventDefault();
        } else if (event.key == '/') {
            search_query = '';
            search_input.focus();
            event.preventDefault();
            await search_objects();
        } else {
            await on_keydown(event, scroll_selected_into_view);
        }
    };

    const end_reached = async () => {
        while (true) {
            if (!end_is_visible || !$searcher.has_next_page) {
                break;
            }
            await next_page();
            await tick();
        }
    };
    const next_page = async () => {
        let r = await $searcher.next_page();
        items = r.map(e => {
            return { id: e.get_key(), data: e } as Unique<RObject<T>, number>;
        });
    };
    const on_enter = async (event: KeyboardEvent) => {
        if (event.key == 'Enter') {
            search_input.blur();
        }
    };

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

    let try_scroll_into_view: () => Promise<void>;
</script>

<cl class="inputs">
    <input
        bind:value={search_query}
        on:input={search_objects}
        bind:this={search_input}
        on:keydown={on_enter}
    />
    <button on:click={search_objects}>refresh</button>
    <button
        on:click={() => {
            console.log($searcher, items)
        }}
    >
        {end_is_visible}
    </button>
    <button
        on:click={() => {
            show_item_info = !show_item_info;
        }}
    >
        show item info
    </button>
</cl>

<cl class="main" style="--info-width: {info_width}px; --info-margin: {info_margin}px;">
    <scrollable>
        <VirtualScrollable
            bind:items
            gap={15}
            {item_width}
            {item_height}
            {on_item_click}
            {end_reached}
            bind:try_scroll_into_view
            bind:selected={selected_item_index}
            on_keydown={_on_keydown}
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
    * {
        --input-height: 33px;
        --gap: 20px;
        --top-margin: 15px;
    }

    .inputs {
        height: var(--input-height);
    }

    .main {
        margin-left: var(--gap);
        margin-right: var(--gap);
        margin-top: var(--top-margin);
        width: calc(100% - var(--gap) * 2);
        height: calc(100% - var(--input-height) - var(--top-margin));

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
