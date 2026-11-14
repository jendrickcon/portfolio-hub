/**
 * CYBER DEFENDER — Badges, Ranks, & Level Threshold Data
 */

export const RANKS = [
  { minLevel: 1,  maxLevel: 9,  title: "Script Kiddie",       code: "RANK_SK_01" },
  { minLevel: 10, maxLevel: 19, title: "System Analyst",      code: "RANK_SA_02" },
  { minLevel: 20, maxLevel: 29, title: "Cyber Specialist",    code: "RANK_CS_03" },
  { minLevel: 30, maxLevel: 30, title: "Incident Commander",  code: "RANK_IC_04" }
];

export const BADGES = [
  { id: "first_blood",       name: "First Blood",        desc: "Neutralize your first malicious process.",              icon: "🛡" },
  { id: "worm_hunter",       name: "Worm Hunter",        desc: "Neutralize 5 self-replicating Worms.",                  icon: "🐛" },
  { id: "spy_buster",        name: "Spy Buster",         desc: "Neutralize 5 persistent Spyware monitors.",             icon: "👁" },
  { id: "trojan_decimator",  name: "Trojan Decimator",   desc: "Neutralize 5 stealth Trojan Horse payloads.",           icon: "🐴" },
  { id: "ad_blocker",        name: "Ad Blocker",         desc: "Neutralize 5 resource-exhausting Adware daemons.",      icon: "🚫" },
  { id: "terminal_operator", name: "Terminal Operator",  desc: "Successfully synchronize Terminal A and Terminal B.",  icon: "💻" },
  { id: "overclocker",       name: "Overclocker",        desc: "Execute an attack with active Overclock charges.",      icon: "⚡" },
  { id: "pcb_sector_cleared",name: "PCB Sector Cleared", desc: "Attain Level 10 and secure the Sector 01 perimeter.",   icon: "💾" },
  { id: "sector1_cleared",   name: "Sector 1 Liberated", desc: "Neutralize the Rootkit Overseer guarding Sector 01 extraction.", icon: "👑" },
  { id: "sector2_cleared",   name: "Polymorph Purged",   desc: "Neutralize the Polymorphic Warden guarding Sector 02 extraction.", icon: "🧬" },
  { id: "hazard_survivor",   name: "Hazard Survivor",    desc: "Infiltrate and deploy onto Floor 02: Hazard Zone.",     icon: "☢" },
  { id: "hardcore_conqueror",name: "Overload Survivor",  desc: "Engage and survive threats in System Overload mode.",   icon: "🔥" },
  { id: "incident_commander",name: "Incident Commander", desc: "Attain Level 30 and achieve maximum security clearance.",icon: "🎖" }
];

export function getRankForLevel(level) {
  const rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank ? rank.title : "Script Kiddie";
}

export function getXpRequiredForLevel(level) {
  return level * 100;
}

if (typeof window !== "undefined") {
  window.CyberBadges = { RANKS, BADGES, getRankForLevel, getXpRequiredForLevel };
}

