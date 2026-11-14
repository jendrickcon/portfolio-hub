import { Simulation } from "./simulation.js";
import { Renderer } from "./renderer.js";
import { InputController } from "./input.js";
import { PRESETS } from "./presets.js";
import {
  TOOL_GROUPS,
  MATERIALS,
  EMPTY,
  SAND,
  WATER,
  CODE,
  VOID,
  TEST_MODE_ALL_MATERIALS
} from "./materials.js";
import { findReaction } from "./reactions.js";
import { ActorLayer } from "./actors.js";
import { DiscoveryTracker } from "./discovery.js";
import { InspectController } from "./inspect.js";

const canvas        = document.getElementById("sim-canvas");
const canvasWrap    = document.getElementById("canvas-wrap");
const toolbar       = document.getElementById("toolbar");
const dragHint      = document.getElementById("drag-hint");
const btnHintClose  = document.getElementById("btn-hint-close");
const uiReveal      = document.getElementById("ui-reveal");
const materialGroups= document.getElementById("material-groups");
const presetPanel   = document.getElementById("preset-panel");
const presetRow     = document.getElementById("preset-row");
const btnReset      = document.getElementById("btn-reset");
const btnAir        = document.getElementById("btn-air");
const btnErase      = document.getElementById("btn-erase");
const btnCode       = document.getElementById("btn-code");
const btnVoid       = document.getElementById("btn-void");
const btnHuman      = document.getElementById("btn-human");
const btnFish       = document.getElementById("btn-fish");
const btnBird       = document.getElementById("btn-bird");
const btnAngel      = document.getElementById("btn-angel");
const btnDevil      = document.getElementById("btn-devil");
const btnBlackHole  = document.getElementById("btn-blackhole");
const btnSandboxTab = document.getElementById("btn-tab-sandbox");
const btnExploreTab = document.getElementById("btn-tab-explore");
const btnPresetsTab = document.getElementById("btn-tab-presets");
const btnClosePresets = document.getElementById("btn-close-presets");
const btnPause      = document.getElementById("btn-pause");
const btnStep       = document.getElementById("btn-step");
const btnBrushDown  = document.getElementById("btn-brush-down");
const btnBrushUp    = document.getElementById("btn-brush-up");
const brushLabel    = document.getElementById("brush-label");
const tooltipEl     = document.getElementById("inspect-tooltip");
const toastEl       = document.getElementById("discovery-toast");
const btnDiscoveries     = document.getElementById("btn-discoveries");
const discoveriesPanel   = document.getElementById("discoveries-panel");
const discoveriesGrid    = document.getElementById("discoveries-grid");
const btnCloseDiscoveries = document.getElementById("btn-close-discoveries");

const BRUSH_MIN = 1, BRUSH_MAX = 8;
const MIN_COLS = 80, MAX_COLS = 220;
const MIN_ROWS = 60, MAX_ROWS = 160;
const TARGET_CELL_PX = 6;

let selectedMaterial = WATER;
let eraseMode = false;
// Spawn mode: null = paint materials, otherwise the kind of entity to place.
let spawnKind = null;
// AIR is a force, not a material — a separate tool mode.
let airMode = false;
let airDir = 1;
let brushRadius = 3;
let paused = false;
let currentMode = "sandbox";
// When the MATRIX world is loaded we keep a slow drizzle of code falling from
// the top so the rain doesn't die out entirely as code decays.
let matrixRain = false;

// ---------------------------------------------------------------------------
//  ELEMENT CARDS — the Infinite-Craft layer, played out on the canvas.
//
//  Drag an element from the toolbar onto the world and it becomes a CARD. The
//  card STAYS exactly where you put it and LEAKS its material into the world —
//  for 5 seconds. Then it disappears.
//
//  During those 5 seconds you can drop another element card on top of it: the
//  two MERGE into a single card of whatever they form (EARTH + WATER -> MUD),
//  which restarts the clock and pours out the new material instead. Every new
//  combination also unlocks the result as a fresh element in the toolbar.
// ---------------------------------------------------------------------------
const LEAK_LIFE_MS = 5000;    // a card lives — and leaks — for 5 seconds
const LEAK_CHARGE = 110;      // particles released over that lifetime

let containers = [];          // element cards sitting on (and leaking into) the world
let dragging = null;          // { material, clientX, clientY } on the pointer
let nextContainerId = 1;
// While dragging over the canvas we keep a ghost of the nearest card we could
// merge with, so the combine target is always obvious.
let hoverTarget = null;

function computeGridDims() {
  const rect = canvasWrap.getBoundingClientRect();
  const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(rect.width / TARGET_CELL_PX)));
  const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round(rect.height / TARGET_CELL_PX)));
  return { cols, rows };
}

const { cols, rows } = computeGridDims();
const simulation = new Simulation(cols, rows);
const renderer   = new Renderer(canvas, cols, rows);
const actors     = new ActorLayer(35);

function resizeCanvasToDisplay() {
  const rect = canvasWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width  = rect.width  + "px";
  canvas.style.height = rect.height + "px";
  renderer.displayCtx.imageSmoothingEnabled = false;
}
resizeCanvasToDisplay();
window.addEventListener("resize", resizeCanvasToDisplay);

const discovery = new DiscoveryTracker((outputId, idA, idB, gainedTool, priority) => {
  if (outputId != null) {
    const def = MATERIALS[outputId];
    const name = def ? (outputId === SAND ? "EARTH" : def.name) : "UNKNOWN";
    showToast(name, idA, idB, gainedTool, priority);
    // Discovering a paintable material rebuilds the toolbar so the new tool
    // appears — the core "discovery unlocks a tool" moment.
    if (gainedTool) {
      buildMaterialButtons();
      // Auto-select the brand-new element so it is ready to draw or drag
      // immediately — the Infinite-Craft "here's your new item" feeling.
      selectedMaterial = outputId;
      eraseMode = false;
      spawnKind = null;
      airMode = false;
    }
  } else {
    showEventToast("NEW DISCOVERY");
  }
  refreshDiscoveriesPanel();
  syncDiscoveryCounter();
  syncToolbarActiveStates();
});

simulation.onReaction = (a, b, out, recipe) => {
  if (out && out !== EMPTY) {
    const priority = recipe ? recipe.priority : undefined;
    discovery.record(a, b, out, priority);
  }
};

// Volatile reactions startle (and singe) nearby humans, and register as a
// discovered event so Explorer mode can acknowledge the surprise afterwards.
simulation.onBlast = (cx, cy, radius) => {
  actors.startle(cx, cy, radius + 10, true);
  discovery.recordEvent("blast", "VOLATILE BLAST");
};

// Actor-layer special events (digital cloning, angelic cleansing, etc.).
actors.onEvent = (key, label) => {
  discovery.recordEvent(key, label);
};

function syncDiscoveryCounter() {
  btnDiscoveries.textContent = `DISCOVERIES ${discovery.unlockedCount()}/${discovery.totalDiscoverable()}`;
}
syncDiscoveryCounter();

function showToast(outputName, idA, idB, gainedTool, priority) {
  const aDef = MATERIALS[idA];
  const bDef = MATERIALS[idB];
  const aName = (aDef && (idA === SAND ? "EARTH" : aDef.name)) || "?";
  const bName = (bDef && (idB === SAND ? "EARTH" : bDef.name)) || "?";
  const aCol = aDef ? `rgb(${aDef.color.join(",")})` : "#888";
  const bCol = bDef ? `rgb(${bDef.color.join(",")})` : "#888";
  const outId  = Object.values(MATERIALS).find(m => m && m.name === outputName)?.id;
  const outDefR = outId != null ? MATERIALS[outId] : null;
  const outCol = outDefR ? `rgb(${outDefR.color.join(",")})` : "#00e5ff";

  let titleHtml;
  if (priority === "secret") {
    titleHtml = `<div class="combine-title combine-title--secret">✦ SECRET FOUND</div>`;
  } else if (priority === "rare") {
    titleHtml = `<div class="combine-title combine-title--rare">◈ RARE DISCOVERY</div>`;
  } else {
    titleHtml = `<div class="combine-title">NEW DISCOVERY</div>`;
  }

  // Infinite-Craft style: the two ingredients sit side by side, an arrow shows
  // they combine, and the result lands underneath as a new card.
  toastEl.innerHTML =
    titleHtml +
    `<div class="combine-row">` +
      `<span class="combine-chip" style="border-color:${aCol};color:${aCol}">${aName}</span>` +
      `<span class="combine-plus">+</span>` +
      `<span class="combine-chip" style="border-color:${bCol};color:${bCol}">${bName}</span>` +
    `</div>` +
    `<div class="combine-arrow">↓</div>` +
    `<div class="combine-result" style="border-color:${outCol};color:${outCol}">${outputName}</div>` +
    (gainedTool ? `<div class="toast-reward">✦ NEW ELEMENT UNLOCKED</div>` : "");

  toastEl.classList.remove("show");
  // Force a reflow so the animation replays for each discovery.
  void toastEl.offsetWidth;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 3600);
}

function showEventToast(title, subtitle) {
  toastEl.innerHTML =
    `<div class="toast-title">${title}</div>` +
    (subtitle ? `<div class="toast-output">${subtitle}</div>` : "");
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

function refreshDiscoveriesPanel() {
  discoveriesGrid.innerHTML = "";
  for (const [idStr, def] of Object.entries(MATERIALS)) {
    const id = Number(idStr);
    const known = discovery.has(id);
    const cell = document.createElement("div");
    cell.className = "discovery-cell" + (known ? " known" : " unknown");

    if (known) {
      const recipeInfo = discovery.recipes.get(id);
      let recipeHtml = "";
      let priorityBadge = "";
      if (recipeInfo) {
        const [rA, rB] = recipeInfo.recipe;
        const nameA = (MATERIALS[rA] && MATERIALS[rA].name) || "?";
        const nameB = (MATERIALS[rB] && MATERIALS[rB].name) || "?";
        recipeHtml = `<div class="dc-recipe">${nameA} + ${nameB}</div>`;
        if (recipeInfo.priority === "secret") {
          priorityBadge = `<div class="dc-badge dc-badge--secret">SECRET</div>`;
        } else if (recipeInfo.priority === "rare") {
          priorityBadge = `<div class="dc-badge dc-badge--rare">RARE</div>`;
        }
      }
      cell.innerHTML =
        `<div class="dc-name">${def.name}</div>` +
        `<div class="dc-cat">${def.category}</div>` +
        recipeHtml +
        priorityBadge;
      cell.style.borderColor = `rgb(${def.color.join(",")})`;
    } else {
      cell.innerHTML =
        `<div class="dc-name">???</div>` +
        `<div class="dc-cat">undiscovered</div>`;
    }
    discoveriesGrid.appendChild(cell);
  }

  // Special (non-material) discoveries, e.g. the oil blast.
  for (const [, label] of discovery.events) {
    const cell = document.createElement("div");
    cell.className = "discovery-cell known event";
    cell.innerHTML =
      `<div class="dc-name">${label}</div>` +
      `<div class="dc-cat">event</div>`;
    discoveriesGrid.appendChild(cell);
  }
}

btnDiscoveries.addEventListener("click", () => {
  refreshDiscoveriesPanel();
  discoveriesPanel.classList.add("open");
});
btnCloseDiscoveries.addEventListener("click", () => {
  discoveriesPanel.classList.remove("open");
});

function buildMaterialButtons() {
  materialGroups.innerHTML = "";

  // Normal mode:
  // use the carefully designed TOOL_GROUPS and discovery progression.
  //
  // Test mode:
  // expose every material defined in MATERIALS immediately.
  //
  // CODE and VOID are excluded here because they already have their own
  // dedicated toolbar buttons below the material groups.
  const groups = TEST_MODE_ALL_MATERIALS
    ? [
        {
          label: "ALL MATERIALS — TEST",
          ids: Object.keys(MATERIALS)
            .map(Number)
            .filter((id) => id !== EMPTY && id !== CODE && id !== VOID),
        },
      ]
    : TOOL_GROUPS;

  groups.forEach((group) => {

    // Every tool in the group stays visible so the player always knows what
    // exists. Locked ones render dimmed and, when tapped, hint how to earn
    // them instead of silently doing nothing.
    const visible = group.ids.filter((id) => MATERIALS[id]);

    if (visible.length === 0) return;

    const wrap = document.createElement("div");
    wrap.className = "material-group";

    const label = document.createElement("div");
    label.className = "material-group-label";
    label.textContent = group.label;

    wrap.appendChild(label);

    const strip = document.createElement("div");
    strip.className = "material-strip";

    visible.forEach((id) => {
      const def = MATERIALS[id];
      if (!def) return;

      const unlocked =
        TEST_MODE_ALL_MATERIALS || discovery.isToolUnlocked(id);

      const btn = document.createElement("button");

      btn.type = "button";
      btn.className = "tool-btn material-btn";
      btn.dataset.materialId = String(id);
      btn.textContent = id === SAND ? "EARTH" : def.name;
      btn.style.setProperty(
        "--mat-color",
        `rgb(${def.color.join(",")})`
      );

      if (!unlocked) {
        // Locked: dim it, show a small padlock, and turn a tap into a hint.
        btn.classList.add("locked");
        btn.setAttribute("aria-disabled", "true");
        const tag = document.createElement("span");
        tag.className = "lock-tag";
        tag.textContent = "\u2298";
        btn.appendChild(tag);

        btn.addEventListener("click", () => {
          if (currentMode === "explore") {
            const combo = discovery.hintFor(id);
            setMode("sandbox");
            if (combo) selectMaterial(combo[0]);
            showLockedHint(btn.textContent, combo);
          } else {
            const combo = discovery.hintFor(id);
            showLockedHint(btn.textContent, combo);
          }
        });

        strip.appendChild(btn);
        return;
      }

      // Unlocked: tap = select material for normal painting.
      btn.addEventListener("click", () => {
        if (currentMode === "explore") {
          setMode("sandbox");
        }

        selectedMaterial = id;
        eraseMode = false;
        spawnKind = null;
        airMode = false;

        syncToolbarActiveStates();
      });

      // Press + drag = create a material container.
      attachDragSource(btn, id);

      strip.appendChild(btn);
    });

    wrap.appendChild(strip);
    materialGroups.appendChild(wrap);
  });
}

// Living things & cosmic entities. These are always available so the player can
// place them directly at any time — they're part of the toy, not a reward.
const ENTITY_BUTTONS = [
  { el: btnHuman,     kind: "human" },
  { el: btnFish,      kind: "fish" },
  { el: btnBird,      kind: "bird" },
  { el: btnAngel,     kind: "angel" },
  { el: btnDevil,     kind: "devil" },
  { el: btnBlackHole, kind: "blackhole" },
];

function revealEntityButtons() {
  for (const b of ENTITY_BUTTONS) {
    if (b.el) b.el.hidden = false;
  }
}

function syncToolbarActiveStates() {
  materialGroups.querySelectorAll(".material-btn").forEach((btn) => {
    const isActive = !eraseMode && !spawnKind && !airMode &&
      Number(btn.dataset.materialId) === selectedMaterial;
    btn.classList.toggle("active", isActive);
  });
  const plainSelect = !eraseMode && !spawnKind && !airMode;
  btnAir.classList.toggle("active", airMode);
  btnErase.classList.toggle("active", eraseMode);
  btnCode.classList.toggle("active", plainSelect && selectedMaterial === CODE);
  btnVoid.classList.toggle("active", plainSelect && selectedMaterial === VOID);
  btnHuman.classList.toggle("active", spawnKind === "human");
  btnFish.classList.toggle("active", spawnKind === "fish");
  btnBird.classList.toggle("active", spawnKind === "bird");
  btnAngel.classList.toggle("active", spawnKind === "angel");
  btnDevil.classList.toggle("active", spawnKind === "devil");
  btnBlackHole.classList.toggle("active", spawnKind === "blackhole");
  brushLabel.textContent = String(brushRadius);
}

function toggleEntity(kind) {
  if (currentMode === "explore") setMode("sandbox");
  spawnKind = spawnKind === kind ? null : kind;
  if (spawnKind) { eraseMode = false; airMode = false; }
  syncToolbarActiveStates();
}

btnAir.addEventListener("click", () => {
  if (currentMode === "explore") setMode("sandbox");
  airMode = !airMode;
  if (airMode) { eraseMode = false; spawnKind = null; }
  // A second tap on AIR flips the current direction, so one button can push
  // either way without adding a whole extra control.
  else { airDir = -airDir; }
  syncToolbarActiveStates();
});

// CODE and VOID are placeable directly, just like any other element: tap to
// select and paint, or press-and-drag to drop a leaking container of them.
btnCode.addEventListener("click", () => {
  if (currentMode === "explore") setMode("sandbox");
  selectedMaterial = CODE;
  eraseMode = false; spawnKind = null; airMode = false;
  syncToolbarActiveStates();
});
btnVoid.addEventListener("click", () => {
  if (currentMode === "explore") setMode("sandbox");
  selectedMaterial = VOID;
  eraseMode = false; spawnKind = null; airMode = false;
  syncToolbarActiveStates();
});

btnErase.addEventListener("click", () => {
  if (currentMode === "explore") setMode("sandbox");
  eraseMode = !eraseMode;
  if (eraseMode) { spawnKind = null; airMode = false; }
  syncToolbarActiveStates();
});

btnHuman.addEventListener("click", () => toggleEntity("human"));
btnFish.addEventListener("click", () => toggleEntity("fish"));
btnBird.addEventListener("click", () => toggleEntity("bird"));
btnAngel.addEventListener("click", () => toggleEntity("angel"));
btnDevil.addEventListener("click", () => toggleEntity("devil"));
btnBlackHole.addEventListener("click", () => toggleEntity("blackhole"));

btnBrushDown.addEventListener("click", () => {
  brushRadius = Math.max(BRUSH_MIN, brushRadius - 1);
  syncToolbarActiveStates();
});
btnBrushUp.addEventListener("click", () => {
  brushRadius = Math.min(BRUSH_MAX, brushRadius + 1);
  syncToolbarActiveStates();
});

btnReset.addEventListener("click", () => {
  simulation.clear();
  actors.clear();
  matrixRain = false;
});

/** Sprinkles a few fresh code streams from the top of the world. */
function seedCodeRain() {
  const { cols } = simulation;
  for (let n = 0; n < 3; n++) {
    const x = 2 + Math.floor(Math.random() * (cols - 4));
    const len = 4 + Math.floor(Math.random() * 8);
    for (let y = 0; y < len; y++) {
      if (simulation.get(x, y) === EMPTY) simulation.set(x, y, CODE);
    }
  }
}

function buildPresetButtons() {
  presetRow.innerHTML = "";
  PRESETS.forEach((preset) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-btn preset-btn";
    btn.textContent = preset.label;
    btn.addEventListener("click", () => {
      simulation.clear();
      actors.clear();
      preset.generate(simulation, actors);
      matrixRain = preset.id === "matrix";
      closePresetPanel();
    });
    presetRow.appendChild(btn);
  });
}
function openPresetPanel()  { presetPanel.classList.add("open"); }
function closePresetPanel() { presetPanel.classList.remove("open"); }

btnPresetsTab.addEventListener("click", () => {
  if (presetPanel.classList.contains("open")) {
    closePresetPanel();
  } else {
    openPresetPanel();
  }
});
btnSandboxTab.addEventListener("click", () => { closePresetPanel(); setMode("sandbox"); });
btnExploreTab.addEventListener("click", () => {
  closePresetPanel();
  setMode(currentMode === "explore" ? "sandbox" : "explore");
});
btnClosePresets.addEventListener("click", closePresetPanel);

const inspect = new InspectController(canvas, simulation, actors, tooltipEl, discovery);

function setMode(mode) {
  currentMode = mode;
  btnSandboxTab.classList.toggle("active", mode === "sandbox");
  btnExploreTab.classList.toggle("active", mode === "explore");
  if (mode === "explore") {
    inspect.enable();
    canvas.style.cursor = "crosshair";
  } else {
    inspect.disable();
    canvas.style.cursor = "";
  }
}

btnPause.addEventListener("click", () => {
  paused = !paused;
  btnPause.textContent = paused ? "PLAY" : "PAUSE";
  btnStep.disabled = !paused;
});
btnStep.addEventListener("click", () => {
  if (paused) {
    try {
      simulation.step();
      actors.update(simulation);
    } catch (e) {
      console.error(e);
    }
  }
});

// ---------------------------------------------------------------------------
//  Auto-hiding UI
//  The world is the main character. After 10s of no interaction the controls
//  slide away — but only the CONTROLS. The simulation keeps running, and any
//  touch, click or pointer move brings the toolbar straight back.
// ---------------------------------------------------------------------------
const UI_HIDE_DELAY = 10000; // ms of idle before the controls tuck away
let uiHideTimer = null;

function uiIsBlockedFromHiding() {
  // Never hide while something the player is actively reading is open, nor
  // while they're mid-drag or paused to study the world.
  const panelOpen = presetPanel.classList.contains("open") ||
                    discoveriesPanel.classList.contains("open");
  const dragging = typeof input !== "undefined" && input.painting;
  return panelOpen || paused || dragging || toastEl.classList.contains("show");
}

function hideUI() {
  if (uiIsBlockedFromHiding()) { scheduleUIHide(); return; }
  toolbar.classList.add("toolbar--hidden");
  uiReveal.classList.add("ui-reveal--visible");
}

function showUI() {
  toolbar.classList.remove("toolbar--hidden");
  uiReveal.classList.remove("ui-reveal--visible");
  scheduleUIHide();
}

function scheduleUIHide() {
  clearTimeout(uiHideTimer);
  uiHideTimer = setTimeout(hideUI, UI_HIDE_DELAY);
}

// Any interaction anywhere resets the idle timer and reveals the controls.
for (const evt of ["pointerdown", "pointermove", "keydown", "wheel"]) {
  window.addEventListener(evt, showUI, { passive: true });
}
uiReveal.addEventListener("click", (e) => { e.stopPropagation(); showUI(); });
scheduleUIHide();

// The drag/combine tip. It stays until dismissed, then never returns — so it
// teaches the core interaction once without nagging.
if (btnHintClose) {
  btnHintClose.addEventListener("click", (e) => {
    e.stopPropagation();
    dragHint.classList.add("drag-hint--dismissed");
    try { localStorage.setItem("sandbox_hint_dismissed", "1"); } catch (_) { /* ignore */ }
  });
  try {
    if (localStorage.getItem("sandbox_hint_dismissed") === "1") {
      dragHint.classList.add("drag-hint--dismissed");
    }
  } catch (_) { /* ignore */ }
}

const input = new InputController(canvas, simulation, {
  getMaterial:    () => selectedMaterial,
  getEraseMode:   () => eraseMode,
  getBrushRadius: () => brushRadius,
  getHumanMode:   () => !!spawnKind,
  getSpawnKind:   () => spawnKind,
  getAirMode:     () => airMode,
  getAirDir:      () => airDir,
  isInspectMode:  () => currentMode === "explore",
  isPaintBlocked: () => currentMode === "explore" || paused,
  onHumanPaint:   (x, y, kind) => { actors.spawnKind(kind || spawnKind || "human", x, y); },
  onAirPaint:     (x, y) => { simulation.paintAir(x, y, Math.max(4, brushRadius * 3), airDir); },
  onInspect:      (e) => { inspect.handlePointer(e); },
  onCarryMove:    (clientX, clientY) => { carryMoveTo(clientX, clientY); },
  onCarryRelease: () => { dropCarry(); },
});

// ---------------------------------------------------------------------------
//  DRAG SOURCES — press an element and move to carry a container of it.
//  A simple tap (press + release without moving) just SELECTS the element,
//  so it never leaves a stray container sitting on the world.
// ---------------------------------------------------------------------------
const DRAG_THRESHOLD_PX = 8;   // how far you must move before a drag begins

function attachDragSource(el, materialId) {
  el.addEventListener("pointerdown", (e) => {
    // Never start a drag with a secondary button / right-click.
    if (e.button === 2) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let armed = true;   // still waiting to see if this becomes a drag

    const onMove = (ev) => {
      if (!armed) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      // The pointer has travelled far enough — this is a real drag.
      armed = false;
      detach();
      beginCarryFrom(ev, materialId);
    };

    const onUp = () => {
      // Released without moving: it was a tap, not a drag. Do nothing here —
      // the element's own click handler takes care of selecting it.
      armed = false;
      detach();
    };

    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
}

function beginCarryFrom(e, materialId) {
  if (e && e.preventDefault) e.preventDefault();
  dragging = {
    material: materialId,
    clientX: e.clientX,
    clientY: e.clientY,
  };
  if (input) input.beginCarry();
  showUI();
}

/** Convert a client point to a world cell (may be outside the canvas). */
function clientToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(((clientX - rect.left) / rect.width) * simulation.cols),
    y: Math.floor(((clientY - rect.top) / rect.height) * simulation.rows),
    inside: clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom,
  };
}

function carryMoveTo(clientX, clientY) {
  if (!dragging) return;
  dragging.clientX = clientX;
  dragging.clientY = clientY;
}

/**
 * Drops the carried element as a card at the pointer. If it lands on top of an
 * existing card, the two COMBINE into whatever they form — the Infinite-Craft
 * moment, played out on the canvas.
 */
function dropCarry() {
  if (!dragging) return;
  const { material, clientX, clientY } = dragging;
  dragging = null;
  hoverTarget = null;
  if (input) { input.carrying = false; input.painting = false; }

  const c = clientToCell(clientX, clientY);
  if (!c.inside) return; // dropped off-world — nothing happens

  // Did we land on another card? Then merge them.
  const target = containerAt(c.x, c.y);
  if (target) {
    combineContainers(target, material);
    return;
  }

  // Otherwise a fresh card is placed. It stays exactly where you left it,
  // leaks its material for 5 seconds, then disappears — but for those 5
  // seconds another card can be dropped on it to combine.
  containers.push({
    id: nextContainerId++,
    material,
    x: c.x,
    y: c.y,
    bornAt: performance.now(),
    charge: LEAK_CHARGE,   // every card leaks its contents
    leakAcc: 0,
    combo: 0,
  });
}

/** Finds a card near a world cell (cards are a few cells wide). */
function containerAt(cellX, cellY, radius = 4) {
  for (let i = containers.length - 1; i >= 0; i--) {
    const k = containers[i];
    if (Math.abs(k.x - cellX) <= radius && Math.abs(k.y - cellY) <= radius) return k;
  }
  return null;
}

/**
 * Merges `incoming` material onto an existing card.
 *
 *  - EARTH + WATER is special-cased to MUD (the intuitive answer for a
 *    deliberate craft; the in-world physics still matures wet earth to soil).
 *  - Otherwise the reaction table decides. If it has no recipe, the card is
 *    simply consumed without inventing anything.
 *
 * A successful merge turns the card into the RESULT, which then pours its
 * material into the world (that is the payoff) and unlocks the result as a
 * new toolbar element.
 */
function combineContainers(target, incomingMaterial) {
  const a = target.material, b = incomingMaterial;

  // Work out the product of this pair.
  let resultId = null;
  if ((a === SAND && b === WATER) || (a === WATER && b === SAND)) {
    resultId = MUD;
  } else {
    const res = findReaction(a, b);
    if (res) resultId = res.outputA !== EMPTY ? res.outputA : res.outputB;
  }

  if (resultId == null || resultId === EMPTY) {
    // No recipe — the incoming element is simply absorbed into the card, which
    // keeps what is already there and refreshes its 5 seconds so it lingers
    // for another attempt.
    target.bornAt = performance.now();
    target.charge = Math.max(target.charge, LEAK_CHARGE * 0.5);
    target.combo = 20;
    return;
  }

  // The card BECOMES the result, and NOW it starts leaking its material.
  target.material = resultId;
  target.charge = LEAK_CHARGE;
  target.leakAcc = 0;
  target.bornAt = performance.now();
  target.combo = 30;

  // Every successful combine is a discovery: it unlocks the result as a new
  // element and fires the combine card.
  discovery.record(a, b, resultId);
}

/**
 * Advances every card. Each card lives for exactly LEAK_LIFE_MS (5 seconds):
 * it pours its material into the world the whole time, then disappears. If a
 * second card is dropped on it before then, the two combine.
 */
function updateContainers(dt) {
  const now = performance.now();
  for (let i = containers.length - 1; i >= 0; i--) {
    const k = containers[i];
    const age = now - k.bornAt;
    if (k.combo > 0) k.combo--;

    // Leak at a steady rate across the card's life.
    const rate = LEAK_CHARGE / LEAK_LIFE_MS; // particles per ms
    k.leakAcc += rate * dt;
    while (k.leakAcc >= 1 && k.charge > 0) {
      k.leakAcc -= 1;
      const px = k.x + ((Math.random() * 5) | 0) - 2;
      const py = k.y + ((Math.random() * 5) | 0) - 2;
      if (simulation.inBounds(px, py)) {
        simulation.set(px, py, k.material);
        k.charge--;
      }
    }

    // Every card disappears after its 5 seconds — or once it has emptied out.
    if (age >= LEAK_LIFE_MS || k.charge <= 0) containers.splice(i, 1);
  }
}

// The drag starts on a toolbar button, so the canvas never sees the pointerdown.
window.addEventListener("pointermove", (e) => {
  if (dragging) {
    carryMoveTo(e.clientX, e.clientY);
    // Highlight the card we would merge with, if any.
    const c = clientToCell(e.clientX, e.clientY);
    hoverTarget = c.inside ? containerAt(c.x, c.y) : null;
  }
}, { passive: true });
window.addEventListener("pointerup", () => { if (dragging) dropCarry(); });
window.addEventListener("pointercancel", () => { if (dragging) dropCarry(); });

buildMaterialButtons();
buildPresetButtons();
revealEntityButtons();
syncToolbarActiveStates();

// Start with a BARE world — just a thin floor of earth. Everything else is
// the player's to discover.
for (let x = 0; x < simulation.cols; x++) {
  const groundY = Math.floor(simulation.rows * 0.82);
  for (let y = groundY; y < simulation.rows; y++) simulation.set(x, y, SAND);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let lastTime = performance.now();
let acc = 0;
const STEP_MS = 1000 / 30;
const MAX_TICKS_PER_FRAME = 3;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = now - lastTime;
  lastTime = now;

  if (!paused) {
    acc += dt;
    if (acc > 250) acc = 250;

    let ticks = 0;
    while (acc >= STEP_MS && ticks < MAX_TICKS_PER_FRAME) {
      try {
        simulation.step();
        actors.update(simulation);
      } catch (err) {
        console.error("tick error:", err);
        acc = 0;
        break;
      }
      acc -= STEP_MS;
      ticks++;
    }
    if (ticks >= MAX_TICKS_PER_FRAME && acc > STEP_MS * 4) acc = STEP_MS * 4;

    // Keep the MATRIX world raining while it is the active scene.
    if (matrixRain && Math.random() < 0.35) seedCodeRain();
  }

  // Containers leak and expire on real time, independent of pause state, so a
  // dropped element always plays out its 5 seconds.
  updateContainers(dt);

  try {
    renderer.draw(simulation);
    actors.draw(renderer.displayCtx, canvas, simulation.cols, simulation.rows);
    drawContainers();
  } catch (err) {
    console.error("render error:", err);
  }
}
requestAnimationFrame(loop);

/**
 * Draws every dropped container: a stationary lump of its element with a
 * floating label above it (like a crafting card), a ring showing how much life
 * it has left, and a flash when it has just been combined. Also draws the
 * ghost of whatever is currently being dragged.
 */
function drawContainers() {
  const ctx = renderer.displayCtx;
  const sx = canvas.width / simulation.cols;
  const sy = canvas.height / simulation.rows;
  const now = performance.now();

  const drawOne = (cellX, cellY, material, fracLife, combo, alpha) => {
    const cx = cellX * sx + sx * 0.5;
    const cy = cellY * sy + sy * 0.5;
    const def = MATERIALS[material];
    const col = def ? `rgb(${def.color.join(",")})` : "#ffffff";
    const radius = sx * (2.0 + fracLife * 2.2);

    ctx.save();
    ctx.globalAlpha = alpha;

    // A loose cluster of cells so it reads as a lump of matter.
    const puffs = 12 + Math.round(fracLife * 12);
    for (let i = 0; i < puffs; i++) {
      const a = (i / puffs) * Math.PI * 2;
      const rr = radius * (0.45 + Math.random() * 0.6);
      ctx.fillStyle = col;
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillRect(
        Math.round(cx + Math.cos(a) * rr),
        Math.round(cy + Math.sin(a) * rr),
        Math.max(1, Math.round(sx)),
        Math.max(1, Math.round(sy))
      );
    }

    // Life ring: shrinks as the card's 5 seconds run out, so you can see at a
    // glance how long you have to drop something onto it.
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = combo > 0 ? "#ffffff" : col;
    ctx.lineWidth = Math.max(1, sx * 0.4);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fracLife);
    ctx.stroke();

    // COMBINE POP — a bright ring bursts outward for a moment after a merge,
    // so combining two elements feels like a real event.
    if (combo > 0) {
      const t = 1 - combo / 30;             // 0 -> 1 across the flash
      const popR = radius + t * sx * 9;
      ctx.globalAlpha = alpha * (1 - t) * 0.9;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1.5, sx * (0.9 - t * 0.6));
      ctx.beginPath();
      ctx.arc(cx, cy, popR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label chip above the container, so you can see what it is.
    const name = def ? (material === SAND ? "EARTH" : def.name) : "?";
    ctx.globalAlpha = alpha;
    const fontSize = Math.max(9, Math.round(sy * 1.5));
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    const textW = ctx.measureText(name).width;
    const padX = fontSize * 0.5;
    const boxW = textW + padX * 2;
    const boxH = fontSize * 1.5;
    const bx = cx - boxW / 2;
    const by = cy - radius - boxH - sy * 1.6;

    ctx.fillStyle = "rgba(14, 17, 23, 0.92)";
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = combo > 0 ? "#ffffff" : col;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, cx, by + boxH / 2);

    ctx.restore();
  };

  // Cards sitting on (and leaking into) the world.
  for (const k of containers) {
    const age = now - k.bornAt;
    // Every card counts down its 5 seconds; the ring fills the gap.
    const fracLife = Math.max(0, 1 - age / LEAK_LIFE_MS);
    const alpha = fracLife < 0.2 ? fracLife / 0.2 : 1;
    drawOne(k.x, k.y, k.material, fracLife, k.combo, alpha);
  }

  // The one being dragged, following the pointer.
  if (dragging) {
    const c = clientToCell(dragging.clientX, dragging.clientY);
    drawOne(c.x, c.y, dragging.material, 1, 0, c.inside ? 0.9 : 0.5);

    // If we are hovering a card that would merge, ring it brightly so the
    // combine target is unmistakable.
    if (hoverTarget) {
      const tx = hoverTarget.x * sx + sx * 0.5;
      const ty = hoverTarget.y * sy + sy * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, sx * 0.6);
      ctx.beginPath();
      ctx.arc(tx, ty, sx * 9, 0, Math.PI * 2);
      ctx.stroke();
      // A little "+" hint in the middle of the pair.
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.max(10, Math.round(sy * 2))}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", tx, ty);
      ctx.restore();
    }
  }
}