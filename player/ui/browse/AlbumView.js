import {
    createP,
    createLongP,
    createTrackDiv,
    createElement,
} from '../../Util.js';
import { UITagSection } from '../elements/UIElements.js';

export default class AlbumView {
    constructor(manager, data) {
        this.manager = manager;
        this.menu = manager.menu;
        this.library = manager.library;
        this.album = data;
        this.tracks = this.album.tracks;
        this.tags = this.album.tags;
        this.div = document.createElement('div');
        this.cover = document.createElement('img');
        this.cover.style.width = '40%';
        this.cover.style.height = this.cover.style.width;
        this.cover.src = this.album.image;

        let albumLink = document.createElement('a');
        albumLink.href = '#';
        albumLink.onclick = () =>
            this.manager.switchUI('bclabel', new URL(this.album.link).origin);
        albumLink.title = 'View all albums by label';
        albumLink.appendChild(this.cover);
        this.div.appendChild(albumLink);

        let title = document.createElement('h1');
        title.innerText = this.album.title;
        this.div.appendChild(title);

        let menu = createP(title, '\u2630', (e) => {
            //☰
            this.manager.albumMenu.switch(title, this.album);
        });

        let artist = document.createElement('h3');
        artist.innerText = this.album.artist;
        let artistName = this.album.artist.toLocaleLowerCase();
        if (this.library.artists[artistName]) {
            artist.onclick = () => {
                this.manager.switchUI('artist', artistName);
            };
        } else {
            console.log(this.album.artist);
        }
        this.div.appendChild(artist);

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

        if (this.album.hidden) {
            createElement('p', this.div, {
                innerText: `Plus ${this.album.hidden} tracks that can't be played`,
            });
        }

        createP(this.div, 'reset', () => {
            this.library.fix(this.album);
        });

        createP(this.div, 'refetch', () => {
            this.library.refetch(this.album);
        });

        new UITagSection(this.div, this.tags, manager);
    }
}
