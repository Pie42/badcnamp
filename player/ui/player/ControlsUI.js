import { createIcon, iconLink } from '../../Util.js';

export default class ControlsUI {
    constructor(player, includePlay = false) {
        this.player = player;

        this.div = document.createElement('div');
        this.div.classList.add('controls');

        this.prevButton = createIcon(
            this.div,
            'skip-back',
            () => this.player.prev(),
            ['player-control']
        );

        this.backButton = createIcon(
            this.div,
            'rewind',
            () => this.player.back(),
            ['player-control']
        );

        if (includePlay) {
            let playState = false,
                rToggle = toggle.bind(this);
            function toggle(manual = false) {
                playState = !playState;
                if (!playState) {
                    this.playButton.src = iconLink('play');
                    if (manual) {
                        this.player.audio.pause();
                    }
                } else {
                    this.playButton.src = iconLink('pause');
                    if (manual) {
                        this.player.audio.play();
                    }
                }
            }
            document.addEventListener('playstatechanged', (e) => {
                switch (e.detail.state) {
                    case 'ended':
                    case 'error':
                    case 'pause':
                        playState = true;
                        break;
                    case 'play':
                        playState = false;
                        break;
                }
                rToggle();
            });
            this.playButton = createIcon(
                this.div,
                'play',
                () => rToggle(true),
                ['player-control']
            );
        }

        this.forwardsButton = createIcon(
            this.div,
            'fast-forward',
            () => this.player.forwards(),
            ['player-control']
        );
        this.nextButton = createIcon(
            this.div,
            'skip-forward',
            () => this.player.next(),
            ['player-control']
        );

        this.pipButton = createIcon(
            this.div,
            'picture-in-picture',
            () => this.player.pipui.pip(),
            ['player-control']
        );
    }
}
