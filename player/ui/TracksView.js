import { createTrackDiv, rateLimit } from '../Util.js';

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
        /*for (let j in s) {
            let i = s[j];
            /*let track = createLongP(this.div, `${i.rawArtist} - ${i.title}`, () => {
                this.library.play(i, j, s);
            });
            track.firstChild.style.display = 'block';*/
        /*let trackDiv = document.createElement('div');
            let menuP = createP(trackDiv, '\u22ee', () => {
                this.library.uimanager.browseui.trackMenu.switch(menuP, i);
            });
            let p = createLongP(trackDiv, `${i.rawArtist} - ${i.title}`, () => {
                this.library.play(i, j, s);
            });
            p.style.marginLeft = '4px';
            p.style.display = 'inline';
            p.children[0].style.display = 'inline';
            menuP.style.display = 'inline';
            this.div.appendChild(trackDiv);* /
            // i'm not going to use createTrackDiv here for performance + usability reasons
            createTrackDiv(
                this.div,
                `${i.rawArtistString} - ${i.title}`,
                i,
                this.library,
                j,
                this.library.tracks,
                false
            );
        }*/
        /*let tracksGen = this.createTracks(s),
            tracksInterval = window.setInterval(() => {
                if (tracksGen.next(100).done) {
                    window.clearInterval(tracksInterval);
                }
            }, 100);*/
        rateLimit((i) => createTrackDiv(
            this.div,
            `${s[i].rawArtistString} - ${s[i].title}`,
            s[i],
            this.library,
            i,
            this.library.tracks,
            false
        ), s.length);
    }

    /**createTracks(s) {
        for (let i = 0; i < s.length; ) {
            for (let j = yield i; j > 0 && i < s.length; j--, i++) {
                createTrackDiv(
                    this.div,
                    `${s[i].rawArtistString} - ${s[i].title}`,
                    s[i],
                    this.library,
                    i,
                    this.library.tracks,
                    false
                );
            }
        }
        return;
    }*/
}
