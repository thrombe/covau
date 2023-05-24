

import { addDoc, collection, deleteDoc, doc, DocumentReference, DocumentSnapshot, Firestore, FirestoreError, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';
import { type FirebaseApp } from 'firebase/app';
import { Mutex, type MutexInterface } from 'async-mutex';

type PlayerSyncedData = {
    state: 'Initialised';
    tick: number;
    queue: Array<string>;
} | {
    state: 'Finished'; // T-T: who sets finished?? all clients should finish the video around the same time
    tick: number;
    queue: Array<string>;
    playing_index: number;
} | {
    state: 'Playing';
    tick: number;
    queue: Array<string>;
    playing_index: number;
    started_at: number;
} | {
    state: 'Paused';
    tick: number;
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

    player_initialised: Promise<void>;
    player: YT.Player;
    local_time_error: number;

    data_ref: DocumentReference;
    synced_data: PlayerSyncedData;
    mutex: Mutex;

    // player position in range 0..1
    player_pos: number;
    current_yt_id: string;
    on_update: () => void;

    private constructor(app: FirebaseApp, db: Firestore, video_element_id: string, data_ref: DocumentReference) {
        this.app = app;
        this.db = db;
        this.data_ref = data_ref;

        this.snapshot_unsub = null;

        this.local_time_error = 0;
        this.synced_data = {
            state: 'Initialised',
            queue: [],
            tick: 0,
        };
        this.mutex = new Mutex();
        this.player_pos = 0;
        this.current_yt_id = '';
        this.on_update = () => {};

        console.log("creating player!!!!");
        let initialised: (v: void) => void;
        this.player_initialised = new Promise(r => { initialised = r; });
        // this YT thing comes from the youtube iframe api script
        // - [youtube.d.ts File for the youtube-iframe-api](https://stackoverflow.com/questions/42352944/youtube-d-ts-file-for-the-youtube-iframe-api-to-use-in-angular-2-needed)
        let prev_player_state = YT.PlayerState.UNSTARTED;
        this.player = new YT.Player(video_element_id, {
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
                    this.player = eve.target;
                    initialised();
                },
                onStateChange: async (eve) => {
                    // console.log(eve);

                    if (eve.data == YT.PlayerState.PLAYING) {
                        // this might also happen because of buffering cuz | maybe cuz of ads
                        if (this.synced_data.state === 'Paused') {
                            await this.play();
                        } else if (prev_player_state == YT.PlayerState.UNSTARTED) {
                            await this.sync_yt_player();
                        }
                        // await this.sync_yt_player();
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.ENDED) {
                        await this.play_next();
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.PAUSED) {
                        await this.pause();
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.UNSTARTED) {
                        if (prev_player_state != YT.PlayerState.UNSTARTED) {
                            await this.play();
                        }
                        prev_player_state = eve.data;
                    }
                }
            }
        });

        this.player_pos_interval = setInterval(() => {
            if (!this.player.getCurrentTime || !this.player.getDuration) {
                return;
            }
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

        await player.recalculate_time_error();

        player.start_listener();

        return player;
    }

    private start_listener() {
        const on_next = async (d: DocumentSnapshot) => {
            let data = d.data();
            if (!data) {
                await setDoc(this.data_ref, this.synced_data);
                return;
            }
            console.log(data);

            if (d.metadata.hasPendingWrites) {
                // TODO: this is simpler but lazier way to handle errors in updating stuff in firebase
                //   a nicer alternative can be to cache this.synced_data in each function before trying sync
                //   and catch errors on this.update_state. and restore stuff | retry updating depending on
                //   what operation it is. (queueing new items should retry)
                //   also need to handle cases like multiple people clicking the same thing (next_song)
                return;
                // lock should already be held in local writes
                this.synced_data = data as PlayerSyncedData;
            } else {
                await this.mutex.runExclusive(() => {
                    // T-T: how do i communicate back the error?
                    if ((data as PlayerSyncedData).tick > this.synced_data.tick) {
                        this.synced_data = data as PlayerSyncedData;
                    }
                });
            }

            await this.sync_yt_player();
            this.on_update();
        };
        this.snapshot_unsub = onSnapshot(this.data_ref, { includeMetadataChanges: true }, on_next);
    }

    private async sync_yt_player() {
        await this.player_initialised;

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
                if (this.player.getPlayerState() != YT.PlayerState.PLAYING) {
                    this.player.playVideo();
                }
                let seek_time = (this.server_now() - this.synced_data.started_at) / 1000;
                this.player.seekTo(seek_time, true);
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
        await this.mutex.runExclusive(async () => {
            if (this.synced_data.state === 'Playing') {
                let data: PlayerSyncedData = {
                    state: 'Paused',
                    queue: this.synced_data.queue,
                    started_at: this.synced_data.started_at,
                    playing_index: this.synced_data.playing_index,
                    paused_started_at: this.server_now(),
                    tick: this.synced_data.tick + 1,
                };

                await this.update_state(data);
            }
        });
    }

    async play() {
        await this.mutex.runExclusive(async () => {
            let data: PlayerSyncedData;
            switch (this.synced_data.state) {
                case 'Initialised':
                    if (this.synced_data.queue.length > 0) {
                        data = {
                            state: 'Playing',
                            queue: this.synced_data.queue,
                            playing_index: 0,
                            started_at: this.server_now(),
                            tick: this.synced_data.tick + 1,
                        };
                        await this.update_state(data);
                    }
                    break;
                case 'Finished':
                    // TODO: maybe restart the vid??
                    await this.sync_yt_player();
                    break;
                case 'Playing':
                    // nothing to be done here
                    await this.sync_yt_player();
                    break;
                case 'Paused':
                    let paused_for = this.server_now() - this.synced_data.paused_started_at;
                    data = {
                        state: 'Playing',
                        queue: this.synced_data.queue,
                        started_at: this.synced_data.started_at + paused_for,
                        playing_index: this.synced_data.playing_index,
                        tick: this.synced_data.tick + 1,
                    };
                    await this.update_state(data);
                    break;
                default:
                    throw 'unhandled state!!';
            }
        });
    }

    async play_next() {
        console.log(this);
        await this.mutex.runExclusive(async () => {
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
                    tick: this.synced_data.tick + 1,
                };
                await this.update_state(data);
            }
        });
    }

    async play_index(index: number) {
        await this.mutex.runExclusive(async () => {
            if (this.synced_data.queue.length > index) {
                let data: PlayerSyncedData = {
                    state: 'Playing',
                    queue: this.synced_data.queue,
                    playing_index: index,
                    started_at: this.server_now(),
                    tick: this.synced_data.tick + 1,
                };
                await this.update_state(data);
            }
        });
    }

    async queue(id: string) {
        await this.mutex.runExclusive(async () => {
            let data = this.synced_data;
            data.queue = [...data.queue, id];
            await this.update_state(data);
        });
    }

    async toggle_pause() {
        if (this.synced_data.state === 'Playing') {
            await this.pause();
        } else if (this.synced_data.state === 'Paused') {
            await this.play();
        }
    }

    private async update_state(data: PlayerSyncedData) {
        // TODO: it is a inefficient to send the entire queue for every state change :/
        await setDoc(this.data_ref, data);
    }

    // TODO: call this method every few seconds untill either or
    //   - the set and fetch time delay gets lower than some threshold
    //   - the time delays are very constant
    async recalculate_time_error() {
        this.local_time_error = await get_local_time_error(this.db);
        await this.sync_yt_player();
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


