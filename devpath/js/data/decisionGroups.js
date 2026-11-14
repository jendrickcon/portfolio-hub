/**
 * DEVPATH // Recursive Decision-Group Registry (Phase 1)
 * ------------------------------------------------------------------
 * The graph model is:  NODE → DECISION GROUP → CHOICE → NEW DECISION GROUP → ...
 *
 * A "decision group" is one question the user answers (e.g. GENRE, ENGINE).
 * Each group declares:
 *   - selectionMode: "single" | "multiple"
 *   - options: [{ id, title, category, tagline, description, iconId,
 *                 nextDecisionGroups: [...] }]
 *
 * Selecting an option can *unlock* further decision groups, which is what makes
 * the graph recursive & effectively unbounded within the curated data.
 *
 * Nodes may also declare `convergeInto` so many branches can feed a single node
 * later (the data model supports multi-parent convergence even before the UI
 * surfaces it).
 *
 * Expansion rules (authoring):
 *   - Keep ~60-100 meaningful nodes. Depth over breadth.
 *   - Groups are REUSABLE: several options may unlock the same group id.
 *   - `nextDecisionGroups` is a list of group ids resolved at runtime.
 * ------------------------------------------------------------------
 */

import { NODE_TYPES, STAGES } from "./vocabulary.js";

/* ──────────────────────────────
   PROJECT ROOT GROUPS — what a fresh project of each type opens.
   These are the entry points the existing Stage 2 (PROJECT TYPE)
   can hand off to, without changing the current UI.
   ────────────────────────────── */
export const ROOT_GROUPS_BY_TYPE = {
  game: ["game-direction", "game-technical"],
  website: ["site-purpose", "site-experience", "site-technical"],
  software: ["software-purpose", "software-ux", "software-technical"]
};

/* ──────────────────────────────
   THE REGISTRY
   ────────────────────────────── */
export const DECISION_GROUPS = {

  /* ============================================================
     GAME — PRODUCT / CREATIVE BRANCHES
     ============================================================ */

  "game-direction": {
    id: "game-direction",
    title: "DIRECTION",
    subtitle: "What kind of game are you making?",
    selectionMode: "multiple",
    options: [
      {
        id: "genre",
        title: "GENRE",
        category: "DIRECTION",
        tagline: "Core genre identity",
        description: "Establish the genre lineage of the game.",
        iconId: "rpg",
        nextDecisionGroups: ["game-genre"]
      },
      {
        id: "gameplay",
        title: "GAMEPLAY",
        category: "DIRECTION",
        tagline: "Core interaction loop",
        description: "Define what the player actually does moment to moment.",
        iconId: "action",
        nextDecisionGroups: ["game-gameplay"]
      },
      {
        id: "experience",
        title: "EXPERIENCE",
        category: "DIRECTION",
        tagline: "How it feels to play",
        description: "Tone, pacing, and emotional target of the experience.",
        iconId: "interactive",
        nextDecisionGroups: ["game-experience"]
      }
    ]
  },

  "game-genre": {
    id: "game-genre",
    title: "GENRE",
    subtitle: "Pick one or more genre layers",
    selectionMode: "multiple",
    options: [
      {
        id: "rpg",
        title: "RPG",
        category: "GENRE",
        tagline: "Progression & narrative systems",
        description: "Character growth, stats, inventory, and story progression.",
        iconId: "rpg",
        nextDecisionGroups: ["game-rpg-combat", "game-rpg-progression", "game-rpg-quests"]
      },
      {
        id: "platformer",
        title: "Platformer",
        category: "GENRE",
        tagline: "Movement & traversal",
        description: "Precision jumping, level flow, and movement mastery.",
        iconId: "action",
        nextDecisionGroups: ["game-platform-movement"]
      },
      {
        id: "horror",
        title: "Horror",
        category: "GENRE",
        tagline: "Tension & dread",
        description: "Atmosphere, scarcity, and controlled fear.",
        iconId: "adventure",
        nextDecisionGroups: ["game-horror-tension"]
      },
      {
        id: "strategy",
        title: "Strategy",
        category: "GENRE",
        tagline: "Planning & systems mastery",
        description: "Resource, tactical, or grand-scale strategic decisions.",
        iconId: "strategy",
        nextDecisionGroups: ["game-strategy-scope"]
      },
      {
        id: "puzzle",
        title: "Puzzle",
        category: "GENRE",
        tagline: "Deduction & problem solving",
        description: 'Rule-based challenges and "aha" moments.',
        iconId: "puzzle",
        nextDecisionGroups: ["game-puzzle-structure"]
      }
    ]
  },

  "game-gameplay": {
    id: "game-gameplay",
    title: "GAMEPLAY",
    subtitle: "The verbs of your game",
    selectionMode: "multiple",
    options: [
      { id: "exploration", title: "Exploration", category: "GAMEPLAY", tagline: "Discovery & traversal", description: "Letting the player discover space and secrets.", iconId: "adventure", nextDecisionGroups: ["game-exploration"] },
      { id: "combat", title: "Combat", category: "GAMEPLAY", tagline: "Conflict loop", description: "Encounters, damage, and combat pacing.", iconId: "fighting", nextDecisionGroups: ["game-combat-model"] },
      { id: "building", title: "Building", category: "GAMEPLAY", tagline: "Construction systems", description: "Placing, crafting, and constructing.", iconId: "system" },
      { id: "puzzle-solving", title: "Puzzle Solving", category: "GAMEPLAY", tagline: "Deduction loops", description: "Reasoning-based interaction.", iconId: "puzzle" },
      { id: "narrative-choice", title: "Narrative Choice", category: "GAMEPLAY", tagline: "Branching decisions", description: "Player choices shaping outcomes.", iconId: "educational" }
    ]
  },

  "game-experience": {
    id: "game-experience",
    title: "EXPERIENCE",
    subtitle: "Tone and player relationship",
    selectionMode: "multiple",
    options: [
      { id: "story-driven", title: "Story-Driven", category: "EXPERIENCE", tagline: "Narrative first", description: "The story carries the game.", iconId: "educational" },
      { id: "competitive", title: "Competitive", category: "EXPERIENCE", tagline: "Skill & ranking", description: "Player-versus-player mastery.", iconId: "fighting" },
      { id: "casual", title: "Casual", category: "EXPERIENCE", tagline: "Low-friction fun", description: "Short sessions, gentle learning curve.", iconId: "productivity" },
      { id: "educational-exp", title: "Educational", category: "EXPERIENCE", tagline: "Learning outcome", description: "Teaches something real.", iconId: "educational" }
    ]
  },

  "game-rpg-combat": {
    id: "game-rpg-combat",
    title: "RPG COMBAT",
    subtitle: "How RPG conflict resolves",
    selectionMode: "single",
    options: [
      { id: "turn-based", title: "Turn-Based", category: "COMBAT", tagline: "Sequential turns", description: "Players act in ordered turns.", iconId: "strategy", nextDecisionGroups: ["game-save-system"] },
      { id: "real-time", title: "Real-Time", category: "COMBAT", tagline: "Continuous action", description: "Combat flows without turns.", iconId: "action", nextDecisionGroups: ["game-save-system"] },
      { id: "tactical", title: "Tactical / Grid", category: "COMBAT", tagline: "Positional combat", description: "Grid/position-based encounters.", iconId: "strategy", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "game-rpg-progression": {
    id: "game-rpg-progression",
    title: "PROGRESSION",
    subtitle: "How the character grows",
    selectionMode: "single",
    options: [
      { id: "leveling", title: "Leveling", category: "PROGRESSION", tagline: "XP & levels", description: "Numeric growth via experience.", iconId: "analytics" },
      { id: "skill-tree", title: "Skill Tree", category: "PROGRESSION", tagline: "Branching unlocks", description: "Choice-driven ability unlocking.", iconId: "system" },
      { id: "item-power", title: "Item Power", category: "PROGRESSION", tagline: "Gear-driven", description: "Power comes from equipment.", iconId: "rpg" }
    ]
  },

  "game-rpg-quests": {
    id: "game-rpg-quests",
    title: "QUEST STRUCTURE",
    subtitle: "How objectives and narrative flow",
    selectionMode: "single",
    options: [
      { id: "branching-quests", title: "Branching", category: "QUESTS", tagline: "Choice & consequence", description: "Quests branch dynamically based on decisions.", iconId: "interactive" },
      { id: "linear-quests", title: "Linear", category: "QUESTS", tagline: "Narrative arc", description: "Handcrafted narrative in sequential acts.", iconId: "educational" },
      { id: "procedural-quests", title: "Procedural", category: "QUESTS", tagline: "Generated bounties", description: "Algorithmic objectives and rewards.", iconId: "automation" }
    ]
  },

  "game-exploration": {
    id: "game-exploration",
    title: "EXPLORATION MODEL",
    subtitle: "How the world unfolds",
    selectionMode: "single",
    options: [
      { id: "open-world", title: "Open World", category: "EXPLORATION", tagline: "Unbounded traversal", description: "Seamless navigation with emergent discovery.", iconId: "adventure" },
      { id: "hub-world", title: "Hub & Spoke", category: "EXPLORATION", tagline: "Central staging", description: "Safe central zone connecting to discrete levels.", iconId: "adventure" },
      { id: "linear-world", title: "Level-Based", category: "EXPLORATION", tagline: "Curated sequence", description: "Handcrafted ordered levels and zones.", iconId: "adventure" },
      { id: "procedural-world", title: "Procedural", category: "EXPLORATION", tagline: "Algorithmic generation", description: "Infinite or randomized worlds on each run.", iconId: "automation" }
    ]
  },

  "game-platform-movement": {
    id: "game-platform-movement",
    title: "MOVEMENT MODEL",
    subtitle: "How the player moves",
    selectionMode: "single",
    options: [
      { id: "precision", title: "Precision", category: "MOVEMENT", tagline: "Tight control", description: "Frame-accurate platforming.", iconId: "action" },
      { id: "momentum", title: "Momentum", category: "MOVEMENT", tagline: "Speed & physics", description: "Physics-driven, flow-based movement.", iconId: "simulation" },
      { id: "puzzle-move", title: "Puzzle Movement", category: "MOVEMENT", tagline: "Constrained moves", description: "Movement as a puzzle constraint.", iconId: "puzzle" }
    ]
  },

  "game-horror-tension": {
    id: "game-horror-tension",
    title: "TENSION MODEL",
    subtitle: "How dread is produced",
    selectionMode: "single",
    options: [
      { id: "resource-scarcity", title: "Scarcity", category: "TENSION", tagline: "Limited resources", description: "Tension from lack of supplies.", iconId: "system" },
      { id: "chase", title: "Chase / Pursuit", category: "TENSION", tagline: "Active threat", description: "A pursuing antagonist.", iconId: "fighting" },
      { id: "atmosphere", title: "Atmospheric", category: "TENSION", tagline: "Ambient dread", description: "Fear built from mood rather than threats.", iconId: "adventure" }
    ]
  },

  "game-strategy-scope": {
    id: "game-strategy-scope",
    title: "STRATEGY SCOPE",
    subtitle: "Scale & cadence",
    selectionMode: "single",
    options: [
      { id: "tactical-scale", title: "Tactical", category: "SCOPE", tagline: "Small-scale battles", description: "Mission-scale decisions.", iconId: "strategy" },
      { id: "grand-scale", title: "Grand Scale", category: "SCOPE", tagline: "Empire scale", description: "Long-horizon, large-scale management.", iconId: "analytics" },
      { id: "real-time-strategy", title: "Real-Time", category: "SCOPE", tagline: "Live decision-making", description: "Continuous strategic pressure.", iconId: "automation" }
    ]
  },

  "game-puzzle-structure": {
    id: "game-puzzle-structure",
    title: "PUZZLE STRUCTURE",
    subtitle: "How puzzles are framed",
    selectionMode: "single",
    options: [
      { id: "standalone", title: "Standalone", category: "PUZZLE", tagline: "Discrete levels", description: "Self-contained puzzles.", iconId: "puzzle" },
      { id: "embedded", title: "Embedded", category: "PUZZLE", tagline: "World-integrated", description: "Puzzles woven into a world.", iconId: "adventure" },
      { id: "systems-puzzle", title: "Systems", category: "PUZZLE", tagline: "Emergent rules", description: "Interaction between systems creates puzzles.", iconId: "system" }
    ]
  },

  /* ============================================================
     GAME — TECHNICAL BRANCH
     ============================================================ */

  "game-technical": {
    id: "game-technical",
    title: "TECHNICAL",
    subtitle: "How the game is built",
    selectionMode: "multiple",
    options: [
      {
        id: "arch-2d",
        title: "2D GAME ENGINE",
        category: "ARCHITECTURE",
        tagline: "Sprites, tilemaps & physics",
        description: "2D rendering, collision, and platformer/RPG loops.",
        iconId: "game-2d",
        nextDecisionGroups: ["game-2d-engine"]
      },
      {
        id: "arch-3d",
        title: "3D GAME ENGINE",
        category: "ARCHITECTURE",
        tagline: "Meshes, shaders & scenes",
        description: "3D scene graph and spatial worlds.",
        iconId: "game-3d",
        nextDecisionGroups: ["game-3d-engine"]
      },
      {
        id: "arch-web",
        title: "BROWSER / WEB GAME",
        category: "ARCHITECTURE",
        tagline: "Canvas, WebGL & instant play",
        description: "Zero-install browser games.",
        iconId: "game-browser",
        nextDecisionGroups: ["game-web-engine"]
      }
    ]
  },

  "game-2d-engine": {
    id: "game-2d-engine",
    title: "2D ENGINE",
    subtitle: "Pick your 2D engine",
    selectionMode: "single",
    options: [
      { id: "godot", title: "Godot", category: "ENGINE", tagline: "Open-source 2D engine", description: "Scene-node engine with rich 2D tooling.", iconId: "framework", nextDecisionGroups: ["godot-language", "godot-rendering", "godot-physics"] },
      { id: "unity-2d", title: "Unity", category: "ENGINE", tagline: "Cross-platform engine", description: "Mature engine with strong 2D support.", iconId: "framework", nextDecisionGroups: ["unity-language", "game-2d-physics"] },
      { id: "gamemaker", title: "GameMaker", category: "ENGINE", tagline: "Rapid 2D development", description: "Fast 2D-first game authoring.", iconId: "framework", nextDecisionGroups: ["gamemaker-language", "game-2d-physics"] },
      { id: "defold", title: "Defold", category: "ENGINE", tagline: "Lightweight 2D engine", description: "Small-footprint, multi-platform 2D engine.", iconId: "framework", nextDecisionGroups: ["defold-language", "game-2d-physics"] },
      { id: "phaser", title: "Phaser", category: "ENGINE", tagline: "HTML5 2D framework", description: "Batteries-included browser 2D engine.", iconId: "game-browser", nextDecisionGroups: ["web-game-language", "game-2d-physics"] },
      { id: "love2d", title: "LÖVE", category: "ENGINE", tagline: "Lua 2D engine", description: "Minimal 2D engine driven by Lua.", iconId: "framework", nextDecisionGroups: ["love2d-libraries", "game-2d-physics"] },
      { id: "construct", title: "Construct 3", category: "ENGINE", tagline: "Visual block scripting", description: "Rapid browser-based 2D engine with block logic.", iconId: "framework", nextDecisionGroups: ["game-visual-scripting", "game-2d-physics"] },
      { id: "raylib", title: "Raylib", category: "ENGINE", tagline: "Code-only simplicity", description: "Minimalist, zero-boilerplate C/C++ game library.", iconId: "framework", nextDecisionGroups: ["raylib-language", "game-2d-physics"] },
      { id: "bevy", title: "Bevy", category: "ENGINE", tagline: "Data-driven Rust ECS", description: "Modern, ergonomic data-driven ECS engine in Rust.", iconId: "framework", nextDecisionGroups: ["bevy-systems", "game-2d-physics"] }
    ]
  },

  "game-3d-engine": {
    id: "game-3d-engine",
    title: "3D ENGINE",
    subtitle: "Pick your 3D engine",
    selectionMode: "single",
    options: [
      { id: "unity", title: "Unity", category: "ENGINE", tagline: "Cross-platform 3D", description: "Broad platform reach and tooling.", iconId: "framework", nextDecisionGroups: ["unity-language"] },
      { id: "unreal", title: "Unreal Engine", category: "ENGINE", tagline: "AAA rendering", description: "High-fidelity rendering pipeline.", iconId: "framework" },
      { id: "godot-3d", title: "Godot", category: "ENGINE", tagline: "Open-source 3D", description: "Lightweight open-source 3D engine.", iconId: "framework", nextDecisionGroups: ["godot-language"] }
    ]
  },

  "game-web-engine": {
    id: "game-web-engine",
    title: "WEB ENGINE",
    subtitle: "Browser runtime core",
    selectionMode: "single",
    options: [
      { id: "phaser-web", title: "Phaser", category: "ENGINE", tagline: "2D web framework", description: "Mature browser 2D framework.", iconId: "game-browser", nextDecisionGroups: ["web-game-language"] },
      { id: "threejs", title: "Three.js", category: "ENGINE", tagline: "WebGL 3D toolkit", description: "High-level WebGL for 3D web games.", iconId: "game-3d", nextDecisionGroups: ["web-game-language"] },
      { id: "babylon", title: "Babylon.js", category: "ENGINE", tagline: "Full web 3D engine", description: "Complete WebGL engine for the web.", iconId: "game-3d", nextDecisionGroups: ["web-game-language"] }
    ]
  },

  /* ---- Godot sub-branches ---- */
  "godot-language": {
    id: "godot-language",
    title: "GODOT LANGUAGE",
    subtitle: "Scripting language",
    selectionMode: "single",
    options: [
      { id: "gdscript", title: "GDScript", category: "LANGUAGE", tagline: "Godot-native scripting", description: "Engine-integrated scripting language.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "csharp", title: "C#", category: "LANGUAGE", tagline: "Typed OOP language", description: "Strongly-typed .NET scripting in Godot.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },
  "godot-rendering": {
    id: "godot-rendering",
    title: "GODOT RENDERER",
    subtitle: "Rendering backend",
    selectionMode: "single",
    options: [
      { id: "forward-plus", title: "Forward+", category: "RENDERING", tagline: "Modern high-end renderer", description: "Best visuals for desktop-class targets.", iconId: "rendering" },
      { id: "compatibility", title: "Compatibility", category: "RENDERING", tagline: "Wide device support", description: "Broadest hardware and mobile support.", iconId: "rendering" }
    ]
  },
  "godot-physics": {
    id: "godot-physics",
    title: "GODOT PHYSICS",
    subtitle: "Physics model",
    selectionMode: "single",
    options: [
      { id: "physics-2d-builtin", title: "Built-in 2D", category: "PHYSICS", tagline: "Default physics", description: "Integrated 2D physics engine.", iconId: "simulation" },
      { id: "physics-2d-custom", title: "Custom", category: "PHYSICS", tagline: "Hand-rolled physics", description: "Custom movement and collision.", iconId: "simulation" }
    ]
  },

  "unity-language": {
    id: "unity-language",
    title: "UNITY LANGUAGE",
    subtitle: "Scripting language",
    selectionMode: "single",
    options: [
      { id: "unity-csharp", title: "C#", category: "LANGUAGE", tagline: "Unity scripting", description: "Primary Unity gameplay language.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "unity-visual", title: "Visual Scripting", category: "LANGUAGE", tagline: "Node-based logic", description: "Graph-based gameplay logic.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "web-game-language": {
    id: "web-game-language",
    title: "WEB LANGUAGE",
    subtitle: "Gameplay scripting",
    selectionMode: "single",
    options: [
      { id: "ts", title: "TypeScript", category: "LANGUAGE", tagline: "Typed JavaScript", description: "Safer, typed gameplay code.", iconId: "devtools" },
      { id: "js", title: "JavaScript", category: "LANGUAGE", tagline: "Native web scripting", description: "Zero-build browser scripting.", iconId: "devtools" },
      { id: "wasm-game", title: "WebAssembly", category: "LANGUAGE", tagline: "Near-native perf", description: "Compiled heavy logic.", iconId: "devtools" }
    ]
  },

  "gamemaker-language": {
    id: "gamemaker-language",
    title: "GAMEMAKER SCRIPTING",
    subtitle: "Logic & Code Model",
    selectionMode: "single",
    options: [
      { id: "gml-code", title: "GML Code", category: "LANGUAGE", tagline: "Typed scripting", description: "Native text-based GameMaker Language.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "gml-visual", title: "GML Visual", category: "LANGUAGE", tagline: "Visual node blocks", description: "Action blocks for rapid prototyping.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "defold-language": {
    id: "defold-language",
    title: "DEFOLD SCRIPTING",
    subtitle: "Lua runtime",
    selectionMode: "single",
    options: [
      { id: "defold-lua", title: "Lua", category: "LANGUAGE", tagline: "Lua 5.1 / LuaJIT", description: "Lightweight scripting compiled for max performance.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "love2d-libraries": {
    id: "love2d-libraries",
    title: "LÖVE ECOSYSTEM",
    subtitle: "Core gameplay modules",
    selectionMode: "single",
    options: [
      { id: "hump", title: "HUMP Helpers", category: "LIBRARY", tagline: "Gamestates & timers", description: "Essential game loop and camera utilities for LÖVE.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "breezefield", title: "Breezefield", category: "LIBRARY", tagline: "Box2D physics wrapper", description: "Ergonomic Box2D physics wrapper for LÖVE.", iconId: "simulation", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "raylib-language": {
    id: "raylib-language",
    title: "RAYLIB LANGUAGE",
    subtitle: "Host development language",
    selectionMode: "single",
    options: [
      { id: "raylib-c", title: "C / C++", category: "LANGUAGE", tagline: "Direct native performance", description: "Zero overhead direct C API.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "raylib-rust", title: "Rust (Raylib)", category: "LANGUAGE", tagline: "Safe memory bindings", description: "Memory safety with Raylib simplicity.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "bevy-systems": {
    id: "bevy-systems",
    title: "BEVY ARCHITECTURE",
    subtitle: "ECS & Scheduling",
    selectionMode: "single",
    options: [
      { id: "bevy-ecs", title: "Bevy ECS", category: "ARCHITECTURE", tagline: "Data-driven entities", description: "High-performance parallel ECS scheduler.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "game-visual-scripting": {
    id: "game-visual-scripting",
    title: "VISUAL LOGIC",
    subtitle: "Logic authoring style",
    selectionMode: "single",
    options: [
      { id: "construct-events", title: "Event Sheets", category: "LOGIC", tagline: "Conditional blocks", description: "Trigger and action spreadsheet logic.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] },
      { id: "construct-js", title: "JavaScript Addon", category: "LOGIC", tagline: "Embedded JS scripts", description: "Standard ES modules alongside event sheets.", iconId: "devtools", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "game-2d-physics": {
    id: "game-2d-physics",
    title: "2D PHYSICS MODEL",
    subtitle: "Collision & Rigid-body Engine",
    selectionMode: "single",
    options: [
      { id: "box2d", title: "Box2D", category: "PHYSICS", tagline: "Standard rigid bodies", description: "Mature continuous collision and joints.", iconId: "simulation", nextDecisionGroups: ["game-save-system"] },
      { id: "rapier-2d", title: "Rapier2D", category: "PHYSICS", tagline: "Modern SIMD physics", description: "High-performance Rust/WASM cross-platform physics.", iconId: "simulation", nextDecisionGroups: ["game-save-system"] },
      { id: "custom-kinematic", title: "Custom Kinematic", category: "PHYSICS", tagline: "Pixel-perfect controller", description: "Custom AABB and raycast platforming physics.", iconId: "action", nextDecisionGroups: ["game-save-system"] },
      { id: "chipmunk", title: "Chipmunk2D", category: "PHYSICS", tagline: "Fast C library", description: "Lightweight fast 2D rigid body library.", iconId: "simulation", nextDecisionGroups: ["game-save-system"] }
    ]
  },

  "game-save-system": {
    id: "game-save-system",
    title: "SAVE SYSTEM",
    subtitle: "How progress persists",
    selectionMode: "single",
    options: [
      { id: "sqlite", title: "SQLite", category: "STORAGE", tagline: "Embedded SQL", description: "Relational local save data.", iconId: "database", nextDecisionGroups: ["infra-game-distro", "infra-game-ci"] },
      { id: "json-save", title: "JSON Files", category: "STORAGE", tagline: "Flat-file saves", description: "Simple serialized save files.", iconId: "database", nextDecisionGroups: ["infra-game-distro", "infra-game-ci"] },
      { id: "cloud-save", title: "Cloud Saves", category: "STORAGE", tagline: "Remote persistence", description: "Saves synced to a server.", iconId: "cloud", nextDecisionGroups: ["infra-game-distro", "infra-game-ci"] }
    ]
  },

  "game-combat-model": {
    id: "game-combat-model",
    title: "COMBAT MODEL",
    subtitle: "How combat resolves",
    selectionMode: "single",
    options: [
      { id: "action-combat", title: "Action", category: "COMBAT", tagline: "Reflex-driven", description: "Real-time skill-based combat.", iconId: "action" },
      { id: "tactical-combat", title: "Tactical", category: "COMBAT", tagline: "Positional", description: "Turn/position-based tactics.", iconId: "strategy" },
      { id: "auto-combat", title: "Auto / Idle", category: "COMBAT", tagline: "Automated battles", description: "Systems resolve combat automatically.", iconId: "automation" }
    ]
  },

  /* ============================================================
     WEBSITE
     ============================================================ */

  "site-purpose": {
    id: "site-purpose",
    title: "PURPOSE",
    subtitle: "Why the site exists",
    selectionMode: "multiple",
    options: [
      { id: "ecommerce", title: "E-Commerce", category: "PURPOSE", tagline: "Online store & checkout", description: "Direct product sales, cart, and checkout flow.", iconId: "business", nextDecisionGroups: ["site-ecommerce-payment", "site-features"] },
      { id: "portfolio", title: "Portfolio", category: "PURPOSE", tagline: "Showcase work", description: "Present creative or professional work.", iconId: "portfolio" },
      { id: "business", title: "Business", category: "PURPOSE", tagline: "Commercial presence", description: "Company or product marketing.", iconId: "productivity" },
      { id: "education", title: "Education", category: "PURPOSE", tagline: "Teach & inform", description: "Learning content and courses.", iconId: "educational" },
      { id: "community", title: "Community", category: "PURPOSE", tagline: "People & discussion", description: "Member interaction and forums.", iconId: "interactive" }
    ]
  },

  "site-experience": {
    id: "site-experience",
    title: "EXPERIENCE",
    subtitle: "How visitors interact",
    selectionMode: "multiple",
    options: [
      { id: "informational", title: "Informational", category: "EXPERIENCE", tagline: "Read & browse", description: "Content-first browsing.", iconId: "informational", nextDecisionGroups: ["site-features"] },
      { id: "interactive-exp", title: "Interactive", category: "EXPERIENCE", tagline: "Tools & input", description: "Widgets, editors, tools.", iconId: "interactive", nextDecisionGroups: ["site-features"] },
      { id: "social", title: "Social", category: "EXPERIENCE", tagline: "People interaction", description: "Profiles, feeds, messaging.", iconId: "community", nextDecisionGroups: ["site-features", "site-auth"] },
      { id: "data-driven", title: "Data-Driven", category: "EXPERIENCE", tagline: "Live data", description: "Dashboards and live data views.", iconId: "analytics", nextDecisionGroups: ["site-features"] }
    ]
  },

  "site-features": {
    id: "site-features",
    title: "FEATURES",
    subtitle: "What the site must do",
    selectionMode: "multiple",
    options: [
      { id: "search", title: "Search", category: "FEATURE", tagline: "Find content", description: "Search across site content.", iconId: "automation" },
      { id: "uploads", title: "Uploads", category: "FEATURE", tagline: "User files", description: "Media or document uploads.", iconId: "cloud" },
      { id: "messaging", title: "Messaging", category: "FEATURE", tagline: "User comms", description: "Direct or group messaging.", iconId: "community", nextDecisionGroups: ["site-auth"] },
      { id: "payments", title: "Payments", category: "FEATURE", tagline: "Monetization", description: "Checkout and subscriptions.", iconId: "business", nextDecisionGroups: ["site-payments"] },
      { id: "auth-feature", title: "Accounts", category: "FEATURE", tagline: "User accounts", description: "Sign-up and sign-in.", iconId: "security", nextDecisionGroups: ["site-auth"] }
    ]
  },

  "site-auth": {
    id: "site-auth",
    title: "AUTHENTICATION",
    subtitle: "How users log in",
    selectionMode: "single",
    options: [
      { id: "email-auth", title: "Email + Password", category: "AUTH", tagline: "Classic accounts", description: "Email/password credential store.", iconId: "security" },
      { id: "oauth", title: "OAuth / Social", category: "AUTH", tagline: "Third-party login", description: "Sign in with Google/GitHub/etc.", iconId: "security" },
      { id: "magic-link", title: "Magic Link", category: "AUTH", tagline: "Passwordless", description: "Emailed one-time login links.", iconId: "security" }
    ]
  },

  "site-ecommerce-payment": {
    id: "site-ecommerce-payment",
    title: "PAYMENT PROVIDER",
    subtitle: "Checkout processing engine",
    selectionMode: "single",
    options: [
      { id: "stripe", title: "Stripe", category: "PAYMENTS", tagline: "Cards & subscriptions", description: "Global card and subscription billing.", iconId: "business", nextDecisionGroups: ["stripe-features"] },
      { id: "paypal", title: "PayPal", category: "PAYMENTS", tagline: "Wallet checkout", description: "PayPal wallet and checkout.", iconId: "business" },
      { id: "lemonsqueezy", title: "LemonSqueezy", category: "PAYMENTS", tagline: "Merchant of record", description: "Handles tax as merchant of record.", iconId: "business" }
    ]
  },

  "site-payments": {
    id: "site-payments",
    title: "PAYMENTS",
    subtitle: "How money moves",
    selectionMode: "single",
    options: [
      { id: "stripe", title: "Stripe", category: "PAYMENTS", tagline: "Cards & subscriptions", description: "Global card and subscription billing.", iconId: "business", nextDecisionGroups: ["stripe-features"] },
      { id: "paypal", title: "PayPal", category: "PAYMENTS", tagline: "Wallet checkout", description: "PayPal wallet and checkout.", iconId: "business" },
      { id: "lemonsqueezy", title: "LemonSqueezy", category: "PAYMENTS", tagline: "Merchant of record", description: "Handles tax as merchant of record.", iconId: "business" }
    ]
  },

  "stripe-features": {
    id: "stripe-features",
    title: "STRIPE INTEGRATION",
    subtitle: "Payment architecture components",
    selectionMode: "multiple",
    options: [
      { id: "webhooks", title: "Webhooks", category: "PAYMENT", tagline: "Async event handling", description: "Handle charge succeeded, failed, and subscription events.", iconId: "system" },
      { id: "checkout-sessions", title: "Hosted Checkout", category: "PAYMENT", tagline: "Zero PCI scope", description: "Secure prebuilt Stripe-hosted checkout pages.", iconId: "business" },
      { id: "customer-portal", title: "Customer Portal", category: "PAYMENT", tagline: "Self-serve billing", description: "Allow users to manage cards and subscriptions.", iconId: "security" }
    ]
  },

  "site-technical": {
    id: "site-technical",
    title: "TECHNICAL",
    subtitle: "How the site is built",
    selectionMode: "multiple",
    options: [
      { id: "arch-static", title: "STATIC / JAMSTACK", category: "ARCHITECTURE", tagline: "Pre-rendered, edge-delivered", description: "Static HTML/CSS/JS with a headless CMS.", iconId: "static-jamstack", nextDecisionGroups: ["site-frontend", "site-deployment"] },
      { id: "arch-fullstack", title: "FULL-STACK WEB APP", category: "ARCHITECTURE", tagline: "Client, server & database", description: "Dynamic sessions, APIs, and persistence.", iconId: "fullstack-web", nextDecisionGroups: ["site-frontend", "site-backend", "site-database"] },
      { id: "arch-spa", title: "INTERACTIVE CANVAS / SPA", category: "ARCHITECTURE", tagline: "Rich state & real-time", description: "Single-page apps with real-time state.", iconId: "interactive-spa", nextDecisionGroups: ["site-frontend", "site-realtime"] }
    ]
  },

  "site-frontend": {
    id: "site-frontend",
    title: "FRONTEND",
    subtitle: "UI framework",
    selectionMode: "single",
    options: [
      { id: "react", title: "React", category: "FRONTEND", tagline: "Component library", description: "Declarative component UI.", iconId: "frontend", nextDecisionGroups: ["frontend-state", "frontend-ui-system"] },
      { id: "vue", title: "Vue.js", category: "FRONTEND", tagline: "Progressive framework", description: "Approachable reactive UI framework.", iconId: "frontend" },
      { id: "svelte", title: "Svelte", category: "FRONTEND", tagline: "Compiled reactivity", description: "Compiles to tiny vanilla JS.", iconId: "frontend" }
    ]
  },

  "frontend-state": {
    id: "frontend-state",
    title: "STATE MANAGEMENT",
    subtitle: "How UI state is held",
    selectionMode: "single",
    options: [
      { id: "redux", title: "Redux", category: "STATE", tagline: "Centralized store", description: "Predictable global state container.", iconId: "system" },
      { id: "zustand", title: "Zustand", category: "STATE", tagline: "Minimal store", description: "Small, hook-based state store.", iconId: "system" },
      { id: "context", title: "Context / Signals", category: "STATE", tagline: "Built-in state", description: "Framework-native state primitives.", iconId: "system" }
    ]
  },

  "frontend-ui-system": {
    id: "frontend-ui-system",
    title: "UI SYSTEM",
    subtitle: "Component & styling layer",
    selectionMode: "single",
    options: [
      { id: "tailwind", title: "Tailwind CSS", category: "UI", tagline: "Utility-first", description: "Composable utility classes.", iconId: "styling" },
      { id: "component-lib", title: "Component Library", category: "UI", tagline: "Prebuilt components", description: "Design-system component kit.", iconId: "styling" },
      { id: "vanilla-css", title: "Vanilla CSS", category: "UI", tagline: "Hand-authored", description: "Plain custom CSS.", iconId: "styling" }
    ]
  },

  "site-backend": {
    id: "site-backend",
    title: "BACKEND",
    subtitle: "API & business logic",
    selectionMode: "single",
    options: [
      { id: "express", title: "Express", category: "BACKEND", tagline: "Node.js API", description: "Minimalist Node server framework.", iconId: "backend", nextDecisionGroups: ["backend-api-style"] },
      { id: "fastapi", title: "FastAPI", category: "BACKEND", tagline: "Python async API", description: "High-performance Python API engine.", iconId: "backend", nextDecisionGroups: ["backend-api-style"] },
      { id: "spring-boot", title: "Spring Boot", category: "BACKEND", tagline: "Enterprise Java", description: "Scalable production backend services.", iconId: "backend", nextDecisionGroups: ["backend-api-style"] }
    ]
  },

  "backend-api-style": {
    id: "backend-api-style",
    title: "API STYLE",
    subtitle: "Contract shape",
    selectionMode: "single",
    options: [
      { id: "rest", title: "REST", category: "API", tagline: "Resource HTTP", description: "Conventional resource endpoints.", iconId: "backend" },
      { id: "graphql", title: "GraphQL", category: "API", tagline: "Typed queries", description: "Client-specified queries.", iconId: "backend" },
      { id: "grpc", title: "gRPC", category: "API", tagline: "Binary RPC", description: "Contract-first RPC.", iconId: "backend" }
    ]
  },

  "site-database": {
    id: "site-database",
    title: "DATABASE",
    subtitle: "Persistence engine",
    selectionMode: "single",
    options: [
      { id: "postgresql", title: "PostgreSQL", category: "DATABASE", tagline: "Relational SQL", description: "ACID relational persistence.", iconId: "database", nextDecisionGroups: ["data-model"] },
      { id: "mongodb", title: "MongoDB", category: "DATABASE", tagline: "Document store", description: "Flexible JSON documents.", iconId: "database", nextDecisionGroups: ["data-model"] },
      { id: "sqlite", title: "SQLite / LibSQL", category: "DATABASE", tagline: "Embedded SQL", description: "Zero-latency embedded SQL.", iconId: "database", nextDecisionGroups: ["data-model"] }
    ]
  },

  "data-model": {
    id: "data-model",
    title: "DATA MODEL",
    subtitle: "How data is shaped",
    selectionMode: "single",
    options: [
      { id: "normalized", title: "Normalized", category: "DATA", tagline: "Relational schema", description: "Structured relational tables.", iconId: "database" },
      { id: "denormalized", title: "Denormalized", category: "DATA", tagline: "Read-optimized", description: "Duplicated, query-friendly data.", iconId: "database" },
      { id: "document-data", title: "Document", category: "DATA", tagline: "Nested documents", description: "Document-oriented structures.", iconId: "database" }
    ]
  },

  "site-realtime": {
    id: "site-realtime",
    title: "REAL-TIME",
    subtitle: "Live transport",
    selectionMode: "single",
    options: [
      { id: "websockets", title: "WebSockets", category: "REALTIME", tagline: "Bidirectional", description: "Persistent socket channel.", iconId: "realtime" },
      { id: "sse", title: "Server-Sent Events", category: "REALTIME", tagline: "One-way stream", description: "HTTP event streaming.", iconId: "realtime" },
      { id: "webrtc", title: "WebRTC", category: "REALTIME", tagline: "Peer-to-peer", description: "Low-latency peer media/data.", iconId: "realtime" }
    ]
  },

  "site-deployment": {
    id: "site-deployment",
    title: "DEPLOYMENT",
    subtitle: "Hosting target",
    selectionMode: "single",
    options: [
      { id: "netlify", title: "Netlify", category: "DEPLOY", tagline: "Edge hosting", description: "Git-driven edge deploys.", iconId: "cloud" },
      { id: "vercel", title: "Vercel", category: "DEPLOY", tagline: "Frontend cloud", description: "Instant previews, edge delivery.", iconId: "cloud" },
      { id: "self-host", title: "Self-Hosted", category: "DEPLOY", tagline: "Your own infra", description: "VPS or container hosting.", iconId: "cloud" }
    ]
  },

  /* ============================================================
     SOFTWARE
     ============================================================ */

  "software-purpose": {
    id: "software-purpose",
    title: "PURPOSE",
    subtitle: "What the software is for",
    selectionMode: "multiple",
    options: [
      { id: "devtools", title: "Developer Tool", category: "PURPOSE", tagline: "Engineering utilities", description: "CLI utilities, parsers, and developer tooling.", iconId: "devtools", nextDecisionGroups: ["software-devtools-type", "software-features"] },
      { id: "analytics", title: "Data / Analytics", category: "PURPOSE", tagline: "Process & visualize", description: "Data ingestion, statistical processing, and pipelines.", iconId: "analytics", nextDecisionGroups: ["software-analytics-engine", "software-features"] },
      { id: "productivity", title: "Productivity", category: "PURPOSE", tagline: "Get work done", description: "Tools that improve workflow.", iconId: "productivity" },
      { id: "business-sw", title: "Business", category: "PURPOSE", tagline: "Commercial tooling", description: "Internal or commercial business software.", iconId: "business" },
      { id: "automation-sw", title: "Automation", category: "PURPOSE", tagline: "Remove manual work", description: "Scripted and automated tasks.", iconId: "automation" },
      { id: "education-sw", title: "Education", category: "PURPOSE", tagline: "Teaching tool", description: "Learning-focused software.", iconId: "educational" }
    ]
  },

  "software-devtools-type": {
    id: "software-devtools-type",
    title: "TOOL INTERFACE",
    subtitle: "How developers invoke this tool",
    selectionMode: "single",
    options: [
      { id: "cli", title: "CLI Utility", category: "TYPE", tagline: "Terminal-first", description: "Terminal tool with arguments, flags, and streaming I/O.", iconId: "cli", nextDecisionGroups: ["cli-parsing", "cli-framework"] },
      { id: "desktop-gui-tool", title: "Desktop GUI Utility", category: "TYPE", tagline: "Windowed tool", description: "Visual workbench for specialized workflows.", iconId: "desktop", nextDecisionGroups: ["desktop-shell"] },
      { id: "editor-extension", title: "Editor Extension", category: "TYPE", tagline: "Editor integrated", description: "VS Code or browser developer extension.", iconId: "devtools" }
    ]
  },

  "cli-parsing": {
    id: "cli-parsing",
    title: "COMMAND PARSING",
    subtitle: "CLI argument and option routing",
    selectionMode: "single",
    options: [
      { id: "cli-args", title: "Command Parsing", category: "PARSING", tagline: "Positional & flags", description: "Structured flags, arguments, and type coercion.", iconId: "devtools" },
      { id: "cli-subcommands", title: "Subcommand Hierarchy", category: "PARSING", tagline: "Multi-command routing", description: "Nested subcommands like git or docker.", iconId: "devtools" },
      { id: "cli-prompts", title: "Interactive Prompts", category: "PARSING", tagline: "Terminal wizard", description: "Inquirer-style terminal prompts and selects.", iconId: "devtools" }
    ]
  },

  "software-analytics-engine": {
    id: "software-analytics-engine",
    title: "PROCESSING ENGINE",
    subtitle: "Core analytical computation layer",
    selectionMode: "single",
    options: [
      { id: "pandas", title: "Python Pandas", category: "ENGINE", tagline: "Tabular dataframes", description: "Standard DataFrame manipulation in Python.", iconId: "analytics", nextDecisionGroups: ["analytics-viz"] },
      { id: "polars", title: "Polars", category: "ENGINE", tagline: "Fast columnar", description: "Multi-threaded DataFrame processing in Rust/Python.", iconId: "analytics" },
      { id: "duckdb", title: "DuckDB", category: "ENGINE", tagline: "Analytical SQL", description: "In-process columnar analytical SQL engine.", iconId: "database" }
    ]
  },

  "analytics-viz": {
    id: "analytics-viz",
    title: "VISUALIZATION LAYER",
    subtitle: "Data presentation and charting",
    selectionMode: "single",
    options: [
      { id: "streamlit", title: "Streamlit", category: "VISUALIZATION", tagline: "Interactive data apps", description: "Turn analysis scripts into interactive web dashboards.", iconId: "analytics" },
      { id: "matplotlib", title: "Matplotlib / Seaborn", category: "VISUALIZATION", tagline: "Publication plots", description: "Deterministic statistical charts and graphics.", iconId: "analytics" },
      { id: "plotly", title: "Plotly", category: "VISUALIZATION", tagline: "Interactive charts", description: "Zoomable web charts and dashboards.", iconId: "analytics" }
    ]
  },

  "software-ux": {
    id: "software-ux",
    title: "USER EXPERIENCE",
    subtitle: "How users interact",
    selectionMode: "single",
    options: [
      { id: "desktop-ux", title: "Desktop GUI", category: "UX", tagline: "Windowed app", description: "Native or cross-platform desktop UI.", iconId: "desktop" },
      { id: "cli-ux", title: "Command Line", category: "UX", tagline: "Terminal-driven", description: "Terminal and scripting interface.", iconId: "cli" },
      { id: "background-ux", title: "Background / Daemon", category: "UX", tagline: "Headless service", description: "Runs without a user interface.", iconId: "system" }
    ]
  },

  "software-features": {
    id: "software-features",
    title: "CAPABILITIES",
    subtitle: "Core things it does",
    selectionMode: "multiple",
    options: [
      { id: "file-mgmt", title: "File Management", category: "CAPABILITY", tagline: "Files & folders", description: "Reading, writing, organizing files.", iconId: "system" },
      { id: "data-processing", title: "Data Processing", category: "CAPABILITY", tagline: "Transform data", description: "Parsing, transforming, analyzing data.", iconId: "analytics" },
      { id: "communication-feature", title: "Communication", category: "CAPABILITY", tagline: "Sync & messaging", description: "Network communication and sync.", iconId: "community" },
      { id: "automation-feature", title: "Automation", category: "CAPABILITY", tagline: "Scheduled tasks", description: "Automated, scheduled workflows.", iconId: "automation" }
    ]
  },

  "software-technical": {
    id: "software-technical",
    title: "TECHNICAL",
    subtitle: "How it is built",
    selectionMode: "multiple",
    options: [
      { id: "arch-desktop", title: "DESKTOP APPLICATION", category: "ARCHITECTURE", tagline: "Native OS window", description: "Cross-platform or native desktop app.", iconId: "desktop-app", nextDecisionGroups: ["desktop-shell", "desktop-runtime", "desktop-storage"] },
      { id: "arch-cli", title: "CLI & DEVELOPER UTILITY", category: "ARCHITECTURE", tagline: "Terminal tool", description: "Argument parsing, I/O streaming, automation.", iconId: "cli-utility", nextDecisionGroups: ["cli-language", "cli-framework", "cli-distribution"] },
      { id: "arch-backend", title: "BACKEND & API SERVICE", category: "ARCHITECTURE", tagline: "Server service", description: "Headless services, APIs, task queues.", iconId: "backend-service", nextDecisionGroups: ["service-runtime", "service-api", "service-datastore"] }
    ]
  },

  "desktop-shell": {
    id: "desktop-shell",
    title: "APP SHELL",
    subtitle: "Window & packaging",
    selectionMode: "single",
    options: [
      { id: "electron", title: "Electron", category: "SHELL", tagline: "Chromium + Node", description: "Web tech packaged as desktop.", iconId: "shell" },
      { id: "tauri", title: "Tauri", category: "SHELL", tagline: "Rust light shell", description: "Tiny secure desktop shell.", iconId: "shell" },
      { id: "qt", title: "Qt", category: "SHELL", tagline: "Native toolkit", description: "Mature native desktop toolkit.", iconId: "shell" }
    ]
  },
  "desktop-runtime": {
    id: "desktop-runtime",
    title: "CORE RUNTIME",
    subtitle: "Language & process model",
    selectionMode: "single",
    options: [
      { id: "rust", title: "Rust", category: "RUNTIME", tagline: "Memory-safe perf", description: "Fast and safe systems language.", iconId: "runtime" },
      { id: "nodejs", title: "Node.js", category: "RUNTIME", tagline: "JS runtime", description: "Event-driven JS runtime.", iconId: "runtime" },
      { id: "python-rt", title: "Python", category: "RUNTIME", tagline: "Batteries included", description: "Rapid development ecosystem.", iconId: "runtime" }
    ]
  },
  "desktop-storage": {
    id: "desktop-storage",
    title: "LOCAL STORAGE",
    subtitle: "Persistence",
    selectionMode: "single",
    options: [
      { id: "sqlite-local", title: "SQLite", category: "STORAGE", tagline: "Embedded SQL", description: "Zero-config embedded SQL.", iconId: "database" },
      { id: "leveldb", title: "LevelDB", category: "STORAGE", tagline: "Key-value", description: "Fast embedded KV store.", iconId: "database" },
      { id: "flat-files", title: "Flat Files", category: "STORAGE", tagline: "JSON files", description: "File-backed small state.", iconId: "database" }
    ]
  },

  "cli-language": {
    id: "cli-language",
    title: "IMPLEMENTATION LANGUAGE",
    subtitle: "Primary language",
    selectionMode: "single",
    options: [
      { id: "python-cli", title: "Python", category: "LANGUAGE", tagline: "Scripting", description: "Fast to write with rich CLI libs.", iconId: "devtools" },
      { id: "go", title: "Go", category: "LANGUAGE", tagline: "Single binary", description: "Fast, dependency-free binaries.", iconId: "devtools" },
      { id: "rust-cli", title: "Rust", category: "LANGUAGE", tagline: "Fast & safe", description: "High-performance CLI tools.", iconId: "devtools" }
    ]
  },
  "cli-framework": {
    id: "cli-framework",
    title: "CLI FRAMEWORK",
    subtitle: "Parsing & subcommands",
    selectionMode: "single",
    options: [
      { id: "click", title: "Click", category: "CLI", tagline: "Python CLI toolkit", description: "Composable Python CLI builder.", iconId: "framework" },
      { id: "cobra", title: "Cobra", category: "CLI", tagline: "Go commands", description: "Structured commands for Go.", iconId: "framework" },
      { id: "clap", title: "Clap", category: "CLI", tagline: "Rust parser", description: "Ergonomic Rust arg parsing.", iconId: "framework" }
    ]
  },
  "cli-distribution": {
    id: "cli-distribution",
    title: "DISTRIBUTION",
    subtitle: "How users install it",
    selectionMode: "single",
    options: [
      { id: "pipx", title: "pipx / PyPI", category: "DISTRIBUTION", tagline: "Isolated Python", description: "Install Python CLIs in isolation.", iconId: "cloud" },
      { id: "homebrew", title: "Homebrew", category: "DISTRIBUTION", tagline: "macOS/Linux", description: "Package-manager distribution.", iconId: "cloud" },
      { id: "npm-cli", title: "npm / npx", category: "DISTRIBUTION", tagline: "Node registry", description: "Publish and run via npm.", iconId: "cloud" }
    ]
  },

  "service-runtime": {
    id: "service-runtime",
    title: "SERVICE RUNTIME",
    subtitle: "Language & server core",
    selectionMode: "single",
    options: [
      { id: "nodejs-svc", title: "Node.js", category: "RUNTIME", tagline: "Async event-driven", description: "Non-blocking API runtime.", iconId: "runtime" },
      { id: "go-svc", title: "Go", category: "RUNTIME", tagline: "Concurrent core", description: "Lightweight concurrency.", iconId: "runtime" },
      { id: "python-svc", title: "Python", category: "RUNTIME", tagline: "Data & API", description: "Rich API/data ecosystem.", iconId: "runtime" }
    ]
  },
  "service-api": {
    id: "service-api",
    title: "API LAYER",
    subtitle: "Endpoint contracts",
    selectionMode: "single",
    options: [
      { id: "rest-svc", title: "REST", category: "API", tagline: "Resource HTTP", description: "Conventional HTTP resources.", iconId: "backend" },
      { id: "graphql-svc", title: "GraphQL", category: "API", tagline: "Typed queries", description: "Client-specified queries.", iconId: "backend" },
      { id: "grpc-svc", title: "gRPC", category: "API", tagline: "Binary RPC", description: "Contract-first RPC.", iconId: "backend" }
    ]
  },
  "service-datastore": {
    id: "service-datastore",
    title: "DATASTORE & QUEUES",
    subtitle: "Persistence & async",
    selectionMode: "single",
    options: [
      { id: "postgresql-svc", title: "PostgreSQL", category: "DATASTORE", tagline: "Relational core", description: "ACID relational store.", iconId: "database" },
      { id: "redis", title: "Redis", category: "DATASTORE", tagline: "Cache & queues", description: "Fast cache and pub/sub.", iconId: "database" },
      { id: "kafka", title: "Kafka", category: "DATASTORE", tagline: "Event stream", description: "Durable event streaming.", iconId: "database" }
    ]
  },

  /* ============================================================
     STAGE 6 — INFRASTRUCTURE & DEPLOYMENT DECISION GROUPS
     ============================================================ */

  "infra-game-distro": {
    id: "infra-game-distro",
    title: "DISTRIBUTION PLATFORM",
    subtitle: "Where players get your game",
    selectionMode: "multiple",
    options: [
      { id: "steam", title: "Steam", category: "PLATFORM", tagline: "PC & Steam Deck", description: "Steamworks SDK, cloud saves, and achievements.", iconId: "desktop", nextDecisionGroups: ["steam-features", "infra-game-ci"] },
      { id: "itch", title: "Itch.io", category: "PLATFORM", tagline: "Indie storefront", description: "Direct indie releases and creator-first revenue.", iconId: "cloud", nextDecisionGroups: ["infra-game-ci"] },
      { id: "epic", title: "Epic Games", category: "PLATFORM", tagline: "Epic Online Services", description: "Epic Games store distribution.", iconId: "cloud", nextDecisionGroups: ["infra-game-ci"] },
      { id: "mobile-stores", title: "App Store & Play", category: "PLATFORM", tagline: "Mobile native stores", description: "iOS App Store and Google Play distribution.", iconId: "mobile", nextDecisionGroups: ["infra-game-ci"] },
      { id: "gog", title: "GOG.com", category: "PLATFORM", tagline: "DRM-free PC gaming", description: "Curated DRM-free releases and indie publishing.", iconId: "desktop", nextDecisionGroups: ["infra-game-ci"] }
    ]
  },

  "steam-features": {
    id: "steam-features",
    title: "STEAMWORKS INTEGRATION",
    subtitle: "Steam platform features",
    selectionMode: "multiple",
    options: [
      { id: "steam-achievements", title: "Achievements", category: "STEAM", tagline: "Player milestones", description: "Unlockable achievements tied to Steam profile.", iconId: "interactive" },
      { id: "steam-cloud", title: "Cloud Saves", category: "STEAM", tagline: "Cross-device sync", description: "Seamless save game sync across PC and Steam Deck.", iconId: "cloud" },
      { id: "steamworks-sdk", title: "Steamworks SDK", category: "STEAM", tagline: "Rich presence & auth", description: "Native DRM, leaderboards, and user authentication.", iconId: "devtools" }
    ]
  },

  "infra-game-ci": {
    id: "infra-game-ci",
    title: "GAME BUILD PIPELINE",
    subtitle: "Export & packaging pipeline",
    selectionMode: "single",
    options: [
      { id: "github-actions-game", title: "GitHub Actions", category: "CI/CD", tagline: "Export matrix automation", description: "Automated engine builds for Win/Mac/Linux.", iconId: "automation", nextDecisionGroups: ["infra-monitoring"] },
      { id: "butler-ci", title: "Butler Push", category: "CI/CD", tagline: "Direct channel push", description: "Automated command-line pushing to channels.", iconId: "cloud", nextDecisionGroups: ["infra-monitoring"] },
      { id: "manual-export", title: "Manual Engine Export", category: "CI/CD", tagline: "Local editor build", description: "Direct manual export via the engine UI.", iconId: "devtools", nextDecisionGroups: ["infra-monitoring"] }
    ]
  },

  "infra-web-hosting": {
    id: "infra-web-hosting",
    title: "HOSTING & RUNTIME",
    subtitle: "Where your application runs",
    selectionMode: "single",
    options: [
      { id: "vercel-host", title: "Vercel", category: "HOSTING", tagline: "Frontend edge cloud", description: "Zero-config edge SSR and instant previews.", iconId: "cloud", nextDecisionGroups: ["vercel-features", "infra-web-ci", "infra-monitoring"] },
      { id: "aws-infra", title: "AWS Cloud", category: "HOSTING", tagline: "ECS / S3 / Lambda", description: "Scalable enterprise cloud architecture.", iconId: "cloud", nextDecisionGroups: ["infra-web-ci", "infra-monitoring"] },
      { id: "cloudflare-infra", title: "Cloudflare", category: "HOSTING", tagline: "Pages & Workers", description: "Hyper-fast distributed edge compute.", iconId: "cloud", nextDecisionGroups: ["infra-web-ci", "infra-monitoring"] },
      { id: "self-hosted-vps", title: "Self-Hosted VPS", category: "HOSTING", tagline: "Docker & Linux", description: "Dedicated VPS or container cluster.", iconId: "cloud", nextDecisionGroups: ["infra-web-ci", "infra-monitoring"] },
      { id: "fly-io", title: "Fly.io", category: "HOSTING", tagline: "Global micro-VMs", description: "Deploy app servers close to users worldwide.", iconId: "cloud", nextDecisionGroups: ["infra-web-ci", "infra-monitoring"] },
      { id: "coolify", title: "Coolify", category: "HOSTING", tagline: "Self-hosted PaaS", description: "Open-source self-hosted Heroku and Netlify alternative.", iconId: "cloud", nextDecisionGroups: ["infra-web-ci", "infra-monitoring"] }
    ]
  },

  "vercel-features": {
    id: "vercel-features",
    title: "VERCEL CAPABILITIES",
    subtitle: "Edge and deployment features",
    selectionMode: "multiple",
    options: [
      { id: "preview-deployments", title: "Preview Deployments", category: "VERCEL", tagline: "PR staging URLs", description: "Isolated preview URL generated for every git pull request.", iconId: "cloud" },
      { id: "edge-functions", title: "Edge Functions", category: "VERCEL", tagline: "Low-latency compute", description: "Sub-millisecond global serverless compute.", iconId: "backend" },
      { id: "env-management", title: "Environment Vault", category: "VERCEL", tagline: "Encrypted variables", description: "Encrypted per-branch secrets and environment variables.", iconId: "security" }
    ]
  },

  "infra-web-ci": {
    id: "infra-web-ci",
    title: "DEPLOYMENT PIPELINE",
    subtitle: "Delivery automation",
    selectionMode: "single",
    options: [
      { id: "gh-actions-web", title: "GitHub Actions", category: "CI/CD", tagline: "Lint, test & deploy", description: "Automated checks and deployment on PR merge.", iconId: "automation", nextDecisionGroups: ["infra-security"] },
      { id: "gitlab-ci", title: "GitLab CI", category: "CI/CD", tagline: "Integrated runner", description: "Built-in GitLab CI/CD pipeline.", iconId: "automation", nextDecisionGroups: ["infra-security"] },
      { id: "git-push-auto", title: "Git Push Hook", category: "CI/CD", tagline: "Continuous deployment", description: "Platform auto-build on git push.", iconId: "cloud", nextDecisionGroups: ["infra-security"] }
    ]
  },

  "infra-sw-distro": {
    id: "infra-sw-distro",
    title: "DISTRIBUTION CHANNELS",
    subtitle: "How software reaches users",
    selectionMode: "multiple",
    options: [
      { id: "github-releases", title: "GitHub Releases", category: "DISTRIBUTION", tagline: "Release binaries", description: "Packaged installers and tagged releases.", iconId: "cloud", nextDecisionGroups: ["infra-sw-ci"] },
      { id: "package-managers", title: "Homebrew / Winget", category: "DISTRIBUTION", tagline: "Terminal package managers", description: "One-line installation via CLI package managers.", iconId: "devtools", nextDecisionGroups: ["infra-sw-ci"] },
      { id: "docker-hub", title: "Docker Registry", category: "DISTRIBUTION", tagline: "Container image", description: "OCI container image for server/CLI tools.", iconId: "cloud", nextDecisionGroups: ["infra-sw-ci"] }
    ]
  },

  "infra-sw-ci": {
    id: "infra-sw-ci",
    title: "CROSS-COMPILE PIPELINE",
    subtitle: "Multi-platform binary generation",
    selectionMode: "single",
    options: [
      { id: "gh-actions-matrix", title: "GitHub Actions Matrix", category: "CI/CD", tagline: "Multi-OS build matrix", description: "Simultaneous Linux, Windows, macOS binary builds.", iconId: "automation", nextDecisionGroups: ["infra-monitoring"] },
      { id: "code-signing-ci", title: "Signing & Notarization", category: "SECURITY", tagline: "Authenticode & Notary", description: "Cryptographically signed and notarized binaries.", iconId: "security", nextDecisionGroups: ["infra-monitoring"] }
    ]
  },

  "infra-monitoring": {
    id: "infra-monitoring",
    title: "OBSERVABILITY & MONITORING",
    subtitle: "Health, telemetry & errors",
    selectionMode: "multiple",
    options: [
      { id: "sentry", title: "Sentry", category: "MONITORING", tagline: "Error & crash tracking", description: "Real-time exception alerts with full stack traces.", iconId: "security" },
      { id: "prometheus-grafana", title: "Prometheus + Grafana", category: "MONITORING", tagline: "Metrics & dashboards", description: "Time-series server resource tracking.", iconId: "analytics" },
      { id: "datadog", title: "Datadog", category: "MONITORING", tagline: "APM & trace logging", description: "Full-stack application performance tracing.", iconId: "analytics" },
      { id: "game-telemetry", title: "Telemetry & Events", category: "MONITORING", tagline: "Player engagement events", description: "Event-based telemetry and funnel analytics.", iconId: "analytics" },
      { id: "opentelemetry", title: "OpenTelemetry", category: "MONITORING", tagline: "Vendor-neutral telemetry", description: "Unified open standards for traces, metrics, and logs.", iconId: "analytics" }
    ]
  },

  "infra-security": {
    id: "infra-security",
    title: "SECURITY & COMPLIANCE",
    subtitle: "Protection & access control",
    selectionMode: "multiple",
    options: [
      { id: "tls-ssl", title: "TLS / HTTPS", category: "SECURITY", tagline: "Automated certificates", description: "Encrypted traffic and modern TLS.", iconId: "security" },
      { id: "secrets-vault", title: "Secrets Management", category: "SECURITY", tagline: "KMS / Vault", description: "Encrypted secret and token injection.", iconId: "security" },
      { id: "waf-ddos", title: "WAF & DDoS Shield", category: "SECURITY", tagline: "Edge rate limiting", description: "Protection against abusive traffic and bots.", iconId: "security" }
    ]
  }
};

/* ──────────────────────────────
   INFRASTRUCTURE ENTRY POINTS BY PROJECT TYPE (Stage 6)
   ────────────────────────────── */
export const INFRA_GROUPS_BY_TYPE = {
  game: ["infra-game-distro", "infra-game-ci", "infra-monitoring"],
  website: ["infra-web-hosting", "infra-web-ci", "infra-monitoring"],
  software: ["infra-sw-distro", "infra-sw-ci", "infra-monitoring"]
};

export function getInfraGroupsForType(typeId) {
  return INFRA_GROUPS_BY_TYPE[typeId] || ["infra-monitoring"];
}

/**
 * Convenience: returns the root decision-group ids for a project type.
 * Falls back to an empty list for unknown types.
 */
export function getRootGroupsForType(typeId) {
  return ROOT_GROUPS_BY_TYPE[typeId] || [];
}

/**
 * Resolves a single decision group by id.
 */
export function getDecisionGroup(groupId) {
  return DECISION_GROUPS[groupId] || null;
}

/**
 * Resolves a decision group's options into materialisable nodes.
 */
export function resolveGroupOptions(groupId) {
  const group = DECISION_GROUPS[groupId];
  if (!group) return [];
  return group.options.map(opt => ({
    ...opt,
    groupId,
    selectionMode: group.selectionMode,
    groupTitle: group.title
  }));
}

/** Stable id for a materialised option node. */
export function nodeIdForOption(groupId, optionId) {
  return `${groupId}::${optionId}`;
}

/* ──────────────────────────────
   CANONICAL VOCABULARY CONFIG (74 Decision Groups)
   ────────────────────────────── */
export const GROUP_VOCABULARY_CONFIG = Object.freeze({
  "game-direction": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.FOCUS },
  "game-genre": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.FOCUS },
  "game-gameplay": { nodeType: NODE_TYPES.MECHANIC, stage: STAGES.FOCUS },
  "game-experience": { nodeType: NODE_TYPES.EXPERIENCE, stage: STAGES.FOCUS },
  "game-rpg-combat": { nodeType: NODE_TYPES.MECHANIC, stage: STAGES.FOCUS },
  "game-rpg-progression": { nodeType: NODE_TYPES.SYSTEM, stage: STAGES.FOCUS },
  "game-rpg-quests": { nodeType: NODE_TYPES.SYSTEM, stage: STAGES.FOCUS },
  "game-exploration": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.FOCUS },
  "game-platform-movement": { nodeType: NODE_TYPES.MECHANIC, stage: STAGES.FOCUS },
  "game-horror-tension": { nodeType: NODE_TYPES.EXPERIENCE, stage: STAGES.FOCUS },
  "game-strategy-scope": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.FOCUS },
  "game-puzzle-structure": { nodeType: NODE_TYPES.MECHANIC, stage: STAGES.FOCUS },
  "game-technical": { nodeType: NODE_TYPES.ARCHITECTURE, stage: STAGES.ARCHITECTURE },
  "game-2d-engine": { nodeType: NODE_TYPES.ENGINE, stage: STAGES.TECHNOLOGY },
  "game-3d-engine": { nodeType: NODE_TYPES.ENGINE, stage: STAGES.TECHNOLOGY },
  "game-web-engine": { nodeType: NODE_TYPES.ENGINE, stage: STAGES.TECHNOLOGY },
  "godot-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "godot-rendering": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "godot-physics": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "unity-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "web-game-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "gamemaker-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "defold-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "love2d-libraries": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "raylib-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "bevy-systems": { nodeType: NODE_TYPES.ARCHITECTURE, stage: STAGES.TECHNOLOGY },
  "game-visual-scripting": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "game-2d-physics": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "game-save-system": { nodeType: NODE_TYPES.DATABASE, stage: STAGES.TECHNOLOGY },
  "game-combat-model": { nodeType: NODE_TYPES.MECHANIC, stage: STAGES.FOCUS },
  "site-purpose": { nodeType: NODE_TYPES.PURPOSE, stage: STAGES.FOCUS },
  "site-experience": { nodeType: NODE_TYPES.EXPERIENCE, stage: STAGES.FOCUS },
  "site-features": { nodeType: NODE_TYPES.FEATURE, stage: STAGES.FOCUS },
  "site-auth": { nodeType: NODE_TYPES.SECURITY, stage: STAGES.TECHNOLOGY },
  "site-ecommerce-payment": { nodeType: NODE_TYPES.SERVICE, stage: STAGES.TECHNOLOGY },
  "site-payments": { nodeType: NODE_TYPES.SERVICE, stage: STAGES.TECHNOLOGY },
  "stripe-features": { nodeType: NODE_TYPES.INTEGRATION, stage: STAGES.TECHNOLOGY },
  "site-technical": { nodeType: NODE_TYPES.ARCHITECTURE, stage: STAGES.ARCHITECTURE },
  "site-frontend": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "frontend-state": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "frontend-ui-system": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "site-backend": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "backend-api-style": { nodeType: NODE_TYPES.API, stage: STAGES.TECHNOLOGY },
  "site-database": { nodeType: NODE_TYPES.DATABASE, stage: STAGES.TECHNOLOGY },
  "data-model": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.TECHNOLOGY },
  "site-realtime": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "site-deployment": { nodeType: NODE_TYPES.DEPLOYMENT, stage: STAGES.INFRASTRUCTURE },
  "software-purpose": { nodeType: NODE_TYPES.PURPOSE, stage: STAGES.FOCUS },
  "software-devtools-type": { nodeType: NODE_TYPES.CONCEPT, stage: STAGES.FOCUS },
  "cli-parsing": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "software-analytics-engine": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "analytics-viz": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "software-ux": { nodeType: NODE_TYPES.EXPERIENCE, stage: STAGES.FOCUS },
  "software-features": { nodeType: NODE_TYPES.FEATURE, stage: STAGES.FOCUS },
  "software-technical": { nodeType: NODE_TYPES.ARCHITECTURE, stage: STAGES.ARCHITECTURE },
  "desktop-shell": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "desktop-runtime": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "desktop-storage": { nodeType: NODE_TYPES.DATABASE, stage: STAGES.TECHNOLOGY },
  "cli-language": { nodeType: NODE_TYPES.LANGUAGE, stage: STAGES.TECHNOLOGY },
  "cli-framework": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "cli-distribution": { nodeType: NODE_TYPES.DISTRIBUTION, stage: STAGES.INFRASTRUCTURE },
  "service-runtime": { nodeType: NODE_TYPES.TECHNOLOGY, stage: STAGES.TECHNOLOGY },
  "service-api": { nodeType: NODE_TYPES.API, stage: STAGES.TECHNOLOGY },
  "service-datastore": { nodeType: NODE_TYPES.DATABASE, stage: STAGES.TECHNOLOGY },
  "infra-game-distro": { nodeType: NODE_TYPES.DISTRIBUTION, stage: STAGES.INFRASTRUCTURE },
  "steam-features": { nodeType: NODE_TYPES.INTEGRATION, stage: STAGES.INFRASTRUCTURE },
  "infra-game-ci": { nodeType: NODE_TYPES.INFRASTRUCTURE, stage: STAGES.INFRASTRUCTURE },
  "infra-web-hosting": { nodeType: NODE_TYPES.DEPLOYMENT, stage: STAGES.INFRASTRUCTURE },
  "vercel-features": { nodeType: NODE_TYPES.INTEGRATION, stage: STAGES.INFRASTRUCTURE },
  "infra-web-ci": { nodeType: NODE_TYPES.INFRASTRUCTURE, stage: STAGES.INFRASTRUCTURE },
  "infra-sw-distro": { nodeType: NODE_TYPES.DISTRIBUTION, stage: STAGES.INFRASTRUCTURE },
  "infra-sw-ci": { nodeType: NODE_TYPES.INFRASTRUCTURE, stage: STAGES.INFRASTRUCTURE },
  "infra-monitoring": { nodeType: NODE_TYPES.MONITORING, stage: STAGES.INFRASTRUCTURE },
  "infra-security": { nodeType: NODE_TYPES.SECURITY, stage: STAGES.INFRASTRUCTURE }
});

// Auto-decorate all group options with canonical nodeType and stage
Object.entries(DECISION_GROUPS).forEach(([gid, group]) => {
  const cfg = GROUP_VOCABULARY_CONFIG[gid] || {};
  if (Array.isArray(group.options)) {
    group.options.forEach(opt => {
      if (!opt.nodeType) opt.nodeType = cfg.nodeType || NODE_TYPES.DECISION;
      if (!opt.stage) opt.stage = cfg.stage || null;
    });
  }
});

