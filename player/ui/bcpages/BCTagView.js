import FetchManager from './FetchManager.js';
import { createP, parseFromDom } from '../../Util.js';
import {
    UITab,
    UIHeader,
    UIRemoteAlbum,
    UITagSection,
} from '../elements/UIElements.js';
import RemoteAlbum from './RemoteAlbum.js';

export default class BCTagView {
    constructor(manager, tag) {
        this.manager = manager;
        this.div = document.createElement('div');
        this.tag = tag
            .replaceAll(' ', '-')
            .replaceAll(/[^a-zA-Z0-9-]/g, '')
            .replaceAll(/-+/g, '-');
        this.rawTag = tag;
        this.switch(this.tag);
    }

    async switch(tag) {
        let cached = this.manager.remoteCache.tags[tag];
        if (cached && Date.now() - cached[1] < 86400000) {
            this.data = cached[0];
            this.populate(this.data);
        } else {
            this.data = await FetchManager.fetch(
                `https://bandcamp.com/tag/${tag}`,
                this.parse,
                this.populate.bind(this)
            );
            this.manager.remoteCache.tags[tag] = [this.data, Date.now()];
        }
    }

    parse(response) {
        let fullData = JSON.parse(
                parseFromDom(
                    response.match(/<div id="pagedata" data-blob="(.+?)"/)[1]
                )
            ),
            data = {};
        window.fullData = fullData;
        data.related = fullData.hub.related_tags;
        if (fullData.hub.tabs.length > 1) {
            data.collections = fullData.hub.tabs[0].collections;
            data.dig_deeper = fullData.hub.tabs[1].dig_deeper;
        } else {
            data.dig_deeper = fullData.hub.tabs[0].dig_deeper;
        }
        data.subgenres = fullData.hub.subgenres;
        return data;
    }

    populate(response) {
        window.data = response;
        this.albums = { collections: [], digDeeper: [] };
        let tabs = document.createElement('div');
        tabs.classList.add('tab-group');
        tabs.style.marginBottom = '1vh';

        let collections = document.createElement('div'),
            digDeeper = document.createElement('div'),
            digDeeperAlbums = document.createElement('div'),
            related = document.createElement('div'),
            title = document.createElement('h1');

        title.innerText = this.rawTag;
        this.div.appendChild(title);
        if (response.collections) {
            digDeeper.style.display = 'none';
            response.collections = response.collections.filter(
                (i) => i.items[0]['audio_url']
            );
            for (let collection of response.collections) {
                let collectionDiv = document.createElement('div'),
                    collectionAlbums = document.createElement('div'),
                    n = this.albums.collections.push([]) - 1;
                new UIHeader(collectionDiv, collection.render.title, 'h4');
                collectionAlbums.classList.add('carousel');
                for (let i of collection.items) {
                    let j = RemoteAlbum.fromFull(i, this.manager.library);
                    this.albums.collections[n].push(j);
                    collectionAlbums.appendChild(
                        new UIRemoteAlbum(j, this.manager).div
                    );
                }
                collectionDiv.appendChild(collectionAlbums);
                collections.appendChild(collectionDiv);
            }

            // the tabs are only necessary if there are multiple of them
            let collectionsTab = new UITab(
                    'Collections',
                    () => {
                        digDeeper.style.display = 'none';
                        collections.style.display = 'block';
                        selectedTab.classList.remove('selected');
                        selectedTab = collectionsTab.tab;
                        selectedTab.classList.add('selected');
                    },
                    tabs,
                    ['browse-tab']
                ),
                digDeeperTab = new UITab(
                    'Dig Deeper',
                    () => {
                        collections.style.display = 'none';
                        digDeeper.style.display = 'block';
                        selectedTab.classList.remove('selected');
                        selectedTab = digDeeperTab.tab;
                        selectedTab.classList.add('selected');
                    },
                    tabs,
                    ['browse-tab']
                ),
                selectedTab = collectionsTab.tab;
            selectedTab.classList.add('selected');
        }

        if (response.dig_deeper) {
            for (let i of response.dig_deeper.results[
                response.dig_deeper.initial_settings
            ].items) {
                let j = RemoteAlbum.fromFull(i, this.manager.library);
                this.albums.digDeeper.push(j);
                digDeeperAlbums.appendChild(
                    new UIRemoteAlbum(j, this.manager).div
                );
            }
            digDeeper.appendChild(digDeeperAlbums);
            let page = 1,
                initialSettings = response.dig_deeper.initial_settings,
                moreButton = createP(digDeeper, 'More Albums', () => {
                    page++;
                    fetch('https://bandcamp.com/api/hub/2/dig_deeper', {
                        method: 'POST',
                        body: JSON.stringify({
                            filters: JSON.parse(initialSettings),
                            page,
                        }),
                    })
                        .then((i) => i.json())
                        .then((i) => {
                            if (!i.ok) {
                                moreButton.style.display = 'none';
                                alert('error while loading more stuff :(');
                                console.log(i);
                                return;
                            }
                            let items = i.items;
                            response.dig_deeper.results[
                                initialSettings
                            ].items.push(...items);
                            for (let item of items) {
                                let j = RemoteAlbum.fromFull(
                                    item,
                                    this.manager.library
                                );
                                this.albums.digDeeper.push(j);
                                digDeeperAlbums.appendChild(
                                    new UIRemoteAlbum(j, this.manager).div
                                );
                            }
                            if (!i.more_available)
                                moreButton.style.display = 'none';
                        });
                });
            moreButton.style = `
                width: -webkit-fill-available;
                text-align: center;
                border: 1px solid var(--text-color);
                border-radius: 4px;
                font-size: 3vh;`;
            //digDeeperAlbums.classList.add('carousel');
        }

        let relatedSection = new UITagSection(
            related,
            response.related.map((i) => i.name),
            this.manager,
            'bctag',
            'none'
        );
        relatedSection.div.firstChild.innerHTML = 'Related Tags';

        this.div.appendChild(tabs);
        this.div.appendChild(collections);
        this.div.appendChild(digDeeper);
        this.div.appendChild(related);
        return response;
    }
}

//window.BCTag = BCTag;
