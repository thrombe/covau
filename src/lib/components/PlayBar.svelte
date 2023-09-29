<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Player } from '../player';
    import AudioListItem from './AudioListItem.svelte';
    import ProgressBar from './ProgressBar.svelte';

    export let player: Player;
    export let audio_info: { title: string; title_sub: string; img_src: string } | null;

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
</script>

<div class='flex flex-row h-full'>
    <audio-info class='flex flex-row'>
        <AudioListItem
            title={audio_info ? audio_info.title : ''}
            title_sub={audio_info ? audio_info.title_sub : ''}
            img_src={audio_info ? audio_info.img_src : ''}
        />
    </audio-info>

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
                prev
            </button>
            <button
                on:click={async () => {
                    await player.toggle_pause();
                    is_playing = player.is_playing();
                }}
            >
                {is_playing ? 'Pause' : 'Play'}
            </button>
            <button
                on:click={async () => {
                    await player.play_next();
                }}
            >
                next
            </button>
        </div>
    </audio-controls>

    <volume-control class='flex flex-row justify-center items-center pb-1'>
        <volume-icon class='flex flex-col justify-center'>
            <!-- this is also the mute button -->
            <button
                class='w-full p-2'
                on:click={async () => {
                    if (await player.is_muted()) {
                        await player.unmute();
                    } else {
                        await player.mute();
                    }
                }}
            >
                {is_muted ? 'unmute' : 'mute'}
            </button>
        </volume-icon>

        <volume-slider class='h-3 px-4'>
            <ProgressBar
                bind:progress={volume}
                onchange={on_volume_change}
                thumb_width={20}
                thumb_height={20}
            />
        </volume-slider>
    </volume-control>
</div>

<style lang='postcss'>
    * {
        --volume-control-width: 23%;
        --audio-info-width: 23%;
    }

    audio-info {
        width: var(--audio-info-width);
    }

    audio-controls {
        width: calc(100% - var(--audio-info-width) - var(--volume-control-width));
    }

    button {
        @apply rounded-lg px-2 my-1 text-gray-200 font-bold bg-gray-200 bg-opacity-10;
    }

    volume-control {
        width: var(--volume-control-width);
    }
    volume-icon {
        width: 60px;
        height: 100%;
    }
    volume-slider {
        width: calc(100% - 60px);
    }
</style>
