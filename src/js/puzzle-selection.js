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
        let sel = blitzkrieg.puzzleSelections.inSelStack.peek()

        if (! sel) { return }

        if (! sel.data.puzzleSpeed) {
            sel.data.puzzleSpeed = 1
        }

        sel.data.puzzleSpeed += val
        sc.options.set('assist-puzzle-speed', sel.data.puzzleSpeed)
        blitzkrieg.msg('blitzkrieg', (val > 0 ? 'Incresing' : 'Decresing') + ' selection puzzle speed to ' + Math.round(sel.data.puzzleSpeed * 100) + '%', 1)
        blitzkrieg.puzzleSelections.save()

        if (sel.data.puzzleSpeed == 1 && ! blitzkrieg.puzzleSelectionManager.modifiersActive) {
            blitzkrieg.puzzleSelectionManager.destroyFakeBuff()
        }
    }
    
    incSpeed() { this._increse_speed(this.incStep) }

    decSpeed() { this._increse_speed(-this.incStep) }

    updatePuzzleSpeed(sel) {
        let speed = (! sel || ! sel.data.puzzleSpeed) ? 1 : sel.data.puzzleSpeed

        if (this.changeSpeed && sc.options.get('assist-puzzle-speed') != speed) {
            sc.options.set('assist-puzzle-speed', speed) 
            blitzkrieg.msg('blitzkrieg', 'Setting puzzle speed to ' + Math.round(speed * 100) + '%', 1)
            if (speed != 1) { blitzkrieg.puzzleSelectionManager.createFakeBuff() }
            if (speed == 1 && ! blitzkrieg.puzzleSelectionManager.modifiersActive) {
                blitzkrieg.puzzleSelectionManager.destroyFakeBuff() 
            }
        }
    }

    createFakeBuff() {
        if (blitzkrieg.puzzleSelectionManager.fakeBuffActive) { return }

        blitzkrieg.puzzleSelectionManager.fakeBuffActive = true
        // add a buff that only shows when the modifiers are active
        let buff = new sc.ItemBuff(['DASH-STEP-1'], 100000, blitzkrieg.puzzleSelectionManager.fakeBuffItemId)
        buff.modifiers = {}
        sc.model.player.params.addBuff(buff)
    }

    destroyFakeBuff() {
        if (! blitzkrieg.puzzleSelectionManager.fakeBuffActive) { return }
        blitzkrieg.puzzleSelectionManager.fakeBuffActive = false
        // remove fake buff
        for (let buff of sc.model.player.params.buffs) {
            if (buff.itemID == blitzkrieg.puzzleSelectionManager.fakeBuffItemId) {
                sc.model.player.params.removeBuff(buff)
            }
        }
    }

    walkInEvent(sel) {
        blitzkrieg.puzzleSelectionManager.updatePuzzleSpeed(sel)

        if (blitzkrieg.puzzleSelectionManager.changeModifiers) {
            ig.game.playerEntity.params.modifiers.AIMING_MOVEMENT = 0.5
            ig.game.playerEntity.params.modifiers.AIM_SPEED = 2
            ig.game.playerEntity.params.modifiers.AIM_STABILITY = 1
            ig.game.playerEntity.params.modifiers.DASH_STEP = 0
            ig.game.playerEntity.params.modifiers.ASSAULT = 0.5
            ig.game.playerEntity.updateModelStats()
            blitzkrieg.puzzleSelectionManager.modifiersActive = true

            blitzkrieg.puzzleSelectionManager.createFakeBuff()
        }
    }

    walkOutEvent() {
        blitzkrieg.puzzleSelectionManager.updatePuzzleSpeed(blitzkrieg.puzzleSelections.inSelStack.peek())

        if (blitzkrieg.puzzleSelectionManager.changeModifiers) {
            blitzkrieg.puzzleSelectionManager.modifiersActive = false
            sc.model.player.updateStats()

            blitzkrieg.puzzleSelectionManager.destroyFakeBuff()
        }
    }


    async newSelEvent(sel) {
        await blitzkrieg.puzzleSelectionManager.finalizeSel(sel)
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
        let puzzleDiff = await blitzkrieg.util.syncDialog('select puzzle difficulty', scale)
        let puzzleLen = await blitzkrieg.util.syncDialog('select puzzle length', scale)
        let puzzleCompletionType = await blitzkrieg.util.syncDialog('select puzzle completion type', ['normal', 'getTo'])
        let puzzleType = await blitzkrieg.util.syncDialog('select puzzle type', ['whole room', 'add walls', 'dis'])

        sel.data.difficulty = parseInt(puzzleDiff)
        sel.data.timeLength = parseInt(puzzleLen)
        sel.data.completionType = puzzleCompletionType
        sel.data.type = puzzleType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1

        blitzkrieg.msg('blitzkrieg', 'Starting position', 3)
        sel.data.startPos = await blitzkrieg.util.waitForPositionKey()
        blitzkrieg.msg('blitzkrieg', 'Ending position', 3)
        sel.data.endPos = await blitzkrieg.util.waitForPositionKey()
    }

    solve() {
        let sel = blitzkrieg.puzzleSelections.inSelStack.peek()

        if (! sel) { return }

        let yell = true

        if (sel.data.endPos) {
            let pos = sel.data.endPos
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
            if (sel.data.completionType == 'getTo') {
                yell = false
            }
        }

        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            if (yell) {
                blitzkrieg.msg('blitzkrieg', 'No puzzle solution recorded!')
            }
            return
        }
        blitzkrieg.puzzleSelectionManager.solveSel(sel)
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

                solveArrayIndex++
                if (solveArrayIndex == log.length) {
                    clearInterval(intervalID)
                }
            }, 1000 / delay)
        }
        ig.game.varsChangedDeferred()
        blitzkrieg.msg('blitzkrieg', 'Solved puzzle')
    }

    getPuzzleSolveCondition(sel) {
        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            throw new Error('no puzzle solution recorded')
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
