/**
 * DEVPATH // Frontier Model
 * ------------------------------------------------------------------
 * The living roadmap. Holds:
 *   - committed[]  : the path the user has actually chosen, in order
 *   - offered[]    : the choices currently available at the frontier
 *   - blocked{}    : seeds hidden by exclusion rules
 *
 * There are no stages. There is only "what is available next".
 *
 * Invariants this model enforces:
 *   1. Every offered seed is reachable from at least one committed node.
 *   2. Committed seeds never appear in offered (no re-choosing).
 *   3. Excluded seeds never appear in offered.
 *   4. A seed with `requires` only appears once every requirement is
 *      committed (multi-parent convergence).
 *   5. Committing a "single" seed removes its siblings from offered.
 * ------------------------------------------------------------------
 */

import { PathNode } from "./data/knowledgeGraph.js";

export class Frontier {
  constructor(graph) {
    this.graph = graph;
    this.committed = [];      // PathNode[] in choice order
    this.offered = [];        // Seed[] currently available
    this.pathIndex = new Map(); // seedId -> PathNode
  }

  reset() {
    this.committed = [];
    this.offered = [];
    this.pathIndex.clear();
  }

  has(seedId) {
    return this.pathIndex.has(seedId);
  }

  getNode(seedId) {
    return this.pathIndex.get(seedId) || null;
  }

  get committedIds() {
    return new Set(this.pathIndex.keys());
  }

  /** Seeds explicitly excluded by anything already committed. */
  getExcludedIds() {
    const excluded = new Set();
    this.committed.forEach(node => {
      const seed = this.graph.get(node.seedId);
      if (seed) seed.excludes.forEach(id => excluded.add(id));
    });
    return excluded;
  }

  /**
   * Recomputes `offered` from scratch based on the current committed
   * path. Cheap enough to call after every choice; keeps the frontier
   * a pure function of the path (no incremental drift).
   */
  recompute() {
    const committedIds = this.committedIds;
    const excluded = this.getExcludedIds();
    const seen = new Map();

    // 1. Gather every candidate unlocked by a committed node.
    this.committed.forEach(node => {
      this.graph.getChildrenOf(node.seedId).forEach(seed => {
        if (!seen.has(seed.id)) seen.set(seed.id, seed);
      });
    });

    // 2. Filter.
    const offered = [];
    seen.forEach(seed => {
      if (committedIds.has(seed.id)) return;        // already chosen
      if (excluded.has(seed.id)) return;            // excluded
      if (seed.requires.length > 0) {               // convergence gate
        const allMet = seed.requires.every(req => committedIds.has(req));
        if (!allMet) return;
      }
      offered.push(seed);
    });

    // 3. Exclusivity: a committed seed suppresses only seeds that share
    //    BOTH its parent and its group id. Independent topics under the
    //    same parent (e.g. "room generation" vs "room types") coexist.
    const suppressed = new Set();
    this.committed.forEach(node => {
      const seed = this.graph.get(node.seedId);
      if (!seed || !seed.group) return;
      const parentNode = node.parentId
        ? this.committed.find(p => p.id === node.parentId)
        : null;
      if (!parentNode) return;
      this.graph.getChildrenOf(parentNode.seedId).forEach(sib => {
        if (sib.id !== seed.id && sib.group === seed.group) suppressed.add(sib.id);
      });
    });

    this.offered = offered.filter(seed => !suppressed.has(seed.id));
    return this.offered;
  }

  /**
   * Siblings = other seeds unlocked by the same parent. Used to enforce
   * single-choice groups without needing explicit group objects.
   */
  getSiblingsOf(seedId) {
    const siblings = [];
    this.committed.forEach(node => {
      this.graph.getChildrenOf(node.seedId).forEach(child => {
        if (child.id !== seedId) siblings.push(child);
      });
    });
    return siblings;
  }

  /**
   * Commits a seed to the path. Returns the created PathNode, or null
   * if the seed was not actually available.
   */
  commit(seedId, parentId = null) {
    if (this.has(seedId)) return this.getNode(seedId);

    const seed = this.graph.get(seedId);
    if (!seed) return null;

    // Resolve the parent from the GRAPH, not from recency. A seed may be
    // unlocked by an ancestor chosen several steps ago (e.g. "rl-monsters"
    // is unlocked by "rl-dungeon"), so defaulting to lastCommitted() would
    // attribute it to the wrong node and corrupt suppression + rollback.
    let parentNode = parentId ? this.getNode(parentId) : null;
    if (!parentNode) {
      parentNode = this.findUnlocker(seedId);
    }
    if (!parentNode) {
      parentNode = this.lastCommitted();
    }

    const depth = parentNode ? parentNode.depth + 1 : 0;

    const node = new PathNode({
      id: `path::${seed.id}`,
      seedId: seed.id,
      kind: seed.kind,
      title: seed.title,
      category: seed.category,
      tagline: seed.tagline,
      description: seed.description,
      iconId: seed.iconId,
      lane: seed.lane,
      parentId: parentNode ? parentNode.id : null,
      status: "committed",
      chosenAt: this.committed.length,
      depth,
      metadata: { ...seed.metadata, technical: seed.technical }
    });

    this.committed.push(node);
    this.pathIndex.set(seed.id, node);

    if (parentNode && !parentNode.children.includes(node.id)) {
      parentNode.children.push(node.id);
    }

    this.recompute();
    return node;
  }

  /**
   * Finds the committed node that actually unlocks `seedId`.
   * Searched from the most recent choice backwards, so when several
   * committed nodes could unlock the same seed (shared branches) we
   * attach it to the nearest one.
   */
  findUnlocker(seedId) {
    for (let i = this.committed.length - 1; i >= 0; i--) {
      const candidate = this.committed[i];
      const children = this.graph.getChildrenOf(candidate.seedId);
      if (children.some(c => c.id === seedId)) return candidate;
    }
    return null;
  }

  /** Removes the most recent choice and everything after it. */
  rollbackTo(seedId = null) {
    if (seedId === null) {
      if (this.committed.length === 0) return [];
      const last = this.committed[this.committed.length - 1];
      return this.rollbackTo(last.seedId);
    }

    const idx = this.committed.findIndex(n => n.seedId === seedId);
    if (idx === -1) return [];

    const removed = this.committed.slice(idx);
    this.committed = this.committed.slice(0, idx);

    removed.forEach(node => {
      this.pathIndex.delete(node.seedId);
      const parent = node.parentId ? this.committed.find(p => p.id === node.parentId) : null;
      if (parent) {
        parent.children = parent.children.filter(id => id !== node.id);
      }
    });

    this.recompute();
    return removed;
  }

  lastCommitted() {
    return this.committed.length > 0 ? this.committed[this.committed.length - 1] : null;
  }

  /** The node a new choice should attach to (the deepest committed leaf). */
  frontierParent() {
    return this.lastCommitted();
  }

  /**
   * Depth-first walk of the committed spine, used by branch navigation.
   * Returns nodes in the order the user chose them.
   */
  spine() {
    return [...this.committed];
  }

  /** Counts how many choices are still open at the frontier. */
  get openCount() {
    return this.offered.length;
  }

  get isEmpty() {
    return this.committed.length === 0;
  }

  get isComplete() {
    return this.committed.length > 0 && this.offered.length === 0;
  }

  /** Serializable snapshot for the roadmap export. */
  toManifest(projectName = "") {
    return {
      version: "2.0",
      model: "graph-first",
      projectName,
      generatedAt: new Date().toISOString(),
      totalDecisions: this.committed.length,
      maxDepth: this.committed.reduce((m, n) => Math.max(m, n.depth), 0),
      openFrontier: this.offered.length,
      path: this.committed.map(n => ({
        step: n.chosenAt + 1,
        id: n.seedId,
        kind: n.kind,
        title: n.title,
        category: n.category,
        tagline: n.tagline,
        description: n.description,
        parent: n.parentId,
        depth: n.depth,
        technical: n.technical
      })),
      availableNext: this.offered.map(s => ({
        id: s.id,
        kind: s.kind,
        title: s.title,
        category: s.category
      }))
    };
  }
}