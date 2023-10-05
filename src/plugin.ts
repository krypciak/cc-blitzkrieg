import { TextNotification } from 'txtnoti'
import { Mod1 } from './types'
import { SelectionManager } from 'selection'

declare global {
    const blitzkrieg: Blitzkrieg
    interface Window {
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
        // vim.addAlias('blitzkrieg', 'reload-level', '', 'ingame', () => { blitzkrieg.reloadLevel() })
        vim.addAlias('blitzkrieg', 'toggle-selection-render', '', 'ingame', () => { 
            for (const key in blitzkrieg.sels) {
                blitzkrieg.sels[key as keyof typeof blitzkrieg.sels].toggleDrawing()
            }
        })
        vim.addAlias('blitzkrieg', 'toggle-selection-outlines', 'Show/hide selections', 'ingame', () => {
            blitzkrieg.debug.selectionOutlines = !blitzkrieg.debug.selectionOutlines
        })

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
    rhudmsg!: (title: string, message: string, timeout: number) => void
    sels!: {
        puzzle: SelectionManager
    }

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

    registerSels() {
        ig.ENTITY.Player.inject({
            update(...args) {
                Object.values(blitzkrieg.sels).forEach(m => m.checkForEvents(ig.game.playerEntity.coll.pos))
                return this.parent(...args)
            }
        })

        ig.Renderer2d.inject({
            drawPostLayerSprites(...args) {
                this.parent(...args)
                Object.values(blitzkrieg.sels).forEach(m => m.drawSelections())
            }
        })

        /*
        ig.Game.inject({
            loadLevel(...args) {
                this.parent(...args)
                Object.values(blitzkrieg.sels).forEach(m => m.onNewMapEnter())
            }
        })
        */
    }

    async prestart() {
        addVimBindings()
        this.rhudmsg = TextNotification.rhudmsg

        blitzkrieg.sels = {
            puzzle: new SelectionManager(
                'puzzle',
                '#77000044',
                '#ff222244',
                [ blitzkrieg.mod.baseDirectory + 'json/puzzleData.json', ],
                // blitzkrieg.puzzleSelectionManager.newSelEvent,
                // blitzkrieg.puzzleSelectionManager.walkInEvent,
                // blitzkrieg.puzzleSelectionManager.walkOutEvent,
            )
        }
        this.registerSels()
    }

    async poststart() {
    }
}
