import { splitArtists } from "../Util.js";

export default class Track {
    constructor(data) {
        this.title = data.title;
        let artists = splitArtists(data.artist);
        this.artists = artists.map(i=>i.toLocaleLowerCase());
        this.rawArtists = artists;
        this.rawArtistString = data.artist;
        //this.artist = data.artist.toLocaleLowerCase();
        //this.rawArtist = data.artist;
        this.album = data.album;
        this.file = data.file || '';
        this.playlists = data.playlists || {};
        this.id = data.id;
        this.plays = data.plays || 0;
    }
}