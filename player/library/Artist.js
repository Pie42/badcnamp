// eslint-disable-next-line no-unused-vars
import Album from "./Album.js";
// eslint-disable-next-line no-unused-vars
import Track from "./Track.js";

export default class Artist {
    constructor() {
        /**
         * @type {Album[]}
         */
        this.albums = [];
        /**
         * @type {Track[]}
         */
        this.tracks = [];
        this.capitalisations = {};
        this.tags = {};
    }
}