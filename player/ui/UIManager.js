import BrowseUI from "./BrowseUI.js";
import PlayerUI from "./PlayerUI.js";
// types
import LibraryManager from "../library/LibraryManager.js";

export default class UIManager {
    /**
     * 
     * @param {LibraryManager} library 
     */
    constructor(library) {
        this.playerui = new PlayerUI(library);
        this.browseui = new BrowseUI(library);
        this.playerui.browseui = this.browseui;
        this.browseui.playerui = this.playerui;
    }

    create() {
        this.playerui.create();
        this.browseui.create();
        //this.playerui.div.style.left = '50%';
        //this.browseui.div.style.left = '0%';
        document.body.appendChild(this.browseui.div);
        document.body.appendChild(this.playerui.div);
        addEventListener('resize', this.resize.bind(this));
        this.resize();
    }

    resize() {
        this.size = {x: innerWidth, y: innerHeight};
        this.ratio = this.size.y / this.size.x;
        //this.playerui.div.style.height = 'calc(89.75% - 2px)';
        //this.browseui.div.style.height = 'calc(89.75% - 2px)';
        if (this.ratio < 3 / 4) {
            this.playerui.div.style.left = '50%';
            this.browseui.div.style.left = '0%';
            this.playerui.div.style.width = '50%';
            this.browseui.div.style.width = '50%';
            this.playerui.div.style.display = 'block';
            /*this.playerui.div.style = `
                left: 50%;
                display: block;
                width: 50%;`;
            this.browseui.div.style = `
                left: 0%;
                display: block;
                width: 50%;`*/
        } else {
            this.playerui.div.style.left = '0%';
            this.browseui.div.style.left = '0%';
            this.playerui.div.style.width = '100%';
            this.browseui.div.style.width = '100%';
            this.playerui.div.style.display = 'none';
            /*this.playerui.div.style = `
                left: 0%;
                display: none;
                width: 100%;`;
            this.browseui.div.style = `
                left: 0%;
                display: block;
                width: 100%;`;*/
        }
    }

    refresh() {
        this.playerui.refresh();
        this.browseui.refresh();
    }
}