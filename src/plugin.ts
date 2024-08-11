import { TextNotification } from './txtnoti'
import { Mod1 } from './types'
import { SelectionManager, SelectionMapEntry } from './selection'
import { PuzzleCompletionType, PuzzleRoomType, PuzzleSelectionManager } from './puzzle-selection'
import { BlitzkriegMapUtil } from './map-sel-copy'
import { FsUtil } from './fsutil'
import { BattleSelectionManager } from './battle-selection'
import { puzzleAssistSpeedInitPrestart } from './puzzle-assist-speed'
import { Util } from './util'

import type * as _ from 'nax-ccuilib/src/headers/nax/quick-menu-public-api.d.ts'

import * as prettier from 'prettier/standalone'
import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginEstree from 'prettier/plugins/estree'
import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { Opts, registerOpts } from './options'
import { initLibraries } from './library-providers'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

declare global {
    const blitzkrieg: Blitzkrieg
    interface Window {
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) {
        /* optional dependency https://github.com/krypciak/cc-vim */
        const condition = (ingame: boolean) => ingame && (Opts.enable as boolean)
        vim.addAlias('blitzkrieg', 'toggle-selection-render', 'Toggle selection rendering', condition, () => {
            Object.values(blitzkrieg.sels).forEach(manager => manager.toggleDrawing())
        })
        vim.addAlias('blitzkrieg', 'toggle-selection-outlines', 'Toggle selections', condition, () => {
            blitzkrieg.debug.selectionOutlines = !blitzkrieg.debug.selectionOutlines
        })

        const isInPuzzleSel = (ingame: boolean) =>
            ingame && blitzkrieg.currSel.inSelStack.length() > 0 && blitzkrieg.currSel instanceof PuzzleSelectionManager
        vim.addAlias(
            'blitzkrieg',
            'solve',
            '',
            ingame => ingame && blitzkrieg.solve(true),
            () => blitzkrieg.solve()
        )
        vim.addAlias(
            'blitzkrieg',
            'puzzle-set-speed',
            '',
            isInPuzzleSel,
            (speed: string) => {
                blitzkrieg.sels.puzzle.setSpeed(parseFloat(speed))
            },
            [{ type: 'number', description: 'Speed value' }]
        )

        vim.addAlias(
            'blitzkrieg',
            'record-start',
            '',
            (ingame: boolean) => ingame && !!blitzkrieg.currSel.recorder && blitzkrieg.currSel.inSelStack.length() > 0,
            () => {
                blitzkrieg.currSel.recorder?.startRecording(blitzkrieg.currSel.inSelStack.peek() as any)
            }
        )
        vim.addAlias(
            'blitzkrieg',
            'record-stop',
            '',
            (ingame: boolean) => ingame && !!blitzkrieg.currSel.recorder?.recording,
            (purge: string) => {
                blitzkrieg.currSel.recorder!.stopRecording(purge as unknown as boolean)
            },
            [{ type: 'boolean', description: 'Leave empty to save data' }]
        )

        vim.addAlias(
            'blitzkrieg',
            'toogle-selection-mode',
            '',
            'ingame',
            (mode?: string) => {
                if (!mode) return
                blitzkrieg.currSel = blitzkrieg.sels[mode as keyof typeof blitzkrieg.sels]
            },
            [
                {
                    type: 'string',
                    description: 'type',
                    possibleArguments() {
                        return Object.keys(blitzkrieg.sels).map(name => ({
                            value: name,
                            keys: [name],
                            display: [name],
                        }))
                    },
                },
            ]
        )
    }
}

function addWidgets() {
    if (window.nax?.ccuilib?.QuickRingMenuWidgets) {
        /* optional dependency https://github.com/krypciak/cc-diorbital-menu */
        nax.ccuilib.QuickRingMenuWidgets.addWidget({
            name: 'cc-blitzkrieg_puzzleSkip',
            title: 'Skip puzzle',
            description: "Skip the puzzle you're standing in right now.",
            pressEvent: () => blitzkrieg.solve(),
            image: () => ({
                gfx: new ig.Image('media/gui/menu.png'),
                srcPos: { x: 624, y: 0 },
                pos: { x: 8, y: 6 },
                size: { x: 16, y: 16 },
            }),
        })
    }
}

interface BlitzkreigDebug {
    selectionOutlines: boolean
    prettifySels: boolean
}

export default class Blitzkrieg implements PluginClass {
    dir: string
    mod: Mod1
    sels!: {
        puzzle: PuzzleSelectionManager
        battle: BattleSelectionManager
    }
    currSel!: (typeof this.sels)[keyof typeof this.sels]

    debug: BlitzkreigDebug = {
        selectionOutlines: false,
        prettifySels: true,
    }

    constructor(mod: Mod1) {
        this.dir = mod.baseDirectory
        this.mod = mod
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')

        window.blitzkrieg = this
    }

    private registerSels() {
        ig.ENTITY.Player.inject({
            update(...args) {
                Opts.enable &&
                    Object.values(blitzkrieg.sels).forEach(m => m.checkForEvents(ig.game.playerEntity.coll.pos))
                return this.parent(...args)
            },
        })

        ig.Renderer2d.inject({
            drawPostLayerSprites(...args) {
                this.parent(...args)
                Opts.enable && Object.values(blitzkrieg.sels).forEach(m => m.drawSelections())
            },
        })

        ig.Game.inject({
            loadLevel(...args) {
                this.parent(...args)
                Opts.enable && Object.values(blitzkrieg.sels).forEach(m => m.onNewMapEntryEvent())
            },
        })
    }

    async prestart() {
        initLibraries()
        registerOpts()
        addVimBindings()
        addWidgets()
        puzzleAssistSpeedInitPrestart()
        this.rhudmsg = TextNotification.rhudmsg
        this.mapUtil = new BlitzkriegMapUtil()
        this.dialogPromise = Util.syncDialog

        ig.Game.inject({
            update() {
                this.parent()
                if (!this.paused && !ig.loading && !sc.model.isTitle()) {
                    ig.game.now += ig.system.tick * 1000
                }
            },
        })

        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.uuid = crypto.createHash('sha256').update(`${settings.name}-${x},${y}`).digest('hex')
            },
        })

        this.sels = {
            puzzle: new PuzzleSelectionManager(),
            battle: new BattleSelectionManager(),
        }
        Object.values(this.sels).map(sm => sm.loadAll())
        this.currSel = this.sels.puzzle
        this.registerSels()

        ig.ENTITY.Crosshair.inject({
            deferredUpdate(): void {
                this.parent()
                const radians = Math.atan2(this._aimDir.y, this._aimDir.x)
                ig.game.playerEntity.aimDegrees = ((radians * 180) / Math.PI + 360) % 360
            },
        })
    }

    async poststart() {
        ig.game.now = 0
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

    /* exported stuff */
    public solve(pretend: boolean = false): boolean {
        if (blitzkrieg.sels.puzzle.inSelStack.length() > 0) {
            !pretend && blitzkrieg.sels.puzzle.solve()
            return true
        }
        return false
    }

    rhudmsg!: (title: string, message: string, timeout: number) => void
    dialogPromise!: <T extends readonly any[]>(text: string, buttons: T) => Promise<T[number]>
    mapUtil!: BlitzkriegMapUtil

    FsUtil = FsUtil
    SelectionManager = SelectionManager
    SelectionMapEntry = SelectionMapEntry
    PuzzleSelectionManager = PuzzleSelectionManager
    PuzzleCompletionType = PuzzleCompletionType
    PuzzleRoomType = PuzzleRoomType
}
