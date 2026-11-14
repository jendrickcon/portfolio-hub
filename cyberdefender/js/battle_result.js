/**
 * CYBER DEFENDER — Battle Result Overlay
 * Faithfully mirrors Godot's battle_result.gd
 * Displays dynamic System HP integrity, color-coded health ratios,
 * earned XP breakdown, level-up banners, and animated transition back to overworld.
 */

import { state, events } from "./state.js";
import { audio } from "./audio.js";
import { scenes } from "./scenes.js";

export class BattleResultOverlay {
  constructor() {
    this.overlayEl = null;
    this.panelEl = null;
    this.titleEl = null;
    this.xpEl = null;
    this.levelEl = null;
    this.sysHpEl = null;
    this.continueBtn = null;
    this.onContinueCallback = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    let container = document.getElementById("battle-result-overlay");
    if (!container) {
      container = document.createElement("div");
      container.id = "battle-result-overlay";
      container.className = "battle-result-overlay";
      container.innerHTML = `
        <div class="battle-result-backdrop"></div>
        <div class="battle-result-panel">
          <div class="result-header">
            <h2 id="result-title" class="result-title">>> VICTORY <<</h2>
            <div class="result-divider"></div>
          </div>
          <div class="result-body">
            <div id="result-xp" class="result-stat-line result-xp">+ 60 XP EARNED</div>
            <div id="result-level" class="result-stat-line result-level" style="display: none;">LEVEL UP! LV 2</div>
            <div id="result-syshp" class="result-stat-line result-syshp">SYSTEM HP: 100 / 100</div>
          </div>
          <div class="result-footer">
            <button id="btn-result-continue" type="button" class="cyber-btn cyber-btn--primary result-continue-btn">CONTINUE [ENTER]</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    }

    this.overlayEl = container;
    this.panelEl = container.querySelector(".battle-result-panel");
    this.titleEl = container.querySelector("#result-title");
    this.xpEl = container.querySelector("#result-xp");
    this.levelEl = container.querySelector("#result-level");
    this.sysHpEl = container.querySelector("#result-syshp");
    this.continueBtn = container.querySelector("#btn-result-continue");

    this.continueBtn.addEventListener("click", () => this.handleContinue());
    window.addEventListener("keydown", (e) => {
      if (!this.overlayEl || this.overlayEl.style.display !== "flex") return;
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.handleContinue();
      }
    });

    this.initialized = true;
  }

  show({ victory, xp = 0, levelsUp = 0, sysDamageTaken = 0, onContinue = null }) {
    this.init();
    this.onContinueCallback = onContinue;

    const sysHp = state.system.hp;
    const maxSysHp = state.system.maxHp || 100;
    const sysRatio = sysHp / maxSysHp;

    // 1. System HP Label & Color Coding matching Godot
    if (sysHp <= 0) {
      this.sysHpEl.textContent = "SYSTEM CRITICAL!\nSECTOR COMPROMISED";
      this.sysHpEl.className = "result-stat-line result-sys-critical";
    } else {
      let colorClass = "result-sys-heal"; // > 0.50
      if (sysRatio <= 0.25) {
        colorClass = "result-sys-danger";
      } else if (sysRatio <= 0.50) {
        colorClass = "result-sys-warning";
      }
      this.sysHpEl.textContent = `SYSTEM HP: ${sysHp} / ${maxSysHp}`;
      this.sysHpEl.className = `result-stat-line ${colorClass}`;
    }

    // 2. Victory vs Defeat content
    if (victory) {
      this.titleEl.textContent = ">> VICTORY <<";
      this.titleEl.className = "result-title result-title--victory";
      this.xpEl.textContent = `+ ${xp} XP EARNED`;
      this.xpEl.className = "result-stat-line result-xp";

      if (levelsUp > 0) {
        this.levelEl.style.display = "block";
        this.levelEl.textContent = `LEVEL UP!   LV ${state.player.level}`;
      } else {
        this.levelEl.style.display = "none";
        const needed = state.player.level * 100;
        this.xpEl.textContent += `\n${state.player.xp} / ${needed} XP`;
      }
    } else {
      this.titleEl.textContent = ">> DEFEATED <<";
      this.titleEl.className = "result-title result-title--defeat";
      this.xpEl.textContent = "SYSTEM COMPROMISED\nNO XP GAINED";
      this.xpEl.className = "result-stat-line result-xp-defeat";
      this.levelEl.style.display = "none";
    }

    this.continueBtn.disabled = false;
    this.overlayEl.style.display = "flex";
    this.overlayEl.classList.add("fade-in");
    this.panelEl.classList.add("popup-scale");
  }

  handleContinue() {
    if (this.continueBtn.disabled) return;
    this.continueBtn.disabled = true;
    audio.playSFX("menu_click");

    this.overlayEl.classList.remove("fade-in");
    this.overlayEl.classList.add("fade-out");

    setTimeout(() => {
      this.overlayEl.style.display = "none";
      this.overlayEl.classList.remove("fade-out");
      if (this.onContinueCallback) {
        this.onContinueCallback();
      } else {
        scenes.change("OVERWORLD");
      }
    }, 280);
  }
}

export const battleResultOverlay = new BattleResultOverlay();

if (typeof window !== "undefined") {
  window.CyberBattleResult = battleResultOverlay;
}

