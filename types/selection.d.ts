import { MapRect, bareRect } from 'cc-map-util/src/rect';
import { MapPoint } from 'cc-map-util/src/pos';
import { Stack } from 'cc-map-util/src/util';
import { IChangeRecorder } from './change-record';
export interface Selection {
    bb: MapRect[];
    mapName: string;
    sizeRect: MapRect;
    data: {
        recordLog?: any;
        endPos?: Vec3 & {
            level: number;
        };
        startPos?: Vec3 & {
            level: number;
        };
    };
}
export declare class SelectionMapEntry {
    sels: Selection[];
    fileIndex: number;
    tempSel?: Omit<Selection, "sizeRect"> | undefined;
    constructor(sels: Selection[], fileIndex: number, tempSel?: Omit<Selection, "sizeRect"> | undefined);
    toJSON(): object;
}
export declare class SelectionManager {
    name: string;
    completeColor: string;
    tempColor: string;
    jsonFiles: string[];
    selMap: Record<string, SelectionMapEntry>;
    inSelStack: Stack<Selection>;
    drawBoxes: boolean;
    selectStep: number;
    fileIndex: number;
    tempPos: MapPoint;
    selIndexes: (number | undefined)[];
    recorder?: IChangeRecorder;
    constructor(name: string, completeColor: string, tempColor: string, jsonFiles: string[]);
    newSelEvent(_: Selection): Promise<void>;
    walkInEvent(_: Selection): Promise<void>;
    walkOutEvent(_: Selection): Promise<void>;
    onNewMapEntryEvent(): Promise<void>;
    setFileIndex(index: number): void;
    setMapEntry(map: string, entry: SelectionMapEntry): void;
    getCurrentEntry(): SelectionMapEntry;
    selectionCreatorBegin(): Promise<void>;
    selectionCreatorDelete(): void;
    selectionCreatorDeconstruct(): void;
    selectionCreatorSelect(): void;
    checkForEvents(pos: Vec2): void;
    checkSelForEvents(sel: Selection, vec: MapPoint, i: number): void;
    drawBox(rect: bareRect, color: string): void;
    drawBoxArray(rects: bareRect[], color: string): void;
    drawSelections(): void;
    toggleDrawing(): void;
    save(): Promise<void>;
    load(index: number): Promise<void>;
    loadAll(): Promise<void[]>;
    static getSelFromRect(rect: MapRect, mapName: string, z: number): Selection;
    static setSelPos(sel: Selection, offset: MapPoint): void;
}
