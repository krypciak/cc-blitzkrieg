const fs = require('fs')
// const path = require('path')

export class MapArranger {
    processMap(mapName, data, positions, x, y) {
        // console.log('Processing map: ' + mapName)
        let map = data[mapName]
        // console.log(ig.copy(map))
        for (let connection of map.connections) {
            let destMapName = connection.destMap
            // let destMarker = connection.destMarker
            let marker = connection.marker
            
            if (destMapName in positions) {
                continue
            }
            if (!(destMapName in data)) {
                console.log('SKIPPING: ' + destMapName + ' is unknown')
                continue
            }

            let destMap = data[destMapName]
            
            let destConnection
            for (let destConnection1 of destMap.connections) {
                if (destConnection1.destMap == mapName &&
                    destConnection1.destMarker == marker) {

                    destConnection = destConnection1
                    break
                }
            }
            if (! destConnection) {
                console.log('SKIPPING: ' + mapName + ' -> marker: ' + marker + ' is unknown')
                continue
            }

            let newX = x + connection.x - destConnection.x
            let newY = y + connection.y - destConnection.y

            positions.minX = Math.min(positions.minX, newX)
            positions.minY = Math.min(positions.minY, newY)

            positions[destMapName] = {x: newX, y: newY}
            this.processMap(destMapName, data, positions, newX, newY)
        }
    }

    mergeAreas(maps, positions1, positions2, x, y) {
        positions1 = ig.copy(positions1)
        positions2 = ig.copy(positions2)

        for (let mapName in positions2) {
            if (! (mapName in maps)) { continue }
            positions2[mapName].x += x
            positions2[mapName].y += y
        }
        
        let merged = Object.assign({}, positions1, positions2)
        return merged
    }

    getPositionsStartingFrom(mapName, data) {
        let positions = {
            minX: 1000000,
            minY: 1000000,
        }
        positions[mapName] = {x: 0, y: 0}
        this.processMap(mapName, data, positions, 0, 0)

        let minX = positions.minX
        let minY = positions.minY
        delete positions.minX
        delete positions.minY

        for (let mapName in positions) {
            positions[mapName].x -= minX
            positions[mapName].y -= minY
        }

        return positions
    }

    async arrangeMaps() {
        await blitzkrieg.util.loadAllMaps()

        let maps = blitzkrieg.util.cachedMaps
        console.log(maps)

        let entitiesToKill = []
        let data = {}
        for (let mapName in maps) {
            let map = maps[mapName]
            for (let entity of map.entities) {
                let destMap
                let destMarker
                let marker
                let set = false

                if ((entity.type == 'TeleportGround' || entity.type == 'Door') && entity.settings.map) {
                    set = true
                    destMap = entity.settings.map
                    destMarker = entity.settings.marker
                    marker = entity.settings.name
                } 
                if ((entity.type == 'TeleportField') && entity.settings.map) {
                    destMap = entity.settings.map
                    destMarker = entity.settings.marker
                    marker = entity.settings.name
                    if (mapName == 'rhombus-sqr.central-inner' && ! destMap.startsWith('rhombus')) { continue }
                    set = true
                } 
                if (set) {
                    for (let initMapName of [mapName]) {
                        if (! (initMapName in data)) {
                            data[initMapName] = {
                                connections: [],
                                name: mapName,
                            }
                        }
                    }

                    data[mapName].connections.push({
                        destMap: destMap,
                        destMarker: destMarker,
                        marker: marker,
                        x: entity.x,
                        y: entity.y,
                    })

                    entitiesToKill.push(entity)
                }
            }
        }
        
        // general
        let pos1 = this.getPositionsStartingFrom('rookie-harbor.teleporter', data)

        // kulero temple
        let pos2 = this.getPositionsStartingFrom('final-dng.g.outdoor-01', data)
        let positions = this.mergeAreas(maps, pos2, pos1, 30000, 1000)

        // maroon valley
        let pos3 = this.getPositionsStartingFrom('heat.path-00', data)
        positions = this.mergeAreas(maps, positions, pos3, 15000, 1000)

        // rhombus square
        let pos4 = this.getPositionsStartingFrom('rhombus-sqr.center-ne', data)
        positions = this.mergeAreas(maps, positions, pos4, 38000, 30000)
        // ship
        let pos5 = this.getPositionsStartingFrom('cargo-ship.ship', data)
        positions = this.mergeAreas(maps, positions, pos5, 60000, 34000)
        // beach
        let pos6 = this.getPositionsStartingFrom('beach.path-01-entrance', data)
        positions = this.mergeAreas(maps, positions, pos6, 6500, 28000)

        let width = 0
        let height = 0
        for (let mapName in positions) {
            if (! (mapName in maps)) { continue }

            width = Math.max(width, positions[mapName].x + maps[mapName].mapWidth*16)
            height = Math.max(height, positions[mapName].y + maps[mapName].mapHeight*16)
        }
        return { positions, maps, data, width, height }
    }

    async arrange() {
        blitzkrieg.msg('blitzkrieg', 'arrange')

        let obj = await this.arrangeMaps()
        let obj1 = ig.copy(obj)
        console.log('size:')
        console.log(obj1.width, obj1.height)

        // remove unnecesery data from obj.maps
        for (let mapName in obj1.maps) {
            let map = obj1.maps[mapName]
            let newMap = {
                name: map.name,
                mapWidth: map.mapWidth,
                mapHeight: map.mapHeight,
                masterLevel: map.masterLevel,
                attributes: map.attributes,
                levels: map.levels,
            }
            obj1.maps[mapName] = newMap
        }
        console.log(obj1)
        fs.writeFileSync('./assets/mods/cc-blitzkrieg/json/position-data.json', JSON.stringify(obj1))
        // this.drawPositionsCanvas(positions, maps, data, width, height)
        
        blitzkrieg.msg('blitzkrieg', 'arrange done')
        console.log('now you can run the python script at ./assets/mods/cc-blitzkrieg/json/drawArrangeMapCanvas.py')
    }


    async epicMapGrid() {
        let baseName = 'rouge/300empty'

        let newNameShort = '300emptytmp'
        let newName = 'rouge/' + newNameShort

        let filePaths = blitzkrieg.util.getFilesInDir('./assets/data/maps')
        filePaths = blitzkrieg.util.getFilesInDir('./assets/extension/post-game/data/maps', filePaths)

        let baseMap = await blitzkrieg.util.getMapObject(baseName)
        let mapWidth = baseMap.mapWidth*16
        let mapHeight = baseMap.mapHeight*16

        let xOffsetStart = 32
        let xOffset = xOffsetStart
        let yOffset = 32

        let maxHeight = 0

        let biggestWidth = 0
        let biggestHeight = 0

        // eslint-disable-next-line
        let i = 0
        for (let mapPath of filePaths) {
            if (mapPath.includes('maps/arena/')) {
                continue
            }
            let selMapData = await blitzkrieg.util.getMapObjectByPath(mapPath)
            biggestWidth = Math.max(biggestWidth, selMapData.mapWidth)
            biggestHeight = Math.max(biggestHeight, selMapData.mapHeight)
            let selMapWidth = selMapData.mapWidth * 16
            let selMapHeight = selMapData.mapHeight * 16
            let sel = blitzkrieg.util.getEntireMapSel(selMapData)

            let xOffset_tmp = xOffset + selMapWidth + 32
            if (xOffset_tmp >= mapWidth) {
                xOffset = xOffsetStart
                xOffset_tmp = xOffsetStart
                yOffset += maxHeight + 32
                maxHeight = 0
            }
            if (selMapHeight > maxHeight) {
                maxHeight = selMapHeight
            }
            if (yOffset + selMapHeight >= mapHeight) {
                xOffset = xOffsetStart
                xOffset_tmp = xOffsetStart
                yOffset = 32
                maxHeight = 0
                console.log('ran out of space')
            }
            baseMap = await blitzkrieg.selectionCopyManager.copySelToMap(baseMap, selMapData, sel,
                xOffset, yOffset, newName, {
                    disableEntities: true,
                    mergeLayers: true,
                    removeCutscenes: true
                })

            // xOffset = xOffset_tmp
            // if (++i >= 100) {
            //     break
            // }
        }


        console.log('biggest:')
        console.log(biggestWidth)
        console.log(biggestHeight)

        let newMapPath = './assets/mods/cc-rouge/assets/data/maps/rouge/' + newNameShort + '.json'

        // save new map to file
        let newMapJson = JSON.stringify(baseMap)
        // return
        fs.writeFileSync(newMapPath, newMapJson)
    }
}
