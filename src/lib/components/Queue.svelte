<script lang="ts">
    import type Innertube from 'youtubei.js/web';
    import type { Unique } from '../virtual';
    import AudioListItem from './AudioListItem.svelte';
    import InputBar from './InputBar.svelte';
    import VirtualScrollable from './VirtualScrollable.svelte';
    import type { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';
    import { toast } from '$lib/toast/Toasts.svelte';

    export let items: Array<Unique<string, string>>;
    export let gap: number;
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
    export let mobile = false;

    $: if (playing !== null) {
        update_playing_vid_info();
    }

    const update_playing_vid_info = () => {
        if (
            playing !== null &&
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
        let wait_for = items.map(id => {
            if (searched_item_map.has(id.data)) {
                return Promise.resolve();
            } else {
                return tube.getBasicInfo(id.data).then((info) => {
                    // console.log(info);
                    searched_item_map.set(id.data, info);
                }).catch(e => {
                    searched_item_map.set(id.data, { basic_info: { title: id.data, author: '' }})
                });
            }
        })

        for (const prom of wait_for) {
            await prom;
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
        new_queue_item = '';
        if (id) {
            await on_item_add(id);
        } else {
            await toast('could not add to queue', 'error');
        }
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

    // can't drag items and scroll at the same time. bummer
    const dragstart = (event: DragEvent, i: number) => {
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.dropEffect = 'move';
        dragging_index = i;
        event.dataTransfer!.setData('covau/dragndrop', i.toString());
        event.dataTransfer!.setData('text/plain', 'https://youtu.be/' + items[i].data);
    };

    const dragenter = (e: DragEvent, index: number) => {
        if (!!e.dataTransfer?.getData('covau/ignore')) {
            return;
        }
        if (items.length > index) {
            hovering = index;
        } else {
            // if it is input bar - select the thing above it
            hovering = index - 1;
        }
    };
</script>

<div class='w-full h-full'>
    <VirtualScrollable
        bind:items={searched_items}
        {gap}
        columns={1}
        {item_height}
        {on_item_click}
        {end_reached}
        bind:try_scroll_into_view={try_scroll_selected_item_in_view}
        keyboard_control={false}
        bind:selected={selected_item_index}
        bind:end_is_visible
        bind:selected_item
        let:item
        let:selected
        let:index
    >
        <item class='w-full h-full block relative py-1 rounded-xl'
            draggable={index != items.length}
            on:dragstart={(event) => dragstart(event, index)}
            on:drop|preventDefault={(event) => drop(event, index)}
            on:dragend={dragend}
            ondragover="return false"
            on:dragenter={(e) => dragenter(e, index)}
            class:is-active={hovering === index && items.length != index}
            class:is-dragging={dragging_index === index}
            class:is-playing={index === playing}
            class:is-selected={selected}
        >
            {#if typeof item === 'string'}
                <InputBar
                    placeholder="Add Video"
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
                    class='pop-button'
                    on:click={async () => {
                        await delete_item(index, items[index].data);
                    }}
                >
                    <img draggable={false} class='h-3 opacity-50' src='/static/remove.svg'>
                </button>
                <div class='absolute h-full flex flex-col justify-center left-0 top-0'>
                    <button
                        class='queue-button'
                        class:play-button={true}
                        on:click={async () => {
                            await play_item(index);
                        }}
                    >
                        <img draggable={false} class='scale-[50%]' src='/static/play.svg'>
                    </button>
                </div>
            {/if}
        </item>
    </VirtualScrollable>
</div>

<style lang='postcss'>
    item.is-dragging {
        @apply opacity-40;
    }
    item.is-selected, item:hover {
        @apply bg-gray-200 bg-opacity-10;
    }
    item.is-playing {
        @apply bg-gray-200 bg-opacity-20;
    }
    item.is-active {
        @apply bg-green-400 bg-opacity-20;
    }
    item:hover button, .is-selected button {
        display: block;
    }

    .pop-button {
        @apply absolute p-1 m-2 rounded-md bg-gray-200 bg-opacity-30 text-gray-900 font-bold right-0 top-0;
    }
    .queue-button {
        @apply aspect-square h-full scale-[50%] rounded-md bg-gray-600 bg-opacity-50 text-xl text-gray-900 font-bold;
    }

    item button {
        display: none;
    }
    item button.play-button {
    }
</style>
