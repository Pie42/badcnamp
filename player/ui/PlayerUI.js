import { isOutdated } from '../Util.js';
import ScrobbleUI from './player/ScrobbleUI.js';

export default class PlayerUI {
    constructor(library) {
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.div.style.borderLeft = 'solid #0f0c0c';
        this.div.style.borderWidth = '1px';
        this.library = library;
        this.audio = library.audio;
        //this.scope = this.library.tracks;
        this.mode = 'random';
        // automatically queue (and fetch) tracks to reduce loading times
        this.autoQueue = true;
        //this.div.appendChild(this.audio);
        //this.audio.controls = true;
    }

    create() {
        let thumbnaildiv = document.createElement('div');
        thumbnaildiv.classList.add('thumbnail');
        let cover = document.createElement('img');
        cover.style.width = '50%';
        thumbnaildiv.appendChild(cover);
        this.div.appendChild(thumbnaildiv);
        cover.style.margin = '0 auto';
        cover.style.display = 'block';

        let favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);

        let title = document.createElement('h1');
        this.div.appendChild(title);
        let artist = document.createElement('h3');
        this.div.appendChild(artist);
        title.style.textAlign = artist.style.textAlign = 'center';
        artist.onclick = () => {
            if (this.library.playing) {
                this.browseui.switchUI('artist', this.library.playing.artist);
            }
        };
        let album = document.createElement('p');
        album.onclick = () => {
            if (this.library.playing) {
                this.browseui.switchUI('album', this.library.playing.album);
            }
        };
        this.div.appendChild(album);
        this.audio.onstalled = async () => {
            let t = this.audio.currentTime;
            //await this.library.refetch(this.library.playing.album);
            await this.library.play(
                this.library.playing,
                this.library.playingIndex
            );
            this.audio.currentTime = t;
            //this.audio.play();
        };

        this.scrobbleui = new ScrobbleUI(this);
        this.scrobbleui.registerEvents();
        this.div.appendChild(this.scrobbleui.div);

        this.audio.onloadedmetadata = () => {
            let playing = this.library.playing;
            cover.src = playing.album.image;
            favicon.href = playing.album.image;
            title.innerHTML = playing.title;
            artist.innerHTML = playing.rawArtist;
            album.innerHTML = `From "${playing.album.title}"`;
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtist,
                    artwork: [{ src: playing.album.image }],
                });
            }
        };
        this.audio.addEventListener('playing', () => {
            if ('mediaSession' in navigator) {
                let playing = this.library.playing;
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtist,
                    artwork: [{ src: playing.album.image }],
                });
            }
        });
        this.audio.onended = this.next.bind(this);
        this.div.appendChild(this.audio);
        this.audio.controls = true;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler(
                'seekbackward',
                function () {
                    this.audio.currentTime -= 5;
                }.bind(this)
            );
            navigator.mediaSession.setActionHandler(
                'seekforward',
                function () {
                    this.audio.currentTime += 5;
                }.bind(this)
            );
            navigator.mediaSession.setActionHandler(
                'previoustrack',
                this.prev.bind(this)
            );
            navigator.mediaSession.setActionHandler(
                'nexttrack',
                this.next.bind(this)
            );
        }

        return;
    }

    next() {
        /*let t = this.library.playing,
            k = this.library.playing,
            n = this.library.playingIndex,
            j = this.library.playingIndex;
        if (this.library.queue.length > 0) {
            let h = this.library.queue.shift();
            if (h.length) {
                k = h[0];
                n = h[1];
            } else {
                k = h;
                n = null;
            }
        } else if (this.library.scope.length > 1) {
            if (this.mode == 'random') {
                for (let i = 5; i > 0 && j == n; i--) {
                    n = (Math.random() * this.library.scope.length) | 0;
                    k = this.library.scope[n];
                }
            } else if (this.mode == 'all') {
                n = (n + 1) % this.library.scope.length;
                k = this.library.scope[n];
            } else if (this.mode == 'one') {
                // do nothing
            }
        }*/
        let k, n;
        if (this.library.queue.length > 0) {
            let h = this.library.queue.shift();
            if (h.length) {
                k = h[0];
                n = h[1];
            } else {
                k = h;
                n = null;
            }
        } else {
            [k, n] = this.getNextTrack(
                this.library.playing,
                this.library.playingIndex
            );
        }
        this.prepareNextTrack();
        //this.library.queue.push([nextTrack, nextIndex]);
        this.library.prev.unshift([
            this.library.playing,
            this.library.playingIndex,
        ]);
        this.library.play(k, n);
    }

    getNextTrack(playing, playingIndex) {
        let t = playing,
            k = playing,
            n = playingIndex,
            j = playingIndex;
        if (this.mode == 'random') {
            for (let i = 5; i > 0 && j == n; i--) {
                n = (Math.random() * this.library.scope.length) | 0;
                k = this.library.scope[n];
            }
        } else if (this.mode == 'all') {
            n = (n + 1) % this.library.scope.length;
            k = this.library.scope[n];
        } else if (this.mode == 'one') {
            // do nothing
        }
        return [k, n];
    }

    prepareNextTrack() {
        let temp;
        let [nextTrack, nextIndex] =
            this.library.queue.length > 0
                ? this.library.queue[0].length
                    ? [this.library.queue[0], null]
                    : this.library.queue[0]
                : ((temp = this.getNextTrack(k, n)),
                  this.library.queue.push(temp),
                  temp);
        if (isOutdated(nextTrack)) {
            this.library.refetch(nextTrack.album);
        }
    }

    prev() {
        if (this.audio.currentTime > 10) {
            this.audio.currentTime = 0;
        } else {
            if (this.library.prev.length > 0) {
                let p, n;
                let h = this.library.queue.shift();
                if (h.length) {
                    p = h[0];
                    n = h[1];
                } else {
                    p = h;
                    n = null;
                }
                this.library.play(p, n);
                this.library.queue.unshift([p, n]);
            }
        }
    }

    refresh() {}

    /**
     * Formats a time in seconds as a string.
     * @param {Number} t Current time
     * @param {Number} l Total length of the song (for choosing whether to include the hour digit)
     * @returns {String} The formatted time
     */
    tformat(t, l) {
        let hr = '',
            mn = ('0' + (((t / 60) | 0) % 60) + ':').slice(-3),
            sc = ('0' + (t % 60 | 0)).slice(-2);
        if (l > 3600) {
            hr = ('0' + ((t / 3600) | 0) + ':').slice(-3);
        }
        return hr + mn + sc;
    }
}
