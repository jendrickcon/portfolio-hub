/**
 * CYBER DEFENDER — Turn-Based Combat Engine
 * Implements cyber countermeasures, weaknesses, resistances, Overclock multiplier,
 * enemy AI behaviors, terminal logging, and post-battle resolution.
 */

import { state, events, setState } from "./state.js";
import { ATTACKS, COMBAT_CONSTANTS, PATCHES } from "../data/attacks.js";
import { scenes } from "./scenes.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";
import { progression } from "./progression.js";
import { FLOORS, TILE_TYPES } from "../data/floors.js";
import { avatarRenderer } from "./avatar.js";
import { battleResultOverlay } from "./battle_result.js";

export class CombatEngine {
  constructor() {
    this.initialized = false;
    this.isResolvingTurn = false;
    this.totalDamageTaken = 0;

    // Cached Elements
    this.arenaEl = null;
    this.effectsLayerEl = null;
    this.playerSpriteWrap = null;
    this.enemySpriteWrap = null;
    this.dataLinkPulse = null;

    this.enemyNameEl = null;
    this.enemyTypeEl = null;
    this.enemyHpTextEl = null;
    this.enemyHpFillEl = null;
    this.enemyImgEl = null;
    this.badgeWeaknessEl = null;
    this.badgeResistanceEl = null;

    this.operatorNameEl = null;
    this.operatorHpTextEl = null;
    this.operatorHpFillEl = null;
    this.overclockPillEl = null;

    this.terminalEl = null;
    this.mainActionsEl = null;
    this.attackActionsEl = null;
  }

  init() {
    if (this.initialized) return;

    this.arenaEl = document.getElementById("battle-arena");
    this.effectsLayerEl = document.getElementById("battle-effects-layer");
    this.playerSpriteWrap = document.querySelector(".battle-player-actor .actor-sprite-wrap");
    this.enemySpriteWrap = document.querySelector(".battle-enemy-actor .actor-sprite-wrap");
    this.dataLinkPulse = document.querySelector(".data-link-pulse");

    this.enemyNameEl = document.getElementById("battle-enemy-name");
    this.enemyTypeEl = document.getElementById("battle-enemy-type");
    this.enemyHpTextEl = document.getElementById("battle-enemy-hp-text");
    this.enemyHpFillEl = document.getElementById("battle-enemy-hp-fill");
    this.enemyImgEl = document.getElementById("battle-enemy-img");
    this.badgeWeaknessEl = document.getElementById("badge-weakness");
    this.badgeResistanceEl = document.getElementById("badge-resistance");

    this.operatorNameEl = document.getElementById("battle-operator-name");
    this.operatorHpTextEl = document.getElementById("battle-operator-hp-text");
    this.operatorHpFillEl = document.getElementById("battle-operator-hp-fill");
    this.overclockPillEl = document.getElementById("battle-overclock-pill");

    this.terminalEl = document.getElementById("battle-terminal");
    this.dialogueTextEl = document.getElementById("battle-dialogue-text");
    this.dialogueArrowEl = document.getElementById("battle-dialogue-arrow");
    this.mainActionsEl = document.getElementById("battle-main-actions");
    this.attackActionsEl = document.getElementById("battle-attack-actions");

    this.firewallDefActive = false;
    this.bindEvents();
    this.initialized = true;
  }

  bindEvents() {
    // 1. Main Action Buttons
    document.getElementById("btn-cmd-execute")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.showAttackActions();
    });

    document.getElementById("btn-cmd-knowledge")?.addEventListener("click", () => {
      if (this.isResolvingTurn) return;
      this.executeKnowledge();
    });

    document.getElementById("btn-cmd-patches")?.addEventListener("click", () => {
      if (this.isResolvingTurn) return;
      this.executePatches();
    });

    document.getElementById("btn-cmd-run")?.addEventListener("click", () => {
      if (this.isResolvingTurn) return;
      this.executeRun();
    });

    // 2. Attack Submenu Buttons
    const attackBtns = [
      { id: "btn-attack-firewall", attackKey: "firewall" },
      { id: "btn-attack-antivirus", attackKey: "antivirus" },
      { id: "btn-attack-bruteforce", attackKey: "bruteForce" },
      { id: "btn-attack-sqlinject", attackKey: "sqlInject" }
    ];

    attackBtns.forEach(({ id, attackKey }) => {
      document.getElementById(id)?.addEventListener("click", () => {
        if (this.isResolvingTurn) return;
        this.executeAttack(attackKey);
      });
    });

    document.getElementById("btn-attack-back")?.addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.showMainActions();
    });
  }

  startBattle() {
    this.init();
    const enemy = state.combat.enemy;
    if (!enemy) {
      console.error("[CombatEngine]: No active enemy in state!");
      return;
    }

    this.isResolvingTurn = false;
    this.totalDamageTaken = 0;
    state.combat.inBattle = true;
    state.combat.scanned = false;
    state.combat.playerTurnBlocked = false;
    if (enemy.isBoss && enemy.special?.type === "signatureMutation") {
      state.combat.roundNumber = 1;
    }

    // Set Arena Threat Archetype
    if (this.arenaEl) {
      this.arenaEl.dataset.threat = enemy.id;
    }
    if (this.effectsLayerEl) {
      this.effectsLayerEl.innerHTML = "";
    }

    // Set UI Texts
    if (this.enemyNameEl) this.enemyNameEl.textContent = enemy.name.toUpperCase();
    if (this.enemyTypeEl) this.enemyTypeEl.textContent = enemy.type;
    
    // Match sprite file
    if (this.enemyImgEl) {
      this.enemyImgEl.src = enemy.sprite || (enemy.id === "trojan" ? "assets/enemies/trojan-horse.svg" : `assets/enemies/${enemy.id}.svg`);
      this.enemyImgEl.className = "enemy-svg";
    }

    // Reset intel badges
    if (this.badgeWeaknessEl) {
      this.badgeWeaknessEl.textContent = "WEAK: ???";
      this.badgeWeaknessEl.className = "intel-badge unknown";
    }
    if (this.badgeResistanceEl) {
      this.badgeResistanceEl.textContent = "RESIST: ???";
      this.badgeResistanceEl.className = "intel-badge unknown";
    }

    // Operator HUD sync
    if (this.operatorNameEl) {
      this.operatorNameEl.textContent = `${state.player.name.toUpperCase()} INTEGRITY`;
    }

    // Render Player Combat Avatar Sprite
    const playerPlatformEl = document.getElementById("battle-operator-avatar-container");
    if (playerPlatformEl) {
      playerPlatformEl.innerHTML = avatarRenderer.getCombatPlayerHtml();
    }

    // Terminal clear & initial log
    if (this.terminalEl) {
      this.terminalEl.innerHTML = "";
      this.logTerminal(`> COMBAT ENGAGED: Infiltration intercepted by ${enemy.name.toUpperCase()}!`, "action");
      this.logTerminal(`> Threat Profile: ${enemy.type}`, "info");
      this.logTerminal(`> Awaiting operator countermeasure authorization...`, "info");
    }

    // Cyber Deck Starting Perk: Overclock Rig (+1 Starting Charge)
    if (state.player.equipment?.deck === "deck_overclock") {
      state.player.overclockCharges = (state.player.overclockCharges || 0) + 1;
      this.logTerminal(`> OVERCLOCKED RIG: +1 Start Overclock charge injected into operational buffer!`, "effective");
    }

    this.syncHPs();
    this.syncOverclockBadge();
    this.firewallDefActive = false;
    this.updateAttackSubmenuIntel();
    this.showMainActions();
    this.unlockButtons();
  }

  setDialogue(text) {
    if (this.dialogueTextEl) {
      this.dialogueTextEl.textContent = text;
    }
  }

  updateAttackSubmenuIntel() {
    const enemy = state.combat.enemy;
    const isScanned = Boolean(state.combat.scanned);

    const attackMap = {
      firewall: document.getElementById("btn-attack-firewall"),
      antivirus: document.getElementById("btn-attack-antivirus"),
      sqlInject: document.getElementById("btn-attack-sqlinject"),
      bruteForce: document.getElementById("btn-attack-bruteforce")
    };

    Object.entries(attackMap).forEach(([key, btn]) => {
      if (!btn) return;
      btn.classList.remove("intel-vulnerable", "intel-resisted");
      if (isScanned && enemy) {
        if (enemy.weakness === key) {
          btn.classList.add("intel-vulnerable");
        } else if (enemy.resistance === key) {
          btn.classList.add("intel-resisted");
        }
      }
    });
  }

  showMainActions() {
    if (this.mainActionsEl) this.mainActionsEl.style.display = "grid";
    if (this.attackActionsEl) this.attackActionsEl.style.display = "none";
    this.setDialogue("What will you do?");
  }

  showAttackActions() {
    if (this.mainActionsEl) this.mainActionsEl.style.display = "none";
    if (this.attackActionsEl) this.attackActionsEl.style.display = "flex";
    this.updateAttackSubmenuIntel();
    this.setDialogue("Select offensive routine...");
  }

  lockButtons() {
    this.isResolvingTurn = true;
    const btns = document.querySelectorAll("#scene-battle .battle-main-btn, #scene-battle .attack-card-btn, #scene-battle .attack-back-btn");
    btns.forEach(b => b.disabled = true);
  }

  unlockButtons() {
    this.isResolvingTurn = false;
    const btns = document.querySelectorAll("#scene-battle .battle-main-btn, #scene-battle .attack-card-btn, #scene-battle .attack-back-btn");
    btns.forEach(b => b.disabled = false);
  }

  syncHPs() {
    const enemy = state.combat.enemy;
    if (enemy) {
      const enemyPct = Math.max(0, Math.min(100, (enemy.currentHp / enemy.maxHp) * 100));
      if (this.enemyHpTextEl) this.enemyHpTextEl.textContent = `${enemy.currentHp} / ${enemy.maxHp} HP`;
      if (this.enemyHpFillEl) this.enemyHpFillEl.style.width = `${enemyPct}%`;
    }

    const playerPct = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100));
    if (this.operatorHpTextEl) this.operatorHpTextEl.textContent = `${state.player.hp} / ${state.player.maxHp} HP`;
    if (this.operatorHpFillEl) this.operatorHpFillEl.style.width = `${playerPct}%`;
  }

  syncOverclockBadge() {
    if (!this.overclockPillEl) return;
    const oc = state.player.overclockCharges || 0;
    if (oc > 0) {
      this.overclockPillEl.textContent = `OVERCLOCK [x${oc}]`;
      this.overclockPillEl.style.display = "inline-block";
    } else {
      this.overclockPillEl.style.display = "none";
    }
  }

  logTerminal(message, type = "info") {
    if (!this.terminalEl) return;
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.textContent = message;
    this.terminalEl.appendChild(line);
    this.terminalEl.scrollTop = this.terminalEl.scrollHeight;
  }

  spawnFloatingCombatText(target, value, badgeText = "", badgeClass = "badge--neutral") {
    const layer = this.effectsLayerEl || document.getElementById("battle-effects-layer") || document.querySelector(".battle-container");
    if (!layer) return;

    const el = document.createElement("div");
    el.className = `floating-combat-badge ${badgeClass}`;

    const valEl = document.createElement("span");
    valEl.className = "floating-value";
    valEl.textContent = value;
    el.appendChild(valEl);

    if (badgeText) {
      const subEl = document.createElement("span");
      subEl.className = "floating-sub-badge";
      subEl.textContent = badgeText;
      el.appendChild(subEl);
    }

    if (target === "enemy") {
      el.style.right = "22%";
      el.style.bottom = "48%";
    } else {
      el.style.left = "22%";
      el.style.bottom = "48%";
    }

    layer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  triggerSpriteRecoil(target = "enemy") {
    if (target === "enemy") {
      if (this.enemySpriteWrap) {
        this.enemySpriteWrap.classList.remove("hit-recoil-right");
        void this.enemySpriteWrap.offsetWidth;
        this.enemySpriteWrap.classList.add("hit-recoil-right");
        setTimeout(() => this.enemySpriteWrap?.classList.remove("hit-recoil-right"), 380);
      }
      if (this.enemyImgEl) {
        this.enemyImgEl.classList.remove("hit-shake");
        void this.enemyImgEl.offsetWidth;
        this.enemyImgEl.classList.add("hit-shake");
        setTimeout(() => this.enemyImgEl?.classList.remove("hit-shake"), 380);
      }
    } else {
      if (this.playerSpriteWrap) {
        this.playerSpriteWrap.classList.remove("hit-recoil-left");
        void this.playerSpriteWrap.offsetWidth;
        this.playerSpriteWrap.classList.add("hit-recoil-left");
        setTimeout(() => this.playerSpriteWrap?.classList.remove("hit-recoil-left"), 380);
      }
    }
  }

  showDamagePopup(amount, target = "enemy", isHeal = false, label = "") {
    if (label) {
      let badgeClass = "badge--neutral";
      if (label.includes("CRIT") || label.includes("EXPLOIT")) badgeClass = "badge--crit";
      else if (label.includes("WEAK") || label.includes("SUPER") || label.includes("DECRYPTED")) badgeClass = "badge--weakness";
      else if (label.includes("RESIST")) badgeClass = "badge--resistance";
      else if (label.includes("OVERCLOCK")) badgeClass = "badge--overclock";
      else if (label.includes("HEAL") || label.includes("REPAIR") || label.includes("DRAIN")) badgeClass = "badge--heal";
      
      const parts = label.trim().split(/\s+/);
      const val = parts.length > 1 && (parts[0].startsWith("-") || parts[0].startsWith("+")) ? parts[0] : label;
      const sub = parts.length > 1 && (parts[0].startsWith("-") || parts[0].startsWith("+")) ? parts.slice(1).join(" ") : "";
      this.spawnFloatingCombatText(target, val, sub, badgeClass);
    } else if (isHeal) {
      this.spawnFloatingCombatText(target, `+${amount} HP`, "REPAIRED", "badge--heal");
    } else {
      this.spawnFloatingCombatText(target, `-${amount}`, target === "enemy" ? "HIT" : "DAMAGE", target === "enemy" ? "badge--neutral" : "badge--resistance");
    }
  }

  // ================= ACTION HANDLERS =================

  executeAttack(attackKey) {
    this.lockButtons();
    const attack = ATTACKS[attackKey];
    const enemy = state.combat.enemy;
    if (!attack || !enemy) return;

    let baseDmg = attack.baseDamage;
    let isCrit = false;
    let sfxKey = attackKey === "firewall" ? "attack_firewall" : "attack_antivirus";

    // Attack Archetype Specials
    if (attackKey === "firewall") {
      this.firewallDefActive = true;
    } else if (attackKey === "sqlInject") {
      if (Math.random() < (attack.critChance || 0.35)) {
        isCrit = true;
        baseDmg = Math.round(baseDmg * (attack.critMultiplier || 1.75));
      }
    }

    const variance = attack.variance !== undefined ? attack.variance : Math.floor(baseDmg * 0.2);
    const rolledBase = baseDmg + (variance > 0 ? (Math.floor(Math.random() * (variance * 2 + 1)) - variance) : 0);
    let damage = rolledBase;

    // 1. Check Overclock Multiplier (3-battle scope: active across entire battles, decrements only on victory)
    let isOverclocked = false;
    if (state.player.overclockCharges > 0) {
      isOverclocked = true;
      damage = Math.round(damage * COMBAT_CONSTANTS.OVERCLOCK_MULTIPLIER);
      this.syncOverclockBadge();
      ui.notify("OVERCLOCK BURST: +35% Damage Output!", "info");
      this.logTerminal(`> OVERCLOCK ACTIVE: Attack accelerated to ${damage} raw potency!`, "action");
      progression.unlockBadge("overclocker");
    }

    // 1b. Check Quantum Kernel Deck Perk (+10% damage)
    if (state.player.equipment?.deck === "deck_quantum") {
      damage = Math.round(damage * 1.10);
      this.logTerminal(`> QUANTUM KERNEL DECK: Countermeasure payload boosted +10%!`, "effective");
    }

    // 2. Check Weakness & Resistance
    let dialogueMsg = `Operator deployed ${attack.name}!`;

    if (enemy.weakness === attackKey) {
      damage = Math.round(damage * COMBAT_CONSTANTS.WEAKNESS_MULTIPLIER);
      dialogueMsg = `It's super effective! Inflicted ${damage} damage!`;
      this.logTerminal(`> VULNERABILITY EXPLOITED: ${attack.name} struck malware core weakness (+50% DMG)!`, "effective");
      this.logTerminal(`> Inflicted ${damage} devastating damage on ${enemy.name}!`, "effective");
      ui.notify("EXPLOIT CONFIRMED: Super effective countermeasure!", "success");
      progression.unlockBadge("master_strategist");
      this.spawnFloatingCombatText("enemy", `-${damage}`, "WEAKNESS ×1.5", "badge--weakness");
    } else if (enemy.resistance === attackKey) {
      damage = Math.max(1, Math.round(damage * COMBAT_CONSTANTS.RESISTANCE_MULTIPLIER));
      dialogueMsg = `The malware resisted the countermeasure... (-${damage} HP)`;
      this.logTerminal(`> COUNTERMEASURE DEFLECTED: ${enemy.name} has encrypted protection against ${attack.name} (-50% DMG)!`, "resisted");
      this.logTerminal(`> Inflicted ${damage} reduced damage on ${enemy.name}.`, "resisted");
      ui.notify("RESISTED: Payload mitigated by malware defenses!", "warning");
      this.spawnFloatingCombatText("enemy", `-${damage}`, "RESIST ×0.5", "badge--resistance");
    } else {
      if (isCrit) {
        dialogueMsg = `CRITICAL EXPLOIT! Bypassed buffer filters for -${damage} DMG!`;
        this.logTerminal(`> CRITICAL EXPLOIT: SQL Injection bypassed sanitization filter! -${damage} DMG!`, "effective");
        this.spawnFloatingCombatText("enemy", `-${damage}`, "CRIT IMPACT", "badge--crit");
      } else if (isOverclocked) {
        dialogueMsg = `OVERCLOCK STRIKE! Accelerated routine dealt ${damage} DMG!`;
        this.spawnFloatingCombatText("enemy", `-${damage}`, "OVERCLOCK ×1.35", "badge--overclock");
      } else {
        this.logTerminal(`> EXECUTING ${attack.name}: Payload delivered. Inflicted ${damage} damage.`, "action");
        this.spawnFloatingCombatText("enemy", `-${damage}`, "HIT", "badge--neutral");
      }
    }

    if (attackKey === "firewall") {
      this.logTerminal(`> FIREWALL ESTABLISHED: Packet barrier deployed (-25% incoming damage next turn)!`, "effective");
    }

    this.setDialogue(dialogueMsg);
    audio.playSFX(sfxKey);
    this.triggerSpriteRecoil("enemy");

    // Apply Damage
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    this.syncHPs();

    // Check Victory
    if (enemy.currentHp <= 0) {
      setTimeout(() => this.resolveVictory(), 600);
      return;
    }

    // Enemy Turn after readable delay
    setTimeout(() => this.executeEnemyTurn(), 1200);
  }

  executeKnowledge() {
    this.lockButtons();
    const enemy = state.combat.enemy;
    if (!enemy) return;

    audio.playSFX("scan");
    this.setDialogue("Initiating heuristic scan protocol...");
    this.logTerminal(`> DIAGNOSTIC SCAN: Analyzing threat memory footprint...`, "action");

    if (this.dataLinkPulse) {
      this.dataLinkPulse.style.animationDuration = "0.7s";
    }

    this.spawnFloatingCombatText("enemy", "SCAN", "ANALYZING INTEL", "badge--neutral");

    setTimeout(() => {
      state.combat.scanned = true;
      if (this.dataLinkPulse) {
        this.dataLinkPulse.style.animationDuration = "3s";
      }

      // Reveal on HUD badges with the clean attack name
      const weakAttack = ATTACKS[enemy.weakness]?.name || enemy.weakness.toUpperCase();
      const resistAttack = ATTACKS[enemy.resistance]?.name || enemy.resistance.toUpperCase();

      if (this.badgeWeaknessEl) {
        this.badgeWeaknessEl.textContent = `WEAK: ${weakAttack}`;
        this.badgeWeaknessEl.className = "intel-badge weak";
      }
      if (this.badgeResistanceEl) {
        this.badgeResistanceEl.textContent = `RESIST: ${resistAttack}`;
        this.badgeResistanceEl.className = "intel-badge resist";
      }

      this.spawnFloatingCombatText("enemy", "INTEL", "DECRYPTED", "badge--weakness");
      this.setDialogue(`Heuristics decrypted: ${enemy.name.toUpperCase()} is WEAK to ${weakAttack}!`);
      this.logTerminal(`> KNOWLEDGE SCAN COMPLETED: Heuristic analysis decrypted.`, "effective");
      this.logTerminal(`> [TACTICAL INTEL]: Vulnerable to ${weakAttack}; Resistant to ${resistAttack}.`, "effective");

      this.updateAttackSubmenuIntel();

      // Enemy Turn after scan
      setTimeout(() => this.executeEnemyTurn(), 1200);
    }, 550);
  }

  executePatches() {
    this.lockButtons();
    // 4-tier weighted roll matching Godot: [35, 60, 80, 100] -> [15, 25, 20, 35]
    const roll = Math.random() * 100;
    let heal = 15;
    let patchName = "Kernel Micro-Patch";
    if (roll < 35) {
      heal = 15;
      patchName = "Kernel Micro-Patch";
    } else if (roll < 60) {
      heal = 25;
      patchName = "Memory Buffer Scrub";
    } else if (roll < 80) {
      heal = 20;
      patchName = "Stack Frame Integrity Fix";
    } else {
      heal = 35;
      patchName = "Full Subsystem Recompile";
    }

    setState(s => {
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + heal);
    });

    audio.playSFX("heal");
    this.syncHPs();
    this.spawnFloatingCombatText("operator", `+${heal} HP`, "REPAIRED", "badge--heal");

    this.setDialogue(`Applied ${patchName}! Restored +${heal} Operator Integrity.`);
    this.logTerminal(`> DEPLOYING ${patchName.toUpperCase()}: Restored +${heal} Operator Integrity!`, "success");
    ui.notify(`PATCH APPLIED: +${heal} Operator HP!`, "success");

    // Enemy Turn
    setTimeout(() => this.executeEnemyTurn(), 900);
  }

  executeRun() {
    this.lockButtons();

    // Guard: Cannot flee from critical boss encounters
    if (state.combat.enemy?.isBoss) {
      audio.playSFX("warning");
      this.setDialogue("Cannot disengage from a critical Boss encounter!");
      this.logTerminal(`> RETREAT BLOCKED: Critical root security breach! Extraction is locked during boss engagement.`, "enemy");
      ui.notify("CANNOT DISENGAGE FROM BOSS ENCOUNTER", "danger");
      this.unlockButtons();
      return;
    }

    const roll = Math.random();
    const success = roll < COMBAT_CONSTANTS.RUN_SUCCESS_CHANCE;

    if (success) {
      audio.playSFX("deploy");
      this.setDialogue("Successfully terminated connection! Evaded combat.");
      this.logTerminal(`> CONNECTION TERMINATED: Successfully escaped from rogue process!`, "success");
      ui.notify("TACTICAL RETREAT: Evaded combat.", "info");
      setTimeout(() => this.exitCombat(false), 800);
    } else {
      audio.playSFX("warning");
      this.setDialogue("Escape failed! Malware counterattack initiated!");
      this.logTerminal(`> RETREAT FAILED: Packet rerouting failed. Enemy seized momentum!`, "enemy");
      ui.notify("ESCAPE FAILED: Malware counterattack initiated!", "danger");
      setTimeout(() => this.executeEnemyTurn(), 850);
    }
  }

  // ================= ENEMY TURN SEQUENCE =================

  executeEnemyTurn() {
    const enemy = state.combat.enemy;
    if (!enemy || enemy.currentHp <= 0) return;

    this.setDialogue(`${enemy.name.toUpperCase()} executing countermeasure...`);

    // 1. Worm Special: 20% Chance Self-Heal +15 HP
    if (enemy.id === "worm" && enemy.special?.type === "selfHeal") {
      if (Math.random() < enemy.special.chance) {
        enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + enemy.special.healAmount);
        this.syncHPs();
        audio.playSFX("heal");
        this.spawnFloatingCombatText("enemy", `+${enemy.special.healAmount} HP`, "REPLICATE", "badge--heal");
        this.logTerminal(`> WORM executes REPLICATE: Spawned clone and healed +15 HP!`, "special");
      }
    }

    // 2. Enemy Base Attack Damage Roll
    const [minAtk, maxAtk] = enemy.baseDamage;
    let enemyDmg = Math.floor(Math.random() * (maxAtk - minAtk + 1)) + minAtk;

    // Hardcore Mode Multiplier: 1.35x
    if (state.progression.hardcoreMode) {
      enemyDmg = Math.round(enemyDmg * 1.35);
      this.logTerminal(`> SYSTEM OVERLOAD ACTIVE: Malware attack amplified 1.35x!`, "enemy");
    }

    // Security Shield Perk: Adaptive Heuristic Shield (-15% damage taken)
    if (state.player.equipment?.shield === "shield_heuristic") {
      const originalDmg = enemyDmg;
      enemyDmg = Math.max(1, Math.round(enemyDmg * 0.85));
      this.logTerminal(`> ADAPTIVE HEURISTIC SHIELD: Mitigated 15% incoming strike (${originalDmg} -> ${enemyDmg})!`, "effective");
    }

    // 2b. Firewall Mitigation (-25% incoming damage)
    if (this.firewallDefActive) {
      this.firewallDefActive = false;
      const originalDmg = enemyDmg;
      enemyDmg = Math.max(1, Math.round(enemyDmg * 0.75));
      this.logTerminal(`> FIREWALL BARRIER: Packet filter absorbed 25% strike (${originalDmg} -> ${enemyDmg})!`, "effective");
    }

    // 2c. Godmode Invulnerability Check
    if (state.combat.godMode) {
      enemyDmg = 0;
      this.logTerminal(`> GODMODE ACTIVE: Incoming malware strike nullified (0 HP taken)!`, "effective");
    }

    this.totalDamageTaken += enemyDmg;

    setState(s => {
      s.player.hp = Math.max(0, s.player.hp - enemyDmg);
    });

    audio.playSFX("damage");
    this.syncHPs();
    this.triggerSpriteRecoil("operator");
    this.spawnFloatingCombatText("operator", `-${enemyDmg}`, "MALICIOUS STRIKE", "badge--resistance");
    this.setDialogue(`${enemy.name.toUpperCase()} attacked for ${enemyDmg} damage!`);
    this.logTerminal(`> ${enemy.name.toUpperCase()} executes malicious strike for ${enemyDmg} damage!`, "enemy");

    // 3. Spyware Special: 60% chance to steal flat 5–15 HP (Godot exact behavior)
    if (enemy.id === "spyware" && enemy.special?.type === "flatLifesteal") {
      if (Math.random() < (enemy.special.chance || 0.60)) {
        let steal = Math.floor(Math.random() * (enemy.special.maxHeal - enemy.special.minHeal + 1)) + enemy.special.minHeal;
        if (state.player.equipment?.shield === "shield_siphon") {
          steal = Math.max(1, Math.round(steal * 0.50));
          this.logTerminal(`> SIPHON NEGATOR: Sapped malware packets dampened by 50% (${steal} HP)!`, "effective");
        }
        enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + steal);
        this.syncHPs();
        this.spawnFloatingCombatText("enemy", `+${steal} HP`, "DRAIN", "badge--heal");
        this.logTerminal(`> SPYWARE exfiltrates data: Sapped +${steal} HP into self-repair!`, "special");
      }
    }

    // 4. Adware Special: 30% Turn Skip (bypassed if Anti-Telemetry Scrambler equipped)
    if (enemy.id === "adware" && enemy.special?.type === "turnSkip") {
      if (Math.random() < enemy.special.chance) {
        if (state.player.equipment?.shield === "shield_scrambler") {
          state.combat.playerTurnBlocked = false;
          this.logTerminal(`> ANTI-TELEMETRY SCRAMBLER: Popup flood intercepted! Input buffer preserved.`, "effective");
          ui.notify("SCRAMBLER ACTIVE: Popup stun averted!", "info");
        } else {
          state.combat.playerTurnBlocked = true;
          this.logTerminal(`> ADWARE deploys UI FLOOD: Operator input buffer locked! Next turn skipped.`, "special");
          ui.notify("SYSTEM OVERLOAD: Input buffer jammed by popups!", "warning");
        }
      }
    }

    // 4b. Sector 1 Boss Special: Memory Encryption True Damage (+15 HP)
    if (enemy.id === "sector1_boss" && enemy.special?.type === "dataEncryption") {
      if (Math.random() < (enemy.special.chance || 0.40)) {
        const bonusDmg = state.combat.godMode ? 0 : (enemy.special.damage || 15);
        if (!state.combat.godMode) {
          setState(s => {
            s.player.hp = Math.max(0, s.player.hp - bonusDmg);
          });
        }
        audio.playSFX("warning");
        this.syncHPs();
        this.triggerSpriteRecoil("operator");
        this.spawnFloatingCombatText("operator", `-${bonusDmg} [DATA LOCK]`, "ENCRYPTION", "badge--resistance");
        this.logTerminal(`> ROOTKIT OVERSEER deploys ENCRYPTION LOCK: Inflicted +${bonusDmg} memory encryption damage!`, "danger");
      }
    }

    // 5. Check Player Defeat
    if (state.player.hp <= 0) {
      setTimeout(() => this.resolveDefeat(), 600);
      return;
    }

    // 6. If turn blocked by Adware, execute second enemy attack automatically
    if (state.combat.playerTurnBlocked) {
      state.combat.playerTurnBlocked = false;
      setTimeout(() => {
        this.logTerminal(`> Operator clears corrupted input buffer... Enemy strikes again!`, "resisted");
        this.executeEnemyTurn();
      }, 1000);
      return;
    }

    // Re-enable player turn after readable delay
    setTimeout(() => {
      if (state.combat.inBattle && state.player.hp > 0) {
        const boss = state.combat.enemy;
        if (boss?.isBoss && boss.special?.type === "signatureMutation" && boss.currentHp > 0) {
          const ATTACK_KEYS = ["firewall", "antivirus", "bruteForce", "sqlInject"];
          const options = ATTACK_KEYS.filter(k => k !== boss.weakness);
          boss.weakness = options[Math.floor(Math.random() * options.length)];
          state.combat.scanned = false; // old intel is now stale
          state.combat.roundNumber = (state.combat.roundNumber || 1) + 1;

          if (this.badgeWeaknessEl) {
            this.badgeWeaknessEl.textContent = "WEAK: ???";
            this.badgeWeaknessEl.className = "intel-badge unknown";
          }
          this.updateAttackSubmenuIntel();
          this.logTerminal(`> WARNING: Rootkit signature mutated. Prior vulnerability patched.`, "special");
          ui.notify("SIGNATURE MUTATION DETECTED: Re-scan required!", "warning");
          audio.playSFX("warning");

          // Brief arena glitch pulse
          if (this.arenaEl) {
            this.arenaEl.classList.add("arena-glitch");
            setTimeout(() => this.arenaEl.classList.remove("arena-glitch"), 400);
          }
        }

        this.showMainActions();
        this.unlockButtons();
      }
    }, 650);
  }

  // ================= POST-BATTLE RESOLUTION =================

  resolveVictory() {
    const enemy = state.combat.enemy;
    if (!enemy) return;

    if (this.enemyImgEl) {
      this.enemyImgEl.classList.add("defeated");
    }

    audio.playSFX("level_up");

    // XP calculation: Trojan 60, Worm 30, Spyware 45, Adware 35, Sector 1 Boss 250, Sector 2 Boss 280
    const xpAwards = {
      trojan: 60,
      worm: 30,
      spyware: 45,
      adware: 35,
      sector1_boss: 250,
      sector2_boss: 280
    };
    const xpEarned = xpAwards[enemy.id] || 40;

    // Restore System HP (+12)
    // Proportional System HP impact: battle damage * floor ratio
    const currentFloor = state.player.position.floor || 1;
    const floorRatio = currentFloor === 2 
      ? COMBAT_CONSTANTS.FLOOR2_SYSTEM_DAMAGE_RATIO 
      : COMBAT_CONSTANTS.FLOOR1_SYSTEM_DAMAGE_RATIO;
    const sysDmg = Math.round(this.totalDamageTaken * floorRatio);

    // Overclock decrement strictly on victory!
    let overclockDeducted = false;
    if (state.player.overclockCharges > 0) {
      state.player.overclockCharges--;
      overclockDeducted = true;
    }

    const prevLevel = state.player.level;

    setState(s => {
      s.system.hp = Math.min(s.system.maxHp, Math.max(0, s.system.hp - sysDmg + COMBAT_CONSTANTS.VICTORY_SYSTEM_HP_BONUS));
      s.player.kills[enemy.id] = (s.player.kills[enemy.id] || 0) + 1;
    });

    if (overclockDeducted) {
      this.syncOverclockBadge();
    }

    this.logTerminal(`> MALWARE QUARANTINED: ${enemy.name.toUpperCase()} neutralized!`, "success");
    this.logTerminal(`> REWARDS: +${xpEarned} XP gained | System Integrity adjusted (-${sysDmg} battle dmg, +12 recovery)`, "success");
    ui.notify(`MALWARE PURGED: +${xpEarned} XP | +12 System HP!`, "success");

    // Purge corrupted or honeypot ambush tile at return coordinates
    if (state.combat.returnPosition) {
      const { floor, x, y } = state.combat.returnPosition;
      const targetFloor = FLOORS[floor];
      if (targetFloor && (targetFloor.grid[y][x] === TILE_TYPES.CORRUPTED || targetFloor.grid[y][x] === TILE_TYPES.HONEYPOT)) {
        targetFloor.grid[y][x] = TILE_TYPES.NORMAL;
      }
    }

    // Sector 1 Boss Defeat Flag & Badge Unlock
    if (enemy.id === "sector1_boss") {
      setState(s => {
        s.progression.floor1BossDefeated = true;
      });
      progression.unlockBadge("sector1_cleared");
      ui.notify("SECTOR 01 LIBERATED: Rootkit Overseer Neutralized!", "success");
    }

    // Sector 2 Boss Defeat Flag & Badge Unlock
    if (enemy.id === "sector2_boss") {
      setState(s => {
        s.progression.floor2BossDefeated = true;
      });
      progression.unlockBadge("sector2_cleared");
      ui.notify("SECTOR 02 SECURED: Polymorphic Warden Neutralized!", "success");
    }

    // Add XP & check level up / rank / badges
    progression.addXP(xpEarned);
    if (state.progression.hardcoreMode) {
      progression.unlockBadge("hardcore_conqueror");
    }
    SaveSystem.save();

    const levelsUp = Math.max(0, state.player.level - prevLevel);

    setTimeout(() => {
      battleResultOverlay.show({
        victory: true,
        xp: xpEarned,
        levelsUp: levelsUp,
        sysDamageTaken: sysDmg,
        onContinue: () => this.exitCombat(true)
      });
    }, 600);
  }

  resolveDefeat() {
    audio.playSFX("warning");
    const currentFloor = state.player.position.floor || 1;
    const floorRatio = currentFloor === 2 
      ? COMBAT_CONSTANTS.FLOOR2_SYSTEM_DAMAGE_RATIO 
      : COMBAT_CONSTANTS.FLOOR1_SYSTEM_DAMAGE_RATIO;
    const sysDmg = Math.max(10, Math.round(this.totalDamageTaken * floorRatio));

    setState(s => {
      s.system.hp = Math.max(0, s.system.hp - sysDmg);
      s.player.hp = s.player.maxHp; // Reset player HP
      s.player.position.x = 1; // Respawn at floor entrance
      s.player.position.y = 1;
    });

    this.logTerminal(`> CRITICAL BREACH: Operator node disconnected from memory bus!`, "enemy");
    this.logTerminal(`> SYSTEM HEALTH PENALTY: -${sysDmg} Integrity Lost!`, "enemy");
    ui.notify(`CRITICAL BREACH: System Integrity -${sysDmg}%! Respawning at sector gateway.`, "danger");

    SaveSystem.save();

    setTimeout(() => {
      battleResultOverlay.show({
        victory: false,
        xp: 0,
        levelsUp: 0,
        sysDamageTaken: sysDmg,
        onContinue: () => this.exitCombat(false, true)
      });
    }, 600);
  }

  exitCombat(isVictory = false, isRespawn = false) {
    state.combat.inBattle = false;
    state.combat.enemy = null;

    if (state.combat.returnPosition && !isRespawn) {
      state.player.position.x = state.combat.returnPosition.x;
      state.player.position.y = state.combat.returnPosition.y;
      state.player.position.floor = state.combat.returnPosition.floor;
    }

    scenes.change("OVERWORLD");
  }
}

export const combat = new CombatEngine();

if (typeof window !== "undefined") {
  window.CyberCombat = combat;
}

