
import { MusicResponsiveListItem, SongTube } from './song_tube';

type ReturnType<Type> = Type extends (...args: never[]) => infer R ? R : never;

export type { MusicResponsiveListItem };
export {};


export type RObject<T> =
    T extends MusicResponsiveListItem
    ? ReturnType<typeof SongTube.obj_type>

    // OOF:
    : ReturnType<typeof SongTube.obj_type>;


export type RSearcher<T> =
    T extends MusicResponsiveListItem
    ? ReturnType<typeof SongTube.new>

    // OOF:
    : ReturnType<typeof SongTube.new>;


export type RFactory<T> = 
    T extends MusicResponsiveListItem
    ? ReturnType<typeof SongTube.factory>

    // OOF:
    : ReturnType<typeof SongTube.factory>;


export type Keyed = { get_key(): unknown };


