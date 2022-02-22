import DataLoader from '../state/DataLoader.js';
import Album from './Album.js';
import { path } from '../constants/PlayerConstants.js';
import { parseTralbumData } from '../Util.js';
import { doTheFunkyTitleThing } from '../Util.js';
import { stupidRegex } from '../Util.js';
import Playlist from './Playlist.js';
import { isOutdated } from '../Util.js';

export default class LibraryManager {
    constructor() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.playlists = [];
        this.audio = document.createElement('audio');
        this.playing = undefined;
        this.playingIndex = undefined;
        this.queue = [];
        this.prev = [];
        this.scope = [];
        this.profile = undefined;
    }

    load(profile) {
        let albums = DataLoader.get(`albums~${profile}`);
        for (let i in albums) {
            let currentAlbum = albums[i],
                albumData = {};
            albumData.image = currentAlbum[0];
            albumData.link = currentAlbum[1];
            [albumData.artist, albumData.title] =
                currentAlbum[2][0].split(' - ');
            albumData.tracks = currentAlbum[2][1];
            this.albums.push(new Album(albumData, this.artists, this.tracks));
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
    }

    async play(track, index, scope = this.scope || this.tracks) {
        this.playing = track;
        this.playingIndex = index ?? this.playingIndex;
        this.scope = scope;
        if (isOutdated(track)) {
            await this.refetch(track.album);
        }
        this.audio.src = track.file;
        this.audio.currentTime = 0;
        this.audio.play();
    }

    async refetch(album, reset = false) {
        await fetch(path + album.link)
            .then(
                (i) => i.text(),
                () => {}
            )
            .then((i) => {
                let tralbumData = parseTralbumData(i),
                    trackInfo = tralbumData.trackinfo,
                    trackPointer = 0,
                    tracks = album.tracks,
                    [titleReplace, splitCharacter] =
                        doTheFunkyTitleThing(trackInfo);
                for (let j of trackInfo) {
                    /*let parsedTitle = j.title.replace(titleReplace, '');
                    parsedTitle =
                        parsedTitle.match(/^(.+?) (\p{Dash}) (.+)$/u) ||
                        parsedTitle.match(stupidRegex);
                    let trackArtist =
                            j.artist ||
                            (parsedTitle?.[1]?.length
                                ? parsedTitle?.[1]
                                : tralbumData.artist),
                        trackTitle = parsedTitle?.[3]?.length
                            ? parsedTitle?.[3]
                            : j.title.replace(titleReplace, '');*/
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
                        trackArtist == tracks?.[trackPointer]?.rawArtist
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
            });
        return;
    }

    async add(link) {
        await fetch(link)
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
                    /*let parsedTitle = trackInfo[i].title.replace(
                        titleReplace,
                        ''
                    );
                    parsedTitle =
                        parsedTitle.match(/^(.+?) (\p{Dash}) (.+)$/u) ||
                        parsedTitle.match(stupidRegex);
                    let trackArtist =
                            trackInfo[i].artist ||
                            (parsedTitle?.[1]?.length
                                ? parsedTitle?.[1]
                                : tralbumData.artist),
                        trackTitle = parsedTitle?.[1]?.length
                            ? parsedTitle?.[3]
                            : trackInfo[i].title.replace(titleReplace, '');*/
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
                    //console.log(parsedTitle, trackArtist, trackTitle);
                }
                let album = new Album(data, this.artists, this.tracks),
                    toDelete = [];
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
                album.tracks.map((i, j) => [i.rawArtist, i.title]),
            ],
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
        this.artists[track.artist].tracks.splice(
            this.artists[track.artist].tracks.indexOf(track),
            1
        );
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

    async fix(album) {
        let index = this.albums.indexOf(album);
        this.removeAlbum(album);
        await this.add(album.link);
        this.albums.splice(index, 0, this.albums.pop());
        //this.uimanager.refresh();
        //this.uimanager.back();
        await this.uimanager.browseui.switchUI('album', this.albums[index]);
        this.uimanager.browseui.history.pop();
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
}
