export class BattleSelectionManager {
    constructor() {
        this.battleIndex = 0;
        this.waitForLoad = false
        this._tmpSel = null
        this.barrierList = []
    }

    addData(sel) {
        if (sel === null) 
            return
        sel.data["index"] = this.battleIndex++
            
        sel.data["elements"] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sel.data.skills = []
        sc.model.player.skills.forEach((val, i) => {
            if (val !== null) sel.data.skills.push(i)
        });
        sel.data["spLevel"] = sc.model.player.spLevel
        sel.data["skillPoints"] = ig.copy(sc.model.player.skillPoints)
        sel.data["chapter"] = sc.model.player.chapter
        sel.data["level"] = sc.model.player.level
        sel.data["equip"] = ig.copy(sc.model.player.equip)
        sel.data["plotLine"] = "plot" in ig.vars.storage ? ig.vars.storage.plot.line : -1
    }

    restoreData(sel) {
        ig.blitzkrieg.msg("blitzkrieg", "Restored battle data", 2)
        // let enemies = []
        // sel.bb.forEach((rect, i) => {
        //     enemies = enemies.concat(ig.game.getEntitiesInRectangle(rect.x, rect.y, 0, rect.width, rect.height, 1000).filter((entity) => "aggression" in entity))
        // });
        // console.log(enemies)

        sel.data["elements"] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sc.model.player.skills.forEach((val, i) => {
            sc.model.player.unlearnSkill(i)
        });
        sc.model.player.skills = []
        sel.data.skills.forEach(function(i) {
            sc.model.player.learnSkill(i)
        });

        sc.model.player.setSpLevel(sel.data.spLevel)
        sc.model.player.skillPoints = sel.data.skillPoints
        sc.model.player.chapter = sel.data.chapter
        sc.model.player.setLevel(sel.data.level)
        sc.model.player.equip = sel.data.equip
        if("plot" in ig.vars.storage)
            ig.vars.storage.plot.line = sel.data.plotLine
        
        sc.model.player.updateStats()
    }

    async findAllSpawners() {
        await ig.blitzkrieg.util.loadAllMaps()
        let spawners = {}

        for (let mapName in ig.blitzkrieg.allMaps) {
            let map = ig.blitzkrieg.allMaps[mapName]
            for (let entity of map.entities) {
                if (entity.type == "EnemySpawner") {
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
