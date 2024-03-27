import { ChangeRecorder } from './change-record'
import { BattleSelection, BattleSelectionManager } from './battle-selection'

export type BattleRecorderEvent = 'death' | 'spawn'
export type BattleRecorderData = { log: [/* frame */ number, /* path or event */ string | BattleRecorderEvent, /* enemy uuid or value */ string | unknown][] }

export class BattleRecorder extends ChangeRecorder<BattleSelection, BattleSelectionManager, BattleRecorderData> {
    constructor(selM: BattleSelectionManager) {
        super(selM, new Set(['playerVar.input.melee', 'gamepad.active']))
        const self = this

        ig.ENTITY.Enemy.inject({
            onKill() {
                this.parent()
                if (self.recording) self.pushEnemyKill(this.uuid)
            },
            show() {
                this.parent()
                if (self.recording) self.pushEnemySpawn(this.uuid)
            },
        })
    }

    protected pushVariableChange(frame: number, event: BattleRecorderEvent, uuid: string): void {
        if (event.startsWith('.')) return
        this.currentRecord.log!.push([frame, event, uuid])
    }

    private pushEnemyKill(uuid: string) {
        this.pushVariableChange(this.getCurrentTime(), 'death', uuid)
    }

    private pushEnemySpawn(uuid: string) {
        this.pushVariableChange(this.getCurrentTime(), 'spawn', uuid)
    }

    protected getEmptyRecord(): BattleRecorderData {
        return {
            log: [],
        }
    }

    protected handleStopRecordingData(): void {}
}
