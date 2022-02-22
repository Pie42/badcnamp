/*export default class Album {
    constructor(title, artist) {
        this.title = title;
        this.artist = artist;
    }
}*/

import { createP, createLongP, createTrackDiv } from '../Util.js';

export default class AlbumView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.album = data;
        this.tracks = this.album.tracks;
        this.div = document.createElement('div');
        this.cover = document.createElement('img');
        this.cover.style.width = '40%';
        this.cover.style.height = this.cover.style.width;
        this.cover.src = this.album.image;
        //this.div.appendChild(this.cover);

        let albumLink = document.createElement('a');
        albumLink.href = this.album.link;
        //albumLink.innerHTML = 'Link';
        albumLink.appendChild(this.cover);
        this.div.appendChild(albumLink);
        //this.cover.onclick = albumLink.click;

        let title = document.createElement('h1');
        title.innerHTML = this.album.title;
        this.div.appendChild(title);

        let artist = document.createElement('h3');
        artist.innerHTML = this.album.artist;
        let artistName = this.album.artist.toLocaleLowerCase();
        if (this.library.artists[artistName]) {
            artist.onclick = () => {
                this.manager.switchUI('artist', artistName);
            }
        } else {
            console.log(this.album.artist);
        }
        this.div.appendChild(artist);

        for (let j in this.tracks) {
            let i = this.tracks[j];
            createTrackDiv(
                this.div,
                `${i.rawArtist} - ${i.title}`,
                i,
                this.library,
                j,
                this.tracks
            );
        }

        createP(this.div, 'reset', () => {
            this.library.fix(this.album);
        });
        //this.album = album;
        //this.tracks = album.tracks;
    }
}
