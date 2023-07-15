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
        tilesize = ig.blitzkrieg.tilesize
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
        let nArr = ig.blitzkrieg.util.emptyArray2d(width, height)

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

    setToClosestRectSide(pos, rect) {
        function distanceToLine(pointX, pointY, lineX1, lineY1, lineX2, lineY2) {
            let A = lineY2 - lineY1
            let B = lineX1 - lineX2
            let C = lineX2 * lineY1 - lineX1 * lineY2
        
            let distance = Math.abs((A * pointX + B * pointY + C) / Math.sqrt(A * A + B * B))
            return distance
        }
        let { x, y } = pos
        let { x: x1, y: y1, width, height } = rect
        
        let x2 = x1 + width
        let y2 = y1 + height

        let distances = [
            distanceToLine(x, y, x1, y1, x2, y1),
            distanceToLine(x, y, x2, y1, x2, y2),
            distanceToLine(x, y, x1, y2, x2, y2),
            distanceToLine(x, y, x1, y1, x1, y2),
        ]
        let minDistance = Math.min(...distances)
        let closestSideIndex = distances.indexOf(minDistance)
        switch (closestSideIndex) {
        case 0: pos.y = y1; break // Top side
        case 1: pos.x = x2; break // Right side
        case 2: pos.y = y2; break // Bottom side
        case 3: pos.x = x1; break // Left side
        }
        return { distance: minDistance, side: closestSideIndex }
    }

    setToClosestSelSide(pos, sel) {
        let minDist = 100000
        let minSide
        let minPos
        for (let rect of sel.bb) {
            let posCopy = ig.copy(pos)
            let { distance, side } = this.setToClosestRectSide(posCopy, rect)
            if (distance < minDist) {
                minDist = distance
                minSide = side
                minPos = ig.copy(posCopy)
            }
        }
        pos.x = minPos.x
        pos.y = minPos.y
        return minSide
    }


    reduceRectArr(rects) {
        let minX = 10000
        let minY = 10000
        let maxWidth = -1
        let maxHeight = -1
        for (let rect of rects) {
            if (rect.x < minX) { minX = rect.x }
            if (rect.y < minY) { minY = rect.y }
            let width = rect.x + rect.width
            if (width > maxWidth) { maxWidth = width }
            let height = rect.y + rect.height
            if (height > maxHeight) { maxHeight = height }
        }

        maxWidth = Math.floor(maxWidth/tilesize)
        maxHeight = Math.floor(maxHeight/tilesize)
        minX = Math.floor(minX/tilesize)
        minY = Math.floor(minY/tilesize)
        let width = maxWidth - minX
        let height = maxHeight - minY

        let map = ig.blitzkrieg.util.emptyArray2d(width, height)

        for (let rect of rects) {
            let x1 = Math.floor(rect.x/tilesize)-minX
            let y1 = Math.floor(rect.y/tilesize)-minY
            let x2 = Math.floor(rect.width/tilesize)+x1
            let y2 = Math.floor(rect.height/tilesize)+y1
            for (let y = y1; y < y2; y++) {
                for (let x = x1; x < x2; x++) {
                    map[y][x] = 1
                }
            }
        }

        let newRects = []

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x] == 1) {
                    let maxX = x
                    for (let x1 = x; x1 < width; x1++) {
                        if (map[y][x1] == 0) { break }
                        maxX = x1
                        map[y][x1] = 0
                    }

                    maxX += 1

                    let maxY = y
                    for (let y1 = y+1; y1 < height; y1++) {
                        let ok = true
                        for (let x1 = x; x1 < maxX; x1++) {
                            if (map[y1][x1] == 0) {
                                ok = false
                                break
                            }
                        }
                        if (ok) {
                            maxY = y1
                        } else { break }
                    }

                    maxY += 1

                    for (let y1 = y; y1 < maxY; y1++) {
                        for (let x1 = x; x1 < maxX; x1++) {
                            map[y1][x1] = 0
                        }
                    }

                    newRects.push(new Rectangle((minX + x)*tilesize, (minY + y)*tilesize, (maxX-x)*tilesize, (maxY-y)*tilesize))
                }
            }
        }

        return {
            rects: newRects,
            size: new Rectangle(minX*tilesize, minY*tilesize, width*tilesize, height*tilesize)
        }
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

    async getMapObject(mapName) {
        let mapPath = ig.getFilePath(mapName.toPath(ig.root + 'data/maps/', '.json') + ig.getCacheSuffix())
        return ig.blitzkrieg.util.getMapObjectByPath(mapPath)
    }

    async loadAllMaps() {
        if (ig.blitzkrieg.allMaps) {
            return
        }
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
            if (ig.blitzkrieg.util.dirExists(path)) {
                filePaths = ig.blitzkrieg.util.getFilesInDir(path, filePaths)
            }
        }
        
        
        let promises = filePaths.map((path) => {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve) => {
                let mapData = await ig.blitzkrieg.util.getMapObjectByPath(path)
                let mapName = mapData.name.split('.').join('/')
                let obj = {}
                obj[mapName] = mapData
                resolve(obj)
            })
        })
        let objArr = await Promise.all(promises)

        ig.blitzkrieg.allMaps = objArr.reduce((result, currObj) => {
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
                ig.blitzkrieg.util.getFilesInDir(filePath, filePaths)
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
        ig.blitzkrieg.msg('blitzkrieg', 'Waiting for position key')
        return new Promise((resolve) => {
            ig.blitzkrieg.util.waitingForPos = true
            let intervalId = setInterval(function() {
                if (ig.blitzkrieg.util.waitingForPos == false) {
                    clearInterval(intervalId)
                    let pos = ig.copy(ig.game.playerEntity.coll.pos)
                    for (let i in ig.game.levels) {
                        if (ig.game.levels[i].height == pos.z) {
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

