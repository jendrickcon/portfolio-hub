/**
 * DEVPATH // Incremental Graph Layout
 * ------------------------------------------------------------------
 * Replaces the per-stage positioning functions (getStage2Positions …
 * getStage7Positions). There is no notion of a "stage" here: nodes are
 * placed by KIND (which determines a lane) and by their parent (which
 * determines horizontal placement).
 *
 * The key property is INCREMENTALITY: when the user makes a choice we
 * place only the newly-committed node and the newly-offered children.
 * Existing nodes never move, so the canvas grows smoothly and the
 * camera can simply follow the new content instead of re-fitting.
 * ------------------------------------------------------------------
 */

import { getLaneForKind } from "./data/nodeTypes.js";

export const NODE_DIMENSIONS = {
  start: { width: 320, height: 120 },
  spine: { width: 300, height: 108 },
  branch: { width: 250, height: 132 },
  technical: { width: 236, height: 118 },
  compact: { width: 210, height: 96 }
};

export const LANE_HEIGHT = 210;
export const SIBLING_GAP = 34;
export const CANVAS_ORIGIN = { x: 0, y: 0 };

export class IncrementalLayout {
  constructor(options = {}) {
    this.isMobile = Boolean(options.isMobile);
    this.positions = new Map();   // nodeId -> { x, y, width, height, lane }
    this.laneOccupancy = new Map(); // lane -> array of { x, width } occupied spans
    this.width = options.width || 1400;
  }

  setViewport(width, isMobile = false) {
    this.width = width;
    this.isMobile = isMobile;
  }

  reset() {
    this.positions.clear();
    this.laneOccupancy.clear();
  }

  get size() {
    return this.positions.size;
  }

  dimensionsFor(node) {
    if (node.kind === "start") return NODE_DIMENSIONS.start;
    if (this.isMobile) return NODE_DIMENSIONS.compact;
    if (node.technical) return NODE_DIMENSIONS.technical;
    if (node.children && node.children.length > 0) return NODE_DIMENSIONS.spine;
    return NODE_DIMENSIONS.branch;
  }

  getPosition(nodeId) {
    return this.positions.get(nodeId) || null;
  }

  has(nodeId) {
    return this.positions.has(nodeId);
  }

  /** Horizontal span already taken on a lane. */
  occupiedSpans(lane) {
    if (!this.laneOccupancy.has(lane)) this.laneOccupancy.set(lane, []);
    return this.laneOccupancy.get(lane);
  }

  /** True if [x, x+width] is free of every occupied span on the lane. */
  isFree(lane, x, width) {
    return this.occupiedSpans(lane).every(span => {
      return x + width + SIBLING_GAP <= span.x || x >= span.x + span.width + SIBLING_GAP;
    });
  }

  reserve(lane, x, width) {
    this.occupiedSpans(lane).push({ x, width });
  }

  release(nodeId) {
    const pos = this.positions.get(nodeId);
    if (!pos) return;
    const spans = this.occupiedSpans(pos.lane);
    const idx = spans.findIndex(s => s.x === pos.x && s.width === pos.width);
    if (idx !== -1) spans.splice(idx, 1);
    this.positions.delete(nodeId);
  }

  /**
   * Places a single node. If `preferredX` is blocked on its lane, the
   * layout searches outward from it — alternating right then left — so
   * a branch widens instead of overlapping.
   */
  place(node, preferredX = null) {
    if (this.positions.has(node.id)) return this.positions.get(node.id);

    const dims = this.dimensionsFor(node);
    const lane = node.lane === null || node.lane === undefined ? getLaneForKind(node.kind) : node.lane;
    const y = CANVAS_ORIGIN.y + lane * LANE_HEIGHT;
    const centerX = this.width / 2;

    let x = preferredX === null ? Math.round(centerX - dims.width / 2) : Math.round(preferredX);

    if (!this.isFree(lane, x, dims.width)) {
      // Fan outward: +1, -1, +2, -2 … offsets in units of node width + gap.
      const stride = dims.width + SIBLING_GAP;
      let found = false;
      for (let step = 1; step <= 24 && !found; step++) {
        const right = Math.round(x + step * stride);
        if (this.isFree(lane, right, dims.width)) {
          x = right;
          found = true;
          break;
        }
        const left = Math.round(x - step * stride);
        if (this.isFree(lane, left, dims.width)) {
          x = left;
          found = true;
        }
      }
    }

    const pos = { x, y, width: dims.width, height: dims.height, lane };
    this.positions.set(node.id, pos);
    this.reserve(lane, x, dims.width);
    return pos;
  }

  /** Places the root of the roadmap, horizontally centred. */
  placeStart(node) {
    const dims = this.dimensionsFor(node);
    const x = Math.round(this.width / 2 - dims.width / 2);
    const pos = { x, y: CANVAS_ORIGIN.y, width: dims.width, height: dims.height, lane: 0 };
    this.positions.set(node.id, pos);
    this.reserve(0, x, dims.width);
    return pos;
  }

  /**
   * Places the offered (not yet chosen) children of a parent.
   * Offered nodes sit one lane below their parent and are laid out
   * left-to-right, centred on the parent.
   */
  placeOffered(parentNode, offeredSeeds, idFor = seed => `offer::${seed.id}`) {
    if (!offeredSeeds || offeredSeeds.length === 0) return [];

    const parentPos = this.positions.get(parentNode.id);
    const placed = [];
    const dims = this.isMobile ? NODE_DIMENSIONS.compact : NODE_DIMENSIONS.branch;

    const totalWidth = offeredSeeds.length * dims.width + (offeredSeeds.length - 1) * SIBLING_GAP;
    const parentCenter = parentPos ? parentPos.x + parentPos.width / 2 : this.width / 2;
    let cursorX = Math.round(parentCenter - totalWidth / 2);

    offeredSeeds.forEach(seed => {
      const node = {
        id: idFor(seed),
        kind: seed.kind,
        lane: parentNode.lane + 1,
        technical: seed.technical,
        children: []
      };

      if (this.positions.has(node.id)) {
        const existing = this.positions.get(node.id);
        placed.push({ seed, nodeId: node.id, position: existing });
        cursorX += dims.width + SIBLING_GAP;
        return;
      }

      let x = cursorX;
      if (!this.isFree(node.lane, x, dims.width)) {
        const stride = dims.width + SIBLING_GAP;
        let found = false;
        for (let step = 1; step <= 40 && !found; step++) {
          const right = Math.round(x + step * stride);
          if (this.isFree(node.lane, right, dims.width)) { x = right; found = true; break; }
          const left = Math.round(x - step * stride);
          if (this.isFree(node.lane, left, dims.width)) { x = left; found = true; }
        }
      }

      const pos = {
        x,
        y: CANVAS_ORIGIN.y + node.lane * LANE_HEIGHT,
        width: dims.width,
        height: dims.height,
        lane: node.lane
      };
      this.positions.set(node.id, pos);
      this.reserve(node.lane, x, dims.width);
      placed.push({ seed, nodeId: node.id, position: pos });
      cursorX += dims.width + SIBLING_GAP;
    });

    return placed;
  }

  /** Drops offered-node positions that are no longer offered. */
  pruneOffered(activeIds) {
    const keep = new Set(activeIds);
    Array.from(this.positions.keys()).forEach(id => {
      if (id.startsWith("offer::") && !keep.has(id)) this.release(id);
    });
  }

  /** Bounding box of everything placed. */
  getBounds() {
    if (this.positions.size === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.positions.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.width);
      maxY = Math.max(maxY, p.y + p.height);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  /** Bounds of a single node, for camera-follow. */
  getNodeBounds(nodeId, padding = 60) {
    const p = this.positions.get(nodeId);
    if (!p) return null;
    return {
      x: p.x - padding,
      y: p.y - padding,
      width: p.width + padding * 2,
      height: p.height + padding * 2
    };
  }

  /**
   * Bounds covering the newly placed nodes only — what the camera
   * should move to after a choice. Falls back to a single node.
   */
  getUnionBounds(nodeIds, padding = 60) {
    const rects = nodeIds.map(id => this.positions.get(id)).filter(Boolean);
    if (rects.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rects.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.width);
      maxY = Math.max(maxY, p.y + p.height);
    });
    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  }

  /** Total vertical extent, used to size the scrollable canvas. */
  getContentHeight(padding = 120) {
    const bounds = this.getBounds();
    return Math.max(600, bounds.y + bounds.height + padding);
  }
}