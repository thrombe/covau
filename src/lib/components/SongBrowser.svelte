<script lang="ts" context="module">
    import { tick } from "svelte";
    import { writable } from "svelte/store";
    import type { RObject } from "../searcher/searcher";
    import { type MusicResponsiveListItem, SongTube } from "../searcher/tube";


    let fac = writable(SongTube.factory());
    let searcher = writable(await SongTube.new(''));
</script>

<script lang="ts">
    import { type Unique } from "../virtual";
    import AudioListItem from "./AudioListItem.svelte";
    import Explorer from "./Explorer.svelte";
    import InputBar from "./InputBar.svelte";

    export let item_width: number;
    export let item_height: number;
    export let gap: number;

    let search_query: string = '';
    let search_input_element: HTMLElement | null;


    let t: MusicResponsiveListItem;
    let selected_item: Unique<RObject<MusicResponsiveListItem>, string>;
    let selected_item_index = 0;
    let search_objects: () => Promise<void>;
    let try_scroll_selected_item_in_view: () => Promise<void>;

    const _on_keydown = async (
        event: KeyboardEvent,
    ) => {
        if (event.key == '?') {
            selected_item_index = 0;
            await tick();
            await try_scroll_selected_item_in_view();
            search_input_element?.focus();
            event.preventDefault();
        } else if (event.key == '/') {
            search_query = '';
            search_input_element?.focus();
            event.preventDefault();
            await search_objects();
        }
    };

    const get_artist_name = (t: MusicResponsiveListItem) => {
        if (!t.artists || t.artists.length <= 0) {
            return '';
        }
        return t.artists[0].name;
    }
</script>

<browse>
    <search-bar>
        <InputBar
            placeholder={'Search'}
            bind:value={search_query}
            bind:input_element={search_input_element}
            on_enter={async (e) => {
                e.preventDefault();
                await search_objects();
            }}
            on_keydown={_on_keydown}
        />
    </search-bar>

    <browse-tab-bar>
    </browse-tab-bar>

    <browse-area>
        <Explorer
            {t}
            bind:fac={$fac}
            {searcher}
            bind:search_query
            bind:selected_item
            bind:item_width
            bind:item_height
            bind:selected_item_index
            bind:search_objects
            bind:try_scroll_selected_item_in_view
            {gap}
            on_item_click={async (t) => {
                console.log(t)
            }}

            let:item
            let:selected
        >
            <item>
                <AudioListItem
                    title={item.title ? item.title : ''}
                    title_sub={get_artist_name(item)}
                    img_src={item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}
                />
            </item>
        </Explorer>
    </browse-area>
</browse>

<style>
    item {
        width: 100%;
        height: 100%;

        display: block;
        background-color: #774477;
    }
    
    browse {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

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
