import {
    createLongP,
    createP,
    createTrackDiv,
    sortArray,
    rateLimit,
    accordion,
} from '../Util.js';

export default class TagView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        this.tag = this.library.tags[data];
        this.albums = this.tag.albums;
        this.tracks = this.tag.tracks;
        this.artists = this.tag.artists;

        this.div = document.createElement('div');
        let tagName = document.createElement('h1');
        tagName.innerHTML = this.tag.name;
        this.div.appendChild(tagName);

        let artists = sortArray(Object.keys(this.artists), 'string'),
            artistsAccordion = accordion(`Artists (${artists.length})`),
            artistsDiv = artistsAccordion.children[1];
            /*artistsDiv = document.createElement('div'),
            artistsHeader = document.createElement('h4');
        artistsHeader.innerHTML = `Artists (${artists.length})`;
        artistsDiv.appendChild(artistsHeader);*/
        this.div.appendChild(artistsAccordion);

        /*let artists = Object.keys(this.artists).sort(
            (a, b) => (a.toLocaleLowerCase() > b.toLocaleLowerCase()) * 2 - 1
        );*/

        rateLimit((j) => {
            let i = artists[j],
                artistDiv = document.createElement('div'),
                artistName = createLongP(
                    artistDiv,
                    this.library.artists[i].rawName,
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
            artistsDiv.appendChild(artistDiv);
        }, artists.length);

        let albums = sortArray(this.albums, 'title'),
            /*albumsDiv = document.createElement('div'),
            albumsHeader = document.createElement('h4');
        albumsHeader.innerHTML = `Albums (${albums.length})`;
        albumsDiv.appendChild(albumsHeader);*/
            albumsAccordion = accordion(`Albums (${albums.length})`),
            albumsDiv = albumsAccordion.children[1];
        this.div.appendChild(albumsAccordion);

        /*let albums = this.albums.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );*/
        //for (let i of albums) {
        rateLimit((j) => {
            let i = albums[j],
                albumDiv = document.createElement('div'),
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
            albumsDiv.appendChild(albumDiv);
        }, albums.length);
        //}

        /*let tracks = this.tracks.sort(
            (a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) * 2 - 1
        );*/
        let tracks = sortArray(this.tracks, 'title'),
            /*tracksDiv = document.createElement('div'),
            tracksHeader = document.createElement('h4');
        tracksHeader.innerHTML = `Tracks (${tracks.length})`;
        tracksDiv.appendChild(tracksHeader);*/
            tracksAccordion = accordion(`Tracks (${tracks.length})`),
            tracksDiv = tracksAccordion.children[1];
        this.div.appendChild(tracksAccordion);
        //for (let j in tracks) {
        /*createLongP(this.div, i.title, () => {
                this.library.play(i, tracks);
            });*/
        rateLimit((j) => {
            let i = tracks[j];
            createTrackDiv(
                tracksDiv,
                `${i.rawArtistString} - ${i.title}`,
                i,
                this.library,
                j,
                tracks
            );
        }, tracks.length);
        //}
    }
}
