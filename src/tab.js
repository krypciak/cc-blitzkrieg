const name = 'blitzkrieg'
const displayName = 'Blitzkrieg'

const descriptionId = 'blitzkrieg-description'
const enableId = 'blitzkrieg-enable'
const headerGeneralId = 'blitzkrieg-general'

export function setupTabs() {
    /* borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js */
    sc.OPTION_CATEGORY[name] = Object.keys(sc.OPTION_CATEGORY).length
    sc.OptionsTabBox.prototype.tabs[name] = null

    // const tab = sc.OPTION_CATEGORY[name]

    sc.OPTIONS_DEFINITION[descriptionId] = {
        type: 'INFO',
        data: `options.${descriptionId}.description`,
        cat: sc.OPTION_CATEGORY[name],
    }

    sc.OPTIONS_DEFINITION[enableId] = {
        type: 'CHECKBOX',
        init: true,
        cat: sc.OPTION_CATEGORY[name],
        header: headerGeneralId,
        hasDivider: true
    }
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
    let iconMapping = { [name]: [0,0] }
    iconMapping[name][0] = page
    
    
    mapping[name] = iconMapping[name]
    if (indexMapping.indexOf(name) == -1) {
        indexMapping.push(name)
    }
    
    ig.lang.labels.sc.gui.options[descriptionId] = {
        description: '\\c[3]https://github.com/krypciak/cc-blitzkrieg\\c[0]'
    }
    ig.lang.labels.sc.gui.options.headers[headerGeneralId] = 'general'
    ig.lang.labels.sc.gui.options[enableId] = {
        name: 'Enable the mod',
        description: 'Enables/Disables the entire functionality of the mod'
    }
}

function setupTabEvent(tabBox) {
    ig.lang.labels.sc.gui.menu.option[name] = displayName
    /* borrowed from https://github.com/CCDirectLink/CCLoader/blob/master/assets/mods/simplify/mod.js */
    tabBox.tabs[name] = tabBox._createTabButton.call(tabBox, name, tabBox.tabArray.length, sc.OPTION_CATEGORY[name])
    tabBox._rearrangeTabs.call(tabBox)

}

export function isBlitzkriegEnabled() {
    return sc.options.get(enableId)
}

export function setBlitzkriegEnabled(bool) {
    sc.options.set(enableId, bool)
}

export function getBlitzkriegTabIndex() {
    return sc.OPTION_CATEGORY[name]
}
