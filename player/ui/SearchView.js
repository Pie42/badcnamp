import { rateLimit, createTrackDiv, createLongP, createP } from '../Util.js';

export default class SearchView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        //this.searchString = data;
        this.tracks = [];
        this.albums = [];
        this.artists = [];
        this.playlists = [];
        this.div = document.createElement('div');
        this.searchString = undefined;
        this.rawSearch = undefined;
        if (data) {
            this.search(data);
            this.update();
        }
    }

    search(string) {
        let match;
        if (string.match(/^\/.+\/$/)) {
            match = new RegExp(string.replace(/^\/(.+)\/$/, '$1'), 'i');
        } else {
            match = string;
        }
        this.searchString = match;
        this.rawSearch = string;
        this.tracks = this.library.tracks.filter((i) => i.title.match(match));
        this.albums = this.library.albums.filter((i) => i.title.match(match));
        this.artists = Object.keys(this.library.artists).filter((i) =>
            i.match(match)
        );
        let _albums = [...this.albums],
            _artists = [...this.artists];
        /*for (let i of this.tracks) {
            this.albums.push(i.album);
        }
        for (let i of _albums) {
            for (let j of i.tracks) {
                this.tracks.push(j);
            }

            for (let j in i.albumArtists) {
                this.artists.push(j);
            }
        }
        for (let i of _artists) {
            let k = this.library.artists[i];
            for (let j of k.albums) {
                this.albums.push(j);
            }

            for (let j of k.tracks) {
                this.tracks.push(j);
            }
        }*/
        this.tracks = Array.from(new Set(this.tracks)).sort(
            (a, b) => (b.title.toLowerCase() < a.title.toLowerCase()) * 2 - 1
        );
        this.albums = Array.from(new Set(this.albums)).sort(
            (a, b) => (b.title.toLowerCase() < a.title.toLowerCase()) * 2 - 1
        );
        this.artists = Array.from(new Set(this.artists)).sort(
            (a, b) => (b.toLowerCase() < a.toLowerCase()) * 2 - 1
        );
    }

    update() {
        window.history.replaceState(
            { scroll: 0, type: 'search', id: this.rawSearch },
            '',
            '?search,' + this.rawSearch
        );
        this.div.innerHTML = '';
        let trackDiv = document.createElement('div'),
            albumDiv = document.createElement('div'),
            artistDiv = document.createElement('div'),
            trackh3 = document.createElement('h3'),
            albumh3 = document.createElement('h3'),
            artisth3 = document.createElement('h3');

        trackh3.innerHTML = 'Tracks';
        albumh3.innerHTML = 'Albums';
        artisth3.innerHTML = 'Artists';

        trackDiv.appendChild(trackh3);
        albumDiv.appendChild(albumh3);
        artistDiv.appendChild(artisth3);

        //creating tracks
        rateLimit(
            (i) =>
                createTrackDiv(
                    trackDiv,
                    `${this.tracks[i].rawArtistString} - ${this.tracks[i].title}`,
                    this.tracks[i],
                    this.library,
                    i,
                    this.tracks,
                    false
                ),
            this.tracks.length
        );

        //creating albums
        rateLimit((j) => {
            let i = this.albums[j],
                currentAlbumDiv = document.createElement('div'),
                albumTitle = createLongP(
                    currentAlbumDiv,
                    `${i.artist} - ${i.title}`,
                    () => {
                        this.manager.switchUI('album', i);
                    }
                ),
                arrowP = createP(currentAlbumDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            albumTitle.firstChild.style = `
            vertical-align: middle;
            padding: 8px;
            display: block;
            padding-top: 0px;
            padding-bottom: 0px;
            line-height: 37px;`;
            currentAlbumDiv.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            /*padding: 8px;*/
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            max-height: 37;`;
            albumDiv.appendChild(currentAlbumDiv);
        }, this.albums.length);

        rateLimit((j) => {
            let i = this.artists[j],
                currentArtistDiv = document.createElement('div'),
                artistName = createLongP(
                    currentArtistDiv,
                    this.library.artists[i].rawName,
                    () => {
                        this.manager.switchUI('artist', i);
                    }
                ),
                arrowP = createP(currentArtistDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            artistName.firstChild.style = `
            vertical-align: middle;
            padding: 8px;
            display: block;
            padding-top: 0px;
            padding-bottom: 0px;
            line-height: 37px;`;
            currentArtistDiv.style = `
    border: solid;
    border-width: 1px;
    border-radius: 2px;
    /*padding: 8px;*/
    margin: 2px;
    display: flex;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-height: 37;`;
            artistDiv.appendChild(currentArtistDiv);
        }, this.artists.length);
        this.div.appendChild(artistDiv);
        this.div.appendChild(albumDiv);
        this.div.appendChild(trackDiv);
    }
}
