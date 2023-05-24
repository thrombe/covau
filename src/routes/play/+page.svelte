<script lang="ts">
    import { Player } from '$lib/player';
    import { initializeApp } from 'firebase/app';
    import { onDestroy } from 'svelte';
    import { writable, type Writable } from 'svelte/store';
    import { firebase_config } from '../../firebase-config';

    let url = new URL(window.location.toString());
    let group: string;
    if (!url.searchParams.get('id')) {
        group = 'random-one';
        // window.location = url.toString();
        url.searchParams.set('id', group);
        window.history.pushState({}, '', url.toString());
    } else {
        let not_null = url.searchParams.get('id');
        if (!not_null) {
            throw 'never';
        }
        group = not_null;
    }

    let app = initializeApp(firebase_config);
    let player: Writable<Player>;

    onDestroy(async () => {
        if (player) {
            await $player.destroy();
        }
    });

    let tick = writable(0);
    const on_yt_load = async () => {
        let p = await Player.new(app, group, 'video');
        player = writable(p);
        $player.on_update = () => {
            $tick += $player.synced_data.tick;
        };
    };

    (window as any).onYouTubeIframeAPIReady = on_yt_load;

    let id_input_val: string;

    let video: any;
    let queue = new Array<string>();
    $: if ($tick) {
        console.log($player.synced_data)
        queue = $player.synced_data.queue;
        console.log(queue)
    }

    let now_time = 0;
    setInterval(() => {
        now_time = Date.now();
    }, 300);
</script>

<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<input bind:value={id_input_val} />
<button
    on:click={async () => {
        await $player.queue(id_input_val);
    }}>queue</button
>
<button on:click={() => $player.play()}>play</button>
<button on:click={() => $player.play_next()}>next</button>
<button on:click={() => $player.toggle_pause()}>toggle pause</button>
<button on:click={() => $player.recalculate_time_error()}>resync</button>
<button on:click={() => on_yt_load()}>reload player</button>

<span>{now_time.toString().slice(8, 10)}</span>
{#if player}
    {#key $tick}
        <span>{$player.player_pos}</span>
        {#each queue as id, i (i)}
            <span
                on:click={async () => {
                    await $player.play_index(i);
                }}
                on:keydown={() => {}}>{id}</span
            >
        {/each}
    {/key}
{/if}

<div class="video" bind:this={video} id="video" />

<style>
    .video {
        position: fixed;
        right: 0px;
        bottom: 0px;
    }
</style>
