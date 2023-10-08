import { Mod1 } from './types';
import { SelectionManager } from './selection';
import { PuzzleSelectionManager } from './puzzle-selection';
import { BlitzkriegMapUtil } from './map-sel-copy';
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
    prettifyJson(json: string, printWidth?: number, tabWidth?: number): Promise<any>;
}
export {};
