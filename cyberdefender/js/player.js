/**
 * CYBER DEFENDER — Player Entity & Movement Controller
 * Handles 4-directional tile movement via Keyboard (WASD/Arrows) and Virtual Touch D-Pad.
 */

import { state, events, setState } from "./state.js";
import { audio } from "./audio.js";

export class PlayerController {
  constructor() {
    this.locked = false;
    this.lastStepTime = 0;
    this.stepCooldownMs = 90; // Movement debounce
    this.activeFloor = null;
    this.onMoveCallback = null;

    // Responsive key-holding and running loop
    this.heldKeys = new Map();
    this.currentDirection = null;
    this.repeatTimeout = null;
    this.repeatInterval = null;
    this.initialHoldDelayMs = 180; // Quick pickup (no 1-second delay)
    this.runStepIntervalMs = 110;  // Fast running step speed
  }

  init(overworldEngine) {
    this.overworld = overworldEngine;
    this.bindKeyboard();
    this.bindVirtualDpad();
    this.bindWindowBlur();
  }

  lock() {
    this.locked = true;
    this.stopMovementLoop();
  }

  unlock() {
    this.locked = false;
  }

  stopMovementLoop() {
    this.heldKeys.clear();
    this.currentDirection = null;
    if (this.repeatTimeout) {
      clearTimeout(this.repeatTimeout);
      this.repeatTimeout = null;
    }
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  }

  bindWindowBlur() {
    window.addEventListener("blur", () => {
      this.stopMovementLoop();
    });
  }

  startMovementLoop(dx, dy) {
    this.currentDirection = { dx, dy };
    if (this.repeatTimeout) clearTimeout(this.repeatTimeout);
    if (this.repeatInterval) clearInterval(this.repeatInterval);

    // Initial step was already executed immediately.
    // After quick hold delay (180ms), start continuous running steps (110ms).
    this.repeatTimeout = setTimeout(() => {
      if (this.locked || !this.currentDirection) return;
      this.attemptMove(this.currentDirection.dx, this.currentDirection.dy);

      this.repeatInterval = setInterval(() => {
        if (this.locked || !this.currentDirection) {
          this.stopMovementLoop();
          return;
        }
        this.attemptMove(this.currentDirection.dx, this.currentDirection.dy);
      }, this.runStepIntervalMs);
    }, this.initialHoldDelayMs);
  }

  bindKeyboard() {
    const keyMap = {
      ArrowUp: { dx: 0, dy: -1 },
      w: { dx: 0, dy: -1 },
      W: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      s: { dx: 0, dy: 1 },
      S: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      a: { dx: -1, dy: 0 },
      A: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      d: { dx: 1, dy: 0 },
      D: { dx: 1, dy: 0 }
    };

    window.addEventListener("keydown", (e) => {
      if (this.locked) return;
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      const dir = keyMap[e.key];
      if (!dir) return;

      e.preventDefault();

      // Suppress OS keyboard auto-repeat events since our custom loop manages speed
      if (e.repeat) return;

      this.heldKeys.set(e.key, dir);
      this.attemptMove(dir.dx, dir.dy);
      this.startMovementLoop(dir.dx, dir.dy);
    });

    window.addEventListener("keyup", (e) => {
      const dir = keyMap[e.key];
      if (!dir) return;

      this.heldKeys.delete(e.key);

      if (this.heldKeys.size > 0) {
        const nextDir = Array.from(this.heldKeys.values()).pop();
        this.startMovementLoop(nextDir.dx, nextDir.dy);
      } else {
        this.stopMovementLoop();
      }
    });
  }

  bindVirtualDpad() {
    const directions = [
      { id: "dpad-up", dx: 0, dy: -1 },
      { id: "dpad-down", dx: 0, dy: 1 },
      { id: "dpad-left", dx: -1, dy: 0 },
      { id: "dpad-right", dx: 1, dy: 0 }
    ];

    directions.forEach(({ id, dx, dy }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const start = (e) => {
          e.preventDefault();
          if (this.locked) return;
          this.heldKeys.set(id, { dx, dy });
          this.attemptMove(dx, dy);
          this.startMovementLoop(dx, dy);
        };
        const end = (e) => {
          e.preventDefault();
          this.heldKeys.delete(id);
          if (this.heldKeys.size > 0) {
            const nextDir = Array.from(this.heldKeys.values()).pop();
            this.startMovementLoop(nextDir.dx, nextDir.dy);
          } else {
            this.stopMovementLoop();
          }
        };

        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", end);
        btn.addEventListener("pointercancel", end);
        btn.addEventListener("pointerleave", end);
      }
    });
  }

  attemptMove(dx, dy) {
    if (this.locked) return;
    const now = Date.now();
    if (now - this.lastStepTime < this.stepCooldownMs) return;
    this.lastStepTime = now;

    const currentX = state.player.position.x;
    const currentY = state.player.position.y;
    const targetX = currentX + dx;
    const targetY = currentY + dy;

    // Check collision with overworld engine
    if (!this.overworld || !this.overworld.canMoveTo(targetX, targetY)) {
      return;
    }

    // Facing direction
    let facing = "down";
    if (dx > 0) facing = "right";
    else if (dx < 0) facing = "left";
    else if (dy < 0) facing = "up";

    setState(s => {
      s.player.position.x = targetX;
      s.player.position.y = targetY;
      s.player.position.facing = facing;
    });

    audio.playSFX("step");

    if (this.overworld) {
      this.overworld.onPlayerStep(targetX, targetY);
    }
  }
}

export const playerController = new PlayerController();

if (typeof window !== "undefined") {
  window.CyberPlayer = playerController;
}

