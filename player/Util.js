/**
 *
 * @param {HTMLDivElement} parentElement
 * @param {String} innerHTML
 * @param {Function} onclick
 * @returns {HTMLParagraphElement}
 */
function createP(parentElement, innerHTML, onclick) {
    let p = document.createElement('p');
    p.innerHTML = innerHTML;
    p.classList.add('track-select');
    p.style.display = 'inline';
    p.onclick = onclick;
    parentElement.appendChild(p);
    return p;
}

function createLongP(parentElement, innerHTML, onclick) {
    let div = document.createElement('div'),
        p = createP(div, innerHTML, onclick);
    p.style.overflow = 'hidden';
    p.style.whiteSpace = 'nowrap';
    p.style.textOverflow = 'ellipsis';
    p.style.width = '100%';
    p.style.marginRight = '8px';
    div.style.width = '100%';
    div.style.overflow = 'hidden';
    div.style.flexGrow = '1';
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

function createTrackDiv(parent, name, track, library) {
    let trackDiv = document.createElement('div');
    createLongP(trackDiv, name, () => {
        library.play(track);
    });
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

export { createP, createLongP, parseTralbumData };
