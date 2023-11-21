export declare class Util {
    static syncDialog<T extends readonly string[]>(text: string, buttons: T): Promise<T[number]>;
    static getLevelFromZ(z: number): number;
    static waitingForPos: boolean;
    static waitForPositionKey(): Promise<Vec3 & {
        level: number;
    }>;
}
