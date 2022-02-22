import { createTrackDiv } from '../Util.js';
import { createLongP, createP } from '../Util.js';

export default class ArtistView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        this.artist = this.library.artists[data];
        this.albums = this.artist.albums;
        this.tracks = this.artist.tracks;

        this.div = document.createElement('div');
        let artistName = document.createElement('h1');
        artistName.innerHTML = this.artist.rawName;
        this.div.appendChild(artistName);

        let albumHeader = document.createElement('h4');
        albumHeader.innerHTML = 'Albums';
        this.div.appendChild(albumHeader);

        let albums = this.albums.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );
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

        let tracks = this.tracks.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );
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
    }
}
