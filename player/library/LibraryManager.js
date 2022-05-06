import DataLoader from '../state/DataLoader.js';
import Album from './Album.js';
import settings from '../constants/PlayerConstants.js';
import { parseTralbumData } from '../Util.js';
import { doTheFunkyTitleThing } from '../Util.js';
import { stupidRegex } from '../Util.js';
import Playlist from './Playlist.js';
import { isOutdated } from '../Util.js';
import Timer from '../Timer.js';
import FixedQueue from './FixedQueue.js';

export default class LibraryManager {
    constructor() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.playlists = [];
        this.tags = {};
        this.audio = document.createElement('audio');
        this.playing = undefined;
        this.playingIndex = undefined;
        this.queue = [];
        this.prev = [];
        this.scope = [];
        this.scope2 = new FixedQueue(this);
        this.profile = undefined;
    }

    load(profile) {
        let t = Timer.start('Profile load');

        let albums = DataLoader.get(`albums~${profile}`);
        for (let i in albums) {
            let currentAlbum = albums[i],
                albumData = {};
            albumData.image = currentAlbum[0];
            albumData.link = currentAlbum[1];
            [albumData.artist, albumData.title] =
                currentAlbum[2][0].split(' - ');
            albumData.tags = currentAlbum[3] || [];
            albumData.tracks = currentAlbum[2][1];
            this.albums.push(new Album(albumData, this.artists, this.tracks, this.tags));
            this.albums[this.albums.length - 1].id = +i;
        }

        for (let i in this.artists) {
            let artist = this.artists[i],
                n = 0,
                t = '';
            for (let j in artist.capitalisations) {
                if (artist.capitalisations[j] > n) {
                    n = artist.capitalisations[j];
                    t = j;
                }
            }
            artist.rawName = t;
        }

        let playlists = DataLoader.get(`playlists~${profile}`);
        for (let i in playlists) {
            let currentPlaylist = playlists[i],
                name = currentPlaylist[0],
                image = currentPlaylist[1],
                tracks = currentPlaylist[2].map(
                    (i) => this.albums[i[0]].tracks[i[1]]
                );
            this.playlists.push(new Playlist(name, image, tracks));
            this.playlists[this.playlists.length - 1].id = +i;
        }

        Timer.stop(t);
    }

    //async play(track, index, scope = this.scope || this.tracks) {
    async play(track, index, scope) {
        this.playing = track;
        this.playingIndex = index ?? this.playingIndex;
        this.scope = scope || this.scope || this.tracks;
        if (scope) {
            this.scope2.update(scope, index);
        }
        this.scope2.pointer = index ?? this.scope2.pointer;
        this.scope2.pointer = +this.scope2.pointer;
        if (isOutdated(track)) {
            await this.refetch(track.album);
        }
        this.audio.src = track.file;
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
    }

    async refetch(album, reset = false) {
        await fetch(settings.path + album.link)
            .then((i) => i.text(), this.fetchError)
            .then((i) => {
                let tralbumData = parseTralbumData(i),
                    trackInfo = tralbumData.trackinfo,
                    trackPointer = 0,
                    tracks = album.tracks,
                    [titleReplace, splitCharacter] =
                        doTheFunkyTitleThing(trackInfo);
                for (let j of trackInfo) {
                    let parsedTitle = j.title
                            .replace(titleReplace, '')
                            .match(splitCharacter),
                        trackArtist =
                            j.artist ||
                            (parsedTitle ? parsedTitle[1] : tralbumData.artist),
                        trackTitle = parsedTitle
                            ? parsedTitle[3]
                            : j.title.replace(titleReplace, '');
                    // needs to have the ?. for if you delete the last track in an album
                    if (
                        trackTitle == tracks?.[trackPointer]?.title &&
                        trackArtist == tracks?.[trackPointer]?.rawArtistString
                    ) {
                        if (j?.file?.['mp3-128']) {
                            tracks[trackPointer].file = j.file['mp3-128'];
                        }
                        trackPointer++;
                    } else {
                        console.log(
                            tracks[trackPointer],
                            trackTitle,
                            trackArtist,
                            parsedTitle
                        );
                    }
                }
            }, this.fetchError);
        return;
    }

    async add(link) {
        await fetch(settings.path + link)
            .then((i) => i.text())
            .then((i) => {
                let tralbumData = parseTralbumData(i),
                    trackInfo = tralbumData.trackinfo,
                    data = {},
                    [titleReplace, splitCharacter] =
                        doTheFunkyTitleThing(trackInfo);
                data.artist = tralbumData.current.artist || tralbumData.artist;
                data.title = tralbumData.current.title;
                data.tracks = [];
                data.link = link;
                data.image = i.match(
                    /<a class="popupImage"[^]+?<img src="(.+?)"/
                )[1];
                for (let j of trackInfo) {
                    let parsedTitle = j.title
                            .replace(titleReplace, '')
                            .match(splitCharacter),
                        trackArtist =
                            j.artist ||
                            (parsedTitle ? parsedTitle[1] : tralbumData.artist),
                        trackTitle = parsedTitle
                            ? parsedTitle[3]
                            : j.title.replace(titleReplace, '');
                    data.tracks.push([trackArtist, trackTitle]);
                }
                let album = new Album(data, this.artists, this.tracks, this.tags),
                    toDelete = [];
                for (let i in album.albumArtists) {
                    let artist = this.artists[i],
                        n = 0,
                        t = '';
                    for (let j in artist.capitalisations) {
                        if (artist.capitalisations[j] > n) {
                            n = artist.capitalisations[j];
                            t = j;
                        }
                    }
                    artist.rawName = t;
                }
                for (let i in album.tracks) {
                    if (trackInfo[i]?.file?.['mp3-128']) {
                        album.tracks[i].file = trackInfo[i].file['mp3-128'];
                    } else {
                        toDelete.unshift(i);
                    }
                }
                for (let i of toDelete) {
                    album.tracks.splice(i, 1);
                }
                album.id = this.albums.length;
                this.albums.push(album);
                this.save();
                this.uimanager.browseui.refresh(false);
            });
        return;
    }

    albumExport(album) {
        return [
            album.image,
            album.link,
            [
                `${album.artist} - ${album.title}`,
                album.tracks.map((i, j) => [i.rawArtistString, i.title]),
            ],
            album.tags,
        ];
    }

    fullAlbumExport() {
        let albums = {},
            key = 0;
        for (let i of this.albums) {
            albums[key] = this.albumExport(i);
            i.id = key;
            key++;
        }
        return albums;
    }

    playlistExport(playlist) {
        return [
            playlist.name,
            playlist.image,
            playlist.tracks.map((i) => [i.album.id, i.id]),
        ];
    }

    fullPlaylistExport() {
        let playlists = [];
        for (let i in this.playlists) {
            this.playlists[i].id = +i;
            playlists.push(this.playlistExport(this.playlists[i]));
        }
        return playlists;
    }

    completeExport() {
        let data = {};
        data.albums = this.fullAlbumExport();
        data.playlists = this.fullPlaylistExport();
        return JSON.stringify(data);
    }

    completeImport() {}

    save() {
        DataLoader.set(
            `albums~${this.profileManager.activeProfile}`,
            this.fullAlbumExport()
        );
        DataLoader.set(
            `playlists~${this.profileManager.activeProfile}`,
            this.fullPlaylistExport()
        );
    }

    clear() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.playing = undefined;
        this.queue = [];
        this.prev = [];
        this.playlists = [];
    }

    removeTrack(track) {
        track.album.tracks.splice(track.album.tracks.indexOf(track), 1);
        this.tracks.splice(this.tracks.indexOf(track), 1);
        for (let artist of track.artists) {
            this.artists[artist].tracks.splice(
                this.artists[artist].tracks.indexOf(track),
                1
            );
        }
    }

    removeAlbum(album) {
        let t = [...album.tracks];
        for (let i of t) {
            this.removeTrack(i);
        }
        for (let i in album.albumArtists) {
            this.artists[i].albums.splice(
                this.artists[i].albums.indexOf(album),
                1
            );
        }
        this.albums.splice(this.albums.indexOf(album), 1);
        this.save();
    }

    async fix(album, switchViews = true) {
        let index = this.albums.indexOf(album);
        this.removeAlbum(album);
        await this.add(album.link);
        this.albums.splice(index, 0, this.albums.pop());
        //this.uimanager.refresh();
        //this.uimanager.back();
        if (switchViews) {
            await this.uimanager.browseui.switchUI('album', this.albums[index]);
            this.uimanager.browseui.history.pop();
        }
    }

    resetLibrary() {
        let i = 0,
            resetAlbum = async () => {
                let album = this.albums[i];
                try {
                    await this.fix(this.albums[i], false);
                } catch (error) {
                    console.error(
                        `could not fetch ${album.artist} - ${album.title} from ${album.link} because ${error}`
                    );
                }
                i++;
                if (i < this.albums.length - 1) {
                    resetAlbum();
                }
            };
        resetAlbum();
    }

    refreshTrackIds(album) {
        for (let i in album.tracks) {
            album.tracks[i].id = +i;
        }
    }

    createPlaylist(name) {
        let p = new Playlist(name);
        p.id = this.playlists.length;
        this.playlists.push(p);
    }

    fetchError(e) {
        console.log(`album ${album.link} (${album.title} - ${album.rawArtistString}) could not be fetched
${e}`);
    }
}
