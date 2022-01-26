import PlayerState from "./player/state/PlayerState.js";
import DataLoader from "./player/state/DataLoader.js";

export default function initialise() {
    DataLoader.init();
    let badcnamp = {};
    badcnamp.state = new PlayerState();
    badcnamp.state.load();
    window.badcnamp = badcnamp;
}