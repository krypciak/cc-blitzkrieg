import { Selection, SelectionManager } from 'selection'
import { waitForPositionKey } from './util'
import { syncDialog } from './util'

enum PuzzleRoomType {
    WholeRoom = 0,
    AddWalls = 1,
    Dis = 2,
}

enum PuzzleCompletionType {
    Normal = 0,
    GetTo = 1,
    Item = 2,
}
export interface PuzzleSelection extends Selection {
    data: {
        puzzleSpeed: number
        difficulty: number
        timeLength: number
        completionType: PuzzleCompletionType
        type: PuzzleRoomType
        chapter: number
        plotLine: number
        startPos: Vec3 & { level: number }
        endPos: Vec3 & { level: number }
        elements: [boolean, boolean, boolean, boolean]
        recordLog?: {
            log: ([/* frame */ number, /* var path */ string, /* value */ any])[]
        }
    }
}
export class PuzzleSelectionManager extends SelectionManager {
    incStep: number = 0.05
    changeModifiers: boolean = true
    changeSpeed: boolean = true
    fakeBuffItemId: number = 2137420
    modifiersActive: boolean = false
    fakeBuffActive: boolean = false

    recordIgnoreSet = new Set([
        '.playerVar.input.melee',
        '.gamepad.active'
    ])
    
    constructor() {
        super('puzzle', '#77000044', '#ff222244', [ blitzkrieg.mod.baseDirectory + 'json/puzzleData.json', ])
    }

    updatePuzzleSpeed(sel: PuzzleSelection) {
        const speed: number = (! sel || ! sel.data.puzzleSpeed) ? 1 : sel.data.puzzleSpeed

        if (this.changeSpeed && sc.options.get('assist-puzzle-speed') != speed) {
            sc.options.set('assist-puzzle-speed', speed) 
            blitzkrieg.rhudmsg('blitzkrieg', 'Setting puzzle speed to ' + Math.round(speed * 100) + '%', 1)
            if (speed != 1) { this.createFakeBuff() }
            if (speed == 1 && ! this.modifiersActive) {
                this.destroyFakeBuff() 
            }
        }
    }

    createFakeBuff() {
        if (this.fakeBuffActive) { return }

        this.fakeBuffActive = true
        /* add a buff that only shows when the modifiers are active */
        let buff = new sc.ItemBuff(['DASH-STEP-1'], 100000, this.fakeBuffItemId)
        buff.modifiers = {}
        sc.model.player.params.addBuff(buff)
    }

    destroyFakeBuff() {
        if (! this.fakeBuffActive) { return }
        this.fakeBuffActive = false
        for (let buff of sc.model.player.params.buffs as sc.ItemBuff[]) {
            if (buff.itemID == this.fakeBuffItemId) {
                sc.model.player.params.removeBuff(buff)
            }
        }
    }
    
    async walkInEvent(sel: Selection) {
        this.updatePuzzleSpeed(sel as PuzzleSelection)

        if (this.changeModifiers) {
            ig.game.playerEntity.params.modifiers.AIMING_MOVEMENT = 0.5
            ig.game.playerEntity.params.modifiers.AIM_SPEED = 2
            ig.game.playerEntity.params.modifiers.AIM_STABILITY = 1
            ig.game.playerEntity.params.modifiers.DASH_STEP = 0
            ig.game.playerEntity.params.modifiers.ASSAULT = 0.5
            ig.game.playerEntity.updateModelStats(false)
            this.modifiersActive = true

            this.createFakeBuff()
        }
    }

    async walkOutEvent() {
        this.updatePuzzleSpeed(this.inSelStack.peek() as PuzzleSelection)

        if (this.changeModifiers) {
            this.modifiersActive = false
            sc.model.player.updateStats()

            this.destroyFakeBuff()
        }
    }

    async newSelEvent(sel: Selection) {
        await this.finalizeSel(sel as PuzzleSelection)
    }

    async finalizeSel(sel1: Selection) {
        const sel = sel1 as PuzzleSelection
        // heat cold shock wave
        sel.data['elements'] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]

        const scale: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        const puzzleCompletionType: number = PuzzleCompletionType[await syncDialog('select puzzle \\c[3]completion type\\c[0]', Object.keys(PuzzleCompletionType)) as keyof typeof PuzzleCompletionType]
        let puzzleType: number = PuzzleRoomType[await syncDialog('select puzzle \\c[3]type\\[0]', Object.keys(PuzzleRoomType)) as keyof typeof PuzzleRoomType]

        sel.data.difficulty = parseInt(await syncDialog('Select puzzle \\c[3]difficulty\\c[0]', scale))
        sel.data.timeLength = parseInt(await syncDialog('Select puzzle \\c[3]length\\c[0]', scale))
        sel.data.completionType = puzzleCompletionType
        sel.data.type = puzzleType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1

        blitzkrieg.rhudmsg('blitzkrieg', 'Starting position', 3)
        sel.data.startPos = await waitForPositionKey()
        blitzkrieg.rhudmsg('blitzkrieg', 'Ending position', 3)
        sel.data.endPos = await waitForPositionKey()
    }


    solve() {
        const sel: PuzzleSelection = this.inSelStack.peek() as PuzzleSelection
        if (! sel) { return }
        let yell: boolean = true

        if (sel.data.endPos) {
            const pos = sel.data.endPos
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
            if (sel.data.completionType == PuzzleCompletionType.GetTo) {
                yell = false
            }
        }

        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            if (yell) {
                blitzkrieg.rhudmsg('blitzkrieg', 'No puzzle solution recorded!', 5)
            }
            return
        }
        this.solveSel(sel)
    }

    solveSel(sel: PuzzleSelection, delay: number = 0) {
        const log = sel.data.recordLog!.log

        if (delay == 0) {
            for (let i = 0; i < log.length; i++) {
                const action = log[i]

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
        } else {
            let solveArrayIndex = 0
            const intervalID = setInterval(async () => {
                const action = log[solveArrayIndex]
                const splittedPath = action[1].split('.')
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
        blitzkrieg.rhudmsg('blitzkrieg', 'Solved puzzle', 2)
    }

    getPuzzleSolveCondition(sel: PuzzleSelection) {
        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            throw new Error('no puzzle solution recorded')
        }

        const log = sel.data.recordLog.log
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
