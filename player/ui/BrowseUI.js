import DataLoader from '../state/DataLoader.js';
import AlbumView from './AlbumView.js';
import AlbumsView from './AlbumsView.js';
//import Menu from './Menu.js';
import { createP } from '../Util.js';
import TracksView from './TracksView.js';
import ArtistsView from './ArtistsView.js';
import ArtistView from './ArtistView.js';
import PlaylistsView from './PlaylistsView.js';
import PlaylistView from './PlaylistView.js';
import TrackMenu from './menu/TrackMenu.js';
import AlbumMenu from './menu/AlbumMenu.js';

export default class BrowseUI {
    constructor(library) {
        this.library = library;
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.div.style.borderRight = 'solid #0f0c0c';
        this.div.style.borderWidth = '1px';
        //this.menu = new Menu();
        //this.uiview = DataLoader.getRaw('uiview') || 'albums';
        //this.uiview = 'albums';
        this.uiview = undefined;
        this.views = {
            album: AlbumView,
            albums: AlbumsView,
            artist: ArtistView,
            artists: ArtistsView,
            playlist: PlaylistView,
            playlists: PlaylistsView,
            tracks: TracksView,
        };
        this.ui = undefined;
        //this.history = [['albums', null, 0]];
        this.history = [];
        //let search = window.location.search.replace('?', '').split(',');
        //this.switchFromHistory(search[0], search?.[1]);
        this.scrollTop = 0;
        this.trackMenu = new TrackMenu(this.library, this);
        this.albumMenu = new AlbumMenu(this.library, this);
    }

    create(data, first = true) {
        if (first) {
            this.setupHistory();
            let search = window.location.search.replace('?', '').split(',');
            this.switchFromHistory(search[0], search?.[1]);
        } else {
            for (let i of this.div.children) {
                i.remove();
            }
            delete this.ui;
            this.ui = new this.views[this.uiview](this, data);
            this.div.replaceChildren(this.ui.div);
            this.createTabs();
            this.createInput();
            //this.scroll();
        }
    }

    switchUI(newUI, data = null, add = true) {
        if (add) {
            this.addToHistory(newUI, data);
        }
        this.history.push([newUI, data, this.div.scrollTop]);
        this.uiview = newUI;
        DataLoader.setRaw('uiview', newUI);
        this.create(data, false);
        this.trackMenu.switch();
        this.albumMenu.switch();
        return;
    }

    createTabs() {
        let tabs = document.createElement('div');
        createP(tabs, '< Back', () => {
            this.back();
        }, ['browse-tab']);
        createP(tabs, 'Artists', () => {
            this.switchUI('artists');
        }, ['browse-tab']);
        createP(tabs, 'Albums', () => {
            this.switchUI('albums');
        }, ['browse-tab']);
        createP(tabs, 'Tracks', () => {
            this.switchUI('tracks');
        }, ['browse-tab']);
        createP(tabs, 'Playlists', () => {
            this.switchUI('playlists');
        }, ['browse-tab']);
        this.div.insertBefore(tabs, this.div.children[0]);
    }

    createInput() {
        let inputDiv = document.createElement('div'),
            input = document.createElement('input'),
            addButton = document.createElement('button'),
            profileSelect = document.createElement('select');
        input.addEventListener('keydown', (e) => {
            if (e.key == 'Enter') {
                this.library.add(input.value);
                input.value = '';
            }
        });
        addButton.onclick = () => {
            this.library.add(input.value);
            input.value = '';
        };
        addButton.innerHTML = 'add!';
        for (let i of this.library.profileManager.profiles) {
            let profile = document.createElement('option');
            profile.innerHTML = i;
            profileSelect.appendChild(profile);
        }

        let newProfileOption = document.createElement('option');
        newProfileOption.innerHTML = 'New Profile...';
        profileSelect.appendChild(newProfileOption);
        profileSelect.selectedIndex =
            this.library.profileManager.activeProfileIndex;
        profileSelect.onchange = (e) => {
            let item = profileSelect.selectedOptions[0];
            if (item.value == 'New Profile...') {
                let newProfile = prompt(
                    'What would you like to call this new profile?'
                );
                if (!(newProfile == '' || newProfile == 'New Profile...')) {
                    if (
                        this.library.profileManager.profiles.indexOf(
                            newProfile
                        ) == -1
                    ) {
                        this.library.profileManager.addProfile(newProfile);
                    } else {
                        this.library.profileManager.switchProfiles(newProfile);
                    }
                }
            } else {
                this.library.profileManager.switchProfiles(item.value);
            }
            //profileSelect.multiple
        };
        inputDiv.appendChild(input);
        inputDiv.appendChild(addButton);
        inputDiv.appendChild(profileSelect);
        this.div.insertBefore(inputDiv, this.div.children[0]);
        input.focus();
    }

    async back() {
        /*if (this.history.length >= 2) {
            let top = this.history.pop()[2];
            let h = this.history.pop();
            //this.history.pop();
            await this.switchUI(h[0], h[1]);
            this.div.scrollTop = top;
            //this.div.scrollTop = h[2];
        }*/
        if (this.history.length > 1) {
            window.history.back();
        }
    }

    scroll() {
        this.div.scrollTop = this.scrollTop;
    }

    refresh(clear = true) {
        if (clear) {
            this.history = [];
            if (this.uiview[this.uiview.length - 1] != 's') {
                this.switchUI(this.uiview + 's');
            } else {
                this.create();
            }
        } else {
            this.create(this.history?.[this.history.length - 1]?.[1] || {});
        }
    }

    setupHistory() {
        window.addEventListener('popstate', (event) => {
            let state = event.state;
            this.switchFromHistory(state?.type, state?.id, state?.scroll);
        });
    }

    async switchFromHistory(type = undefined, id = undefined, scroll) {
        if (id) {
            id = decodeURI(id);
        }
        switch (type) {
            case 'albums':
            case 'tracks':
            case 'artists':
            case 'playlists':
                document.title = type;
                await this.switchUI(type, null, false);
                break;
            case 'album':
                let album = this.library.albums[id];
                document.title = album.title;
                await this.switchUI('album', album, false);
                break;
            case 'artist':
                document.title = this.library.artists[id].rawName;
                await this.switchUI(type, id, false);
                break;
            case 'playlist':
                let playlist = this.library.playlists[id];
                document.title = playlist.name;
                await this.switchUI(type, playlist, false);
                break;
            default:
                await this.switchUI('albums');
        }
        //feel free to remove this if you don't like it, this is just to make it
        // easy to tell apart from other tabs
        document.title += ' - badcnamp';
        this.scroll(scroll || 0);
    }

    addToHistory(type, data) {
        let state = { scroll: 0, type: type },
            search = `?${type}`;
        switch (type) {
            case 'album':
            case 'playlist':
                state.id = data.id;
                document.title =
                    this.library[type + 's'][data.id][
                        type == 'album' ? 'title' : 'name'
                    ];
                search += `,${data.id}`;
                break;
            case 'artist':
                document.title = this.library.artists[data].rawName;
                state.id = data;
                search += `,${data}`;
                break;
            default:
                document.title = type;
        }
        // same here as above
        document.title += ' - badcnamp';
        window.history.pushState(state, type, search);
    }
}
