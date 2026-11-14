/**
 * PROJECT BLUEPRINT // SVG Camera & Coordinate Transformer
 * Manages viewBox dimensions, viewport centering, and dynamic multi-device bounds fitting.
 */

export class GraphCamera {
  constructor(svgElement) {
    this.svg = svgElement;
    this.width = 1200;
    this.height = 800;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Stage 7 interactive canvas state
    this.isStage7Canvas = false;
    this.minZoom = 0.25;
    this.maxZoom = 2.0;
    this.contentBounds = null;

    // Pointer & Gesture Tracking
    this.activePointers = new Map();
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.touchStartDist = 0;
    this.touchStartZoom = 1;
    this.touchStartCenter = { x: 0, y: 0 };
    this.dragDistance = 0;
    this.isDragging = false;
    this._hudElement = null;

    // Bound listeners for clean cleanup
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onWheel = this._handleWheel.bind(this);
  }

  init() {
    this.updateDimensions();
    window.addEventListener("resize", () => this.updateDimensions());
  }

  updateDimensions() {
    if (!this.svg) return;
    const isMobile = window.innerWidth <= 768;
    const parentEl = this.svg.parentElement;
    const availableW = parentEl ? parentEl.clientWidth : window.innerWidth;

    this.width = Math.max(320, isMobile ? availableW : (this.svg.getBoundingClientRect().width || window.innerWidth));
    this.height = isMobile ? Math.max(600, window.innerHeight - 54) : Math.max(480, this.svg.getBoundingClientRect().height || (window.innerHeight - 54));

    if (!isMobile || this.isStage7Canvas) {
      this.svg.style.height = "100%";
      this.svg.style.minHeight = "auto";
    }

    this.applyViewBox();
  }

  applyViewBox() {
    if (!this.svg) return;
    const vx = Math.round(this.offsetX);
    const vy = Math.round(this.offsetY);
    const vw = Math.round(this.width / this.zoom);
    const vh = Math.round(this.height / this.zoom);

    this.svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
    this.updateHudZoom();
    this.updateLOD();
  }

  /**
   * Adjusts the camera viewBox to frame content bounds.
   * In Stage 7 canvas mode, frames content smoothly via zoom on both mobile and desktop.
   * In Stages 1-6 on mobile, expands SVG height for natural vertical page scroll.
   * @param {{ width: number, height: number, x?: number, y?: number }} bounds 
   * @param {number} padding 
   */
  fitBounds(bounds, padding = 40) {
    if (!this.svg || !bounds) return;
    this.contentBounds = bounds;

    const isMobile = window.innerWidth <= 768;

    // Stage 7: Full interactive canvas on both desktop and mobile
    if (this.isStage7Canvas) {
      this.svg.style.width = "100%";
      this.svg.style.height = "100%";
      this.svg.style.minHeight = "auto";

      const minX = bounds.x !== undefined ? bounds.x : 0;
      const minY = bounds.y !== undefined ? bounds.y : 0;
      const targetW = bounds.width + padding * 2;
      const targetH = bounds.height + padding * 2;

      const scaleX = this.width / targetW;
      const scaleY = this.height / targetH;
      const fitScale = Math.min(scaleX, scaleY);

      this.zoom = Math.min(1.1, Math.max(this.minZoom, fitScale));
      this.offsetX = minX - (this.width / this.zoom - bounds.width) / 2;
      this.offsetY = Math.max(0, minY - padding);

      this.applyViewBox();
      return;
    }

    if (isMobile) {
      // Stages 1-6 Mobile: Natural vertical growth stack
      const parentEl = this.svg.parentElement;
      const availableW = parentEl ? parentEl.clientWidth : window.innerWidth;
      const mobileW = Math.max(320, availableW);
      const mobileH = Math.max(window.innerHeight - 54, bounds.height + padding);

      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.width = mobileW;
      this.height = mobileH;

      this.svg.style.width = "100%";
      this.svg.style.height = `${mobileH}px`;
      this.svg.style.minHeight = `${mobileH}px`;
      this.svg.setAttribute("viewBox", `0 0 ${mobileW} ${mobileH}`);
      return;
    }

    // Stages 1-6 Desktop
    this.svg.style.height = "100%";
    this.svg.style.minHeight = "auto";

    const minX = bounds.x !== undefined ? bounds.x : 0;
    const minY = bounds.y !== undefined ? bounds.y : 0;
    const targetW = bounds.width + padding * 2;
    const targetH = bounds.height + padding * 2;

    const scaleX = this.width / targetW;
    const scaleY = this.height / targetH;
    const fitScale = Math.min(1.1, Math.min(scaleX, scaleY));

    this.zoom = Math.max(0.55, fitScale);
    this.offsetX = minX - (this.width / this.zoom - bounds.width) / 2;
    this.offsetY = Math.max(0, minY - padding);

    this.applyViewBox();
  }

  /**
   * DEFAULT Initial Camera Framing: Anchors on Project Root & immediate major branches.
   * Prioritizes human legibility and project context (scale ~0.75 - 1.0) rather than
   * mathematical bounding containment. Decoupled from [FIT].
   * @param {Object} rootNode 
   * @param {Array} primaryBranches 
   * @param {number} padding 
   */
  focusRoot(rootNode = null, primaryBranches = [], padding = 36) {
    if (rootNode) this.rootNode = rootNode;
    if (primaryBranches && primaryBranches.length > 0) this.primaryBranches = primaryBranches;

    let targetNodes = [];
    if (this.rootNode) {
      targetNodes.push(this.rootNode);
      if (this.primaryBranches && this.primaryBranches.length > 0) {
        targetNodes = targetNodes.concat(this.primaryBranches);
      }
    } else if (this.svg) {
      const rootEl = this.svg.querySelector("[data-node-id='root-project'], [data-node-id^='root']");
      if (rootEl) {
        const transform = rootEl.getAttribute("transform") || "";
        const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
        if (m) {
          targetNodes.push({
            x: parseFloat(m[1]),
            y: parseFloat(m[2]),
            width: 250,
            height: 80
          });
        }
      }
    }

    if (targetNodes.length > 0) {
      const minX = Math.min(...targetNodes.map(n => n.x));
      const maxX = Math.max(...targetNodes.map(n => n.x + (n.width || 240)));
      const minY = Math.min(...targetNodes.map(n => n.y));
      const maxY = Math.max(...targetNodes.map(n => n.y + (n.height || 80)));

      const clusterW = (maxX - minX) + padding * 2;
      const clusterH = (maxY - minY) + padding * 2;

      const scaleX = this.width / clusterW;
      const scaleY = this.height / clusterH;
      const fitCluster = Math.min(scaleX, scaleY);

      // Human-readable scale: anchored around 0.80 - 1.0 (never microscopic 26%!)
      const isMobile = window.innerWidth <= 768;
      const readableZoom = Math.min(1.05, Math.max(isMobile ? 0.72 : 0.82, fitCluster));

      this.zoom = readableZoom;
      const clusterCenterX = (minX + maxX) / 2;
      this.offsetX = clusterCenterX - (this.width / this.zoom) / 2;
      this.offsetY = Math.max(12, minY - padding);

      this.applyViewBox();
      return;
    }

    // Fallback if nodes not yet registered in DOM
    this.zoom = 0.88;
    if (this.contentBounds) {
      this.offsetX = (this.contentBounds.width - this.width / this.zoom) / 2;
      this.offsetY = 24;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
    this.applyViewBox();
  }

  /**
   * Focuses on a specific node, smoothly centering the viewport around it at a readable scale.
   * @param {string} nodeId 
   * @param {number|null} targetZoom 
   */
  focusNode(nodeId, targetZoom = null) {
    if (!this.svg || !nodeId) return;

    let nodeX = null, nodeY = null, nodeW = 240, nodeH = 80;

    const nodeEl = this.svg.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeEl) {
      const transform = nodeEl.getAttribute("transform") || "";
      const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      if (m) {
        nodeX = parseFloat(m[1]);
        nodeY = parseFloat(m[2]);
      }
      const rect = nodeEl.querySelector("rect");
      if (rect) {
        nodeW = parseFloat(rect.getAttribute("width")) || nodeW;
        nodeH = parseFloat(rect.getAttribute("height")) || nodeH;
      }
    }

    if (nodeX === null) return;

    const nodeCenterX = nodeX + nodeW / 2;
    const nodeCenterY = nodeY + nodeH / 2;

    const isMobile = window.innerWidth <= 768;
    const readableZoom = targetZoom
      ? Math.min(this.maxZoom, Math.max(this.minZoom, targetZoom))
      : Math.min(1.1, Math.max(isMobile ? 0.78 : 0.88, this.zoom));

    this.zoom = readableZoom;
    this.offsetX = nodeCenterX - (this.width / this.zoom) / 2;
    this.offsetY = nodeCenterY - (this.height / this.zoom) / 2;

    this.applyViewBox();
  }

  /**
   * Explicit user action: Zooms out to reveal the complete architecture map.
   */
  fitGraph(padding = 40) {
    if (this.contentBounds) {
      this.fitBounds(this.contentBounds, padding);
    }
  }

  reset() {
    if (this.rootNode) {
      this.focusRoot(this.rootNode, this.primaryBranches);
    } else if (this.svg && this.svg.querySelector("[data-node-id='root-project'], [data-node-id^='root']")) {
      this.focusRoot();
    } else {
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.applyViewBox();
    }
  }

  /**
   * Grows (or shrinks) the scrollable canvas to a content height WITHOUT
   * changing zoom. This is the key difference from fitBounds: a large
   * roadmap stays legible and the user scrolls, rather than the whole
   * graph being shrunk until every node is unreadable.
   */
  setCanvasHeight(contentHeight) {
    if (!this.svg) return;
    const h = Math.max(600, Math.round(contentHeight));
    this.canvasHeight = h;

    // Only drive the scroll container on non-Stage7 layouts; otherwise
    // keep the SVG at viewport height and let pan/zoom handle it.
    if (!this.isStage7Canvas) {
      const parent = this.svg.parentElement;
      this.svg.style.height = `${h}px`;
      this.svg.style.minHeight = `${h}px`;
      if (parent) {
        parent.style.minHeight = `${h}px`;
      }
    }
  }

  /**
   * Moves the camera to frame the given bounds while keeping the current
   * zoom whenever possible. Used after each choice so the newly revealed
   * nodes come into view without the rest of the graph jumping.
   */
  followBounds(bounds, padding = 70) {
    if (!this.svg || !bounds) return;
    this.contentBounds = bounds;

    const minX = bounds.x !== undefined ? bounds.x : 0;
    const minY = bounds.y !== undefined ? bounds.y : 0;
    const targetW = bounds.width + padding * 2;
    const targetH = bounds.height + padding * 2;

    // Choose the largest readable zoom that still contains the target,
    // clamped so we never zoom out past legibility on a big graph.
    const scaleX = this.width / targetW;
    const scaleY = this.height / targetH;
    const fitScale = Math.min(scaleX, scaleY);
    const readable = Math.min(1.0, Math.max(this.minZoom, fitScale));

    this.zoom = Math.max(readable, Math.min(this.zoom, 1.0));
    this.offsetX = minX - (this.width / this.zoom - bounds.width) / 2;
    this.offsetY = Math.max(0, minY - padding);

    this.applyViewBox();
  }

  getViewportCenter() {
    return {
      x: this.offsetX + (this.width / this.zoom) / 2,
      y: this.offsetY + (this.height / this.zoom) / 2
    };
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 7 INTERACTIVE CANVAS CONTROLS (PAN, ZOOM, PINCH)
  // ─────────────────────────────────────────────────────────────

  zoomIn(factor = 1.22) {
    const center = this.getViewportCenter();
    this.zoomAt(this.zoom * factor, center.x, center.y, true);
  }

  zoomOut(factor = 0.82) {
    const center = this.getViewportCenter();
    this.zoomAt(this.zoom * factor, center.x, center.y, true);
  }

  zoomAt(newZoom, clientX, clientY, isSvgCoord = false) {
    const clampedZoom = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));
    if (Math.abs(clampedZoom - this.zoom) < 0.001) return;

    let svgX, svgY;
    if (isSvgCoord) {
      svgX = clientX;
      svgY = clientY;
    } else {
      const rect = this.svg.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      svgX = this.offsetX + clickX / this.zoom;
      svgY = this.offsetY + clickY / this.zoom;
    }

    this.zoom = clampedZoom;

    if (isSvgCoord) {
      this.offsetX = svgX - (this.width / this.zoom) / 2;
      this.offsetY = svgY - (this.height / this.zoom) / 2;
    } else {
      const rect = this.svg.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      this.offsetX = svgX - clickX / this.zoom;
      this.offsetY = svgY - clickY / this.zoom;
    }

    this.applyViewBox();
  }

  panBy(dx, dy) {
    this.offsetX -= dx / this.zoom;
    this.offsetY -= dy / this.zoom;
    this.applyViewBox();
  }

  _handlePointerDown(e) {
    if (!this.isStage7Canvas) return;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragDistance = 0;
    this.isDragging = true;
    this.wasDragging = false;

    if (this.activePointers.size === 1) {
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    } else if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      this.touchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.touchStartZoom = this.zoom;
      this.touchStartCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };
    }
  }

  _handlePointerMove(e) {
    if (!this.isStage7Canvas || !this.isDragging) return;
    if (!this.activePointers.has(e.pointerId)) return;

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.dragDistance += Math.hypot(dx, dy);

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      if (this.dragDistance > 3) {
        this.wasDragging = true;
        this.panBy(dx, dy);
      }
    } else if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.touchStartDist > 0 && dist > 0) {
        this.wasDragging = true;
        const factor = dist / this.touchStartDist;
        const targetZoom = this.touchStartZoom * factor;
        const midX = (pts[0].x + pts[0].x) / 2;
        const midY = (pts[0].y + pts[0].y) / 2;
        this.zoomAt(targetZoom, midX, midY);
      }
    }
  }

  _handlePointerUp(e) {
    if (!this.isStage7Canvas) return;
    this.activePointers.delete(e.pointerId);

    if (this.wasDragging) {
      // Suppress the click event generated by this drag gesture
      const suppressClick = (clickEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
        window.removeEventListener("click", suppressClick, true);
      };
      window.addEventListener("click", suppressClick, true);
      setTimeout(() => {
        window.removeEventListener("click", suppressClick, true);
        this.wasDragging = false;
      }, 60);
    }

    if (this.activePointers.size === 0) {
      this.isDragging = false;
    } else if (this.activePointers.size === 1) {
      const remaining = Array.from(this.activePointers.values())[0];
      this.lastPointerX = remaining.x;
      this.lastPointerY = remaining.y;
    }
  }

  _handleWheel(e) {
    if (!this.isStage7Canvas) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    this.zoomAt(this.zoom * factor, e.clientX, e.clientY);
  }

  mountHud(containerEl) {
    this.unmountHud();
    const hud = document.createElement("div");
    hud.id = "stage7-canvas-hud";
    hud.className = "stage7-canvas-hud";
    hud.setAttribute("role", "toolbar");
    hud.setAttribute("aria-label", "Blueprint Canvas Navigation Controls");

    hud.innerHTML = `
      <button type="button" id="stage7-btn-zoom-in" class="stage7-hud-btn" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <span id="stage7-zoom-indicator" class="stage7-hud-zoom">${Math.round(this.zoom * 100)}%</span>
      <button type="button" id="stage7-btn-zoom-out" class="stage7-hud-btn" title="Zoom Out (-)" aria-label="Zoom out">−</button>
      <button type="button" id="stage7-btn-fit" class="stage7-hud-btn" title="Fit Entire Blueprint to Screen" aria-label="Fit entire blueprint">FIT</button>
      <button type="button" id="stage7-btn-reset" class="stage7-hud-btn" title="Reset View (1:1)" aria-label="Reset zoom">1:1</button>
    `;

    containerEl.appendChild(hud);
    this._hudElement = hud;

    hud.querySelector("#stage7-btn-zoom-in").addEventListener("click", (e) => {
      e.stopPropagation();
      this.zoomIn();
    });

    hud.querySelector("#stage7-btn-zoom-out").addEventListener("click", (e) => {
      e.stopPropagation();
      this.zoomOut();
    });

    hud.querySelector("#stage7-btn-fit").addEventListener("click", (e) => {
      e.stopPropagation();
      this.fitGraph(40);
    });

    hud.querySelector("#stage7-btn-reset").addEventListener("click", (e) => {
      e.stopPropagation();
      this.reset();
    });
  }

  unmountHud() {
    if (this._hudElement && this._hudElement.parentElement) {
      this._hudElement.parentElement.removeChild(this._hudElement);
    }
    this._hudElement = null;
  }

  updateHudZoom() {
    const indicator = document.getElementById("stage7-zoom-indicator");
    if (indicator) {
      indicator.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  }

  enableStage7Canvas(containerEl, bounds = null) {
    this.isStage7Canvas = true;
    this.contentBounds = bounds;

    const parent = containerEl || this.svg.parentElement;
    if (parent) {
      parent.classList.add("stage7-canvas-active");
      parent.addEventListener("pointerdown", this._onPointerDown);
      parent.addEventListener("pointermove", this._onPointerMove);
      parent.addEventListener("pointerup", this._onPointerUp);
      parent.addEventListener("pointercancel", this._onPointerUp);
      parent.addEventListener("wheel", this._onWheel, { passive: false });
      this.mountHud(parent);
    }
  }

  updateLOD() {
    if (!this.svg) return;
    const parent = this.svg.parentElement;
    const targets = [this.svg];
    if (parent) targets.push(parent);

    if (!this.isStage7Canvas) {
      ["lod-overview", "lod-medium", "lod-detail"].forEach(cls => {
        targets.forEach(el => el.classList.remove(cls));
      });
      return;
    }

    let lod = "lod-medium";
    if (this.zoom < 0.65) {
      lod = "lod-overview";
    } else if (this.zoom > 1.05) {
      lod = "lod-detail";
    }

    ["lod-overview", "lod-medium", "lod-detail"].forEach(cls => {
      targets.forEach(el => {
        if (cls === lod) {
          el.classList.add(cls);
        } else {
          el.classList.remove(cls);
        }
      });
    });
  }

  disableStage7Canvas(containerEl) {
    this.isStage7Canvas = false;
    const parent = containerEl || this.svg.parentElement;
    if (parent) {
      parent.classList.remove("stage7-canvas-active");
      parent.removeEventListener("pointerdown", this._onPointerDown);
      parent.removeEventListener("pointermove", this._onPointerMove);
      parent.removeEventListener("pointerup", this._onPointerUp);
      parent.removeEventListener("pointercancel", this._onPointerUp);
      parent.removeEventListener("wheel", this._onWheel);
    }
    ["lod-overview", "lod-medium", "lod-detail"].forEach(cls => {
      if (this.svg) this.svg.classList.remove(cls);
      if (parent) parent.classList.remove(cls);
    });
    this.unmountHud();
    this.activePointers.clear();
    this.isDragging = false;
  }
}
