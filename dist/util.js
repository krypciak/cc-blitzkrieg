"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
class Util {
    static async syncDialog(text, buttons) {
        sc.BUTTON_TYPE.SMALL.valueOf = () => {
            return sc.BUTTON_TYPE.SMALL.height;
        };
        return new Promise((resolve) => {
            const popup = new sc.ModalButtonInteract(text, null, buttons, (button) => {
                resolve(button.text.toString());
            });
            ig.gui.addGuiElement(popup);
            popup.show();
        });
    }
    static async waitForPositionKey() {
        blitzkrieg.rhudmsg('blitzkrieg', 'Waiting for position key', 1);
        return new Promise((resolve) => {
            Util.waitingForPos = true;
            let intervalId = setInterval(function () {
                if (Util.waitingForPos == false) {
                    clearInterval(intervalId);
                    const pos = ig.game.playerEntity.coll.pos;
                    for (const i in ig.game.levels) {
                        if (ig.game.levels[i].height + 5 >= pos.z &&
                            ig.game.levels[i].height - 5 <= pos.z) {
                            pos.level = parseInt(i);
                            resolve(pos);
                            return;
                        }
                    }
                    throw new Error('level not found');
                }
            });
        });
    }
}
exports.Util = Util;
Util.waitingForPos = false;
