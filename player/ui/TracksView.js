import { createLongP } from '../Util.js';

export default class TracksView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        this.div = document.createElement('div');
        let s;
        if (data?.sort == 'title') {
            s = this.library.tracks.sort(
                (a, b) =>
                    (b.title.toLowerCase() < a.title.toLowerCase()) * 2 - 1
            );
        } else {
            s = this.library.tracks.sort(
                (a, b) =>
                    (`${b.artist.toLowerCase()} - ${b.title.toLowerCase}` <
                        `${a.artist.toLowerCase()} - ${a.title.toLowerCase()}`) *
                        2 -
                    1
            );
        }
        for (let i of s) {
            let track = createLongP(this.div, `${i.rawArtist} - ${i.title}`, () => {
                this.library.play(i);
            });
            track.firstChild.style.display = 'block';
        }
    }
}
