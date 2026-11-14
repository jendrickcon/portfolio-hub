/**
 * CYBER DEFENDER — Enemy Malware Archetype Specifications
 * Authoritative mechanics, health ranges, affinities, and special abilities.
 */

export const ENEMIES = {
  trojan: {
    id: "trojan",
    name: "Trojan Horse",
    type: "Stealth Exfiltration Payload",
    hpRange: [90, 115],
    weakness: "antivirus",
    resistance: "firewall",
    sprite: "assets/enemies/trojan-horse.svg",
    baseDamage: [18, 31],
    special: null,
    description: "Masquerades as benign system binaries while silently copying credential databases."
  },
  worm: {
    id: "worm",
    name: "Worm",
    type: "Self-Replicating Network Infiltrator",
    hpRange: [80, 105],
    weakness: "firewall",
    resistance: "sqlInject",
    sprite: "assets/enemies/worm.svg",
    baseDamage: [12, 22],
    special: {
      type: "selfHeal",
      chance: 0.20,
      healAmount: 15,
      description: "20% chance to replicate and heal +15 HP before attacking."
    },
    description: "Spreads autonomously across exposed service ports, multiplying exponentially."
  },
  spyware: {
    id: "spyware",
    name: "Spyware",
    type: "Persistent Surveillance Monitor",
    hpRange: [75, 100],
    weakness: "bruteForce",
    resistance: "antivirus",
    sprite: "assets/enemies/spyware.svg",
    baseDamage: [14, 22],
    special: {
      type: "flatLifesteal",
      chance: 0.60,
      minHeal: 5,
      maxHeal: 15,
      description: "60% chance to siphon 5-15 HP into self-repair."
    },
    description: "Hooks deeply into OS telemetry pipelines, sapping system resources."
  },
  adware: {
    id: "adware",
    name: "Adware",
    type: "Resource-Exhausting Spam Daemon",
    hpRange: [75, 100],
    weakness: "sqlInject",
    resistance: "bruteForce",
    sprite: "assets/enemies/adware.svg",
    baseDamage: [14, 24],
    special: {
      type: "turnSkip",
      chance: 0.30,
      description: "30% chance to flood user interface queues and skip the player's next turn."
    },
    description: "Overloads render buffers and process schedulers with rogue popups."
  }
};

if (typeof window !== "undefined") {
  window.CyberEnemies = ENEMIES;
}

