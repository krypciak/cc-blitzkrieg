import { ChangeRecorder } from './change-record.js'

export class PuzzleSelectionManager {
    constructor() {
        this.incStep = 0.05
        this.changeModifiers = true
        this.changeSpeed = true
        this.fakeBuffItemId = 213700
        this.modifiersActive = false
        this.fakeBuffActive = false
        
        let ignoreSet = new Set([
            '.playerVar.input.melee',
            '.gamepad.active'
        ])
        this.recorder = new ChangeRecorder(10, ignoreSet, () => {}
            /*(puzzleSelections, record, loopIndex) => {
                if (! record.enemyLog) { record.enemyLog = [] }
                if (loopIndex % 5) { 
                    record.enemyLog.push([loopIndex, 'obama', loopIndex])
                }
            }*/
        )
    }

    _increse_speed(val) {
        let sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()

        if (! sel) { return }

        if (! sel.data.puzzleSpeed) {
            sel.data.puzzleSpeed = 1
        }

        sel.data.puzzleSpeed += val
        sc.options.set('assist-puzzle-speed', sel.data.puzzleSpeed)
        ig.blitzkrieg.msg('blitzkrieg', (val > 0 ? 'Incresing' : 'Decresing') + ' selection puzzle speed to ' + Math.round(sel.data.puzzleSpeed * 100) + '%', 1)
        ig.blitzkrieg.puzzleSelections.save()

        if (sel.data.puzzleSpeed == 1 && ! ig.blitzkrieg.puzzleSelectionManager.modifiersActive) {
            ig.blitzkrieg.puzzleSelectionManager.destroyFakeBuff()
        }
    }
    
    incSpeed() { this._increse_speed(this.incStep) }

    decSpeed() { this._increse_speed(-this.incStep) }

    updatePuzzleSpeed(sel) {
        let speed = (! sel || ! sel.data.puzzleSpeed) ? 1 : sel.data.puzzleSpeed

        if (this.changeSpeed && sc.options.get('assist-puzzle-speed') != speed) {
            sc.options.set('assist-puzzle-speed', speed) 
            ig.blitzkrieg.msg('blitzkrieg', 'Setting puzzle speed to ' + Math.round(speed * 100) + '%', 1)
            if (speed != 1) { ig.blitzkrieg.puzzleSelectionManager.createFakeBuff() }
            if (speed == 1 && ! ig.blitzkrieg.puzzleSelectionManager.modifiersActive) {
                ig.blitzkrieg.puzzleSelectionManager.destroyFakeBuff() 
            }
        }
    }

    createFakeBuff() {
        if (ig.blitzkrieg.puzzleSelectionManager.fakeBuffActive) { return }

        ig.blitzkrieg.puzzleSelectionManager.fakeBuffActive = true
        // add a buff that only shows when the modifiers are active
        let buff = new sc.ItemBuff(['DASH-STEP-1'], 100000, ig.blitzkrieg.puzzleSelectionManager.fakeBuffItemId)
        buff.modifiers = {}
        sc.model.player.params.addBuff(buff)
    }

    destroyFakeBuff() {
        if (! ig.blitzkrieg.puzzleSelectionManager.fakeBuffActive) { return }
        ig.blitzkrieg.puzzleSelectionManager.fakeBuffActive = false
        // remove fake buff
        for (let buff of sc.model.player.params.buffs) {
            if (buff.itemID == ig.blitzkrieg.puzzleSelectionManager.fakeBuffItemId) {
                sc.model.player.params.removeBuff(buff)
            }
        }
    }

    walkInEvent(sel) {
        ig.blitzkrieg.puzzleSelectionManager.updatePuzzleSpeed(sel)

        if (ig.blitzkrieg.puzzleSelectionManager.changeModifiers) {
            ig.game.playerEntity.params.modifiers.AIMING_MOVEMENT = 0.5
            ig.game.playerEntity.params.modifiers.AIM_SPEED = 2
            ig.game.playerEntity.params.modifiers.AIM_STABILITY = 1
            ig.game.playerEntity.params.modifiers.DASH_STEP = 0
            ig.game.playerEntity.params.modifiers.ASSAULT = 0.5
            ig.game.playerEntity.updateModelStats()
            ig.blitzkrieg.puzzleSelectionManager.modifiersActive = true

            ig.blitzkrieg.puzzleSelectionManager.createFakeBuff()
        }
    }

    // eslint-disable-next-line no-unused-vars
    walkOutEvent(sel) {
        ig.blitzkrieg.puzzleSelectionManager.updatePuzzleSpeed(ig.blitzkrieg.puzzleSelections.inSelStack.peek())

        if (ig.blitzkrieg.puzzleSelectionManager.changeModifiers) {
            ig.blitzkrieg.puzzleSelectionManager.modifiersActive = false
            sc.model.player.updateStats()

            ig.blitzkrieg.puzzleSelectionManager.destroyFakeBuff()
        }
    }


    async newSelEvent(sel) {
        await ig.blitzkrieg.puzzleSelectionManager.finalizeSel(sel)
    }

    
    async finalizeSel(sel) {
        // heat cold shock wave
        sel.data['elements'] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]

        let scale = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        let puzzleDiff = await ig.blitzkrieg.util.syncDialog('select puzzle difficulty', scale)
        let puzzleLen = await ig.blitzkrieg.util.syncDialog('select puzzle length', scale)
        let puzzleCompletionType = await ig.blitzkrieg.util.syncDialog('select puzzle completion type', ['normal', 'getTo'])
        let puzzleType = await ig.blitzkrieg.util.syncDialog('select puzzle type', ['whole room', 'add walls', 'dis'])

        sel.data.difficulty = parseInt(puzzleDiff)
        sel.data.timeLength = parseInt(puzzleLen)
        sel.data.completionType = puzzleCompletionType
        sel.data.type = puzzleType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1

        ig.blitzkrieg.msg('blitzkrieg', 'Starting position', 3)
        sel.data.startPos = await ig.blitzkrieg.util.waitForPositionKey()
        ig.blitzkrieg.msg('blitzkrieg', 'Ending position', 3)
        sel.data.endPos = await ig.blitzkrieg.util.waitForPositionKey()
    }

    solve() {
        let sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()

        if (! sel) { return }

        if (sel.data.completionType == 'getTo') {
            let pos = sel.data.endPos
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
            return
        }

        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'No puzzle solution recorded!')
            return
        }
        ig.blitzkrieg.puzzleSelectionManager.solveSel(sel)
    }

    solveSel(sel, delay = 0) {
        let log = sel.data.recordLog.log

        if (delay == 0) {
            for (let i = 0; i < log.length; i++) {
                let action = log[i]

                let splittedPath = action[1].split('.')
                splittedPath.shift()
                let value = ig.vars.storage
                for (let i = 0; i < splittedPath.length - 1; i++) {
                    // eslint-disable-next-line 
                    if (! value.hasOwnProperty(splittedPath[i])) {
                        value[splittedPath[i]] = {}
                    }
                    value = value[splittedPath[i]]
                }

                value[splittedPath[splittedPath.length - 1]] = action[2]

            }
        } else {
            let solveArrayIndex = 0
            let intervalID = setInterval(async () => {
                let action = log[solveArrayIndex]
                let splittedPath = action[1].split('.')
                splittedPath.shift()
                let value = ig.vars.storage
                for (let i = 0; i < splittedPath.length - 1; i++) {
                    value = value[splittedPath[i]]
                }

                value[splittedPath[splittedPath.length - 1]] = action[2]

                ig.game.varsChangedDeferred()

                console.log(solveArrayIndex)
                solveArrayIndex++
                if (solveArrayIndex == log.length) {
                    clearInterval(intervalID)
                }
            }, 1000 / delay)
        }
        ig.game.varsChangedDeferred()
        ig.blitzkrieg.msg('blitzkrieg', 'Solved puzzle')
    }

    getPuzzleSolveCondition(sel) {
        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'No puzzle solution recorded!')
            return
        }

        let log = sel.data.recordLog.log
        for (let i = log.length - 1; i >= 0; i--) {
            let action = log[i]
            // let frame = action[0]
            let path = action[1]
            // let value = action[2]
            // console.log(path, value)
            if (path.startsWith('.maps')) { continue }
            return path.substring(1)
        }
        throw new Error('puzzle solution empty somehow?')
    }
}
