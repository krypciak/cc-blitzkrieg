import { Selection, SelectionManager } from './selection'

export interface BattleSelection extends Selection {
    data: {
        endPos: Vec3 & { level: number }
        startPos: Vec3 & { level: number }
    }
}

export class BattleSelectionManager extends SelectionManager<BattleSelection> {
    constructor() {
        super(0, '#00770044', '#22ff2244', [blitzkrieg.mod.baseDirectory + 'json/battleData.json'])
    }
}
