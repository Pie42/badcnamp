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
        this.library.scope2.addToQueue([this.context]);
    }

    prepend() {
        this.library.queue.unshift(this.context);
        this.library.scope2.playNext([this.context]);
    }

    addToPlaylist(playlist) {
        playlist.tracks.push(this.context);
        playlist.dirty();
    }

    goToAlbum() {
        this.browseui.switchUI('album', this.context.album);
    }
}