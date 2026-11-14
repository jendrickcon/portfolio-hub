/**
 * SANDBOX — Presets
 *
 * Each preset builds an interactive living starting world with real materials
 * and inhabitants. Once seeded, physics and emergent interactions take over immediately.
 */

import {
  SAND, WATER, STONE, FIRE, SMOKE, WOOD, CODE, EMPTY,
  OIL, LAVA, GLASS, MUD, BURNING_WOOD, HEATED_STONE, WET_SAND, ASH,
  METAL, EMBER, DUST, VOID, PLANT,
  SOIL, SEED, SPROUT, TRUNK, BRANCH, LEAF, CLOUD
} from "./materials.js";

const SOLID_GROUND = new Set([STONE, WOOD, GLASS, SAND, WET_SAND, MUD, ASH, METAL]);

/**
 * Places an actor on open ground beneath column `x`.
 *
 * Strategy: scan the whole column top-to-bottom and stand on the first spot
 * where a solid surface has two cells of clear headroom above it. Terrain
 * `fromY` is treated as a hint — we start there but fall back to a full scan
 * so steep presets (volcano slopes, dunes) still get inhabitants on the crest.
 */
function spawnOnGround(sim, actors, x, fromY, kind) {
  if (!actors) return;
  const col = Math.max(1, Math.min(sim.cols - 2, Math.round(x)));
  const start = Math.max(1, Math.min(sim.rows - 2, Math.round(fromY)));

  const standable = (y) => {
    const ground = sim.get(col, y + 1);
    const body = sim.get(col, y);
    const head = sim.get(col, y - 1);
    return SOLID_GROUND.has(ground) &&
      (body === EMPTY || body === WATER) &&
      (head === EMPTY || head === WATER);
  };

  const place = (y) => kind ? actors.spawnKind(kind, col, y) : actors.spawn(col, y);

  // Preferred: nearest standable spot at or below the hint.
  for (let y = start; y < sim.rows - 2; y++) {
    if (standable(y)) { place(y); return; }
  }
  // Fallback: nearest standable spot at or above the hint.
  for (let y = start; y > 1; y--) {
    if (standable(y)) { place(y); return; }
  }
}

/** Places a creature/entity in a specific material (e.g. fish in water). */
function spawnInMaterial(sim, actors, kind, materialId, wide = true) {
  if (!actors) return;
  // Find the densest pocket of `materialId` by sampling the grid.
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = 2 + Math.floor(Math.random() * (sim.cols - 4));
    const y = 2 + Math.floor(Math.random() * (sim.rows - 4));
    if (sim.get(x, y) === materialId) {
      if (!wide || (sim.get(x, y - 1) === materialId && sim.get(x, y + 1) === materialId)) {
        actors.spawnKind(kind, x, y);
        return;
      }
    }
  }
}

/**
 * BEACH — Sloping dunes, wooden pier, ocean surf, and coastal inhabitants.
 */
function beach(sim, actors) {
  const { cols, rows } = sim;
  const seaLevel = Math.floor(rows * 0.58);

  // Sloping sand shoreline on the left, ocean basin on the right
  for (let x = 0; x < cols; x++) {
    const t = x / cols;
    // Coastline profile
    const beachY = Math.floor(rows * 0.42 + t * (rows * 0.45));
    for (let y = beachY; y < rows; y++) {
      sim.set(x, y, SAND);
    }
    // Ocean water filling right side
    if (x > cols * 0.38) {
      for (let y = seaLevel; y < beachY; y++) {
        if (y < rows) sim.set(x, y, WATER);
      }
    }
  }

  // Wet sand along the waterline — the surf soaks the beach, and the wet
  // band then dries/piles differently from dry sand as the world runs.
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (sim.get(x, y) === SAND &&
          (sim.get(x, y - 1) === WATER || sim.get(x, y - 2) === WATER)) {
        sim.set(x, y, WET_SAND);
      }
    }
  }

  // Wooden pier stretching out over the ocean
  const pierY = seaLevel - 2;
  const pierStart = Math.floor(cols * 0.32);
  const pierEnd = Math.floor(cols * 0.68);
  for (let x = pierStart; x <= pierEnd; x++) {
    sim.set(x, pierY, WOOD);
  }
  // Pier support stilts
  for (const sx of [0.42, 0.54, 0.65]) {
    const px = Math.floor(cols * sx);
    for (let y = pierY + 1; y < rows; y++) {
      if (sim.get(px, y) === WATER || sim.get(px, y) === EMPTY) {
        sim.set(px, y, WOOD);
      } else break;
    }
  }

  // Beach umbrella / shade hut on the dry sand
  const hutX = Math.floor(cols * 0.18);
  const hutY = Math.floor(rows * 0.48);
  for (let x = hutX - 5; x <= hutX + 5; x++) sim.set(x, hutY - 7, WOOD);
  for (let y = hutY - 7; y < hutY; y++) sim.set(hutX, y, WOOD);

  if (actors) {
    spawnOnGround(sim, actors, hutX + 2, hutY - 1);
    spawnOnGround(sim, actors, pierStart + 6, pierY - 1);
    spawnOnGround(sim, actors, pierEnd - 3, pierY - 1);
    // Coastal life: swimmers in the surf, fish beneath the waves, gulls above.
    actors.spawn(Math.floor(cols * 0.75), seaLevel + 1);
    spawnInMaterial(sim, actors, "fish", WATER, false);
    spawnInMaterial(sim, actors, "fish", WATER, false);
    actors.spawnBird(Math.floor(cols * 0.4), Math.floor(rows * 0.2));
    actors.spawnBird(Math.floor(cols * 0.6), Math.floor(rows * 0.15));
  }
}

/**
 * VOLCANO — Towering mountain, active bubbling lava caldera, and sulfur smoke.
 */
function volcano(sim, actors) {
  const { cols, rows } = sim;
  const cx = Math.floor(cols / 2);
  const apexY = Math.floor(rows * 0.22);
  const calderaWidth = Math.max(6, Math.floor(cols * 0.09));

  // Volcano stone slopes
  for (let y = apexY; y < rows; y++) {
    const t = (y - apexY) / (rows - apexY);
    const halfWidth = Math.floor(t * cols * 0.46) + calderaWidth;
    for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
      sim.set(x, y, STONE);
    }
  }

  // Flat ground aprons either side — safe footholds for inhabitants so the
  // whole world isn't just lethal mountainside.
  const apronY = Math.floor(rows * 0.86);
  for (const [ax0, ax1] of [[0, Math.floor(cols * 0.07)], [Math.floor(cols * 0.93), cols]]) {
    for (let x = ax0; x < ax1; x++) {
      for (let y = apronY; y < rows; y++) sim.set(x, y, SAND);
    }
  }

  // Magma chamber carved inside
  const chamberDepth = Math.floor(rows * 0.35);
  for (let y = apexY; y < apexY + chamberDepth; y++) {
    const t = (y - apexY) / chamberDepth;
    const halfW = Math.floor(calderaWidth * (1.2 - t * 0.5));
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      sim.set(x, y, LAVA);
    }
  }

  // Glowing hot crust around the caldera rim — a hazard that spreads fire
  // and threatens the world's inhabitants.
  for (let y = apexY; y < apexY + chamberDepth + 4; y++) {
    const t = (y - apexY) / chamberDepth;
    const halfW = Math.floor(calderaWidth * (1.2 - t * 0.5));
    for (const sx of [cx - halfW - 1, cx + halfW + 1, cx - halfW - 2, cx + halfW + 2]) {
      sim.set(sx, y, HEATED_STONE);
    }
  }

  // Rising smoke above crater
  for (let i = 0; i < 14; i++) {
    const sx = cx + Math.floor((Math.random() - 0.5) * (calderaWidth * 1.5));
    const sy = apexY - 1 - Math.floor(Math.random() * 8);
    sim.set(sx, sy, SMOKE);
  }

  // Volcanic oil vein inside mountain
  for (let y = apexY + chamberDepth + 2; y < rows - 4; y++) {
    sim.set(cx + 8, y, OIL);
    sim.set(cx + 9, y, OIL);
  }

  if (actors) {
    // Settlers live on the flat aprons at the foot of the mountain, well
    // clear of the glowing caldera rim and its spreading fires.
    spawnOnGround(sim, actors, Math.floor(cols * 0.03), apronY - 2);
    spawnOnGround(sim, actors, Math.floor(cols * 0.06), apronY - 2);
    spawnOnGround(sim, actors, Math.floor(cols * 0.95), apronY - 2);
  }
}

/**
 * CAMPFIRE — Stone ring, stacked wooden logs, burning embers, and campers.
 */
function campfire(sim, actors) {
  const { cols, rows } = sim;
  const cx = Math.floor(cols / 2);
  const groundY = Math.floor(rows * 0.75);

  // Ground layer
  for (let x = 0; x < cols; x++) {
    for (let y = groundY; y < rows; y++) {
      sim.set(x, y, y === groundY ? SAND : STONE);
    }
  }

  // Stone hearth ring
  const ringR = Math.max(6, Math.floor(cols * 0.08));
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -ringR; dx <= ringR; dx++) {
      const dist = Math.abs(dx);
      if (dist >= ringR - 2 && dist <= ringR) {
        sim.set(cx + dx, groundY + dy, STONE);
      }
    }
  }

  // Stacked wood logs
  for (let dy = -4; dy <= -1; dy++) {
    const span = ringR - 3;
    for (let dx = -span; dx <= span; dx++) {
      sim.set(cx + dx, groundY + dy, WOOD);
    }
  }

  // Active fire and glowing embers in center
  for (let dx = -2; dx <= 2; dx++) {
    sim.set(cx + dx, groundY - 2, BURNING_WOOD);
    sim.set(cx + dx, groundY - 5, FIRE);
  }

  // Rising smoke
  for (let i = 0; i < 8; i++) {
    const sx = cx + Math.floor((Math.random() - 0.5) * 5);
    const sy = groundY - 7 - Math.floor(Math.random() * 8);
    sim.set(sx, sy, SMOKE);
  }

  // Campers sitting nearby
  if (actors) {
    spawnOnGround(sim, actors, cx - ringR - 4, groundY - 3);
    spawnOnGround(sim, actors, cx + ringR + 4, groundY - 3);
    spawnOnGround(sim, actors, cx - ringR - 12, groundY - 3);
  }
}

/**
 * DESERT — Shifting dunes, stone obelisks, ancient glass relic, and oasis.
 */
function desert(sim, actors) {
  const { cols, rows } = sim;
  const baseline = rows * 0.65;

  // Rolling desert dunes
  for (let x = 0; x < cols; x++) {
    const wave = Math.sin(x * 0.05) * (rows * 0.09) + Math.cos(x * 0.02) * (rows * 0.04);
    const topY = Math.floor(baseline - wave);
    for (let y = topY; y < rows; y++) {
      sim.set(x, y, SAND);
    }
  }

  // Oasis in a low dune dip
  const oasisX = Math.floor(cols * 0.35);
  const oasisY = Math.floor(baseline + rows * 0.03);
  for (let dx = -6; dx <= 6; dx++) {
    for (let dy = 0; dy <= 4; dy++) {
      sim.set(oasisX + dx, oasisY + dy, WATER);
    }
  }

  // Ancient stone monolith
  const pillarX = Math.floor(cols * 0.72);
  for (let y = Math.floor(rows * 0.3); y < rows; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      sim.set(pillarX + dx, y, STONE);
    }
  }

  // Buried ancient glass crystal
  for (let y = Math.floor(rows * 0.78); y < Math.floor(rows * 0.85); y++) {
    for (let dx = -2; dx <= 2; dx++) {
      sim.set(Math.floor(cols * 0.5) + dx, y, GLASS);
    }
  }

  if (actors) {
    spawnOnGround(sim, actors, oasisX - 8, oasisY - 4);
    spawnOnGround(sim, actors, Math.floor(cols * 0.15), Math.floor(rows * 0.4));
    spawnOnGround(sim, actors, pillarX + 6, Math.floor(rows * 0.4));
  }
}

/**
 * AQUARIUM — Glass-walled tank, deep water, sunken log, and diving explorers.
 */
function aquarium(sim, actors) {
  const { cols, rows } = sim;
  const waterTop = Math.floor(rows * 0.12);
  const tankFloor = Math.floor(rows * 0.85);

  // Deep water volume
  for (let y = waterTop; y < tankFloor; y++) {
    for (let x = 4; x < cols - 4; x++) {
      sim.set(x, y, WATER);
    }
  }

  // Tank glass outer walls
  for (let y = waterTop - 2; y <= tankFloor; y++) {
    sim.set(2, y, GLASS);
    sim.set(3, y, GLASS);
    sim.set(cols - 3, y, GLASS);
    sim.set(cols - 4, y, GLASS);
  }
  // Bottom stone foundation
  for (let y = tankFloor; y < rows; y++) {
    for (let x = 0; x < cols; x++) sim.set(x, y, STONE);
  }

  // Sunken wooden shipwreck log on the floor
  const shipX = Math.floor(cols * 0.45);
  for (let x = shipX - 12; x <= shipX + 12; x++) {
    sim.set(x, tankFloor - 1, WOOD);
    sim.set(x, tankFloor - 2, WOOD);
  }
  for (let y = tankFloor - 7; y < tankFloor - 2; y++) {
    sim.set(shipX, y, WOOD);
  }

  // Bed of sand on the bottom
  for (let x = 4; x < cols - 4; x++) {
    if (sim.get(x, tankFloor - 1) === EMPTY) sim.set(x, tankFloor - 1, SAND);
  }

  if (actors) {
    actors.spawn(Math.floor(cols * 0.25), waterTop + 4);
    actors.spawn(Math.floor(cols * 0.65), waterTop + 8);
    spawnOnGround(sim, actors, shipX - 4, tankFloor - 6);
    // A school of fish living in the tank.
    for (let i = 0; i < 4; i++) spawnInMaterial(sim, actors, "fish", WATER, false);
    // A stray bird that wandered in through the open top.
    actors.spawnBird(Math.floor(cols * 0.5), waterTop + 2);
  }
}

/**
 * MATRIX — Cyberpunk architecture, cascading digital code rain, and digitized runners.
 */
function matrix(sim, actors) {
  const { cols, rows } = sim;

  // Ground cyber foundation
  for (let y = rows - 4; y < rows; y++) {
    for (let x = 0; x < cols; x++) sim.set(x, y, STONE);
  }

  // Elevated cyber platforms
  const platforms = [
    { x: 0.10, y: 0.70, w: 0.25 },
    { x: 0.50, y: 0.56, w: 0.32 },
    { x: 0.20, y: 0.38, w: 0.24 },
    { x: 0.65, y: 0.28, w: 0.22 },
  ];

  for (const p of platforms) {
    const px = Math.floor(cols * p.x);
    const pw = Math.floor(cols * p.w);
    const py = Math.floor(rows * p.y);
    for (let x = px; x < px + pw; x++) {
      sim.set(x, py, STONE);
    }
  }

  // Cascading vertical streams of CODE digital rain. Streams are seeded
  // short so the physics keeps them falling — a frozen wall of code would
  // just sit there, but these animate the moment the world starts.
  for (let col = 4; col < cols - 4; col += 5) {
    const startY = Math.floor(Math.random() * (rows * 0.35));
    const streamLen = 4 + Math.floor(Math.random() * 8);
    for (let y = startY; y < startY + streamLen; y++) {
      if (y >= 0 && y < rows - 4 && sim.get(col, y) === EMPTY) {
        sim.set(col, y, CODE);
      }
    }
  }

  // A pool of volatile oil at the base — let the player discover the blast.
  const oilY = rows - 5;
  for (let x = Math.floor(cols * 0.1); x < cols * 0.3; x++) {
    sim.set(x, oilY, OIL);
  }

  if (actors) {
    actors.spawn(Math.floor(cols * 0.18), Math.floor(rows * 0.69));
    actors.spawn(Math.floor(cols * 0.60), Math.floor(rows * 0.55));
    actors.spawn(Math.floor(cols * 0.28), Math.floor(rows * 0.37));
  }
}

/**
 * OIL SPILL — Industrial harbor basin with floating oil slick, ready for chain reaction.
 */
function oilSpill(sim, actors) {
  const { cols, rows } = sim;
  const basinTop = Math.floor(rows * 0.52);

  // Stone harbor basin
  for (let x = 0; x < cols; x++) {
    for (let y = basinTop; y < rows; y++) {
      const edge = (y - basinTop) * 0.4;
      const inset = Math.floor(edge);
      if (x < inset || x > cols - inset) {
        sim.set(x, y, STONE);
      } else {
        sim.set(x, y, WATER);
      }
    }
  }
  for (let y = rows - 3; y < rows; y++) {
    for (let x = 0; x < cols; x++) sim.set(x, y, STONE);
  }

  // Floating oil slick layer
  const oilY = basinTop + 1;
  for (let x = Math.floor(cols * 0.12); x < cols * 0.88; x++) {
    sim.set(x, oilY, OIL);
    if (Math.random() < 0.5) sim.set(x, oilY + 1, OIL);
  }

  // Offshore platform with workers
  const px = Math.floor(cols * 0.72);
  const py = Math.floor(rows * 0.42);
  for (let x = px - 8; x <= px + 8; x++) {
    sim.set(x, py, WOOD);
  }
  // Stilts
  for (let y = py + 1; y < basinTop + 10; y++) {
    sim.set(px - 6, y, STONE);
    sim.set(px + 6, y, STONE);
  }

  if (actors) {
    spawnOnGround(sim, actors, px - 3, py - 3);
    spawnOnGround(sim, actors, px + 3, py - 3);
  }
}

/**
 * INFERNO — Timber village with huts, braziers, and inhabitants.
 */
function inferno(sim, actors) {
  const { cols, rows } = sim;
  const groundY = Math.floor(rows * 0.78);

  // Stone ground
  for (let x = 0; x < cols; x++) {
    for (let y = groundY; y < rows; y++) {
      sim.set(x, y, STONE);
    }
  }

  // Three timber huts
  for (const cx of [0.18, 0.50, 0.82]) {
    const bx = Math.floor(cols * cx);
    const bw = 9;
    const bh = 11;
    const topY = groundY - bh;

    // Walls & roof
    for (let x = bx - bw; x <= bx + bw; x++) {
      for (let y = topY; y < groundY; y++) {
        if (x === bx - bw || x === bx + bw || y === topY || y === topY + 1) {
          sim.set(x, y, WOOD);
        }
      }
    }
    // Stone fireplace / chimney
    for (let y = topY - 3; y < groundY; y++) {
      sim.set(bx + bw - 1, y, STONE);
    }
  }

  // Burning braziers between huts
  const b1 = Math.floor(cols * 0.34);
  const b2 = Math.floor(cols * 0.66);
  sim.set(b1, groundY - 1, BURNING_WOOD);
  sim.set(b1, groundY - 2, FIRE);
  sim.set(b2, groundY - 1, BURNING_WOOD);
  sim.set(b2, groundY - 2, FIRE);

  if (actors) {
    spawnOnGround(sim, actors, Math.floor(cols * 0.28), groundY - 3);
    spawnOnGround(sim, actors, Math.floor(cols * 0.50), groundY - 3);
    spawnOnGround(sim, actors, Math.floor(cols * 0.72), groundY - 3);
  }
}

/**
 * CHAOS — a little of everything, arranged to immediately start interacting.
 * The whole point is: "let's see what happens."
 */
function chaos(sim, actors) {
  const { cols, rows } = sim;
  const groundY = Math.floor(rows * 0.72);

  // Uneven stone floor with sand pockets
  for (let x = 0; x < cols; x++) {
    const wobble = Math.floor(Math.sin(x * 0.08) * 3);
    for (let y = groundY + wobble; y < rows; y++) sim.set(x, y, STONE);
  }
  // Sand dune on the left
  for (let x = 0; x < cols * 0.3; x++) {
    const top = groundY - 6 + Math.floor(Math.cos(x * 0.2) * 3);
    for (let y = top; y < groundY; y++) sim.set(x, y, SAND);
  }
  // Water pool in the middle
  const poolX = Math.floor(cols * 0.42);
  for (let x = poolX; x < poolX + cols * 0.16; x++) {
    for (let y = groundY - 5; y < groundY; y++) sim.set(x, y, WATER);
  }
  // Wooden structure
  const hutX = Math.floor(cols * 0.72);
  for (let x = hutX - 8; x <= hutX + 8; x++) sim.set(x, groundY - 12, WOOD);
  for (let y = groundY - 12; y < groundY; y++) { sim.set(hutX - 8, y, WOOD); sim.set(hutX + 8, y, WOOD); }
  // Oil slick on the water
  for (let x = poolX; x < poolX + cols * 0.16; x++) sim.set(x, groundY - 6, OIL);
  // Metal rig + plant patch
  for (let x = Math.floor(cols * 0.2); x < Math.floor(cols * 0.28); x++) sim.set(x, groundY - 3, METAL);
  for (let i = 0; i < 10; i++) {
    const px = Math.floor(cols * 0.55) + i;
    sim.set(px, groundY - 1, PLANT);
    sim.set(px, groundY - 2, PLANT);
  }
  // A brazen fire and a code rain leak
  sim.set(Math.floor(cols * 0.62), groundY - 1, FIRE);
  for (let x = Math.floor(cols * 0.85); x < Math.floor(cols * 0.95); x++) {
    for (let y = 2; y < 10; y++) if (sim.get(x, y) === EMPTY) sim.set(x, y, CODE);
  }
  // Suspended dust and a few embers
  for (let i = 0; i < 40; i++) {
    const x = 2 + Math.floor(Math.random() * (cols - 4));
    const y = 2 + Math.floor(Math.random() * (groundY - 8));
    if (sim.get(x, y) === EMPTY) sim.set(x, y, DUST);
  }
  for (let x = Math.floor(cols * 0.3); x < Math.floor(cols * 0.5); x += 3) sim.set(x, groundY - 1, EMBER);

  if (actors) {
    spawnOnGround(sim, actors, cols * 0.15, groundY - 6);
    spawnOnGround(sim, actors, cols * 0.5, groundY - 6);
    spawnOnGround(sim, actors, cols * 0.8, groundY - 14);
    spawnInMaterial(sim, actors, "fish", WATER, false);
    actors.spawnBird(cols * 0.4, groundY - 30);
    actors.spawnBird(cols * 0.7, groundY - 34);
  }
}

/**
 * COSMIC — the supernatural layer. A black hole, an angel, a devil and a small
 * settlement, arranged so their competing natures produce a little story.
 */
function cosmic(sim, actors) {
  const { cols, rows } = sim;
  const groundY = Math.floor(rows * 0.7);

  // Floating stone platforms in a void of darkness
  for (let x = 0; x < cols; x++) {
    for (let y = groundY; y < rows; y++) sim.set(x, y, STONE);
  }
  const platY = Math.floor(rows * 0.42);
  for (let x = Math.floor(cols * 0.5); x < Math.floor(cols * 0.72); x++) {
    sim.set(x, platY, STONE);
    sim.set(x, platY + 1, STONE);
  }

  // A small pocket of raw VOID on the far side — a second strange thing to
  // discover, sitting quietly and pulling at the dust.
  const vx = Math.floor(cols * 0.86), vy = Math.floor(rows * 0.62);
  sim.set(vx, vy, VOID);

  // A pool of water (angels like clean water)
  const poolX = Math.floor(cols * 0.18);
  for (let x = poolX; x < poolX + cols * 0.1; x++) {
    for (let y = groundY - 4; y < groundY; y++) sim.set(x, y, WATER);
  }

  if (actors) {
    // The settlement (in danger, of course)
    spawnOnGround(sim, actors, cols * 0.62, groundY - 4);
    spawnOnGround(sim, actors, cols * 0.66, groundY - 4);
    spawnOnGround(sim, actors, cols * 0.70, groundY - 4);

    // The cast
    actors.spawnAngel(cols * 0.30, platY - 2);
    actors.spawnDevil(cols * 0.40, groundY - 2);
    actors.spawnBlackHole(cols * 0.90, Math.floor(rows * 0.28));

    // And a fish in the pool for the angel to admire, plus birds overhead
    // that the devil will happily try to torch.
    spawnInMaterial(sim, actors, "fish", WATER, false);
    actors.spawnBird(cols * 0.5, platY - 6);
    actors.spawnBird(cols * 0.2, groundY - 26);
  }
}

/**
 * GARDEN — a quiet patch of soil, a pool, and a couple of seeds. If you water
 * it and wait, trees grow. This is the discovery world: nothing dramatic,
 * everything patient.
 */
function garden(sim, actors) {
  const { cols, rows } = sim;
  const groundY = Math.floor(rows * 0.78);

  // Deep fertile soil bed.
  for (let x = 0; x < cols; x++) {
    for (let y = groundY; y < rows; y++) sim.set(x, y, SOIL);
  }
  // A stone rim so water doesn't drain away.
  for (let x = 0; x < cols; x++) sim.set(x, rows - 1, STONE);

  // A small pool on the left.
  const poolX = Math.floor(cols * 0.12);
  for (let x = poolX; x < poolX + cols * 0.12; x++) {
    for (let y = groundY - 4; y < groundY; y++) sim.set(x, y, WATER);
  }

  // Two seeds waiting to be found.
  sim.set(Math.floor(cols * 0.5), groundY - 1, SEED);
  sim.set(Math.floor(cols * 0.72), groundY - 1, SEED);

  // A stray cloud overhead so rain can fall on its own.
  for (let x = Math.floor(cols * 0.3); x < Math.floor(cols * 0.6); x++) {
    sim.set(x, Math.floor(rows * 0.12), CLOUD);
  }
}

/**
 * ECOSYSTEM — a self-running little world: trees, water, fire, and a colony of
 * creatures, all already in motion. The point is to watch the systems collide.
 */
function ecosystem(sim, actors) {
  const { cols, rows } = sim;
  const groundY = Math.floor(rows * 0.76);

  // Soil floor with a stone base.
  for (let x = 0; x < cols; x++) {
    for (let y = groundY; y < rows - 2; y++) sim.set(x, y, SOIL);
    for (let y = rows - 2; y < rows; y++) sim.set(x, y, STONE);
  }

  // A lake in the middle.
  const lakeX = Math.floor(cols * 0.4);
  for (let x = lakeX; x < lakeX + cols * 0.2; x++) {
    for (let y = groundY - 5; y < groundY; y++) sim.set(x, y, WATER);
  }

  // A few starter trees at different ages.
  const treeSpots = [0.15, 0.28, 0.7, 0.85];
  for (const t of treeSpots) {
    const tx = Math.floor(cols * t);
    let ty = groundY - 1;
    while (ty > 2 && sim.get(tx, ty) === EMPTY) { sim.set(tx, ty, TRUNK); ty--; }
    // A little foliage on top.
    for (let dx = -2; dx <= 2; dx++) sim.set(tx + dx, ty + 1, LEAF);
  }

  // A campfire and some wildlife.
  sim.set(Math.floor(cols * 0.6), groundY - 1, FIRE);

  if (actors) {
    spawnOnGround(sim, actors, cols * 0.2, groundY - 4);
    spawnOnGround(sim, actors, cols * 0.55, groundY - 4);
    spawnOnGround(sim, actors, cols * 0.8, groundY - 4);
    spawnInMaterial(sim, actors, "fish", WATER, false);
    spawnInMaterial(sim, actors, "fish", WATER, false);
    actors.spawnBird(cols * 0.35, groundY - 20);
    actors.spawnBird(cols * 0.65, groundY - 24);
  }
}

export const PRESETS = [
  { id: "garden",   label: "GARDEN",    generate: garden },
  { id: "ecosystem",label: "ECOSYSTEM", generate: ecosystem },
  { id: "beach",    label: "BEACH",     generate: beach },
  { id: "volcano",  label: "VOLCANO",   generate: volcano },
  { id: "campfire", label: "CAMPFIRE",  generate: campfire },
  { id: "desert",   label: "DESERT",    generate: desert },
  { id: "aquarium", label: "AQUARIUM",  generate: aquarium },
  { id: "matrix",   label: "MATRIX",    generate: matrix },
  { id: "oilspill", label: "OIL SPILL", generate: oilSpill },
  { id: "inferno",  label: "INFERNO",   generate: inferno },
  { id: "chaos",    label: "CHAOS",     generate: chaos },
  { id: "cosmic",   label: "COSMIC",    generate: cosmic },
];