import { parseTralbumData } from '../../Util.js';
import FetchManager from './FetchManager.js';
import Track from '../../library/Track.js';
import { guessTheTitle } from '../../Util.js';

export default class RemoteAlbum {
    constructor(data) {
        this.data = data;
        this.artist = this.data.artist;
        this.image = `https://f4.bcbits.com/img/a${this.data.art_id}_16.jpg`;
        this.file = this.data.audio_url['mp3-128'];
        this.title = this.data.title;
        this.link = this.data.tralbum_url;
        this.trackTitle = this.data.featured_track_title;
        this.trackIndex = this.data.featured_track_number;
        let [artist, title] = guessTheTitle(this.artist, this.trackTitle);
        this.track = new Track({
            title: title,
            artist: artist,
            album: this,
            file: this.file,
        });
        this.track.artist = artist;
        this.track.title = title;
        this.tracks = [];
    }

    refetch() {
        FetchManager.fetch(
            this.url,
            parseTralbumData,
            this.updateFile.bind(this)
        );
    }

    refetchAll() {
        FetchManager.fetch(
            this.url,
            parseTralbumData,
            this.updateAll.bind(this)
        );
    }

    loadAll() {
        FetchManager.fetch(
            this.url,
            parseTralbumData,
            this.loadIntoTracks.bind(this)
        )
    }

    updateFile(data) {
        this.file = data.trackInfo[this.trackIndex].file['mp3-128'];
    }

    updateAll(data) {
        let info = data.trackInfo;
        for (let i in info) {
            this.tracks[i].file = info[j]?.file?.['mp3-128'];
        }
    }

    loadIntoTracks(data) {

    }
}
