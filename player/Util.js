/**
 *
 * @param {HTMLDivElement} parentElement
 * @param {String} innerHTML
 * @param {Function} onclick
 * @returns {HTMLParagraphElement}
 */
function createP(parentElement, innerHTML, onclick, classes = []) {
    let p = document.createElement('p');
    p.innerHTML = innerHTML;
    p.classList.add('pointer-hover');
    p.classList.add(...classes);
    //p.style.display = 'inline';
    p.onclick = onclick;
    parentElement.appendChild(p);
    return p;
}

function createLongP(parentElement, innerHTML, onclick) {
    let div = document.createElement('div'),
        p = createP(div, innerHTML, onclick);
    /*p.style.overflow = 'hidden';
    p.style.whiteSpace = 'nowrap';
    p.style.textOverflow = 'ellipsis';
    p.style.width = '100%';
    p.style.marginRight = '8px';
    p.style.display = 'block';*/
    p.classList.add('long-p');
    /*div.style.width = '100%';
    div.style.overflow = 'hidden';
    div.style.flexGrow = '1';*/
    div.classList.add('long-div');
    parentElement.appendChild(div);
    return div;
    //parentElement.appendChild(p);
    //return p;
    /*let p = createP(parentElement, innerHTML, onclick);
    p.style.overflow = 'hidden';
    p.style.whiteSpace = 'nowrap';
    p.style.textOverflow = 'ellipsis';
    p.style.width = '100%';
    return p;*/
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
    let i = createLongP(trackDiv, name, () => {
        library.play(track, index, scope);
    });
    trackDiv.onclick = i.children[0].onclick;
    let menuP = createP(trackDiv, '\u22ee', (e) => {
        e.stopPropagation();
        library.uimanager.browseui.trackMenu.switch(menuP, track);
    });
    //i.style.display = 'inline';
    i.style.marginRight = '4px';
    menuP.style.paddingRight = '8px';
    parent.appendChild(trackDiv);
}

function parseTralbumData(result) {
    return JSON.parse(
        result
            .match(/data-tralbum="(.+?\})"/)[1]
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('\n', '<br>')
            .replaceAll('&amp;', '&')
    );
}

/**
 * A function that produces a regex to replace track numbers and a regex to split
 * track names in albums with poorly formatted data.
 *
 * E.G.
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
 * accuracy with as few false positives as possible.
 * @param {Object} trackInfo An object with information about the tracks in an album.
 * @returns {['' | RegExp, RegExp]} An array with the regular expressions to match with.
 */
function doTheFunkyTitleThing(trackInfo) {
    let titles = trackInfo.map((i) => i.title).join('\n'),
        //let titles = trackInfo[0].title + '\n' + trackInfo[1].title,
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
        titling = titling.match(/(.+)([^\p{L}\n ])(.+)\n\1\2(?!\3)/iu)?.[2];
    }
    let titlinging = new RegExp(`(.+?)(${titling}| - )(.+)`);
    return [rumbening, titlinging];
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

const stupidRegex =
    /^(.+?) ?([^\p{Quotation_Mark}\p{Dash}\p{L}\p{White_Space}\p{Terminal_Punctuation}\p{N}\[\]\(\)\{\}~\^_&\/$\\\uFEFF]) ?(?!\p{LC})((?:(?!\2).)+)$/u;

export {
    createP,
    createLongP,
    parseTralbumData,
    createTrackDiv,
    doTheFunkyTitleThing,
    stupidRegex,
    isOutdated,
};
