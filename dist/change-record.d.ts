import { PuzzleSelection } from './puzzle-selection';
import { Selection, SelectionManager } from './selection';
export declare class ChangeRecorder {
    tps: number;
    recording: boolean;
    currentRecord: PuzzleSelection['data']['recordLog'];
    loopIndex: number;
    selM: SelectionManager;
    startingSel: Selection;
    constructor(tps: number);
    injectRecordingPrestart(): void;
    startRecording(selM: SelectionManager, startingSel: Selection): void;
    stopRecording(): void;
}
