import { sortArray, createTrackDiv, createLongP, createP } from '../../Util.js';
import { UITagSection, UIShuffleButton } from '../elements/UIElements.js';

export default class ArtistView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        this.artist = this.library.artists[data];
        this.albums = this.artist.albums;
        this.tracks = this.artist.tracks;
        this.tags = this.artist.tags;

        this.div = document.createElement('div');
        let artistName = document.createElement('h1');
        artistName.innerText = this.artist.rawName;
        this.div.appendChild(artistName);

        let albumHeader = document.createElement('h4');
        albumHeader.innerText = 'Albums';
        albumHeader.style.display = 'inline';
        this.div.appendChild(albumHeader);
        new UIShuffleButton(this.div, this.manager, () =>
            this.albums.map((i) => i.tracks).flat()
        );

        let albums = sortArray(this.albums, 'title');
        for (let i of albums) {
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
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            albumDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.manager.albumMenu.switch(arrowP, i, {
                    x: e.clientX,
                    y: e.clientY,
                });
            });
            this.div.appendChild(albumDiv);
        }

        let tracks = sortArray(this.tracks, 'title');
        let trackHeader = document.createElement('h4');
        trackHeader.innerText = 'Tracks';
        trackHeader.style.display = 'inline';
        this.div.appendChild(trackHeader);
        new UIShuffleButton(this.div, this.manager, () => this.tracks);
        for (let j in tracks) {
            let i = this.tracks[j];
            createTrackDiv(this.div, i.title, i, this.library, j, tracks);
        }

        new UITagSection(this.div, Object.keys(this.tags), manager);
    }
}
