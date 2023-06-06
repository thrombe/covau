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

<bar>
    <audio-info>
        <AudioListItem
            title={audio_info ? audio_info.title : ''}
            title_sub={audio_info ? audio_info.title_sub : ''}
            img_src={audio_info ? audio_info.img_src : ''}
        />
    </audio-info>

    <audio-controls>
        <audio-slider>
            {fmt_video_pos}
            <ProgressBar
                bind:progress={video_pos}
                onchange={on_seek}
                thumb_size={30}
            />
            {fmt_duration}
        </audio-slider>

        <buttons>
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
        </buttons>
    </audio-controls>

    <volume-control>
        <volume-icon>
            <!-- this is also the mute button -->
            <button
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

        <volume-slider>
            <ProgressBar
                bind:progress={volume}
                onchange={on_volume_change}
                thumb_size={20}
            />
        </volume-slider>
    </volume-control>
</bar>

<style>
    * {
        --volume-control-width: 23%;
        --audio-info-width: 27%;
    }

    bar {
        height: 100%;
        display: flex;
        flex-direction: row;
    }

    audio-info {
        width: var(--audio-info-width);
        background-color: #339933;

        display: flex;
        flex-direction: row;

        --list-item-icon-width: var(--play-bar-height);
    }

    audio-controls {
        width: calc(100% - var(--audio-info-width) - var(--volume-control-width));
        background-color: #882288;

        display: flex;
        flex-direction: column;
    }

    buttons {
        display: flex;
        flex-direction: row;
        background-color: #445543;

        justify-content: center;

        height: 50%;
    }

    audio-slider {
        display: flex;
        flex-direction: row;

        align-items: center;
        height: 50%;
    }

    audio-slider input {
        width: 100%;
    }

    volume-control {
        width: var(--volume-control-width);
        background-color: #336633;

        display: flex;
        flex-direction: row;

        justify-content: center;
        align-items: center;
    }
    volume-icon {
        width: 60px;
    }
    volume-slider {
        height: 100%;
        width: calc(100% - 60px);
        background-color: #885555;
    }
</style>
