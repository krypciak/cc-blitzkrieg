import { Rect, bareRect, isVecInRect, isVecInRectArr, reduceRectArr } from 'cc-map-util/rect'
import { Point } from 'cc-map-util/src/pos'
import { Stack, assert } from 'cc-map-util/util'
import { FsUtil } from 'fsutil'

const tilesize: number = 16
const defaultDrawBoxes: boolean = true

export interface Selection {
    bb: bareRect[]
    mapName: string
    sizeRect: bareRect
}

export class SelectionMapEntry {
    constructor(
        public sels: Selection[],
        public fileIndex: number,
        public tempSel?: Omit<Selection, 'sizeRect'>,
    ) { }

    toJSON(): object {
        return { sels: this.sels }
    }
}

export class SelectionManager {
    selMap: Record<string, SelectionMapEntry> = {}
    inSelStack: Stack<Selection> = new Stack()
    drawBoxes: boolean = defaultDrawBoxes
    selectStep: number = -1
    fileIndex!: number
    tempPos!: Vec2
    selIndexes: number[] = [-1]

    constructor(
        public name: string,
        public completeColor: string,
        public tempColor: string,
        public jsonFiles: string[],
        public newSelEvent: ((sel: Selection) => Promise<void>) = async () => {},
        public walkInEvent: ((sel: Selection) => Promise<void>) = async () => {},
        public walkOutEvent: ((sel: Selection) => Promise<void>) = async () => {},
    ) { }

    setFileIndex(index: number) {
        this.fileIndex = index
    }

    setMapEntry(map: string, entry: SelectionMapEntry) {
        this.selMap[map] = entry
    }

    getCurrentEntry(): SelectionMapEntry {
        return this.selMap[ig.game.mapName?.replace(/\./g, '/')]
    }

    async selectionCreatorBegin() {
        /* waiting for pos */
        let setStep: boolean = true
        const entry = this.getCurrentEntry()
        if (! entry) { this.selMap[ig.game.mapName] = new SelectionMapEntry([], this.fileIndex) }
        if (entry.tempSel && entry.tempSel.bb.length > 0) {
            const obj = reduceRectArr(entry.tempSel.bb)
            const newSel: Selection = entry.tempSel as Selection
            newSel.bb = obj.rects
            newSel.sizeRect = obj.rectSize
            await this.newSelEvent(newSel)
            entry.sels.push(newSel)
            this.selectStep = -1
            setStep = false
            entry.tempSel = undefined
            this.save()
        }
        entry.tempSel = { bb: [], mapName: ig.game.mapName }
        if (setStep) {
            this.selectStep = 0
        }
        this.tempPos = Vec2.createC(0, 0)
    }

    selectionCreatorDelete() {
        let pos: Vec2 = Vec2.createC(0, 0)
        ig.system.getMapFromScreenPos(
            pos,
            sc.control.getMouseX(),
            sc.control.getMouseY()
        )

        let deletedAnything: boolean = false
        const entry = this.getCurrentEntry()
        entry.sels = entry.sels.filter(sel => {
            const ok: boolean = isVecInRectArr(pos, sel.bb)
            if (! ok) { deletedAnything = true }
            return ok
        })
        if (entry.tempSel) {
            entry.tempSel.bb = entry.tempSel.bb.filter(rect => {
                const ok: boolean = isVecInRect(pos, rect)
                if (! ok) { deletedAnything = true }
                return ok
            })
        }
        
        if (! deletedAnything) {
            this.selectionCreatorDeconstruct()
        }
        this.save()
    }

    selectionCreatorDeconstruct() {
        let sel = this.inSelStack.peek()
        if (! sel) { return }

        const entry = this.getCurrentEntry()
        entry.tempSel = ig.copy(sel)
        entry.sels.splice(entry.sels.indexOf(sel), 1)

        this.tempPos = Vec2.createC(0, 0)
        this.selectStep = 0

        this.save()
    }

    selectionCreatorSelect() {
        if (this.selectStep == -1) { return }
        const pos: Vec2 = Vec2.createC(0, 0)
        ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
        Vec2.divC(pos, tilesize); Point.floor(pos); Vec2.mulC(pos, tilesize)
        Vec2.maxC(pos, 0, 0)
        if (this.selectStep == 0) {
            Vec2.assign(this.tempPos, pos)
        } else if (this.selectStep == 1) {
            this.selectStep = -1
            Vec2.sub(pos, this.tempPos) /* pos is now size */

            if (pos.x < 0) {
                this.tempPos.x += pos.x
                pos.x *= -1
            }
            if (pos.y < 0) {
                this.tempPos.y += pos.y
                pos.y *= -1
            }
            const entry = this.getCurrentEntry()
            assert(entry.tempSel)
            entry.tempSel.bb.push(Rect.fromTwoPoints(this.tempPos as Point, pos as Point))
            this.selIndexes.push(-1)
            this.tempPos = Vec2.createC(0, 0)

            this.save()
        } else { throw new Error() }

        this.selectStep++
    }

    checkForEvents(pos: Vec2) {
        const entry = this.getCurrentEntry()
        if (entry) {
            for (let i = 0; i < entry.sels.length; i++) {
                this.checkSelForEvents(entry.sels[i], pos, i)
            }
            if (entry.tempSel) {
                this.checkSelForEvents(entry.tempSel as Selection, pos, entry.sels.length)
            }
        }
    }
    checkSelForEvents(sel: Selection, vec: Vec2, i: number) {
        let isIn = isVecInRectArr(vec, sel.bb)
        
        /* trigger walk in and out events only once */
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

    drawBox(rect: bareRect, color: string) {
        let pos = { x: 0, y: 0 }
        ig.system.getScreenFromMapPos(pos, rect.x, rect.y)
        let w = rect.width, h = rect.height
        if (blitzkrieg.debug.selectionOutlines) {
            w -= 2
            h -= 2
        }
        new ig.SimpleColor(color).draw(pos.x, pos.y, w, h)
    }

    drawBoxArray(rects: bareRect[], color: string) {
        for (const rect of rects) {
            this.drawBox(rect, color)
        }
    }

    drawSelections() {
        if (! this.drawBoxes || ! ig.perf.gui) { return }

        const entry = this.getCurrentEntry()
        if (! entry) { return }
        for (const sel of entry.sels) {
            this.drawBoxArray(sel.bb, this.completeColor)
        }

        if (entry.tempSel) {
            this.drawBoxArray(entry.tempSel.bb, this.tempColor)
        }
        if (blitzkrieg.selectionMode == this.name) {
            const pos: Vec2 = Vec2.createC(0, 0)
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            Vec2.divC(pos, tilesize); Point.floor(pos); Vec2.mulC(pos, tilesize)
            Vec2.maxC(pos, 0, 0)
            if (this.selectStep == 0) {
                this.drawBox({ x: pos.x, y: pos.y, width: tilesize, height: tilesize }, this.tempColor)
            } else if (this.selectStep == 1) {
                Vec2.sub(pos, this.tempPos)
                this.drawBox(Rect.fromTwoPoints(this.tempPos as Point, pos as Point), this.tempColor)
            }
        }
    }

    toggleDrawing() {
        this.drawBoxes = ! this.drawBoxes
    }

    async save() {
        const saveObjects: Record<string, SelectionMapEntry>[] = []
        for (let i = 0; i < this.jsonFiles.length; i++) {
            saveObjects.push({})
        }
        for (const mapName in this.selMap) {
            const selE: SelectionMapEntry = this.selMap[mapName]
            saveObjects[selE.fileIndex][mapName] = selE
        }
        for (let i = 0; i < this.jsonFiles.length; i++) {
            const path: string = this.jsonFiles[i]
            if (path.includes('ccmod')) { continue }
            try {
                FsUtil.writeFileSync(path, saveObjects[i])
            } catch (err) {
                console.log(err)
            }
        }
    }

    async load(index: number) {
        try {
            let path: string = this.jsonFiles[index]
            if (path.startsWith('assets/')) { 
                path = path.substring('assets/'.length)
            }
            const obj: Record<string, SelectionMapEntry> = await (await fetch(path)).json()
            for (const mapName in obj) {
                const entry: SelectionMapEntry = obj[mapName]
                obj[mapName] = new SelectionMapEntry(entry.sels, index)
            }
            if (this.selMap) {
                this.selMap = { ...this.selMap, ...obj }
            }
        } catch(error) {
            /* file doesn't exist */
        }
    }

    async loadAll() {
        const promises = []
        for (let i = 0; i < this.jsonFiles.length; i++) {
            promises.push(this.load(i))
        }
        Promise.all(promises)
    }

}
