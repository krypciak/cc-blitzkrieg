import { Rectangle, Stack } from './util.js'
let tilesize
let fs = require('fs')

export class Selection {
    constructor(map) {
        this.bb = []
        this.map = map
        this.data = {}
    }
}

export class Selections {
    // newSelEvent(Selection)
    // walkInEvent(Selection)
    // walkOutEvent(Selection)
    constructor(completeColor, tempColor, jsonfile, newSelEvent, walkInEvent, walkOutEvent) {
        tilesize = ig.blitzkrieg.tilesize
        this.selHashMap = {}
        this.mapSels = {
            sels: [],
            tempSel: new Selection(null),
        }
        this.newSelEvent = newSelEvent !== undefined ? newSelEvent : () => {}
        this.walkInEvent = walkInEvent !== undefined ? walkInEvent : () => {}
        this.walkOutEvent = walkOutEvent !== undefined ? walkOutEvent : () => {}
        this.selIndexes = [-1]
        this.inSelStack = new Stack()

        this.completeColor = completeColor
        this.tempColor = tempColor
        this.drawBoxes = false
        this.jsonfile = jsonfile
        try {
            this.load()
        } catch(error) {
            // file doesn't exist
        }
        this._ready = true

    }

    onNewMapEnter() {
        this.mapSels = this.selHashMap[ig.game.mapName]
        if (this.mapSels === undefined)
            this.mapSels = {
                sels: [],
                tempSel: new Selection(ig.game.mapName),
            }
        this.selHashMap[ig.game.mapName] = this.mapSels
    }

    async create() {
        if (ig.blitzkrieg.util.waitingForPos) {
            ig.blitzkrieg.util.waitingForPos = false
            return
        }
        let setStep = true
        if (this.mapSels.tempSel.bb.length > 0) {
            let { rects, size } = ig.blitzkrieg.util.reduceRectArr(this.mapSels.tempSel.bb)
            this.mapSels.tempSel.bb = rects
            this.mapSels.tempSel.size = size

            await this.newSelEvent(this.mapSels.tempSel)
            this.mapSels.sels.push(this.mapSels.tempSel)
            this.selectStep = -1
            setStep = false
        }
        this.mapSels.tempSel = new Selection(ig.game.mapName)
        if (setStep) {
            this.selectStep = 0
        }
        this._x = 0
        this._y = 0
        this._width = 0
        this._height = 0
        this.save()
    }

    delete() {
        let pos = { x: 0, y: 0 }
        ig.system.getMapFromScreenPos(
            pos,
            sc.control.getMouseX(),
            sc.control.getMouseY()
        )

        for (let i = 0; i < this.mapSels.sels.length; i++) {
            let sel = this.mapSels.sels[i]
            if (this.isSelInPos(sel, pos)) {
                this.mapSels.sels.splice(i, 1)
                i--
            }
        }
        
        let self = this
        this.mapSels.tempSel.bb = this.mapSels.tempSel.bb.filter(rect => ! self.isRectInPos(rect, pos))
        this.save()
    }

    select() {
        if (this.selectStep == -1) { return }
        let pos = { x: 0, y: 0 }
        switch (this.selectStep) {
        case 0: {
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            pos.x = Math.floor(pos.x / tilesize) * tilesize
            pos.y = Math.floor(pos.y / tilesize) * tilesize
            this._x = pos.x 
            this._y = pos.y

            break
        }
        case 1: {
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            pos.x = Math.floor(pos.x / tilesize) * tilesize
            pos.y = Math.floor(pos.y / tilesize) * tilesize
            let width = pos.x - this._x
            let height = pos.y - this._y
            this.selectStep = -1

            if (width < 0) {
                this._x += width
                width *= -1
            }
            if (height < 0) {
                this._y += height
                height *= -1
            }
            this.mapSels.tempSel.bb.push(new Rectangle(this._x, this._y, width, height))
            this.selIndexes.push(-1)
            this.save()
            this._x = 0
            this._y = 0
            break
        }
        }

        this.selectStep++
    }

    isRectInPos(rect, pos) {
        return (pos.x >= rect.x && pos.x <= (rect.x + rect.width) &&
                pos.y >= rect.y && pos.y <= (rect.y + rect.height))
    }

    isSelInPos(sel, pos) {
        for (let i = 0; i < sel.bb.length; i++) {
            if (this.isRectInPos(sel.bb[i], pos))
                return true
        }
        return false
    }

    checkSelForEvents(sel, pos, i) {
        let isIn = this.isSelInPos(sel, pos)
        
        // trigger walk in and out events only once
        if (isIn) {
            if (this.selIndexes[i] == -1) {
                this.selIndexes[i] = i
                this.inSelStack.push(sel)
                this.walkInEvent(sel)
            }
        } else {
            if (this.selIndexes[i] != -1) {
                this.inSelStack.shift()
                this.walkOutEvent(sel)
            }
            this.selIndexes[i] = -1
        }
    }

    checkForEvents(pos) {
        if (! this._ready) return
        if (this.mapSels.sels !== undefined) {
            for (let i = 0; i < this.mapSels.sels.length; i++) {
                this.checkSelForEvents(this.mapSels.sels[i], pos, i)
            }
        }

        if (this.mapSels.tempSel !== undefined || this.mapSels.tempSel !== null) {
            this.checkSelForEvents(this.mapSels.tempSel, pos, this.mapSels.sels.length)
        }
    }


    drawBox(rect, color) {
        let pos = { x: 0, y: 0 }
        ig.system.getScreenFromMapPos(pos, rect.x, rect.y)
        new ig.SimpleColor(color).draw(pos.x, pos.y, rect.width, rect.height)
    }

    drawSelBoxes(sel, color) {
        let self = this
        sel.bb.forEach((rect) => {
            self.drawBox(rect, color)
        })
    }

    drawSelections() {
        if (! this._ready || ! this.drawBoxes || ! ig.perf.gui) return

        for (let sel of this.mapSels.sels) {
            this.drawSelBoxes(sel, this.completeColor)
        }

        this.drawSelBoxes(this.mapSels.tempSel, this.tempColor)
        if (this.selectStep == 0) {
            let pos = { x: 0, y: 0 }
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            pos.x = Math.floor(pos.x / tilesize) * tilesize
            pos.y = Math.floor(pos.y / tilesize) * tilesize
            this.drawBox(new Rectangle(pos.x, pos.y, tilesize, tilesize), this.tempColor)
        } else if (this.selectStep == 1) {
            let pos = { x: 0, y: 0 }
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            let width = (Math.floor(pos.x / tilesize) * tilesize) - this._x
            let height = (Math.floor(pos.y / tilesize) * tilesize) - this._y
            this.drawBox(new Rectangle(this._x, this._y, width, height), this.tempColor)
        }
    }

    toogleDrawing() {
        this.drawBoxes = ! this.drawBoxes
    }

    save() {
        // ig.blitzkrieg.msg('blitzkrieg', 'save', 2)
        const json = JSON.stringify(this.selHashMap)
        fs.writeFileSync(this.jsonfile, json)
    }

    load() {
        const json = fs.readFileSync(this.jsonfile, 'utf8')
        const obj = JSON.parse(json)
        this.selHashMap = obj
    }
}

