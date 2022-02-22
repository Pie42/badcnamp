import Menu from "./Menu.js";

export default class TrackMenu extends Menu {
    constructor(library, browseui) {
        super(library, browseui);
    }

    delete() {
        this.library.removeTrack(this.context);
        this.library.refreshTrackIds(this.context.album);
        this.library.save();
        this.browseui.refresh(false);
        this.switch();
    }

    append() {
        this.library.queue.push(this.context);
    }

    prepend() {
        this.library.queue.unshift(this.context);
    }

    addToPlaylist(playlist) {
        playlist.tracks.push(this.context);
    }
}