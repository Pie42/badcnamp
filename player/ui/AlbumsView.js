import { createP, createLongP } from '../Util.js';

export default class AlbumsView {
    constructor(manager, data) {
        this.menu = manager.menu;
        this.library = manager.library;
        this.albums = this.library.albums;
        this.data = data;
        this.div = document.createElement('div');
        for (let i of this.albums) {
            let albumDiv = document.createElement('div'),
                albumTitle = createLongP(
                    albumDiv,
                    `${i.artist} - ${i.title}`,
                    () => {
                        manager.switchUI('album', i);
                    }
                ),
                arrowP = createP(albumDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            albumTitle.firstChild.style.display = 'block';
            albumTitle.firstChild.style.padding = '8px';
            albumDiv.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            /*padding: 8px;*/
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            this.div.appendChild(albumDiv);
        }
        manager.scroll();
    }
}
