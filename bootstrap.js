import PlayerState from './player/state/PlayerState.js';
import DataLoader from './player/state/DataLoader.js';
import settings from './player/constants/PlayerConstants.js';
import Timer from './player/Timer.js';
import { upgradeLibrary } from './player/Util.js';

export default function initialise() {
    DataLoader.init();
    Timer.init();
    let badcnamp = {};
    badcnamp.state = new PlayerState();
    badcnamp.state.load();
    badcnamp.settings = settings;
    badcnamp.export = badcnamp.state.library.completeExport.bind(
        badcnamp.state.library
    );
    badcnamp.upgrade = function (max) {
        upgradeLibrary(badcnamp.state.library, max);
    };
    window.badcnamp = badcnamp;
}
