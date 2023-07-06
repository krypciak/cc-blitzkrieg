export class PuzzleSpeedManager {
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
    
    inc() {
        this._increse_speed(this.incStep)
    }

    dec() {
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
}
