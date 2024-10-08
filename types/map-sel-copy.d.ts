import { Selection } from './selection';
import { EntityRecArgs, MapCopyOptions } from 'cc-map-util/src/map-copy';
import { PuzzleSelection } from './puzzle-selection';
import { BattleSelection } from './battle-selection';
export declare class BlitzkriegMapUtil {
    copySelMapAreaTo(baseMap: sc.MapModel.Map, selMap: sc.MapModel.Map, sel: Selection, offset: Vec2, filters: EntityRecArgs['filters'], options: MapCopyOptions, copySels?: (PuzzleSelection | BattleSelection)[]): sc.MapModel.Map;
    copyCurrentSel(): Promise<void>;
    getMapStringByPath(path: string): Promise<string>;
    getMapObjectByPath(path: string): Promise<sc.MapModel.Map>;
    cachedMaps: Record<string, string>;
    getMapObject(mapName: string, noCache?: boolean): Promise<sc.MapModel.Map>;
}
