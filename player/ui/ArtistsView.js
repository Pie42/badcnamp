import { createP, createLongP, sortArray } from '../Util.js';

export default class ArtistsView {
    constructor(manager, data) {
        this.library = manager.library;
        this.artists = this.library.artists;
        this.data = data;
        this.div = document.createElement('div');
        let artists = this.artists;
        if (data?.sort == 'length') {
            artists = sortArray(Object.entries(artists), '[1].tracks.length');
        } else {
            artists = sortArray(Object.keys(artists), 'string');
        }
        for (let i of artists) {
            let artistDiv = document.createElement('div'),
                artistName = createLongP(
                    artistDiv,
                    this.artists[i].rawName,
                    () => {
                        manager.switchUI('artist', i);
                    }
                ),
                arrowP = createP(artistDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            artistName.firstChild.style.display = 'block';
            artistName.firstChild.style.padding = '8px';
            artistDiv.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            this.div.appendChild(artistDiv);
        }
    }
}
