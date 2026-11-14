/**
 * DEVPATH // Graph-First Roadmap Application
 * ------------------------------------------------------------------
 * Replaces the stage wizard. There is exactly one loop:
 *
 *   1. Frontier.recompute()      → what is available now
 *   2. layout.place(...)         → where the new nodes go
 *   3. graph.render(...)         → draw committed spine + offered choices
 *   4. user picks                → Frontier.commit() → back to 1
 *
 * No stages. No fixed order. Technology nodes appear only when the
 * path the user chose actually unlocks them.
 * ------------------------------------------------------------------
 */

import { SvgGraphEngine } from "./graph.js";
import { GraphCamera } from "./camera.js";
import { IncrementalLayout } from "./graphLayout.js";
import { Frontier } from "./frontier.js";
import { knowledgeGraph, ROOT_SEED_ID } from "./knowledge.js";
import { ROOT_NODE_DEFAULT, PROJECT_TYPES } from "./data/projectTypes.js";
import { ui } from "./ui.js";
import { store } from "./state.js";

const START_NODE_ID = "roadmap-start";

export class DevPathRoadmapApp {
  constructor() {
    this.svgEl = null;
    this.camera = null;
    this.graph = null;
    this.layout = new IncrementalLayout();
    this.frontier = new Frontier(knowledgeGraph);
    this.selectedType = null;
    this.projectName = "";
    this.focusNodeId = null;   // node the navigation arrows currently highlight
    this.lastPlaced = [];
  }

  init() {
    this.svgEl = document.getElementById("architecture-graph");
    if (!this.svgEl) {
      console.error("[DevPath]: <svg id='architecture-graph'> not found!");
      return;
    }

    const initialTheme = store.get().theme || "blueprint";
    document.documentElement.setAttribute("data-theme", initialTheme);

    ui.init({
      onThemeSelect: theme => this.switchTheme(theme),
      onReset: () => this.reset()
    });
    ui.updateThemeSwitcher(initialTheme);

    this.camera = new GraphCamera(this.svgEl);
    this.camera.init();

    this.graph = new SvgGraphEngine(this.svgEl, {
      theme: initialTheme,
      onNodeAction: (action, node, payload) => this.handleNodeAction(action, node, payload)
    });
    this.graph.init();

    this.layout.setViewport(this.camera.width, this.camera.width <= 768);

    window.addEventListener("resize", () => this.handleResize());

    store.subscribe((curr, prev) => {
      if (curr.theme !== prev.theme) {
        document.documentElement.setAttribute("data-theme", curr.theme);
        ui.updateThemeSwitcher(curr.theme);
        this.graph.setTheme(curr.theme);
        this.reflow();
      }
    });

    // Expose the API FIRST so the app is always reachable for debugging,
    // even if a later render step throws. A silent boot failure that leaves
    // a rendered-but-dead UI is the hardest kind to diagnose.
    this.exposeApi();

    this.renderStart();

    console.log(`[DevPath]: Graph-first roadmap ready. Theme: ${initialTheme}`);
  }

  exposeApi() {
    try {
      window.DevPath = {
        app: this,
        graph: this.graph,
        camera: this.camera,
        layout: this.layout,
        frontier: this.frontier,
        knowledgeGraph,
        store,

      // Navigation
      nextBranch: () => this.navigateBranch(1),
      prevBranch: () => this.navigateBranch(-1),
      focusNode: id => this.focusNode(id),

      // Programmatic path building (tests + power users)
      choose: seedId => this.choose(seedId),
      chooseMany: seedIds => seedIds.forEach(id => this.choose(id)),
      rollback: seedId => this.rollback(seedId),
      reset: () => this.reset(),
      setProjectName: name => this.setProjectName(name),

      // Introspection
      getPath: () => this.frontier.spine().map(n => ({
        step: n.chosenAt + 1,
        id: n.seedId,
        kind: n.kind,
        title: n.title
      })),
      getOffered: () => this.frontier.offered.map(s => ({
        id: s.id,
        kind: s.kind,
        title: s.title
      })),
      getManifest: () => this.frontier.toManifest(this.projectName)
    };
    } catch (err) {
      console.error("[DevPath]: exposeApi failed", err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────

  /** Stage 0: the roadmap root with the project name input. */
  renderStart() {
    this.layout.reset();
    this.frontier.reset();

    const node = {
      id: START_NODE_ID,
      kind: "start",
      lane: 0,
      technical: false,
      children: []
    };
    const pos = this.layout.placeStart(node);

    this.graph.createNode({
      ...ROOT_NODE_DEFAULT,
      id: START_NODE_ID,
      type: "root",
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height
    });

    this.sizeCanvas();
    this.camera.focusNode(START_NODE_ID);
    ui.updateBreadcrumb({ projectName: "" });
    ui.setStageBadge("ROADMAP", `${this.frontier.committed.length} CHOICES`);
  }

  setProjectName(name) {
    this.projectName = (name || "").trim();
    ui.updateBreadcrumb({ projectName: this.projectName });
    return this.projectName;
  }

  /**
   * Reveals the entry choices for a project type. Called once the user
   * picks what they're building.
   */
  startProjectType(typeId) {
    const typeConfig = PROJECT_TYPES.find(t => t.id === typeId);
    if (!typeConfig) return;

    this.selectedType = typeId;
    ui.setProjectType(typeConfig.title);

    // Render the type as the first committed node.
    const startPos = this.layout.getPosition(START_NODE_ID);
    const typeNode = {
      id: `type::${typeId}`,
      kind: "project-type",
      lane: 1,
      title: typeConfig.title,
      category: typeConfig.category,
      tagline: typeConfig.tagline,
      description: typeConfig.description,
      iconId: null,
      technical: false,
      children: []
    };

    const pos = this.layout.place(typeNode, startPos ? startPos.x + startPos.width / 2 : null);
    this.graph.createNode({
      id: typeNode.id,
      type: "path",
      category: typeConfig.category,
      title: typeConfig.title,
      tagline: typeConfig.tagline,
      description: typeConfig.description,
      blueprintIconSvg: typeConfig.icons?.blueprint,
      rootIconSvg: typeConfig.icons?.root,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      isSelected: true
    });
    this.graph.connectNodesAnimated(START_NODE_ID, typeNode.id, {
      fromSide: "bottom", toSide: "top", status: "active"
    });

    // Seed the frontier with this type's entry domains.
    this.frontier.committed = [];
    this.frontier.pathIndex.clear();
    this.frontier.commit(ROOT_SEED_ID, null);

    // Entry seeds are offered directly beneath the type node.
    this.renderOffered(typeNode);
    this.sizeCanvas();
    this.camera.followBounds(this.layout.getUnionBounds([typeNode.id, ...this.offeredIds()]));
  }

  /** Draws the currently-offered seeds beneath a parent node. */
  renderOffered(parentNode) {
    const seeds = this.frontier.recompute();
    const placed = this.layout.placeOffered(parentNode, seeds);
    this.layout.pruneOffered(seeds.map(s => `offer::${s.id}`));

    placed.forEach(({ seed, nodeId, position }) => {
      this.graph.createNode({
        id: nodeId,
        type: "choice",
        category: seed.category,
        title: seed.title,
        tagline: seed.tagline,
        description: seed.description,
        kind: seed.kind,
        seedId: seed.id,
        technical: seed.technical,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height
      });
      this.graph.connectNodesAnimated(parentNode.id, nodeId, {
        fromSide: "bottom", toSide: "top", status: "tentative"
      });
    });

    this.offeredIdsCache = placed.map(p => p.nodeId);
    return placed;
  }

  offeredIds() {
    return this.offeredIdsCache || [];
  }

  // ─────────────────────────────────────────────────────────────
  // THE CORE LOOP
  // ─────────────────────────────────────────────────────────────

  /** Commits a seed and grows the graph. */
  choose(seedId) {
    if (!seedId) return null;
    if (this.frontier.has(seedId)) return this.frontier.getNode(seedId);

    // The parent is whichever committed node unlocked this seed.
    const parentSeedId = this.findUnlockerOf(seedId);
    const parentNode = parentSeedId ? this.frontier.getNode(parentSeedId) : this.frontier.getNode("__root__");
    if (!parentNode) return null;

    const node = this.frontier.commit(seedId, parentNode.seedId);
    if (!node) return null;

    // 1. Remove the offered card that was just chosen.
    this.graph.removeNode(`offer::${seedId}`, false);

    // 2. Place + draw the committed node.
    const parentPos = this.layout.getPosition(parentNode.id);
    const pos = this.layout.place(
      { id: `node::${seedId}`, kind: node.kind, lane: node.lane, technical: node.technical, children: [] },
      parentPos ? parentPos.x + parentPos.width / 2 : null
    );

    this.graph.createNode({
      id: `node::${seedId}`,
      type: "path",
      category: node.category,
      title: node.title,
      tagline: node.tagline,
      description: node.description,
      kind: node.kind,
      seedId: node.seedId,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      isSelected: true
    });
    this.graph.connectNodesAnimated(parentNode.id, `node::${seedId}`, {
      fromSide: "bottom", toSide: "top", status: "active"
    });

    // 3. Clear stale offered cards, reveal the new frontier.
    this.clearOfferedNodes();
    this.renderOffered({ id: `node::${seedId}`, lane: node.lane });

    // 4. Camera follows the new content instead of shrinking to fit.
    this.sizeCanvas();
    const fresh = [`node::${seedId}`, ...this.offeredIds()];
    this.camera.followBounds(this.layout.getUnionBounds(fresh));
    this.focusNodeId = `node::${seedId}`;

    this.refreshBadges();
    ui.notify(`Added: ${node.title}`, "info");
    return node;
  }

  /** Finds which committed seed unlocked the given seed. */
  findUnlockerOf(seedId) {
    for (const committed of this.frontier.committed) {
      const children = this.graph_childrenOf(committed.seedId);
      if (children.some(s => s.id === seedId)) return committed.seedId;
    }
    return null;
  }

  graph_childrenOf(seedId) {
    return this.frontier.graph.getChildrenOf(seedId);
  }

  clearOfferedNodes() {
    const ids = this.offeredIds();
    ids.forEach(id => this.graph.removeNode(id, false));
    this.offeredIdsCache = [];
  }

  rollback(seedId = null) {
    const removed = this.frontier.rollbackTo(seedId);
    removed.forEach(node => {
      this.graph.removeNode(`node::${node.seedId}`, false);
      this.layout.release(`node::${node.seedId}`);
    });

    this.clearOfferedNodes();
    const parent = this.frontier.lastCommitted();
    if (parent) {
      this.renderOffered({ id: `node::${parent.seedId}`, lane: parent.lane });
    }
    this.sizeCanvas();
    this.refreshBadges();
    return removed;
  }

  reset() {
    this.clearOfferedNodes();
    this.graph.nodes.forEach((_, id) => this.graph.removeNode(id, false));
    this.graph.clearConnections();
    this.selectedType = null;
    this.projectName = "";
    ui.setProjectType(null);
    this.renderStart();
  }

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Walks between offered siblings at the current frontier.
   * +1 = next branch, -1 = previous. Wraps around.
   */
  navigateBranch(direction = 1) {
    const ids = this.offeredIds();
    if (ids.length === 0) return null;

    let idx = ids.indexOf(this.focusNodeId);
    if (idx === -1) idx = direction > 0 ? -1 : 0;
    idx = (idx + direction + ids.length) % ids.length;

    this.focusNodeId = ids[idx];
    this.camera.followBounds(this.layout.getNodeBounds(this.focusNodeId, 120));
    this.highlightNode(this.focusNodeId);
    return this.focusNodeId;
  }

  focusNode(nodeId) {
    if (!nodeId) return;
    this.focusNodeId = nodeId;
    this.camera.followBounds(this.layout.getNodeBounds(nodeId, 120));
    this.highlightNode(nodeId);
  }

  highlightNode(nodeId) {
    if (!this.graph.nodesGroup) return;
    this.graph.nodesGroup.querySelectorAll(".graph-node").forEach(el => {
      el.classList.toggle("nav-focused", el.getAttribute("data-node-id") === nodeId);
    });
  }

  /** Steps along the committed spine — review the path you actually took. */
  navigateSpine(direction = 1) {
    const spine = this.frontier.spine();
    if (spine.length === 0) return null;
    let idx = spine.findIndex(n => `node::${n.seedId}` === this.focusNodeId);
    if (idx === -1) idx = direction > 0 ? -1 : spine.length;
    idx = (idx + direction + spine.length) % spine.length;
    const target = `node::${spine[idx].seedId}`;
    this.focusNode(target);
    return target;
  }

  // ─────────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────────

  handleNodeAction(action, node) {
    switch (action) {
      case "submit-project-name":
        this.handleStartSubmit(node);
        break;
      case "select-branch":
        // graph.js fires "select-branch" for branch nodes (the project-type
        // cards on the roadmap root).
        this.startProjectType(node.typeId || node.id);
        break;
      case "select-choice":
        this.choose(node.seedId || (node.id || "").replace("offer::", ""));
        break;
      case "inspect-node":
        ui.showNodeInspector(node);
        break;
      default:
        break;
    }
  }

  handleStartSubmit(node) {
    const input = document.getElementById("bp-project-name-input");
    const name = input ? input.value : "";
    if (!name || !name.trim()) {
      ui.showInputError("Please specify a project name to begin.");
      return;
    }
    this.setProjectName(name);
    ui.setProjectConfigured(this.projectName, store.get().theme);
    this.renderProjectTypes();
  }

  /** Offers the top-level project types as the first branching choice. */
  renderProjectTypes() {
    const startPos = this.layout.getPosition(START_NODE_ID);
    const dims = { width: 250, height: 132 };
    const gap = 34;
    const total = PROJECT_TYPES.length * dims.width + (PROJECT_TYPES.length - 1) * gap;
    let cursorX = Math.round((startPos.x + startPos.width / 2) - total / 2);
    const y = startPos.y + startPos.height + 90;

    PROJECT_TYPES.forEach(type => {
      const id = `type-offer::${type.id}`;
      this.graph.createNode({
        id,
        type: "branch",
        category: type.category,
        title: type.title,
        tagline: type.tagline,
        description: type.description,
        blueprintIconSvg: type.icons?.blueprint,
        rootIconSvg: type.icons?.root,
        typeId: type.id,
        x: cursorX,
        y,
        width: dims.width,
        height: dims.height
      });
      this.graph.connectNodesAnimated(START_NODE_ID, id, {
        fromSide: "bottom", toSide: "top", status: "tentative"
      });
      cursorX += dims.width + gap;
    });

    this.sizeCanvas();
    this.camera.followBounds({
      x: cursorX - total - gap,
      y: y - 60,
      width: total + gap * 2,
      height: dims.height + 120
    });
  }

  switchTheme(theme) {
    if (theme !== "blueprint" && theme !== "root") return;
    store.setTheme(theme);
    ui.notify(theme === "root" ? "ROOT THEME: Living Architecture" : "BLUEPRINT THEME: Technical CAD", "info");
  }

  handleResize() {
    this.camera.updateDimensions();
    this.layout.setViewport(this.camera.width, this.camera.width <= 768);
    // Existing nodes keep their positions; only the canvas is resized.
    this.sizeCanvas();
  }

  reflow() {
    this.sizeCanvas();
    if (this.focusNodeId) this.camera.focusNode(this.focusNodeId);
  }

  /** Grows the SVG so the whole roadmap is scrollable without shrinking. */
  sizeCanvas() {
    const height = this.layout.getContentHeight();
    this.camera.setCanvasHeight(height);
  }

  refreshBadges() {
    const count = this.frontier.committed.filter(n => n.seedId !== "__root__").length;
    const open = this.frontier.openCount;
    ui.setStageBadge("ROADMAP", `${count} CHOICES · ${open} AVAILABLE`);
    ui.updatePathBreadcrumb(this.frontier.spine().filter(n => n.seedId !== "__root__"));

    // The back button undoes the most recent choice. Hidden when there is
    // nothing to undo, so it never offers a no-op.
    if (count > 0) {
      ui.showBackButton("\u2190 UNDO LAST", () => this.undoLast());
    } else {
      ui.hideBackButton();
    }
  }

  /** Removes the most recent choice and restores the previous frontier. */
  undoLast() {
    const spine = this.frontier.spine().filter(n => n.seedId !== "__root__");
    if (spine.length === 0) return [];
    const last = spine[spine.length - 1];
    const removed = this.rollback(last.seedId);
    ui.notify(`Removed: ${last.title}`, "info");
    return removed;
  }
}

export const roadmapApp = new DevPathRoadmapApp();