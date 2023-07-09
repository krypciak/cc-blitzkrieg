export class PuzzleRecordManager {
    constructor() {
        this.recording = false

        this.excludedStoragePaths = new Set([
            '.playerVar.input.melee',
            '.gamepad.active'
        ])
    }

    startRecording() {
        this.currentRecord = {
            puzzleLog: [],
        }
        this.gscopy = ig.copy(ig.vars.storage)
        this.loopIndex = 0
        this.recording = true
        ig.blitzkrieg.msg('blitzkrieg', 'Started recording for game state changes', 2)

        const self = this
        const intervalID = setInterval(async () => {
            if (! self.recording) {
                clearInterval(intervalID)
                return
            }
            if (! ig.perf.gui) {
                clearInterval(intervalID)
                ig.blitzkrieg.msg('blitzkrieg', 'Stopping puzzle recording (entered gui)', 2)
                return
            }
            self.recordLoop()
        }, 1000 / 10)
    }

    stopRecording() {
        if (ig.blitzkrieg.puzzleSelections.inSelStack.length() == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'Not in a puzzle area', 2)
            return
        }
        this.recording = false
        ig.blitzkrieg.msg('blitzkrieg', 'Stopped recording', 2)

        ig.blitzkrieg.puzzleSelections.inSelStack.peek().data['stateLog'] = this.currentRecord
        ig.blitzkrieg.puzzleSelections.save()
    }

    toogleRecording() {
        if (this.recording) 
            this.stopRecording()
        else 
            this.startRecording()
    }


    _getValueFromPath(obj, path) {
        const splittedPath = path.split('.')
        splittedPath.shift()
        let value = obj
        for (let i = 0; i < splittedPath.length; i++) {
            value = value[splittedPath[i]]
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
        if (type == 'undefined' || type == 'null') return

        if (type == 'object') {
            for (let key in obj) {
                this._recordLoopRecursive(path + '.' + key) 
            }
        } else {
            let previousValue = this._getValueFromPath(this.gscopy, path)
            if (obj != previousValue) {
                // this.currentRecord.puzzleLog.push([path, previousValue, obj, this.loopIndex])
                this.currentRecord.puzzleLog.push([this.loopIndex, path, obj])
                console.log(this.loopIndex + '  change at ' + path + ' from: ' + previousValue + ' to: ' + obj)
            }
        }

    }

    recordLoop() {
        if (! this.recording) return
        this.loopIndex++

        this.gscopyUpdate = ig.copy(ig.vars.storage)
        this._recordLoopRecursive('')
        this.gscopy = ig.copy(ig.vars.storage)
    }


    solveFast() {
        const sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()

        if (sel == null || this.solvingPuzzle) 
            return

        if (sel.data.stateLog === undefined || sel.data.stateLog.puzzleLog.length == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'No puzzle solution recorded!')
            return
        }
        
        let puzzleLog = sel.data.stateLog.puzzleLog

        for (let i = 0; i < puzzleLog.length; i++) {
            let action = puzzleLog[i]

            const splittedPath = action[1].split('.')
            splittedPath.shift()
            let value = ig.vars.storage
            for (let i = 0; i < splittedPath.length - 1; i++) {
                if (! value.hasOwnProperty(splittedPath[i])) {
                    value[splittedPath[i]] = {}
                }
                value = value[splittedPath[i]]
            }

            value[splittedPath[splittedPath.length - 1]] = action[2]

        }
        ig.game.varsChangedDeferred()
        ig.blitzkrieg.msg('blitzkrieg', 'Solved puzzle')
        this.solvingPuzzle = false
    }

    solve() {
        const sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()

        if (sel == null || this.solvingPuzzle) 
            return

        if (sel.data.stateLog === undefined || sel.data.stateLog.puzzleLog.length == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'No puzzle solution recorded!')
            return
        }
        
        let puzzleLog = sel.data.stateLog.puzzleLog
        let _solveFrame = 0
        let _solveArrayIndex = 0
        this.solvingPuzzle = true
        let self = this
        const intervalID = setInterval(async () => {
            for (let i = _solveArrayIndex; i < puzzleLog.length; i++) {
                let action = puzzleLog[i]
                if (action[0] == _solveFrame) {
                    
                    const splittedPath = action[1].split('.')
                    splittedPath.shift()
                    let value = ig.vars.storage
                    for (let i = 0; i < splittedPath.length - 1; i++) {
                        value = value[splittedPath[i]]
                    }

                    value[splittedPath[splittedPath.length - 1]] = action[2]

                    ig.game.varsChangedDeferred()

                    _solveArrayIndex++
                } else if (! (i + 1 < puzzleLog.length && puzzleLog[i].frame == action[0])) {
                    continue
                }
            }
            if (_solveArrayIndex == puzzleLog.length) {
                ig.blitzkrieg.msg('blitzkrieg', 'Solved puzzle')
                clearInterval(intervalID)
                self.solvingPuzzle = false
            }

            _solveFrame++
        }, 1000 / 10)

        ig.blitzkrieg.msg('blitzkrieg', 'Solving puzzle...')
    }
}
