# MASTER PROMPT — paste this whole thing into ChatGPT / Claude / DeepSeek

---

## ROLE

You are a **game systems designer** helping expand the crafting/reaction system of a small
2D falling-sand + crafting sandbox game called **SANDBOX** (part of a personal portfolio
hub called "Enuhri Hub").

Do not redesign the game. Do not write code. **Produce DESIGN DATA** — an element tree,
a reaction table with metadata, and brief design notes.

**The single most important instruction in this document:** the goal is NOT "everything
combines with everything." The goal is:

> **"The player discovers SYSTEMS, not recipes."**

A sandbox should feel like **a world**, not a recipe book. If you generate a giant soup of
random recipes, the output is unusable. Read the Design Philosophy below before writing a
single row.

---

# CRITICAL DESIGN PHILOSOPHY — READ THIS BEFORE GENERATING ANYTHING

Do not treat every element as equal. Organize reactions into layers.

## Layer 1 — WORLD (silent physics)

These happen automatically because of the falling-sand simulation. They are the **laws of
nature**, not discoveries. **No discovery notification.**

```
WATER falls downward
SAND sinks through WATER
FIRE rises
SMOKE drifts through AIR
ICE melts near HEAT
WOOD burns near FIRE
```

## Layer 2 — COMMON / UNCOMMON (discovery reactions)

These **unlock new tools** and create progression. This is the backbone — most of your
output belongs here.

```
EARTH + WATER  → MUD            COMMON
MUD   + TIME   → SOIL           COMMON
SOIL  + SEED   → SPROUT         COMMON
SAND  + FIRE   → GLASS          COMMON
METAL + FIRE   → HOT METAL      UNCOMMON
MERCURY + FIRE → SPARK          UNCOMMON
```

## Layer 3 — RARE / SECRET (the secrets)

These must feel like **secrets**. Do not make them common. Surprising, occasionally
strange, rewarding to stumble into. Use `???` in the player-facing description but
**still tell me the real result** in your table so I can implement it.

```
TREE  + LIGHTNING → ???   RARE
CODE  + VOID      → ???   SECRET
VOID  + LIFE      → ???   SECRET
ANGEL + DEVIL     → ???   RARE
```

## Anti-Inflation Rules

Do NOT create a new element when a **behaviour change** works better.

- Bad:  `WOOD + WATER → WET_WOOD` (clutter, no new gameplay)
- Good: `WOOD in WATER → wood becomes heavier and sinks temporarily`

Every proposed new element must satisfy **at least one**:
1. It creates new gameplay possibilities (e.g. GLASS blocks liquids)
2. It creates a new ecosystem branch (e.g. SEED → SPROUT → TREE)
3. It changes physics (e.g. BLACK HOLE pulls matter inward)
4. It creates curiosity or surprise (e.g. GLITCH teleports and corrupts)

If your answer is "it just looks different," **don't add it**.

## Element Classification — label EVERY element

- **MATERIAL** — exists in the grid (falls, flows, burns, melts) — `WATER · STONE · ASH`
- **LIFE ENTITY** — has behaviour/AI (walks, swims, flies, grows) — `TREE · FISH · HUMAN`
- **FORCE** — environmental modifier, not paintable — `AIR · HEAT · COLD · GRAVITY · LIGHT`
- **EVENT** — temporary reaction that resolves and is gone — `EXPLOSION · LIGHTNING · EARTHQUAKE`

Avoid proposing entities unless you can describe their behavioural loop in one sentence.

## Chain Design Requirement

For every major category, design a **progression chain**. The player should feel they are
uncovering a deeper layer of the same world — not collecting trading cards.

```
Nature : earth → mud → soil → seed → sprout → tree → forest → ecosystem
Fire   : fire → burning wood → ash → soil → seed      (destruction feeds creation)
Metal  : stone → metal → steel · metal → gold → mercury → spark
Water  : water → steam → cloud → rain → water         (must be a TRUE closed loop)
Digital: code → corrupted code → glitch               (code that touched the void)
Cosmic : void → dark matter → gravity → black hole    (rare, deep game)
```

Design chains, not isolated pairs. A combination that leads somewhere is worth ten that
dead-end.

---

## WHAT THE GAME IS

SANDBOX blends two ideas:

1. **A falling-sand cellular automaton** — materials fall, flow, pile, burn, freeze,
   dissolve, grow. Gravity acts on them every tick.
2. **An Infinite-Craft style discovery loop** — the player combines two things to make a
   new thing, and the result becomes a *new element they can use in further combinations*.

The intended feeling: **"What happens if I put X on Y?"** — playful, tactile, discoverable,
surprising. Closer to Neal.fun's *Infinite Craft* and *Sandbox* than to a level-based game.

Conceptually the game has evolved from *"a falling-sand simulator"* into
**"a tiny artificial universe where players discover the rules of existence."**

Art is deliberately **low-resolution pixel / CRT retro** — dark background, luminous
particles, tiny cells.

## CORE LOOP

```
STARTING ELEMENTS
        ↓  the player paints them, or drags one item onto another
   a reaction happens
        ↓
   NEW ELEMENT DISCOVERED
        ↓
   unlocked as a new tool in the toolbar
        ↓
   more experiments → more elements → deeper systems
```

---

## WHAT ALREADY EXISTS (the current build)

### Starting elements (the player begins with these)
- **WATER** — liquid, flows, pools
- **FIRE** — energy, spreads through flammable things, rises, leaves smoke/ash
- **EARTH** (= internal id `SAND`) — granular powder, falls and piles
- **STONE** — solid, inert, blocks particles, can be heated
- **WOOD** — solid, flammable
- **METAL** — solid, conducts heat and code
- **AIR** — *not a paint-able material*; an invisible FORCE that pushes smoke, fire,
  leaves, dust and code around

### Existing materials (already implemented)
```
MATTER   : EARTH/SAND, WATER, STONE, WOOD, SOIL, MUD, SALT, ICE, SNOW, WET_SAND,
           METAL, GOLD, MERCURY, CRYSTAL, STEEL, GLASS, DUST, ASHFALL
ENERGY   : FIRE, EMBER, SPARK, SMOKE, STEAM, CLOUD, RAIN, OIL, LAVA, HEATED_STONE,
           HOT_METAL, ASH, BURNING_WOOD
LIFE     : SEED, SPROUT, TRUNK, BRANCH, LEAF, PLANT
DIGITAL  : CODE, CORRUPTED_CODE
SPECIAL  : ACID, VOID, DARK_MATTER
ENTITIES : HUMAN, FISH, BIRD, ANGEL, DEVIL, BLACK HOLE
```

### Existing reactions (~80 implemented). Do NOT repeat these — build outward:
```
WATER + FIRE       → STEAM
SAND  + FIRE       → GLASS
WATER + SAND       → WET_SAND        (EARTH + WATER → MUD when combined deliberately)
WET_SAND + WET_SAND→ SOIL
ASH   + WATER      → SOIL
WATER + SALT       → ICE
STEAM + ICE        → SNOW
SNOW  + SNOW       → ICE
ICE   + FIRE       → WATER
METAL + SAND       → STEEL
METAL + WATER      → GOLD
GOLD  + FIRE       → MERCURY
MERCURY + FIRE     → SPARK
STONE + ICE        → CRYSTAL
ACID  + STONE      → SMOKE
SEED  + WATER      → SPROUT
SPROUT + WATER     → TRUNK
TRUNK + WATER      → BRANCH
BRANCH + WATER     → LEAF
CODE  + WATER      → CORRUPTED_CODE
VOID  + <anything> → DARK_MATTER
```

---

# DELIVERABLE — WORK IN THIS ORDER

## STEP 1 — THE ELEMENT TREE FIRST

**Before writing any reactions**, produce the element tree. Without it you will generate
unrelated "Minecraft crafting recipes" instead of a designed world.

```
FOUNDATION
|
├── MATTER
│   ├── EARTH
│   │    ├── MUD
│   │    ├── SOIL
│   │    └── CRYSTAL
│   └── ...
├── ENERGY
│   ├── FIRE
│   ├── HEAT
│   └── LIGHT
├── LIFE
│   ├── PLANT
│   ├── ANIMAL
│   └── HUMAN
├── DIGITAL
│   ├── CODE
│   └── AI
└── COSMIC
    ├── VOID
    └── BLACK HOLE
```

Mark every node with its **type** (`MATERIAL` / `LIFE ENTITY` / `FORCE` / `EVENT`) and
note which are **NEW** vs already existing.

**Wait for me to confirm the tree before generating the reaction table**, unless told to
produce everything at once.

## STEP 2 — THE REACTION TABLE

One row per combination:

```
A + B → RESULT | type | priority | one-line description | recipe / emergent / conditional
```

Example rows:
```
EARTH + WATER     → MUD      | MATERIAL | COMMON   | Water clumps earth into heavy mud       | recipe
ICE   + FIRE      → WATER    | MATERIAL | COMMON   | Fire melts ice back to water            | emergent
TREE  + LIGHTNING → CHARCOAL | MATERIAL | RARE     | Lightning splits the tree, leaving char | conditional
VOID  + HUMAN     → ???      | EVENT    | SECRET   | The void takes the human                | emergent
```

Group rows under: **Foundations · Matter · Energy · Water Cycle · Life · Digital ·
Special · Creatures · Forces & Events · New Elements**

### Rules

1. **Bidirectional.** `A + B` and `B + A` are the same — state it once.
2. **Each result must be usable** — an existing material, an entity, a force, an event,
   or a genuinely NEW element you are proposing (clearly flagged).
3. **Prefer depth over breadth.** Chains over one-offs.
4. **Do not make everything react.** Explicitly list pairs that do nothing.
5. **Label each row**: `recipe` (clean A+B→C), `emergent` (physics-driven), or
   `conditional` (needs time / a third element / a specific order).
6. **Respect the setting.** Elemental, earthy, slightly cosmic — fire, water, earth, air,
   metal, life, weather, light, decay, and a few strange things (void, code, angels,
   devils). Not sci-fi tech.

## STEP 3 — STARTER CHAINS

5–6 multi-step chains a player might stumble along:
```
EARTH + WATER → MUD → ... → ...
```

## STEP 4 — WHAT YOU DELIBERATELY LEFT OUT

A short list of combinations you chose **not** to add, and why. This proves the tree was
designed, not generated.

---

## TONE / QUALITY BAR

- Short, evocative one-liners: *"Acid eats through stone with a hiss of smoke."*
- No corporate filler. Write like a game designer briefing an artist.
- Being a little strange and playful is encouraged (this game has a devil in it).
- Where a combination is *surprising but logical*, say why.

## VOLUME

Aim for **~120 meaningful interactions**. If a category has fewer meaningful reactions,
**leave it smaller rather than inventing filler.** A tight 90-row tree beats a padded
140-row one.

**Do not generate things like `GOLD + BIRD → SHINY BIRD`.** That is exactly the failure
mode to avoid — it damages the whole discovery feeling.