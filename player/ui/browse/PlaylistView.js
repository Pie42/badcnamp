import { createP, createLongP, createTrackDiv, tformat } from '../../Util.js';

export default class PlaylistView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.playlist = data;
        this.playlist.createImage();
        this.tracks = this.playlist.tracks;
        this.div = document.createElement('div');
        this.cover = this.playlist.canvas;
        this.cover.style.width = '40%';
        this.div.appendChild(this.cover);

        let name = document.createElement('h1');
        name.innerText = this.playlist.name;
        this.div.appendChild(name);

        let dataDisplay = document.createElement('h4');
        dataDisplay.innerText = `${this.tracks.length} song${
            this.tracks.length - 1 ? 's' : ''
        } - ${tformat(this.playlist.duration)}, ${this.playlist.plays} play${
            this.playlist.plays - 1 ? 's' : ''
        } across all songs`;
        this.div.appendChild(dataDisplay);

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
