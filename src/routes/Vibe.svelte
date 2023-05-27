<script lang="ts">
    import PlayBar from "../lib/components/PlayBar.svelte";
    import SongBrowser from "../lib/components/SongBrowser.svelte";

</script>

<all>
    <all-contents>
        <search-area>
            <top-menubar>
            </top-menubar>

            <browse>
                <SongBrowser />
            </browse>
        </search-area>

        <queue-area>
            <queue>
                <queue-name>
                </queue-name>

                <queue-content>
                </queue-content>
            </queue>

            <video-box>
            </video-box>
        </queue-area>
    </all-contents>

    <play-bar>
        <PlayBar />
    </play-bar>
</all>

<style>
    * {
        --play-bar-height: 60px;
        --top-menubar-height: 36px;
        --name-bar-height: 50px;
        --browse-tab-bar-height: 25px;
        --queue-area-width: min(475px, 33vw);
        --video-height: calc(var(--queue-area-width) * 1080 / 1920);
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

    play-bar {
        height: var(--play-bar-height);
        background-color: #555588;
    }
</style>
