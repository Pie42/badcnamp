// to avoid a somewhat obvious problem that i didn't even realize until i started working on this,
// the settings for badcnamp will always be saved to localstorage as badcnamp-settings (ignoring the prefix)
// TODO: fix this
let defaultSettings = { namespace: 'badcnamp', path: '' },
    saved = localStorage.getItem('badcnamp-settings'),
    settings = saved ? JSON.stringify(saved) : defaultSettings;

settings.save = function () {
    localStorage.setItem('badcnamp-settings', JSON.stringify(settings));
};

export default settings;
