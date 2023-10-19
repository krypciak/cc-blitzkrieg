import { Util } from './util'
import { IChangeRecorder } from './change-record'
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection'
import { assert } from 'cc-map-util/src/util'

export type RecordedPuzzleElementsEntities = 'BounceBlock' | 'BounceSwitch'

export class PuzzleChangeRecorder implements IChangeRecorder {
    recording: boolean = false
    currentRecord!: {
        steps: Partial<PuzzleSelectionStep>[]
    }
    startTime!: number
    get loopIndex(): number {
        const now = sc.stats.getMap('player', 'playtime') * 1000
        if (! this.startTime) { this.startTime = now  }
        const diff = now - this.startTime
        const res = Math.round(diff * sc.options.get('assist-puzzle-speed'))
        return res
    }
    selM!: PuzzleSelectionManager
    startingSel!: PuzzleSelection

    recordIgnoreSet = new Set([
        'playerVar.input.melee',
        'gamepad.active'
    ])

    constructor() { }

    currentStepIndex: number = -1

    currentStep() {
        return this.currentRecord?.steps[this.currentStepIndex]
    }

    pushLog(path: string, value: any): void
    pushLog(action: string, pos: Vec2, type: RecordedPuzzleElementsEntities): void
    pushLog(action: string, pos: Vec2, type?: RecordedPuzzleElementsEntities) {
        if (type) {
            this.currentStep().log!.push([this.loopIndex, pos, type!, action!])
        } else {
            this.currentStep().log!.push([this.loopIndex, /* var path */ action, /* value */ pos])
        }
    }
    

    injectRecordingPrestart() {
        const self = this
        ig.Vars.inject({
            set(path: string, value) {
                if (self.recording && !self.recordIgnoreSet.has(path)) {
                    const prev = ig.vars.get(path)
                    let changed: boolean = false
                    if (typeof value === 'object') {
                        changed = JSON.stringify(prev) !== JSON.stringify(value)
                    } else {
                        changed = prev !== value
                    }
                    if (changed) {
                        self.pushLog('.' + path, value)
                    }

                }
                this.parent(path, value)
            },
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (self.recording && sc.control.thrown()) {
                    self.nextStep()
                }
            }
        })

        ig.ENTITY.BounceBlock.inject({
            ballHit(e: ig.Entity, pos: Vec2): boolean {
                if (self.recording && e.isBall && !sc.bounceSwitchGroups.isGroupBallConflict(this.group, e) &&
                    pos && !Vec2.isZero(pos) && !this.blockState) {

                    self.pushLog('on', Vec2.create(this.coll.pos), 'BounceBlock')
                }
                return this.parent(e, pos)
            },
            onGroupResolve(hide?: boolean) {
                if (self.recording) {
                    self.pushLog('resolve', Vec2.create(this.coll.pos), 'BounceBlock')
                }
                this.parent(hide)
            },
        })
        ig.ENTITY.BounceSwitch.inject({
            onGroupResolve() {
                if (self.recording) { self.pushLog('resolve', Vec2.create(this.coll.pos), 'BounceSwitch') }
                this.parent()
            },
        })
    }

    split() { this.currentStep().split = true }

    private nextStep() {
        if (this.currentStepIndex >= 0) {
            const step = this.currentStep()
            step.element = sc.model.player.currentElementMode
            step.pos = Object.assign(Vec3.create(ig.game.playerEntity.coll.pos), { level: Util.getLevelFromZ(ig.game.playerEntity.coll.pos.z) })
            step.shootAngle = ig.game.playerEntity.aimDegrees
            step.endFrame = this.loopIndex
        }
        this.currentStepIndex = this.currentRecord.steps.push({
            log: []
        }) - 1
    }

    startRecording(selM: PuzzleSelectionManager, startingSel: PuzzleSelection) {
        this.selM = selM
        assert(startingSel)
        this.startingSel = startingSel
        this.currentRecord = {
            steps: []
        }
        this.startTime = 0
        this.currentStepIndex = -1
        this.nextStep()
        this.recording = true
        blitzkrieg.rhudmsg('blitzkrieg', 'Started recording for game state changes', 2)
    }

    stopRecording(purge?: boolean) {
        this.recording = false
        blitzkrieg.rhudmsg('blitzkrieg', 'Stopped recording', 2)

        if (! purge) {
            this.startingSel.data.recordLog = {
                steps: this.currentRecord.steps as PuzzleSelectionStep[]
            }
            this.selM.save()
        }
    }
}
