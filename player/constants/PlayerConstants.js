// to avoid a somewhat obvious problem that i didn't even realize until i started working on this,
// the settings for badcnamp will always be saved to localstorage as badcnamp-settings (ignoring the prefix)
// TODO: fix this
let defaultSettings = { namespace: 'badcnamp', path: '' },
    saved = localStorage.getItem('badcnamp-settings'),
    settings = saved ? JSON.parse(saved) : structuredClone(defaultSettings);

settings.save = function () {
    console.log(settings);
    localStorage.setItem('badcnamp-settings', JSON.stringify(settings));
};

settings.set = function (key, value) {
    switch (key) {
        case 'save':
        case 'set':
        case 'defaults':
            console.error('Key cannot be set!');
            break;
        default:
            if (key in settings) {
                settings[key] = value;
            } else {
                console.error('Key does not exist!');
            }
    }
};

settings.defaults = defaultSettings;

export default settings;
