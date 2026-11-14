/**
 * CYBER DEFENDER — Floor Layout & Tile Specifications
 * Logical matrix grids separating game data from DOM rendering.
 */

export const TILE_TYPES = {
  NORMAL: 0,
  CORRUPTED: 1,
  WALL: 2,
  TERMINAL_A: 3,
  TERMINAL_B: 4,
  TERMINAL_REPAIR: 5,
  HONEYPOT: 6,
  SWITCH: 7,
  BLAST_DOOR: 8,
  EXTRACTION: 9
};

export const FLOORS = {
  1: {
    id: 1,
    name: "FLOOR 01",
    subtitle: "NETWORK INFILTRATION",
    unlockLevel: 1,
    unlocked: true,
    systemDamageRatio: 0.25,
    width: 18,
    height: 14,
    spawn: { x: 1, y: 1 },
    // Layout is a compact, fully-connected sector (verified via BFS from spawn):
    // Player spawns TOP-LEFT, Terminal A sits TOP-RIGHT, Terminal B sits
    // BOTTOM-LEFT, and the Exit sits BOTTOM-RIGHT (locked until Terminal B
    // has been activated — see overworld.js EXTRACTION handling). This forces
    // a diagonal traversal of the sector rather than an immediate exit.
    grid: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 3, 2],
      [2, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 2, 2, 1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2],
      [2, 0, 0, 0, 2, 2, 1, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2],
      [2, 1, 1, 0, 0, 0, 1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2],
      [2, 1, 1, 0, 1, 0, 2, 2, 0, 2, 2, 1, 1, 0, 1, 0, 0, 2],
      [2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 2],
      [2, 1, 1, 0, 2, 2, 0, 0, 0, 0, 0, 1, 0, 2, 2, 0, 0, 2],
      [2, 0, 0, 0, 2, 2, 0, 0, 1, 2, 2, 2, 1, 2, 2, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 1, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 2],
      [2, 4, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 9, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ]
  },
  2: {
    id: 2,
    name: "FLOOR 02",
    subtitle: "HAZARD ZONE",
    unlockLevel: 10,
    unlocked: false,
    systemDamageRatio: 0.65,
    width: 24,
    height: 23,
    spawn: { x: 1, y: 1 },
    // Two-chamber layout: a wall column at x=10 separates the Switch's
    // chamber from the Blast Door's chamber. Verified via BFS that the
    // Honeypot/Repair Terminal/Exit are unreachable with the door closed,
    // and reachable once it's opened — the gate cannot be bypassed.
    grid: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 5, 0, 2],
      [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 7, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 1, 0, 2, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 1, 0, 2, 2, 0, 0, 0, 0, 0, 2, 0, 1, 2, 2, 0, 2, 2, 2, 0, 1, 0, 0, 2],
      [2, 1, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 2],
      [2, 0, 1, 0, 0, 0, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 8, 2, 2, 2, 2, 2, 2],
      [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
      [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 0, 0, 1, 2, 2, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 0, 0, 1, 2, 2, 2, 0, 0, 0, 2, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 1, 2, 2, 2, 0, 2, 2, 0, 1, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 1, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 2, 2, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 2],
      [2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2],
      [2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2],
      [2, 0, 0, 1, 1, 0, 2, 2, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1, 0, 0, 2],
      [2, 0, 7, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 2],
      [2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 2],
      [2, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ]
  }
};

if (typeof window !== "undefined") {
  window.CyberFloors = { TILE_TYPES, FLOORS };
}

