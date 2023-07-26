import { ChangeRecorder } from './change-record.js'

export class BattleSelectionManager {
    constructor() {
        this.battleIndex = 0
        this.waitForLoad = false
        this._tmpSel = null
        this.barrierList = []


        let ignoreSet = new Set([
            '.playerVar.input.melee',
            '.gamepad.active'
        ])
        this.recorder = new ChangeRecorder(10, ignoreSet,
            (battleSelections, record, loopIndex) => {
                if (! record.enemyLog) { record.enemyLog = [] }
                if (loopIndex % 5 == 0) { 
                    record.enemyLog.push([loopIndex, 'test', loopIndex])
                }
            }
        )
    }

    async newSelEvent(sel) {
        await ig.blitzkrieg.battleSelectionManager.finalizeSel(sel)
    }

    async finalizeSel(sel) {
        let scale = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        let battleDiff = await ig.blitzkrieg.util.syncDialog('select battle difficulty', scale)
        let battleType = await ig.blitzkrieg.util.syncDialog('select boss type', ['main', 'side'])

        // heat cold shock wave
        sel.data['elements'] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sel.data.difficulty = parseInt(battleDiff)
        sel.data.type = battleType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1

        sel.data.startPos = ig.game.playerEntity.coll.pos
        sel.data.endPos = ig.game.playerEntity.coll.pos

        sel.data.skills = []
        sc.model.player.skills.forEach((val, i) => {
            if (val !== null) sel.data.skills.push(i)
        })
        sel.data.spLevel = sc.model.player.spLevel
        sel.data.skillPoints = ig.copy(sc.model.player.skillPoints)
        sel.data.level = sc.model.player.level
        sel.data.equip = ig.copy(sc.model.player.equip)
    }

    restoreData(sel) {
        ig.blitzkrieg.msg('blitzkrieg', 'Restored battle data', 2)
        // let enemies = []
        // sel.bb.forEach((rect, i) => {
        //     enemies = enemies.concat(ig.game.getEntitiesInRectangle(rect.x, rect.y, 0, rect.width, rect.height, 1000).filter((entity) => 'aggression' in entity))
        // });
        // console.log(enemies)

        sel.data['elements'] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sc.model.player.skills.forEach((val, i) => {
            sc.model.player.unlearnSkill(i)
        })
        sc.model.player.skills = []
        sel.data.skills.forEach(function(i) {
            sc.model.player.learnSkill(i)
        })

        sc.model.player.setSpLevel(sel.data.spLevel)
        sc.model.player.skillPoints = sel.data.skillPoints
        sc.model.player.chapter = sel.data.chapter
        sc.model.player.setLevel(sel.data.level)
        sc.model.player.equip = sel.data.equip
        if('plot' in ig.vars.storage)
            ig.vars.storage.plot.line = sel.data.plotLine
        
        sc.model.player.updateStats()
    }

    // skip fight
    solve() {
        let sel = ig.blitzkrieg.battleSelections.inSelStack.peek()

        if (! sel) { return }

        if (! sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            ig.blitzkrieg.msg('blitzkrieg', 'No battle skip recorded!')
            return
        }

        ig.blitzkrieg.puzzleSelectionManager.solveSel(sel, 0)

    }

    async findAllSpawners() {
        await ig.blitzkrieg.util.loadAllMaps()
        let spawners = {}

        for (let mapName in ig.blitzkrieg.util.cachedMaps) {
            let map = ig.blitzkrieg.util.cachedMaps[mapName]
            for (let entity of map.entities) {
                if (entity.type == 'EnemySpawner') {
                    if (! (mapName in spawners)) {
                        spawners[mapName] = []
                    }
                    spawners[mapName].push(ig.copy(entity))
                }
            }
        }
        ig.blitzkrieg.allSpawners = spawners
    }
}
