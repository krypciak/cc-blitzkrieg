import { Util } from './util'
import { ChangeRecorder } from './change-record'
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection'

export type RecordedPuzzleElementsEntities = 'BounceBlock' | 'BounceSwitch'

type PuzzleChangeRecorderData = { steps: Partial<PuzzleSelectionStep>[] }

export class PuzzleChangeRecorder extends ChangeRecorder<PuzzleSelection, PuzzleSelectionManager, PuzzleChangeRecorderData> {
    //get loopIndex(): number {
    //    return 0
    //    // const now = ig.game.now
    //    // if (!this.startTime) {
    //    //     this.startTime = now
    //    // }
    //    // const diff = now - this.startTime
    //    // const res = Math.round(diff * sc.options.get('assist-puzzle-speed'))
    //    // return res
    //}

    private currentStepIndex: number = -1

    constructor(selM: PuzzleSelectionManager) {
        super(selM, new Set(['playerVar.input.melee', 'gamepad.active']))

        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (self.recording && sc.control.thrown()) {
                    self.nextStep()
                }
            },
        })

        ig.ENTITY.BounceBlock.inject({
            ballHit(e: ig.Entity, ...args: unknown[]): boolean {
                const pos: Vec2 = args[0] as Vec2
                if (self.recording && e.isBall && !sc.bounceSwitchGroups.isGroupBallConflict(this.group, e) && pos && !Vec2.isZero(pos) && !this.blockState) {
                    self.pushAction('on', this.coll.pos, 'BounceBlock')
                }
                return this.parent!(e, ...args)!
            },
            onGroupResolve(hide?: boolean) {
                if (self.recording) {
                    self.pushAction('resolve', this.coll.pos, 'BounceBlock')
                }
                this.parent(hide)
            },
        })
        ig.ENTITY.BounceSwitch.inject({
            onGroupResolve() {
                if (self.recording) {
                    self.pushAction('resolve', this.coll.pos, 'BounceSwitch')
                }
                this.parent()
            },
        })
    }

    getCurrentTime(): number {
        return Math.round((ig.game.now - this.startTick) * sc.options.get('assist-puzzle-speed'))
    }

    private currentStep() {
        return this.currentRecord?.steps[this.currentStepIndex]
    }

    protected pushVariableChange(frame: number, path: string, value: unknown): void {
        this.currentStep().log!.push([frame, path, value])
    }

    private pushAction(action: string, pos: Vec2, type: RecordedPuzzleElementsEntities) {
        this.currentStep().log!.push([this.getCurrentTime(), pos, type, action])
    }

    protected getEmptyRecord(): PuzzleChangeRecorderData {
        return {
            steps: [],
        }
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
            step.endFrame = this.getCurrentTime()
        }
        this.currentStepIndex =
            this.currentRecord.steps.push({
                log: [],
            }) - 1
    }

    protected handleStopRecordingData(): void {
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
    }
}
