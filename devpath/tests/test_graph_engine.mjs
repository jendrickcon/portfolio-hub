/**
 * DEVPATH // Graph-First Engine Test
 * ------------------------------------------------------------------
 * Proves the core loop without a browser:
 *   1. The knowledge graph resolves a roguelike path step by step.
 *   2. The frontier only ever offers reachable, non-excluded seeds.
 *   3. Single-choice groups suppress their siblings.
 *   4. Convergence (`requires`) gates correctly.
 *   5. Rollback restores an earlier frontier.
 *   6. The incremental layout never overlaps two nodes on a lane.
 *
 * Run: node tests/test_graph_engine.mjs
 */

import { knowledgeGraph, assembleKnowledge } from "../js/knowledge.js";
import { GAME_ENTRY_IDS } from "../js/data/gameSeeds.js";
import { Frontier } from "../js/frontier.js";
import { IncrementalLayout } from "../js/graphLayout.js";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
  console.log("─".repeat(60));
}

// ── Setup ──────────────────────────────────────────────────────
assembleKnowledge();
const frontier = new Frontier(knowledgeGraph);

section("1. Entry frontier");
const entrySeeds = knowledgeGraph.getRootsFor("game");
check("GAME offers genre roots", entrySeeds.length >= 8, `got ${entrySeeds.length}`);
check("Roguelike is offered", entrySeeds.some(s => s.id === "genre-roguelike"));

// ── 2. Walk the roguelike path ─────────────────────────────────
section("2. Roguelike path growth");

// Simulate the app: commit a synthetic root, then choose in order.
frontier.committed = [];
frontier.pathIndex.clear();
knowledgeGraph.register({ id: "__root__", kind: "start", title: "Start", unlocks: GAME_ENTRY_IDS });
frontier.commit("__root__", null);

const step = (seedId, label) => {
  const before = frontier.offered.length;
  const node = frontier.commit(seedId);
  const ok = Boolean(node);
  check(`choose ${label} (${seedId})`, ok, ok ? "" : "seed not found in graph");
  if (ok) console.log(`         frontier: ${before} offered → ${frontier.offered.length} offered`);
  return node;
};

step("genre-roguelike", "Roguelike");
step("rl-dungeon", "Dungeon Exploration");
step("rl-rooms", "Rooms");
step("rl-room-gen", "Room Generation");
step("rl-gen-random", "Procedural Generation");
step("rl-gen-algorithm", "Generation Algorithm");

const offeredAfterAlgo = frontier.offered.map(s => s.id);
check("Algorithm unlocks concrete techniques",
  offeredAfterAlgo.includes("gen-bsp") && offeredAfterAlgo.includes("gen-wfc"),
  offeredAfterAlgo.join(", "));

step("gen-bsp", "BSP Partitioning");

section("3. Single-choice suppression");
// rl-gen-algorithm is mode "single"; choosing gen-bsp must hide gen-cellular/wfc/graph.
const offeredAfterBsp = frontier.offered.map(s => s.id);
check("Sibling algorithms suppressed after choosing one",
  !offeredAfterBsp.includes("gen-cellular") && !offeredAfterBsp.includes("gen-wfc"),
  offeredAfterBsp.join(", "));

section("4. Branching into monsters");
step("rl-monsters", "Monsters");
const monsterOffers = frontier.offered.map(s => s.id);
check("Monsters unlock archetypes, AI, scaling, spawning",
  ["monster-archetypes", "monster-ai", "monster-scaling", "monster-spawning"].every(id => monsterOffers.includes(id)),
  monsterOffers.join(", "));

step("monster-ai", "Enemy AI");
step("ai-behavior-tree", "Behaviour Tree");

section("5. Convergence gate (requires)");
// meta-progression requires save-permadeath, which has not been chosen.
const offersNow = frontier.offered.map(s => s.id);
check("meta-progression NOT offered before its requirement",
  !offersNow.includes("meta-progression"),
  offersNow.join(", "));

section("6. Rollback");
const depthBefore = frontier.committed.length;
// rollbackTo removes the named node AND everything after it, so the
// monster branch should collapse back to the dungeon's frontier.
frontier.rollbackTo("rl-monsters");
check("Rollback removed the monster branch",
  frontier.committed.length < depthBefore,
  `${depthBefore} → ${frontier.committed.length}`);
check("Rollback restored the dungeon frontier",
  frontier.offered.some(s => s.id === "rl-room-types") &&
  frontier.offered.some(s => s.id === "rl-combat"),
  frontier.offered.map(s => s.id).join(", "));
check("Independent topics survive sibling suppression",
  frontier.offered.some(s => s.id === "rl-room-types") &&
  frontier.offered.some(s => s.id === "rl-connections"),
  "room-types/connections were wrongly suppressed");
check("Rollback dropped the rolled-back AI choice",
  !frontier.has("monster-ai"),
  "monster-ai still committed");

section("7. Full path manifest");
const manifest = frontier.toManifest("Test Roguelike");
check("Manifest records the chosen path", manifest.path.length === frontier.committed.length);
check("Manifest is serializable", typeof JSON.stringify(manifest) === "string");
console.log(`         path: ${manifest.path.map(p => p.title).join(" → ")}`);

section("8. Incremental layout never overlaps");
const layout = new IncrementalLayout({ width: 1400 });
layout.setViewport(1400, false);
layout.placeStart({ id: "start", kind: "start", lane: 0, children: [] });

// Place 40 nodes on the same lane; none may overlap horizontally.
for (let i = 0; i < 40; i++) {
  layout.place({ id: `n${i}`, kind: "feature", lane: 4, technical: false, children: [] }, 700);
}
const lane4 = [];
layout.positions.forEach((p, id) => { if (p.lane === 4) lane4.push({ id, ...p }); });
lane4.sort((a, b) => a.x - b.x);
let overlaps = 0;
for (let i = 1; i < lane4.length; i++) {
  if (lane4[i].x < lane4[i - 1].x + lane4[i - 1].width) overlaps++;
}
check("40 same-lane nodes placed without overlap", overlaps === 0, `${overlaps} overlaps`);
check("All 40 nodes were placed", lane4.length === 40, `got ${lane4.length}`);

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log("═".repeat(60));
process.exit(failed === 0 ? 0 : 1);