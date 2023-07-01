import { Stack } from './util.js';

export class SelectionCopyManager {
    constructor() {
        this.fs = require('fs')
        this.path = require('path')


        this.xOffset = 150;
        this.yOffset = 180;
        this.copyCount = 0
        this._sels = new Stack()
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap["rhombus-dng.room-1-5"].sels[0])
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap["rhombus-dng.room-1-5"].sels[1])
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
        const nArr = Array(height)
        for (let i = 0; i < height; i++)
            nArr[i] = Array(width).fill(0)

        // make sure cords are within 0 - width or height
        x1 = Math.min(width, Math.max(x1, 0))
        y1 = Math.min(height, Math.max(y1, 0))
        x2 = Math.min(width, Math.max(x2, 0))
        y2 = Math.min(height, Math.max(y2, 0))

        if (x2 < x1 || y2 < y1)
            throw new Error("invalid createSubArray inputs");

        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                nArr[y - y1 + yTileOffset]
                    [x - x1 + xTileOffset] = arr[y][x]
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

    getMapObject(mapName) {
        let mapPath = mapName.toPath(ig.root + "data/maps/", ".json") + ig.getCacheSuffix()
        // if map is a mod path, turn it into a vaild path
        mapPath = ig.root + "assets/" + window.simplify.resources._applyAssetOverrides(mapPath)
        // read map from .json file
        let mapJson = this.fs.readFileSync(mapPath, 'utf8');
        let map = JSON.parse(mapJson);
        return map
    }
    
    mergeMapEntitiesFromSel(baseMap, selMap, sel, xOffset, yOffset) {
        if (baseMap.entities === undefined) {
            if (selMap.entities === undefined) {
                return []
            } 
            return selMap.entities
        }

        let entities = baseMap.entities
        let tilesize = 16
        let x1 = Math.floor(xOffset / tilesize) * 16
        let y1 = Math.floor(yOffset / tilesize) * 16

        let self = this
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
                    newEntity.x = x1 + xLostInFloor + x
                    newEntity.y = y1 + yLostInFloor + y
                
                    entities.push(newEntity)
                }
            })
        })
        return entities
    }

    mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset) {
        let self = this
        let width = baseMap.mapWidth
        let height = baseMap.mapHeight
        
        // get levels
        let levels = []
        if (baseMap.levels.length > selMap.levels.length) {
            levels = baseMap.levels
        } else {
            levels = selMap.levels
        }

        let tilesize = 16
        let xTileOffset = Math.floor(xOffset / tilesize)
        let yTileOffset = Math.floor(yOffset / tilesize)


        // get lightLayer
        // search for base light layer
        let lightLayer = null
        baseMap.layer.forEach(function(layer) {
            if (layer.type == "Light") { lightLayer = layer; }
        })

        // search for sel light layer
        let selLightLayer = null
        selMap.layer.forEach(function(layer) {
            if (layer.type == "Light") { selLightLayer = layer; }
        })
        if (selLightLayer !== null) {
            if (lightLayer === null) {
                let subArray = self.createSubArray(selLightLayer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                selLightLayer.data = subArray
                lightLayer = ig.copy(selLightLayer)
            } else {
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
            lightLayer.level = "light"
        }



        let collisionLayers = {}

        // get base collision layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                if (layer.type != "Collision") { return; }

                collisionLayers[layer.level] = layer
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
                let level = layer.level
                if (level in collisionLayers) {
                    // merge
                    let layer1 = collisionLayers[level]
                    self.fillArray(layer1.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                    let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                        xTileOffset, yTileOffset, width, height)
                    self.mergeArrays(layer1.data, subArray)
                } else {
                    let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                        xTileOffset, yTileOffset, width, height)

                    if (! self.isArrayEmpty(subArray)) {
                        layer.data = subArray
                        collisionLayers[level] = ig.copy(layer)
                    }
                }
            })
        })



        let tileLayers = {}
        // get base tile layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                let level = layer.level
                if (layer.type != "Background" || (typeof level === 'string' && level.startsWith("object"))) { return; }
                if (! (level in tileLayers)) {
                    tileLayers[level] = {}
                }
                let tilesetName = layer.tilesetName
                tileLayers[level][tilesetName] = layer
            })
        })
        // merge base layers with sel layers
        sel.bb.forEach(function(rect) {
            let x1 = Math.floor(rect.x / tilesize);         let y1 = Math.floor(rect.y / tilesize);
            let x2 = x1 + Math.ceil(rect.width / tilesize); let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach(function(layer) {
                let level = layer.level
                if (layer.type != "Background" || (typeof level === 'string' && level.startsWith("object"))) { return; }

                if (! (level in tileLayers)) {
                    tileLayers[level] = {}
                }
                let tilesetName = layer.tilesetName
                if (tilesetName in tileLayers[level])
                if (level in tileLayers) {
                    // merge
                    let layer1 = tileLayers[level][tilesetName]
                    self.fillArray(layer1.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                    let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                            xTileOffset, yTileOffset, width, height)
                    self.mergeArrays(layer1.data, subArray)
                } else {
                    let subArray = self.createSubArray(layer.data, x1, y1, x2, y2,
                            xTileOffset, yTileOffset, Math.floor(yOffset / tilesize), width, height)
                    if (! self.isArrayEmpty(subArray)) {
                        layer.data = subArray
                        tileLayers[level][tilesetName] = ig.copy(layer)
                    }
                }
            })
        })



        // handle special object layers
        let objectLayers = []
        // get base object layers
        sel.bb.forEach(function(rect) {
            baseMap.layer.forEach(function(layer) {
                let level = layer.level
                if (! (layer.type == "Background" && typeof level === 'string' && level.startsWith("object"))) { return; }

                objectLayers.push(layer)
            })
        })
        // merge base layers with sel layers
        sel.bb.forEach(function(rect) {
            let x1 = Math.floor(rect.x / tilesize);         let y1 = Math.floor(rect.y / tilesize);
            let x2 = x1 + Math.ceil(rect.width / tilesize); let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach(function(layer) {
                let level = layer.level
                if (! (layer.type == "Background" && typeof level === 'string' && level.startsWith("object"))) { return; }

                let subArray = self.createSubArray(layer.data, x1, y1, x2, y2, 
                    xTileOffset, yTileOffset, width, height)

                if (! self.isArrayEmpty(subArray)) {
                    layer.data = subArray
                    objectLayers.push(layer)
                }
            })
        })

        
        return {
            lightLayer: lightLayer,
            collisionLayers: collisionLayers,
            tileLayers: tileLayers,
            objectLayers: objectLayers,
            levels: levels,
            width: width,
            height: height
        }
    }


    copySelToMap(baseMapName, sel, xOffset, yOffset, newName) {
        let self = this

        let baseMap = this.getMapObject(baseMapName)
        let selMap = this.getMapObject(sel.map)
        
        let entities = this.mergeMapEntitiesFromSel(baseMap, selMap, sel, xOffset, yOffset)

        let obj = this.mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset)
        let lightLayer = obj.lightLayer
        let collisionLayers = obj.collisionLayers
        let tileLayers = obj.tileLayers
        let objectLayers = obj.objectLayers
        let levels = obj.levels

        let mapWidth = obj.width
        let mapHeight = obj.height

        let allLayers = []
        let id = 0
        Object.keys(tileLayers).forEach(function(key) { 
            let tilesetList = tileLayers[key]
            Object.keys(tilesetList).forEach(function(key1) { 
                let layer = tilesetList[key1]
                layer.id = id++; 
                allLayers.push(layer); 
            })
        })
        Object.keys(collisionLayers).forEach(function(key) { 
            let layer = collisionLayers[key]; 
            layer.id = id++; 
            allLayers.push(layer); 
        })
        objectLayers.forEach(function(layer) { 
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
            masterLevel: 0,
            attributes: { 
                saveMode: "", 
                bgm: "",
                cameraInBounds: false,
                "map-sounds": "",
                mapStyle: "rhombus-puzzle",
                weather: "RHOMBUS_DUNGEON",
                area: "rhombus-dng" 
            },
            // ?????????????
            screen: { x: 0, y: 0 },
            entities: entities,
            layer: allLayers
        }
        console.log(map)
        return map
    }
    

    copy() {
        ig.blitzkrieg.msg("blitzkrieg", "copy", 1)
        
        let sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()
        if (sel == null) {
            if (this._sels.length() > 0) {
                sel = this._sels.pop()
            } else {
                return;
            }
        }

        
        let baseMapName = "rouge.room-2"
        if (this.copyCount++ == 0) {
            baseMapName = "rouge.room-1"
        }

        let newNameShort = "room-2"
        let newName = "rouge." + newNameShort
        let newMap = this.copySelToMap(baseMapName, sel, this.xOffset, this.yOffset, newName)

        let newMapPath = "./assets/mods/cc-rouge/assets/data/maps/rouge/" + newNameShort + ".json"
        
        this.xOffset += sel.bb[0].width + 20
        // save new map to file
        const newMapJson = JSON.stringify(newMap);
        this.fs.writeFileSync(newMapPath, newMapJson)
    }


    createMapFromBase(base, name, aLevels, aEntities, aLayers) {
        let map = ig.copy(base)
        map["name"] = name
        // map["mapWidth"] = width 
        // map["mapHeight"] = height 
        // map["masterLevel"] = masterLevel
        
        if (! ("levels" in map))
            map["levels"] = []
        // not sure what to do with levels

        if (! ("entities" in map))
            map["entities"] = []
        map.entities = [...map.entities, ...aEntities]

        if (! ("layer" in map))
            map["layer"] = []
        map.layer = [...map.layer, ...aLayers]

        return map
    }

}
