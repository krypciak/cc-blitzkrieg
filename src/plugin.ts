import { TextNotification } from 'txtnoti'
import { Mod1 } from './types'
import { SelectionManager } from 'selection'
import { isBlitzkriegEnabled, prepareTabFonts, setBlitzkriegEnabled, setupTabs } from 'tab'
import { PuzzleSelectionManager } from 'puzzle-selection'

declare global {
    const blitzkrieg: Blitzkrieg
    interface Window {
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
        vim.addAlias('blitzkrieg', 'reload-level', '', 'ingame', async () => {
            // let pos = ig.copy(ig.game.playerEntity.coll.pos)
            // let map = ig.game.mapName.split('.').join('/')
            // ig.game.loadLevel(await blitzkrieg.util.getMapObject(map, true), false, false)
            // ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
        })
        
        vim.addAlias('blitzkrieg', 'toggle-enabled', 'Toggle whether blitzkrieg is enabled or disabled', 'global', () => {
            setBlitzkriegEnabled(! isBlitzkriegEnabled())
        })
        const condition = (ingame: boolean) => ingame && isBlitzkriegEnabled() as boolean
        vim.addAlias('blitzkrieg', 'toggle-selection-render', 'Toggle selection rendering', condition, () => { 
            for (const key in blitzkrieg.sels) {
                blitzkrieg.sels[key as keyof typeof blitzkrieg.sels].toggleDrawing()
            }
        })
        vim.addAlias('blitzkrieg', 'toggle-selection-outlines', 'Toggle selections', condition, () => {
            blitzkrieg.debug.selectionOutlines = !blitzkrieg.debug.selectionOutlines
        })

        vim.addAlias('blitzkrieg', 'puzzle-solve', '', (ingame: boolean) => {
            return ingame && blitzkrieg.currSel.inSelStack.length() > 0 && blitzkrieg.currSel.name == 'puzzle'
        }, () => { (blitzkrieg.currSel as PuzzleSelectionManager).solve() })
        // vim.addAlias('blitzkrieg', 'record-start', '', insel, () => { blitzkrieg.currSel.recorder.startRecording() })
        // vim.addAlias('blitzkrieg', 'record-stop', '', insel, () => { blitzkrieg.currSel.recorder.stopRecording() })
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
    currSel!: SelectionManager
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
                isBlitzkriegEnabled() && Object.values(blitzkrieg.sels).forEach(m => m.checkForEvents(ig.game.playerEntity.coll.pos))
                return this.parent(...args)
            }
        })

        ig.Renderer2d.inject({
            drawPostLayerSprites(...args) {
                this.parent(...args)
                isBlitzkriegEnabled() && Object.values(blitzkrieg.sels).forEach(m => m.drawSelections())
            }
        })

        ig.Game.inject({
            loadLevel(...args) {
                this.parent(...args)
                Object.values(blitzkrieg.sels).forEach(m => m.onNewMapEntryEvent())
            }
        })
    }

    async prestart() {
        addVimBindings()
        this.rhudmsg = TextNotification.rhudmsg

        this.sels = {
            puzzle: new PuzzleSelectionManager()
        }
        this.currSel = this.sels.puzzle
        this.registerSels()
        setupTabs()
    }

    async poststart() {
        prepareTabFonts()
    }
}
