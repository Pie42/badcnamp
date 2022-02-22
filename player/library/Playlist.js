export default class Playlist {
    constructor(name, image = '', tracks = []) {
        this.name = name;
        this.tracks = tracks;
        this.image = image;
        this.id = undefined;
    }
}