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
        ];
    }

    add() {
        this.library.add(this.context.link, false);
    }
}
