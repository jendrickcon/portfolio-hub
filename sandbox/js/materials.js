/**
 * SANDBOX — Material Definitions
 *
 * Everything here is data. The simulation engine reads these descriptors
 * generically (gravity / density / viscosity / life / behavior), so adding a
 * new material is a matter of adding one row here — not editing the engine.
 */

export const EMPTY = 0;
export const SAND = 1;          // EARTH (the player-facing name)
export const WATER = 2;
export const STONE = 3;
export const FIRE = 4;
export const SMOKE = 5;
export const WOOD = 6;
export const CODE = 7;
export const GLASS = 8;
export const STEAM = 9;
export const ASH = 10;
export const CORRUPTED_CODE = 11;
export const MUD = 12;
export const BURNING_WOOD = 13;
export const OIL = 14;
export const LAVA = 15;
export const HEATED_STONE = 16;
export const WET_SAND = 17;
export const METAL = 18;
export const HOT_METAL = 19;
export const EMBER = 20;
export const DUST = 21;
export const VOID = 22;         // the strange, hungry material
export const DARK_MATTER = 23; // void that has grown — still mysterious
export const PLANT = 24;

// --- Life / growth chain (discovered, not given) ---
export const SOIL = 25;         // earth that has been soaked and matured
export const SEED = 26;         // a sleeping thing waiting for water + soil
export const SPROUT = 27;       // a seed that has begun to wake
export const TRUNK = 28;        // the living wood of a growing tree
export const BRANCH = 29;       // a limb reaching out
export const LEAF = 30;         // foliage — light, catches fire easily
export const CLOUD = 31;        // gathered steam, ready to rain
export const RAIN = 32;         // falling water from a cloud

// --- Crafted matter (all discovered by combining) ---
export const SALT = 33;         // earth dried by fire — dissolves back into water
export const ICE = 34;          // frozen water
export const SNOW = 35;         // light frozen vapour
export const ACID = 36;         // corrosive liquid that eats through matter
export const GOLD = 37;         // precious metal, bathed in water
export const MERCURY = 38;      // liquid metal, heavy and quicksilver
export const CRYSTAL = 39;      // stone grown under pressure
export const STEEL = 40;        // metal hardened by fire + earth
export const SPARK = 41;        // raw electricity, brief and bright
export const ASHFALL = 42;      // cooled volcanic dust
export const GLITCH = 43;       // reality-breaking anomaly — CODE that touched the VOID

// ===========================================================================
//  EXPANSION SET — new materials across every tier
// ===========================================================================
export const COAL = 44;         // wood burnt down to a black, burnable rock
export const CHARCOAL = 45;     // hotter, cleaner fuel than coal
export const FUEL = 46;         // refined volatile liquid — burns fiercely
export const SULFUR = 47;       // yellow powder, reeks of the deep earth
export const GUNPOWDER = 48;    // sulfur + charcoal + salt — explosive
export const OBSIDIAN = 49;     // glass fused by lava
export const MAGMA_ROCK = 50;   // cooled lava stone
export const LIMESTONE = 51;    // soft sedimentary rock
export const CEMENT = 52;       // limestone + fire — sets hard with water
export const CONCRETE = 53;     // cement that has set

export const MOSS = 54;         // low green life on damp stone
export const VINE = 55;         // climbing life
export const FLOWER = 56;       // bloom of colour
export const FRUIT = 57;        // sweet produce
export const GRASS = 58;        // ground cover
export const TREE = 59;         // a fully grown tree entity

export const BEE = 60;          // tiny flying pollinator
export const WORM = 61;         // soil-dweller that aerates earth
export const SNAKE = 62;        // serpent, drawn to warmth

export const WIND = 63;         // a visible gust — a FORCE with a body
export const LIGHT = 64;        // pure radiance
export const SHADOW = 65;       // absence of light
export const HEAT = 66;         // raw thermal energy
export const COLD = 67;         // raw absence of heat
export const STATIC = 68;       // lingering charge
export const MAGNET = 69;       // attracts metal

export const MACHINE = 70;      // crafted from steel — an engine
export const GEAR = 71;         // a toothed wheel
export const WIRE = 72;         // conductive thread
export const BATTERY = 73;      // stores charge
export const CIRCUIT = 74;      // code made physical
export const ROBOT = 75;        // a walking machine entity
export const AI = 76;           // code that thinks — a life entity
export const DATA = 77;         // raw information
export const VIRUS = 78;        // infectious code

export const PORTAL = 79;       // a tear between places
export const SINGULARITY = 80;  // a black hole condensed to a point
export const STAR = 81;         // a distant sun
export const NEBULA = 82;       // a cloud of cosmic dust
export const COMET = 83;        // a fast, icy traveller
export const ASTRONAUT = 84;    // a human far from home
export const SPACE = 85;        // the void between worlds, but emptier
export const TIME = 86;         // the thing that makes soil from mud
export const MEMORY = 87;       // a trace left behind by life
export const SOUL = 88;         // what a devil wants and an angel keeps

export const TEST_MODE_ALL_MATERIALS = false;

// Material categories drive the grouped toolbar and the discovery log.
export const CATEGORY = {
  MATTER: "MATTER",
  ENERGY: "ENERGY",
  DIGITAL: "DIGITAL",
  LIFE: "LIFE",
  SPECIAL: "SPECIAL",
};

/**
 * The four FOUNDATIONAL elements the player begins with. Everything else in
 * this table is discovered by experiment — see TOOL_GROUPS below.
 *
 * AIR is deliberately NOT a material: it is an environmental force (see the
 * simulation's air field) that nudges smoke, fire, leaves and dust.
 */
export const FOUNDATIONS = [WATER, FIRE, SAND];

export const MATERIALS = {
  // ---------------------------------------------------------------- MATTER
  [SAND]:  { id: SAND,  name: "SAND",  category: CATEGORY.MATTER, color: [214,178,110], behavior: "powder", gravity: true,  flammable: false, life: null,        density: 3.0,  viscosity: 1.0 },
  [WATER]: { id: WATER, name: "WATER", category: CATEGORY.MATTER, color: [64,140,220],  behavior: "liquid", gravity: true,  flammable: false, life: null,        density: 2.0,  viscosity: 1.0 },
  [STONE]: { id: STONE, name: "STONE", category: CATEGORY.MATTER, color: [120,120,128], behavior: "solid",  gravity: false, flammable: false, life: null,        density: 10.0, viscosity: 0 },
  [WOOD]:  { id: WOOD,  name: "WOOD",  category: CATEGORY.MATTER, color: [120,78,45],   behavior: "solid",  gravity: false, flammable: true,  life: null,        density: 4.0,  viscosity: 0 },
  [METAL]: { id: METAL, name: "METAL", category: CATEGORY.MATTER, color: [150,158,170], behavior: "solid",  gravity: false, flammable: false, life: null,        density: 9.0,  viscosity: 0, conducts: true },
  [GLASS]: { id: GLASS, name: "GLASS", category: CATEGORY.MATTER, color: [180,230,240], behavior: "solid",  gravity: false, flammable: false, life: null,        density: 5.0,  viscosity: 0 },
  [MUD]:   { id: MUD,   name: "MUD",   category: CATEGORY.MATTER, color: [90,60,40],    behavior: "liquid", gravity: true,  flammable: false, life: null,        density: 2.2,  viscosity: 0.4 },
  [WET_SAND]: { id: WET_SAND, name: "WET SAND", category: CATEGORY.MATTER, color: [150,120,80], behavior: "powder", gravity: true, flammable: false, life: null, density: 3.4, viscosity: 1.0 },
  [DUST]:  { id: DUST,  name: "DUST",  category: CATEGORY.MATTER, color: [196,186,168], behavior: "powder", gravity: true,  flammable: false, life: null,        density: 0.6,  viscosity: 1.0, light: true },

  // ---------------------------------------------------------------- ENERGY
  [FIRE]:  { id: FIRE,  name: "FIRE",  category: CATEGORY.ENERGY, color: [255,120,40],  behavior: "energy", gravity: false, flammable: false, life: [22, 45],    density: 0.05, viscosity: 0 },
  [EMBER]: { id: EMBER, name: "EMBER", category: CATEGORY.ENERGY, color: [255,90,20],   behavior: "powder", gravity: true,  flammable: false, life: [60, 150],   density: 3.2,  viscosity: 1.0, hot: true },
  [SMOKE]: { id: SMOKE, name: "SMOKE", category: CATEGORY.ENERGY, color: [150,150,150], behavior: "gas",    gravity: false, flammable: false, life: [80, 180],   density: 0.1,  viscosity: 0, light: true },
  [STEAM]: { id: STEAM, name: "STEAM", category: CATEGORY.ENERGY, color: [200,210,220], behavior: "gas",    gravity: false, flammable: false, life: [100, 220],  density: 0.08, viscosity: 0, light: true },
  [ASH]:   { id: ASH,   name: "ASH",   category: CATEGORY.ENERGY, color: [80,75,70],    behavior: "powder", gravity: true,  flammable: false, life: null,        density: 1.5,  viscosity: 1.0 },
  [BURNING_WOOD]: { id: BURNING_WOOD, name: "BURNING WOOD", category: CATEGORY.ENERGY, color: [255,140,30], behavior: "solid", gravity: false, flammable: false, life: [110, 190], density: 4.0, viscosity: 0 },
  [LAVA]:  { id: LAVA,  name: "LAVA",  category: CATEGORY.ENERGY, color: [255,70,15],   behavior: "liquid", gravity: true,  flammable: false, life: null,        density: 2.8,  viscosity: 0.25 },
  [OIL]:   { id: OIL,   name: "OIL",   category: CATEGORY.ENERGY, color: [45,35,28],    behavior: "liquid", gravity: true,  flammable: true,  life: null,        density: 1.6,  viscosity: 0.85 },
  [HEATED_STONE]: { id: HEATED_STONE, name: "HEATED STONE", category: CATEGORY.ENERGY, color: [200,120,70], behavior: "solid", gravity: false, flammable: false, life: [120, 260], density: 10.0, viscosity: 0 },
  [HOT_METAL]: { id: HOT_METAL, name: "HOT METAL", category: CATEGORY.ENERGY, color: [255,170,90], behavior: "solid", gravity: false, flammable: false, life: [120, 260], density: 9.0, viscosity: 0, conducts: true, hot: true },

  // ---------------------------------------------------------------- DIGITAL
  [CODE]:  { id: CODE,  name: "CODE",  category: CATEGORY.DIGITAL, color: [70,255,110],  behavior: "digital",gravity: true,  flammable: false, life: [240, 640], density: 2.5,  viscosity: 1.0 },
  [CORRUPTED_CODE]: { id: CORRUPTED_CODE, name: "CORRUPTED CODE", category: CATEGORY.DIGITAL, color: [180,60,255], behavior: "digital", gravity: true, flammable: false, life: [80, 200], density: 2.5, viscosity: 1.0 },

  // ---------------------------------------------------------------- LIFE
  [PLANT]:  { id: PLANT,  name: "PLANT",  category: CATEGORY.LIFE, color: [60,190,90],  behavior: "solid", gravity: false, flammable: true,  life: null, density: 3.5, viscosity: 0 },
  [SOIL]:   { id: SOIL,   name: "SOIL",   category: CATEGORY.LIFE, color: [92,64,42],   behavior: "sludge",gravity: true,  flammable: false, life: null, density: 2.15, viscosity: 0.5, fertile: true },
  [SEED]:   { id: SEED,   name: "SEED",   category: CATEGORY.LIFE, color: [210,190,110],behavior: "powder",gravity: true,  flammable: true,  life: null, density: 2.6, viscosity: 1.0, seed: true },
  [SPROUT]: { id: SPROUT, name: "SPROUT", category: CATEGORY.LIFE, color: [120,230,120],behavior: "solid", gravity: false, flammable: true,  life: null, density: 3.3, viscosity: 0, growth: "sapling" },
  [TRUNK]:  { id: TRUNK,  name: "TRUNK",  category: CATEGORY.LIFE, color: [110,72,44],  behavior: "solid", gravity: false, flammable: true,  life: null, density: 4.2, viscosity: 0, growth: "trunk" },
  [BRANCH]: { id: BRANCH, name: "BRANCH", category: CATEGORY.LIFE, color: [130,88,52],  behavior: "solid", gravity: false, flammable: true,  life: null, density: 4.0, viscosity: 0, growth: "branch" },
  [LEAF]:   { id: LEAF,   name: "LEAF",   category: CATEGORY.LIFE, color: [70,200,80],  behavior: "solid", gravity: false, flammable: true,  life: null, density: 1.2, viscosity: 0, light: true, leaf: true },

  // ---------------------------------------------------------------- SPECIAL
  [VOID]:       { id: VOID,       name: "VOID",       category: CATEGORY.SPECIAL, color: [15,10,25],   behavior: "void", gravity: false, flammable: false, life: null, density: 99.0, viscosity: 0 },
  [DARK_MATTER]:{ id: DARK_MATTER,name: "DARK MATTER",category: CATEGORY.SPECIAL, color: [40,20,70],   behavior: "void", gravity: false, flammable: false, life: null, density: 99.0, viscosity: 0 },

  // CLOUD / RAIN live in the water cycle — treated as light gas / water.
  [CLOUD]: { id: CLOUD, name: "CLOUD", category: CATEGORY.ENERGY, color: [225,230,240], behavior: "gas", gravity: false, flammable: false, life: [140, 320], density: 0.07, viscosity: 0, light: true },
  [RAIN]:  { id: RAIN,  name: "RAIN",  category: CATEGORY.ENERGY, color: [120,180,240], behavior: "liquid", gravity: true, flammable: false, life: null, density: 2.0, viscosity: 1.0 },

  // ---------------------------------------------------- CRAFTED MATTER
  [SALT]:    { id: SALT,    name: "SALT",    category: CATEGORY.MATTER,  color: [235,235,245], behavior: "powder", gravity: true,  flammable: false, life: null, density: 2.4, viscosity: 1.0 },
  [ICE]:     { id: ICE,     name: "ICE",     category: CATEGORY.MATTER,  color: [150,215,245], behavior: "solid",  gravity: false, flammable: false, life: null, density: 4.2, viscosity: 0 },
  [SNOW]:    { id: SNOW,    name: "SNOW",    category: CATEGORY.MATTER,  color: [240,248,255], behavior: "powder", gravity: true,  flammable: false, life: null, density: 1.8, viscosity: 1.0, light: true },
  [ACID]:    { id: ACID,    name: "ACID",    category: CATEGORY.SPECIAL, color: [150,255,80],  behavior: "liquid", gravity: true,  flammable: false, life: null, density: 2.4, viscosity: 0.9 },
  [GOLD]:    { id: GOLD,    name: "GOLD",    category: CATEGORY.MATTER,  color: [255,205,70],  behavior: "solid",  gravity: false, flammable: false, life: null, density: 9.5, viscosity: 0, conducts: true },
  [MERCURY]: { id: MERCURY, name: "MERCURY", category: CATEGORY.MATTER,  color: [190,196,210], behavior: "liquid", gravity: true,  flammable: false, life: null, density: 5.0, viscosity: 0.7 },
  [CRYSTAL]: { id: CRYSTAL, name: "CRYSTAL", category: CATEGORY.MATTER,  color: [200,160,255], behavior: "solid",  gravity: false, flammable: false, life: null, density: 5.5, viscosity: 0 },
  [STEEL]:   { id: STEEL,   name: "STEEL",   category: CATEGORY.MATTER,  color: [176,186,200], behavior: "solid",  gravity: false, flammable: false, life: null, density: 10.0, viscosity: 0, conducts: true },
  [SPARK]:   { id: SPARK,   name: "SPARK",   category: CATEGORY.ENERGY,  color: [255,255,140], behavior: "energy", gravity: false, flammable: false, life: [10, 26],   density: 0.05, viscosity: 0 },
  [ASHFALL]: { id: ASHFALL, name: "ASHFALL", category: CATEGORY.MATTER,  color: [110,104,100], behavior: "powder", gravity: true,  flammable: false, life: null, density: 1.3, viscosity: 1.0, light: true },
  [GLITCH]: { id: GLITCH, name: "GLITCH", category: CATEGORY.SPECIAL, color: [255,40,200], behavior: "glitch", gravity: false, flammable: false, life: [60, 180], density: 0.5, viscosity: 0 },

  // ================================ FUEL CHAIN
  [COAL]:       { id: COAL,       name: "COAL",       category: CATEGORY.MATTER, color: [40,40,48],    behavior: "powder", gravity: true,  flammable: true,  life: null, density: 2.8, viscosity: 1.0 },
  [CHARCOAL]:   { id: CHARCOAL,   name: "CHARCOAL",   category: CATEGORY.MATTER, color: [58,52,50],    behavior: "powder", gravity: true,  flammable: true,  life: null, density: 2.2, viscosity: 1.0 },
  [FUEL]:       { id: FUEL,       name: "FUEL",       category: CATEGORY.ENERGY, color: [120,90,30],   behavior: "liquid", gravity: true,  flammable: true,  life: null, density: 1.5, viscosity: 0.9 },
  [SULFUR]:     { id: SULFUR,     name: "SULFUR",     category: CATEGORY.MATTER, color: [230,215,70],  behavior: "powder", gravity: true,  flammable: false, life: null, density: 2.6, viscosity: 1.0 },
  [GUNPOWDER]:  { id: GUNPOWDER,  name: "GUNPOWDER",  category: CATEGORY.ENERGY, color: [70,66,60],    behavior: "powder", gravity: true,  flammable: true,  life: null, density: 2.5, viscosity: 1.0, explosive: 4 },

  // ================================ STONE CHAIN
  [OBSIDIAN]:   { id: OBSIDIAN,   name: "OBSIDIAN",   category: CATEGORY.MATTER, color: [26,22,38],    behavior: "solid",  gravity: false, flammable: false, life: null, density: 10.5, viscosity: 0 },
  [MAGMA_ROCK]: { id: MAGMA_ROCK, name: "MAGMA ROCK", category: CATEGORY.MATTER, color: [92,66,60],    behavior: "solid",  gravity: false, flammable: false, life: null, density: 10.0, viscosity: 0 },
  [LIMESTONE]:  { id: LIMESTONE,  name: "LIMESTONE",  category: CATEGORY.MATTER, color: [206,198,176], behavior: "solid",  gravity: false, flammable: false, life: null, density: 8.0,  viscosity: 0 },
  [CEMENT]:     { id: CEMENT,     name: "CEMENT",     category: CATEGORY.MATTER, color: [150,150,148], behavior: "powder", gravity: true,  flammable: false, life: null, density: 3.0,  viscosity: 1.0 },
  [CONCRETE]:   { id: CONCRETE,   name: "CONCRETE",   category: CATEGORY.MATTER, color: [130,132,136], behavior: "solid",  gravity: false, flammable: false, life: null, density: 11.0, viscosity: 0 },

  // ================================ FLORA CHAIN
  [GRASS]:      { id: GRASS,      name: "GRASS",      category: CATEGORY.LIFE,   color: [96,196,84],   behavior: "solid",  gravity: false, flammable: true,  life: null, density: 1.6, viscosity: 0, light: true },
  [MOSS]:       { id: MOSS,       name: "MOSS",       category: CATEGORY.LIFE,   color: [72,140,70],   behavior: "solid",  gravity: false, flammable: true,  life: null, density: 2.0, viscosity: 0 },
  [VINE]:       { id: VINE,       name: "VINE",       category: CATEGORY.LIFE,   color: [70,170,80],   behavior: "solid",  gravity: false, flammable: true,  life: null, density: 2.2, viscosity: 0 },
  [FLOWER]:     { id: FLOWER,     name: "FLOWER",     category: CATEGORY.LIFE,   color: [240,120,190], behavior: "solid",  gravity: false, flammable: true,  life: null, density: 1.4, viscosity: 0, light: true },
  [FRUIT]:      { id: FRUIT,      name: "FRUIT",      category: CATEGORY.LIFE,   color: [230,80,70],   behavior: "powder", gravity: true,  flammable: true,  life: null, density: 2.4, viscosity: 1.0 },
  [TREE]:       { id: TREE,       name: "TREE",       category: CATEGORY.LIFE,   color: [84,150,66],   behavior: "solid",  gravity: false, flammable: true,  life: null, density: 4.5, viscosity: 0 },

  // ================================ CREATURES
  [BEE]:        { id: BEE,        name: "BEE",        category: CATEGORY.LIFE,   color: [250,200,60],  behavior: "solid",  gravity: false, flammable: false, life: null, density: 0.6, viscosity: 0 },
  [WORM]:       { id: WORM,       name: "WORM",       category: CATEGORY.LIFE,   color: [200,150,150], behavior: "powder", gravity: true,  flammable: false, life: null, density: 2.0, viscosity: 1.0 },
  [SNAKE]:      { id: SNAKE,      name: "SNAKE",      category: CATEGORY.LIFE,   color: [110,160,70],  behavior: "powder", gravity: true,  flammable: false, life: null, density: 2.6, viscosity: 1.0 },

  // ================================ FORCES & PHENOMENA
  [WIND]:       { id: WIND,       name: "WIND",       category: CATEGORY.ENERGY, color: [200,230,240], behavior: "gas",    gravity: false, flammable: false, life: [40, 90],   density: 0.05, viscosity: 0, light: true },
  [LIGHT]:      { id: LIGHT,      name: "LIGHT",      category: CATEGORY.ENERGY, color: [255,250,210], behavior: "energy", gravity: false, flammable: false, life: [30, 70],   density: 0.02, viscosity: 0, light: true },
  [SHADOW]:     { id: SHADOW,     name: "SHADOW",     category: CATEGORY.SPECIAL,color: [10,8,18],     behavior: "gas",    gravity: false, flammable: false, life: [60, 160],  density: 0.06, viscosity: 0 },
  [HEAT]:       { id: HEAT,       name: "HEAT",       category: CATEGORY.ENERGY, color: [255,140,90],  behavior: "gas",    gravity: false, flammable: false, life: [40, 90],   density: 0.04, viscosity: 0, light: true },
  [COLD]:       { id: COLD,       name: "COLD",       category: CATEGORY.ENERGY, color: [150,200,255], behavior: "gas",    gravity: false, flammable: false, life: [40, 90],   density: 0.04, viscosity: 0, light: true },
  [STATIC]:     { id: STATIC,     name: "STATIC",     category: CATEGORY.ENERGY, color: [200,200,255], behavior: "energy", gravity: false, flammable: false, life: [20, 60],   density: 0.05, viscosity: 0 },
  [MAGNET]:     { id: MAGNET,     name: "MAGNET",     category: CATEGORY.MATTER, color: [180,120,200], behavior: "solid",  gravity: false, flammable: false, life: null, density: 8.0, viscosity: 0 },

  // ================================ CIVILIZATION CHAIN
  [MACHINE]:    { id: MACHINE,    name: "MACHINE",    category: CATEGORY.MATTER, color: [150,155,165], behavior: "solid",  gravity: false, flammable: false, life: null, density: 9.5, viscosity: 0, conducts: true },
  [GEAR]:       { id: GEAR,       name: "GEAR",       category: CATEGORY.MATTER, color: [170,175,185], behavior: "solid",  gravity: false, flammable: false, life: null, density: 9.0, viscosity: 0, conducts: true },
  [WIRE]:       { id: WIRE,       name: "WIRE",       category: CATEGORY.MATTER, color: [200,150,90],  behavior: "solid",  gravity: false, flammable: false, life: null, density: 8.0, viscosity: 0, conducts: true },
  [BATTERY]:    { id: BATTERY,    name: "BATTERY",    category: CATEGORY.MATTER, color: [220,200,90],  behavior: "solid",  gravity: false, flammable: false, life: null, density: 9.0, viscosity: 0, conducts: true },
  [CIRCUIT]:    { id: CIRCUIT,    name: "CIRCUIT",    category: CATEGORY.DIGITAL,color: [90,220,140],  behavior: "solid",  gravity: false, flammable: false, life: null, density: 6.0, viscosity: 0, conducts: true },
  [ROBOT]:      { id: ROBOT,      name: "ROBOT",      category: CATEGORY.DIGITAL,color: [180,190,205], behavior: "solid",  gravity: false, flammable: false, life: null, density: 9.0, viscosity: 0, conducts: true },

  // ================================ DIGITAL LIFE
  [AI]:         { id: AI,         name: "AI",         category: CATEGORY.DIGITAL,color: [120,255,200], behavior: "solid",  gravity: false, flammable: false, life: null, density: 1.0, viscosity: 0, light: true },
  [DATA]:       { id: DATA,       name: "DATA",       category: CATEGORY.DIGITAL,color: [150,220,255], behavior: "digital",gravity: true,  flammable: false, life: [200, 500],density: 1.2, viscosity: 1.0 },
  [VIRUS]:      { id: VIRUS,      name: "VIRUS",      category: CATEGORY.DIGITAL,color: [200,60,120],  behavior: "digital",gravity: true,  flammable: false, life: [120, 300],density: 1.0, viscosity: 1.0 },

  // ================================ COSMIC CHAIN
  [PORTAL]:     { id: PORTAL,     name: "PORTAL",     category: CATEGORY.SPECIAL,color: [170,80,255],  behavior: "void",   gravity: false, flammable: false, life: null, density: 50.0, viscosity: 0 },
  [SINGULARITY]:{ id: SINGULARITY,name: "SINGULARITY",category: CATEGORY.SPECIAL,color: [90,20,150],   behavior: "void",   gravity: false, flammable: false, life: null, density: 99.0, viscosity: 0 },
  [STAR]:       { id: STAR,       name: "STAR",       category: CATEGORY.SPECIAL,color: [255,240,170], behavior: "energy", gravity: false, flammable: false, life: [400, 900],density: 0.02, viscosity: 0, light: true },
  [NEBULA]:     { id: NEBULA,     name: "NEBULA",     category: CATEGORY.SPECIAL,color: [180,120,255], behavior: "gas",    gravity: false, flammable: false, life: [300, 700],density: 0.05, viscosity: 0, light: true },
  [COMET]:      { id: COMET,      name: "COMET",      category: CATEGORY.SPECIAL,color: [180,230,255], behavior: "energy", gravity: false, flammable: false, life: [120, 260],density: 0.08, viscosity: 0, light: true },
  [ASTRONAUT]:  { id: ASTRONAUT,  name: "ASTRONAUT",  category: CATEGORY.LIFE,   color: [235,235,240], behavior: "solid",  gravity: false, flammable: false, life: null, density: 3.0, viscosity: 0 },
  [SPACE]:      { id: SPACE,      name: "SPACE",      category: CATEGORY.SPECIAL,color: [6,6,16],      behavior: "gas",    gravity: false, flammable: false, life: null, density: 0.01, viscosity: 0 },

  // ================================ ABSTRACT
  [TIME]:       { id: TIME,       name: "TIME",       category: CATEGORY.SPECIAL,color: [220,220,180], behavior: "gas",    gravity: false, flammable: false, life: [120, 300],density: 0.03, viscosity: 0, light: true },
  [MEMORY]:     { id: MEMORY,     name: "MEMORY",     category: CATEGORY.SPECIAL,color: [200,170,255], behavior: "gas",    gravity: false, flammable: false, life: [200, 480],density: 0.05, viscosity: 0, light: true },
  [SOUL]:       { id: SOUL,       name: "SOUL",       category: CATEGORY.SPECIAL,color: [255,240,200], behavior: "gas",    gravity: false, flammable: false, life: [260, 600],density: 0.04, viscosity: 0, light: true },
};

/**
 * The STARTING PALETTE. Seven elements — enough that the player has real
 * choice from the first moment, and enough cross-combinations to start
 * discovering systems immediately. Everything else in the table is earned.
 *
 * Note: "EARTH" is the player-facing name for SAND. AIR is not a paint-able
 * material — it is an environmental FORCE (see the simulation's air field).
 */
export const STARTING_TOOLS = [SAND, WATER, STONE, FIRE, WOOD, METAL, OIL];

/**
 * Unlockable tools, grouped. A tool only becomes paint-able once the player
 * has DISCOVERED it (see discovery.js). This is the heart of the game loop:
 * experiment -> react -> discover -> gain a new tool -> experiment further.
 */
export const TOOL_GROUPS = [
  { label: CATEGORY.MATTER,  ids: [
    SAND, WATER, STONE, WOOD, METAL, SOIL, MUD, SALT, ICE, SNOW, GLASS,
    COAL, CHARCOAL, SULFUR, LIMESTONE, CEMENT, CONCRETE, OBSIDIAN, MAGMA_ROCK,
    GOLD, MERCURY, CRYSTAL, STEEL, MAGNET, DUST,
  ] },
  { label: CATEGORY.LIFE,    ids: [
    SEED, PLANT, SPROUT, TRUNK, BRANCH, LEAF, TREE, GRASS, MOSS, VINE,
    FLOWER, FRUIT, WORM, SNAKE, BEE, ASTRONAUT,
  ] },
  { label: CATEGORY.ENERGY,  ids: [
    FIRE, EMBER, SPARK, SMOKE, STEAM, CLOUD, RAIN, ASH, ASHFALL,
    OIL, FUEL, GUNPOWDER, LAVA, HEATED_STONE, HOT_METAL, WIND, LIGHT, HEAT, COLD,
  ] },
  { label: CATEGORY.DIGITAL, ids: [
    CODE, CORRUPTED_CODE, DATA, VIRUS, CIRCUIT, ROBOT, AI, MACHINE, GEAR, WIRE, BATTERY,
  ] },
  { label: CATEGORY.SPECIAL, ids: [
    ACID, VOID, DARK_MATTER, GLITCH, PORTAL, SINGULARITY, STAR, NEBULA, COMET,
    SPACE, TIME, MEMORY, SOUL, SHADOW, STATIC,
  ] },
];

// Materials the player starts knowing. Everything else is a discovery.
export const TOOLBAR_MATERIALS = TOOL_GROUPS.flatMap((g) => g.ids);

// Only these count toward the "X / Y" discovery counter (secret products).
export const DISCOVERABLE_MATERIALS = [
  GLASS, STEAM, ASH, BURNING_WOOD, HEATED_STONE, WET_SAND, MUD,
  HOT_METAL, CORRUPTED_CODE, DARK_MATTER,
  SOIL, SEED, SPROUT, TRUNK, BRANCH, LEAF, CLOUD,
  SALT, ICE, SNOW, ACID, GOLD, MERCURY, CRYSTAL, STEEL, SPARK, ASHFALL, OIL, GLITCH,
  COAL, CHARCOAL, FUEL, SULFUR, GUNPOWDER, OBSIDIAN, MAGMA_ROCK, LIMESTONE, CEMENT, CONCRETE,
  GRASS, MOSS, VINE, FLOWER, FRUIT, TREE, WORM, SNAKE, BEE,
  WIND, LIGHT, HEAT, COLD, STATIC, MAGNET, SHADOW,
  MACHINE, GEAR, WIRE, BATTERY, CIRCUIT, ROBOT, DATA, VIRUS, AI,
  PORTAL, SINGULARITY, STAR, NEBULA, COMET, ASTRONAUT, SPACE, TIME, MEMORY, SOUL,
];

export function randomInRange([min, max]) {
  return min + Math.floor(Math.random() * (max - min + 1));
}