import { TextNotification } from './txtnoti'
import { Mod1 } from './types'
import { SelectionManager, SelectionMapEntry } from './selection'
import { getBlitzkriegTabIndex, isBlitzkriegEnabled, prepareTabFonts, setBlitzkriegEnabled, setupTabs } from './tab'
import { PuzzleCompletionType, PuzzleRoomType, PuzzleSelectionManager } from './puzzle-selection'
import { InputKey, KeyBinder } from './keybinder'
import { BlitzkriegMapUtil } from './map-sel-copy'
import { FsUtil } from './fsutil'

import * as prettier from './prettier/standalone.mjs'
import prettierPluginBabel from './prettier/babel.mjs'
import prettierPluginEstree from './prettier/estree.mjs'

declare global {
    const blitzkrieg: Blitzkrieg
    interface Window {
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
        vim.addAlias('blitzkrieg', 'reload-level', '', 'ingame', async () => {
            let pos = ig.copy(ig.game.playerEntity.coll.pos)
            let map = ig.game.mapName.split('.').join('/')
            ig.game.loadLevel(await blitzkrieg.mapUtil.getMapObject(map, true), false, false)
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
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

        const isInPuzzleSel = (ingame: boolean) => ingame && blitzkrieg.currSel.inSelStack.length() > 0 && blitzkrieg.currSel.name == 'puzzle'
        vim.addAlias('blitzkrieg', 'puzzle-solve', '', isInPuzzleSel,
            () => { (blitzkrieg.currSel as PuzzleSelectionManager).solve() })
        vim.addAlias('blitzkrieg', 'puzzle-set-speed', '', isInPuzzleSel,
            (speed: string) => { (blitzkrieg.currSel as PuzzleSelectionManager).setSpeed(parseFloat(speed)) }, [
                { type: 'number', description: 'Speed value' }
        ])

        vim.addAlias('blitzkrieg', 'record-start', '', (ingame: boolean) => ingame && !!blitzkrieg.currSel.recorder && blitzkrieg.currSel.inSelStack.length() > 0,
            () => { blitzkrieg.currSel.recorder?.startRecording(blitzkrieg.currSel, blitzkrieg.currSel.inSelStack.peek()) })
        vim.addAlias('blitzkrieg', 'record-stop', '', (ingame: boolean) => ingame && !!blitzkrieg.currSel.recorder?.recording,
            (purge: string) => { blitzkrieg.currSel.recorder!.stopRecording(purge as unknown as boolean) }, [
            { type: 'boolean', description: 'Leave empty to save data' }])

        // vim.addAlias('blitzkrieg', 'toogle-selection-mode', '', 'ingame', () => { blitzkrieg.selectionDialog() })
    }
}

function adjustPuzzleAssistSlider() {
    sc.ASSIST_PUZZLE_SPEED = {
        LOW5: 0.5,
        LOW4: 0.6,
        LOW3: 0.7,
        LOW2: 0.8,
        LOW1: 0.9,
        NORM: 1,
        HIGH1: 1.1,
        HIGH2: 1.2,
        HIGH3: 1.3,
        HIGH4: 1.4,
        HIGH5: 1.5,
        HIGH6: 1.6,
        HIGH7: 1.7,
        HIGH8: 1.8,
        HIGH9: 1.9,
        HIGH10: 2,
    }
    sc.OPTIONS_DEFINITION['assist-puzzle-speed'] = {
        type: 'OBJECT_SLIDER',
        data: sc.ASSIST_PUZZLE_SPEED,
        init: sc.ASSIST_PUZZLE_SPEED.NORM,
        cat: sc.OPTION_CATEGORY.ASSISTS,
        fill: true,
        showPercentage: true,
        hasDivider: true,
        header: 'puzzle',
    }
}

const kb: KeyBinder = new KeyBinder()
function bindKeys() {
    kb.addKey(new InputKey(
        ig.KEY.P, 'selb-newentry', 'Create a new selection entry', getBlitzkriegTabIndex(), true, 'blitzkrieg', () => {
            isBlitzkriegEnabled() && blitzkrieg.currSel.selectionCreatorBegin()
        }, null, false))
    kb.addKey(new InputKey(
        ig.KEY.BRACKET_OPEN, 'selb-select', 'Create a new selection in steps', getBlitzkriegTabIndex(), false, 'blitzkrieg', () => {
            isBlitzkriegEnabled() && blitzkrieg.currSel.selectionCreatorSelect()
        }, null, false))
    kb.addKey(new InputKey(
        ig.KEY.BRACKET_CLOSE, 'selb-destroy', 'Delete/Decunstruct a selection', getBlitzkriegTabIndex(), false, 'blitzkrieg', () => {
            isBlitzkriegEnabled() && blitzkrieg.currSel.selectionCreatorDelete()
        }, null, false))

    kb.bind()
}

interface BlitzkreigDebug {
    selectionOutlines: boolean
    prettifySels: boolean
}

export default class Blitzkrieg {
    dir: string
    mod: Mod1
    rhudmsg!: (title: string, message: string, timeout: number) => void
    currSel!: SelectionManager
    sels!: {
        puzzle: PuzzleSelectionManager
        battle: SelectionManager
    }
    mapUtil!: BlitzkriegMapUtil

    debug: BlitzkreigDebug = {
        selectionOutlines: false,
        prettifySels: true,
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
                isBlitzkriegEnabled() && Object.values(blitzkrieg.sels).forEach(m => m.onNewMapEntryEvent())
            }
        })

        Object.values(blitzkrieg.sels).forEach(m => m.recorder?.injectRecordingPrestart())
    }

    async prestart() {
        addVimBindings()
        adjustPuzzleAssistSlider()
        this.rhudmsg = TextNotification.rhudmsg
        this.mapUtil = new BlitzkriegMapUtil()

        this.sels = {
            puzzle: new PuzzleSelectionManager(),
            battle: new SelectionManager('battle', '#00770044', '#22ff2244', [ blitzkrieg.mod.baseDirectory + 'json/battleData.json' ]),
        }
        this.currSel = this.sels.puzzle
        this.registerSels()
        setupTabs()

        bindKeys()

        ig.ENTITY.Crosshair.inject({
            init(...args) {
                this.parent(...args)
                ig.game.playerEntityCrosshairInstance = this
            },
            deferredUpdate(): void {
                this.parent()
                const radians = Math.atan2(this._aimDir.y, this._aimDir.x)
                ig.game.playerEntity.aimDegrees = (radians * 180) / Math.PI
            }
        })
    }

    async poststart() {
        prepareTabFonts()

        kb.addHeader('blitzkrieg', 'blitzkrieg')
        kb.updateLabels()
    }

    async prettifyJson(json: string, printWidth: number = 200, tabWidth: number = 4) {
        return await prettier.format(json, { 
            parser: 'json',
            plugins: [prettierPluginBabel, prettierPluginEstree],
            tabWidth,
            semi: false,
            printWidth,
            bracketSameLine: true,
        })
    }

    /* global classes */
    FsUtil = FsUtil
    SelectionManager = SelectionManager
    SelectionMapEntry = SelectionMapEntry
    PuzzleSelectionManager = PuzzleSelectionManager
    PuzzleCompletionType = PuzzleCompletionType
    PuzzleRoomType = PuzzleRoomType
    /* global classes end */
}
