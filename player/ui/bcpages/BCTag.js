import FetchManager from './FetchManager.js';
import { parseFromDom } from '../../Util.js';
import {
    UITab,
    UIHeader,
    UIRemoteAlbum,
    UITagSection,
} from '../elements/UIElements.js';
import RemoteAlbum from './RemoteAlbum.js';

export default class BCTag {
    constructor(manager, tag) {
        this.manager = manager;
        this.div = document.createElement('div');
        //this.cache = {};
        this.tag = tag
            .replaceAll(' ', '-')
            .replaceAll(/[^a-zA-Z\-]/g, '')
            .replaceAll(/-+/g, '-');
        this.rawTag = tag;
        /*FetchManager.fetch(
            `https://bandcamp.com/tag/${tag}`,
            this.parse,
            this.populate.bind(this)
        );*/
        this.switch(this.tag);
    }

    async switch(tag) {
        let cached = this.manager.remoteCache.tags[tag];
        if (cached && Date.now() - cached[1] < 86400000) {
            this.populate(cached[0]);
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
        }
        else {
            data.dig_deeper = fullData.hub.tabs[0].dig_deeper;
        }
        data.subgenres = fullData.hub.subgenres;
        //console.log(fullData);
        return data;
    }

    populate(response) {
        window.data = response;
        this.albums = { collections: [], digDeeper: [] };
        //this.cache[this.tag] = response;
        let tabs = document.createElement('div');

        let collections = document.createElement('div'),
            //newReleases = document.createElement('div'),
            //newReleasesAlbums = document.createElement('div'),
            //bestSellers = document.createElement('div'),
            //bestSellersAlbums = document.createElement('div'),
            digDeeper = document.createElement('div'),
            digDeeperAlbums = document.createElement('div'),
            related = document.createElement('div'),
            title = document.createElement('h1');

        title.innerHTML = this.rawTag;
        this.div.appendChild(title);

        //collections.appendChild(newReleases);
        //collections.appendChild(bestSellers);

        //new UIHeader(newReleases, 'New Releases', 'h4');
        //new UIHeader(bestSellers, 'Best Sellers', 'h4');
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
                    let j = new RemoteAlbum(i);
                    this.albums.collections[n].push(j);
                    collectionAlbums.appendChild(
                        new UIRemoteAlbum(j, this.manager).div
                    );
                }
                collectionDiv.appendChild(collectionAlbums);
                collections.appendChild(collectionDiv);
            }

            // the tabs are only necessary if there are multiple of them
            new UITab(
                'Collections',
                () => {
                    digDeeper.style.display = 'none';
                    collections.style.display = 'block';
                },
                tabs
            );
            new UITab(
                'Dig Deeper',
                () => {
                    collections.style.display = 'none';
                    digDeeper.style.display = 'block';
                },
                tabs
            );
        }

        /*for (let i of response.collections[1].items) {
            let j = new RemoteAlbum(i);
            this.albums.collections[1].push(j);
            bestSellersAlbums.appendChild(
                new UIRemoteAlbum(j, this.manager).div
            );
        }
        bestSellers.appendChild(bestSellersAlbums);*/

        if (response.dig_deeper) {
            for (let i of response.dig_deeper.results[
                response.dig_deeper.initial_settings
            ].items) {
                let j = new RemoteAlbum(i);
                this.albums.digDeeper.push(j);
                digDeeperAlbums.appendChild(
                    new UIRemoteAlbum(j, this.manager).div
                );
            }
            digDeeper.appendChild(digDeeperAlbums);
            digDeeperAlbums.classList.add('carousel');
        }

        let relatedSection = new UITagSection(
            related,
            response.related.map((i) => i.name),
            this.manager,
            'bctag',
            'none'
        );
        relatedSection.div.firstChild.innerHTML = 'Related Tags';

        //newReleasesAlbums.classList.add('carousel');
        //bestSellersAlbums.classList.add('carousel');
        this.div.appendChild(tabs);
        this.div.appendChild(collections);
        this.div.appendChild(digDeeper);
        this.div.appendChild(related);
        return response;
    }
}

window.BCTag = BCTag;
