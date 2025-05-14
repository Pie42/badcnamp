import { getImageType, getLinkType, parseTralbumData } from '../../Util.js';
import FetchManager from '../bcpages/FetchManager.js';
import LocalSearchView from './LocalSearchView.js';

// currently in this file; unused
class SearchResult {
    constructor() {
        this.div = document.createElement('div');
        this.img = document.createElement('img');
        this.title = document.createElement('h2');
        this.artist = document.createElement('h3');
    }

    /**
     *
     * @param {Object} data Potentially asynchronous raw data to be used to setup the result
     * @param {Object} properties An object containing the nice names of properties (e.g. title) and their accessors (e.g. current.title)
     * @param {Function} onclick The function to be run when clicked, given the info from properties
     */
    async set(data, properties, onclick) {
        data = await data;
        this.properties = {};
        for (let i in properties) {
            let property = properties[i],
                accessor = property.accessor.split('.'),
                temp = data;
            for (let j of accessor) {
                temp = temp[j] || temp;
            }
            if (property.format) {
                temp = property.format(temp);
            }
            this.properties[i] = temp;
        }

        if (this.properties.image) {
            this.img.src = this.properties.image;
        } else {
            this.img.style.display = 'none';
        }
        if (this.properties.title) {
            this.title.innerText = this.properties.title;
        } else {
            this.title.style.display = 'none';
        }
        if (this.properties.artist) {
            this.artist.innerText = this.properties.artist;
        } else {
            this.artist.style.display = 'none';
        }

        this.div.addEventListener('click', () => onclick(this.properties));
    }
}
// this is a class meant to enable 3 things to happen:
// 1. you put in a link, press enter, and the album is
// added to the library or the tag or label page is
// opened up (the input on the left)
// 2. in local search mode, typing anything will
// (eventually fuzzy) search your library like the bar
// on the right currently does
// 3. in global search mode, typing anything will
// search bandcamp for that
// minor regression: links are being tested by the presence of the protocol (https://), but this shouldn't be much of a problem
export default class SearchBar {
    constructor(manager) {
        this.div = document.createElement('div');
        this.input = document.createElement('input');
        this.resultsDiv = document.createElement('div');
        this.manager = manager;
        this.localSearch = new LocalSearchView(this.manager);
        this.type = '';
        this.local = true;

        this.div.appendChild(this.input);
    }

    reset() {
        this.input.value = '';
        this.clear();
    }

    clear() {
        this.resultsDiv.innerHTML = '';
    }

    update(/*type*/) {
        let type = this.local ? 'local' : 'remote',
            alternate = getLinkType(this.input.value);
        if (type != this.type) {
            this.clear();
        }
        switch (type) {
            case 'link-album':
                this.append(
                    new SearchResult().set(
                        FetchManager.fetch(
                            this.input.value,
                            parseTralbumData,
                            (data) => data
                        ),
                        {
                            image: {
                                accessor: 'art_id',
                                format: (url) => getImageType(url, 3),
                            },
                            title: { accessor: 'current.title' },
                            artist: { accessor: 'artist' },
                            url: { accessor: 'url' },
                        },
                        (data) => {
                            this.manager.library.add(data.url);
                        }
                    )
                );
                break;
            case 'link-tag':
                this.append(
                    new SearchResult().set(
                        {
                            tag: this.input.value.match(
                                /\/tag\/([a-zA-Z\-]+)/
                            )[1],
                        },
                        {
                            title: {
                                accessor: 'tag',
                                format: (tag) =>
                                    `Browse music tagged as "${tag}" =>`,
                            },
                            tag: {
                                accessor: 'tag',
                            },
                        },
                        (data) => {
                            this.manager.switchUI('bctag', data.tag);
                        }
                    )
                );
                break;
            case 'local':
                this.localSearch.search(this.input.value);
                break;
        }
    }

    append(result) {
        this.resultsDiv.appendChild(result.div);
    }
}
