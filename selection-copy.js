import { Stack } from './util.js'
const fs = require('fs')

export class SelectionCopyManager {
    constructor() {
        this.unsupportedMaps = new Set([
            'autumn-fall.raid.raid-01',
            'bergen.bergen2',
            'bergen-trail.path-6-1',
            'cargo-ship.boss',
            'cargo-ship.bridge-floor',
            'cargo-ship.bridge',
            'cargo-ship.cabins1',
            'cargo-ship.cabins2',
            'cargo-ship.christmas',
            'cargo-ship.ground',
            'cargo-ship.ship',
            'cliff-mod',
            'jungle-city.center',
            'rhombus-sqr.central',
            'rookie-harbor.inner-tala',
            'rookie-harbor.special.quest-ocean-1',
            'rookie-harbor.special.quest-ocean-2a',
            'rookie-harbor.special.quest-ocean-2b-boss',
            'arena.faction-dlc.fight2-ocean',
        ])

        this.xOffset = 128
        this.yOffset = 128
        // this.xOffset = 16
        // this.yOffset = 16
        this.copyCount = 0
        this._sels = new Stack()
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[0])
        this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[1])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])

        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['final-dng.b4.bridge'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['jungle.left.path-left-03'].sels[0])
        // this._sels.push(ig.blitzkrieg.util.['autumn-fall.path-05'].sels[1])
    }

    mergeMapLevels(baseMap, selMap) {
        let baseLevels = baseMap.levels
        let selLevels = ig.copy(selMap.levels)

        // let baseMasterHeight = baseLevels[baseMap.masterLevel].height
        // let selMasterHeight = selLevels[selMap.masterLevel].height
        // let heightDiff = baseMasterHeight - selMasterHeight

        // for (let i = 0; i < baseLevels.length; i++) {
        //     baseLevels[i].height -= heightDiff
        // }

        let levelsCopy = []
        baseLevels.forEach((level) => { levelsCopy.push(level.height) })
        selLevels.forEach((level) => { levelsCopy.push(level.height) })
        let selLevelOffset = baseLevels.length

        // sort levels
        let levels = [...levelsCopy].sort((a, b) => a - b)
        // remove duplicates
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] == levels[i-1]) {
                levels.splice(i, 1)
                i--
            }
        }

        let oldToNewLevelsMap = {}
        for (let i = 0; i < levelsCopy.length; i++) {
            oldToNewLevelsMap[i] = levels.indexOf(levelsCopy[i])
        }
        let masterLevel = levels.indexOf(0)
        for (let i = 0; i < levels.length; i++) {
            levels[i] = { height: levels[i] }
        }
        
        return {
            levels,
            selLevelOffset,
            oldToNewLevelsMap,
            masterLevel,
        }
    }

    getUniqueConditionVariables(str) {
        let keywordList = [
            // List of JavaScript keywords and reserved words
            'abstract', 'arguments', 'await', 'boolean', 'break', 'byte',
            'case', 'catch', 'char', 'class', 'const', 'continue',
            'debugger', 'default', 'delete', 'do', 'double', 'else',
            'enum', 'eval', 'export', 'extends', 'false', 'final',
            'finally','float', 'for', 'function', 'goto', 'if', 'implements',
            'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long',
            'native', 'new', 'null', 'package', 'private', 'protected',
            'public', 'return', 'short', 'static', 'super', 'switch',
            'synchronized', 'this', 'throw', 'throws', 'transient',
            'true', 'try', 'typeof', 'undefined', 'var', 'void',
            'volatile', 'while', 'with', 'yield',
        ]
        let regex = /[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*/g
        let matches = str.match(regex)
        let condVars = [...new Set(matches)].filter(name => 
            !keywordList.includes(name) && 
            (name.startsWith('map') || name.startsWith('tmp')))

        return condVars
    }

    getOffsetEntityPos(rect, entity, xOffset, yOffset) {
        let tilesize = 16
        return {
            x: Math.floor(xOffset/tilesize)*16 - Math.floor(rect.x/tilesize)*16 + entity.x,
            y: Math.floor(yOffset/tilesize)*16 - Math.floor(rect.y/tilesize)*16 + entity.y
        }
    }

    changeEntityRecursive(key, obj, args) {
        let value = obj[key]

        let self = args.self
        switch (key) {
        case 'level': {
            if (typeof value === 'number') {
                let oldLevel = parseInt(value)
                let newLevel = args.oldToNewLevelsMap[oldLevel + (args.isSel ? args.selLevelOffset : 0)]

                obj.level = newLevel
            }
            return
        }
        case 'newPos': {
            if ('lvl' in value) {
                let oldLevel = parseInt(value.lvl)
                let newLevel = args.oldToNewLevelsMap[oldLevel + (args.isSel ? args.selLevelOffset : 0)]
                obj.newPos.lvl = newLevel
            }

            // newPos also adjusted later
            break
        }
        }

        if (args.makePuzzlesUnique) {
            switch (key) {
            // make puzzles unique
            // replace condition variables
            case 'condition':
            case 'endCondition':
            case 'startCondition':
            case 'hideCondition':
            case 'pauseCondition':
            case 'blockEventCondition': {
                if (value === null ||
                    typeof value === 'boolean' ||
                    (typeof value === 'string' && value.trim().length == 0)) {
                    return
                }
                let vars = self.getUniqueConditionVariables(value)
                for (let varName of vars) {
                    value = value.replace(varName, varName + '_' + self.uniqueId)
                }
                obj[key] = value
                return
            }

            // case 'layer':
            case 'group':
            case 'variable': {
                if (value === null ||
                    typeof value === 'boolean' ||
                    (typeof value === 'string' && value.trim().length == 0)) {
                    return
                }
                obj[key] = value + '_' + self.uniqueId

                return
            }
            }
        }

        if (args.rePosition) {
            switch (key) {
            case 'newPos': {
                if ('x' in value && 'y' in value) {
                    let { x, y } = self.getOffsetEntityPos(args.rect, obj.newPos, args.xOffset, args.yOffset)
                    obj.newPos.x = x
                    obj.newPos.y = y
                }
                return
            }
            case 'targetPoint': {
                let { x, y } = self.getOffsetEntityPos(args.rect, obj.targetPoint, args.xOffset, args.yOffset)
                obj.targetPoint.x = x
                obj.targetPoint.y = y
                
                return
            }
            }
        }

    }

    mergeMapEntities(baseMap, selMap, sel, xOffset, yOffset,
        oldToNewLevelsMap, selLevelOffset) {
        
        if (baseMap.entities === undefined && selMap.entities === undefined) {
            return []
        }
        let tilesize = 16

        let maxEntityId = 0

        let entities = ig.copy(baseMap.entities)
        entities.forEach((entity) => {
            ig.blitzkrieg.util.executeRecursiveAction(entity, this.changeEntityRecursive, {
                self: this,
                makePuzzlesUnique: false,
                rePosition: false,
                isSel: false,
                selLevelOffset,
                oldToNewLevelsMap,
            })
            if ('id' in entity && entity.id > maxEntityId) {
                maxEntityId = entity.id
            }
        })

        let entityId = maxEntityId

        sel.bb.forEach((rect) => {
            selMap.entities.forEach((entity) => {
                // check if entity is in rect bounds
                let xInRect = entity.x - rect.x
                let yInRect = entity.y - rect.y
                if (entity.type == 'EventTrigger' ||
                    (xInRect >= 0 && xInRect <= rect.width &&
                     yInRect >= 0 && yInRect <= rect.height)) {
                    
                    let newEntity = ig.copy(entity)

                    let { x, y } = this.getOffsetEntityPos(rect, newEntity, xOffset, yOffset)
                    if (entity.type == 'EventTrigger') {
                        x = xOffset
                        y = yOffset
                    }
                    // check if entity doesn't clip out of the base map
                    if (x < baseMap.mapWidth * tilesize && y < baseMap.mapHeight * tilesize) {
                        ig.blitzkrieg.util.executeRecursiveAction(newEntity, this.changeEntityRecursive, {
                            self: this,
                            makePuzzlesUnique: true,
                            rePosition: true,
                            isSel: true,
                            selLevelOffset,
                            oldToNewLevelsMap,
                            xOffset: xOffset,
                            yOffset: yOffset,
                            rect,
                        })

                        newEntity.x = x
                        newEntity.y = y
                        // newEntity.y -= sel.playerZ
                        newEntity.id = ++entityId
                        if ('settings' in newEntity) {
                            newEntity.settings.mapId = entityId
                            entities.push(newEntity)
                        }
                    }
                }
            })
        })
        return entities
    }

    mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset, 
        oldToNewLevelsMap, selLevelOffset, levelsLength, mergeLayers = false) {

        let width = baseMap.mapWidth
        let height = baseMap.mapHeight
        

        let tilesize = 16
        let xTileOffset = Math.floor(xOffset / tilesize)
        let yTileOffset = Math.floor(yOffset / tilesize)

        let emptyData = ig.blitzkrieg.util.emptyArray2d(width, height)

        // get lightLayer
        // search for base light layer
        let lightLayer = null
        baseMap.layer.forEach((layer) => {
            if (layer.type == 'Light') { lightLayer = layer }
        })
        if (lightLayer === null) {
            lightLayer = {
                type: 'Light',
                name: 'Light',
                visible: 1,
                tilesetName: 'media/map/lightmap-tiles.png',
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
        selMap.layer.forEach((layer) => {
            if (layer.type == 'Light') { selLightLayer = layer }
        })
        if (selLightLayer !== null) {
            // merge base light layer with selection light
            sel.bb.forEach((rect) => {
                let x1 = Math.floor(rect.x / tilesize)
                let y1 = Math.floor(rect.y / tilesize)
                let x2 = x1 + Math.ceil(rect.width / tilesize)
                let y2 = y1 + Math.ceil(rect.height / tilesize)
                ig.blitzkrieg.util.fillArray2d(lightLayer.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                let subArray = ig.blitzkrieg.util.createSubArray2d(selLightLayer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                ig.blitzkrieg.util.mergeArrays2d(lightLayer.data, subArray)
            })
        }
        lightLayer.width = width
        lightLayer.height = height 
        // maybe 'light' insted of 'last'?
        lightLayer.level = 'last'
        



        let collisionLayers = []
        for (let i = 0; i < levelsLength; i++) {
            collisionLayers[i] = {
                type: 'Collision',
                name: 'Collision',
                level: i,
                width: width,
                height: height,
                visible: 1,
                tilesetName: 'media/map/collisiontiles-16x16.png',
                repeat: false,
                distance: 1,
                yDistance: 0,
                tilesize: tilesize,
                moveSpeed: { x: 0, y: 0 },
                data: ig.copy(emptyData),
            }
        }

        // get base collision layers
        baseMap.layer.forEach((layer) => {
            if (layer.type != 'Collision') { return }
            let level = oldToNewLevelsMap[parseInt(layer.level)]
            layer = ig.copy(layer)
            layer.level = level
            layer.tilesetName = 'media/map/collisiontiles-16x16.png'
            collisionLayers[level] = layer
        })
        // merge collision layers with sel layers
        sel.bb.forEach((rect) => {
            let x1 = Math.floor(rect.x / tilesize)
            let y1 = Math.floor(rect.y / tilesize)
            let x2 = x1 + Math.ceil(rect.width / tilesize)
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach((layer) => {
                if (layer.type != 'Collision') { return }
                let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]
                let layer1 = collisionLayers[level]
                // ig.blitzkrieg.util.fillArray2d(layer1.data, 0, xTileOffset, yTileOffset, xTileOffset + rect.width/tilesize, yTileOffset + rect.height/tilesize)
                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                
                ig.blitzkrieg.util.mergeArrays2d(layer1.data, subArray)
            })
        })

        let tileLayers = []
        let tileLayersClear = []
        // get base tile layers
        
        baseMap.layer.forEach((layer) => {
            if (layer.type != 'Background' || (typeof layer.level === 'string' &&
                layer.level.startsWith('object'))) { return }
            let level = oldToNewLevelsMap[parseInt(layer.level)]
            if (! (level in tileLayers)) {
                tileLayers[level] = []
            }
            layer = ig.copy(layer)
            layer.level = level
            layer.isBase = true
            if (mergeLayers) {
                let tilesetName = layer.tilesetName
                tileLayers[level][tilesetName] = layer
            } else {
                tileLayersClear[level] = true
                tileLayers[level].push(layer)
            }
        })
        // add sel layers
        sel.bb.forEach((rect) => {
            let x1 = Math.floor(rect.x / tilesize)
            let y1 = Math.floor(rect.y / tilesize)
            let x2 = x1 + Math.ceil(rect.width / tilesize)
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach((layer) => {
                if (layer.type != 'Background' || (typeof layer.level === 'string' && 
                    layer.level.startsWith('object'))) { return }
                let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]
                // console.log('old level: ' + layer.level + 'new level: ' + level +', type: ' + layer.type + ', name: ' + layer.name)

                if (! (level in tileLayers)) {
                    tileLayers[level] = []
                }

                if (! mergeLayers && tileLayersClear[level]) {
                    tileLayers[level].forEach((layer1) => { 
                        if (layer1.isBase) {
                            ig.blitzkrieg.util.fillArray2d(layer1.data, 0, xTileOffset, yTileOffset,
                                xTileOffset + rect.width/tilesize,
                                yTileOffset + rect.height/tilesize)
                        }
                    })
                }
                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    xTileOffset, yTileOffset, width, height)
                if (!ig.blitzkrieg.util.isArrayEmpty2d(subArray)) {
                    if (mergeLayers) {
                        let tilesetName = layer.tilesetName
                        if (tilesetName in tileLayers[level]) {
                            // merge
                            let layer1 = tileLayers[level][tilesetName]
                            ig.blitzkrieg.util.mergeArrays2d(layer1.data, subArray)
                        } else {
                            if (! ig.blitzkrieg.util.isArrayEmpty2d(subArray)) {
                                let layer1 = ig.copy(layer)
                                layer1.data = subArray
                                layer1.width = width
                                layer1.height = height 
                                layer1.level = level
                                layer1.name = this.uniqueId + '_' + layer1.name
                                tileLayers[level][tilesetName] = layer1
                            }

                        }
                    } else {
                        let layer1 = ig.copy(layer)
                        layer1.data = subArray
                        layer1.width = width
                        layer1.height = height 
                        layer1.level = level
                        layer1.name = this.uniqueId + '_' + layer1.name
                        tileLayers[level].push(layer1)
                    }
                }
            })
        })


        // handle special object layers
        let objectLayers = []
        // get base object layers
        baseMap.layer.forEach((layer) => {
            let level = layer.level
            if (! (layer.type == 'Background' && typeof level === 'string' &&
                level.startsWith('object'))) { return }
            objectLayers.push(layer)
        })
        // merge base layers with sel layers
        sel.bb.forEach((rect) => {
            let x1 = Math.floor(rect.x / tilesize)
            let y1 = Math.floor(rect.y / tilesize)
            let x2 = x1 + Math.ceil(rect.width / tilesize)
            let y2 = y1 + Math.ceil(rect.height / tilesize)
            selMap.layer.forEach((layer) => {
                let level = layer.level
                if (! (layer.type == 'Background' && typeof level === 'string' &&
                    level.startsWith('object'))) { return }

                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2, 
                    xTileOffset, yTileOffset, width, height)

                if (!ig.blitzkrieg.util.isArrayEmpty2d(subArray)) {
                    let layer1 = layer
                    layer1.data = subArray
                    layer1.width = width
                    layer1.height = height 
                    // layer1.level = layer1.level + '_' + this.uniqueId
                    // layer1.name = this.uniqueId + '_' + layer1.level+ '_' + layer1.name + 'E'
                    objectLayers.push(layer1)
                }
            })
        })

        
        return {
            lightLayer,
            collisionLayers,
            tileLayers,
            objectLayers,
            mapWidth: width,
            mapHeight: height,
        }
    }


    async copySelToMap(baseMap, selMap, sel, xOffset, yOffset, newName,
        disableEntities, mergeLayers) {

        if (this.unsupportedMaps.has(baseMap.name) || 
            this.unsupportedMaps.has(selMap.name)) {

            ig.blitzkrieg.msg('blitzkrieg', 'tried to copy unsupported map')
            throw new Error('blitzkrieg: tried to copy unsupported map')
        }

        this.uniqueId = ig.blitzkrieg.util.generateUniqueID() 

        let { levels, oldToNewLevelsMap, selLevelOffset, masterLevel } = this.mergeMapLevels(baseMap, selMap)

        let { lightLayer, collisionLayers, tileLayers, objectLayers, mapWidth, mapHeight } = this.mergeMapLayers(baseMap, selMap, sel,
            xOffset, yOffset, oldToNewLevelsMap, selLevelOffset, levels.length, mergeLayers)
        
        let entities = []
        if (! disableEntities) {
            entities = this.mergeMapEntities(baseMap, selMap, sel,
                xOffset, yOffset, oldToNewLevelsMap, selLevelOffset)
        } 


        let allLayers = []
        let id = 0
        if (mergeLayers) {
            Object.keys(tileLayers).forEach((key) => { 
                let tilesetList = tileLayers[key]
                Object.keys(tilesetList).forEach((key1) => { 
                    let layer = tilesetList[key1]
                    layer.id = id++
                    allLayers.push(layer)
                })
            })
        } else {
            // prevent paralaxes that have different distance from merging
            // and looking weird by adding a tiny bit of moveSpeed
            let lastLayerDistance = 1
            let lastLayerSpeed = { x: -10000000, y: -10000000 }
            let speedInc = 5e-10
            tileLayers.forEach((levelLayers) => { 
                levelLayers.forEach((layer) => {
                    if (! layer.moveSpeed) {
                        layer.moveSpeed = { x: 0, y: 0 }
                    }
                    if (id > 0 && lastLayerDistance != layer.distance) {
                        layer.moveSpeed.x += speedInc
                        if (layer.moveSpeed.x == lastLayerSpeed.x &&
                            layer.moveSpeed.y == lastLayerSpeed.y) {

                            layer.moveSpeed.x += speedInc
                        }
                    }
                    lastLayerSpeed = ig.copy(layer.moveSpeed)
                    lastLayerDistance = layer.distance
                    layer.id = id++
                    allLayers.push(layer)
                })
            })
        }

        // fill down the water from layers higher
        // this makes kill pits work
        for (let i = 0; i < collisionLayers.length; i++) {
            for (let h = i + 2; h < collisionLayers.length; h++) {
                let l1 = collisionLayers[i]
                let l2 = collisionLayers[h]
                for (let y = 0; y < Math.min(l1.data.length, l2.data.length); y++) {
                    for (let x = 0; x < Math.min(l1.data[y].length, l2.data[y].length); x++) {
                        // check if is water or corner water
                        let l1nv = l1.data[y][x]
                        let l2nv = l2.data[y][x]

                        let l1IsWater = (l1nv == 1 || (l1nv >= 3 && l1nv <= 6) || (l1nv >= 15 && l1nv <= 18) || (l1nv >= 23 && l1nv <= 24))
                        let l2IsWater = (l2nv == 1 || (l2nv >= 3 && l2nv <= 6) || (l2nv >= 15 && l2nv <= 18) || (l2nv >= 23 && l2nv <= 24))

                        if (l1IsWater && l2IsWater) {
                            for (let v = i + 1; v < h; v++) {
                                if (collisionLayers[v].data[y][x] != 0) { break }
                                collisionLayers[v].data[y][x] = l2nv
                            }
                        }
                    }
                }
            }
        }
        collisionLayers.forEach((layer) => {
            layer.id = id++
            allLayers.push(layer)
        })

        objectLayers.forEach((layer) => { 
            layer.id = id++
            allLayers.push(layer)
        })
        if (lightLayer !== null) {
            lightLayer.id = id++
            allLayers.push(lightLayer)
        }

        let map = {
            name: newName,
            levels,
            mapWidth: mapWidth,
            mapHeight,
            masterLevel,
            attributes: { 
                saveMode: 'ENABLED', 
                bgm: '',
                cameraInBounds: false,
                'map-sounds': '',
                mapStyle: 'rhombus-puzzle',
                weather: '',
                area: 'rhombus-dng' 
            },
            // screen is not used? setting just to be safe
            screen: { x: 0, y: 0 },
            entities,
            layer: allLayers
        }

        console.log(map)
        return map
    }

    async copySelToMapAndWrite(baseMapName, sel, xOffset, yOffset,
        newName, newNameShort, disableEntities = false, mergeLayers = false) {
        // ig.blitzkrieg.msg('blitzkrieg', 'Copying map data', 2)
        // ig.blitzkrieg.msg('blitzkrieg', 'base: ' + baseMapName, 2)
        ig.blitzkrieg.msg('blitzkrieg', 'copying sel: ' + sel.map, 1)
        //ig.blitzkrieg.msg('blitzkrieg', 'new map: ' + newName, 2)

        let baseMap = await ig.blitzkrieg.util.getMapObject(baseMapName)
        let selMap = await ig.blitzkrieg.util.getMapObject(sel.map)

        let newMap = await this.copySelToMap(baseMap, selMap, sel,
            xOffset, yOffset, newName, disableEntities, mergeLayers)

        let newMapPath = './assets/mods/cc-rouge/assets/data/maps/rouge/' + newNameShort + '.json'
        

        // save new map to file
        let newMapJson = JSON.stringify(newMap)
        // return
        fs.writeFileSync(newMapPath, newMapJson)
    }


    copy() {
        let sel = ig.blitzkrieg.puzzleSelections.inSelStack.peek()
        // let sel = null
        if (sel == null) {
            if (this._sels.length() > 0) {
                sel = this._sels.pop()
            } else {
                return
            }
        }
        //let newNameShort = 'room-2'
        //let baseMapName = 'rouge.' + newNameShort
        //if (this.copyCount++ == 0) {
        //    baseMapName = 'rouge.room-1'
        //}
        
        // let newNameShort = '10emptytmp'
        // let baseMapName = 'rouge.' + newNameShort
        // if (this.copyCount++ == 0) {
        //     baseMapName = 'rouge.10empty'
        // }
        let newNameShort = '300emptytmp'
        let baseMapName = 'rouge.' + newNameShort
        if (this.copyCount++ == 0) {
            baseMapName = 'rouge.300empty'
        }

        let newName = 'rouge.' + newNameShort

        this.copySelToMapAndWrite(baseMapName, sel,
            this.xOffset, this.yOffset, newName, newNameShort, false, false)
        let selSize = ig.blitzkrieg.util.getSelectionSize(sel)
        this.xOffset += selSize.width + 32
    }
}
