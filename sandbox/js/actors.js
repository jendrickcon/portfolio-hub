/**
 * SANDBOX — Actor Layer (Tiny Walking Humans)
 *
 * Autonomous inhabitants that wander, climb, swim, flee fire,
 * get buried by falling sand, and react to digital code.
 */

import {
  EMPTY, WATER, FIRE, SMOKE, STEAM, STONE, WOOD, GLASS,
  SAND, BURNING_WOOD, LAVA, ASH, CODE, CORRUPTED_CODE, MUD,
  HEATED_STONE, WET_SAND, METAL, HOT_METAL, EMBER, DUST, VOID, DARK_MATTER, PLANT
} from "./materials.js";

const isWalkable = (id) =>
  id === STONE || id === WOOD || id === GLASS || id === SAND ||
  id === MUD || id === ASH || id === WET_SAND || id === HEATED_STONE ||
  id === METAL || id === DUST;

const isSolid = (id) =>
  id === STONE || id === WOOD || id === GLASS || id === BURNING_WOOD ||
  id === HEATED_STONE || id === METAL || id === HOT_METAL || id === PLANT;

const isAir = (id) =>
  id === EMPTY || id === SMOKE || id === STEAM;

const isHot = (id) =>
  id === FIRE || id === LAVA || id === BURNING_WOOD || id === HEATED_STONE || id === HOT_METAL || id === EMBER;

// Dreadful / cursed substances everything living instinctively avoids.
const isDread = (id) => id === VOID || id === DARK_MATTER;

const BURN_MIN = 70;
const BURN_MAX = 120;

// Personality traits — tiny randomised flavour so two humans/angels/devils
// never behave quite identically. Values are simple multipliers, not AI.
const HUMAN_TRAITS = [
  { name: "curious", fear: 0.6, wander: 1.3 },
  { name: "fearful", fear: 1.5, wander: 0.7 },
  { name: "brave",   fear: 0.3, wander: 1.1 },
  { name: "lazy",    fear: 1.0, wander: 0.4 },
];

const DEVIL_TRAITS = [
  { name: "mischievous", firelust: 1.3, cruelty: 1.0 },
  { name: "aggressive",  firelust: 1.5, cruelty: 1.4 },
  { name: "playful",     firelust: 0.9, cruelty: 0.6 },
  { name: "greedy",      firelust: 1.1, cruelty: 1.2 },
];

const ANGEL_TRAITS = [
  { name: "protective", guard: 1.6 },
  { name: "curious",    guard: 1.0 },
  { name: "peaceful",   guard: 0.8 },
];

const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export class Human {
  constructor(x, y) {
    this.kind = "human";
    this.x = x;
    this.y = y;
    this.vx = Math.random() < 0.5 ? -1 : 1;
    this.pause = 0;
    this.burning = 0;
    this.digitized = 0;
    this.swimming = false;
    this.buried = 0;
    this.panicked = 0;
    this.walkCycle = 0;
    this.stepCount = 0;
    this.alive = true;
    this.trait = pick(HUMAN_TRAITS);
    this.age = 0;

    // Angel / Devil state (unused by plain humans).
    this.lured = 0;      // being led toward danger by a devil
    this.guarded = 0;    // protected / calmed by an angel
    this.cloneCd = 0;    // cooldown before code may clone this human again
    this.avoidX = null;  // run-away target used by cosmic entity logic
    this.avoidY = null;
  }
}

/** Fish — swims in water, flops and dies on land, flees heat. */
export class Fish {
  constructor(x, y) {
    this.kind = "fish";
    this.x = x;
    this.y = y;
    this.vx = Math.random() < 0.5 ? -1 : 1;
    this.vy = 0;
    this.air = 0;        // ticks spent out of water
    this.alive = true;
    this.flop = 0;
    this.cloneCd = 0;    // cooldown before code may clone this fish again
    this.hue = Math.random() < 0.5 ? "#ff8c42" : "#ffd166";
  }
}

/**
 * Bird — flies above the terrain, avoids fire, and occasionally lands to rest.
 * Birds are the most fragile creatures: a devil can set them alight mid-flight.
 */
export class Bird {
  constructor(x, y) {
    this.kind = "bird";
    this.x = x;
    this.y = y;
    this.vx = Math.random() < 0.5 ? -1 : 1;
    this.vy = 0;
    this.alive = true;
    this.burning = 0;
    this.panicked = 0;
    this.flap = 0;
    this.resting = 0;   // ticks spent perched
    this.wing = 0;
  }
}

/** Angel — peaceful guardian. Seeks endangered humans; avoids chaos & voids. */
export class Angel {
  constructor(x, y) {
    this.kind = "angel";
    this.x = x;
    this.y = y;
    this.vx = Math.random() < 0.5 ? -1 : 1;
    this.vy = 0;
    this.alive = true;
    this.pause = 0;
    this.target = null;   // human she is moving toward
    this.trait = pick(ANGEL_TRAITS);
    this.wing = 0;
  }
}

/** Devil — mischievous troublemaker. Loves fire, follows humans, causes chaos. */
export class Devil {
  constructor(x, y) {
    this.kind = "devil";
    this.x = x;
    this.y = y;
    this.vx = Math.random() < 0.5 ? -1 : 1;
    this.vy = 0;
    this.alive = true;
    this.pause = 0;
    this.target = null;   // human it is stalking
    this.trait = pick(DEVIL_TRAITS);
    this.flames = 0;
  }
}

/**
 * Black hole — "The Devourer". Not good, not evil: simply hungry.
 * It continuously pulls matter toward itself and consumes what touches it,
 * growing slowly. Angels flee it; devils are fascinated by it.
 */
export class BlackHole {
  constructor(x, y) {
    this.kind = "blackhole";
    this.x = x;
    this.y = y;
    this.alive = true;
    this.size = 2;        // grows as it feeds
    this.fed = 0;
    this.spin = 0;
    this.pull = 0.8;      // pull strength multiplier
  }
}

export class ActorLayer {
  constructor(maxActors = 35) {
    this.actors = [];
    this.maxActors = maxActors;
    // Cosmic entities get their own (small) caps so the world stays readable.
    this.maxCosmic = 4;
    this.maxCreatures = 12;
    // Optional listener for special events (e.g. digital cloning) so the app
    // can surface them in the discovery log.
    this.onEvent = null;
  }

  spawn(x, y) {
    if (this.actors.length >= this.maxActors) return false;
    const h = new Human(Math.round(x), Math.round(y));
    this.actors.push(h);
    return true;
  }

  spawnFish(x, y) {
    if (this._countKind("fish") >= this.maxCreatures) return false;
    this.actors.push(new Fish(Math.round(x), Math.round(y)));
    return true;
  }

  spawnBird(x, y) {
    if (this._countKind("bird") >= this.maxCreatures) return false;
    this.actors.push(new Bird(Math.round(x), Math.round(y)));
    return true;
  }

  spawnAngel(x, y) {
    if (this._countKind("angel") >= this.maxCosmic) return false;
    this.actors.push(new Angel(Math.round(x), Math.round(y)));
    return true;
  }

  spawnDevil(x, y) {
    if (this._countKind("devil") >= this.maxCosmic) return false;
    this.actors.push(new Devil(Math.round(x), Math.round(y)));
    return true;
  }

  spawnBlackHole(x, y) {
    if (this._countKind("blackhole") >= this.maxCosmic) return false;
    this.actors.push(new BlackHole(Math.round(x), Math.round(y)));
    return true;
  }

  /** Generic spawn used by the toolbar / presets. */
  spawnKind(kind, x, y) {
    switch (kind) {
      case "fish": return this.spawnFish(x, y);
      case "bird": return this.spawnBird(x, y);
      case "angel": return this.spawnAngel(x, y);
      case "devil": return this.spawnDevil(x, y);
      case "blackhole": return this.spawnBlackHole(x, y);
      case "human":
      default: return this.spawn(x, y);
    }
  }

  _countKind(kind) {
    let n = 0;
    for (const a of this.actors) if (a.kind === kind && a.alive) n++;
    return n;
  }

  /** All living humans — used by angel/devil targeting. */
  humans() {
    return this.actors.filter((a) => a.kind === "human" && a.alive);
  }

  clear() {
    this.actors.length = 0;
  }

  /**
   * Startle every human within `radius` of (cx, cy). Small, cheap, no
   * pathfinding — they simply panic-run away and may catch fire if the
   * blast is hot. Used by explosive reactions and big impacts.
   */
  startle(cx, cy, radius = 14, hot = false) {
    const r2 = radius * radius;
    for (const h of this.actors) {
      if (!h.alive) continue;
      const dx = h.x - cx, dy = h.y - cy;
      if (dx * dx + dy * dy > r2) continue;
      h.pause = 0;
      h.vx = dx >= 0 ? 1 : -1; // run away from the blast
      if (h.kind === "human") h.panicked = 90;
      if (hot && h.kind === "human" && h.burning === 0 && h.digitized === 0) {
        h.burning = BURN_MIN + Math.floor(Math.random() * (BURN_MAX - BURN_MIN));
      }
    }
  }

  update(sim) {
    for (const a of this.actors) {
      if (!a.alive) continue;
      a.x = Math.max(1, Math.min(sim.cols - 2, Math.round(a.x)));
      a.y = Math.max(1, Math.min(sim.rows - 2, Math.round(a.y)));

      switch (a.kind) {
        case "human":
          if (a.panicked > 0) a.panicked--;
          a.age++;
          this._stepHuman(a, sim);
          break;
        case "fish":   this._stepFish(a, sim); break;
        case "bird":   this._stepBird(a, sim); break;
        case "angel":  this._stepAngel(a, sim); break;
        case "devil":  this._stepDevil(a, sim); break;
        case "blackhole": this._stepBlackHole(a, sim); break;
        default: break;
      }
    }
    this.actors = this.actors.filter((a) => a.alive);
  }

  // ===================================================================
  // FISH — an aquatic creature. Thrives in water, thrashes and drowns on
  // land, and flees from heat.
  // ===================================================================
  _stepFish(f, sim) {
    const x = f.x, y = f.y;
    const here = sim.get(x, y);
    const inWater = here === WATER || sim.get(x, y - 1) === WATER || sim.get(x, y + 1) === WATER;

    // Dread / heat check — dart away from fire and void.
    if (isHot(sim.get(x + f.vx, y)) || isDread(sim.get(x + f.vx, y))) {
      f.vx = -f.vx;
    }

    if (inWater) {
      f.air = 0;

      // DIGITAL CLONING: a fish swimming through code-infused water can be
      // duplicated by the corruption. Rare and capped.
      const codeNear = sim.get(x, y) === CODE || sim.get(x, y - 1) === CODE ||
                       sim.get(x, y + 1) === CODE || sim.get(x + f.vx, y) === CODE;
      if (f.cloneCd > 0) f.cloneCd--;
      if (codeNear && f.cloneCd === 0 && Math.random() < 0.02 && this._countKind("fish") < this.maxCreatures) {
        const clone = new Fish(x + (Math.random() < 0.5 ? -1 : 1), y);
        clone.hue = "#7dffb0"; // a code-born fish glows green
        clone.cloneCd = 150;
        f.cloneCd = 150;
        this.actors.push(clone);
        if (this.onEvent) this.onEvent("code_clone_fish", "CODE REPLICATION");
      }

      // Swim: prefer staying submerged; gentle up/down bob plus lateral drift.
      if (Math.random() < 0.15) f.vy = [-1, 0, 1][(Math.random() * 3) | 0];
      const nx = x + f.vx;
      const ny = y + f.vy;
      if (sim.get(nx, ny) === WATER) { f.x = nx; f.y = ny; }
      else if (sim.get(nx, y) === WATER) { f.x = nx; f.vy = 0; }
      else { f.vx = -f.vx; f.vy = 0; }
      if (Math.random() < 0.02) f.vx = -f.vx;
      return;
    }

    // Out of water: flop around and slowly suffocate.
    f.air++;
    f.flop = (f.flop + 1) % 4;
    if (f.flop === 0) {
      const nx = x + f.vx;
      if (sim.get(nx, y) === EMPTY || sim.get(nx, y) === WATER) f.x = nx;
      else f.vx = -f.vx;
      if (sim.get(f.x, y + 1) === EMPTY) f.y += 1; // fall to the ground
    }
    if (f.air > 90) { f.alive = false; }
  }

  // ===================================================================
  // BIRD — a fragile flier. Soars above the terrain, avoids fire and void,
  // occasionally perches to rest. Devils like to set birds alight.
  // ===================================================================
  _stepBird(b, sim) {
    const x = b.x, y = b.y;
    b.wing = (b.wing + 1) % 6;

    // 0) Burning birds thrash and fall until they burn out.
    if (b.burning > 0) {
      b.burning--;
      if (sim.get(x, y) === WATER) { b.burning = 0; }
      b.vx = Math.random() < 0.5 ? -1 : 1;
      b.y += 1;
      if (Math.random() < 0.3) sim.set(x, y - 1, SMOKE);
      if (b.burning === 0) {
        b.alive = false;
        if (sim.get(x, y) === EMPTY) sim.set(x, y, ASH);
      }
      return;
    }

    // 1) Flee fire and the void.
    const aheadHot = isHot(sim.get(x + b.vx, y)) || isHot(sim.get(x + b.vx, y + 1));
    const aheadDread = isDread(sim.get(x + b.vx, y)) || isDread(sim.get(x, y + 2));
    if (aheadHot || aheadDread) {
      b.vx = -b.vx;
      b.panicked = 40;
      b.resting = 0;
    }
    if (b.panicked > 0) b.panicked--;

    // 2) Perched birds rest a while, then take off.
    const onGround = !isAir(sim.get(x, y + 1));
    if (b.resting > 0) {
      b.resting--;
      if (b.resting === 0) b.vy = -1; // take off
      return;
    }

    // 3) Flight. Birds want to stay roughly a screen-slice above the ground.
    if (Math.random() < 0.04 && onGround && b.panicked === 0) {
      b.resting = 40 + ((Math.random() * 90) | 0);
      b.vy = 0;
      return;
    }

    // Steer toward open air; never fly into solids.
    if (Math.random() < 0.1) b.vy = [-1, 0, 1][(Math.random() * 3) | 0];
    const nx = x + b.vx;
    const ny = Math.max(1, Math.min(sim.rows - 2, y + b.vy));
    if (!isSolid(sim.get(nx, ny)) && !isDread(sim.get(nx, ny))) {
      b.x = nx; b.y = ny;
    } else if (!isSolid(sim.get(x, ny)) && !isDread(sim.get(x, ny))) {
      b.y = ny; b.vx = -b.vx; // rise/fall, reverse
    } else {
      b.vx = -b.vx;
    }

    // Don't drift off the top/bottom edges.
    if (b.y < 2) b.vy = 1;
    if (b.y > sim.rows - 6) b.vy = -1;
    if (Math.random() < 0.015) b.vx = -b.vx;
  }

  // ===================================================================
  // ANGEL — "The Guardian". Wanders peacefully, seeks out humans in danger,
  // pulls them away from hazards, and steers clear of chaos and the void.
  // ===================================================================
  _stepAngel(a, sim) {
    const x = a.x, y = a.y;
    a.wing = (a.wing + 1) % 8;

    // 0) The angel PURGES the void. Anything strange within her halo is slowly
    //    sealed shut, turning back to ordinary air with a wisp of steam. She
    //    deliberately drifts toward it rather than merely bumping into it.
    let cleansed = false;
    const HALO = 3;
    for (let dy = -HALO; dy <= HALO; dy++) {
      for (let dx = -HALO; dx <= HALO; dx++) {
        if (dx === 0 && dy === 0) continue;
        const vx = x + dx, vy = y + dy;
        if (!isDread(sim.get(vx, vy))) continue;
        // Inner ring purges quickly; the outer halo more slowly.
        const chance = (Math.abs(dx) + Math.abs(dy) <= 2) ? 0.35 : 0.12;
        if (Math.random() < chance) {
          sim.set(vx, vy, EMPTY);
          cleansed = true;
          if (sim.get(vx, vy - 1) === EMPTY) sim.set(vx, vy - 1, STEAM);
        }
        a.cleansing = 20;
      }
    }
    if (a.cleansing > 0) a.cleansing--;

    // 0a) If the angel senses void / dark matter nearby, she moves toward it.
    if (!cleansed) {
      for (let r = 5; r <= 25; r += 4) {
        let found = false;
        for (const ddx of [a.vx, -a.vx]) {
          const sx = x + ddx * r;
          if (sim.inBounds(sx, y) && isDread(sim.get(sx, y))) {
            a.vx = ddx; found = true; break;
          }
        }
        if (found) break;
      }
      if (isDread(sim.get(x, y + 1)) && (a.cleansing % 3 !== 0)) a.y += 1;
      else if (isDread(sim.get(x, y - 1))) a.y -= 1;
    }

    // 0b) The angel also purges BLACK HOLES. Slower still, but it works — a
    //     visible miracle you have to watch for.
    for (const bh of this.actors) {
      if (bh.kind !== "blackhole" || !bh.alive) continue;
      const bd = Math.abs(bh.x - x) + Math.abs(bh.y - y);
      if (bd > 5) continue;
      a.cleansing = 30;
      // Steadily wears the hole down while she stands beside it.
      if (Math.random() < 0.03) {
        bh.size -= 1;
        bh.fed = Math.max(0, bh.fed - 20);
        if (sim.get(bh.x, bh.y) === VOID) sim.set(bh.x, bh.y, EMPTY);
        if (bh.size <= 1) {
          bh.alive = false;
          // The hole collapses into a ring of light.
          for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1]]) {
            if (sim.get(bh.x + dx, bh.y + dy) === EMPTY) sim.set(bh.x + dx, bh.y + dy, STEAM);
          }
        }
        cleansed = true;
      }
      // Move toward the hole rather than away.
      const bdx = bh.x - x;
      if (Math.abs(bdx) > 1) a.vx = bdx > 0 ? 1 : -1;
      if (Math.abs(bh.y - y) > 2 && Math.random() < 0.4) a.y += bh.y > y ? 1 : -1;
    }

    // 1) Nope out of void / dark matter (unless actively cleansing it).
    if (!cleansed && (isDread(sim.get(x + a.vx, y)) || isDread(sim.get(x, y + 1)))) {
      a.vx = x < sim.cols / 2 ? 1 : -1;
    }

    // 2) Pick the most endangered human OR creature as a target.
    let best = null, bestScore = -1;
    const wards = this.actors.filter((c) =>
      (c.kind === "human" || c.kind === "bird" || c.kind === "fish") && c.alive);
    for (const h of wards) {
      const d = Math.abs(h.x - x) + Math.abs(h.y - y);
      if (d > 60) continue;
      let danger = 0;
      if (h.burning > 0) danger += 6;
      if (h.kind === "fish" && h.air > 20) danger += 4;
      if (sim.get(h.x, h.y) === WATER || sim.get(h.x, h.y + 1) === WATER) danger += 1;
      if (isHot(sim.get(h.x + 1, h.y)) || isHot(sim.get(h.x - 1, h.y))) danger += 3;
      for (const other of this.actors) {
        if (other.kind === "blackhole") {
          const bd2 = Math.abs(other.x - h.x) + Math.abs(other.y - h.y);
          if (bd2 < 30) danger += 4;
        } else if (other.kind === "devil" && other.alive) {
          const dd = Math.abs(other.x - h.x) + Math.abs(other.y - h.y);
          if (dd < 8) danger += 3; // shielding from a devil is a priority
        }
      }
      const score = danger * 10 - d * a.trait.guard;
      if (score > bestScore) { bestScore = score; best = h; }
    }
    a.target = best;

    // 3) Move toward the target (or wander if there is none).
    if (a.pause > 0) { a.pause--; return; }

    if (best) {
      const dx = best.x - x;
      const dy = best.y - y;
      if (Math.abs(dx) > 1) a.vx = dx > 0 ? 1 : -1;
      // The angel descends toward a grounded ward, hover otherwise.
      if (Math.abs(dy) > 2 && Math.random() < 0.5) a.y += dy > 0 ? 1 : -1;

      // Guardian impulse: shield the ward from nearby heat.
      if (best.burning > 0 && Math.abs(dx) <= 3) {
        best.burning = Math.max(0, best.burning - 3);
        best.guarded = 60;
        if (sim.get(best.x, best.y - 1) === EMPTY) sim.set(best.x, best.y - 1, STEAM);
      }
      // Rescue a stranded fish: bless it back into the nearest water, or if
      // none is close, at least stop it suffocating with a splash.
      if (best.kind === "fish" && best.air > 20 && Math.abs(dx) <= 3) {
        best.air = 0;
        if (sim.get(best.x, best.y + 1) === EMPTY) sim.set(best.x, best.y + 1, WATER);
      }
      // Calm a panicking creature.
      if (Math.abs(dx) <= 2 && best.panicked > 0) best.panicked = 0;
    } else if (Math.random() < 0.02) {
      a.vx = -a.vx;
    }

    const nx = x + a.vx;
    // Angels glide over obstacles (they hover) — only solid rock/void stops them.
    const ahead = sim.get(nx, y);
    const aheadBelow = sim.get(nx, y + 1);
    if (!isDread(ahead)) {
      a.x = nx;
    } else {
      a.vx = -a.vx;
    }
    // Gentle bobbing: float up toward open air, settle toward the ground.
    if (isAir(sim.get(x, y - 1)) && Math.random() < 0.1) a.y -= 1;
    else if (isAir(sim.get(x, y + 1)) && !isAir(aheadBelow) && Math.random() < 0.3) a.y += 1;
    if (Math.random() < 0.01) a.pause = 20 + ((Math.random() * 30) | 0);
  }

  // ===================================================================
  // DEVIL — "The Troublemaker". Drawn to fire, stalks humans, and idly
  // starts blazes. Curious about the void. Enjoys chaos for its own sake.
  // ===================================================================
  _stepDevil(d, sim) {
    const x = d.x, y = d.y;
    d.flames = (d.flames + 1) % 6;

    // 0) The devil's signature cruelty: when it gets close to a HUMAN or a
    //    BIRD, it may simply set them ablaze. Not always — sometimes it just
    //    watches, which makes it all the more unsettling.
    for (const c of this.actors) {
      if (!c.alive || c.burning > 0) continue;
      if (c.kind !== "human" && c.kind !== "bird") continue;
      const dist = Math.abs(c.x - x) + Math.abs(c.y - y);
      if (dist > 3) continue;
      if (Math.random() < 0.012 * d.trait.firelust) {
        c.burning = BURN_MIN + Math.floor(Math.random() * (BURN_MAX - BURN_MIN));
        if (c.kind === "human") c.panicked = 90;
        d.crueltyTimer = 60;
      }
    }
    if (d.crueltyTimer > 0) d.crueltyTimer--;

    // 1) Choose a victim — humans and birds are both fair game.
    let best = null, bestScore = -1;
    const prey = this.actors.filter((c) =>
      (c.kind === "human" || c.kind === "bird") && c.alive);
    for (const h of prey) {
      const dist = Math.abs(h.x - x) + Math.abs(h.y - y);
      if (dist > 80) continue;
      const score = (h.burning > 0 ? 20 : 0) + (h.panicked > 0 ? 10 : 0) - dist * d.trait.cruelty;
      if (score > bestScore) { bestScore = score; best = h; }
    }
    d.target = best;

    if (d.pause > 0) { d.pause--; return; }

    if (best) {
      const dx = best.x - x;
      const dy = best.y - y;
      if (Math.abs(dx) > 2) d.vx = dx > 0 ? 1 : -1;
      // Fly up toward birds it is chasing.
      if (best.kind === "bird" && dy < -2 && Math.random() < 0.4) d.y -= 1;

      // Mischief: follow the target, occasionally light a fire beside them.
      if (Math.abs(dx) <= 3 && Math.random() < 0.02 * d.trait.firelust) {
        const fy = best.y - 1;
        if (sim.get(best.x, fy) === EMPTY && !isHot(sim.get(best.x, fy))) {
          sim.set(best.x, fy, FIRE);
        }
      }
      // Scare them a little.
      if (Math.abs(dx) <= 2) best.panicked = Math.max(best.panicked, 40);
    } else if (Math.random() < 0.04) {
      d.vx = -d.vx;
    }

    // Attraction to fire — devils like to hang around open flames.
    let fireNear = false;
    for (let i = -3; i <= 3; i++) if (isHot(sim.get(x + i, y))) { fireNear = true; break; }
    if (!fireNear && Math.random() < 0.5) {
      for (const dir of [-1, 1]) {
        for (let step = 1; step <= 25; step++) {
          const probe = sim.get(x + dir * step, y);
          if (isHot(probe)) { d.vx = dir; break; }
        }
      }
    }

    const nx = x + d.vx;
    if (!isSolid(sim.get(nx, y))) d.x = nx;
    else if (isAir(sim.get(nx, y - 1))) { d.x = nx; d.y -= 1; }
    else d.vx = -d.vx;

    // Gravity for the devil (it walks like a person, doesn't hover).
    if (isAir(sim.get(d.x, d.y + 1))) d.y += 1;

    if (Math.random() < 0.01) d.pause = 15 + ((Math.random() * 25) | 0);
  }

  // ===================================================================
  // BLACK HOLE — no alignment, only appetite. Pulls matter inward and eats
  // whatever reaches its centre.
  // ===================================================================
  _stepBlackHole(bh, sim) {
    bh.spin += 0.15;
    const R = 4 + bh.size * 2;
    const r2 = R * R;

    // 1) Gravitational pull: nudge nearby loose matter one cell inward.
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dy === 0) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const px = bh.x + dx, py = bh.y + dy;
        if (!sim.inBounds(px, py)) continue;
        const id = sim.get(px, py);
        if (id === EMPTY || id === VOID || id === DARK_MATTER) continue;
        if (id === STONE || id === METAL || id === GLASS) continue; // heavy things resist
        // Stronger pull the closer the particle.
        if (Math.random() > 0.85 / Math.sqrt(d2)) continue;
        const tx = px - Math.sign(dx);
        const ty = py - Math.sign(dy);
        if (sim.get(tx, ty) === EMPTY) sim._swap(px, py, tx, ty);
      }
    }

    // 2) Consume anything that reached the core; grow a little.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = bh.x + dx, py = bh.y + dy;
        if (!sim.inBounds(px, py)) continue;
        const id = sim.get(px, py);
        if (id === EMPTY || id === VOID || id === DARK_MATTER) continue;
        if (sim.get(px, py) === STONE) continue;
        sim.set(px, py, EMPTY);
        bh.fed++;
        if (bh.fed % 12 === 0 && bh.size < 6) bh.size += 1;
      }
    }

    // 3) Scare nearby humans — they run from it.
    for (const h of this.actors) {
      if (h.kind !== "human" || !h.alive) continue;
      const dx = h.x - bh.x, dy = h.y - bh.y;
      if (dx * dx + dy * dy > 24 * 24) continue;
      h.panicked = Math.max(h.panicked, 60);
      h.vx = dx >= 0 ? 1 : -1;
    }

    // 4) Leave a mark in the world so it reads as a hole, not an actor.
    if (sim.get(bh.x, bh.y) !== VOID) sim.set(bh.x, bh.y, VOID);
  }

  _stepHuman(h, sim) {
    const curX = h.x;
    const curY = h.y;
    const here = sim.get(curX, curY);
    const below = sim.get(curX, curY + 1);
    const above = sim.get(curX, curY - 1);

    // ---------------- 1. BURIED MECHANIC ----------------
    // If heavy materials cover head and torso the human is trapped and
    // slowly suffocates, unless it manages to dig upward.
    if (isWalkable(here) || isWalkable(above)) {
      h.buried++;
      if (h.buried > 110) {
        h.alive = false;
        if (sim.get(curX, curY) === EMPTY) sim.set(curX, curY, ASH);
        return;
      }
      // Attempt to struggle upwards
      if (Math.random() < 0.25 && isAir(sim.get(curX, curY - 2))) {
        h.y -= 1;
      }
      return;
    } else {
      h.buried = Math.max(0, h.buried - 1);
    }

    // ---------------- 1b. CORROSION / HOT GROUND ----------------
    // Standing on glowing heated stone hurts — the human flees it.
    if (below === HEATED_STONE) {
      h.burning = Math.max(h.burning, 30);
    }

    // ---------------- 2. DIGITIZED MATRIX INTERACTION ----------------
    if (h.digitized > 0) {
      h.digitized--;
      // Digitized humans slide sideways erratically and can pass through
      // thin gas, echoing the glitchy code they're infected with.
      if (Math.random() < 0.2) {
        const nx = h.x + (Math.random() < 0.5 ? -1 : 1);
        if (!isSolid(sim.get(nx, h.y))) h.x = Math.max(1, Math.min(sim.cols - 2, nx));
      }
      // DIGITAL CLONING: a human soaked in code can be duplicated by it.
      // Deliberately rare, capped, and cooldown-limited so the population
      // grows as a slow, eerie creep — not a plague.
      if (h.cloneCd > 0) h.cloneCd--;
      if (h.cloneCd === 0 && Math.random() < 0.012 && this._countKind("human") < this.maxActors) {
        const gx = h.x + (Math.random() < 0.5 ? -2 : 2);
        const gy = h.y;
        // The clone appears in an adjacent OPEN cell — its own cell and the
        // cell above must be clear (it stands on whatever ground is there).
        if (sim.inBounds(gx, gy) && !isSolid(sim.get(gx, gy)) && !isSolid(sim.get(gx, gy - 1))) {
          const clone = new Human(gx, gy);
          clone.digitized = 180; // the copy is code-born
          clone.cloneCd = 120;   // the copy can't immediately clone again
          this.actors.push(clone);
          h.cloneCd = 120;       // nor can the original
          // A little burst of code to sell the moment.
          for (let i = 0; i < 4; i++) {
            const cx2 = h.x + ((Math.random() * 5) | 0) - 2;
            const cy2 = h.y - ((Math.random() * 3) | 0);
            if (sim.get(cx2, cy2) === EMPTY) sim.set(cx2, cy2, CODE);
          }
          if (this.onEvent) this.onEvent("code_clone", "CODE REPLICATION");
        }
      }
      if (h.digitized === 0) h.burning = 0;
    } else {
      // Touch code to become digitized
      if (here === CODE || below === CODE || sim.get(curX + h.vx, curY) === CODE) {
        h.digitized = 180;
      }
    }

    // ---------------- 3. BURNING REACTION & WATER EXTINCTION ----------------
    if (h.burning > 0) {
      h.burning--;

      // If in water, fire is quenched!
      if (here === WATER || below === WATER) {
        h.burning = 0;
        if (isAir(above)) sim.set(curX, curY - 1, STEAM);
      } else {
        // Panic run!
        if (Math.random() < 0.25) h.vx = -h.vx;
        const nx = h.x + h.vx;
        if (!isSolid(sim.get(nx, h.y))) h.x = nx;
        if (isAir(sim.get(h.x, h.y + 1))) h.y += 1;

        if (h.burning === 0) {
          h.alive = false;
          if (sim.get(h.x, h.y) === EMPTY) sim.set(h.x, h.y, ASH);
        }
        return;
      }
    }

    // Check ignition from surrounding heat
    if (h.burning === 0 && h.digitized === 0) {
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1]]) {
        if (isHot(sim.get(curX + dx, curY + dy))) {
          h.burning = BURN_MIN + Math.floor(Math.random() * (BURN_MAX - BURN_MIN));
          return;
        }
      }
    }

    // ---------------- 3b. CORRUPTED CODE FLEE ----------------
    // Corrupted data is contagious and unsettling — humans back away from it.
    if (h.digitized === 0) {
      const aheadCC = sim.get(curX + h.vx, curY);
      if (aheadCC === CORRUPTED_CODE || sim.get(curX, curY) === CORRUPTED_CODE) {
        h.vx = -h.vx;
        h.pause = 12;
        return;
      }
    }

    // ---------------- 3c. VOID / BLACK HOLE DREAD ----------------
    // Void and dark matter are unnerving; a nearby black hole terrifies them.
    if (isDread(here) || isDread(sim.get(curX + h.vx, curY))) {
      h.panicked = Math.max(h.panicked, 50);
      h.vx = -h.vx;
      h.pause = 6;
      return;
    }
    if (h.panicked === 0) {
      for (const a of this.actors) {
        if (a.kind !== "blackhole") continue;
        const bdx = curX - a.x, bdy = curY - a.y;
        if (bdx * bdx + bdy * bdy < 400) {
          h.panicked = Math.max(h.panicked, 60);
          h.vx = bdx >= 0 ? 1 : -1;
          break;
        }
      }
    }

    // ---------------- 3d. ANGEL'S CALM ----------------
    // A guarded human stops panicking and may even resist a devil's lure.
    if (h.guarded > 0) {
      h.guarded--;
      if (h.panicked > 0 && Math.random() < 0.3) h.panicked--;
      h.lured = 0;
    } else if (h.lured > 0) {
      h.lured--;
    }

    // ---------------- 4. WATER / SWIMMING ----------------
    if (here === WATER) {
      h.swimming = true;
      // Swim toward the surface
      if (sim.get(curX, curY - 1) === WATER || isAir(sim.get(curX, curY - 1))) {
        h.y -= 1;
      }
      if (Math.random() < 0.3) {
        h.x += Math.random() < 0.5 ? -1 : 1;
      }
      return;
    }

    if (below === WATER) {
      h.swimming = true;
      // Tread water & paddle laterally
      if (Math.random() < 0.25) {
        const sideW = sim.get(curX + h.vx, curY + 1) === WATER;
        if (sideW) h.x += h.vx;
        else h.vx = -h.vx;
      }
      return;
    }
    h.swimming = false;

    // ---------------- 5. GRAVITY / FALLING ----------------
    if (isAir(below)) {
      h.y += 1;
      return;
    }

    // ---------------- 6. FIRE / HAZARD AVOIDANCE ----------------
    // Look two cells ahead and scan the ground, so humans turn away from fire
    // before they're standing in it rather than walking straight into flames.
    let hazardAhead = false;
    for (let step = 1; step <= 2 && !hazardAhead; step++) {
      const ax = curX + h.vx * step;
      if (isHot(sim.get(ax, curY)) || isHot(sim.get(ax, curY + 1)) ||
          isHot(sim.get(ax, curY - 1))) {
        hazardAhead = true;
      }
    }
    if (hazardAhead) {
      h.vx = -h.vx;
      h.pause = 8;
      return;
    }

    // ---------------- 7. LOCOMOTION & PATHFINDING ----------------
    if (h.pause > 0) {
      h.pause--;
      return;
    }
    // Idle pause (suppressed while panicked)
    if (h.panicked === 0 && Math.random() < 0.015) {
      h.pause = 15 + Math.floor(Math.random() * 35);
      return;
    }
    // Spontaneous turn (rare while panicked)
    if (h.panicked === 0 && Math.random() < 0.01) {
      h.vx = -h.vx;
    }

    h.stepCount++;
    if (h.stepCount % 3 === 0) {
      h.walkCycle = 1 - h.walkCycle;
    }

    const nx = h.x + h.vx;
    const f0 = sim.get(nx, h.y);
    const f1 = sim.get(nx, h.y - 1);
    const f2 = sim.get(nx, h.y - 2);
    const g1 = sim.get(nx, h.y + 1);

    // Rule A: Normal Walk along flat ground
    if (!isSolid(f0) && isWalkable(g1)) {
      h.x = nx;
      return;
    }

    // Rule B: Step up 1 pixel
    if (isSolid(f0) && !isSolid(f1)) {
      h.x = nx;
      h.y -= 1;
      return;
    }

    // Rule C: Step up 2 pixels
    if (isSolid(f0) && isSolid(f1) && !isSolid(f2)) {
      h.x = nx;
      h.y -= 2;
      return;
    }

    // Rule D: Hop 1-cell gap
    if (!isSolid(f0) && isAir(g1)) {
      const gx2 = h.x + h.vx * 2;
      const ga = sim.get(gx2, h.y);
      const gb = sim.get(gx2, h.y + 1);
      if (!isSolid(ga) && isWalkable(gb)) {
        h.x = gx2;
        return;
      }
      // Cliff drop ahead — turn around rather than plummeting
      h.vx = -h.vx;
      return;
    }

    // Rule E: Wall blocked — turn around
    h.vx = -h.vx;
  }

  draw(displayCtx, canvas, cols, rows) {
    const sx = canvas.width / cols;
    const sy = canvas.height / rows;

    for (const a of this.actors) {
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue;
      switch (a.kind) {
        case "fish":      this._drawFish(displayCtx, sx, sy, a); break;
        case "bird":      this._drawBird(displayCtx, sx, sy, a); break;
        case "angel":     this._drawAngel(displayCtx, sx, sy, a); break;
        case "devil":     this._drawDevil(displayCtx, sx, sy, a); break;
        case "blackhole": this._drawBlackHole(displayCtx, sx, sy, a); break;
        default:          this._drawHuman(displayCtx, sx, sy, a); break;
      }
    }
  }

  // ---------------------------------------------------------------- fish
  _drawFish(ctx, sx, sy, f) {
    const cx = f.x * sx + sx * 0.5;
    const cy = f.y * sy + sy * 0.5;
    const bw = sx * 1.4, bh = sy * 0.8;
    ctx.fillStyle = f.hue;
    ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
    // tail
    ctx.fillRect(cx - f.vx * bw * 0.9, cy - bh * 0.3, sx * 0.5, bh * 0.6);
    // eye
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(cx + (f.vx > 0 ? bw * 0.2 : -bw * 0.4), cy - bh * 0.25, sx * 0.3, sy * 0.3);
    // gasp bubble when stranded
    if (f.air > 30 && f.air % 20 < 10) {
      ctx.fillStyle = "rgba(200,230,255,0.8)";
      ctx.fillRect(cx, cy - sy * 1.6, sx * 0.4, sy * 0.4);
    }
  }

  // ---------------------------------------------------------------- bird
  _drawBird(ctx, sx, sy, b) {
    const cx = b.x * sx + sx * 0.5;
    const cy = b.y * sy + sy * 0.5;
    const flap = b.wing < 3 ? -1 : 1;

    // Burning aura
    if (b.burning > 0) {
      ctx.fillStyle = `rgba(255, ${(60 + Math.random() * 80) | 0}, 20, 0.7)`;
      ctx.fillRect(cx - sx * 1.6, cy - sy * 1.6, sx * 3.2, sy * 3.2);
    }

    const body = b.burning > 0 ? "#ff7020" : "#2b2b3a";
    ctx.fillStyle = body;
    ctx.fillRect(cx - sx * 0.7, cy - sy * 0.5, sx * 1.4, sy * 0.9);
    // Head + beak
    ctx.fillRect(cx + (b.vx > 0 ? sx * 0.5 : -sx * 1.1), cy - sy * 0.9, sx * 0.7, sy * 0.7);
    ctx.fillStyle = "#ffbf00";
    ctx.fillRect(cx + (b.vx > 0 ? sx * 1.2 : -sx * 1.5), cy - sy * 0.5, sx * 0.4, sy * 0.3);
    // Wings (flap up/down)
    ctx.fillStyle = b.burning > 0 ? "#ffa040" : "#4a4a60";
    const wy = cy - sy * 0.2 + flap * sy * 0.5;
    ctx.fillRect(cx - sx * 2.0, wy, sx * 1.5, sy * 0.4);
    ctx.fillRect(cx + sx * 0.5, wy, sx * 1.5, sy * 0.4);
  }

  // ---------------------------------------------------------------- angel
  _drawAngel(ctx, sx, sy, a) {
    const cx = a.x * sx + sx * 0.5;
    const feetY = (a.y + 1) * sy;
    const w = sx * 1.6;
    const left = cx - w * 0.5;
    const flap = a.wing < 4 ? 0 : 1;

    // Halo
    ctx.fillStyle = "rgba(255, 235, 120, 0.9)";
    ctx.fillRect(cx - w * 0.55, feetY - sy * 3.2, w * 1.1, sy * 0.35);
    // Wings
    ctx.fillStyle = "rgba(240, 250, 255, 0.95)";
    const wy = feetY - sy * 2.4 + flap * sy * 0.3;
    ctx.fillRect(left - w * 0.6, wy, w * 0.7, sy * 1.6);
    ctx.fillRect(left + w * 0.9, wy, w * 0.7, sy * 1.6);
    // Robe
    ctx.fillStyle = "#fdfdff";
    ctx.fillRect(left, feetY - sy * 2.0, w, sy * 1.4);
    // Head
    ctx.fillStyle = "#ffe9c9";
    ctx.fillRect(cx - w * 0.35, feetY - sy * 2.7, w * 0.7, sy * 0.7);
    // Guardian shimmer when actively protecting
    if (a.target && a.target.guarded > 0) {
      ctx.fillStyle = "rgba(255,255,180,0.25)";
      ctx.fillRect(cx - sx * 3, feetY - sy * 3.5, sx * 6, sy * 4);
    }
  }

  // ---------------------------------------------------------------- devil
  _drawDevil(ctx, sx, sy, d) {
    const cx = d.x * sx + sx * 0.5;
    const feetY = (d.y + 1) * sy;
    const w = sx * 1.6;
    const left = cx - w * 0.5;

    // Flickering flame aura
    if (Math.random() < 0.6) {
      ctx.fillStyle = `rgba(255,${(60 + Math.random() * 80) | 0},20,0.5)`;
      ctx.fillRect(left - w * 0.2, feetY - sy * 3.0, w * 1.4, sy * 3.0);
    }
    // Body
    ctx.fillStyle = "#b41e1e";
    ctx.fillRect(left, feetY - sy * 1.7, w, sy * 1.0);
    // Head
    ctx.fillStyle = "#e04040";
    ctx.fillRect(cx - w * 0.35, feetY - sy * 2.4, w * 0.7, sy * 0.75);
    // Horns
    ctx.fillStyle = "#2a0a0a";
    ctx.fillRect(cx - w * 0.4, feetY - sy * 2.9, sx * 0.4, sy * 0.5);
    ctx.fillRect(cx + w * 0.6, feetY - sy * 2.9, sx * 0.4, sy * 0.5);
    // Eyes
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(cx - w * 0.25, feetY - sy * 2.15, sx * 0.3, sy * 0.3);
    ctx.fillRect(cx + w * 0.15, feetY - sy * 2.15, sx * 0.3, sy * 0.3);
  }

  // ---------------------------------------------------------------- black hole
  _drawBlackHole(ctx, sx, sy, bh) {
    const cx = bh.x * sx + sx * 0.5;
    const cy = bh.y * sy + sy * 0.5;
    const core = Math.max(sx * 1.6, sx * (1.5 + bh.size * 0.5));

    // Accretion swirl
    const t = bh.spin;
    for (let i = 3; i >= 1; i--) {
      const r = core * (1 + i * 0.7);
      ctx.strokeStyle = `rgba(${120 + i * 20}, ${40 + i * 30}, ${200 - i * 30}, ${0.25 / i})`;
      ctx.lineWidth = Math.max(1, sx * 0.4);
      ctx.beginPath();
      ctx.arc(cx, cy, r, t * (i * 0.4), t * (i * 0.4) + Math.PI * 1.4);
      ctx.stroke();
    }
    // The dark core
    ctx.fillStyle = "#05030a";
    ctx.beginPath();
    ctx.arc(cx, cy, core, 0, Math.PI * 2);
    ctx.fill();
    // Event-horizon rim
    ctx.strokeStyle = "rgba(150, 80, 255, 0.7)";
    ctx.lineWidth = Math.max(1, sx * 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy, core, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---------------------------------------------------------------- human
  _drawHuman(displayCtx, sx, sy, h) {
    const w = sx * 1.5;
    {
      if (!Number.isFinite(h.x) || !Number.isFinite(h.y)) return;
      const feetY = (h.y + 1) * sy;
      const cx = h.x * sx + sx * 0.5;
      const left = cx - w * 0.5;

      // Burning fire aura
      if (h.burning > 0) {
        const f = 0.6 + Math.random() * 0.4;
        displayCtx.fillStyle = `rgba(255, ${(70 + Math.random() * 110) | 0}, 20, ${f})`;
        displayCtx.fillRect(left - w * 0.3, feetY - sy * 2.8, w * 1.6, sy * 3.0);
      }

      // Digitized matrix aura
      if (h.digitized > 0) {
        displayCtx.fillStyle = "rgba(0, 229, 255, 0.4)";
        displayCtx.fillRect(left - w * 0.2, feetY - sy * 2.6, w * 1.4, sy * 2.8);
      }

      // Legs with 2-frame walking stride
      const legColor = h.digitized > 0 ? "#00e5ff" : "#1a7010";
      displayCtx.fillStyle = legColor;
      const legH = sy * 0.8;
      const legW = w * 0.35;

      if (h.swimming) {
        // Tucked swimming legs
        displayCtx.fillRect(left + w * 0.2, feetY - legH * 0.5, w * 0.6, legH * 0.5);
      } else if (h.walkCycle === 0) {
        displayCtx.fillRect(left + w * 0.1, feetY - legH, legW, legH);
        displayCtx.fillRect(left + w * 0.55, feetY - legH * 0.7, legW, legH * 0.7);
      } else {
        displayCtx.fillRect(left + w * 0.1, feetY - legH * 0.7, legW, legH * 0.7);
        displayCtx.fillRect(left + w * 0.55, feetY - legH, legW, legH);
      }

      // Torso / Shirt
      let bodyColor = "#39ff14";
      if (h.burning > 0) bodyColor = "#ff9530";
      else if (h.digitized > 0) bodyColor = "#00e5ff";
      else if (h.panicked > 0) bodyColor = "#ffe066"; // alarmed — flashes yellow
      displayCtx.fillStyle = bodyColor;
      displayCtx.fillRect(left, feetY - sy * 1.6, w, sy * 0.85);

      // Buried humans lose their torso to whatever covers them (already drawn
      // by the sim), so we add a small struggling hand above the surface.
      if (h.buried > 4 && h.buried < 110) {
        displayCtx.fillStyle = "#e8e4d8";
        displayCtx.fillRect(cx - sx * 0.2, feetY - sy * 2.1, sx * 0.4, sy * 0.4);
      }

      // Head
      let headColor = "#e8fff0";
      if (h.burning > 0) headColor = "#ffd8a0";
      else if (h.digitized > 0) headColor = "#d0ffff";
      displayCtx.fillStyle = headColor;
      const headW = w * 0.85;
      const headH = sy * 0.75;
      const headX = cx - headW * 0.5;
      const headY = feetY - sy * 2.35;
      displayCtx.fillRect(headX, headY, headW, headH);

      // Eye dot facing walking direction
      displayCtx.fillStyle = "#0a0c10";
      const eyeX = h.vx > 0 ? headX + headW - sx * 0.35 : headX + sx * 0.1;
      displayCtx.fillRect(eyeX, headY + headH * 0.25, sx * 0.3, sy * 0.3);
    }
  }
}