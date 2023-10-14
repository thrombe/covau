<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Player } from '$lib/player.ts';
    import AudioListItem from '$lib/components/AudioListItem.svelte';
    import ProgressBar from '$lib/components/ProgressBar.svelte';

    export let player: Player;
    export let audio_info: { title: string; title_sub: string; img_src: string } | null;
    export let mobile = false;
    export let keyboard_control = true;

    let video_pos = 0;
    let has_prev = false;
    let has_next = false;
    let is_playing = false;
    let audio_duration = 0;
    let is_muted = false;
    let volume = 1;
    let interval = setInterval(async () => {
        if (player) {
            video_pos = await player.get_player_pos();
            has_prev = player.has_prev();
            has_next = player.has_next();
            is_playing = player.is_playing();
            let dur = player.get_duration();
            audio_duration = dur ? dur : 0;
            is_muted = await player.is_muted();
            volume = await player.get_volume();
        }
    }, 300);

    onDestroy(async () => {
        clearInterval(interval);
    });

    const on_seek = async (p: number) => {
        await player.seek_perc(p);
    };

    const on_volume_change = async (v: number) => {
        await player.set_volume(v);
        volume = await player.get_volume();
    };

    const fmt_time = (t: number) => {
        let hours = ('000' + Math.floor(t / 3600)).slice(-2);
        let mins = ('000' + Math.floor(t / 60)).slice(-2);
        let secs = ('000' + Math.floor(t)).slice(-2);
        return `${Math.floor(t / 3600) ? hours + ':' : ''}${mins}:${secs}`;
    };

    $: fmt_duration = fmt_time(audio_duration);
    $: fmt_video_pos = fmt_time(video_pos * audio_duration);

    let dragging_volume = false;

    let volume_icon: 'max' | 'mid' | 'min' = 'max';

    $: if (volume) {
        if (volume < 1/3) {
            volume_icon = 'min';
        } else if (volume < 2/3) {
            volume_icon = 'mid';
        } else {
            volume_icon = 'max';
        }
        if (is_muted) {
            volume_icon = 'min';
        }
    }

    const _on_keydown = async (event: KeyboardEvent) => {
        if (!keyboard_control || document.activeElement?.tagName == 'INPUT') {
            return;
        }

        if (event.key == ' ') {
            if (player.is_playing()) {
                await player.toggle_pause();
            } else {
                await player.play();
            }
        } else if (event.key == 'ArrowLeft' || event.key == 'h') {
            let pos = Math.max(0, video_pos - 10/audio_duration);
            await player.seek_perc(pos);
        } else if (event.key == 'ArrowRight' || event.key == 'l') {
            let pos = Math.min(1, video_pos + 10/audio_duration);
            await player.seek_perc(pos);
        } else if (event.key == 'ArrowDown' || event.key == 'j') {
            await player.play_next();
        } else if (event.key == 'ArrowUp' || event.key == 'k') {
            await player.play_prev();
        } else if (event.key == 'm') {
            await player.toggle_mute();
        }
    };
</script>

<div class='flex flex-row h-full'
    style='
        --volume-control-width: 3.5rem;
        --audio-info-width: {mobile ? '0px' : '15rem'};
    '
>
    <audio-info class='flex flex-row {mobile ? 'hidden' : ''}'>
        <AudioListItem
            title={audio_info ? audio_info.title : ''}
            title_sub={audio_info ? audio_info.title_sub : ''}
            img_src={audio_info ? audio_info.img_src : ''}
        />
    </audio-info>

    <a
        href='https://github.com/thrombe/covau'
        target='_blank'
        class='h-full flex justify-center items-center aspect-square bg-gray-200 bg-opacity-10 rounded-md p-1 scale-[90%]'
    >
        <img src='/static/github.svg' class='h-9 aspect-square' >
    </a>
    <audio-controls>
        <div class='flex flex-row items-center h-1/3 w-full py-1'>
            <div class='p-2 text-gray-400'>
                {fmt_video_pos}
            </div>
            <ProgressBar
                bind:progress={video_pos}
                onchange={on_seek}
                thumb_width={15}
                thumb_height={15}
            />
            <div class='p-2 text-gray-400'>
                {fmt_duration}
            </div>
        </div>

        <div class='flex flex-row gap-2 justify-center h-2/3'>
            <button
                on:click={async () => {
                    await player.play_prev();
                }}
            >
                <img class='h-3' src='/static/prev.svg'>
            </button>
            <button
                on:click={async () => {
                    await player.toggle_pause();
                    is_playing = player.is_playing();
                }}
            >
                <img class='h-3' src='/static/{is_playing ? 'pause' : 'play'}.svg'>
            </button>
            <button
                on:click={async () => {
                    await player.play_next();
                }}
            >
                <img class='h-3' src='/static/next.svg'>
            </button>
        </div>
    </audio-controls>

    <volume-control class='relative flex flex-row justify-center items-center pb-1'>
        <button class='volume-button p-2'>
            <img class='h-6 {is_muted ? 'brightness-50 opacity-50' : ''}' src='/static/volume-{volume_icon}.svg'>
            <div 
                class='volume-box absolute flex flex-row gap-4 right-0 bottom-10 h-16 px-6 py-4 mr-2 bg-gray-200 bg-opacity-10 rounded-xl backdrop-blur-md {dragging_volume ? 'z-10' : '-z-40 opacity-0'}'
            >
                <div class='relative h-full w-40 py-3 {is_muted ? 'brightness-50' : ''}'>
                    {#if is_muted}
                        <div class='absolute block z-20 w-full h-full left-0 top-0'></div>
                    {/if}
                    <ProgressBar
                        bind:progress={volume}
                        onchange={on_volume_change}
                        thumb_width={20}
                        thumb_height={20}
                        bind:dragging={dragging_volume}
                    />
                </div>
                <button
                    class='p-2'
                    on:click={async () => {
                        await player.toggle_mute();
                    }}
                >
                    <img class='h-full w-6 aspect-square {is_muted ? 'brightness-50 opacity-50' : ''}' src='/static/volume-{volume_icon}.svg'>
                </button>
            </div>
        </button>
    </volume-control>
</div>

<svelte:window on:keydown={_on_keydown} />

<style lang='postcss'>
    audio-info {
        width: var(--audio-info-width);
    }

    audio-controls {
        width: calc(100% - var(--audio-info-width) - var(--volume-control-width));
    }

    button {
        @apply rounded-lg text-gray-200 font-bold bg-gray-200 bg-opacity-10;
    }

    audio-controls button {
        @apply px-2 my-1;
    }

    .volume-button:hover .volume-box, .volume-box:hover {
        @apply z-10 opacity-100; 
        transition: 0.0s;
    }
    .volume-button .volume-box, .volume-box {
        transition-delay: 0.7s;
    }

    volume-control {
        width: var(--volume-control-width);
    }
</style>
