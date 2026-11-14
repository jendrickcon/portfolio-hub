/**
 * SANDBOX — Cellular Simulation Engine
 *
 * Real-time physics, fluid dynamics, thermodynamic combustion,
 * digital matrix streams, and chemical reactions.
 *
 * The engine is deliberately generic: material behaviour is looked up from the
 * data table in materials.js, and interactions from reactions.js. New materials
 * or reactions should not require editing this file unless they need a brand
 * new *behaviour* (as opposed to new data).
 */

import {
  EMPTY, SAND, WATER, STONE, FIRE, SMOKE, WOOD, CODE,
  GLASS, STEAM, ASH, CORRUPTED_CODE, MUD,
  BURNING_WOOD, OIL, LAVA, HEATED_STONE, WET_SAND,
  METAL, HOT_METAL, EMBER, DUST, VOID, DARK_MATTER, PLANT,
  SOIL, SEED, SPROUT, TRUNK, BRANCH, LEAF, CLOUD, RAIN,
  SALT, ICE, SNOW, ACID, GOLD, MERCURY, CRYSTAL, STEEL, SPARK, ASHFALL,
  GLITCH,
  COAL, CHARCOAL, FUEL, SULFUR, GUNPOWDER, OBSIDIAN, MAGMA_ROCK,
  LIMESTONE, CEMENT, CONCRETE,
  MOSS, VINE, FLOWER, FRUIT, GRASS, TREE, BEE, WORM, SNAKE,
  WIND, LIGHT, SHADOW, HEAT, COLD, STATIC, MAGNET,
  MACHINE, GEAR, WIRE, BATTERY, CIRCUIT, ROBOT, AI, DATA, VIRUS,
  PORTAL, SINGULARITY, STAR, NEBULA, COMET, ASTRONAUT, SPACE, TIME, MEMORY, SOUL,
  MATERIALS, randomInRange
} from "./materials.js";
import { findReaction } from "./reactions.js";

const NEIGHBORS_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const NEIGHBORS_8 = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [1, -1], [-1, 1], [1, 1]
];

export const isSolid = (id) =>
  id === STONE || id === WOOD || id === GLASS || id === BURNING_WOOD ||
  id === HEATED_STONE || id === METAL || id === HOT_METAL || id === PLANT ||
  id === SPROUT || id === TRUNK || id === BRANCH || id === LEAF ||
  id === ICE || id === GOLD || id === CRYSTAL || id === STEEL ||
  id === OBSIDIAN || id === MAGMA_ROCK || id === LIMESTONE || id === CONCRETE ||
  id === TREE || id === MACHINE || id === GEAR || id === WIRE ||
  id === BATTERY || id === CIRCUIT || id === ROBOT || id === MAGNET ||
  id === AI || id === ASTRONAUT || id === GRASS || id === MOSS ||
  id === VINE || id === FLOWER;

/** Air-adjacent: empty space or a gas the tree can grow through. */
const isAirOrPlant = (id) =>
  id === EMPTY || id === SMOKE || id === STEAM || id === FIRE ||
  id === LEAF || id === BRANCH || id === TRUNK || id === SPROUT || id === CLOUD;

// Tree shape limits. These keep a grown tree recognisable and, more
// importantly, keep it from devouring the whole sandbox.
const TREE_MAX_HEIGHT = 16;   // trunk cells above the seed
const TREE_BRANCH_REACH = 4;  // how far a branch reaches from the trunk

// Hot-cell budget: keeps firestorms performant on mobile AND stops any single
// runaway burn from eating the whole frame budget. Fire alone is intentionally
// capped tighter than combustion, since fire self-replicates while
// burning wood / lava are the true "sources" that must never be starved.
const MAX_HOT = 620;
const MAX_FIRE = 420;
const MAX_VOID_MOVES = 60; // conversions the void may make per tick

// Materials the void's pull field is allowed to drag inward. Heavy solids
// (stone, metal, glass, wood) resist — only loose matter can be devoured.
const PullSet = [
  SAND, WATER, SMOKE, STEAM, DUST, EMBER, CODE,
  CORRUPTED_CODE, ASH, OIL, MUD, FIRE, PLANT, METAL
];

export class Simulation {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.grid = new Uint8Array(cols * rows);
    this.life = new Uint16Array(cols * rows);
    this._scanFlip = false;
    this.onReaction = null;
    this.onBlast = null;
    this.onEvent = null;   // (key, label) for discovery log entries
    this._hotCount = 0;
    this._fireCount = 0;
    this._reactionsThisStep = 0;
    this._voidMoves = 0;

    // AIR — an invisible environmental force, NOT a material. Each cell holds a
    // small "draft" value that nudges light things (smoke, steam, dust, fire,
    // leaves). A slow ambient breeze keeps the world feeling alive; the player's
    // AIR tool pushes it around locally.
    this.air = new Int8Array(cols * rows);
    this.airPhase = 0;
  }

  /** Push a puff of air into the world around (cx, cy). dir: -1 left, +1 right. */
  paintAir(cx, cy, radius, dir, strength = 3) {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = cx + dx, py = cy + dy;
        if (!this.inBounds(px, py)) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const i = this.index(px, py);
        const v = this.air[i] + dir * strength * (1 - Math.sqrt(d2) / (radius + 1));
        this.air[i] = Math.max(-8, Math.min(8, Math.round(v)));
      }
    }
  }

  /** The air current at a cell, blended with a slow ambient breeze. */
  airAt(x, y) {
    if (!this.inBounds(x, y)) return 0;
    const ambient = Math.round(Math.sin((this.airPhase + x) * 0.06) * 0.9);
    return this.air[this.index(x, y)] + ambient;
  }

  /** Let locally-pushed air settle back toward the ambient breeze. */
  _settleAir() {
    const a = this.air;
    for (let i = 0; i < a.length; i++) {
      if (a[i] > 0) a[i]--;
      else if (a[i] < 0) a[i]++;
    }
  }

  index(x, y) { return y * this.cols + x; }
  inBounds(x, y) { return x >= 0 && x < this.cols && y >= 0 && y < this.rows; }

  get(x, y) {
    if (!this.inBounds(x, y)) return STONE; // Boundaries act as impassable solid
    return this.grid[this.index(x, y)];
  }

  set(x, y, materialId, lifeOverride) {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    this.grid[i] = materialId;
    if (materialId === EMPTY) {
      this.life[i] = 0;
      return;
    }
    const def = MATERIALS[materialId];
    if (lifeOverride != null) {
      this.life[i] = lifeOverride;
    } else if (def && def.life) {
      this.life[i] = randomInRange(def.life);
    } else {
      this.life[i] = 0;
    }
  }

  /**
   * Set only if under the hot-cell budget. Returns true on success.
   * Fire is budgeted separately from combustion sources so a spreading
   * blaze can never starve wood/lava ignition (the historical FIRE→WOOD bug).
   */
  _setHot(x, y, materialId) {
    if (this._hotCount >= MAX_HOT) return false;
    if (materialId === FIRE && this._fireCount >= MAX_FIRE) return false;
    this.set(x, y, materialId);
    this._hotCount++;
    if (materialId === FIRE) this._fireCount++;
    return true;
  }

  clear() {
    this.grid.fill(EMPTY);
    this.life.fill(0);
    this._hotCount = 0;
    this._fireCount = 0;
    this._reactionsThisStep = 0;
    this._voidMoves = 0;
  }

  placeBrush(cx, cy, materialId, radius) {
    const r2 = radius * radius;
    const def = MATERIALS[materialId];
    // "Overwrite anything" materials: structural solids and the void.
    const overwrites =
      materialId === EMPTY || materialId === STONE || materialId === WOOD ||
      materialId === GLASS || materialId === METAL || materialId === PLANT ||
      materialId === VOID || materialId === DARK_MATTER ||
      (def && def.behavior === "void");

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const px = cx + dx, py = cy + dy;
        if (this.inBounds(px, py)) {
          if (overwrites) {
            this.set(px, py, materialId);
          } else {
            const cur = this.get(px, py);
            if (cur === EMPTY || cur === SMOKE || cur === STEAM || !isSolid(cur)) {
              this.set(px, py, materialId);
            }
          }
        }
      }
    }
  }

  step() {
    const { cols, rows } = this;
    this._scanFlip = !this._scanFlip;

    // Recount active hot cells (fire is tracked separately from combustion)
    let hot = 0, fires = 0;
    const grid = this.grid;
    for (let i = 0; i < grid.length; i++) {
      const id = grid[i];
      if (id === FIRE) { hot++; fires++; }
      else if (id === LAVA || id === BURNING_WOOD || id === HEATED_STONE) hot++;
    }
    this._hotCount = hot;
    this._fireCount = fires;
    this._reactionsThisStep = 0;
    this._voidMoves = 0;

    // Air breathes: advance the ambient breeze and let local drafts settle.
    this.airPhase++;
    if (this.airPhase % 3 === 0) this._settleAir();

    // Alternate scan directions to avoid directional bias
    for (let y = rows - 1; y >= 0; y--) {
      const leftToRight = (y + (this._scanFlip ? 1 : 0)) % 2 === 0;
      if (leftToRight) {
        for (let x = 0; x < cols; x++) this._stepCell(x, y);
      } else {
        for (let x = cols - 1; x >= 0; x--) this._stepCell(x, y);
      }
    }
  }

  /**
   * Applies the invisible AIR current to a light material. Only airy things
   * respond (gases, dust, leaves, fire, code). Returns true if the cell moved.
   */
  _stepAirFor(x, y, id) {
    const def = MATERIALS[id];
    if (!def) return false;
    const responsiveness = def.behavior === "gas" ? 1.0 : def.light ? 0.8
      : (id === FIRE || id === CODE || id === CORRUPTED_CODE) ? 0.5 : 0;
    if (responsiveness <= 0) return false;

    const wind = this.airAt(x, y);
    if (wind === 0) return false;
    if (Math.random() > Math.abs(wind) * 0.28 * responsiveness) return false;

    const nx = x + Math.sign(wind);
    if (this._canDisplace(id, this.get(nx, y))) {
      this._swap(x, y, nx, y);
      return true;
    }
    // Try drifting up-and-across so smoke curls instead of sliding flat.
    if (this._canDisplace(id, this.get(nx, y - 1))) {
      this._swap(x, y, nx, y - 1);
      return true;
    }
    return false;
  }

  _stepCell(x, y) {
    const id = this.get(x, y);
    if (id === EMPTY) return;
    const def = MATERIALS[id];
    if (!def) return;

    // Inert solids do nothing on their own (unless they have a dedicated step).
    if (def.behavior === "solid" &&
        id !== BURNING_WOOD && id !== HEATED_STONE && id !== HOT_METAL &&
        id !== SPROUT && id !== TRUNK && id !== BRANCH && id !== LEAF) return;

    // Check chemical / thermodynamic reactions first for reactive materials.
    // NOTE: FIRE is deliberately excluded here — fire's own step handles all
    // its interactions so that an adjacent WATER reaction can't silently
    // cancel combustion spreading to nearby WOOD in the same tick.
    if (
      id === WATER || id === LAVA ||
      id === BURNING_WOOD || id === OIL || id === CODE ||
      id === CORRUPTED_CODE || id === SAND || id === WET_SAND ||
      id === EMBER || id === DUST || id === METAL ||
      id === SALT || id === ICE || id === SNOW || id === ACID ||
      id === GOLD || id === MERCURY || id === CRYSTAL || id === STEEL ||
      id === SPARK || id === ASHFALL || id === GLITCH
    ) {
      if (this._checkReactions(x, y)) return;
    }

    switch (id) {
      case SAND:  this._stepPowder(x, y, SAND); return;
      case WET_SAND: this._stepPowder(x, y, WET_SAND); return;
      case ASH:   this._stepPowder(x, y, ASH); return;
      case DUST:  this._stepPowder(x, y, DUST); return;
      case SALT:  this._stepPowder(x, y, SALT); return;
      case SNOW:  this._stepPowder(x, y, SNOW); return;
      case ASHFALL: this._stepPowder(x, y, ASHFALL); return;
      case ACID:  this._stepLiquid(x, y, ACID); return;
      case MERCURY: this._stepLiquid(x, y, MERCURY); return;
      case SPARK: this._stepSpark(x, y); return;
      case STATIC: this._stepSpark(x, y); return;
      case SOIL:  this._stepSoil(x, y); return;
      case SEED:  this._stepSeed(x, y); return;
      case SPROUT: this._stepGrowth(x, y, SPROUT); return;
      case TRUNK:  this._stepGrowth(x, y, TRUNK); return;
      case BRANCH: this._stepGrowth(x, y, BRANCH); return;
      case LEAF:   this._stepLeaf(x, y); return;
      case EMBER: this._stepEmber(x, y); return;
      case WATER: this._stepLiquid(x, y, WATER); return;
      case RAIN:  this._stepLiquid(x, y, RAIN); return;
      case OIL:   this._stepLiquid(x, y, OIL); return;
      case MUD:   this._stepLiquid(x, y, MUD); return;
      case FUEL:  this._stepLiquid(x, y, FUEL); return;
      case LAVA:  this._stepLava(x, y); return;
      case FIRE:  this._stepFire(x, y); return;
      case SMOKE: this._stepGas(x, y, SMOKE); return;
      case STEAM: this._stepGas(x, y, STEAM); return;
      case CLOUD: this._stepGas(x, y, CLOUD); return;
      case CODE:  this._stepCode(x, y, false); return;
      case CORRUPTED_CODE: this._stepCode(x, y, true); return;
      case BURNING_WOOD: this._stepBurningWood(x, y); return;
      case HEATED_STONE: this._stepHeatedStone(x, y); return;
      case HOT_METAL: this._stepHotMetal(x, y); return;
      case GLITCH: this._stepGlitch(x, y); return;
      case VOID:  this._stepVoid(x, y, VOID); return;
      case DARK_MATTER: this._stepVoid(x, y, DARK_MATTER); return;
      case SINGULARITY: this._stepVoid(x, y, SINGULARITY); return;
      default: break;
    }

    // ---- GENERIC BEHAVIOUR DISPATCH ----
    // Anything without a dedicated handler above falls back to its declared
    // behaviour, so newly added materials work without touching the engine.
    const reactive =
      def.behavior === "powder" || def.behavior === "liquid" ||
      def.behavior === "gas" || def.behavior === "digital" ||
      def.behavior === "energy" || def.flammable;
    if (reactive && this._checkReactions(x, y)) return;

    switch (def.behavior) {
      case "powder":  this._stepPowder(x, y, id); return;
      case "liquid":  this._stepLiquid(x, y, id); return;
      case "sludge":  this._stepSludge(x, y, id); return;
      case "gas":     this._stepGas(x, y, id); return;
      case "energy":  this._stepGas(x, y, id); return;
      case "digital": this._stepCode(x, y, id === CORRUPTED_CODE); return;
      case "solid":   return;   // inert unless it has a dedicated handler
      default: return;
    }
  }

  _canDisplace(fromId, toId) {
    if (toId === EMPTY) return true;
    if (toId === SMOKE || toId === STEAM || toId === FIRE) return true;
    const from = MATERIALS[fromId];
    const to = MATERIALS[toId];
    if (!from || !to) return false;
    if (isSolid(toId)) return false;

    // SLUDGE and WET EARTH behave like damp ground: they settle into place and
    // do NOT sink through other granular/liquid material. Without this, wet
    // earth and soil slid straight to the bottom of the sea and wrecked the
    // beach. They can still be pushed aside by genuinely heavier solids, but
    // they never tunnel downward through sand or water on their own.
    if ((fromId === WET_SAND || fromId === SOIL || fromId === MUD) &&
        (toId === SAND || toId === WET_SAND || toId === SOIL ||
         toId === MUD || toId === WATER || toId === RAIN || toId === GRAVEL || toId === DUST)) {
      return false;
    }

    return (from.density || 0) > (to.density || 0);
  }

  /**
   * Standard powder step: fall one cell, then slide diagonally.
   */
  _stepPowder(x, y, id) {
    if (this._canDisplace(id, this.get(x, y + 1))) {
      this._swap(x, y, x, y + 1);
      return;
    }

    const dir = Math.random() < 0.5 ? 1 : -1;
    if (this._canDisplace(id, this.get(x + dir, y + 1))) {
      this._swap(x, y, x + dir, y + 1);
      return;
    }
    if (this._canDisplace(id, this.get(x - dir, y + 1))) {
      this._swap(x, y, x - dir, y + 1);
    }
  }

  /**
   * SLUDGE — heavy damp earth, soil and mud.
   *
   * The point of this behaviour is *settling*, not sinking. A sludge cell
   * falls only when there is open air directly beneath it, then slides a
   * little way downhill until it is supported. It deliberately refuses to
   * push through sand or water (see _canDisplace), because otherwise a single
   * splash of water would drag the whole beach to the sea floor.
   *
   * Sludge also spreads horizontally when it is piled too deep: a tall column
   * of it slumps outward instead of growing into a tower.
   */
  _stepSludge(x, y, id) {
    const def = MATERIALS[id];
    const below = this.get(x, y + 1);

    // 1) An empty cell underneath: fall, but slowly and with a little drift,
    //    so wet earth oozes rather than rains.
    if (below === EMPTY || below === SMOKE || below === STEAM) {
      if (Math.random() < 0.8) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const side = this.get(x + dir, y + 1);
        // Prefer the downhill diagonal when it is also open — this makes
        // sludge creep down slopes and pool in hollows.
        if (side === EMPTY || side === SMOKE || side === STEAM) {
          this._swap(x, y, x + dir, y + 1);
        } else {
          this._swap(x, y, x, y + 1);
        }
      }
      return;
    }

    // 2) It cannot go down. If another sludge/liquid cell sits directly above,
    //    shove sideways so a deep pile flattens out instead of stacking.
    const above = this.get(x, y - 1);
    if (above === id && Math.random() < 0.25 && (def.spread ?? 0) > 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      if (this._canDisplace(id, this.get(x + dir, y))) {
        this._swap(x, y, x + dir, y);
      }
    }
  }

  // ===================================================================
  //  LIFE — the growth chain
  // ===================================================================
  //  SEED -> SPROUT -> TRUNK/BRANCH -> LEAF
  //
  //  Growth is *conditional*, not automatic: a seed only wakes if it sits in
  //  damp SOIL, and a sprout only matures if it can still feel water and open
  //  air above it. Remove the soil, bury it, or burn it, and it dies back.
  //  This is what makes the tree feel part of the same world as the sand.
  // ===================================================================

  /** Counts nearby cells of a given material within `r` (square radius). */
  _nearby(x, y, ids, r) {
    let n = 0;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (ids.indexOf(this.get(x + dx, y + dy)) !== -1) n++;
      }
    }
    return n;
  }

  /** Is there damp soil directly beneath this cell? */
  _hasSoilBelow(x, y) {
    for (let dy = 1; dy <= 3; dy++) {
      const id = this.get(x, y + dy);
      if (id === SOIL || id === MUD || id === WET_SAND) return true;
      if (isSolid(id)) return false; // hit a rock before soil
    }
    return false;
  }

  /** SOIL — earth that has matured. Behaves like a powder, but fertile.
   *  Dry, bare soil slowly compacts back into plain earth if it never sees
   *  any water; soaked soil stays rich. */
  _stepSoil(x, y) {
    // Soil with water nearby stays fertile; long-dry soil reverts to earth.
    const damp = this._nearby(x, y, [WATER, RAIN, MUD], 1) > 0;
    if (damp) this.life[this.index(x, y)] = 120;
    else if (this.life[this.index(x, y)] > 0) this.life[this.index(x, y)]--;
    this._stepPowder(x, y, SOIL);
  }

  /** SEED — a dormant thing. Sits on soil until it is watered, then sprouts. */
  _stepSeed(x, y) {
    // Fall like a powder until it comes to rest.
    const below = this.get(x, y + 1);
    if (this._canDisplace(SEED, below)) { this._stepPowder(x, y, SEED); return; }

    // A seed only wakes when it rests on damp, fertile ground AND has water
    // near enough to soften it. This is the "nothing happens... then it does"
    // moment the player discovers for themselves.
    const onSoil = below === SOIL || below === MUD || below === WET_SAND;
    const watered = this._nearby(x, y, [WATER, RAIN], 2) > 0;
    // It also needs open air above — a buried seed stays dormant.
    const openAir = isAirOrPlant(this.get(x, y - 1));
    if (onSoil && watered && openAir && Math.random() < 0.004) {
      this.set(x, y, SPROUT);
      if (this.onEvent) this.onEvent("discovery:sprout", "SPROUT");
    }
  }

  /**
   * SPROUT / TRUNK / BRANCH — the growing tree.
   *
   * Growth is deliberately slow and, crucially, BOUNDED: the tree grows
   * upward to a fixed height, sprouts only a few branches at set heights, and
   * those branches reach a limited distance before producing leaves. Without
   * bounds a tree would consume the whole world — here it settles into a
   * recognisable shape and then simply lives.
   *
   * It only grows while it can still feel soil beneath it and open air above;
   * cut the soil away or bury it and growth stalls.
   */
  _stepGrowth(x, y, id) {
    const fed = this._hasSoilBelow(x, y) || this._nearby(x, y, [TRUNK, BRANCH], 3) > 0;
    if (!fed) return;

    // Slow and deliberate: about one extension every couple of seconds.
    if (Math.random() > 0.018) return;

    // 1) A sprout's only job is to become the first length of trunk.
    if (id === SPROUT) {
      this.set(x, y, TRUNK);
      if (this.get(x, y - 1) === EMPTY) this.set(x, y - 1, TRUNK);
      return;
    }

    if (id === TRUNK) {
      // Height is measured from the base of the column so every trunk cell
      // agrees on the tree's true height.
      const baseHeight = this._trunkHeightFromBase(x, y);

      // 2a) Extend the trunk upward, but only to a fixed maximum height.
      if (baseHeight < TREE_MAX_HEIGHT) {
        if (this.get(x, y - 1) === EMPTY) { this.set(x, y - 1, TRUNK); return; }
      }

      // 2b) At set heights, sprout a branch sideways (once per level per side).
      //     This gives the tree its silhouette rather than an explosion of twigs.
      if (baseHeight >= 4 && baseHeight % 4 === 0) {
        for (const dir of [-1, 1]) {
          if (this.get(x + dir, y) !== EMPTY) continue;
          const opposite = this.get(x - dir, y);
          // Don't sprout if a branch already exists on this level.
          if (opposite === BRANCH) continue;
          if (Math.random() < 0.5) { this.set(x + dir, y, BRANCH); break; }
        }
      }

      // 2c) At the crown, sprout leaves rather than more trunk.
      if (baseHeight >= TREE_MAX_HEIGHT) {
        if (this.get(x, y - 1) === EMPTY && Math.random() < 0.4) {
          this.set(x, y - 1, LEAF);
        }
      }
      return;
    }

    if (id === BRANCH) {
      const reach = this._branchReach(x, y);

      // 3a) Reach outward a limited distance…
      if (reach < TREE_BRANCH_REACH) {
        const dir = x >= this._treeRoot(x, y) ? 1 : -1;
        if (this.get(x + dir, y) === EMPTY) { this.set(x + dir, y, BRANCH); return; }
      }

      // 3b) …then carry a little foliage, with a hard cap so leaves don't run away.
      if (this._nearby(x, y, [LEAF], 1) < 2 && this.get(x, y - 1) === EMPTY) {
        this.set(x, y - 1, LEAF);
      }
    }
  }

  /**
   * Height of this trunk cell measured from the BASE of the tree. Walks down
   * to the root, then reports how many trunk cells sit below this one — so
   * every cell in a column agrees on the tree's true height.
   */
  _trunkHeightFromBase(x, y) {
    // Find the base: the lowest TRUNK/SPROUT cell in this column.
    let baseY = y;
    for (let s = 1; s < 60; s++) {
      const id = this.get(x, y + s);
      if (id === TRUNK || id === SPROUT) baseY = y + s;
      else break;
    }
    return Math.max(0, baseY - y);
  }

  /** How far this branch reaches from the trunk (walk toward the trunk). */
  _branchReach(x, y) {
    let r = 0;
    for (const dir of [-1, 1]) {
      let xx = x;
      for (let s = 0; s < 20; s++) {
        xx += dir;
        const id = this.get(xx, y);
        if (id === BRANCH) { r++; continue; }
        if (id === TRUNK) break;
      }
    }
    return r;
  }

  /** The x of the trunk this branch belongs to. */
  _treeRoot(x, y) {
    for (let s = 1; s < 20; s++) {
      if (this.get(x - s, y) === TRUNK) return x - s;
      if (this.get(x + s, y) === TRUNK) return x + s;
    }
    return x;
  }

  /** LEAF — light foliage. Drifts on the air, and burns very readily. */
  _stepLeaf(x, y) {
    if (this._stepAirFor(x, y, LEAF)) return;

    // Leaves that lose their branch wilt back into the soil cycle.
    const attached = this._nearby(x, y, [BRANCH, TRUNK, LEAF], 1) > 0;
    if (!attached && Math.random() < 0.01) { this.set(x, y, DUST); return; }

    // Detached leaves fall slowly.
    if (!attached && this._canDisplace(LEAF, this.get(x, y + 1)) && Math.random() < 0.4) {
      this._swap(x, y, x, y + 1);
    }
  }

  _stepLiquid(x, y, id) {
    if (Math.random() > (MATERIALS[id].viscosity ?? 1)) return;

    if (this._canDisplace(id, this.get(x, y + 1))) {
      this._swap(x, y, x, y + 1);
      return;
    }

    const dir = Math.random() < 0.5 ? 1 : -1;
    if (this._canDisplace(id, this.get(x + dir, y + 1))) {
      this._swap(x, y, x + dir, y + 1);
      return;
    }
    if (this._canDisplace(id, this.get(x - dir, y + 1))) {
      this._swap(x, y, x - dir, y + 1);
      return;
    }
    // Spread sideways to find its level.
    if (this._canDisplace(id, this.get(x + dir, y))) {
      this._swap(x, y, x + dir, y);
      return;
    }
    if (this._canDisplace(id, this.get(x - dir, y))) {
      this._swap(x, y, x - dir, y);
    }
  }

  _stepGas(x, y, id) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;

    // A CLOUD that has gathered long enough finally rains.
    if (id === CLOUD) {
      if (this.life[i] === 0 || (Math.random() < 0.004 && this._nearby(x, y, [CLOUD], 3) > 2)) {
        this.set(x, y, RAIN);
        if (this.onEvent) this.onEvent("discovery:rain", "RAIN");
        return;
      }
    } else if (this.life[i] === 0) {
      this.set(x, y, EMPTY);
      return;
    }

    // Water vapour drifting over cold material condenses back into water.
    if (id === STEAM && Math.random() < 0.01 &&
        (this.get(x, y + 1) === STONE || this.get(x, y + 1) === GLASS)) {
      this.set(x, y, WATER);
      return;
    }

    // Steam that climbs into the upper sky GATHERS into a cloud. This is how
    // the water cycle closes: steam rises, pools at the ceiling, thickens into
    // cloud, then rains back down onto the world below.
    if (id === STEAM && y < Math.floor(this.rows * 0.22) && this._nearby(x, y, [STEAM, CLOUD], 3) >= 2) {
      if (Math.random() < 0.06) {
        this.set(x, y, CLOUD);
        if (this.onEvent) this.onEvent("discovery:cloud", "CLOUD");
        return;
      }
    }

    // The air current pushes gas around before it drifts of its own accord.
    if (this._stepAirFor(x, y, id)) return;

    // Gas drifts sideways then rises.
    const nx = x + (Math.random() < 0.5 ? -1 : 1);
    const ny = y - 1;

    const target = this.get(nx, ny);
    if (target === EMPTY) {
      this._move(x, y, nx, ny);
    } else if (this.get(x, ny) === EMPTY) {
      this._move(x, y, x, ny);
    } else if (this.get(nx, y) === EMPTY) {
      this._move(x, y, nx, y);
    }

    if (id !== CLOUD && Math.random() < 0.005) this.set(x, y, EMPTY);
  }

  _stepFire(x, y) {
    const i = this.index(x, y);

    // Water quenches fire on contact -> steam, and the fire is spent.
    // (Done here rather than in the reaction table so fire can still ignite
    // WOOD in the same neighbourhood on the same tick.)
    if (this._touches(x, y, WATER)) {
      this._setHot(x, y, STEAM);
      return;
    }

    if (this.life[i] > 0) this.life[i]--;

    // Ignition of adjacent flammables. Bigger weight on straight-down/below
    // neighbours so a fire resting on a fuel surface reliably catches it.
    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === WOOD || nId === PLANT) {
        const bias = dy > 0 ? 0.5 : 0.34;
        if (Math.random() < bias) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === LEAF) {
        // Foliage goes up almost instantly — a tree is a fire waiting to happen.
        if (Math.random() < 0.7) this._setHot(nx, ny, FIRE);
      } else if (nId === TRUNK || nId === BRANCH || nId === SPROUT) {
        if (Math.random() < 0.22) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === SEED || nId === SOIL) {
        if (Math.random() < 0.1) this._setHot(nx, ny, FIRE);
      } else if (nId === OIL) {
        if (Math.random() < 0.7) this._setHot(nx, ny, FIRE);
      } else if (nId === CODE) {
        if (Math.random() < 0.25) this.set(nx, ny, CORRUPTED_CODE);
      } else if (nId === SAND) {
        // Rare: sustained fire fuses sand into glass
        if (Math.random() < 0.02) this.set(nx, ny, GLASS);
      } else if (nId === STONE) {
        // Fire slowly bakes stone hot, which then glows and can re-ignite
        if (Math.random() < 0.015) this.set(nx, ny, HEATED_STONE);
      }
    }

    // Fire rises and flickers, and the air current bends the flames.
    const air = this.airAt(x, y);
    const rise = Math.random();
    if (rise < 0.45) {
      const above = this.get(x, y - 1);
      if (above === EMPTY || above === SMOKE) {
        this._swap(x, y, x, y - 1);
        return;
      }
    } else if (rise < 0.65) {
      const driftX = x + (air !== 0 ? Math.sign(air) : (Math.random() < 0.5 ? 1 : -1));
      if (this.get(driftX, y - 1) === EMPTY) {
        this._swap(x, y, driftX, y - 1);
        return;
      }
    }

    // Produce rising smoke
    if (Math.random() < 0.12 && this.get(x, y - 1) === EMPTY) {
      this.set(x, y - 1, SMOKE);
    }

    // Burnout — fire has a finite lifespan and leaves embers/smoke
    if (this.life[i] === 0) {
      const r = Math.random();
      this.set(x, y, r < 0.22 ? SMOKE : r < 0.3 ? ASH : EMPTY);
    }
  }

  _stepBurningWood(x, y) {
    const i = this.index(x, y);

    // Water extinguishes burning wood
    if (this._touches(x, y, WATER)) {
      this._setHot(x, y, ASH);
      const wx = this._findNeighbor(x, y, WATER);
      if (wx) this.set(wx[0], wx[1], STEAM);
      return;
    }

    if (this.life[i] > 0) this.life[i]--;

    // Sustained combustion spreads to touching wood and oil.
    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === WOOD) {
        if (Math.random() < 0.12) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === OIL) {
        if (Math.random() < 0.5) this._setHot(nx, ny, FIRE);
      }
    }

    // Flames lick upward; smoke rises further
    if (Math.random() < 0.2) {
      const above = this.get(x, y - 1);
      if (above === EMPTY || above === SMOKE) this._setHot(x, y - 1, FIRE);
    }
    if (Math.random() < 0.08 && this.get(x, y - 2) === EMPTY) {
      this.set(x, y - 2, SMOKE);
    }

    // When life expires the wood is consumed: ash mostly, sometimes it
    // collapses straight into smoke. A small chance to leave a live ember
    // so an almost-dead fire can still crawl along one more log.
    if (this.life[i] === 0) {
      const r = Math.random();
      if (r < 0.85) this.set(x, y, ASH);
      else if (r < 0.95) this.set(x, y, SMOKE);
      else this.set(x, y, FIRE);
    }
  }

  _stepHeatedStone(x, y) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;

    // Hot stone passes its heat on: ignites nearby flammables and slowly
    // cools back to plain stone.
    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === WOOD) {
        if (Math.random() < 0.1) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === OIL) {
        if (Math.random() < 0.35) this._setHot(nx, ny, FIRE);
      }
    }

    // Occasionally shed a flicker of fire / smoke
    if (Math.random() < 0.05 && this.get(x, y - 1) === EMPTY) {
      this._setHot(x, y - 1, FIRE);
    }

    // Cool down to ordinary stone
    if (this.life[i] === 0) this.set(x, y, STONE);
  }

  /**
   * EMBER — a falling hot coal. It obeys powder physics, can catch wood and
   * oil alight, and cools into ash after its (random) lifespan runs out.
   */
  _stepEmber(x, y) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;

    // Live embers ignite their surroundings.
    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === WOOD) {
        if (Math.random() < 0.06) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === OIL) {
        if (Math.random() < 0.4) this._setHot(nx, ny, FIRE);
      } else if (nId === PLANT) {
        if (Math.random() < 0.08) this._setHot(nx, ny, BURNING_WOOD);
      }
    }

    // Embers give off a wisp of smoke as they cool.
    if (Math.random() < 0.03 && this.get(x, y - 1) === EMPTY) {
      this.set(x, y - 1, SMOKE);
    }

    if (this.life[i] === 0) { this.set(x, y, ASH); return; }
    this._stepPowder(x, y, EMBER);
  }

  /**
   * SPARK — raw, brief electricity. It leaps greedily along anything that
   * conducts (metal, steel, gold), fizzles out in water, and dies quickly.
   */
  _stepSpark(x, y) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;
    if (this.life[i] === 0) { this.set(x, y, EMPTY); return; }

    const def = MATERIALS;
    const conducts = (id) => def[id] && def[id].conducts;

    // Jump to a conducting neighbour if one is nearby, else hop randomly.
    let jumped = false;
    for (const [dx, dy] of NEIGHBORS_4) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === WATER) { this.set(x, y, EMPTY); return; } // shorted out
      if (conducts(nId) || nId === EMPTY) {
        if (Math.random() < (conducts(nId) ? 0.6 : 0.3)) {
          this._move(x, y, nx, ny);
          jumped = true;
          break;
        }
      }
    }
    if (!jumped && Math.random() < 0.2) this.set(x, y, EMPTY);
  }

  /**
   * HOT METAL — metal that has been heated by fire/lava. It glows, conducts
   * its heat into neighbouring metal, ignites nearby fuel, and slowly cools.
   */
  _stepHotMetal(x, y) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;

    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === METAL) {
        // Heat conducts along the metal.
        if (Math.random() < 0.05) this.set(nx, ny, HOT_METAL);
      } else if (nId === WOOD) {
        if (Math.random() < 0.12) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === OIL) {
        if (Math.random() < 0.35) this._setHot(nx, ny, FIRE);
      }
    }

    if (this.life[i] === 0) this.set(x, y, METAL);
  }

  /**
   * GLITCH — reality-breaking anomaly born when CODE touches the VOID.
   *
   * It does not obey normal physics. Instead it:
   *  1) Randomly teleports to an empty cell nearby each tick.
   *  2) Occasionally converts an adjacent cell to a random material — it
   *     "breaks" the world's rules in a visible, localised way.
   *  3) Has a finite lifespan and then winks out.
   *  4) Cannot be created by the player directly — only by CODE + VOID.
   *
   * The visual identity is hot magenta / white flicker, handled in renderer.js.
   */
  _stepGlitch(x, y) {
    const i = this.index(x, y);
    if (this.life[i] > 0) this.life[i]--;
    if (this.life[i] === 0) {
      // Dying glitch leaves a brief spark cascade
      for (const [dx, dy] of NEIGHBORS_8) {
        const nx = x + dx, ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        if (this.get(nx, ny) === EMPTY && Math.random() < 0.25) {
          this.set(nx, ny, SPARK);
        }
      }
      this.set(x, y, EMPTY);
      return;
    }

    // 1) Reality corruption — glitch randomly converts an adjacent cell.
    //    It prefers non-empty neighbours; empty cells are boring to glitch.
    //    Budget: at most 1 corruption per tick so it's creepy, not explosive.
    if (Math.random() < 0.12 && this._reactionsThisStep < 6) {
      const [dx, dy] = NEIGHBORS_8[(Math.random() * 8) | 0];
      const nx = x + dx, ny = y + dy;
      if (this.inBounds(nx, ny)) {
        const target = this.get(nx, ny);
        // Glitch transforms material into something random from a curated list.
        // Avoids VOID/DARK_MATTER (no chain-collapse) and GLITCH (no loop).
        const palette = [FIRE, WATER, CODE, SMOKE, ASH, SAND, STEAM, SPARK, CORRUPTED_CODE];
        if (target !== EMPTY && target !== VOID && target !== DARK_MATTER && target !== GLITCH) {
          this.set(nx, ny, palette[(Math.random() * palette.length) | 0]);
          this._reactionsThisStep++;
        }
      }
    }

    // 2) Teleport — the glitch doesn't flow, it jumps.
    //    It skips 2-5 cells in a random direction, landing only on empty space.
    if (Math.random() < 0.55) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 2 + ((Math.random() * 4) | 0);
      const jx    = x + Math.round(Math.cos(angle) * dist);
      const jy    = y + Math.round(Math.sin(angle) * dist);
      if (this.inBounds(jx, jy) && this.get(jx, jy) === EMPTY) {
        this._move(x, y, jx, jy);
        return;
      }
    }

    // 3) Fallback: tiny random walk if the teleport failed.
    const [dx, dy] = NEIGHBORS_4[(Math.random() * 4) | 0];
    const nx = x + dx, ny = y + dy;
    if (this.inBounds(nx, ny) && this.get(nx, ny) === EMPTY) {
      this._move(x, y, nx, ny);
    }
  }

  /**
   * VOID / DARK MATTER — the strange, hungry material.
   *
   * It does not fall or flow. Instead it projects a local gravity well: loose
   * matter within a radius is dragged one cell closer every tick, and anything
   * that reaches the core is consumed and feeds its growth. It occasionally
   * flickers out of existence. Behaviour is intentionally not fully explained.
   */
  _stepVoid(x, y, selfId) {
    const grow = selfId === VOID;
    const R = grow ? 7 : 9;             // reach of the pull field
    const r2 = R * R;

    // Loose materials the void can drag; heavy solids resist.
    const pullTargets = PullSet;

    // 1) Radial pull field — drag loose matter one cell toward the core.
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dy === 0) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const px = x + dx, py = y + dy;
        if (!this.inBounds(px, py)) continue;
        if (pullTargets.indexOf(this.get(px, py)) === -1) continue;
        // Closer particles are pulled more eagerly.
        if (Math.random() > 0.9 / Math.sqrt(d2)) continue;
        const tx = px - Math.sign(dx);
        const ty = py - Math.sign(dy);
        const tId = this.get(tx, ty);
        if (tId === EMPTY || tId === selfId || tId === DARK_MATTER ||
            (MATERIALS[tId] && MATERIALS[tId].behavior === "gas")) {
          this._swap(px, py, tx, ty);
        }
      }
    }

    // 2) Consume anything reaching the core (budgeted so it stays a slow creep).
    if (this._voidMoves < MAX_VOID_MOVES) {
      for (const [dx, dy] of NEIGHBORS_8) {
        const nx = x + dx, ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const nId = this.get(nx, ny);
        if (nId === EMPTY || nId === VOID || nId === DARK_MATTER) continue;
        if (pullTargets.indexOf(nId) === -1 && !isSolid(nId)) continue;
        if (Math.random() < 0.25) {
          this.set(nx, ny, EMPTY);
          if (grow && Math.random() < 0.5) this.set(x, y, DARK_MATTER);
          this._voidMoves++;
          if (this.onEvent) this.onEvent("void_consume", "CONSUMPTION");
        }
      }
    }

    // 3) Rare instability: the void occasionally flickers out entirely.
    if (Math.random() < 0.0002) this.set(x, y, EMPTY);
  }

  /** True if any of the 4 orthogonal neighbours (or self already) is `id`. */
  _touches(x, y, id) {
    if (this.get(x, y) === id) return true;
    return (
      this.get(x + 1, y) === id || this.get(x - 1, y) === id ||
      this.get(x, y + 1) === id || this.get(x, y - 1) === id
    );
  }

  /** Finds the first orthogonal neighbour equal to `id`, or null. */
  _findNeighbor(x, y, id) {
    if (this.get(x + 1, y) === id) return [x + 1, y];
    if (this.get(x - 1, y) === id) return [x - 1, y];
    if (this.get(x, y + 1) === id) return [x, y + 1];
    if (this.get(x, y - 1) === id) return [x, y - 1];
    return null;
  }

  _stepLava(x, y) {
    // Ignite nearby flammables and bake nearby stone
    for (const [dx, dy] of NEIGHBORS_8) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);

      if (nId === WOOD) {
        if (Math.random() < 0.35) this._setHot(nx, ny, BURNING_WOOD);
      } else if (nId === OIL) {
        if (Math.random() < 0.7) this._setHot(nx, ny, FIRE);
      } else if (nId === STONE) {
        if (Math.random() < 0.02) this.set(nx, ny, HEATED_STONE);
      } else if (nId === METAL) {
        if (Math.random() < 0.06) this.set(nx, ny, HOT_METAL);
      } else if (nId === PLANT) {
        if (Math.random() < 0.3) this._setHot(nx, ny, BURNING_WOOD);
      }
    }

    // Emit fire / smoke above
    if (Math.random() < 0.18 && this.get(x, y - 1) === EMPTY) {
      this._setHot(x, y - 1, FIRE);
    }

    this._stepLiquid(x, y, LAVA);
  }

  _stepCode(x, y, isCorrupted) {
    const i = this.index(x, y);

    // Lifetime decay. Code is ephemeral — it frames the world but fades out.
    if (this.life[i] > 0) {
      this.life[i]--;
      if (this.life[i] === 0) {
        this.set(x, y, EMPTY);
        return;
      }
    }

    // 1) Fall straight down like digital rain. Code does NOT clone itself —
    //    the old double-set here was the bug that made particle counts explode.
    const below = this.get(x, y + 1);
    if (below === EMPTY) {
      // Occasionally fall two cells in one tick for the fast "rain" feel.
      if (this.get(x, y + 2) === EMPTY && Math.random() < 0.5) {
        this._move(x, y, x, y + 2);
      } else {
        this._move(x, y, x, y + 1);
      }
      return;
    }

    // Code sinks through gas / fire but not through liquids or solids.
    if (below === SMOKE || below === STEAM || below === FIRE) {
      this._swap(x, y, x, y + 1);
      return;
    }
    if (below === WATER || below === OIL || below === MUD) {
      // Denser than liquids: code slips below them.
      this._swap(x, y, x, y + 1);
      return;
    }

    // 2) Lateral data flow. Code has low viscosity so it spreads out along a
    //    surface much more eagerly than sand — it behaves like a loose stream.
    const dir = Math.random() < 0.5 ? 1 : -1;
    const side = this.get(x + dir, y);
    const sideBelow = this.get(x + dir, y + 1);

    if (sideBelow === EMPTY) {
      this._swap(x, y, x + dir, y + 1);
      return;
    }
    if (side === EMPTY && Math.random() < (isCorrupted ? 0.7 : 0.55)) {
      this._swap(x, y, x + dir, y);
      return;
    }

    // 2b) Digital conduction — code crawls along METAL surfaces. If a metal
    //     neighbour has open space on its far side, code rides across it.
    if (this._touches(x, y, METAL)) {
      if (Math.random() < 0.4) {
        const md = [[1, 0], [-1, 0], [0, 1], [0, -1]][(Math.random() * 4) | 0];
        const tx = x + md[0], ty = y + md[1];
        if (this.get(tx, ty) === METAL) {
          const bx = tx + md[0], by = ty + md[1];
          if (this.get(bx, by) === EMPTY && Math.random() < 0.3) {
            this._move(x, y, bx, by);
            return;
          }
        }
      }
    }

    // 3) Rare glitch hop / tunnelling — the signature "not real physics" move.
    //    Only jumps into truly empty space, so it can't pass through solids.
    const glitchChance = isCorrupted ? 0.06 : 0.025;
    if (Math.random() < glitchChance) {
      const jx = x + (Math.random() < 0.5 ? -3 : 3);
      const jy = y + (Math.random() < 0.5 ? -2 : 1);
      if (this.inBounds(jx, jy) && this.get(jx, jy) === EMPTY) {
        this._move(x, y, jx, jy);
        return;
      }
    }

    // 4) Corrupted code infects neighbouring healthy code. Budgeted to a few
    //    conversions per tick so an infection stays a visible bloom, not a
    //    one-frame takeover of the whole screen.
    if (isCorrupted && Math.random() < 0.04 && this._reactionsThisStep < 24) {
      const rx = x + (Math.random() < 0.5 ? -1 : 1);
      const ry = y + (Math.random() < 0.5 ? -1 : 1);
      if (this.get(rx, ry) === CODE) {
        this.set(rx, ry, CORRUPTED_CODE);
        this._reactionsThisStep++;
      }
    }
  }

  /**
   * Small radial burst used by volatile reactions. Throws fire and smoke into
   * empty space around (cx, cy) within `radius`, and notifies listeners so the
   * actor layer can startle nearby humans.
   */
  _blast(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!this.inBounds(nx, ny)) continue;
        if (this.get(nx, ny) !== EMPTY) continue;
        const r = Math.random();
        if (r < 0.35) this._setHot(nx, ny, FIRE);
        else if (r < 0.6) this.set(nx, ny, SMOKE);
      }
    }
    if (this.onBlast) this.onBlast(cx, cy, radius);
  }

  _checkReactions(x, y) {
    const id = this.get(x, y);
    if (id === EMPTY) return false;

    // Check all 4 adjacent directions
    for (const [dx, dy] of NEIGHBORS_4) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const nId = this.get(nx, ny);
      if (nId === EMPTY) continue;

      const res = findReaction(id, nId);
      if (res !== null) {
        this.set(x, y, res.outputA);
        this.set(nx, ny, res.outputB);
        this._reactionsThisStep++;
        if (this.onReaction) {
          // Pass the full recipe so discovery.js can check priority tier.
          this.onReaction(id, nId, res.product, res.recipe);
        }
        // Named interactions feed the discovery log ("NEW DISCOVERY: GLASS").
        if (res.recipe && res.recipe.discovery && this.onEvent) {
          this.onEvent("discovery:" + res.recipe.discovery, res.recipe.discovery);
        }
        // Volatile reactions throw a small burst of fire/smoke so they read
        // as "explosions" and can startle nearby humans via onBlast.
        if (res.recipe && res.recipe.blast) {
          this._blast(x, y, res.recipe.blast);
        }
        return true;
      }
    }
    return false;
  }

  _swap(fromX, fromY, toX, toY) {
    if (!this.inBounds(fromX, fromY) || !this.inBounds(toX, toY)) return;
    const fromI = this.index(fromX, fromY);
    const toI = this.index(toX, toY);
    const tG = this.grid[fromI], tL = this.life[fromI];
    this.grid[fromI] = this.grid[toI];
    this.life[fromI] = this.life[toI];
    this.grid[toI] = tG;
    this.life[toI] = tL;
  }

  _move(fromX, fromY, toX, toY) {
    if (!this.inBounds(fromX, fromY) || !this.inBounds(toX, toY)) return;
    const fromI = this.index(fromX, fromY);
    const toI = this.index(toX, toY);
    this.grid[toI] = this.grid[fromI];
    this.life[toI] = this.life[fromI];
    this.grid[fromI] = EMPTY;
    this.life[fromI] = 0;
  }
}