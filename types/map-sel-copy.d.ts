import { Selection } from './selection';
import { EntityRecArgs, MapCopyOptions } from 'cc-map-util/src/map-copy';
import { MapPoint } from 'cc-map-util/src/pos';
export declare class BlitzkriegMapUtil {
    copySelMapAreaTo(baseMap: sc.MapModel.Map, selMap: sc.MapModel.Map, sel: Selection, offset: MapPoint, filters: EntityRecArgs['filters'], options: MapCopyOptions): sc.MapModel.Map;
    copyCurrentSel(): Promise<void>;
    getMapStringByPath(path: string): Promise<string>;
    getMapObjectByPath(path: string): Promise<sc.MapModel.Map>;
    cachedMaps: Record<string, string>;
    getMapObject(mapName: string, noCache?: boolean): Promise<sc.MapModel.Map>;
}
