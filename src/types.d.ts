import { Mod } from 'ultimate-crosscode-typedefs/modloader/mod'

export type Mod1 = Writable<Mod> & {
    isCCModPacked: boolean
    findAllAssets?(): void /* only there for ccl2, used to set isCCL3 */
} & ({
    isCCL3: true
    id: string
    findAllAssets(): void
} | {
    isCCL3: false
    name: string
    filemanager: {
        findFiles(dir: string, exts: string[]): Promise<string[]>
    }
    getAsset(path: string): string
    runtimeAssets: Record<string, string>
})

export {}
declare global {
    namespace ig {
        interface Game {
            preloadLevel(this: this, mapName: string): void
            levels: { height: number }[] /* not correct but good enough for me */
        }
        interface Renderer2d extends ig.Class {
            drawPostLayerSprites(this: this): void
        }
        interface Renderer2dConstructor extends ImpactClass<Renderer2d> {
            new (): Renderer2d
        }
        var Renderer2d: Renderer2dConstructor
    }
    namespace sc {
        interface OptionModel {
            set(this: this, option: string, value: any)
        }
        interface ItemBuff extends sc.StatChange {
            itemID: number
        }
        interface ItemBuffConstructor extends ImpactClass<ItemBuff> {
            new (effectArr: string[], duration: number, itemId: number): ItemBuff
        }
        var ItemBuff: ItemBuffConstructor
    }
}
