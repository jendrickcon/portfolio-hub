/**
 * CYBER DEFENDER — Equipment & Avatar Specifications
 * Data definitions for chassis styles, aura colorways, cyber decks, and security shields.
 */

export const CHASSIS_STYLES = {
  pixel_hero: {
    id: "pixel_hero",
    name: "Enuhri Terminal Operator",
    tagline: "Standard Field Operator",
    type: "pixel",
    spriteIdle: "assets/sprites/player-idle-down.png",
    spriteCombat: "assets/sprites/player-idle-right.png",
    desc: "Tactical human IT responder equipped with portable diagnostic terminal, field backpack, and grounded physical silhouette."
  },
  infiltrator: {
    id: "infiltrator",
    name: "Ghost Infiltrator",
    tagline: "Stealth Reconnaissance",
    type: "vector",
    spriteIdle: "assets/sprites/avatar-ghost.svg",
    spriteCombat: "assets/sprites/avatar-ghost.svg",
    desc: "Semi-digital stealth operator featuring cloaking lattice, glowing cyan visor slit, and fragmented pixel decoherence."
  },
  sentinel: {
    id: "sentinel",
    name: "Protocol Sentinel",
    tagline: "Heavy Defense Construct",
    type: "vector",
    spriteIdle: "assets/sprites/avatar-sentinel.svg",
    spriteCombat: "assets/sprites/avatar-sentinel.svg",
    desc: "Humanoid security construct with angular armor plates, glowing geometric diamond core, and hover stabilization."
  },
  // Backward compatibility alias for saves with vector_visor
  vector_visor: {
    id: "sentinel",
    name: "Protocol Sentinel",
    tagline: "Heavy Defense Construct",
    type: "vector",
    spriteIdle: "assets/sprites/avatar-sentinel.svg",
    spriteCombat: "assets/sprites/avatar-sentinel.svg",
    desc: "Humanoid security construct with angular armor plates, glowing geometric diamond core, and hover stabilization."
  }
};

export const AVATAR_LIST = [
  CHASSIS_STYLES.pixel_hero,
  CHASSIS_STYLES.infiltrator,
  CHASSIS_STYLES.sentinel
];

export const AURA_COLORS = {
  cyan: {
    id: "cyan",
    name: "Neon Cyan",
    hex: "#00f0ff",
    rgbaGlow: "rgba(0, 240, 255, 0.7)",
    unlockReq: "Default Clearance"
  },
  green: {
    id: "green",
    name: "Matrix Green",
    hex: "#00ff88",
    rgbaGlow: "rgba(0, 255, 136, 0.7)",
    unlockReq: "Reach Level 5",
    reqLevel: 5
  },
  amber: {
    id: "amber",
    name: "Amber Overdrive",
    hex: "#ffb703",
    rgbaGlow: "rgba(255, 183, 3, 0.7)",
    unlockReq: "Reach Level 10 (System Analyst)",
    reqLevel: 10
  },
  crimson: {
    id: "crimson",
    name: "Rogue Crimson",
    hex: "#ff0054",
    rgbaGlow: "rgba(255, 0, 85, 0.7)",
    unlockReq: "Reach Level 15",
    reqLevel: 15
  },
  violet: {
    id: "violet",
    name: "Hyper Violet",
    hex: "#d000ff",
    rgbaGlow: "rgba(208, 0, 255, 0.7)",
    unlockReq: "Neutralize 10 Malware Processes",
    reqKills: 10
  }
};

export const CYBER_DECKS = {
  deck_standard: {
    id: "deck_standard",
    name: "Standard Issued Rig",
    slot: "deck",
    icon: "💻",
    perk: "Standard factory-issued terminal. Balanced baseline throughput.",
    statLabel: "+0% Modifier",
    unlocked: true,
    unlockReq: "Default Issue"
  },
  deck_overclock: {
    id: "deck_overclock",
    name: "Overclocked Rig",
    slot: "deck",
    icon: "⚡",
    perk: "+1 Bonus Overclock charge automatically seeded at combat start!",
    statLabel: "+1 Start OC",
    unlocked: false,
    unlockReq: "Synchronize Terminal B or Reach Level 5",
    checkUnlock: (state) => (state.player.level >= 5 || state.progression.terminalBActivated)
  },
  deck_quantum: {
    id: "deck_quantum",
    name: "Quantum Kernel Deck",
    slot: "deck",
    icon: "⚛",
    perk: "Accelerates countermeasure algorithms: +10% base damage on all attacks.",
    statLabel: "+10% Countermeasure DMG",
    unlocked: false,
    unlockReq: "Attain Security Clearance Level 10",
    checkUnlock: (state) => (state.player.level >= 10)
  }
};

export const SECURITY_SHIELDS = {
  shield_standard: {
    id: "shield_standard",
    name: "Stateful Buffer v1",
    slot: "shield",
    icon: "🛡",
    perk: "Baseline stateful firewall. Standard damage absorption.",
    statLabel: "Baseline Buffer",
    unlocked: true,
    unlockReq: "Default Issue"
  },
  shield_heuristic: {
    id: "shield_heuristic",
    name: "Adaptive Heuristic Shield",
    slot: "shield",
    icon: "🔰",
    perk: "Dynamic threat deflection: Reduces incoming malware strike damage by 15%.",
    statLabel: "-15% Damage Taken",
    unlocked: false,
    unlockReq: "Neutralize 2 Trojan Horses",
    checkUnlock: (state) => ((state.player.kills?.trojan || 0) >= 2)
  },
  shield_scrambler: {
    id: "shield_scrambler",
    name: "Anti-Telemetry Scrambler",
    slot: "shield",
    icon: "🚫",
    perk: "Intercepts rogue UI spam: 100% immune to Adware's turn-skip popup stun!",
    statLabel: "Immune to Stun",
    unlocked: false,
    unlockReq: "Neutralize 2 Adware Daemons",
    checkUnlock: (state) => ((state.player.kills?.adware || 0) >= 2)
  },
  shield_siphon: {
    id: "shield_siphon",
    name: "Siphon Negator",
    slot: "shield",
    icon: "🧲",
    perk: "Inverts draining packets: Cuts Spyware's lifesteal recovery from 60% down to 30%.",
    statLabel: "-50% Enemy Lifesteal",
    unlocked: false,
    unlockReq: "Neutralize 2 Spyware Monitors",
    checkUnlock: (state) => ((state.player.kills?.spyware || 0) >= 2)
  }
};

if (typeof window !== "undefined") {
  window.CyberEquipment = {
    CHASSIS_STYLES,
    AURA_COLORS,
    CYBER_DECKS,
    SECURITY_SHIELDS
  };
}

