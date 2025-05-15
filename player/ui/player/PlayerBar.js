import settings from '../../constants/PlayerConstants.js';
import ControlsUI from './ControlsUI.js';
import { getImageType, tformat, getStyle } from '../../Util.js';
// types
// eslint-disable-next-line no-unused-vars
import PlayerUI from '../PlayerUI.js';
// eslint-disable-next-line no-unused-vars
import Track from '../../library/Track.js';
// eslint-disable-next-line no-unused-vars
import Artist from '../../library/Artist.js';

export default class PlayerBar {
    /**
     *
     * @param {PlayerUI} player The main player
     */
    constructor(player) {
        this.player = player;

        this.full = false;

        this.queueStyle = '';

        this.div = document.createElement('div');
        this.div.classList.add('player-bar');
        this.bgCrop = document.createElement('div');
        this.bgCrop.classList.add('player-bar-background-crop');
        this.background = document.createElement('div');
        this.background.classList.add('player-bar-background');
        this.infoDiv = document.createElement('div');
        this.supplementalDiv = document.createElement('div');
        this.supplementalDiv.classList.add('player-bar-queue');
        this.queueDiv = document.createElement('div');
        this.cover = document.createElement('img');
        this.cover.classList.add('player-bar-cover');
        //this.cover2 = document.createElement('img');
        this.wordsBar = document.createElement('div');
        this.wordsBar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.player.trackMenu.switch(
                this.wordsBar,
                this.player.library.playing,
                { x: e.clientX, y: e.clientY }
            );
        });
        this.title = document.createElement('h2');
        this.bottomText = document.createElement('div');
        this.artist = document.createElement('div');
        this.aaseperator = document.createElement('p');
        this.atseperator = document.createElement('p');
        this.album = document.createElement('h3');
        this.controls = new ControlsUI(this.player, true);
        this.timeBarContainer = document.createElement('div');
        this.timeBarContainer.classList.add('time-bar-container');
        this.timeBarContainer.onclick = (e) => {
            e.stopPropagation();
            this.timeMouseDown = false;
            if (!this.duration) return;
            this.player.audio.currentTime =
                this.duration *
                (e.offsetX /
                    this.timeBarContainer.getBoundingClientRect().width);
        };
        this.timeMouseDown = false;
        this.timeBarContainer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.timeMouseDown = true;
            this.timeBar.style.width = `${
                (e.offsetX /
                    this.timeBarContainer.getBoundingClientRect().width) *
                100
            }%`;
        });
        document.addEventListener('mousemove', (e) => {
            if (!this.timeMouseDown) return;
            let rect = this.timeBarContainer.getBoundingClientRect(),
                width = (e.clientX - rect.x) / rect.width,
                percentWidth = Math.max(0, Math.min(1, width)) * 100;
            this.timeBar.style.width = `${percentWidth}%`;
            this.timeDisplay.innerText = tformat(
                this.duration * percentWidth / 100,
                this.duration
            );
        });
        document.addEventListener('mouseup', (e) => {
            if (!this.timeMouseDown) return;
            let rect = this.timeBarContainer.getBoundingClientRect(),
                width = (e.clientX - rect.x) / rect.width,
                clipWidth = Math.max(0, Math.min(1, width));
            this.player.audio.currentTime = this.duration * clipWidth;
            this.timeMouseDown = false;
            this.timeUpdate();
        });
        this.timeBar = document.createElement('div');
        this.timeBar.classList.add('time-bar');
        this.player.audio.addEventListener(
            'timeupdate',
            this.timeUpdate.bind(this)
        );
        this.infoBg = document.createElement('div');
        this.infoBg.classList.add('player-bar-info-bg');
        this.downButton = document.createElement('div');
        this.downButton.style.display = 'none';
        this.downButton.onclick = (e) => {
            e.stopPropagation();
            this.collapse();
        };
        this.timeContainer = document.createElement('div');
        this.durationDisplay = document.createElement('h3');
        this.dtSeperator = document.createElement('h3');
        this.dtSeperator.innerText = '\u200b / \u200b';
        this.timeDisplay = document.createElement('h3');

        this.album.onclick = (e) => {
            e.stopPropagation();
            if (this.player.library.playing) {
                this.player.browseui.switchUI(
                    'album',
                    this.player.library.playing.album
                );
            }
            this.collapse();
        };
        this.controls.div.onclick = (e) => {
            e.stopPropagation();
        };
        this.div.onclick = this.expand.bind(this);
        this.playing = undefined;
        this.duration = undefined;

        this.timeBarContainer.appendChild(this.timeBar);
        this.bgCrop.appendChild(this.background);
        this.div.appendChild(this.bgCrop);
        this.div.appendChild(this.timeBarContainer);
        this.infoDiv.appendChild(this.cover);
        this.wordsBar.appendChild(this.title);
        this.wordsBar.classList.add('player-bar-words');
        this.bottomText.appendChild(this.artist);
        this.aaseperator.innerText = this.atseperator.innerText = '\u30fb'; //・
        this.bottomText.appendChild(this.aaseperator);
        this.bottomText.appendChild(this.album);
        this.timeContainer.appendChild(this.timeDisplay);
        this.timeContainer.appendChild(this.dtSeperator);
        this.timeContainer.appendChild(this.durationDisplay);
        this.bottomText.appendChild(this.atseperator);
        this.bottomText.appendChild(this.timeContainer);
        this.wordsBar.appendChild(document.createElement('br'));
        this.wordsBar.appendChild(this.bottomText);
        this.infoDiv.appendChild(this.wordsBar);
        this.infoDiv.appendChild(this.controls.div);
        this.infoDiv.appendChild(this.infoBg);
        this.div.appendChild(this.infoDiv);
        this.supplementalDiv.appendChild(this.queueDiv);
        this.div.appendChild(this.supplementalDiv);
        this.div.appendChild(this.downButton);
        this.elements = [
            'div',
            'bgCrop',
            'background',
            'cover',
            'wordsBar',
            'title',
            'bottomText',
            'artist',
            'aaseperator',
            'atseperator',
            'album',
            'timeBarContainer',
            'timeBar',
            'infoBg',
            'downButton',
            'infoDiv',
            'queueDiv',
            'supplementalDiv',
            'timeDisplay',
            'dtSeperator',
            'durationDisplay',
        ];
        this.hidden = false;
        this.hide();
        if (this.player.library.playing) {
            this.show();
        }
    }

    /**
     *
     * @param {Track} playing
     * @param {Artist} artist
     */
    updateMetadata(playing, artist) {
        this.playing = playing;
        this.duration = this.player.audio.duration;
        // hacky workaround to keep the leading space
        this.durationDisplay.innerText = tformat(this.duration, this.duration);
        this.timeDisplay.innerText = tformat(0, this.duration);
        this.artist.innerHTML = '';
        let j = artist.cloneNode(true);
        for (let i in [...j.children]) {
            j.children[i].onclick = (e) => {
                e.stopPropagation();
                artist.children[i]?.onclick();
                this.collapse();
            };
            j.children[i].style.display = 'inline-block';
        }
        //console.log(j);
        this.artist.appendChild(j);
        //this.artist.appendChild(artist);
        //console.log(this.artist.children);

        this.cover.src = playing.album.image;
        this.background.style = `background-image: url(${
            getImageType(playing.album.image, 101)
        })`;
        this.title.innerText = playing.title;
        this.album.innerText = playing.album.title;
    }

    hide() {
        if (!this.hidden) {
            this.div.style.display = 'none';
            this.player.div.style.height = '100%';
            this.player.browseui.div.style.height = '100%';
            this.hidden = true;
        }
    }

    show() {
        if (this.hidden) {
            this.div.style.display = 'flex';
            this.player.div.style.height = 'calc(89.75% - 2px)';
            this.player.browseui.div.style.height = 'calc(89.75% - 2px)';
            this.hidden = false;
        }
    }

    expand() {
        if (!this.full) {
            document.dispatchEvent(new CustomEvent('menuclose'));
            this.full = true;
            //to-do: better-ify (aka put it in style.css)
            {
                this.div.style = 'height: 100%; top: 0%;';
                this.wordsBar.style = `display: block;
                    width: 80%;
                    left: 10%;
                    position: relative;
                    overflow: visible;`;
                this.title.style = `text-align: center;
                    width: 100%;
                    max-width: 90%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    padding-left: 5%;
                    padding-right: 5%;
                    margin-inline: 0px;`;
                this.bottomText.style = `width: 100%;
                    display: flex;
                    text-align: center;
                    justify-content: center;
                    margin-inline: 2px;`;
                this.artist.style = `display: flex;
                    text-align: center;
                    max-width: 45%;`;
                this.aaseperator.style = `display: flex;`;
                this.atseperator.style = `display: block;
                    width: 0px;
                    padding: 0px;
                    overflow: hidden;`;
                this.album.style = `text-align: center;
                    display: flex;
                    max-width: 45%;
                    overflow: scroll;`;
                this.controls.div.style = `right: 0px;
                    left: 0px;
                    margin: auto;
                    padding-right: 50%;
                    position: absolute;`;
                this.downButton.style = `display: block;
                    transform: rotate(45deg);
                    border-right-style: solid;
                    border-bottom-style: solid;
                    border-width: max(min(4px,min(0.75vw,1vh)),2px);
                    border-color: var(--text-color);
                    height: max(min(5vh,4vw),10px);
                    width: max(min(5vh,4vw),10px);
                    position: absolute;
                    left: min(4vh,3vw);
                    cursor: pointer;`;
                this.bgCrop.style = `width: 110%;
                    left: -5%;
                    height: 110%;
                    top: -5%;`;
                this.durationDisplay.style = `position: absolute;
                    top: -3vh;
                    font-size: 0.75em;
                    right: min(calc(max(calc(12.5vw - 30vh), 0px) + 7.8vw), 100%);`;
                this.dtSeperator.style = `display: none;`;
                this.timeDisplay.style = `position: absolute;
                    top: -3vh;
                    font-size: 0.75em;
                    left: min(calc(max(calc(12.5vw - 30vh), 0px) + 7.5vw), 100%);`;
            }
            //this.player.queueui.div;
            //this.cover.style = 'height: 50%';
            if (innerHeight / innerWidth < 3 / 4) {
                // desktop / 2 column layout
                this.infoDiv.style = 'width: 50%;';
                this.supplementalDiv.style = 'width: 50%; left: 50%;';
                this.queueDiv.style = `backdrop-filter: brightness(0.5);
                    position: relative;
                    top: 10%;
                    left: 10%;
                    width: 80%;
                    height: 80%;
                    border-radius: 10px;
                    border: 10px solid transparent;
                    box-sizing: border-box;`;
                this.queueStyle = getStyle(this.player.queueui.div);
                this.player.div.removeChild(this.player.queueui.div);
                this.queueDiv.appendChild(this.player.queueui.div);
                this.player.queueui.div.style.display = 'block';
                this.player.queueui.current.div.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                this.cover.style = `padding-inline: 25%;
                width: min(25vw, 60vh);
                padding-top: calc(60vh - 25vw);
                padding-bottom: 3vh;
                height: min(25vw, 60vh);
                margin-left: max(calc(12.5vw - 30vh), 0px);`;
                this.timeBarContainer.style = `width: min(25vw, 60vh);
                left: 12.5%;
                top: 60vh;
                border: 0px;
                background-color: transparent;
                backdrop-filter: brightness(0.8);
                transition: 0.25s height;
                margin-left: max(calc(12.5vw - 30vh), 0px);`;
                this.infoBg.style = `position: absolute;
                    width: 40%;
                    height: 80%;
                    top: 10%;
                    left: 5%;
                    backdrop-filter: brightness(0.5);
                    z-index: -1;
                    border-radius: 10px;
                    border: 10px solid transparent;
                    box-sizing: border-box;`;
            } else {
                // mobile / 1 column layout
                this.infoDiv.style = 'width: 100%;';
            }
            this.timeUpdate();
        }
    }

    collapse() {
        if (this.full) {
            document.dispatchEvent(new CustomEvent('menuclose'));
            this.full = false;
            this.queueDiv.removeChild(this.player.queueui.div);
            this.player.div.appendChild(this.player.queueui.div);
            this.player.queueui.div.style = this.queueStyle;
            this.player.queueui.current.div.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            for (let i of this.elements) {
                this[i].style = '';
            }
            this.controls.div.style = '';
            this.background.style = `background-image: url(${
                settings.path + getImageType(this.playing.album.image, 101)
            })`;
            this.timeUpdate();
        }
    }

    timeUpdate() {
        if (this.timeMouseDown) return;
        this.timeBar.style.width = `${
            (this.player.audio.currentTime / this.duration) * 100
        }%`;
        this.timeDisplay.innerText = tformat(
            this.player.audio.currentTime,
            this.duration
        );
    }

    registerEvents() {
        document.addEventListener('queuechange', this.show.bind(this));
        document.addEventListener('queueempty', this.hide.bind(this));
    }
}
