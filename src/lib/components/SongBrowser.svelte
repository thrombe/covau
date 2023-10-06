<script lang="ts" context="module">
    import { tick } from 'svelte';
    import { writable, type Writable } from 'svelte/store';
    import type { RFactory, RObject, RSearcher } from '$lib/searcher/searcher.ts';
    import { type MusicResponsiveListItem, SongTube, type Typ } from '$lib/searcher/song_tube.ts';

    let song_fac = writable(SongTube.factory(undefined as unknown as Innertube, '' as Typ));
    // OOF: cannot search anything if query is '' anyway
    let song_searcher = writable(SongTube.new('', undefined as unknown as Innertube, '' as Typ));
</script>

<script lang="ts">
    import { type Unique } from '../virtual.ts';
    import AudioListItem from './AudioListItem.svelte';
    import Explorer from '$lib/components/Explorer.svelte';
    import InputBar from '$lib/components/InputBar.svelte';
    import type Innertube from 'youtubei.js/web';

    export let columns: number;
    export let item_height: number;
    export let gap: number;
    export let tube: Innertube;
    export let queue_dragend: (e: DragEvent) => void = () => {};
    export let type: Typ;
    export let queue_item_add: (id: string) => Promise<void>;

    $song_searcher = SongTube.new('', tube, '' as Typ);
    $song_fac = SongTube.factory(tube, type);
    $: if ($song_searcher.type.type == 'search' && type != $song_searcher.type.search) {
        (async () => {
            $song_fac = SongTube.factory(tube, type);
            await tick();
            if (search_objects) {
                search_objects();
            }
        })();
        tabs = [tabs[0]];
        curr_tab = tabs[0];
    }

    let search_query: string = '';
    let search_input_element: HTMLElement | null;

    let t: MusicResponsiveListItem;
    type T = typeof t;
    let selected_item: Unique<RObject<T>, string>;
    let selected_item_index = 0;
    let search_objects: () => Promise<void>;
    let try_scroll_selected_item_in_view: () => Promise<void>;

    const get_artist_name = (t: T) => {
        if (!t.artists || t.artists.length <= 0) {
            return '';
        }
        return t.artists[0].name;
    };

    let dragstart = (event: DragEvent, t: T) => {
        if (t.id) {
            if (t.item_type == 'song' || t.item_type == 'video') {
                event.dataTransfer!.effectAllowed = 'move';
                event.dataTransfer!.dropEffect = 'move';
                event.dataTransfer!.setData('covau/dragndropnew', t.id);
                event.dataTransfer!.setData('text/plain', 'https://youtu.be/' + t.id);
            } else if (t.item_type == 'artist') {

            } else if (t.item_type == 'album') {

            } else if (t.item_type == 'playlist') {

            }
        }
    };

    type Tab = {
        name: string,
        // fac: Writable<RFactory<T>>,
        searcher: Writable<RSearcher<T>>,
        thumbnail: string | null,
    };

    let tabs: Tab[] = [{ name: 'Results', searcher: song_searcher, thumbnail: null }];
    let search_tab = tabs[0];
    let curr_tab = search_tab;
</script>

<div class='w-full h-full flex flex-col'>
    <bar-area class='flex flex-col bg-gray-900 bg-opacity-30'>
        <search-bar class=''>
            <InputBar
                placeholder={'Search'}
                bind:value={search_query}
                bind:input_element={search_input_element}
                on_enter={async (e) => {
                    e.preventDefault();
                    await search_objects();

                    tabs = [tabs[0]];
                    curr_tab = tabs[0];
                }}
            />
        </search-bar>

        <browse-tab-bar class='flex flex-row overflow-x-auto gap-1 px-1 justify-center'>
            {#each tabs as tab}
                <button 
                    class='border-b-2 px-1 text-gray-400 flex-none text-ellipsis whitespace-nowrap overflow-hidden
                        {curr_tab == tab ? 'font-bold border-gray-200' : 'border-gray-600'}
                    '
                    style='max-width: 12rem;'
                    on:click={async () => {
                        curr_tab = tab;
                    }}
                >
                    {tab.name}
                </button>
            {/each}
        </browse-tab-bar>
    </bar-area>

    {#each tabs as tab (tab.name)}
        <browse-area class='{curr_tab == tab ? '' : 'hidden'}'>
            {#if tab.name == search_tab.name}
                <Explorer
                    {t}
                    fac={song_fac}
                    searcher={song_searcher}
                    bind:search_query
                    bind:selected_item
                    {columns}
                    bind:item_height
                    keyboard_control={false}
                    bind:selected_item_index
                    bind:search_objects
                    bind:try_scroll_selected_item_in_view
                    {gap}
                    on_item_click={async (t) => {
                        console.log(t);
                    }}
                    let:item
                    let:selected
                >
                    <list-item
                        class:selected={selected}
                        draggable={true}
                        on:dragstart={(event) => dragstart(event, item)}
                        on:dragend={queue_dragend}
                    >
                        <div class='item-bg'>
                            {#if item.item_type == 'song' || item.item_type == 'video'}
                                <AudioListItem
                                    title={item.title ?? ''}
                                    title_sub={get_artist_name(item)}
                                    img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                                />
                                <button class='open-button'
                                    on:click={async () => {
                                        if (!item.id) {
                                            return;
                                        }
                                        await queue_item_add(item.id);
                                    }}
                                >
                                    <img draggable={false} class='h-3' src='/static/add.svg'>
                                </button>
                            {:else if item.item_type == 'album' || item.item_type == 'playlist'}
                                <AudioListItem
                                    title={item.title ?? ''}
                                    title_sub={item.author?.name ?? ''}
                                    img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                                />
                                <button class='open-button'
                                    on:click={async () => {
                                        if (!item.id) {
                                            return;
                                        }
                                        let new_tab;
                                        if (item.item_type == 'album') {
                                            new_tab = {
                                                name: 'Album: ' + item.title,
                                                searcher: writable(await $song_fac.browse_album(item.id)),
                                                thumbnail: item.thumbnails.length > 0 ? item.thumbnails[0].url : null,
                                            };
                                        } else {
                                            new_tab = {
                                                name: 'Playlist: ' + item.title,
                                                searcher: writable(await $song_fac.browse_playlist(item.id)),
                                                thumbnail: null,
                                            };
                                        }
                                        tabs = [tabs[0], new_tab];
                                        curr_tab = new_tab;
                                    }}
                                >
                                    <img draggable={false} class='h-3' src='/static/open-new-tab.svg'>
                                </button>
                            {:else if item.item_type == 'artist'}
                                <AudioListItem
                                    title={item.name ?? ''}
                                    title_sub={item.subscribers ?? ''}
                                    img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                                />
                                <button class='open-button'
                                    on:click={async () => {
                                        if (!item.id) {
                                            return;
                                        }
                                        let new_tab = {
                                            name: 'Artist: ' + item.name,
                                            searcher: writable(await $song_fac.browse_artist_songs(item.id)),
                                            thumbnail: null,
                                        };
                                        tabs = [tabs[0], new_tab];
                                        curr_tab = new_tab;
                                    }}
                                >
                                    <img draggable={false} class='h-3' src='/static/open-new-tab.svg'>
                                </button>
                            {/if}
                        </div>
                    </list-item>
                </Explorer>
            {:else}
                <Explorer
                    {t}
                    fac={writable(null)}
                    searcher={tab.searcher}
                    search_query={""}
                    {selected_item}
                    {columns}
                    {item_height}
                    {selected_item_index}
                    {search_objects}
                    {try_scroll_selected_item_in_view}
                    {gap}
                    on_item_click={async (t) => {
                        console.log(t);
                    }}
                    let:item
                    let:selected
                >
                    <list-item
                        class:selected={selected}
                        draggable={true}
                        on:dragstart={(event) => dragstart(event, item)}
                        on:dragend={queue_dragend}
                    >
                        <div class='item-bg'>
                            {#if item.item_type == 'song' || item.item_type == 'video'}
                                <AudioListItem
                                    title={item.title ?? ''}
                                    title_sub={get_artist_name(item)}
                                    img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : curr_tab.thumbnail ?? ''}
                                />
                                <button class='open-button'
                                    on:click={async () => {
                                        if (!item.id) {
                                            return;
                                        }
                                        await queue_item_add(item.id);
                                    }}
                                >
                                    <img draggable={false} class='h-3' src='/static/add.svg'>
                                </button>
                            {:else}
                                <AudioListItem
                                    title={'unknown item'}
                                    title_sub={''}
                                    img_src={''}
                                />
                            {/if}
                        </div>
                    </list-item>
                </Explorer>
            {/if}
        </browse-area>
    {/each}
</div>

<style lang='postcss'>
    bar-area {
        height: calc(var(--search-bar-height) + var(--browse-tab-bar-height));
    }
    search-bar {
        height: var(--search-bar-height);
    }

    browse-tab-bar {
        height: var(--browse-tab-bar-height);
    }

    browse-area {
        height: calc(100% - var(--browse-tab-bar-height) - var(--search-bar-height));
    }

    list-item {
        @apply w-full h-full block relative pl-4;
    }

    .item-bg {
        @apply w-full h-full py-1;
    }

    .open-button {
        @apply absolute aspect-square p-1 m-2 right-0 top-0 bg-gray-200 bg-opacity-30 rounded-md text-gray-900 text-lg font-bold;
        @apply hidden;
    }

    list-item:hover .open-button, .selected .open-button {
        @apply block;
    }

    list-item:hover .item-bg, .selected .item-bg {
        @apply bg-gray-200 bg-opacity-10 rounded-xl;
    }
</style>
