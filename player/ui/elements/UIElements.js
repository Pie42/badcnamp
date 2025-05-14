import {
    createP,
    createLongP,
    sortArray,
    getImageType,
    createElement,
} from '../../Util.js';

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
        albumTitle.firstChild.style.lineHeight = '19px';
        this.div.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
        this.div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            manager.albumMenu.switch(arrowP, album, {
                x: e.clientX,
                y: e.clientY,
            });
        });
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
        tagHeader.innerText = 'Tags';
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
        header.innerText = title;
        header.classList.add(...classes);
        parent.appendChild(header);
    }
}

class UIRemoteAlbum {
    constructor(album, manager, playable = true) {
        this.div = document.createElement('div');
        this.div.style.display = 'inline';
        this.div.style.position = 'relative';
        //this.div.style.height = 'auto';
        this.div.classList.add('large-album');
        if (album.data.review) {
            this.div.title = `"${album.data.review}" - ${album.data.name}`;
        }

        this.img = document.createElement('img');
        this.img.src = album.image;
        this.img.loading = 'lazy';
        this.div.appendChild(this.img);
        this.img.onclick = async () => {
            /*let track = await album.previewTrack;
            console.log(track);
            manager.library.play(track);
            manager.library.scope2.notInQueue = true;*/
            await album.loadAll();
            manager.switchUI('bcalbum', album);
        };
        this.img.classList.add('large-album');

        this.menu = document.createElement('div');
        this.menu.style = `
        bottom: 27vh;
        right: 1vh;
        position: absolute;
        display: block;
        width: 10%;
        background: #000;
        border-radius: 100%;
        text-align: center;`;
        this.menuButton = createP(this.menu, '\u22ee', () => {
            manager.remoteAlbumMenu.switch(this.menu, album);
        });
        this.menuButton.style = `
        top: -0.08em;
        left: 0.02em;
        position: relative;
        font-size: 2.3vh;`;
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
    /**
     *
     * @param {HTMLElement} parent
     * @param {BrowseUI | PlayerUI} manager
     * @param {Function} getTracks
     */
    constructor(parent, manager, getTracks) {
        this.button = createP(parent, /*'\u29e2'*/ ' (Shuffle)', async () => {
            manager.library.scope2.update(await getTracks());
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
    constructor(parent, manager, track, state, onclick, creator) {
        this.div = document.createElement('div');
        this.div.classList.add('queue-item');
        this.div.setAttribute('draggable', 'true');

        this.dropTarget = uiQueueDropTarget(creator, this);
        //this.div.appendChild(this.dropTarget);

        this.image = document.createElement('img');
        this.image.src = getImageType(track.album.image, 101);
        this.image.classList.add('queue-item-image');

        this.title = document.createElement('h2');
        this.title.innerText = track.title;
        this.title.classList.add('queue-item-title');

        this.artist = document.createElement('h4');
        this.artist.innerText = track.rawArtistString;
        this.artist.classList.add('queue-item-artist');

        this.infoDiv = document.createElement('div');
        this.infoDiv.classList.add('queue-item-info');

        this.menuDiv = document.createElement('div');
        this.menuDiv.classList.add('queue-item-menu', 'pointer-hover');

        this.menu = createP(this.menuDiv, '\u22ee', (e) => {
            e.stopPropagation();
            manager.trackMenu.switch(this.menu, track);
        });
        this.menuDiv.onclick = this.menu.onclick;

        this.div.appendChild(this.image);
        this.infoDiv.appendChild(this.title);
        this.infoDiv.appendChild(this.artist);
        this.div.appendChild(this.infoDiv);
        this.menuDiv.appendChild(this.menu);
        this.div.appendChild(this.menuDiv);

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

        this.div.addEventListener('dragstart', (ev) => {
            let elementIndex = Array.prototype.indexOf.call(
                creator.queueDiv.children,
                this.div
            );
            creator.dragIndex = elementIndex;
            ev.dataTransfer.setData(
                'application/x-queue-data',
                JSON.stringify([creator.items.indexOf(this), elementIndex])
            );
            this.div.dataset.height =
                this.div.getBoundingClientRect().height + 'px';
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.dropEffect = 'move';
        });

        this.div.ondragend = this.dropTarget.ondragend;
        let first = false;
        this.div.ondragover = () =>
            first ? (first = false) : (this.dropTarget.style.height = '0px');
        this.div.ondragenter = (e) => {
            first = true;
            this.dropTarget.ondragenter(e);
        };

        if (track.album.temporary) {
            this.div.classList.add('temporary');
            this.div.title =
                'This track is temporary, and will be removed from the queue when the page reloads! Add this album to your library to fix that.';
        }
        this.div.addEventListener('click', onclick);
        parent.appendChild(this.dropTarget);
        parent.appendChild(this.div);
    }
}

function uiQueueDropTarget(ui, forItem) {
    let isInside = false,
        div = createElement('div', null, {
            ondragenter: (e) => {
                if (e.dataTransfer.types.includes('application/x-queue-data')) {
                    //console.log(e, e.fromElement);
                    e.preventDefault();
                    if (
                        Math.abs(
                            Array.prototype.indexOf.call(
                                ui.queueDiv.children,
                                div
                            ) - ui.dragIndex
                        ) > 2
                    ) {
                        div.style.height =
                            forItem.div.getBoundingClientRect().height + 'px';
                    }
                    //e.srcElement.dataset.height;
                    //console.log(div.style.height, e.srcElement.dataset.height, e.srcElement.dataset);
                    e.dataTransfer.dropEffect = 'move';
                }
            },
            ondragover: (e) => e.preventDefault(),
            ondragleave: (e) => {
                e.preventDefault();
                isInside = false;
                div.style.height = '0px';
                //setTimeout(() => isInside || (div.style.height = '0px'), 20);
            },
            ondrop: (e) => {
                div.style.height = '0px';
                if (
                    !e.dataTransfer.types.includes('application/x-queue-data')
                ) {
                    console.error('somehow this broke');
                    return;
                }
                e.preventDefault();
                let data = JSON.parse(
                        e.dataTransfer.getData('application/x-queue-data')
                    ),
                    index = data[0],
                    elementIndex = data[1],
                    newIndex = ui.items.indexOf(forItem),
                    queueIndex = ui.scope.index,
                    item = ui.items[index];
                newIndex -= index < newIndex;
                // (possibly to change) if the item is current, set the current item to be that item still
                ui.scope.queue.splice(
                    newIndex,
                    0,
                    ...ui.scope.queue.splice(index, 1)
                );

                ui.items.splice(newIndex, 0, ...ui.items.splice(index, 1));
                if (queueIndex == index) {
                    ui.scope.index = newIndex;
                    if (index > newIndex) {
                        ui.items[index].div.classList.remove('past');
                    }
                } else if (queueIndex < index && queueIndex >= newIndex) {
                    ui.scope.index++;
                    item.div.classList.add('past');
                } else if (queueIndex > index && queueIndex <= newIndex) {
                    ui.scope.index--;
                    item.div.classList.remove('past');
                }
                ui.scope.updateIndex();
                ui.queueDiv.insertBefore(item.dropTarget, div);
                ui.queueDiv.insertBefore(item.div, div);
            },
            ondragend: (e) => {
                e.preventDefault();
                div.style.height = '0px';
            },
        });
    return div;
}

/**
 *
 * @param {*} data Field name: starting value
 * @param {Function} callback What to do once saved (if saved)
 * @param {*} pos Defaults to middle
 * @param {*} titles Gives data about keys, and shows what keys you want displayed
 */
function uiInfoPopup(data, callback, pos, titles) {
    if (!titles) {
        titles = Object.fromEntries(
            Object.keys(data).map((i) => [i, '\u200b'])
        );
    }
    let div = document.createElement('div'),
        inputs = {};
    for (let i in data) {
        if (titles[i]) {
            let itemDiv = document.createElement('div'),
                label = document.createElement('p'),
                input = document.createElement('input');
            label.innerText = i + ': ';
            label.title = titles[i];
            input.value = data[i];
            inputs[i] = input;

            itemDiv.appendChild(label);
            itemDiv.appendChild(input);
            div.appendChild(itemDiv);
        }
    }

    let cancelButton = document.createElement('button'),
        saveButton = document.createElement('button');

    cancelButton.onclick = () => {
        document.body.removeChild(div);
    };
    cancelButton.innerText = 'Cancel';
    saveButton.onclick = () => {
        document.body.removeChild(div);
        let finalData = {};
        for (let i in inputs) {
            finalData[i] = inputs[i].value;
        }
        callback(finalData);
    };
    saveButton.innerText = 'Save';

    div.append(saveButton, cancelButton);

    div.style = `background: var(--bg-color);
    border: var(--text-color) solid 1px;
    border-radius: 4px;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: fit-content;
    max-height: fit-content;
    z-index: 2;
    margin: auto;
    line-height: 0;`;
    document.body.appendChild(div);
}

/*class UIRemoteImage {
    constructor(parent, id, type) {
        this.img = document.createElement('img');
        this.img.src = `https://f4.bcbits.com/img/a${id}_${type}.jpg`;
        parent.appendChild(this.img);
    }
}*/

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
    uiInfoPopup,
};
