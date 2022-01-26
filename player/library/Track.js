export default class Track {
    constructor(data) {
        this.title = data.title;
        this.artist = data.artist.toLocaleLowerCase();
        this.rawArtist = data.artist;
        this.album = data.album;
        this.file = data.file || '';
    }
}