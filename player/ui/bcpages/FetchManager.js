import settings from "../../constants/PlayerConstants.js";

export default class FetchManager {
    static async fetch(url, parseFunction, callback = (data) => data, type = 'text') {
        return await fetch(settings.path + url)
            .then((i) => i[type]())
            .then((i) => parseFunction(i))
            .then((i) => callback(i))
            .catch((e) => console.error("Fetch error:", e));
    }
}
