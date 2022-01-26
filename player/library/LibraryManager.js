import DataLoader from '../state/DataLoader.js';
import Album from './Album.js';
import { path } from '../constants/PlayerConstants.js';
import { parseTralbumData } from '../Util.js';

export default class LibraryManager {
    constructor() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.audio = document.createElement('audio');
        this.playing = undefined;
        this.queue = [];
        this.prev = [];
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
    }

    async play(track) {
        this.playing = track;
        if (
            !track.file ||
            track.file.match(/ts=(.+?)\&/)[1] * 1000 - Date.now() < 5000000
        ) {
            await this.refetch(track.album);
        }
        this.audio.src = track.file;
        this.audio.currentTime = 0;
        this.audio.play();
    }

    async refetch(album) {
        await fetch(path + album.link)
            .then(
                (i) => i.text(),
                () => {}
            )
            .then((i) => {
                let tralbumData = parseTralbumData(i),
                    trackInfo = tralbumData.trackinfo,
                    trackPointer = 0,
                    tracks = album.tracks;
                console.log(tralbumData, trackInfo);
                for (let j of trackInfo) {
                    let parsedTitle = j.title.match(/^\d*\.? ?(.+) - (.+?)$/),
                        trackArtist =
                            j.artist || parsedTitle?.[1] || tralbumData.artist,
                        trackTitle = parsedTitle?.[2] || j.title;
                    if (
                        trackTitle == tracks[trackPointer].title &&
                        trackArtist == tracks[trackPointer].rawArtist
                    ) {
                        if (j?.file?.['mp3-128']) {
                            tracks[trackPointer].file = j.file['mp3-128'];
                        }
                        trackPointer++;
                    }
                    else {
                        console.log(tracks[trackPointer], trackTitle, trackArtist);
                    }
                }
            });
        return;
    }

    async add(link) {
        fetch(link)
            .then((i) => i.text())
            .then((i) => {
                let tralbumData = parseTralbumData(i),
                    trackInfo = tralbumData.trackinfo,
                    data = {};
                data.artist = tralbumData.current.artist || tralbumData.artist;
                data.title = tralbumData.current.title;
                data.tracks = [];
                data.link = link;
                data.image = i.match(
                    /<a class="popupImage"[^]+?<img src="(.+?)"/
                )[1];
                for (let i in trackInfo) {
                    let parsedTitle = trackInfo[i].title.match(
                            /^\d*?(?:\. | |\.)?(.+) - (.+?)$/
                        ),
                        trackArtist =
                            trackInfo[i].artist ||
                            parsedTitle?.[1] ||
                            tralbumData.artist,
                        trackTitle = parsedTitle?.[2] || trackInfo[i].title;
                    data.tracks.push([trackArtist, trackTitle]);
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
                this.albums.push(album);
                this.save();
            });
    }

    export(album) {
        return [
            album.image,
            album.link,
            [
                `${album.artist} - ${album.title}`,
                album.tracks.map((i) => [i.rawArtist, i.title]),
            ],
        ];
    }

    fullExport() {
        let albums = {},
            key = 0;
        for (let i of this.albums) {
            albums[key] = this.export(i);
            key++;
        }
        return albums;
    }

    save() {
        DataLoader.set(`albums~${this.profileManager.activeProfile}`, this.fullExport());
    }

    clear() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.playing = undefined;
        this.queue = [];
        this.prev = [];
    }
}
