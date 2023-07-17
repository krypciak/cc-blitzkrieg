import { Stack } from './util.js'
const fs = require('fs')
let tilesize

export class SelectionCopyManager {
    constructor() {
        tilesize = ig.blitzkrieg.tilesize
        this.xOffset = 64
        this.yOffset = 64
        this.copyCount = 0
        this._sels = new Stack()
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[0])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-1-5'].sels[1])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2-pre'].sels[0])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2-pre'].sels[0])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2-pre'].sels[0])
        //this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2-pre'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['rhombus-dng.room-3-2'].sels[0])

        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['final-dng.b4.bridge'].sels[0])
        // this._sels.push(ig.blitzkrieg.puzzleSelections.selHashMap['jungle.left.path-left-03'].sels[0])
        // this._sels.push(ig.blitzkrieg.util.['autumn-fall.path-05'].sels[1])
        //
        this.excludeEventTypes = new Set([
            'SET_CAMERA_POS',
            // 'WAIT',
        ])
    }

    mergeMapLevels(baseMap, selMap, sel) {
        let baseLevels = baseMap.levels
        let selLevels = ig.copy(selMap.levels)

        for (let i = 0; i < selLevels.length; i++) {
            selLevels[i].height -= sel.data.startPos.z
        }

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

    getOffsetEntityPos(rect, entity, xOffset, yOffset, sel) {
        return {
            x: Math.floor(xOffset/tilesize)*16 - Math.floor(rect.x/tilesize)*16 + entity.x + rect.x - sel.size.x,
            y: Math.floor(yOffset/tilesize)*16 - Math.floor(rect.y/tilesize)*16 + entity.y + rect.y - sel.size.y - sel.data.startPos.z,
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

            case 'group':
            case 'varName':
            case 'preVariable':
            case 'postVariable':
            case 'countVariable':
            case 'varIncrease':
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
                    let { x, y } = self.getOffsetEntityPos(args.rect, obj[key], args.xOffset, args.yOffset, args.sel)
                    obj[key].x = x
                    obj[key].y = y
                }
                return
            }
            case 'targetPoint': {
                let { x, y } = self.getOffsetEntityPos(args.rect, obj.targetPoint, args.xOffset, args.yOffset, args.sel)
                obj.targetPoint.x = x
                obj.targetPoint.y = y
                
                return
            }
            }
        }

        if (args.removeCutscenes) {
            if (key == 'event' && Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    let event = value[i]
                    let type = event.type
                    if (self.excludeEventTypes.has(type)) {
                        value.splice(i, 1)
                        i--
                    }
                }
            }
        }
    }

    mergeMapEntities(baseMap, selMap, sel, xOffset, yOffset,
        oldToNewLevelsMap, selLevelOffset, removeCutscenes) {
        
        if (baseMap.entities === undefined && selMap.entities === undefined) {
            return []
        }

        let maxEntityId = 0

        let entities = ig.copy(baseMap.entities)
        entities.forEach((entity) => {
            ig.blitzkrieg.util.executeRecursiveAction(entity, this.changeEntityRecursive, {
                self: this,
                makePuzzlesUnique: false,
                rePosition: false,
                isSel: false,
                removeCutscenes: false,
                selLevelOffset,
                oldToNewLevelsMap,
                sel,
            })
            if ('id' in entity && entity.id > maxEntityId) {
                maxEntityId = entity.id
            }
        })

        let entityId = maxEntityId
        let triggersIncluded = []
        sel.bb.forEach((rect) => {
            selMap.entities.forEach((entity) => {
                // check if entity is in rect bounds
                let xInRect = entity.x - rect.x
                let yInRect = entity.y - rect.y
                if (entity.type == 'EventTrigger' ||
                    (xInRect >= 0 && xInRect <= rect.width &&
                     yInRect >= 0 && yInRect <= rect.height)) {
                    
                    let newEntity = ig.copy(entity)

                    let { x, y } = this.getOffsetEntityPos(rect, newEntity, xOffset, yOffset, sel)
                    if (entity.type == 'EventTrigger') {
                        for (let obj of triggersIncluded) {
                            if (entity.settings.name == obj.name && entity.x == obj.x && entity.y == obj.y) {
                                return
                            }
                        }
                        triggersIncluded.push({
                            name: entity.settings.name,
                            x: entity.x,
                            y: entity.y,
                        })
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
                            removeCutscenes,
                            selLevelOffset,
                            oldToNewLevelsMap,
                            xOffset: xOffset,
                            yOffset: yOffset,
                            rect,
                            sel,
                        })

                        newEntity.x = x
                        newEntity.y = y
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


    processCollisionLayers(mapData) {
        let width = mapData.mapWidth
        let height = mapData.mapHeight
        let emptyData = ig.blitzkrieg.util.emptyArray2d(width, height)
        let levels = mapData.levels

        let collisionLayers = []
        for (let i = 0; i < levels.length + 1; i++) {
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
                tilesize: mapData.tilesize,
                moveSpeed: { x: 0, y: 0 },
                data: ig.copy(emptyData),
            }
        }
        for (let i = 0; i < mapData.layer.length; i++) {
            let layer = mapData.layer[i]
            if (layer.type != 'Collision') { continue }
            collisionLayers[layer.level] = ig.copy(layer)
        }
        
        this._processCollisionLayers(collisionLayers, mapData.masterLevel, mapData.levels)

        for (let i = 0; i < mapData.layer.length; i++) {
            let layer = mapData.layer[i]
            if (layer.type != 'Collision') { continue }
            mapData.layer[i] = collisionLayers[layer.level]
        }
    }

    _processCollisionLayers(collisions, masterLevel, heights) {
        let maxLevel = -1
        for (let layer of collisions) {
            if (layer.level > maxLevel) {
                maxLevel = layer.level
            }
        }
        let tmpLayer = null
        let masterLayer = collisions[masterLevel]
        if (masterLayer) {
            this._processCollisionLayer(masterLayer, tmpLayer, null)
            tmpLayer = masterLayer
        }

        for (let i = masterLevel + 1; i < maxLevel; i++) {
            this._processCollisionLayer(collisions[i], tmpLayer, tmpLayer ? (heights[i].height - heights[i - 1].height) / 16 : 0)
            tmpLayer = collisions[i]
        }
        tmpLayer = masterLayer ? masterLayer : null

        for (let i = masterLevel - 1; i >= 0; i--) {
            this._processCollisionLayer(collisions[i], tmpLayer, tmpLayer ? (heights[i].height - heights[i + 1].height) / 16 : 0)
            tmpLayer = collisions[i]
        }
    }

    _processCollisionLayer(layer, tmpLayer, yDiff) {
        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
                let g
                tmpLayer && (g = tmpLayer.data[y + yDiff] ? tmpLayer.data[y + yDiff][x] % 32 : 2)
                layer.data[y][x] = ig.CollMapTools.prepareSingleTile(x, y, layer.data[y][x], g, yDiff)
            }
        }
    }

    getMapLayerCords(rect, xTileOffset, yTileOffset, sel) {
        let x1 = Math.floor(rect.x / tilesize)
        let y1 = Math.floor(rect.y / tilesize)
        let x2 = x1 + rect.width / tilesize
        let y2 = y1 + rect.height / tilesize
        let x3 = xTileOffset + (rect.x - sel.size.x) / tilesize
        let y3 = yTileOffset + (rect.y - sel.size.y) / tilesize
        let x4 = x3 + rect.width / tilesize
        let y4 = y3 + rect.height / tilesize
        return {
            x1, y1,
            x2, y2,
            x3, y3,
            x4, y4
        }
    }


    createUniquePuzzleSelection(origSel, xOffset, yOffset, id) {
        let sel = ig.copy(origSel)

        xOffset = Math.floor(xOffset/tilesize)*tilesize
        yOffset = Math.floor(yOffset/tilesize)*tilesize

        for (let i = 0; i < sel.bb.length; i++) {
            sel.bb[i].x = sel.bb[i].x - sel.size.x + xOffset
            sel.bb[i].y = sel.bb[i].y - sel.size.y + yOffset
        }

        if (sel.data.startPos) {
            sel.data.startPos.x = sel.data.startPos.x - sel.size.x + xOffset
            sel.data.startPos.y = sel.data.startPos.y - sel.size.y + yOffset
        }
        
        if (sel.data.endPos) {
            sel.data.endPos.x = sel.data.endPos.x - sel.size.x + xOffset
            sel.data.endPos.y = sel.data.endPos.y - sel.size.y + yOffset
        }

        sel.size.x = xOffset
        sel.size.y = yOffset

        if (sel.data.stateLog && sel.data.stateLog.puzzleLog) {
            for (let i = 0; i < sel.data.stateLog.puzzleLog.length; i++) {
                let action = sel.data.stateLog.puzzleLog[i]
                sel.data.stateLog.puzzleLog[i] = [action[0], action[1] + '_' + id, action[2]]
            }
        }

        return sel
    }

    mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset, 
        oldToNewLevelsMap, selLevelOffset, levelsLength, mergeLayers = false) {

        let width = baseMap.mapWidth
        let height = baseMap.mapHeight
        

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
                let { x1, y1, x2, y2, x3, y3, x4, y4 } = 
                    this.getMapLayerCords(rect, xTileOffset, yTileOffset, sel)
                ig.blitzkrieg.util.fillArray2d(lightLayer.data, 0, x3, y3, x4, y4)
                let subArray = ig.blitzkrieg.util.createSubArray2d(selLightLayer.data, x1, y1, x2, y2,
                    x3, y3, width, height)
                ig.blitzkrieg.util.mergeArrays2d(lightLayer.data, subArray)
            })
        }
        lightLayer.width = width
        lightLayer.height = height 
        // maybe 'light' insted of 'last'?
        lightLayer.level = 'last'
        
        // generate all collision tiles to keep the
        // master level from ruining my day
        this.processCollisionLayers(baseMap)
        this.processCollisionLayers(selMap)

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
            layer.isBase = true
            collisionLayers[level] = layer
        })
        // merge collision layers with sel layers
        sel.bb.forEach((rect) => {
            let { x1, y1, x2, y2, x3, y3, x4, y4 } = 
                this.getMapLayerCords(rect, xTileOffset, yTileOffset, sel)
            for (let layer of collisionLayers) {
                if (layer.isBase) {
                    ig.blitzkrieg.util.fillArray2d(layer.data, 0, x3, y3, x4, y4)
                }
            }
            selMap.layer.forEach((layer) => {
                if (layer.type != 'Collision') { return }
                let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]
                let layer1 = collisionLayers[level]

                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    x3, y3, width, height)
                
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
        selMap.layer.forEach((layer) => {
            if (layer.type != 'Background' || (typeof layer.level === 'string' && 
                layer.level.startsWith('object'))) { return }

            let level = oldToNewLevelsMap[parseInt(layer.level) + selLevelOffset]

            if (! (level in tileLayers)) {
                tileLayers[level] = []
            }
            let rectLayer

            sel.bb.forEach((rect) => {
                let { x1, y1, x2, y2, x3, y3, x4, y4 } = 
                    this.getMapLayerCords(rect, xTileOffset, yTileOffset, sel)

                if (! mergeLayers && tileLayersClear[level]) {
                    tileLayers[level].forEach((layer1) => { 
                        if (layer1.isBase) {
                            ig.blitzkrieg.util.fillArray2d(layer1.data, 0, x3, y3, x4, y4)
                        }
                    })
                }
                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    x3, y3, width, height)
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
                        if (rectLayer) {
                            ig.blitzkrieg.util.mergeArrays2d(rectLayer.data, subArray)
                        } else {
                            let layer1 = ig.copy(layer)
                            layer1.data = subArray
                            layer1.width = width
                            layer1.height = height 
                            layer1.level = level
                            layer1.name = this.uniqueId + '_' + layer1.name
                            tileLayers[level].push(layer1)
                            rectLayer = layer1
                        }
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
        selMap.layer.forEach((layer) => {
            let level = layer.level
            if (! (layer.type == 'Background' && typeof level === 'string' &&
                 level.startsWith('object'))) { return }

            let rectLayer

            sel.bb.forEach((rect) => {
            // eslint-disable-next-line no-unused-vars
                let { x1, y1, x2, y2, x3, y3, x4, y4 } = 
                    this.getMapLayerCords(rect, xTileOffset, yTileOffset, sel)

                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    x3, y3, width, height)

                if (!ig.blitzkrieg.util.isArrayEmpty2d(subArray)) {
                    if (rectLayer) {
                        ig.blitzkrieg.util.mergeArrays2d(rectLayer.data, subArray)
                    } else {
                        let layer1 = layer
                        layer1.data = subArray
                        layer1.width = width
                        layer1.height = height 
                        objectLayers.push(layer1)
                        rectLayer = layer1
                    }
                }
            })
        })

        // copy nav layers
        let navLayers = []
        // get base nav layers
        baseMap.layer.forEach((layer) => {
            if (! (layer.type == 'Navigation')) { return }
            navLayers.push(layer)
        })
        // merge base layers with sel layers
        sel.bb.forEach((rect) => {
            // eslint-disable-next-line no-unused-vars
            let { x1, y1, x2, y2, x3, y3, x4, y4 } = 
                this.getMapLayerCords(rect, xTileOffset, yTileOffset, sel)
            selMap.layer.forEach((layer) => {
                if (! (layer.type == 'Navigation')) { return }

                let subArray = ig.blitzkrieg.util.createSubArray2d(layer.data, x1, y1, x2, y2,
                    x3, y3, width, height)

                if (!ig.blitzkrieg.util.isArrayEmpty2d(subArray)) {
                    let layer1 = layer
                    layer1.data = subArray
                    layer1.width = width
                    layer1.height = height 
                    navLayers.push(layer1)
                }
            })
        })

        
        return {
            lightLayer,
            collisionLayers,
            tileLayers,
            objectLayers,
            navLayers,
            mapWidth: width,
            mapHeight: height,
        }
    }

    async copySelToMap(baseMap, selMap, sel, xOffset, yOffset, newName,
        disableEntities, mergeLayers, removeCutscenes,
        uniqueId = ig.blitzkrieg.util.generateUniqueID()) {

        this.uniqueId = uniqueId

        let { levels, oldToNewLevelsMap, selLevelOffset, masterLevel } = this.mergeMapLevels(baseMap, selMap, sel)

        let { lightLayer, collisionLayers, tileLayers, objectLayers, navLayers, mapWidth, mapHeight } =
            this.mergeMapLayers(baseMap, selMap, sel, xOffset, yOffset, oldToNewLevelsMap,
                selLevelOffset, levels.length, mergeLayers)
        
        let entities = []
        if (! disableEntities) {
            entities = this.mergeMapEntities(baseMap, selMap, sel,
                xOffset, yOffset, oldToNewLevelsMap, selLevelOffset, removeCutscenes)
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
        for (let i = collisionLayers.length - 1 ; i >= 1; i--) {
            let l1 = collisionLayers[i]
            let l2 = collisionLayers[i - 1]
            for (let y = 0; y < l1.data.length; y++) {
                for (let x = 0; x < l1.data[y].length; x++) {
                    // check if is water or corner water
                    let l1nv = l1.data[y][x]
                    let l2nv = l2.data[y][x]

                    let l1IsWater = (l1nv == 1 || (l1nv >= 3 && l1nv <= 6) || (l1nv >= 15 && l1nv <= 18) || (l1nv >= 23 && l1nv <= 24))

                    if (l1IsWater && l2nv == 0) {
                        l2.data[y][x] = l1nv
                    }
                }
            }
        }
        collisionLayers.forEach((layer) => {
            layer.id = id++
            allLayers.push(layer)
        })
        navLayers.forEach((layer) => {
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


    async copy() {
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
        let baseMapName = 'rouge/' + newNameShort
        if (this.copyCount++ == 0) {
            baseMapName = 'rouge/300empty'
        }

        let newName = 'rouge/' + newNameShort

        this.copySelToMapAndWrite(baseMapName, sel,
            this.xOffset, this.yOffset, newName, newNameShort, false, false, true)
        this.xOffset += sel.size.width + 32
    }
}
