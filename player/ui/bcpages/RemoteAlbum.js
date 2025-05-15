import {
    parseTralbumData,
    parseTags,
    getImageType,
    isOutdated,
} from '../../Util.js';
import FetchManager from './FetchManager.js';
import Track from '../../library/Track.js';
import { guessTheTitle, doTheFunkyTitleThing } from '../../Util.js';
import Album from '../../library/Album.js';

export default class RemoteAlbum {
    #tracks = [];
    constructor(library) {
        //this.tracks = [];
        this.tags = [];
        this.temporary = true;
        // needed for the queue because all of my code is spaghetti :D
        this.ok = true;
        // we don't have to check against this first because the only reason
        // it's fetched is to refetch tracks or to load it in the first place
        this.fullData = undefined;
        this.isFull = false;
        this.noFile = 0;
        this.library = library;
    }

    async refetch() {
        await FetchManager.fetch(
            this.link,
            parseTralbumData,
            this.updateFile.bind(this)
        );
    }

    async refetchAll() {
        if (!this.isFull) {
            await this.loadAll();
            return;
        }
        await FetchManager.fetch(
            this.link,
            parseTralbumData,
            this.updateAll.bind(this)
        );
        return 2;
    }

    async loadAll() {
        if (this.isFull) return;
        await FetchManager.fetch(
            this.link,
            // hacky fix to make it so both tags and the tralbumdata can be parsed
            function (i) {
                this.tags = parseTags(i);
                return parseTralbumData(i);
            }.bind(this),
            this.loadIntoTracks.bind(this)
        );
    }

    updateFile(data) {
        this.file = data.trackinfo[this.trackIndex].file['mp3-128'];
        this.fullData = data;
    }

    updateAll(data) {
        let info = data.trackinfo;
        for (let i in info) {
            this.#tracks[i].file = info[i]?.file?.['mp3-128'];
        }
        this.fullData = data;
    }

    loadIntoTracks(data) {
        let info = data.trackinfo,
            [titleReplace, splitCharacter] = doTheFunkyTitleThing(info),
            id = 0;
        for (let i of info) {
            let parsedTitle = i.title
                    .replace(titleReplace, '')
                    .match(splitCharacter),
                trackArtist =
                    i.artist || (parsedTitle ? parsedTitle[1] : data.artist),
                trackTitle = parsedTitle
                    ? parsedTitle[3]
                    : i.title.replace(titleReplace, '');
            this.#tracks.push(
                new Track({
                    title: trackTitle,
                    artist: trackArtist,
                    album: this,
                    file: i?.file?.['mp3-128'],
                    duration: i.duration,
                    id,
                })
            );
            id++;
        }
        this.fullData = data;
        this.isFull = true;
    }

    getTracks() {
        return this.#tracks.length > 0
            ? this.tracks
            : [this.track];
    }

    async convertToAlbum() {
        if (this.#tracks.length == 0) await this.loadAll();
        let album = new Album(
                {
                    image: this.image,
                    link: this.link,
                    artist: this.artist,
                    title: this.title,
                    tags: this.tags,
                    tracks: this.#tracks,
                },
                this.library.artists,
                this.library.tracks,
                this.library.tags
            ),
            event = new CustomEvent('queuechange'),
            trackInfo = this.fullData.trackinfo,
            toDelete = [];
        document.dispatchEvent(event);
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
        album.id = this.library.albums.length;
        this.library.albums.push(album);
        this.library.links[this.link] = album;
        this.library.save();
        this.library.scope2.save();
    }

    // we need to be able to create remotealbums with varying amounts of data available,
    // so all of the parts of the constructor that were setting data are being moved to here
    static fromFull(data, library) {
        let album = new RemoteAlbum(library);

        album.data = data;
        album.artist = data.artist;
        //album.image = `https://f4.bcbits.com/img/a${data.art_id}_16.jpg`;
        album.image = getImageType(data.art_id, 23);
        album.file = data.audio_url['mp3-128'];
        album.title = data.title;
        album.link = data.tralbum_url;
        album.id = album.link;
        album.trackTitle = data.featured_track_title;
        album.trackIndex = data.featured_track_number;
        let [artist, title] = guessTheTitle(album.artist, album.trackTitle);
        album.track = new Track({
            title: title,
            artist: artist,
            album: album,
            file: album.file,
        });
        album.track.artist = artist;
        album.track.title = title;
        album.type = 'full';

        return album;
    }

    static fromMinimal(data, library) {
        let album = new RemoteAlbum(library);

        album.data = data;
        album.artist = data.artist;
        album.image = getImageType(data.image, 23);
        album.title = data.title;
        album.link = data.link;
        album.type = 'minimal';

        return album;
    }

    // if we just have an album link, there's no way to avoid fully loading it
    static async fromLink(link, library) {
        let album = new RemoteAlbum(library);

        album.link = link;
        await album.loadAll();
        album.title = album.fullData.current.title;
        album.artist = album.fullData.current.artist || album.fullData.artist;
        album.image = getImageType(album.fullData.current.art_id, 23);
        album.type = 'link';

        return album;
    }

    get previewTrack() {
        return new Promise((resolve) => {
            // Using a regular chain of Promises instead of async/await in executor
            Promise.resolve().then(() => {
                // get / choose file if necessary
                if (!this.file) {
                    // loadAll exits early if all tracks are loaded already
                    return this.loadAll().then(() => {
                        let tracks = [...this.#tracks];
                        tracks.sort((a, b) => a.duration - b.duration);
                        let track = tracks[(tracks.length / 2) | 0];
                        this.trackIndex = track.id;
                        this.trackTitle = track.title;
                        this.file = track.file;
                        this.track = track;
                    });
                }
            }).then(() => {
                // re-update file if necessary
                if (isOutdated(this.file)) {
                    return this.refetchAll().then(() => {
                        this.file = this.#tracks[this.trackIndex].file;
                        this.track.file = this.file;
                    });
                }
            }).then(() => {
                // return the track
                resolve(this.track);
            });
        });
    }

    get tracks() {
        return this.#tracks.filter(i => i.file);
    }

    get hidden() {
        return this.#tracks.filter(i => !i.file).length;
    }

    get lastChecked() {
        return Date.now();
    }
}
