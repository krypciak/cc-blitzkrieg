import { Selection, SelectionManager } from './selection';
export interface IChangeRecorder {
    startRecording(startingSel: Selection): void;
    stopRecording(purge?: boolean): void;
    recording: boolean;
}
export declare abstract class ChangeRecorder<SEL extends Selection, SELM extends SelectionManager<SEL>, T> implements IChangeRecorder {
    selM: SELM;
    ignoreSet: Set<string>;
    recording: boolean;
    currentRecord: T;
    startingSel: SEL;
    startTick: number;
    getCurrentTime(): number;
    constructor(selM: SELM, ignoreSet: Set<string>);
    protected abstract getEmptyRecord(): T;
    protected abstract pushVariableChange(frame: number, path: string, value: unknown): void;
    startRecording(startingSel: SEL): void;
    stopRecording(purge?: boolean): void;
    protected abstract handleStopRecordingData(): void;
}
