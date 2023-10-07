import { bareRect } from 'cc-map-util/rect';
import { MapPoint } from 'cc-map-util/src/pos';
import { Stack } from 'cc-map-util/util';
import { ChangeRecorder } from './change-record';
export interface Selection {
    bb: bareRect[];
    mapName: string;
    sizeRect: bareRect;
    data?: any;
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
    tempPos: Vec2;
    selIndexes: number[];
    recorder?: ChangeRecorder;
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
    loadAll(): Promise<void>;
}
