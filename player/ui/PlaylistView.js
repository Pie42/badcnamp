import { createP, createLongP, createTrackDiv } from '../Util.js';

export default class PlaylistView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.playlist = data;
        this.tracks = this.playlist.tracks;
        this.div = document.createElement('div');
        this.cover = document.createElement('img');
        this.cover.style.width = '40%';
        this.cover.style.height = this.cover.style.width;
        this.cover.src =
            this.playlist.image || this.tracks?.[0]?.album?.image || '';
        this.div.appendChild(this.cover);

        let name = document.createElement('h1');
        name.innerHTML = this.playlist.name;
        this.div.appendChild(name);

        for (let j in this.tracks) {
            let i = this.tracks[j];
            /*createLongP(this.div, `${i.rawArtist} - ${i.title}`, () => {
                this.library.play(i, +j, this.tracks);
            });*/
            createTrackDiv(
                this.div,
                `${i.rawArtist} - ${i.title}`,
                i,
                this.library,
                j,
                this.tracks
            );
        }
        //this.playlist = playlist;
        //this.tracks = playlist.tracks;
    }
}
