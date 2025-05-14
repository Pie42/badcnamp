import Menu from './Menu.js';
import MenuButton from './MenuButton.js';

export default class RemoteAlbumMenu extends Menu {
    constructor(library, browseui) {
        super(library, browseui);

        this.div.innerHTML = '';
        this.buttons = [
            new MenuButton(
                this.div,
                'Add to library',
                this.add.bind(this),
                this
            ),
            new MenuButton(
                this.div,
                'Keep listening',
                this.continue.bind(this),
                this
            ),
        ];
        this.buttonMap = {
            add: this.buttons[0],
            continue: this.buttons[1],
        };
        this.getSize();
    }

    add() {
        //this.library.add(this.context.link, false);
        this.context.convertToAlbum();
    }

    async continue() {
        // loadAll is asynchronous, which can cause the context to be unset before it's completed
        let context = this.context;
        await context.loadAll();
        this.library.scope2.playNext(context.getTracks());
    }
}
