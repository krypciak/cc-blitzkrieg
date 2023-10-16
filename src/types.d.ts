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
            playerEntityCrosshairInstance: ig.ENTITY.Crosshair

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
        
        namespace Entity {
            interface Settings {
                oldPos?: Vec2 /* set by cc-map-util */
            }
        }

        interface Entity {
            isBall?: boolean
            oldPos?: Vec2 /* set by cc-map-util */
        }

        namespace ENTITY {
            interface Player {
                aimDegrees: number /* set by this mod */
            }
            interface Crosshair extends ig.Class {
                _aimDir: Vec2
                deferredUpdate(this: this): void
            }
            interface CrosshairConstructor extends ImpactClass<Crosshair> {
                new (a: unknown, b: unknown, c: unknown, d: unknown): Crosshair
            }
            var Crosshair: CrosshairConstructor

            interface Compressor extends ig.AnimatedEntity {
                ballSpeed: number
                createCompressorBall(this: tihs): void
            }
            interface CompressorConstructor extends ImpactClass<Compressor> {
                new (x: number, y: number, z: number, settings: ig.ENTITY.Compressor.Settings): Compressor
            }
            var Compressor: CompressorConstructor

            interface BounceBlock extends ig.AnimatedEntity {
                effects: ig.EffectSheet
                group: string
                blockState: 0 | 1 | 2
                timer: ig.WeightTimer
                ballTime: number

                ballHit(this: this, entity: ig.Entity | ig.ENTITY.Ball, pos: Vec2): boolean
                onGroupResolve(this: this, hide?: boolean): void
            }
            interface BounceBlockConstructor extends ImpactClass<BounceBlock> {
                new (x: number, y: number, z: number, settings: ig.ENTITY.BounceBlock.Settings): BounceBlock
            }
            var BounceBlock: BounceBlockConstructor

            interface BounceSwitch extends ig.AnimatedEntity {
                effects: ig.EffectSheet
                group: string
                isOn: boolean

                ballHit(this: this, entity: ig.Entity | ig.ENTITY.Ball): boolean
                onGroupResolve(this: this): void
            }
            interface BounceSwitchConstructor extends ImpactClass<BounceSwitch> {
                new (x: number, y: number, z: number, settings: ig.ENTITY.BounceSwitch.Settings): BounceSwitch
            }
            var BounceSwitch: BounceSwitchConstructor

            interface Ball {
                _blitzkriegchanged?: boolean
                speedFactor: number
                speed: number

                changeSpeed(this: this, speed: number, boo?: boolean): void
            }
        }
    }
    namespace sc {
        interface OptionModel {
            set(this: this, option: string, value: any): void
        }
        interface ItemBuff extends sc.StatChange {
            itemID: number
        }
        interface ItemBuffConstructor extends ImpactClass<ItemBuff> {
            new (effectArr: string[], duration: number, itemId: number): ItemBuff
        }
        var ItemBuff: ItemBuffConstructor

        namespace BounceSwitchGroups {
            interface Group {
                endSwitch: null,
                variable: string,
                blocks: unknown[],
                blockHitCount: number,
                finalHit: boolean,
                currentBall: null,
                cameraHandle: null,
                overrideHandle: null
            }
        }
        interface BounceSwitchGroups extends ig.GameAddon {
            groups: Record<string, sc.BounceSwitchGroups.Group>
            getGroup(this: this, groupName: string): sc.BounceSwitchGroups.Group
            isGroupBallConflict(this: this, groupName: string, entity: ig.Entity): boolean

        }
        interface BounceSwitchGroupsConstructor extends ImpactClass<BounceSwitchGroups> {
            new (): BounceSwitchGroups
        }
        var BounceSwitchGroups: BounceSwitchGroupsConstructor
        var bounceSwitchGroups: BounceSwitchGroups

        var ASSIST_PUZZLE_SPEED: any
    }
}
