import { categoryName } from './options'
const displayName = 'Blitzkrieg'

export function setupTabs() {
    /* borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js */
    sc.OPTION_CATEGORY[categoryName] = Object.keys(sc.OPTION_CATEGORY).length
    sc.OptionsTabBox.prototype.tabs[categoryName] = null

    // const tab = sc.OPTION_CATEGORY[name]

    sc.OptionsTabBox.inject({
        init(...args) {
            this.parent(...args)
            setupTabEvent(this)
        }
    })
}

/* all 3 functions borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js */
function _findIconSet() {
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

function _findMapping() {
    const font = sc.fontsystem.font
    
    for (const key in font) {
        if (typeof font[key] === 'object' && font[key]['8'] === 4) {
            return font[key]
        }
    }
    return null
}

function _findIndexMapping() {
    const font = sc.fontsystem.font
    
    for (const key in font) {
        if(typeof font[key] === 'object' && font[key][0] === 'o') {
            return font[key]
        }
    }
    return null
}

export function prepareTabFonts() {
    const iconSet = _findIconSet()
    const mapping = _findMapping()
    const indexMapping = _findIndexMapping()
    // const font = sc.fontsystem.font
    const icons = new ig.Font('media/blitzkrieg-icons.png', 16, 2000)
    const page = iconSet.push(icons) - 1
    let iconMapping = { [categoryName]: [0,0] }
    iconMapping[categoryName][0] = page
    
    
    mapping[categoryName] = iconMapping[categoryName]
    if (indexMapping.indexOf(categoryName) == -1) {
        indexMapping.push(categoryName)
    }
}

function setupTabEvent(tabBox) {
    ig.lang.labels.sc.gui.menu.option[categoryName] = displayName
    /* borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js */
    tabBox.tabs[categoryName] = tabBox._createTabButton.call(tabBox, categoryName, tabBox.tabArray.length, sc.OPTION_CATEGORY[categoryName])
    tabBox._rearrangeTabs.call(tabBox)

}

export function getBlitzkriegTabIndex() {
    return sc.OPTION_CATEGORY[categoryName]
}
