export declare class InputKey {
    key: ig.KEY;
    name: string;
    description: string;
    category: sc.OPTION_CATEGORY;
    hasDivider: boolean;
    header: string;
    onPress: () => void;
    parent: any;
    global: boolean;
    private id;
    constructor(key: ig.KEY, name: string, description: string, category: sc.OPTION_CATEGORY, hasDivider: boolean, header: string, onPress: () => void, parent: any, global: boolean);
    private checkForKeyPress;
    bind(): void;
    updateLabel(): void;
    onPreUpdate(): void;
}
export declare class KeyBinder {
    private keys;
    addKey(key: InputKey): void;
    bind(): void;
    updateLabels(): void;
    addHeader(name: string, displayName: string): void;
}
