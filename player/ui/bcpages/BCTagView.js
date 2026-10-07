import { createP, parseFromDom } from '../../Util.js';
import {
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
        this.cursor = '*';
    }

    async switch(tag) {
        let cached = this.manager.remoteCache.tags[tag];
        if (cached && Date.now() - cached[1] < 86400000) {
            this.data = cached[0];
            this.populate(this.data);
        } else {
            /*this.data = await FetchManager.fetch(
                'https://bandcamp.com/api/discover/1/discover_web',
                this.parse,
                this.populate.bind(this),
                'json',
                {
                    body: JSON.stringify({
                        category_id: 1, // digital music
                        cursor: '*', // '*' = first page, next page is response.cursor
                        followed_bands: false, // only works if logged in
                        geoname_id: 0, // used to narrow down location with opaque numbers
                        include_result_types: ['a', 's'],
                        size: 60, // number of results
                        slice: 'top', // options are 'top', 'new', 'rand' (work as expected)
                        tag_norm_names: [tag], // can put more tags in to narrow down results
                        time_facet_id: null, // 0 is today, 1-7 are this week - 6 weeks ago, null is 'fresh'
                    }),
                    method: 'POST',
                }
            );*/
            let top = fetch('https://bandcamp.com/api/discover/1/discover_web',
                {
                    body: JSON.stringify({
                        category_id: 1, // digital music
                        cursor: '*', // '*' = first page, next page is response.cursor
                        followed_bands: false, // only works if logged in
                        geoname_id: 0, // used to narrow down location with opaque numbers
                        include_result_types: ['a', 's'],
                        size: 60, // number of results
                        slice: 'top', // options are 'top', 'new', 'rand' (work as expected)
                        tag_norm_names: [tag], // can put more tags in to narrow down results
                        time_facet_id: null, // 0 is today, 1-7 are this week - 6 weeks ago, null is 'fresh'
                    }),
                    method: 'POST',
                }
            ).then(i => i.json()),
                related = fetch('https://bandcamp.com/api/tag_search/2/related_tags',
                    {
                        body: JSON.stringify({
                            combo: true,
                            size: 20,
                            tag_names: [tag],
                        }),
                        method: 'POST',
                    }
                ).then(i => i.json());
            this.data = await Promise.all([top, related]).then(i => {
                let top = i[0],
                    related = i[1];
                this.cursor = top.cursor;
                return {
                    top,
                    related,
                };
            });
            this.populate(this.data);
            this.manager.remoteCache.tags[tag] = [this.data, Date.now()];
        }
    }

    parse(response) {
        console.log(response);
        let fullData = JSON.parse(
                parseFromDom(
                    response.match(/<div id="pagedata" data-blob="(.+?)"/)[1]
                )
            ),
            data = {};
        window.fullData = fullData;
        // related tags can be gotten from a POST request to https://bandcamp.com/api/tag_search/2/related_tags with the body {combo: true, size: 20, tag_names: [tag]}
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
        this.albums = { collections: [], digDeeper: [] };
        let tabs = document.createElement('div');
        tabs.classList.add('tab-group');
        tabs.style.marginBottom = '1vh';



        let digDeeper = document.createElement('div'),
            digDeeperAlbums = document.createElement('div'),
            related = document.createElement('div'),
            title = document.createElement('h1');

        title.innerText = this.rawTag;
        this.div.appendChild(title);

        for (let i of response.top.results) {
            let j = RemoteAlbum.fromFull(i, this.manager.library);
            this.albums.digDeeper.push(j);
            digDeeperAlbums.appendChild(
                new UIRemoteAlbum(j, this.manager).div
            );
        }
        digDeeper.appendChild(digDeeperAlbums);
        let moreButton = createP(digDeeper, 'More Albums', () => {
                fetch('https://bandcamp.com/api/discover/1/discover_web',
                {
                    body: JSON.stringify({
                        category_id: 1, // digital music
                        cursor: this.cursor, // '*' = first page, next page is response.cursor
                        followed_bands: false, // only works if logged in
                        geoname_id: 0, // used to narrow down location with opaque numbers
                        include_result_types: ['a', 's'],
                        size: 60, // number of results
                        slice: 'top', // options are 'top', 'new', 'rand' (work as expected)
                        tag_norm_names: [this.tag], // can put more tags in to narrow down results
                        time_facet_id: null, // 0 is today, 1-7 are this week - 6 weeks ago, null is 'fresh'
                    }),
                    method: 'POST',
                })
                    .then((i) => i.json())
                    .then((i) => {
                        if (!i.results || !i.results.length) {
                            moreButton.style.display = 'none';
                            alert('error while loading more stuff :(');
                            console.log(i);
                            return;
                        }
                        let items = i.results;
                        response.top.results.push(...items);
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
                        this.cursor = i.cursor;
                        //if (!i.more_available)
                            //moreButton.style.display = 'none';
                    });
            });
        moreButton.style = `
            width: -webkit-fill-available;
            text-align: center;
            border: 1px solid var(--text-color);
            border-radius: 4px;
            font-size: 3vh;`;

        let relatedSection = new UITagSection(
            related,
            response.related.single_results[0].related_tags.map((i) => i.name),
            this.manager,
            'bctag',
            'none'
        );
        relatedSection.div.firstChild.innerHTML = 'Related Tags';

        this.div.appendChild(tabs);
        this.div.appendChild(related);
        this.div.appendChild(document.createElement('br'));
        this.div.appendChild(digDeeper);
        //digDeeperAlbums.classList.add('carousel');
    }
}

//window.BCTag = BCTag;
