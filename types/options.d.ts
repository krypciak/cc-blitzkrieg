export declare const categoryName = "blitzkrieg";
declare global {
    namespace sc {
        enum OPTION_CATEGORY {
            'blitzkrieg'
        }
    }
}
export declare class MenuOptions {
    static get blitzkriegEnabled(): boolean;
    static set blitzkriegEnabled(value: boolean);
    static get puzzleElementAdjustEnabled(): boolean;
    static set puzzleElementAdjustEnabled(value: boolean);
    static initPrestart(): void;
    static initPoststart(): void;
}
