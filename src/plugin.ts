import { VimLogic } from '../node_modules/cc-vim/src/logic'

declare global {
    const vim: VimLogic
    interface Window {
        vim: VimLogic
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
        window.dnggen = this
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        addVimBindings()
    }

    async poststart() {
    }
}
