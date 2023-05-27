<script lang="ts">
</script>

<bar>
    <volume-control>
        <volume-icon>
            <!-- this is also the mute button -->
        </volume-icon>

        <volume-slider>
        </volume-slider>
    </volume-control>

    <audio-slider>
    </audio-slider>

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

    audio-slider {
        width: calc(100% - var(--queue-area-width) - var(--volume-control-width));
        background-color: #882288;
    }

    volume-control {
        width: var(--volume-control-width);
        background-color: #336633;
    }
</style>
