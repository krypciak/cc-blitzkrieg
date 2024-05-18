import { Selection, SelectionManager } from './selection';
export interface BattleSelection extends Selection {
    data: {
        endPos: Vec3 & {
            level: number;
        };
        startPos: Vec3 & {
            level: number;
        };
        type: BATTLE_TYPE;
        difficulty: number;
        timeLength: number;
        chapter: number;
        plotLine: number;
        elements: [boolean, boolean, boolean, boolean];
    };
}
declare const BattleType: {
    readonly Normal: 0;
    readonly Boss: 1;
};
type BATTLE_TYPE = (typeof BattleType)[keyof typeof BattleType];
export declare class BattleSelectionManager extends SelectionManager<BattleSelection> {
    constructor();
    newSelEvent(sel: Selection): Promise<void>;
    finalizeSel(sel: Selection): Promise<void>;
}
export {};
