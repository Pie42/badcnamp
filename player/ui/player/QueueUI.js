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
    }

    create() {
        this.queueDiv.innerHTML = '';
        this.items = [];
        let index = this.scope.index;

        /*for (let i in this.queue) {
            i = +i;
            let track = this.queue[i],
                element = new UIQueueItem(
                    this.queueDiv,
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
        }*/
        rateLimit((i) => {
            let track = this.queue[i],
                element = new UIQueueItem(
                    this.queueDiv,
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
        }, this.queue.length).then(() => {
            this.index = index;
            this.current = this.items[this.index];
        });

        //this.index = index;
        //this.current = this.items[this.index];
    }

    queuechange() {
        this.queue = this.scope.queue;
        this.create();
    }

    indexchange() {
        let index = this.scope.index;
        let item = this.items[index];
        item.div.classList.remove('past');
        item.div.classList.add('current');
        this.current = item;
        if (index < this.index) {
            for (let i = index + 1; i < this.index; i++) {
                this.items[i].div.classList.remove('past');
            }
        } else {
            for (let i = this.index; i < index; i++) {
                this.items[i].div.classList.add('past');
            }
        }
        this.items[this.index].div.classList.remove('current');
        this.index = index;
    }

    registerEvents() {
        document.addEventListener('indexchange', this.indexchange.bind(this));
        document.addEventListener('queuechange', this.queuechange.bind(this));
    }
}
