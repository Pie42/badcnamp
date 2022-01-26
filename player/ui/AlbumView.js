/*export default class Album {
    constructor(title, artist) {
        this.title = title;
        this.artist = artist;
    }
}*/

import { createP, createLongP } from '../Util.js';

export default class AlbumView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.album = data;
        this.tracks = this.album.tracks;
        this.div = document.createElement('div');
        this.cover = document.createElement('img');
        this.cover.src = this.album.image;
        this.cover.style.width = '40%';
        this.div.appendChild(this.cover);

        let title = document.createElement('h1');
        title.innerHTML = this.album.title;
        this.div.appendChild(title);

        let artist = document.createElement('h3');
        artist.innerHTML = this.album.artist;
        this.div.appendChild(artist);

        for (let i of this.tracks) {
            createLongP(
                this.div,
                `${i.rawArtist} - ${i.title}`,
                () => {
                    this.library.play(i);
                }
            );
        }
        //this.album = album;
        //this.tracks = album.tracks;
    }
}
