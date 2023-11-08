import { EntityRect, MapRect, Rect, bareRect, isVecInRect, isVecInRectArr, reduceRectArr } from 'cc-map-util/rect'
import { EntityPoint, MapPoint, Point } from 'cc-map-util/src/pos'
import { Stack, assert } from 'cc-map-util/util'
import { FsUtil } from './fsutil'
import { Util } from './util'
import { IChangeRecorder } from './change-record'

const tilesize: number = 16
const defaultDrawBoxes: boolean = false

export interface Selection {
    bb: MapRect[]
    mapName: string
    sizeRect: MapRect
    data: {
        recordLog?: any
        endPos?: Vec3 & { level: number }
        startPos?: Vec3 & { level: number }
    }
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
    tempPos!: MapPoint
    selIndexes: (number | undefined)[] = []
    recorder?: IChangeRecorder

    constructor(
        public name: string,
        public completeColor: string,
        public tempColor: string,
        public jsonFiles: string[],
    ) { }

    async newSelEvent(_: Selection): Promise<void> {}
    async walkInEvent(_: Selection): Promise<void> {}
    async walkOutEvent(_: Selection): Promise<void> {}
    async onNewMapEntryEvent(): Promise<void> {
        for (const sel of this.inSelStack.array) {
            this.walkOutEvent(sel)
        }
        this.inSelStack = new Stack()
        this.selIndexes = []
    }

    setFileIndex(index: number) {
        this.fileIndex = index
    }

    setMapEntry(map: string, entry: SelectionMapEntry) {
        this.selMap[map.replace(/\./g, '/')] = entry
    }

    getCurrentEntry(): SelectionMapEntry {
        return this.selMap[ig.game.mapName?.replace(/\./g, '/')]
    }

    async selectionCreatorBegin() {
        if (Util.waitingForPos) {
            Util.waitingForPos = false
            return
        }
        let setStep: boolean = true
        let entry = this.getCurrentEntry()
        if (! entry) {
            this.setMapEntry(ig.game.mapName, new SelectionMapEntry([], this.fileIndex))
            entry = this.getCurrentEntry()
        }
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
        entry.tempSel = { bb: [], mapName: ig.game.mapName.replace(/\./g, '/'), data: {} }
        if (setStep) {
            this.selectStep = 0
        }
        this.tempPos = new MapPoint(0, 0)
    }

    selectionCreatorDelete() {
        const pos: EntityPoint = new EntityPoint(0, 0)
        ig.system.getMapFromScreenPos(
            pos,
            sc.control.getMouseX(),
            sc.control.getMouseY()
        )
        const mpos: MapPoint = pos.to(MapPoint)

        let deletedAnything: boolean = false
        const entry = this.getCurrentEntry()
        entry.sels = entry.sels.filter(sel => {
            const ok: boolean = isVecInRectArr(mpos, sel.bb)
            if (ok) { deletedAnything = true }
            return ! ok
        })
        if (entry.tempSel) {
            entry.tempSel.bb = entry.tempSel.bb.filter(rect => {
                const ok: boolean = isVecInRect(mpos, rect)
                if (ok) { deletedAnything = true }
                return ! ok
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

        this.tempPos = new MapPoint(0, 0)
        this.selectStep = 0

        this.save()
    }

    selectionCreatorSelect() {
        if (this.selectStep == -1) { return }
        const pos: EntityPoint = new EntityPoint(0, 0)
        ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
        const mpos: MapPoint = pos.to(MapPoint)
        if (this.selectStep == 0) {
            Point.floor(mpos)
            Vec2.maxC(mpos, 0, 0)
            Vec2.assign(this.tempPos, mpos)
        } else if (this.selectStep == 1) {
            this.selectStep = -1
            Point.round(mpos)
            Vec2.maxC(mpos, 0, 0)
            Vec2.sub(mpos, this.tempPos) /* mpos is now size */

            if (mpos.x < 0) {
                this.tempPos.x += mpos.x
                mpos.x *= -1
            }
            if (mpos.y < 0) {
                this.tempPos.y += mpos.y
                mpos.y *= -1
            }
            const entry = this.getCurrentEntry()
            assert(entry.tempSel)
            entry.tempSel.bb.push(MapRect.fromTwoPoints(this.tempPos, mpos))
            this.selIndexes.push(undefined)
            this.tempPos = new MapPoint(0, 0)
        } else { throw new Error() }

        this.selectStep++
    }

    checkForEvents(pos: Vec2) {
        const mpos: MapPoint = EntityPoint.fromVec(pos).to(MapPoint)
        const entry = this.getCurrentEntry()
        if (entry) {
            for (let i = 0; i < entry.sels.length; i++) {
                this.checkSelForEvents(entry.sels[i], mpos, i)
            }
            if (entry.tempSel) {
                this.checkSelForEvents(entry.tempSel as Selection, mpos, entry.sels.length)
            }
        }
    }

    checkSelForEvents(sel: Selection, vec: MapPoint, i: number) {
        let isIn = isVecInRectArr(vec, sel.bb)
        
        /* trigger walk in and out events only once */
        if (isIn) {
            if (this.selIndexes[i] === undefined) {
                this.selIndexes[i] = i
                this.inSelStack.push(sel)
                this.walkInEvent(sel)
            }
        } else {
            if (this.selIndexes[i] !== undefined) {
                this.inSelStack.shift()
                this.walkOutEvent(sel)
            }
            this.selIndexes[i] = undefined
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
            this.drawBoxArray(sel.bb.map(rect => Rect.new(MapRect, rect).to(EntityRect)), this.completeColor)
        }

        if (entry.tempSel) {
            this.drawBoxArray(entry.tempSel.bb.map(rect => Rect.new(MapRect, rect).to(EntityRect)), this.tempColor)
        }
        if (blitzkrieg.selectionMode == this.name) {
            let pos: EntityPoint = new EntityPoint(0, 0)
            ig.system.getMapFromScreenPos(pos, sc.control.getMouseX(), sc.control.getMouseY())
            const mpos: MapPoint = pos.to(MapPoint)
            if (this.selectStep == 0) {
                Point.floor(mpos); Vec2.maxC(pos, 0, 0)
                pos = mpos.to(EntityPoint)
                this.drawBox({ x: pos.x, y: pos.y, width: tilesize, height: tilesize }, this.tempColor)
            } else if (this.selectStep == 1) {
                Point.round(mpos); Vec2.maxC(pos, 0, 0)
                Vec2.sub(mpos, this.tempPos)
                pos = mpos.to(EntityPoint)
                this.drawBox({ x: this.tempPos.x * tilesize, y: this.tempPos.y * tilesize, width: pos.x, height: pos.y }, this.tempColor)
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
                let content: string = JSON.stringify(saveObjects[i])
                if (blitzkrieg.debug.prettifySels) {
                    content = await blitzkrieg.prettifyJson(content)
                }
                FsUtil.writeFileSync(path, content)
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
                entry.sels = entry.sels.map(s => {
                    s.sizeRect = Rect.new(MapRect, s.sizeRect)
                    s.bb = s.bb.map(r => Rect.new(MapRect, r))
                    return s
                })
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
        return Promise.all(promises)
    }

    static getSelFromRect(rect: MapRect, mapName: string, z: number) {
        const sel: Selection = { bb: [ rect ], mapName, sizeRect: rect, data: {} }
        sel.data = {}
        const epos: EntityPoint = MapPoint.fromVec(rect).to(EntityPoint)
        sel.data.startPos = {
            x: epos.x,
            y: epos.y,
            z,
            level: 0,
        }
        sel.data.endPos = sel.data.startPos
        return sel
    }

    static setSelPos(sel: Selection, offset: MapPoint) {
        for (let i = 0; i < sel.bb.length; i++) {
            const rect: MapRect = sel.bb[i]
            sel.bb[i].x = offset.x + sel.sizeRect.x - rect.x
            sel.bb[i].y = offset.y + sel.sizeRect.y - rect.y
        }

        if (sel.data) {
            if (sel.data.startPos) {
                const nsp: EntityPoint = offset.to(EntityPoint)
                Vec2.add(nsp, sel.sizeRect.to(EntityRect))
                Vec2.sub(nsp, sel.data.startPos)
            }
            
            if (sel.data.endPos) {
                const nsp: EntityPoint = offset.to(EntityPoint)
                Vec2.add(nsp, sel.sizeRect.to(EntityRect))
                Vec2.sub(nsp, sel.data.endPos)
            }
        }

        Vec2.assign(sel.sizeRect, offset)
    }
}
