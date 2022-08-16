import DataLoader from '../state/DataLoader.js';

export default class FixedQueue {
    constructor(library) {
        this.library = library;
        this.queue = [];
        this.index = 0;

        // This is named a bit weirdly, but it tracks the end of the tracks that have been put
        // in not from the original scope in order to make 'add to queue' behave in a sensible way.
        // Not implemented.
        this.queueEnd = 0;

        this.mode = 'shuffle';
        this.repeat = 'all';

        // a toggle for when playing songs that aren't actually in the queue (e.g. from a bctag)
        this.notInQueue = false;
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
        this.save();
        this.updateQueue();
    }

    update(queue, index) {
        this.queue = [...queue];
        switch (this.mode) {
            case 'shuffle':
                this.shuffle(index);
                break;

            default:
                this.index = index;
                break;
        }
        this.queueEnd = this.index;
        this.save();
        this.updateQueue();
    }

    get playing() {
        return this.queue[this.index];
    }

    get nextTrack() {
        /*return this.index < this.queue.length - 1 || this.notInQueue
            ? this.queue[this.index + 1 - this.notInQueue]
            : undefined;*/
        return this.nextN(1);
    }

    nextN(n) {
        return this.index + n < this.queue.length + this.notInQueue
            ? this.queue[this.index + n - this.notInQueue]
            : undefined;
    }

    get prevTrack() {
        return this.index > 0 ? this.queue[this.index - 1] : undefined;
    }

    playNext(tracks) {
        this.queue.splice(this.index + 1, 0, ...tracks);
        this.queueEnd += tracks.length;
        this.save();
        this.updateQueue();
    }

    addToQueue(tracks) {
        this.queue.splice(this.queueEnd + 1, 0, ...tracks);
        this.queueEnd += tracks.length;
        this.save();
        this.updateQueue();
    }

    loop() {
        switch (this.mode) {
            case 'shuffle':
                this.shuffle();
                this.updateQueue();
                break;

            default:
                this.index = 0;
                break;
        }
        this.updateIndex();
    }

    trackFinish() {
        if (this.repeat == 'all') {
            return this.next();
        } else {
            return this.playing;
        }
    }

    next() {
        if (this.queueEnd == this.index) {
            this.queueEnd++;
            this.queueEnd -= this.notInQueue;
        }
        this.index -= this.notInQueue;
        this.notInQueue = false;
        do {
            this.index++;
            if (this.index == this.queue.length) {
                this.loop();
                if (!this.queue.some((i) => i.album.status == 'ok')) {
                    alert(
                        'current queue cannot be played, it may have been deleted from bandcamp!'
                    );
                    break;
                }
            }
        } while (this.queue[this.index].album.status == 'not-found');
        this.save();
        this.updateTitle();
        this.updateIndex();
        return this.playing;
    }

    prev() {
        if (this.index > 0) {
            if (this.queueEnd == this.index) {
                this.queueEnd--;
            }
            this.index--;
        }
        this.save();
        this.updateTitle();
        this.updateIndex();
        return this.playing;
    }

    save() {
        let queue = this.queue.map((i) => [i.album.id, i.id]);
        DataLoader.set('queue', queue);
        DataLoader.setRaw('index', this.index);
    }

    load() {
        let queue = DataLoader.get('queue');
        if (queue) {
            this.queue = queue.map(
                (i) => this.library.albums[i[0]].tracks[i[1]]
            );
            this.index = +DataLoader.getRaw('index');
            return true;
        }
        return false;
    }

    updateTitle() {
        if (this.library.playing) {
            document.title = `${this.library.playing.title} / ${this.library.playing.rawArtistString}`;
        }
    }

    updateIndex() {
        let event = new CustomEvent('indexchange');
        document.dispatchEvent(event);
    }

    updateQueue() {
        let event = new CustomEvent('queuechange');
        document.dispatchEvent(event);
    }
}
