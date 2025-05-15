import DataLoader from '../state/DataLoader.js';
import Album from './Album.js';
import settings from '../constants/PlayerConstants.js';
import {
    parseTralbumData,
    doTheFunkyTitleThing,
    isOutdated,
    parseTags,
} from '../Util.js';
import Playlist from './Playlist.js';
import Timer from '../Timer.js';
import FixedQueue from './FixedQueue.js';
import Track from './Track.js';

export default class LibraryManager {
    constructor() {
        this.tracks = [];
        this.albums = [];
        this.artists = {};
        this.playlists = [];
        this.tags = {};
        //to do fun things with remote albums
        this.links = {};
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

        this.tags = {};
        this.artists = {};
        let albums = DataLoader.getP('albums');
        for (let i in albums) {
            let currentAlbum = albums[i],
                albumData = {},
                album;
            albumData.image = currentAlbum[0];
            albumData.link = currentAlbum[1];
            [albumData.artist, albumData.title] =
                currentAlbum[2][0].split(' - ');
            albumData.tags = currentAlbum[3] || [];
            albumData.tracks = currentAlbum[2][1].map((t) => {
                return {
                    artist: t[0],
                    title: t[1],
                    plays: t[2],
                    duration: t[3],
                };
            });
            album = new Album(albumData, this.artists, this.tracks, this.tags);
            this.albums.push(album);
            album.id = +i;
            this.links[albumData.link] = album;
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

        let playlists = DataLoader.getP('playlists');
        for (let i in playlists) {
            let currentPlaylist = playlists[i],
                name = currentPlaylist[0],
                image = currentPlaylist[1],
                tracks = currentPlaylist[2].map(
                    (i) => this.albums[i[0]].tracks[i[1]]
                ),
                playlist = new Playlist(name, image, tracks);
            this.playlists.push(playlist);
            playlist.id = +i;
        }

        if (this.scope2.load()) {
            this.play(this.scope2.playing).then((i) => {
                this.audio.currentTime = DataLoader.getRawP('time');
                this.audio.pause();
            });
        }

        function saveTime() {
            DataLoader.setRawP('time', this.audio.currentTime);
        }

        let rst = saveTime.bind(this);
        window.addEventListener('unload', rst);
        this.audio.addEventListener('pause', rst);
        let st = 0;
        this.audio.addEventListener('timeupdate', function () {
            st++;
            if (st % 20 == 0) {
                rst();
            }
        });

        Timer.stop(t);
    }

    /**
     *
     * @param {Track}
     */
    async play(track, index, scope) {
        if (!track) {
            return;
        }
        let same = this.playing == track;
        this.playing = track;
        if (scope) {
            this.scope2.update(scope, index);
        }
        this.scope2.updateTitle();
        let status = 2;
        if (isOutdated(track) || !track.file) {
            status = await (track.album?.refetchAll?.() ||
                this.refetch(track.album));
        }
        switch (status) {
            case 2:
                if (same) break;
                this.audio.src = track.file;
                this.audio.currentTime = 0;
                this.audio.play().catch((e) => {});
                break;
            // connection or cors error
            // display an alert, then try again half a second after it's closed
            case 1:
                alert("Something has gone wrong that can't be sensed from within the code. Please check your internet connection and CORS proxy, then try again.");
                setTimeout(() => this.play(track, index, scope), 500);
                break;
            // uncaught 404 error
            // attempt to go to the next track
            case 0:
                let canPlay = await this.uimanager.playerui.prepareNextTrack();
                if (canPlay) {
                    this.uimanager.playerui.next();
                }
                break;
        }
    }

    /**
     *
     * @param {Album} album The album to refetch
     * @param {boolean} reset Whether or not to fully reset it
     */
    async refetch(album, reset = false) {
        // 2 = successful, 1 = internet error / other misc error, 0 = not found
        let successful = 2;
        await fetch(settings.path + album.link)
            .then(
                (i) => {
                    if (i.ok) {
                        return i.text();
                    } else if (i.status == 404) {
                        album.status = 'not-found';
                        album.ok = false;
                        album.lastChecked = Date.now();
                        successful = 0;
                        throw 'Not found error';
                    }
                },
                (e) => {
                    this.fetchError(e, album);
                }
            )
            .then(
                (i) => {
                    let tralbumData;
                    try {
                        tralbumData = parseTralbumData(i);
                    } catch (e) {
                        album.status = 'parse-error';
                        album.ok = false;
                        album.lastChecked = Date.now();
                        successful = 1;
                        throw 'Parsing error';
                    }
                    let trackInfo = tralbumData.trackinfo,
                        trackPointer = 0,
                        tracks = album.tracks,
                        [titleReplace, splitCharacter] =
                            doTheFunkyTitleThing(trackInfo),
                        // diversion stores when a track starts messing everything up
                        // to fix tracks being deleted on bandcamp
                        diversion = 0,
                        // available stores which tracks from trackInfo haven't been used
                        available = Object.fromEntries(
                            [...Array(trackInfo.length)].map((i, j) => [j, 1])
                        );
                    album.titleReplace = titleReplace;
                    album.splitCharacter = splitCharacter;
                    for (let track = 0; track < trackInfo.length; track++) {
                        let j = trackInfo[track],
                            parsedTitle = j.title
                                .replace(titleReplace, '')
                                .match(splitCharacter),
                            trackArtist =
                                j.artist ||
                                (parsedTitle
                                    ? parsedTitle[1]
                                    : tralbumData.artist),
                            trackTitle = parsedTitle
                                ? parsedTitle[3]
                                : j.title.replace(titleReplace, '');
                        // needs to have the ?. for if you delete the last track in an album
                        // attempt to match the track to the one provided in the tralbuminfo
                        // if this succeeds, put the data in and move on as normal
                        // THIS FUNCTION WILL BREAK WHEN A TRACK HAS BEEN REMOVED FROM THE BANDCAMP SIDE
                        if (
                            trackTitle == tracks?.[trackPointer]?.title &&
                            trackArtist ==
                                tracks?.[trackPointer]?.rawArtistString &&
                            available[+track]
                        ) {
                            if (j?.file?.['mp3-128']) {
                                tracks[trackPointer].file = j.file['mp3-128'];
                            }
                            available[+track] = 0;
                            diversion = track;
                            trackPointer++;
                        } else {
                            // if it fails, attempt to match the current track from tralbuminfo
                            // to the rest of the album, then move on if nothing else works.
                            // this handles tracks that the user has deleted (but are still on bandcamp)
                            for (
                                let k = 0;
                                k < tracks.length - trackPointer;
                                k++
                            ) {
                                if (
                                    trackTitle ==
                                        tracks?.[trackPointer + k]?.title &&
                                    trackArtist ==
                                        tracks?.[trackPointer + k]
                                            ?.rawArtistString &&
                                    available[+track]
                                ) {
                                    if (j?.file?.['mp3-128']) {
                                        tracks[trackPointer + k].file =
                                            j.file['mp3-128'];
                                    }
                                    available[+track] = 0;
                                    trackPointer += k;
                                    diversion = track;
                                    break;
                                }
                            }
                        }
                        if (
                            track == trackInfo.length - 1 &&
                            diversion < track
                        ) {
                            track = diversion + 1;
                            tracks[trackPointer].broken = true;
                            console.log(
                                'This track has probably been removed on bandcamp, sorry!',
                                tracks[trackPointer]
                            );
                            trackPointer++;
                        }
                    }
                    let unusedTracks = [];
                    for (let i in available) {
                        if (available[i]) {
                            unusedTracks.push(trackInfo[i]);
                        }
                    }
                    if (unusedTracks.length > 0) {
                        console.log(
                            "Tracks that aren't in the library or fixed metadata for tracks that are:",
                            unusedTracks.map((i) => {
                                let parsedTitle = i.title
                                    .replace(titleReplace, '')
                                    .match(splitCharacter);
                                return {
                                    title: parsedTitle
                                        ? parsedTitle[3]
                                        : i.title.replace(titleReplace, ''),
                                    artist:
                                        i.artist ||
                                        (parsedTitle
                                            ? parsedTitle[1]
                                            : tralbumData.artist),
                                    index: i.track_num,
                                };
                            })
                        );
                        album.unused = unusedTracks;
                    }
                },
                (e) => {
                    this.fetchError(e, album);
                }
            )
            .catch((e) => {
                this.fetchError(e, album);
            });
        return successful;
    }

    /**
     *
     * @param {string} link The link to the album to add
     * @param {boolean} refresh Whether or not to refresh the current UI view
     */
    async add(link, refresh = true) {
        //removing link parameters
        link = link.replace(/\?.*$/, '');
        if (this.albums.findIndex((album) => album.link == link) > -1) {
            if (
                !confirm(`This album is already in your library. 
Are you still sure you want to add it?`)
            ) {
                return;
            }
        }
        let finalAlbum;
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
                data.tags = parseTags(i);
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
                    data.tracks.push({
                        artist: trackArtist,
                        title: trackTitle,
                        plays: 0,
                        duration: j.duration,
                    });
                }
                let album = new Album(
                        data,
                        this.artists,
                        this.tracks,
                        this.tags
                    ),
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
                this.links[link] = album;
                this.save();
                if (
                    refresh &&
                    !['bctag', 'playlist', 'playlists'].includes(
                        this.uimanager.browseui.uiview
                    )
                )
                    this.uimanager.browseui.refresh(false);
                finalAlbum = album;
            });
        return finalAlbum;
    }

    /**
     *
     * @param {Album} album The album to export
     */
    albumExport(album) {
        return [
            album.image,
            album.link,
            [
                `${album.artist} - ${album.title}`,
                album.tracks.map((i) => [
                    i.rawArtistString,
                    i.title,
                    i.plays,
                    i.duration,
                ]),
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

    completeImport(data) {
        if (!confirm('Are you sure you want to do this? This will completely overwrite your current library, so be sure you\'ve backed everything up first and that this is completely necessary at all!')) {
            return;
        }
        if (typeof data == 'string') {
            data = JSON.parse(data);
        }
        DataLoader.setP('albums', data.albums);
        DataLoader.setP('playlists', data.playlists);
        location.reload();
    }

    save() {
        let t = Timer.start('save');
        DataLoader.setP('albums', this.fullAlbumExport());
        DataLoader.setP('playlists', this.fullPlaylistExport());
        Timer.stop(t);
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
        let index = this.albums.indexOf(album),
            link = album.link;
        if (link.map) link = link[0];
        album.link = '';
        let newAlbum = await this.add(link);
        if (!newAlbum) {
            album.link = link;
            console.warn(`Unknown error while re-adding album ${album.title}; aborting!`)
            return;
        }
        this.refreshTrackIds(newAlbum);
        this.removeAlbum(album);
        this.albums.splice(index, 0, this.albums.pop());
        this.save();
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

    fetchError(e, album) {
        //successful = 1;
        console.log(`album ${album.link} (${album.title} - ${album.rawArtistString}) could not be fetched
${e}`);
    }
}
