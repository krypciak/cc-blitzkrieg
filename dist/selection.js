"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionManager = exports.SelectionMapEntry = void 0;
const rect_1 = require("cc-map-util/rect");
const pos_1 = require("cc-map-util/src/pos");
const util_1 = require("cc-map-util/util");
const fsutil_1 = require("./fsutil");
const util_2 = require("./util");
const tilesize = 16;
const defaultDrawBoxes = true;
class SelectionMapEntry {
    constructor(sels, fileIndex, tempSel) {
        this.sels = sels;
        this.fileIndex = fileIndex;
        this.tempSel = tempSel;
    }
    toJSON() {
        return { sels: this.sels };
    }
}
exports.SelectionMapEntry = SelectionMapEntry;
class SelectionManager {
    constructor(name, completeColor, tempColor, jsonFiles) {
        this.name = name;
        this.completeColor = completeColor;
        this.tempColor = tempColor;
        this.jsonFiles = jsonFiles;
        this.selMap = {};
        this.inSelStack = new util_1.Stack();
        this.drawBoxes = defaultDrawBoxes;
        this.selectStep = -1;
        this.selIndexes = [-1];
    }
    async newSelEvent(_) { }
    async walkInEvent(_) { }
    async walkOutEvent(_) { }
    async onNewMapEntryEvent() {
        for (const sel of this.inSelStack.array) {
            this.walkOutEvent(sel);
        }
        this.inSelStack = new util_1.Stack();
    }
    setFileIndex(index) {
        this.fileIndex = index;
    }
    setMapEntry(map, entry) {
        this.selMap[map.replace(/\./g, '/')] = entry;
    }
    getCurrentEntry() {
        var _a;
        return this.selMap[(_a = ig.game.mapName) === null || _a === void 0 ? void 0 : _a.replace(/\./g, '/')];
    }
    async selectionCreatorBegin() {
        if (util_2.Util.waitingForPos) {
            util_2.Util.waitingForPos = false;
            return;
        }
        let setStep = true;
        let entry = this.getCurrentEntry();
        if (!entry) {
            this.setMapEntry(ig.game.mapName, new SelectionMapEntry([], this.fileIndex));
            entry = this.getCurrentEntry();
        }
        if (entry.tempSel && entry.tempSel.bb.length > 0) {
            const obj = (0, rect_1.reduceRectArr)(entry.tempSel.bb);
            const newSel = entry.tempSel;
            newSel.bb = obj.rects;
            newSel.sizeRect = obj.rectSize;
            await this.newSelEvent(newSel);
            entry.sels.push(newSel);
            this.selectStep = -1;
            setStep = false;
            entry.tempSel = undefined;
            this.save();
        }
        entry.tempSel = { bb: [], mapName: ig.game.mapName.replace(/\./g, '/') };
        if (setStep) {
            this.selectStep = 0;
        }
        this.tempPos = new pos_1.MapPoint(0, 0);
    }
    selectionCreatorDelete() {
        const pos = new pos_1.EntityPoint(0, 0);
        ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY());
        const mpos = pos.to(pos_1.MapPoint);
        let deletedAnything = false;
        const entry = this.getCurrentEntry();
        entry.sels = entry.sels.filter(sel => {
            const ok = (0, rect_1.isVecInRectArr)(mpos, sel.bb);
            if (ok) {
                deletedAnything = true;
            }
            return !ok;
        });
        if (entry.tempSel) {
            entry.tempSel.bb = entry.tempSel.bb.filter(rect => {
                const ok = (0, rect_1.isVecInRect)(mpos, rect);
                if (ok) {
                    deletedAnything = true;
                }
                return !ok;
            });
        }
        if (!deletedAnything) {
            this.selectionCreatorDeconstruct();
        }
        this.save();
    }
    selectionCreatorDeconstruct() {
        let sel = this.inSelStack.peek();
        if (!sel) {
            return;
        }
        const entry = this.getCurrentEntry();
        entry.tempSel = ig.copy(sel);
        entry.sels.splice(entry.sels.indexOf(sel), 1);
        this.tempPos = new pos_1.MapPoint(0, 0);
        this.selectStep = 0;
        this.save();
    }
    selectionCreatorSelect() {
        if (this.selectStep == -1) {
            return;
        }
        const pos = new pos_1.EntityPoint(0, 0);
        ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY());
        const mpos = pos.to(pos_1.MapPoint);
        if (this.selectStep == 0) {
            pos_1.Point.floor(mpos);
            Vec2.maxC(mpos, 0, 0);
            Vec2.assign(this.tempPos, mpos);
        }
        else if (this.selectStep == 1) {
            this.selectStep = -1;
            pos_1.Point.round(mpos);
            Vec2.maxC(mpos, 0, 0);
            Vec2.sub(mpos, this.tempPos); /* mpos is now size */
            if (mpos.x < 0) {
                this.tempPos.x += mpos.x;
                mpos.x *= -1;
            }
            if (mpos.y < 0) {
                this.tempPos.y += mpos.y;
                mpos.y *= -1;
            }
            const entry = this.getCurrentEntry();
            (0, util_1.assert)(entry.tempSel);
            entry.tempSel.bb.push(rect_1.MapRect.fromTwoPoints(this.tempPos, mpos));
            this.selIndexes.push(-1);
            this.tempPos = new pos_1.MapPoint(0, 0);
        }
        else {
            throw new Error();
        }
        this.selectStep++;
    }
    checkForEvents(pos) {
        const mpos = pos_1.EntityPoint.fromVec(pos).to(pos_1.MapPoint);
        const entry = this.getCurrentEntry();
        if (entry) {
            for (let i = 0; i < entry.sels.length; i++) {
                this.checkSelForEvents(entry.sels[i], mpos, i);
            }
            if (entry.tempSel) {
                this.checkSelForEvents(entry.tempSel, mpos, entry.sels.length);
            }
        }
    }
    checkSelForEvents(sel, vec, i) {
        let isIn = (0, rect_1.isVecInRectArr)(vec, sel.bb);
        /* trigger walk in and out events only once */
        if (isIn) {
            if (this.selIndexes[i] == -1) {
                this.selIndexes[i] = i;
                this.inSelStack.push(sel);
                this.walkInEvent(sel);
            }
        }
        else {
            if (this.selIndexes[i] != -1) {
                this.inSelStack.shift();
                this.walkOutEvent(sel);
            }
            this.selIndexes[i] = -1;
        }
    }
    drawBox(rect, color) {
        let pos = { x: 0, y: 0 };
        ig.system.getScreenFromMapPos(pos, rect.x, rect.y);
        let w = rect.width, h = rect.height;
        if (blitzkrieg.debug.selectionOutlines) {
            w -= 2;
            h -= 2;
        }
        new ig.SimpleColor(color).draw(pos.x, pos.y, w, h);
    }
    drawBoxArray(rects, color) {
        for (const rect of rects) {
            this.drawBox(rect, color);
        }
    }
    drawSelections() {
        if (!this.drawBoxes || !ig.perf.gui) {
            return;
        }
        const entry = this.getCurrentEntry();
        if (!entry) {
            return;
        }
        for (const sel of entry.sels) {
            this.drawBoxArray(sel.bb.map(rect => rect_1.Rect.new(rect_1.MapRect, rect).to(rect_1.EntityRect)), this.completeColor);
        }
        if (entry.tempSel) {
            this.drawBoxArray(entry.tempSel.bb.map(rect => rect_1.Rect.new(rect_1.MapRect, rect).to(rect_1.EntityRect)), this.tempColor);
        }
        if (blitzkrieg.selectionMode == this.name) {
            let pos = new pos_1.EntityPoint(0, 0);
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY());
            const mpos = pos.to(pos_1.MapPoint);
            if (this.selectStep == 0) {
                pos_1.Point.floor(mpos);
                Vec2.maxC(pos, 0, 0);
                pos = mpos.to(pos_1.EntityPoint);
                this.drawBox({ x: pos.x, y: pos.y, width: tilesize, height: tilesize }, this.tempColor);
            }
            else if (this.selectStep == 1) {
                pos_1.Point.round(mpos);
                Vec2.maxC(pos, 0, 0);
                Vec2.sub(mpos, this.tempPos);
                pos = mpos.to(pos_1.EntityPoint);
                this.drawBox({ x: this.tempPos.x * tilesize, y: this.tempPos.y * tilesize, width: pos.x, height: pos.y }, this.tempColor);
            }
        }
    }
    toggleDrawing() {
        this.drawBoxes = !this.drawBoxes;
    }
    async save() {
        const saveObjects = [];
        for (let i = 0; i < this.jsonFiles.length; i++) {
            saveObjects.push({});
        }
        for (const mapName in this.selMap) {
            const selE = this.selMap[mapName];
            saveObjects[selE.fileIndex][mapName] = selE;
        }
        for (let i = 0; i < this.jsonFiles.length; i++) {
            const path = this.jsonFiles[i];
            if (path.includes('ccmod')) {
                continue;
            }
            try {
                let content = JSON.stringify(saveObjects[i]);
                if (blitzkrieg.debug.prettifySels) {
                    content = await blitzkrieg.prettifyJson(content);
                }
                fsutil_1.FsUtil.writeFileSync(path, content);
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    async load(index) {
        try {
            let path = this.jsonFiles[index];
            if (path.startsWith('assets/')) {
                path = path.substring('assets/'.length);
            }
            const obj = await (await fetch(path)).json();
            for (const mapName in obj) {
                const entry = obj[mapName];
                entry.sels = entry.sels.map(s => {
                    s.sizeRect = rect_1.Rect.new(rect_1.MapRect, s.sizeRect);
                    s.bb = s.bb.map(r => rect_1.Rect.new(rect_1.MapRect, r));
                    return s;
                });
                obj[mapName] = new SelectionMapEntry(entry.sels, index);
            }
            if (this.selMap) {
                this.selMap = { ...this.selMap, ...obj };
            }
        }
        catch (error) {
            /* file doesn't exist */
        }
    }
    async loadAll() {
        const promises = [];
        for (let i = 0; i < this.jsonFiles.length; i++) {
            promises.push(this.load(i));
        }
        return Promise.all(promises);
    }
    static getSelFromRect(rect, mapName, z) {
        const sel = { bb: [rect], mapName, sizeRect: rect };
        sel.data = {};
        const epos = pos_1.MapPoint.fromVec(rect).to(pos_1.EntityPoint);
        sel.data.startPos = {
            x: epos.x,
            y: epos.y,
            z,
        };
        sel.data.endPos = sel.data.startPos;
        return sel;
    }
    static setSelPos(sel, offset) {
        for (let i = 0; i < sel.bb.length; i++) {
            const rect = sel.bb[i];
            sel.bb[i].x = offset.x + sel.sizeRect.x - rect.x;
            sel.bb[i].y = offset.y + sel.sizeRect.y - rect.y;
        }
        if (sel.data.startPos) {
            const nsp = offset.to(pos_1.EntityPoint);
            Vec2.add(nsp, sel.sizeRect.to(rect_1.EntityRect));
            Vec2.sub(nsp, sel.data.startPos);
        }
        if (sel.data.endPos) {
            const nsp = offset.to(pos_1.EntityPoint);
            Vec2.add(nsp, sel.sizeRect.to(rect_1.EntityRect));
            Vec2.sub(nsp, sel.data.endPos);
        }
        Vec2.assign(sel.sizeRect, offset);
    }
}
exports.SelectionManager = SelectionManager;
