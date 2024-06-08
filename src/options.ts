import type { Options } from 'ccmodmanager/types/mod-options'
import { PuzzleSelectionManager } from './puzzle-selection'

export let Opts: ReturnType<typeof sc.modMenu.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

export function registerOpts() {
    const opts = {
        general: {
            settings: {
                title: 'General',
                tabIcon: 'general',
            },
            headers: {
                general: {
                    enable: {
                        type: 'CHECKBOX',
                        init: true,
                        name: 'Enable the mod',
                        description: 'Enables/Disables the entire functionality of the mod',
                    },
                    enforcePuzzleSpeed: {
                        type: 'CHECKBOX',
                        init: true,
                        name: 'Enforce puzzle speed',
                        description: 'Applies the puzzle speed for unimplemented puzzle elements e.g. shock/wave balls',
                    },
                },
                controls: {
                    selbNewEntry: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.P },

                        pressEvent() {
                            Opts.enable && blitzkrieg.currSel.selectionCreatorBegin()
                        },

                        name: 'Create a new selection entry',
                        description: 'duno',
                    },
                    selbSelect: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.BRACKET_OPEN },

                        pressEvent() {
                            Opts.enable && blitzkrieg.currSel.selectionCreatorSelect()
                        },

                        name: 'Create a new selection in steps',
                        description: 'duno',
                    },
                    selbDestroy: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.BRACKET_CLOSE },

                        pressEvent() {
                            Opts.enable && blitzkrieg.currSel.selectionCreatorDelete()
                        },

                        name: 'Delete/Decunstruct a selection',
                        description: 'duno',
                    },
                    recorderSplit: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.O },

                        pressEvent() {
                            Opts.enable &&
                                blitzkrieg.currSel.recorder?.recording &&
                                blitzkrieg.currSel instanceof PuzzleSelectionManager &&
                                blitzkrieg.currSel.recorder.split()
                        },

                        name: 'Split puzzle recording',
                        description: 'duno',
                    },
                },
            },
        },
    } as const satisfies Options

    Opts = sc.modMenu.registerAndGetModOptions(
        {
            modId: 'cc-blitzkrieg',
            title: 'Blitzkrieg',
            // helpMenu: Lang.help.options,
        },
        opts
    )
    return opts
}
