/**
 * DEVPATH // Knowledge Registry Assembly
 * ------------------------------------------------------------------
 * The single place where every domain's seeds are registered into the
 * shared knowledge graph and their entry points wired up.
 *
 * Adding a new domain is two lines here plus its data file. Nothing
 * else in the app needs to change — the renderer, layout engine and
 * frontier are all domain-agnostic.
 * ------------------------------------------------------------------
 */

import { knowledgeGraph as graph, registerRoots } from "./data/knowledgeGraph.js";
import { GAME_SEEDS, GAME_ENTRY_IDS } from "./data/gameSeeds.js";

/**
 * Synthetic root. Every project type's entry seeds are unlocked from here,
 * which lets the frontier start from a single committed node rather than
 * special-casing "nothing chosen yet" throughout the traversal logic.
 */
export const ROOT_SEED_ID = "__root__";

let assembled = false;

/** Registers every domain. Safe to call repeatedly. */
export function assembleKnowledge() {
  if (assembled) return graph;

  graph.registerAll(GAME_SEEDS);
  registerRoots("game", GAME_ENTRY_IDS);

  // The root unlocks every type's entry seeds. Declared as inline objects
  // referencing the real seeds by id, so nothing is duplicated.
  graph.register({
    id: ROOT_SEED_ID,
    kind: "start",
    title: "Start",
    unlocks: Object.values({
      game: GAME_ENTRY_IDS
    }).flat()
  });

  assembled = true;
  return graph;
}

/** The shared knowledge graph instance, assembled once at boot. */
export const knowledgeGraph = graph;

export const DOMAIN_ENTRY_IDS = {
  game: GAME_ENTRY_IDS
};