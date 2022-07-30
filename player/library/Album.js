import Track from './Track.js';
import { splitArtists } from '../Util.js';
import Tag from './Tag.js';

export default class Album {
    // artists, tracks, and tags all get dummy inputs as the default
    // so that you can make an Album without having side effects.
    // (objects and arrays are pass-by-reference so real values work, too.)
    constructor(data, artists = {}, tracks = [], tags = {}) {
        this.title = data.title;
        this.artist = data.artist;
        //this.link = data.link.match(/^(.+?)\??.*/)[1];
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
                tags: {},
            };
            artists[albumGivenArtist].capitalisations[this.artist] = ~(
                ~artists[albumGivenArtist].capitalisations[this.artist] - 1
            );
        }
        // technically a unix timestamp but whatever
        // unimplemented, unused
        this.date = 0;
        // for use in exporting everything (playlists, the queue, etc.)
        this.id = undefined;
        for (let j in data.tracks) {
            let i = data.tracks[j],
                trackData = {};
            trackData.title = i[1];
            trackData.artist = i[0];
            trackData.plays = i?.[2];
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
                    tags: {},
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
            for (let tag of this.tags) {
                artists[i].tags[tag] = true;
            }
        }
    }
}
