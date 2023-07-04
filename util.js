import { Selection } from './selection.js';

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
    static executeRecursiveAction(obj, action, args) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                action(key, obj, args);
                this.executeRecursiveAction(obj[key], action, args);
            } else {
                action(key, obj, args);
            }
        }
    }

    static emptyArray2d(width, height) {
        let arr = []
        for (let y = 0; y < height; y++) {
            arr[y] = []
            for (let x = 0; x < width; x++) {
                arr[y][x] = 0
            }
        }
        return arr
    }

    static fillArray2d(arr, value, x1, y1, x2, y2) {
        let iteX = Math.min(x2, arr[0].length)
        let iteY = Math.min(y2, arr.length)

        for (let y = y1; y < iteY; y++) {
            for (let x = x1; x < iteX; x++) {
                arr[y][x] = value
            }
        }
    }

    static mergeArrays2d(arr1, arr2) {
        for (let y = 0; y < Math.min(arr1.length, arr2.length); y++) {
            for (let x = 0; x < Math.min(arr1[y].length, arr2[0].length); x++) {
                let val = arr2[y][x]
                if (val != 0) {
                    arr1[y][x] = val
                }
            }
        }
    }

    static createSubArray2d(arr, x1, y1, x2, y2, xTileOffset, yTileOffset, width, height) {
        let nArr = Util.emptyArray2d(width, height)

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

    static isArrayEmpty2d(arr) {
        for (let y = 0; y < arr.length; y++) {
            for (let x = 0; x < arr[y].length; x++) {
                if (arr[y][x] != 0)
                    return false
            }
        }
        return true
    }

    static generateUniqueID() {
        let tmp1 = Math.random()*1000 * Math.random()*1000
        let tmp2 = Date.now()
        return Math.floor((tmp1 * tmp2) % 100000000).toString()
    }

    static async getMapObject(mapName) {
        let mapPath = mapName.toPath(ig.root + "data/maps/", ".json") + ig.getCacheSuffix()

        return new Promise((resolve, reject) => {
            $.ajax({
                url: ig.getFilePath(mapPath),
                dataType: "json",
                success: function(response) {
                    resolve(response);
                },
                error: function (b, c, e) {
                    ig.system.error(Error("Loading of Map '" + a +
                        "' failed: " + b + " / " + c + " / " + e))
                },
            });
        });
    }

    static async getEntieMapSel(mapName) {
        let mapData = await getMapObject(mapname)
        let sel = new Selection(mapName)
        sel.bb.push(new Rectangle(0, 0, mapData.width, mapData.height))
        sel.playerZ = 0
        return sel
    }

    static getFilesInDir(folderPath, filePaths = []) {
        let fs = require('fs')
        let path = require('path')
        let files = fs.readdirSync(folderPath);

        files.forEach((file) => {
            let filePath = path.join(folderPath, file);
            let stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                getAllFilePaths(filePath, filePaths);
            } else {
                filePaths.push(filePath); // Add file path to the array
            }
        });

        return filePaths;
    }
}
