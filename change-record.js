export class ChangeRecorder {
    // logic = (this.selInstance, this.currentRecord, this.loopIndex) => {}
    constructor(tps, ignoreSet, logic) {
        this.recording = false
        this.ignoreSet = ignoreSet
        this.tps = tps
        this.logic = logic
    }

    startRecording() {
        this.currentRecord = {
            log: [],
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
                ig.blitzkrieg.msg('blitzkrieg', 'Stopping game state recording (entered gui)', 2)
                return
            }
            self.recordLoop()
        }, 1000 / this.tps)
    }

    stopRecording() {
        if (! this.selInstance.inSelStack || this.selInstance.inSelStack.length() == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'Not in a selection area', 2)
            return
        }
        this.recording = false
        ig.blitzkrieg.msg('blitzkrieg', 'Stopped recording', 2)

        this.selInstance.inSelStack.peek().data.recordLog = this.currentRecord
        this.selInstance.save()
    }

    toogleRecording() {
        if (this.recording) { this.stopRecording() }
        else { this.startRecording() }
    }


    _getValueFromPath(obj, path) {
        let splittedPath = path.split('.')
        splittedPath.shift()
        let value = obj
        for (let i = 0; i < splittedPath.length; i++) {
            value = value[splittedPath[i]]
            if (value === undefined || value === null) {
                return null
            }
        }
        return value
    }

    _recordLoopRecursive(path) {
        if (this.ignoreSet.has(path)) { return }
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
                this.currentRecord.log.push([this.loopIndex, path, obj])
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

        this.logic(this.selInstance, this.currentRecord, this.loopIndex)
    }
}
