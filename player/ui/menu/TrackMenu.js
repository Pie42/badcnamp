import Menu from './Menu.js';
import MenuButton from './MenuButton.js';
import { uiInfoPopup } from '../elements/UIElements.js';
import { splitArtists } from '../../Util.js';

export default class TrackMenu extends Menu {
    constructor(library, browseui) {
        super(library, browseui);
        let edit = new MenuButton(
            this.div,
            'Edit info',
            this.editInfo.bind(this),
            this
        );
        this.buttons.push(edit);
        this.buttonMap.edit = edit;
        this.getSize();
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

    appendToShuffle() {
        this.library.scope2.appendToShuffle([this.context]);
    }

    addToPlaylist(playlist) {
        playlist.tracks.push(this.context);
        playlist.dirty();
    }

    goToAlbum() {
        this.browseui.switchUI('album', this.context.album);
    }

    get artists() {
        return this.context.artists;
    }

    editInfo() {
        let context = this.context;
        uiInfoPopup(
            context,
            (e) => {
                console.log(e);
                if (e.rawArtistString != context.rawArtistString) {
                    let artists = splitArtists(e.rawArtistString);
                    context.artists = artists.map((i) => i.toLocaleLowerCase());
                    context.rawArtists = artists;
                    context.rawArtistString = data.artist;
                }
                context.title = e.title;
                context.broken = false;
            },
            'middle',
            /*[
                ['title', 'song title'],
                ['rawArtistString', 'all of the artists in a song'],
            ]*/
            {
                title: 'song title',
                rawArtistString: 'all of the artists in a song',
            }
        );
    }
}
