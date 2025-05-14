import { createP } from '../../Util.js';

export default class MenuButton {
    constructor(parent, text, onclick, menu, closeAfterClick = true) {
        this.div = document.createElement('div');
        this.div.classList.add('menu-button');
        this.p = createP(
            this.div,
            text,
            (e) => {
                e.stopPropagation();
                menu.clearTempMenu();
                onclick();
                if (closeAfterClick) {
                    menu.switch(menu.parent, menu.context);
                }
            },
            ['menu-button']
        );
        this.onclick = onclick;
        this.enabled = true;
        parent.appendChild(this.div);
    }

    disable() {
        this.div.style.display = 'none';
        this.enabled = false;
    }

    enable() {
        this.div.style.display = 'block';
        this.enabled = true;
    }
}
