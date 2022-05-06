import { createP } from '../../Util.js';

export default class ControlsUI {
    constructor(player) {
        this.player = player;

        this.div = document.createElement('div');

        this.prevButton = createP(
            this.div,
            '\u23ee\ufe0e',
            () => this.player.prev(),
            ['player-control']
        );

        this.backButton = createP(
            this.div,
            '\u23ea\ufe0e',
            () => this.player.back(),
            ['player-control']
        );

        this.forwardsButton = createP(
            this.div,
            '\u23e9\ufe0e',
            () => this.player.forwards(),
            ['player-control']
        );

        this.nextButton = createP(
            this.div,
            '\u23ed\ufe0e',
            () => this.player.next(),
            ['player-control']
        );
    }
}
