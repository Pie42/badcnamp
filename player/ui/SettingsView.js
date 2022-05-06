import settings from "../constants/PlayerConstants.js";

export default class SettingsView {
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;
    }
}