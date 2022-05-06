import Track from './Track.js';
import { splitArtists } from '../Util.js';
import Tag from './Tag.js';

export default class Album {
    constructor(data, artists, tracks, tags) {
        this.title = data.title;
        this.artist = data.artist;
        this.link = data.link;
        this.image = data.image;
        this.tracks = [];
        this.tags = data.tags;
        this.albumArtists = {};
        let albumGivenArtists = splitArtists(this.artist.toLocaleLowerCase());
        for (let albumGivenArtist of albumGivenArtists) {
            this.albumArtists[albumGivenArtist] = 1;
            artists[albumGivenArtist] = artists[albumGivenArtist] || {
                albums: [],
                tracks: [],
                capitalisations: {},
            };
            artists[albumGivenArtist].capitalisations[this.artist] = ~(
                ~artists[albumGivenArtist].capitalisations[this.artist] - 1
            );
        }
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
                trackArtists = track.artists;
            for (let i in trackArtists) {
                let artist = trackArtists[i],
                    rawArtist = track.rawArtists[i];
                artists[artist] = artists[artist] || {
                    albums: [],
                    tracks: [],
                    capitalisations: {},
                };
                artists[artist].tracks.push(track);
                artists[artist].capitalisations[rawArtist] = ~(
                    ~artists[artist].capitalisations[rawArtist] - 1
                );
                this.albumArtists[artist] = 1;
            }
            tracks.push(track);
            this.tracks.push(track);
        }
        if (this.tags) {
            for (let tag of this.tags) {
                tags[tag] = tags[tag] || new Tag(tag);
                let lTag = tags[tag];
                for (let artist in this.albumArtists) {
                    lTag.artists[artist] = 1;
                }
                lTag.albums.push(this);
                lTag.tracks.push(...this.tracks);
            }
        }
        for (let i in this.albumArtists) {
            artists[i].albums.push(this);
        }
    }
}
