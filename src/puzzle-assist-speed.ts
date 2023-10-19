import { MenuOptions } from "options"

function adjustPuzzleAssistSlider() {
    const from: number = 0.1
    const to: number = 3
    const step: number = 0.1
    const prec: number = 10

    sc.ASSIST_PUZZLE_SPEED = { }
    for (let speed = from, i = 0; speed < 1; speed += step, i++) {
        speed = Math.round(speed * prec) / prec
        sc.ASSIST_PUZZLE_SPEED[`LOW${i}`] = speed
    }
    sc.ASSIST_PUZZLE_SPEED['NORM'] = 1
    for (let speed = 1 + step, i = 0; speed <= to; speed += step, i++) {
        speed = Math.round(speed * prec) / prec
        sc.ASSIST_PUZZLE_SPEED[`HIGH${i}`] = speed
    }
    sc.OPTIONS_DEFINITION['assist-puzzle-speed'] = {
        type: 'OBJECT_SLIDER',
        data: sc.ASSIST_PUZZLE_SPEED,
        init: sc.ASSIST_PUZZLE_SPEED.NORM,
        cat: sc.OPTION_CATEGORY.ASSISTS,
        fill: true,
        showPercentage: true,
        hasDivider: true,
        header: 'puzzle',
    }
}


function isBall(e: ig.Entity): e is ig.ENTITY.Ball { return !!e.isBall }

export function puzzleAssistSpeedInitPrestart() {
    adjustPuzzleAssistSlider()

    ig.ENTITY.Compressor.inject({
            createCompressorBall() {
            if (! MenuOptions.puzzleElementAdjustEnabled) { this.parent() }
                var a = this.getCenter()
                if (this.currentElement == sc.ELEMENT.SHOCK)
                    this.compressorBall = ig.game.spawnEntity(sc.CompressedShockEntity, a.x, a.y, this.coll.pos.z + 12, ({ speed: this.ballSpeed * sc.options.get("assist-puzzle-speed"), fastMode: this.fastMode }) as ig.Entity.Settings)
                else if (this.currentElement == sc.ELEMENT.WAVE)
                    this.compressorBall = ig.game.spawnEntity(sc.CompressedWaveEntity, a.x, a.y, this.coll.pos.z + 12, ({ speed: this.ballSpeed * sc.options.get("assist-puzzle-speed"), fastMode: this.fastMode }) as ig.Entity.Settings)
        },
    })

    ig.ENTITY.BounceBlock.inject({
        ballHit(e: ig.Entity, pos: Vec2): boolean {

            if (MenuOptions.puzzleElementAdjustEnabled && isBall(e) &&
                !sc.bounceSwitchGroups.isGroupBallConflict(this.group, e) && pos && !Vec2.isZero(pos) && !this.blockState) {

                if (! e._blitzkriegchanged) {
                    e._blitzkriegchanged = true
                    if (e.speedFactor == 1) {
                        e.changeSpeed(e.speedFactor * sc.options.get('assist-puzzle-speed'), true)
                    }
                }
            }
            return this.parent(e, pos)
        },
    })
}
