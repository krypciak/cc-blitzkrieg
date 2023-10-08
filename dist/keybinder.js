"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyBinder = exports.InputKey = void 0;
class InputKey {
    constructor(key, name, description, category, hasDivider, header, onPress, parent, global) {
        this.key = key;
        this.name = name;
        this.description = description;
        this.category = category;
        this.hasDivider = hasDivider;
        this.header = header;
        this.onPress = onPress;
        this.parent = parent;
        this.global = global;
        this.id = 'keys-' + name;
    }
    checkForKeyPress() {
        if (ig.input.pressed(this.name)) {
            this.onPress.bind(this.parent)();
        }
    }
    bind() {
        const key = this;
        sc.OPTIONS_DEFINITION[key.id] = {
            type: 'CONTROLS',
            init: { key1: key.key },
            cat: key.category,
            hasDivider: key.hasDivider,
            header: key.header,
        };
        if (!key.global) {
            ig.ENTITY.Player.inject({
                update(...args) {
                    key.checkForKeyPress();
                    return this.parent(...args);
                }
            });
        }
    }
    updateLabel() {
        if (this.global) {
            ig.game.addons.preUpdate.push(this);
        }
        ig.lang.labels.sc.gui.options.controls.keys[this.name] = this.description;
    }
    onPreUpdate() {
        this.checkForKeyPress();
    }
}
exports.InputKey = InputKey;
class KeyBinder {
    constructor() {
        this.keys = [];
    }
    addKey(key) {
        this.keys.push(key);
    }
    bind() {
        for (const key of this.keys) {
            key.bind();
        }
    }
    updateLabels() {
        for (const key of this.keys) {
            key.updateLabel();
        }
    }
    addHeader(name, displayName) {
        ig.lang.labels.sc.gui.options.headers[name] = displayName;
    }
}
exports.KeyBinder = KeyBinder;
