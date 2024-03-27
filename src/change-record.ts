import { assert } from 'cc-map-util/src/util'
import { Selection, SelectionManager } from './selection'

export interface IChangeRecorder {
    startRecording(startingSel: Selection): void
    stopRecording(purge?: boolean): void
    recording: boolean
}

export abstract class ChangeRecorder<SEL extends Selection, SELM extends SelectionManager<SEL>, T> implements IChangeRecorder {
    recording: boolean = false
    currentRecord!: T
    startingSel!: SEL
    startTick!: number

    getCurrentTime(): number {
        if (this.startTick == -1) this.startTick = ig.game.now
        return Math.round(ig.game.now - this.startTick)
    }

    constructor(
        public selM: SELM,
        public ignoreSet: Set<string>
    ) {
        const self = this
        ig.Vars.inject({
            set(path: string, value) {
                if (path !== undefined && path !== null && self.recording && !self.ignoreSet.has(path)) {
                    const prev = ig.vars.get(path)
                    let changed: boolean = false
                    if (typeof value === 'object') {
                        changed = JSON.stringify(prev) !== JSON.stringify(value)
                    } else {
                        changed = prev !== value
                    }
                    if (changed) {
                        self.pushVariableChange(self.getCurrentTime(), '.' + path, value)
                    }
                }
                this.parent(path, value)
            },
        })
    }

    protected abstract getEmptyRecord(): T

    protected abstract pushVariableChange(frame: number, path: string, value: unknown): void

    startRecording(startingSel: SEL) {
        assert(startingSel)
        this.startingSel = startingSel
        this.currentRecord = this.getEmptyRecord()
        this.startTick = -1
        this.recording = true
        blitzkrieg.rhudmsg('blitzkrieg', 'Started recording for game state changes', 2)
    }

    stopRecording(purge?: boolean) {
        this.recording = false
        blitzkrieg.rhudmsg('blitzkrieg', 'Stopped recording', 2)

        this.startingSel.data ??= {}
        if (!purge) {
            this.startingSel.data.recordLog = this.currentRecord
            this.handleStopRecordingData()
            this.selM.save()
        }
    }

    protected abstract handleStopRecordingData(): void
}
