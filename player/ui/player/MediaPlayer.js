export default class MediaPlayer {
    constructor(player) {
        this.player = player;

        this.div = document.createElement('div');

        this.cover = document.createElement('img');
    }
}