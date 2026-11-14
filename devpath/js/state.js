/**
 * DEVPATH // Central Application State
 * Reactive state store with subscriber notifications, theme persistence, and Stage 3 Focus / Stage 4 Architecture.
 */

import { PROJECT_FOCUS } from "./data/projectFocus.js";
import { projectGraph } from "./data/projectGraph.js";

const STORAGE_THEME_KEY = "devpath_theme";

function getStoredTheme() {
  try {
    const val = localStorage.getItem(STORAGE_THEME_KEY);
    if (val === "root" || val === "blueprint") {
      return val;
    }
    // Also check legacy storage key
    const legacy = localStorage.getItem("project_blueprint_theme");
    if (legacy === "root" || legacy === "blueprint") {
      return legacy;
    }
  } catch (err) {
    console.warn("[StateStore]: localStorage inaccessible, defaulting to blueprint.", err);
  }
  return "blueprint";
}

class StateStore {
  constructor() {
    this.initialState = {
      theme: getStoredTheme(), // "blueprint" | "root"
      projectName: "",
      stage: 1, // Logical milestone: 1: Name, 2: Type, 3: Focus, 4: Architecture Path, 5: Stack, 6: Infra, 7: Blueprint
      isConfigured: false,
      activeContextId: "root-project", // Current frontier in the project graph
      activeNodeId: "root-project",
      selectedType: null,
      selectedFocus: [], // Array of up to 3 selected IDs
      visibleFocusPool: [], // Array of 5 currently visible discovery branch IDs
      seenFocusHistory: [], // Array of IDs seen so far to prevent immediate repeats
      selectedArchitecturePath: null,
      selectedPath: [],
      selectedStack: {}, // Stage 5: { [tierId]: techId | null } keyed to the active architecture path
      stackTierIds: [], // Ordered tier ids for the active architecture path
      selectedInfra: {}, // Stage 6: { [groupId]: optionId | optionId[] }
      visibleInfraPool: {}, // Stage 6: { [groupId]: optionId[] }
      seenInfraHistory: {}, // Stage 6: { [groupId]: optionId[] }
      selectedRecursive: {}, // { [groupId]: optionId[] }
      history: [], // Stack of decision points for backward stepping
      isCompleted: false,
      error: null,
      // Stage 1 foundation metadata (canonical vocabulary - data-model ready)
      projectDescription: "",
      projectGoal: "",
      projectProblem: "",
      projectVision: "",
      projectCoreIdea: "",
      projectScope: "",           // "small" | "medium" | "large" | ""
      projectConstraints: []      // freeform constraint strings
    };

    this.state = { ...this.initialState };
    this.subscribers = new Set();
  }

  get() {
    return this.state;
  }

  set(updater) {
    const prevState = { ...this.state };
    if (typeof updater === "function") {
      this.state = { ...this.state, ...updater(this.state) };
    } else {
      this.state = { ...this.state, ...updater };
    }

    if (this.state.theme !== prevState.theme) {
      try {
        localStorage.setItem(STORAGE_THEME_KEY, this.state.theme);
      } catch (err) {
        console.warn("[StateStore]: Failed to persist theme to localStorage", err);
      }
    }

    this.notify(this.state, prevState);
  }

  setTheme(theme) {
    if (theme !== "blueprint" && theme !== "root") return;
    this.set({ theme });
  }

  setFoundationMeta(field, value) {
    const validFields = [
      "projectDescription",
      "projectGoal",
      "projectProblem",
      "projectVision",
      "projectCoreIdea",
      "projectScope",
      "projectConstraints"
    ];
    if (validFields.includes(field)) {
      this.set({ [field]: value });
    }
  }

  selectType(typeId) {
    this.set({
      selectedType: typeId,
      selectedFocus: [],
      visibleFocusPool: [],
      selectedArchitecturePath: null,
      selectedPath: [typeId]
    });
    this.initFocusPool(typeId);
  }

  clearTypeSelection() {
    this.set({
      selectedType: null,
      selectedFocus: [],
      visibleFocusPool: [],
      selectedArchitecturePath: null,
      selectedPath: []
    });
  }

  initFocusPool(typeId) {
    const pool = PROJECT_FOCUS[typeId] || [];
    const allIds = pool.map(item => item.id);
    const initial5 = allIds.slice(0, 5);

    this.set({
      visibleFocusPool: initial5,
      seenFocusHistory: [...initial5],
      selectedFocus: []
    });
  }

  toggleFocusItem(itemId) {
    this.set(s => {
      const isSelected = s.selectedFocus.includes(itemId);
      const pool = PROJECT_FOCUS[s.selectedType] || [];
      const allIds = pool.map(item => item.id);

      if (isSelected) {
        // Deselecting: remove from selectedFocus, restore eligibility for discovery
        const nextSelected = s.selectedFocus.filter(id => id !== itemId);
        const remainingVisible = s.visibleFocusPool.filter(id => !nextSelected.includes(id));
        const available = allIds.filter(id => !nextSelected.includes(id) && !remainingVisible.includes(id));
        const needed = 5 - remainingVisible.length;
        const replacements = available.slice(0, Math.max(0, needed));
        const nextVisible = [...remainingVisible, ...replacements];

        return {
          selectedFocus: nextSelected,
          visibleFocusPool: nextVisible
        };
      } else {
        if (s.selectedFocus.length >= 3) {
          return {}; // Maximum 3 items allowed
        }
        const nextSelected = [...s.selectedFocus, itemId];

        // Immediately remove newly selected item from visible discovery pool
        const remainingVisible = s.visibleFocusPool.filter(id => id !== itemId && !nextSelected.includes(id));

        // Replenish discovery cards so 5 unselected options remain visible
        const available = allIds.filter(id => !nextSelected.includes(id) && !remainingVisible.includes(id));
        let nextVisible = [...remainingVisible];
        while (available.length > 0 && nextVisible.length < 5) {
          nextVisible.push(available.shift());
        }

        return {
          selectedFocus: nextSelected,
          visibleFocusPool: nextVisible
        };
      }
    });
  }

  removeFocusItem(itemId) {
    this.set(s => ({
      selectedFocus: s.selectedFocus.filter(id => id !== itemId)
    }));
    this.toggleFocusItem(itemId);
  }

  shuffleFocus(typeId) {
    this.set(s => {
      const activeTypeId = typeId || s.selectedType;
      const pool = PROJECT_FOCUS[activeTypeId] || [];
      const allIds = pool.map(item => item.id);

      // Invariant: Selected focus items must NEVER appear in discovery choices
      const unselected = allIds.filter(id => !s.selectedFocus.includes(id));

      if (unselected.length === 0) {
        return { visibleFocusPool: [] };
      }

      // Candidates not yet seen in current exhaustion cycle
      const seen = s.seenFocusHistory || [];
      const unseen = unselected.filter(id => !seen.includes(id));

      let next5 = [];
      let nextSeen = [...seen];

      if (unseen.length >= 5) {
        // Draw 5 unseen candidates
        next5 = unseen.slice(0, 5);
        nextSeen = [...nextSeen, ...next5];
      } else if (unseen.length > 0) {
        // Exhaust remaining unseen items, then reset cycle for the rest
        next5 = [...unseen];
        const needed = 5 - next5.length;
        const poolToRefill = unselected.filter(id => !next5.includes(id) && !s.visibleFocusPool.includes(id));
        const refill = poolToRefill.slice(0, needed);
        next5 = [...next5, ...refill];
        nextSeen = [...next5];
      } else {
        // Cycle fully exhausted: reset and draw from unselected not currently visible
        const candidates = unselected.filter(id => !s.visibleFocusPool.includes(id));
        const poolToUse = candidates.length >= 5 ? candidates : unselected;
        next5 = poolToUse.slice(0, Math.min(5, unselected.length));
        nextSeen = [...next5];
      }

      // Absolute safety guarantee: filter out any selected items
      const safeNext5 = next5.filter(id => !s.selectedFocus.includes(id));

      return {
        visibleFocusPool: safeNext5,
        seenFocusHistory: Array.from(new Set(nextSeen))
      };
    });
  }

  shuffleInfraGroup(groupId) {
    this.set(s => {
      const group = (window.DevPath?.DECISION_GROUPS || {})[groupId];
      if (!group || !group.options || group.options.length <= 3) {
        return {};
      }

      const allIds = group.options.map(o => o.id);
      const batchSize = Math.min(3, allIds.length);
      const currentVisible = (s.visibleInfraPool?.[groupId] && s.visibleInfraPool[groupId].length > 0)
        ? s.visibleInfraPool[groupId]
        : allIds.slice(0, batchSize);
      const seen = (s.seenInfraHistory?.[groupId] && s.seenInfraHistory[groupId].length > 0)
        ? s.seenInfraHistory[groupId]
        : [...currentVisible];

      let unseen = allIds.filter(id => !seen.includes(id));
      let nextBatch = [];
      let nextSeen = [...seen];

      if (unseen.length >= batchSize) {
        nextBatch = unseen.slice(0, batchSize);
        nextSeen = [...nextSeen, ...nextBatch];
      } else if (unseen.length > 0) {
        nextBatch = [...unseen];
        const remainingNeeded = batchSize - nextBatch.length;
        const refill = allIds.filter(id => !nextBatch.includes(id) && !currentVisible.includes(id));
        const additional = refill.length >= remainingNeeded
          ? refill.slice(0, remainingNeeded)
          : allIds.filter(id => !nextBatch.includes(id)).slice(0, remainingNeeded);
        nextBatch = [...nextBatch, ...additional];
        nextSeen = [...nextBatch];
      } else {
        const candidates = allIds.filter(id => !currentVisible.includes(id));
        const poolToUse = candidates.length >= batchSize ? candidates : allIds;
        nextBatch = poolToUse.slice(0, batchSize);
        nextSeen = [...nextBatch];
      }

      return {
        visibleInfraPool: {
          ...(s.visibleInfraPool || {}),
          [groupId]: nextBatch
        },
        seenInfraHistory: {
          ...(s.seenInfraHistory || {}),
          [groupId]: Array.from(new Set(nextSeen))
        }
      };
    });
  }

  clearFocusSelection() {
    this.set({ selectedFocus: [] });
  }

  selectArchitecturePath(pathId) {
    this.set(s => ({
      selectedArchitecturePath: pathId,
      selectedPath: [s.selectedType, pathId].filter(Boolean)
    }));
  }

  clearArchitecturePathSelection() {
    this.set(s => ({
      selectedArchitecturePath: null,
      selectedStack: {},
      stackTierIds: [],
      selectedPath: [s.selectedType].filter(Boolean)
    }));
  }

  // ─────────────────────────────
  // STAGE 5: TECHNOLOGY STACK
  // ─────────────────────────────

  /**
   * Seeds an empty selectedStack keyed to the given ordered tier ids.
   * Adapts to whatever tier structure the active architecture path uses.
   */
  initStack(tierIds = []) {
    const nextStack = {};
    tierIds.forEach(tierId => { nextStack[tierId] = null; });
    this.set({ selectedStack: nextStack, stackTierIds: [...tierIds] });
  }

  /**
   * Selects a technology within a tier. Leads to a permanent graph node.
   * Never touches selectedPath / selectedArchitecturePath (Stage 4 decision stays intact).
   */
  selectStackTech(tierId, techId) {
    if (!tierId) return;
    this.set(s => {
      const nextStack = { ...(s.selectedStack || {}) };
      // Toggle off if the same tech is re-selected, otherwise set it.
      nextStack[tierId] = nextStack[tierId] === techId ? null : techId;
      return { selectedStack: nextStack };
    });
  }

  /** Clears a single tier selection. */
  clearStackTech(tierId) {
    this.set(s => {
      const nextStack = { ...(s.selectedStack || {}) };
      if (tierId in nextStack) nextStack[tierId] = null;
      return { selectedStack: nextStack };
    });
  }

  /** Clears every tier selection but keeps the tier structure. */
  clearAllStack() {
    this.set(s => {
      const nextStack = {};
      (s.stackTierIds || Object.keys(s.selectedStack || {})).forEach(tierId => {
        nextStack[tierId] = null;
      });
      return { selectedStack: nextStack };
    });
  }

  /** True when every specified tier has a chosen technology. */
  isStackComplete(tierIds = null) {
    const s = this.state;
    const tiers = tierIds || s.stackTierIds || Object.keys(s.selectedStack || {});
    if (!tiers || tiers.length === 0) return false;
    return tiers.every(tierId => Boolean(s.selectedStack?.[tierId]));
  }

  // ─────────────────────────────
  // STAGE 6: INFRASTRUCTURE & DEPLOYMENT
  // ─────────────────────────────

  /**
   * Toggles or sets an infrastructure option in selectedInfra.
   * Respects isMultiple selection mode.
   */
  toggleInfraOption(groupId, optionId, isMultiple = false) {
    if (!groupId || !optionId) return;
    this.set(s => {
      const nextInfra = { ...(s.selectedInfra || {}) };
      if (isMultiple) {
        const currentList = Array.isArray(nextInfra[groupId]) ? [...nextInfra[groupId]] : (nextInfra[groupId] ? [nextInfra[groupId]] : []);
        if (currentList.includes(optionId)) {
          nextInfra[groupId] = currentList.filter(id => id !== optionId);
        } else {
          nextInfra[groupId] = [...currentList, optionId];
        }
      } else {
        nextInfra[groupId] = nextInfra[groupId] === optionId ? null : optionId;
      }
      return { selectedInfra: nextInfra };
    });
  }

  clearAllInfra() {
    this.set({ selectedInfra: {} });
  }

  isInfraConfigured() {
    const s = this.state;
    const infra = s.selectedInfra || {};
    return Object.values(infra).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v));
  }

  goToStage(stageNumber) {
    this.set(s => {
      const updates = { stage: stageNumber };
      if (stageNumber <= 5) {
        // Leaving Stage 6+ clears infrastructure selections
        updates.selectedInfra = {};
      }
      if (stageNumber <= 4) {
        // Leaving Stage 5+ clears the technology stack (Stage 4 decision stays intact).
        updates.selectedStack = {};
        updates.stackTierIds = [];
      }
      if (stageNumber <= 3) {
        updates.selectedArchitecturePath = null;
        updates.selectedPath = [s.selectedType].filter(Boolean);
        updates.activeContextId = s.selectedType || "root-project";
        updates.activeNodeId = s.selectedType || "root-project";
      }
      if (stageNumber <= 2) {
        updates.selectedFocus = [];
        updates.visibleFocusPool = [];
        updates.selectedArchitecturePath = null;
        updates.selectedPath = [s.selectedType].filter(Boolean);
        updates.activeContextId = s.selectedType || "root-project";
        updates.activeNodeId = s.selectedType || "root-project";
      }
      if (stageNumber <= 1) {
        updates.selectedType = null;
        updates.selectedFocus = [];
        updates.visibleFocusPool = [];
        updates.selectedArchitecturePath = null;
        updates.isConfigured = false;
        updates.selectedPath = [];
        updates.activeContextId = "root-project";
        updates.activeNodeId = "root-project";
        updates.projectDescription = "";
        updates.projectGoal = "";
        updates.projectProblem = "";
        updates.projectVision = "";
        updates.projectCoreIdea = "";
        updates.projectScope = "";
        updates.projectConstraints = [];
      }
      return updates;
    });
  }

  setActiveContext(contextId, nodeId = null) {
    this.set({
      activeContextId: contextId,
      activeNodeId: nodeId || contextId
    });
  }

  stepBack() {
    const s = this.state;
    if (s.stage === 7) {
      // Step back from Final Blueprint returns to Stage 6 (Infrastructure) with choices intact
      this.goToStage(6);
      return 6;
    } else if (s.stage === 6) {
      // If any infrastructure choices exist, clear them first (stay in Stage 6)
      const hasInfraChoice = Object.values(s.selectedInfra || {}).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v));
      if (hasInfraChoice) {
        this.clearAllInfra();
        return 6;
      }
      this.goToStage(5);
      return 5;
    } else if (s.stage === 5) {
      // If any stack tier is chosen, clear the stack first (stay in Stage 5).
      const hasStackChoice = Object.values(s.selectedStack || {}).some(Boolean);
      if (hasStackChoice) {
        this.clearAllStack();
        return 5;
      }
      this.goToStage(4);
      return 4;
    } else if (s.stage === 4) {
      this.goToStage(3);
      return 3;
    } else if (s.stage === 3) {
      this.goToStage(2);
      return 2;
    } else if (s.stage === 2) {
      this.goToStage(1);
      return 1;
    }
    return 1;
  }

  /** Returns dynamic graph metrics for derived badges */
  getGraphSummary() {
    return projectGraph.getSummary();
  }

  getDerivedIndicator() {
    const summary = this.getGraphSummary();
    const count = summary.nodeCount || 1;
    const branches = summary.branchCount || 1;
    return `DEVPATH · ${count} NODES · ${branches} BRANCHES`;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(curr, prev) {
    this.subscribers.forEach(cb => {
      try {
        cb(curr, prev);
      } catch (err) {
        console.error("[StateStore Subscriber Error]:", err);
      }
    });
  }

  reset() {
    this.set(s => ({
      ...this.initialState,
      theme: s.theme // preserve active theme across reset
    }));
  }
}

export const store = new StateStore();

if (typeof window !== "undefined") {
  window.BlueprintState = store;
}
