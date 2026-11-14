/**
 * CYBER DEFENDER — Encounter UI Banner
 * Faithfully mirrors Godot's encounter_ui.gd
 * Displays typewriter malware encounter alerts and awaits user confirmation
 * (Touch, Click, Space, Enter, Z) before transitioning into combat.
 */

import { audio } from "./audio.js";

const ENCOUNTER_MESSAGES = [
  "A malware has been spotted!",
  "You encountered a wild malware!",
  "You stepped into a dangerous zone!",
  "Malware detected!"
];

const TYPEWRITER_SPEED_MS = 40; // 0.04s per character

export class EncounterUI {
  constructor() {
    this.overlayEl = null;
    this.textBoxEl = null;
    this.isDisplaying = false;
    this.waitingForConfirm = false;
    this.onConfirmCallback = null;
    this.currentTimeoutId = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    let container = document.getElementById("encounter-banner-overlay");
    if (!container) {
      container = document.createElement("div");
      container.id = "encounter-banner-overlay";
      container.className = "encounter-banner-overlay";
      container.innerHTML = `
        <div class="encounter-dialogue-box">
          <div class="encounter-alert-tag">⚠ THREAT DETECTED</div>
          <div id="encounter-dialogue-text" class="encounter-dialogue-text"></div>
          <div class="encounter-prompt-tag">[PRESS SPACE, ENTER, OR TAP TO ENGAGE]</div>
        </div>
      `;
      document.body.appendChild(container);
    }

    this.overlayEl = container;
    this.textBoxEl = container.querySelector("#encounter-dialogue-text");

    // Unified input handlers matching Godot's _input()
    const triggerConfirm = () => {
      if (!this.waitingForConfirm) return;
      this.confirm();
    };

    container.addEventListener("click", triggerConfirm);
    container.addEventListener("touchstart", (e) => {
      e.preventDefault();
      triggerConfirm();
    }, { passive: false });

    window.addEventListener("keydown", (e) => {
      if (!this.waitingForConfirm) return;
      if (e.key === " " || e.key === "Enter" || e.key.toLowerCase() === "z") {
        e.preventDefault();
        triggerConfirm();
      }
    });

    this.initialized = true;
  }

  showEncounter(customMessage = "", onConfirm = null) {
    this.init();
    this.onConfirmCallback = onConfirm;
    const message = customMessage || ENCOUNTER_MESSAGES[Math.floor(Math.random() * ENCOUNTER_MESSAGES.length)];

    this.currentMessage = message;
    this.overlayEl.style.display = "flex";
    this.textBoxEl.textContent = "";
    this.isDisplaying = true;
    this.waitingForConfirm = false;

    audio.playSFX("scan");

    let charIndex = 0;
    const typeNextChar = () => {
      if (charIndex < message.length) {
        this.textBoxEl.textContent += message[charIndex];
        charIndex++;
        this.currentTimeoutId = setTimeout(typeNextChar, TYPEWRITER_SPEED_MS);
      } else {
        this.isDisplaying = false;
        this.waitingForConfirm = true;
      }
    };

    typeNextChar();
  }

  confirm() {
    if (!this.waitingForConfirm && this.isDisplaying) {
      // Fast-forward text if player clicks while typing
      if (this.currentTimeoutId) clearTimeout(this.currentTimeoutId);
      if (this.currentMessage) this.textBoxEl.textContent = this.currentMessage;
      this.isDisplaying = false;
      this.waitingForConfirm = true;
      return;
    }

    this.waitingForConfirm = false;
    audio.playSFX("menu_click");

    this.overlayEl.style.display = "none";
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    }
  }
}

export const encounterUI = new EncounterUI();

if (typeof window !== "undefined") {
  window.CyberEncounterUI = encounterUI;
}
