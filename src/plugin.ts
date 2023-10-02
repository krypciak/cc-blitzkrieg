import { VimLogic } from 'cc-vim/src/logic'
import { Mod1 } from '@root/types'

declare global {
    const vim: VimLogic
    const blitzkrieg: Blitzkrieg
    interface Window {
        vim: VimLogic
        blitzkrieg: Blitzkrieg
    }
}

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
    }
}

export default class Blitzkrieg {
    dir: string
    mod: Mod1

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
