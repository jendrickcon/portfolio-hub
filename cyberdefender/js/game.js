/**
 * CYBER DEFENDER — Main Game Coordinator
 * Integrates state, scenes, audio, UI components, and persistent data flow.
 */

import { state, events, setState } from "./state.js";
import { scenes } from "./scenes.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { SaveSystem } from "./save.js";
import { overworld } from "./overworld.js";
import { combat } from "./combat.js";
import { terminals } from "./terminals.js";
import { progression } from "./progression.js";
import { tutorial } from "./tutorial.js";
import { avatarRenderer } from "./avatar.js";
import { studioController } from "./studio.js";
import { playerController } from "./player.js";

class Game {
  constructor() {
    this.initialized = false;
    this.bootInterval = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log("[CyberDefender]: Initializing Game Engine...");
    scenes.init();
    ui.init();
    audio.init();

    // Register Scene Lifecycle Hooks
    scenes.registerHooks("OVERWORLD", {
      onEnter: () => {
        overworld.loadFloor(state.player.position.floor || 1);
        tutorial.showBriefing();
      },
      onExit: () => {
        import("./player.js").then(({ playerController }) => playerController.lock());
      }
    });

    scenes.registerHooks("BATTLE", {
      onEnter: () => {
        combat.startBattle();
      }
    });

    scenes.registerHooks("PROFILE", {
      onEnter: () => {
        ui.updateHUD();
        studioController.init();
        studioController.refresh();
      }
    });

    // Load saved progression or initialize fresh
    const hasSave = SaveSystem.load();

    this.bindNavigationEvents(hasSave);
    this.bindSettingsEvents();

    // Start with Boot Sequence
    scenes.change("BOOT");
    this.runBootSequence(hasSave);

    console.log("[CyberDefender]: Engine Initialized Successfully.");
  }

  bindNavigationEvents(hasSave) {
    const handleBootFinish = () => {
      audio.playSFX("boot_beep");
      if (this.bootInterval) clearInterval(this.bootInterval);

      // If first-time launch, prompt for operator name before opening Menu
      if (!hasSave && state.player.name === "ADMIN") {
        ui.promptNameEntry((name) => {
          SaveSystem.save();
          scenes.change("MENU");
        });
      } else {
        scenes.change("MENU");
      }
    };

    // Boot Skip / Continue
    const bootSkipBtn = document.getElementById("btn-boot-skip");
    if (bootSkipBtn) {
      bootSkipBtn.addEventListener("click", handleBootFinish);
    }

    const btnStart = document.getElementById("btn-menu-start");
    const btnProfile = document.getElementById("btn-menu-profile");
    const btnSettings = document.getElementById("btn-menu-settings");
    const btnHub = document.getElementById("btn-menu-hub");

    if (btnStart) {
      btnStart.addEventListener("click", () => scenes.change("DEPLOYMENT"));
    }
    if (btnProfile) {
      btnProfile.addEventListener("click", () => scenes.change("PROFILE"));
    }
    if (btnSettings) {
      btnSettings.addEventListener("click", () => scenes.change("SETTINGS"));
    }
    if (btnHub) {
      btnHub.addEventListener("click", () => {
        audio.playSFX("button_click");
      });
    }

    // Deployment Buttons
    const btnDeployFloor1 = document.getElementById("btn-deploy-floor1");
    const btnDeployFloor2 = document.getElementById("btn-deploy-floor2");
    const btnToggleOverload = document.getElementById("btn-toggle-overload");
    const btnBackFromDeploy = document.getElementById("btn-deploy-back");

    const updateDeploymentCards = () => {
      const cardFloor2 = document.getElementById("card-deploy-floor2");
      const isFloor2Unlocked = state.player.level >= 10 || state.progression.unlockedFloor2;
      if (cardFloor2) {
        cardFloor2.classList.toggle("floor-locked", !isFloor2Unlocked);
      }
      if (btnDeployFloor2) {
        btnDeployFloor2.textContent = isFloor2Unlocked ? "DEPLOY TO SECTOR 02" : "LOCKED (LVL 10)";
        btnDeployFloor2.className = `cyber-btn ${isFloor2Unlocked ? "cyber-btn--primary" : "cyber-btn--danger"}`;
      }

      const overloadSubtitle = document.getElementById("overload-status-subtitle");
      if (overloadSubtitle) {
        overloadSubtitle.textContent = `SYSTEM OVERLOAD: ${state.progression.hardcoreMode ? "ON" : "OFF"}`;
        overloadSubtitle.style.color = state.progression.hardcoreMode ? "#ff0054" : "#00ff88";
      }
    };

    events.on("sceneChanged", ({ current }) => {
      if (current === "DEPLOYMENT") {
        updateDeploymentCards();
      }
    });

    if (btnDeployFloor1) {
      btnDeployFloor1.addEventListener("click", () => {
        audio.playSFX("deploy");
        ui.notify("DEPLOYING TO SECTOR 01: NETWORK INFILTRATION", "info");
        setState(s => {
          s.player.position.floor = 1;
          s.player.position.x = 1;
          s.player.position.y = 1;
          s.player.position.facing = "down";
          s.progression.currentFloor = 1;
          s.progression.terminalAActivated = false;
          s.progression.terminalBActivated = false;
          s.progression.floor1BossDefeated = false;
          if (s.terminals?.terminalA) s.terminals.terminalA.cooldownStartedAt = 0;
          if (s.terminals?.terminalB) s.terminals.terminalB.cooldownStartedAt = 0;
        });
        SaveSystem.save();
        scenes.change("OVERWORLD");
      });
    }

    if (btnDeployFloor2) {
      btnDeployFloor2.addEventListener("click", () => {
        if (state.player.level >= 10 || state.progression.unlockedFloor2) {
          audio.playSFX("deploy");
          ui.notify("DEPLOYING TO SECTOR 02: HAZARD ZONE", "warning");
          setState(s => { 
            s.player.position.floor = 2;
            s.player.position.x = 1;
            s.player.position.y = 1;
            s.player.position.facing = "down";
            s.progression.currentFloor = 2;
            s.progression.pcbSectorCleared = true;
            s.progression.floor2BlastDoorOpen = false;
            s.progression.floor2TerminalBActivated = false;
            s.progression.floor2BossDefeated = false;
            if (s.terminals?.floor2TerminalB) s.terminals.floor2TerminalB.cooldownStartedAt = 0;
            if (s.terminals?.floor2Repair) s.terminals.floor2Repair.cooldownStartedAt = 0;
          });
          SaveSystem.save();
          scenes.change("OVERWORLD");
        } else {
          audio.playSFX("warning");
          ui.notify("CLEARANCE INSUFFICIENT: Level 10 Required for Floor 02", "danger");
          ui.alert(
            "-- ACCESS DENIED --",
            [
              "* * * * * * * * * * * * *",
              "HAZARD ZONE is locked.",
              { text: "REQUIREMENT:", color: "var(--gold)" },
              "Reach LEVEL 10 in Floor 1 before entering this sector.",
              { text: "Current threats exceed your clearance level.", color: "var(--danger)" },
              "* * * * * * * * * * * * *"
            ],
            null,
            "#ffb703"
          );
        }
      });
    }

    if (btnToggleOverload) {
      btnToggleOverload.addEventListener("click", () => {
        if (state.player.level >= 20) {
          setState(s => {
            s.progression.hardcoreMode = !s.progression.hardcoreMode;
          });
          SaveSystem.save();
          updateDeploymentCards();

          if (state.progression.hardcoreMode) {
            audio.playSFX("warning");
            ui.alert(
              "SYSTEM OVERLOAD: ON",
              [
                "* * * * * * * * * * * * *",
                { text: "WARNING: Malware damage increased by 1.35x.", color: "#ff0054" },
                "Proceed to any sector.",
                "* * * * * * * * * * * * *"
              ],
              null,
              "#ff0054"
            );
          } else {
            audio.playSFX("heal");
            ui.alert(
              "SYSTEM OVERLOAD: OFF",
              [
                "* * * * * * * * * * * * *",
                { text: "System stabilized.", color: "#00ff88" },
                "Malware damage returned to normal.",
                "* * * * * * * * * * * * *"
              ],
              null,
              "#00ff88"
            );
          }
        } else {
          audio.playSFX("warning");
          ui.alert(
            "ERROR: ACCESS DENIED",
            [
              "* * * * * * * * * * * * *",
              { text: "ADMIN LEVEL 20 REQUIRED", color: "var(--gold)" },
              "System Overload mode is restricted to advanced personnel only.",
              "* * * * * * * * * * * * *"
            ],
            null,
            "#ff0054"
          );
        }
      });
    }

    if (btnBackFromDeploy) {
      btnBackFromDeploy.addEventListener("click", () => scenes.change("MENU"));
    }

    // Overworld Stats Modal
    const btnOverworldStats = document.getElementById("btn-overworld-stats");
    if (btnOverworldStats) {
      btnOverworldStats.addEventListener("click", () => {
        playerController.lock();
        ui.showStatsModal();
      });
    }

    // Overworld Return to Deployment
    const btnOverworldExit = document.getElementById("btn-overworld-exit");
    if (btnOverworldExit) {
      btnOverworldExit.addEventListener("click", () => scenes.change("DEPLOYMENT"));
    }

    // Helper to safely return to Main Menu from Overworld
    const returnToMenuFromOverworld = () => {
      // Don't trigger if cheat console is open
      const cheatEl = document.getElementById("cheat-console");
      if (cheatEl && cheatEl.classList.contains("open")) return;

      // Don't trigger if modal overlay is currently active
      const modalOverlay = document.getElementById("modal-overlay");
      if (modalOverlay && modalOverlay.classList.contains("modal-active")) return;

      playerController.stopMovementLoop();
      playerController.lock();
      audio.playSFX("menu_click");
      SaveSystem.save();
      ui.notify("SESSION PRESERVED. RETURNING TO MAIN MENU...", "info");
      scenes.change("MENU");
    };

    // Overworld Return to Menu button
    const btnOverworldMenu = document.getElementById("btn-overworld-menu");
    if (btnOverworldMenu) {
      btnOverworldMenu.addEventListener("click", returnToMenuFromOverworld);
    }

    // Overworld Escape Key listener
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (scenes.currentScene !== "OVERWORLD") return;

        const cheatEl = document.getElementById("cheat-console");
        if (cheatEl && cheatEl.classList.contains("open")) return;

        const modalOverlay = document.getElementById("modal-overlay");
        if (modalOverlay && modalOverlay.classList.contains("modal-active")) return;

        e.preventDefault();
        returnToMenuFromOverworld();
      }
    });

    // Profile Back
    const btnProfileBack = document.getElementById("btn-profile-back");
    if (btnProfileBack) {
      btnProfileBack.addEventListener("click", () => scenes.change("MENU"));
    }

    // Settings Back
    const btnSettingsBack = document.getElementById("btn-settings-back");
    if (btnSettingsBack) {
      btnSettingsBack.addEventListener("click", () => scenes.change("MENU"));
    }

    // Battle Exit (Test)
    const btnBattleExit = document.getElementById("btn-battle-exit-test");
    if (btnBattleExit) {
      btnBattleExit.addEventListener("click", () => {
        if (state.combat.returnPosition) {
          state.player.position.x = state.combat.returnPosition.x;
          state.player.position.y = state.combat.returnPosition.y;
          state.player.position.floor = state.combat.returnPosition.floor;
        }
        state.combat.inBattle = false;
        scenes.change("OVERWORLD");
      });
    }
  }

  bindSettingsEvents() {
    const masterVol = document.getElementById("slider-master-volume");
    const sfxVol = document.getElementById("slider-sfx-volume");
    const musicVol = document.getElementById("slider-music-volume");

    const valMaster = document.getElementById("val-master-vol");
    const valSfx = document.getElementById("val-sfx-vol");
    const valMusic = document.getElementById("val-music-vol");

    // Initialize values from state
    if (masterVol) {
      masterVol.value = state.settings.masterVolume ?? 0.8;
      if (valMaster) valMaster.textContent = `${Math.round(masterVol.value * 100)}%`;
      masterVol.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        setState(s => { s.settings.masterVolume = val; });
        audio.setMasterVolume(val);
        if (valMaster) valMaster.textContent = `${Math.round(val * 100)}%`;
        SaveSystem.save();
      });
    }

    if (sfxVol) {
      sfxVol.value = state.settings.sfxVolume ?? 0.8;
      if (valSfx) valSfx.textContent = `${Math.round(sfxVol.value * 100)}%`;
      sfxVol.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        setState(s => { s.settings.sfxVolume = val; });
        audio.setSfxVolume(val);
        if (valSfx) valSfx.textContent = `${Math.round(val * 100)}%`;
        SaveSystem.save();
      });
      sfxVol.addEventListener("change", () => audio.playSFX("menu_click"));
    }

    if (musicVol) {
      musicVol.value = state.settings.musicVolume ?? 0.6;
      if (valMusic) valMusic.textContent = `${Math.round(musicVol.value * 100)}%`;
      musicVol.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        setState(s => { s.settings.musicVolume = val; });
        audio.setMusicVolume(val);
        if (valMusic) valMusic.textContent = `${Math.round(val * 100)}%`;
        SaveSystem.save();
      });
    }

    // Reset Save Data
    const btnReset = document.getElementById("btn-settings-reset");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        ui.confirm(
          "PURGE OPERATOR ARCHIVES?",
          "This action will permanently erase all mission records, clearance levels, and security tokens. This cannot be undone.",
          () => {
            SaveSystem.reset();
            ui.notify("SECURITY REGISTRY PURGED. RESETTING SYSTEM...", "danger");
            setTimeout(() => scenes.change("MENU"), 600);
          }
        );
      });
    }
  }

  runBootSequence(hasSave) {
    const bootConsole = document.getElementById("boot-console-text");
    if (!bootConsole) return;

    const bootLines = [
      "CYBER DEFENDER BIOS v4.0.2 [SECURITY KERNEL]",
      "Copyright (c) 2026 Universidad de Manila — CCS",
      "Scanning physical PCB hardware layers...",
      "Core Memory Integrity: 100% OK",
      "Perimeter Firewall: SYNCHRONIZED",
      "Heuristic Antivirus Engine: INITIALIZED",
      "Malware Detection Grid: ONLINE",
      "",
      "CRITICAL ALERT: Unauthorized payload intrusion detected on Floor 01!",
      "SYSTEM STATUS: COMPROMISED",
      "",
      "Ready for ADMIN deployment. Press CONTINUE..."
    ];

    let currentLine = 0;
    bootConsole.textContent = "";

    this.bootInterval = setInterval(() => {
      if (scenes.currentScene !== "BOOT") {
        clearInterval(this.bootInterval);
        return;
      }

      if (currentLine < bootLines.length) {
        bootConsole.textContent += bootLines[currentLine] + "\n";
        bootConsole.scrollTop = bootConsole.scrollHeight;
        currentLine++;
      } else {
        clearInterval(this.bootInterval);
        const skipBtn = document.getElementById("btn-boot-skip");
        if (skipBtn) skipBtn.textContent = "ENTER SYSTEM ▸";
      }
    }, 140);
  }
}

export const game = new Game();

if (typeof window !== "undefined") {
  window.CyberGame = game;
}
