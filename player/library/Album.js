import Track from './Track.js';
import { splitArtists } from '../Util.js';
import Tag from './Tag.js';
import Artist from './Artist.js';

export default class Album {
    /**
     * 
     * @param {Object} data Data to create the track
     * @param {string} data.image Link to the image
     * @param {string} data.link Album link
     * @param {string} data.artist Album artist name
     * @param {string} data.title Album title
     * @param {string[]} data.tags Album tags
     * @param {Array[] | Track[]} data.tracks Tracks
     * @param {Object.<string, Artist>} artists 
     * @param {Track[]} tracks 
     * @param {Object.<string, Tag>} tags 
     */
    // artists, tracks, and tags all get dummy inputs as the default
    // so that you can make an Album without having side effects.
    // (objects and arrays are pass-by-reference so real values work, too.)
    constructor(data, artists = {}, tracks = [], tags = {}) {
        this.title = data.title;
        this.artist = data.artist;
        //this.link = data.link.match(/^(.+?)\??.*/)[1];
        this.link = data.link;
        this.image = data.image;
        /**
         * @type {Array.<Track>}
         */
        this.tracks = [];
        /**
         * @type {Array.<string>}
         */
        this.tags = data.tags;
        this.albumArtists = {};
        // it's assumed that all albums are ok when they're loaded in.
        // other possible values: not-found, parse-error
        /**
         * @type {string}
         */
        this.status = 'ok';
        // a more concise version of the above
        /**
         * @type {boolean}
         */
        this.ok = true;
        // save when an album was last checked
        // albums will only be checked an hour (or so) apart
        this.lastChecked = 0;
        // TODO: this doesn't work when an album is by multiple artists
        let albumGivenArtists = splitArtists(this.artist.toLocaleLowerCase());
        for (let albumGivenArtist of albumGivenArtists) {
            this.albumArtists[albumGivenArtist] = 1;
            artists[albumGivenArtist] =
                artists[albumGivenArtist] || new Artist();
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
            let trackData = data.tracks[j];
            /*trackData.title = i[1];
            trackData.artist = i[0];
            trackData.plays = i?.[2];
            trackData.duration = i?.[3];*/
            trackData.album = this;
            trackData.id = +j;
            let track;
            if (trackData instanceof Track) {
                track = trackData;
            } else {
                track = new Track(trackData);
            }
            let trackArtists = track.artists;
            for (let i in trackArtists) {
                let artist = trackArtists[i],
                    rawArtist = track.rawArtists[i];
                artists[artist] = artists[artist] || new Artist();
                artists[artist].tracks.push(track);
                artists[artist].capitalisations[rawArtist] = ~(
                    ~artists[artist].capitalisations[rawArtist] - 1
                );
                this.albumArtists[artist] = 1;
            }
            tracks.push(track);
            this.tracks.push(track);
        }
        this.plays = this.tracks.reduce((a, b) => a + b.plays, 0);
        this.duration = this.tracks.reduce((a, b) => a + b.duration, 0);
        if (this.tags) {
            for (let tag of this.tags) {
                tags[tag] = tags[tag] || new Tag(tag);
                let lTag = tags[tag];
                for (let artist in this.albumArtists) {
                    lTag.artists[artist] = 1;
                }
                lTag.albums.push(this);
                lTag.tracks.push(...this.tracks);
                lTag.plays += this.plays;
                lTag.duration += this.duration;
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
