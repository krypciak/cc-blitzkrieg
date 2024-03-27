import { BattleRecorder, BattleRecorderData, BattleRecorderEvent } from './battle-recorder'
import { Selection, SelectionManager } from './selection'

export interface BattleSelection extends Selection {
    data: {
        recordLog?: BattleRecorderData
        endPos: Vec3 & { level: number }
        startPos: Vec3 & { level: number }
    }
}

export class BattleSelectionManager extends SelectionManager<BattleSelection> {
    recorder: BattleRecorder
    solvingSel?: BattleSelection
    solvingStartTime!: number
    solvingIndex!: number
    solvingLog!: BattleRecorderData['log']

    constructor() {
        super(0, '#00770044', '#22ff2244', [blitzkrieg.mod.baseDirectory + 'json/battleData.json'])
        this.recorder = new BattleRecorder(this)

        const self = this
        ig.Game.inject({
            update() {
                this.parent()
                if (self.solvingSel) {
                    const log = self.solvingLog
                    const currentTime = ig.game.now
                    for (; self.solvingIndex < log.length; self.solvingIndex++) {
                        const [frame, eventOrPath, uuidOrValue] = log[self.solvingIndex]
                        const actionTime = frame * 4 + self.solvingStartTime
                        if (actionTime > currentTime) break
                        /* execute event */
                        if (eventOrPath.startsWith('.')) {
                            const path = eventOrPath.substring(1)
                            ig.vars.set(path, uuidOrValue)
                        } else {
                            self.resolveEvent(eventOrPath as BattleRecorderEvent, uuidOrValue as string)
                        }
                    }
                    if (self.solvingIndex == log.length - 1) self.solveSelEnd()
                }
            },
            preloadLevel(mapName) {
                this.parent(mapName)
                self.solvingSel = undefined
            },
        })
    }

    private resolveEvent(event: BattleRecorderEvent, uuid: string) {
        if (event == 'death') {
            const e = ig.game.shownEntities.find(e => e?.uuid == uuid)
            if (e instanceof ig.ENTITY.Combatant) {
                e.params.setDefeated()
                e.damageTimer = 0.003 /* so 0 > damageTimer < ig.system.tick */
                console.log('killing', uuid)
            } else {
                console.warn('enemy', uuid, 'not found')
            }
        } else if (event == 'spawn') {
        } else throw new Error(`unhandled battle event: ${event}`)
    }

    public solve() {
        const sel: BattleSelection = this.inSelStack.peek()
        if (!sel) return
        if (!sel.data.recordLog || sel.data.recordLog.log.length == 0) {
            blitzkrieg.rhudmsg('blitzkrieg', 'No battle solution recorded!', 5)
            return
        }

        this.solvingSel = sel
        this.solvingStartTime = ig.game.now
        this.solvingIndex = 0
        this.solvingLog = this.preprocessLog(sel.data.recordLog.log)
        console.log(this.solvingLog)
    }

    private preprocessLog(log: BattleRecorderData['log']): BattleRecorderData['log'] {
        if (log.length == 0) return []
        const nlog: BattleRecorderData['log'] = log.map(arr => [...arr])
        let lastFrame = 0
        let lastDeathFrame: number | undefined
        for (const e of nlog) {
            if (e[1].startsWith('.')) {
                e[0] = lastFrame
            } else {
                const event = e[1] as BattleRecorderEvent
                if (event == 'death') {
                    lastDeathFrame = e[0]
                    e[0] = lastFrame
                } else if (event == 'spawn') {
                    if (lastDeathFrame) {
                        lastFrame += e[0] - lastDeathFrame
                        lastDeathFrame = undefined
                    }
                    e[0] = lastFrame
                }
            }
        }
        return nlog
    }

    private solveSelEnd() {
        const sel = this.solvingSel!
        if (sel.data.endPos) {
            const pos = sel.data.endPos
            ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
        }
        this.solvingSel = undefined
        blitzkrieg.rhudmsg('blitzkrieg', 'Solved battle', 2)
    }
}
