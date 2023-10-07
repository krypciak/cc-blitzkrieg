import { assert } from 'cc-map-util/src/util'
import { PuzzleSelection } from 'puzzle-selection'
import { Selection, SelectionManager } from 'selection'

export class ChangeRecorder {
    recording: boolean = false
    currentRecord: PuzzleSelection['data']['recordLog']
    loopIndex: number = -1
    selM!: SelectionManager
    startingSel!: Selection
    constructor(
        public tps: number,
    ) {}

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
                        self.currentRecord!.log.push([self.loopIndex, path, value])
                        // console.log(`path: ${path} from: ${prev} to: ${value}`)
                    }
                }
                this.parent(path, value)
            },
        })
    }

    startRecording(selM: SelectionManager, startingSel: Selection) {
        this.selM = selM
        debugger
        assert(startingSel)
        this.startingSel = startingSel
        this.currentRecord = {
            log: [],
        }
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

        this.startingSel.data ??= {}
        this.startingSel.data.recordLog = this.currentRecord
        this.selM.save()
    }
}
