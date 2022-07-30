import { createTrackDiv, rateLimit } from '../../Util.js';

export default class TracksView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
        this.div = document.createElement('div');
        // TODO make this not be hardcoded
        this.div.style.height = this.library.tracks.length * 22;
        let s;
        if (data?.sort == 'title') {
            s = this.library.tracks.sort(
                (a, b) =>
                    (b.title.toLowerCase() < a.title.toLowerCase()) * 2 - 1
            );
        } else {
            s = this.library.tracks.sort(
                (a, b) =>
                    (`${b.rawArtistString.toLowerCase()} - ${b.title.toLowerCase()}` <
                        `${a.rawArtistString.toLowerCase()} - ${a.title.toLowerCase()}`) *
                        2 -
                    1
            );
        }

        rateLimit(
            (i) =>
                createTrackDiv(
                    this.div,
                    `${s[i].rawArtistString} - ${s[i].title}`,
                    s[i],
                    this.library,
                    i,
                    this.library.tracks,
                    false
                ),
            s.length
        );
    }
}
