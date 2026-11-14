/**
 * DEVPATH // Living Architecture Graph Orchestrator
 * Real-time continuous canvas where every decision permanently grows the graph.
 * Supports:
 * - Root Project Node -> 3 Project Types (branches fan out -> selected locks)
 * - Parallel Focus Siblings (1 to 3 parallel definition nodes, never sequential!)
 * - Smart ↻ SHUFFLE discovery branching
 * - Architecture Path branching and convergence
 * - Dynamic Bézier drawing, node materialization, branch retraction
 * - Dual Themes: Blueprint (CAD precision) and Root (living biophilic growth)
 */

import { store } from "./state.js";
import { SvgGraphEngine } from "./graph.js";
import { GraphCamera } from "./camera.js";
import { GraphLayout } from "./layout.js";
import { ROOT_NODE_DEFAULT, PROJECT_TYPES, THEME_CONFIGS } from "./data/projectTypes.js";
import { PROJECT_FOCUS } from "./data/projectFocus.js";
import { ARCHITECTURE_PATHS } from "./data/architecturePaths.js";
import { getStackForPath, getCompatibleStackOptions } from "./data/technologyStacks.js";
import { RelevanceScorer } from "./data/relevanceScorer.js";
import { projectGraph } from "./data/projectGraph.js";
import { getInfraGroupsForType, getDecisionGroup, DECISION_GROUPS, nodeIdForOption } from "./data/decisionGroups.js";
import { DECISION_PIPELINES, getPipelineForType, getStageConfig, getTotalStagesForType } from "./data/decisionPipelines.js";
import { PROJECT_FEATURES, getExplorationPathsForContext, findFeatureById } from "./data/projectFeatures.js";
import * as Vocabulary from "./data/vocabulary.js";
import { ui } from "./ui.js";

class DevPathApp {
  constructor() {
    this.svgEl = null;
    this.camera = null;
    this.graph = null;
    this.rootNodeId = ROOT_NODE_DEFAULT.id;

    // Active branch tracking
    this.branchNodes = [];
    this.selectedFocusItems = [];
    this.discoveryFocusItems = [];
    this.pathNodes = [];
    this.pendingRenderTimers = [];
  }

  clearPendingRenderTimers() {
    (this.pendingRenderTimers || []).forEach(t => clearTimeout(t));
    this.pendingRenderTimers = [];
  }

  init() {
    this.svgEl = document.getElementById("architecture-graph");
    if (!this.svgEl) {
      console.error("[DevPath]: <svg id='architecture-graph'> not found!");
      return;
    }

    const initialTheme = store.get().theme || "blueprint";
    document.documentElement.setAttribute("data-theme", initialTheme);

    // 1. Initialize UI with Theme Switcher & Back handlers
    ui.init({
      onThemeSelect: (theme) => this.switchTheme(theme)
    });
    ui.updateThemeSwitcher(initialTheme);
    const initialType = store.get().selectedType || "website";
    ui.updateStageBadge(1, getTotalStagesForType(initialType), getStageConfig(initialType, 1).title);

    // 2. Initialize SVG Camera
    this.camera = new GraphCamera(this.svgEl);
    this.camera.init();

    // 3. Initialize Custom SVG Graph Engine with active theme
    this.graph = new SvgGraphEngine(this.svgEl, {
      theme: initialTheme,
      onNodeAction: (action, node, payload) => this.handleNodeAction(action, node, payload),
      onInputChange: (val) => this.handleInputChange(val)
    });
    this.graph.init();

    // 4. Render Initial Central Root Node
    this.renderInitialWorkspace();

    // 5. Listen for Window Resize to adjust layout
    window.addEventListener("resize", () => {
      this.handleWindowResize();
    });

    // 6. Subscribe to State Changes (Theme Switching, etc.)
    store.subscribe((curr, prev) => {
      if (curr.theme !== prev.theme) {
        document.documentElement.setAttribute("data-theme", curr.theme);
        ui.updateThemeSwitcher(curr.theme);
        this.graph.setTheme(curr.theme);
        this.reflowCurrentLayout();
      }
    });

    // 7. Expose for testing and debugging
    window.ProjectBlueprint = {
      app: this,
      store,
      graph: this.graph,
      camera: this.camera,
      ui,
      projectGraph,
      switchTheme: (t) => this.switchTheme(t),
      transitionToStage2: () => this.transitionToStage2(),
      transitionToStage3: () => this.transitionToStage3(),
      transitionToStage4: () => this.transitionToStage4(),
      transitionToStage5: () => this.transitionToStage5(),
      transitionToStage6: () => this.transitionToStage6(),
      transitionToStage7: () => this.transitionToStage7(),
      renderStage7: () => this.renderStage7(),
      selectStackTech: (tierId, techId) => {
        store.selectStackTech(tierId, techId);
        const s = store.get();
        const at = PROJECT_TYPES.find(t => t.id === s.selectedType) || PROJECT_TYPES[0];
        const pl = ARCHITECTURE_PATHS[at.id] || [];
        const cp = pl.find(p => p.id === s.selectedArchitecturePath) || pl[0];
        this.renderStage5(getStackForPath(cp ? cp.id : null), cp);
      },
      selectInfraTech: (groupId, optionId) => {
        const group = getDecisionGroup(groupId);
        this.handleInfraSelect({
          groupId,
          optionId,
          selectionMode: group ? group.selectionMode : "single",
          title: optionId
        });
      },
      selectRecursiveOption: (groupId, optionId, parentNodeId) => this.selectRecursiveOption(groupId, optionId, parentNodeId),
      deselectRecursiveOption: (groupId, optionId) => this.deselectRecursiveOption(groupId, optionId),
      getProjectGraph: () => projectGraph,
      syncProjectGraph: () => this.syncProjectGraph(),
      RelevanceScorer,
      DECISION_GROUPS,
      shuffleFocus: (typeId) => store.shuffleFocus(typeId),
      shuffleInfraGroup: (groupId) => {
        store.shuffleInfraGroup(groupId);
        this.renderStage6();
      },
      exportBlueprint: () => {
        this.syncProjectGraph();
        return projectGraph.exportBlueprint();
      },
      DECISION_PIPELINES,
      getPipelineForType,
      getStageConfig,
      getTotalStagesForType,
      expandNodeSubtree: (nodeId) => this.expandNodeSubtree(nodeId),
      openNodeInspector: (nodeId) => {
        const n = projectGraph.getNode(nodeId);
        if (n) ui.showNodeInspector(n);
      },
      PROJECT_FEATURES,
      getExplorationPathsForContext,
      findFeatureById,
      expandFeatureConcept: (focusOrParentId, featureId) => this.expandFeatureConcept(focusOrParentId, featureId),
      exploreNodeFeatures: (nodeId) => this.exploreNodeFeatures(nodeId),
      GraphLayout,
      // Canonical Vocabulary
      Vocabulary,
      NODE_TYPES: Vocabulary.NODE_TYPES,
      PATH_TYPES: Vocabulary.PATH_TYPES,
      RELATIONSHIP_TYPES: Vocabulary.RELATIONSHIP_TYPES,
      NODE_STATES: Vocabulary.NODE_STATES,
      NODE_ROLES: Vocabulary.NODE_ROLES,
      EDGE_TYPES: Vocabulary.EDGE_TYPES,
      CONNECTION_TYPES: Vocabulary.CONNECTION_TYPES,
      STAGES: Vocabulary.STAGES,
      NODE_TYPE_CATEGORIES: Vocabulary.NODE_TYPE_CATEGORIES,
      isValidNodeType: Vocabulary.isValidNodeType,
      isValidPathType: Vocabulary.isValidPathType,
      isValidRelationship: Vocabulary.isValidRelationship,
      isValidNodeState: Vocabulary.isValidNodeState,
      isValidNodeRole: Vocabulary.isValidNodeRole,
      isValidEdgeType: Vocabulary.isValidEdgeType,
      isValidConnectionType: Vocabulary.isValidConnectionType,
      getCategoryForNodeType: Vocabulary.getCategoryForNodeType
    };
    window.DevPath = window.ProjectBlueprint;
    window.GraphLayout = GraphLayout;

    console.log(`[DevPath]: Living Architecture Graph Ready. Theme: ${initialTheme}`);
  }

  switchTheme(theme) {
    if (theme !== "blueprint" && theme !== "root") return;
    store.setTheme(theme);
    const toastMsg = theme === "root" ? "ROOT THEME: Living Architecture" : "BLUEPRINT THEME: Technical CAD";
    ui.notify(toastMsg, "info");
  }

  renderInitialWorkspace() {
    const { width, height } = this.camera;
    const nodeW = ROOT_NODE_DEFAULT.width;
    const nodeH = ROOT_NODE_DEFAULT.height;

    const pos = GraphLayout.getRootPosition(width, height, nodeW, nodeH);

    this.graph.createNode({
      ...ROOT_NODE_DEFAULT,
      x: pos.x,
      y: pos.y
    });
  }

  handleWindowResize() {
    this.camera.updateDimensions();
    this.reflowCurrentLayout();
  }

  /**
   * On mobile, the graph's own scroll container is `.workspace`
   * (overflow-y: auto — see css/graph.css). Its scrollTop is a plain DOM
   * property that persists across stage transitions by default. If a user
   * scrolled deep into Stage 5's content, then advances to Stage 6, the
   * browser keeps that old scrollTop even though Stage 6 just rebuilt
   * entirely new content — which can visually read as "stuck" (the new
   * content starts further down than the current scroll position already
   * is) or as overlap (new nodes render underneath where the user is
   * already scrolled to, before the SVG's height has caught up to the
   * newly-fit bounds). Resetting scroll position at the start of every
   * stage transition keeps each new stage's content starting from the top.
   */
  resetWorkspaceScroll() {
    const workspace = document.querySelector(".workspace");
    if (workspace) workspace.scrollTop = 0;
  }

  reflowCurrentLayout() {
    const stage = store.get().stage;
    if (stage === 1) {
      const pos = GraphLayout.getRootPosition(this.camera.width, this.camera.height, ROOT_NODE_DEFAULT.width, ROOT_NODE_DEFAULT.height);
      this.graph.updateNodePosition(this.rootNodeId, pos.x, pos.y);
      this.graph.updateConnections();
    } else if (stage === 2) {
      this.reflowStage2();
    } else if (stage === 3) {
      this.reflowStage3();
    } else if (stage === 4) {
      this.reflowStage4();
    } else if (stage === 5) {
      const state = store.get();
      const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
      const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
      const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];
      this.renderStage5(getStackForPath(chosenPath ? chosenPath.id : null), chosenPath);
    } else if (stage === 6) {
      this.reflowStage6();
    } else if (stage === 7) {
      this.reflowStage7();
    }
  }

  handleInputChange(val) {
    if (val && val.trim().length > 0) {
      ui.clearInputError();
    }
  }

  handleNodeAction(action, node, payload) {
    switch (action) {
      case "submit-project-name":
        this.handleProjectNameSubmit(payload);
        break;
      case "select-branch":
        this.handleTypeSelect(node);
        break;
      case "add-focus-item":
        this.handleAddFocusItem(node);
        break;
      case "remove-focus-item":
        this.handleRemoveFocusItem(node);
        break;
      case "shuffle-focus-branches":
        this.handleShuffleFocus();
        break;
      case "advance-to-architecture":
        this.transitionToStage4();
        break;
      case "select-path":
        this.handlePathSelect(node);
        break;
      case "select-stack-tech":
        this.handleStackSelect(node);
        break;
      case "advance-to-stage6":
        this.transitionToStage6();
        break;
      case "select-infra-tech":
        this.handleInfraSelect(node);
        break;
      case "shuffle-infra-group":
        this.handleShuffleInfraGroup(node);
        break;
      case "advance-to-stage7":
        this.transitionToStage7();
        break;
      case "inspect-blueprint-node":
        this.handleInspectBlueprintNode(node);
        break;
      case "expand-node-subtree":
        this.expandNodeSubtree(node.id);
        break;
      case "explore-node-features":
        this.exploreNodeFeatures(node.id);
        break;
      default:
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 1: PROJECT NAME SUBMISSION -> SPROUT PROJECT TYPES
  // ─────────────────────────────────────────────────────────────

  handleProjectNameSubmit(name) {
    const cleanName = (name || "").trim();
    if (!cleanName) {
      ui.showInputError("Please specify a project name to begin.");
      return;
    }

    store.set({ projectName: cleanName, isConfigured: true });
    ui.setProjectConfigured(cleanName, store.get().theme);

    this.transitionToStage2();
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 2: PROJECT TYPE BRANCHING
  // ─────────────────────────────────────────────────────────────

  transitionToStage2() {
    store.goToStage(2);
    ui.updateStageBadge(2, 6, "PROJECT TYPE");
    ui.showBackButton("← STEP BACK", () => this.handleStepBack());
    ui.updateBreadcrumb({ projectName: store.get().projectName });

    const isMobile = window.innerWidth <= 768;
    const rootNode = this.graph.getNode(this.rootNodeId);
    const layout = GraphLayout.getStage2Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      PROJECT_TYPES,
      isMobile
    );

    // Update Root Node to top position
    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);

    // Create 3 Project Type branches with animated connections
    this.branchNodes = layout.branches;
    layout.branches.forEach((branch, index) => {
      setTimeout(() => {
        this.graph.createNode({
          id: branch.id,
          type: "branch",
          category: branch.category,
          title: branch.title,
          tagline: branch.tagline,
          description: branch.description,
          blueprintIconSvg: branch.blueprintIconSvg,
          rootIconSvg: branch.rootIconSvg,
          x: branch.x,
          y: branch.y,
          width: branch.width,
          height: branch.height
        });

        this.graph.connectNodesAnimated(this.rootNodeId, branch.id, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
      }, index * 100);
    });

    setTimeout(() => {
      this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
    }, 450);
  }

  reflowStage2() {
    const isMobile = window.innerWidth <= 768;
    const rootNode = this.graph.getNode(this.rootNodeId);
    const layout = GraphLayout.getStage2Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      PROJECT_TYPES,
      isMobile
    );

    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    layout.branches.forEach(b => {
      if (this.graph.hasNode(b.id)) {
        this.graph.updateNodePosition(b.id, b.x, b.y);
      }
    });
    this.graph.updateConnections();
    this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 2 -> STAGE 3: SELECT TYPE -> SPROUT FOCUS BRANCHES
  // ─────────────────────────────────────────────────────────────

  handleTypeSelect(node) {
    const chosenTypeId = node.id;
    store.selectType(chosenTypeId);

    // 1. Animate chosen connection and highlight
    this.graph.highlightBranch(chosenTypeId);

    // 2. Retract sibling branches (e.g. if website chosen, retract game and software)
    PROJECT_TYPES.forEach(t => {
      if (t.id !== chosenTypeId) {
        this.graph.removeNode(t.id, true);
        this.graph.removeConnection(this.rootNodeId, t.id);
      }
    });

    // 3. Smooth transition to Stage 3 Focus
    setTimeout(() => {
      this.transitionToStage3();
    }, 380);
  }

  transitionToStage3() {
    store.goToStage(3);
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];

    ui.updateStageBadge(3, 6, "PROJECT FOCUS");
    ui.showBackButton("← STEP BACK", () => this.handleStepBack());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles()
    });

    const isMobile = window.innerWidth <= 768;
    const allPool = PROJECT_FOCUS[activeType.id] || [];

    // Map selected focus objects
    this.selectedFocusItems = state.selectedFocus.map(id => allPool.find(item => item.id === id)).filter(Boolean);

    // Map discovery focus objects
    if (state.visibleFocusPool.length === 0) {
      store.initFocusPool(activeType.id);
    }
    const freshState = store.get();
    this.discoveryFocusItems = freshState.visibleFocusPool.map(id => allPool.find(item => item.id === id)).filter(Boolean);

    const pathTypes = ARCHITECTURE_PATHS[activeType.id] || [];

    const rootNode = this.graph.getNode(this.rootNodeId);
    const layout = GraphLayout.getStage3Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      activeType,
      this.selectedFocusItems,
      this.discoveryFocusItems,
      pathTypes,
      isMobile
    );

    // Position Root and Active Type
    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    this.graph.updateNodePosition(activeType.id, layout.activeType.x, layout.activeType.y);

    // Clear old focus discovery/selected nodes before rendering layout
    this.clearOldFocusNodes();

    // Render Parallel Selected Focus Nodes (attached directly to Type!)
    layout.selectedFocusNodes.forEach(sel => {
      this.graph.createNode({
        id: `focus-sel-${sel.id}`,
        type: "focus-selected",
        title: sel.title,
        category: "FOCUS CHARACTERISTIC",
        iconId: sel.iconId,
        x: sel.x,
        y: sel.y,
        width: sel.width,
        height: sel.height,
        isCompact: sel.isCompact,
        data: sel
      });

      // Animated connection from Active Type directly to this parallel sibling focus node!
      this.graph.connectNodesAnimated(activeType.id, `focus-sel-${sel.id}`, {
        fromSide: "bottom",
        toSide: "top",
        status: "active"
      });
    });

    // Render Growth Action Node ("BUILD ARCHITECTURE PATHS →") if >= 1 focus selected
    if (layout.growthActionNode) {
      this.graph.createNode(layout.growthActionNode);

      // Connect to the CTA node
      if (layout.selectedFocusNodes.length >= 3) {
        layout.selectedFocusNodes.forEach(sel => {
          this.graph.connectNodesAnimated(`focus-sel-${sel.id}`, layout.growthActionNode.id, {
            fromSide: "bottom",
            toSide: "top",
            status: "active"
          });
        });
      } else if (layout.shuffleNode) {
        this.graph.connectNodesAnimated(layout.shuffleNode.id, layout.growthActionNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
      } else if (layout.selectedFocusNodes.length > 0) {
        const lastSel = layout.selectedFocusNodes[layout.selectedFocusNodes.length - 1];
        this.graph.connectNodesAnimated(`focus-sel-${lastSel.id}`, layout.growthActionNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
      }
    }

    // Render Architecture Path Branches (blooming naturally below focus group when >= 1 focus selected)
    if (layout.pathNodes && layout.pathNodes.length > 0) {
      layout.pathNodes.forEach((pathNode, i) => {
        setTimeout(() => {
          this.graph.createNode({
            id: pathNode.id,
            type: "path",
            title: pathNode.title,
            category: pathNode.category || "ARCHITECTURE PATH",
            tagline: pathNode.tagline,
            description: pathNode.description,
            x: pathNode.x,
            y: pathNode.y,
            width: pathNode.width,
            height: pathNode.height,
            isSelected: false
          });

          // Connect from each selected focus sibling down to each architecture choice
          layout.selectedFocusNodes.forEach(sel => {
            this.graph.connectNodesAnimated(`focus-sel-${sel.id}`, pathNode.id, {
              fromSide: "bottom",
              toSide: "top",
              status: "tentative"
            });
          });
        }, i * 60);
      });
    }

    // Render 5 Discovery Focus Branches (available options sprouting below) + Shuffle
    const isMax = state.selectedFocus.length >= 3;
    if (!isMax) {
      if (layout.discoveryNodes && layout.discoveryNodes.length > 0) {
        layout.discoveryNodes.forEach((disc, i) => {
          setTimeout(() => {
            this.graph.createNode({
              id: `focus-disc-${disc.id}`,
              type: "focus-discovery",
              title: disc.title,
              tagline: disc.tagline,
              category: "DISCOVER",
              iconId: disc.iconId,
              x: disc.x,
              y: disc.y,
              width: disc.width,
              height: disc.height,
              data: disc
            });
          }, i * 60);
        });
      }

      // Render Shuffle Button
      if (layout.shuffleNode) {
        setTimeout(() => {
          this.graph.createNode(layout.shuffleNode);
        }, 220);
      }
    }

    setTimeout(() => {
      this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
    }, 450);
  }

  reflowStage3() {
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const isMobile = window.innerWidth <= 768;
    const allPool = PROJECT_FOCUS[activeType.id] || [];
    const pathTypes = ARCHITECTURE_PATHS[activeType.id] || [];

    this.selectedFocusItems = state.selectedFocus.map(id => allPool.find(item => item.id === id)).filter(Boolean);
    this.discoveryFocusItems = state.visibleFocusPool.map(id => allPool.find(item => item.id === id)).filter(Boolean);

    const rootNode = this.graph.getNode(this.rootNodeId);
    const layout = GraphLayout.getStage3Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      activeType,
      this.selectedFocusItems,
      this.discoveryFocusItems,
      pathTypes,
      isMobile
    );

    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    this.graph.updateNodePosition(activeType.id, layout.activeType.x, layout.activeType.y);

    layout.selectedFocusNodes.forEach(sel => {
      this.graph.updateNodePosition(`focus-sel-${sel.id}`, sel.x, sel.y);
    });

    if (layout.growthActionNode && this.graph.hasNode(layout.growthActionNode.id)) {
      this.graph.updateNodePosition(layout.growthActionNode.id, layout.growthActionNode.x, layout.growthActionNode.y);
    }

    if (layout.pathNodes) {
      layout.pathNodes.forEach(p => {
        if (this.graph.hasNode(p.id)) {
          this.graph.updateNodePosition(p.id, p.x, p.y);
        }
      });
    }

    layout.discoveryNodes.forEach(disc => {
      if (this.graph.hasNode(`focus-disc-${disc.id}`)) {
        this.graph.updateNodePosition(`focus-disc-${disc.id}`, disc.x, disc.y);
      }
    });

    if (layout.shuffleNode && this.graph.hasNode(layout.shuffleNode.id)) {
      this.graph.updateNodePosition(layout.shuffleNode.id, layout.shuffleNode.x, layout.shuffleNode.y);
    } else if (!layout.shuffleNode && this.graph.hasNode("focus-shuffle-btn")) {
      // Discovery pool just emptied out (e.g. the 3rd focus item was picked) —
      // remove the now-stale shuffle button rather than leaving it stranded
      // at its last position.
      this.graph.removeNode("focus-shuffle-btn", false);
    }

    this.graph.updateConnections();
    this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
  }

  clearOldFocusNodes() {
    // Remove previous focus and path nodes without destroying root or active type
    const nodesToRemove = [];
    this.graph.nodes.forEach((node, id) => {
      if (id.startsWith("focus-") || id.startsWith("growth-action") || node.type === "path") {
        nodesToRemove.push(id);
      }
    });
    nodesToRemove.forEach(id => this.graph.removeNode(id, false));
    this.graph.connections = (this.graph.connections || []).filter(conn => {
      const gone = nodesToRemove.includes(conn.from) || nodesToRemove.includes(conn.to);
      if (gone && conn.element && conn.element.parentNode) {
        conn.element.parentNode.removeChild(conn.element);
      }
      return !gone;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FOCUS ACTIONS: ADD, REMOVE, SHUFFLE
  // ─────────────────────────────────────────────────────────────

  handleAddFocusItem(node) {
    const focusId = node.data?.id;
    if (!focusId) return;

    const state = store.get();
    if (state.selectedFocus.length >= 3) {
      ui.notify("Maximum 3 focus characteristics allowed.", "warning");
      return;
    }

    store.toggleFocusItem(focusId);
    ui.notify(`Added: ${node.title}`, "info");

    // Animate transition into parallel focus branch
    this.transitionToStage3();
  }

  handleRemoveFocusItem(node) {
    const focusId = node.data?.id;
    if (!focusId) return;

    store.removeFocusItem(focusId);
    ui.notify(`Removed: ${node.title}`, "info");

    this.transitionToStage3();
  }

  handleShuffleFocus() {
    const state = store.get();
    store.shuffleFocus(state.selectedType);
    ui.notify("Discovery pool refreshed", "info");

    this.transitionToStage3();
  }

  getFocusTitles() {
    const state = store.get();
    const pool = PROJECT_FOCUS[state.selectedType] || [];
    return state.selectedFocus.map(id => {
      const item = pool.find(p => p.id === id);
      return item ? item.title : id;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 4: ARCHITECTURE PATH BRANCHING & CONVERGENCE
  // ─────────────────────────────────────────────────────────────

  transitionToStage4() {
    store.goToStage(4);
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathTypes = ARCHITECTURE_PATHS[activeType.id] || [];

    ui.updateStageBadge(4, 6, "ARCHITECTURE PATH");
    ui.showBackButton("← STEP BACK", () => this.handleStepBack());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles()
    });

    // Remove discovery focus nodes and shuffle button
    const discNodesToRemove = [];
    this.graph.nodes.forEach((node, id) => {
      if (id.startsWith("focus-disc-") || id === "focus-shuffle-btn" || id === "growth-action-architecture") {
        discNodesToRemove.push(id);
      }
    });
    discNodesToRemove.forEach(id => this.graph.removeNode(id, true));

    const isMobile = window.innerWidth <= 768;
    const rootNode = this.graph.getNode(this.rootNodeId);
    const allPool = PROJECT_FOCUS[activeType.id] || [];
    this.selectedFocusItems = state.selectedFocus.map(id => allPool.find(item => item.id === id)).filter(Boolean);

    const layout = GraphLayout.getStage4Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      activeType,
      this.selectedFocusItems,
      pathTypes,
      state.selectedArchitecturePath,
      isMobile
    );

    // Update positions of existing nodes
    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    this.graph.updateNodePosition(activeType.id, layout.activeType.x, layout.activeType.y);
    layout.selectedFocusNodes.forEach(sel => {
      this.graph.updateNodePosition(`focus-sel-${sel.id}`, sel.x, sel.y);
    });

    // Determine the source node(s) for the architecture paths:
    // If selected focus nodes exist, architecture paths sprout from the focus group!
    const fromParentId = layout.selectedFocusNodes.length > 0
      ? `focus-sel-${layout.selectedFocusNodes[0].id}`
      : activeType.id;

    // Create 3 Architecture Path nodes with animated connections
    // Create 3 Architecture Path nodes with animated connections from all focus sibling nodes
    layout.pathNodes.forEach((pathNode, i) => {
      setTimeout(() => {
        this.graph.createNode({
          id: pathNode.id,
          type: "path",
          title: pathNode.title,
          category: pathNode.category || "ARCHITECTURE PATH",
          tagline: pathNode.tagline,
          description: pathNode.description,
          x: pathNode.x,
          y: pathNode.y,
          width: pathNode.width,
          height: pathNode.height,
          isSelected: pathNode.isSelected
        });

        this.graph.connectNodesAnimated(fromParentId, pathNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
        if (layout.selectedFocusNodes.length > 0) {
          layout.selectedFocusNodes.forEach(sel => {
            this.graph.connectNodesAnimated(`focus-sel-${sel.id}`, pathNode.id, {
              fromSide: "bottom",
              toSide: "top",
              status: "active"
            });
          });
        } else {
          this.graph.connectNodesAnimated(activeType.id, pathNode.id, {
            fromSide: "bottom",
            toSide: "top",
            status: "active"
          });
        }
      }, i * 100);
    });

    setTimeout(() => {
      this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
    }, 450);
  }

  reflowStage4() {
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathTypes = ARCHITECTURE_PATHS[activeType.id] || [];
    const isMobile = window.innerWidth <= 768;
    const rootNode = this.graph.getNode(this.rootNodeId);
    const allPool = PROJECT_FOCUS[activeType.id] || [];
    this.selectedFocusItems = state.selectedFocus.map(id => allPool.find(item => item.id === id)).filter(Boolean);

    const layout = GraphLayout.getStage4Positions(
      this.camera.width,
      this.camera.height,
      rootNode,
      activeType,
      this.selectedFocusItems,
      pathTypes,
      state.selectedArchitecturePath,
      isMobile
    );

    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    this.graph.updateNodePosition(activeType.id, layout.activeType.x, layout.activeType.y);
    layout.selectedFocusNodes.forEach(sel => {
      this.graph.updateNodePosition(`focus-sel-${sel.id}`, sel.x, sel.y);
    });
    layout.pathNodes.forEach(p => {
      this.graph.updateNodePosition(p.id, p.x, p.y);
    });

    this.graph.updateConnections();
    this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
  }

  handlePathSelect(node) {
    const chosenPathId = node.id;
    store.goToStage(4);
    store.selectArchitecturePath(chosenPathId);

    // Retract discovery nodes and shuffle button if present
    const discNodesToRemove = [];
    this.graph.nodes.forEach((n, id) => {
      if (id.startsWith("focus-disc-") || id === "focus-shuffle-btn" || id === "growth-action-architecture") {
        discNodesToRemove.push(id);
      }
    });
    discNodesToRemove.forEach(id => this.graph.removeNode(id, true));

    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const activePath = pathList.find(p => p.id === chosenPathId);

    // Retract sibling paths
    // Retract sibling paths and remove connections
    pathList.forEach(p => {
      if (p.id !== chosenPathId) {
        this.graph.removeNode(p.id, true);
        const fromParentId = this.selectedFocusItems.length > 0
          ? `focus-sel-${this.selectedFocusItems[0].id}`
          : activeType.id;
        this.graph.removeConnection(fromParentId, p.id);
        this.selectedFocusItems.forEach(sel => {
          this.graph.removeConnection(`focus-sel-${sel.id}`, p.id);
        });
        this.graph.removeConnection(activeType.id, p.id);
      }
    });

    // Update breadcrumb
    // Animate active connection from all focus siblings to chosen path
    if (this.selectedFocusItems.length > 0) {
      this.selectedFocusItems.forEach(sel => {
        this.graph.connectNodesAnimated(`focus-sel-${sel.id}`, chosenPathId, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
      });
    } else {
      this.graph.connectNodesAnimated(activeType.id, chosenPathId, {
        fromSide: "bottom",
        toSide: "top",
        status: "active"
      });
    }

    // Update UI & breadcrumb
    ui.updateStageBadge(4, 6, "ARCHITECTURE PATH");
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: activePath ? activePath.title : chosenPathId
    });

    ui.notify(`Architecture established: ${activePath ? activePath.title : chosenPathId}`, "success");

    // Grow the graph into Stage 5 (Technology Stack) from the locked architecture path.
    setTimeout(() => {
      this.transitionToStage5();
    }, 400);
  }

  // ─────────────────────────────
  // STAGE 5: TECHNOLOGY STACK
  // ─────────────────────────────

  /**
   * Processes raw technology tiers for the chosen path:
   * 1. Eliminates options incompatible with current selections via dependency rules.
   * 2. Prioritizes and sorts remaining options descending by context relevance score.
   */
  getProcessedStage5Tiers(chosenPath) {
    const state = store.get();
    const rawTiers = getStackForPath(chosenPath ? chosenPath.id : null);
    const context = {
      type: state.selectedType,
      focus: state.selectedFocus,
      architecturePath: chosenPath ? chosenPath.id : null,
      stack: state.selectedStack || {}
    };

    return rawTiers.map(tier => {
      // 1. Dependency pruning: filter out options incompatible with current stack
      const compatible = getCompatibleStackOptions(tier, state.selectedStack);
      // 2. Context-aware prioritization: sort options descending by relevance score
      const sorted = RelevanceScorer.sortOptions(compatible, context);
      return {
        ...tier,
        options: sorted
      };
    });
  }

  transitionToStage5() {
    this.resetWorkspaceScroll();
    store.goToStage(5);
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];
    const tiers = this.getProcessedStage5Tiers(chosenPath);

    // Seed the stack structure keyed to this path's tier ids (adapts to any tier naming).
    if ((state.stackTierIds || []).length !== tiers.length) {
      store.initStack(tiers.map(t => t.id));
    }

    ui.updateStageBadge(5, 6, "TECHNOLOGY STACK");
    ui.showBackButton("← STEP BACK", () => this.handleStepBack());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: chosenPath ? chosenPath.title : "",
      stackTitles: this.getStackTitles()
    });

    this.renderStage5(tiers, chosenPath, true);
  }

  /** Reads the current stack selections and returns chosen tech titles in tier order. */
  getStackTitles() {
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];
    const tiers = getStackForPath(chosenPath ? chosenPath.id : null);
    const stack = store.get().selectedStack || {};
    return tiers
      .map(tier => {
        const techId = stack[tier.id];
        if (!techId) return null;
        const opt = tier.options.find(o => o.id === techId);
        return opt ? opt.title : null;
      })
      .filter(Boolean);
  }

  renderStage5(tiers, chosenPath, isInitial = false, selectedNode = null) {
    const state = store.get();
    const isMobile = window.innerWidth <= 768;

    // In-place progressive update: if Stage 5 nodes are already mounted, update without tearing down the DOM
    const nodesMounted = tiers && tiers.length > 0 && this.graph.hasNode(`tier-${tiers[0].id}`);
    if (!isInitial && nodesMounted) {
      this.updateStage5InPlace(tiers, chosenPath, selectedNode);
      return;
    }

    // Initial Stage 5 mount: Remove any prior Stage 5 nodes so mount is clean.
    this.clearPendingRenderTimers();
    this.clearStage5Nodes();

    const rootNode = this.graph.getNode(this.rootNodeId);
    const layout = GraphLayout.getStage5Positions({
      svgWidth: this.camera.width,
      svgHeight: this.camera.height,
      activeTypeConfig: PROJECT_TYPES.find(t => t.id === state.selectedType),
      selectedFocusItems: this.selectedFocusItems,
      chosenPath,
      tiers,
      selectedStack: state.selectedStack || {},
      isMobile
    });

    // Ancestor spine (root + active type + focus siblings + locked path)
    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    if (state.selectedType) {
      this.graph.updateNodePosition(state.selectedType, layout.activeType.x, layout.activeType.y);
    }
    layout.selectedFocusNodes.forEach(sel => {
      if (this.graph.hasNode(`focus-sel-${sel.id}`)) {
        this.graph.updateNodePosition(`focus-sel-${sel.id}`, sel.x, sel.y);
      }
    });
    if (chosenPath) {
      this.graph.updateNodePosition(chosenPath.id, layout.pathNode.x, layout.pathNode.y);
    }

    // Tier headers (staggered materialization)
    layout.tierHeaderNodes.forEach((tierNode, i) => {
      const t = setTimeout(() => {
        if (store.get().stage !== 5) return;
        this.graph.createNode(tierNode);
        if (chosenPath) {
          this.graph.connectNodesAnimated(chosenPath.id, tierNode.id, {
            fromSide: "bottom",
            toSide: "top",
            status: "active"
          });
        }
      }, i * 90);
      this.pendingRenderTimers.push(t);
    });

    // Candidate tech cards + bus conduits from their tier header
    layout.techNodes.forEach((techNode, i) => {
      const t = setTimeout(() => {
        if (store.get().stage !== 5) return;
        this.graph.createNode(techNode);
        this.graph.connectNodesAnimated(`tier-${techNode.tierId}`, techNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: techNode.isSelected ? "active" : "tentative"
        });
      }, 240 + i * 40);
      this.pendingRenderTimers.push(t);
    });

    // Convergence node + fan-in from selected tech cards
    if (layout.convergenceNode) {
      const t = setTimeout(() => {
        if (store.get().stage !== 5) return;
        this.graph.createNode(layout.convergenceNode);
        const stack = store.get().selectedStack || {};
        tiers.forEach(tier => {
          const techId = stack[tier.id];
          if (techId) {
            this.graph.connectNodesAnimated(`stack-${tier.id}-${techId}`, layout.convergenceNode.id, {
              fromSide: "bottom",
              toSide: "top",
              status: "active"
            });
          }
        });
      }, 620);
      this.pendingRenderTimers.push(t);
    }

    const fitT = setTimeout(() => {
      if (store.get().stage !== 5) return;
      this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
    }, 480);
    this.pendingRenderTimers.push(fitT);
  }

  /**
   * Smooth in-place Stage 5 selection transition.
   * Keeps existing nodes continuously visible (no DOM destruction, no blank flash).
   * Animates ancestor illumination, creeping connection draw, selected card glow,
   * and materializes downstream convergence smoothly.
   */
  updateStage5InPlace(tiers, chosenPath, selectedNode = null) {
    const state = store.get();
    const isMobile = window.innerWidth <= 768;
    const stack = state.selectedStack || {};

    // 1. Ancestor sequential subtle light pulse (90ms stagger)
    if (selectedNode && selectedNode.tierId) {
      const ancestors = [
        this.rootNodeId,
        state.selectedType,
        chosenPath ? chosenPath.id : null,
        `tier-${selectedNode.tierId}`
      ].filter(id => id && this.graph.hasNode(id));

      ancestors.forEach((ancId, idx) => {
        setTimeout(() => {
          const el = this.graph.nodesGroup?.querySelector(`[data-node-id="${ancId}"]`);
          if (el) {
            el.classList.remove("node-ancestor-pulse");
            void el.offsetWidth;
            el.classList.add("node-ancestor-pulse");
            setTimeout(() => el.classList.remove("node-ancestor-pulse"), 450);
          }
        }, idx * 90);
      });
    }

    // 2. In-place card state & class updates
    tiers.forEach(tier => {
      const chosenTechId = stack[tier.id];
      const tierHeaderEl = this.graph.nodesGroup?.querySelector(`[data-node-id="tier-${tier.id}"]`);
      if (tierHeaderEl) {
        const inner = tierHeaderEl.querySelector(".tier-header-inner");
        const status = tierHeaderEl.querySelector(".tier-header-status");
        if (chosenTechId) {
          inner?.classList.add("complete");
          if (status) status.textContent = "LOCKED ✓";
        } else {
          inner?.classList.remove("complete");
          if (status) status.textContent = `SELECT 1`;
        }
      }

      tier.options.forEach(opt => {
        const cardId = `stack-${tier.id}-${opt.id}`;
        const cardEl = this.graph.nodesGroup?.querySelector(`[data-node-id="${cardId}"]`);
        if (!cardEl) return;

        const isSelected = opt.id === chosenTechId;
        const bg = cardEl.querySelector(".stack-tech-bg");
        const inner = cardEl.querySelector(".stack-tech-inner");
        const check = cardEl.querySelector(".stack-tech-check");

        if (isSelected) {
          bg?.classList.add("selected");
          inner?.classList.add("selected");
          if (check) check.textContent = "✓";
          cardEl.classList.remove("node--sibling-subdued");

          // Strongest pulse for the node the user just selected
          if (selectedNode && (selectedNode.techId === opt.id || selectedNode.id === opt.id)) {
            cardEl.classList.remove("node-selected-glow");
            void cardEl.offsetWidth;
            cardEl.classList.add("node-selected-glow");
            setTimeout(() => cardEl.classList.remove("node-selected-glow"), 550);
          }
        } else {
          bg?.classList.remove("selected");
          inner?.classList.remove("selected");
          if (check) check.textContent = "+";

          // Sibling cards remain visible, gently subdued (92%) during transition
          if (chosenTechId && selectedNode && selectedNode.tierId === tier.id) {
            cardEl.classList.add("node--sibling-subdued");
            setTimeout(() => cardEl.classList.remove("node--sibling-subdued"), 450);
          } else {
            cardEl.classList.remove("node--sibling-subdued");
          }
        }

        // Update connecting path from tier header to this tech card
        const conn = (this.graph.connections || []).find(
          c => c.from === `tier-${tier.id}` && c.to === cardId
        );
        if (conn && conn.element) {
          if (isSelected) {
            conn.status = "active";
            conn.element.classList.remove("tentative", "unselected");
            conn.element.classList.add("active");

            // Progressive connection stroke drawing toward the newly selected card
            if (selectedNode && (selectedNode.techId === opt.id || selectedNode.id === opt.id)) {
              try {
                const len = conn.element.getTotalLength() || 240;
                conn.element.classList.add("drawing");
                conn.element.style.strokeDasharray = `${len}`;
                conn.element.style.strokeDashoffset = `${len}`;
                void conn.element.offsetWidth;
                conn.element.style.strokeDashoffset = "0";
                setTimeout(() => {
                  conn.element.classList.remove("drawing");
                  conn.element.style.strokeDasharray = "";
                  conn.element.style.strokeDashoffset = "";
                }, 480);
              } catch {
                // fallback
              }
            }
          } else {
            conn.status = "tentative";
            conn.element.classList.remove("active", "drawing");
            conn.element.classList.add("tentative");
            conn.element.style.strokeDasharray = "";
            conn.element.style.strokeDashoffset = "";
          }
        }
      });
    });

    // 3. Downstream convergence node management
    const complete = tiers.every(tier => Boolean(stack[tier.id]));
    const layout = GraphLayout.getStage5Positions({
      svgWidth: this.camera.width,
      svgHeight: this.camera.height,
      activeTypeConfig: PROJECT_TYPES.find(t => t.id === state.selectedType),
      selectedFocusItems: this.selectedFocusItems,
      chosenPath,
      tiers,
      selectedStack: stack,
      isMobile
    });

    const hasConvergence = this.graph.hasNode("growth-action-infrastructure");
    if (complete && !hasConvergence && layout.convergenceNode) {
      this.graph.createNode(layout.convergenceNode);
      const convEl = this.graph.nodesGroup?.querySelector('[data-node-id="growth-action-infrastructure"]');
      if (convEl) {
        convEl.classList.add("growth-action", "materializing");
        setTimeout(() => convEl.classList.remove("materializing"), 500);
      }

      tiers.forEach(tier => {
        const techId = stack[tier.id];
        if (techId) {
          this.graph.connectNodesAnimated(`stack-${tier.id}-${techId}`, layout.convergenceNode.id, {
            fromSide: "bottom",
            toSide: "top",
            status: "active"
          });
        }
      });

      this.camera.contentBounds = layout.contentBounds;
    } else if (!complete && hasConvergence) {
      this.graph.removeNode("growth-action-infrastructure", true);
      this.camera.contentBounds = layout.contentBounds;
    }
  }

  clearStage5Nodes() {
    this.clearPendingRenderTimers();
    const toRemove = [];
    this.graph.nodes.forEach((node, id) => {
      if (id.startsWith("tier-") || id.startsWith("stack-") || id === "growth-action-infrastructure") {
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this.graph.removeNode(id, false));
    if (this.graph.nodesGroup) {
      const lingering = this.graph.nodesGroup.querySelectorAll('[data-node-id^="tier-"], [data-node-id^="stack-"], [data-node-id="growth-action-infrastructure"]');
      lingering.forEach(el => el.parentNode && el.parentNode.removeChild(el));
    }
    // Drop conduits that reference removed stage-5 nodes.
    this.graph.connections = (this.graph.connections || []).filter(conn => {
      const gone = toRemove.includes(conn.from) || toRemove.includes(conn.to);
      if (gone && conn.element && conn.element.parentNode) {
        conn.element.parentNode.removeChild(conn.element);
      }
      return !gone;
    });
  }

  handleStackSelect(node) {
    const tierId = node.tierId;
    const techId = node.techId || node.id;
    if (!tierId || !techId) return;

    store.selectStackTech(tierId, techId);

    const activeType = PROJECT_TYPES.find(t => t.id === store.get().selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === store.get().selectedArchitecturePath) || pathList[0];

    // Self-healing: check if any other tier selection is now incompatible with the new selection
    const currentStack = store.get().selectedStack || {};
    const rawTiers = getStackForPath(chosenPath ? chosenPath.id : null);
    let hadPrunedSelection = false;

    rawTiers.forEach(t => {
      if (t.id !== tierId && currentStack[t.id]) {
        const compat = getCompatibleStackOptions(t, currentStack);
        if (!compat.some(o => o.id === currentStack[t.id])) {
          store.selectStackTech(t.id, null);
          hadPrunedSelection = true;
        }
      }
    });

    const tiers = this.getProcessedStage5Tiers(chosenPath);

    const selected = store.get().selectedStack?.[tierId] === techId;
    ui.notify(`${selected ? "Selected" : "Cleared"}: ${node.title}`, selected ? "success" : "info");

    const currentDomCardCount = this.graph.nodesGroup?.querySelectorAll('.stack-tech-inner')?.length || 0;
    const expectedCardCount = tiers.reduce((acc, t) => acc + t.options.length, 0);
    const optionsChanged = tiers.some(tier =>
      tier.options.some(opt => !this.graph.hasNode(`stack-${tier.id}-${opt.id}`))
    );
    const requiresFullRemount = hadPrunedSelection || currentDomCardCount !== expectedCardCount || optionsChanged;

    // In-place progressive update when card counts match; full remount when options are pruned
    this.renderStage5(tiers, chosenPath, requiresFullRemount, node);

    ui.updateBreadcrumb({
      projectName: store.get().projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: chosenPath ? chosenPath.title : "",
      stackTitles: this.getStackTitles()
    });
  }

  // ─────────────────────────────
  // STAGE 6: INFRASTRUCTURE & DEPLOYMENT
  // ─────────────────────────────

  transitionToStage6() {
    this.resetWorkspaceScroll();
    this.clearStage5Nodes();
    store.goToStage(6);
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];

    ui.updateStageBadge(6, 7, "INFRASTRUCTURE & DEPLOYMENT", store.getDerivedIndicator());
    ui.showBackButton("← STEP BACK", () => this.handleStepBack());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: chosenPath ? chosenPath.title : "",
      stackTitles: this.getStackTitles(),
      infraTitles: this.getInfraTitles()
    });

    this.syncProjectGraph();
    this.renderStage6();
    ui.notify("Stage 6: Infrastructure & Deployment Unlocked", "info");
  }

  getInfraTitles() {
    const state = store.get();
    const infra = state.selectedInfra || {};
    const titles = [];

    Object.entries(infra).forEach(([groupId, optVal]) => {
      const group = getDecisionGroup(groupId);
      if (!group) return;
      const optIds = Array.isArray(optVal) ? optVal : (optVal ? [optVal] : []);
      optIds.forEach(id => {
        const opt = group.options.find(o => o.id === id);
        if (opt) titles.push(opt.title);
      });
    });

    return titles;
  }

  renderStage6() {
    const state = store.get();
    const isMobile = window.innerWidth <= 768;

    // Clean up all prior Stage 5 and Stage 6 nodes so Stage 6 is completely fresh
    this.clearStage5Nodes();
    this.clearStage6Nodes();

    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];

    const tiers = getStackForPath(chosenPath ? chosenPath.id : null);
    const selectedStackTechs = [];
    tiers.forEach(tier => {
      const techId = state.selectedStack?.[tier.id];
      if (techId) {
        const opt = tier.options.find(o => o.id === techId);
        if (opt) selectedStackTechs.push({ ...opt, tierId: tier.id });
      }
    });

    const infraContext = {
      type: activeType.id,
      focus: state.selectedFocus,
      architecturePath: chosenPath ? chosenPath.id : null,
      stack: state.selectedStack || {}
    };

    const infraGroupIds = getInfraGroupsForType(activeType.id);
    const infraGroups = infraGroupIds.map(id => {
      const group = getDecisionGroup(id);
      if (!group) return null;

      // 1. Sort options by context relevance score descending (most applicable on top!)
      const sortedOptions = RelevanceScorer.sortOptions(group.options, infraContext);

      // 2. Check if group has shuffle pool (> 3 options)
      const hasShuffle = group.options.length > 3;
      let visibleOptions = sortedOptions;

      if (hasShuffle && state.visibleInfraPool && state.visibleInfraPool[group.id]) {
        const poolIds = state.visibleInfraPool[group.id];
        visibleOptions = poolIds.map(id => sortedOptions.find(o => o.id === id)).filter(Boolean);
        if (visibleOptions.length < 3) {
          const missing = sortedOptions.filter(o => !visibleOptions.some(v => v.id === o.id));
          visibleOptions = [...visibleOptions, ...missing.slice(0, 3 - visibleOptions.length)];
        }
      } else if (hasShuffle) {
        visibleOptions = sortedOptions.slice(0, 3);
      }

      return {
        ...group,
        hasShuffle,
        options: visibleOptions
      };
    }).filter(Boolean);

    const layout = GraphLayout.getStage6Positions({
      svgWidth: this.camera.width,
      svgHeight: this.camera.height,
      activeTypeConfig: activeType,
      selectedFocusItems: this.selectedFocusItems,
      chosenPath,
      selectedStackTechs,
      infraGroups,
      selectedInfra: state.selectedInfra || {},
      isMobile
    });

    // Update ancestor spine positions
    this.graph.updateNodePosition(this.rootNodeId, layout.root.x, layout.root.y);
    if (state.selectedType) {
      this.graph.updateNodePosition(state.selectedType, layout.activeType.x, layout.activeType.y);
    }
    layout.selectedFocusNodes.forEach(sel => {
      if (this.graph.hasNode(`focus-sel-${sel.id}`)) {
        this.graph.updateNodePosition(`focus-sel-${sel.id}`, sel.x, sel.y);
      }
    });
    if (chosenPath && this.graph.hasNode(chosenPath.id)) {
      this.graph.updateNodePosition(chosenPath.id, layout.pathNode.x, layout.pathNode.y);
    }

    // Materialize Stage 5 locked stack ancestor node
    if (layout.stackAncestorNode) {
      this.graph.createNode(layout.stackAncestorNode);
      if (chosenPath && this.graph.hasNode(chosenPath.id)) {
        this.graph.connectNodesAnimated(chosenPath.id, layout.stackAncestorNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: "active"
        });
      }
    }

    // Materialize infra headers fanned out below stack ancestor
    const infraParentId = layout.stackAncestorNode?.id || chosenPath?.id;
    layout.infraHeaderNodes.forEach((headerNode, i) => {
      setTimeout(() => {
        this.graph.createNode(headerNode);
        if (infraParentId && this.graph.hasNode(infraParentId)) {
          this.graph.connectNodesAnimated(infraParentId, headerNode.id, {
            fromSide: "bottom",
            toSide: "top",
            status: "active"
          });
        }
      }, i * 90);
    });

    // Materialize infra option cards
    layout.infraOptionNodes.forEach((optNode, i) => {
      const timer = setTimeout(() => {
        if (store.get().stage !== 6) return;
        this.graph.createNode(optNode);
        this.graph.connectNodesAnimated(`infra-header-${optNode.groupId}`, optNode.id, {
          fromSide: "bottom",
          toSide: "top",
          status: optNode.isSelected ? "active" : "tentative"
        });
      }, Math.min(200, 40 + i * 15));
      this.pendingRenderTimers.push(timer);
    });

    // Convergence node to Stage 7 Blueprint
    const convergenceDelay = Math.min(260, 60 + layout.infraOptionNodes.length * 15);
    const fitBoundsDelay = convergenceDelay + 50;

    if (layout.convergenceNode) {
      const timer = setTimeout(() => {
        if (store.get().stage !== 6) return;
        this.graph.createNode(layout.convergenceNode);
        // Connect selected infra cards to convergence node
        layout.infraOptionNodes.forEach(optNode => {
          if (optNode.isSelected) {
            this.graph.connectNodesAnimated(optNode.id, layout.convergenceNode.id, {
              fromSide: "bottom",
              toSide: "top",
              status: "active"
            });
          }
        });
      }, convergenceDelay);
      this.pendingRenderTimers.push(timer);
    }

    const boundsTimer = setTimeout(() => {
      if (store.get().stage !== 6) return;
      this.camera.fitBounds(layout.contentBounds, isMobile ? 24 : 50);
    }, fitBoundsDelay);
    this.pendingRenderTimers.push(boundsTimer);
  }

  reflowStage6() {
    this.renderStage6();
  }

  clearStage6Nodes() {
    const toRemove = [];
    this.graph.nodes.forEach((node, id) => {
      if (id.startsWith("infra-header-") || id.startsWith("infra-opt-") || id === "growth-action-blueprint" || id === "stage5-stack-ancestor") {
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this.graph.removeNode(id, false));
    this.graph.connections = (this.graph.connections || []).filter(conn => {
      const gone = toRemove.includes(conn.from) || toRemove.includes(conn.to);
      if (gone && conn.element && conn.element.parentNode) {
        conn.element.parentNode.removeChild(conn.element);
      }
      return !gone;
    });
  }

  handleInfraSelect(node) {
    const groupId = node.groupId;
    const optionId = node.optionId || node.id;
    if (!groupId || !optionId) return;

    const group = getDecisionGroup(groupId);
    const isMulti = node.selectionMode === "multiple" || (group && group.selectionMode === "multiple");

    store.toggleInfraOption(groupId, optionId, isMulti);

    // Sync into projectGraph
    const currentVal = store.get().selectedInfra?.[groupId];
    const isSelected = Array.isArray(currentVal) ? currentVal.includes(optionId) : currentVal === optionId;

    if (isSelected) {
      const parentId = store.get().selectedArchitecturePath || "root-project";
      projectGraph.selectOption(groupId, optionId, parentId);
    } else {
      projectGraph.deselectOption(groupId, optionId);
    }

    ui.notify(`${isSelected ? "Configured" : "Cleared"}: ${node.title || optionId}`, isSelected ? "success" : "info");

    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];

    this.renderStage6();

    ui.updateStageBadge(6, 7, "INFRASTRUCTURE & DEPLOYMENT", store.getDerivedIndicator());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: chosenPath ? chosenPath.title : "",
      stackTitles: this.getStackTitles(),
      infraTitles: this.getInfraTitles()
    });
  }

  handleShuffleInfraGroup(node) {
    const groupId = node.groupId || node.id?.replace("infra-header-", "");
    if (!groupId) return;
    store.shuffleInfraGroup(groupId);
    ui.notify("Shuffled alternative infrastructure options", "info");
    this.renderStage6();
  }

  // ─────────────────────────────
  // STAGE 7: FINAL PROJECT BLUEPRINT
  // ─────────────────────────────

  transitionToStage7() {
    this.resetWorkspaceScroll();
    store.goToStage(7);
    const state = store.get();
    const activeType = PROJECT_TYPES.find(t => t.id === state.selectedType) || PROJECT_TYPES[0];
    const pathList = ARCHITECTURE_PATHS[activeType.id] || [];
    const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath) || pathList[0];

    ui.updateStageBadge(7, 7, "PROJECT BLUEPRINT", store.getDerivedIndicator());
    ui.showBackButton("← BACK TO ARCHITECTURE", () => this.handleStepBack());
    ui.updateBreadcrumb({
      projectName: state.projectName,
      type: activeType.title,
      focusTitles: this.getFocusTitles(),
      architecturePath: chosenPath ? chosenPath.title : "",
      stackTitles: this.getStackTitles(),
      infraTitles: this.getInfraTitles()
    });

    this.syncProjectGraph();
    this.renderStage7();
    ui.notify("PROJECT BLUEPRINT SYNTHESIZED — Full Architectural Manifest", "success");
  }

  renderStage7() {
    this.syncProjectGraph();
    const isMobile = window.innerWidth <= 768;

    // Clear dynamic workspace nodes
    this.clearAllWorkspaceNodes();

    const graphNodes = projectGraph.getNodes();
    const connections = projectGraph.getConnections();
    const layout = GraphLayout.getStage7Positions({
      svgWidth: this.camera.width,
      svgHeight: this.camera.height,
      graphNodes,
      connections,
      isMobile
    });

    // Enable interactive pan/zoom canvas and mount floating HUD controls
    const workspaceEl = document.querySelector(".workspace") || (this.svg && this.svg.parentElement);
    this.camera.enableStage7Canvas(workspaceEl, layout.contentBounds);

    const rootNode = layout.blueprintNodes.find(n => n.id === "root-project" || n.type === "root" || n.depth === 0);
    const primaryBranches = layout.blueprintNodes.filter(n => n.depth === 1);
    this.camera.focusRoot(rootNode, primaryBranches);

    // Render blueprint nodes
    layout.blueprintNodes.forEach((bpNode, i) => {
      setTimeout(() => {
        this.graph.createNode(bpNode);
      }, i * 25);
    });

    // Draw connection lines between related nodes
    setTimeout(() => {
      connections.forEach(conn => {
        if (this.graph.hasNode(conn.fromNodeId) && this.graph.hasNode(conn.toNodeId)) {
          const isCross = conn.connectionType === "cross_link";
          this.graph.connectNodesAnimated(conn.fromNodeId, conn.toNodeId, {
            id: conn.id,
            fromSide: isCross ? "right" : "bottom",
            toSide: isCross ? "left" : "top",
            status: "active",
            edgeType: conn.edgeType || (isCross ? "relationship" : "dependency"),
            connectionType: conn.connectionType || "hierarchy",
            label: conn.label || ""
          });
        }
      });
      // DEFAULT camera state: Anchored on PROJECT ROOT & major pillars.
      // Subtrees extend outward/downward into the canvas. Decoupled from [FIT].
      this.camera.focusRoot(rootNode, primaryBranches);
    }, layout.blueprintNodes.length * 25 + 80);
  }

  reflowStage7() {
    this.renderStage7();
  }

  clearAllWorkspaceNodes() {
    const allIds = Array.from(this.graph.nodes.keys());
    allIds.forEach(id => this.graph.removeNode(id, false));
    this.graph.clearConnections();
  }

  handleInspectBlueprintNode(node) {
    if (this.camera && this.camera.wasDragging) return;
    if (this.camera && typeof this.camera.focusNode === "function") {
      this.camera.focusNode(node.id);
    }
    ui.showNodeInspector(node);
  }

  syncProjectGraph() {
    const state = store.get();
    projectGraph.syncFromLegacyState(state, {
      projectTypesData: { ROOT_NODE_DEFAULT, PROJECT_TYPES },
      projectFocusData: { PROJECT_FOCUS },
      architecturePathsData: { ARCHITECTURE_PATHS },
      technologyStacksData: { getStackForPath }
    });

    // Also sync selected infrastructure
    const infra = state.selectedInfra || {};
    Object.entries(infra).forEach(([groupId, optVal]) => {
      const group = getDecisionGroup(groupId);
      if (!group) return;
      const optIds = Array.isArray(optVal) ? optVal : (optVal ? [optVal] : []);
      const parentId = state.selectedArchitecturePath || "root-project";
      optIds.forEach(optId => {
        const expectedId = nodeIdForOption(groupId, optId);
        if (!projectGraph.hasNode(expectedId)) {
          projectGraph.selectOption(groupId, optId, parentId);
        }
      });
    });
  }

  selectRecursiveOption(groupId, optionId, parentNodeId = null) {
    this.syncProjectGraph();
    const node = projectGraph.selectOption(groupId, optionId, parentNodeId);
    store.set(s => {
      const rec = { ...(s.selectedRecursive || {}) };
      if (!rec[groupId]) rec[groupId] = [];
      if (!rec[groupId].includes(optionId)) rec[groupId] = [...rec[groupId], optionId];
      return { selectedRecursive: rec };
    });
    return node;
  }

  deselectRecursiveOption(groupId, optionId) {
    const removed = projectGraph.deselectOption(groupId, optionId);
    store.set(s => {
      const rec = { ...(s.selectedRecursive || {}) };
      if (rec[groupId]) {
        rec[groupId] = rec[groupId].filter(id => id !== optionId);
      }
      return { selectedRecursive: rec };
    });
    return removed;
  }

  expandNodeSubtree(nodeId) {
    const created = projectGraph.expandNodeSubtree(nodeId);
    if (created && created.length > 0) {
      ui.notify(`EXPANDED: ${created.length} architectural modules mapped`, "info");
      if (store.get().stage === 7) {
        this.renderStage7();
      }
    }
    return created;
  }

  expandFeatureConcept(focusOrParentId, featureId) {
    const featurePath = findFeatureById(featureId);
    if (!featurePath) return [];
    const created = projectGraph.expandFeaturePath(focusOrParentId, featurePath);
    if (created && created.length > 0) {
      ui.notify(`EXPLORATION PATH: ${created.length} feature concepts mapped`, "info");
      if (store.get().stage === 7) {
        this.renderStage7();
      }
    }
    return created;
  }

  exploreNodeFeatures(nodeId) {
    const state = store.get();
    const typeId = state.selectedType || "website";
    const node = projectGraph.getNode(nodeId);
    if (!node) return [];

    const paths = getExplorationPathsForContext(typeId, [node.id, ...(state.selectedFocus || [])]);
    let allCreated = [];
    paths.forEach(p => {
      const created = projectGraph.expandFeaturePath(node.id, p);
      allCreated = allCreated.concat(created);
    });

    if (allCreated.length > 0) {
      ui.notify(`BRAINSTORMING: ${allCreated.length} feature concepts explored`, "info");
      if (store.get().stage === 7) {
        this.renderStage7();
      }
    }
    return allCreated;
  }

  // ─────────────────────────────────────────────────────────────
  // STEP BACK NAVIGATION (Decisions retreat without wiping canvas)
  // ─────────────────────────────────────────────────────────────

  handleStepBack() {
    const currentStage = store.get().stage;
    const state = store.get();

    if (currentStage === 7) {
      // Step back from Final Blueprint returns to Stage 6 (Infrastructure)
      const workspaceEl = document.querySelector(".workspace") || (this.svg && this.svg.parentElement);
      this.camera.disableStage7Canvas(workspaceEl);
      this.clearAllWorkspaceNodes();
      store.goToStage(6);
      this.transitionToStage6();
      return;
    }

    if (currentStage === 6) {
      // If any infrastructure choices exist, clear them first (stay in Stage 6)
      const hasInfraChoice = Object.values(state.selectedInfra || {}).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v));
      this.clearStage6Nodes();
      if (hasInfraChoice) {
        store.clearAllInfra();
        this.transitionToStage6();
      } else {
        store.goToStage(5);
        this.transitionToStage5();
      }
      return;
    }

    if (currentStage === 5) {
      // Step back from Stack: clear stack choices first; if already empty, retreat to Stage 4.
      const hasStackChoice = Object.values(state.selectedStack || {}).some(Boolean);
      this.clearStage5Nodes();
      if (hasStackChoice) {
        store.clearAllStack();
        this.transitionToStage5();
      } else {
        store.clearArchitecturePathSelection();
        const pathList = ARCHITECTURE_PATHS[state.selectedType] || [];
        pathList.forEach(p => this.graph.removeNode(p.id, false));
        store.goToStage(4);
        this.transitionToStage4();
      }
      return;
    }

    if (currentStage === 4) {
      if (state.selectedArchitecturePath) {
        // Step back from selected Architecture Path to Architecture Path selection
        store.clearArchitecturePathSelection();
        const pathList = ARCHITECTURE_PATHS[state.selectedType] || [];
        pathList.forEach(p => this.graph.removeNode(p.id, false));
        this.transitionToStage4();
      } else {
        // Step back from Architecture to Focus
        store.clearArchitecturePathSelection();
        // Remove path nodes
        const pathList = ARCHITECTURE_PATHS[state.selectedType] || [];
        pathList.forEach(p => this.graph.removeNode(p.id, false));

        this.transitionToStage3();
      }
    } else if (currentStage === 3) {
      // Step back from Focus to Type
      this.clearOldFocusNodes();
      store.clearTypeSelection();
      this.transitionToStage2();
    } else if (currentStage === 2) {
      // Step back from Type to Name
      PROJECT_TYPES.forEach(t => {
        this.graph.removeNode(t.id, false);
      });
      this.graph.clearConnections();
      store.goToStage(1);

      ui.hideBackButton();
      ui.updateStageBadge(1, 6, "PROJECT NAME");
      ui.updateBreadcrumb({ projectName: "" });

      // Unlock input
      const input = document.getElementById("bp-project-name-input");
      const btn = document.getElementById("bp-btn-begin");
      if (input) {
        input.removeAttribute("disabled");
        input.focus();
      }
      if (btn) {
        btn.removeAttribute("disabled");
        const span = btn.querySelector("span");
        if (span) {
          const cfg = THEME_CONFIGS[store.get().theme] || THEME_CONFIGS.blueprint;
          span.textContent = cfg.buttonText || cfg.buttonLabel || "BUILD ARCHITECTURE";
        }
      }

      const pos = GraphLayout.getRootPosition(this.camera.width, this.camera.height, ROOT_NODE_DEFAULT.width, ROOT_NODE_DEFAULT.height);
      this.graph.updateNodePosition(this.rootNodeId, pos.x, pos.y);
      this.camera.reset();
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const app = new DevPathApp();
  app.init();
});

export const app = new DevPathApp();
