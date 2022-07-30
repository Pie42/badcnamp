import MenuButton from './MenuButton.js';

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
                this
            ),
            new MenuButton(
                this.div,
                'Go to Album',
                this.goToAlbum.bind(this),
                this
            ),
        ];
        //note that this just has to be some sort of unique identifier
        //this.tempMenuionID = undefined;
        this.parent = undefined;
        this.context = undefined;
        this.tempMenu = undefined;
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

    switch(parent, context, pos = null) {
        this.clearTempMenu();
        if (this.parent) {
            //this.parent.removeChild(this.div);
            document.body.removeChild(this.div);
            this.parent.parentElement.classList.remove('selected');
        }
        if (context != this.context) {
            this.parent = parent;
            if (this.parent) {
                //this.parent.appendChild(this.div);
                document.body.appendChild(this.div);
                if (pos) {
                    this.div.style.top = pos.y;
                    this.div.style.left = pos.x;
                } else {
                    let rect = this.parent.getBoundingClientRect();
                    this.div.style.top = rect.bottom;
                    this.div.style.left = Math.min(rect.left + 1, window.innerWidth - this.width - 2);
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
        nullOption.innerHTML = 'Choose a playlist...';
        this.tempMenu.appendChild(nullOption);
        this.tempMenu.onclick = (e) => {
            e.stopPropagation();
        };
        for (let i of p) {
            let playlist = document.createElement('option');
            playlist.innerHTML = i.name;
            this.tempMenu.appendChild(playlist);
        }

        let newPlaylistOption = document.createElement('option');
        newPlaylistOption.innerHTML = 'New Playlist...';
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
        this.div.insertBefore(this.tempMenu, this.buttons[3].div);
    }

    addToPlaylist(playlist) {}

    goToArtist() {
        this.clearTempMenu();
        let artists = this.context.artists;
        if (artists.length == 1) {
            this.browseui.switchUI('artist', artists[0]);
        } else {
            this.tempMenu = document.createElement('div');
            for (let i in artists) {
                new MenuButton(
                    this.tempMenu,
                    '└ ' + this.context.rawArtists[i],
                    () => this.browseui.switchUI('artist', artists[i]),
                    this
                );
            }
            this.div.insertBefore(this.tempMenu, this.buttons[5].div);
        }
    }

    goToAlbum() {}
}
