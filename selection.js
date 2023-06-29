import { TextNotification } from './text-notification.js';
import { Rectangle, Stack } from './util.js'

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
        this.selHashMap = {}
        this.mapSels = {
            sels: [],
            tempSel: new Selection(null),
        }
        this.newSelEvent = newSelEvent !== undefined ? newSelEvent : function() {}
        this.walkInEvent = walkInEvent !== undefined ? walkInEvent : function() {}
        this.walkOutEvent = walkOutEvent !== undefined ? walkOutEvent : function() {}
        this.selIndexes = [-1]
        this.inSelStack = new Stack()

        this.completeColor = completeColor
        this.tempColor = tempColor
        this.drawBoxes = true
        this.fs = require('fs');
        this.jsonfile = jsonfile
        try {
            this.load()
        } catch(error) {}
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

    create() {
        if (this.mapSels.tempSel.bb.length > 0) {
            this.newSelEvent(this.mapSels.tempSel)
            this.mapSels.sels.push(this.mapSels.tempSel)
        }
        this.mapSels.tempSel = new Selection(ig.game.mapName);
        this.selectStep = 0;
        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
        this.save()
    }

    delete() {
        let pos = { x: 0, y: 0 }
        ig.system.getMapFromScreenPos(
            pos,
            sc.control.getMouseX(),
            sc.control.getMouseY()
        );

        for (let i = 0; i < this.mapSels.sels.length; i++) {
            let sel = this.mapSels.sels[i]
            if (this.isSelInPos(sel, pos)) {
                this.mapSels.sels.splice(i, 1);
                i--;
            }
        }
        
        let self = this
        this.mapSels.tempSel.bb = this.mapSels.tempSel.bb.filter(rect => ! self.isRectInPos(rect, pos))
        this.save()
    }

    select() {
        let pos = { x: 0, y: 0 }
        switch (this.selectStep) {
            case 0:
                ig.system.getMapFromScreenPos(
                  pos,
                  sc.control.getMouseX(),
                  sc.control.getMouseY()
                );
                this._x = pos.x
                this._y = pos.y

                break;
            case 1:
                ig.system.getMapFromScreenPos(
                    pos,
                    sc.control.getMouseX(),
                    sc.control.getMouseY()
                );
                this._width = pos.x - this._x
                this._height = pos.y - this._y
                this.selectStep = -1;

                if (this._width < 1 || this._height < 1) {
                    TextNotification.msg("blitzkrieg", "Invalid selection", 2)
                } else {
                    this.mapSels.tempSel.bb.push(new Rectangle(this._x, this._y, this._width, this._height))
                    this.selIndexes.push(-1)
                    this.save()
                }
                this._x = 0;
                this._y = 0;
                this._width = 0;
                this._height = 0;
                break;
        }

        this.selectStep++;
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
                this.walkInEvent(sel);
            }
        } else {
            if (this.selIndexes[i] != -1) {
                this.inSelStack.shift()
                this.walkOutEvent(sel);
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
        sel.bb.forEach(function(rect) {
            self.drawBox(rect, color)
        });
    }

    drawSelections() {
        if (! this._ready || ! this.drawBoxes || ! ig.perf.gui) return;

        let self = this
        this.mapSels.sels.forEach(function(sel) {
            self.drawSelBoxes(sel, self.completeColor)
        });

        this.drawSelBoxes(this.mapSels.tempSel, this.tempColor)
    }

    toogleDrawing() {
        this.drawBoxes = ! this.drawBoxes
    }

    save() {
        // TextNotification.msg("blitzkrieg", "save", 2)
        const json = JSON.stringify(this.selHashMap);
        this.fs.writeFileSync(this.jsonfile, json)
    }

    load() {
        const json = this.fs.readFileSync(this.jsonfile, 'utf8');
        const obj = JSON.parse(json);
        this.selHashMap =  obj
    }
}

