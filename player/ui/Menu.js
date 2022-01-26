export default class Menu {
    constructor() {
        this.div = document.createElement('div');
        this.buttons = [];
        //note that this just has to be some sort of unique identifier
        this.selectionID = undefined;
    }
}