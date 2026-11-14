/**
 * SANDBOX — Discovery Tracker
 *
 * Tracks materials and reaction events discovered by the player.
 *
 * REACTION HIERARCHY INTEGRATION:
 *   WORLD    — silent physics; record() is never called for these
 *              (the simulation's _checkReactions skips onReaction for WORLD tier).
 *   COMMON / UNCOMMON — material discovery + optional tool unlock + toast.
 *   RARE     — material discovery + toast with "RARE DISCOVERY" label.
 *   SECRET   — material discovery + distinct "???" toast; marked as secret.
 */

import {
  TOOL_GROUPS,
  STARTING_TOOLS,
  DISCOVERABLE_MATERIALS,
} from "./materials.js";
import { PRIORITY } from "./reactions.js";

// Tools (materials the player can paint with) are unlocked by discovery.
const UNLOCKABLE_TOOLS = TOOL_GROUPS.flatMap((g) => g.ids);

export class DiscoveryTracker {
  constructor(onUpdate) {
    this.discovered = new Set();
    // materialId -> { recipe: [idA, idB], priority }
    this.recipes = new Map();
    // key -> human-readable label, for special non-material events
    this.events = new Map();
    // Tools the player has earned the right to paint with, beyond STARTING_TOOLS.
    this.unlockedTools = new Set(STARTING_TOOLS);
    this.onUpdate = onUpdate || (() => {});
  }

  /** Is this material available in the toolbar right now? */
  isToolUnlocked(id) {
    return this.unlockedTools.has(id);
  }

  /**
   * Records a reaction transformation.
   *
   * @param {number}  idA      - material A that reacted
   * @param {number}  idB      - material B that reacted
   * @param {number}  output   - resulting material
   * @param {string}  priority - PRIORITY tier of the reaction
   * @returns {boolean} true if a new material was discovered
   */
  record(idA, idB, output, priority = PRIORITY.COMMON) {
    if (!output || output === 0) return false;
    // Raw foundations aren't "discoveries" — you already have them.
    if (STARTING_TOOLS.includes(output)) return false;
    // WORLD-tier reactions are physics, not discoveries.
    if (priority === PRIORITY.WORLD) return false;
    if (this.discovered.has(output)) return false;

    this.discovered.add(output);
    this.recipes.set(output, { recipe: [idA, idB], priority });

    // Discovering a material may hand the player a new TOOL to paint with.
    let gainedTool = false;
    if (UNLOCKABLE_TOOLS.includes(output) && !this.unlockedTools.has(output)) {
      this.unlockedTools.add(output);
      gainedTool = true;
    }

    this.onUpdate(output, idA, idB, gainedTool, priority);
    return true;
  }

  /**
   * Marks a named special event (not a produced material) as discovered.
   * Returns true the first time the event is seen.
   */
  recordEvent(key, label) {
    if (this.events.has(key)) return false;
    this.events.set(key, label);
    this.onUpdate(null, null, null, false, PRIORITY.COMMON);
    return true;
  }

  has(id) {
    return STARTING_TOOLS.includes(id) || this.discovered.has(id);
  }

  /** True if this material is in the discoverable pool (shown in counter). */
  isSecret(id) {
    return DISCOVERABLE_MATERIALS.includes(id);
  }

  /** True if this specific discovery was SECRET tier. */
  wasSecretDiscovery(id) {
    const entry = this.recipes.get(id);
    return entry ? entry.priority === PRIORITY.SECRET : false;
  }

  /** True if this specific discovery was RARE or SECRET tier. */
  wasRareOrSecret(id) {
    const entry = this.recipes.get(id);
    return entry
      ? entry.priority === PRIORITY.RARE || entry.priority === PRIORITY.SECRET
      : false;
  }

  list() {
    return Array.from(this.discovered);
  }

  unlockedCount() {
    return this.discovered.size + this.events.size;
  }

  totalDiscoverable() {
    return DISCOVERABLE_MATERIALS.length;
  }

  hasTool(id) {
    return this.unlockedTools.has(id);
  }
}