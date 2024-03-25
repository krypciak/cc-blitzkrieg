import { BattleRecorder } from './battle-recorder'
import { Selection, SelectionManager } from './selection'

export interface BattleSelection extends Selection {}

export class BattleSelectionManager extends SelectionManager<BattleSelection> {
    recorder: BattleRecorder

    constructor() {
        super(0, '#00770044', '#22ff2244', [blitzkrieg.mod.baseDirectory + 'json/battleData.json'])
        this.recorder = new BattleRecorder(this)
    }

    public solve() {
        console.log('solve attempt')
    }
}
