import { createP, createLongP } from '../Util.js';

export default class PlaylistsView {
    constructor(manager, data) {
        this.manager = manager;
        this.data = data;
        this.library = this.manager.library;
        this.playlists = this.library.playlists;
        this.div = document.createElement('div');
        let playlists = Object.keys(this.playlists).sort((a, b) => {
            return (b.toLocaleLowerCase() < a.toLocaleLowerCase()) * 2 - 1;
        });
        for (let i of playlists) {
            let playlistDiv = document.createElement('div'),
                playlistName = createLongP(
                    playlistDiv,
                    this.playlists[i].name,
                    () => {
                        manager.switchUI('playlist', this.playlists[i]);
                    }
                ),
                arrowP = createP(playlistDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            playlistName.firstChild.style.display = 'block';
            playlistName.firstChild.style.padding = '8px';
            playlistDiv.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            this.div.appendChild(playlistDiv);
        }
    }
}
