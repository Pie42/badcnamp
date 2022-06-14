import { createP } from '../Util.js';
import { isOutdated } from '../Util.js';
import ControlsUI from './player/ControlsUI.js';
import PiPUI from './player/PiPUI.js';
import QueueUI from './player/QueueUI.js';
import ScrobbleUI from './player/ScrobbleUI.js';

export default class PlayerUI {
    constructor(library) {
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.div.style.borderLeft = 'solid #0f0c0c';
        this.div.style.borderWidth = '1px';
        this.playerDiv = document.createElement('div');
        //this.p
        this.div.appendChild(this.playerDiv);
        this.cover = document.createElement('img');
        this.library = library;
        this.audio = library.audio;
        //this.scope = this.library.tracks;
        this.mode = 'random';
        // automatically queue (and fetch) tracks to reduce loading times
        this.autoQueue = true;
        //this.div.appendChild(this.audio);
        //this.audio.controls = true;

        // the currently visible div
        this.currentDiv = this.playerDiv;
    }

    create() {
        let thumbnaildiv = document.createElement('div');
        thumbnaildiv.classList.add('thumbnail');
        //let cover = document.createElement('img');
        let cover = this.cover;
        cover.crossOrigin = 'Anonymous';
        cover.style.width = '50%';
        thumbnaildiv.appendChild(cover);
        this.playerDiv.appendChild(thumbnaildiv);
        cover.style.margin = '0 auto';
        cover.style.display = 'block';

        let favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);

        let title = document.createElement('h1');
        this.playerDiv.appendChild(title);
        //holds h3 elements
        let artist = document.createElement('div');
        artist.style.display = 'block';
        this.playerDiv.appendChild(artist);
        title.style.textAlign = artist.style.textAlign = 'center';
        /*artist.onclick = () => {
            if (this.library.playing) {
                this.browseui.switchUI('artist', this.library.playing.artist);
            }
        };*/
        let album = document.createElement('p');
        album.onclick = () => {
            if (this.library.playing) {
                this.browseui.switchUI('album', this.library.playing.album);
            }
        };
        this.playerDiv.appendChild(album);
        this.audio.onstalled = async () => {
            let t = this.audio.currentTime;
            await this.library.refetch(this.library.playing.album);
            await this.library.play(
                this.library.playing,
                this.library.playingIndex
            );
            this.audio.currentTime = t;
            //this.audio.play();
        };

        this.audio.addEventListener('error', async () => {
            let t = this.audio.currentTime;
            await this.library.refetch(this.library.playing.album);
            await this.library.play(
                this.library.playing,
                this.library.playingIndex
            );
            this.audio.currentTime = t;
        });

        this.scrobbleui = new ScrobbleUI(this);
        this.scrobbleui.registerEvents();
        this.div.appendChild(this.scrobbleui.div);

        this.pipui = new PiPUI(this);
        this.pipui.registerEvents();
        this.div.appendChild(this.pipui.div);

        this.controlsui = new ControlsUI(this);
        this.playerDiv.appendChild(this.controlsui.div);
        this.playerDiv.appendChild(this.audio);

        this.queueui = new QueueUI(this);
        this.queueui.registerEvents();
        this.div.appendChild(this.queueui.div);
        this.queueui.create();

        this.queueButton = createP(this.playerDiv, 'View Queue', () => {
            this.switchUI('queue');
        });

        this.audio.onloadedmetadata = () => {
            let playing = this.library.playing;
            cover.src = playing.album.image;
            favicon.href = playing.album.image;
            title.innerHTML = playing.title;
            //artist.innerHTML = playing.rawArtistString;
            // fastest way as per https://jsben.ch/DwfAd
            // actually not anymore but w/e
            artist.innerHTML = '';

            for (let i in playing.rawArtists.splitters) {
                let currentArtist = playing.rawArtists.splitters[i],
                    artisth3 = document.createElement('h3');
                artisth3.style.display = 'inline';
                artisth3.innerHTML = currentArtist;
                if (+i % 2 == 0) {
                    artisth3.onclick = () => {
                        if (this.library.playing) {
                            this.browseui.switchUI(
                                'artist',
                                currentArtist.toLocaleLowerCase()
                            );
                        }
                    };
                }
                artist.appendChild(artisth3);
            }
            album.innerHTML = `From "${playing.album.title}"`;
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtistString,
                    artwork: [{ src: playing.album.image }],
                });
            }
        };
        this.audio.addEventListener('playing', () => {
            if ('mediaSession' in navigator) {
                let playing = this.library.playing;
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtistString,
                    album: playing.album.title,
                    artwork: [{ src: playing.album.image }],
                });
            }
        });
        //this.audio.onended = this.next.bind(this);
        this.audio.addEventListener('ended', () => {
            this.library.playing.plays++;
            this.next();
        });
        this.audio.addEventListener('play', () => {
            this.library.scope2.updateTitle();
        });
        this.audio.addEventListener('pause', () => {
            document.title = badcnamp.state.uimanager.browseui.title;
        });
        //document.title = badcnamp.state.uimanager.browseui.title;
        //this.playerDiv.appendChild(this.audio);
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
        //let [k, n] = this.library.scope2.nextTrack;
        let k = this.library.scope2.finishTrack();
        /*if (k == undefined) {
            this.library.scope2.loop();
            k = this.library.scope2.nextTrack;
        }
        /*if (this.library.queue.length > 0) {
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
        this.library.prev.unshift([
            this.library.playing,
            this.library.playingIndex,
        ]);*/
        this.library.play(k);
        this.prepareNextTrack();
        //this.library.queue.push([nextTrack, nextIndex]);
    }

    getNextTrack(playing, playingIndex) {
        /*let t = playing,
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
        return [k, n];*/
        return this.library.scope2.nextTrack;
    }

    prepareNextTrack() {
        let temp;
        let nextTrack = this.library.scope2.nextTrack;
        /*this.library.queue.length > 0
                ? this.library.queue[0].length
                    ? [this.library.queue[0], null]
                    : this.library.queue[0]
                : ((temp = this.getNextTrack(
                      this.library.playing,
                      this.library.playingIndex
                  )),
                  this.library.queue.push(temp),
                  temp);*/
        if (isOutdated(nextTrack)) {
            this.library.refetch(nextTrack.album);
        }
    }

    prev() {
        if (this.audio.currentTime > 10) {
            this.audio.currentTime = 0;
        } else {
            /*if (this.library.prev.length > 0) {
                let p, n;
                let h = this.library.prev.shift();
                if (h.length) {
                    p = h[0];
                    n = h[1];
                } else {
                    p = h;
                    n = null;
                }
                this.library.play(p, n);
                this.library.queue.unshift([p, n]);
            }*/
            let p = this.library.scope2.prev();
            this.library.play(p);
        }
    }

    forwards() {
        this.audio.currentTime += 5;
    }

    back() {
        this.audio.currentTime -= 5;
    }

    refresh() {}

    switchUI(newUI) {
        this.currentDiv.style.display = 'none';
        switch (newUI) {
            case 'default':
                this.currentDiv = this.playerDiv;
                this.currentDiv.style.display = 'block';
                break;
            case 'queue':
                this.currentDiv = this.queueui.div;
                this.currentDiv.style.display = 'block';
                this.queueui.current.div.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                break;
        }
    }

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
