import { assert } from 'cc-map-util/src/util'
import { Selection, SelectionManager } from './selection'

export interface IChangeRecorder {
    startRecording(startingSel: Selection): void
    stopRecording(purge?: boolean): void
    recording: boolean
}

export abstract class ChangeRecorder<S extends Selection, M extends SelectionManager<S>, T> implements IChangeRecorder {
    recording: boolean = false
    currentRecord!: T
    startingSel!: S
    startTick!: number

    getCurrentTime(): number {
        return ig.game.now - this.startTick
    }

    constructor(
        public selM: M,
        public ignoreSet: Set<string>
    ) {
        const self = this
        ig.Vars.inject({
            set(path: string, value) {
                if (self.recording && !self.ignoreSet.has(path)) {
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

    startRecording(startingSel: S) {
        assert(startingSel)
        this.startingSel = startingSel
        this.currentRecord = this.getEmptyRecord()
        this.startTick = ig.game.now
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
