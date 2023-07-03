import { Stack } from './util.js';

export class SelectionCopyManager {
    constructor() {
        this.fs = require('fs')
        this.path = require('path')


        this.xOffset = 256;
        this.yOffset = 256;
        // this.xOffset = 16;
        // this.yOffset = 16;
        this.copyCount = 0
        this._sels = new Stack()
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['final-dng.b4.bridge'].sels[0])
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['jungle.left.path-left-03'].sels[0])
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['autumn-fall.path-05'].sels[1])

    }

    executeRecursiveAction(obj, action, args) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                this.executeRecursiveAction(obj[key], action, args);
            } else {
                action(key, obj, args);
            }
        }
    }

    emptyArray(width, height) {
        let arr = []
        for (let y = 0; y < height; y++) {
            arr[y] = []
            for (let x = 0; x < width; x++) {
                arr[y][x] = 0
            }
        }
        return arr
    }

    fillArray(arr, value, x1, y1, x2, y2) {
        let iteX = Math.min(x2, arr[0].length)
        let iteY = Math.min(y2, arr.length)

        for (let y = y1; y < iteY; y++) {
            for (let x = x1; x < iteX; x++) {
                arr[y][x] = value
            }
        }
    }

    mergeArrays(arr1, arr2) {
        for (let y = 0; y < Math.min(arr1.length, arr2.length); y++) {
            for (let x = 0; x < Math.min(arr1[y].length, arr2[0].length); x++) {
                let val = arr2[y][x]
                if (val != 0) {
                    arr1[y][x] = val
                }
            }
        }
    }

    createSubArray(arr, x1, y1, x2, y2, xTileOffset, yTileOffset, width, height) {
        let nArr = this.emptyArray(width, height)

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

    isArrayEmpty(arr) {
        for (let y = 0; y < arr.length; y++) {
            for (let x = 0; x < arr[y].length; x++) {
                if (arr[y][x] != 0)
                    return false
            }
        }
        return true
    }

    async getMapObject(mapName) {
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

    mergeMapLevels(baseMap, selMap, sel) {
        let baseLevels = baseMap.levels
        let selLevels = ig.copy(selMap.levels)
        for (let i = 0; i < selLevels.length; i++) {
            selLevels[i].height -= sel.playerZ
        }

        let levelsCopy = []
        baseLevels.forEach(function(level) { levelsCopy.push(level.height); })
        selLevels.forEach(function(level) { levelsCopy.push(level.height); })
        let selLevelOffset = baseLevels.length

        // sort levels
        let levels = [...levelsCopy].sort((a, b) => a - b);
        // remove duplicates
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] == levels[i-1]) {
                levels.splice(i, 1)
                i--;
            }
        }
        let oldToNewLevelsMap = {}
        for (let i = 0; i < levelsCopy.length; i++) {
          oldToNewLevelsMap[i] = levels.indexOf(levelsCopy[i]);
        }
        let masterLevel = levels.indexOf(0)
        for (let i = 0; i < levels.length; i++) {
            levels[i] = { height: levels[i] }
        }
        
        return {
            levels: levels,
            selLevelOffset: selLevelOffset,
            oldToNewLevelsMap: oldToNewLevelsMap,
            masterLevel: masterLevel,
        }
    }


    changeEntityRecursive(key, obj, args) {
        switch (key) {
            case "level":
                if (typeof obj[key] === 'number') {
                    obj[key] = args.level
                }
                break
        }
    }

    mergeMapEntities(baseMap, selMap, sel, xOffset, yOffset,
        oldToNewLevelsMap, selLevelOffset) {
        
        let self = this

        if (baseMap.entities === undefined && selMap.entities === undefined) {
            return []
        }

        let entities = ig.copy(baseMap.entities)
        entities.forEach(function(entity) {
            let level = entity.level
            if (! (typeof level === 'number' || typeof level === 'string')) {
                level = entity.level.level
            }
            level = oldToNewLevelsMap[parseInt(level)]
            self.executeRecursiveAction(entity, self.changeEntityRecursive, {
                x: entity.x,
                y: entity.y,
                level: level
            })
        })
        let tilesize = 16
        let x1 = Math.floor(xOffset / tilesize) * 16
        let y1 = Math.floor(yOffset / tilesize) * 16

        sel.bb.forEach(function(rect) {
            selMap.entities.forEach(function(entity) {
                // check if entity is in rect bounds
                let x = entity.x - rect.x
                let y = entity.y - rect.y
                if (x >= 0 && x <= rect.width &&
                    y >= 0 && y <= rect.height) {
                    
                    let newEntity = ig.copy(entity)

                    let xLostInFloor= rect.x - Math.floor(rect.x / tilesize)*16;
                    let yLostInFloor = rect.y - Math.floor(rect.y / tilesize)*16;
                    x = x1 + xLostInFloor + x
                    y = y1 + yLostInFloor + y
                    // check if entity doesn't clip out of the base map
                    if (x < baseMap.mapWidth * tilesize && y < baseMap.mapHeight * tilesize) {
                        let level = entity.level
                        if (! (typeof level === 'number' || typeof level === 'string')) {
                            level = entity.level.level
                        }
                        level = oldToNewLevelsMap[parseInt(level) + selLevelOffset]
                        self.executeRecursiveAction(newEntity, self.changeEntityRecursive, {
                            x: x,
                            y: y,
                            level: level
                        })

                        newEntity.x = x
                        newEntity.y = y
                        entities.push(newEntity)
                    }
                }
            })
        })
        return entities
    }

    mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset, 
        oldToNewLevelsMap, selLevelOffset, levelsLength) {
        let self = this
        let width = baseMap.mapWidth
        let height = baseMap.mapHeight
        

        let tilesize = 16
        let xTileOffset = Math.floor(xOffset / tilesize)
        let yTileOffset = Math.floor(yOffset / tilesize)

        let emptyData = this.emptyArray(width, height)

        // get lightLayer
        // search for base light layer
        let lightLayer = null
        baseMap.layer.forEach(function(layer) {
            if (layer.type == "Light") { lightLayer = layer; }
        })
        if (lightLayer === null) {
            lightLayer = {
                type: "Light",
                name: "Light",
                visible: 1,
                tilesetName: "media/map/lightmap-tiles.png",
                repeat: false,
                lighter: false,
                distance: 1,
                yDistance: 0,
                tilesize: tilesize,
                moveSpeed: { x: 0, y: 0 },
                data: ig.copy(emptyData),
            }
        }

        // search for sel light layer
        let selLightLayer = null
        selMap.layer.forEach(function(layer) {
            if (layer.type == "Light") { selLightLayer = layer; }
        })
        if (selLightLayer !== null) {
            // merge base light layer with selection light
            sel.bb.forEach(function(rect) {
                let x1 = Math.floor(rect.x / tilesize);
                let y1 = Math.floor(rect.y / tilesize);
                let x2 = x1 + Math.ceil(rect.width / tilesize);
                let y2 = y1 + Math.ceil(rect.height / tilesize)
                self.fillArray(lightLayer.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                let subArray = self.createSubArray(selLightLayer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                self.mergeArrays(lightLayer.data, subArray)
            })
        }
        lightLayer.width = width
        lightLayer.height = height 
        // maybe "light" insted of "last"?
        lightLayer.level = "last"
        



        let collisionLayers = []
        for (let i = 0; i < levelsLength; i++) {
            collisionLayers[i] = {
                type: "Collision",
                name: "Collision",
                level: i,
                width: width,
                height: height,
                visible: 1,
                tilesetName: "media/map/collisiontiles-16x16.png",
                repeat: false,
                distance: 1,
                yDistance: 0,
                tilesize: tilesize,
                moveSpeed: { x: 0, y: 0 },
                data: ig.copy(emptyData),
            }
        }

        // get base collision layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                if (layer.type != "Collision") { return; }
                let level = oldToNewLevelsMap[parseInt(layer.level)]
                layer = ig.copy(layer)
                layer.level = level
                collisionLayers[level] = layer
            })
        })
        // merge collision layers with sel layers
        sel.bb.forEach(function(rect) {
            let x1 = Math.floor(rect.x / tilesize);
            let y1 = Math.floor(rect.y / tilesize);
            let x2 = x1 + Math.ceil(rect.width / tilesize);
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach(function(layer) {
                if (layer.type != "Collision") { return; }
                let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]
                let layer1 = collisionLayers[level]
                // self.fillArray(layer1.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                self.mergeArrays(layer1.data, subArray)
            })
        })

        let tileLayers = []
        let tileLayersClear = []
        // get base tile layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                if (layer.type != "Background" || (typeof layer.level === 'string' &&
                    layer.level.startsWith("object"))) { return; }
                let level = oldToNewLevelsMap[parseInt(layer.level)]
                if (! (level in tileLayers)) {
                    tileLayers[level] = []
                }
                layer = ig.copy(layer)
                layer.level = level
                layer.isBase = true
                tileLayersClear[level] = true
                tileLayers[level].push(layer)
            })
        })
        // merge base layers with sel layers
        sel.bb.forEach(function(rect) {
            let x1 = Math.floor(rect.x / tilesize);
            let y1 = Math.floor(rect.y / tilesize);
            let x2 = x1 + Math.ceil(rect.width / tilesize);
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach(function(layer) {
                if (layer.type != "Background" || (typeof layer.level === 'string' && 
                    layer.level.startsWith("object"))) { return; }
                let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]
                // console.log("old level: " + layer.level + "new level: " + level +", type: " + layer.type + ", name: " + layer.name)

                if (! (level in tileLayers)) {
                    tileLayers[level] = []
                }
                if (tileLayersClear[level]) {
                    tileLayers[level].forEach(function(layer1) { 
                        if (layer1.isBase) {
                            self.fillArray(layer1.data, 0, xTileOffset, yTileOffset,
                                xTileOffset + rect.width/tilesize,
                                yTileOffset + rect.height/tilesize)
                        }
                    })
                }
                let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                        xTileOffset, yTileOffset, width, height)
                if (! self.isArrayEmpty(subArray)) {
                    let layer1 = layer
                    layer1.data = subArray
                    layer1.width = width
                    layer1.height = height 
                    layer1.level = level
                    tileLayers[level].push(layer1)
                }
            })
        })


        // handle special object layers
        let objectLayers = []
        // get base object layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                let level = layer.level
                if (! (layer.type == "Background" && typeof level === 'string' &&
                    level.startsWith("object"))) { return; }

                objectLayers.push(layer)
            })
        })
        // merge base layers with sel layers
        sel.bb.forEach(function(rect) {
            let x1 = Math.floor(rect.x / tilesize);         
            let y1 = Math.floor(rect.y / tilesize);
            let x2 = x1 + Math.ceil(rect.width / tilesize);
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach(function(layer) {
                let level = layer.level
                if (! (layer.type == "Background" && typeof level === 'string' &&
                    level.startsWith("object"))) { return; }

                let subArray = self.createSubArray(layer.data, x1, y1, x2, y2, 
                    xTileOffset, yTileOffset, width, height)

                if (! self.isArrayEmpty(subArray)) {
                    let layer1 = layer
                    layer1.data = subArray
                    layer1.width = width
                    layer1.height = height 
                    objectLayers.push(layer1)
                }
            })
        })

        
        return {
            lightLayer: lightLayer,
            collisionLayers: collisionLayers,
            tileLayers: tileLayers,
            objectLayers: objectLayers,
            width: width,
            height: height,
        }
    }


    async copySelToMap(baseMapName, sel, xOffset, yOffset, newName) {
        let self = this

        let baseMap = await this.getMapObject(baseMapName)
        let selMap = await this.getMapObject(sel.map)
        
        let obj1 = this.mergeMapLevels(baseMap, selMap, sel)
        let levels = obj1.levels
        let oldToNewLevelsMap = obj1.oldToNewLevelsMap
        let selLevelOffset = obj1.selLevelOffset
        let masterLevel = obj1.masterLevel


        let obj2 = this.mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset,
            oldToNewLevelsMap, selLevelOffset, levels.length)
        let lightLayer = obj2.lightLayer
        let collisionLayers = obj2.collisionLayers
        let tileLayers = obj2.tileLayers
        let objectLayers = obj2.objectLayers
        let mapWidth = obj2.width
        let mapHeight = obj2.height

        let entities = this.mergeMapEntities(baseMap, selMap, sel, xOffset, yOffset,
            oldToNewLevelsMap, selLevelOffset)


        let allLayers = []
        let id = 0
        tileLayers.forEach(function(levelLayers) { 
            levelLayers.forEach(function(layer) {
                layer.id = id++; 
                allLayers.push(layer); 
            })
        })
        collisionLayers.forEach(function(layer) { 
            layer.id = id++; 
            allLayers.push(layer); 
        })
        objectLayers.forEach(function(layer) { 
            layer = layer
            layer.id = id++; 
            allLayers.push(layer); 
        })
        if (lightLayer !== null) {
            lightLayer.id = id++
            allLayers.push(lightLayer)
        }

        let map = {
            name: newName,
            levels: levels,
            mapWidth: mapWidth,
            mapHeight: mapHeight,
            masterLevel: masterLevel,
            attributes: { 
                saveMode: "ENABLED", 
                bgm: "",
                cameraInBounds: false,
                "map-sounds": "",
                mapStyle: "rhombus-puzzle",
                weather: "AUTUMN",
                area: "rhombus-dng" 
            },
            // screen is not used? setting just to be safe
            screen: { x: 0, y: 0 },
            entities: entities,
            layer: allLayers
        }
        return map
    }

    async copySelToMapAndWrite(baseMapName, sel, xOffset, yOffset, newName, newNameShort) {
        ig.blitzkrieg.msg("blitzkrieg", "Copying map data", 5)
        ig.blitzkrieg.msg("blitzkrieg", "base: " + baseMapName, 5)
        ig.blitzkrieg.msg("blitzkrieg", "sel: " + sel.map, 5)
        ig.blitzkrieg.msg("blitzkrieg", "new map: " + newName, 5)

        let newMap = await this.copySelToMap(baseMapName, sel, xOffset, yOffset, newName)

        let newMapPath = "./assets/mods/cc-rouge/assets/data/maps/rouge/" + newNameShort + ".json"
        
        this.xOffset += sel.bb[0].width + 32
        // save new map to file
        let newMapJson = JSON.stringify(newMap);
        this.fs.writeFile(newMapPath, newMapJson, (err) => {
            if(err) {
                console.error(err)
                return
            }
        })
    }
    

    copy() {
        let sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()
        // let sel = null
        if (sel == null) {
            if (this._sels.length() > 0) {
                sel = this._sels.pop()
            } else {
                return;
            }
        }
        //let newNameShort = "room-2"
        //let baseMapName = "rouge." + newNameShort
        //if (this.copyCount++ == 0) {
        //    baseMapName = "rouge.room-1"
        //}
        
        // let newNameShort = "10emptytmp"
        // let baseMapName = "rouge." + newNameShort
        // if (this.copyCount++ == 0) {
        //     baseMapName = "rouge.10empty"
        // }
        let newNameShort = "300emptytmp"
        let baseMapName = "rouge." + newNameShort
        if (this.copyCount++ == 0) {
            baseMapName = "rouge.300empty"
        }

        let newName = "rouge." + newNameShort

        this.copySelToMapAndWrite(baseMapName, sel, this.xOffset, this.yOffset, newName, newNameShort)
    }
}
