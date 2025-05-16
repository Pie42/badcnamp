import { tformat } from '../../Util.js';

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

        this.size = 500;

        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.display = 'none';

        this.video.playsInline = true;
        this.video.autoplay = true;
        this.video.controls = true;

        this.titleWidth = 0;
        this.artistWidth = 0;
        this.durationWidth = 0;

        // firefox doesn't have the picture-in-picture api
        // so we show the video element (so the user can manually pip it)
        this.pipapi = 'pictureInPictureEnabled' in document;
        this.rendering = !this.pipapi;
        this.visible = false;
        if (this.pipapi) {
            this.div.style.display = 'none';
        } else {
            this.video.style.display = 'none';
        }
        // to help with transitioning between songs
        this.transitionState = false;

        this.div.appendChild(this.canvas);
        this.div.appendChild(this.video);

        this.events = ['timeupdate', 'loadedmetadata', 'pause', 'play', 'ended'];
        this.videoEvents = ['enterpictureinpicture', 'leavepictureinpicture'];
        this.playing = undefined;

        this.videoIsPausing = false;
        this.audioIsPlaying = false;
        this.actionIsFake = false;
    }

    timeupdate() {
        if (!this.rendering) return;
        if (this.playing) {
            this.ctx.drawImage(this.player.cover, 0, 0, this.size, this.size);
            this.drawInfo(this.player.audio.currentTime);
        } else {
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.canvasStream.requestFrame?.();
    }

    drawInfo(t) {
        if (!this.playing) return;
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
            tformat(this.player.audio.currentTime, this.player.audio.duration),
            10,
            457
        );
        this.ctx.fillText(
            tformat(this.player.audio.duration, this.player.audio.duration),
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

    // note: this function probably shouldn't be called in response to any user action except entering picture-in-picture
    async updatePaused() {
        if (!this.video.paused) return;
        this.actionIsFake = true;
        this.pause();
        await this.video.play();
        this.video.pause();
        this.actionIsFake = false;
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
            tformat(this.player.audio.duration, this.player.audio.duration)
        ).width;
        this.transitionState = false;
        //this.pause();
    }

    pause() {
        if (this.rendering) {
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
            this.canvasStream.requestFrame?.();
        }
        if (this.transitionState || this.actionIsFake) return;
        let video = this.video;
        !this.videoIsPausing && video.pause();
    }

    play() {
        this.audioIsPlaying = true;
        this.video.play();
    }

    ended() {
        this.transitionState = true;
    }

    enterpictureinpicture() {
        this.rendering = true;
        this.player.setActionHandlers();
        this.timeupdate();
        this.updatePaused();
    }

    leavepictureinpicture() {
        this.rendering = false;
        this.player.setActionHandlers();
    }

    pip() {
        if (!this.playing) return;
        if (this.pipapi) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
                this.visible = false;
            } else if (document.pictureInPictureEnabled) {
                this.video.requestPictureInPicture();
                this.player.setActionHandlers();
                this.visible = true;
            }
        } else {
            if (this.visible) {
                this.video.style.display = 'none';
            } else {
                this.timeupdate();
                this.updatePaused();
                this.video.style.display = 'block';
            }
            this.visible = !this.visible;
        }
    }

    async videoPause() {
        if (this.actionIsFake) return;
        if (this.videoIsPausing) {
            this.videoIsPausing = false;
            return;
        }
        this.videoIsPausing = true;
        await this.video.play();
        !this.player.audio.paused && !this.transitionState && this.player.audio.pause();
        setTimeout(async () => {this.video.pause()}, 50);
    }

    videoPlay() {
        if (this.actionIsFake) return;
        if (this.audioIsPlaying) {
            this.audioIsPlaying = false;
            return;
        }
        if (this.videoIsPausing) {
            return;
        }
        this.player.audio.play();
    }

    /**
     * Creates all of the event listeners on the audio element.
     */
    registerEvents() {
        for (let i of this.events) {
            this.player.audio.addEventListener(i, this[i].bind(this));
        }
        for (let i of this.videoEvents) {
            this.video.addEventListener(i, this[i].bind(this));
        }
        this.video.addEventListener('pause', this.videoPause.bind(this));
        this.video.addEventListener('play', this.videoPlay.bind(this));
        this.stream = this.canvas.captureStream();
        /**
         * @type {CanvasCaptureMediaStreamTrack}
         */
        this.canvasStream = this.stream.getTracks()[0];
        this.video.srcObject = this.stream;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasStream.requestFrame?.();
    }
}
