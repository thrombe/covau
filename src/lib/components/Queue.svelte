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
    export let playing_video_info: VideoInfo | null = null;
    export let on_item_add: (id: string) => Promise<void>;
    export let tube: Innertube;
    export let dragend = (e: DragEvent) => {
        hovering = null;
        dragging_index = null;
    };
    export let move_item = async (from: number, to: number) => {};
    export let insert_item = async (index: number, id: string) => {};
    export let delete_item = async (index: number, id: string) => {};
    export let play_item = async (index: number) => {};

    $: if (playing) {
        update_playing_vid_info();
    }

    const update_playing_vid_info = () => {
        if (
            playing &&
            (playing_video_info === null ||
                playing_video_info.basic_info.id !== items[playing].data)
        ) {
            let vid = searched_item_map.get(items[playing].data);
            playing_video_info = vid ? vid : null;
        }
    };

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

        update_playing_vid_info();
    };
    // TODO:
    // make these fetches paged or something
    // like - a queue with many items should not make all users fetch absolutely every vid
    // but this is not a prolem usually
    $: if (items) {
        fetch_info(items);
    }
    let get_verified_id = async (id_or_url: string): Promise<string | null> => {
        if (id_or_url.startsWith('https://')) {
            let url = await tube.resolveURL(id_or_url);
            if (!url.payload.videoId && url.payload.url) {
                url = await tube.resolveURL(id_or_url);
            }
            if (!url.payload.videoId) {
                return null;
            }
            return url.payload.videoId;
        } else {
            try {
                let r = await tube.getBasicInfo(id_or_url);
                searched_item_map.set(id_or_url, r);
            } catch {
                return null;
            }

            return id_or_url;
        }
    };

    const on_enter = async (e: KeyboardEvent) => {
        let id = await get_verified_id(new_queue_item);
        if (id) {
            await on_item_add(id);
        }
        new_queue_item = '';
    };

    let new_queue_item = '';
    let new_item_input: HTMLElement;

    let hovering: number | null = null;
    let dragging_index: number | null = null;
    const drop = async (event: DragEvent, target: number) => {
        dragend(event);
        event.dataTransfer!.dropEffect = 'move';

        if (event.dataTransfer?.getData('covau/dragndrop')) {
            let start_index = parseInt(event.dataTransfer.getData('covau/dragndrop'));

            await move_item(start_index, target);
        } else if (event.dataTransfer?.getData('covau/dragndropnew')) {
            let new_id = event.dataTransfer.getData('covau/dragndropnew');

            await insert_item(target, new_id);
        } else if (event.dataTransfer?.getData('text/plain')) {
            let maybe_url = event.dataTransfer.getData('text/plain');

            let id = await get_verified_id(maybe_url);
            if (id) {
                await insert_item(target, id);
            }
        }
    };

    const dragstart = (event: DragEvent, i: number) => {
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.dropEffect = 'move';
        dragging_index = i;
        event.dataTransfer!.setData('covau/dragndrop', i.toString());
        event.dataTransfer!.setData('text/plain', 'https://youtu.be/' + items[i].data);
    };

    const dragenter = (e: DragEvent, index: number) => {
        if (items.length > index) {
            hovering = index;
        } else {
            // if it is input bar - select the thing above it
            hovering = index - 1;
        }
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
            on:dragenter={e => dragenter(e, index)}
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
                <button
                    on:click={async () => {
                        await delete_item(index, items[index].data);
                    }}>pop</button
                >
                <button
                    class:play-button={true}
                    on:click={async () => {
                        await play_item(index);
                    }}>play</button
                >
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
        position: relative;
    }
    item.is-dragging {
        background-color: #885555;
    }
    item.is-selected {
        background-color: #888855;
    }
    item.is-playing {
        background-color: #885588;
    }
    item.is-active {
        background-color: #558855;
    }
    item:hover button {
        display: block;
    }
    item button {
        display: none;

        position: absolute;
        right: 0px;
        top: 0px;
    }
    item button.play-button {
        position: absolute;
        left: 0px;
        top: 0px;
        height: var(--list-item-icon-width);
        width: var(--list-item-icon-width);
        margin: 0px;
        padding: 0px;
        border: 0px;
        background-color: #88555588;
    }
</style>
