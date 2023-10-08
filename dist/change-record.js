"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeRecorder = void 0;
const util_1 = require("cc-map-util/src/util");
class ChangeRecorder {
    constructor(tps) {
        this.tps = tps;
        this.recording = false;
        this.loopIndex = -1;
    }
    injectRecordingPrestart() {
        const self = this;
        ig.Vars.inject({
            set(path, value) {
                if (self.recording) {
                    const prev = ig.vars.get(path);
                    let changed = false;
                    if (typeof value === 'object') {
                        changed = JSON.stringify(prev) !== JSON.stringify(value);
                    }
                    else {
                        changed = prev !== value;
                    }
                    if (changed) {
                        self.currentRecord.log.push([self.loopIndex, path, value]);
                        // console.log(`path: ${path} from: ${prev} to: ${value}`)
                    }
                }
                this.parent(path, value);
            },
        });
    }
    startRecording(selM, startingSel) {
        this.selM = selM;
        debugger;
        (0, util_1.assert)(startingSel);
        this.startingSel = startingSel;
        this.currentRecord = {
            log: [],
        };
        this.loopIndex = 0;
        this.recording = true;
        blitzkrieg.rhudmsg('blitzkrieg', 'Started recording for game state changes', 2);
        const self = this;
        const intervalID = setInterval(async () => {
            if (!self.recording) {
                clearInterval(intervalID);
                return;
            }
            if (!ig.perf.gui) {
                clearInterval(intervalID);
                blitzkrieg.rhudmsg('blitzkrieg', 'Stopping game state recording (entered gui)', 2);
                return;
            }
            self.loopIndex++;
        }, 1000 / this.tps);
    }
    stopRecording() {
        var _a;
        var _b;
        this.recording = false;
        blitzkrieg.rhudmsg('blitzkrieg', 'Stopped recording', 2);
        (_a = (_b = this.startingSel).data) !== null && _a !== void 0 ? _a : (_b.data = {});
        this.startingSel.data.recordLog = this.currentRecord;
        this.selM.save();
    }
}
exports.ChangeRecorder = ChangeRecorder;
