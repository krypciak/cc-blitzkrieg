export async function syncDialog(text: string, buttons: string[]): Promise<string> {
    sc.BUTTON_TYPE.SMALL.valueOf = () => {
        return sc.BUTTON_TYPE.SMALL.height
    }
    return new Promise((resolve) => {
        const popup = new sc.ModalButtonInteract(text, null, buttons, (button) => {
            resolve(button.text!.toString())
        })
        ig.gui.addGuiElement(popup)
        popup.show()
    })
}

let waitingForPos: boolean = false
export async function waitForPositionKey(): Promise<Vec3 & { level: number }> {
    blitzkrieg.rhudmsg('blitzkrieg', 'Waiting for position key', 5)
    return new Promise((resolve) => {
        waitingForPos = true
        let intervalId = setInterval(function() {
            if (waitingForPos == false) {
                clearInterval(intervalId)
                const pos: Vec3 & { level: number } = ig.game.playerEntity.coll.pos as Vec3 & { level: number }
                for (const i in ig.game.levels) {
                    if (ig.game.levels[i].height + 5 >= pos.z &&
                        ig.game.levels[i].height - 5 <= pos.z) {
                        pos.level = parseInt(i)
                        resolve(pos)
                    }
                }
                throw new Error('level not found')
            }
        })

    })
}
