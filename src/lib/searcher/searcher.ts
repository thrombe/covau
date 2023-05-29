
import { MusicResponsiveListItem, SongTube } from './tube';

type ReturnType<Type> = Type extends (...args: never[]) => infer R ? R : never;

export type { MusicResponsiveListItem };
export {};


// this should onlybe used for the type parameter in the types below
export interface ForceDb<_> {
    force: null;
}

export type RObject<T> =
    T extends MusicResponsiveListItem
    ? ReturnType<typeof SongTube.obj_type>

    : never;


export type RSearcher<T> =
    T extends MusicResponsiveListItem
    ? Awaited<ReturnType<typeof SongTube.new>>

    : never;


export type RFactory<T> = 
    T extends MusicResponsiveListItem
    ? ReturnType<typeof SongTube.factory>

    : never;


export type Keyed  = { get_key(): unknown };


