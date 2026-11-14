/**
 * DEVPATH // GAME DOMAIN KNOWLEDGE
 * ------------------------------------------------------------------
 * The proof case: GAME → ROGUELIKE → DUNGEON → ROOMS → MONSTERS →
 * BOSS FIGHTS → PROGRESSION, plus survival / FPS / RPG / platformer /
 * puzzle / strategy / horror branches that converge on shared systems.
 *
 * Authoring rules followed here:
 *   - A seed describes WHAT the project is or does, not how it's built.
 *   - `unlocks` declares what becomes available next.
 *   - Shared branches live in SHARED_GAME_SEEDS and are referenced by
 *     string id, so multiplayer isn't duplicated per genre.
 *   - Technical seeds appear deep in a branch, after the product
 *     decisions that actually imply them.
 * ------------------------------------------------------------------
 */

import { NODE_KINDS } from "./nodeTypes.js";

/* ══════════════════════════════════════════
   SHARED SEEDS — declared once, referenced everywhere.
   ══════════════════════════════════════════ */
export const SHARED_GAME_SEEDS = [
  /* ── Game modes (converge from any genre) ── */
  {
    id: "game-mode",
    kind: NODE_KINDS.CONCEPT,
    title: "Game Mode",
    category: "MODE",
    tagline: "Who plays, and with whom",
    description: "Decide player composition before designing systems that depend on it.",
    iconId: "interactive",
    unlocks: ["mode-singleplayer", "mode-multiplayer"]
  },
  {
    id: "mode-singleplayer",
    kind: NODE_KINDS.CONCEPT,
    title: "Single Player",
    category: "MODE",
    tagline: "Solo experience",
    description: "One player, self-paced. No network or synchronisation concerns.",
    iconId: "adventure",
    unlocks: ["save-system", "difficulty-model"]
  },
  {
    id: "mode-multiplayer",
    kind: NODE_KINDS.CONCEPT,
    title: "Multiplayer",
    category: "MODE",
    tagline: "Networked play",
    description: "Two or more players sharing a session — introduces sync, authority and latency.",
    iconId: "interactive",
    unlocks: ["mp-topology", "player-sync"]
  },
  {
    id: "mp-topology",
    kind: NODE_KINDS.CONCEPT,
    title: "Multiplayer Topology",
    tagline: "How sessions are hosted",
    iconId: "system",
    unlocks: ["mp-coop", "mp-versus", "mp-dedicated"]
  },
  {
    id: "mp-coop",
    kind: NODE_KINDS.FEATURE,
    group: "multiplayer-topology",
    title: "Co-op",
    tagline: "Players vs. the game",
    description: "Shared objectives and cooperative progression.",
    iconId: "interactive",
    unlocks: ["player-sync", "shared-inventory"]
  },
  {
    id: "mp-versus",
    kind: NODE_KINDS.FEATURE,
    group: "multiplayer-topology",
    title: "Versus / PvP",
    tagline: "Players vs. players",
    description: "Competitive rounds, matchmaking and balance.",
    iconId: "fighting",
    unlocks: ["player-sync", "matchmaking", "rounds-system"]
  },
  {
    id: "mp-dedicated",
    kind: NODE_KINDS.FEATURE,
    group: "multiplayer-topology",
    title: "Dedicated Servers",
    tagline: "Authoritative hosting",
    description: "Server-authoritative simulation with client prediction.",
    iconId: "cloud",
    unlocks: ["player-sync", "server-authority"]
  },
  {
    id: "player-sync",
    kind: NODE_KINDS.SYSTEM,
    title: "Player Sync",
    tagline: "Keeping clients consistent",
    description: "State replication, interpolation and reconciliation across clients.",
    iconId: "automation",
    unlocks: ["netcode-model", "latency-handling"]
  },
  {
    id: "shared-inventory",
    kind: NODE_KINDS.SYSTEM,
    title: "Shared Inventory",
    tagline: "Common pool of items",
    iconId: "rpg"
  },
  {
    id: "matchmaking",
    kind: NODE_KINDS.SYSTEM,
    title: "Matchmaking",
    tagline: "Pairing players by skill",
    iconId: "analytics"
  },
  {
    id: "rounds-system",
    kind: NODE_KINDS.SYSTEM,
    title: "Rounds & Scoring",
    tagline: "Match structure",
    iconId: "strategy",
    unlocks: ["scoreboard", "round-end-conditions"]
  },
  {
    id: "scoreboard",
    kind: NODE_KINDS.FEATURE,
    title: "Scoreboard",
    tagline: "Live standings",
    iconId: "analytics"
  },
  {
    id: "round-end-conditions",
    kind: NODE_KINDS.RULE,
    title: "Round End Conditions",
    tagline: "When a round stops",
    iconId: "rule"
  },
  {
    id: "server-authority",
    kind: NODE_KINDS.SYSTEM,
    title: "Server Authority",
    tagline: "Anti-cheat and validation",
    iconId: "security"
  },
  {
    id: "netcode-model",
    kind: NODE_KINDS.TECHNOLOGY,
    title: "Netcode Model",
    category: "TECHNIQUE",
    tagline: "Synchronisation strategy",
    description: "Lockstep, rollback, or client-server state replication.",
    technical: true,
    iconId: "automation",
    unlocks: ["netcode-rollback", "netcode-cs", "netcode-lockstep"]
  },
  {
    id: "netcode-rollback",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "netcode-model",
    title: "Rollback",
    tagline: "Predictive rewind",
    technical: true,
    iconId: "automation"
  },
  {
    id: "netcode-cs",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "netcode-model",
    title: "Client-Server",
    tagline: "Authoritative server state",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "netcode-lockstep",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "netcode-model",
    title: "Lockstep",
    tagline: "Deterministic tick sync",
    technical: true,
    iconId: "system"
  },
  {
    id: "latency-handling",
    kind: NODE_KINDS.SYSTEM,
    title: "Latency Handling",
    tagline: "Interpolation and prediction",
    technical: true,
    iconId: "automation"
  },

  /* ── Cross-genre systems ── */
  {
    id: "save-system",
    kind: NODE_KINDS.SYSTEM,
    title: "Save System",
    category: "SYSTEM",
    tagline: "Persisting player progress",
    description: "How progress survives between sessions.",
    iconId: "database",
    unlocks: ["save-model", "save-storage"]
  },
  {
    id: "save-model",
    kind: NODE_KINDS.RULE,
    title: "Save Model",
    tagline: "What gets persisted",
    iconId: "rule",
    unlocks: ["save-manual", "save-autosave", "save-permadeath"]
  },
  {
    id: "save-manual",
    kind: NODE_KINDS.FEATURE,
    group: "save-model",
    title: "Manual Save",
    tagline: "Player-controlled checkpoints",
    iconId: "database"
  },
  {
    id: "save-autosave",
    kind: NODE_KINDS.FEATURE,
    group: "save-model",
    title: "Autosave",
    tagline: "Continuous checkpointing",
    iconId: "automation"
  },
  {
    id: "save-permadeath",
    kind: NODE_KINDS.RULE,
    group: "save-model",
    title: "Permadeath",
    tagline: "Progress is lost on death",
    description: "The defining constraint of true roguelikes.",
    iconId: "rule",
    unlocks: ["meta-progression"]
  },
  {
    id: "save-storage",
    kind: NODE_KINDS.DATA,
    title: "Save Storage",
    tagline: "Where save data lives",
    iconId: "database",
    unlocks: ["save-local", "save-cloud"]
  },
  {
    id: "save-local",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "save-storage",
    title: "Local Save File",
    tagline: "On-device persistence",
    technical: true,
    iconId: "database"
  },
  {
    id: "save-cloud",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "save-storage",
    title: "Cloud Save",
    tagline: "Account-synced progress",
    technical: true,
    iconId: "cloud",
    unlocks: ["steam-cloud", "custom-save-api"]
  },
  {
    id: "steam-cloud",
    kind: NODE_KINDS.SERVICE,
    title: "Steam Cloud",
    tagline: "Platform-managed saves",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "custom-save-api",
    kind: NODE_KINDS.SERVICE,
    title: "Custom Save API",
    tagline: "Self-hosted save backend",
    technical: true,
    iconId: "backend"
  },
  {
    id: "difficulty-model",
    kind: NODE_KINDS.SYSTEM,
    title: "Difficulty Model",
    tagline: "How challenge scales",
    iconId: "strategy",
    unlocks: ["difficulty-fixed", "difficulty-dynamic", "difficulty-selectable"]
  },
  {
    id: "difficulty-fixed",
    kind: NODE_KINDS.RULE,
    group: "difficulty-model",
    title: "Fixed Difficulty",
    tagline: "One tuned experience",
    iconId: "rule"
  },
  {
    id: "difficulty-dynamic",
    kind: NODE_KINDS.RULE,
    group: "difficulty-model",
    title: "Dynamic Difficulty",
    tagline: "Adapts to player skill",
    iconId: "automation"
  },
  {
    id: "difficulty-selectable",
    kind: NODE_KINDS.FEATURE,
    group: "difficulty-model",
    title: "Selectable Difficulty",
    tagline: "Player-chosen challenge",
    iconId: "interactive"
  },
  {
    id: "telemetry",
    kind: NODE_KINDS.SYSTEM,
    title: "Telemetry",
    tagline: "Understanding player behaviour",
    iconId: "analytics",
    unlocks: ["telemetry-events", "telemetry-analytics"]
  },
  {
    id: "telemetry-events",
    kind: NODE_KINDS.DATA,
    title: "Event Tracking",
    tagline: "Gameplay event capture",
    iconId: "analytics"
  },
  {
    id: "telemetry-analytics",
    kind: NODE_KINDS.SERVICE,
    title: "Analytics Backend",
    tagline: "Aggregation and dashboards",
    technical: true,
    iconId: "analytics"
  },

  /* ── Shared technical tail (reachable, never forced) ── */
  {
    id: "game-persistence",
    kind: NODE_KINDS.ARCHITECTURE,
    title: "Persistence Layer",
    tagline: "Where player state is stored",
    technical: true,
    iconId: "database",
    unlocks: ["persist-sqlite", "persist-postgres", "persist-firebase", "persist-json"]
  },
  {
    id: "persist-sqlite",
    kind: NODE_KINDS.DATABASE,
    group: "persistence",
    title: "SQLite",
    tagline: "Embedded local database",
    description: "Zero-config and file-based. Ideal for single-player desktop saves.",
    technical: true,
    iconId: "database"
  },
  {
    id: "persist-postgres",
    kind: NODE_KINDS.DATABASE,
    group: "persistence",
    title: "PostgreSQL",
    tagline: "Relational server database",
    description: "For shared or authoritative state across many players.",
    technical: true,
    iconId: "database"
  },
  {
    id: "persist-firebase",
    kind: NODE_KINDS.SERVICE,
    group: "persistence",
    title: "Firebase",
    tagline: "Managed realtime datastore",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "persist-json",
    kind: NODE_KINDS.DATA,
    group: "persistence",
    title: "JSON Files",
    tagline: "Plain-file persistence",
    technical: true,
    iconId: "database"
  },
  {
    id: "game-build-pipeline",
    kind: NODE_KINDS.INFRASTRUCTURE,
    title: "Build Pipeline",
    tagline: "Automated game builds",
    technical: true,
    iconId: "automation",
    unlocks: ["ci-github-actions", "ci-butler", "ci-matrix"]
  },
  {
    id: "ci-github-actions",
    kind: NODE_KINDS.INFRASTRUCTURE,
    group: "build-ci",
    title: "GitHub Actions",
    tagline: "CI on every commit",
    technical: true,
    iconId: "automation"
  },
  {
    id: "ci-butler",
    kind: NODE_KINDS.INFRASTRUCTURE,
    group: "build-ci",
    title: "Butler",
    tagline: "itch.io automated uploads",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "ci-matrix",
    kind: NODE_KINDS.INFRASTRUCTURE,
    group: "build-ci",
    title: "Multi-platform Matrix",
    tagline: "Parallel OS builds",
    technical: true,
    iconId: "automation"
  }
];

/* ══════════════════════════════════════════
   GAME ROOTS — entry domains offered once GAME is chosen.
   ══════════════════════════════════════════ */
export const GAME_ROOTS = [
  {
    id: "genre-roguelike",
    kind: NODE_KINDS.GENRE,
    title: "Roguelike",
    category: "GENRE",
    tagline: "Procedural runs, permanent death",
    description: "Randomised runs, escalating challenge, and loss that matters.",
    iconId: "rpg",
    unlocks: [
      "rl-dungeon",
      "rl-combat",
      "rl-loot",
      "rl-items",
      "game-mode",
      "save-system",
      "game-persistence",
      "telemetry"
    ]
  },
  {
    id: "genre-survival",
    kind: NODE_KINDS.GENRE,
    title: "Survival",
    category: "GENRE",
    tagline: "Scarcity, exposure, persistence",
    description: "The world is hostile and resources are finite.",
    iconId: "simulation",
    unlocks: [
      "sv-world",
      "sv-needs",
      "sv-crafting",
      "sv-building",
      "sv-resources",
      "sv-hostile",
      "sv-weapons",
      "game-mode",
      "save-system",
      "game-persistence",
      "telemetry"
    ]
  },
  {
    id: "genre-fps",
    kind: NODE_KINDS.GENRE,
    title: "Shooter / FPS",
    category: "GENRE",
    tagline: "Aim, movement, encounters",
    description: "First-person combat as the core verb.",
    iconId: "action",
    unlocks: [
      "fps-weapons",
      "fps-movement",
      "fps-enemies",
      "fps-maps",
      "game-mode",
      "telemetry"
    ]
  },
  {
    id: "genre-rpg",
    kind: NODE_KINDS.GENRE,
    title: "RPG",
    category: "GENRE",
    tagline: "Growth, story, character",
    description: "Progression and narrative as the spine of the experience.",
    iconId: "rpg",
    unlocks: [
      "rpg-progression",
      "rpg-quests",
      "rpg-dialogue",
      "rpg-inventory",
      "game-mode",
      "save-system",
      "game-persistence"
    ]
  },
  {
    id: "genre-platformer",
    kind: NODE_KINDS.GENRE,
    title: "Platformer",
    category: "GENRE",
    tagline: "Movement mastery",
    description: "Traversal precision as the core skill.",
    iconId: "action",
    unlocks: ["pl-movement", "pl-levels", "pl-hazards", "game-mode", "save-system"]
  },
  {
    id: "genre-puzzle",
    kind: NODE_KINDS.GENRE,
    title: "Puzzle",
    category: "GENRE",
    tagline: "Deduction and insight",
    description: "Problem-solving as the primary interaction.",
    iconId: "puzzle",
    unlocks: ["pz-structure", "pz-mechanics", "pz-hints", "save-system"]
  },
  {
    id: "genre-strategy",
    kind: NODE_KINDS.GENRE,
    title: "Strategy",
    category: "GENRE",
    tagline: "Planning and systems mastery",
    description: "Decisions compound over long horizons.",
    iconId: "strategy",
    unlocks: ["st-scope", "st-economy", "st-units", "st-ai", "game-mode", "save-system"]
  },
  {
    id: "genre-horror",
    kind: NODE_KINDS.GENRE,
    title: "Horror",
    category: "GENRE",
    tagline: "Tension and dread",
    description: "Fear engineered through scarcity, sound and pursuit.",
    iconId: "adventure",
    unlocks: ["hr-tension", "hr-audio", "save-system"]
  },
  {
    id: "genre-sandbox",
    kind: NODE_KINDS.GENRE,
    title: "Sandbox / Creative",
    category: "GENRE",
    tagline: "Player-authored goals",
    description: "Tools and freedom instead of prescribed objectives.",
    iconId: "system",
    unlocks: ["sb-tools", "sb-world", "sb-sharing", "game-mode", "save-system"]
  },
  {
    id: "genre-simulation",
    kind: NODE_KINDS.GENRE,
    title: "Simulation",
    category: "GENRE",
    tagline: "Systemic realism",
    description: "Interlocking systems producing emergent outcomes.",
    iconId: "simulation",
    unlocks: ["sim-systems", "sim-economy", "sim-ai-agents", "save-system", "telemetry"]
  }
];

/* ══════════════════════════════════════════
   ROGUELIKE BRANCH — the primary proof case.
   GAME → ROGUELIKE → DUNGEON → ROOMS → MONSTERS → BOSS → PROGRESSION
   ══════════════════════════════════════════ */
export const ROGUELIKE_SEEDS = [
  {
    id: "rl-dungeon",
    kind: NODE_KINDS.CONCEPT,
    title: "Dungeon Exploration",
    category: "STRUCTURE",
    tagline: "Descent as the core loop",
    description: "Progress is measured in depth. The dungeon is the game.",
    iconId: "adventure",
    unlocks: ["rl-rooms", "rl-floor-structure", "rl-traversal"]
  },
  {
    id: "rl-rooms",
    kind: NODE_KINDS.CONTENT,
    title: "Rooms",
    category: "CONTENT",
    tagline: "The atomic unit of the dungeon",
    description: "Discrete spaces that host encounters, loot and secrets.",
    iconId: "system",
    unlocks: ["rl-room-gen", "rl-room-types", "rl-connections"]
  },
  {
    id: "rl-room-gen",
    kind: NODE_KINDS.SYSTEM,
    title: "Room Generation",
    category: "GENERATION",
    tagline: "How rooms are produced",
    iconId: "automation",
    unlocks: ["rl-gen-random", "rl-gen-authored", "rl-gen-hybrid"]
  },
  {
    id: "rl-gen-random",
    kind: NODE_KINDS.SYSTEM,
    group: "room-gen-method",
    title: "Procedural Generation",
    tagline: "Algorithmically assembled",
    description: "Rooms built by an algorithm each run — infinite variety, variable quality.",
    iconId: "automation",
    unlocks: ["rl-gen-algorithm"]
  },
  {
    id: "rl-gen-algorithm",
    kind: NODE_KINDS.TECHNOLOGY,
    title: "Generation Algorithm",
    category: "TECHNIQUE",
    tagline: "The method used to carve space",
    technical: true,
    iconId: "automation",
    unlocks: ["gen-bsp", "gen-cellular", "gen-graph", "gen-wfc"]
  },
  {
    id: "gen-bsp",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "gen-algorithm",
    title: "BSP Partitioning",
    tagline: "Recursive space splitting",
    description: "Split the map, place a room in each leaf, connect siblings.",
    technical: true,
    iconId: "system"
  },
  {
    id: "gen-cellular",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "gen-algorithm",
    title: "Cellular Automata",
    tagline: "Emergent cave systems",
    description: "Random noise smoothed into organic caverns.",
    technical: true,
    iconId: "system"
  },
  {
    id: "gen-graph",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "gen-algorithm",
    title: "Graph-Based",
    tagline: "Rooms as nodes, corridors as edges",
    description: "Guarantees connectivity and controllable pacing.",
    technical: true,
    iconId: "system"
  },
  {
    id: "gen-wfc",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "gen-algorithm",
    title: "Wave Function Collapse",
    tagline: "Constraint-based assembly",
    description: "Tiles chosen by adjacency rules — coherent but harder to control.",
    technical: true,
    iconId: "system"
  },
  {
    id: "rl-gen-authored",
    kind: NODE_KINDS.SYSTEM,
    group: "room-gen-method",
    title: "Hand-Authored Rooms",
    tagline: "Designed, then shuffled",
    description: "Quality guaranteed; variety limited by authoring budget.",
    iconId: "interactive"
  },
  {
    id: "rl-gen-hybrid",
    kind: NODE_KINDS.SYSTEM,
    group: "room-gen-method",
    title: "Hybrid Generation",
    tagline: "Authored rooms, procedural layout",
    description: "Hand-crafted content placed by an algorithm — the common compromise.",
    iconId: "system",
    unlocks: ["gen-graph", "gen-bsp"]
  },
  {
    id: "rl-room-types",
    kind: NODE_KINDS.CONTENT,
    title: "Room Types",
    tagline: "What a room can be",
    iconId: "system",
    unlocks: ["room-combat", "room-treasure", "room-shop", "room-rest", "room-boss", "room-secret", "room-puzzle"]
  },
  {
    id: "room-combat",
    kind: NODE_KINDS.CONTENT,
    title: "Combat Room",
    tagline: "Enemies must be cleared",
    iconId: "fighting",
    unlocks: ["rl-monsters"]
  },
  {
    id: "room-treasure",
    kind: NODE_KINDS.CONTENT,
    title: "Treasure Room",
    tagline: "Reward for risk",
    iconId: "rpg",
    unlocks: ["rl-loot"]
  },
  {
    id: "room-shop",
    kind: NODE_KINDS.CONTENT,
    title: "Shop",
    tagline: "Spend between fights",
    iconId: "productivity",
    unlocks: ["rl-currency", "shop-stock"]
  },
  {
    id: "room-rest",
    kind: NODE_KINDS.CONTENT,
    title: "Rest / Safe Room",
    tagline: "Recover and prepare",
    iconId: "productivity"
  },
  {
    id: "room-boss",
    kind: NODE_KINDS.CONTENT,
    title: "Boss Room",
    tagline: "Floor climax",
    iconId: "fighting",
    unlocks: ["rl-boss"]
  },
  {
    id: "room-secret",
    kind: NODE_KINDS.CONTENT,
    title: "Secret Room",
    tagline: "Reward for exploration",
    iconId: "puzzle"
  },
  {
    id: "room-puzzle",
    kind: NODE_KINDS.CONTENT,
    title: "Puzzle Room",
    tagline: "Reasoning gate",
    iconId: "puzzle"
  },
  {
    id: "rl-connections",
    kind: NODE_KINDS.RULE,
    title: "Room Connections",
    tagline: "How spaces link",
    description: "Corridors, doors, keys and locks define the critical path.",
    iconId: "rule",
    unlocks: ["conn-corridors", "conn-doors", "conn-keys", "conn-teleports"]
  },
  {
    id: "conn-corridors",
    kind: NODE_KINDS.RULE,
    group: "room-connections",
    title: "Corridors",
    tagline: "Simple adjacency",
    iconId: "rule"
  },
  {
    id: "conn-doors",
    kind: NODE_KINDS.RULE,
    group: "room-connections",
    title: "Doors",
    tagline: "Gated transitions",
    iconId: "rule"
  },
  {
    id: "conn-keys",
    kind: NODE_KINDS.MECHANIC,
    group: "room-connections",
    title: "Keys & Locks",
    tagline: "Progression gating",
    description: "Locked routes force exploration and create sequence.",
    iconId: "puzzle"
  },
  {
    id: "conn-teleports",
    kind: NODE_KINDS.MECHANIC,
    group: "room-connections",
    title: "Teleports / Shortcuts",
    tagline: "Non-linear movement",
    iconId: "automation"
  },
  {
    id: "rl-floor-structure",
    kind: NODE_KINDS.SYSTEM,
    title: "Floor Structure",
    tagline: "How depth escalates",
    iconId: "strategy",
    unlocks: ["floor-linear", "floor-branching", "floor-endless"]
  },
  {
    id: "floor-linear",
    kind: NODE_KINDS.RULE,
    group: "floor-structure",
    title: "Linear Descent",
    tagline: "Floor after floor",
    iconId: "rule"
  },
  {
    id: "floor-branching",
    kind: NODE_KINDS.RULE,
    group: "floor-structure",
    title: "Branching Path",
    tagline: "Choose your route",
    description: "Slay-the-Spire style map with visible consequences.",
    iconId: "strategy"
  },
  {
    id: "floor-endless",
    kind: NODE_KINDS.RULE,
    group: "floor-structure",
    title: "Endless Scaling",
    tagline: "Difficulty without end",
    iconId: "analytics"
  },
  {
    id: "rl-traversal",
    kind: NODE_KINDS.MECHANIC,
    title: "Traversal",
    tagline: "How the player moves",
    iconId: "action",
    unlocks: ["trav-grid", "trav-realtime", "trav-turnbased"]
  },
  {
    id: "trav-grid",
    kind: NODE_KINDS.MECHANIC,
    group: "traversal-model",
    title: "Grid-Based",
    tagline: "Tile-stepped movement",
    description: "Classic roguelike movement — every step is a decision.",
    iconId: "strategy"
  },
  {
    id: "trav-realtime",
    kind: NODE_KINDS.MECHANIC,
    group: "traversal-model",
    title: "Real-Time",
    tagline: "Continuous movement",
    description: "Action-roguelike feel — less deliberation, more reflex.",
    iconId: "action"
  },
  {
    id: "trav-turnbased",
    kind: NODE_KINDS.MECHANIC,
    group: "traversal-model",
    title: "Turn-Based",
    tagline: "Discrete turns",
    description: "The world waits. Tactical depth over execution speed.",
    iconId: "strategy"
  },
  {
    id: "rl-monsters",
    kind: NODE_KINDS.ENTITY,
    title: "Monsters",
    category: "ENTITY",
    tagline: "The opposition",
    description: "Enemy design drives the entire combat and difficulty curve.",
    iconId: "fighting",
    unlocks: ["monster-archetypes", "monster-ai", "monster-scaling", "monster-spawning"]
  },
  {
    id: "monster-archetypes",
    kind: NODE_KINDS.ENTITY,
    title: "Enemy Archetypes",
    tagline: "Roles enemies fill",
    iconId: "fighting",
    unlocks: ["arch-melee", "arch-ranged", "arch-caster", "arch-tank", "arch-swarm", "arch-elite"]
  },
  {
    id: "arch-melee",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Melee Brute",
    tagline: "Closes distance, hits hard",
    iconId: "fighting"
  },
  {
    id: "arch-ranged",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Ranged Attacker",
    tagline: "Punishes standing still",
    iconId: "fighting"
  },
  {
    id: "arch-caster",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Caster",
    tagline: "Area denial and debuffs",
    iconId: "rpg"
  },
  {
    id: "arch-tank",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Armoured Tank",
    tagline: "Forces target priority",
    iconId: "fighting"
  },
  {
    id: "arch-swarm",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Swarm",
    tagline: "Volume over individual strength",
    iconId: "fighting"
  },
  {
    id: "arch-elite",
    kind: NODE_KINDS.ENTITY,
    group: "arch-model",
    title: "Elite Variant",
    tagline: "Buffed, modified regulars",
    iconId: "fighting"
  },
  {
    id: "monster-ai",
    kind: NODE_KINDS.SYSTEM,
    title: "Enemy AI",
    tagline: "How enemies decide",
    iconId: "automation",
    unlocks: ["ai-fsm", "ai-behavior-tree", "ai-utility", "ai-goap"]
  },
  {
    id: "ai-fsm",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "enemy-ai",
    title: "Finite State Machine",
    tagline: "States and transitions",
    description: "Simple, predictable and easy to debug. Fine for most enemies.",
    technical: true,
    iconId: "system"
  },
  {
    id: "ai-behavior-tree",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "enemy-ai",
    title: "Behaviour Tree",
    tagline: "Composable decision nodes",
    description: "Scales to complex, readable enemy logic.",
    technical: true,
    iconId: "system"
  },
  {
    id: "ai-utility",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "enemy-ai",
    title: "Utility AI",
    tagline: "Scored action selection",
    description: "Emergent and tunable — harder to predict.",
    technical: true,
    iconId: "analytics"
  },
  {
    id: "ai-goap",
    kind: NODE_KINDS.TECHNOLOGY,
    group: "enemy-ai",
    title: "GOAP Planner",
    tagline: "Goal-oriented action planning",
    description: "Enemies plan multi-step. Powerful, costly to author.",
    technical: true,
    iconId: "automation"
  },
  {
    id: "monster-scaling",
    kind: NODE_KINDS.RULE,
    title: "Enemy Scaling",
    tagline: "Difficulty by depth",
    iconId: "analytics",
    unlocks: ["scale-static", "scale-depth", "scale-player-level"]
  },
  {
    id: "scale-static",
    kind: NODE_KINDS.RULE,
    group: "enemy-scaling",
    title: "Static Stats",
    tagline: "Fixed per enemy type",
    iconId: "rule"
  },
  {
    id: "scale-depth",
    kind: NODE_KINDS.RULE,
    group: "enemy-scaling",
    title: "Depth-Scaled",
    tagline: "Stronger the deeper you go",
    iconId: "analytics"
  },
  {
    id: "scale-player-level",
    kind: NODE_KINDS.RULE,
    group: "enemy-scaling",
    title: "Player-Scaled",
    tagline: "Matches player power",
    description: "Keeps tension but can feel like it punishes growth.",
    iconId: "analytics"
  },
  {
    id: "monster-spawning",
    kind: NODE_KINDS.SYSTEM,
    title: "Spawning",
    tagline: "Where and when enemies appear",
    iconId: "automation",
    unlocks: ["spawn-budget", "spawn-waves", "spawn-triggered"]
  },
  {
    id: "spawn-budget",
    kind: NODE_KINDS.RULE,
    group: "spawn-model",
    title: "Encounter Budget",
    tagline: "Difficulty points per room",
    iconId: "rule"
  },
  {
    id: "spawn-waves",
    kind: NODE_KINDS.RULE,
    group: "spawn-model",
    title: "Waves",
    tagline: "Sequenced arrivals",
    iconId: "system"
  },
  {
    id: "spawn-triggered",
    kind: NODE_KINDS.RULE,
    group: "spawn-model",
    title: "Triggered Spawns",
    tagline: "Event-driven ambushes",
    iconId: "automation"
  },
  {
    id: "rl-boss",
    kind: NODE_KINDS.FEATURE,
    title: "Boss Fights",
    category: "FEATURE",
    tagline: "Skill checks and spectacle",
    description: "Floor climaxes that test everything learned so far.",
    iconId: "fighting",
    unlocks: ["boss-phases", "boss-patterns", "boss-arena", "boss-rewards", "rl-progression", "game-build-pipeline"]
  },
  {
    id: "boss-phases",
    kind: NODE_KINDS.MECHANIC,
    title: "Multi-Phase Boss",
    tagline: "Behaviour shifts at HP thresholds",
    iconId: "fighting"
  },
  {
    id: "boss-patterns",
    kind: NODE_KINDS.MECHANIC,
    title: "Attack Patterns",
    tagline: "Telegraphed, learnable moves",
    description: "Fairness comes from telegraphing, not from being easy.",
    iconId: "rule"
  },
  {
    id: "boss-arena",
    kind: NODE_KINDS.CONTENT,
    title: "Boss Arena",
    tagline: "Purpose-built space",
    iconId: "system"
  },
  {
    id: "boss-rewards",
    kind: NODE_KINDS.FEATURE,
    title: "Boss Rewards",
    tagline: "Unique drops and unlocks",
    iconId: "rpg"
  },
  {
    id: "rl-combat",
    kind: NODE_KINDS.MECHANIC,
    title: "Combat",
    category: "MECHANIC",
    tagline: "How conflict resolves",
    iconId: "fighting",
    unlocks: ["combat-turnbased", "combat-realtime", "combat-tactical"]
  },
  {
    id: "combat-turnbased",
    kind: NODE_KINDS.MECHANIC,
    group: "combat-model",
    title: "Turn-Based Combat",
    tagline: "Ordered and deliberate",
    iconId: "strategy",
    unlocks: ["combat-initiative", "combat-actions", "combat-status", "rl-health"]
  },
  {
    id: "combat-realtime",
    kind: NODE_KINDS.MECHANIC,
    group: "combat-model",
    title: "Real-Time Combat",
    tagline: "Reflex-driven",
    iconId: "action",
    unlocks: ["combat-hitboxes", "combat-iframe", "rl-health"]
  },
  {
    id: "combat-tactical",
    kind: NODE_KINDS.MECHANIC,
    group: "combat-model",
    title: "Tactical / Positional",
    tagline: "Space matters",
    iconId: "strategy",
    unlocks: ["combat-cover", "combat-flanking", "combat-initiative", "rl-health"]
  },
  {
    id: "combat-initiative",
    kind: NODE_KINDS.RULE,
    title: "Initiative Order",
    tagline: "Who acts when",
    iconId: "rule"
  },
  {
    id: "combat-actions",
    kind: NODE_KINDS.RULE,
    title: "Action Economy",
    tagline: "What you can do per turn",
    iconId: "rule"
  },
  {
    id: "combat-status",
    kind: NODE_KINDS.SYSTEM,
    title: "Status Effects",
    tagline: "Buffs, debuffs, damage over time",
    iconId: "system"
  },
  {
    id: "combat-hitboxes",
    kind: NODE_KINDS.SYSTEM,
    title: "Hitboxes & Frames",
    tagline: "Precise collision and timing",
    technical: true,
    iconId: "system"
  },
  {
    id: "combat-iframe",
    kind: NODE_KINDS.RULE,
    title: "Invulnerability Frames",
    tagline: "Brief mercy after a hit",
    iconId: "rule"
  },
  {
    id: "combat-cover",
    kind: NODE_KINDS.RULE,
    title: "Cover System",
    tagline: "Line of sight and protection",
    iconId: "system"
  },
  {
    id: "combat-flanking",
    kind: NODE_KINDS.RULE,
    title: "Flanking",
    tagline: "Positional advantage",
    iconId: "strategy"
  },
  {
    id: "rl-health",
    kind: NODE_KINDS.SYSTEM,
    title: "Health System",
    category: "SYSTEM",
    tagline: "How damage and recovery work",
    iconId: "system",
    unlocks: ["health-hp", "health-hearts", "health-limb", "health-regen"]
  },
  {
    id: "health-hp",
    kind: NODE_KINDS.RULE,
    group: "health-model",
    title: "Hit Points",
    tagline: "Numeric pool",
    iconId: "rule"
  },
  {
    id: "health-hearts",
    kind: NODE_KINDS.RULE,
    group: "health-model",
    title: "Discrete Hearts",
    tagline: "Small countable units",
    iconId: "rule"
  },
  {
    id: "health-limb",
    kind: NODE_KINDS.RULE,
    group: "health-model",
    title: "Limb / Part Damage",
    tagline: "Location-based injury",
    iconId: "system"
  },
  {
    id: "health-regen",
    kind: NODE_KINDS.RULE,
    group: "health-model",
    title: "Regeneration",
    tagline: "Recovery over time",
    iconId: "automation"
  },
  {
    id: "rl-loot",
    kind: NODE_KINDS.FEATURE,
    title: "Loot",
    category: "FEATURE",
    tagline: "Reward distribution",
    iconId: "rpg",
    unlocks: ["loot-tables", "loot-rarity", "loot-currency", "loot-drops"]
  },
  {
    id: "loot-currency",
    kind: NODE_KINDS.SYSTEM,
    title: "Loot Currency",
    tagline: "Money found in the world",
    iconId: "productivity",
    unlocks: ["rl-currency"]
  },
  {
    id: "loot-tables",
    kind: NODE_KINDS.DATA,
    title: "Loot Tables",
    tagline: "Weighted reward pools",
    description: "The single most-tuned data structure in most roguelikes.",
    iconId: "database"
  },
  {
    id: "loot-rarity",
    kind: NODE_KINDS.RULE,
    title: "Rarity Tiers",
    tagline: "Common to legendary",
    iconId: "rpg"
  },
  {
    id: "loot-drops",
    kind: NODE_KINDS.RULE,
    title: "Drop Rates",
    tagline: "Probability per enemy",
    iconId: "analytics"
  },
  {
    id: "rl-currency",
    kind: NODE_KINDS.SYSTEM,
    title: "Currency",
    tagline: "What money buys",
    iconId: "productivity"
  },
  {
    id: "shop-stock",
    kind: NODE_KINDS.DATA,
    title: "Shop Inventory",
    tagline: "Stock and pricing",
    iconId: "database"
  },
  {
    id: "rl-items",
    kind: NODE_KINDS.ENTITY,
    title: "Items",
    category: "ENTITY",
    tagline: "Things the player carries",
    iconId: "rpg",
    unlocks: ["item-consumable", "item-equipment", "item-relic", "item-inventory"]
  },
  {
    id: "item-consumable",
    kind: NODE_KINDS.ENTITY,
    group: "item-model",
    title: "Consumables",
    tagline: "Single-use effects",
    iconId: "rpg"
  },
  {
    id: "item-equipment",
    kind: NODE_KINDS.ENTITY,
    group: "item-model",
    title: "Equipment",
    tagline: "Persistent stat modifiers",
    iconId: "rpg"
  },
  {
    id: "item-relic",
    kind: NODE_KINDS.ENTITY,
    group: "item-model",
    title: "Relics / Passives",
    tagline: "Run-defining modifiers",
    description: "The build-defining choices that make runs feel distinct.",
    iconId: "rpg"
  },
  {
    id: "item-inventory",
    kind: NODE_KINDS.SYSTEM,
    group: "item-model",
    title: "Inventory",
    tagline: "Carrying and managing",
    iconId: "system",
    unlocks: ["inv-slots", "inv-weight", "inv-grid"]
  },
  {
    id: "inv-slots",
    kind: NODE_KINDS.RULE,
    group: "inv-model",
    title: "Slot-Based",
    tagline: "Fixed capacity",
    iconId: "rule"
  },
  {
    id: "inv-weight",
    kind: NODE_KINDS.RULE,
    group: "inv-model",
    title: "Weight / Encumbrance",
    tagline: "Mass limits choices",
    iconId: "rule"
  },
  {
    id: "inv-grid",
    kind: NODE_KINDS.RULE,
    group: "inv-model",
    title: "Grid Inventory",
    tagline: "Spatial packing puzzle",
    description: "Resident-Evil-style management as a gameplay layer.",
    iconId: "puzzle"
  },
  {
    id: "rl-progression",
    kind: NODE_KINDS.FEATURE,
    title: "Player Progression",
    category: "FEATURE",
    tagline: "How power grows within a run",
    iconId: "analytics",
    unlocks: ["prog-leveling", "prog-skilltree", "prog-item-power", "prog-unlocks", "rl-death"]
  },
  {
    id: "prog-leveling",
    kind: NODE_KINDS.SYSTEM,
    group: "progression-model",
    title: "Levelling",
    tagline: "XP-driven growth",
    iconId: "analytics"
  },
  {
    id: "prog-skilltree",
    kind: NODE_KINDS.SYSTEM,
    group: "progression-model",
    title: "Skill Tree",
    tagline: "Branching permanent choices",
    iconId: "system"
  },
  {
    id: "prog-item-power",
    kind: NODE_KINDS.SYSTEM,
    group: "progression-model",
    title: "Item-Driven Power",
    tagline: "Strength comes from gear",
    iconId: "rpg"
  },
  {
    id: "prog-unlocks",
    kind: NODE_KINDS.SYSTEM,
    group: "progression-model",
    title: "Unlockables",
    tagline: "New content across runs",
    iconId: "productivity"
  },
  {
    id: "meta-progression",
    kind: NODE_KINDS.FEATURE,
    title: "Meta-Progression",
    category: "FEATURE",
    tagline: "Growth that survives death",
    description: "What the player keeps when a run ends — the bridge between permadeath and motivation.",
    iconId: "analytics",
    requires: ["save-permadeath"],
    unlocks: ["meta-currency", "meta-unlocks", "meta-codex"]
  },
  {
    id: "meta-currency",
    kind: NODE_KINDS.SYSTEM,
    group: "meta-model",
    title: "Meta Currency",
    tagline: "Persistent spendable resource",
    iconId: "productivity"
  },
  {
    id: "meta-unlocks",
    kind: NODE_KINDS.SYSTEM,
    group: "meta-model",
    title: "Permanent Unlocks",
    tagline: "New items, classes, routes",
    iconId: "productivity"
  },
  {
    id: "meta-codex",
    kind: NODE_KINDS.FEATURE,
    group: "meta-model",
    title: "Bestiary / Codex",
    tagline: "Knowledge as progress",
    iconId: "educational"
  },
  {
    id: "rl-death",
    kind: NODE_KINDS.RULE,
    title: "Death & Restart",
    category: "RULE",
    tagline: "The consequence loop",
    iconId: "rule",
    unlocks: ["death-permadeath", "death-checkpoint", "death-run-summary", "game-build-pipeline"]
  },
  {
    id: "death-permadeath",
    kind: NODE_KINDS.RULE,
    group: "death-model",
    title: "Permadeath",
    tagline: "The run is the unit",
    iconId: "rule",
    unlocks: ["save-permadeath"]
  },
  {
    id: "death-checkpoint",
    kind: NODE_KINDS.RULE,
    group: "death-model",
    title: "Checkpoint Restart",
    tagline: "Softer failure",
    iconId: "database"
  },
  {
    id: "death-run-summary",
    kind: NODE_KINDS.FEATURE,
    group: "death-model",
    title: "Run Summary",
    tagline: "What you achieved before dying",
    iconId: "analytics"
  }
];

/* ══════════════════════════════════════════
   REMAINING GENRE BRANCHES
   ══════════════════════════════════════════ */
export const GAME_GENRE_SEEDS = [
  /* ── Survival ── */
  { id: "sv-world", kind: NODE_KINDS.CONCEPT, mode: "single", title: "Open World", tagline: "Continuous traversable space", iconId: "adventure", unlocks: ["sv-biomes", "sv-world-size", "sv-day-night"] },
  { id: "sv-biomes", kind: NODE_KINDS.CONTENT, title: "Biomes", tagline: "Distinct environmental zones", iconId: "adventure" },
  { id: "sv-world-size", kind: NODE_KINDS.SCOPE, title: "World Size", tagline: "How much space exists", iconId: "strategy" },
  { id: "sv-day-night", kind: NODE_KINDS.SYSTEM, title: "Day / Night Cycle", tagline: "Time changes the rules", description: "Night brings danger — the core tension lever of survival games.", iconId: "automation" },
  { id: "sv-needs", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Survival Needs", tagline: "Hunger, thirst, temperature", iconId: "system", unlocks: ["needs-hunger", "needs-thirst", "needs-temperature", "needs-stamina"] },
  { id: "needs-hunger", kind: NODE_KINDS.SYSTEM, group: "needs-model", title: "Hunger", tagline: "Food as a timer", iconId: "system" },
  { id: "needs-thirst", kind: NODE_KINDS.SYSTEM, group: "needs-model", title: "Thirst", tagline: "Water as a scarcity", iconId: "system" },
  { id: "needs-temperature", kind: NODE_KINDS.SYSTEM, group: "needs-model", title: "Temperature", tagline: "Environmental exposure", iconId: "system" },
  { id: "needs-stamina", kind: NODE_KINDS.SYSTEM, group: "needs-model", title: "Stamina", tagline: "Effort has a cost", iconId: "system" },
  { id: "sv-crafting", kind: NODE_KINDS.MECHANIC, mode: "single", title: "Crafting", tagline: "Combine materials into items", iconId: "system", unlocks: ["craft-recipes", "craft-stations", "craft-discovery"] },
  { id: "craft-recipes", kind: NODE_KINDS.DATA, title: "Recipe Book", tagline: "Known combinations", iconId: "database" },
  { id: "craft-stations", kind: NODE_KINDS.ENTITY, title: "Crafting Stations", tagline: "Where crafting happens", iconId: "system" },
  { id: "craft-discovery", kind: NODE_KINDS.FEATURE, title: "Experimental Discovery", tagline: "Learn recipes by trying", iconId: "puzzle" },
  { id: "sv-building", kind: NODE_KINDS.MECHANIC, mode: "single", title: "Building", tagline: "Player construction", iconId: "system", unlocks: ["build-snap", "build-freeform", "build-destruction"] },
  { id: "build-snap", kind: NODE_KINDS.RULE, group: "build-model", title: "Snap Placement", tagline: "Grid-aligned building", iconId: "rule" },
  { id: "build-freeform", kind: NODE_KINDS.RULE, group: "build-model", title: "Freeform Placement", tagline: "Any position and angle", iconId: "system" },
  { id: "build-destruction", kind: NODE_KINDS.SYSTEM, group: "build-model", title: "Destruction", tagline: "Structures can be broken", technical: true, iconId: "system" },
  { id: "sv-resources", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Resource Gathering", tagline: "Harvesting the world", iconId: "system", unlocks: ["res-nodes", "res-tools", "res-respawn"] },
  { id: "res-nodes", kind: NODE_KINDS.ENTITY, title: "Resource Nodes", tagline: "Harvestable objects", iconId: "system" },
  { id: "res-tools", kind: NODE_KINDS.ENTITY, title: "Gathering Tools", tagline: "Tiered harvesters", iconId: "rpg" },
  { id: "res-respawn", kind: NODE_KINDS.RULE, group: "respawn-model", title: "Resource Respawn", tagline: "Renewable or finite", iconId: "rule" },
  { id: "sv-hostile", kind: NODE_KINDS.ENTITY, mode: "single", title: "Hostile Creatures", tagline: "Threats in the world", iconId: "fighting", unlocks: ["hostile-ai", "hostile-nests", "hostile-nights"] },
  { id: "hostile-ai", kind: NODE_KINDS.SYSTEM, title: "Creature AI", tagline: "Hunting and territorial behaviour", iconId: "automation", unlocks: ["ai-fsm", "ai-behavior-tree", "ai-utility"] },
  { id: "hostile-nests", kind: NODE_KINDS.SYSTEM, title: "Nests / Spawners", tagline: "Persistent threat sources", iconId: "system" },
  { id: "hostile-nights", kind: NODE_KINDS.RULE, title: "Night Assaults", tagline: "Base defence pressure", iconId: "rule" },
  { id: "sv-weapons", kind: NODE_KINDS.ENTITY, mode: "single", title: "Weapons", tagline: "Tools of defence", iconId: "fighting", unlocks: ["weapon-melee", "weapon-ranged", "weapon-durability"] },
  { id: "weapon-melee", kind: NODE_KINDS.ENTITY, group: "weapon-model", title: "Melee Weapons", tagline: "Close range", iconId: "fighting" },
  { id: "weapon-ranged", kind: NODE_KINDS.ENTITY, group: "weapon-model", title: "Ranged Weapons", tagline: "Projectile combat", iconId: "fighting" },
  { id: "weapon-durability", kind: NODE_KINDS.RULE, group: "weapon-model", title: "Durability", tagline: "Equipment wears out", iconId: "rule" },

  /* ── FPS ── */
  { id: "fps-weapons", kind: NODE_KINDS.ENTITY, mode: "single", title: "Weapons", category: "ENTITY", tagline: "The arsenal", iconId: "fighting", unlocks: ["fps-weapon-types", "fps-ammo", "fps-recoil", "fps-attachments"] },
  { id: "fps-weapon-types", kind: NODE_KINDS.ENTITY, title: "Weapon Classes", tagline: "Pistols, rifles, snipers, launchers", iconId: "fighting" },
  { id: "fps-ammo", kind: NODE_KINDS.SYSTEM, title: "Ammunition", tagline: "Counts, reloads, scarcity", iconId: "system" },
  { id: "fps-recoil", kind: NODE_KINDS.MECHANIC, title: "Recoil & Spread", tagline: "Skill expression through control", iconId: "action" },
  { id: "fps-attachments", kind: NODE_KINDS.FEATURE, title: "Attachments", tagline: "Weapon customisation", iconId: "system" },
  { id: "fps-movement", kind: NODE_KINDS.MECHANIC, mode: "single", title: "Movement", category: "MECHANIC", tagline: "How the player traverses", iconId: "action", unlocks: ["move-sprint", "move-slide", "move-cover", "move-vertical"] },
  { id: "move-sprint", kind: NODE_KINDS.MECHANIC, group: "move-model", title: "Sprint", tagline: "Speed at a cost", iconId: "action" },
  { id: "move-slide", kind: NODE_KINDS.MECHANIC, group: "move-model", title: "Slide / Dodge", tagline: "Evasion option", iconId: "action" },
  { id: "move-cover", kind: NODE_KINDS.MECHANIC, group: "move-model", title: "Cover System", tagline: "Protection from fire", iconId: "system" },
  { id: "move-vertical", kind: NODE_KINDS.MECHANIC, group: "move-model", title: "Verticality", tagline: "Climbing, mantling, jetpacks", iconId: "action" },
  { id: "fps-enemies", kind: NODE_KINDS.ENTITY, mode: "single", title: "Enemies", category: "ENTITY", tagline: "The opposition", iconId: "fighting", unlocks: ["fps-enemy-ai", "monster-archetypes"] },
  { id: "fps-enemy-ai", kind: NODE_KINDS.SYSTEM, title: "Combat AI", tagline: "Tactical enemy behaviour", iconId: "automation", unlocks: ["ai-behavior-tree", "ai-utility", "ai-goap"] },
  { id: "fps-maps", kind: NODE_KINDS.CONTENT, mode: "single", title: "Maps & Levels", tagline: "Combat spaces", iconId: "system", unlocks: ["map-layout", "map-cover", "map-flow"] },
  { id: "map-layout", kind: NODE_KINDS.CONTENT, title: "Layout", tagline: "Routes and sightlines", iconId: "system" },
  { id: "map-cover", kind: NODE_KINDS.CONTENT, title: "Cover Placement", tagline: "Protecting and exposing", iconId: "system" },
  { id: "map-flow", kind: NODE_KINDS.CONTENT, title: "Choke Points", tagline: "Controlling engagement", iconId: "strategy" },

  /* ── RPG ── */
  { id: "rpg-progression", kind: NODE_KINDS.FEATURE, mode: "single", title: "Progression", tagline: "Character growth", iconId: "analytics", unlocks: ["prog-leveling", "prog-skilltree", "rpg-stats"] },
  { id: "rpg-stats", kind: NODE_KINDS.SYSTEM, title: "Character Stats", tagline: "Attributes and derived values", iconId: "analytics", unlocks: ["stats-attributes", "stats-derived", "stats-resistances"] },
  { id: "stats-attributes", kind: NODE_KINDS.DATA, title: "Core Attributes", tagline: "STR, DEX, INT and so on", iconId: "database" },
  { id: "stats-derived", kind: NODE_KINDS.DATA, title: "Derived Stats", tagline: "Computed from attributes", iconId: "database" },
  { id: "stats-resistances", kind: NODE_KINDS.DATA, title: "Resistances", tagline: "Damage type defence", iconId: "database" },
  { id: "rpg-quests", kind: NODE_KINDS.FEATURE, mode: "single", title: "Quests", tagline: "Objectives and rewards", iconId: "educational", unlocks: ["quest-branching", "quest-linear", "quest-procedural", "quest-journal"] },
  { id: "quest-branching", kind: NODE_KINDS.SYSTEM, group: "quest-structure", title: "Branching Quests", tagline: "Choices with consequences", iconId: "interactive" },
  { id: "quest-linear", kind: NODE_KINDS.SYSTEM, group: "quest-structure", title: "Linear Quests", tagline: "Authored narrative arc", iconId: "educational" },
  { id: "quest-procedural", kind: NODE_KINDS.SYSTEM, group: "quest-structure", title: "Procedural Quests", tagline: "Generated objectives", iconId: "automation" },
  { id: "quest-journal", kind: NODE_KINDS.FEATURE, title: "Quest Journal", tagline: "Tracking active objectives", iconId: "productivity" },
  { id: "rpg-dialogue", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Dialogue", tagline: "Conversation systems", iconId: "educational", unlocks: ["dialogue-tree", "dialogue-bar", "dialogue-reputation"] },
  { id: "dialogue-tree", kind: NODE_KINDS.SYSTEM, group: "dialogue-model", title: "Dialogue Tree", tagline: "Branching conversation", iconId: "interactive" },
  { id: "dialogue-bar", kind: NODE_KINDS.SYSTEM, group: "dialogue-model", title: "Dialogue Wheel", tagline: "Radial choice UI", iconId: "interactive" },
  { id: "dialogue-reputation", kind: NODE_KINDS.SYSTEM, group: "dialogue-model", title: "Reputation", tagline: "Choices remembered", iconId: "analytics" },
  { id: "rpg-inventory", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Inventory", tagline: "Carrying capacity", iconId: "system", unlocks: ["inv-slots", "inv-weight", "inv-grid"] },

  /* ── Platformer ── */
  { id: "pl-movement", kind: NODE_KINDS.MECHANIC, mode: "single", title: "Movement", tagline: "The core skill", iconId: "action", unlocks: ["pl-precision", "pl-momentum", "pl-double-jump", "pl-wall-jump"] },
  { id: "pl-precision", kind: NODE_KINDS.MECHANIC, group: "platform-move", title: "Precision Platforming", tagline: "Frame-perfect control", iconId: "action" },
  { id: "pl-momentum", kind: NODE_KINDS.MECHANIC, group: "platform-move", title: "Momentum Physics", tagline: "Speed and flow", iconId: "simulation" },
  { id: "pl-double-jump", kind: NODE_KINDS.MECHANIC, group: "platform-move", title: "Double Jump", tagline: "Air mobility", iconId: "action" },
  { id: "pl-wall-jump", kind: NODE_KINDS.MECHANIC, group: "platform-move", title: "Wall Jump", tagline: "Vertical chains", iconId: "action" },
  { id: "pl-levels", kind: NODE_KINDS.CONTENT, mode: "single", title: "Level Design", tagline: "Teaching through space", iconId: "system", unlocks: ["level-teaching", "level-secrets", "level-checkpoints"] },
  { id: "level-teaching", kind: NODE_KINDS.CONTENT, group: "level-model", title: "Wordless Teaching", tagline: "Mechanics shown, not told", iconId: "educational" },
  { id: "level-secrets", kind: NODE_KINDS.CONTENT, group: "level-model", title: "Collectibles & Secrets", tagline: "Optional reward for skill", iconId: "puzzle" },
  { id: "level-checkpoints", kind: NODE_KINDS.SYSTEM, group: "level-model", title: "Checkpoints", tagline: "Retry from progress", iconId: "database" },
  { id: "pl-hazards", kind: NODE_KINDS.ENTITY, mode: "single", title: "Hazards", tagline: "Environmental danger", iconId: "fighting", unlocks: ["hazard-static", "hazard-moving", "hazard-timed"] },
  { id: "hazard-static", kind: NODE_KINDS.ENTITY, group: "hazard-model", title: "Static Hazards", tagline: "Spikes, pits, lava", iconId: "fighting" },
  { id: "hazard-moving", kind: NODE_KINDS.ENTITY, group: "hazard-model", title: "Moving Hazards", tagline: "Patrolling threats", iconId: "automation" },
  { id: "hazard-timed", kind: NODE_KINDS.ENTITY, group: "hazard-model", title: "Timed Hazards", tagline: "Rhythm and patience", iconId: "automation" },

  /* ── Puzzle ── */
  { id: "pz-structure", kind: NODE_KINDS.CONCEPT, mode: "single", title: "Puzzle Structure", tagline: "How puzzles are framed", iconId: "puzzle", unlocks: ["pz-standalone", "pz-embedded", "pz-systems"] },
  { id: "pz-standalone", kind: NODE_KINDS.RULE, group: "puzzle-structure", title: "Standalone Levels", tagline: "Discrete and self-contained", iconId: "puzzle" },
  { id: "pz-embedded", kind: NODE_KINDS.RULE, group: "puzzle-structure", title: "World-Integrated", tagline: "Puzzles within a space", iconId: "adventure" },
  { id: "pz-systems", kind: NODE_KINDS.RULE, group: "puzzle-structure", title: "Emergent Systems", tagline: "Rules interacting to create puzzles", iconId: "system" },
  { id: "pz-mechanics", kind: NODE_KINDS.MECHANIC, mode: "single", title: "Puzzle Mechanics", tagline: "The verbs available", iconId: "puzzle", unlocks: ["pz-logic", "pz-physics", "pz-pattern", "pz-spatial"] },
  { id: "pz-logic", kind: NODE_KINDS.MECHANIC, group: "puzzle-mechanics", title: "Logic", tagline: "Deduction and inference", iconId: "puzzle" },
  { id: "pz-physics", kind: NODE_KINDS.MECHANIC, group: "puzzle-mechanics", title: "Physics", tagline: "Simulated interaction", iconId: "simulation" },
  { id: "pz-pattern", kind: NODE_KINDS.MECHANIC, group: "puzzle-mechanics", title: "Pattern Recognition", tagline: "Sequences and rules", iconId: "analytics" },
  { id: "pz-spatial", kind: NODE_KINDS.MECHANIC, group: "puzzle-mechanics", title: "Spatial Reasoning", tagline: "Shape and arrangement", iconId: "system" },
  { id: "pz-hints", kind: NODE_KINDS.FEATURE, mode: "single", title: "Hint System", tagline: "Nudges without spoiling", iconId: "educational", unlocks: ["hint-progressive", "hint-explicit"] },
  { id: "hint-progressive", kind: NODE_KINDS.FEATURE, group: "hint-model", title: "Progressive Hints", tagline: "Escalating assistance", iconId: "educational" },
  { id: "hint-explicit", kind: NODE_KINDS.FEATURE, group: "hint-model", title: "Explicit Solutions", tagline: "Direct answers on request", iconId: "educational" },

  /* ── Strategy ── */
  { id: "st-scope", kind: NODE_KINDS.SCOPE, mode: "single", title: "Strategic Scope", tagline: "Scale of decisions", iconId: "strategy", unlocks: ["st-tactical", "st-grand", "st-realtime"] },
  { id: "st-tactical", kind: NODE_KINDS.SCOPE, group: "strategy-scope", title: "Tactical", tagline: "Mission-scale battles", iconId: "strategy" },
  { id: "st-grand", kind: NODE_KINDS.SCOPE, group: "strategy-scope", title: "Grand Strategy", tagline: "Empire-scale, long horizon", iconId: "analytics" },
  { id: "st-realtime", kind: NODE_KINDS.SCOPE, group: "strategy-scope", title: "Real-Time Strategy", tagline: "Continuous pressure", iconId: "automation" },
  { id: "st-economy", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Economy", tagline: "Resources and production", iconId: "productivity", unlocks: ["eco-resources", "eco-production", "eco-trade"] },
  { id: "eco-resources", kind: NODE_KINDS.DATA, title: "Resource Types", tagline: "What is gathered", iconId: "database" },
  { id: "eco-production", kind: NODE_KINDS.SYSTEM, title: "Production Chains", tagline: "Conversion and refinement", iconId: "automation" },
  { id: "eco-trade", kind: NODE_KINDS.SYSTEM, title: "Trade", tagline: "Exchange and markets", iconId: "productivity" },
  { id: "st-units", kind: NODE_KINDS.ENTITY, mode: "single", title: "Units & Buildings", tagline: "What you command", iconId: "system", unlocks: ["unit-types", "unit-upgrades", "unit-counter"] },
  { id: "unit-types", kind: NODE_KINDS.ENTITY, group: "unit-model", title: "Unit Types", tagline: "Roles in an army", iconId: "strategy" },
  { id: "unit-upgrades", kind: NODE_KINDS.SYSTEM, group: "unit-model", title: "Upgrade Trees", tagline: "Vertical improvement", iconId: "system" },
  { id: "unit-counter", kind: NODE_KINDS.RULE, group: "unit-model", title: "Counter Relationships", tagline: "Rock-paper-scissors balance", iconId: "rule" },
  { id: "st-ai", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Opponent AI", tagline: "Non-player strategists", iconId: "automation", unlocks: ["ai-utility", "ai-goap"] },

  /* ── Horror ── */
  { id: "hr-tension", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Tension Model", tagline: "How dread is produced", iconId: "adventure", unlocks: ["hr-scarcity", "hr-chase", "hr-atmosphere"] },
  { id: "hr-scarcity", kind: NODE_KINDS.RULE, group: "tension-model", title: "Resource Scarcity", tagline: "Tension from lack", iconId: "system" },
  { id: "hr-chase", kind: NODE_KINDS.SYSTEM, group: "tension-model", mode: "single", title: "Pursuit", tagline: "An active hunter", iconId: "fighting", unlocks: ["chase-ai", "chase-hiding", "chase-escape"] },
  { id: "chase-ai", kind: NODE_KINDS.SYSTEM, group: "chase-model", title: "Stalker AI", tagline: "Persistent searching threat", iconId: "automation", unlocks: ["ai-utility", "ai-goap"] },
  { id: "chase-hiding", kind: NODE_KINDS.MECHANIC, group: "chase-model", title: "Hiding", tagline: "Avoidance as a verb", iconId: "system" },
  { id: "chase-escape", kind: NODE_KINDS.MECHANIC, group: "chase-model", title: "Escape", tagline: "Breaking pursuit", iconId: "action" },
  { id: "hr-atmosphere", kind: NODE_KINDS.SYSTEM, group: "tension-model", title: "Atmosphere", tagline: "Dread through mood", iconId: "adventure" },
  { id: "hr-audio", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Sound Design", tagline: "Audio as the primary fear tool", iconId: "audio", unlocks: ["audio-positional", "audio-dynamic"] },
  { id: "audio-positional", kind: NODE_KINDS.TECHNOLOGY, group: "audio-model", title: "Positional Audio", tagline: "Spatial sound cues", technical: true, iconId: "audio" },
  { id: "audio-dynamic", kind: NODE_KINDS.TECHNOLOGY, group: "audio-model", title: "Dynamic Mixing", tagline: "Music and stingers reacting to state", technical: true, iconId: "audio" },

  /* ── Sandbox / Creative ── */
  { id: "sb-tools", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Creation Tools", tagline: "What the player can build with", iconId: "system", unlocks: ["sb-terrain", "sb-objects", "sb-logic", "sb-scripting"] },
  { id: "sb-terrain", kind: NODE_KINDS.MECHANIC, title: "Terrain Editing", tagline: "Sculpting the world", iconId: "system" },
  { id: "sb-objects", kind: NODE_KINDS.MECHANIC, title: "Object Placement", tagline: "Placing and arranging props", iconId: "system" },
  { id: "sb-logic", kind: NODE_KINDS.SYSTEM, title: "Logic Nodes", tagline: "Visual behaviour wiring", iconId: "automation" },
  { id: "sb-scripting", kind: NODE_KINDS.SYSTEM, title: "In-Game Scripting", tagline: "Player-authored code", iconId: "backend" },
  { id: "sb-world", kind: NODE_KINDS.CONCEPT, mode: "single", title: "Persistent World", tagline: "Changes are kept", iconId: "database", unlocks: ["world-seed", "world-sync"] },
  { id: "world-seed", kind: NODE_KINDS.DATA, group: "world-model", title: "World Seed", tagline: "Reproducible generation", iconId: "database" },
  { id: "world-sync", kind: NODE_KINDS.SYSTEM, group: "world-model", title: "World Sync", tagline: "Sharing modifications", iconId: "automation" },
  { id: "sb-sharing", kind: NODE_KINDS.FEATURE, mode: "single", title: "Sharing & Publishing", tagline: "Distributing creations", iconId: "cloud", unlocks: ["share-workshop", "share-files", "share-gallery"] },
  { id: "share-workshop", kind: NODE_KINDS.SERVICE, group: "share-model", title: "Steam Workshop", tagline: "Platform mod distribution", technical: true, iconId: "cloud" },
  { id: "share-files", kind: NODE_KINDS.DATA, group: "share-model", title: "File Export / Import", tagline: "Shareable save files", iconId: "database" },
  { id: "share-gallery", kind: NODE_KINDS.FEATURE, group: "share-model", title: "Community Gallery", tagline: "Browsing others' creations", iconId: "interactive" },

  /* ── Simulation ── */
  { id: "sim-systems", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Interlocking Systems", tagline: "Emergence from rules", iconId: "system", unlocks: ["sim-tick", "sim-agents", "sim-environment"] },
  { id: "sim-tick", kind: NODE_KINDS.SYSTEM, title: "Simulation Tick", tagline: "Update cadence and determinism", technical: true, iconId: "automation" },
  { id: "sim-agents", kind: NODE_KINDS.SYSTEM, title: "Agent Simulation", tagline: "Populations with needs", iconId: "automation", unlocks: ["ai-utility", "ai-goap"] },
  { id: "sim-environment", kind: NODE_KINDS.SYSTEM, title: "Environment Model", tagline: "Weather, ecology, resources", iconId: "simulation" },
  { id: "sim-economy", kind: NODE_KINDS.SYSTEM, mode: "single", title: "Economic Simulation", tagline: "Supply, demand, prices", iconId: "productivity", unlocks: ["eco-resources", "eco-production", "eco-trade"] },
  { id: "sim-ai-agents", kind: NODE_KINDS.SYSTEM, mode: "single", title: "NPC Agents", tagline: "Autonomous inhabitants", iconId: "automation", unlocks: ["ai-behavior-tree", "ai-utility", "ai-goap"] }
];

/** Everything the GAME domain contributes to the knowledge graph. */
export const GAME_SEEDS = [
  ...GAME_ROOTS,
  ...ROGUELIKE_SEEDS,
  ...GAME_GENRE_SEEDS,
  ...SHARED_GAME_SEEDS
];

/** Seeds offered at the very start of a GAME project. */
export const GAME_ENTRY_IDS = GAME_ROOTS.map(s => s.id);