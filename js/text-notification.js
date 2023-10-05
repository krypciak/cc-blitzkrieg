export class TextNotification {
    static init() {
        sc.TextUpdateEntry = ig.GuiElementBase.extend({
            timer: 2,
            textGui: null,
            init: function (text, timeout) {
                this.parent()
                if (timeout !== undefined) this.timer = timeout
                var a = '\\c[3]' + text + '\\c[0] '

                this.textGui = new sc.TextGui(a, { font: sc.fontsystem.tinyFont })
                this.addChildGui(this.textGui)
                this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
            },
            updateTimer: function () {
                if (this.timer > 0) this.timer = this.timer - ig.system.tick
            },
        })

        sc.TextUpdateHud = sc.RightHudBoxGui.extend({
            delayedStack: [],
            init: function (title) {
                this.parent(title)
                sc.Model.addObserver(sc.model, this)
            },
            addEntry: function (text, timeout) {
                var b = new sc.TextUpdateEntry(text, timeout)
                this.contentEntries.length >= 3
                    ? this.delayedStack.push(b)
                    : this.pushContent(b, !sc.model.isCutscene())
                this.hidden && !sc.model.isCutscene() && this.show()
            },
            _isInEntries: function (b) {
                for (var a = this.contentEntries.length; a--; )
                    if (this.contentEntries[a].subGui.id == b) return this.contentEntries[a].subGui
                for (a = this.delayedStack.length; a--; )
                    if (this.delayedStack[a].id == b) return this.delayedStack[a]
                return null
            },
            _popDelayed: function () {
                if (this.delayedStack.length != 0) {
                    var b = this.delayedStack.splice(0, 1)[0]
                    this.pushContent(b, true)
                }
            },
            update: function () {
                if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
                    for (var b = this.contentEntries.length, a = null; b--; ) {
                        a = this.contentEntries[b].subGui
                        a.updateTimer()
                        if (a.timer <= 0) {
                            a = this.removeContent(b)
                            if (b == 0 && this.contentEntries.length == 0)
                                a.hook.pivot.y = a.hook.size.y / 2
                            else {
                                a.hook.pivot.y = 0
                                a.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT
                            }
                            this._popDelayed()
                        }
                    }
                    !this.hidden && this.contentEntries.length == 0 && this.hide()
                }
            },
            modelChanged: function (b, _, d) {
                if (b == sc.model)
                    if (b.isReset()) {
                        this.clearContent()
                        this.hide()
                    } else
                        b.isCutscene() || b.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs()
                            ? this.hide()
                            : !b.isCutscene() &&
                              !b.isHUDBlocked() &&
                              this.contentEntries.length > 0 &&
                              !sc.quests.hasQuestSolvedDialogs() &&
                              this.show()
                else this.addEntry(d)
            },
        })
    }

    static rhudmsg(title, message, timeout) {
        var a = new sc.TextUpdateHud(title)
        sc.gui.rightHudPanel.addHudBox(a)
        a.addEntry(message, timeout)
    }
}
