export class BattleRecordManager {
    constructor() {
        this.recording = false

        this.excludedStoragePaths = new Set([
            ".playerVar.input.melee",
            ".gamepad.active"
        ])
        this.battleIndex = 0;
        this.waitForLoad = false
        this._tmpSel = null
        this.barrierList = []
    }

    addData(sel) {
        if (sel === null) 
            return
        sel.data["index"] = this.battleIndex++
            
        sel.data["elements"] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sel.data.skills = []
        sc.model.player.skills.forEach(function(val, i) {
            if (val !== null) sel.data.skills.push(i)
        });
        sel.data["spLevel"] = sc.model.player.spLevel
        sel.data["skillPoints"] = ig.copy(sc.model.player.skillPoints)
        sel.data["chapter"] = sc.model.player.chapter
        sel.data["level"] = sc.model.player.level
        sel.data["equip"] = ig.copy(sc.model.player.equip)
        sel.data["plotLine"] = "plot" in ig.vars.storage ? ig.vars.storage.plot.line : -1
    }

    restoreData(sel) {
        ig.blitzkrieg.msg("blitzkrieg", "Restored battle data", 2)
        // let enemies = []
        // sel.bb.forEach(function(rect, i) {
        //     enemies = enemies.concat(ig.game.getEntitiesInRectangle(rect.x, rect.y, 0, rect.width, rect.height, 1000).filter((entity) => "aggression" in entity))
        // });
        // console.log(enemies)

        sel.data["elements"] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sc.model.player.skills.forEach(function(val, i) {
            sc.model.player.unlearnSkill(i)
        });
        sc.model.player.skills = []
        sel.data.skills.forEach(function(i) {
            sc.model.player.learnSkill(i)
        });

        sc.model.player.setSpLevel(sel.data.spLevel)
        sc.model.player.skillPoints = sel.data.skillPoints
        sc.model.player.chapter = sel.data.chapter
        sc.model.player.setLevel(sel.data.level)
        sc.model.player.equip = sel.data.equip
        if("plot" in ig.vars.storage)
            ig.vars.storage.plot.line = sel.data.plotLine
        
        sc.model.player.updateStats()
    }

    startRecording() {
        this.currentRecord = {
            battleLog: [],
        }
        this.gscopy = ig.copy(ig.vars.storage)
        this.loopIndex = 0
        this.recording = true
        ig.blitzkrieg.msg("blitzkrieg", "Started recording for game state changes", 2);

        const self = this
        const intervalID = setInterval(async () => {
            if (! self.recording) {
                clearInterval(intervalID);
                return
            }
            if (! ig.perf.gui) {
                TextNofitication.msg("blitzkrieg", "Stopping battle recording (entered gui)", 2)
                clearInterval(intervalID);
                return
            }
            self.recordLoop();
        }, 1000 / 10);
    }

    stopRecording() {
        if (ig.blitzkrieg.battleSelections.inSelStack.length() == 0) {
            ig.blitzkrieg.msg("blitzkrieg", "Not in a battle area", 2)
            return
        }
        this.recording = false
        ig.blitzkrieg.msg("blitzkrieg", "Stopped recording", 2);

        ig.blitzkrieg.battleSelections.inSelStack.peek().data["battleLog"] = this.currentRecord
        ig.blitzkrieg.battleSelections.save()
    }

    toogleRecording() {
        if (this.recording) 
            this.stopRecording()
        else 
            this.startRecording()
    }


    _getValueFromPath(obj, path) {
        const splittedPath = path.split(".");
        splittedPath.shift()
        let value = obj;
        for (let i = 0; i < splittedPath.length; i++) {
            value = value[splittedPath[i]];
            if (value === undefined || value === null) 
                return null
        }
        return value
    }

    _recordLoopRecursive(path) {
        if (this.excludedStoragePaths.has(path))
            return 
        let obj = this._getValueFromPath(this.gscopyUpdate, path)

        let type = typeof obj
        if (type == "undefined" || type == "null") return;

        if (type == "object") {
            for (let key in obj) {
                this._recordLoopRecursive(path + "." + key) 
            }
        } else {
            let previousValue = this._getValueFromPath(this.gscopy, path)
            if (obj != previousValue) {
                this.currentRecord.battleLog.push([this.loopIndex, path, obj])
                console.log(this.loopIndex + "  change at " + path + " from: " + previousValue + " to: " + obj)
            }
        }

    }

    recordLoop() {
        if (! this.recording) return
        this.loopIndex++

        this.gscopyUpdate = ig.copy(ig.vars.storage)
        this._recordLoopRecursive("")
        this.gscopy = ig.copy(ig.vars.storage)
    }


    solveFast() {
        const sel = ig.blitzkrieg.battleSelections.inSelStack.peek()

        if (sel == null || this.solvingPuzzle) 
            return;

        if (sel.data.stateLog === undefined || sel.data.stateLog.battleLog.length == 0) {
            ig.blitzkrieg.msg("blitzkrieg", "No battle solution recorded!")
            return
        }
        
        let battleLog = sel.data.stateLog.battleLog

        for (let i = 0; i < battleLog.length; i++) {
            let action = battleLog[i]

            const splittedPath = action[1].split(".");
            splittedPath.shift()
            let value = ig.vars.storage;
            for (let i = 0; i < splittedPath.length - 1; i++) {
                if (!value.hasOwnProperty(splittedPath[i])) {
                    value[splittedPath[i]] = {};
                }
                value = value[splittedPath[i]];
            }

            value[splittedPath[splittedPath.length - 1]] = action[2]

        }
        ig.game.varsChangedDeferred()
        ig.blitzkrieg.msg("blitzkrieg", "Solved battle")
        this.solvingPuzzle = false
    }

    solve() {
        const sel = ig.blitzkrieg.battleSelections.inSelStack.peek()

        if (sel == null || this.solvingPuzzle) 
            return;

        if (sel.data.stateLog === undefined || sel.data.stateLog.battleLog.length == 0) {
            ig.blitzkrieg.msg("blitzkrieg", "No battle solution recorded!")
            return
        }
        
        let battleLog = sel.data.stateLog.battleLog
        let _solveFrame = 0
        let _solveArrayIndex = 0
        this.solvingPuzzle = true
        let self = this
        const intervalID = setInterval(async () => {
            for (let i = _solveArrayIndex; i < battleLog.length; i++) {
                let action = battleLog[i]
                if (action[0] == _solveFrame) {
                    
                    const splittedPath = action[1].split(".");
                    splittedPath.shift()
                    let value = ig.vars.storage;
                    for (let i = 0; i < splittedPath.length - 1; i++) {
                        value = value[splittedPath[i]];
                    }

                    value[splittedPath[splittedPath.length - 1]] = action[2]

                    ig.game.varsChangedDeferred()

                    _solveArrayIndex++
                } else 
                    if (! (i + 1 < battleLog.length && battleLog[i].frame == action[0]))
                        continue
            }
            if (_solveArrayIndex == battleLog.length) {
                ig.blitzkrieg.msg("blitzkrieg", "Solved battle")
                clearInterval(intervalID);
                self.solvingPuzzle = false
            }

            _solveFrame++
        }, 1000 / 10);

        ig.blitzkrieg.msg("blitzkrieg", "Solving battle...");
    }
}
