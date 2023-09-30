<script lang="ts">
    import type Innertube from 'youtubei.js/web';
    import InputBar from '$lib/components/InputBar.svelte';
    import PlayBar from '$lib/components/PlayBar.svelte';
    import Queue from '$lib/components/Queue.svelte';
    import SongBrowser from '$lib/components/SongBrowser.svelte';
    import Video from '$lib/components/Video.svelte';
    import { Player } from '$lib/player.ts';
    import type { Unique } from '$lib/virtual.ts';
    import type { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';
    import { onMount } from 'svelte';
    import type { Typ } from '$lib/searcher/song_tube.ts';
    import Toasts, { toaster } from '$lib/toast/Toasts.svelte';
    import BlobBg from '$lib/components/BlobBg.svelte';

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
        let new_url = url_without_hash + hash_prefix + group;
        params.group = group;
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
    let item_height: number = 75;
    let browse_columns: number = 1;
    let browse_width: number;
    const on_window_resize = () => {
        browse_columns = Math.min(3, Math.max(Math.floor(browse_width / 290), 1));
    };
    $: if (browse_width) {
        on_window_resize();
    }

    let queue_element: HTMLElement;
    let queue_items: Array<Unique<string, string>> = [];
    let queue_selected_item_index: number = -1; // -1 avoids selecting input bar in queue when nothing is in queue
    let queue_playing_vid_info: VideoInfo | null;
    let on_queue_item_add = async (id: string) => {
        if (player.synced_data.queue.filter(t => t == id).length > 0) {
            await toaster.toast({
                message: "item already in queue",
                classes: "whitespace-nowrap block bg-blue-400 rounded-lg p-2 text-sm",
                timeout: 1000,
            });
        } else {
            await player.queue(id);
        }
    };
    let on_queue_item_move = async (from: number, to: number) => {
        await player.queue_item_move(from, to);
    };
    let on_queue_item_insert = async (index: number, id: string) => {
        if (player.synced_data.queue.filter(t => t == id).length > 0) {
            await toaster.toast({
                message: "item already in queue",
                classes: "whitespace-nowrap block bg-blue-400 rounded-lg p-2 text-sm",
                timeout: 1000,
            });
        } else {
            await player.queue_item_insert(index, id);
        }
    };
    let on_queue_item_delete = async (index: number, id: string) => {
        if (player.synced_data.queue[index] === id) {
            await player.queue_item_delete(index);
        } else {
            await toaster.toast({
                message: `item at index ${index} is not ${id}`,
                classes: "whitespace-nowrap block bg-red-400 rounded-lg p-2 text-sm",
                timeout: 1000,
            });
        }
    };
    let on_queue_item_play = async (index: number) => {
        await player.play_index(index);
    };

    let queue_dragend: (e: DragEvent) => void;

    let watching = false;
    type MenubarOption = { name: string } & 
        ({ content_type: 'music', type: Typ } | 
            { content_type: 'tube', type: string } | 
            { content_type: 'watch' }); 

    let menubar_options: MenubarOption[] = [
        { name: "Watch", content_type: 'watch' },
        { name: 'Song', content_type: 'music', type: 'song' }, 
        { name: 'Music Video', content_type: 'music', type: 'video' },
        { name: 'Music Playlist', content_type: 'music', type: 'playlist' },
        { name: 'Artist', content_type: 'music', type: 'artist' },
        { name: 'Album', content_type: 'music', type: 'album' },
    ];
    let menubar_option: MenubarOption = menubar_options[1];
    let music_search_type: Typ = 'song';

    let img_src = '';
    let img_h: number;
    let img_w: number;
    let img_squared = false;

    $: if (queue_playing_vid_info) {
        let q = queue_playing_vid_info.basic_info;
        if (q.thumbnail && q.thumbnail.length > 0) {
            img_src = q.thumbnail[0].url;
        }
    }

    // $: if (img_src) {
    //     (async () => {
    //         let res = await fetch('/.netlify/functions/palette', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ src: img_src })
    //         });
    //         console.log(res);
    //     })();
    // }
</script>

<svelte:window on:resize={on_window_resize} />

<div
    class='relative flex flex-col w-full h-full bg-gray-900 bg-opacity-30'
>
    <all-contents class='flex flex-row'>
        <search-area class='flex flex-col'>
            <top-menubar class='flex flex-row gap-2 py-2 justify-center text-gray-200'>
                {#each menubar_options as typ}
                    <button
                        class='rounded-xl p-2 font-bold bg-gray-200 {menubar_option == typ ? 'bg-opacity-30' : 'bg-opacity-10'}'
                        on:click={() => {
                            watching = typ.content_type == 'watch';
                            menubar_option = typ;
                            if (menubar_option.content_type == 'music') {
                                music_search_type = menubar_option.type;
                            }
                        }}
                    >
                        {typ.name} 
                    </button>
                {/each}
            </top-menubar>

            <browse class='pr-4 pl-4'>
                <div class='w-full h-full rounded-3xl overflow-hidden' bind:clientWidth={browse_width}>
                    {#if watching}
                        <Video bind:group bind:player bind:on_tick={on_player_tick} />
                    {/if}
                    <div
                        class='relative w-full h-full {watching ? 'hidden' : ''}'
                        bind:clientWidth={img_w}
                        bind:clientHeight={img_h}
                    >
                        <img
                            class='absolute w-full h-full left-0 top-0 -z-10 overflow-hidden object-cover brightness-50 blur-md scale-110'
                            style='{img_squared ? '' : 'lol'}height: {100 * Math.max((img_w / img_h), 1)}%;'
                            src={img_src}
                            alt=''
                        >
                        <SongBrowser
                            bind:item_height
                            columns={browse_columns}
                            gap={0}
                            bind:tube
                            {queue_dragend}
                            type={music_search_type}
                        />
                    </div>
                </div>
            </browse>
        </search-area>

        <queue-area class='flex flex-col'>
            <queue bind:this={queue_element}
                class='flex flex-col overflow-y-auto'
                style='height: {watching ? '100%' : 'calc(100% - var(--video-height))'};'
            >
                <queue-name class='p-2'>
                    <div class='w-full rounded-xl h-full bg-gray-400 bg-opacity-20'>
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
                    </div>
                </queue-name>

                <queue-content class=''>
                    {#if player}
                        <Queue
                            bind:items={queue_items}
                            gap={0}
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
                <video-box class='rounded-2xl overflow-hidden mt-2 mr-4 flex-none aspect-video'>
                    <Video bind:group bind:player bind:on_tick={on_player_tick} />
                </video-box>
            {/if}
        </queue-area>
    </all-contents>

    <play-bar class='pl-2 pb-2 pt-4'>
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

    <div class='w-full h-full absolute -z-20 brightness-50'>
        <BlobBg
            animate={false}
        />
    </div>
</div>

<Toasts
/>

<style>
    * {
        --play-bar-height: 70px;
        --top-menubar-height: 50px;
        --name-bar-height: 60px;
        --search-bar-height: 50px;
        --browse-tab-bar-height: 25px;
        --queue-area-width: min(475px, max(330px, 33.333vw));
        --video-height: calc(var(--queue-area-width) * 9 / 16);
        --scrollbar-width: 8px;

        font-family: monospace;
    }

    all-contents {
        height: calc(100% - var(--play-bar-height));
    }

    search-area {
        width: calc(100% - var(--queue-area-width));
    }

    top-menubar {
        height: var(--top-menubar-height);
    }

    browse {
        height: calc(100% - var(--top-menubar-height));
    }

    queue-area {
        width: var(--queue-area-width);
    }

    queue {
    }

    queue-name {
        height: var(--name-bar-height);
    }

    queue-content {
        height: calc(100% - var(--name-bar-height));
    }

    video-box {
    }

    play-bar {
        height: var(--play-bar-height);
    }
</style>
