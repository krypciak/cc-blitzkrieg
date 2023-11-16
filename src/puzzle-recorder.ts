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
        const now = ig.game.now
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

    initPrestart() {
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
        ig.Game.inject({
            update() {
                this.parent()
                if (!this.paused && !ig.loading && !sc.model.isTitle()) {
                    ig.game.now += ig.system.tick*1000
                }
            },
        })

        ig.ENTITY.BounceBlock.inject({
            ballHit(e: ig.Entity, ...args: unknown[]): boolean {
                const pos: Vec2 = args[0] as Vec2
                if (self.recording && e.isBall && !sc.bounceSwitchGroups.isGroupBallConflict(this.group, e) &&
                    pos && !Vec2.isZero(pos) && !this.blockState) {

                    self.pushLog('on', Vec2.create(this.coll.pos), 'BounceBlock')
                }
                return this.parent!(e, ...args)!
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

    initPoststart() {
        ig.game.now = 0
    }

    split() {
        const step = this.currentStep()
        if (step.split) {
            delete step.split
            this.nextStep()
            delete step.shootAngle
        } else {
            blitzkrieg.rhudmsg('blitzkrieg', 'Split', 1)
            step.split = true
        }
    }

    private nextStep() {
        if (this.currentStepIndex >= 0) {
            blitzkrieg.rhudmsg('blitzkrieg', 'Next step', 1)
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
            const steps: PuzzleSelectionStep[] = this.currentRecord.steps as PuzzleSelectionStep[]
            const stepMultishotMergeDist: number = 200 /* in ms */
            const stepMultishotMergeAngleDist: number = 3

            const mergedSteps: PuzzleSelectionStep[] = steps.reduce((acc: PuzzleSelectionStep[], curr: PuzzleSelectionStep) => {
                const last: PuzzleSelectionStep = acc.last()
                let fail: boolean = true
                if (last && last.shootAngle && curr.shootAngle) {
                    const diff = curr.endFrame - (last.lastShotFrame ?? last.endFrame)

                    const angleDiff = Math.abs(last.shootAngle - curr.shootAngle)
                    const angleDist: number = Math.min(angleDiff, 360 - angleDiff)

                    // console.log(curr, 'frameDiff:', diff, 'angleDiff:', angleDiff)
                    if (diff <= stepMultishotMergeDist && angleDist <= stepMultishotMergeAngleDist && curr.element == last.element) {
                        last.shotCount ??= 0
                        last.shotCount++
                        last.lastShotFrame = curr.endFrame
                        last.log.push(...curr.log)
                        fail = false
                    }
                } 
                if (fail) {
                    acc.push(curr)
                }
                return acc
            }, [])

            this.startingSel.data.recordLog = { steps: mergedSteps }
            this.selM.save()
        }
    }
}
