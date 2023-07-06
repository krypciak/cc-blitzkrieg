export class BattleReplayManager {
    constructor() {
        this.waitForLoad = false
        this._tmpSel = null
        this.barrierList = []
        this.playBattleIndex = -1
    }
    
    getEnemiesInSel(sel) {
        let enemies = []
        for (let rect of sel.bb) {
            enemies = enemies.concat(ig.game.getEntitiesInRectangle(rect.x, rect.y, 0, rect.width, rect.height, 1000)
                .filter((entity) => 'aggression' in entity))
        }
        return enemies
    }

    prepareBattles() {
        this.waitTerminate = true
        this.playBattleIndex = 0

        // make a battle queue
        let battles = []
        for (let key in ig.blitzkrieg.battleSelections.selHashMap) {
            battles = battles.concat(ig.blitzkrieg.battleSelections.selHashMap[key].sels)
        }
        // sort by battleIndex
        this.battleQueue = Object.entries(battles).sort(([, a], [, b]) => {
            return a.data.index - b.data.index
        })
    }

    nextBattle() {
        if (this.playBattleIndex >= this.battleQueue.length) {
            ig.blitzkrieg.msg('blitzkrieg', 'Battles finished', 2)
            return
        }
        ig.blitzkrieg.msg('blitzkrieg', 'Next battle', 2)
        let sel = this.battleQueue[this.playBattleIndex++][1]
        
        // teleport manually (skips transition) to a map if not in it already
        if (ig.game.mapName != sel.map) {
            ig.game.previousMap = ig.game.mapName
            ig.game.mapName = sel.map
            ig.game.events.clearQueue()
            for (let c = 0; c < ig.game.addons.teleport.length; ++c)
                ig.game.addons.teleport[c].onTeleport(ig.game.mapName)
            ig.game.preloadLevel(sel.map)
            
            // wait for level to be loaded in order to continue
            this.waitForLoad = true
            if (! ig.game.addons.levelLoaded.includes(this))
                ig.game.addons.levelLoaded.push(this)
        }
        // restore armor, lvl etc.
        ig.blitzkrieg.battleRecordManager.restoreData(sel)

        this._tmpSel = sel
        // if not changing maps continue immidietly
        if (! this.waitForLoad) {
            this.nextBattle1()
        }
    }
    
    onLevelLoaded() {
        if (this.waitForLoad) {
            this.waitForLoad = false
            this.nextBattle1()
        }
    }

    
    nextBattle1() {
        let sel = this._tmpSel
        let rect = sel.bb[0]

        // telelort player to battle sel 
        let newX = rect.x + 50
        let newY = rect.y + rect.height - 50
        let newZ = 0
        ig.game.playerEntity.coll.setPos(newX, newY, newZ)
        
        // create barriers around battle sel
        let offset = 20
        let barrierX1 = rect.x - offset
        let barrierY1 = rect.y - offset
        let barrierX2 = rect.x + rect.width + offset
        let barrierY2 = rect.y + rect.height + offset

        let barrierWidth = barrierX2 - barrierX1 + 8
        let barrierHeight = barrierY2 - barrierY1 + 8
        
        this.barrierList = []
        this.barrierList.push(ig.blitzkrieg.util.spawnBarrier(barrierX1, barrierY1, 0, barrierWidth, 8))
        this.barrierList.push(ig.blitzkrieg.util.spawnBarrier(barrierX1, barrierY2, 0, barrierWidth, 8))
        this.barrierList.push(ig.blitzkrieg.util.spawnBarrier(barrierX1, barrierY1, 0, 8, barrierHeight))
        this.barrierList.push(ig.blitzkrieg.util.spawnBarrier(barrierX2, barrierY1, 0, 8, barrierHeight))


        // run async loop
        this.waitForBattleEnd(sel)
    }

    waitForBattleEnd(sel) {
        // async loop that checks if all enemies inside battle area are defeated
        this.waitTerminate = false
        const self = this
        const intervalID = setInterval(async () => {
            if (self.waitTerminate) {
                clearInterval(intervalID)
                return
            }
            if (self.getEnemiesInSel(sel).length == 0) {
                clearInterval(intervalID)
                self.battleEnd()
                this.waitTerminate = true
            }
        }, 1000 / 5)
    }

    battleEnd() {
        let counter = 0
        let counterMax = 3
        const self = this
        const intervalID = setInterval(async () => {
            if (counter >= counterMax) {
                // kill all barriers
                for (let entity of this.barrierList) {
                    entity.skyBlockEntity.kill()
                    entity.kill()
                }
                this.barrierList = []
                self.nextBattle()
                clearInterval(intervalID)
                return
            } else {
                ig.blitzkrieg.msg('blitzkrieg', 'Starting new battle in ' + (counterMax - counter++), 0.9)
            }
        }, 1000 / 1)
    }

}
