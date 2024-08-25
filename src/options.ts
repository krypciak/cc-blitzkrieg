import type { Options } from 'ccmodmanager/types/mod-options'
import { PuzzleSelectionManager } from './puzzle-selection'

export let Opts: ReturnType<typeof modmanager.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

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
                    devMode: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Dev mode',
                        description: 'Probably not for you',
                        updateMenuOnChange: true,
                    },
                },
                controls: {
                    selbNewEntry: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.P },
                        hidden: () => !modmanager.options['cc-blitzkrieg'].devMode,

                        pressEvent() {
                            Opts.enable && Opts.devMode && blitzkrieg.currSel.selectionCreatorBegin()
                        },

                        name: 'Create a new selection entry',
                        description: 'duno',
                    },
                    selbSelect: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.BRACKET_OPEN },
                        hidden: () => !modmanager.options['cc-blitzkrieg'].devMode,

                        pressEvent() {
                            Opts.enable && Opts.devMode && blitzkrieg.currSel.selectionCreatorSelect()
                        },

                        name: 'Create a new selection in steps',
                        description: 'duno',
                    },
                    selbDestroy: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.BRACKET_CLOSE },
                        hidden: () => !modmanager.options['cc-blitzkrieg'].devMode,

                        pressEvent() {
                            Opts.enable && Opts.devMode && blitzkrieg.currSel.selectionCreatorDelete()
                        },

                        name: 'Delete/Decunstruct a selection',
                        description: 'duno',
                    },
                    recorderSplit: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.O },
                        hidden: () => !modmanager.options['cc-blitzkrieg'].devMode,

                        pressEvent() {
                            Opts.enable &&
                                Opts.devMode &&
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

    Opts = modmanager.registerAndGetModOptions(
        {
            modId: 'cc-blitzkrieg',
            title: 'Blitzkrieg',
            // helpMenu: Lang.help.options,
        },
        opts
    )
    return opts
}
