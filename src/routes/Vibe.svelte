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
    import Toasts, { toast } from '$lib/toast/Toasts.svelte';
    import BlobBg from '$lib/components/BlobBg.svelte';

    export let params: { group?: string };
    export let tube: Innertube;

    onMount(() => {
        let update_hash = (e: HashChangeEvent) => {
            let h = new URL(e.newURL).hash.split('/');
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
        window.history.pushState({}, '', new_url);
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
    let item_min_width = 290;
    let browse_columns: number = 1;
    let browse_width: number;
    const on_window_resize = () => {
        browse_columns = Math.min(3, Math.max(Math.floor(browse_width / item_min_width), 1));
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
            await toast('item already in queue');
        } else {
            await player.queue(id);
        }
    };
    let on_queue_item_move = async (from: number, to: number) => {
        await player.queue_item_move(from, to);
    };
    let on_queue_item_insert = async (index: number, id: string) => {
        if (player.synced_data.queue.filter(t => t == id).length > 0) {
            await toast('item already in queue');
        } else {
            await player.queue_item_insert(index, id);
        }
    };
    let on_queue_item_delete = async (index: number, id: string) => {
        if (player.synced_data.queue[index] === id) {
            await player.queue_item_delete(index);
        } else {
            await toast(`item at index ${index} is not ${id}`, 'error');
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
            { content_type: 'queue' } | 
            { content_type: 'watch' }); 

    let menubar_options: MenubarOption[] = [
        { name: 'Watch', content_type: 'watch' },
        { name: 'Song', content_type: 'music', type: 'song' }, 
        { name: 'Music Video', content_type: 'music', type: 'video' },
        { name: 'Music Playlist', content_type: 'music', type: 'playlist' },
        { name: 'Artist', content_type: 'music', type: 'artist' },
        { name: 'Album', content_type: 'music', type: 'album' },
    ];
    let menubar_song_option = menubar_options[1];
    let menubar_queue_option: MenubarOption = { name: 'Queue', content_type: 'queue' };
    let menubar_option: MenubarOption = menubar_song_option;
    let music_search_type: Typ = 'song';

    $: if (menubar_option) {
        if (menubar_option.content_type == 'watch') {
            watching = true;
        } else {
            watching = false;
        }
    }

    let width: number;
    let mobile = false;
    $: if (width) {
       if (width < item_min_width + 330 + 50) {
            if (!mobile) {
                menubar_options = [menubar_queue_option, ...menubar_options];
                menubar_option = menubar_queue_option;
            }
            mobile = true;
        } else {
            if (mobile) {
                menubar_options = menubar_options.filter(o => o.content_type != 'queue');
                if (menubar_option == menubar_queue_option) {
                    menubar_option = menubar_song_option;
                }
            }
            mobile = false;
        }
    }

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

    const on_img_err = async () => {
        img_src = '';
    };

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

    const on_group_button_click = async () => {
        navigator.clipboard.writeText(window.location.toString());
    };
</script>

<svelte:window on:resize={on_window_resize} bind:innerWidth={width} />
<svelte:head>
    <title>covau! vibe amongst {group}</title>
</svelte:head>

<div
    class='relative flex flex-col w-full h-full bg-gray-900 bg-opacity-30'
    style='--queue-area-width: {!mobile ? 'min(475px, max(330px, 33.333vw))' : '0px'};'
>
    <all-contents class='flex flex-row'>
        <search-area class='flex flex-col'>
            <top-menubar class='w-full flex flex-row gap-2 py-2 px-6 justify-start text-gray-200 overflow-x-auto'>
                {#each menubar_options as typ}
                    <button
                        class='flex-none rounded-xl p-2 font-bold bg-gray-200 {menubar_option == typ ? 'bg-opacity-30' : 'bg-opacity-10'}'
                        on:click={() => {
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

            <browse class='{!mobile ? 'pr-4 pl-4' : ''}'>
                <div class='w-full h-full rounded-3xl overflow-hidden' bind:clientWidth={browse_width}>
                    {#if watching}
                        <Video bind:group bind:player bind:on_tick={on_player_tick} />
                    {/if}
                    <div
                        class='relative w-full h-full {watching ? 'hidden' : ''}'
                        bind:clientWidth={img_w}
                        bind:clientHeight={img_h}
                    >
                        {#if mobile}
                            <div class='flex flex-col w-full {menubar_option == menubar_queue_option ? 'h-full' :'h-0'}'>
                                <div bind:this={queue_element}
                                    class='flex flex-col overflow-y-auto h-full'
                                >
                                    <div class='flex flex-row p-2 bg-gray-900 bg-opacity-30 h-14'>
                                        <div class='w-full h-full pr-2 pl-[2.5rem]' style='width: calc(100% - var(--name-bar-height) + 1.5rem);'>
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
                                        <button 
                                            class='my-1 p-1 bg-gray-200 bg-opacity-10 rounded-md aspect-square'
                                            on:click={on_group_button_click}
                                        >
                                            <img class='w-full h-full opacity-75' src='/static/copy.svg'>
                                        </button>
                                    </div>

                                    <div class='pl-2'
                                        style='height: calc(100% - 3.5rem);'
                                    >
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
                                                {mobile}
                                                insert_item={on_queue_item_insert}
                                                move_item={on_queue_item_move}
                                                delete_item={on_queue_item_delete}
                                                play_item={on_queue_item_play}
                                            />
                                        {/if}
                                    </div>
                                </div>

                                {#if !watching}
                                    <video-box class='absolute -z-40 left-0 bottom-0 w-full rounded-2xl overflow-hidden scale-75 flex-none aspect-video'>
                                        <Video bind:group bind:player bind:on_tick={on_player_tick} />
                                    </video-box>
                                {/if}
                            </div>
                        {/if}

                        <div class='absolute h-full w-full left-0 top-0 -z-20 brightness-75'>
                            <BlobBg
                                colors={[
                                    "#4F0D1B",
                                    "#912E40",
                                    "#504591",
                                    "#5197B9",
                                    "#16183E",
                                    "#925FD6",
                                ]}
                            />
                        </div>
                        <img
                            class='absolute w-full h-full left-0 top-0 -z-20 overflow-hidden object-cover brightness-50 blur-md scale-110'
                            style='{img_squared ? '' : 'lol'}height: {100 * Math.max((img_w / img_h), 1)}%;'
                            src={img_src}
                            alt=''
                            on:error={on_img_err}
                        >

                        <div class='w-full h-full {menubar_option.content_type == 'queue' ? 'h-0 overflow-hidden' : ''}'>
                            <SongBrowser
                                bind:item_height
                                columns={browse_columns}
                                gap={0}
                                bind:tube
                                {queue_dragend}
                                queue_item_add={on_queue_item_add}
                                type={music_search_type}
                            />
                        </div>
                    </div>
                </div>
            </browse>
        </search-area>

        {#if !mobile}
            <queue-area class='flex flex-col'>
                <queue bind:this={queue_element}
                    class='flex flex-col overflow-y-auto'
                    style='height: {watching ? '100%' : 'calc(100% - var(--video-height))'};'
                >
                    <queue-name class='p-2'>
                        <div class='flex flex-row rounded-xl h-full bg-gray-400 bg-opacity-20'>
                            <div class='h-full pl-4 pr-2' style='width: calc(100% - var(--name-bar-height) + 1.5rem);'>
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
                            <button 
                                class='my-2 p-1 aspect-square'
                                on:click={on_group_button_click}
                            >
                                <img class='w-full h-full opacity-75' src='/static/copy.svg'>
                            </button>
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
        {/if}
    </all-contents>

    <play-bar class='px-2 pb-2 pt-4'>
        <PlayBar bind:player
            {mobile}
            audio_info={queue_playing_vid_info ? {
                title: queue_playing_vid_info.basic_info.title ? queue_playing_vid_info.basic_info.title : '',
                title_sub: queue_playing_vid_info.basic_info.author ? queue_playing_vid_info.basic_info.author : '',
                img_src: queue_playing_vid_info.basic_info.thumbnail
                        ? queue_playing_vid_info.basic_info.thumbnail[queue_playing_vid_info.basic_info.thumbnail.length - 1].url
                        : ''
            } : null}
        />
    </play-bar>

    <div class='w-full h-full absolute -z-30 brightness-50'>
        <BlobBg />
    </div>

    <!-- grain applies over both the bg and the song-browser image cuz of z-index i think -->
    <div class='-z-20 grainy grainy-bg'></div>
</div>

<Toasts
/>

<style lang='postcss'>
    * {
        --play-bar-height: 70px;
        --top-menubar-height: 50px;
        --name-bar-height: 60px;
        --search-bar-height: 50px;
        --browse-tab-bar-height: 25px; 
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

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    /* For IE, Edge and Firefox */
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
</style>
