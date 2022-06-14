import { createP, createLongP, sortArray } from '../../Util.js';

class UITab {
    constructor(name, onclick, parent, classes = []) {
        this.tab = createP(parent, name, onclick, classes);
    }
}

class UITrack {
    constructor(track, j) {}
}

class UIAlbum {
    constructor(album, manager, showArtist = true) {
        this.div = document.createElement('div');
        let albumTitle = createLongP(
                this.div,
                showArtist ? `${album.artist} - ${album.title}` : album.title,
                () => {
                    manager.switchUI('album', album);
                }
            ),
            arrowP = createP(this.div, ' >', () => {});
        arrowP.style.display = 'flex';
        arrowP.style.flexShrink = '0';
        arrowP.style.padding = '8px';
        albumTitle.firstChild.style.display = 'block';
        albumTitle.firstChild.style.padding = '8px';
        this.div.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            /*padding: 8px;*/
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
    }
}

class UITag {
    constructor(name, manager, type = 'tag') {
        this.div = document.createElement('div');
        this.div.classList.add('tag-button');
        this.button = createP(
            this.div,
            name,
            () => {
                manager.switchUI(type, name);
            },
            ['tag-button-p']
        );
        this.div.onclick = this.button.onclick;
    }
}

class UITagSection {
    constructor(parent, tags, manager, type = 'tag', sortingMethod = 'string') {
        this.div = document.createElement('div');
        let tagHeader = document.createElement('h5'),
            sortedTags = sortArray(tags, sortingMethod);
        tagHeader.innerHTML = 'Tags';
        this.div.appendChild(tagHeader);
        for (let j of sortedTags) {
            this.div.appendChild(new UITag(j, manager, type).div);
        }
        parent.appendChild(this.div);
    }
}

class UIHeader {
    constructor(parent, title, type, classes = []) {
        let header = document.createElement(type);
        header.innerHTML = title;
        header.classList.add(...classes);
        parent.appendChild(header);
    }
}

class UIRemoteAlbum {
    constructor(album, manager) {
        this.div = document.createElement('div');
        this.div.style.display = 'inline';
        this.div.style.position = 'relative';
        this.div.style.height = 'auto';

        this.img = document.createElement('img');
        this.img.src = album.image;
        this.div.appendChild(this.img);
        this.img.onclick = () => {
            manager.library.play(album.track);
        };
        this.img.classList.add('large-album');

        this.menu = document.createElement('div');
        this.menu.style = `
        bottom: 12.4em;
        right: 0.5em;
        position: absolute;
        display: block;
        width: 10%;
        background: #000;
        border-radius: 100%;
        text-align: center;`;
        /*this.menu.style.bottom = '1050%';
        this.menu.style.right = '5%';
        this.menu.style.position = 'absolute';
        this.menu.style.display = 'block';
        this.menu.style.width = '10%';
        this.menu.style.background = 'rgba(0, 0, 0, 0.9)';*/
        this.menuButton = createP(this.menu, '\u22ee', () => {
            manager.remoteAlbumMenu.switch(this.menu, album);
        });
        this.menuButton.style = `
        top: -0.08em;
        left: 0.04em;
        position: relative;`;
        this.div.appendChild(this.menu);

        this.info = document.createElement('div');
        this.info.style.bottom = '100%';
        this.info.style.left = '0%';
        this.info.style.width = '100%';
        this.info.style.position = 'absolute';
        this.info.style.display = 'block';
        this.info.style.background = 'rgba(0, 0, 0, 0.8)';

        new UIHeader(this.info, album.title, 'h5', ['album-header']);
        new UIHeader(this.info, album.artist, 'h6', ['album-header']);

        this.div.appendChild(this.info);
    }
}

class UIShuffleButton {
    constructor(parent, manager, getTracks) {
        this.button = createP(parent, '\u29e2', () => {
            manager.library.scope2.update(getTracks());
            manager.library.play(manager.library.scope2.playing);
        });
        this.button.style.display = 'inline';
    }
}

class UIQueueItem {
    /**
     *
     * @param {HTMLElement} parent
     * @param {Track} track
     * @param {Number} state The state of the track (0 = past, 1 = current, 2 = upcoming)
     * @param {Function} onclick The function to be called upon clicking (namely, what plays the track)
     */
    constructor(parent, track, state, onclick) {
        this.div = document.createElement('div');
        this.div.classList.add('queue-item');

        this.image = document.createElement('img');
        this.image.src = track.album.image;
        this.image.classList.add('queue-item-image');

        this.title = document.createElement('h2');
        this.title.innerHTML = track.title;
        this.title.classList.add('queue-item-title');

        this.artist = document.createElement('h4');
        this.artist.innerHTML = track.rawArtistString;
        this.artist.classList.add('queue-item-artist');

        this.infoDiv = document.createElement('div');
        this.infoDiv.classList.add('queue-item-info');

        this.div.appendChild(this.image);
        this.infoDiv.appendChild(this.title);
        this.infoDiv.appendChild(this.artist);
        this.div.appendChild(this.infoDiv);

        switch (state) {
            case 0:
                this.div.classList.add('past');
                break;
            case 1:
                this.div.classList.add('current');
                break;
            case 2:
                break;
        }

        this.div.addEventListener('click', onclick);
        parent.appendChild(this.div);
    }
}

export {
    UITab,
    UITrack,
    UIAlbum,
    UITag,
    UITagSection,
    UIHeader,
    UIRemoteAlbum,
    UIShuffleButton,
    UIQueueItem,
};
