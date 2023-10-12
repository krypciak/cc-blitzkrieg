import { Util } from './util'
import { IChangeRecorder } from './change-record'
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection'
import { assert } from 'cc-map-util/src/util'

export class PuzzleChangeRecorder implements IChangeRecorder {
    recording: boolean = false
    currentRecord!: {
        steps: Partial<PuzzleSelectionStep>[]
    }
    loopIndex: number = -1
    selM!: PuzzleSelectionManager
    startingSel!: PuzzleSelection
    constructor(
        public tps: number,
    ) {}

    currentStepIndex: number = -1

    injectRecordingPrestart() {
        const self = this
        ig.Vars.inject({
            set(path: string, value) {
                if (self.recording) {
                    const prev = ig.vars.get(path)
                    let changed: boolean = false
                    if (typeof value === 'object') {
                        changed = JSON.stringify(prev) !== JSON.stringify(value)
                    } else {
                        changed = prev !== value
                    }
                    if (changed) {
                        self.currentRecord.steps[self.currentStepIndex].log!.push([self.loopIndex, path, value])
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
    }

    private nextStep() {
        if (this.currentStepIndex >= 0) {
            const step = this.currentRecord.steps[this.currentStepIndex]
            step.element = sc.model.player.currentElementMode
            step.pos = Object.assign(Vec3.create(ig.game.playerEntity.coll.pos), { level: Util.getLevelFromZ(ig.game.playerEntity.coll.pos.z) })
            step.shootAngle = ig.game.playerEntity.aimDegrees
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
        this.currentStepIndex = -1
        this.nextStep()
        this.loopIndex = 0
        this.recording = true
        blitzkrieg.rhudmsg('blitzkrieg', 'Started recording for game state changes', 2)

        const self = this
        const intervalID = setInterval(async () => {
            if (! self.recording) {
                clearInterval(intervalID)
                return
            }
            if (! ig.perf.gui) {
                clearInterval(intervalID)
                blitzkrieg.rhudmsg('blitzkrieg', 'Stopping game state recording (entered gui)', 2)
                return
            }
            self.loopIndex++
        }, 1000 / this.tps)
    }

    stopRecording() {
        this.recording = false
        blitzkrieg.rhudmsg('blitzkrieg', 'Stopped recording', 2)

        this.startingSel.data.recordLog = {
            steps: this.currentRecord.steps as PuzzleSelectionStep[]
        }
        this.selM.save()
    }
}
