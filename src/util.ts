export class Util {
    static async syncDialog<T extends readonly string[]>(text: string, buttons: T): Promise<T[number]> {
        sc.BUTTON_TYPE.SMALL.valueOf = () => {
            return sc.BUTTON_TYPE.SMALL.height
        }
        return new Promise((resolve) => {
            const popup = new sc.ModalButtonInteract(text, null, buttons.map(e => e), (button) => {
                resolve(button.text!.toString() as T[number])
            })
            ig.gui.addGuiElement(popup)
            popup.show()
        })
    }
    
    static getLevelFromZ(z: number): number {
        for (const i in ig.game.levels) {
            if (ig.game.levels[i].height! + 5 >= z &&
                ig.game.levels[i].height! - 5 <= z) {
                return parseInt(i)
            }
        }
        console.log('WARN: level not found')
        return 0
    }

    static waitingForPos: boolean = false
    static async waitForPositionKey(): Promise<Vec3 & { level: number }> {
        blitzkrieg.rhudmsg('blitzkrieg', 'Waiting for position key', 1)
        return new Promise((resolve) => {
            Util.waitingForPos = true
            let intervalId = setInterval(function() {
                if (Util.waitingForPos == false) {
                    clearInterval(intervalId)
                    const pos: Vec3 & { level: number } = Vec3.create(ig.game.playerEntity.coll.pos) as Vec3 & { level: number }
                    pos.level = Util.getLevelFromZ(pos.z)
                    resolve(pos)
                    return
                }
            })
    
        })
    }
}

