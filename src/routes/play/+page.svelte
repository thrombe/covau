<script lang="ts">
    import { initializeApp } from 'firebase/app';
    import {
        addDoc,
        arrayUnion,
        collection,
        deleteDoc,
        doc,
        getDoc,
        getFirestore,
        onSnapshot,
        serverTimestamp,
        setDoc,
        updateDoc
    } from 'firebase/firestore';
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

    let current_vid: string;
    let current_pos: number;

    let queue = new Array();
    let playing_index: number;
    let started_at: number;
    let paused: boolean;

    let update = writable(1);
    let time_offset = 0;
    (async () => {
        let sync_start = Date.now();
        let added_doc = await addDoc(collection(db, 'timesync'), {
            ts: serverTimestamp(),
        });
        let d = await getDoc(added_doc);
        let sync_end = Date.now();
        let now = (sync_start + sync_end)/2;
        let data = d.data();
        if (!data) {
            throw "yaaaaaaah. no data . .^"
        }
        console.log(data.ts.toMillis());
        let server_now = data.ts.toMillis();
        time_offset = now - server_now;
        console.log(time_offset, sync_end - sync_start);
        await deleteDoc(added_doc);
    })();

    let snapshot_unsub = onSnapshot(doc(db, 'groups', group), async (d) => {
        let data = d.data();
        if (!data) {
            await setDoc(doc(db, 'groups', group), {
                queue: [],
                playing_index: null,
                started_at: null,
                paused: true
            });
            return;
        }
        console.log(data);
        queue = data.queue;
        playing_index = data.playing_index;
        started_at = data.started_at;
        paused = data.paused;
        $update += 1;
    });
    let time_sync = setInterval(async () => {
        if (!player) {
            return;
        }
        current_pos = player.getCurrentTime() / player.getDuration();
    }, 1000);
    onDestroy(async () => {
        snapshot_unsub();
        clearInterval(time_sync);
        if (player) {
            player.destroy();
        }
    });

    let video: any;
    let player: YT.Player;
    const on_yt_load = () => {
        console.log("creating player!!!!");
        // this YT thing comes from the youtube iframe api script
        // - [youtube.d.ts File for the youtube-iframe-api](https://stackoverflow.com/questions/42352944/youtube-d-ts-file-for-the-youtube-iframe-api-to-use-in-angular-2-needed)
        new YT.Player('video', {
            width: 0,
            height: 0,
            playerVars: {
                color: 'white',
                // controls: 0,
                // autoplay: 1,
                showinfo: 0,
                disablekb: 1,
                modestbranding: 1,
                enablejsapi: 1
            },
            events: {
                onReady: (eve: any) => {
                    player = eve.target;
                },
                onStateChange: (eve) => {
                    console.log(eve);
                    if (eve.data == YT.PlayerState.PLAYING) {
                        // this might happen because of buffering cuz slow interweb | maybe cuz of ads (heven't checked)
                    } else if (eve.data == YT.PlayerState.ENDED) {
                        // play next vid
                    }
                }
            }
        });
    };

    $: if (playing_index || queue || $update || started_at) {
        if (player) {
            // player.getPlaylist();
            start_current_vid();
        }
    }

    const start_current_vid = () => {
        // player.loadPlaylist(queue.slice(playing_index));
        if (current_vid !== queue[playing_index]) {
            current_vid = queue[playing_index];
            player.loadVideoById(current_vid);
        }
        if (!started_at) {
            started_at = Date.now() - time_offset;
        }
        if (paused) {
            console.log('pausing!!!!!!');
            player.pauseVideo();
        } else {
            player.playVideo();
            player.seekTo((Date.now() - time_offset - started_at) / 1000, true);
        }
    };
    const play_next = async () => {
        if (queue.length <= playing_index) {
            return;
        }
        playing_index += 1;
        started_at = Date.now();
        await updateDoc(doc(db, 'groups', group), {
            playing_index: playing_index,
            started_at: started_at
        });
        start_current_vid();
    };

    (window as any).onYouTubeIframeAPIReady = on_yt_load;

    let id_input_val: string;
    const queue_vid = async () => {
        if (!id_input_val) {
            start_current_vid();
            return;
        }
        await updateDoc(doc(db, 'groups', group), {
            queue: arrayUnion(id_input_val)
        });
        start_current_vid();
    };

    const sync_to_this = async () => {
        await updateDoc(doc(db, 'groups', group), {
            started_at: started_at
        });
    };

    const toggle_pause_vid = async () => {
        paused = !paused;
        await updateDoc(doc(db, 'groups', group), {
            paused: paused
        });
    };

    let now_time = 0;
    setInterval(() => {
        now_time = Date.now();
    }, 300);
</script>

<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<input bind:value={id_input_val} />
<button on:click={queue_vid}>queue</button>
<button on:click={play_next}>next</button>
<button on:click={sync_to_this}>sync to this</button>
<button on:click={toggle_pause_vid}>toggle pause</button>

<span>{now_time.toString().slice(8, 10)}</span>
<span>{current_pos}</span>
{#each queue as id, i (i)}
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
