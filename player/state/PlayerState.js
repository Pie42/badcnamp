import LibraryManager from "../library/LibraryManager.js";
import UIManager from "../ui/UIManager.js";
import ProfileManager from "./ProfileManager.js";

export default class PlayerState {
    constructor() {
        this.profileManager = new ProfileManager();
        this.library = new LibraryManager();
        this.uimanager = new UIManager(this.library);
    }

    load() {
        this.profileManager.load();
        this.library.profileManager = this.profileManager;
        this.profileManager.library = this.library;
        this.profileManager.uimanager = this.uimanager;
        this.library.uimanager = this.uimanager;
        this.library.load(this.profileManager.activeProfile);
        this.uimanager.create();
    }
}