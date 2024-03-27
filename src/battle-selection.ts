import { Selection, SelectionManager } from './selection'
import { Util } from './util'

export interface BattleSelection extends Selection {
    data: {
        endPos: Vec3 & { level: number }
        startPos: Vec3 & { level: number }
        type: BATTLE_TYPE
        difficulty: number
        timeLength: number
        chapter: number
        plotLine: number
        elements: [boolean, boolean, boolean, boolean]
    }
}

const BattleType = {
    Normal: 0,
    Boss: 1,
} as const

type BATTLE_TYPE = (typeof BattleType)[keyof typeof BattleType]

export class BattleSelectionManager extends SelectionManager<BattleSelection> {
    constructor() {
        super(0, '#00770044', '#22ff2244', [blitzkrieg.mod.baseDirectory + 'json/battleData.json'])
    }

    async newSelEvent(sel: Selection) {
        await this.finalizeSel(sel)
    }

    async finalizeSel(sel: Selection) {
        const scale: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

        const data: Partial<BattleSelection['data']> = {
            type: parseInt(await blitzkrieg.dialogPromise('select battle \\c[3]type\\c[0]', Object.keys(BattleType))) as BATTLE_TYPE,
            difficulty: parseInt(await blitzkrieg.dialogPromise('Select battle \\c[3]difficulty\\c[0]', scale)),
            timeLength: parseInt(await blitzkrieg.dialogPromise('Select battle \\c[3]length\\c[0]', scale)),
            chapter: sc.model.player.chapter,
            plotLine: ig.vars.storage.plot ? ig.vars.storage.plot.line : -1,
            elements: sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_CHANGE)
                ? [
                      sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
                      sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
                      sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
                      sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
                  ]
                : [false, false, false, false],
        }

        blitzkrieg.rhudmsg('blitzkrieg', 'Starting position', 1)
        data.startPos = await Util.waitForPositionKey()
        blitzkrieg.rhudmsg('blitzkrieg', 'Ending position', 1)
        data.endPos = await Util.waitForPositionKey()

        sel.data = { ...sel.data, ...data }
    }
}
