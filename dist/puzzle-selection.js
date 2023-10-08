"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuzzleSelectionManager = exports.PuzzleCompletionType = exports.PuzzleRoomType = void 0;
const selection_1 = require("./selection");
const util_1 = require("./util");
const change_record_1 = require("./change-record");
var PuzzleRoomType;
(function (PuzzleRoomType) {
    PuzzleRoomType[PuzzleRoomType["WholeRoom"] = 0] = "WholeRoom";
    PuzzleRoomType[PuzzleRoomType["AddWalls"] = 1] = "AddWalls";
    PuzzleRoomType[PuzzleRoomType["Dis"] = 2] = "Dis";
})(PuzzleRoomType || (exports.PuzzleRoomType = PuzzleRoomType = {}));
var PuzzleCompletionType;
(function (PuzzleCompletionType) {
    PuzzleCompletionType[PuzzleCompletionType["Normal"] = 0] = "Normal";
    PuzzleCompletionType[PuzzleCompletionType["GetTo"] = 1] = "GetTo";
    PuzzleCompletionType[PuzzleCompletionType["Item"] = 2] = "Item";
})(PuzzleCompletionType || (exports.PuzzleCompletionType = PuzzleCompletionType = {}));
class PuzzleSelectionManager extends selection_1.SelectionManager {
    constructor() {
        super('puzzle', '#77000022', '#ff222222', [blitzkrieg.mod.baseDirectory + 'json/puzzleData.json',]);
        this.incStep = 0.05;
        this.changeModifiers = true;
        this.changeSpeed = true;
        this.fakeBuffItemId = 2137420;
        this.modifiersActive = false;
        this.fakeBuffActive = false;
        this.recordIgnoreSet = new Set([
            '.playerVar.input.melee',
            '.gamepad.active'
        ]);
        this.setFileIndex(0);
        this.recorder = new change_record_1.ChangeRecorder(10);
    }
    updatePuzzleSpeed(sel) {
        var _a;
        const speed = (!((_a = sel === null || sel === void 0 ? void 0 : sel.data) === null || _a === void 0 ? void 0 : _a.puzzleSpeed)) ? 1 : sel.data.puzzleSpeed;
        if (this.changeSpeed && sc.options.get('assist-puzzle-speed') != speed) {
            sc.options.set('assist-puzzle-speed', speed);
            blitzkrieg.rhudmsg('blitzkrieg', 'Setting puzzle speed to ' + Math.round(speed * 100) + '%', 1);
            if (speed != 1) {
                this.createFakeBuff();
            }
            if (speed == 1 && !this.modifiersActive) {
                this.destroyFakeBuff();
            }
        }
    }
    createFakeBuff() {
        if (this.fakeBuffActive) {
            return;
        }
        this.fakeBuffActive = true;
        /* add a buff that only shows when the modifiers are active */
        let buff = new sc.ItemBuff(['DASH-STEP-1'], 100000, this.fakeBuffItemId);
        buff.modifiers = {};
        sc.model.player.params.addBuff(buff);
    }
    destroyFakeBuff() {
        if (!this.fakeBuffActive) {
            return;
        }
        this.fakeBuffActive = false;
        for (let buff of sc.model.player.params.buffs) {
            if (buff.itemID == this.fakeBuffItemId) {
                sc.model.player.params.removeBuff(buff);
            }
        }
    }
    async walkInEvent(sel) {
        this.updatePuzzleSpeed(sel);
        if (this.changeModifiers) {
            ig.game.playerEntity.params.modifiers.AIMING_MOVEMENT = 0.5;
            ig.game.playerEntity.params.modifiers.AIM_SPEED = 2;
            ig.game.playerEntity.params.modifiers.AIM_STABILITY = 1;
            ig.game.playerEntity.params.modifiers.DASH_STEP = 0;
            ig.game.playerEntity.params.modifiers.ASSAULT = 0.5;
            ig.game.playerEntity.updateModelStats(false);
            this.modifiersActive = true;
            this.createFakeBuff();
        }
    }
    async walkOutEvent() {
        this.updatePuzzleSpeed(this.inSelStack.peek());
        if (this.changeModifiers) {
            this.modifiersActive = false;
            sc.model.player.updateStats();
            this.destroyFakeBuff();
        }
    }
    async newSelEvent(sel) {
        await this.finalizeSel(sel);
    }
    async finalizeSel(sel1) {
        const sel = sel1;
        const scale = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const data = {
            type: PuzzleRoomType[await util_1.Util.syncDialog('select puzzle \\c[3]type\\c[0]', Object.keys(PuzzleRoomType).filter(k => isNaN(k)))],
            completionType: PuzzleCompletionType[await util_1.Util.syncDialog('select puzzle \\c[3]completion type\\c[0]', Object.keys(PuzzleCompletionType).filter(k => isNaN(k)))],
            difficulty: parseInt(await util_1.Util.syncDialog('Select puzzle \\c[3]difficulty\\c[0]', scale)),
            timeLength: parseInt(await util_1.Util.syncDialog('Select puzzle \\c[3]length\\c[0]', scale)),
            chapter: sc.model.player.chapter,
            plotLine: ig.vars.storage.plot ? ig.vars.storage.plot.line : -1,
            elements: [
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
            ],
        };
        blitzkrieg.rhudmsg('blitzkrieg', 'Starting position', 1);
        data.startPos = await util_1.Util.waitForPositionKey();
        blitzkrieg.rhudmsg('blitzkrieg', 'Ending position', 1);
        data.endPos = await util_1.Util.waitForPositionKey();
        sel.data = { ...sel.data, ...data };
    }
    solve() {
        const sel = this.inSelStack.peek();
        if (!sel) {
            return;
        }
        let yell = true;
        if (sel.data.endPos) {
            const pos = sel.data.endPos;
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z);
            if (sel.data.completionType == PuzzleCompletionType.GetTo) {
                yell = false;
            }
        }
        if (!sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            if (yell) {
                blitzkrieg.rhudmsg('blitzkrieg', 'No puzzle solution recorded!', 5);
            }
            return;
        }
        this.solveSel(sel);
    }
    solveSel(sel, delay = 0) {
        const log = sel.data.recordLog.log;
        if (delay == 0) {
            for (let i = 0; i < log.length; i++) {
                const action = log[i];
                const splittedPath = action[1].split('.');
                let value = ig.vars.storage;
                for (let i = 0; i < splittedPath.length - 1; i++) {
                    if (!value.hasOwnProperty(splittedPath[i])) {
                        value[splittedPath[i]] = {};
                    }
                    value = value[splittedPath[i]];
                }
                value[splittedPath[splittedPath.length - 1]] = action[2];
            }
        }
        else {
            let solveArrayIndex = 0;
            const intervalID = setInterval(async () => {
                const action = log[solveArrayIndex];
                const splittedPath = action[1].split('.');
                let value = ig.vars.storage;
                for (let i = 0; i < splittedPath.length - 1; i++) {
                    value = value[splittedPath[i]];
                }
                value[splittedPath[splittedPath.length - 1]] = action[2];
                ig.game.varsChangedDeferred();
                solveArrayIndex++;
                if (solveArrayIndex == log.length) {
                    clearInterval(intervalID);
                }
            }, 1000 / delay);
        }
        ig.game.varsChangedDeferred();
        blitzkrieg.rhudmsg('blitzkrieg', 'Solved puzzle', 2);
    }
    static getPuzzleSolveCondition(sel) {
        if (!sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            throw new Error('no puzzle solution recorded');
        }
        const log = sel.data.recordLog.log;
        for (let i = log.length - 1; i >= 0; i--) {
            let action = log[i];
            // let frame = action[0]
            let path = action[1];
            // let value = action[2]
            // console.log(path, value)
            if (path.startsWith('.maps')) {
                continue;
            }
            return path.substring(1);
        }
        throw new Error('puzzle solution empty somehow?');
    }
}
exports.PuzzleSelectionManager = PuzzleSelectionManager;
