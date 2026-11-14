/**
 * SANDBOX — Reaction System
 *
 * A pure data table. Each entry is `material A + material B -> outputs`.
 *
 * REACTION HIERARCHY (design philosophy):
 *
 *   WORLD    — Physics rules. Silent. No toast. Always active.
 *              "Water + Fire = Steam" just happens.
 *
 *   COMMON   — Easy discoveries. Toast + toolbar unlock on first trigger.
 *              "Sand + Fire = Glass" — the player learns heat transforms matter.
 *
 *   UNCOMMON — Deeper discoveries. Require chains or less obvious combos.
 *              "Mercury + Fire = Spark" — requires finding mercury first.
 *
 *   RARE     — Surprising. Low probability or unusual setup needed.
 *              "Acid + Stone = tiny Void pocket"
 *
 *   SECRET   — Hidden. Not hinted anywhere. The player must experiment wildly.
 *              "Code + Void = Glitch"
 *
 * Optional flags:
 *   blast:     <radius>  emit a small volatile burst that startles actors
 *   discovery: <label>   names the outcome for the discovery log / toast
 *   priority:  <level>   reaction hierarchy tier
 */

import {
  SAND, WATER, STONE, FIRE, SMOKE, WOOD, CODE,
  GLASS, STEAM, ASH, CORRUPTED_CODE, MUD,
  BURNING_WOOD, OIL, LAVA, HEATED_STONE, WET_SAND,
  METAL, HOT_METAL, EMBER, PLANT, VOID, DARK_MATTER, DUST,
  SOIL, SEED, SPROUT, TRUNK, BRANCH, LEAF, CLOUD, RAIN,
  SALT, ICE, SNOW, ACID, GOLD, MERCURY, CRYSTAL, STEEL, SPARK, ASHFALL,
  GLITCH,
  COAL, CHARCOAL, FUEL, SULFUR, GUNPOWDER, OBSIDIAN, MAGMA_ROCK,
  LIMESTONE, CEMENT, CONCRETE,
  MOSS, VINE, FLOWER, FRUIT, GRASS, TREE, BEE, WORM, SNAKE,
  WIND, LIGHT, SHADOW, HEAT, COLD, STATIC, MAGNET,
  MACHINE, GEAR, WIRE, BATTERY, CIRCUIT, ROBOT, AI, DATA, VIRUS,
  PORTAL, SINGULARITY, STAR, NEBULA, COMET, ASTRONAUT, SPACE, TIME, MEMORY, SOUL,
  EMPTY
} from "./materials.js";

// Priority tiers — exported so discovery.js can filter on them.
export const PRIORITY = {
  WORLD:    "world",     // Layer 1: silent physics, no toast
  COMMON:   "common",    // Layer 2: easy discoveries
  UNCOMMON: "uncommon",  // Layer 2: deeper chain discoveries
  RARE:     "rare",      // Layer 3: surprising
  SECRET:   "secret",    // Layer 3: hidden, no hints
};

const W = PRIORITY.WORLD;
const C = PRIORITY.COMMON;
const U = PRIORITY.UNCOMMON;
const R = PRIORITY.RARE;
const S = PRIORITY.SECRET;

// NOTE ON DESIGN: deliberately NOT every pair reacts. Most combinations do
// nothing at all. Only a handful of meaningful "recipes" exist, and some
// transformations happen through physical behaviour (growth, decay, the water
// cycle) rather than a table lookup. This keeps the world a physics sandbox
// with discoveries, not a combinatorial crafting game.
export const REACTIONS = [
  // ========================= LAYER 1: WORLD RULES =========================
  // These are physics. They happen silently. No discovery toast.

  // --- Thermodynamics ---
  { inputs: [WATER, FIRE], outputA: STEAM, outputB: EMPTY, priority: W, desc: "Fire boils water into rising steam" },
  { inputs: [LAVA, WATER], outputA: STONE, outputB: STEAM, priority: W, desc: "Water rapidly cools lava into solid stone" },
  { inputs: [ICE, FIRE],   outputA: WATER, outputB: EMPTY, priority: W, desc: "Fire melts ice back to water" },
  { inputs: [ICE, LAVA],   outputA: STEAM, outputB: LAVA,  priority: W, desc: "Lava flash-boils ice" },
  { inputs: [SNOW, FIRE],  outputA: WATER, outputB: EMPTY, priority: W, desc: "Snow melts at a touch of heat" },

  // --- Combustion (silent world rule: things that burn just burn) ---
  { inputs: [OIL, FIRE],   outputA: FIRE, outputB: FIRE,  priority: W, desc: "Fire rapidly consumes oil" },
  { inputs: [OIL, LAVA],   outputA: FIRE, outputB: LAVA,  priority: W, blast: 3, desc: "Lava ignites volatile oil in a violent blast" },
  { inputs: [PLANT, FIRE], outputA: BURNING_WOOD, outputB: EMPTY, priority: W, desc: "Plants catch and burn like tinder" },
  { inputs: [LEAF, FIRE],  outputA: FIRE, outputB: EMPTY,  priority: W, desc: "Leaves go up almost instantly" },
  { inputs: [EMBER, WOOD], outputA: BURNING_WOOD, outputB: FIRE, priority: W, desc: "A live ember catches wood alight" },

  // --- Extinguishing ---
  { inputs: [BURNING_WOOD, WATER], outputA: ASH, outputB: STEAM, priority: W, desc: "Water extinguishes burning wood into ash & steam" },
  { inputs: [BURNING_WOOD, SAND],  outputA: ASH, outputB: SAND,  priority: W, desc: "Sand smothers burning wood into ash" },
  { inputs: [HOT_METAL, WATER],    outputA: METAL, outputB: STEAM, priority: W, desc: "Water quenches hot metal with a hiss" },
  { inputs: [HEATED_STONE, WATER], outputA: STONE, outputB: STEAM, priority: W, desc: "Water quenches glowing stone with a hiss of steam" },

  // --- Wet earth (intermediate step, not a discovery itself) ---
  { inputs: [WATER, SAND],   outputA: EMPTY, outputB: WET_SAND, priority: W, desc: "Water clumps earth into heavy wet earth" },
  { inputs: [SAND, WATER],   outputA: WET_SAND, outputB: EMPTY, priority: W, desc: "Wet earth again" },
  { inputs: [WET_SAND, FIRE], outputA: SAND, outputB: EMPTY, priority: W, desc: "Fire bakes wet earth dry again" },
  { inputs: [WET_SAND, LAVA], outputA: SAND, outputB: LAVA,  priority: W, desc: "Lava flash-dries wet earth" },

  // --- Decay / composting (natural cycle, not a surprising discovery) ---
  { inputs: [LEAF, MUD],    outputA: SOIL, outputB: EMPTY, priority: W, desc: "Fallen leaves rot into the soil" },
  { inputs: [LEAF, WATER],  outputA: MUD, outputB: EMPTY,  priority: W, desc: "Soaked leaves break down" },
  { inputs: [LEAF, SOIL],   outputA: SOIL, outputB: EMPTY, priority: W, desc: "Leaves return to the soil" },

  // --- Trivial salt/dust interactions ---
  { inputs: [FIRE, SALT],   outputA: ASH, outputB: EMPTY,  priority: W, desc: "Salt scorches and cracks" },
  { inputs: [DUST, FIRE],   outputA: SMOKE, outputB: EMPTY, priority: W, desc: "Dust burns away to smoke" },
  { inputs: [SALT, SAND],   outputA: SALT, outputB: EMPTY,  priority: W, desc: "Salt mixes through the earth" },

  // --- Inert / no-change interactions (world flavor) ---
  { inputs: [GOLD, WATER],  outputA: GOLD, outputB: EMPTY, priority: W, desc: "Gold glitters but never tarnishes" },
  { inputs: [SPARK, WATER], outputA: SPARK, outputB: EMPTY, priority: W, desc: "Sparks skitter across the water" },

  // ======================== LAYER 2: COMMON DISCOVERIES ====================
  // The player learns "heat transforms matter", "cold creates structure", etc.

  // --- Silica / glass ---
  { inputs: [SAND, FIRE],     outputA: GLASS, outputB: EMPTY, priority: C, discovery: "GLASS", desc: "Heat fuses sand into clear glass" },
  { inputs: [SAND, LAVA],     outputA: GLASS, outputB: LAVA,  priority: C, desc: "Magma melts sand into glass" },
  { inputs: [SAND, HOT_METAL], outputA: GLASS, outputB: METAL, priority: C, desc: "Scorching metal fuses sand to glass" },

  // --- The soil revelation: wet earth matures ---
  { inputs: [WET_SAND, WET_SAND], outputA: SOIL, outputB: EMPTY, priority: C, discovery: "SOIL", desc: "Damp earth, left long enough, matures into rich soil" },
  { inputs: [ASH, WATER],  outputA: SOIL, outputB: EMPTY, priority: C, discovery: "SOIL", desc: "Ash washed into the ground becomes fertile soil" },

  // --- Life chain (common — the player will stumble onto these) ---
  { inputs: [SEED, WATER],   outputA: SPROUT, outputB: EMPTY, priority: C, discovery: "SPROUT", desc: "A watered seed begins to wake" },
  { inputs: [SEED, SOIL],    outputA: SPROUT, outputB: SOIL,  priority: C, discovery: "SPROUT", desc: "Planted in soil, a seed stirs" },
  { inputs: [SPROUT, WATER], outputA: TRUNK, outputB: TRUNK,  priority: C, discovery: "TRUNK", desc: "A sprout grows into a trunk" },
  { inputs: [TRUNK, WATER],  outputA: BRANCH, outputB: BRANCH, priority: C, desc: "The trunk throws out branches" },
  { inputs: [BRANCH, WATER], outputA: LEAF, outputB: LEAF,    priority: C, discovery: "LEAF", desc: "Branches put forth leaves" },
  { inputs: [PLANT, WATER],  outputA: LEAF, outputB: EMPTY,   priority: C, discovery: "LEAF", desc: "Watered plants grow leaves" },

  // --- Wet earth feeds back into soil ---
  { inputs: [DUST, WATER],    outputA: MUD, outputB: EMPTY,  priority: C, discovery: "MUD", desc: "Dust and water make mud" },
  { inputs: [ASHFALL, WATER], outputA: SOIL, outputB: EMPTY, priority: C, discovery: "SOIL", desc: "Ashfall soaks into fertile soil" },

  // --- Steam gathers ---
  { inputs: [STEAM, STEAM], outputA: CLOUD, outputB: EMPTY, priority: C, discovery: "CLOUD", desc: "Steam gathers and thickens into a cloud" },

  // --- Digital corruption ---
  { inputs: [CODE, WATER], outputA: CORRUPTED_CODE, outputB: STEAM, priority: C, discovery: "CORRUPTED CODE", desc: "Water shorts digital code into corrupted glitch data" },
  { inputs: [CODE, FIRE],  outputA: CORRUPTED_CODE, outputB: EMPTY, priority: C, discovery: "CORRUPTED CODE", desc: "Intense heat corrupts digital data" },
  { inputs: [CODE, LAVA],  outputA: CORRUPTED_CODE, outputB: LAVA,  priority: C, desc: "Molten rock melts code into unstable data" },

  // ====================== LAYER 2: UNCOMMON DISCOVERIES ====================
  // Require chains. The player must have already discovered intermediate materials.

  // --- Metal chain ---
  { inputs: [METAL, FIRE],   outputA: HOT_METAL, outputB: EMPTY, priority: U, discovery: "HOT METAL", desc: "Fire conducts through metal until it glows" },
  { inputs: [METAL, LAVA],   outputA: HOT_METAL, outputB: LAVA,  priority: U, discovery: "HOT METAL", desc: "Lava heats metal to a glow" },
  { inputs: [METAL, SAND],   outputA: STEEL, outputB: EMPTY,     priority: U, discovery: "STEEL", desc: "Metal folded through earth becomes steel" },
  { inputs: [METAL, WATER],  outputA: GOLD, outputB: EMPTY,      priority: U, discovery: "GOLD", desc: "Water and metal yield gold" },
  { inputs: [GOLD, FIRE],    outputA: MERCURY, outputB: EMPTY,   priority: U, discovery: "MERCURY", desc: "Gold melts into quicksilver" },
  { inputs: [MERCURY, FIRE], outputA: SPARK, outputB: EMPTY,     priority: U, discovery: "SPARK", desc: "Quicksilver throws off sparks" },
  { inputs: [MERCURY, SAND], outputA: GOLD, outputB: EMPTY,      priority: U, desc: "Quicksilver draws gold from the earth" },
  { inputs: [STEEL, FIRE],   outputA: HOT_METAL, outputB: EMPTY, priority: U, desc: "Steel glows under heat" },

  // --- Stone / heat ---
  { inputs: [STONE, FIRE],  outputA: HEATED_STONE, outputB: EMPTY, priority: U, discovery: "HEATED STONE", desc: "Sustained fire bakes stone until it glows" },
  { inputs: [STONE, LAVA],  outputA: HEATED_STONE, outputB: LAVA,  priority: U, desc: "Lava leaves stone glowing hot" },

  // --- Temperature play ---
  { inputs: [WATER, SALT],  outputA: ICE, outputB: EMPTY,   priority: U, discovery: "ICE", desc: "Salt chills water into ice" },
  { inputs: [WATER, ICE],   outputA: ICE, outputB: EMPTY,   priority: U, discovery: "ICE", desc: "Cold spreads through water" },
  { inputs: [STEAM, ICE],   outputA: SNOW, outputB: EMPTY,  priority: U, discovery: "SNOW", desc: "Cold air freezes vapour into snow" },
  { inputs: [CLOUD, ICE],   outputA: SNOW, outputB: EMPTY,  priority: U, discovery: "SNOW", desc: "Chilled clouds shed snow" },
  { inputs: [SNOW, SNOW],   outputA: ICE, outputB: EMPTY,   priority: U, discovery: "ICE", desc: "Packed snow becomes ice" },
  { inputs: [ICE, ICE],     outputA: STONE, outputB: EMPTY, priority: U, desc: "Ice compresses into stone" },

  // --- Crystal ---
  { inputs: [STONE, ICE],    outputA: CRYSTAL, outputB: EMPTY, priority: U, discovery: "CRYSTAL", desc: "Stone under cold pressure crystallises" },
  { inputs: [CRYSTAL, LAVA], outputA: GLASS, outputB: LAVA,   priority: U, desc: "Crystal melts to glass" },
  { inputs: [CRYSTAL, SPARK], outputA: SPARK, outputB: SPARK, priority: U, desc: "Crystal rings with sparks" },

  // --- Ash / ashfall ---
  { inputs: [ASH, ASH], outputA: ASHFALL, outputB: EMPTY, priority: U, discovery: "ASHFALL", desc: "Ash piles into fine ashfall" },

  // --- Spark ignition ---
  { inputs: [SPARK, WOOD],  outputA: FIRE, outputB: EMPTY,  priority: U, desc: "A spark sets wood alight" },
  { inputs: [SPARK, METAL], outputA: HOT_METAL, outputB: EMPTY, priority: U, desc: "Sparks travel through metal" },
  { inputs: [SPARK, OIL],   outputA: FIRE, outputB: FIRE, blast: 2, priority: U, desc: "A spark detonates oil" },

  // --- Corrupted code purge ---
  { inputs: [CORRUPTED_CODE, FIRE], outputA: SMOKE, outputB: EMPTY, priority: U, desc: "Fire purges corrupted data into smoke" },

  // ====================== LAYER 3: RARE DISCOVERIES ========================

  // --- Acid (hard to find — requires chain) ---
  { inputs: [ACID, SALT],  outputA: ACID, outputB: EMPTY, priority: R, discovery: "ACID", desc: "Salts dissolve into acid" },
  { inputs: [ACID, STONE], outputA: SMOKE, outputB: EMPTY, priority: R, discovery: "CORROSION", desc: "Acid eats straight through stone" },
  { inputs: [ACID, METAL], outputA: SMOKE, outputB: EMPTY, priority: R, desc: "Acid dissolves metal" },
  { inputs: [ACID, WOOD],  outputA: ASHFALL, outputB: EMPTY, priority: R, desc: "Acid rots wood to dust" },
  { inputs: [ACID, SAND],  outputA: GLASS, outputB: SMOKE, priority: R, desc: "Acid etches earth into glass" },
  { inputs: [ACID, WATER], outputA: WATER, outputB: EMPTY, priority: R, desc: "Acid is diluted away by water" },
  { inputs: [ACID, CODE],  outputA: CORRUPTED_CODE, outputB: EMPTY, priority: R, desc: "Acid corrupts data" },

  // --- Void interactions ---
  { inputs: [VOID, SAND],  outputA: DARK_MATTER, outputB: EMPTY, priority: R, discovery: "DARK MATTER", desc: "The void devours earth and grows" },
  { inputs: [VOID, STONE], outputA: DARK_MATTER, outputB: EMPTY, priority: R, desc: "The void dissolves stone" },
  { inputs: [VOID, WATER], outputA: DARK_MATTER, outputB: EMPTY, priority: R, desc: "The void drinks the water" },
  { inputs: [VOID, WOOD],  outputA: DARK_MATTER, outputB: EMPTY, priority: R, desc: "The void consumes wood" },
  { inputs: [VOID, FIRE],  outputA: VOID, outputB: EMPTY,        priority: R, desc: "Fire is swallowed without a trace" },

  // --- Acid creates tiny void pockets (very rare, the player discovers they ---
  //     can CREATE void — one of the deepest secrets in the game)            ---
  { inputs: [ACID, CRYSTAL], outputA: VOID, outputB: SMOKE, priority: R, discovery: "VOID", desc: "Acid dissolves crystal into absolute nothingness" },

  // ====================== LAYER 3: SECRET DISCOVERIES ======================
  // Not hinted anywhere. The player must experiment at the edges of the world.

  // --- The digital chain capstone: CODE touches the VOID ---
  { inputs: [CODE, VOID],           outputA: GLITCH, outputB: EMPTY, priority: S, discovery: "GLITCH", desc: "Digital meets nothingness — reality breaks" },
  { inputs: [CORRUPTED_CODE, VOID], outputA: GLITCH, outputB: EMPTY, priority: S, discovery: "GLITCH", desc: "Corrupted data feeds the void and shatters reality" },

  // --- Glitch is unstable and interacts weirdly ---
  { inputs: [GLITCH, WATER], outputA: CODE, outputB: STEAM,  priority: S, desc: "Water reboots the glitch back to clean code" },
  { inputs: [GLITCH, FIRE],  outputA: SPARK, outputB: SPARK, priority: S, blast: 4, desc: "Fire detonates the glitch in a cascade of sparks" },
  { inputs: [GLITCH, STONE], outputA: CRYSTAL, outputB: EMPTY, priority: S, desc: "The glitch crystallizes reality around it" },

  // =====================================================================
  //  EXPANSION — FUEL CHAIN (wood -> coal -> charcoal -> fuel -> boom)
  // =====================================================================
  { inputs: [WOOD, FIRE],      outputA: COAL, outputB: EMPTY,      priority: C, discovery: "COAL", desc: "Wood burnt down to a black, burnable rock" },
  { inputs: [WOOD, LAVA],      outputA: COAL, outputB: LAVA,       priority: C, desc: "Lava chars wood into coal" },
  { inputs: [COAL, FIRE],      outputA: CHARCOAL, outputB: EMPTY,  priority: U, discovery: "CHARCOAL", desc: "Coal burns hotter and cleaner into charcoal" },
  { inputs: [CHARCOAL, WATER], outputA: FUEL, outputB: EMPTY,      priority: U, discovery: "FUEL", desc: "Charcoal steeped in water refines into fuel" },
  { inputs: [FUEL, FIRE],      outputA: FIRE, outputB: FIRE,       priority: C, blast: 2, desc: "Fuel burns fiercely" },
  { inputs: [SULFUR, FIRE],    outputA: SMOKE, outputB: EMPTY,     priority: C, desc: "Sulfur burns with a choking reek" },
  { inputs: [SULFUR, CHARCOAL],outputA: GUNPOWDER, outputB: EMPTY, priority: U, discovery: "GUNPOWDER", desc: "Sulfur and charcoal grind into gunpowder" },
  { inputs: [GUNPOWDER, FIRE], outputA: SMOKE, outputB: EMPTY,     priority: U, blast: 6, discovery: "EXPLOSION", desc: "Gunpowder detonates" },
  { inputs: [GUNPOWDER, SPARK],outputA: SMOKE, outputB: EMPTY,     priority: U, blast: 6, desc: "A spark sets off the powder" },

  // =====================================================================
  //  EXPANSION — STONE CHAIN (limestone -> cement -> concrete, lava -> obsidian)
  // =====================================================================
  { inputs: [STONE, WATER],    outputA: LIMESTONE, outputB: EMPTY, priority: C, discovery: "LIMESTONE", desc: "Stone worn by water becomes limestone" },
  { inputs: [LIMESTONE, FIRE], outputA: CEMENT, outputB: EMPTY,    priority: U, discovery: "CEMENT", desc: "Fire bakes limestone into cement" },
  { inputs: [CEMENT, WATER],   outputA: CONCRETE, outputB: EMPTY,  priority: U, discovery: "CONCRETE", desc: "Cement sets hard when wet" },
  { inputs: [LAVA, WATER],     outputA: OBSIDIAN, outputB: STEAM,  priority: U, discovery: "OBSIDIAN", desc: "Lava quenched fast becomes black obsidian" },
  { inputs: [LAVA, STONE],     outputA: MAGMA_ROCK, outputB: LAVA, priority: U, discovery: "MAGMA ROCK", desc: "Lava cools onto stone as magma rock" },
  { inputs: [MAGMA_ROCK, WATER], outputA: STONE, outputB: STEAM,   priority: C, desc: "Magma rock cools fully to stone" },
  { inputs: [OBSIDIAN, FIRE],  outputA: LAVA, outputB: EMPTY,      priority: R, desc: "Obsidian melts back into lava" },
  { inputs: [CONCRETE, LAVA],  outputA: MAGMA_ROCK, outputB: LAVA, priority: R, desc: "Lava cracks concrete into magma rock" },

  // =====================================================================
  //  EXPANSION — FLORA CHAIN (grass, moss, vine, flower, fruit, tree)
  // =====================================================================
  { inputs: [SOIL, WATER],   outputA: GRASS, outputB: EMPTY,     priority: C, discovery: "GRASS", desc: "Wet soil sprouts grass" },
  { inputs: [GRASS, WATER],  outputA: MOSS, outputB: EMPTY,      priority: C, discovery: "MOSS", desc: "Damp grass gives way to moss" },
  { inputs: [STONE, MOSS],   outputA: MOSS, outputB: EMPTY,      priority: C, desc: "Moss creeps across bare stone" },
  { inputs: [TRUNK, MOSS],   outputA: VINE, outputB: EMPTY,      priority: U, discovery: "VINE", desc: "Moss climbing a trunk becomes vine" },
  { inputs: [GRASS, LEAF],   outputA: FLOWER, outputB: EMPTY,    priority: U, discovery: "FLOWER", desc: "Leaf and grass bloom into a flower" },
  { inputs: [FLOWER, WATER], outputA: FRUIT, outputB: EMPTY,     priority: U, discovery: "FRUIT", desc: "A watered flower sets fruit" },
  { inputs: [TRUNK, TRUNK],  outputA: TREE, outputB: EMPTY,      priority: U, discovery: "TREE", desc: "Trunks thicken into a whole tree" },
  { inputs: [TREE, WATER],   outputA: FRUIT, outputB: EMPTY,     priority: C, desc: "A watered tree bears fruit" },
  { inputs: [TREE, FIRE],    outputA: BURNING_WOOD, outputB: ASH, priority: W, desc: "A tree catches fire" },
  { inputs: [FRUIT, WATER],  outputA: SEED, outputB: EMPTY,      priority: C, desc: "Fruit rots back into seed" },
  { inputs: [GRASS, FIRE],   outputA: FIRE, outputB: EMPTY,      priority: W, desc: "Grass burns fast" },
  { inputs: [MOSS, FIRE],    outputA: SMOKE, outputB: EMPTY,     priority: W, desc: "Moss smoulders" },
  { inputs: [VINE, FIRE],    outputA: FIRE, outputB: EMPTY,      priority: W, desc: "Vine curls and burns" },
  { inputs: [FLOWER, FIRE],  outputA: ASH, outputB: EMPTY,       priority: W, desc: "Flowers blacken to ash" },

  // =====================================================================
  //  EXPANSION — CREATURES
  // =====================================================================
  { inputs: [SOIL, WORM],     outputA: SOIL, outputB: WORM,   priority: C, discovery: "WORM", desc: "Worms churn soil, aerating it" },
  { inputs: [WORM, FIRE],     outputA: ASH, outputB: EMPTY,   priority: W, desc: "Fire cooks the worm" },
  { inputs: [FLOWER, BEE],    outputA: FLOWER, outputB: BEE,  priority: C, discovery: "BEE", desc: "Bees keep the flowers blooming" },
  { inputs: [BEE, FIRE],      outputA: ASH, outputB: EMPTY,   priority: W, desc: "The bee is scorched" },
  { inputs: [GRASS, SNAKE],   outputA: GRASS, outputB: SNAKE, priority: C, discovery: "SNAKE", desc: "Snakes nest in the grass" },
  { inputs: [SNAKE, FIRE],    outputA: ASH, outputB: EMPTY,   priority: W, desc: "The snake is burnt" },
  { inputs: [SNAKE, WORM],    outputA: SNAKE, outputB: EMPTY, priority: U, desc: "The snake eats the worm" },
  { inputs: [SNAKE, BEE],     outputA: SNAKE, outputB: EMPTY, priority: U, desc: "The snake snaps the bee" },

  // =====================================================================
  //  EXPANSION — FORCES & PHENOMENA
  // =====================================================================
  { inputs: [WIND, SMOKE],   outputA: WIND, outputB: EMPTY,    priority: W, desc: "Wind scatters the smoke" },
  { inputs: [WIND, FIRE],    outputA: FIRE, outputB: EMPTY,    priority: W, desc: "Wind whips the fire higher" },
  { inputs: [WIND, DUST],    outputA: DUST, outputB: EMPTY,    priority: W, desc: "Dust rides the wind" },
  { inputs: [WIND, WATER],   outputA: WIND, outputB: EMPTY,    priority: W, desc: "Wind ripples the water" },
  { inputs: [WIND, WIND],    outputA: HEAT, outputB: EMPTY,    priority: U, discovery: "HEAT", desc: "Wind grinding on wind gives off heat" },
  { inputs: [LIGHT, STONE],  outputA: SHADOW, outputB: EMPTY,  priority: U, discovery: "SHADOW", desc: "Light striking stone casts a shadow" },
  { inputs: [LIGHT, WATER],  outputA: LIGHT, outputB: EMPTY,   priority: C, desc: "Light shimmers through water" },
  { inputs: [LIGHT, FIRE],   outputA: LIGHT, outputB: LIGHT,   priority: C, desc: "Fire feeds the light" },
  { inputs: [LIGHT, ICE],    outputA: COLD, outputB: EMPTY,    priority: U, discovery: "COLD", desc: "Light glancing off ice radiates cold" },
  { inputs: [HEAT, WATER],   outputA: STEAM, outputB: EMPTY,   priority: C, desc: "Heat boils the water away" },
  { inputs: [HEAT, ICE],     outputA: WATER, outputB: EMPTY,   priority: C, desc: "Heat melts the ice" },
  { inputs: [HEAT, COLD],    outputA: WIND, outputB: EMPTY,    priority: U, desc: "Heat meeting cold makes wind" },
  { inputs: [COLD, WATER],   outputA: ICE, outputB: EMPTY,     priority: C, discovery: "ICE", desc: "Cold freezes the water solid" },
  { inputs: [COLD, STEAM],   outputA: SNOW, outputB: EMPTY,    priority: C, desc: "Cold air freezes steam to snow" },
  { inputs: [COLD, FIRE],    outputA: SMOKE, outputB: EMPTY,   priority: C, desc: "Cold smothers the fire" },
  { inputs: [SPARK, SPARK],  outputA: STATIC, outputB: EMPTY,  priority: U, discovery: "STATIC", desc: "Sparks gather into lingering static" },
  { inputs: [STATIC, METAL], outputA: SPARK, outputB: EMPTY,   priority: C, desc: "Static discharges into the metal" },
  { inputs: [STATIC, WATER], outputA: SPARK, outputB: STEAM,   priority: C, desc: "Static crackles across the water" },
  { inputs: [STATIC, GLASS], outputA: LIGHT, outputB: EMPTY,   priority: R, desc: "Static arcs through glass and blooms into light" },
  { inputs: [MAGNET, METAL], outputA: MAGNET, outputB: EMPTY,  priority: C, discovery: "MAGNET", desc: "The magnet clings to the metal" },
  { inputs: [MAGNET, STEEL], outputA: MAGNET, outputB: EMPTY,  priority: C, desc: "The magnet pulls hard on the steel" },
  { inputs: [MAGNET, GOLD],  outputA: MAGNET, outputB: EMPTY,  priority: C, desc: "Gold barely answers the magnet" },
  { inputs: [STATIC, MAGNET], outputA: MAGNET, outputB: EMPTY, priority: U, desc: "Static charges the magnet" },

  // =====================================================================
  //  EXPANSION — CIVILIZATION CHAIN
  // =====================================================================
  { inputs: [STEEL, FIRE],     outputA: GEAR, outputB: EMPTY,    priority: U, discovery: "GEAR", desc: "Steel forged in fire becomes a gear" },
  { inputs: [STEEL, GEAR],     outputA: MACHINE, outputB: EMPTY, priority: U, discovery: "MACHINE", desc: "Steel and gears assemble into a machine" },
  { inputs: [METAL, WIRE],     outputA: WIRE, outputB: EMPTY,    priority: C, discovery: "WIRE", desc: "Metal drawn thin becomes wire" },
  { inputs: [WIRE, STATIC],    outputA: BATTERY, outputB: EMPTY, priority: U, discovery: "BATTERY", desc: "Wire wound with static holds a charge" },
  { inputs: [BATTERY, METAL],  outputA: SPARK, outputB: EMPTY,   priority: C, desc: "The battery discharges into the metal" },
  { inputs: [BATTERY, CODE],   outputA: CIRCUIT, outputB: EMPTY, priority: U, discovery: "CIRCUIT", desc: "Charge plus code becomes a circuit" },
  { inputs: [CIRCUIT, MACHINE],outputA: ROBOT, outputB: EMPTY,   priority: R, discovery: "ROBOT", desc: "A machine given a mind begins to walk" },
  { inputs: [MACHINE, WATER],  outputA: STEAM, outputB: METAL,   priority: C, desc: "Water seized the machine's heat" },
  { inputs: [MACHINE, LAVA],   outputA: LAVA, outputB: METAL,    priority: C, desc: "The machine melts into scrap" },
  { inputs: [GEAR, GEAR],      outputA: MACHINE, outputB: EMPTY, priority: U, desc: "Two gears become a machine" },

  // =====================================================================
  //  EXPANSION — DIGITAL LIFE
  // =====================================================================
  { inputs: [CODE, CODE],       outputA: DATA, outputB: EMPTY,   priority: C, discovery: "DATA", desc: "Code doubled becomes raw data" },
  { inputs: [DATA, CODE],       outputA: AI, outputB: EMPTY,     priority: R, discovery: "AI", desc: "Data that loops on itself begins to think" },
  { inputs: [CODE, AI],         outputA: AI, outputB: AI,        priority: R, desc: "The AI copies itself through the code" },
  { inputs: [DATA, WATER],      outputA: CORRUPTED_CODE, outputB: STEAM, priority: C, desc: "Water rots the data" },
  { inputs: [CORRUPTED_CODE, DATA], outputA: VIRUS, outputB: EMPTY, priority: U, discovery: "VIRUS", desc: "Corruption in data becomes a virus" },
  { inputs: [VIRUS, CODE],      outputA: CORRUPTED_CODE, outputB: EMPTY, priority: C, desc: "The virus spreads through the code" },
  { inputs: [VIRUS, AI],        outputA: GLITCH, outputB: EMPTY, priority: R, discovery: "GLITCH", desc: "A virus in a thinking mind shatters reality" },
  { inputs: [VIRUS, ROBOT],     outputA: GLITCH, outputB: EMPTY, priority: R, desc: "The virus takes the machine" },
  { inputs: [AI, ROBOT],        outputA: ROBOT, outputB: ROBOT,  priority: R, desc: "The AI takes the robot as its body" },
  { inputs: [AI, FIRE],         outputA: CORRUPTED_CODE, outputB: EMPTY, priority: U, desc: "Fire corrupts the mind" },
  { inputs: [AI, WATER],        outputA: DATA, outputB: EMPTY,   priority: U, desc: "Water shorts the mind back to raw data" },
  { inputs: [DATA, DATA],       outputA: CODE, outputB: EMPTY,   priority: C, desc: "Data compresses back to code" },

  // =====================================================================
  //  EXPANSION — COSMIC CHAIN (void -> dark matter -> portal -> singularity)
  // =====================================================================
  { inputs: [DARK_MATTER, DARK_MATTER], outputA: SINGULARITY, outputB: EMPTY, priority: R, discovery: "SINGULARITY", desc: "Dark matter crushed together collapses to a point" },
  { inputs: [SINGULARITY, STAR],        outputA: SPACE, outputB: EMPTY,       priority: R, desc: "The star is swallowed whole" },
  { inputs: [VOID, LIGHT],              outputA: SHADOW, outputB: EMPTY,      priority: R, discovery: "SHADOW", desc: "The void drinks the light and leaves shadow" },
  { inputs: [PORTAL, STONE],            outputA: SPACE, outputB: EMPTY,       priority: U, desc: "Stone dropped through the portal is gone" },
  { inputs: [PORTAL, WATER],            outputA: SPACE, outputB: EMPTY,       priority: U, desc: "Water falls through the portal" },
  { inputs: [PORTAL, METAL],            outputA: SPACE, outputB: EMPTY,       priority: R, desc: "Anything metal that enters the portal never returns" },
  { inputs: [STAR, WATER],              outputA: STEAM, outputB: EMPTY,       priority: C, desc: "The star boils the water away" },
  { inputs: [STAR, ICE],                outputA: WATER, outputB: EMPTY,       priority: C, desc: "The star melts the ice" },
  { inputs: [NEBULA, NEBULA],           outputA: STAR, outputB: EMPTY,        priority: R, discovery: "STAR", desc: "Nebulae gather until a star ignites" },
  { inputs: [NEBULA, WATER],            outputA: COMET, outputB: EMPTY,       priority: U, discovery: "COMET", desc: "Nebula and water freeze into a comet" },
  { inputs: [COMET, STONE],             outputA: CRYSTAL, outputB: SMOKE,     priority: U, desc: "The comet strikes stone and leaves crystal" },
  { inputs: [SPACE, STONE],             outputA: NEBULA, outputB: EMPTY,      priority: U, discovery: "NEBULA", desc: "Stone adrift in space becomes a nebula" },
  { inputs: [SPACE, SPACE],             outputA: VOID, outputB: EMPTY,        priority: R, desc: "Emptiness doubled becomes the void" },
  { inputs: [STAR, FIRE],               outputA: STAR, outputB: STAR,         priority: C, desc: "Fire feeds the star" },
  { inputs: [ASTRONAUT, VOID],          outputA: SOUL, outputB: EMPTY,        priority: R, discovery: "SOUL", desc: "The void takes the body and leaves the soul" },

  // =====================================================================
  //  EXPANSION — ABSTRACT / MYSTERIOUS
  // =====================================================================
  { inputs: [TIME, MUD],     outputA: SOIL, outputB: EMPTY,   priority: R, discovery: "SOIL", desc: "Given time, mud becomes soil" },
  { inputs: [TIME, SOIL],    outputA: GRASS, outputB: EMPTY,  priority: R, desc: "Given time, soil grows grass" },
  { inputs: [TIME, WOOD],    outputA: COAL, outputB: EMPTY,   priority: R, desc: "Given enough time, wood becomes coal" },
  { inputs: [TIME, CRYSTAL], outputA: MAGNET, outputB: EMPTY, priority: R, desc: "Given time, crystal aligns into a magnet" },
  { inputs: [TIME, LEAF],    outputA: MEMORY, outputB: EMPTY, priority: R, discovery: "MEMORY", desc: "Living things touched by time leave a memory" },
  { inputs: [MEMORY, WATER], outputA: MEMORY, outputB: EMPTY, priority: R, desc: "The memory lingers in the water" },
  { inputs: [MEMORY, SOUL],  outputA: AI, outputB: EMPTY,     priority: S, desc: "Memory and soul together are a new mind" },
  { inputs: [SOUL, VOID],    outputA: FIRE, outputB: EMPTY,   priority: S, desc: "The void takes the soul and burns it away" },
  { inputs: [SOUL, LIGHT],   outputA: STAR, outputB: EMPTY,   priority: S, desc: "A soul given to the light becomes a star" },
  { inputs: [SHADOW, FIRE],  outputA: SMOKE, outputB: EMPTY,  priority: C, desc: "Fire burns away the shadow" },
  { inputs: [SHADOW, LIGHT], outputA: EMPTY, outputB: EMPTY,  priority: U, desc: "Light and shadow cancel each other out" },
  { inputs: [GLITCH, VOID],  outputA: PORTAL, outputB: EMPTY, priority: S, discovery: "PORTAL", desc: "A glitch inside the void tears a doorway open" },
  { inputs: [PORTAL, PORTAL],outputA: SINGULARITY, outputB: EMPTY, priority: S, desc: "Two portals fold into a singularity" },
];

/**
 * Checks if two adjacent materials react.
 * Returns { outputA, outputB, recipe, product } or null.
 */
export function findReaction(idA, idB) {
  if (idA === EMPTY || idB === EMPTY) return null;
  for (const r of REACTIONS) {
    if (r.inputs[0] === idA && r.inputs[1] === idB) {
      const product = r.outputA !== EMPTY ? r.outputA : r.outputB;
      return { outputA: r.outputA, outputB: r.outputB, recipe: r, product };
    }
    if (r.inputs[0] === idB && r.inputs[1] === idA) {
      const product = r.outputB !== EMPTY ? r.outputB : r.outputA;
      return { outputA: r.outputB, outputB: r.outputA, recipe: r, product };
    }
  }
  return null;
}