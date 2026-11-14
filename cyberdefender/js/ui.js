/**
 * CYBER DEFENDER — Reusable UI Components & State Synchronization
 * Manages HUD, modals, notification toasts, and audio-reactive button feedback.
 */

import { state, events, setState } from "./state.js";
import { audio } from "./audio.js";
import { playerController } from "./player.js";

class UIManager {
  constructor() {
    this.modalOverlay = null;
    this.toastContainer = null;
  }

  init() {
    this.modalOverlay = document.getElementById("modal-overlay");
    this.toastContainer = document.getElementById("toast-container");

    this.bindAudioToButtons();
    this.subscribeToStateEvents();
    this.updateHUD();
  }

  bindAudioToButtons() {
    // Add audio click feedback to buttons automatically
    document.addEventListener("click", (event) => {
      const btn = event.target.closest("button, .cyber-btn");
      if (btn && !btn.disabled && !btn.classList.contains("btn-disabled")) {
        audio.playSFX("menu_click");
      }
    });
  }

  subscribeToStateEvents() {
    events.on("stateChanged", () => this.updateHUD());
    events.on("systemHpChanged", () => this.updateHUD());
    events.on("playerLeveledUp", (payload) => {
      audio.playSFX("level_up");
      this.notify(`LEVEL UP! Operator attained Level ${payload.level}: ${payload.rank}`, "success");
      this.updateHUD();
    });
  }

  syncHUD() {
    this.updateHUD();
  }

  updateHUD() {
    const hudSysHealth = document.getElementById("hud-system-status");
    const hudOperator = document.getElementById("hud-operator-id");

    if (hudSysHealth) {
      const hp = Math.max(0, Math.min(100, state.system.hp));
      const statusText = hp > 60 ? "NOMINAL" : hp > 25 ? "WARNING" : "CRITICAL";
      hudSysHealth.textContent = `SYS_HEALTH: ${hp}% [${statusText}]`;
      
      const statusDot = document.querySelector(".status-dot");
      if (statusDot) {
        statusDot.style.background = hp > 60 ? "var(--green)" : hp > 25 ? "var(--gold)" : "var(--danger)";
        statusDot.style.boxShadow = hp > 60 ? "0 0 6px var(--green)" : hp > 25 ? "0 0 6px var(--gold)" : "0 0 8px var(--danger)";
      }
    }

    if (hudOperator) {
      const ocText = state.player.overclockCharges > 0 ? ` [OC: x${state.player.overclockCharges}]` : "";
      hudOperator.textContent = `OPERATOR: ${state.player.name.toUpperCase()} [LVL ${state.player.level}]${ocText}`;
    }

    // Update Profile scene elements if present
    const profileName = document.querySelector(".id-name");
    const profileRank = document.querySelector(".id-rank");
    if (profileName) profileName.textContent = `${state.player.name.toUpperCase()} OPERATOR`;
    if (profileRank) {
      import("../data/badges.js").then(({ getRankForLevel, getXpRequiredForLevel, BADGES }) => {
        profileRank.textContent = `${getRankForLevel(state.player.level).toUpperCase()} [LVL ${state.player.level}]`;
        
        const xpEl = document.getElementById("profile-stat-xp");
        const hpEl = document.getElementById("profile-stat-hp");
        const killsEl = document.getElementById("profile-stat-kills");
        const ocEl = document.getElementById("profile-stat-oc");
        const killsBreakdownEl = document.getElementById("profile-kills-breakdown");
        const badgesListEl = document.getElementById("profile-badges-list");

        if (xpEl) xpEl.textContent = `${state.player.xp} / ${getXpRequiredForLevel(state.player.level)} XP`;
        if (hpEl) hpEl.textContent = `${state.player.hp} / ${state.player.maxHp} HP`;

        const kills = state.player.kills || {};
        const totalKills = (kills.worm || 0) + (kills.adware || 0) + (kills.spyware || 0) + (kills.trojan || 0);
        if (killsEl) killsEl.textContent = `${totalKills} Processes`;
        if (ocEl) ocEl.textContent = `${state.player.overclockCharges || 0} Active`;

        if (killsBreakdownEl) {
          killsBreakdownEl.innerHTML = `
            <span>🐴 Trojan: ${kills.trojan || 0}</span>
            <span>🐛 Worm: ${kills.worm || 0}</span>
            <span>👁 Spyware: ${kills.spyware || 0}</span>
            <span>🚫 Adware: ${kills.adware || 0}</span>
          `;
        }

        if (badgesListEl) {
          const earned = state.player.badges || [];
          if (earned.length === 0) {
            badgesListEl.innerHTML = `<span style="color: var(--dim-text); font-style: italic;">No commendations recorded yet. Infiltrate sectors to earn honors.</span>`;
          } else {
            badgesListEl.innerHTML = earned.map(badgeId => {
              const def = BADGES.find(b => b.id === badgeId);
              if (!def) return "";
              return `<span style="background: rgba(0,240,255,0.1); border: 1px solid var(--cyan); padding: 3px 8px; border-radius: 3px; color: var(--cyan); display: inline-flex; align-items: center; gap: 4px;" title="${def.desc}">${def.icon} ${def.name}</span>`;
            }).join("");
          }
        }
      }).catch(() => {});
    }
  }

  showModal(htmlContent) {
    if (!this.modalOverlay) return;
    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        ${htmlContent}
      </div>
    `;
    this.modalOverlay.classList.add("modal-active");
  }

  closeModal() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove("modal-active");
    this.modalOverlay.innerHTML = "";
  }

  showStatsModal() {
    import("../data/badges.js").then(({ getRankForLevel, getXpRequiredForLevel, BADGES }) => {
      const p = state.player;
      const xpRequired = getXpRequiredForLevel(p.level);
      const xpPct = Math.min(100, Math.round((p.xp / xpRequired) * 100));
      const totalKills = Object.values(p.kills || {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
      const earned = p.badges || [];

      const badgesHtml = earned.length === 0
        ? `<span style="color: var(--dim-text); font-style: italic;">No commendations yet.</span>`
        : earned.map(id => {
            const def = (BADGES || []).find(b => b.id === id);
            if (!def) return "";
            return `<span style="background: rgba(0,240,255,0.1); border: 1px solid var(--cyan); padding: 3px 8px; border-radius: 3px; color: var(--cyan); display: inline-flex; align-items: center; gap: 4px;" title="${def.desc}">${def.icon} ${def.name}</span>`;
          }).filter(Boolean).join("");

      this.showModal(`
        <h3 class="title-glitch" style="font-size: 20px; color: var(--cyan); text-align: left; margin-bottom: 6px;">
          ${(p.name || "OPERATOR").toUpperCase()} — ${getRankForLevel(p.level).toUpperCase()} [LVL ${p.level}]
        </h3>

        <div style="margin: 14px 0;">
          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--dim-text); margin-bottom:4px;">
            <span>SYSTEM EXPERIENCE</span><span>${p.xp} / ${xpRequired} XP</span>
          </div>
          <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${xpPct}%;"></div></div>
        </div>

        <div style="display:flex; gap:20px; font-size:12px; color:var(--bright-text); margin:12px 0;">
          <span>HP: <strong style="color:var(--cyan);">${p.hp}/${p.maxHp}</strong></span>
          <span>KILLS: <strong style="color:var(--danger);">${totalKills}</strong></span>
          <span>OVERCLOCK: <strong style="color:var(--gold);">×${p.overclockCharges || 0}</strong></span>
        </div>

        <div style="font-size:11px; color:var(--gold); text-transform:uppercase; margin:14px 0 6px; letter-spacing:1px;">Commendations</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; max-height:120px; overflow-y:auto;">${badgesHtml}</div>

        <div style="display:flex; justify-content:flex-end;">
          <button type="button" id="modal-btn-stats-close" class="cyber-btn" style="min-width:100px; padding:8px 16px;">CLOSE</button>
        </div>
      `);

      const handleClose = () => {
        window.removeEventListener("keydown", handleKey);
        this.closeModal();
        playerController.unlock();
      };

      const handleKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }
      };

      window.addEventListener("keydown", handleKey);

      document.getElementById("modal-btn-stats-close")?.addEventListener("click", () => {
        handleClose();
      });
    });
  }

  confirm(title, message, onConfirm) {
    this.showModal(`
      <h3 class="title-glitch" style="font-size: 20px; color: var(--danger); text-align: left;">${title}</h3>
      <p style="color: var(--bright-text); margin: 12px 0 20px; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" id="modal-btn-cancel" class="cyber-btn" style="min-width: 100px; padding: 8px 16px;">CANCEL</button>
        <button type="button" id="modal-btn-confirm" class="cyber-btn cyber-btn--danger" style="min-width: 100px; padding: 8px 16px;">CONFIRM</button>
      </div>
    `);

    document.getElementById("modal-btn-cancel")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.closeModal();
    });

    document.getElementById("modal-btn-confirm")?.addEventListener("click", () => {
      audio.playSFX("warning");
      this.closeModal();
      if (typeof onConfirm === "function") onConfirm();
    });
  }

  trapAlert(title, message, onEngage) {
    playerController.lock();
    this.showModal(`
      <h3 class="title-glitch" style="font-size: 20px; color: var(--danger); text-align: left;">${title}</h3>
      <p style="color: var(--bright-text); margin: 12px 0 20px; line-height: 1.5;">${message}</p>
      <div style="display: flex; justify-content: flex-end;">
        <button type="button" id="modal-btn-trap-engage" class="cyber-btn cyber-btn--danger" style="min-width: 140px; padding: 8px 18px;">
          ENGAGE HOSTILES ❯
        </button>
      </div>
    `);

    let engaged = false;
    const proceed = () => {
      if (engaged) return;
      engaged = true;
      window.removeEventListener("keydown", handleKey);
      audio.playSFX("warning");
      this.closeModal();
      if (typeof onEngage === "function") onEngage();
    };

    const handleKey = (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        proceed();
      }
    };

    window.addEventListener("keydown", handleKey);
    const btn = document.getElementById("modal-btn-trap-engage");
    btn?.addEventListener("click", proceed);
    btn?.focus();
  }

  alert(title, lines = [], okCallback = null, borderColor = "var(--cyan)") {
    const linesHtml = lines.map(line => {
      const text = typeof line === "string" ? line : line.text;
      const color = (line && line.color) ? line.color : "var(--bright-text)";
      const isAsterisk = text.includes("* * *");
      return `<p style="margin: ${isAsterisk ? '2px 0' : '8px 0'}; font-size: ${isAsterisk ? '11px' : '13px'}; line-height: 1.5; color: ${color};">${text}</p>`;
    }).join("");

    this.showModal(`
      <div style="border-top: 3px solid ${borderColor}; padding-top: 8px; text-align: center;">
        <h3 class="title-glitch" style="font-size: 20px; color: ${borderColor}; text-align: center; margin-bottom: 8px;">${title}</h3>
        <div style="margin: 12px 0 20px;">
          ${linesHtml}
        </div>
        <div style="display: flex; justify-content: center;">
          <button type="button" id="modal-btn-ok" class="cyber-btn cyber-btn--primary" style="min-width: 140px; padding: 10px 20px;">[ OK ]</button>
        </div>
      </div>
    `);

    document.getElementById("modal-btn-ok")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.closeModal();
      if (typeof okCallback === "function") okCallback();
    });
  }

  promptNameEntry(onComplete) {
    this.showModal(`
      <h3 class="title-glitch" style="font-size: 22px; text-align: left; margin-bottom: 6px;">ADMIN REGISTRATION</h3>
      <p style="color: var(--dim-text); font-size: 12px; margin-bottom: 16px;">ENTER SECURITY CLEARANCE CODENAME</p>
      <form id="form-name-entry" style="display: flex; flex-direction: column; gap: 16px;">
        <input 
          type="text" 
          id="input-operator-name" 
          value="ADMIN"
          placeholder="ADMIN" 
          maxlength="16" 
          autocomplete="off"
          style="background: #040a12; border: 1px solid var(--cyan); color: var(--cyan); padding: 12px; font-family: var(--font-mono); font-size: 16px; border-radius: 4px; outline: none;" 
        />
        <p id="name-entry-error" style="color: var(--danger); font-size: 11px; display: none;">CODENAME CANNOT BE EMPTY.</p>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" id="btn-name-confirm" class="cyber-btn cyber-btn--primary" style="min-width: 140px;">CONFIRM</button>
        </div>
      </form>
    `);

    const form = document.getElementById("form-name-entry");
    const input = document.getElementById("input-operator-name");
    const error = document.getElementById("name-entry-error");

    if (input) {
      input.focus();
      input.select();
    }

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input?.value.trim() || "ADMIN";

      // Sanitize: alphanumeric and underscores only
      const sanitized = raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16);
      setState(s => { s.player.name = sanitized || "ADMIN"; });
      this.closeModal();
      audio.playSFX("boot_beep");
      this.notify(`IDENTITY REGISTERED: ${state.player.name}`, "info");
      if (typeof onComplete === "function") onComplete(state.player.name);
    });
  }

  notify(message, type = "info") {
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast-pill toast-${type}`;
    toast.textContent = `[SYS_LOG] ${message}`;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

export const ui = new UIManager();

if (typeof window !== "undefined") {
  window.CyberUI = ui;
}

