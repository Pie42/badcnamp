import BrowseUI from "./BrowseUI.js";
import PlayerUI from "./PlayerUI.js";

export default class UIManager {
    constructor(library) {
        this.playerui = new PlayerUI(library);
        this.browseui = new BrowseUI(library);
        this.playerui.browseui = this.browseui;
        this.browseui.playerui = this.playerui;
    }

    create() {
        this.playerui.create();
        this.browseui.create();
        this.playerui.div.style.left = '50%';
        this.browseui.div.style.left = '0%';
        document.body.appendChild(this.browseui.div);
        document.body.appendChild(this.playerui.div);
    }

    refresh() {
        this.playerui.refresh();
        this.browseui.refresh();
    }
}