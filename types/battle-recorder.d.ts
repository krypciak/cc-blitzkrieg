import { ChangeRecorder } from './change-record';
import { BattleSelection, BattleSelectionManager } from './battle-selection';
export type BattleRecorderEvent = 'death' | 'spawn';
export type BattleRecorderData = {
    log: [/* frame */ number, /* path or event */ /* path or event */ string | BattleRecorderEvent, /* enemy uuid or value */ /* enemy uuid or value */ string | unknown][];
};
export declare class BattleRecorder extends ChangeRecorder<BattleSelection, BattleSelectionManager, BattleRecorderData> {
    constructor(selM: BattleSelectionManager);
    protected pushVariableChange(frame: number, event: BattleRecorderEvent, uuid: string): void;
    private pushEnemyKill;
    private pushEnemySpawn;
    protected getEmptyRecord(): BattleRecorderData;
    protected handleStopRecordingData(): void;
}
