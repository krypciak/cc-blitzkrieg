import { PuzzleSelectionManager } from './puzzle-selection.js'
import { BattleSelectionManager } from './battle-selection.js'
import { BossSelectionManager } from './boss-selection.js'
import { SelectionCopyManager } from './selection-copy.js'
import { MapArranger } from './map-arrange.js'
import { Selections } from './selection.js'
import { Util } from './util.js'
import { TextNotification } from './text-notification.js'

export default class Blitzkrieg {
    constructor(mod) {
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
                blitzkrieg.puzzleSelections.checkForEvents(pos)
                blitzkrieg.battleSelections.checkForEvents(pos)
                blitzkrieg.bossSelections.checkForEvents(pos)
                return this.parent(...args)
            }
        })

        ig.Renderer2d.inject({
            drawPostLayerSprites(...args) {
                this.parent(...args)
                blitzkrieg.puzzleSelections.drawSelections()
                blitzkrieg.battleSelections.drawSelections()
                blitzkrieg.bossSelections.drawSelections()
            }
        })

        ig.Game.inject({
            loadLevel(...args) {
                this.parent(...args)
                blitzkrieg.puzzleSelections.onNewMapEnter()
                blitzkrieg.battleSelections.onNewMapEnter()
                blitzkrieg.bossSelections.onNewMapEnter()
            }
        })

        sc.OptionsTabBox.inject({
            init(...args) {
                this.parent(...args)
                blitzkrieg.setupTabEvent(this)
            }
        })

        ig.ENTITY.Player.inject({
            updateModelStats(...args) {
                if (blitzkrieg.puzzleSelectionManager && blitzkrieg.puzzleSelectionManager.modifiersActive) { return }
                this.parent(...args)
            }
        })
    }

    async selectionDialog() {
        blitzkrieg.selectionMode = await blitzkrieg.util.syncDialog('select selection type', ['puzzle', 'battle', 'boss'])
        blitzkrieg.updateSelectionMode()
    }

    updateSelectionMode() {
        switch (blitzkrieg.selectionMode) {
        case 'puzzle':
            blitzkrieg.selectionInstance = blitzkrieg.puzzleSelections
            blitzkrieg.selectionInstanceManager = blitzkrieg.puzzleSelectionManager
            break
        case 'battle':
            blitzkrieg.selectionInstance = blitzkrieg.battleSelections
            blitzkrieg.selectionInstanceManager = blitzkrieg.battleSelectionManager
            break
        case 'boss':
            blitzkrieg.selectionInstance = blitzkrieg.bossSelections
            blitzkrieg.selectionInstanceManager = blitzkrieg.bossSelectionManager
            break
        }
        blitzkrieg.msg('blitzkrieg', 'Switched selection mode to: ' + blitzkrieg.selectionInstance.name, 2)
    }

    bindingCreate() {
        blitzkrieg.selectionInstance.create()
    }
    bindingCreateSel() {
        blitzkrieg.selectionInstance.select()
    }
    bindingDeleteSel() {
        blitzkrieg.selectionInstance.delete()
    }

    async reloadLevel() {
        let pos = ig.copy(ig.game.playerEntity.coll.pos)
        let map = ig.game.mapName.split('.').join('/')
        ig.game.loadLevel(await blitzkrieg.util.getMapObject(map, true), false, false)
        ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
    }
    
    async prestart() {
        window.blitzkrieg = this
        blitzkrieg.tilesize = 16
        blitzkrieg.name = 'BLITZKRIEG'
        blitzkrieg.displayName = 'Blitzkrieg'

        blitzkrieg.msg = () => {}
        blitzkrieg.util = new Util()


        blitzkrieg.puzzleSelectionManager = new PuzzleSelectionManager()
        blitzkrieg.puzzleSelections = new Selections(
            'puzzle',
            '#77000044',
            '#ff222244',
            [ blitzkrieg.mod.baseDirectory + 'json/puzzleData.json', ],
            blitzkrieg.puzzleSelectionManager.newSelEvent,
            blitzkrieg.puzzleSelectionManager.walkInEvent,
            blitzkrieg.puzzleSelectionManager.walkOutEvent,
        )
        blitzkrieg.puzzleSelectionManager.recorder.selInstance = blitzkrieg.puzzleSelections

        blitzkrieg.selectionCopyManager = new SelectionCopyManager()

        blitzkrieg.mapArranger = new MapArranger()


        blitzkrieg.battleSelectionManager = new BattleSelectionManager()
        blitzkrieg.battleSelections = new Selections(
            'battle',
            '#00770044',
            '#22ff2244',
            [ blitzkrieg.mod.baseDirectory + 'json/battleData.json', ],
            blitzkrieg.battleSelectionManager.newSelEvent,
            () => {},
            () => {},
        )
        blitzkrieg.battleSelectionManager.recorder.selInstance = blitzkrieg.battleSelections

        
        blitzkrieg.bossSelectionManager = new BossSelectionManager()
        blitzkrieg.bossSelections = new Selections(
            'boss',
            '#0000ff44',
            '#2222ff44',
            [ blitzkrieg.mod.baseDirectory + 'json/bossData.json', ],
            blitzkrieg.bossSelectionManager.newSelEvent,
            () => {},
            () => {},
        )

        blitzkrieg.selectionMode = 'puzzle'
        blitzkrieg.updateSelectionMode()

        blitzkrieg.keys = {
            'puzzle-create':             { desc: 'Create a new entry',             func: blitzkrieg.bindingCreate,
                key: ig.KEY.P,             header: 'blitzkrieg-keybindings', hasDivider: false, parent: blitzkrieg },
            'puzzle-selection-create':   { desc: 'Create a selection',             func: blitzkrieg.bindingCreateSel, 
                key: ig.KEY.BRACKET_OPEN,  header: 'blitzkrieg-keybindings', hasDivider: false, parent: blitzkrieg },
            'puzzle-selection-delete':   { desc: 'Delete a selection/puzzle',      func: blitzkrieg.bindingDeleteSel, 
                key: ig.KEY.BRACKET_CLOSE, header: 'blitzkrieg-keybindings', hasDivider: false, parent: blitzkrieg },

            'puzzle-increse-speed':      { desc: 'Increse selection puzzle data',  func: blitzkrieg.puzzleSelectionManager.incSpeed, 
                key: ig.KEY._0,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: blitzkrieg.puzzleSelectionManager },
            'puzzle-decrese-speed':      { desc: 'Decrese selection puzzle speed', func: blitzkrieg.puzzleSelectionManager.decSpeed, 
                key: ig.KEY._9,            header: 'blitzkrieg-keybindings', hasDivider: false, parent: blitzkrieg.puzzleSelectionManager },
        }

        // https://github.com/krypciak/cc-vim
        if (vim) {
            // insel = (ingame) => { return ingame && blitzkreg
            vim.addAlias('blitzkrieg', 'reload-level', '', 'ingame', () => { blitzkrieg.reloadLevel() })
            vim.addAlias('blitzkrieg', 'toggle-selection-render', '', 'ingame', () => { 
                blitzkrieg.puzzleSelections.toggleDrawing()
                blitzkrieg.battleSelections.toggleDrawing()
                blitzkrieg.bossSelections.toggleDrawing()
            })
            vim.addAlias('blitzkrieg', 'toggle-selection-outlines', 'Show/hide selections', 'ingame', () => { blitzkrieg.selectionOutlines = !blitzkrieg.selectionOutlines })

            const insel = (ingame) => { return ingame && blitzkrieg.selectionInstance.inSelStack.length() > 0 }
            vim.addAlias('blitzkrieg', 'puzzle-solve', '', insel, () => { blitzkrieg.selectionInstanceManager.solve() })
            vim.addAlias('blitzkrieg', 'record-start', '', insel, () => { blitzkrieg.selectionInstanceManager.recorder.startRecording() })
            vim.addAlias('blitzkrieg', 'record-stop', '', insel, () => { blitzkrieg.selectionInstanceManager.recorder.stopRecording() })
            vim.addAlias('blitzkrieg', 'toogle-selection-mode', '', 'ingame', () => { blitzkrieg.selectionDialog() })
        }


        blitzkrieg.setupTabs()
        blitzkrieg.bindKeys(blitzkrieg.keys, sc.OPTION_CATEGORY.BLITZKRIEG)
        blitzkrieg.registerEvents()
    
        blitzkrieg.mod.isCCL3 = blitzkrieg.mod.findAllAssets ? true : false
        blitzkrieg.mod.isCCModPacked = blitzkrieg.mod.baseDirectory.endsWith('.ccmod/')

        blitzkrieg.selectionOutlines = false
        blitzkrieg.loaded = true
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

    async poststart() {
        blitzkrieg.updateKeybindingLabels()
        blitzkrieg.adjustPuzzleAssistSlider()
        blitzkrieg.prepareTabFonts()

        TextNotification.init()
        blitzkrieg.msg = TextNotification.msg
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
        const name = blitzkrieg.name
        // const displayName = blitzkrieg.displayName

        const iconSet = blitzkrieg._findIconSet()
        const mapping = blitzkrieg._findMapping()
        const indexMapping = blitzkrieg._findIndexMapping()
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
        const name = blitzkrieg.name
        // const displayName = blitzkrieg.displayName

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
        const name = blitzkrieg.name
        const displayName = blitzkrieg.displayName

        ig.lang.labels.sc.gui.menu.option[name] = displayName
        // borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js
        tabBox.tabs[name] = tabBox._createTabButton.call(tabBox, name, tabBox.tabArray.length, sc.OPTION_CATEGORY[name])
        tabBox._rearrangeTabs.call(tabBox)
	
    }
}
