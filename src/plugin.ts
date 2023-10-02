import { Mod1 } from './types'

declare global {
    const blitzkrieg: Blitzkrieg
    interface Window {
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
        // vim.addAlias('blitzkrieg', 'reload-level', '', 'ingame', () => { blitzkrieg.reloadLevel() })
        // vim.addAlias('blitzkrieg', 'toggle-selection-render', '', 'ingame', () => { 
        //     blitzkrieg.puzzleSelections.toggleDrawing()
        //     blitzkrieg.battleSelections.toggleDrawing()
        //     blitzkrieg.bossSelections.toggleDrawing()
        // })
        // vim.addAlias('blitzkrieg', 'toggle-selection-outlines', 'Show/hide selections', 'ingame', () => { blitzkrieg.selectionOutlines = !blitzkrieg.selectionOutlines })

        // const insel = (ingame) => { return ingame && blitzkrieg.selectionInstance.inSelStack.length() > 0 }
        // vim.addAlias('blitzkrieg', 'puzzle-solve', '', insel, () => { blitzkrieg.selectionInstanceManager.solve() })
        // vim.addAlias('blitzkrieg', 'record-start', '', insel, () => { blitzkrieg.selectionInstanceManager.recorder.startRecording() })
        // vim.addAlias('blitzkrieg', 'record-stop', '', insel, () => { blitzkrieg.selectionInstanceManager.recorder.stopRecording() })
        // vim.addAlias('blitzkrieg', 'toogle-selection-mode', '', 'ingame', () => { blitzkrieg.selectionDialog() })
    }
}

interface BlitzkreigDebug {
    selectionOutlines: boolean
}

export default class Blitzkrieg {
    dir: string
    mod: Mod1

    debug: BlitzkreigDebug = {
        selectionOutlines: true
    }
    selectionMode: string = 'puzzle'

    constructor(mod: Mod1) {
        this.dir = mod.baseDirectory
        this.mod = mod
        window.blitzkrieg = this
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        addVimBindings()
    }

    async poststart() {
    }
}
