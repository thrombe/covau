<script lang="ts">
    import { onDestroy } from "svelte";
    import { Player } from "../player";



    export let player: Player;


    let video_pos = 0;
    let has_prev = false;
    let has_next = false;
    let is_playing = false;
    let audio_duration = 0;
    let interval = setInterval(async () => {
        if (player) {
            video_pos = await player.get_player_pos();
            has_prev = player.has_prev();
            has_next = player.has_next();
            is_playing = player.is_playing();
            let dur = player.get_duration();
            audio_duration = dur ? dur : 0;
        }
    }, 1000);

    onDestroy(async () => {
        clearInterval(interval);
    });

    const on_seek = async (e: Event) => {
        await player.seek_perc(video_pos);
    };
</script>

<bar>
    <volume-control>
        <volume-icon>
            <!-- this is also the mute button -->
        </volume-icon>

        <volume-slider>
        </volume-slider>
    </volume-control>

    <audio-controls>
        <audio-slider>
            <input
                type="range"
                min={0}
                max={1}
                step={'any'}
                bind:value={video_pos}
                on:change={on_seek}
                on:input={e => console.log(e)}
            />
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
                {is_playing? 'Pause' : 'Play'}
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

    <audio-info>
        <audio-info-contents>
            <audio-title>
            </audio-title>

            <audio-title-sub>
            </audio-title-sub>
        </audio-info-contents>

        <audio-icon>
        </audio-icon>
    </audio-info>
</bar>

<style>
    * {
        --volume-control-width: 23%;
    }

    bar {
        height: 100%;
        display: flex;
        flex-direction: row;
    }

    audio-info {
        width: var(--queue-area-width);
        background-color: #339933;

        display: flex;
        flex-direction: row;
    }

    audio-icon {
        width: var(--play-bar-height);
        background-color: #994444;
    }

    audio-info-contents {
        width: calc(100% - var(--play-bar-height));
        display: flex;
        flex-direction: column;
    }

    audio-title {
        height: 60%;
        background-color: #665544;
    }
    audio-title-sub {
        height: 40%;
        background-color: #445555;
    }

    audio-controls {
        width: calc(100% - var(--queue-area-width) - var(--volume-control-width));
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

    audio-slider input {
        width: 100%;
        height: 50%;
    }

    volume-control {
        width: var(--volume-control-width);
        background-color: #336633;
    }
</style>
