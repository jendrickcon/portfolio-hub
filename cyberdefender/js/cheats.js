/**
 * CYBER DEFENDER — Developer Cheat Console
 * Provides quick debugging and progression controls via Ctrl + ` (backtick).
 */

import { state, setState } from "./state.js";
import { progression } from "./progression.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";
import { getXpRequiredForLevel } from "../data/badges.js";

/**
 * Calculates exact XP needed to advance the player by `levels` count,
 * taking into account current XP progress toward the next level threshold.
 * @param {number} levels 
 * @returns {number}
 */
export function requiredXpForNext(levels = 1) {
  let needed = 0;
  const currentLevel = state.player.level;
  const currentXp = state.player.xp;

  for (let i = 0; i < levels; i++) {
    const targetLvl = currentLevel + i;
    if (targetLvl >= 30) break;
    const req = getXpRequiredForLevel(targetLvl);
    if (i === 0) {
      needed += Math.max(0, req - currentXp);
    } else {
      needed += req;
    }
  }
  return Math.max(1, needed);
}

import { combat as combatEngine } from "./combat.js";

export const CHEATS = [
  {
    cmd: "levelup 1",
    desc: "Grant exact XP for +1 Level advancement",
    run: () => progression.addXP(requiredXpForNext(1))
  },
  {
    cmd: "levelup 5",
    desc: "Grant exact XP for +5 Level advancement",
    run: () => progression.addXP(requiredXpForNext(5))
  },
  {
    cmd: "cooldown gone",
    desc: "Clear all terminal recharge cooldowns",
    run: () => setState(s => {
      s.terminals.terminalA.cooldownStartedAt = 0;
      s.terminals.terminalB.cooldownStartedAt = 0;
      if (s.terminals.floor2TerminalB) s.terminals.floor2TerminalB.cooldownStartedAt = 0;
      s.terminals.floor2Repair.cooldownStartedAt = 0;
    })
  },
  {
    cmd: "fullheal",
    desc: "Restore Operator HP to max (works in combat)",
    run: () => {
      setState(s => {
        s.player.hp = s.player.maxHp;
        s.system.hp = s.system.maxHp;
      });
      // If mid-battle, refresh the combat HUD bars
      if (state.combat.inBattle && combatEngine.initialized) {
        combatEngine.syncHPs();
        combatEngine.logTerminal(`> CHEAT: Full system restore — Operator HP set to ${state.player.maxHp}!`, "success");
      }
    }
  },
  {
    cmd: "oneshot",
    desc: "Instantly kill current enemy (battle only)",
    run: () => {
      if (!state.combat.inBattle || !state.combat.enemy) {
        ui.notify("ONESHOT: Must be in active combat!", "danger");
        return;
      }
      const enemy = state.combat.enemy;
      enemy.currentHp = 0;
      combatEngine.syncHPs();
      combatEngine.logTerminal(`> CHEAT: ${enemy.name.toUpperCase()} terminated by operator override!`, "effective");
      combatEngine.triggerSpriteRecoil("enemy");
      setTimeout(() => combatEngine.resolveVictory(), 400);
    }
  },
  {
    cmd: "unlockfloor2",
    desc: "Unlock Sector 02 (Hazard Zone) immediately",
    run: () => setState(s => {
      s.progression.unlockedFloor2 = true;
    })
  },
  {
    cmd: "godmode",
    desc: "Toggle unkillable operator defense in combat",
    run: () => setState(s => {
      s.combat.godMode = !s.combat.godMode;
    })
  }
];

export class CheatConsole {
  constructor() {
    this.open = false;
    this.el = null;
    this.inputEl = null;
    this.dropdownEl = null;
    this.selectedIndex = -1;
  }

  init() {
    if (this.el) return;

    this.el = document.createElement("div");
    this.el.id = "cheat-console";
    this.el.className = "cheat-console";
    this.el.innerHTML = `
      <div class="cheat-console-header">
        <span class="cheat-header-tag">[SYS_DEBUG] DEVELOPER CONSOLE</span>
        <span class="cheat-header-hint">PRESS ESC OR CTRL+\` TO CLOSE</span>
      </div>
      <div class="cheat-input-wrap">
        <span class="cheat-prompt-symbol">&gt;</span>
        <input id="cheat-input" type="text" class="cheat-input" placeholder="Type a cheat code or select below..." autocomplete="off" spellcheck="false" />
      </div>
      <div id="cheat-dropdown" class="cheat-dropdown"></div>
    `;

    const frame = document.getElementById("game-frame") || document.body;
    frame.appendChild(this.el);

    this.inputEl = this.el.querySelector("#cheat-input");
    this.dropdownEl = this.el.querySelector("#cheat-dropdown");

    this.renderDropdown("");
    this.bindEvents();
  }

  renderDropdown(query = "") {
    if (!this.dropdownEl) return;
    const q = query.trim().toLowerCase();
    const matches = CHEATS.filter(c => c.cmd.includes(q) || c.desc.toLowerCase().includes(q));

    if (matches.length === 0) {
      this.dropdownEl.innerHTML = `<div class="cheat-row cheat-row--empty">No matching cheat routines found</div>`;
      this.selectedIndex = -1;
      return;
    }

    this.dropdownEl.innerHTML = matches.map((c, idx) => `
      <div class="cheat-row ${idx === this.selectedIndex ? 'selected' : ''}" data-cmd="${c.cmd}">
        <span class="cheat-cmd-name">${c.cmd}</span>
        <span class="cheat-cmd-desc">${c.desc}</span>
        ${c.cmd === "godmode" && state.combat.godMode ? '<span class="cheat-tag-active">[ACTIVE]</span>' : ''}
      </div>
    `).join("");
  }

  bindEvents() {
    this.inputEl.addEventListener("input", () => {
      this.selectedIndex = -1;
      this.renderDropdown(this.inputEl.value);
    });

    this.inputEl.addEventListener("keydown", (e) => {
      e.stopPropagation(); // Don't leak keystrokes into player movement or confirm dialogs

      const rows = Array.from(this.dropdownEl.querySelectorAll(".cheat-row:not(.cheat-row--empty)"));

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (rows.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % rows.length;
          this.updateRowSelection(rows);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (rows.length > 0) {
          this.selectedIndex = (this.selectedIndex - 1 + rows.length) % rows.length;
          this.updateRowSelection(rows);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (this.selectedIndex >= 0 && rows[this.selectedIndex]) {
          this.execute(rows[this.selectedIndex].dataset.cmd);
        } else {
          this.execute(this.inputEl.value.trim().toLowerCase());
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.toggle(false);
      }
    });

    this.dropdownEl.addEventListener("click", (e) => {
      const row = e.target.closest(".cheat-row[data-cmd]");
      if (row) {
        this.execute(row.dataset.cmd);
      }
    });
  }

  updateRowSelection(rows) {
    rows.forEach((r, idx) => {
      r.classList.toggle("selected", idx === this.selectedIndex);
      if (idx === this.selectedIndex) {
        this.inputEl.value = r.dataset.cmd;
        r.scrollIntoView({ block: "nearest" });
      }
    });
  }

  execute(cmd) {
    const found = CHEATS.find(c => c.cmd === cmd);
    if (!found) {
      ui.notify(`UNKNOWN CHEAT: "${cmd}"`, "danger");
      return;
    }

    found.run();
    ui.syncHUD();
    SaveSystem.save();

    const statusExtra = cmd === "godmode" ? (state.combat.godMode ? " [ENABLED]" : " [DISABLED]") : "";
    ui.notify(`CHEAT APPLIED: ${cmd.toUpperCase()}${statusExtra}`, "warning");
    this.toggle(false);
  }

  toggle(force) {
    this.init();
    this.open = force !== undefined ? force : !this.open;
    this.el.classList.toggle("open", this.open);

    if (this.open) {
      this.inputEl.value = "";
      this.selectedIndex = -1;
      this.renderDropdown("");
      setTimeout(() => this.inputEl.focus(), 50);
    }
  }
}

export const cheatConsole = new CheatConsole();

if (typeof window !== "undefined") {
  window.CyberCheats = { cheatConsole, CHEATS, requiredXpForNext };

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "`") {
      e.preventDefault();
      cheatConsole.toggle();
    }
  });
}

