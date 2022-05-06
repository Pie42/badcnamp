import settings from './constants/PlayerConstants.js';
import Tag from './library/Tag.js';

/**
 *
 * @param {HTMLDivElement} parentElement
 * @param {String} innerText
 * @param {Function} onclick
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

/**
 * Creates a 'p' element inside of a div with classes to let it truncate the 'p' via css.
 * @param {HTMLElement} parentElement The element to put the new div in.
 * @param {String} innerHTML The text (or really anything) to put inside of the 'p' element.
 * @param {Function} onclick The function to call upon clicking the 'p' element.
 * @returns {HTMLDivElement} The div with the 'p' element in it.
 */
function createLongP(parentElement, innerHTML, onclick) {
    let div = document.createElement('div'),
        p = createP(div, innerHTML, onclick);
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
            e.stopPropagation();
        } else {
            library.play(track, index, scope);
        }
    });
    trackDiv.onclick = i.firstChild.onclick;

    if (fancy) {
        i.firstChild.classList.add('fancy-track-p');
    } else {
        i.firstChild.classList.add('track-p');
    }

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
    menuP.style.width = '10px';
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
    let tralbumData = result.match(/data-tralbum="(.+?\})"/)[1],
        corrected = parseFromDom(tralbumData);
    return JSON.parse(corrected);
}

function parseTags(result) {
    let tags = result.match(/"keywords":(\[.*?\])/)[1],
        corrected = parseFromDom(tags);
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
    let titles = trackInfo.map((i) => i.title).join('\n'),
        numbering = titles.match(
            /([\d\w\. ]+)(\d)([\. ]*)(?!\n)\D.+\n(\1(?!\2)\d\3)/
        ),
        rumbening = numbering
            ? new RegExp(numbering[4].replaceAll(/\d/g, '\\d+'), 'g')
            : '',
        titling = titles.replaceAll(rumbening, '');
    if (titling.match(/ - .+\n.+ - /)) {
        titling = ' - ';
    } else {
        titling = titling.match(
            /(.+)([^\p{L}\n \p{Pe}\p{Ps}\p{N}'.!?-])((?:.(?!\2))+)\n.+\2(?!\3)/iu
        )?.[2];
    }
    let titlinging = new RegExp(`(.+?)(${titling}| - )(.+)`);
    return [rumbening, titlinging];
}

/**
 * A function to split names of multiple artists into the separate artist names,
 * to make the artist view cleaner.
 * @param {String} artist The name of the artist
 * @returns {Array} An array containing the split and corrected name of the artist(s)
 */
function splitArtists(artist) {
    try {
        let split = artist.split(/(?: vs | \& | feat\. | x |\, | \+ )/i);
        split.splitters = artist.split(/( vs | \& | feat\. | x |\, | \+ )/i);
        return split;
    } catch (error) {
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
        track.file.match(/ts=(.+?)\&/)[1] * 1000 - Date.now() < 5000000
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
function rateLimit(callback, max, rate = 100, step = 100) {
    function* generate() {
        for (let i = 0; i < max; ) {
            for (let j = step; j > 0 && i < max; j--, i++) {
                callback(i);
            }
            yield i;
        }
        return;
    }

    let generator = generate(),
        genInterval = window.setInterval(() => {
            if (generator.next().done) {
                window.clearInterval(genInterval);
            }
        }, rate);
    generator.next();
    return () => {
        window.clearInterval(genInterval);
    };
}

async function upgradeLibrary(library, max = 0) {
    let features = { tags: !library.tags };
    console.log(features, max);
    if (Object.values(features).some((i) => i)) {
        let albums = library.albums;
        if (features.tags) {
            library.tags = {};
        }
        for (let i = 0; i < max || albums.length; i++) {
            let album = albums[i];
            await fetch(settings.path + album.link)
                .then(
                    (result) => result.text(),
                    () => {
                        console.log(album);
                    }
                )
                .then((result) => {
                    if (features.tags) {
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
                })
                .catch(() => {
                    console.log(album);
                });
        }
    }
}

function sortArray(arr, method, propertyChain = undefined) {
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
        case 'custom':
            if (propertyChain) {
                let fun = Function('a', `return a${propertyChain}`);
                sorted = arr.sort((a, b) => (fun(a) > fun(b)) * 2 - 1);
            }
            break;
        default:
            break;
    }
    return sorted;
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

const stupidRegex =
    /^(.+?) ?([^\p{Quotation_Mark}\p{Dash}\p{L}\p{White_Space}\p{Terminal_Punctuation}\p{N}\[\]\(\)\{\}~\^_&\/$\\\uFEFF]) ?(?!\p{LC})((?:(?!\2).)+)$/u;

export {
    createP,
    createLongP,
    parseTralbumData,
    parseTags,
    createTrackDiv,
    doTheFunkyTitleThing,
    stupidRegex,
    isOutdated,
    splitArtists,
    rateLimit,
    upgradeLibrary,
    sortArray,
    accordion,
};
