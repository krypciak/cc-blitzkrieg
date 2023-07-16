import { PuzzleRecordManager } from './puzzle-record.js'
import { PuzzleSelectionManager } from './puzzle-selection.js'
import { BattleSelectionManager } from './battle-selection.js'
import { BattleReplayManager } from './battle-replay.js'
import { SelectionCopyManager } from './selection-copy.js'
import { MapArranger } from './map-arrange.js'
import { Selections } from './selection.js'
import { Util } from './util.js'
import { TextNotification } from './text-notification.js'

export default class Blitzkrieg extends Plugin {
    constructor(mod) {
        super()
        this.mod = mod
    }

    bindKeys(keys, category) {
        for (let keyName in keys) {
            let key = keys[keyName]
            sc.OPTIONS_DEFINITION['keys-' + keyName] = {
                type: 'CONTROLS',
                init: { key1: key.key },
                cat: category,
                hasDivider: key.hasDivider,
                header: key.header,
            }
        }

        ig.ENTITY.Player.inject({
            update(...args) {
                for (let keyName in keys) {
                    let key = keys[keyName]
                    if (ig.input.state(keyName)) {
                        if ( ! key._pressed) {
                            key._pressed = true
                            key.func.bind(key.parent)()
                        }
                    } else key._pressed = false
                }

                return this.parent(...args)
            }
        })
    }

    updateKeybindingLabels() {
        ig.lang.labels.sc.gui.options.headers['blitzkrieg-keybindings'] = 'keybindings'
        ig.lang.labels.sc.gui.options['blitzkrieg-keybindings'] = { name: 'test', desc: 'Check to enable puzzle area creation keybindings' }

        for (let keyName in this.keys) {
            let key = this.keys[keyName]
            ig.lang.labels.sc.gui.options.controls.keys[keyName] = key.desc
        }
    }

    registerEvents() {
        ig.ENTITY.Player.inject({
            update(...args) {
                let pos = ig.game.playerEntity.coll.pos
                ig.blitzkrieg.puzzleSelections.checkForEvents(pos)
                ig.blitzkrieg.battleSelections.checkForEvents(pos)
                return this.parent(...args)
            }
        })

        ig.Renderer2d.inject({
            drawPostLayerSprites(...args) {
                this.parent(...args)
                ig.blitzkrieg.puzzleSelections.drawSelections()
                ig.blitzkrieg.battleSelections.drawSelections()
            }
        })

        ig.Game.inject({
            loadLevel(...args) {
                this.parent(...args)
                ig.blitzkrieg.puzzleSelections.onNewMapEnter()
                ig.blitzkrieg.battleSelections.onNewMapEnter()
            }
        })

        sc.OptionsTabBox.inject({
            init(...args) {
                this.parent(...args)
                ig.blitzkrieg.setupTabEvent(this)
            }
        })
    }

    toogleSelectionMode() {
        ig.blitzkrieg.selectionMode = ! ig.blitzkrieg.selectionMode
        ig.blitzkrieg.msg('blitzkrieg', 'Switched selection mode to: ' + (ig.blitzkrieg.selectionMode ? 'puzzle' : 'battle'), 2)
    }

    bindingCreate() {
        (ig.blitzkrieg.selectionMode ? ig.blitzkrieg.puzzleSelections : ig.blitzkrieg.battleSelections).create()
    }
    bindingCreateSel() {
        (ig.blitzkrieg.selectionMode ? ig.blitzkrieg.puzzleSelections : ig.blitzkrieg.battleSelections).select()
    }
    bindingDeleteSel() {
        (ig.blitzkrieg.selectionMode ? ig.blitzkrieg.puzzleSelections : ig.blitzkrieg.battleSelections).delete()
    }
    bindingRecord() {
        (ig.blitzkrieg.selectionMode ? ig.blitzkrieg.puzzleRecordManager : ig.blitzkrieg.battleSelectionManager).toogleRecording()
    }
    bindingSolveFast() {
        if (ig.blitzkrieg.selectionMode) {
            ig.blitzkrieg.puzzleRecordManager.solveFast()
        } else {
            ig.blitzkrieg.battleSelectionManager.restoreData(ig.blitzkrieg.battleSelections.inSelStack.peek())
        }
    }
    bindingToogleRender() {
        ig.blitzkrieg.puzzleSelections.toogleDrawing()
        ig.blitzkrieg.battleSelections.toogleDrawing()
    }

    async reloadLevel() {
        let pos = ig.copy(ig.game.playerEntity.coll.pos)
        let map = ig.game.mapName.split('.').join('/')
        ig.game.loadLevel(await ig.blitzkrieg.util.getMapObject(map), false, false)
        ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)

    }
    
    async prestart() {
        ig.blitzkrieg = this
        ig.blitzkrieg.tilesize = 16
        ig.blitzkrieg.name = 'BLITZKRIEG'
        ig.blitzkrieg.displayName = 'Blitzkrieg'
        ig.blitzkrieg.selectionMode = true

        TextNotification.init()
        ig.blitzkrieg.msg = TextNotification.msg
        ig.blitzkrieg.util = new Util()


        ig.blitzkrieg.puzzleRecordManager = new PuzzleRecordManager()
        ig.blitzkrieg.puzzleSelectionManager = new PuzzleSelectionManager()

        ig.blitzkrieg.puzzleSelections = new Selections(
            '#77000044',
            '#ff222244',
            ig.blitzkrieg.mod.baseDirectory + 'json/puzzleData.json',
            ig.blitzkrieg.puzzleSelectionManager.newSelEvent,
            ig.blitzkrieg.puzzleSelectionManager.walkInEvent,
            ig.blitzkrieg.puzzleSelectionManager.walkOutEvent,
        )

        ig.blitzkrieg.selectionCopyManager = new SelectionCopyManager()

        ig.blitzkrieg.mapArranger = new MapArranger()


        ig.blitzkrieg.battleSelectionManager = new BattleSelectionManager()
        ig.blitzkrieg.battleReplayManager = new BattleReplayManager()

        ig.blitzkrieg.battleSelections = new Selections(
            '#00770044',
            '#22ff2244',
            ig.blitzkrieg.mod.baseDirectory + 'json/battleData.json',
            (sel) => {
                // ig.blitzkrieg.msg('blitzkrieg', 'new selection', 2)
                ig.blitzkrieg.battleSelectionManager.addData(sel)
            },
            () => {
                // ig.blitzkrieg.msg('blitzkrieg', 'walked into selection', 2)
            },
            () => {
                // ig.blitzkrieg.msg('blitzkrieg', 'walked out of selection', 2)
            },
        )
        ig.blitzkrieg.keys = {
            'selection-toogle':          { desc: 'Toogle selection mode',          func: ig.blitzkrieg.toogleSelectionMode,
                key: ig.KEY.MINUS,         header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },

            'puzzle-create':             { desc: 'Create a new entry',             func: ig.blitzkrieg.bindingCreate,
                key: ig.KEY.P,             header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },
            'puzzle-selection-create':   { desc: 'Create a selection',             func: ig.blitzkrieg.bindingCreateSel, 
                key: ig.KEY.BRACKET_OPEN,  header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },
            'puzzle-selection-delete':   { desc: 'Delete a selection/puzzle',      func: ig.blitzkrieg.bindingDeleteSel, 
                key: ig.KEY.BRACKET_CLOSE, header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },
            'puzzle-record-toogle':      { desc: 'Toogle game state recording',    func: ig.blitzkrieg.bindingRecord,
                key: ig.KEY._8,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },
            'selection-render-toogle':   { desc: 'Toogle selection rendering',     func: ig.blitzkrieg.bindingToogleRender,
                key: ig.KEY.SINGLE_QUOTE, header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },

            // 'puzzle-solve':              { desc: 'Solve puzzle',                   func: ig.blitzkrieg.puzzleRecordManager.solve,
            //     key: ig.KEY._6,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.puzzleRecordManager },
            'puzzle-solve-fast':         { desc: 'Solve puzzle (instant)',        func: ig.blitzkrieg.bindingSolveFast,
                key: ig.KEY._7,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },

            // 'puzzle-increse-speed':      { desc: 'Increse selection puzzle data',  func: ig.blitzkrieg.puzzleSpeedManager.inc, 
            //     key: ig.KEY._0,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.puzzleSpeedManager },
            // 'puzzle-decrese-speed':      { desc: 'Decrese selection puzzle speed', func: ig.blitzkrieg.puzzleSpeedManager.dec, 
            //     key: ig.KEY._9,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.puzzleSpeedManager },
            // 'begin-battle':      { desc: 'begin battle',  func: ig.blitzkrieg.battleReplayManager.prepareBattles, 
            //     key: ig.KEY._0,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.battleReplayManager },
            // 'next-battle':      { desc: 'next battle', func: ig.blitzkrieg.battleReplayManager.nextBattle, 
            //     key: ig.KEY._9,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.battleReplayManager },

            'copy-selection':   { desc: 'copy selection', func: ig.blitzkrieg.selectionCopyManager.copy, 
                key: ig.KEY._6,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.selectionCopyManager },
            //'arrange-maps':     { desc: 'arrange maps', func: ig.blitzkrieg.mapArranger.arrange, 
            //    key: ig.KEY._5,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg.mapArranger },
            
            'reload-level':     { desc: 'Reload level',   func: ig.blitzkrieg.reloadLevel, 
                key: ig.KEY.BACKSPACE,     header: 'blitzkrieg-keybindings', hasDivider: false, parent: ig.blitzkrieg },
        }
        ig.blitzkrieg.setupTabs()
        ig.blitzkrieg.bindKeys(ig.blitzkrieg.keys, sc.OPTION_CATEGORY.BLITZKRIEG)
        ig.blitzkrieg.registerEvents()

        ig.blitzkrieg.loaded = true
    }

    adjustPuzzleAssistSlider() {
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

    async main() {
        ig.blitzkrieg.updateKeybindingLabels()
        ig.blitzkrieg.adjustPuzzleAssistSlider()
        ig.blitzkrieg.prepareTabFonts()
    }


    
    // all 3 functions borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js
    _findIconSet() {
        const font = sc.fontsystem.font
		
        for (const key in font) {
            if (typeof font[key] === 'object' && font[key].constructor.name === 'Array' && font[key].length > 0) {
                if (font[key][0].constructor === ig.Font) {
                    return font[key]
                }
            }
        }
        return null
    }
    _findMapping(){
        const font = sc.fontsystem.font
        
        for (const key in font) {
            if (typeof font[key] === 'object' && font[key]['8'] === 4) {
                return font[key]
            }
        }
        return null
    }
    _findIndexMapping(){
        const font = sc.fontsystem.font
        
        for (const key in font) {
            if(typeof font[key] === 'object' && font[key][0] === 'o') {
                return font[key]
            }
        }
        return null
    }

    prepareTabFonts() {
        const name = ig.blitzkrieg.name
        // const displayName = ig.blitzkrieg.displayName

        const iconSet = ig.blitzkrieg._findIconSet()
        const mapping = ig.blitzkrieg._findMapping()
        const indexMapping = ig.blitzkrieg._findIndexMapping()
        // const font = sc.fontsystem.font
        const icons = new ig.Font('media/blitzkrieg-icons.png', 16, 2000)
        const page = iconSet.push(icons) - 1
        let iconMapping = { BLITZKRIEG: [0,0] }
        iconMapping[name][0] = page
        
        
        mapping[name] = iconMapping[name]
        if (indexMapping.indexOf(name) == -1) {
            indexMapping.push(name)
        }
    }

    setupTabs() {
        const name = ig.blitzkrieg.name
        // const displayName = ig.blitzkrieg.displayName

        // borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js
        sc.OPTION_CATEGORY[name] = Object.keys(sc.OPTION_CATEGORY).length
        sc.OptionsTabBox.prototype.tabs[name] = null

        // const tab = sc.OPTION_CATEGORY[name]

        sc.OPTIONS_DEFINITION['blitzkrieg-description'] = {
            type: 'INFO',
            cat: sc.OPTION_CATEGORY[name],
        }

        sc.OPTIONS_DEFINITION['blitzkrieg-cretionkeys'] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY[name],
            header: 'blitzkrieg-keybindings',
            hasDivider: true
        }
    }

    setupTabEvent(tabBox) {
        const name = ig.blitzkrieg.name
        const displayName = ig.blitzkrieg.displayName

        ig.lang.labels.sc.gui.menu.option[name] = displayName
        // borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js
        tabBox.tabs[name] = tabBox._createTabButton.call(tabBox, name, tabBox.tabArray.length, sc.OPTION_CATEGORY[name])
        tabBox._rearrangeTabs.call(tabBox)
	
    }
}
