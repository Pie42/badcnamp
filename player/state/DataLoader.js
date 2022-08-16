import settings from "../constants/PlayerConstants.js";

// TODO: probably eventually switch this to IndexedDB or something other than localStorage
// (should be pretty easy, since i can just keep all of the methods the same and change the internals)
export default class DataLoader {
    static init() {
        this.namespace = settings.namespace + '-';
        this.profile = '';
        window.DataLoader = DataLoader;
        return;
    }

    static get(key, defaultValue = '[]') {
        return JSON.parse(this.getRaw(key) || defaultValue);
    }

    static set(key, value) {
        this.setRaw(key, JSON.stringify(value));
    }

    static getRaw(key) {
        return localStorage.getItem(this.namespace + key) || '';
    }

    static setRaw(key, value) {
        localStorage.setItem(this.namespace + key, value);
    }

    static asProfile(key) {
        return `${key}~${this.profile}`;
    }

    static getP(key, defaultValue = '[]') {
        return this.get(this.asProfile(key), defaultValue);
    }

    static setP(key, value) {
        this.set(this.asProfile(key), value);
    }

    static getRawP(key) {
        return this.getRaw(this.asProfile(key));
    }

    static setRawP(key, value) {
        this.setRaw(this.asProfile(key), value);
    }
}