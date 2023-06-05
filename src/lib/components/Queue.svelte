<script lang="ts">
    import type Innertube from 'youtubei.js/agnostic';
    import type { Unique } from '../virtual';
    import AudioListItem from './AudioListItem.svelte';
    import InputBar from './InputBar.svelte';
    import VirtualScrollable from './VirtualScrollable.svelte';
    import type { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';

    export let items: Array<Unique<string, string>>;
    export let gap: number;
    export let item_width: number;
    export let item_height: number;
    export let selected_item_index: number;
    export let playing: number | null;
    export let on_item_add: (id_or_url: string) => Promise<void>;
    export let tube: Innertube;
    export let dragend = (e: DragEvent) => {
        hovering = null;
        dragging_index = null;
    };
    export let swap_items = async (i: number, j: number) => {};
    export let insert_item = async (index: number, id: string) => {};

    let end_is_visible = false;
    const end_reached = async () => {};
    const on_item_click = async (t: Unique<VideoInfo | string, unknown>) => {};
    let selected_item: Unique<VideoInfo | string, unknown>;
    let try_scroll_selected_item_in_view: () => Promise<void>;

    let searched_item_map = new Map<string, VideoInfo>();
    export let searched_items: Array<Unique<VideoInfo | string, unknown>> = [];
    const fetch_info = async (items: Unique<string, unknown>[]) => {
        for (const id of items) {
            if (searched_item_map.has(id.data)) {
                continue;
            }

            let info = await tube.getBasicInfo(id.data);
            // console.log(info);
            searched_item_map.set(id.data, info);
        }
        searched_items = items.map((e) => {
            let info = searched_item_map.get(e.data);
            if (!info) {
                throw 'never';
            }
            return { data: info, id: e.data };
        });
        searched_items.push({ data: 'add-new', id: 'add-new' });
    };
    // TODO:
    // make these fetches paged or something
    // like - a queue with many items should not make all users fetch absolutely every vid
    // but this is not a prolem usually
    $: if (items) {
        fetch_info(items);
    }

    const on_enter = async (e: KeyboardEvent) => {
        await on_item_add(new_queue_item);
        new_queue_item = '';
    };

    let new_queue_item = '';
    let new_item_input: HTMLElement;

    let hovering: number | null = null;
    let dragging_index: number | null = null;
    const drop = async (event: DragEvent, target: number) => {
        event.dataTransfer!.dropEffect = 'move';

        if (event.dataTransfer?.getData('covau/dragndrop')) {
            let start_index = parseInt(event.dataTransfer.getData('covau/dragndrop'));

            await swap_items(start_index, target);
        } else if (event.dataTransfer?.getData('covau/dragndropnew')) {
            let new_id = event.dataTransfer.getData('covau/dragndropnew');

            await insert_item(target, new_id);
        }
    };

    const dragstart = (event: DragEvent, i: number) => {
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.dropEffect = 'move';
        dragging_index = i;
        event.dataTransfer!.setData('covau/dragndrop', i.toString());
        event.dataTransfer!.setData('text/plain', 'https://youtu.be/' + items[i].data);
    };
</script>

<queue>
    <VirtualScrollable
        bind:items={searched_items}
        {gap}
        {item_width}
        {item_height}
        {on_item_click}
        {end_reached}
        bind:try_scroll_into_view={try_scroll_selected_item_in_view}
        bind:selected={selected_item_index}
        bind:end_is_visible
        bind:selected_item
        let:item
        let:selected
        let:index
    >
        <item
            draggable={index != items.length}
            on:dragstart={(event) => dragstart(event, index)}
            on:drop|preventDefault={(event) => drop(event, index)}
            on:dragend={dragend}
            ondragover="return false"
            on:dragenter={() => (hovering = index)}
            class:is-active={hovering === index && items.length != index}
            class:is-dragging={dragging_index === index}
            class:is-playing={index === playing}
            class:is-selected={index === selected_item_index}
        >
            {#if typeof item === 'string'}
                <InputBar
                    placeholder="Add new item"
                    bind:input_element={new_item_input}
                    bind:value={new_queue_item}
                    {on_enter}
                    focus_on_create={selected}
                />
            {:else}
                <AudioListItem
                    title={item.basic_info.title ? item.basic_info.title : ''}
                    title_sub={item.basic_info.author ? item.basic_info.author : ''}
                    img_src={item.basic_info.thumbnail
                        ? item.basic_info.thumbnail[item.basic_info.thumbnail.length - 1].url
                        : ''}
                />
            {/if}
        </item>
    </VirtualScrollable>
</queue>

<style>
    queue {
        width: 100%;
        height: 100%;
    }

    item {
        width: 100%;
        height: 100%;
        display: block;
    }
    item.is-active {
        background-color: #558855;
    }
    item.is-dragging {
        background-color: #885555;
    }
    item.is-playing {
        background-color: #885588;
    }
    item.is-selected {
        background-color: #888855;
    }
</style>
