import Menu from './Menu.js';

export default class AlbumMenu extends Menu {
    constructor(library, browseui) {
        super(library, browseui);
    }

    delete() {
        this.library.removeAlbum(this.context);
        let history = this.browseui.history;
        if (history[history.length - 1][0] == 'album') {
            this.browseui.back();
        } else {
            this.browseui.refresh(false);
        }
    }

    append() {
        this.library.queue.push(...this.context.tracks);
    }

    prepend() {
        this.library.queue.unshift(...this.context.tracks);
    }

    addToPlaylist(playlist) {
        playlist.tracks.push(...this.context.tracks);
    }
}
