import { Mod } from 'ultimate-crosscode-typedefs/modloader/mod'

export type Mod1 = Writable<Mod> & {
    isCCModPacked: boolean
    findAllAssets?(): void /* only there for ccl2, used to set isCCL3 */
} & (
        | {
              isCCL3: true
              id: string
              findAllAssets(): void
          }
        | {
              isCCL3: false
              name: string
              filemanager: {
                  findFiles(dir: string, exts: string[]): Promise<string[]>
              }
              getAsset(path: string): string
              runtimeAssets: Record<string, string>
          }
    )

export {}
declare global {
    namespace ig {
        interface Game {
            now: number /* set by this mod */
        }
        namespace Entity {
            interface Settings {
                oldPos?: Vec2 /* set by cc-map-util */
            }
        }

        interface Entity {
            oldPos?: Vec2 /* set by cc-map-util */
        }

        namespace ENTITY {
            interface Player {
                aimDegrees: number /* set by this mod */
            }

            interface Ball {
                _blitzkriegchanged?: boolean
            }
        }
    }
    namespace sc {
        var ASSIST_PUZZLE_SPEED: any
    }
}
