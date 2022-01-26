import { createP } from "../Util.js";

export default class MenuButton {
    constructor(text, onclick) {
        this.div = document.createElement('div');
        this.p = createP(this.div, text, onclick);
    }
}