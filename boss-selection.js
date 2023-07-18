export class BossSelectionManager {
    async newSelEvent(sel) {
        await ig.blitzkrieg.bossSelectionManager.finalizeSel(sel)
    }

    async finalizeSel(sel) {
        let scale = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        let bossDiff = await ig.blitzkrieg.util.syncDialog('select boss difficulty', scale)
        let bossType = await ig.blitzkrieg.util.syncDialog('select boss type', ['main', 'side'])

        // heat cold shock wave
        sel.data.elements = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]
        sel.data.difficulty = parseInt(bossDiff)
        sel.data.type = bossType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1
        sel.data.prevMap = ig.game.previousMap
        sel.data.prevMarker = ig.game.marker

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

    solve() {}
}
