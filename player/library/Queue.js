export default class Queue {
    constructor(library) {
        this.library = library;
        this.scope = [];
        this.queue = undefined;
        this.pointer = 0;
        this.upNext = [];
        this.prevTracks = [];

        this.mode = 'shuffle';
    }

    /**
     * This algorithm is effectively the same as iterating through an array
     * and splicing elements from it, but it happens entirely in place.
     * I'm sure that this isn't an original algorithm idk
     */
    shuffle(startingIndex) {
        let len = this.scope.length,
            i = 0,
            j,
            k;

        this.queue = [...Array(len)].map((i, j) => j);
        if (startingIndex && startingIndex < len) {
            this.queue[0] = startingIndex;
            this.queue[startingIndex] = 0;
            i++;
        }
        for (; i < this.queue.length; i++) {
            j = (Math.random() * (len - i)) | 0;
            k = this.queue[j + i];
            this.queue[j + i] = this.queue[i];
            this.queue[i] = k;
        }
    }

    appendToShuffle() {
        let len = this.scope.length,
            diff = len - this.queue.length;
        if (diff < 0) return;
        // eslint-disable-next-line no-unused-vars
        let newQueue = [...Array(len)].map((i, j) =>
                j < len ? this.queue[j] : j
            ),
            j,
            k;

        for (let i = this.queue.length; i < len; i++) {
            j = (Math.random() * (len - i) + this.queue.length) | 0;
            k = this.queue[j + i];
            this.queue[j + i] = this.queue[i];
            this.queue[i] = k;
        }
    }

    next() {
        if (this.upNext.length) {
            return this.scope[this.upNext.pop()];
        } else {
            this.pointer++;
            if (this.pointer > this.scope.length) {
                this.loop();
            }
            return this.play();
        }
    }

    prev() {
        if (this.prevTracks.length) {
            return this.scope[this.prevTracks.pop()];
        } else {
            if (this.pointer > 0) {
                this.pointer--;
            }
            return this.play();
        }
    }

    loop() {
        this.pointer = -1;
        switch (this.mode) {
            case 'shuffle':
                this.shuffle();
                break;

            default:
                break;
        }
    }

    play() {
        let track;
        switch (this.mode) {
            case 'shuffle':
                while (this.queue[this.pointer] >= this.scope.length) {
                    this.pointer++;
                    if (this.pointer == this.queue.length) {
                        this.loop();
                    }
                }
                track = this.scope[this.queue[this.pointer]];
                break;
            default:
                if (this.pointer >= this.scope.length) {
                    this.loop();
                }
                track = this.scope[this.pointer];
        }
        return track;
    }

    get nextTrack() {
        console.log(this.pointer, 'nextTrack');
        let tempPointer = this.pointer + 1,
            track;
        if (this.upNext.length) {
            track = this.upNext[this.upNext.length - 1];
            tempPointer = this.pointer;
        } else {
            switch (this.mode) {
                case 'shuffle':
                    while (this.queue[tempPointer] >= this.scope.length) {
                        tempPointer++;
                        if (tempPointer == this.queue.length) {
                            track = undefined;
                            break;
                        }
                    }
                    track = this.scope[this.queue[this.pointer]];
                    break;

                default:
                    if (tempPointer >= this.scope.length) {
                        track = this.scope[0];
                        break;
                    }
                    track = this.scope[tempPointer];
                    break;
            }
        }
        //return track;
        return [track, tempPointer];
    }

    get playing() {
        let track;
        switch (this.mode) {
            case 'shuffle':
                track = this.scope[this.queue[this.pointer]];
                break;

            default:
                track = this.scope[this.pointer];
        }
        return track;
    }

    update(scope, index) {
        this.scope = scope;
        switch (this.mode) {
            case 'shuffle':
                this.shuffle(index);
                break;

            default:
                break;
        }
    }

    playNext(tracks) {
        // checking if it's just a single track
        if (tracks.length == undefined) {
            tracks = [tracks];
        }
        //this.upNext.splice(this.pointer + 1, 0, ...tracks);
        this.queue.splice(
            this.pointer + 1,
            0,
            ...Array(tracks.length).fill(-1)
        );
        this.upNext.unshift(...tracks);
    }
}
