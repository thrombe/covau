

import { addDoc, collection, deleteDoc, doc, DocumentReference, Firestore, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';
import { type FirebaseApp } from 'firebase/app';

type PlayerSyncedData = {
    state: 'Initialised';
    queue: Array<string>;
} | {
    state: 'Finished'; // T-T: who sets finished?? all clients should finish the video around the same time
    queue: Array<string>;
    playing_index: number;
} | {
    state: 'Playing';
    queue: Array<string>;
    playing_index: number;
    started_at: number;
} | {
    state: 'Paused';
    queue: Array<string>;
    playing_index: number;
    started_at: number;
    paused_started_at: number;
};

export class Player {
    app: FirebaseApp;
    db: Firestore;

    snapshot_unsub: Unsubscribe | null;
    player_pos_interval: NodeJS.Timer;

    player: YT.Player;
    local_time_error: number;
    tick: number;

    data_ref: DocumentReference;
    synced_data: PlayerSyncedData;

    // player position in range 0..1
    player_pos: number;
    current_yt_id: string;

    private constructor(app: FirebaseApp, db: Firestore, video_element_id: string, data_ref: DocumentReference) {
        this.app = app;
        this.db = db;
        this.data_ref = data_ref;

        this.snapshot_unsub = null;

        this.local_time_error = 0;
        this.synced_data = {
            state: 'Initialised',
            queue: [],
        };
        this.tick = 0;
        this.player_pos = 0;
        this.current_yt_id = '';

        console.log("creating player!!!!");
        // this YT thing comes from the youtube iframe api script
        // - [youtube.d.ts File for the youtube-iframe-api](https://stackoverflow.com/questions/42352944/youtube-d-ts-file-for-the-youtube-iframe-api-to-use-in-angular-2-needed)
        this.player = new YT.Player(video_element_id, {
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
                    this.player = eve.target;
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

        this.player_pos_interval = setInterval(() => {
            let curr_time = this.player.getCurrentTime();
            let duration = this.player.getDuration();
            let current_pos = curr_time / duration;
            this.player_pos = current_pos;
        }, 1000)
    }

    static async new(firebase_app: FirebaseApp, group: string, video_element_id: string) {
        let db = getFirestore(firebase_app);
        let data_ref = doc(db, 'groups', group);
        let player = new Player(firebase_app, db, video_element_id, data_ref);

        player.local_time_error = await get_local_time_error(player.db);
        
        player.start_listener();

        return player;
    }

    private start_listener() {
        this.snapshot_unsub = onSnapshot(this.data_ref, async (d) => {
            let data = d.data();
            if (!data) {
                await setDoc(this.data_ref, this.synced_data);
                return;
            }
            // console.log(data);
            this.synced_data = data as PlayerSyncedData;
            this.tick += 1;
            this.sync_yt_player();
        });
    }

    private sync_yt_player() {
        switch (this.synced_data.state) {
            case 'Initialised':
                // this should only be run when a new group is created. so nothing to be done here
                break;
            case 'Finished':
                // T-T: video finishes by itself. no need to sync to finish ig
                break;
            case 'Playing':
                let new_yt_id = this.synced_data.queue[this.synced_data.playing_index];
                if (this.current_yt_id !== new_yt_id) {
                    this.current_yt_id = new_yt_id;
                    this.player.loadVideoById(this.current_yt_id);
                }
                this.player.playVideo();
                this.player.seekTo((this.server_now() - this.synced_data.started_at) / 1000, true);
                break;
            case 'Paused':
                this.player.pauseVideo();
                break;
            default:
                throw 'unhandled state!!';
        }
    }

    async destroy() {
        if (this.snapshot_unsub) {
            this.snapshot_unsub();
        }
        clearInterval(this.player_pos_interval);
        this.player.destroy();
    }

    async pause() {
        if (this.synced_data.state === 'Playing') {
            let data: PlayerSyncedData = {
                state: 'Paused',
                queue: this.synced_data.queue,
                started_at: this.synced_data.started_at,
                playing_index: this.synced_data.playing_index,
                paused_started_at: this.server_now(),
            };

            await this.update_state(data);

            // no need to set this here. it will be synced using the firebase stuff
            // this.synced_data = data;
        }
    }

    async play() {
        let data: PlayerSyncedData;
        switch (this.synced_data.state) {
            case 'Initialised':
                if (this.synced_data.queue.length > 0) {
                    data = {
                        state: 'Playing',
                        queue: this.synced_data.queue,
                        playing_index: 0,
                        started_at: this.server_now(),
                    };
                    await this.update_state(data);
                }
                break;
            case 'Finished':
                // TODO: maybe restart the vid??
                break;
            case 'Playing':
                // nothing to be done here
                break;
            case 'Paused':
                let paused_for = this.synced_data.paused_started_at - this.server_now();
                data = {
                    state: 'Playing',
                    queue: this.synced_data.queue,
                    started_at: this.synced_data.started_at + paused_for,
                    playing_index: this.synced_data.playing_index,
                };
                await this.update_state(data);
                break;
            default:
                throw 'unhandled state!!';
        }
    }

    async play_next() {
        let index: number;
        switch (this.synced_data.state) {
            case 'Initialised':
                index = -1;
                break;
            case 'Finished':
            case 'Playing':
            case 'Paused':
                index = this.synced_data.playing_index;
                break;
            default:
                throw 'unhandled state!!';
        }
        index += 1;
        if (this.synced_data.queue.length > index) {
            let data: PlayerSyncedData = {
                state: 'Playing',
                queue: this.synced_data.queue,
                playing_index: index,
                started_at: this.server_now(),
            };
            await this.update_state(data);
        }
    }

    async queue(id: string) {
        let data = this.synced_data;
        data.queue = [...data.queue, id];
        await this.update_state(data);
    }

    private async update_state(data: PlayerSyncedData) {
        // TODO: it is a inefficient to send the entire queue for every state change :/
        await setDoc(this.data_ref, data);
    }

    server_now() {
        return Date.now() - this.local_time_error;
    }
}


async function get_local_time_error(db: Firestore) {
    let sync_start = Date.now();
    let added_doc = await addDoc(collection(db, 'timesync'), {
        ts: serverTimestamp(),
    });
    let d = await getDoc(added_doc);
    let sync_end = Date.now();
    let now = (sync_start + sync_end) / 2;
    let data = d.data();
    if (!data) {
        throw "never";
    }
    // console.log(data.ts.toMillis());
    let server_now = data.ts.toMillis();
    let time_offset = now - server_now;
    // console.log(time_offset, sync_end - sync_start);
    await deleteDoc(added_doc);
    return time_offset;
}

