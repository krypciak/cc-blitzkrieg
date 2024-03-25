import { Selection, SelectionManager } from './selection'

export interface BattleSelection extends Selection {}

export class BattleSelectionManager extends SelectionManager<BattleSelection> {
    recorder: any //BattleChangeRecorder

    constructor() {
        super('battle', '#00770044', '#22ff2244', [blitzkrieg.mod.baseDirectory + 'json/battleData.json'])
    }
}
