import { Selection, SelectionManager } from './selection';
import { PuzzleChangeRecorder, RecordedPuzzleElementsEntities } from './puzzle-recorder';
export declare enum PuzzleRoomType {
    WholeRoom = 0,
    AddWalls = 1,
    Dis = 2
}
export declare enum PuzzleCompletionType {
    Normal = 0,
    GetTo = 1,
    Item = 2
}
export interface PuzzleSelectionStep {
    log: (([/* frame */ number, /* var path */ string, /* value */ any]) | ([/* frame */ number, /* entity Vec2 */ Vec2, /* entity type */ RecordedPuzzleElementsEntities, /* action */ string]))[];
    pos: Vec3 & {
        level: number;
    };
    shootAngle?: number;
    element: sc.ELEMENT;
    endFrame: number;
    split?: boolean;
    shotCount?: number;
    lastShotFrame?: number;
}
export interface PuzzleSelection extends Selection {
    data: {
        puzzleSpeed: number;
        difficulty: number;
        timeLength: number;
        completionType: PuzzleCompletionType;
        type: PuzzleRoomType;
        chapter: number;
        plotLine: number;
        startPos: Vec3 & {
            level: number;
        };
        endPos: Vec3 & {
            level: number;
        };
        elements: [boolean, boolean, boolean, boolean];
        recordLog?: {
            steps: PuzzleSelectionStep[];
        };
    };
}
export declare class PuzzleSelectionManager extends SelectionManager {
    recorder: PuzzleChangeRecorder;
    incStep: number;
    changeModifiers: boolean;
    changeSpeed: boolean;
    fakeBuffItemId: number;
    modifiersActive: boolean;
    fakeBuffActive: boolean;
    constructor();
    updatePuzzleSpeed(sel: PuzzleSelection): void;
    createFakeBuff(): void;
    destroyFakeBuff(): void;
    setSpeed(val: number): void;
    walkInEvent(sel: PuzzleSelection): Promise<void>;
    walkOutEvent(): Promise<void>;
    newSelEvent(sel: Selection): Promise<void>;
    finalizeSel(sel1: Selection): Promise<void>;
    solve(): void;
    solveSel(sel: PuzzleSelection, delay?: number): void;
    static getEntityByPos(pos: Vec2): ig.Entity;
    static getPuzzleSolveCondition(sel: PuzzleSelection): [string, any] | undefined;
}
