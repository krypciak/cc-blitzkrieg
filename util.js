import { Selection } from './selection.js';
const fs = require("fs")
const path = require("path")

export class Rectangle {
    constructor(x, y, width, height) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.height = Math.floor(height);
        this.width = Math.floor(width);
    }
}

export class Stack {
  constructor() { this.items = []; }
  push(element) { this.items.push(element); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  shift() { return this.items.shift(); }
  length() { return this.items.length; }
}

export class Util {
    executeRecursiveAction(obj, action, args) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                action(key, obj, args);
                this.executeRecursiveAction(obj[key], action, args);
            } else {
                action(key, obj, args);
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
            throw new Error("invalid createSubArray inputs");
        
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                let nArrX = x - x1 + xTileOffset
                let nArrY = y - y1 + yTileOffset
                nArr[nArrY][nArrX] = arr[y][x]
            }
        }
        return nArr;
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

    generateUniqueID() {
        let tmp1 = Math.random()*1000 * Math.random()*1000
        let tmp2 = Date.now()
        return Math.floor((tmp1 * tmp2) % 100000000).toString()
    }

    async getMapObjectByPath(mapPath) {
        if (mapPath.startsWith("assets/")) {
            mapPath = mapPath.replace("assets/", "")
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                url: mapPath,
                dataType: "json",
                success: function(response) {
                    resolve(response);
                },
                error: function (b, c, e) {
                    ig.system.error(Error("Loading of Map '" + mapPath +
                        "' failed: " + b + " / " + c + " / " + e))
                },
            });
        });
    }

    async getMapObject(mapName) {
        let mapPath = ig.getFilePath(mapName.toPath(ig.root + "data/maps/", ".json") + ig.getCacheSuffix())
        return ig.blitzkrieg.util.getMapObjectByPath(mapPath)
    }

    async loadAllMaps() {
        if (ig.blitzkrieg.allMaps) {
            return
        }
        let filePaths = []
        let paths = [
            "./assets/data/maps/",
            "./assets/extension/post-game/data/maps/",
            "./assets/extension/fish-gear/data/maps/",
            "./assets/extension/flying-hedgehag/data/maps/",
            "./assets/extension/scorpion-robo/data/maps/",
            "./assets/extension/snowman-tank/data/maps/",
        ]
        for (let path of paths) {
            // remove leading /
            path = path.replace(/\/$/, '');
            if (ig.blitzkrieg.util.dirExists(path)) {
                filePaths = ig.blitzkrieg.util.getFilesInDir(path, filePaths)
            }
        }
        
        
        let maps = {}
        let promises = filePaths.map(function(path) {
            return new Promise(async (resolve, reject) => {
                let mapData = await ig.blitzkrieg.util.getMapObjectByPath(path)
                let mapName = mapData.name.split("/").join(".")
                let obj = {}
                obj[mapName] = mapData
                resolve(obj)
            })
        })
        let objArr = await Promise.all(promises)

        ig.blitzkrieg.allMaps = objArr.reduce((result, currObj) => {
            return { ...result, ...currObj };
        }, {});
        console.log(ig.blitzkrieg.allMaps)
    }

    getEntireMapSel(mapData) {
        let sel = new Selection(mapData.name)
        sel.bb.push(new Rectangle(0, 0, mapData.mapWidth*16, mapData.mapHeight*16))
        sel.playerZ = mapData.levels[mapData.masterLevel].height
        return sel
    }

    getSelectionSize(sel) {
        if (sel.bb.length == 0)
            return { width: 0, height: 0 }
        let minX = 100000
        let minY = 100000
        sel.bb.forEach(function(rect) {
            if (rect.x < minX) { minX = rect.x; }
            if (rect.y < minY) { minY = rect.y; }
        })
        let maxWidth = 0
        let maxHeight = 0
        sel.bb.forEach(function(rect) {
            maxWidth = Math.max(maxWidth, minX - rect.x + rect.width)
            maxHeight = Math.max(maxHeight, minY - rect.y + rect.height)
        })
        return {
            width: maxWidth,
            height: maxHeight,
        }
    }

    dirExists(path) {
        try {
            fs.statSync(path).isFile()
            return true;
        } catch (err) {
            return false;
        }
    }

    getFilesInDir(folderPath, filePaths = []) {
        let files = fs.readdirSync(folderPath);

        files.forEach((file) => {
            let filePath = path.join(folderPath, file);
            let stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                ig.blitzkrieg.util.getFilesInDir(filePath, filePaths);
            } else {
                filePaths.push(filePath); // Add file path to the array
            }
        });

        return filePaths;
    }
}
