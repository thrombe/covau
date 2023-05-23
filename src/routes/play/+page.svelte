<script lang="ts">
    import { initializeApp } from 'firebase/app';
    import { doc, getFirestore, onSnapshot, updateDoc } from 'firebase/firestore';
    import { onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
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
    let db = getFirestore(app);

    let queue = new Array();
    let playing_index: number;
    let update = writable(1);

    let snapshot_unsub = onSnapshot(doc(db, 'groups', group), async (doc) => {
        let data = doc.data();
        if (!data) {
            return;
        }
        console.log(data);
        queue = data.queue;
        playing_index = data.playing_index;
        $update += 1;
    });
    onDestroy(async () => {
        snapshot_unsub();
    });

    let video: any;
    let player: YT.Player;
    const on_yt_load = () => {
        // this YT thing comes from the youtube iframe api script
        // - [youtube.d.ts File for the youtube-iframe-api](https://stackoverflow.com/questions/42352944/youtube-d-ts-file-for-the-youtube-iframe-api-to-use-in-angular-2-needed)
        new YT.Player('video', {
            width: 0,
            height: 0,
            playerVars: {
                color: 'white',
                controls: 0,
                // autoplay: 1,
                showinfo: 0,
                disablekb: 1,
                modestbranding: 1,
                enablejsapi: 1
            },
            events: {
                onReady: (eve: any) => {
                    player = eve.target;
                }
            }
        });
    };

    $: if (playing_index || queue || $update) {
        console.log('updateeeeeeeeeeeeeeeeeeeeeeee');
        if (player) {
            console.log('ttttttttttttttttttttttttttttt');
            player.loadVideoById(queue[playing_index]);
            player.playVideo();
        }
    }

    (window as any).onYouTubeIframeAPIReady = on_yt_load;

    let id_input_val: string;
    const play = async () => {
        if (!id_input_val) {
            id_input_val = queue[playing_index];
        }
        await updateDoc(doc(db, 'groups', group), {
            queue: [id_input_val]
        });
        player.playVideo();
    };
</script>

<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<input bind:value={id_input_val} />
<button on:click={play}>play</button>
{#each queue as id (id)}
    <span>{id}</span>
{/each}

{#if typeof playing_index !== 'undefined'}
    <div class="video" bind:this={video} id="video" />
{/if}

<style>
    .video {
        position: fixed;
        right: 0px;
        bottom: 0px;
    }
</style>
