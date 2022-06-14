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
        this.div.appendChild(artistsAccordion);

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
            albumsAccordion = accordion(`Albums (${albums.length})`),
            albumsDiv = albumsAccordion.children[1];
        this.div.appendChild(albumsAccordion);

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

        let tracks = sortArray(this.tracks, 'title'),
            tracksAccordion = accordion(`Tracks (${tracks.length})`),
            tracksDiv = tracksAccordion.children[1];
        this.div.appendChild(tracksAccordion);
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
    }
}
