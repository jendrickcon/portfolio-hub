/**
 * CYBER DEFENDER — Terminal Subsystems & Data Caches
 * Implements Terminal A, Terminal B, Floor 2 Repair, and Honeypot Ambush Trap.
 * Features persistent timestamp-based cooldowns and badge checks.
 */

import { state, events, setState } from "./state.js";
import { TILE_TYPES } from "../data/floors.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";
import { progression } from "./progression.js";
import { overworld } from "./overworld.js";

export class TerminalSystem {
  constructor() {
    this.cooldowns = {
      terminalA: 5 * 60 * 1000,    // 5 minutes (300,000 ms)
      terminalB: 10 * 60 * 1000,   // 10 minutes (600,000 ms)
      floor2TerminalB: 10 * 60 * 1000, // 10 minutes (600,000 ms)
      floor2Repair: 8 * 60 * 1000  // 8 minutes (480,000 ms)
    };
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    events.on("terminalStepped", (data) => {
      this.handleTerminalInteraction(data.tile, data.x, data.y);
    });
  }

  /**
   * Calculates remaining cooldown time in seconds for a given terminal.
   * @param {string} terminalKey 
   * @returns {number} seconds remaining (0 if ready)
   */
  getRemainingCooldown(terminalKey) {
    const startedAt = state.terminals[terminalKey]?.cooldownStartedAt || 0;
    if (!startedAt) return 0;

    const duration = this.cooldowns[terminalKey] || 0;
    const elapsed = Date.now() - startedAt;
    const remaining = duration - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  handleTerminalInteraction(tileType, x, y) {
    switch (tileType) {
      case TILE_TYPES.TERMINAL_A:
        this.interactTerminalA();
        break;
      case TILE_TYPES.TERMINAL_B:
        if (state.player.position.floor === 2 || state.progression.currentFloor === 2 || overworld.currentFloor?.id === 2) {
          this.interactFloor2TerminalB();
        } else {
          this.interactTerminalB();
        }
        break;
      case TILE_TYPES.TERMINAL_REPAIR:
        this.interactFloor2Repair();
        break;
      case TILE_TYPES.HONEYPOT:
        this.interactHoneypot(x, y);
        break;
      default:
        break;
    }
  }

  interactTerminalA() {
    if (state.progression.terminalAActivated) {
      ui.notify("MAINFRAME ALREADY SYNCHRONIZED: Terminal A is online. Proceed to Terminal B.", "info");
      return;
    }

    const remaining = this.getRemainingCooldown("terminalA");

    if (remaining > 0) {
      audio.playSFX("warning");
      ui.notify(`TERMINAL A SYNC LOCKED: Cooling down (${this.formatTime(remaining)} remaining)`, "warning");
      return;
    }

    // Activate Terminal A
    setState(s => {
      s.terminals.terminalA.cooldownStartedAt = Date.now();
      s.progression.terminalAActivated = true;
      s.system.hp = Math.min(s.system.maxHp, s.system.hp + 30);
    });

    audio.playSFX("heal");
    ui.notify("MAINFRAME SYNCHRONIZED: System Health restored +30 HP!", "success");

    this.checkTerminalOperatorBadge();
    SaveSystem.save();
  }

  interactTerminalB() {
    // Gate Terminal B behind Terminal A synchronization
    if (!state.progression.terminalAActivated) {
      audio.playSFX("warning");
      ui.notify("ACCESS DENIED: Synchronize Terminal A first!", "warning");
      return;
    }

    if (state.progression.terminalBActivated) {
      ui.notify("DATA CACHE ALREADY DECRYPTED: Extraction portal is open.", "info");
      return;
    }

    const remaining = this.getRemainingCooldown("terminalB");

    if (remaining > 0) {
      audio.playSFX("warning");
      ui.notify(`TERMINAL B RECHARGING: Cooling down (${this.formatTime(remaining)} remaining)`, "warning");
      return;
    }

    // Activate Terminal B
    setState(s => {
      s.terminals.terminalB.cooldownStartedAt = Date.now();
      s.progression.terminalBActivated = true;
      s.system.hp = Math.min(s.system.maxHp, s.system.hp + 15);
      s.player.overclockCharges = (s.player.overclockCharges || 0) + 3;
    });

    audio.playSFX("deploy");
    ui.notify("DATA CACHE DECRYPTED: +15 System HP, +25 XP, +3 Overclock Charges! EXIT [ACCESS GRANTED]", "success");

    progression.addXP(25);
    this.checkTerminalOperatorBadge();
    overworld.refreshExitLockVisual();
    SaveSystem.save();
  }

  interactFloor2TerminalB() {
    if (state.progression.floor2TerminalBActivated) {
      ui.notify("DATA CACHE ALREADY DECRYPTED: Extraction portal is open.", "info");
      return;
    }

    const remaining = this.getRemainingCooldown("floor2TerminalB");

    if (remaining > 0) {
      audio.playSFX("warning");
      ui.notify(`TERMINAL B RECHARGING: Cooling down (${this.formatTime(remaining)} remaining)`, "warning");
      return;
    }

    setState(s => {
      s.terminals.floor2TerminalB.cooldownStartedAt = Date.now();
      s.progression.floor2TerminalBActivated = true;
      s.system.hp = Math.min(s.system.maxHp, s.system.hp + 15);
      s.player.overclockCharges = (s.player.overclockCharges || 0) + 3;
    });

    audio.playSFX("deploy");
    ui.notify("DATA CACHE DECRYPTED: +15 System HP, +25 XP, +3 Overclock Charges! EXIT [ACCESS GRANTED]", "success");

    progression.addXP(25);
    overworld.refreshExitLockVisual();
    SaveSystem.save();
  }

  interactFloor2Repair() {
    const remaining = this.getRemainingCooldown("floor2Repair");

    if (remaining > 0) {
      audio.playSFX("warning");
      ui.notify(`HAZARD REPAIR UNIT BUSY: Cooling down (${this.formatTime(remaining)} remaining)`, "warning");
      return;
    }

    setState(s => {
      s.terminals.floor2Repair.cooldownStartedAt = Date.now();
      s.system.hp = Math.min(s.system.maxHp, s.system.hp + 40);
    });

    audio.playSFX("heal");
    ui.notify("EMERGENCY REPAIR APPLIED: +40 System Integrity restored!", "success");
    SaveSystem.save();
  }

  interactHoneypot(x, y) {
    audio.playSFX("warning");
    ui.trapAlert(
      "⚠ CRITICAL // HONEYPOT TRAP BREACHED",
      "WARNING: Anomalous cache decoy breached! Hostile malware swarm ambush countermeasure triggered. Network lockdown engaged — disengagement impossible!",
      () => {
        ui.notify("HONEYPOT AMBUSH TRIGGERED: Malware swarm converging!", "danger");
        overworld.triggerEncounter(x, y);
      }
    );
  }

  checkTerminalOperatorBadge() {
    if (state.progression.terminalAActivated && state.progression.terminalBActivated) {
      progression.unlockBadge("terminal_operator");
    }
  }
}

export const terminals = new TerminalSystem();

if (typeof window !== "undefined") {
  window.CyberTerminals = terminals;
}

