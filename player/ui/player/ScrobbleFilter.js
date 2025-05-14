export default class ScrobbleFilter {
    constructor(field, search, replace) {
        this.field = field;
        this.search = search;
        this.replace = replace;
        this.filters.push(this);
    }

    static filters = [];

    static replace(filter, trackData) {
        /*trackData[filter.field] = trackData[filter.field].replaceAll(
            filter.search,
            filter.replace
        );*/
        let newField = trackData[filter.field].replaceAll(
            filter.search,
            filter.replace
        );
        trackData[filter.field] = newField;
        return !(newField == trackData[filter.field]);
    }

    static replaceList(filters, trackData, replaceOne = false) {
        for (let i of filters) {
            if (this.replace(i, trackData) && replaceOne) {
                break;
            }
        }
    }
}
