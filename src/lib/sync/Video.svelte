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
    import { SyncPlayer } from './player.ts';
    import { initializeApp } from 'firebase/app';
    import { getFirestore } from 'firebase/firestore';
    import { onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import { firebase_config } from '../../firebase_config';

    export let group: string;

    // OOF:
    export let player: SyncPlayer = undefined as unknown as SyncPlayer;
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
        let p = await SyncPlayer.new(db, group, 'video');
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
            if (player && player.player && player.player.getPlayerState) {
                waiting = player.player.getPlayerState() !== YT.PlayerState.PLAYING;
            }
        } else {
            clearInterval(interval);
        }
    }, 400);
    const on_click = async (e: Event) => {
        if (player) {
            await player.play();
        }
        // if button is clicked even before player is loaded - it should still work fine as all it needs
        // is some kind of user interaction with the page for it to start the video
        waiting = false;
    };
</script>

<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<div class="relative h-full w-full">
    <div class="block w-full h-full" bind:this={video} id="video" />
    <div class="block absolute left-0 top-0 w-full h-full opacity-0 z-10" />
    <div class="absolute left-0 top-0 flex flex-col h-full w-full z-10 items-center justify-center {waiting ? '' : 'hidden'}">
        <button
            class='py-3 px-6 rounded-2xl bg-[#513A61] h-20 text-lg font-bold text-center select-none'
            on:click={on_click} on:keydown={() => {}}
        >
            <img alt="play" class='h-full' src='/static/play.svg'>
        </button>
    </div>
</div>
