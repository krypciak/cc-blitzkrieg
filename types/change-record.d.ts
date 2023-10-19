import { Selection, SelectionManager } from './selection';
export interface IChangeRecorder {
    startRecording(selM: SelectionManager, startingSel: Selection): void;
    stopRecording(purge?: boolean): void;
    initPrestart(): void;
    initPoststart(): void;
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
    initPoststart(): void;
    initPrestart(): void;
    startRecording(selM: SelectionManager, startingSel: Selection): void;
    stopRecording(purge?: boolean): void;
}
