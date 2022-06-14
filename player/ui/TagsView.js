import { createP, createLongP, sortArray } from '../Util.js';
//import Menu from "./Menu.js";

export default class TagsView {
    constructor(manager, data) {
        //this.menu = manager.menu;
        //this.menu = new Menu();
        this.library = manager.library;
        this.tags = this.library.tags;
        this.data = data;
        this.div = document.createElement('div');
        let tags = Object.entries(this.tags);
        tags = tags.filter((i) => i[1].albums.length > 1);
        if (data?.sort == 'length') {
            /*tags = Object.entries(tags)
                .sort((a, b) => b[1].tracks.length - a[1].tracks.length)
                .map((i) => i[0]);*/
            tags = sortArray(tags, '[1].tracks.length * -1');
        } else {
            /*tags = Object.keys(tags).sort((a, b) => {
                return (b.toLocaleLowerCase() < a.toLocaleLowerCase()) * 2 - 1;
            });*/
            tags = sortArray(tags, '[0].toLocaleLowerCase()');
        }
        for (let i of tags) {
            let tag = i[1],
                tagDiv = document.createElement('div'),
                tagName = createLongP(tagDiv, tag.name, () => {
                    manager.switchUI('tag', i[0]);
                }),
                arrowP = createP(tagDiv, ' >', () => {});
            arrowP.style.display = 'flex';
            arrowP.style.flexShrink = '0';
            arrowP.style.padding = '8px';
            tagName.firstChild.style.display = 'block';
            tagName.firstChild.style.padding = '8px';
            tagDiv.style = `
            border: solid;
            border-width: 1px;
            border-radius: 2px;
            /*padding: 8px;*/
            margin: 2px;
            display: flex;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;`;
            this.div.appendChild(tagDiv);
        }
    }
}
