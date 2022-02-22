import Track from './Track.js';

export default class Album {
    constructor(data, artists, tracks) {
        this.title = data.title;
        this.artist = data.artist;
        this.link = data.link;
        this.image = data.image;
        this.tracks = [];
        this.albumArtists = {};
        //technically a unix timestamp but whatever
        this.date = 0;
        //for use in exporting everything (mostly for making playlists lol)
        this.id = undefined;
        for (let j in data.tracks) {
            let i = data.tracks[j],
                trackData = {};
            trackData.title = i[1];
            trackData.artist = i[0];
            trackData.album = this;
            trackData.id = +j;
            let track = new Track(trackData),
                artist = trackData.artist.toLocaleLowerCase();
            artists[artist] = artists[artist] || {
                albums: [],
                tracks: [],
                capitalisations: {},
            };
            artists[artist].tracks.push(track);
            artists[artist].capitalisations[trackData.artist] = ~(
                ~artists[artist].capitalisations[trackData.artist] - 1
            );
            this.albumArtists[artist] = 1;
            tracks.push(track);
            this.tracks.push(track);
        }
        for (let i in this.albumArtists) {
            artists[i].albums.push(this);
        }
    }
}
