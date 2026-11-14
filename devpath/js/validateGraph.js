/**
 * DEVPATH // Knowledge Graph Validator
 * ------------------------------------------------------------------
 * The knowledge graph is authored by hand across several files, so
 * broken references are the most likely authoring mistake. This module
 * makes them impossible to ship silently.
 *
 * Run standalone:
 *   node --input-type=module -e "import('./js/validateGraph.js').then(m=>m.report())"
 *
 * Or call validateGraph() from a test suite / dev console.
 *
 * Checks performed:
 *   1. Duplicate seed ids
 *   2. Dangling `unlocks` references (a link to a seed that doesn't exist)
 *   3. Dangling `requires` / `excludes` references
 *   4. Unreachable seeds (declared but no path to them from any root)
 *   5. Seeds missing a title
 *   6. Cycles in the unlock graph (would make a path loop forever)
 *   7. Convergence seeds whose `requires` can never be satisfied
 * ------------------------------------------------------------------
 */

import { knowledgeGraph } from "./data/knowledgeGraph.js";
import { GAME_SEEDS, GAME_ENTRY_IDS } from "./data/gameSeeds.js";

/**
 * Registers every domain's seeds into a fresh graph so validation is
 * independent of whatever the running app has loaded.
 */
export function buildFullGraph() {
  knowledgeGraph.registerAll(GAME_SEEDS);
  return knowledgeGraph;
}

/** Collects the id of an unlock entry (string ref or inline object). */
function unlockId(entry) {
  if (!entry) return null;
  return typeof entry === "string" ? entry : entry.id;
}

export function validateGraph(graph = knowledgeGraph, rootIds = GAME_ENTRY_IDS) {
  const errors = [];
  const warnings = [];

  const ids = Array.from(graph.seeds.keys());
  const known = new Set(ids);

  // 1. Duplicate ids are impossible in a Map, but detect the *silent
  //    overwrite* case by counting declarations in the source arrays.
  const declared = [];
  GAME_SEEDS.forEach(s => declared.push(s.id));
  const seenOnce = new Set();
  declared.forEach(id => {
    if (seenOnce.has(id)) errors.push(`Duplicate seed id declared: ${id}`);
    seenOnce.add(id);
  });

  // 2 & 3. Reference integrity.
  graph.seeds.forEach(seed => {
    seed.unlocks.forEach(entry => {
      const id = unlockId(entry);
      if (id && !known.has(id)) {
        errors.push(`Dangling unlock: "${seed.id}" -> "${id}"`);
      }
    });
    seed.requires.forEach(req => {
      if (!known.has(req)) errors.push(`Dangling requires: "${seed.id}" -> "${req}"`);
    });
    seed.excludes.forEach(ex => {
      if (!known.has(ex)) errors.push(`Dangling excludes: "${seed.id}" -> "${ex}"`);
    });
  });

  // 4. Reachability from the declared entry points.
  const reachable = new Set();
  const queue = [...rootIds];
  while (queue.length > 0) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    reachable.add(id);
    const seed = graph.get(id);
    if (!seed) continue;
    seed.unlocks.forEach(entry => {
      const childId = unlockId(entry);
      if (childId && !reachable.has(childId)) queue.push(childId);
    });
  }
  ids.forEach(id => {
    if (!reachable.has(id)) warnings.push(`Unreachable seed (no root path): ${id}`);
  });

  // 5. Missing titles.
  graph.seeds.forEach(seed => {
    if (!seed.title) errors.push(`Seed missing title: ${seed.id}`);
  });

  // 6. Cycle detection over the unlock graph.
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map(ids.map(id => [id, WHITE]));
  const stack = [];

  const visit = id => {
    colour.set(id, GREY);
    stack.push(id);
    const seed = graph.get(id);
    if (seed) {
      for (const entry of seed.unlocks) {
        const childId = unlockId(entry);
        if (!childId || !known.has(childId)) continue;
        const c = colour.get(childId);
        if (c === GREY) {
          const loopStart = stack.indexOf(childId);
          errors.push(`Unlock cycle: ${stack.slice(loopStart).concat(childId).join(" -> ")}`);
        } else if (c === WHITE) {
          visit(childId);
        }
      }
    }
    stack.pop();
    colour.set(id, BLACK);
  };

  ids.forEach(id => {
    if (colour.get(id) === WHITE) visit(id);
  });

  // 7. Unsatisfiable convergence: `requires` must be reachable somehow.
  graph.seeds.forEach(seed => {
    seed.requires.forEach(req => {
      if (!reachable.has(req)) {
        warnings.push(`"${seed.id}" requires "${req}" which is itself unreachable`);
      }
    });
  });

  return {
    ok: errors.length === 0,
    seedCount: ids.length,
    reachableCount: reachable.size,
    errors,
    warnings
  };
}

/** Prints a human-readable validation report. */
export function report(graph = buildFullGraph(), rootIds = GAME_ENTRY_IDS) {
  const result = validateGraph(graph, rootIds);
  console.log("─".repeat(62));
  console.log("DEVPATH KNOWLEDGE GRAPH VALIDATION");
  console.log("─".repeat(62));
  console.log(`Seeds declared   : ${result.seedCount}`);
  console.log(`Reachable        : ${result.reachableCount}`);
  console.log(`Errors           : ${result.errors.length}`);
  console.log(`Warnings         : ${result.warnings.length}`);
  if (result.errors.length) {
    console.log("\nERRORS:");
    result.errors.forEach(e => console.log(`  ✗ ${e}`));
  }
  if (result.warnings.length) {
    console.log("\nWARNINGS:");
    result.warnings.forEach(w => console.log(`  ! ${w}`));
  }
  console.log("─".repeat(62));
  console.log(result.ok ? "RESULT: PASS" : "RESULT: FAIL");
  return result;
}