/**
 * CYBER DEFENDER — Avatar & Character Renderer
 * Manages 4-directional pixel sprite animation and vector fallback rendering,
 * and dynamically injects customizable aura glows.
 */

import { state } from "./state.js";
import { CHASSIS_STYLES, AURA_COLORS } from "../data/equipment.js";

export class AvatarRenderer {
  constructor() {
    this.walkingInterval = null;
    this.currentStepFrame = 0;
  }

  getCurrentChassis() {
    const chassisKey = state.player.avatar?.chassis || "pixel_hero";
    return CHASSIS_STYLES[chassisKey] || CHASSIS_STYLES.pixel_hero;
  }

  getCurrentAuraColor() {
    const colorKey = state.player.avatar?.color || "cyan";
    return AURA_COLORS[colorKey] || AURA_COLORS.cyan;
  }

  /**
   * Renders the Overworld player element.
   * For pixel_hero, utilizes CSS sprite strips with 4-directional orientation and step animation.
   * @param {string} facing - "down", "up", "left", "right"
   * @param {boolean} isWalking
   * @returns {string} HTML string
   */
  getOverworldPlayerHtml(facing = "down", isWalking = false) {
    const chassis = this.getCurrentChassis();
    const aura = this.getCurrentAuraColor();

    if (chassis.id === "pixel_hero") {
      const walkClass = isWalking ? "walking" : "";
      return `
        <div class="player-sprite-pixel facing-${facing} ${walkClass}" 
             style="--aura-color: ${aura.hex}; --aura-glow: ${aura.rgbaGlow};" 
             aria-label="Enuhri Operator">
        </div>
      `;
    }

    // Vector / Ghost / Sentinel avatar
    const flipStyle = facing === "left" ? "transform: scaleX(-1);" : "";
    return `
      <div class="player-sprite-vector" style="--aura-color: ${aura.hex}; --aura-glow: ${aura.rgbaGlow};">
        <img src="${chassis.spriteIdle}" alt="${chassis.name}" style="filter: drop-shadow(0 0 6px ${aura.hex}); ${flipStyle}" />
      </div>
    `;
  }

  /**
   * Renders the Combat Duel Arena player sprite.
   * Faces right towards the enemy.
   * @returns {string} HTML string
   */
  getCombatPlayerHtml() {
    const chassis = this.getCurrentChassis();
    const aura = this.getCurrentAuraColor();

    if (chassis.id === "pixel_hero") {
      return `
        <div class="player-combat-sprite pixel-combat" 
             style="--aura-color: ${aura.hex}; --aura-glow: ${aura.rgbaGlow}; background-image: url('assets/sprites/player-idle-right.png');" 
             aria-label="Enuhri Operator in Combat">
        </div>
      `;
    }

    return `
      <img class="fighter-sprite player-sprite" 
           src="${chassis.spriteCombat}" 
           alt="${chassis.name}" 
           style="filter: drop-shadow(0 0 12px ${aura.hex});" />
    `;
  }

  /**
   * Renders the Profile Studio Hologram preview.
   * @returns {string} HTML string
   */
  getStudioHologramHtml() {
    const chassis = this.getCurrentChassis();
    const aura = this.getCurrentAuraColor();

    if (chassis.id === "pixel_hero") {
      return `
        <div class="studio-hologram-avatar pixel-studio" 
             style="background-image: url('assets/sprites/player-idle-down.png'); filter: drop-shadow(0 0 14px ${aura.hex});">
        </div>
      `;
    }

    return `
      <img class="studio-hologram-avatar" 
           src="${chassis.spriteIdle}" 
           alt="${chassis.name}" 
           style="filter: drop-shadow(0 0 14px ${aura.hex});" />
    `;
  }
}

export const avatarRenderer = new AvatarRenderer();

if (typeof window !== "undefined") {
  window.CyberAvatar = avatarRenderer;
}

