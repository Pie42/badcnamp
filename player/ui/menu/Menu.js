import MenuButton from './MenuButton.js';

/*  current implementation goals: there are currently 4 menus used throughout the program,
    but there may soon be more (since there are different menus for different types of things,
    and that's how it should be imo). with that being said, this fact should never become
    apparent to the user: it should always seem like 1 menu that just changes around a lot.*/
export default class Menu {
    constructor(library, browseui) {
        this.library = library;
        this.browseui = browseui;
        this.div = document.createElement('div');
        this.div.classList.add('menu');
        this.buttons = [
            new MenuButton(
                this.div,
                'Play Next',
                this.prepend.bind(this),
                this
            ),
            new MenuButton(
                this.div,
                'Add to Queue',
                this.append.bind(this),
                this
            ),
            new MenuButton(
                this.div,
                'Shuffle into Queue',
                this.appendToShuffle.bind(this),
                this
            ),
            new MenuButton(
                this.div,
                'Add to Playlist',
                this.playlist.bind(this),
                this,
                false
            ),
            new MenuButton(this.div, 'Delete', this.delete.bind(this), this),
            new MenuButton(
                this.div,
                'Go to Artist',
                this.goToArtist.bind(this),
                this,
                false
            ),
            new MenuButton(
                this.div,
                'Go to Album',
                this.goToAlbum.bind(this),
                this
            ),
        ];
        this.buttonMap = {
            next: this.buttons[0],
            add: this.buttons[1],
            shuffle: this.buttons[2],
            playlist: this.buttons[3],
            delete: this.buttons[4],
            artist: this.buttons[5],
            album: this.buttons[6],
        };
        //note that this just has to be some sort of unique identifier
        //this.tempMenuionID = undefined;
        this.parent = undefined;
        this.context = undefined;
        this.tempMenu = undefined;
        // ensure that no 2 menus are open at the same time
        document.addEventListener('menuclose', this.close.bind(this));
        // ... but also ensure that this menu can open at all
        this.opening = false;
        this.getSize();
    }

    getSize() {
        let testDiv = document.createElement('div');
        testDiv.style = `
        visibility: hidden;
        position: absolute;
        left: -10000px;
        width: 1000px;`;
        document.body.appendChild(testDiv);
        testDiv.appendChild(this.div);
        this.width = this.div.offsetWidth;
        this.height = this.div.offsetHeight;
        document.body.removeChild(testDiv);
        testDiv.removeChild(this.div);
    }

    delete() {}

    append() {}

    prepend() {}

    appendToShuffle() {}

    switch(parent, context, pos = null) {
        this.clearTempMenu();
        // if a menu is switching from one copy of a context to another,
        // it should just switch instead of closing
        let override = false;
        if (this.parent) {
            //this.parent.removeChild(this.div);
            document.body.removeChild(this.div);
            this.parent.parentElement.classList.remove('selected');
            if (this.parent != parent) {
                override = true;
            }
        }
        if (context != this.context || override) {
            this.opening = true;
            document.dispatchEvent(new CustomEvent('menuclose'));
            this.parent = parent;
            if (this.parent) {
                //this.parent.appendChild(this.div);
                document.body.appendChild(this.div);
                if (pos) {
                    if (this.height + pos.y + 2 >= innerHeight) {
                        pos.y -= this.height + 4;
                    } else {
                        pos.y += 2;
                    }
                    if (this.width + pos.x >= innerWidth) {
                        pos.x -= this.width;
                    }
                    this.div.style = `top: ${pos.y}px;
                    left: ${pos.x}px;`;
                } else {
                    let rect = this.parent.getBoundingClientRect(),
                        bottom = rect.bottom,
                        left = rect.left;
                    if (left + this.width + 2 >= window.innerWidth) {
                        left -= this.width;
                    }
                    if (bottom + this.height + 2 >= window.innerHeight) {
                        bottom -= this.height + rect.height - 4;
                    }
                    /*this.div.style.top = rect.bottom;
                    this.div.style.left = Math.min(
                        rect.left + 1,
                        window.innerWidth - this.width - 2
                    );*/
                    // oops (it's better this way)
                    this.div.style = `top: ${bottom}px;
                    left: ${left}px;`;
                }
                this.parent.parentElement.classList.add('selected');
            }
            this.context = context;
        } else {
            this?.parent?.parentElement?.classList?.remove('selected');
            this.parent = undefined;
            this.context = undefined;
        }
    }

    clearTempMenu() {
        if (this.tempMenu) {
            this.div.removeChild(this.tempMenu);
            this.tempMenu = undefined;
        }
    }

    playlist() {
        this.clearTempMenu();
        let p = this.library.playlists,
            nullOption = document.createElement('option');
        this.tempMenu = document.createElement('select');
        nullOption.innerText = 'Choose a playlist...';
        this.tempMenu.appendChild(nullOption);
        this.tempMenu.onclick = (e) => {
            e.stopPropagation();
        };
        for (let i of p) {
            let playlist = document.createElement('option');
            playlist.innerText = i.name;
            this.tempMenu.appendChild(playlist);
        }

        let newPlaylistOption = document.createElement('option');
        newPlaylistOption.innerText = 'New Playlist...';
        this.tempMenu.appendChild(newPlaylistOption);
        this.tempMenu.selectedIndex = 0;
        this.tempMenu.onchange = (e) => {
            let item = this.tempMenu.selectedOptions[0],
                index = this.tempMenu.selectedIndex;
            if (item.value == 'New Playlist...') {
                let newPlaylist = prompt(
                    'What would you like to call this new playlist?'
                );
                if (!(newPlaylist == '' || newPlaylist == 'New Playlist...')) {
                    this.library.createPlaylist(newPlaylist);
                }
            }
            this.addToPlaylist(this.library.playlists[index - 1]);
            this.div.removeChild(this.tempMenu);
            this.tempMenu = undefined;
            this.library.save();
            this.switch();
        };
        this.div.insertBefore(this.tempMenu, this.buttons[4].div);
    }

    addToPlaylist(playlist) {}

    goToArtist() {
        this.clearTempMenu();
        let artists = this.artists;
        if (artists.length == 1) {
            this.browseui.switchUI('artist', artists[0]);
        } else {
            this.tempMenu = document.createElement('div');
            for (let i in artists) {
                new MenuButton(
                    this.tempMenu,
                    '└ ' + artists[i],
                    () => this.browseui.switchUI('artist', artists[i]),
                    this
                );
            }
            this.div.insertBefore(this.tempMenu, this.buttons[6].div);
        }
    }

    goToAlbum() {}

    getArtists(n) {}

    close() {
        if (this.parent && !this.opening) {
            this.switch();
        } else if (this.opening) {
            // putting this here helps prevent any sort of potential race condition
            this.opening = false;
        }
    }

    disable(buttons) {
        for (let i of buttons) {
            this.buttonMap[i].disable();
        }
    }

    enableAll() {
        for (let button of this.buttons) {
            button.enable();
        }
    }
}
