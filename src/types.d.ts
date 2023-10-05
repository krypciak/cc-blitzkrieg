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
        }
        interface Renderer2d extends ig.Class {
            drawPostLayerSprites(this: this): void
        }
        interface Renderer2dConstructor extends ImpactClass<Renderer2d> {
            new (): Renderer2d
        }
        var Renderer2d: Renderer2dConstructor
    }
}
