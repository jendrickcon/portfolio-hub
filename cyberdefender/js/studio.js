/**
 * CYBER DEFENDER — Avatar & Cyber Equipment Studio Controller
 * Manages loadout customization, chassis styles, aura colorways,
 * cyber decks, and security shields with live hologram preview and save persistence.
 */

import { state, setState } from "./state.js";
import { CHASSIS_STYLES, AVATAR_LIST, AURA_COLORS, CYBER_DECKS, SECURITY_SHIELDS } from "../data/equipment.js";
import { avatarRenderer } from "./avatar.js";
import { SaveSystem } from "./save.js";
import { ui } from "./ui.js";
import { audio } from "./audio.js";

export class StudioController {
  constructor() {
    this.initialized = false;
    this.activeTab = "chassis";
  }

  /**
   * Initializes tab listeners and event delegation. Called safely once.
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.bindTabEvents();
    this.bindGridItemEvents();
  }

  /**
   * Binds click handlers for studio tab buttons.
   */
  bindTabEvents() {
    const tabButtons = document.querySelectorAll(".studio-tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabKey = btn.dataset.tab;
        if (!tabKey) return;
        this.switchTab(tabKey);
      });
    });
  }

  /**
   * Switches the active studio tab and panel.
   * @param {string} tabKey - "chassis", "aura", "decks", "shields"
   */
  switchTab(tabKey) {
    this.activeTab = tabKey;

    // 1. Toggle Tab Button States
    const tabButtons = document.querySelectorAll(".studio-tab-btn");
    tabButtons.forEach(btn => {
      btn.classList.toggle("tab-active", btn.dataset.tab === tabKey);
    });

    // 2. Toggle Panels
    const panels = {
      chassis: document.getElementById("panel-chassis"),
      aura: document.getElementById("panel-aura"),
      decks: document.getElementById("panel-decks"),
      shields: document.getElementById("panel-shields")
    };

    Object.entries(panels).forEach(([key, panel]) => {
      if (!panel) return;
      const isActive = key === tabKey;
      panel.classList.toggle("panel-active", isActive);
      panel.style.display = isActive ? "block" : "none";
    });

    // 3. Render the selected grid
    this.renderGrid(tabKey);
  }

  /**
   * Uses event delegation for equipping items across all studio panels.
   */
  bindGridItemEvents() {
    const panelsContainer = document.querySelector(".studio-panels");
    if (!panelsContainer) return;

    panelsContainer.addEventListener("click", (e) => {
      // Find card or button
      const actionBtn = e.target.closest(".gear-btn:not(:disabled)");
      const swatchCard = e.target.closest(".aura-swatch-card:not(.locked)");
      const card = e.target.closest(".gear-card:not(.locked)");

      if (actionBtn) {
        const { slot, id } = actionBtn.dataset;
        if (slot && id) {
          this.equipItem(slot, id);
        }
        return;
      }

      if (swatchCard) {
        const { slot, id } = swatchCard.dataset;
        if (slot && id) {
          this.equipItem(slot, id);
        }
        return;
      }

      if (card) {
        const { slot, id } = card.dataset;
        if (slot && id) {
          this.equipItem(slot, id);
        }
      }
    });
  }

  /**
   * Refreshes the studio when the Profile scene is opened.
   */
  refresh() {
    this.refreshHologram();
    this.refreshSummaryChips();
    this.renderGrid(this.activeTab);
  }

  /**
   * Updates the live hologram avatar on the pedestal stage.
   */
  refreshHologram() {
    const hologramEl = document.getElementById("studio-hologram-avatar");
    if (hologramEl) {
      hologramEl.innerHTML = avatarRenderer.getStudioHologramHtml();
    }
  }

  /**
   * Updates the loadout summary chips below the hologram.
   */
  refreshSummaryChips() {
    const chassisChip = document.getElementById("studio-summary-chassis");
    const deckChip = document.getElementById("studio-summary-deck");
    const shieldChip = document.getElementById("studio-summary-shield");

    const curChassisId = state.player.avatar?.chassis || "pixel_hero";
    const curDeckId = state.player.equipment?.deck || "deck_standard";
    const curShieldId = state.player.equipment?.shield || "shield_standard";

    const chassis = CHASSIS_STYLES[curChassisId] || CHASSIS_STYLES.pixel_hero;
    const deck = CYBER_DECKS[curDeckId] || CYBER_DECKS.deck_standard;
    const shield = SECURITY_SHIELDS[curShieldId] || SECURITY_SHIELDS.shield_standard;

    if (chassisChip) chassisChip.textContent = chassis.name;
    if (deckChip) deckChip.textContent = `${deck.icon} ${deck.name}`;
    if (shieldChip) shieldChip.textContent = `${shield.icon} ${shield.name}`;
  }

  /**
   * Evaluates whether an equipment item is currently unlocked.
   * @param {string} slot - "chassis", "aura", "deck", "shield"
   * @param {object} item - equipment data item
   * @returns {boolean}
   */
  isItemUnlocked(slot, item) {
    if (slot === "chassis") {
      return true; // All baseline chassis unlocked
    }

    if (slot === "aura") {
      if (item.id === "cyan") return true;
      if (item.reqLevel && state.player.level >= item.reqLevel) return true;
      if (item.reqKills) {
        const totalKills = Object.values(state.player.kills || {}).reduce((sum, val) => sum + val, 0);
        return totalKills >= item.reqKills;
      }
      return false;
    }

    // Decks & Shields
    if (item.unlocked) return true;
    if (typeof item.checkUnlock === "function") {
      return item.checkUnlock(state);
    }
    return false;
  }

  /**
   * Renders the items for the specified studio tab.
   * @param {string} tabKey - "chassis", "aura", "decks", "shields"
   */
  renderGrid(tabKey) {
    switch (tabKey) {
      case "chassis":
        this.renderChassisGrid();
        break;
      case "aura":
        this.renderAuraGrid();
        break;
      case "decks":
        this.renderDecksGrid();
        break;
      case "shields":
        this.renderShieldsGrid();
        break;
      default:
        break;
    }
  }

  renderChassisGrid() {
    const container = document.getElementById("grid-chassis");
    if (!container) return;

    const currentId = state.player.avatar?.chassis || "pixel_hero";
    const items = AVATAR_LIST || [CHASSIS_STYLES.pixel_hero, CHASSIS_STYLES.infiltrator, CHASSIS_STYLES.sentinel];

    container.innerHTML = items.map(item => {
      const isEquipped = item.id === currentId || (currentId === "vector_visor" && item.id === "sentinel");
      return `
        <div class="gear-card ${isEquipped ? 'equipped' : ''}" data-slot="chassis" data-id="${item.id}">
          <div class="gear-card-header">
            <span class="gear-card-name">${item.name}</span>
            <span class="gear-card-stat">${item.tagline}</span>
          </div>
          <p class="gear-card-desc">${item.desc}</p>
          <div class="gear-card-action">
            <button type="button" class="gear-btn ${isEquipped ? 'equipped-btn' : ''}" data-slot="chassis" data-id="${item.id}">
              ${isEquipped ? 'EQUIPPED ✓' : 'EQUIP'}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderAuraGrid() {
    const container = document.getElementById("grid-aura");
    if (!container) return;

    const currentId = state.player.avatar?.color || "cyan";

    container.innerHTML = Object.values(AURA_COLORS).map(item => {
      const isEquipped = item.id === currentId;
      const unlocked = this.isItemUnlocked("aura", item);

      return `
        <div class="aura-swatch-card ${isEquipped ? 'active' : ''} ${!unlocked ? 'locked' : ''}"
             style="--swatch-color: ${item.hex}; --swatch-glow: ${item.rgbaGlow};"
             data-slot="aura" data-id="${item.id}">
          <div class="aura-dot" style="background: ${item.hex}; color: ${item.hex};"></div>
          <span class="aura-name">${item.name}</span>
          <span class="aura-req">${unlocked ? (isEquipped ? 'EQUIPPED ✓' : 'EQUIP') : `🔒 ${item.unlockReq}`}</span>
        </div>
      `;
    }).join("");
  }

  renderDecksGrid() {
    const container = document.getElementById("grid-decks");
    if (!container) return;

    const currentId = state.player.equipment?.deck || "deck_standard";

    container.innerHTML = Object.values(CYBER_DECKS).map(item => {
      const isEquipped = item.id === currentId;
      const unlocked = this.isItemUnlocked("deck", item);

      return `
        <div class="gear-card ${isEquipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}" data-slot="deck" data-id="${item.id}">
          <div class="gear-card-header">
            <span class="gear-card-name">${item.icon} ${item.name}</span>
            <span class="gear-card-stat">${item.statLabel}</span>
          </div>
          <p class="gear-card-desc">${item.perk}</p>
          <div class="gear-card-action">
            <button type="button" class="gear-btn ${isEquipped ? 'equipped-btn' : ''} ${!unlocked ? 'locked-btn' : ''}"
                    data-slot="deck" data-id="${item.id}" ${!unlocked ? 'disabled' : ''}>
              ${!unlocked ? `🔒 ${item.unlockReq}` : (isEquipped ? 'EQUIPPED ✓' : 'EQUIP')}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderShieldsGrid() {
    const container = document.getElementById("grid-shields");
    if (!container) return;

    const currentId = state.player.equipment?.shield || "shield_standard";

    container.innerHTML = Object.values(SECURITY_SHIELDS).map(item => {
      const isEquipped = item.id === currentId;
      const unlocked = this.isItemUnlocked("shield", item);

      return `
        <div class="gear-card ${isEquipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}" data-slot="shield" data-id="${item.id}">
          <div class="gear-card-header">
            <span class="gear-card-name">${item.icon} ${item.name}</span>
            <span class="gear-card-stat">${item.statLabel}</span>
          </div>
          <p class="gear-card-desc">${item.perk}</p>
          <div class="gear-card-action">
            <button type="button" class="gear-btn ${isEquipped ? 'equipped-btn' : ''} ${!unlocked ? 'locked-btn' : ''}"
                    data-slot="shield" data-id="${item.id}" ${!unlocked ? 'disabled' : ''}>
              ${!unlocked ? `🔒 ${item.unlockReq}` : (isEquipped ? 'EQUIPPED ✓' : 'EQUIP')}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Equips an unlocked item into the appropriate player state slot.
   * @param {string} slot - "chassis", "aura", "deck", "shield"
   * @param {string} id - Item ID
   */
  equipItem(slot, id) {
    // Prevent notification spam — skip if item is already equipped
    const currentChassis = state.player.avatar?.chassis || "pixel_hero";
    const currentAura = state.player.avatar?.color || "cyan";
    const currentDeck = state.player.equipment?.deck || "deck_standard";
    const currentShield = state.player.equipment?.shield || "shield_standard";

    if (
      (slot === "chassis" && currentChassis === id) ||
      (slot === "aura" && currentAura === id) ||
      (slot === "deck" && currentDeck === id) ||
      (slot === "shield" && currentShield === id)
    ) {
      return; // Already equipped — no-op
    }

    let itemName = id;

    if (slot === "chassis") {
      const item = CHASSIS_STYLES[id];
      if (!item) return;
      itemName = item.name;
      setState(s => {
        s.player.avatar = s.player.avatar || {};
        s.player.avatar.chassis = id;
      });
    } else if (slot === "aura") {
      const item = AURA_COLORS[id];
      if (!item || !this.isItemUnlocked("aura", item)) {
        ui.notify(`LOCKED: ${item?.unlockReq || 'Clearance needed'}`, "warning");
        audio.playSFX("warning");
        return;
      }
      itemName = item.name;
      setState(s => {
        s.player.avatar = s.player.avatar || {};
        s.player.avatar.color = id;
      });
    } else if (slot === "deck") {
      const item = CYBER_DECKS[id];
      if (!item || !this.isItemUnlocked("deck", item)) {
        ui.notify(`LOCKED: ${item?.unlockReq || 'Clearance needed'}`, "warning");
        audio.playSFX("warning");
        return;
      }
      itemName = item.name;
      setState(s => {
        s.player.equipment = s.player.equipment || {};
        s.player.equipment.deck = id;
      });
    } else if (slot === "shield") {
      const item = SECURITY_SHIELDS[id];
      if (!item || !this.isItemUnlocked("shield", item)) {
        ui.notify(`LOCKED: ${item?.unlockReq || 'Clearance needed'}`, "warning");
        audio.playSFX("warning");
        return;
      }
      itemName = item.name;
      setState(s => {
        s.player.equipment = s.player.equipment || {};
        s.player.equipment.shield = id;
      });
    }

    audio.playSFX("deploy");
    ui.notify(`LOADOUT CONFIGURED: Equipped ${itemName}!`, "success");

    // Persist immediately
    SaveSystem.save();

    // Re-render UI components
    this.refreshHologram();
    this.refreshSummaryChips();
    this.renderGrid(this.activeTab);
  }
}

export const studioController = new StudioController();

if (typeof window !== "undefined") {
  window.CyberStudio = studioController;
}

