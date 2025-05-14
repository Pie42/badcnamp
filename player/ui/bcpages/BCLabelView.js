import { createElement, parseFromDom, getImageType } from '../../Util.js';
import { UIRemoteAlbum, UIShuffleButton } from '../elements/UIElements.js';
import FetchManager from './FetchManager.js';
import RemoteAlbum from './RemoteAlbum.js';

export default class BCLabelView {
    constructor(manager, link) {
        this.manager = manager;
        //this.link = /\/music$/.test(link) ? link : link + 'music';
        this.link = link;

        this.div = document.createElement('div');
        this.switch(this.link);
    }

    async switch(link) {
        let cached = this.manager.remoteCache.labels[link];
        if (cached && Date.now() - cached[1] < 86400000) {
            this.data = cached[0];
            this.populate(this.data);
        } else {
            this.data = await FetchManager.fetch(
                link + 'music',
                this.parse.bind(this),
                this.populate.bind(this)
            );
            this.manager.remoteCache.labels[link] = [this.data, Date.now()];
        }
    }

    async parse(data) {
        let parsedData = {
                artist: data.match(/<span class="title">(.+?)<\/span>/)[1],
                location: data.match(
                    /<span class="location.+?>(.+?)<\/span>/
                )[1],
                image: data.match(/<img src="(.+?)" class="band-photo"/)?.[1],
                header: data.match(
                    /class="desktop-header".+?<img src="(.+?)"/s
                )?.[1],
            },
            rawItemData = data.match(
                /<ol\s+id="music-grid".*?>(.+?)<\/ol>/s
            )?.[1];
        if (!rawItemData) {
            this.manager.switchUI(
                'bcalbum',
                await RemoteAlbum.fromLink(this.link),
                false
            );
            return;
        }
        let items = [...rawItemData.matchAll(/<li.+?>(.+?)<\/li>/gs)],
            parsedItems = items.map((i) => {
                i = i[1];
                return {
                    link: this.link + i.match(/<a href="\/(.+?)">/s)[1],
                    image: (i.match(/<img src="(.+?)"/s) ||
                        i.match(
                            /<img class="lazy".+?data-original="(.+?)"/
                        ))[1],
                    imageIsLazy: /class="lazy"/.test(i),
                    title: parseFromDom(
                        // made to deal with when there is also an artist
                        i.match(/<p class="title">(.+?)<(?:\/p|br)>/s)[1].trim()
                    ),
                    artist: parseFromDom(
                        (
                            i.match(
                                /<span class="artist-override">(.+?)<\/span>/s
                            )?.[1] || parsedData.artist
                        ).trim()
                    ),
                    type: i.match(/<a href="\/(track|album)\//)[1],
                };
            });
        parsedData.items = parsedItems;
        console.log(parsedData);
        return parsedData;
    }

    populate(data) {
        if (!data) return;
        this.albums = [];

        /*let title = document.createElement('h1'),
            location = document.createElement('h3'),
            image = document.createElement('img'),
            albums = document.createElement('div');

        title.innerText = data.artist;*/
        // header
        data.header &&
            createElement('img', this.div, {
                src: data.header,
                loading: 'lazy',
            });
        // image
        data.image &&
            createElement('img', this.div, {
                src: getImageType(data.image, 23),
                classes: ['large-album'],
                loading: 'lazy',
            });
        // title
        createElement('h1', this.div, { innerText: data.artist });
        new UIShuffleButton(this.div, this.manager, async () => {
            if (!this.albums.length) return [];
            let albums = [...this.albums],
                j,
                k,
                len = albums.length;
            for (let i = 0; i < albums.length; i++) {
                j = (Math.random() * (len - i)) | 0;
                k = albums[j + i];
                albums[j + i] = albums[i];
                albums[i] = k;
            }
            async function* loadAllAlbums(albums) {
                for (let i of albums) {
                    await i.loadAll();
                    yield i.tracks;
                }
            }

            let generator = loadAllAlbums(albums),
                initialTracks = await generator.next(),
                interval = setInterval(async () => {
                    let next = await generator.next();
                    if (next.done) {
                        clearInterval(interval);
                        return;
                    }
                    this.manager.library.scope2.appendToShuffle(next.value);
                }, 5000);
            return initialTracks.value;
        });
        // location
        createElement('h4', this.div, { innerText: data.location });
        // albums and album div
        createElement('div', this.div, {
            children: data.items.map((i) => {
                return {
                    tag: 'div',
                    properties: {
                        oncreate: (e) => {
                            let album = RemoteAlbum.fromMinimal(
                                i,
                                this.manager.library
                            );
                            this.albums.push(album);
                            e.appendChild(
                                new UIRemoteAlbum(album, this.manager).div
                            );
                        },
                        style: 'display: inline;',
                    },
                };
            }),
        });

        return data;
    }
}
