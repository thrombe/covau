import type Search from "youtubei.js/dist/src/parser/ytmusic/Search";
import Innertube, { MusicShelfContinuation, UniversalCache, YTNodes } from "youtubei.js/web";
import { SavedSearch, SlowSearch, UniqueSearch, Unpaged } from "./mixins";
import type { Keyed, RObject, RSearcher } from "./searcher";
import type { SearchContinuation } from "youtubei.js/dist/src/parser/ytmusic/Search";
import type { Playlist } from "youtubei.js/dist/src/parser/ytmusic";

// https://github.com/LuanRT/YouTube.js/issues/321
export type MusicResponsiveListItem = YTNodes.MusicResponsiveListItem;
export type Typ =  'song' | 'video' | 'album' | 'playlist' | 'artist';
type SearchTyp =
    { type: 'search', search: Typ } |
    { type: 'artist', id: string } |
    { type: 'album', id: string } |
    { type: 'playlist', id: string };

export class SongTube extends Unpaged<MusicResponsiveListItem> {
    tube: Innertube;
    type: SearchTyp;

    constructor(q: string, tube: Innertube, type: SearchTyp) {
        super(q);
        this.tube = tube;
        this.type = type;
    }

    static new(q: string, tube: Innertube, type: SearchTyp) {
        const US = UniqueSearch<MusicResponsiveListItem, typeof SongTube>(SongTube);
        const SS = SavedSearch<MusicResponsiveListItem, typeof US>(US);
        return new SS(q, tube, type);
    }

    static factory(tube: Innertube, type: Typ) {
        type R = RSearcher<MusicResponsiveListItem>;
        class Fac {
            tube: Innertube;
            constructor(tube: Innertube) {
                this.tube = tube;
            }
            async with_query(q: string) {
                let t = SongTube.new(q, this.tube, { type: 'search', search: type });
                return t as R | null;
            }
            async browse_artist_songs(artist_id: string) {
                let t = SongTube.new('', this.tube, { type: 'artist', id: artist_id });
                return t;
            }
            async browse_album(album_id: string) {
                let t = SongTube.new('', this.tube, { type: 'album', id: album_id });
                return t;
            }
            async browse_playlist(playlist_id: string) {
                let t = SongTube.new('', this.tube, { type: 'playlist', id: playlist_id });
                return t;
            }
        }
        const SS = SlowSearch<R, typeof Fac>(Fac);
        return new SS(tube);
    }

    static obj_type() {
        return null as unknown as MusicResponsiveListItem & Keyed;
    }


    results: Search | null = null;
    cont: SearchContinuation | null = null;
    pages: Array<MusicShelfContinuation> = new Array();
    async next_page() {
        if (!this.has_next_page) {
            return [];
        }
        console.log(this.type);
        if (this.type.type == 'search') {
            return await this.next_page_search(this.type.search);
        } else if (this.type.type == 'artist') {
            let r = await this.next_page_artist_songs(this.type.id);
            console.log(r);
            return r;
        } else if (this.type.type == 'album') {
            let r = await this.next_page_album(this.type.id);
            return r;
        } else if (this.type.type == 'playlist') {
            let r = await this.next_page_playlist(this.type.id);
            return r;
        }

        throw 'unreachable';
    }
    playlist: Playlist | null = null;
    protected async next_page_playlist(playlist_id: string) {
        if (!this.playlist) {
            this.playlist = await this.tube.music.getPlaylist(playlist_id);
        } else {
            this.playlist = await this.playlist.getContinuation();
        }
        this.has_next_page = this.playlist.has_continuation;

        let a = this.playlist.items;
        if (!a || a.length == 0) {
            this.has_next_page = false;
            return [];
        }
        
        let k = a.filterType(YTNodes.MusicResponsiveListItem);
        return keyed(k);
    }
    protected async next_page_album(album_id: string) {
        this.has_next_page = false;
        let a = await this.tube.music.getAlbum(album_id);
        return keyed(a.contents);
    }
    protected async next_page_artist_songs(artist_id: string) {
        this.has_next_page = false;
        let a = await this.tube.music.getArtist(artist_id);
        let r = await a.getAllSongs();
        let arr: RObject<MusicResponsiveListItem>[];
        if (!r) {
            arr = [];
        } else {
            arr = keyed(r.contents);
        }
        return arr;
    }
    protected async next_page_search(type: Typ) {
        if (this.query.length == 0) {
            this.has_next_page = false;
            return [];
        }
        let songs: Array<MusicResponsiveListItem>;
        if (this.results === null) {
            this.results = await this.tube.music.search(this.query, { type: type });
            console.log(this.results);

            if (!this.results.contents) {
                this.has_next_page = false;
                return [];
            }

            let contents = this.results.contents
                .flatMap(e => e.contents?.filterType(YTNodes.MusicResponsiveListItem) ?? []);

            songs = contents;
        } else {
            if (this.cont === null) {
                this.cont = await this.results.getContinuation();
            } else {
                this.cont = await this.cont.getContinuation();
            }
            console.log(this.cont)

            if (
                !this.cont.contents
                || !this.cont.contents.contents
                || !(this.cont.contents.contents.length > 0)
            ) {
                this.has_next_page = false;
                return [];
            }

            songs = [...this.cont.contents.contents.as(YTNodes.MusicResponsiveListItem)];
        }

        songs = songs.filter(e => !!e.id);
        let k = keyed(songs);

        this.has_next_page = this.results.has_continuation;
        console.log(k.map(e => e.id))
        return k;
    }

    get_key(t: RObject<MusicResponsiveListItem>) {
        if (!t.id) {
            console.warn("item does not have an id :/", t);
        }
        return t.id;
    }
}

const keyed = <T>(items: T[]): (T & Keyed)[] => {
    return items.filter((e: unknown) => !!e.id).map((e: unknown) => {
        let p = e as RObject<MusicResponsiveListItem>;
        p.get_key = function() {
            if (!p.id) {
                console.warn("item does not have an id :/", p);
            }
            return p.id;
        };
        return p;
    });
}
