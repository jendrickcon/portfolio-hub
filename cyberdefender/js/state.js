/**
 * CYBER DEFENDER — Central State Management & Event Bus
 * Pure JavaScript state model with reactive pub/sub architecture.
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listener);
    }
  }

  emit(event, payload) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(listener => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[EventEmitter Error in ${event}]:`, err);
        }
      });
    }
  }
}

export const events = new EventEmitter();

export function createInitialState() {
  return {
    player: {
      name: "ADMIN",
      level: 1,
      xp: 0,
      hp: 100,
      maxHp: 100,
      kills: { worm: 0, adware: 0, spyware: 0, trojan: 0 },
      position: { floor: 1, x: 1, y: 1, facing: "down" },
      badges: [],
      overclockCharges: 0,
      avatar: {
        chassis: "pixel_hero",
        color: "cyan"
      },
      equipment: {
        deck: "deck_standard",
        shield: "shield_standard"
      }
    },
    system: {
      hp: 100,
      maxHp: 100,
      lastActiveDate: Date.now()
    },
    progression: {
      currentFloor: 1,
      unlockedFloor2: false,
      floor2BlastDoorOpen: false,
      terminalAActivated: false,
      terminalBActivated: false,
      floor2TerminalBActivated: false,
      floor1BossDefeated: false,
      floor2BossDefeated: false
    },
    terminals: {
      terminalA: { cooldownStartedAt: 0 },
      terminalB: { cooldownStartedAt: 0 },
      floor2TerminalB: { cooldownStartedAt: 0 },
      floor2Repair: { cooldownStartedAt: 0 }
    },
    combat: {
      inBattle: false,
      enemy: null,
      returnPosition: null,
      scanned: false,
      playerTurnBlocked: false,
      godMode: false,
      roundNumber: 1
    },
    settings: {
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.8
    }
  };
}

export const state = createInitialState();

export function setState(updater) {
  if (typeof updater === "function") {
    updater(state);
  } else {
    Object.assign(state, updater);
  }
  events.emit("stateChanged", state);
}

if (typeof window !== "undefined") {
  window.CyberState = { state, events, setState, createInitialState };
}

