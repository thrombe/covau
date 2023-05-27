<script lang="ts">
</script>

<browse>
    <search-bar>
    </search-bar>

    <browse-tab-bar>
    </browse-tab-bar>

    <browse-area>
    </browse-area>
</browse>

<style>
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
