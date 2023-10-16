import { IChangeRecorder } from './change-record';
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection';
export type RecordedPuzzleElementsEntities = 'BounceBlock' | 'BounceSwitch';
export declare class PuzzleChangeRecorder implements IChangeRecorder {
    recording: boolean;
    currentRecord: {
        steps: Partial<PuzzleSelectionStep>[];
    };
    _loopIndex: number;
    get loopIndex(): number;
    set loopIndex(value: number);
    selM: PuzzleSelectionManager;
    startingSel: PuzzleSelection;
    tps: number;
    recordIgnoreSet: Set<string>;
    constructor();
    currentStepIndex: number;
    currentStep(): Partial<PuzzleSelectionStep>;
    pushLog(path: string, value: any): void;
    pushLog(action: string, pos: Vec2, type: RecordedPuzzleElementsEntities): void;
    injectRecordingPrestart(): void;
    split(): void;
    private nextStep;
    startRecording(selM: PuzzleSelectionManager, startingSel: PuzzleSelection): void;
    stopRecording(purge?: boolean): void;
}
