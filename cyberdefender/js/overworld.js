/**
 * CYBER DEFENDER — Overworld Logical Grid & Encounter Engine
 * Renders data-driven tile grids, manages collision, and resolves tile interactions.
 */

import { state, events, setState } from "./state.js";
import { FLOORS, TILE_TYPES } from "../data/floors.js";
import { ENEMIES } from "../data/enemies.js";
import { BOSSES } from "../data/bosses.js";
import { playerController } from "./player.js";
import { scenes } from "./scenes.js";
import { audio } from "./audio.js";
import { ui } from "./ui.js";
import { avatarRenderer } from "./avatar.js";
import { progression } from "./progression.js";
import { encounterUI } from "./encounter.js";

export class OverworldEngine {
  constructor() {
    this.container = null;
    this.gridElement = null;
    this.playerElement = null;
    this.currentFloor = null;
    this.tileSize = 44; // px (dynamically computed to fill container)
    this.initialized = false;
    this.resizeObserver = null;
  }

  init() {
    if (this.initialized) return;
    this.container = document.getElementById("overworld-grid-viewport");
    playerController.init(this);
    this.bindResize();
    this.initialized = true;
  }

  bindResize() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
    });

    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Tile size is now a comfortable, responsive constant based on the viewport
   * alone — it is NOT shrunk to make the whole map fit on screen. The map
   * (the "world") is almost always larger than the visible viewport; the
   * camera (see updateCamera) is what reconciles the two, by scrolling
   * rather than by shrinking everything down to one small, fully-visible
   * board.
   */
  computeTileSize() {
    // Viewport available bounds
    let availW = this.container ? this.container.clientWidth : 0;
    let availH = this.container ? this.container.clientHeight : 0;

    // Fallback if container is not yet laid out or scene is transitioning
    if (!availW || !availH || availW < 100 || availH < 100) {
      const frame = document.getElementById("game-frame");
      if (frame && frame.clientWidth && frame.clientHeight) {
        availW = frame.clientWidth;
        availH = frame.clientHeight - 60; // account for top status & overworld HUD
      } else {
        availW = window.innerWidth;
        availH = window.innerHeight - 80;
      }
    }

    const smallerDim = Math.min(availW, availH);
    let base = 48;
    if (smallerDim < 380) {
      base = 32;
    } else if (smallerDim < 520) {
      base = 38;
    } else if (smallerDim < 680) {
      base = 48;
    } else if (smallerDim < 850) {
      // Standard desktop (720p-1080p):
      // Scaled so the overworld fills the screen generously and extends beyond the viewport,
      // enabling active camera tracking and scrolling as the avatar navigates.
      base = Math.max(92, Math.round(availH / 8.2));
    } else {
      // Large desktop (1440p / 4K):
      base = Math.max(104, Math.round(availH / 8));
    }

    // Ensure on desktop (availW >= 800) the current floor always exceeds viewport bounds
    // on both axes so the camera smoothly tracks the avatar across the entire floor
    if (availW >= 800 && this.currentFloor) {
      const minW = Math.ceil((availW + 80) / this.currentFloor.width);
      const minH = Math.ceil((availH + 80) / this.currentFloor.height);
      base = Math.max(base, Math.min(minW, 120), Math.min(minH, 120));
    }

    this.tileSize = base;
    return this.tileSize;
  }

  updateDimensions() {
    if (!this.gridElement || !this.currentFloor) return;
    const newSize = this.computeTileSize();
    const { width, height } = this.currentFloor;

    this.gridElement.style.setProperty("--tile-size", `${newSize}px`);
    this.gridElement.style.gridTemplateColumns = `repeat(${width}, ${newSize}px)`;
    this.gridElement.style.gridTemplateRows = `repeat(${height}, ${newSize}px)`;
    this.gridElement.style.width = `${width * newSize}px`;
    this.gridElement.style.height = `${height * newSize}px`;

    this.syncPlayerPosition(state.player.position.x, state.player.position.y);
    // Viewport size and/or tile size may have changed — re-clamp the camera
    // instantly (no animated slide on resize).
    this.updateCamera(true);
  }

  /**
   * Camera: positions the world (.tile-grid) inside the fixed-size, clipped
   * viewport so the player stays centered, while clamping so the map edge
   * never reveals empty space beyond the world bounds. If the world is
   * smaller than the viewport on a given axis, that axis is simply centered
   * instead of scrolled.
   * @param {boolean} instant - skip the CSS transition (used on load/resize)
   */
  updateCamera(instant = false) {
    if (!this.gridElement || !this.currentFloor || !this.container) return;

    const { width, height } = this.currentFloor;
    const worldW = width * this.tileSize;
    const worldH = height * this.tileSize;
    const viewW = this.container.clientWidth;
    const viewH = this.container.clientHeight;

    const playerPx = state.player.position.x * this.tileSize + this.tileSize / 2;
    const playerPy = state.player.position.y * this.tileSize + this.tileSize / 2;

    const clampAxis = (playerCenter, worldSize, viewSize) => {
      if (worldSize <= viewSize) {
        return (viewSize - worldSize) / 2;
      }
      let cam = playerCenter - viewSize / 2;
      cam = Math.max(0, Math.min(cam, worldSize - viewSize));
      return -cam;
    };

    const tx = clampAxis(playerPx, worldW, viewW);
    const ty = clampAxis(playerPy, worldH, viewH);

    const isFullyVisible = worldW <= viewW && worldH <= viewH;
    this.gridElement.classList.toggle("camera-centered", isFullyVisible);

    if (instant) {
      const prevTransition = this.gridElement.style.transition;
      this.gridElement.style.transition = "none";
      this.gridElement.style.transform = `translate(${tx}px, ${ty}px)`;
      void this.gridElement.offsetHeight; // force reflow before restoring transition
      this.gridElement.style.transition = prevTransition;
    } else {
      this.gridElement.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  loadFloor(floorNumber = 1) {
    this.init();
    const floorData = FLOORS[floorNumber];
    if (!floorData) {
      console.error(`[OverworldEngine]: Invalid floor number ${floorNumber}`);
      return;
    }

    this.currentFloor = floorData;
    setState(s => { s.progression.currentFloor = floorNumber; });

    // Update HUD Sector title
    const sectorTag = document.getElementById("hud-overworld-sector");
    if (sectorTag) {
      sectorTag.textContent = `${floorData.name}: ${floorData.subtitle}`;
    }

    this.renderGrid();
    this.updateHUDPosition(state.player.position.x, state.player.position.y);
    playerController.unlock();

    if (floorNumber === 2) {
      progression.unlockBadge("hazard_survivor");
    }
  }

  renderGrid() {
    if (!this.container) return;
    this.container.innerHTML = "";

    const { width, height, grid } = this.currentFloor;
    const tileSize = this.computeTileSize();

    this.gridElement = document.createElement("div");
    this.gridElement.className = "tile-grid";
    this.gridElement.style.setProperty("--tile-size", `${tileSize}px`);
    this.gridElement.style.gridTemplateColumns = `repeat(${width}, ${tileSize}px)`;
    this.gridElement.style.gridTemplateRows = `repeat(${height}, ${tileSize}px)`;
    this.gridElement.style.width = `${width * tileSize}px`;
    this.gridElement.style.height = `${height * tileSize}px`;

    // Render cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = grid[y][x];
        const cell = document.createElement("div");
        cell.className = `tile-cell tile-${type}`;
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.dataset.type = type;

        // Blast door open state check
        if (type === TILE_TYPES.BLAST_DOOR && state.progression.floor2BlastDoorOpen) {
          cell.classList.add("door-open");
        }

        // Exit is visually present from the start, but shows a LOCKED state
        // on Floor 1 until Terminal B has been activated, and on Floor 2
        // until Floor 2's Terminal B has been activated.
        if (type === TILE_TYPES.EXTRACTION) {
          const floor1Locked = this.currentFloor.id === 1 && !state.progression.terminalBActivated;
          const floor2Locked = this.currentFloor.id === 2 && !state.progression.floor2TerminalBActivated;
          const locked = floor1Locked || floor2Locked;
          cell.classList.add(locked ? "exit-locked" : "exit-granted");
        }

        this.gridElement.appendChild(cell);
      }
    }

    // Mount Player Entity
    this.playerElement = document.createElement("div");
    this.playerElement.className = "player-entity";
    this.updatePlayerVisual(state.player.position.facing || "down", false);
    this.gridElement.appendChild(this.playerElement);

    this.container.appendChild(this.gridElement);

    // Position player and camera immediately (no animated slide on load)
    this.syncPlayerPosition(state.player.position.x, state.player.position.y);
    this.updateCamera(true);

    // Re-verify dimensions on next animation frame after layout resolves
    requestAnimationFrame(() => {
      this.updateDimensions();
    });
    setTimeout(() => {
      this.updateDimensions();
    }, 50);
  }

  updatePlayerVisual(facing = "down", isWalking = false) {
    if (!this.playerElement) return;
    this.playerElement.innerHTML = avatarRenderer.getOverworldPlayerHtml(facing, isWalking);
  }

  syncPlayerPosition(x, y) {
    if (!this.playerElement) return;
    this.playerElement.style.left = `${x * this.tileSize}px`;
    this.playerElement.style.top = `${y * this.tileSize}px`;
  }

  canMoveTo(x, y) {
    if (!this.currentFloor) return false;
    const { width, height, grid } = this.currentFloor;

    // Out of bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return false;
    }

    const tile = grid[y][x];

    // Wall collision
    if (tile === TILE_TYPES.WALL) {
      return false;
    }

    // Blast door collision: impassable if closed
    if (tile === TILE_TYPES.BLAST_DOOR && !state.progression.floor2BlastDoorOpen) {
      ui.notify("ACCESS DENIED: Blast door is locked. Activate Override Switch.", "warning");
      audio.playSFX("warning");
      return false;
    }

    return true;
  }

  onPlayerStep(x, y) {
    this.syncPlayerPosition(x, y);
    this.updateCamera(false);
    this.updateHUDPosition(x, y);

    const facing = state.player.position.facing || "down";
    this.updatePlayerVisual(facing, true);
    if (this.walkTimeout) clearTimeout(this.walkTimeout);
    this.walkTimeout = setTimeout(() => {
      this.updatePlayerVisual(state.player.position.facing || "down", false);
    }, 160);

    const tile = this.currentFloor.grid[y][x];

    // 1. Corrupted Tile Random Encounter Roll
    if (tile === TILE_TYPES.CORRUPTED) {
      if (this.shouldTriggerEncounter()) {
        this.triggerEncounter(x, y);
        return;
      }
    }

    // 2. Floor 2 Override Switch
    if (tile === TILE_TYPES.SWITCH) {
      if (!state.progression.floor2BlastDoorOpen) {
        setState(s => { s.progression.floor2BlastDoorOpen = true; });
        audio.playSFX("deploy");
        ui.notify("SECURITY OVERRIDE ENGAGED: Blast door unlocked!", "success");

        // Update door visually
        const doorCell = this.gridElement.querySelector(`.tile-${TILE_TYPES.BLAST_DOOR}`);
        if (doorCell) doorCell.classList.add("door-open");
      } else {
        ui.notify("OVERRIDE ACTIVE: Blast door already unlocked.", "info");
      }
      return;
    }

    // 3. Extraction Return Portal — locked until Terminal B has been activated
    // on Floor 1, and until Floor 2's Terminal B has been activated on Floor 2.
    if (tile === TILE_TYPES.EXTRACTION) {
      const floor1Locked = this.currentFloor.id === 1 && !state.progression.terminalBActivated;
      const floor2Locked = this.currentFloor.id === 2 && !state.progression.floor2TerminalBActivated;
      if (floor1Locked || floor2Locked) {
        audio.playSFX("warning");
        ui.notify("EXIT [LOCKED]: ACCESS DENIED — Activate Terminal B to unlock extraction.", "warning");
        return;
      }

      // Sector 01 Boss: Rootkit Overseer guards extraction until defeated
      if (this.currentFloor.id === 1 && !state.progression.floor1BossDefeated) {
        this.triggerBossEncounter("sector1_boss");
        return;
      }

      // Sector 02 Boss: Polymorphic Warden guards extraction until defeated
      if (this.currentFloor.id === 2 && !state.progression.floor2BossDefeated) {
        this.triggerBossEncounter("sector2_boss");
        return;
      }

      ui.confirm("SECTOR EXTRACTION", "EXIT [ACCESS GRANTED]. Initiate extraction and return to Deployment Headquarters?", () => {
        scenes.change("DEPLOYMENT");
      });
      return;
    }

    // 4. Terminals
    if ([TILE_TYPES.TERMINAL_A, TILE_TYPES.TERMINAL_B, TILE_TYPES.TERMINAL_REPAIR, TILE_TYPES.HONEYPOT].includes(tile)) {
      events.emit("terminalStepped", { tile, x, y });
    }
  }

  /**
   * Called after Terminal B is activated so the Exit tile's LOCKED state
   * updates immediately without a full grid re-render.
   */
  refreshExitLockVisual() {
    if (!this.gridElement) return;
    const exitCell = this.gridElement.querySelector(`.tile-${TILE_TYPES.EXTRACTION}`);
    if (!exitCell) return;
    const floor1Locked = this.currentFloor?.id === 1 && !state.progression.terminalBActivated;
    const floor2Locked = this.currentFloor?.id === 2 && !state.progression.floor2TerminalBActivated;
    const locked = floor1Locked || floor2Locked;
    exitCell.classList.toggle("exit-locked", locked);
    exitCell.classList.toggle("exit-granted", !locked);
  }

  updateHUDPosition(x, y) {
    const posTag = document.getElementById("hud-overworld-pos");
    if (posTag) {
      posTag.textContent = `LOC: [X:${x}, Y:${y}]`;
    }
  }

  shouldTriggerEncounter() {
    // Base encounter rate is 13% per step on corrupted tiles.
    // When System HP is 0, encounter rate escalates to 35%.
    const rate = state.system.hp <= 0 ? 0.35 : 0.13;
    return Math.random() < rate;
  }

  triggerEncounter(x, y) {
    playerController.lock();

    // Store return coordinate
    state.combat.returnPosition = {
      floor: this.currentFloor.id,
      x,
      y
    };

    // Pick random enemy archetype
    const enemyKeys = Object.keys(ENEMIES);
    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const enemyTemplate = ENEMIES[randomKey];

    // Roll enemy HP within range
    const [minHp, maxHp] = enemyTemplate.hpRange;
    const enemyHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;

    state.combat.inBattle = true;
    state.combat.enemy = {
      ...enemyTemplate,
      currentHp: enemyHp,
      maxHp: enemyHp
    };
    state.combat.scanned = false;
    state.combat.playerTurnBlocked = false;

    // Trigger visual flash & siren
    const flash = document.getElementById("encounter-flash");
    if (flash) flash.classList.add("flash-active");
    audio.playSFX("warning");

    ui.notify(`MALWARE DETECTED: Intercepting ${enemyTemplate.name}!`, "danger");

    setTimeout(() => {
      if (flash) flash.classList.remove("flash-active");
      encounterUI.showEncounter("", () => {
        scenes.change("BATTLE");
      });
    }, 450);
  }

  triggerBossEncounter(bossId = "sector1_boss") {
    playerController.lock();

    const bossTemplate = BOSSES[bossId];
    if (!bossTemplate) return;

    // Store return coordinate
    state.combat.returnPosition = {
      floor: this.currentFloor.id,
      x: state.player.position.x,
      y: state.player.position.y
    };

    const [minHp, maxHp] = bossTemplate.hpRange;
    const bossHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;

    state.combat.inBattle = true;
    state.combat.enemy = {
      ...bossTemplate,
      currentHp: bossHp,
      maxHp: bossHp
    };
    state.combat.scanned = false;
    state.combat.playerTurnBlocked = false;

    // Trigger visual flash & alarm siren
    const flash = document.getElementById("encounter-flash");
    if (flash) flash.classList.add("flash-active");
    audio.playSFX("warning");

    ui.notify(`CRITICAL BREACH: Intercepting ${bossTemplate.name}!`, "danger");

    setTimeout(() => {
      if (flash) flash.classList.remove("flash-active");
      encounterUI.showEncounter(`CRITICAL BREACH // ${bossTemplate.name.toUpperCase()}`, () => {
        scenes.change("BATTLE");
      });
    }, 450);
  }
}

export const overworld = new OverworldEngine();

if (typeof window !== "undefined") {
  window.CyberOverworld = overworld;
}

