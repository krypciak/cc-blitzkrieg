import { Selection, SelectionManager } from './selection'
import { Util } from './util'
import { PuzzleChangeRecorder, RecordedPuzzleElementsEntities } from './puzzle-recorder'
import { assertBool } from 'cc-map-util/src/util'

export enum PuzzleRoomType {
    WholeRoom = 0,
    AddWalls = 1,
    Dis = 2,
}

export enum PuzzleCompletionType {
    Normal = 0,
    GetTo = 1,
    Item = 2,
}

export interface PuzzleSelectionStep {
    log: 
        (([/* frame */ number, /* var path */ string, /* value */ any]) |
         ([/* frame */ number, /* entity Vec2 */ Vec2, /* entity type */ RecordedPuzzleElementsEntities, /* action */ string])
        )[]
    pos: Vec3 & { level: number }
    shootAngle?: number /* in degrees */
    element: sc.ELEMENT
    endFrame: number
    split?: boolean
    shotCount?: number
    lastShotFrame?: number
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
            steps: PuzzleSelectionStep[]
        }
    }
}

function isBounceBlock(e: ig.Entity, type: string): e is ig.ENTITY.BounceBlock { return type == 'BounceBlock' }
function isBounceSwitch(e: ig.Entity, type: string): e is ig.ENTITY.BounceSwitch { return type == 'BounceSwitch' }

export class PuzzleSelectionManager extends SelectionManager {
    recorder: PuzzleChangeRecorder
    incStep: number = 0.05
    changeModifiers: boolean = true
    changeSpeed: boolean = true
    fakeBuffItemId: number = 2137420
    modifiersActive: boolean = false
    fakeBuffActive: boolean = false
    
    constructor() {
        super('puzzle', '#77000022', '#ff222222', [ blitzkrieg.mod.baseDirectory + 'json/puzzleData.json', ])
        this.setFileIndex(0)
        this.recorder = new PuzzleChangeRecorder()

        ig.Game.inject({
            spawnEntity(entity, x, y, z, settings, showAppearEffects) {
                const ret = this.parent(entity, x, y, z, settings, showAppearEffects)
                if (settings?.oldPos) {
                    ret.oldPos = settings.oldPos
                }
                return ret
            },
        })
    }

    updatePuzzleSpeed(sel: PuzzleSelection) {
        const speed: number = (! sel?.data?.puzzleSpeed) ? 1 : sel.data.puzzleSpeed

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

    setSpeed(val: number) {
        if (isNaN(val)) { return }
        const sel: PuzzleSelection = this.inSelStack.peek() as PuzzleSelection
        sel.data.puzzleSpeed = val
        this.updatePuzzleSpeed(sel)
    }
    
    async walkInEvent(sel: PuzzleSelection) {
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
        const scale: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        const data: Partial<PuzzleSelection['data']> = {
            type: PuzzleRoomType[await Util.syncDialog('select puzzle \\c[3]type\\c[0]', Object.keys(PuzzleRoomType).filter(k => isNaN(k as unknown as number))) as keyof typeof PuzzleRoomType],
            completionType: PuzzleCompletionType[await Util.syncDialog('select puzzle \\c[3]completion type\\c[0]', Object.keys(PuzzleCompletionType).filter(k => isNaN(k as unknown as number))) as keyof typeof PuzzleCompletionType],
            difficulty: parseInt(await Util.syncDialog('Select puzzle \\c[3]difficulty\\c[0]', scale)),
            timeLength: parseInt(await Util.syncDialog('Select puzzle \\c[3]length\\c[0]', scale)),
            chapter: sc.model.player.chapter,
            plotLine: ig.vars.storage.plot ? ig.vars.storage.plot.line : -1,
            elements: [
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
                sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
            ],
        }

        blitzkrieg.rhudmsg('blitzkrieg', 'Starting position', 1)
        data.startPos = await Util.waitForPositionKey()
        blitzkrieg.rhudmsg('blitzkrieg', 'Ending position', 1)
        data.endPos = await Util.waitForPositionKey()
        sel.data = { ...sel.data, ...data }
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

        if (! sel.data.recordLog || sel.data.recordLog.steps.length == 0) {
            if (yell) {
                blitzkrieg.rhudmsg('blitzkrieg', 'No puzzle solution recorded!', 5)
            }
            return
        }
        this.solveSel(sel)
    }

    solveSel(sel: PuzzleSelection, delay: number = 0) {
        if (delay != 0) { throw new Error('not implemented') }
        for (const log of sel.data.recordLog!.steps.map(s => s.log)) {
            for (let i = 0; i < log.length; i++) {
                const action = log[i]
                if (action.length == 3) {
                    assertBool(action[1].startsWith('.'))
                    const splittedPath = action[1].substring(1).split('.')
                    let value = ig.vars.storage
                    for (let i = 0; i < splittedPath.length - 1; i++) {
                        if (! value.hasOwnProperty(splittedPath[i])) {
                            value[splittedPath[i]] = {}
                        }
                        value = value[splittedPath[i]]
                    }
                    value[splittedPath[splittedPath.length - 1]] = action[2]
                } else {
                    const type = action[2]
                    const pos: Vec2 = action[1]
                    const act: string = action[3]
                    const e: ig.Entity = PuzzleSelectionManager.getEntityByPos(pos)
                    if (isBounceBlock(e, type)) {
                        if (act == 'on') {
                            sc.combat.showHitEffect(e, e.coll.pos, sc.ATTACK_TYPE.HEAVY, sc.ELEMENT.NEUTRAL, false, false, true)
                            e.effects.spawnOnTarget('bounceHit', e)
                            e.setCurrentAnim('on')
                        }
                        if (act == 'resolve') { e.onGroupResolve(true) }
                    } else if (isBounceSwitch(e, type)) {
                        if (act == 'resolve') { e.onGroupResolve() }
                    }
                }
            }
            // let solveArrayIndex = 0
            // const intervalID = setInterval(async () => {
            //     const action = log[solveArrayIndex]
            //     if (action.length !== 3) { return }
            //     const splittedPath = action[1].split('.')
            //     let value = ig.vars.storage
            //     for (let i = 0; i < splittedPath.length - 1; i++) {
            //         value = value[splittedPath[i]]
            //     }

            //     value[splittedPath[splittedPath.length - 1]] = action[2]

            //     ig.game.varsChangedDeferred()

            //     solveArrayIndex++
            //     if (solveArrayIndex == log.length) {
            //         clearInterval(intervalID)
            //     }
            // }, 1000 / delay)
        }
        ig.game.varsChangedDeferred()
        blitzkrieg.rhudmsg('blitzkrieg', 'Solved puzzle', 2)
    }

    static getEntityByPos(pos: Vec2): ig.Entity {
        for (const e of ig.game.entities) {
            const epos: Vec2 = e.oldPos ?? e.coll.pos
            if (Vec2.equal(epos, pos)) {
                return e
            }
        }
        throw new Error('didnt find')
    }

    static getPuzzleSolveCondition(sel: PuzzleSelection): [string, any] | undefined {
        if (! sel.data.recordLog || sel.data.recordLog.steps.length == 0) {
            throw new Error('no puzzle solution recorded')
        }

        const steps = sel.data.recordLog.steps
        for (let h = steps.length - 1; h >= 0; h--) {
            const log = steps[h].log
            for (let i = log.length - 1; i >= 0; i--) {
                let action = log[i]
                if (action.length !== 3) { continue }
                // let frame = action[0]
                let path = action[1]
                // let value = action[2]
                // console.log(path, value)
                if (path.startsWith('.maps') || path.startsWith('.plot.line')) { continue }
                return [path, action[2]]
            }
        }
        return
    }
}
