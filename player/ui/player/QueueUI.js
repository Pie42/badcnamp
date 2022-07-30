import { createP, rateLimit } from '../../Util.js';
import { UIQueueItem } from '../elements/UIElements.js';

export default class QueueUI {
    constructor(player) {
        this.player = player;
        this.library = this.player.library;
        this.scope = this.library.scope2;
        this.queue = this.scope.queue;
        this.index = this.scope.index;
        this.items = [];

        this.div = document.createElement('div');

        this.queueDiv = document.createElement('div');
        this.queueDiv.classList.add('queue');

        this.backButton = createP(
            this.div,
            '< Back',
            () => {
                this.player.switchUI('default');
                this.queueDiv.scrollTo(0, 0);
            },
            ['queue-back']
        );
        this.div.appendChild(this.queueDiv);

        this.div.style.display = 'none';

        this.current = undefined;

        // full means the queue will fully generate and not need to be updated
        // abridged means the queue generates 200 items max and must update
        this.mode = 'full';
        // the start of what's shown in the queue (if in abridged mode)
        this.start = 0;
    }

    create() {
        this.queueDiv.innerHTML = '';
        this.items = [];
        let index = this.scope.index,
            max,
            start;
        if (this.queue.length > 200) {
            max = Math.min(this.queue.length - index + 50, 200);
            start = Math.max(0, index - 50);
            this.mode = 'abridged';
            this.start = start;
            console.log(max, start);
        } else {
            max = this.queue.length;
            start = 0;
            this.mode = 'full';
            this.start = 0;
        }
        rateLimit(
            (i) => {
                this.createItem(index, i);
            },
            max,
            start
        ).then(() => {
            this.index = index;
            this.current = this.items[this.index - this.start];
        });
    }

    createItem(index, i) {
        let track = this.queue[i],
            element = new UIQueueItem(
                this.queueDiv,
                this.player,
                track,
                i == index ? 1 : i < index ? 0 : 2,
                () => {
                    this.library.play(track);
                    this.scope.index = i;
                    this.scope.save();
                    this.scope.updateIndex();
                }
            );
        this.items.push(element);
        return element;
    }

    queuechange() {
        this.queue = this.scope.queue;
        this.create();
    }

    indexchange() {
        let index = this.scope.index;
        let item = this.items[index - this.start];
        this.current = item;
        if (index < this.index) {
            for (let i = index + 1; i < this.index; i++) {
                this.items[i - this.start].div.classList.remove('past');
            }
            if (this.mode == 'abridged') {
                for (let i = index + 1; i < this.index; i++) {
                    let itemToRemove = this.items.pop();
                    this.queueDiv.removeChild(itemToRemove.div);
                    if (this.start > 0) {
                        this.start--;
                        this.createItem(index, this.start);
                        let newItem = this.items.pop();
                        this.queueDiv.removeChild(newItem.div);
                        this.queueDiv.insertBefore(
                            newItem.div,
                            this.items[0].div
                        );
                        this.items.unshift(newItem);
                    }
                }
            }
        } else {
            for (let i = this.index; i < index; i++) {
                this.items[i - this.start].div.classList.add('past');
            }
            if (this.mode == 'abridged') {
                for (let i = this.index; i < index; i++) {
                    let itemToRemove = this.items.shift();
                    this.queueDiv.removeChild(itemToRemove.div);
                    this.start++;
                    if (this.start + 200 < this.queue.length) {
                        this.createItem(index, this.start + 200);
                    }
                }
            }
        }
        this.items[this.index - this.start].div.classList.remove('current');
        item.div.classList.remove('past');
        item.div.classList.add('current');
        this.index = index;
    }

    registerEvents() {
        document.addEventListener('indexchange', this.indexchange.bind(this));
        document.addEventListener('queuechange', this.queuechange.bind(this));
    }
}
