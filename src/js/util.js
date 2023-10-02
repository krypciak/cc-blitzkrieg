import { Selection } from './selection.js'
const fs = require('fs')
const path = require('path')
let tilesize

export class Rectangle {
    constructor(x, y, width, height) {
        this.x = Math.floor(x)
        this.y = Math.floor(y)
        this.height = Math.floor(height)
        this.width = Math.floor(width)
    }
}

export class Stack {
    constructor() { this.items = [] }
    push(element) { this.items.push(element) }
    pop() { return this.items.pop() }
    peek() { return this.items[this.items.length - 1] }
    shift() { return this.items.shift() }
    length() { return this.items.length }
}

export class Util {
    constructor() {
        tilesize = blitzkrieg.tilesize
    }

    executeRecursiveAction(obj, action, args) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                action(key, obj, args)
                this.executeRecursiveAction(obj[key], action, args)
            } else {
                action(key, obj, args)
            }
        }
    }

    emptyArray2d(width, height) {
        let arr = []
        for (let y = 0; y < height; y++) {
            arr[y] = []
            for (let x = 0; x < width; x++) {
                arr[y][x] = 0
            }
        }
        return arr
    }

    fillArray2d(arr, value, x1, y1, x2, y2) {
        let iteX = Math.min(x2, arr[0].length)
        let iteY = Math.min(y2, arr.length)

        for (let y = y1; y < iteY; y++) {
            for (let x = x1; x < iteX; x++) {
                arr[y][x] = value
            }
        }
    }

    mergeArrays2d(arr1, arr2) {
        for (let y = 0; y < Math.min(arr1.length, arr2.length); y++) {
            for (let x = 0; x < Math.min(arr1[y].length, arr2[0].length); x++) {
                let val = arr2[y][x]
                if (val != 0) {
                    arr1[y][x] = val
                }
            }
        }
    }

    parseArrayAt2d(arr1, arr2, x1, y1) {
        for (let y = y1; y < y1 + arr2.length; y++) {
            for (let x = x1; x < x1 + arr2[y - y1].length; x++) {
                arr1[y][x] = arr2[y - y1][x - x1]
            }
        }
    }

    createSubArray2d(arr, x1, y1, x2, y2, xTileOffset, yTileOffset, width, height) {
        let nArr = blitzkrieg.util.emptyArray2d(width, height)

        let arrWidth = arr[0].length
        let arrHeight = arr.length
        // make sure cords are within 0 - width or height of arr
        x2 = Math.min(arrWidth, x2)
        y2 = Math.min(arrHeight, y2)

        // make sure cords are in bounds with baseMap
        let xTmp = (x2 - x1 + 1) - (width - xTileOffset)
        if (xTmp > 0) {
            x2 -= xTmp
        }
        let yTmp = (y2 - y1 + 1) - (height - yTileOffset)
        if (yTmp > 0) {
            y2 -= yTmp
        }

        x1 = Math.min(arrWidth, Math.max(x1, 0))
        y1 = Math.min(arrHeight, Math.max(y1, 0))
        x2 = Math.min(arrWidth, Math.max(x2, 0))
        y2 = Math.min(arrHeight, Math.max(y2, 0))
        
        if (x2 < x1 || y2 < y1)
            throw new Error('invalid createSubArray inputs')
        
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                let nArrX = x - x1 + xTileOffset
                let nArrY = y - y1 + yTileOffset
                nArr[nArrY][nArrX] = arr[y][x]
            }
        }
        return nArr
    }

    isArrayEmpty2d(arr) {
        for (let y = 0; y < arr.length; y++) {
            for (let x = 0; x < arr[y].length; x++) {
                if (arr[y][x] != 0)
                    return false
            }
        }
        return true
    }

    getTrimArrayPos2d(arr) {
        const origWidth = arr[0].length
        const origHeight = arr.length

        let x1
        for (let x = 0; x < origWidth; x++) {
            let empty = true
            for (let y = 0; y < origHeight; y++) {
                if (arr[y][x] != 0) { empty = false; break }
            }
            if (! empty) { x1 = x; break }
        }
        let y1
        for (let y = 0; y < origHeight; y++) {
            let empty = true
            for (let x = 0; x < origWidth; x++) {
                if (arr[y][x] != 0) { empty = false; break }
            }
            if (! empty) { y1 = y; break }
        }

        let x2
        for (let x = origWidth- 1; x >= 0; x--) {
            let empty = true
            for (let y = 0; y < origHeight; y++) {
                if (arr[y][x] != 0) { empty = false; break }
            }
            if (! empty) { x2 = x; break }
        }

        let y2
        for (let y = origHeight - 1; y >= 0; y--) {
            let empty = true
            for (let x = 0; x < origWidth; x++) {
                if (arr[y][x] != 0) { empty = false; break }
            }
            if (! empty) { y2 = y; break }
        }


        return { x1, y1, x2, y2 }
    }

    setSelPos(sel, xOffset, yOffset) {
        xOffset = Math.floor(xOffset/tilesize)*tilesize
        yOffset = Math.floor(yOffset/tilesize)*tilesize

        for (let i = 0; i < sel.bb.length; i++) {
            let { x, y } = blitzkrieg.selectionCopyManager.getOffsetEntityPos(sel.size, sel.bb[i], xOffset, yOffset, sel, false)
            sel.bb[i].x = x
            sel.bb[i].y = y
        }

        if (sel.data.startPos) {
            let { x, y } = blitzkrieg.selectionCopyManager.getOffsetEntityPos(sel.size, sel.data.startPos, xOffset, yOffset, sel)
            sel.data.startPos.x = x
            sel.data.startPos.y = y
        }
        
        if (sel.data.endPos) {
            let { x, y } = blitzkrieg.selectionCopyManager.getOffsetEntityPos(sel.size, sel.data.endPos, xOffset, yOffset, sel)
            sel.data.endPos.x = x
            sel.data.endPos.y = y
        }

        let { x, y } = blitzkrieg.selectionCopyManager.getOffsetEntityPos(sel.size, sel.size, xOffset, yOffset, sel, false)
        sel.size.x = x
        sel.size.y = y
    }

    generateUniqueID() {
        let tmp1 = Math.random()*1000 * Math.random()*1000
        let tmp2 = Date.now()
        return Math.floor((tmp1 * tmp2) % 100000000).toString()
    }

    async getMapObjectByPath(mapPath) {
        if (mapPath.startsWith('assets/')) {
            mapPath = mapPath.replace('assets/', '')
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                url: mapPath,
                dataType: 'json',
                success: function(response) {
                    resolve(response)
                },
                error: function (b, c, e) {
                    console.log(mapPath)
                    ig.system.error(Error('Loading of Map \'' + mapPath +
                        '\' failed: ' + b + ' / ' + c + ' / ' + e))
                    reject()
                },
            })
        })
    }

    async getMapObject(name, noCache = false) {
        if (! blitzkrieg.util.cachedMaps) { blitzkrieg.util.cachedMaps = {} }
        let mapEntry = blitzkrieg.util.cachedMaps[name]
        if (! noCache && mapEntry) { return mapEntry }
        let path = ig.getFilePath(name.toPath(ig.root + 'data/maps/', '.json') + ig.getCacheSuffix())
        let map = await blitzkrieg.util.getMapObjectByPath(path)
        blitzkrieg.util.cachedMaps[name] = map
        return map
    }

    async loadAllMaps() {
        if (blitzkrieg.util.loadedAllMaps) { return }
        let filePaths = []
        let paths = [
            './assets/data/maps/',
            './assets/extension/post-game/data/maps/',
            './assets/extension/fish-gear/data/maps/',
            './assets/extension/flying-hedgehag/data/maps/',
            './assets/extension/scorpion-robo/data/maps/',
            './assets/extension/snowman-tank/data/maps/',
        ]
        for (let path of paths) {
            // remove leading /
            path = path.replace(/\/$/, '')
            if (blitzkrieg.util.dirExists(path)) {
                filePaths = blitzkrieg.util.getFilesInDir(path, filePaths)
            }
        }
        
        if (blitzkrieg.util.cachedMaps && blitzkrieg.util.cachedMaps) {
            return
        }
        
        let promises = filePaths.map((path) => {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve) => {
                let mapData = await blitzkrieg.util.getMapObjectByPath(path)
                let mapName = mapData.name.split('.').join('/')
                let obj = {}
                obj[mapName] = mapData
                resolve(obj)
            })
        })
        let objArr = await Promise.all(promises)


        blitzkrieg.util.loadedAllMaps = true

        blitzkrieg.util.cachedMaps = objArr.reduce((result, currObj) => {
            return { ...result, ...currObj }
        }, {})
    }

    getEntireMapSel(mapData) {
        return this.getSelFromRect(new Rectangle(0, 0, mapData.mapWidth*16, mapData.mapHeight*16),
            mapData.name, mapData.levels[mapData.masterLevel].height)
    }

    getSelFromRect(rect, map, z) {
        let sel = new Selection(map)
        rect.x = Math.floor(rect.x / tilesize)*tilesize
        rect.y = Math.floor(rect.y / tilesize)*tilesize
        rect.width = Math.floor(rect.width / tilesize)*tilesize
        rect.height = Math.floor(rect.height / tilesize)*tilesize
        sel.bb.push(rect)
        sel.size = rect 
        sel.data = {}
        sel.data.startPos = {
            x: rect.x,
            y: rect.y,
            z,
        }
        sel.data.endPos = sel.data.startPos
        return sel
    }

    dirExists(path) {
        try {
            fs.statSync(path).isFile()
            return true
        } catch (err) {
            return false
        }
    }

    getFilesInDir(folderPath, filePaths = []) {
        let files = fs.readdirSync(folderPath)

        files.forEach((file) => {
            let filePath = path.join(folderPath, file)
            let stat = fs.statSync(filePath)

            if (stat.isDirectory()) {
                blitzkrieg.util.getFilesInDir(filePath, filePaths)
            } else {
                filePaths.push(filePath)
            }
        })

        return filePaths
    }

    spawnBarrier(x, y, z, width, height) {
        width = Math.floor(width/8)*8
        height = Math.floor(height/8)*8
        let barrierType = width == 8 ? 'barrierV' : 'barrierH'
        
        return ig.game.spawnEntity('ScalableProp', x, y, z, {
            name: '', 
            patternOffset: {x: 0, y: 0}, 
            blockNavMap: false, 
            propConfig: {ends: null, name: barrierType, sheet: 'dungeon-ar'},
            size: {x: width, y: height}}
        )
    }

    async syncDialog(text, buttons) {
        sc.BUTTON_TYPE.SMALL.valueOf = () => {
            return sc.BUTTON_TYPE.SMALL.height
        }
        return new Promise((resolve) => {
            let popup = new sc.ModalButtonInteract(text, null, buttons, (button) => {
                resolve(button.text)
            })
            ig.gui.addGuiElement(popup)
            popup.show()
        })
    }

    async waitForPositionKey() {
        blitzkrieg.msg('blitzkrieg', 'Waiting for position key')
        return new Promise((resolve) => {
            blitzkrieg.util.waitingForPos = true
            let intervalId = setInterval(function() {
                if (blitzkrieg.util.waitingForPos == false) {
                    clearInterval(intervalId)
                    let pos = ig.copy(ig.game.playerEntity.coll.pos)
                    for (let i in ig.game.levels) {
                        if (ig.game.levels[i].height + 5 >= pos.z &&
                            ig.game.levels[i].height - 5 <= pos.z) {
                            pos.level = i
                            break
                        }
                    }
                    if (! pos.level) {
                        throw new Error('level not found')
                    }
                    resolve(pos)
                }
            })

        })
    }

    seedrandom(min, max, seedObj) {
        let x = Math.sin(this.stringToDigitNumber(seedObj.seed, 16)) * 10000
        seedObj.seed += 1000
        let random = (x - Math.floor(x)) * (max - min) + min
        return Math.floor(random)
    }
    stringToDigitNumber(str, len) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i)
            hash |= 0
        }
        hash *= 370548503574
    
        return Math.abs(hash).toString().padStart(len, '0')
    }   
}

