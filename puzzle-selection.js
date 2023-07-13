export class PuzzleSelectionManager {
    constructor() {
        this.incStep = 0.05
    }

    _increse_speed(val) {
        const sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()

        if (sel == null) 
            return

        if (sel.data['puzzleSpeed'] === undefined) {
            sel.data['puzzleSpeed'] = 1
        }

        sel.data.puzzleSpeed += val
        sc.options.set('assist-puzzle-speed', sel.data.puzzleSpeed)
        ig.blitzkrieg.msg('blitzkrieg', (val > 0 ? 'Incresing' : 'Decresing') + ' selection puzzle speed to ' + Math.round(sel.data.puzzleSpeed * 100) + '%', 1)
        ig.blitzkrieg.puzzleSelections.save()
    }
    
    incSpeed() {
        this._increse_speed(this.incStep)
    }

    decSpeed() {
        this._increse_speed(-this.incStep)
    }

    walkInEvent(sel) {
        let speed = sel === undefined || ! ('puzzleSpeed' in sel.data) ? 1 : sel.data.puzzleSpeed

        if (sc.options.get('assist-puzzle-speed') != speed) {
            sc.options.set('assist-puzzle-speed', speed) 
            ig.blitzkrieg.msg('blitzkrieg', 'Setting puzzle speed to ' + Math.round(speed * 100) + '%', 1)
        }

    }

    // eslint-disable-next-line no-unused-vars
    walkOutEvent(sel) {
        this.walkInEvent(ig.blitzkrieg.puzzleSelections.inSelStack.peek())
    }


    async newSelEvent(sel) {
        await ig.blitzkrieg.puzzleSelectionManager.finalizeSel(sel)
    }

    
    async finalizeSel(sel) {
        sel.data['elements'] = [
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_COLD),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_SHOCK),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_HEAT),
            sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_WAVE),
        ]

        let scale = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        let puzzleDiff = await ig.blitzkrieg.util.syncDialog('select puzzle difficulty', scale)
        let puzzleLen = await ig.blitzkrieg.util.syncDialog('select puzzle length', scale)
        let puzzleType = await ig.blitzkrieg.util.syncDialog('select puzzle type', ['normal', 'getTo'])

        sel.data.difficulty = puzzleDiff
        sel.data.timeLength = puzzleLen
        sel.data.type = puzzleType
        sel.data.chapter = sc.model.player.chapter
        sel.data.plotLine = ig.vars.storage.plot ? ig.vars.storage.plot.line : -1

        ig.blitzkrieg.msg('blitzkrieg', 'Starting position', 3)
        sel.data.startPos = await ig.blitzkrieg.util.waitForPositionKey()
        ig.blitzkrieg.msg('blitzkrieg', 'Ending position', 3)
        sel.data.endPos = await ig.blitzkrieg.util.waitForPositionKey()
    }
}
