import { IChangeRecorder } from './change-record';
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection';
export declare class PuzzleChangeRecorder implements IChangeRecorder {
    tps: number;
    recording: boolean;
    currentRecord: {
        steps: Partial<PuzzleSelectionStep>[];
    };
    loopIndex: number;
    selM: PuzzleSelectionManager;
    startingSel: PuzzleSelection;
    constructor(tps: number);
    currentStepIndex: number;
    injectRecordingPrestart(): void;
    private nextStep;
    startRecording(selM: PuzzleSelectionManager, startingSel: PuzzleSelection): void;
    stopRecording(purge?: boolean): void;
}
