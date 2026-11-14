/**
 * CYBER DEFENDER — Persistent Save & Inactivity Decay System
 * LocalStorage management with timestamp-based cooldowns and daily retention penalties.
 */

import { state, setState, createInitialState, events } from "./state.js";

const SAVE_KEY = "cyberdefender_save_v1";

export class SaveSystem {
  static save() {
    try {
      state.system.lastActiveDate = Date.now();
      const serialized = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, serialized);
      events.emit("gameSaved", { timestamp: Date.now() });
      return true;
    } catch (err) {
      console.error("[SaveSystem]: Failed to serialize save data:", err);
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        console.log("[SaveSystem]: No existing save file found. Initializing fresh session.");
        return false;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.player) {
        console.warn("[SaveSystem]: Corrupted save structure detected. Resetting to defaults.");
        events.emit("toast", { message: "SYSTEM NOTICE: Corrupted save detected, defaults restored.", type: "warning" });
        return false;
      }

      // Merge loaded values safely over fresh default state
      setState(currentState => {
        Object.assign(currentState.player, parsed.player);
        if (parsed.player) {
          currentState.player.avatar = Object.assign({ chassis: "pixel_hero", color: "cyan" }, currentState.player.avatar, parsed.player.avatar);
          currentState.player.equipment = Object.assign({ deck: "deck_standard", shield: "shield_standard" }, currentState.player.equipment, parsed.player.equipment);
        }
        Object.assign(currentState.system, parsed.system);
        Object.assign(currentState.progression, parsed.progression);
        Object.assign(currentState.terminals, parsed.terminals);
        Object.assign(currentState.settings, parsed.settings);
      });

      // Calculate Daily Inactivity Decay (-25 HP per missed day, capped at -75)
      this.applyInactivityDecay();

      events.emit("gameLoaded", state);
      console.log(`[SaveSystem]: Save data restored for operator ${state.player.name}.`);
      return true;
    } catch (err) {
      console.warn("[SaveSystem]: Failed to parse save data:", err);
      events.emit("toast", { message: "SYSTEM NOTICE: Corrupted save detected, defaults restored.", type: "warning" });
      return false;
    }
  }

  static applyInactivityDecay() {
    const lastActive = state.system.lastActiveDate || Date.now();
    const elapsedMs = Date.now() - lastActive;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const missedDays = Math.floor(elapsedMs / oneDayMs);

    if (missedDays > 0) {
      const decayAmount = Math.min(75, missedDays * 25);
      state.system.hp = Math.max(0, state.system.hp - decayAmount);
      console.warn(`[SaveSystem]: Applied ${decayAmount}% System HP inactivity penalty for ${missedDays} missed day(s).`);
      events.emit("systemHpChanged", { hp: state.system.hp, decay: decayAmount });
    }

    state.system.lastActiveDate = Date.now();
  }

  static hasSave() {
    return Boolean(localStorage.getItem(SAVE_KEY));
  }

  static reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
      const fresh = createInitialState();
      setState(currentState => {
        Object.assign(currentState, fresh);
      });
      console.log("[SaveSystem]: Save data wiped. State reset to defaults.");
      return true;
    } catch (err) {
      console.error("[SaveSystem]: Error clearing save data:", err);
      return false;
    }
  }
}

if (typeof window !== "undefined") {
  window.CyberSave = SaveSystem;
}

