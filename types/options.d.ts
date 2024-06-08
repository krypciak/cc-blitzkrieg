export declare let Opts: ReturnType<typeof sc.modMenu.registerAndGetModOptions<ReturnType<typeof registerOpts>>>;
export declare function registerOpts(): {
    readonly general: {
        readonly settings: {
            readonly title: "General";
            readonly tabIcon: "general";
        };
        readonly headers: {
            readonly general: {
                readonly enable: {
                    readonly type: "CHECKBOX";
                    readonly init: true;
                    readonly name: "Enable the mod";
                    readonly description: "Enables/Disables the entire functionality of the mod";
                };
                readonly enforcePuzzleSpeed: {
                    readonly type: "CHECKBOX";
                    readonly init: true;
                    readonly name: "Enforce puzzle speed";
                    readonly description: "Applies the puzzle speed for unimplemented puzzle elements e.g. shock/wave balls";
                };
            };
            readonly controls: {
                readonly selbNewEntry: {
                    readonly type: "CONTROLS";
                    readonly init: {
                        readonly key1: ig.KEY.P;
                    };
                    readonly pressEvent: () => void;
                    readonly name: "Create a new selection entry";
                    readonly description: "duno";
                };
                readonly selbSelect: {
                    readonly type: "CONTROLS";
                    readonly init: {
                        readonly key1: ig.KEY.BRACKET_OPEN;
                    };
                    readonly pressEvent: () => void;
                    readonly name: "Create a new selection in steps";
                    readonly description: "duno";
                };
                readonly selbDestroy: {
                    readonly type: "CONTROLS";
                    readonly init: {
                        readonly key1: ig.KEY.BRACKET_CLOSE;
                    };
                    readonly pressEvent: () => void;
                    readonly name: "Delete/Decunstruct a selection";
                    readonly description: "duno";
                };
                readonly recorderSplit: {
                    readonly type: "CONTROLS";
                    readonly init: {
                        readonly key1: ig.KEY.O;
                    };
                    readonly pressEvent: () => void;
                    readonly name: "Split puzzle recording";
                    readonly description: "duno";
                };
            };
        };
    };
};
