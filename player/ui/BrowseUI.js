import DataLoader from '../state/DataLoader.js';
import AlbumView from './browse/AlbumView.js';
import AlbumsView from './browse/AlbumsView.js';
import { getLinkType } from '../Util.js';
import TracksView from './browse/TracksView.js';
import ArtistsView from './browse/ArtistsView.js';
import ArtistView from './browse/ArtistView.js';
import BCTagView from './bcpages/BCTagView.js';
import PlaylistsView from './browse/PlaylistsView.js';
import PlaylistView from './browse/PlaylistView.js';
import TrackMenu from './menu/TrackMenu.js';
import AlbumMenu from './menu/AlbumMenu.js';
import LocalSearchView from './browse/LocalSearchView.js';
import Timer from '../Timer.js';
import TagsView from './browse/TagsView.js';
import TagView from './browse/TagView.js';
import { UITab } from './elements/UIElements.js';
import RemoteAlbumMenu from './menu/RemoteAlbumMenu.js';
import BCLabelView from './bcpages/BCLabelView.js';
import RemoteAlbum from './bcpages/RemoteAlbum.js';
import SettingsView from './browse/SettingsView.js';

export default class BrowseUI {
    constructor(library) {
        this.library = library;
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.div.style.borderRight = 'solid #0f0c0c';
        this.div.style.borderWidth = '1px';
        this.uiview = undefined;
        this.views = {
            album: AlbumView,
            albums: AlbumsView,
            artist: ArtistView,
            artists: ArtistsView,
            // a remotealbum can be loaded with the default view, but needs
            // separate handling for setting document.title / retrieving from history
            bcalbum: AlbumView,
            bclabel: BCLabelView,
            bctag: BCTagView,
            playlist: PlaylistView,
            playlists: PlaylistsView,
            localsearch: LocalSearchView,
            settings: SettingsView,
            tag: TagView,
            tags: TagsView,
            tracks: TracksView,
        };
        this.menuItemsToDisable = {
            album: {
                track: ['album'],
            },
            bcalbum: {
                track: ['album', 'playlist', 'edit', 'delete'],
                album: ['playlist', 'delete'],
            },
        };
        this.tabs = ['artists', 'albums', 'tracks', 'tags', 'playlists'];
        this.ui = undefined;
        this.history = [];
        this.scrollTop = 0;
        this.trackMenu = new TrackMenu(this.library, this);
        this.albumMenu = new AlbumMenu(this.library, this);
        this.remoteAlbumMenu = new RemoteAlbumMenu(this.library, this);

        this.delay = 0;
        this.searchInterval = 500;

        this.sort = 'title';
        this.current = [];

        // feel free to replace this with whatever if you don't like it (including a getter)
        this.titleString = ' - badcnamp';
        this.title = '';

        this.remoteCache = { tags: {}, labels: {} };

        this.selectedTab = undefined;
    }

    create(data, first = true) {
        if (first) {
            this.setupHistory();
            let search = window.location.search.substring(1).split(/,(.+)/);
            this.switchFromHistory(search[0], search?.[1]);
            //document.title = this.title;
        } else {
            for (let i of this.div.children) {
                i.remove();
            }
            delete this.ui;
            this.enableMenus();
            if (this.menuItemsToDisable[this.uiview]) {
                let toDisable = this.menuItemsToDisable[this.uiview];
                for (let i in toDisable) {
                    this[i + 'Menu'].disable(toDisable[i]);
                }
            }
            // this enables automatic redirects (e.g. for when a tag isn't found in the library)
            let uiview = this.uiview;
            this.ui = new this.views[this.uiview](this, data);
            if (uiview != this.uiview) return;
            this.div.innerHTML = '';
            this.div.appendChild(this.ui.div);
            this.createTabs();
            this.createInput();
        }
    }

    switchUI(newUI, data = null, add = true) {
        // early exit for when it's just the same thing as before
        if (add && newUI == this.current[0] && data == this.current[1]) {
            return;
        }
        this.current = [newUI, data];
        let t = Timer.start('UI switch to ' + newUI);
        let state = history.state;
        if (state) {
            state.scroll = this.div.scrollTop;
            history.replaceState(state, '');
        }
        this.addToHistory(newUI, data, !add);
        this.history.push([newUI, data, this.div.scrollTop]);
        this.uiview = newUI;
        DataLoader.setRaw('uiview', newUI);
        this.create(data, false);
        this.trackMenu.close();
        this.albumMenu.close();
        this.selectTab(newUI);
        if (this.playerui.audio.paused || !this.playerui.audio.src)
            document.title = this.title;
        Timer.stop(t);
        return;
    }

    createInput() {
        let inputDiv = document.createElement('div'),
            input = document.createElement('input'),
            addButton = document.createElement('button'),
            profileSelect = document.createElement('select'),
            search = document.createElement('input');
        function add() {
            let link = input.value.replace(/\?.*$/, '');
            switch (getLinkType(link)) {
                case 'album':
                    this.library.add(link);
                    break;
                case 'tag':
                    this.switchUI(
                        'bctag',
                        link.match(/\/tag\/([a-zA-Z-]+)/)[1]
                    );
                    break;
                case 'label':
                    this.switchUI('bclabel', link);
            }
            input.value = '';
        }
        input.addEventListener('keydown', (e) => {
            if (e.key == 'Enter') {
                add.apply(this);
            }
        });
        input.placeholder = 'Paste an album or tag link here...';
        addButton.onclick = add.bind(this);
        addButton.innerHTML = 'add!';
        for (let i of this.library.profileManager.profiles) {
            let profile = document.createElement('option');
            profile.innerText = i;
            profileSelect.appendChild(profile);
        }

        let newProfileOption = document.createElement('option');
        newProfileOption.innerText = 'New Profile...';
        profileSelect.appendChild(newProfileOption);
        profileSelect.selectedIndex =
            this.library.profileManager.activeProfileIndex;
        profileSelect.onchange = () => {
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
        };

        search.addEventListener('keyup', async () => {
            if (search.value != '') {
                if (this.uiview != 'localsearch') {
                    let value = search.value;
                    await this.switchUI('localsearch');
                    search = this.div.children[0].children[3];
                    search.value = value;
                    search.focus();
                }
                if (performance.now() - this.delay > this.searchInterval) {
                    this.delay = performance.now();
                    this.ui.search(search.value);
                    this.ui.update();
                } else {
                    setTimeout(() => {
                        if (
                            performance.now() - this.delay >
                            this.searchInterval
                        ) {
                            this.delay = performance.now();
                            this.ui.search(search.value);
                            this.ui.update();
                        }
                    }, 500);
                }
            }
        });
        if (this.current[0] == 'localsearch') {
            search.value = this.current[1];
        }
        inputDiv.appendChild(input);
        inputDiv.appendChild(addButton);
        inputDiv.appendChild(profileSelect);
        inputDiv.appendChild(search);
        this.div.insertBefore(inputDiv, this.div.children[0]);
        input.focus();
    }

    createTabs() {
        let tabs = document.createElement('div');
        tabs.classList.add('tab-group');
        for (let i of ['Artists', 'Albums', 'Tracks', 'Tags', 'Playlists']) {
            new UITab(
                i,
                () => {
                    this.switchUI(i.toLowerCase());
                },
                tabs,
                ['browse-tab']
            );
        }
        this.div.insertBefore(tabs, this.div.children[0]);
    }

    selectTab(type) {
        this.selectedTab = undefined;
        let index;
        if ((index = this.tabs.indexOf(type)) > -1) {
            this.selectedTab = this.div.children[1].children[index];
            this.selectedTab.classList.add('selected');
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
            this.create(
                this.history?.[this.history.length - 1]?.[1] || {},
                false
            );
        }
    }

    setupHistory() {
        window.addEventListener('popstate', (event) => {
            let state = event.state;
            if (state) {
                this.switchFromHistory(state?.type, state?.id, state?.scroll);
            } else {
                // this is a duplicate of create with no input, but it avoids
                // the problem of duplicating this event listener
                let search = window.location.search.substring(1).split(/,(.+)/);
                this.switchFromHistory(search[0], search?.[1]);
            }
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
            case 'tags':
            case 'settings':
                this.title = type;
                this.switchUI(type, null, false);
                break;
            case 'album': {
                let album = this.library.albums[id];
                this.title = album.title;
                this.switchUI('album', album, false);
                break;
            }
            case 'artist':
                this.title = this.library.artists[id].rawName;
                this.switchUI(type, id, false);
                break;
            case 'playlist': {
                let playlist = this.library.playlists[id];
                this.title = playlist.name;
                this.switchUI(type, playlist, false);
                break;
            }
            case 'localsearch':
                this.title = 'Search';
                this.switchUI('localsearch', id, false);
                break;
            case 'tag':
                this.title = id;
                this.switchUI('tag', id, false);
                break;
            case 'bctag':
                this.title = `${id} on bandcamp`;
                this.switchUI('bctag', id, false);
                break;
            case 'bclabel':
                this.title = id;
                this.switchUI('bclabel', `https://${id}/`, false);
                break;
            case 'bcalbum':
                this.title = id;
                //this.title = `${id.artist} - ${id.title} on bandcamp`;
                this.switchUI(
                    'bcalbum',
                    await RemoteAlbum.fromLink(id, this.library),
                    false
                );
                break;
            default:
                console.warn(`Failed to switch on type: ${type}, id: ${id}`);
                this.switchUI('albums');
                break;
        }
        this.title += this.titleString;
        this.scroll(scroll || 0);
    }

    addToHistory(type, data, replace = false) {
        let state = { scroll: 0, type: type },
            search = `?${type}`;
        switch (type) {
            case 'album':
            case 'playlist':
                state.id = data.id;
                this.title =
                    this.library[type + 's'][data.id][
                        type == 'album' ? 'title' : 'name'
                    ];
                search += `,${data.id}`;
                break;
            case 'artist':
                this.title = this.library.artists[data].rawName;
                state.id = data;
                search += `,${data}`;
                break;
            case 'tag':
                this.title = data;
                state.id = data;
                search += `,${data}`;
                break;
            case 'bctag':
                this.title = `${data} on bandcamp`;
                state.id = data;
                search += `,${data}`;
                break;
            case 'bclabel':
                this.title = data;
                state.id = data.match('(?:https://)?(.+?)(?:/|$)')[1];
                search += `,${state.id}`;
                break;
            case 'bcalbum':
                //await data;
                //this.title = data.link;
                this.title = `${data.title} on bandcamp`;
                state.id = data.link;
                search += `,${state.id}`;
                break;
            default:
                this.title = type;
                break;
        }
        this.title += this.titleString;
        if (replace) {
            window.history.replaceState(state, type, search);
        } else {
            window.history.pushState(state, type, search);
        }
    }

    enableMenus() {
        this.trackMenu.enableAll();
        this.albumMenu.enableAll();
        this.remoteAlbumMenu.enableAll();
    }
}
