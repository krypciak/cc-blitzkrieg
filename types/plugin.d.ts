import { Mod1 } from './types';
import { SelectionManager, SelectionMapEntry } from './selection';
import { PuzzleCompletionType, PuzzleRoomType, PuzzleSelectionManager } from './puzzle-selection';
import { BlitzkriegMapUtil } from './map-sel-copy';
import { FsUtil } from './fsutil';
import 'nax-ccuilib/src/headers/nax/quick-menu-public-api';
declare global {
    const blitzkrieg: Blitzkrieg;
    interface Window {
        blitzkrieg: Blitzkrieg;
    }
}
interface BlitzkreigDebug {
    selectionOutlines: boolean;
    prettifySels: boolean;
}
export default class Blitzkrieg {
    dir: string;
    mod: Mod1;
    rhudmsg: (title: string, message: string, timeout: number) => void;
    syncDialog: <T extends readonly any[]>(text: string, buttons: T) => Promise<T[number]>;
    currSel: SelectionManager;
    sels: {
        puzzle: PuzzleSelectionManager;
        battle: SelectionManager;
    };
    mapUtil: BlitzkriegMapUtil;
    debug: BlitzkreigDebug;
    selectionMode: string;
    constructor(mod: Mod1);
    registerSels(): void;
    prestart(): Promise<void>;
    poststart(): Promise<void>;
    prettifyJson(json: string, printWidth?: number, tabWidth?: number): Promise<string>;
    FsUtil: typeof FsUtil;
    SelectionManager: typeof SelectionManager;
    SelectionMapEntry: typeof SelectionMapEntry;
    PuzzleSelectionManager: typeof PuzzleSelectionManager;
    PuzzleCompletionType: typeof PuzzleCompletionType;
    PuzzleRoomType: typeof PuzzleRoomType;
}
export {};
