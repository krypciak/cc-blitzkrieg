import { assert } from 'cc-map-util/src/util'
import { Selection } from './selection'
import { EntityRecArgs, EntityRecArgsIn, MapCopyOptions, copyMapRectsToMap } from 'cc-map-util/src/map-copy'
import { FsUtil } from './fsutil'
import { MapPoint } from 'cc-map-util/src/pos'

export class BlitzkriegMapUtil {
    copySelMapAreaTo(
        baseMap: sc.MapModel.Map,
        selMap: sc.MapModel.Map,
        sel: Selection,
        offset: Vec2,
        filters: EntityRecArgs['filters'],
        options: MapCopyOptions
    ): sc.MapModel.Map {
        assert(sel.data?.startPos?.z)

        const eargs: EntityRecArgsIn = {
            offset: MapPoint.fromVec(offset),
            filters,
            selMasterZ: sel.data.startPos.z,
            selSizeRect: MapPoint.fromVec(sel.sizeRect),
            selectAllEventTriggers: true,
        }
        const { map, levelOffset, lvlChangeMap } = copyMapRectsToMap(
            baseMap,
            selMap,
            sel.bb,
            eargs,
            baseMap.name,
            options
        )
        return map
    }

    async copyCurrentSel() {
        await blitzkrieg.sels.puzzle.loadAll()
        const sel: Selection = blitzkrieg.sels.puzzle.selMap['rhombus-dng/room-1'].sels[0]
        // blitzkrieg.currSel.inSelStack.peek()
        if (!sel) {
            blitzkrieg.rhudmsg('blitzkrieg', 'Not standing in a sel', 2)
            return
        }

        const baseMap: sc.MapModel.Map = await this.getMapObject('blitzkrieg/test20')
        const selMap: sc.MapModel.Map = await this.getMapObject(sel.mapName)
        const newMap: sc.MapModel.Map = this.copySelMapAreaTo(baseMap, selMap, sel, new MapPoint(1, 1), [], {
            disableEntities: false,
            makePuzzlesUnique: false,
        })
        const newName = (newMap.name = 'blitzkrieg/newmap')
        console.log(newMap)
        const mapString: string = await blitzkrieg.prettifyJson(JSON.stringify(newMap), 300)
        return FsUtil.writeFile(`${blitzkrieg.dir}/assets/data/maps/${newName}.json`, mapString)
    }

    getMapStringByPath(path: string): Promise<string> {
        path = path.replace('assets/', '')
        return new Promise(resolve => {
            $.ajax({
                url: path,
                dataType: 'text',
                success: function (response: string) {
                    resolve(response)
                },
                error: function (b, c, e) {
                    console.log(path)
                    ig.system.error(Error("Loading of Map '" + path + "' failed: " + b + ' / ' + c + ' / ' + e))
                },
            })
        })
    }

    async getMapObjectByPath(path: string): Promise<sc.MapModel.Map> {
        return JSON.parse(await this.getMapStringByPath(path))
    }

    cachedMaps: Record<string, string> = {}

    async getMapObject(mapName: string, noCache: boolean = false): Promise<sc.MapModel.Map> {
        mapName = mapName.replace(/\./g, '/')
        if (!noCache && mapName in this.cachedMaps) {
            return JSON.parse(this.cachedMaps[mapName])
        }
        const path: string = ig.getFilePath(mapName.toPath(ig.root + 'data/maps/', '.json') + ig.getCacheSuffix())
        const mapString: string = await this.getMapStringByPath(path)
        this.cachedMaps[mapName] = mapString
        return JSON.parse(mapString)
    }
}
