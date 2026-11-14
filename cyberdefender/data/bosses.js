/**
 * CYBER DEFENDER — Scripted Boss Encounters
 * Authoritative definitions for floor bosses.
 * Kept strictly separated from random encounter pools.
 */

export const BOSSES = {
  sector1_boss: {
    id: "sector1_boss",
    name: "Rootkit Overseer",
    type: "Sector 01 Master Daemon // Kernel Breach",
    hpRange: [130, 160],
    weakness: "antivirus",
    resistance: "firewall",
    sprite: "assets/enemies/boss-sector1.svg",
    baseDamage: [18, 23],
    isBoss: true,
    special: {
      type: "dataEnc6yption",
      chance: 0.40,
      damage: 15,
      description: "Encrypts system memory sectors, dealing +15 bonus true damage."
    },
    description: "Root-level kernel breach controlling Sector 01 network buses. Blocks system extraction until purged."
  },
  sector2_boss: {
    id: "sector2_boss",
    name: "Polymorphic Warden",
    type: "Sector 02 Adaptive Rootkit // Signature Mutation Engine",
    hpRange: [115, 125],
    weakness: "firewall",
    resistance: "bruteForce",
    sprite: "assets/enemies/boss-sector2.svg",
    baseDamage: [20, 28],
    isBoss: true,
    special: {
      type: "signatureMutation",
      description: "Rewrites its vulnerability signature every round — exploited weaknesses are patched, and a new one opens elsewhere. Re-scan every round to keep up."
    },
    description: "A self-modifying rootkit that continuously rewrites its binary signature, closing yesterday's exploit as fast as it is discovered."
  }
};

if (typeof window !== "undefined") {
  window.CyberBosses = BOSSES;
}

