/**
 * DEVPATH // Knowledge Graph Model
 * ------------------------------------------------------------------
 * The graph-first core. Replaces the stage wizard's decision-group
 * registry with a single recursive knowledge graph.
 *
 * Authoring shape (a "seed"):
 *   {
 *     id, kind, title, tagline, description, iconId,
 *     category?,             // display override
 *     lane?,                 // layout band override
 *     unlocks: [...],        // seeds revealed when this is chosen
 *     requires: [...],       // seeds that must ALSO be chosen first (convergence)
 *     excludes: [...],       // seeds hidden if this is chosen
 *     mode: "single"|"multiple",  // how siblings under the same parent behave
 *     scope: "core"|"optional",
 *     technical: bool        // convenience flag
 *   }
 *
 * `unlocks` entries may be either a seed object (inline) or a string id
 * referencing a seed declared elsewhere in the registry (enables reuse
 * across domains — e.g. a generic "multiplayer" branch reachable from
 * both a roguelike and an FPS without duplicating it).
 * ------------------------------------------------------------------
 */

import { NODE_KINDS, getLaneForKind, getLabelForKind, isTechnicalKind } from "./nodeTypes.js";

/** A single node in the user's living roadmap. */
export class PathNode {
  constructor({
    id,
    kind = NODE_KINDS.CONCEPT,
    title,
    category = null,
    tagline = "",
    description = "",
    iconId = null,
    lane = null,
    parentId = null,
    seedId = null,
    status = "active",     // "active" | "committed" | "available" | "incompatible"
    chosenAt = null,
    depth = 0,
    children = [],
    metadata = {}
  }) {
    this.id = id;
    this.kind = kind;
    this.title = title;
    this.category = category || getLabelForKind(kind);
    this.tagline = tagline;
    this.description = description;
    this.iconId = iconId;
    this.lane = lane === null ? getLaneForKind(kind) : lane;
    this.parentId = parentId;
    this.seedId = seedId;
    this.status = status;
    this.chosenAt = chosenAt;
    this.depth = depth;
    this.children = Array.isArray(children) ? [...children] : [];
    this.metadata = { ...metadata };
    this.technical = isTechnicalKind(kind);
  }

  get isCommitted() {
    return this.status === "committed";
  }
}

/**
 * A seed is a *potential* node: something the user could choose but
 * hasn't yet. Seeds are resolved into PathNodes only when chosen or
 * offered, which is what keeps a large knowledge base from turning
 * into a giant canvas.
 */
export class Seed {
  constructor(raw) {
    this.id = raw.id;
    this.kind = raw.kind || NODE_KINDS.CONCEPT;
    this.title = raw.title || raw.id;
    this.category = raw.category || getLabelForKind(this.kind);
    this.tagline = raw.tagline || "";
    this.description = raw.description || "";
    this.iconId = raw.iconId || null;
    this.lane = raw.lane === undefined ? getLaneForKind(this.kind) : raw.lane;
    // Exclusivity model:
    //   group  = the id of the mutually-exclusive choice set this seed
    //            belongs to. Two seeds with the same non-null group under
    //            the same parent cannot both be chosen.
    //   mode   = "single" (one of a group) | "multi" (independent topic).
    // Seeds without a group are always independent, so a parent can offer
    // "room generation" AND "room types" AND "connections" as separate
    // parallel topics without them excluding one another.
    this.group = raw.group || null;
    this.mode = raw.mode || (this.group ? "single" : "multi");
    this.scope = raw.scope || "core";
    this.technical = raw.technical !== undefined ? raw.technical : isTechnicalKind(this.kind);
    this.unlocks = Array.isArray(raw.unlocks) ? [...raw.unlocks] : [];
    this.requires = Array.isArray(raw.requires) ? [...raw.requires] : [];
    this.excludes = Array.isArray(raw.excludes) ? [...raw.excludes] : [];
    this.metadata = raw.metadata ? { ...raw.metadata } : {};
  }
}

/** Normalises `unlocks` entries into plain seed objects. */
function resolveUnlockEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { id: entry, _ref: true };
  return entry;
}

/**
 * The knowledge registry. Holds every seed the app can offer, plus
 * the traversal rules that decide what becomes available next.
 */
export class KnowledgeGraph {
  constructor(seeds = [], roots = {}) {
    this.seeds = new Map();
    this.roots = { ...roots };
    this.registerAll(seeds);
  }

  registerAll(seeds) {
    (seeds || []).forEach(s => this.register(s));
    return this;
  }

  register(raw) {
    if (!raw || !raw.id) return null;
    const seed = raw instanceof Seed ? raw : new Seed(raw);
    this.seeds.set(seed.id, seed);
    return seed;
  }

  has(seedId) {
    return this.seeds.has(seedId);
  }

  get(seedId) {
    return this.seeds.get(seedId) || null;
  }

  /** All seeds belonging to a project type's entry set. */
  getRootsFor(typeId) {
    return (this.roots[typeId] || []).map(id => this.get(id)).filter(Boolean);
  }

  /**
   * Resolves the children offered beneath a chosen seed.
   * String references are looked up; inline objects are registered on
   * demand so a branch can be declared once and reused anywhere.
   */
  getChildrenOf(seedId) {
    const seed = this.get(seedId);
    if (!seed) return [];

    const out = [];
    seed.unlocks.forEach(entry => {
      const raw = resolveUnlockEntry(entry);
      if (!raw) return;

      if (raw._ref) {
        const ref = this.get(raw.id);
        if (ref) out.push(ref);
        return;
      }

      // Inline declaration: register so it can be referenced later.
      const registered = this.has(raw.id) ? this.get(raw.id) : this.register(raw);
      if (registered) out.push(registered);
    });

    return out;
  }

  /** Convenience: seeds offered at the very start of a project type. */
  getEntrySeeds(typeId) {
    return this.getRootsFor(typeId);
  }
}

export const knowledgeGraph = new KnowledgeGraph();

/**
 * Wires a project type's entry seeds into the graph. Called once per
 * domain at startup so `getRootsFor(typeId)` resolves.
 */
export function registerRoots(typeId, seedIds) {
  knowledgeGraph.roots[typeId] = [...(seedIds || [])];
  return knowledgeGraph;
}