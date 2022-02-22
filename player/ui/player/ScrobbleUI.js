//this makes everything work with the bugs listener on webscrobbler
export default class ScrobbleUI {
    constructor(player) {
        this.player = player;

        this.div = document.createElement('div');
        this.div.classList.add('ctl');
        this.div.classList.add('tracktitle');

        this.artist = document.createElement('p');
        this.artist.id = 'newPlayerArtistName';

        this.title = document.createElement('a');

        this.album = document.createElement('div');
        this.album.classList.add('albumtitle');

        this.cTime = document.createElement('p');
        this.cTime.classList.add('start');
        this.cTime.style.display = 'none';

        this.duration = document.createElement('p');
        this.duration.classList.add('finish');
        this.duration.style.display = 'none';

        this.pauseButton = document.createElement('div');
        this.pauseButton.style.width = this.pauseButton.style.height = '1px';
        this.pauseButton.style.display = 'inline';
        this.pauseButton.classList.add('btnStop');
        this.isPaused = true;
        document.body.appendChild(this.pauseButton);

        this.div.appendChild(this.cTime);
        this.div.appendChild(this.duration);
        this.div.appendChild(this.artist);
        this.div.appendChild(this.title);
        this.div.appendChild(this.album);
        this.div.style.display = 'none';

        this.events = ['playing', 'pause', 'loadedmetadata', 'timeupdate'];
    }

    playing() {
        this.pauseButton.style.display = 'inline';
        this.isPaused = false;
    }

    pause() {
        this.pauseButton.style.display = 'none';
        this.isPaused = true;
    }

    // btw loadedmetadata isn't used here because it's loading the metadata
    // this is just a good thing to listen for for a song having loaded
    loadedmetadata() {
        let playing = this.player.library.playing;
        this.title.innerHTML = playing.title;
        this.artist.innerHTML = playing.rawArtist;
        this.album.setAttribute('title', playing.album.title);
        this.duration.innerHTML = this.tformat(
            this.player.audio.duration,
            this.player.audio.duration
        );
    }

    timeupdate() {
        this.cTime.innerHTML = this.player.tformat(
            this.player.audio.currentTime,
            this.player.audio.duration
        );
    }

    /**
     * Creates all of the event listeners on the audio element.
     */
    registerEvents() {
        for (let i of this.events) {
            this.player.audio.addEventListener(i, this[i].bind(this));
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
