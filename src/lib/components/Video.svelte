<script lang="ts" context="module">
    let init_iframe: (b: boolean) => void;
    let has_iframe: Promise<boolean> = new Promise((r) => {
        init_iframe = r;
    });
    [...document.getElementsByTagName('script')].forEach((e) => {
        if (e.src.includes('https://www.youtube.com/iframe_api')) {
            init_iframe(true);
        }
    });
</script>

<script lang="ts">
    import { Player } from '../player';
    import { initializeApp } from 'firebase/app';
    import { getFirestore } from 'firebase/firestore';
    import { onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import { firebase_config } from '../../firebase_config';

    export let group: string;

    // OOF:
    export let player: Player = undefined as unknown as Player;
    export let video: HTMLElement = undefined as unknown as HTMLElement;

    export let on_tick = async () => {};

    let app = initializeApp(firebase_config);
    let db = getFirestore(app);

    $: if (group) {
        // await :/
        load_player();
    }

    onDestroy(async () => {
        if (player) {
            await player.destroy();
        }
    });

    let tick = writable(0);
    const load_player = async () => {
        if (!(await has_iframe)) {
            return;
        }
        if (player) {
            await player.destroy();
        }
        let p = await Player.new(db, group, 'video');
        player = p;
        player.on_update = () => {
            $tick += player.synced_data.tick;
        };
    };

    (window as any).onYouTubeIframeAPIReady = async () => {
        has_iframe = Promise.resolve(true);
        await load_player();
    };

    $: if ($tick) {
        // await :/
        on_tick();
    }

    let waiting = true;
    let interval = setInterval(() => {
        if (waiting) {
            if (player && player.player) {
                waiting = player.player.getPlayerState() !== YT.PlayerState.PLAYING;
            }
        } else {
            clearInterval(interval);
        }
    }, 400);
    const on_click = async (e: Event) => {
        await player.toggle_pause();
        waiting = false;
    };
</script>

<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<div class="video-parent">
    <div class="video" bind:this={video} id="video" />
    <div class="video-sibling" />
    <div class:ctp={waiting} class:hide={!waiting} on:click={on_click} on:keydown={() => {}}>
        click to play!
    </div>
</div>

<style>
    .video {
        display: block;
        width: 100%;
        height: 100%;
        background-color: #334433;
    }

    .hide {
        display: none;
    }
    .ctp {
        --perc: 42%;

        display: block;
        position: absolute;
        left: calc(50% - var(--perc) / 2);
        top: calc(50% - var(--perc) / 2);
        width: var(--perc);
        height: var(--perc);
        background-color: #aa5555;
        z-index: 3;

        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;

        border-radius: 15px;
        font-size: calc(var(--queue-area-width) * 0.06);
        user-select: none;
    }
    .video-sibling {
        display: block;
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        background-color: #00ff0000;
        z-index: 2;
    }

    .video-parent {
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
