import DataLoader from './DataLoader.js';

export default class ProfileManager {
    constructor() {
        this.profiles = [];
        this.activeProfile = '';
        this.activeProfileIndex = 0;
    }

    load() {
        this.profiles = DataLoader.get('profiles', '["Default"]');
        this.activeProfile =
            DataLoader.getRaw('active-profile') || this.profiles[0];
    }

    switchProfiles(profile) {
        let i;
        if ((i = this.profiles.indexOf(profile)) > -1) {
            this.activeProfile = profile;
            this.activeProfileIndex = i;
            this.library.clear();
            this.library.load(this.activeProfile);
            this.uimanager.refresh();
        }
    }

    addProfile(profile) {
        this.profiles.push(profile);
        DataLoader.set('profiles', this.profiles);
        this.switchProfiles(profile);
    }
}
