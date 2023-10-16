export const categoryName = 'blitzkrieg'
declare global {
    namespace sc {
        enum OPTION_CATEGORY {
            'blitzkrieg'
        }
    }
}

const headerGeneral: string = 'blitzkrieg-general'
const descriptionId = 'blitzkrieg-description'
const enableId = 'blitzkrieg-enable'
const puzzleElementsAdjustId = 'blitzkrieg-puzzleelementsadjust'


export class MenuOptions {
    static get blitzkriegEnabled(): boolean { return sc.options?.get(enableId) as boolean }
    static set blitzkriegEnabled(value: boolean) { sc.options?.set(enableId, value) }

    static get puzzleElementAdjustEnabled(): boolean { return sc.options?.get(puzzleElementsAdjustId) as boolean && MenuOptions.blitzkriegEnabled }
    static set puzzleElementAdjustEnabled(value: boolean) { sc.options?.set(puzzleElementsAdjustId, value) }

    static initPrestart() {
        sc.OPTIONS_DEFINITION[descriptionId] = {
            type: 'INFO',
            data: `options.${descriptionId}.description`,
            cat: sc.OPTION_CATEGORY[categoryName],
        }

        sc.OPTIONS_DEFINITION[enableId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY[categoryName],
            header: headerGeneral,
            hasDivider: true
        }
        sc.OPTIONS_DEFINITION[puzzleElementsAdjustId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY[categoryName],
            header: headerGeneral,
        }
    }

    static initPoststart() {
        ig.lang.labels.sc.gui.options.headers[headerGeneral] = 'general'
        ig.lang.labels.sc.gui.options[descriptionId] = {
            description: '\\c[3]https://github.com/krypciak/cc-blitzkrieg\\c[0]'
        }
        ig.lang.labels.sc.gui.options[enableId] = {
            name: 'Enable the mod',
            description: 'Enables/Disables the entire functionality of the mod'
        }
        ig.lang.labels.sc.gui.options[puzzleElementsAdjustId] = {
            name: 'Enforce puzzle speed',
            description: 'Applies the puzzle speed for unimplemented puzzle elements e.g. shock/wave balls'
        }
    }
}
