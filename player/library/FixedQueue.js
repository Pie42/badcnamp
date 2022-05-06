export default class FixedQueue {
    constructor(library) {
        this.library = library;
        this.queue = [];
        this.index = 0;
        // this is named a bit weirdly, but it tracks the end of the tracks that have been put
        // in not from the original scope in order to make add to queue behave in a sensible way
        this.queueEnd = 0;

        this.mode = 'shuffle';
    }

    shuffle(startingIndex) {
        let len = this.queue.length,
            i = 0,
            j,
            k;

        if (startingIndex && startingIndex < len) {
            k = this.queue[0];
            this.queue[0] = this.queue[startingIndex];
            this.queue[startingIndex] = k;
            i++;
        }
        for (; i < this.queue.length; i++) {
            j = (Math.random() * (len - i)) | 0;
            k = this.queue[j + i];
            this.queue[j + i] = this.queue[i];
            this.queue[i] = k;
        }
        this.index = 0;
    }

    appendToShuffle(tracks) {
        for (let i of tracks) {
            let j = (Math.random() * (this.queue.length - this.index)) | 0;
            this.queue.splice(j + this.index + 1, 0, i);
        }
    }

    update(queue, index) {
        this.queue = queue;
        switch (this.mode) {
            case 'shuffle':
                this.shuffle(index);
                break;

            default:
                this.index = index;
                break;
        }
        this.queueEnd = this.index;
    }

    get playing() {
        return this.queue[this.index];
    }

    get nextTrack() {
        return this.index < this.queue.length - 1
            ? this.queue[this.index + 1]
            : undefined;
    }

    get prevTrack() {
        return this.index > 0 ? this.queue[this.index - 1] : undefined;
    }

    playNext(tracks) {
        this.queue.splice(this.index + 1, 0, ...tracks);
        this.queueEnd++;
    }

    addToQueue(tracks) {
        this.queue.splice(this.queueEnd + 1, 0, ...tracks);
        this.queueEnd += tracks.length;
    }

    loop() {
        switch (this.mode) {
            case 'shuffle':
                this.shuffle();
                break;

            default:
                this.index = 0;
                break;
        }
    }

    next() {
        if (this.queueEnd == this.index) {
            this.queueEnd++;
        }
        this.index++;
        if (this.index == this.queue.length) {
            this.loop();
        }
        return this.playing;
    }

    prev() {
        if (this.index > 0) {
            if (this.queueEnd == this.index) {
                this.queueEnd--;
            }
            this.index--;
        }
        return this.playing;
    }
}
