import settings from "../../constants/PlayerConstants.js";

export default class FetchManager {
    static async fetch(url, parseFunction, callback, type = 'text') {
        return await fetch(settings.path + url)
            .then((i) => i[type]())
            .then((i) => parseFunction(i))
            .then((i) => callback(i));
    }
}
