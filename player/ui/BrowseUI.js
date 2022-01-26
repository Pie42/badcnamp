import DataLoader from '../state/DataLoader.js';
import AlbumView from './AlbumView.js';
import AlbumsView from './AlbumsView.js';
import Menu from './Menu.js';
import { createP } from '../Util.js';
import TracksView from './TracksView.js';
import ArtistsView from './ArtistsView.js';
import ArtistView from './ArtistView.js';

export default class BrowseUI {
    constructor(library) {
        this.library = library;
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.menu = new Menu();
        //this.uiview = DataLoader.getRaw('uiview') || 'albums';
        this.uiview = 'albums';
        this.views = {
            album: AlbumView,
            albums: AlbumsView,
            artist: ArtistView,
            artists: ArtistsView,
            tracks: TracksView,
        };
        this.ui = undefined;
        this.history = [['albums', null, 0]];
        this.scrollTop = 0;
    }

    create(data) {
        for (let i of this.div.children) {
            i.remove();
        }
        delete this.ui;
        this.ui = new this.views[this.uiview](this, data);
        this.div.replaceChildren(this.ui.div);
        this.createTabs();
        this.createInput();
        this.scroll();
    }

    switchUI(newUI, data = null) {
        this.history.push([newUI, data, this.div.scrollTop]);
        this.uiview = newUI;
        DataLoader.setRaw('uiview', newUI);
        this.create(data);
        return;
    }

    createTabs() {
        let tabs = document.createElement('div');
        createP(tabs, '< Back', () => {
            this.back();
        });
        createP(tabs, 'Artists', () => {
            this.switchUI('artists');
        });
        createP(tabs, 'Albums', () => {
            this.switchUI('albums');
        });
        createP(tabs, 'Tracks', () => {
            this.switchUI('tracks');
        });
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
    }

    async back() {
        if (this.history.length >= 2) {
            this.history.pop();
            let h = this.history.pop();
            await this.switchUI(h[0], h[1]);
            this.scrollTop = h[2];
            //this.div.scrollTop = h[2];
        }
    }

    scroll() {
        this.div.scrollTop = this.scrollTop;
    }

    refresh() {
        this.history = [];
        if (this.uiview[this.uiview.length - 1] != 's') {
            this.switchUI(this.uiview + 's');
        } else {
            this.create();
        }
    }
}
