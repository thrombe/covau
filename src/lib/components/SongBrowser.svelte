<script lang="ts" context="module">
    import { tick } from 'svelte';
    import { writable } from 'svelte/store';
    import type { RObject } from '../searcher/searcher.ts';
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
    $: if (type != $song_searcher.type) {
        (async () => {
            $song_fac = SongTube.factory(tube, type);
            await tick();
            if (search_objects) {
                search_objects();
            }
        })();
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
            event.dataTransfer!.effectAllowed = 'move';
            event.dataTransfer!.dropEffect = 'move';
            event.dataTransfer!.setData('covau/dragndropnew', t.id);
            event.dataTransfer!.setData('text/plain', 'https://youtu.be/' + t.id);
        }
    };
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
            }}
        />
    </search-bar>

    <browse-tab-bar />

    <browse-area>
        <Explorer
            {t}
            bind:fac={$song_fac}
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
                class='w-full h-full block'
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
                {:else if item.item_type == 'artist'}
                    <AudioListItem
                        title={item.name ?? ''}
                        title_sub={item.subscribers ?? ''}
                        img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                    />
                {/if}
            </div>
        </Explorer>
    </browse-area>
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
