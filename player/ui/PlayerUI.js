import { createP, getImageType } from '../Util.js';
import { isOutdated } from '../Util.js';
import ControlsUI from './player/ControlsUI.js';
import PiPUI from './player/PiPUI.js';
import QueueUI from './player/QueueUI.js';
import ScrobbleUI from './player/ScrobbleUI.js';
import settings from '../constants/PlayerConstants.js';
import TrackMenu from './menu/TrackMenu.js';
import AlbumMenu from './menu/AlbumMenu.js';
import PlayerBar from './player/PlayerBar.js';
import NewPiPUI from './player/NewPiPUI.js';
// types
import LibraryManager from '../library/LibraryManager.js';

export default class PlayerUI {
    /**
     * @param {LibraryManager} library The library
     */
    constructor(library) {
        this.div = document.createElement('div');
        this.div.style.width = '50%';
        this.div.style.height = '100%';
        this.div.style.borderLeft = 'solid #0f0c0c';
        this.div.style.borderWidth = '1px';

        this.playerDiv = document.createElement('div');
        this.div.appendChild(this.playerDiv);

        this.cover = document.createElement('img');

        this.library = library;
        this.audio = library.audio;
        this.isPlaying = false;

        // automatically queue (and fetch) tracks to reduce loading times
        this.autoQueue = true;

        // the currently visible div
        this.currentDiv = this.playerDiv;
        this.state = '';
    }

    create() {
        this.trackMenu = new TrackMenu(this.library, this.browseui);
        this.albumMenu = new AlbumMenu(this.library, this.browseui);
        let thumbnaildiv = document.createElement('div');
        thumbnaildiv.classList.add('thumbnail');

        let cover = this.cover;
        cover.crossOrigin = 'Anonymous';
        cover.style.width = '50%';
        cover.style.margin = '0 auto';
        cover.style.display = 'block';
        cover.style.aspectRatio = '1';
        cover.style.backgroundImage =
            'url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22512%22%20height=%22512%22%20viewBox=%220%200%2032%2032%22%3E%3Cpath%20d=%22M16%2032a16%2016%200%201%200%200-32%2016%2016%200%200%200%200%2032zm0-29a13%2013%200%201%201%200%2026%2013%2013%200%200%201%200-26zm9%205c.6%200%201%20.5%201%201v3a2%202%200%200%201-2%202h-4a2%202%200%200%201-2-2h-4a2%202%200%200%201-2%202H8a2%202%200%200%201-2-2V9c0-.6.5-1%201-1h6c.6%200%201%20.5%201%201v1h4V9c0-.6.5-1%201-1h6zm-9%2016a8%208%200%200%200%206.9-3.9l1.7%201a10%2010%200%200%201-12.8%204l1-1.8c1%20.5%202%20.7%203.2.7z%22/%3E%3C/svg%3E")';
        cover.style.backgroundSize = 'contain';
        cover.style.backgroundColor = 'var(--text-color)';
        thumbnaildiv.appendChild(cover);
        this.playerDiv.appendChild(thumbnaildiv);

        let favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);

        let title = document.createElement('h1');
        title.innerText = 'Nothing seems to be playing right now!';
        this.playerDiv.appendChild(title);

        //holds h3 elements
        let artist = document.createElement('div');
        artist.style.display = 'block';
        artist.innerHTML =
            "<h3>(it's possible you need to add something to your library first)</h3>";
        this.playerDiv.appendChild(artist);

        title.style.textAlign = artist.style.textAlign = 'center';

        let album = document.createElement('p');
        album.onclick = () => {
            if (this.library.playing) {
                this.browseui.switchUI('album', this.library.playing.album);
            }
        };
        this.playerDiv.appendChild(album);
        this.audio.onstalled = async () => {
            console.log(
                'player stalled! (usually just means the audio file expired)'
            );
            let t = this.audio.currentTime;
            await this.library.refetch(this.library.playing.album);
            await this.library.play(
                this.library.playing,
                this.library.playingIndex
            );
            this.audio.currentTime = t;
        };

        this.audio.addEventListener('error', async () => {
            console.log(
                'player errored! (this is bad, but is the expected result when you have no internet. if you see this and you think everything should be fine, file an issue)',
                `current state: ${this.state} (if this says error and then prints a bunch of output, something is wrong)`
            );
            this.isPlaying = false;
            // better error handling: give up after one try
            if (this.state != 'error') {
                this.audioStateChange('error');
                console.log(this.state);
                let t = this.audio.currentTime;
                await this.library.refetch(this.library.playing.album);
                this.audioStateChange('error');
                await this.library.play(
                    this.library.playing,
                    this.library.playingIndex
                );
                this.audio.currentTime = t;
                this.audioStateChange('error');
            } else {
                this.next();
            }
        });

        this.scrobbleui = new ScrobbleUI(this);
        this.scrobbleui.registerEvents();
        this.div.appendChild(this.scrobbleui.div);

        if ('documentPictureInPicture' in window && false) {
            this.pipui = new NewPiPUI(this);
            this.pipui.registerEvents();
        } else {
            this.pipui = new PiPUI(this);
            this.pipui.registerEvents();
            this.div.appendChild(this.pipui.div);
        }

        this.controlsui = new ControlsUI(this);
        this.playerDiv.appendChild(this.controlsui.div);
        this.playerDiv.appendChild(this.audio);

        this.queueui = new QueueUI(this);
        this.queueui.registerEvents();
        this.div.appendChild(this.queueui.div);
        this.queueui.create();

        this.playerBar = new PlayerBar(this);
        this.playerBar.registerEvents();
        document.body.appendChild(this.playerBar.div);

        this.queueButton = createP(this.playerDiv, 'View Queue', () => {
            this.switchUI('queue');
        });

        this.audio.onloadedmetadata = () => {
            let playing = this.library.playing;
            cover.src = getImageType(playing.album.image, 23);
            favicon.href = playing.album.image;
            title.innerText = playing.title;
            artist.innerHTML = '';

            for (let i in playing.rawArtists.splitters) {
                let currentArtist = playing.rawArtists.splitters[i],
                    artisth3 = document.createElement('h3');
                artisth3.style.display = 'inline';
                artisth3.innerText = currentArtist;
                if (+i % 2 == 0) {
                    artisth3.onclick = () => {
                        if (this.library.playing) {
                            this.browseui.switchUI(
                                'artist',
                                currentArtist.toLocaleLowerCase()
                            );
                        }
                    };
                } else {
                    artisth3.innerText = '\u200b' + currentArtist + '\u200b';
                }
                artist.appendChild(artisth3);
            }
            album.innerText = `From "${playing.album.title}"`;
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtistString,
                    artwork: [{ src: playing.album.image }],
                });
                navigator.mediaSession.setPositionState({
                    duration: this.audio.duration,
                    playbackRate: this.audio.playbackRate,
                    position: this.audio.currentTime,
                });
            }
            this.playerBar.updateMetadata(playing, artist);
        };
        this.audio.addEventListener('playing', () => {
            this.library.scope2.updateTitle();
            this.isPlaying = true;
            this.audioStateChange('play');
            this.setActionHandlers();
            this.pipui.video.play();
            if ('mediaSession' in navigator) {
                let playing = this.library.playing;
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.rawArtistString,
                    album: playing.album.title,
                    artwork: [{ src: playing.album.image }],
                });

                navigator.mediaSession.playbackState = 'playing';

                navigator.mediaSession.setPositionState({
                    duration: this.audio.duration,
                    playbackRate: this.audio.playbackRate,
                    position: this.audio.currentTime,
                }); //*/
            }
        });
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.audioStateChange('ended');
            this.library.playing.plays++;
            this.library.save();
            this.next();
        });
        this.audio.addEventListener('pause', () => {
            document.title = badcnamp.state.uimanager.browseui.title;
            this.isPlaying = false;
            this.audioStateChange('pause');
            this.setActionHandlers();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';

                if (this.audio.duration) {
                    navigator.mediaSession.setPositionState({
                        duration: this.audio.duration,
                        playbackRate: this.audio.playbackRate,
                        position: this.audio.currentTime,
                    }); //*/
                }
            }
        });
        this.audio.addEventListener('seeked', () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setPositionState({
                    duration: this.audio.duration,
                    playbackRate: this.audio.playbackRate,
                    position: this.audio.currentTime,
                });
            }
        });
        document.addEventListener('queueempty', () => {
            this.cover.removeAttribute('src');
            title.innerText = 'Nothing seems to be playing right now!';
            artist.innerHTML =
                "<h3>(it's possible you need to add something to your library first)</h3>";
            album.innerText = '';
        });
        this.audio.controls = true;

        this.setActionHandlers();

        return;
    }

    next() {
        let k = this.library.scope2.trackFinish();
        this.library.play(k);
        this.prepareNextTrack();
    }

    async prepareNextTrack() {
        /*let nextTrack = this.library.scope2.nextTrack;
        if (isOutdated(nextTrack)) {
            while (!fetched)
            this.library.refetch(nextTrack.album);
        }*/
        let successful = true;
        for (let i = 1; ; i++) {
            let nextTrack = this.library.scope2.nextN(i);
            // nextN returns undefined at queue end
            // (it can't shuffle or loop, and this prevents bad things from happening)
            // this also happens to be the only failure condition that matters
            if (!nextTrack) {
                successful = false;
                break;
            }
            // alternatively, if an album can't be loaded and was checked less than an hour ago,
            // just skip it
            if (
                !nextTrack.album.ok &&
                Date.now() - nextTrack.album.lastChecked < 3600000
            ) {
                continue;
            }
            if (isOutdated(nextTrack)) {
                let status = await (nextTrack.album?.refetchAll?.() ||
                    this.library.refetch(nextTrack.album));
                // status = 0 is the only one we should keep searching on
                if (status) {
                    break;
                }
            } else {
                break;
            }
        }
        return successful;
    }

    prev() {
        if (this.audio.currentTime > 10) {
            this.audio.currentTime = 0;
        } else {
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

    /**
     *
     * @param {string} newUI
     */
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
     *
     * @param {string} state A string description (e.g. stopped, error) of the current audio state
     */
    audioStateChange(state) {
        this.state = state;
        let event = new CustomEvent('playstatechanged', { detail: { state } });
        document.dispatchEvent(event);
    }

    setActionHandlers() {
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
            navigator.mediaSession.setActionHandler(
                'play',
                function () {
                    this.pipui.play();
                    this.pipui.timeupdate();
                    this.audio.play();
                    this.setActionHandlers();
                }.bind(this)
            );
            navigator.mediaSession.setActionHandler(
                'pause',
                function () {
                    this.audio.pause();
                    //this.pipui.timeupdate();
                    this.pipui.pause();
                    //this.pipui.video.pause();
                    this.setActionHandlers();
                }.bind(this)
            );
        }
    }
}
