"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlitzkriegMapUtil = void 0;
const util_1 = require("cc-map-util/src/util");
const map_copy_1 = require("cc-map-util/map-copy");
const fsutil_1 = require("./fsutil");
const pos_1 = require("cc-map-util/src/pos");
class BlitzkriegMapUtil {
    constructor() {
        this.cachedMaps = {};
    }
    copySelMapAreaTo(baseMap, selMap, sel, offset, filters, options) {
        var _a, _b;
        (0, util_1.assert)((_b = (_a = sel.data) === null || _a === void 0 ? void 0 : _a.startPos) === null || _b === void 0 ? void 0 : _b.z);
        const eargs = {
            offset,
            filters,
            selMasterZ: sel.data.startPos.z,
            selSizeRect: pos_1.MapPoint.fromVec(sel.sizeRect),
            selectAllEventTriggers: true,
        };
        const newMap = (0, map_copy_1.copyMapRectsToMap)(baseMap, selMap, sel.bb, eargs, baseMap.name, options);
        return newMap;
    }
    async copyCurrentSel() {
        await blitzkrieg.sels.puzzle.loadAll();
        const sel = blitzkrieg.sels.puzzle.selMap['rhombus-dng/room-1'].sels[0];
        // blitzkrieg.currSel.inSelStack.peek()
        if (!sel) {
            blitzkrieg.rhudmsg('blitzkrieg', 'Not standing in a sel', 2);
            return;
        }
        const baseMap = await this.getMapObject('blitzkrieg/test20');
        const selMap = await this.getMapObject(sel.mapName);
        const newMap = this.copySelMapAreaTo(baseMap, selMap, sel, new pos_1.MapPoint(1, 1), [], {
            disableEntities: false,
            makePuzzlesUnique: false,
        });
        const newName = newMap.name = 'blitzkrieg/newmap';
        console.log(newMap);
        const mapString = await blitzkrieg.prettifyJson(JSON.stringify(newMap), 300);
        fsutil_1.FsUtil.writeFileSync(`${blitzkrieg.dir}/assets/data/maps/${newName}.json`, mapString);
    }
    getMapStringByPath(path) {
        path = path.replace('assets/', '');
        return new Promise((resolve) => {
            $.ajax({
                url: path,
                dataType: 'text',
                success: function (response) {
                    resolve(response);
                },
                error: function (b, c, e) {
                    console.log(path);
                    ig.system.error(Error('Loading of Map \'' + path +
                        '\' failed: ' + b + ' / ' + c + ' / ' + e));
                },
            });
        });
    }
    async getMapObjectByPath(path) {
        return JSON.parse(await this.getMapStringByPath(path));
    }
    async getMapObject(mapName, noCache = false) {
        mapName = mapName.replace(/\./g, '/');
        if (!noCache && mapName in this.cachedMaps) {
            return JSON.parse(this.cachedMaps[mapName]);
        }
        const path = ig.getFilePath(mapName.toPath(ig.root + 'data/maps/', '.json') + ig.getCacheSuffix());
        const mapString = await this.getMapStringByPath(path);
        this.cachedMaps[mapName] = mapString;
        return JSON.parse(mapString);
    }
}
exports.BlitzkriegMapUtil = BlitzkriegMapUtil;
