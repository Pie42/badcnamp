export default class PiPUI {
    constructor(player) {
        this.player = player;

        this.div = document.createElement('div');
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.canvas2 = document.createElement('canvas');
        this.imgdata = undefined;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.textBaseline = 'top';

        this.div.style.display = 'none';

        this.size = 500;

        this.canvas.width = this.size;
        this.canvas.height = this.size;

        this.video.playsInline = true;
        this.video.autoplay = true;
        this.video.controls = true;
        //this.video.muted = true;

        this.titleWidth = 0;
        this.artistWidth = 0;
        this.durationWidth = 0;

        this.div.appendChild(this.canvas);
        this.div.appendChild(this.video);

        this.events = ['timeupdate', 'loadedmetadata', 'pause'];
        this.playing = undefined;
    }

    timeupdate() {
        if (this.playing) {
            this.ctx.drawImage(this.player.cover, 0, 0, this.size, this.size);
            this.drawInfo(this.player.audio.currentTime);
        } else {
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawInfo(t) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 350, this.size, 150);
        this.ctx.fillStyle = '#fff';
        this.ctx.textBaseline = 'top';
        this.ctx.font = '60px sans-serif';
        this.ctx.fillText(
            this.playing.title,
            this.scrollFunction(t, this.titleWidth),
            355
        );
        this.ctx.font = '45px sans-serif';
        this.ctx.fillText(
            this.playing.rawArtistString,
            this.scrollFunction(t, this.artistWidth),
            415
        );
        this.ctx.font = '30px sans-serif';
        this.ctx.fillText(
            this.tformat(
                this.player.audio.currentTime,
                this.player.audio.duration
            ),
            10,
            457
        );
        this.ctx.fillText(
            this.tformat(
                this.player.audio.duration,
                this.player.audio.duration
            ),
            this.canvas.width - this.durationWidth - 10,
            457
        );
        //this.ctx.fillStyle = '#8ca195';
        this.ctx.fillRect(
            0,
            490,
            (this.size * this.player.audio.currentTime) /
                this.player.audio.duration,
            10
        );
    }

    scrollFunction(t, size) {
        if (size <= this.size) {
            return 10;
        }
        let length = size / 50,
            newT = t % (length - 4.6);
        return Math.max(Math.min(3 - newT, 0), 9.6 - length) * 50 + 10;
    }

    loadedmetadata() {
        this.playing = this.player.library.playing;
        this.ctx.font = '60px sans-serif';
        this.titleWidth = this.ctx.measureText(this.playing.title).width;
        this.ctx.font = '45px sans-serif';
        this.artistWidth = this.ctx.measureText(
            this.playing.rawArtistString
        ).width;
        this.ctx.font = '30px sans-serif';
        this.durationWidth = this.ctx.measureText(
            this.tformat(this.player.audio.duration, this.player.audio.duration)
        ).width;
        this.pause();
    }

    pause() {
        this.ctx.drawImage(this.player.cover, 0, 0, this.size, this.size);
        this.drawInfo(0);
        this.ctx.fillStyle = 'rgba(255, 255, 255)';
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(
            this.size / 4,
            this.size / 6,
            this.size / 8,
            (2 * this.size) / 3
        );
        this.ctx.fillRect(
            (5 * this.size) / 8,
            this.size / 6,
            this.size / 8,
            (2 * this.size) / 3
        );
        this.ctx.globalAlpha = 1;
    }

    /**
     * Creates all of the event listeners on the audio element.
     */
    registerEvents() {
        for (let i of this.events) {
            this.player.audio.addEventListener(i, this[i].bind(this));
        }
        //this.timeupdate();
        this.stream = this.canvas.captureStream();
        /**
         * @type {CanvasCaptureMediaStreamTrack}
         */
        this.canvasStream = this.stream.getTracks()[0];
        this.video.srcObject = this.stream;
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
