/**
 * SANDBOX — Inspect / Explorer Mode
 *
 * Provides instant, unobtrusive material identification and reaction discoveries
 * via mouse hover and mobile touch dragging.
 */

import {
  MATERIALS, EMPTY, SAND, WATER, STONE, FIRE, SMOKE, WOOD, CODE,
  GLASS, STEAM, ASH, CORRUPTED_CODE, MUD, BURNING_WOOD, OIL, LAVA,
  HEATED_STONE, WET_SAND, METAL, HOT_METAL, EMBER, DUST, VOID, DARK_MATTER, PLANT,
  SOIL, SEED, SPROUT, TRUNK, BRANCH, LEAF, CLOUD, RAIN,
  SALT, ICE, SNOW, ACID, GOLD, MERCURY, CRYSTAL, STEEL, SPARK, ASHFALL,
  GLITCH
} from "./materials.js";

const MATERIAL_TRAITS = {
  [SAND]:           { trait: "EARTH",             hint: "Falls and piles · soak it to make soil" },
  [WATER]:          { trait: "LIQUID",            hint: "Quench fire · soak earth · boil to steam" },
  [STONE]:          { trait: "SOLID",             hint: "Impermeable · bakes hot near fire" },
  [FIRE]:           { trait: "ENERGY",            hint: "Ignites wood, oil, leaves & metal" },
  [SMOKE]:          { trait: "GAS",               hint: "Rises and dissipates · drifts on air" },
  [WOOD]:           { trait: "FLAMMABLE SOLID",   hint: "Burns to ash, spreading flames" },
  [CODE]:           { trait: "DIGITAL PARTICLES", hint: "Falls as data · rides metal · glitches" },
  [GLASS]:          { trait: "FUSED SILICA",      hint: "Heat-fused transparent barrier" },
  [STEAM]:          { trait: "CONDENSATION",      hint: "Rises · gathers into clouds high up" },
  [ASH]:            { trait: "RESIDUE POWDER",    hint: "What fire leaves · washes into soil" },
  [CORRUPTED_CODE]: { trait: "GLITCH MATRIX",     hint: "Spreads to nearby code — burns to smoke" },
  [MUD]:            { trait: "WET MIXTURE",       hint: "Heavy saturated earth" },
  [BURNING_WOOD]:   { trait: "ACTIVE COMBUSTION", hint: "Spreads flames to wood and oil" },
  [OIL]:            { trait: "FLAMMABLE LIQUID",  hint: "Highly volatile fuel · floats on water" },
  [LAVA]:           { trait: "MOLTEN ROCK",       hint: "Harden in water · glass earth · blast oil" },
  [HEATED_STONE]:   { trait: "GLOWING SOLID",     hint: "Bakes hot · ignites fuel · quenched by water" },
  [WET_SAND]:       { trait: "DAMP EARTH",        hint: "Heavier than earth · matures into soil" },
  [METAL]:          { trait: "CONDUCTIVE SOLID",  hint: "Carries heat and code · won't burn" },
  [HOT_METAL]:      { trait: "SCORCHING METAL",   hint: "Conducts heat through the bar · quench it" },
  [EMBER]:          { trait: "LIVE COAL",         hint: "A wandering spark that catches wood afire" },
  [DUST]:           { trait: "LIGHT POWDER",      hint: "Drifts on the air · settles slowly" },
  [PLANT]:          { trait: "LIVING MATTER",     hint: "Grows in the light · burns fast" },
  [SOIL]:           { trait: "FERTILE GROUND",    hint: "Plant a seed here and water it" },
  [SEED]:           { trait: "DORMANT LIFE",      hint: "Nothing… yet. It needs damp soil." },
  [SPROUT]:         { trait: "NEW GROWTH",        hint: "Something is finally happening" },
  [TRUNK]:          { trait: "LIVING WOOD",       hint: "The tree is climbing upward" },
  [BRANCH]:         { trait: "LIMB",              hint: "Reaching outward" },
  [LEAF]:           { trait: "FOLIAGE",           hint: "Light as air · catches fire instantly" },
  [CLOUD]:          { trait: "GATHERED VAPOUR",   hint: "Holding rain…" },
  [RAIN]:           { trait: "FALLING WATER",     hint: "The cycle closing from the sky" },
  [VOID]:           { trait: "UNKNOWN OBJECT",    hint: "It is pulling things toward it…" },
  [DARK_MATTER]:    { trait: "SINGULARITY",       hint: "The void has fed. It has grown." },
  [SALT]:           { trait: "CRYSTALLINE POWDER",hint: "Chills water to ice · corrodes to acid" },
  [ICE]:            { trait: "FROZEN SOLID",      hint: "Melts near fire · compresses to stone" },
  [SNOW]:           { trait: "FROZEN POWDER",     hint: "Light and cold · packs into ice" },
  [ACID]:           { trait: "CORROSIVE LIQUID",  hint: "Eats through stone, metal and data" },
  [GOLD]:           { trait: "PRECIOUS METAL",    hint: "Conductive · melts into quicksilver" },
  [MERCURY]:        { trait: "LIQUID METAL",      hint: "Heavy and quick · throws sparks" },
  [CRYSTAL]:        { trait: "CRYSTALLINE SOLID", hint: "Rings with sparks · melts to glass" },
  [STEEL]:          { trait: "HARDENED METAL",    hint: "Conducts heat · glows when fired" },
  [SPARK]:          { trait: "RAW ENERGY",        hint: "Leaps along metal · dies in water" },
  [ASHFALL]:        { trait: "FINE RESIDUE",      hint: "Settles into soil when soaked" },
  [GLITCH]:         { trait: "REALITY ERROR",     hint: "The rules don't apply here. Don't touch it." },
};

// Cosmic entities get their own descriptive cards.
const ENTITY_TRAITS = {
  human:     { title: "HUMAN",     trait: "TINY INHABITANT",   hint: "Wanders · flees fire · can be cloned by code" },
  fish:      { title: "FISH",      trait: "AQUATIC CREATURE",  hint: "Swims in water · suffocates on land" },
  bird:      { title: "BIRD",      trait: "FRAGILE FLIER",     hint: "Soars and perches · devils love to torch them" },
  angel:     { title: "ANGEL",     trait: "THE GUARDIAN",      hint: "Protects life · seals the void shut" },
  devil:     { title: "DEVIL",     trait: "THE TROUBLEMAKER",  hint: "Stalks life · sets humans and birds alight" },
  blackhole: { title: "BLACK HOLE",trait: "THE DEVOURER",      hint: "No side. Only appetite. Angels can seal it." },
};

export class InspectController {
  constructor(canvas, simulation, actorLayer, tooltipEl, discoveryTracker = null) {
    this.canvas = canvas;
    this.sim = simulation;
    this.actors = actorLayer;
    this.tooltip = tooltipEl;
    this.discovery = discoveryTracker;
    this.active = false;
  }

  setDiscoveryTracker(dt) {
    this.discovery = dt;
  }

  enable() {
    this.active = true;
  }

  disable() {
    this.active = false;
    this._hide();
  }

  _cellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.floor(relX * this.sim.cols),
      y: Math.floor(relY * this.sim.rows),
    };
  }

  _findActor(x, y) {
    // Tolerant lookup around the actor's position. Cosmic entities (black
    // holes) are large, so they get a wider hit box.
    return this.actors.actors.find((a) => {
      const r = a.kind === "blackhole" ? 4 : 1;
      return Math.abs(a.x - x) <= r && Math.abs(a.y - y) <= r + 1;
    });
  }

  _describe(cellX, cellY) {
    const actor = this._findActor(cellX, cellY);
    if (actor) {
      const info = ENTITY_TRAITS[actor.kind] || ENTITY_TRAITS.human;
      let extra = info.hint;

      if (actor.kind === "human") {
        let state = "Wandering";
        if (actor.burning > 0) state = "BURNING!";
        else if (actor.digitized > 0) state = "DIGITIZED (MATRIX)";
        else if (actor.swimming) state = "Swimming";
        else if (actor.panicked > 0) state = "Fleeing in panic";
        else if (actor.buried > 0) state = "Buried";
        else if (actor.guarded > 0) state = "Soothed by an angel";
        extra = `State: ${state}`;
      } else if (actor.kind === "fish") {
        extra = actor.air > 20 ? "Suffocating on dry land!" : info.hint;
      } else if (actor.kind === "bird") {
        extra = actor.burning > 0 ? "Ablaze — flapping in panic!"
          : actor.resting > 0 ? "Perched, resting"
          : actor.panicked > 0 ? "Fleeing a hazard" : info.hint;
      } else if (actor.kind === "angel") {
        extra = actor.cleansing > 0 ? "Sealing the void shut…"
          : actor.target ? "Guarding threatened life" : info.hint;
      } else if (actor.kind === "devil") {
        extra = actor.crueltyTimer > 0 ? "Savoring the flames…"
          : actor.target ? "Stalking its prey…" : info.hint;
      } else if (actor.kind === "blackhole") {
        extra = `Consumed ${actor.fed} particles · size ${actor.size}`;
      }

      const color =
        actor.kind === "angel" ? "#ffe9c9" :
        actor.kind === "devil" ? "#e04040" :
        actor.kind === "fish" ? actor.hue :
        actor.kind === "bird" ? "#8f8fa8" :
        actor.kind === "blackhole" ? "#9650ff" :
        actor.burning > 0 ? "#ff7020" :
        actor.digitized > 0 ? "#00e5ff" : "#39ff14";

      return {
        title: info.title,
        trait: info.trait + (actor.trait ? ` · ${actor.trait.name.toUpperCase()}` : ""),
        extra,
        color,
        discovered: true,
      };
    }

    const id = this.sim.get(cellX, cellY);
    if (id === EMPTY) {
      return {
        title: "VACUUM",
        trait: "EMPTY SPACE",
        extra: "Paint any material here",
        color: "#6b7280",
      };
    }

    const def = MATERIALS[id];
    if (!def) {
      return { title: "UNKNOWN", trait: "ANOMALY", extra: `id=${id}`, color: "#ff00ff" };
    }

    const info = MATERIAL_TRAITS[id] || { trait: def.category.toUpperCase(), hint: "" };

    // Discovery gating: common toolbar materials always show their hint;
    // secret transformation products stay mysterious ("???") until the user
    // has actually produced them through experimentation.
    const isSecret = this.discovery ? !this.discovery.has(id) && this.discovery.isSecret(id) : false;
    let extra = info.hint;
    let discovered = false;

    if (this.discovery && this.discovery.recipes && this.discovery.recipes.has(id)) {
      const [idA, idB] = this.discovery.recipes.get(id);
      const nameA = (MATERIALS[idA] && MATERIALS[idA].name) || "?";
      const nameB = (MATERIALS[idB] && MATERIALS[idB].name) || "?";
      extra = `Discovered: ${nameA} + ${nameB}`;
      discovered = true;
    } else if (isSecret) {
      extra = "Analyse further — unknown transformation";
    }

    const rgb = def.color ? `rgb(${def.color.join(",")})` : "#00e5ff";
    return {
      title: def.name,
      trait: info.trait,
      extra,
      color: rgb,
      discovered,
    };
  }

  _show(clientX, clientY, info) {
    const tick = info.discovered ? " <span class=\"tt-badge\">✓</span>" : "";
    this.tooltip.innerHTML =
      `<div class="tt-header" style="border-left-color: ${info.color}">` +
      `  <span class="tt-title" style="color: ${info.color}">${info.title}</span>` +
      `  <span class="tt-sep">—</span>` +
      `  <span class="tt-trait">${info.trait}</span>${tick}` +
      `</div>` +
      (info.extra ? `<div class="tt-extra">${info.extra}</div>` : "");

    this.tooltip.style.display = "block";
    this.tooltip.setAttribute("aria-hidden", "false");

    // Position badge smartly near cursor / touch, clamped within viewport
    const pad = 12;
    const rect = this.tooltip.getBoundingClientRect();

    // Default: slightly above and to right of touch to keep finger from blocking it
    let left = clientX + 16;
    let top = clientY - rect.height - 12;

    if (top < pad) {
      top = clientY + 24; // Show below finger if too close to screen top
    }
    if (left + rect.width > window.innerWidth - pad) {
      left = clientX - rect.width - 16; // Shift left if off right edge
    }
    if (left < pad) left = pad;

    this.tooltip.style.left = `${Math.round(left)}px`;
    this.tooltip.style.top = `${Math.round(top)}px`;
  }

  _hide() {
    this.tooltip.style.display = "none";
    this.tooltip.setAttribute("aria-hidden", "true");
  }

  handlePointer(e) {
    if (!this.active) return;
    const { x, y } = this._cellFromEvent(e);
    if (!this.sim.inBounds(x, y)) {
      this._hide();
      return;
    }
    const info = this._describe(x, y);
    this._show(e.clientX, e.clientY, info);
  }
}