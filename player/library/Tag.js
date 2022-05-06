export default class Tag {
    constructor(name) {
        this.name = name.toLocaleLowerCase();
        this.albums = [];
        this.artists = {};
        this.tracks = [];
    }
}