<script lang="ts" context="module">
    import { tick } from 'svelte';
    import { writable, type Writable } from 'svelte/store';
    import type { RFactory, RObject, RSearcher } from '../searcher/searcher.ts';
    import { type MusicResponsiveListItem, SongTube, type Typ } from '../searcher/song_tube.ts';

    let song_fac = writable(SongTube.factory(undefined as unknown as Innertube, '' as Typ));
    // OOF: cannot search anything if query is '' anyway
    let song_searcher = writable(SongTube.new('', undefined as unknown as Innertube, '' as Typ));
</script>

<script lang="ts">
    import { type Unique } from '../virtual.ts';
    import AudioListItem from './AudioListItem.svelte';
    import Explorer from './Explorer.svelte';
    import InputBar from './InputBar.svelte';
    import type Innertube from 'youtubei.js/web';

    export let item_width: number;
    export let item_height: number;
    export let gap: number;
    export let tube: Innertube;
    export let queue_dragend: (e: DragEvent) => void = () => {};
    export let type: Typ;

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

    let tabs: Tab[] = [{ name: 'Search', searcher: song_searcher, thumbnail: null }];
    let curr_tab = tabs[0];
</script>

<div class='w-full h-full flex flex-col'>
    <search-bar>
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

    <browse-tab-bar class='flex flex-row gap-2 justify-center'>
        {#each tabs as tab}
            <button 
                class='border-b-2 {curr_tab == tab ? 'border-red-300' : ''}'
                on:click={async () => {
                    curr_tab = tab;
                }}
            >
                {tab.name}
            </button>
        {/each}
    </browse-tab-bar>

    {#each tabs as tab (tab.name)}
    <browse-area class='{curr_tab == tab ? '' : 'hidden'}'>
    {#if tab.name == 'Search'}
        <Explorer
            {t}
            fac={song_fac}
            searcher={song_searcher}
            bind:search_query
            bind:selected_item
            bind:item_width
            bind:item_height
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
            <div
                class='w-full h-full block relative'
                draggable={true}
                on:dragstart={(event) => dragstart(event, item)}
                on:dragend={queue_dragend}
            >
                {#if item.item_type == 'song' || item.item_type == 'video'}
                    <AudioListItem
                        title={item.title ?? ''}
                        title_sub={get_artist_name(item)}
                        img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                    />
                {:else if item.item_type == 'album' || item.item_type == 'playlist'}
                    <AudioListItem
                        title={item.title ?? ''}
                        title_sub={item.author?.name ?? ''}
                        img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                    />
                    <button class='absolute left-0 top-0 p-2 bg-red-300'
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
                        open
                    </button>
                {:else if item.item_type == 'artist'}
                    <AudioListItem
                        title={item.name ?? ''}
                        title_sub={item.subscribers ?? ''}
                        img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                    />
                    <button class='absolute left-0 top-0 p-2 bg-red-300'
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
                        open
                    </button>
                {/if}
            </div>
        </Explorer>
    {:else}
        <Explorer
            {t}
            fac={writable(null)}
            searcher={tab.searcher}
            search_query={""}
            {selected_item}
            {item_width}
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
            <div
                class='w-full h-full block relative'
                draggable={true}
                on:dragstart={(event) => dragstart(event, item)}
                on:dragend={queue_dragend}
            >
                {#if item.item_type == 'song' || item.item_type == 'video'}
                    <AudioListItem
                        title={item.title ?? ''}
                        title_sub={get_artist_name(item)}
                        img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : curr_tab.thumbnail ?? ''}
                    />
                {:else}
                    <AudioListItem
                        title={'unknown item'}
                        title_sub={''}
                        img_src={''}
                    />
                {/if}
            </div>
        </Explorer>
    {/if}
    </browse-area>
    {/each}
</div>

<style>
    search-bar {
        height: var(--name-bar-height);
        background-color: #446666;
    }

    browse-tab-bar {
        height: var(--browse-tab-bar-height);
        background-color: #228855;
    }

    browse-area {
        height: calc(100% - var(--browse-tab-bar-height) - var(--name-bar-height));
        background-color: #aa4444;
    }
</style>
