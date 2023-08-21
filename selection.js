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
    constructor(name, completeColor, tempColor, jsonfiles, newSelEvent, walkInEvent, walkOutEvent) {
        tilesize = blitzkrieg.tilesize
        this.name = name
        this.selHashMap = {}
        this.mapSels = {
            sels: [],
            tempSel: new Selection(null),
            fileIndex: 0,
        }
        this.newSelEvent = newSelEvent !== undefined ? newSelEvent : () => {}
        this.walkInEvent = walkInEvent !== undefined ? walkInEvent : () => {}
        this.walkOutEvent = walkOutEvent !== undefined ? walkOutEvent : () => {}
        this.selIndexes = [-1]
        this.inSelStack = new Stack()

        this.completeColor = completeColor
        this.tempColor = tempColor
        this.drawBoxes = false
        this.jsonfiles = jsonfiles
        this.loadAll()
        this._ready = true
    }

    setSelHashMapEntry(mapName, entry) {
        if (! entry.tempSel) {
            entry.tempSel = new Selection(null)
        }
        this.selHashMap[mapName] = entry
    }

    onNewMapEnter() {
        let mapName = ig.game.mapName.split('.').join('/')
        this.mapSels = this.selHashMap[mapName]
        if (this.mapSels === undefined)
            this.mapSels = {
                sels: [],
                tempSel: new Selection(mapName),
                fileIndex: 0,
            }
        this.setSelHashMapEntry(mapName, this.mapSels)
    }

    async create() {
        if (blitzkrieg.util.waitingForPos) {
            blitzkrieg.util.waitingForPos = false
            return
        }
        let setStep = true
        if (this.mapSels.tempSel.bb.length > 0) {
            let { rects, size } = blitzkrieg.util.reduceRectArr(this.mapSels.tempSel.bb)
            this.mapSels.tempSel.bb = rects
            this.mapSels.tempSel.size = size

            await this.newSelEvent(this.mapSels.tempSel)
            this.mapSels.sels.push(this.mapSels.tempSel)
            this.selectStep = -1
            setStep = false
        }
        this.mapSels.tempSel = new Selection(ig.game.mapName.split('.').join('/'))
        if (setStep) {
            this.selectStep = 0
        } else {
            this.save()
        }
        this._x = 0
        this._y = 0
        this._width = 0
        this._height = 0
    }

    delete() {
        let pos = { x: 0, y: 0 }
        ig.system.getMapFromScreenPos(
            pos,
            sc.control.getMouseX(),
            sc.control.getMouseY()
        )

        let deletedAnything = false
        for (let i = 0; i < this.mapSels.sels.length; i++) {
            let sel = this.mapSels.sels[i]
            if (this.isSelInPos(sel, pos)) {
                this.mapSels.sels.splice(i, 1)
                i--
                deletedAnything = true
            }
        }
        
        for (let i = 0; i < this.mapSels.tempSel.bb.length; i++) {
            if (this.isRectInPos(this.mapSels.tempSel.bb[i], pos)) {
                this.mapSels.tempSel.bb.splice(i, 1)
                i--
                deletedAnything = true
            }
        }
        if (! deletedAnything) {
            this.deconstruct()
        }
        this.save()
    }


    deconstruct() {
        let sel = this.inSelStack.peek()
        if (! sel) { return }

        this.mapSels.tempSel = ig.copy(sel)
        let index
        for (let i = 0; i < this.mapSels.sels.length; i++) {
            let selI = this.mapSels.sels[i]
            if (selI.size.x == sel.size.x && selI.size.y == sel.size.y &&
                selI.size.width == sel.size.width && selI.size.height == sel.size.height) {
                
                index = i
                break
            }
        }
        this.mapSels.sels.splice(index, 1)

        this._x = 0
        this._y = 0
        this._width = 0
        this._height = 0
        this.selectStep = 0

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
            this._x = Math.max(0, pos.x)
            this._y = Math.max(0, pos.y)

            break
        }
        case 1: {
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            pos.x = Math.max(0, Math.floor(pos.x / tilesize) * tilesize)
            pos.y = Math.max(0, Math.floor(pos.y / tilesize) * tilesize)
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
        return (pos.x >= rect.x && pos.x < (rect.x + rect.width) &&
                pos.y >= rect.y && pos.y < (rect.y + rect.height))
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
        if (this.mapSels.sels) {
            for (let i = 0; i < this.mapSels.sels.length; i++) {
                this.checkSelForEvents(this.mapSels.sels[i], pos, i)
            }
        }

        if (this.mapSels.tempSel) {
            this.checkSelForEvents(this.mapSels.tempSel, pos, this.mapSels.sels.length)
        }
    }


    drawBox(rect, color) {
        let pos = { x: 0, y: 0 }
        ig.system.getScreenFromMapPos(pos, rect.x, rect.y)
        let w = rect.width, h = rect.height
        if (blitzkrieg.selectionOutlines) {
            w -= 2
            h -= 2
        }
        new ig.SimpleColor(color).draw(pos.x, pos.y, w, h)
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
        if (blitzkrieg.selectionMode == this.name) {
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
    }

    toggleDrawing() {
        this.drawBoxes = ! this.drawBoxes
    }

    async save() {
        let newMap = ig.copy(this.selHashMap)
        for (let mapName in newMap) {
            let obj = newMap[mapName]
            if (obj.sels.length == 0 && obj.tempSel.bb.length == 0) {
                delete newMap[mapName]
                delete this.selHashMap[mapName]
            }
        }
        let saveObjects = []
        for (let i = 0; i < this.jsonfiles.length; i++) { saveObjects.push({}) }
        for (let mapName in newMap) {
            let mapsel = newMap[mapName]
            saveObjects[mapsel.fileIndex][mapName] = mapsel
        }
        for (let i = 0; i < this.jsonfiles.length; i++) {
            let json = JSON.stringify(saveObjects[i])
            fs.writeFileSync(this.jsonfiles[i], json)
        }
    }

    async load(index) {
        try {
            const json = fs.readFileSync(this.jsonfiles[index], 'utf8')
            const obj = JSON.parse(json)
            for (let mapName in obj) {
                obj[mapName].fileIndex = index
            }
            if (this.selHashMap) {
                this.selHashMap = { ...this.selHashMap, ...obj }
            }
        } catch(error) {
            // file doesn't exist
        }
    }

    async loadAll() {
        for (let i = 0; i < this.jsonfiles.length; i++) {
            this.load(i)
        }
    }
}

