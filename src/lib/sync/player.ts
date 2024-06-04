
import {
    addDoc, collection, deleteDoc, doc, DocumentReference, DocumentSnapshot, Firestore,
    getDoc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe
} from 'firebase/firestore';
import * as firestore from "firebase/firestore";
import { Mutex } from 'async-mutex';

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

export class SyncPlayer {
    db: Firestore;

    snapshot_unsub: Unsubscribe | null = null;

    player_initialised: Promise<void>;
    player: YT.Player;
    local_time_error: number = 0;

    data_ref: DocumentReference;
    synced_data: PlayerSyncedData;
    mutex: Mutex = new Mutex();

    // TODO: also track buffered pos using this.player.getVideoLoadedFraction maybe??
    // player position in range 0..1
    // player_pos: number = 0;
    current_yt_id: string = '';
    on_update: () => void = () => {};

    private constructor(db: Firestore, video_element_id: string, data_ref: DocumentReference) {
        this.db = db;
        this.data_ref = data_ref;

        this.synced_data = {
            state: 'Initialised',
            queue: [],
            tick: 0,
        };
        this.last_state = this.synced_data;

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
                    console.log(eve);

                    if (eve.data == YT.PlayerState.PLAYING) {
                        // this might also happen because of buffering cuz | maybe cuz of ads
                        if (prev_player_state == YT.PlayerState.UNSTARTED) {
                            await this.sync_yt_player();
                        } else if (prev_player_state == YT.PlayerState.BUFFERING) {
                            await this.sync_yt_player();
                        }

                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.ENDED) {
                        // TODO: all clients call this method around the same time T-T
                        // it does not skip any items as 'tick' blocks it :} - tho it throws an error in the console
                        // it should never produce unwanted results as for it to be executed multiple times - it needs
                        // to be in sync with the server's 'tick' value. and these methods also use mutex locks
                        await this.play_next();
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.PAUSED) {
                        // NOTE: pause events are received when changing videos. which becomes a pain
                        //  so either don't let the user pause vid directly or let this pause be just for this
                        //  specific client
                        await this.sync_yt_player();
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.UNSTARTED) {
                        prev_player_state = eve.data;
                    } else if (eve.data == YT.PlayerState.BUFFERING) {
                        prev_player_state = eve.data;
                    }
                }
            }
        });
    }

    // TODO: more consistent format for duration | position
    async get_player_pos() {
        await this.seek_promise;
        await this.player_initialised;

        let curr_time = this.player.getCurrentTime();
        let duration = this.player.getDuration();
        let current_pos = curr_time / duration;

        if (typeof curr_time === 'undefined' || typeof duration === 'undefined' || duration == 0) {
            return 0;
        }
        // this.player_pos = current_pos;
        return current_pos;
    }

    get_duration() {
        let dur = this.player.getDuration();
        if (typeof dur === 'undefined' || dur === 0) {
            return null;
        } else {
            return dur;
        }
    }

    static async new(db: Firestore, group: string, video_element_id: string) {
        let data_ref = doc(db, 'groups', group);
        let player = new SyncPlayer(db, video_element_id, data_ref);

        player.dispatch_time_error_routine();

        await player.player_initialised;
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
                // lock should already be held in local writes
                this.synced_data = data as PlayerSyncedData;
            } else {
                await this.mutex.runExclusive(() => {
                    // T-T: how do i communicate back the error?
                    if ((data as PlayerSyncedData).tick > this.synced_data.tick) {
                        this.synced_data = data as PlayerSyncedData;

                        this.set_last_state(this.synced_data);
                    }
                });
            }

            await this.sync_yt_player();
            this.on_update();
        };
        this.snapshot_unsub = onSnapshot(
            this.data_ref,
            { includeMetadataChanges: false },
            on_next,
        );
    }

    private async sync_yt_player() {
        await this.player_initialised;

        switch (this.synced_data.state) {
            case 'Initialised':
                this.player.stopVideo();
                this.current_yt_id = '';
                break;
            case 'Finished':
                // T-T: video finishes by itself. no need to sync to finish ig
                break;
            case 'Playing':
                let new_yt_id = this.synced_data.queue[this.synced_data.playing_index];
                if (this.current_yt_id != new_yt_id) {
                    this.current_yt_id = new_yt_id;
                    this.player.loadVideoById(this.current_yt_id);
                }
                if (this.player.getPlayerState() != YT.PlayerState.PLAYING) {
                    this.player.playVideo();
                }

                this.maybe_seek_player(this.synced_data.started_at);
                break;
            case 'Paused':
                if (!this.current_yt_id) {
                    this.current_yt_id = this.synced_data.queue[this.synced_data.playing_index];
                }
                if (!this.player.getVideoUrl().includes(this.current_yt_id)) {
                    this.player.loadVideoById(this.current_yt_id);
                }
                this.player.pauseVideo();

                this.maybe_seek_player(this.synced_data.started_at);
                break;
            default:
                throw 'unhandled state!!';
        }
    }

    private maybe_seek_player(started_at: number) {
        let pos = this.player.getCurrentTime();
        let seek_time = (this.server_now() - started_at) / 1000;

        if (this.seek_started_at === started_at) {
            this.seek_wait();
            this.seek_started_at = null;
        }

        // only try to seek if it is desynced
        if (Math.abs(seek_time - pos) > 0.5) {
            this.player.seekTo(seek_time, true);
        }
    }

    async destroy() {
        if (this.snapshot_unsub) {
            this.snapshot_unsub();
        }
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

    async play_prev() {
        await this.mutex.runExclusive(async () => {
            let index: number;
            switch (this.synced_data.state) {
                case 'Initialised':
                    index = 1;
                    break;
                case 'Finished':
                case 'Playing':
                case 'Paused':
                    index = this.synced_data.playing_index;
                    break;
                default:
                    throw 'unhandled state!!';
            }
            index -= 1;
            if (this.synced_data.queue.length > index && index >= 0) {
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
            let data: PlayerSyncedData = {...this.synced_data};
            data.queue = [...data.queue, id];
            data.tick += 1;
            await this.update_state(data);
        });
    }

    async queue_item_move(from: number, to: number) {
        if (from == to) {
            return;
        }
        await this.mutex.runExclusive(async () => {
            let data: PlayerSyncedData = {...this.synced_data};
            data.queue = [...data.queue];

            if (data.state !== 'Initialised') {
                if (from == data.playing_index) {
                    data.playing_index = Math.min(to, data.queue.length - 1);
                } else if (
                    data.playing_index >= Math.min(from, to) &&
                    data.playing_index <= Math.max(from, to)
                ) {
                    data.playing_index += 1 * Math.sign(from - to);
                }
            }
            if (from < to) {
                data.queue.splice(to + 1, 0, data.queue[from]);
                data.queue.splice(from, 1);
            } else {
                data.queue.splice(to, 0, data.queue[from]);
                data.queue.splice(from + 1, 1);
            }

            data.tick += 1;
            await this.update_state(data);
        });
    }

    async queue_item_insert(index: number, id: string) {
        await this.mutex.runExclusive(async () => {
            let data: PlayerSyncedData = {...this.synced_data};
            data.queue = [...data.queue];

            if (data.state !== 'Initialised') {
                if (data.playing_index >= index) {
                    data.playing_index += 1;
                }
            }
            data.queue.splice(index, 0, id);

            data.tick += 1;
            await this.update_state(data);
        });
    }

    async queue_item_delete(index: number) {
        if (index < 0) {
            return;
        }
        
        await this.mutex.runExclusive(async () => {
            let data: PlayerSyncedData = {...this.synced_data};
            data.queue = [...data.queue];

            if (data.state !== 'Initialised') {
                if (data.playing_index > index) {
                    data.playing_index -= 1;
                } else if (data.playing_index == index) {
                    if (data.state !== 'Finished') {
                        data.started_at = this.server_now();
                    }

                    if (data.queue.length <= 1) {
                        // queue will have no items after removing
                        data = {
                            state: 'Initialised',
                            tick: data.tick + 1,
                            queue: [],
                        };
                        await this.update_state(data);
                        return;
                    } else if (index == data.queue.length - 1) {
                        // queue.length > 1
                        data.playing_index -= 1;
                    } else {
                        // if currently playing item is removed, then play the next one (assuming
                        // there is a next item)
                    }
                } else {
                    // do nothing if removed item comes after the currently playing one
                }
            }
            data.queue.splice(index, 1);

            data.tick += 1;
            await this.update_state(data);
        });
    }

    seek_promise: Promise<void> = Promise.resolve();
    seek_wait: (v: void) => void = () => {};
    seek_started_at: number | null = null;
    async seek_perc(perc: number) {
        if (this.synced_data.state == 'Initialised') {
            await this.play();
        }
        await this.mutex.runExclusive(async () => {
            let data: PlayerSyncedData;
            if (this.synced_data.state == 'Initialised') {
                // this should not happen if queue is not empty
                return;
            } else if (this.synced_data.state == 'Finished') {
                data = {
                    state: 'Playing',
                    tick: this.synced_data.tick,
                    started_at: this.server_now(),
                    queue: this.synced_data.queue,
                    playing_index: this.synced_data.playing_index,
                };
            } else {
                data = {...this.synced_data};
                data.started_at = this.server_now();
            }
            data.tick += 1;
            data.started_at -= Math.floor(this.player.getDuration()*perc * 1000);
            if (!data.started_at) {
                return;
            }

            this.seek_started_at = data.started_at;
            this.seek_wait();
            this.seek_promise = new Promise(r => {
                this.seek_wait = r;
            });

            await this.update_state(data);
        });
        await this.seek_promise;
    }

    async toggle_pause() {
        if (this.synced_data.state === 'Playing') {
            if (this.player.getPlayerState() == YT.PlayerState.UNSTARTED) {
                await this.sync_yt_player();
            } else {
                await this.pause();
            }
        } else if (this.synced_data.state === 'Paused') {
            await this.play();
        } else {
            await this.play();
        }
    }

    is_playing() {
        return this.synced_data.state === 'Playing' && this.player.getPlayerState() !== YT.PlayerState.UNSTARTED;
    }
    
    has_next() {
        // MAYBE: maybe i should copy synced_data as it might be changed somewhere else
        let d = this.synced_data;
        switch (d.state) {
            case 'Initialised':
                if (d.queue.length > 0) {
                    return true;
                } else {
                    return false;
                }
                // break;
            case 'Playing':
            case 'Paused':
            case 'Finished':
                if (d.queue.length > d.playing_index) {
                    return true;
                } else {
                    return false;
                }
                // break;
            default:
                throw 'case not handled';
        }
    }

    has_prev() {
        // MAYBE: maybe i should copy synced_data as it might be changed somewhere else
        let d = this.synced_data;
        switch (d.state) {
            case 'Initialised':
                return false;
                // break;
            case 'Playing':
            case 'Paused':
            case 'Finished':
                if (d.playing_index > 0) {
                    return true;
                } else {
                    return false;
                }
                // break;
            default:
                throw 'case not handled';
        }
    }

    async get_volume() {
        await this.player_initialised;
        let vol = this.player.getVolume() / 100;
        return vol;
    }

    async set_volume(t: number) {
        await this.player_initialised;
        if (t > 1) {
            t = 1;
        } else if (t < 0) {
            t = 0;
        }
        this.player.setVolume(100*t);
    }

    async toggle_mute() {
        if (await this.is_muted()) {
            await this.unmute();
        } else {
            await this.mute();
        }
    }

    async is_muted() {
        await this.player_initialised;
        return this.player.isMuted();
    }

    async mute() {
        await this.player_initialised;
        this.player.mute();
    }

    async unmute() {
        await this.player_initialised;
        this.player.unMute();
    }

    last_state: PlayerSyncedData;
    private async update_state(data: PlayerSyncedData, on_err: ((e: any) => Promise<void>) | null = null) {
        // TODO: it is a inefficient to send the entire queue for every state change :/
        // - [TypeScript: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
        // maybe use Omit and stuff
        this.set_last_state(this.synced_data);

        if (!on_err) {
            on_err = async (e) => {
                // MAYBE: is it better to revert every update or
                console.error(e);

                await this.restore_last_state();
            };
        }

        await setDoc(this.data_ref, data)
        .catch(on_err);
    }

    private set_last_state(data: PlayerSyncedData) {
        this.last_state = {...data};
        this.last_state.queue = [...data.queue];
    }
    private async restore_last_state() {
        this.synced_data = {...this.last_state};
        this.synced_data.queue = [...this.last_state.queue];

        await this.sync_yt_player();
    }

    async recalculate_time_error() {
        this.local_time_error = await get_local_time_error(this.db);
        await this.sync_yt_player();
    }

    dispatch_time_error_routine() {
        let threshold = 400;
        let min_yet: number | null = null;
        let timeout: ReturnType<typeof setTimeout>;
        const one_iteration = async () => {
            let sync_start = Date.now();
            let added_doc = await addDoc(
                collection(this.db, 'timesync'), {
                ts: serverTimestamp(),
            });
            let d = await getDoc(added_doc);
            let sync_end = Date.now();
            await deleteDoc(added_doc);

            let data = d.data() as firestore.DocumentData;
            let server_now = data.ts.toMillis();

            let now = (sync_start + sync_end) / 2;
            let error = now - server_now;
            let del = sync_end - sync_start;

            if (min_yet === null || min_yet > del) {
                this.local_time_error = error;
                await this.sync_yt_player();
                min_yet = del;
            }

            console.log('local time error: ', del);
            if (del > threshold) {
                clearTimeout(timeout);
                timeout = setTimeout(one_iteration, 60 * 1000);
            }
        };

        one_iteration();
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
    await deleteDoc(added_doc);

    let now = (sync_start + sync_end) / 2;
    let data = d.data() as firestore.DocumentData;
    let server_now = data.ts.toMillis();

    let time_offset = now - server_now;
    return time_offset;
}


