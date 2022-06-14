import { sortArray } from '../Util.js';
import { createTrackDiv } from '../Util.js';
import { createLongP, createP } from '../Util.js';
import { UITagSection, UIShuffleButton } from './elements/UIElements.js';

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
        artistName.innerHTML = this.artist.rawName;
        this.div.appendChild(artistName);

        let albumHeader = document.createElement('h4');
        albumHeader.innerHTML = 'Albums';
        albumHeader.style.display = 'inline';
        this.div.appendChild(albumHeader);
        new UIShuffleButton(this.div, this.manager, () =>
            this.albums.map((i) => i.tracks).flat()
        );

        /*let albums = this.albums.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );*/
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
            /*padding: 8px;*/
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            this.div.appendChild(albumDiv);
        }

        /*let tracks = this.tracks.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );*/
        let tracks = sortArray(this.tracks, 'title');
        let trackHeader = document.createElement('h4');
        trackHeader.innerHTML = 'Tracks';
        this.div.appendChild(trackHeader);
        for (let j in tracks) {
            /*createLongP(this.div, i.title, () => {
                this.library.play(i, tracks);
            });*/
            let i = this.tracks[j];
            createTrackDiv(this.div, i.title, i, this.library, j, tracks);
        }

        /*let tagHeader = document.createElement('h5'),
            tags = sortArray(Object.keys(this.tags), 'string');
        tagHeader.innerHTML = 'Tags';
        this.div.appendChild(tagHeader);
        for (let j of tags) {
            this.div.appendChild(new UITag(j, manager).div);
        }*/
        new UITagSection(this.div, Object.keys(this.tags), manager);
    }
}
