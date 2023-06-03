<script lang="ts">
    import InputBar from "../lib/components/InputBar.svelte";
    import PlayBar from "../lib/components/PlayBar.svelte";
    import SongBrowser from "../lib/components/SongBrowser.svelte";
    import Video from "../lib/components/Video.svelte";
    import { Player } from "../lib/player";

    export let params: { group?: string };

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
        let url_without_hash =  window.location.toString().replace(window.location.hash, '');
        let new_url = url_without_hash + hash_prefix + params.group;
        window.location.replace(new_url);
        // window.location.reload();
    }

    let player: Player;
    let on_player_tick = async () => {};

    let group_name_input: string;
    let item_width: number = window.innerWidth / 3;
    let item_height: number = 70;

    let queue_element: HTMLElement;
</script>

<svelte:window on:resize={async (e) => {
    item_width = Number(getComputedStyle(queue_element).getPropertyValue('width').replace('px', ''));
}} />

<all style='--list-item-icon-width: {item_height}px;'>
    <all-contents>
        <search-area>
            <top-menubar>
            </top-menubar>

            <browse>
                <SongBrowser
                    bind:item_height
                    bind:item_width
                    gap={0}
                />
            </browse>
        </search-area>

        <queue-area>
            <queue bind:this={queue_element}>
                <queue-name>
                    <InputBar
                        bind:placeholder={group}
                        bind:value={group_name_input}
                        on_enter={async (e) => {
                            if (!group_name_input) {
                                return;
                            }
                            group = group_name_input;
                            let url_without_hash =  window.location.toString().replace(window.location.hash, '');
                            let new_url = url_without_hash + hash_prefix + group;
                            window.location.replace(new_url);
                            window.location.reload();
                        }}
                    />
                </queue-name>

                <queue-content>
                </queue-content>
            </queue>

            <video-box>
                <Video
                    bind:group
                    bind:player
                    bind:on_tick={on_player_tick}
                />
            </video-box>
        </queue-area>
    </all-contents>

    <play-bar>
        <PlayBar
            bind:player
        />
    </play-bar>
</all>

<style>
    * {
        --play-bar-height: 60px;
        --top-menubar-height: 36px;
        --name-bar-height: 50px;
        --browse-tab-bar-height: 25px;
        --queue-area-width: min(475px, max(330px, 33vw));
        --video-height: calc(var(--queue-area-width) * 1080 / 1920);

        font-family: monospace;
    }


    :global(html, body) {
        margin: 0px;
    }

    all {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    all-contents {
        height: calc(100% - var(--play-bar-height));
        display: flex;
        flex-direction: row;
    }

    search-area {
        width: calc(100% - var(--queue-area-width));
        background-color: #885555;

        display: flex;
        flex-direction: column;
    }

    top-menubar {
        height: var(--top-menubar-height);
        background-color: #aa5555;
    }

    browse {
        height: calc(100%  - var(--top-menubar-height));
    }

    queue-area {
        width: var(--queue-area-width);
        background-color: #558855;

        display: flex;
        flex-direction: column;
    }

    queue {
        height: calc(100% - var(--video-height));
        background-color: #994499;

        display: flex;
        flex-direction: column;
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
