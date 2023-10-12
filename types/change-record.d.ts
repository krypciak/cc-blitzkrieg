import { Selection, SelectionManager } from './selection';
export interface IChangeRecorder {
    startRecording(selM: SelectionManager, startingSel: Selection): void;
    stopRecording(): void;
    injectRecordingPrestart(): void;
    recording: boolean;
}
export declare class ChangeRecorder implements IChangeRecorder {
    tps: number;
    recording: boolean;
    currentRecord: {
        log: ([/* frame */ number, /* var path */ string, /* value */ any])[];
    };
    loopIndex: number;
    selM: SelectionManager;
    startingSel: Selection;
    constructor(tps: number);
    injectRecordingPrestart(): void;
    startRecording(selM: SelectionManager, startingSel: Selection): void;
    stopRecording(): void;
}
