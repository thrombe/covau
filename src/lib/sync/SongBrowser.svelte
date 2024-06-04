<script lang="ts" context="module">
    import { tick } from "svelte";
    import { writable, type Writable } from "svelte/store";
    import type { RObject, RSearcher } from "$lib/searcher/searcher.ts";
    import {
        SongTube,
        type Typ,
        type BrowseQuery,
        type MusicListItem,
    } from "$lib/searcher/song_tube.ts";

    let song_fac = writable(
        SongTube.factory(undefined as unknown as Innertube)
    );
    // OOF: cannot search anything if query is '' anyway
    let song_searcher = writable(SongTube.fused());
</script>

<script lang="ts">
    import { type Unique } from "../virtual.ts";
    import AudioListItem from "$lib/components/AudioListItem.svelte";
    import Explorer from "$lib/components/Explorer.svelte";
    import InputBar from "$lib/components/InputBar.svelte";
    import type Innertube from "youtubei.js/web";
    import type { MenubarOption } from "./Vibe.svelte";

    export let columns: number;
    export let item_height: number;
    export let tube: Innertube;
    export let queue_dragend: (e: DragEvent) => void = () => {};
    export let browse_type: MenubarOption;
    export let queue_item_add: (id: string) => Promise<void>;

    $song_fac = SongTube.factory(tube);
    const refresh_searcher = async (browse_type: MenubarOption) => {
        let s;
        switch (browse_type.content_type) {
            case "music":
                s = await $song_fac.search_query({
                    query_type: "search",
                    query: search_query,
                    search: browse_type.type,
                });
                break;
            case "watch":
                break;
            case "related-music":
                s = await $song_fac.search_query({
                    query_type: "up-next",
                    id: browse_type.id ?? "",
                });
                break;
            case "queue":
                break;
            case "home-feed":
                s = await $song_fac.search_query({ query_type: "home-feed" });
                break;
            default:
                break;
        }
        if (s) {
            tabs = [tabs[0]];
            curr_tab = tabs[0]
            $song_searcher = s;
        }
    };
    $: refresh_searcher(browse_type);

    let search_query: string = "";
    let search_input_element: HTMLElement | null;

    let t: MusicListItem;
    type T = typeof t;
    let selected_item: Unique<RObject<T>, string>;
    let selected_item_index = 0;
    let search_objects: () => Promise<void>;
    let try_scroll_selected_item_in_view: () => Promise<void>;

    let dragstart = (event: DragEvent, t: T) => {
        if (t.data.id) {
            if (t.typ == "song" || t.typ == "video") {
                event.dataTransfer!.effectAllowed = "move";
                event.dataTransfer!.dropEffect = "move";
                event.dataTransfer!.setData("covau/dragndropnew", t.data.id);
                event.dataTransfer!.setData(
                    "text/plain",
                    "https://youtu.be/" + t.data.id
                );
            } else if (t.typ == "artist") {
            } else if (t.typ == "album") {
            } else if (t.typ == "playlist") {
            }
        }
    };

    type Tab = {
        name: string;
        // fac: Writable<RFactory<T>>,
        searcher: Writable<RSearcher<T>>;
        thumbnail: string | null;
    };

    let search_tab: Tab = {
        name: "Results",
        searcher: song_searcher,
        thumbnail: null,
    };
    let tabs: Tab[] = [search_tab];
    let curr_tab = search_tab;
</script>

<div class="w-full h-full flex flex-col">
    <bar-area class="flex flex-col bg-gray-900 bg-opacity-30">
        <search-bar>
            {#if browse_type.content_type === "music"}
                <InputBar
                    placeholder={"Search"}
                    bind:value={search_query}
                    bind:input_element={search_input_element}
                    on_enter={async (e) => {
                        await refresh_searcher(browse_type);

                        e.preventDefault();
                        await search_objects();

                        tabs = [tabs[0]];
                        curr_tab = tabs[0];
                    }}
                />
            {:else}
                <div class="flex h-full items-center">
                    <div class="w-full text-center text-xl">
                        {browse_type.name}
                    </div>
                </div>
            {/if}
        </search-bar>

        <browse-tab-bar
            class="flex flex-row overflow-x-auto gap-1 px-1 justify-center"
        >
            {#each tabs as tab}
                <button
                    class="border-b-2 px-1 text-gray-400 flex-none text-ellipsis whitespace-nowrap overflow-hidden
                        {curr_tab == tab
                        ? 'font-bold border-gray-200'
                        : 'border-gray-600'}
                    "
                    style="max-width: 12rem;"
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
        <browse-area class={curr_tab == tab ? "" : "hidden"}>
            {#if tab.name == search_tab.name}
                <Explorer
                    {t}
                    searcher={song_searcher}
                    bind:selected_item
                    {columns}
                    bind:item_height
                    keyboard_control={false}
                    bind:selected_item_index
                    bind:search_objects
                    bind:try_scroll_selected_item_in_view
                    on_item_click={async (t) => {
                        console.log(t);
                    }}
                    let:item
                    let:selected
                >
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <list-item class:selected>
                        <div
                            draggable={true}
                            on:dragstart={(event) => dragstart(event, item)}
                            on:dragend={queue_dragend}
                            class="item-bg"
                        >
                            {#if item.typ == "song" || item.typ == "video"}
                                <AudioListItem
                                    title={item.data.title ?? ""}
                                    title_sub={item.data.authors[0]?.name ?? ""}
                                    img_src={item.data.thumbnail ?? ""}
                                />
                                <button
                                    class="open-button"
                                    on:click={async () => {
                                        if (!item.data.id) {
                                            return;
                                        }
                                        await queue_item_add(item.data.id);
                                    }}
                                >
                                    <img
                                        draggable={false}
                                        class="h-3"
                                        alt="add"
                                        src="/static/add.svg"
                                    />
                                </button>
                            {:else if item.typ == "album" || item.typ == "playlist"}
                                <AudioListItem
                                    title={item.data.title ?? ""}
                                    title_sub={item.data.author?.name ?? ""}
                                    img_src={item.data.thumbnail ?? ""}
                                />
                                <button
                                    class="open-button"
                                    on:click={async () => {
                                        if (!item.data.id) {
                                            return;
                                        }
                                        let _new_tab;
                                        if (item.typ == "album") {
                                            _new_tab = {
                                                name: "Album: " + item.data.title,
                                                searcher:
                                                    await $song_fac.search_query(
                                                        {
                                                            query_type: "album",
                                                            id: item.data.id,
                                                        }
                                                    ),
                                                thumbnail: item.data.thumbnail,
                                            };
                                        } else {
                                            _new_tab = {
                                                name: "Playlist: " + item.data.title,
                                                searcher:
                                                    await $song_fac.search_query(
                                                        {
                                                            query_type: "playlist",
                                                            id: item.data.id,
                                                        }
                                                    ),
                                                thumbnail: null,
                                            };
                                        }
                                        if (!_new_tab.searcher) {
                                            return;
                                        }

                                        let new_tab = {
                                            ..._new_tab,
                                            searcher: writable(
                                                _new_tab.searcher
                                            ),
                                        };
                                        tabs = [tabs[0], new_tab];
                                        curr_tab = new_tab;
                                    }}
                                >
                                    <img
                                        draggable={false}
                                        class="h-3"
                                        alt="new-tab"
                                        src="/static/open-new-tab.svg"
                                    />
                                </button>
                            {:else if item.typ == "artist"}
                                <AudioListItem
                                    title={item.data.name ?? ""}
                                    title_sub={item.data.subscribers ?? ""}
                                    img_src={item.data.thumbnail ?? ""}
                                />
                                <button
                                    class="open-button"
                                    on:click={async () => {
                                        if (!item.data.id) {
                                            return;
                                        }
                                        let _new_tab = {
                                            name: "Artist: " + item.data.name,
                                            searcher:
                                                await $song_fac.search_query({
                                                    query_type: "artist",
                                                    id: item.data.id,
                                                }),
                                            thumbnail: null,
                                        };
                                        if (!_new_tab.searcher) {
                                            return;
                                        }

                                        let new_tab = {
                                            ..._new_tab,
                                            searcher: writable(
                                                _new_tab.searcher
                                            ),
                                        };
                                        tabs = [tabs[0], new_tab];
                                        curr_tab = new_tab;
                                    }}
                                >
                                    <img
                                        draggable={false}
                                        class="h-3"
                                        alt="new-tab"
                                        src="/static/open-new-tab.svg"
                                    />
                                </button>
                            {/if}
                        </div>
                    </list-item>
                </Explorer>
            {:else}
                <Explorer
                    {t}
                    searcher={tab.searcher}
                    {selected_item}
                    {columns}
                    {item_height}
                    {selected_item_index}
                    {search_objects}
                    {try_scroll_selected_item_in_view}
                    on_item_click={async (t) => {
                        console.log(t);
                    }}
                    let:item
                    let:selected
                >
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <list-item class:selected>
                        <div
                            draggable={true}
                            on:dragstart={(event) => dragstart(event, item)}
                            on:dragend={queue_dragend}
                            class="item-bg"
                        >
                            {#if item.typ == "song" || item.typ == "video"}
                                <AudioListItem
                                    title={item.data.title ?? ""}
                                    title_sub={item.data.authors[0]?.name ?? ""}
                                    img_src={item.data.thumbnail ??
                                        curr_tab.thumbnail ??
                                        ""}
                                />
                                <button
                                    class="open-button"
                                    on:click={async () => {
                                        if (!item.data.id) {
                                            return;
                                        }
                                        await queue_item_add(item.data.id);
                                    }}
                                >
                                    <img
                                        draggable={false}
                                        class="h-3"
                                        alt="add"
                                        src="/static/add.svg"
                                    />
                                </button>
                            {:else}
                                <AudioListItem
                                    title={"unknown item"}
                                    title_sub={""}
                                    img_src={""}
                                />
                            {/if}
                        </div>
                    </list-item>
                </Explorer>
            {/if}
        </browse-area>
    {/each}
</div>

<style lang="postcss">
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
        height: calc(
            100% - var(--browse-tab-bar-height) - var(--search-bar-height)
        );
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

    list-item:hover .open-button,
    .selected .open-button {
        @apply block;
    }

    list-item:hover .item-bg,
    .selected .item-bg {
        @apply bg-gray-200 bg-opacity-10 rounded-xl;
    }
</style>
