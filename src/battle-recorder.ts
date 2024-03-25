import { ChangeRecorder } from './change-record'
import { BattleSelection, BattleSelectionManager } from './battle-selection'

type BattleRecorderEvent = 'death'
type BattleRecorderData = { log: [/* frame */ number, /* path or event */ string | BattleRecorderEvent, /* enemy uuid or value */ string | unknown][] }

export class BattleRecorder extends ChangeRecorder<BattleSelection, BattleSelectionManager, BattleRecorderData> {
    constructor(selM: BattleSelectionManager) {
        super(selM, new Set(['playerVar.input.melee', 'gamepad.active']))
        const self = this

        ig.ENTITY.Enemy.inject({
            onKill() {
                this.parent()
                console.log('death')
                self.pushVariableChange(self.getCurrentTime(), 'death', this.uuid)
            },
        })
    }

    protected pushVariableChange(frame: number, event: BattleRecorderEvent, uuid: string): void {
        this.currentRecord.log!.push([frame, event, uuid])
    }

    protected getEmptyRecord(): BattleRecorderData {
        return {
            log: [],
        }
    }

    protected handleStopRecordingData(): void {
        console.log(this.currentRecord)
    }
}
