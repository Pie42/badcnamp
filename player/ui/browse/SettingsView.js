import settings from '../../constants/PlayerConstants.js';
import { createElement } from '../../Util.js';

class Setting {
    constructor(name, description, key, type) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.key = key;

        this.changed = false;
        this.oldValue = settings[this.key];

        this.div = createElement('div');
        this.nameDisplay = createElement('h3', this.div, {
            innerText: this.name,
            classes: ['setting-name'],
        });
        this.descriptionDisplay = createElement('p', this.div, {
            innerText: this.description,
            classes: ['setting-description'],
        });
        this.input = createElement('input', this.div, {
            type: this.type,
            value: this.oldValue,
            onchange: () => {
                this.changed = this.input.value != this.oldValue;
            },
        });
    }
}

export default class SettingsView {
    // eslint-disable-next-line no-unused-vars
    constructor(manager, data) {
        this.manager = manager;
        this.library = this.manager.library;

        this.settings = [
            new Setting(
                'CORS Proxy Path',
                'The path to a CORS proxy (or leave this blank if you have an extension)',
                'path'
            ),
            new Setting(
                'LocalStorage Namespace',
                'What to prefix items saved in localstorage with',
                'namespace'
            ),
        ];

        this.div = createElement('div', null, {
            oncreate: (e) => e.append(...this.settings.map((i) => i.div)),
        });

        this.saveButton = createElement('button', this.div, {
            onclick: () => {
                for (let i of this.settings.filter((j) => j.changed)) {
                    settings.set(i.key, i.input.value);
                    i.oldValue = i.input.value;
                }
                settings.save();
            },
            innerText: 'Save',
        });
    }
}
