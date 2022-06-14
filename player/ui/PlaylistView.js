import { createP, createLongP, createTrackDiv } from '../Util.js';

export default class PlaylistView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.playlist = data;
        this.tracks = this.playlist.tracks;
        this.div = document.createElement('div');
        this.cover = this.playlist.canvas;
        this.cover.style.width = '40%';
        this.div.appendChild(this.cover);

        let name = document.createElement('h1');
        name.innerHTML = this.playlist.name;
        this.div.appendChild(name);

        for (let j in this.tracks) {
            let i = this.tracks[j];
            createTrackDiv(
                this.div,
                `${i.rawArtistString} - ${i.title}`,
                i,
                this.library,
                j,
                this.tracks
            );
        }
    }
}
