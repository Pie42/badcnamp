import { createTrackDiv } from '../Util.js';

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
        for (let j in s) {
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
            this.div.appendChild(trackDiv);*/
            // i'm not going to use createTrackDiv here for performance + usability reasons
            createTrackDiv(
                this.div,
                `${i.rawArtist} - ${i.title}`,
                i,
                this.library,
                j,
                this.library.tracks,
                false
            );
        }
    }
}
