export declare class Util {
    static syncDialog(text: string, buttons: string[]): Promise<string>;
    static waitingForPos: boolean;
    static waitForPositionKey(): Promise<Vec3 & {
        level: number;
    }>;
}
