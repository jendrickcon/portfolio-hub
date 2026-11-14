/**
 * CYBER DEFENDER — Progression, Leveling, & Badge Engine
 * Handles XP accumulation, rank advancement, badge unlocks, and floor clearances.
 */

import { state, events, setState } from "./state.js";
import { RANKS, BADGES, getRankForLevel, getXpRequiredForLevel } from "../data/badges.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";

export class ProgressionEngine {
  constructor() {}

  /**
   * Adds experience points and processes potential level-ups and rank promotions.
   * @param {number} xpAmount 
   */
  addXP(xpAmount) {
    if (xpAmount <= 0) return;

    let currentLvl = state.player.level;
    let currentXp = state.player.xp + xpAmount;
    let leveledUp = false;

    while (currentLvl < 30) {
      const required = getXpRequiredForLevel(currentLvl);
      if (currentXp >= required) {
        currentXp -= required;
        currentLvl++;
        leveledUp = true;
      } else {
        break;
      }
    }

    // Cap at lvl 30
    if (currentLvl >= 30) {
      currentLvl = 30;
      currentXp = Math.min(currentXp, getXpRequiredForLevel(30));
    }

    const previousLevel = state.player.level;

    setState(s => {
      s.player.level = currentLvl;
      s.player.xp = currentXp;

      // Floor 2 unlock condition
      if (currentLvl >= 10 && !s.progression.unlockedFloor2) {
        s.progression.unlockedFloor2 = true;
      }
    });

    if (leveledUp) {
      audio.playSFX("level_up");
      const newRank = getRankForLevel(currentLvl);
      const oldRank = getRankForLevel(previousLevel);

      ui.notify(`CLEARANCE UPGRADE: Level ${currentLvl} Reached!`, "success");

      if (newRank !== oldRank) {
        setTimeout(() => {
          ui.notify(`PROMOTION: Clearance Rank elevated to ${newRank.toUpperCase()}!`, "warning");
        }, 1200);
      }

      if (currentLvl >= 10) {
        this.unlockBadge("pcb_sector_cleared");
        if (currentLvl === 10) {
          setTimeout(() => {
            ui.notify("SECURITY CLEARANCE GRANTED: Floor 02 (Hazard Zone) Unlocked!", "info");
          }, 2400);
        }
      }

      if (currentLvl === 30) {
        this.unlockBadge("incident_commander");
      }
    }

    this.checkKillBadges();
    ui.syncHUD();
    SaveSystem.save();
  }

  /**
   * Check kill counts and unlock corresponding badges
   */
  checkKillBadges() {
    const kills = state.player.kills || {};
    const totalKills = (kills.worm || 0) + (kills.spyware || 0) + (kills.trojan || 0) + (kills.adware || 0);

    if (totalKills >= 1) {
      this.unlockBadge("first_blood");
    }
    if ((kills.worm || 0) >= 5) {
      this.unlockBadge("worm_hunter");
    }
    if ((kills.spyware || 0) >= 5) {
      this.unlockBadge("spy_buster");
    }
    if ((kills.trojan || 0) >= 5) {
      this.unlockBadge("trojan_decimator");
    }
    if ((kills.adware || 0) >= 5) {
      this.unlockBadge("ad_blocker");
    }
  }

  /**
   * Unlocks a badge by ID if not already obtained.
   * @param {string} badgeId 
   */
  unlockBadge(badgeId) {
    if (!state.player.badges.includes(badgeId)) {
      const badgeDef = BADGES.find(b => b.id === badgeId);
      if (!badgeDef) return;

      setState(s => {
        s.player.badges.push(badgeId);
      });

      audio.playSFX("level_up");
      ui.notify(`ACHIEVEMENT UNLOCKED: ${badgeDef.name} (${badgeDef.icon})`, "warning");
      SaveSystem.save();
    }
  }
}

export const progression = new ProgressionEngine();

if (typeof window !== "undefined") {
  window.CyberProgression = progression;
}

