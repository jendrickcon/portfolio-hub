/**
 * SANDBOX — Input Controller
 *
 * Unifies mouse, touch, and stylus interactions via Pointer Events.
 * Dispatches drawing or inspecting without unwanted page scroll/zoom.
 */

export class InputController {
  constructor(canvas, simulation, options) {
    this.canvas = canvas;
    this.simulation = simulation;
    this.options = options;
    this.painting = false;
    this.dragMoved = false;
    // True while the player is carrying a dragged element over the world. In
    // this state the canvas releases the carried material instead of drawing.
    this.carrying = false;

    canvas.addEventListener("pointerdown", this._onPointerDown.bind(this));
    canvas.addEventListener("pointermove", this._onPointerMove.bind(this));
    window.addEventListener("pointerup", this._onPointerUp.bind(this));
    canvas.addEventListener("pointercancel", this._onPointerUp.bind(this));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /** Called by the app when a dragged element enters the canvas. */
  beginCarry() {
    this.carrying = true;
    this.painting = true;
  }

  /** The last cell the pointer touched, or null. Used by the carry renderer. */
  cellFromClient(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    return {
      x: Math.floor(relX * this.simulation.cols),
      y: Math.floor(relY * this.simulation.rows),
    };
  }

  _cellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const x = Math.floor(relX * this.simulation.cols);
    const y = Math.floor(relY * this.simulation.rows);
    return { x, y };
  }

  _paintAt(e) {
    if (this.options.isPaintBlocked && this.options.isPaintBlocked()) return;

    const { x, y } = this._cellFromEvent(e);
    if (!this.simulation.inBounds(x, y)) return;

    const erase = this.options.getEraseMode() || e.button === 2;
    const materialId = erase ? 0 : this.options.getMaterial();
    this.simulation.placeBrush(x, y, materialId, this.options.getBrushRadius());
  }

  _spawnHumanAt(e) {
    if (this.options.isPaintBlocked && this.options.isPaintBlocked()) return;
    const { x, y } = this._cellFromEvent(e);
    if (!this.simulation.inBounds(x, y)) return;
    const kind = this.options.getSpawnKind ? this.options.getSpawnKind() : "human";
    if (this.options.onHumanPaint) this.options.onHumanPaint(x, y, kind);
  }

  _airAt(e) {
    if (this.options.isPaintBlocked && this.options.isPaintBlocked()) return;
    const { x, y } = this._cellFromEvent(e);
    if (!this.simulation.inBounds(x, y)) return;
    if (this.options.onAirPaint) this.options.onAirPaint(x, y);
  }

  _onPointerDown(e) {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.painting = true;
    this.dragMoved = false;

    // Explore / Inspect mode touch handling
    if (this.options.isInspectMode && this.options.isInspectMode()) {
      if (this.options.onInspect) this.options.onInspect(e);
      return;
    }

    // AIR is a force — it pushes, it does not place anything.
    if (this.options.getAirMode && this.options.getAirMode()) {
      this._airAt(e);
      return;
    }

    // Entities spawn one per tap
    if (this.options.getHumanMode && this.options.getHumanMode()) {
      this._spawnHumanAt(e);
      return;
    }

    this._paintAt(e);
  }

  _onPointerMove(e) {
    // If in inspect mode, track pointer move even without pointerdown (desktop hover)
    if (this.options.isInspectMode && this.options.isInspectMode()) {
      if (this.options.onInspect) this.options.onInspect(e);
      return;
    }

    // Carrying a dragged element: it leaks as it travels across the world.
    if (this.carrying) {
      e.preventDefault();
      this.dragMoved = true;
      if (this.options.onCarryMove) this.options.onCarryMove(e.clientX, e.clientY);
      return;
    }

    if (!this.painting) return;
    e.preventDefault();
    this.dragMoved = true;

    // Air keeps pushing while you drag across the sky.
    if (this.options.getAirMode && this.options.getAirMode()) {
      this._airAt(e);
      return;
    }

    // Don't flood entities while dragging
    if (this.options.getHumanMode && this.options.getHumanMode()) return;

    this._paintAt(e);
  }

  _onPointerUp() {
    if (this.carrying) {
      // The carried blob is released — the app dumps whatever charge is left.
      this.carrying = false;
      if (this.options.onCarryRelease) this.options.onCarryRelease();
    }
    this.painting = false;
  }
}