/**
 * CYBER DEFENDER — Attack & Item Data Specifications
 * Authoritative values from original game proposal.
 */

export const ATTACKS = {
  firewall: {
    id: "firewall",
    name: "FIREWALL",
    code: "FW_BLOCK_01",
    subtext: "DEF + ATK",
    baseDamage: 15,
    description: "Deploys stateful packet filtering. Deals damage and establishes a barrier mitigating 25% of incoming attack.",
    flavor: "SYN/ACK sequence synchronized. Filtering unauthorized ingress traffic."
  },
  antivirus: {
    id: "antivirus",
    name: "ANTIVIRUS",
    code: "AV_HEURISTIC_SCAN",
    subtext: "HIGH DAMAGE",
    baseDamage: 20,
    description: "Executes deep cryptographic signature matching for heavy offensive payload delivery.",
    flavor: "Running heuristic behavioral inspection. Signature match confirmed."
  },
  sqlInject: {
    id: "sqlInject",
    name: "SQL INJECT",
    code: "DB_ESCAPE_DROP",
    subtext: "HIGH IMPACT",
    baseDamage: 25,
    description: "Exploits unescaped database buffers for heavy high-impact offensive payload injection.",
    flavor: "' OR '1'='1'; -- Unsanitized input buffer overflow executed."
  },
  bruteForce: {
    id: "bruteForce",
    name: "BRUTE FORCE",
    code: "SYS_OVERLOAD_AUTH",
    subtext: "RELIABLE",
    baseDamage: 18,
    variance: 0,
    description: "Floods command channels with high-entropy key permutations. Guaranteed reliable damage with zero variance.",
    flavor: "Spamming credential hashes across active memory sockets."
  }
};

export const PATCHES = [
  { id: "hotfix_alpha", name: "Patch: Security Hotfix", healMin: 20, healMax: 35, desc: "Quick-release kernel micro-patch." },
  { id: "hotfix_beta",  name: "Patch: Buffer Hardening", healMin: 25, healMax: 45, desc: "Mitigates stack exhaustion and restores core integrity." },
  { id: "hotfix_delta", name: "Patch: Memory Defrag", healMin: 30, healMax: 55, desc: "Flushes infected memory segments and recovers resources." }
];

export const COMBAT_CONSTANTS = {
  WEAKNESS_MULTIPLIER: 1.5,
  RESISTANCE_MULTIPLIER: 0.5,
  OVERCLOCK_MULTIPLIER: 1.35,
  RUN_SUCCESS_CHANCE: 0.50,
  VICTORY_SYSTEM_HP_BONUS: 12,
  FLOOR1_SYSTEM_DAMAGE_RATIO: 0.25,
  FLOOR2_SYSTEM_DAMAGE_RATIO: 0.65
};

if (typeof window !== "undefined") {
  window.CyberAttacks = { ATTACKS, PATCHES, COMBAT_CONSTANTS };
}

