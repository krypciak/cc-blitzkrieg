import { ChangeRecorder } from './change-record';
import { PuzzleSelection, PuzzleSelectionManager, PuzzleSelectionStep } from './puzzle-selection';
export type RecordedPuzzleElementsEntities = 'BounceBlock' | 'BounceSwitch';
type PuzzleRecorderData = {
    steps: Partial<PuzzleSelectionStep>[];
};
export declare class PuzzleChangeRecorder extends ChangeRecorder<PuzzleSelection, PuzzleSelectionManager, PuzzleRecorderData> {
    private currentStepIndex;
    constructor(selM: PuzzleSelectionManager);
    getCurrentTime(): number;
    private currentStep;
    protected pushVariableChange(frame: number, path: string, value: unknown): void;
    private pushAction;
    protected getEmptyRecord(): PuzzleRecorderData;
    startRecording(startingSel: PuzzleSelection): void;
    split(): void;
    private nextStep;
    protected handleStopRecordingData(): void;
}
export {};
