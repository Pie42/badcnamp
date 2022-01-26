export default class PlayerUI {
    constructor(library) {
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.library = library;
        this.audio = library.audio;
        this.scope = this.library.tracks;
        this.mode = 'random';
        //this.div.appendChild(this.audio);
        //this.audio.controls = true;
    }

    create() {
        let thumbnaildiv = document.createElement('div');
        thumbnaildiv.classList.add('thumbnail');
        let cover = document.createElement('img');
        cover.style.width = '80%';
        thumbnaildiv.appendChild(cover);
        this.div.appendChild(thumbnaildiv);
        cover.style.margin = '0 auto';
        cover.style.display = 'block';

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
            await this.library.play(this.library.playing);
            this.audio.currentTime = t;
            //this.audio.play();
        };
        //scrobbling stuff
        let scrbldiv = document.createElement('div');
        scrbldiv.classList.add('ctl');
        scrbldiv.classList.add('tracktitle');
        //this.audio.classList.add('ctl');
        let scrblartist = document.createElement('p');
        scrblartist.id = 'newPlayerArtistName';
        let scrbltitle = document.createElement('a');
        let scrblalbum = document.createElement('div');
        let cTime = document.createElement('p');
        cTime.classList.add('start');
        cTime.style.display = 'none';
        let duration = document.createElement('p');
        duration.classList.add('finish');
        duration.style.display = 'none';
        let pausebutton = document.createElement('div');
        pausebutton.style.width = pausebutton.style.height = '0%';
        pausebutton.classList.add('btnStop');
        scrbldiv.appendChild(cTime);
        scrbldiv.appendChild(duration);
        scrbldiv.appendChild(scrblartist);
        scrbldiv.appendChild(scrbltitle);
        scrbldiv.appendChild(scrblalbum);
        scrbldiv.style.display = 'none';
        this.div.appendChild(scrbldiv);
        //this.div.appendChild(pausebutton);
        this.audio.onloadedmetadata = () => {
            let playing = this.library.playing;
            cover.src = playing.album.image;
            title.innerHTML = playing.title;
            artist.innerHTML = playing.rawArtist;
            scrbltitle.innerHTML = playing.title;
            scrblartist.innerHTML = playing.rawArtist;
            album.innerHTML = `From "${playing.album.title}"`;
            scrblalbum.setAttribute('title', playing.album.title);
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtist,
                    artwork: [{ src: playing.album.image }],
                });
            }
            duration.innerHTML = this.tformat(
                this.audio.duration,
                this.audio.duration
            );
        };
        this.audio.onplaying = () => {
            if ('mediaSession' in navigator) {
                let playing = this.library.playing;
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtist,
                    artwork: [{ src: playing.album.image }],
                });
            }
            //pausebutton.classList.remove('btnStop');
            this.div.appendChild(pausebutton);
        };
        this.audio.onpause = () => {
            //pausebutton.classList.add('btnStop');
            try {
                this.div.removeChild(pausebutton);
            } catch (e) {}
        };
        this.audio.ontimeupdate = () => {
            cTime.innerHTML = this.tformat(
                this.audio.currentTime,
                this.audio.duration
            );
        };
        this.audio.onended = this.next.bind(this);
        this.div.appendChild(this.audio);
        this.audio.controls = true;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler(
                'seekbackward',
                function () {
                    this.audio.currentTime -= 5;
                }
            );
            navigator.mediaSession.setActionHandler('seekforward', function () {
                this.audio.currentTime += 5;
            });
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
        let t = this.library.playing,
            n = this.library.playing;
        if (this.scope.length > 1) {
            while (t == n) {
                n = this.scope[(Math.random() * this.scope.length) | 0];
            }
        }
        this.library.prev.push(n);
        this.library.play(n);
    }

    prev() {
        if (this.audio.currentTime > 10) {
            this.audio.currentTime = 0;
        } else {
            if (this.library.prev.length > 0) {
                this.library.play(this.library.prev.unshift());
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
