import { createP, createLongP } from '../../Util.js';
import { UIAlbum } from '../elements/UIElements.js';

export default class AlbumsView {
    constructor(manager, data) {
        this.menu = manager.menu;
        this.library = manager.library;
        this.albums = this.library.albums;
        this.data = data;
        this.div = document.createElement('div');
        let albums = this.albums.sort(
            (a, b) =>
                (b.title.toLocaleLowerCase() < a.title.toLocaleLowerCase()) *
                    2 -
                1
        );
        for (let i of albums) {
            this.div.appendChild(new UIAlbum(i, manager).div);
        }
        manager.scroll();
    }
}
