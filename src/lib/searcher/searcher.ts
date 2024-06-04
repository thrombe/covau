
import { YTNodes, SongTube, type MusicListItem } from './song_tube';
import { Db, type Song } from "./db";
import type { Unique } from '$lib/virtual';

// this should onlybe used for the type parameter in the types below
export interface WrappedDb<_> {
    wrapped: null;
}
export interface UnwrappedDb<_> {
    unwrapped: null;
}

export type Keyed = { get_key(): unknown };

export type RObject<T> =
    T extends WrappedDb<infer E>
    ? E & Keyed

    : T extends UnwrappedDb<infer E>
    ? E & Keyed

    : T & Keyed;

export type RSearcher<T> =
    T extends WrappedDb<infer E>
    ? ReturnType<typeof Db.new<T>>

    : T extends UnwrappedDb<infer E>
    ? ReturnType<typeof Db.unwrapped<E>>

    : T extends MusicListItem
    ? ReturnType<typeof SongTube.new>

    // OOF:
    : ReturnType<typeof SongTube.new>;

export type RFactory<T> = 
    T extends WrappedDb<infer E>
    ? ReturnType<typeof Db.factory>

    : T extends MusicListItem
    ? ReturnType<typeof SongTube.factory>

    // OOF:
    : ReturnType<typeof SongTube.factory>;

