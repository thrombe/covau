<script lang="ts">
    import type Innertube from 'youtubei.js/web';
    import InputBar from '../lib/components/InputBar.svelte';
    import PlayBar from '../lib/components/PlayBar.svelte';
    import Queue from '../lib/components/Queue.svelte';
    import SongBrowser from '../lib/components/SongBrowser.svelte';
    import Video from '../lib/components/Video.svelte';
    import { Player } from '../lib/player';
    import type { Unique } from '../lib/virtual';
    import type { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';
    import { onMount } from 'svelte';

    export let params: { group?: string };
    export let tube: Innertube;

    onMount(() => {
        let update_hash = () => {
            let h = window.location.hash.split('/');
            group = h[h.length - 1];
        };

        window.addEventListener('hashchange', update_hash);
        return () => {
            window.removeEventListener('hashchange', update_hash);
        };
    })

    const hash_prefix = '#/vibe/';

    let group: string;
    if (!params.group) {
        group = 'random-one';
        params.group = group;
        window.history.pushState({}, '', hash_prefix + group);
    } else {
        group = params.group;
    }

    $: if (group != params.group) {
        let url_without_hash = window.location.toString().replace(window.location.hash, '');
        let new_url = url_without_hash + hash_prefix + params.group;
        window.location.replace(new_url);
        window.location.reload();
    }

    let player: Player;
    let playing_index: number | null = null;
    let on_player_tick = async () => {
        queue_items = player.synced_data.queue.map((e) => {
            return { data: e, id: e };
        });
        if (player.synced_data.state !== 'Initialised') {
            // queue_selected_item_index = player.synced_data.playing_index;
            playing_index = player.synced_data.playing_index;
        } else {
            playing_index = null;
        }
    };

    let group_name_input: string = '';
    let item_height: number = 70;
    let item_width: number = window.innerWidth / 3;
    const on_window_resize = () => {
        item_width = Number(
            getComputedStyle(queue_element).getPropertyValue('width').replace('px', '')
        );
    };
    $: if (queue_element) {
        on_window_resize();
    }

    let queue_element: HTMLElement;
    let queue_items: Array<Unique<string, string>> = [];
    let queue_selected_item_index: number = -1; // -1 avoids selecting input bar in queue when nothing is in queue
    let queue_playing_vid_info: VideoInfo | null;
    let on_queue_item_add = async (id: string) => {
        if (player.synced_data.queue.filter(t => t == id).length > 0) {
            // TODO: show popup saying that this id is already in the queue
        } else {
            await player.queue(id);
        }
    };
    let on_queue_item_move = async (from: number, to: number) => {
        await player.queue_item_move(from, to);
    };
    let on_queue_item_insert = async (index: number, id: string) => {
        if (player.synced_data.queue.filter(t => t == id).length > 0) {
            // TODO: show popup saying that this id is already in the queue
        } else {
            await player.queue_item_insert(index, id);
        }
    };
    let on_queue_item_delete = async (index: number, id: string) => {
        if (player.synced_data.queue[index] === id) {
            await player.queue_item_delete(index);
        } else {
            // TODO: notify user
        }
    };
    let on_queue_item_play = async (index: number) => {
        await player.play_index(index);
    };

    let queue_dragend: (e: DragEvent) => void;

    let watching = false;
</script>

<svelte:window on:resize={on_window_resize} />

<div style="--list-item-icon-width: {item_height}px;"
    class='flex flex-col w-full h-full'
>
    <all-contents class='flex flex-row'>
        <search-area class='flex flex-col'>
            <top-menubar class='flex flex-row gap-4 justify-center'>
                <button
                    class='rounded-xl bg-red-300 p-2'
                    on:click={() => {
                        watching = false;
                    }}
                >
                    Search
                </button>
                <button
                    class='rounded-xl bg-red-300 p-2'
                    on:click={() => {
                        watching = true;
                    }}
                >
                    Watch
                </button>
            </top-menubar>

            <browse>
                {#if watching}
                    <Video bind:group bind:player bind:on_tick={on_player_tick} />
                {/if}
                <div class='w-full h-full {watching ? 'hidden' : ''}'>
                    <SongBrowser bind:item_height bind:item_width gap={0} bind:tube {queue_dragend} />
                </div>
            </browse>
        </search-area>

        <queue-area class='flex flex-col'>
            <queue bind:this={queue_element}
                class='flex flex-col overflow-hidden overflow-y-auto'
                style='height: {watching ? '100%' : 'calc(100% - var(--video-height))'};'
            >
                <queue-name>
                    <InputBar
                        bind:placeholder={group}
                        bind:value={group_name_input}
                        on_enter={async (e) => {
                            if (!group_name_input) {
                                return;
                            }
                            group = group_name_input;
                        }}
                    />
                </queue-name>

                <queue-content>
                    {#if player}
                        <Queue
                            bind:items={queue_items}
                            gap={0}
                            bind:item_width
                            bind:item_height
                            bind:selected_item_index={queue_selected_item_index}
                            bind:playing={playing_index}
                            bind:on_item_add={on_queue_item_add}
                            bind:tube
                            bind:dragend={queue_dragend}
                            bind:playing_video_info={queue_playing_vid_info}
                            insert_item={on_queue_item_insert}
                            move_item={on_queue_item_move}
                            delete_item={on_queue_item_delete}
                            play_item={on_queue_item_play}
                        />
                    {/if}
                </queue-content>
            </queue>

            {#if !watching}
                <video-box>
                    <Video bind:group bind:player bind:on_tick={on_player_tick} />
                </video-box>
            {/if}
        </queue-area>
    </all-contents>

    <play-bar>
        <PlayBar bind:player
            audio_info={queue_playing_vid_info ? {
                title: queue_playing_vid_info.basic_info.title ? queue_playing_vid_info.basic_info.title : '',
                title_sub: queue_playing_vid_info.basic_info.author ? queue_playing_vid_info.basic_info.author : '',
                img_src: queue_playing_vid_info.basic_info.thumbnail
                        ? queue_playing_vid_info.basic_info.thumbnail[queue_playing_vid_info.basic_info.thumbnail.length - 1].url
                        : ''
            } : null}
        />
    </play-bar>
</div>

<style>
    * {
        --play-bar-height: 60px;
        --top-menubar-height: 36px;
        --name-bar-height: 50px;
        --browse-tab-bar-height: 25px;
        --queue-area-width: min(475px, max(330px, 33.333vw));
        --video-height: calc(var(--queue-area-width) * 1080 / 1920);
        --scrollbar-width: 13px;

        font-family: monospace;
    }

    all-contents {
        height: calc(100% - var(--play-bar-height));
    }

    search-area {
        width: calc(100% - var(--queue-area-width));
        background-color: #885555;
    }

    top-menubar {
        height: var(--top-menubar-height);
        background-color: #aa5555;
    }

    browse {
        height: calc(100% - var(--top-menubar-height));
    }

    queue-area {
        width: var(--queue-area-width);
        background-color: #558855;
    }

    queue {
        background-color: #994499;
    }

    queue-name {
        height: var(--name-bar-height);
        background-color: #772299;
    }

    queue-content {
        height: calc(100% - var(--name-bar-height));
        background-color: #995599;
    }

    video-box {
        height: var(--video-height);
        background-color: #225522;
    }

    play-bar {
        height: var(--play-bar-height);
        background-color: #555588;
    }
</style>
