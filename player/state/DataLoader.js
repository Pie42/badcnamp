import settings from "../constants/PlayerConstants.js";

// TODO: probably eventually switch this to IndexedDB or something other than localStorage
// (should be pretty easy, since i can just keep all of the methods the same and change the internals)
export default class DataLoader {
    static init() {
        this.namespace = settings.namespace + '-';
        window.DataLoader = DataLoader;
        return;
    }

    static get(key, defaultValue = '[]') {
        return JSON.parse(this.getRaw(key) || defaultValue);
    }

    static set(key, value) {
        localStorage.setItem(this.namespace + key, JSON.stringify(value));
    }

    static getRaw(key) {
        return localStorage.getItem(this.namespace + key) || '';
    }

    static setRaw(key, value) {
        localStorage.setItem(this.namespace + key, value);
    }
}