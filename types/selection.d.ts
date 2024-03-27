import { MapRect, bareRect } from 'cc-map-util/src/rect';
import { MapPoint } from 'cc-map-util/src/pos';
import { Stack } from 'cc-map-util/src/util';
import { IChangeRecorder } from './change-record';
export interface Selection {
    bb: MapRect[];
    mapName: string;
    sizeRect: MapRect;
    data: {
        recordLog?: unknown;
        endPos?: Vec3 & {
            level: number;
        };
        startPos?: Vec3 & {
            level: number;
        };
    };
}
export declare class SelectionMapEntry<SEL extends Selection> {
    sels: SEL[];
    fileIndex: number;
    tempSel?: Omit<SEL, "sizeRect"> | undefined;
    constructor(sels: SEL[], fileIndex: number, tempSel?: Omit<SEL, "sizeRect"> | undefined);
    toJSON(): object;
}
export declare class SelectionManager<SEL extends Selection> {
    fileIndex: number;
    completeColor: string;
    tempColor: string;
    jsonFiles: string[];
    selMap: Record<string, SelectionMapEntry<SEL>>;
    inSelStack: Stack<SEL>;
    drawBoxes: boolean;
    selectStep: number;
    tempPos: MapPoint;
    selIndexes: (number | undefined)[];
    recorder?: IChangeRecorder;
    walkInListeners: ((selection: SEL) => void)[];
    walkOutListeners: ((selection: SEL) => void)[];
    constructor(fileIndex: number, completeColor: string, tempColor: string, jsonFiles: string[]);
    newSelEvent(_: SEL): Promise<void>;
    walkInEvent(selection: SEL): Promise<void>;
    walkOutEvent(selection: SEL): Promise<void>;
    onNewMapEntryEvent(): Promise<void>;
    setFileIndex(index: number): void;
    setMapEntry(map: string, entry: SelectionMapEntry<SEL>): void;
    getCurrentEntry(): SelectionMapEntry<SEL>;
    selectionCreatorBegin(): Promise<void>;
    selectionCreatorDelete(): void;
    selectionCreatorDeconstruct(): void;
    selectionCreatorSelect(): void;
    checkForEvents(pos: Vec2): void;
    checkSelForEvents(sel: SEL, vec: MapPoint, i: number): void;
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
