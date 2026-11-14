/**
 * CYBER DEFENDER — Tactical Protocol Tutorial Overlay
 * Interactive, skippable onboarding briefing explaining grid movement,
 * terminal operations, and combat countermeasures.
 */

import { state, events, setState } from "./state.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";

export class TutorialSystem {
  constructor() {
    this.currentStep = 0;
  }

  showBriefing(force = false) {
    if (!force && state.settings?.tutorialSeen) return;

    this.currentStep = 1;
    this.renderStep(this.currentStep);
  }

  renderStep(step) {
    let content = "";

    if (step === 1) {
      content = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-glow); padding-bottom: 8px; margin-bottom: 14px;">
          <h3 class="title-glitch" style="font-size: 18px; margin: 0; color: var(--cyan);">BRIEFING [1/2]: SECTOR INFILTRATION</h3>
          <span style="font-size: 10px; color: var(--gold); border: 1px solid rgba(255,183,3,0.4); padding: 2px 8px; border-radius: 2px;">PROTO-01</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12px; line-height: 1.6; color: var(--bright-text);">
          <p>Welcome, Operator. You have been assigned to neutralize rogue malware clusters destabilizing the mainframe.</p>
          
          <div style="background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--cyan); padding: 8px 12px; border-radius: 2px;">
            <strong style="color: var(--cyan);">GRID NAVIGATION:</strong> Use <span style="color: var(--gold);">WASD</span> or <span style="color: var(--gold);">Arrow Keys</span> (or the touch <span style="color: var(--gold);">D-Pad</span>) to navigate through circuit pathways.
          </div>

          <div style="background: rgba(255, 0, 85, 0.08); border-left: 3px solid #ff0054; padding: 8px 12px; border-radius: 2px;">
            <strong style="color: #ff0054;">CORRUPTED SECTORS:</strong> Glowing crimson tiles carry active malware threads. Stepping on them has a chance to trigger a combat encounter!
          </div>

          <div style="background: rgba(0, 255, 136, 0.08); border-left: 3px solid #00ff88; padding: 8px 12px; border-radius: 2px;">
            <strong style="color: #00ff88;">DATA TERMINALS:</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li><strong style="color: var(--cyan);">Terminal A:</strong> Restores +30 System Integrity.</li>
              <li><strong style="color: var(--gold);">Terminal B:</strong> Grants +15 System HP, +25 XP, and +3 Overclock charges!</li>
            </ul>
          </div>

          <div style="background: rgba(255, 0, 84, 0.08); border-left: 3px solid var(--danger, #ff0054); padding: 8px 12px; border-radius: 2px;">
            <strong style="color: var(--danger, #ff0054);">SECTOR EXIT:</strong> The extraction point is visible but <strong>[LOCKED]</strong> until Terminal B has been activated. Find Terminal A, then Terminal B, to unlock it.
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <button type="button" id="btn-tutorial-skip" class="cyber-btn" style="min-width: 90px; padding: 6px 14px; font-size: 11px;">SKIP</button>
          <button type="button" id="btn-tutorial-next" class="cyber-btn cyber-btn--primary" style="min-width: 120px; padding: 6px 14px; font-size: 11px;">NEXT ❯</button>
        </div>
      `;
    } else if (step === 2) {
      content = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-glow); padding-bottom: 8px; margin-bottom: 14px;">
          <h3 class="title-glitch" style="font-size: 18px; margin: 0; color: var(--cyan);">BRIEFING [2/2]: COMBAT COUNTERMEASURES</h3>
          <span style="font-size: 10px; color: var(--gold); border: 1px solid rgba(255,183,3,0.4); padding: 2px 8px; border-radius: 2px;">PROTO-02</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px; line-height: 1.5; color: var(--bright-text);">
          <p>When malware engages, deploy tactical countermeasures:</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-glow); padding: 6px 10px; border-radius: 2px;">
              <strong style="color: var(--cyan);">⚡ EXECUTE:</strong>
              <div style="font-size: 10.5px; color: var(--dim-text); margin-top: 2px;">
                Firewall vs Worms<br/>
                Antivirus vs Trojans<br/>
                Brute Force vs Spyware<br/>
                SQL Inject vs Adware
              </div>
            </div>
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-glow); padding: 6px 10px; border-radius: 2px;">
              <strong style="color: #00ff88;">🔍 KNOWLEDGE:</strong>
              <div style="font-size: 10.5px; color: var(--dim-text); margin-top: 2px;">
                Heuristic scan reveals vulnerability (<span style="color: #00ff88;">1.5x</span>) and resistance (<span style="color: #ff9e00;">0.5x</span>).
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-glow); padding: 6px 10px; border-radius: 2px;">
              <strong style="color: #00f0ff;">🛡 PATCHES:</strong>
              <div style="font-size: 10.5px; color: var(--dim-text); margin-top: 2px;">
                Deploys kernel micro-patches restoring Operator Health.
              </div>
            </div>
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-glow); padding: 6px 10px; border-radius: 2px;">
              <strong style="color: var(--gold);">⚡ OVERCLOCK:</strong>
              <div style="font-size: 10.5px; color: var(--dim-text); margin-top: 2px;">
                Amplifies next attack damage output by <span style="color: var(--gold);">+35%</span> per active charge.
              </div>
            </div>
          </div>

          <p style="font-size: 11px; color: var(--dim-text); margin-top: 4px;">
            Purging malware permanently cleanses corrupted grid tiles and earns System Experience!
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px;">
          <button type="button" id="btn-tutorial-prev" class="cyber-btn" style="min-width: 90px; padding: 6px 14px; font-size: 11px;">❮ PREV</button>
          <button type="button" id="btn-tutorial-finish" class="cyber-btn cyber-btn--primary" style="min-width: 140px; padding: 6px 14px; font-size: 11px;">ACKNOWLEDGE ❯</button>
        </div>
      `;
    }

    ui.showModal(content);

    // Bind Controls
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        window.removeEventListener("keydown", handleEscape);
        audio.playSFX("menu_click");
        this.finish();
      }
    };
    this._escapeHandler = handleEscape;
    window.addEventListener("keydown", handleEscape);

    document.getElementById("btn-tutorial-skip")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.finish();
    });

    document.getElementById("btn-tutorial-next")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.currentStep = 2;
      this.renderStep(this.currentStep);
    });

    document.getElementById("btn-tutorial-prev")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.currentStep = 1;
      this.renderStep(this.currentStep);
    });

    document.getElementById("btn-tutorial-finish")?.addEventListener("click", () => {
      audio.playSFX("deploy");
      this.finish();
    });
  }

  finish() {
    if (this._escapeHandler) {
      window.removeEventListener("keydown", this._escapeHandler);
      this._escapeHandler = null;
    }
    setState(s => {
      if (!s.settings) s.settings = {};
      s.settings.tutorialSeen = true;
    });
    ui.closeModal();
    ui.notify("OPERATIONAL CLEARANCE: Tactical Protocol Synchronized.", "success");
    SaveSystem.save();
  }
}

export const tutorial = new TutorialSystem();

if (typeof window !== "undefined") {
  window.CyberTutorial = tutorial;
}

