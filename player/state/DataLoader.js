import { namespace } from "../constants/PlayerConstants.js";

export default class DataLoader {
    static init() {
        this.namespace = namespace + '-';
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