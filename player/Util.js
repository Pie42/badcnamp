import settings from './constants/PlayerConstants.js';
import Tag from './library/Tag.js';

/**
 *
 * @param {HTMLDivElement} parentElement
 * @param {String} innerText
 * @param {Function} onclick
 * @param {String[]} [classes=[]]
 * @returns {HTMLParagraphElement}
 */
function createP(parentElement, innerText, onclick, classes = []) {
    let p = document.createElement('p');
    p.innerText = innerText;
    p.classList.add('pointer-hover');
    p.classList.add(...classes);
    //p.style.display = 'inline';
    p.onclick = onclick;
    parentElement.appendChild(p);
    return p;
}

function iconLink(type) {
    return `resources/icons/${type}-fill-svgrepo-com.svg`;
}

/**
 *
 * @param {HTMLDivElement} parentElement
 * @param {String} type
 * @param {Function} onclick
 * @param {String[]} [classes=[]]
 * @returns {HTMLParagraphElement}
 */
function createIcon(parentElement, type, onclick, classes = []) {
    let img = document.createElement('img');
    img.src = iconLink(type);
    img.classList.add('pointer-hover');
    img.classList.add(...classes);
    //p.style.display = 'inline';
    img.onclick = onclick;
    parentElement.appendChild(img);
    return img;
}

/**
 * Creates a 'p' element inside of a div with classes to let it truncate the 'p' via css.
 * This function is mostly meant to be used for anything that isn't explicitly defined in
 * the program (and thus has an unknown length).
 * @param {HTMLElement} parentElement The element to put the new div in.
 * @param {String} innerText The text to put inside of the 'p' element.
 * @param {Function} onclick The function to call upon clicking the 'p' element.
 * @returns {HTMLDivElement} The div with the 'p' element in it.
 */
function createLongP(parentElement, innerText, onclick) {
    let div = document.createElement('div'),
        p = createP(div, innerText, onclick);
    p.classList.add('long-p');
    div.classList.add('long-div');
    parentElement.appendChild(div);
    return div;
}

function createTrackDiv(
    parent,
    name,
    track,
    library,
    index,
    scope,
    fancy = true
) {
    let trackDiv = document.createElement('div');
    trackDiv.classList.add('track-div');
    if (fancy) {
        trackDiv.classList.add('fancy');
    }

    let i = createLongP(trackDiv, name, (e) => {
        if (trackDiv.classList.contains('selected')) {
            library.uimanager.browseui.trackMenu.switch(menuP, track);
        } else {
            library.play(track, index, scope);
        }
        e.stopPropagation();
    });
    trackDiv.onclick = i.firstChild.onclick;

    if (fancy) {
        i.firstChild.classList.add('fancy-track-p');
    } else {
        i.firstChild.classList.add('track-p');
    }

    let duration = createP(
        trackDiv,
        tformat(track.duration, track.duration),
        trackDiv.onclick,
        ['fancy-track-p']
    );
    duration.style.paddingRight = '8px';

    let menuP = createP(trackDiv, '\u22ee', (e) => {
        //let menuP = createP(trackDiv, '\u2630', (e) => {
        e.stopPropagation();
        library.uimanager.browseui.trackMenu.switch(menuP, track);
    });

    trackDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        library.uimanager.browseui.trackMenu.switch(menuP, track, {
            x: e.clientX,
            y: e.clientY,
        });
    });

    //i.style.display = 'inline';
    i.style.marginRight = '4px';
    menuP.style.paddingRight = '8px';
    menuP.style.minWidth = '12px';
    parent.appendChild(trackDiv);
}

function parseFromDom(text) {
    let parser = new DOMParser(),
        dom = parser.parseFromString(
            '<!doctype html><body>' + text,
            'text/html'
        ),
        corrected = dom.body.textContent;
    return corrected;
}

//parsing strategy taken from https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript/42254787#42254787
function parseTralbumData(result) {
    let tralbumData = result.match(/data-tralbum="(.+?\})"/s)[1],
        corrected = parseFromDom(tralbumData);
    return JSON.parse(corrected);
}

function parseTags(result) {
    let tags = result.match(/"keywords":(\[.*?\])/)?.[1];
    if (!tags) return [];
    let corrected = parseFromDom(tags);
    return JSON.parse(corrected).map((i) => i.toLocaleLowerCase());
}

/**
 * A function that produces a regex to replace track numbers and a regex to split
 * track names in albums with poorly formatted data.
 *
 * Example:
 *
 * CD01 01. George ~ Calling the police
 *
 * CD01 02. George ~ Uncalling the police ->
 *
 * ['George', 'Calling the police']
 *
 * ['George', 'Uncalling the police']
 *
 * This likely doesn't work 100% of the time, but i've done my best to give it good
 * accuracy with as few false positives as possible, and it's an improvement over
 * simply splitting on ' - '.
 * @param {Object} trackInfo An object with information about the tracks in an album.
 * @returns {['' | RegExp, RegExp]} An array with the regular expressions to match with.
 */
function doTheFunkyTitleThing(trackInfo) {
    function removeGroups(string) {
        let match = 1;
        // having a while loop like this is dangerous but imo it's okay because the string is reduced every iteration
        while (match) {
            match = string.match(/\p{Ps}[^\p{Pe}\p{Ps}]+\p{Pe}/u)?.[0];
            if (match) {
                string = string.replace(match, '');
            } else {
                break;
            }
        }
        return string;
    }
    // syntactically, any part of the title contained within parentheses, brackets,
    // or any other grouping character shouldn't be used to separate the title from
    // the artist
    let titles = trackInfo.map((i) => removeGroups(i.title)).join('\n'),
        numbering = titles.match(
            /([\d\w. ]+)(\d)([. ]*)(?!\n)\D.+\n(\1(?!\2)\d\3)/
        ),
        rumbening = numbering
            ? new RegExp(numbering[4].replaceAll(/\d/g, '\\d+'), 'g')
            : '',
        titling = titles.replaceAll(rumbening, '');
    if (titling.match(/ - .+\n.+ - /)) {
        titling = ' - ';
    } else {
        titling = titling.match(
            /(.+)([^\p{L}\n \p{Pe}\p{Ps}\p{N}'.!?\-:,／’])((?:.(?!\2))+)\n.+\2(?!\3)/iu
        )?.[2];
    }
    let titlinging = new RegExp(`(.+?)(${titling})(.+)`);
    return [rumbening, titlinging];
}

/**
 * A less accurate version of the function above.
 * @param {Track} track The track to parse
 * @returns {String[]} The parsed track artist and title
 */
function guessTheTitle(artist, title) {
    let numbering =
            title.match(/([\d\w. ]+)(\d)([. ]*)(?!\n)(\D.+)/)?.[4] || title,
        dashed = numbering.match(/(.+)( - )(.+)/),
        split = dashed
            ? dashed
            : numbering.match(
                  /^(.+?) ?([^\p{L}\n \p{Pe}\p{Ps}\p{N}'.!?\-:,]) ?((?:.(?!\2))+)/u
              );
    return split ? [split[1], split[3]] : [artist, title];
}

/**
 * A function to split names of multiple artists into the separate artist names,
 * to make the artist view cleaner.
 * @param {String} artist The name of the artist
 * @returns {Array} An array containing the split and corrected name of the artist(s)
 */
function splitArtists(artist) {
    try {
        let split = artist.split(/(?: vs | & | feat\. | ft\. | x |, | \+ | ?\/ ?)/i);
        split.splitters = artist.split(
            /( vs\.? | & | feat\. | x |, | \+ | ?\/ ?)/i
        );
        return split;
    } catch {
        return [artist];
    }
}

/**
 * Returns if the file for a track is outdated (and thus should be updated).
 * @param {Track} track
 * @returns {Boolean}
 */
function isOutdated(track) {
    return (
        !track.file ||
        track.file.match(/ts=(.+?)&/)[1] * 1000 - Date.now() < 5_000_000
    );
}

/**
 * A function to limit the rate at which various things are generated
 * (e.g. ui elements, to prevent things from slowing down too much)
 * @param {Function} callback The function to be called every step
 * @param {Number} max The number of times to iterate
 * @param {Number} [rate=100] The rate in milliseconds to generate things, default 100
 * @param {Number} [step=100] The number of things to generate at a time, default 100
 */
function rateLimit(callback, max, start = 0, rate = 100, step = 100) {
    if (max == 0) return;
    function* generate() {
        for (let i = start; i < start + max; ) {
            for (let j = step; j > 0 && i < start + max; j--, i++) {
                callback(i);
            }
            yield i;
        }
        return;
    }

    let generator = generate(),
        genInterval,
        returnValue;

    let nextPromise = new Promise((resolve) => {
        genInterval = window.setInterval(() => {
            if (generator.next().done) {
                window.clearInterval(genInterval);
                resolve();
            }
        }, rate);
        returnValue = () => {
            window.clearInterval(genInterval);
            resolve();
        };
    });
    //generator.next();

    returnValue.then = (...a) => nextPromise.then(...a);
    return returnValue;
}

async function upgradeLibrary(library, max = 0, dryRun = false) {
    let features = {
            /*tags: !Math.min(
            ...badcnamp.state.library.albums.map((i) => i?.tags?.length)
        ),*/
            // eslint-disable-next-line no-undef
            tags: badcnamp.state.library.albums
                .filter((i) => !i?.tags?.length)
                .map((i) => i.id),
            // eslint-disable-next-line no-undef
            durations: badcnamp.state.library.albums
                .filter((i) => i.tracks.some((j) => !j.duration))
                .map((i) => i.id),
        },
        albumsToUpgrade = Array.from(new Set(Object.values(features).flat()));
    //console.log(features, max);
    if (dryRun) {
        for (let i in features) {
            if (features[i].length) {
                console.log(`will add ${i} to albums ${features[i]}`);
            }
        }
    } else {
        console.log(
            'Exporting library. Please save this somewhere safe in case something breaks!'
        );
        // eslint-disable-next-line no-undef
        console.log(badcnamp.export());
        //if (Object.values(features).some((i) => i)) {
        if (albumsToUpgrade.length) {
            let albums = albumsToUpgrade.map((i) => library.albums[i]);
            if (features.tags) {
                library.tags = library?.tags || {};
            }
            if (max == 0) {
                max = albums.length;
            }
            for (let i = 0; i < max && i < albums.length; i++) {
                let album = albums[i],
                    albumFeatures = {};
                for (let feature in features) {
                    albumFeatures[feature] = features[feature].includes(
                        album.id
                    );
                }
                // do an || of any features that require parsing everything
                albumFeatures.mustParse = albumFeatures.durations;
                await fetch(settings.path + album.link)
                    .then(
                        (result) => result.text(),
                        () => {
                            console.log(album);
                        }
                    )
                    .then((result) => {
                        if (albumFeatures.tags) {
                            let tags = parseTags(result);
                            album.tags = tags;
                            for (let tag of tags) {
                                library.tags[tag] =
                                    library.tags[tag] || new Tag(tag);
                                let lTag = library.tags[tag];
                                for (let artist in album.albumArtists) {
                                    lTag.artists[artist] = 1;
                                }
                                lTag.albums.push(album);
                                lTag.tracks.push(...album.tracks);
                            }
                        }
                        if (albumFeatures.mustParse) {
                            let tralbumData = parseTralbumData(result),
                                trackInfo = tralbumData.trackinfo,
                                [titleReplace, splitCharacter] =
                                    doTheFunkyTitleThing(trackInfo),
                                trackPointer = 0,
                                tracks = album.tracks;
                            for (let j of trackInfo) {
                                let parsedTitle = j.title
                                        .replace(titleReplace, '')
                                        .match(splitCharacter),
                                    trackArtist =
                                        j.artist ||
                                        (parsedTitle
                                            ? parsedTitle[1]
                                            : tralbumData.artist),
                                    trackTitle = parsedTitle
                                        ? parsedTitle[3]
                                        : j.title.replace(titleReplace, '');
                                // needs to have the ?. for if you delete the last track in an album
                                if (
                                    trackTitle ==
                                        tracks?.[trackPointer]?.title &&
                                    trackArtist ==
                                        tracks?.[trackPointer]?.rawArtistString
                                ) {
                                    if (albumFeatures.durations) {
                                        tracks[trackPointer].duration =
                                            trackInfo[trackPointer].duration;
                                    }
                                    trackPointer++;
                                }
                            }
                        }
                    })
                    .catch((e) => {
                        console.log(album, e);
                    });
            }
        }
    }
}

function sortArray(arr, method = undefined) {
    let sorted = arr;
    switch (method) {
        case 'title':
            sorted = arr.sort(
                (a, b) =>
                    (a.title.toLocaleLowerCase() >
                        b.title.toLocaleLowerCase()) *
                        2 -
                    1
            );
            break;
        case 'artist':
            sorted = arr.sort(
                (a, b) =>
                    (`${(
                        b.rawArtistString || b.artist
                    ).toLocaleLowerCase()} - ${b.title.toLocaleLowerCase()}` <
                        `${(
                            a.rawArtistString || a.artist
                        ).toLocaleLowerCase()} - ${a.title.toLocaleLowerCase()}`) *
                        2 -
                    1
            );
            break;
        // a direct string comparison
        case 'string':
            sorted = arr.sort(
                (a, b) =>
                    (a.toLocaleLowerCase() > b.toLocaleLowerCase()) * 2 - 1
            );
            break;
        // lol method, useful in some functions
        case 'none':
            sorted = arr;
            break;
        default:
            if (method) {
                try {
                    let fun = Function('a', `return a${method}`);
                    sorted = arr.sort((a, b) => (fun(a) > fun(b)) * 2 - 1);
                } catch {
                    sorted = arr.sort();
                }
            } else {
                sorted = arr.sort();
            }
            break;
    }
    return sorted;
}

function filterArray(array, method, data) {
    let filtered = array;
    switch (method) {
        case 'title':
            filtered = filtered.filter((i) => i.title.match(data));
            break;
        case 'artist':
            filtered = filtered.filter(
                (i) => i?.rawArtistString?.match(data) || i?.artist?.match(data)
            );
            break;
        case 'string':
            filtered = filtered.filter((i) => i.match(data));
            break;
        case 'none':
            break;
        default:
            try {
                let fun = Function('$', `return ${method}${data || ''}`);
                /*if (data) {
                    fun = Function('i', `return i${method}i${data}`);
                } else {
                    fun = Function('i', `return i${method}`);
                }*/
                filtered = filtered.filter(fun);
            } catch (e) {
                console.log(e);
                filtered = [];
            }
            break;
    }
    return filtered;
}

function accordion(headerText, size = 'h4') {
    let div = document.createElement('div'),
        innerDiv = document.createElement('div'),
        header = document.createElement(size),
        open = false;
    header.innerHTML = headerText + ' >';
    innerDiv.style.display = 'none';
    div.appendChild(header);
    div.appendChild(innerDiv);
    header.addEventListener('click', () => {
        open = !open;
        innerDiv.style.display = open ? 'unset' : 'none';
        header.innerHTML = headerText + (open ? ' v' : ' >');
    });
    return div;
}

function getLinkType(link) {
    let type;
    if (!/https:\/\//.test(link)) return false;
    if (link.match(/bandcamp\.com\/tag\//)) {
        type = 'tag';
    } else if (/(album|track)/.test(link)) {
        type = 'album';
    } else {
        // could be band but is called this for consistancy
        type = 'label';
    }
    return type;
}

/* guide to bandcamp image types:
0 - 1500x1500
1 - 1500x1500
2 - 350x350
3 - 100x100
4 - 300x300
5 - 700x700
6 - 100x100
7 - 150x150
8 - 124x124
9 - 210x210
10 - 1200x1200
11 - 172x172
12 - 138x138
13 - 380x380
14 - 368x368
15 - 135x135
16 - 700x700
20 - 1024x1024
21 - 120x120
22 - 25x25
23 - 300x300
24 - 300x300
25 - 700x700
26 - 800x600 (4:3)
27 - 715x402 (715:402)
28 - 768x432 (16:9)
29 - 100x75 (4:3)
31 - 1024x1024
32 - 380x285 (4:3)
33 - 368x276 (4:3)
36 - 400x300 (4:3)
37 - 168x126 (4:3)
38 - 144x108 (4:3)
41 - 210x210
42 - 50x50
43 - 100x100
44 - 200x200
50 - 140x140
65 - 700x700
66 - 1200x1200
67 - 350x350
68 - 210x210
69 - 700x700
70 - 270x270
71 - 540x540
100 - 975x180 (65:12)
101 - 90x90
120 - 640x124 (160:31)
130 - 1500x1500
140 - 60x45 (4:3)
150 - 1280x720 (16:9)
151 - 720x1280 (9:16)
160 - 60x100 (3:5)
161 - 40x80 (1:2)
165 - 210x210, has 'gift' label
170 - 422x422
171 - 646x646
180 - 646x646
200 - 420x420
201 - 280x280
202 - 140x140
203 - 420x420
204 - 360x360
205 - 240x240
206 - 180x180
207 - 120x120
220 - 900x468 (25:13)
300 - 350x350, grayscale
(extracted by a script that checked types up to 1000, but there may be more)
*/
/**
 *
 * @param {String|Number} link The link to an image or the id of an image
 * @param {Number} type An image type (see above)
 * @returns {String} A link to an image of the given id and type
 */
function getImageType(link, type) {
    let id = /^\d+$/.test(link) ? 'a' + link : link.match(/\/(\w?\d+)_/)[1];
    return `https://f4.bcbits.com/img/${id}_${type}.jpg`;
}

/**
 * Formats a time in seconds as a string.
 * @param {Number} time Current time
 * @param {Number} length Total length of the song (for choosing whether to include the hour digit)
 * @returns {String} The formatted time
 */
function tformat(time, length) {
    let hour = '',
        minutes = ('0' + (((time / 60) | 0) % 60) + ':').slice(-3),
        seconds = ('0' + (time % 60 | 0)).slice(-2);
    if (length > 3600) {
        hour = ((time / 3600) | 0) + ':';
    }
    return hour + minutes + seconds;
}

function getStyle(element) {
    let oldStyle = element.style,
        // this works to get the style string (see style variable above) from a CSSStyleDeclaration
        actualOldStyle = [...oldStyle]
            .map((i) => `${i}: ${oldStyle[i]}`)
            .join('; ');
    return actualOldStyle;
}

/**
 * Easy one-stop function to create and set up an element or even trees of elements.
 * @param {String} tag The type of element to create
 * @param {HTMLElement} [parent] (optional) Parent element to add this one to
 * @param {Object} [properties={}] Properties (e.g. innerHTML) to set on the element
 * @param {Array<Object|HTMLElement>} [properties.children] Optional short-circuit to create nested element, but prevents returning them
 * @param {String} properties.children[].tag Tag for the child
 * @param {Object} properties.children[].properties Properties for the child
 * @param {Function} [properties.oncreate] Optional function to run once the element has been fully created
 * @param {Array<String>} [properties.classes] Classes to add to the created object
 * @returns {HTMLElement} The created element
 */
function createElement(tag, parent, properties = {}) {
    let element = document.createElement(tag),
        oncreate;
    if (parent) {
        parent.append(element);
    }
    for (let i in properties) {
        switch (i) {
            case 'children':
                for (let child of properties.children) {
                    if (child instanceof HTMLElement) {
                        element.append(child);
                    } else {
                        createElement(child.tag, element, child.properties || {});
                    }
                }
                break;
            // delay running the oncreate function until all properties have been initialized
            case 'oncreate':
                oncreate = properties.oncreate;
                break;
            case 'classes':
                element.classList.add(...properties[i]);
                break;
            default:
                element[i] = properties[i];
        }
    }
    if (oncreate) {
        oncreate(element);
    }
    return element;
}

/**
 *
 * @param {Number} seconds number of seconds to sleep
 * @param {Function} [callback] (optional) callback to avoid having to use await
 * @returns {Promise|undefined}
 */
function sleep(seconds, callback = null) {
    if (callback) {
        setTimeout(callback, seconds * 1000);
    } else {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }
}

const stupidRegex =
    /^(.+?) ?([^\p{Quotation_Mark}\p{Dash}\p{L}\p{White_Space}\p{Terminal_Punctuation}\p{N}[\](){}~^_&/$\\\uFEFF’]) ?(?!\p{LC})((?:(?!\2).)+)$/u;

export {
    createP,
    iconLink,
    createIcon,
    createLongP,
    parseTralbumData,
    parseTags,
    parseFromDom,
    createTrackDiv,
    doTheFunkyTitleThing,
    guessTheTitle,
    stupidRegex,
    isOutdated,
    splitArtists,
    rateLimit,
    upgradeLibrary,
    sortArray,
    filterArray,
    accordion,
    getLinkType,
    getImageType,
    tformat,
    getStyle,
    createElement,
    sleep,
};
