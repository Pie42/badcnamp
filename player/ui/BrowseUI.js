import DataLoader from '../state/DataLoader.js';
import AlbumView from './AlbumView.js';
import AlbumsView from './AlbumsView.js';
import { createP, getLinkType } from '../Util.js';
import TracksView from './TracksView.js';
import ArtistsView from './ArtistsView.js';
import ArtistView from './ArtistView.js';
import BCTag from './bcpages/BCTag.js';
import PlaylistsView from './PlaylistsView.js';
import PlaylistView from './PlaylistView.js';
import TrackMenu from './menu/TrackMenu.js';
import AlbumMenu from './menu/AlbumMenu.js';
import SearchView from './SearchView.js';
import Timer from '../Timer.js';
import TagsView from './TagsView.js';
import TagView from './TagView.js';
import { UITab } from './elements/UIElements.js';
import RemoteAlbumMenu from './menu/RemoteAlbumMenu.js';

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
            bctag: BCTag,
            playlist: PlaylistView,
            playlists: PlaylistsView,
            search: SearchView,
            tag: TagView,
            tags: TagsView,
            tracks: TracksView,
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

        // feel free to replace this with whatever if you don't like it (including a getter)
        this.titleString = ' - badcnamp';
        this.title = '';

        this.remoteCache = { tags: {}, artists: {} };

        this.selectedTab = undefined;
    }

    create(data, first = true) {
        if (first) {
            this.setupHistory();
            let search = window.location.search.substring(1).split(',');
            this.switchFromHistory(search[0], search?.[1]);
        } else {
            for (let i of this.div.children) {
                i.remove();
            }
            delete this.ui;
            this.ui = new this.views[this.uiview](this, data);
            this.div.innerHTML = '';
            this.div.appendChild(this.ui.div);
            this.createTabs();
            this.createInput();
        }
    }

    switchUI(newUI, data = null, add = true) {
        let t = Timer.start('UI switch to ' + newUI);
        let state = history.state;
        if (state) {
            state.scroll = this.div.scrollTop;
            history.replaceState(state, '');
        }
        if (add) {
            this.addToHistory(newUI, data);
        }
        this.history.push([newUI, data, this.div.scrollTop]);
        this.uiview = newUI;
        DataLoader.setRaw('uiview', newUI);
        this.create(data, false);
        this.trackMenu.switch();
        this.albumMenu.switch();
        this.selectTab(newUI);
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
            switch (getLinkType(input.value)) {
                case 'album':
                    this.library.add(input.value);
                    break;
                case 'tag':
                    this.switchUI(
                        'bctag',
                        input.value.match(/\/tag\/([a-zA-Z\-]+)/)[1]
                    );
                    break;
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
        };

        search.addEventListener('keyup', async () => {
            if (search.value != '') {
                if (this.uiview != 'search') {
                    let value = search.value;
                    await this.switchUI('search');
                    search = this.div.children[0].children[3];
                    search.value = value;
                    search.focus();
                }
                //this.delay = performance.now();
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
        inputDiv.appendChild(input);
        inputDiv.appendChild(addButton);
        inputDiv.appendChild(profileSelect);
        inputDiv.appendChild(search);
        this.div.insertBefore(inputDiv, this.div.children[0]);
        input.focus();
    }

    createTabs() {
        let tabs = document.createElement('div');
        /*tabs.style = `display: table;
        width: 100%;
        table-layout: fixed;`;*/
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
        /*if (this.selectedTab) {
            this.selectedTab.classList.remove('selected');
            this.selectedTab = undefined;
        }*/
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
            case 'tags':
                this.title = type;
                await this.switchUI(type, null, false);
                break;
            case 'album':
                let album = this.library.albums[id];
                this.title = album.title;
                await this.switchUI('album', album, false);
                break;
            case 'artist':
                this.title = this.library.artists[id].rawName;
                await this.switchUI(type, id, false);
                break;
            case 'playlist':
                let playlist = this.library.playlists[id];
                this.title = playlist.name;
                await this.switchUI(type, playlist, false);
                break;
            case 'search':
                this.title = 'Search';
                await this.switchUI('search', id, false);
                break;
            case 'tag':
                this.title = id;
                await this.switchUI('tag', id, false);
                break;
            case 'bctag':
                this.title = `${id} on bandcamp`;
                await this.switchUI('bctag', id, false);
                break;
            default:
                await this.switchUI('albums');
                break;
        }
        this.title += this.titleString;
        this.scroll(scroll || 0);
    }

    addToHistory(type, data) {
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
            default:
                this.title = type;
                break;
        }
        this.title += this.titleString;
        window.history.pushState(state, type, search);
    }
}
