import MenuButton from './MenuButton.js';

export default class Menu {
    constructor(library, browseui) {
        this.library = library;
        this.browseui = browseui;
        this.div = document.createElement('div');
        this.div.classList.add('menu');
        this.buttons = [
            new MenuButton(this.div, 'Play Next', this.prepend.bind(this)),
            new MenuButton(this.div, 'Add to Queue', this.append.bind(this)),
            new MenuButton(
                this.div,
                'Add to Playlist',
                this.playlist.bind(this)
            ),
            new MenuButton(this.div, 'Delete', this.delete.bind(this)),
        ];
        //note that this just has to be some sort of unique identifier
        //this.selectionID = undefined;
        this.parent = undefined;
        this.context = undefined;
        this.select = undefined;
    }

    delete() {}

    append() {}

    prepend() {}

    switch(parent, context) {
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
                let rect = this.parent.getBoundingClientRect();
                this.div.style.top = rect.bottom;
                this.div.style.left = rect.left + 1;
                this.parent.parentElement.classList.add('selected');
            }
            this.context = context;
        } else {
            this?.parent?.parentElement?.classList?.remove('selected');
            this.parent = undefined;
            this.context = undefined;
        }
        if (this.select) {
            this.div.removeChild(this.select);
            this.select = undefined;
        }
    }

    playlist() {
        let p = this.library.playlists,
            nullOption = document.createElement('option');
        this.select = document.createElement('select');
        nullOption.innerHTML = 'Choose a playlist...';
        this.select.appendChild(nullOption);
        this.select.onclick = (e) => {e.stopPropagation()};
        for (let i of p) {
            let playlist = document.createElement('option');
            playlist.innerHTML = i.name;
            this.select.appendChild(playlist);
        }

        let newPlaylistOption = document.createElement('option');
        newPlaylistOption.innerHTML = 'New Playlist...';
        this.select.appendChild(newPlaylistOption);
        this.select.selectedIndex = 0;
        this.select.onchange = (e) => {
            let item = this.select.selectedOptions[0],
                index = this.select.selectedIndex;
            if (item.value == 'New Playlist...') {
                let newPlaylist = prompt(
                    'What would you like to call this new playlist?'
                );
                if (!(newPlaylist == '' || newPlaylist == 'New Playlist...')) {
                    this.library.createPlaylist(newPlaylist);
                }
            }
            this.addToPlaylist(this.library.playlists[index - 1]);
            this.div.removeChild(this.select);
            this.select = undefined;
            this.library.save();
        };
        this.div.insertBefore(this.select, this.buttons[3].div);
    }

    addToPlaylist(playlist) {}
}
