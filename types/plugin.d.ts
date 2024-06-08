import { Mod1 } from './types';
import { SelectionManager, SelectionMapEntry } from './selection';
import { PuzzleCompletionType, PuzzleRoomType, PuzzleSelectionManager } from './puzzle-selection';
import { BlitzkriegMapUtil } from './map-sel-copy';
import { FsUtil } from './fsutil';
import { BattleSelectionManager } from './battle-selection';
import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod';
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
export default class Blitzkrieg implements PluginClass {
    dir: string;
    mod: Mod1;
    sels: {
        puzzle: PuzzleSelectionManager;
        battle: BattleSelectionManager;
    };
    currSel: (typeof this.sels)[keyof typeof this.sels];
    debug: BlitzkreigDebug;
    constructor(mod: Mod1);
    private registerSels;
    prestart(): Promise<void>;
    poststart(): Promise<void>;
    prettifyJson(json: string, printWidth?: number, tabWidth?: number): Promise<string>;
    solve(pretend?: boolean): boolean;
    rhudmsg: (title: string, message: string, timeout: number) => void;
    dialogPromise: <T extends readonly any[]>(text: string, buttons: T) => Promise<T[number]>;
    mapUtil: BlitzkriegMapUtil;
    FsUtil: typeof FsUtil;
    SelectionManager: typeof SelectionManager;
    SelectionMapEntry: typeof SelectionMapEntry;
    PuzzleSelectionManager: typeof PuzzleSelectionManager;
    PuzzleCompletionType: typeof PuzzleCompletionType;
    PuzzleRoomType: typeof PuzzleRoomType;
}
export {};
