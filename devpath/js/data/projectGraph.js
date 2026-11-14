/**
 * DEVPATH // Recursive Living Project Graph Engine
 * ------------------------------------------------------------------
 * Central graph model supporting:
 * - Recursive NODE -> DECISION GROUP -> CHOICE -> NEW DECISION GROUP -> ...
 * - Arbitrary depth, parallel branches, and multi-parent convergence.
 * - Single vs Multiple selection mode per decision group.
 * - Clean pruning of downstream subtrees when choices change.
 * - Full serialization for Stage 7 Project Blueprint.
 * ------------------------------------------------------------------
 */

import { DECISION_GROUPS, getDecisionGroup, nodeIdForOption } from "./decisionGroups.js";
import { NODE_TYPES, NODE_STATES, RELATIONSHIP_TYPES, NODE_ROLES,
         EDGE_TYPES, CONNECTION_TYPES, STAGES } from "./vocabulary.js";

export class ProjectGraphConnection {
  constructor({ id, fromNodeId, toNodeId, relationship = "unlocks", edgeType = "relationship", connectionType = "hierarchy", label = "", status = "active" }) {
    this.id = id || `${fromNodeId}->${toNodeId}`;
    this.fromNodeId = fromNodeId;
    this.toNodeId = toNodeId;
    this.relationship = relationship;
    this.edgeType = edgeType; // "dependency" | "relationship"
    this.connectionType = connectionType; // "hierarchy" | "cross_link" | "dependency"
    this.label = label;
    this.status = status; // "active" | "tentative" | "locked"
  }
}

export class ProjectGraphNode {
  constructor({
    id,
    type = "choice", // "root" | "type" | "focus" | "path" | "tier" | "tech" | "choice" | "infra" | "blueprint" | "module" | "feature"
    nodeRole = "decision", // "decision" | "explore" | "consider" | "dependency" | "connection"
    title,
    category = "GENERAL",
    tagline = "",
    description = "",
    whyConsider = "",
    crossLinks = [],
    iconId = null,
    groupId = null,
    parentIds = [],
    relationship = "child",
    edgeType = "relationship", // "dependency" | "relationship"
    dependencies = [],
    relationships = [],
    exclusions = [],
    expansionSubtree = null,
    alternatives = [],
    selectionMode = "single",
    status = "active", // "active" | "tentative" | "locked"
    metadata = {},
    nextDecisionGroups = [],
    depth = 0,
    x = 0,
    y = 0,
    width = 240,
    height = 100,
    // ── New canonical vocabulary fields ──
    pathType = null,        // From PATH_TYPES enum (null for non-path nodes)
    stage = null,           // Which stage this node belongs to (1-7, null = auto)
    tags = []               // Freeform tags for filtering/search
  }) {
    this.id = id;
    this.type = type;
    this.nodeRole = nodeRole;
    this.title = title;
    this.category = category;
    this.tagline = tagline;
    this.description = description;
    this.whyConsider = whyConsider;
    this.crossLinks = Array.isArray(crossLinks) ? [...crossLinks] : [];
    this.iconId = iconId;
    this.groupId = groupId;
    this.parentIds = Array.isArray(parentIds) ? [...parentIds] : (parentIds ? [parentIds] : []);
    this.relationship = relationship;
    this.edgeType = edgeType;
    this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [];
    this.relationships = Array.isArray(relationships) ? [...relationships] : [];
    this.exclusions = Array.isArray(exclusions) ? [...exclusions] : [];
    this.expansionSubtree = expansionSubtree ? { ...expansionSubtree } : null;
    this.alternatives = Array.isArray(alternatives) ? [...alternatives] : [];
    this.selectionMode = selectionMode;
    this.status = status;
    this.metadata = { ...metadata };
    this.nextDecisionGroups = Array.isArray(nextDecisionGroups) ? [...nextDecisionGroups] : [];
    this.depth = depth;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    // ── New canonical vocabulary fields ──
    this.pathType = pathType;
    this.stage = stage;
    this.tags = Array.isArray(tags) ? [...tags] : [];
  }
}

export class ProjectGraph {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map(); // key: fromNodeId->toNodeId
    this.selectedOptionsByGroup = new Map(); // groupId -> Set<optionId>
  }

  clear() {
    this.nodes.clear();
    this.connections.clear();
    this.selectedOptionsByGroup.clear();
  }

  addNode(nodeData) {
    const node = nodeData instanceof ProjectGraphNode ? nodeData : new ProjectGraphNode(nodeData);
    this.nodes.set(node.id, node);

    // Auto-create connections from parentIds
    if (node.parentIds && node.parentIds.length > 0) {
      node.parentIds.forEach(parentId => {
        if (this.nodes.has(parentId)) {
          this.connectNodes(parentId, node.id, node.relationship, node.status);
        }
      });
    }

    return node;
  }

  getNode(nodeId) {
    if (!nodeId) return null;
    if (this.nodes.has(nodeId)) return this.nodes.get(nodeId);
    for (const node of this.nodes.values()) {
      if (node.id === nodeId || node.metadata?.optionId === nodeId || node.id.endsWith(`::${nodeId}`)) {
        return node;
      }
    }
    return null;
  }

  hasNode(nodeId) {
    return Boolean(this.getNode(nodeId));
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  connectNodes(fromNodeId, toNodeId, relationship = "unlocks", status = "active", edgeType = null) {
    const fromNode = this.getNode(fromNodeId);
    const toNode = this.getNode(toNodeId);
    const actualFromId = fromNode ? fromNode.id : fromNodeId;
    const actualToId = toNode ? toNode.id : toNodeId;

    // Resolve edge type: if either node lists the other in its dependencies or relationship is 'dependency'
    let resolvedEdgeType = edgeType;
    if (!resolvedEdgeType) {
      const isDep = relationship === "dependency" ||
        (toNode && Array.isArray(toNode.dependencies) && (toNode.dependencies.includes(actualFromId) || toNode.dependencies.includes(fromNode?.metadata?.techId))) ||
        (fromNode && Array.isArray(fromNode.dependencies) && (fromNode.dependencies.includes(actualToId) || fromNode.dependencies.includes(toNode?.metadata?.techId)));
      resolvedEdgeType = isDep ? "dependency" : "relationship";
    }

    const connId = `${actualFromId}->${actualToId}`;
    const conn = new ProjectGraphConnection({
      id: connId,
      fromNodeId: actualFromId,
      toNodeId: actualToId,
      relationship,
      edgeType: resolvedEdgeType,
      status
    });
    this.connections.set(connId, conn);

    // Ensure child's parentIds contains actualFromId
    if (toNode && !toNode.parentIds.includes(actualFromId)) {
      toNode.parentIds.push(actualFromId);
    }

    return conn;
  }

  getDependencies(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return [];
    return Array.from(this.connections.values())
      .filter(c => (c.fromNodeId === node.id || c.toNodeId === node.id) && c.edgeType === "dependency")
      .map(c => c.fromNodeId === node.id ? this.getNode(c.toNodeId) : this.getNode(c.fromNodeId))
      .filter(Boolean);
  }

  getRelationships(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return [];
    return Array.from(this.connections.values())
      .filter(c => (c.fromNodeId === node.id || c.toNodeId === node.id) && c.edgeType === "relationship")
      .map(c => c.fromNodeId === node.id ? this.getNode(c.toNodeId) : this.getNode(c.fromNodeId))
      .filter(Boolean);
  }

  getSubtree(nodeId) {
    const node = this.getNode(nodeId);
    return node ? node.expansionSubtree : null;
  }

  expandNodeSubtree(nodeId) {
    const parentNode = this.getNode(nodeId);
    if (!parentNode || !parentNode.expansionSubtree || !Array.isArray(parentNode.expansionSubtree.modules)) {
      return [];
    }

    const createdNodes = [];
    const subtree = parentNode.expansionSubtree;
    const baseDepth = (parentNode.depth || 4) + 1;

    subtree.modules.forEach(mod => {
      const childNodeId = `${parentNode.id}::${mod.id}`;
      if (!this.hasNode(childNodeId)) {
        const childNode = this.addNode({
          id: childNodeId,
          type: "module",
          title: mod.title || mod.name,
          category: mod.category || "SUBSYSTEM",
          tagline: mod.tagline || "",
          description: mod.description || `Architectural subsystem component of ${parentNode.title}`,
          iconId: mod.iconId || parentNode.iconId || null,
          parentIds: [parentNode.id],
          edgeType: "relationship",
          relationship: "component",
          status: "active",
          depth: baseDepth,
          metadata: { parentNodeId: parentNode.id, moduleId: mod.id }
        });
        this.connectNodes(parentNode.id, childNodeId, "component", "active", "relationship");
        createdNodes.push(childNode);

        if (Array.isArray(mod.children)) {
          mod.children.forEach(subMod => {
            const subModId = `${childNodeId}::${subMod.id}`;
            if (!this.hasNode(subModId)) {
              const subNode = this.addNode({
                id: subModId,
                type: "module",
                title: subMod.title || subMod.name,
                category: subMod.category || "MODULE",
                tagline: subMod.tagline || "",
                description: subMod.description || "",
                iconId: subMod.iconId || null,
                parentIds: [childNodeId],
                edgeType: "relationship",
                relationship: "component",
                status: "active",
                depth: baseDepth + 1,
                metadata: { parentNodeId: childNodeId, moduleId: subMod.id }
              });
              this.connectNodes(childNodeId, subModId, "component", "active", "relationship");
              createdNodes.push(subNode);
            }
          });
        }
      }
    });

    return createdNodes;
  }

  addCrossLink(fromNodeId, toNodeId, options = {}) {
    const fromNode = this.getNode(fromNodeId);
    const toNode = this.getNode(toNodeId);
    const actualFromId = fromNode ? fromNode.id : fromNodeId;
    const actualToId = toNode ? toNode.id : toNodeId;

    const connId = `cross:${actualFromId}->${actualToId}`;
    const conn = new ProjectGraphConnection({
      id: connId,
      fromNodeId: actualFromId,
      toNodeId: actualToId,
      relationship: options.relationship || "cross_link",
      edgeType: options.edgeType || "relationship",
      connectionType: "cross_link",
      label: options.label || "",
      status: options.status || "active"
    });
    this.connections.set(connId, conn);

    if (fromNode) {
      if (!Array.isArray(fromNode.crossLinks)) fromNode.crossLinks = [];
      if (!fromNode.crossLinks.find(cl => cl.toNodeId === actualToId)) {
        fromNode.crossLinks.push({
          toNodeId: actualToId,
          relationship: options.relationship || "cross_link",
          edgeType: options.edgeType || "relationship",
          label: options.label || ""
        });
      }
    }

    return conn;
  }

  expandFeaturePath(parentNodeId, featurePath) {
    const parentNode = this.getNode(parentNodeId);
    if (!parentNode || !featurePath) return [];

    const createdNodes = [];
    const baseDepth = (parentNode.depth || 2) + 1;

    // 1. Add feature path container node
    const pathNodeId = `feat-path::${featurePath.id}`;
    if (!this.hasNode(pathNodeId)) {
      const pathNode = this.addNode({
        id: pathNodeId,
        type: "feature",
        nodeRole: featurePath.nodeRole || "explore",
        title: featurePath.title,
        category: featurePath.category || "EXPLORATION PATH",
        tagline: featurePath.tagline || "",
        description: featurePath.description || "",
        whyConsider: featurePath.whyConsider || "",
        iconId: featurePath.iconId || null,
        parentIds: [parentNode.id],
        edgeType: "relationship",
        relationship: "explores",
        status: "active",
        depth: baseDepth,
        metadata: { parentNodeId: parentNode.id, featurePathId: featurePath.id }
      });
      this.connectNodes(parentNode.id, pathNodeId, "explores", "active", "relationship");
      createdNodes.push(pathNode);
    }

    // 2. Add subfeatures
    if (Array.isArray(featurePath.subfeatures)) {
      featurePath.subfeatures.forEach(sub => {
        const subId = `${pathNodeId}::${sub.id}`;
        if (!this.hasNode(subId)) {
          const subNode = this.addNode({
            id: subId,
            type: "feature",
            nodeRole: sub.nodeRole || "explore",
            title: sub.title,
            category: sub.category || "FEATURE",
            tagline: sub.tagline || "",
            description: sub.description || "",
            whyConsider: sub.whyConsider || "",
            iconId: sub.iconId || null,
            parentIds: [pathNodeId],
            edgeType: "relationship",
            relationship: "contains",
            status: "active",
            depth: baseDepth + 1,
            metadata: { parentNodeId: pathNodeId, featureId: sub.id }
          });
          this.connectNodes(pathNodeId, subId, "contains", "active", "relationship");
          createdNodes.push(subNode);

          // Nested mechanics or children
          if (Array.isArray(sub.children)) {
            sub.children.forEach(ch => {
              const chId = `${subId}::${ch.id}`;
              if (!this.hasNode(chId)) {
                const chNode = this.addNode({
                  id: chId,
                  type: "feature",
                  nodeRole: ch.nodeRole || "consider",
                  title: ch.title,
                  category: ch.category || "MECHANIC",
                  tagline: ch.tagline || "",
                  description: ch.description || "",
                  whyConsider: ch.whyConsider || "",
                  iconId: ch.iconId || null,
                  parentIds: [subId],
                  edgeType: "relationship",
                  relationship: "subfeature",
                  status: "active",
                  depth: baseDepth + 2,
                  metadata: { parentNodeId: subId, featureId: ch.id }
                });
                this.connectNodes(subId, chId, "subfeature", "active", "relationship");
                createdNodes.push(chNode);
              }
            });
          }
        }
      });

      // 3. Connect crossLinks declared on subfeatures
      featurePath.subfeatures.forEach(sub => {
        if (Array.isArray(sub.crossLinks)) {
          const fromId = `${pathNodeId}::${sub.id}`;
          sub.crossLinks.forEach(cl => {
            const targetSub = featurePath.subfeatures.find(s => s.id === cl.toNodeId);
            if (targetSub) {
              const toId = `${pathNodeId}::${targetSub.id}`;
              if (this.hasNode(fromId) && this.hasNode(toId)) {
                this.addCrossLink(fromId, toId, {
                  relationship: cl.relationship || "feeds_into",
                  edgeType: cl.edgeType || "relationship",
                  label: cl.label || ""
                });
              }
            }
          });
        }
      });
    }

    return createdNodes;
  }

  removeConnection(fromNodeId, toNodeId) {
    const fromNode = this.getNode(fromNodeId);
    const toNode = this.getNode(toNodeId);
    const actualFromId = fromNode ? fromNode.id : fromNodeId;
    const actualToId = toNode ? toNode.id : toNodeId;

    const connId = `${actualFromId}->${actualToId}`;
    this.connections.delete(connId);

    if (toNode) {
      toNode.parentIds = toNode.parentIds.filter(id => id !== actualFromId);
    }
  }

  getConnections() {
    return Array.from(this.connections.values());
  }

  getChildren(nodeId) {
    const children = [];
    for (const conn of this.connections.values()) {
      if (conn.fromNodeId === nodeId) {
        const childNode = this.nodes.get(conn.toNodeId);
        if (childNode) children.push(childNode);
      }
    }
    return children;
  }

  getParents(nodeId) {
    const parents = [];
    for (const conn of this.connections.values()) {
      if (conn.toNodeId === nodeId) {
        const parentNode = this.nodes.get(conn.fromNodeId);
        if (parentNode) parents.push(parentNode);
      }
    }
    return parents;
  }

  getDescendants(nodeId) {
    const descendants = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      const children = this.getChildren(current);
      for (const child of children) {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          queue.push(child.id);
        }
      }
    }

    return Array.from(descendants).map(id => this.nodes.get(id)).filter(Boolean);
  }

  getAncestors(nodeId) {
    const ancestors = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      const parents = this.getParents(current);
      for (const parent of parents) {
        if (!ancestors.has(parent.id)) {
          ancestors.add(parent.id);
          queue.push(parent.id);
        }
      }
    }

    return Array.from(ancestors).map(id => this.nodes.get(id)).filter(Boolean);
  }

  isReachableFromRoots(nodeId, rootIds, visited = new Set()) {
    if (rootIds.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const node = this.getNode(nodeId);
    if (!node || !node.parentIds || node.parentIds.length === 0) return false;

    for (const pid of node.parentIds) {
      if (this.nodes.has(pid) && this.isReachableFromRoots(pid, rootIds, visited)) {
        return true;
      }
    }
    return false;
  }

  removeNode(nodeId, pruneDownstream = true) {
    const targetNode = this.getNode(nodeId);
    if (!targetNode) return [];
    const actualId = targetNode.id;

    const rootIds = new Set();
    for (const [id, n] of this.nodes.entries()) {
      if (n.type === "root" || n.type === "type" || n.depth === 0) {
        rootIds.add(id);
      }
    }

    // Direct removal
    if (targetNode.groupId) {
      const groupSet = this.selectedOptionsByGroup.get(targetNode.groupId);
      if (groupSet) {
        const optId = targetNode.metadata?.optionId || actualId.split("::")[1];
        groupSet.delete(optId);
      }
    }

    this.nodes.delete(actualId);

    for (const [connId, conn] of Array.from(this.connections.entries())) {
      if (conn.fromNodeId === actualId || conn.toNodeId === actualId) {
        this.connections.delete(connId);
      }
    }

    // Update parentIds on remaining children
    for (const n of this.nodes.values()) {
      n.parentIds = n.parentIds.filter(pid => pid !== actualId);
    }

    const removedIds = [actualId];

    if (pruneDownstream) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const [id, n] of Array.from(this.nodes.entries())) {
          if (!rootIds.has(id) && !this.isReachableFromRoots(id, rootIds)) {
            removedIds.push(id);
            if (n.groupId) {
              const groupSet = this.selectedOptionsByGroup.get(n.groupId);
              if (groupSet) {
                const optId = n.metadata?.optionId || id.split("::")[1];
                groupSet.delete(optId);
              }
            }
            this.nodes.delete(id);
            for (const [connId, conn] of Array.from(this.connections.entries())) {
              if (conn.fromNodeId === id || conn.toNodeId === id) {
                this.connections.delete(connId);
              }
            }
            for (const rem of this.nodes.values()) {
              rem.parentIds = rem.parentIds.filter(pid => pid !== id);
            }
            changed = true;
            break;
          }
        }
      }
    }

    return removedIds;
  }

  /**
   * Selects an option from a decision group.
   * - Enforces selectionMode ("single" vs "multiple").
   * - If "single", previous selection in group is deselected and pruned.
   * - Spawns or connects a ProjectGraphNode (supports multi-parent convergence).
   */
  selectOption(groupId, optionId, parentNodeId = null) {
    const group = getDecisionGroup(groupId);
    if (!group) {
      console.warn(`[ProjectGraph]: Decision group not found: ${groupId}`);
      return null;
    }

    const option = group.options.find(o => o.id === optionId);
    if (!option) {
      console.warn(`[ProjectGraph]: Option not found: ${optionId} in group: ${groupId}`);
      return null;
    }

    if (!this.selectedOptionsByGroup.has(groupId)) {
      this.selectedOptionsByGroup.set(groupId, new Set());
    }
    const currentSelections = this.selectedOptionsByGroup.get(groupId);

    // If single selection mode, deselect existing selections in this group
    if (group.selectionMode === "single") {
      for (const existingOptId of Array.from(currentSelections)) {
        if (existingOptId !== optionId) {
          this.deselectOption(groupId, existingOptId);
        }
      }
    }

    currentSelections.add(optionId);

    const nodeId = nodeIdForOption(groupId, optionId);
    const parentNode = parentNodeId ? this.getNode(parentNodeId) : null;
    const actualParentId = parentNode ? parentNode.id : parentNodeId;

    // Check if node already exists (e.g. multi-parent convergence)
    const existingNode = this.getNode(nodeId);
    if (existingNode) {
      if (actualParentId && !existingNode.parentIds.includes(actualParentId)) {
        existingNode.parentIds.push(actualParentId);
      }
      if (actualParentId) {
        this.connectNodes(actualParentId, existingNode.id, "unlocks", "active");
      }
      return existingNode;
    }

    const depth = parentNode ? parentNode.depth + 1 : 1;

    const node = this.addNode({
      id: nodeId,
      type: option.nodeType || "choice",
      title: option.title,
      category: option.category || group.title,
      tagline: option.tagline || "",
      description: option.description || "",
      iconId: option.iconId || null,
      groupId: groupId,
      parentIds: actualParentId ? [actualParentId] : [],
      relationship: "unlocks",
      selectionMode: group.selectionMode,
      status: "active",
      metadata: { optionId, groupId, groupTitle: group.title },
      nextDecisionGroups: option.nextDecisionGroups || [],
      depth: depth,
      stage: option.stage || (groupId && groupId.startsWith("infra-") ? STAGES.INFRASTRUCTURE : null),
      pathType: option.pathType || null,
      tags: Array.isArray(option.tags) ? option.tags : []
    });

    if (actualParentId && this.hasNode(actualParentId)) {
      this.connectNodes(actualParentId, node.id, "unlocks", "active");
    }

    return node;
  }

  /**
   * Deselects an option from a decision group and prunes its downstream subtree.
   */
  deselectOption(groupId, optionId) {
    const groupSet = this.selectedOptionsByGroup.get(groupId);
    if (groupSet) {
      groupSet.delete(optionId);
    }

    const nodeId = nodeIdForOption(groupId, optionId);
    return this.removeNode(nodeId, true);
  }

  isOptionSelected(groupId, optionId) {
    const groupSet = this.selectedOptionsByGroup.get(groupId);
    return groupSet ? groupSet.has(optionId) : false;
  }

  getSelectedOptions(groupId) {
    const groupSet = this.selectedOptionsByGroup.get(groupId);
    return groupSet ? Array.from(groupSet) : [];
  }

  getUnlockedGroups(nodeId) {
    const node = this.getNode(nodeId);
    if (!node || !node.nextDecisionGroups) return [];
    return node.nextDecisionGroups.map(gid => getDecisionGroup(gid)).filter(Boolean);
  }

  // ─────────────────────────────────────────────────────────────
  // CANONICAL VOCABULARY — Query & Compatibility Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Evaluates whether a candidate node is compatible with the current
   * graph selections based on declared exclusion lists.
   * Returns { compatible: boolean, conflicts: Array<{ nodeId, reason, excluderTitle }> }
   */
  evaluateCompatibility(candidateNodeId) {
    const candidate = this.getNode(candidateNodeId);
    if (!candidate) return { compatible: true, conflicts: [] };

    const conflicts = [];

    // Check exclusions declared by all selected/locked nodes
    for (const node of this.nodes.values()) {
      if (node.id === candidate.id) continue;
      if (node.status === "locked" || node.status === "active" || node.status === "selected") {
        const candidateIdentifiers = [
          candidate.id,
          candidate.metadata?.optionId,
          candidate.metadata?.techId
        ].filter(Boolean);

        for (const cid of candidateIdentifiers) {
          if (Array.isArray(node.exclusions) && node.exclusions.includes(cid)) {
            conflicts.push({ nodeId: node.id, reason: "excluded_by", excluderTitle: node.title });
            break;
          }
        }
      }
    }

    // Check candidate's own exclusions against selected nodes
    if (Array.isArray(candidate.exclusions) && candidate.exclusions.length > 0) {
      for (const node of this.nodes.values()) {
        if (node.id === candidate.id) continue;
        const nodeIdentifiers = [
          node.id,
          node.metadata?.optionId,
          node.metadata?.techId
        ].filter(Boolean);

        for (const nid of nodeIdentifiers) {
          if (candidate.exclusions.includes(nid)) {
            conflicts.push({ nodeId: node.id, reason: "excludes", excluderTitle: candidate.title });
            break;
          }
        }
      }
    }

    return { compatible: conflicts.length === 0, conflicts };
  }

  /**
   * Returns all nodes belonging to a specific stage number (1-7).
   */
  getNodesByStage(stageNumber) {
    return this.getNodes().filter(n => n.stage === stageNumber);
  }

  /**
   * Returns all nodes matching a specific canonical node type string.
   */
  getNodesByType(nodeType) {
    return this.getNodes().filter(n => n.type === nodeType);
  }

  /**
   * Returns a Map of node IDs that are incompatible with current selections,
   * each mapped to { excludedBy: string[] } listing the nodes causing the conflict.
   */
  getIncompatibleNodes() {
    const incompatible = new Map();
    const selected = this.getNodes().filter(n =>
      n.status === "locked" || n.status === "active" || n.status === "selected"
    );

    for (const sel of selected) {
      if (!Array.isArray(sel.exclusions)) continue;
      for (const exId of sel.exclusions) {
        if (!incompatible.has(exId)) {
          incompatible.set(exId, { excludedBy: [] });
        }
        incompatible.get(exId).excludedBy.push(sel.id);
      }
    }

    return incompatible;
  }

  /**
   * Creates a cross-link that explicitly bridges stages.
   * Convenience wrapper around addCrossLink with cross-stage semantics.
   */
  addCrossStageLink(fromNodeId, toNodeId, options = {}) {
    return this.addCrossLink(fromNodeId, toNodeId, {
      ...options,
      connectionType: CONNECTION_TYPES.CROSS_LINK,
      relationship: options.relationship || RELATIONSHIP_TYPES.INFLUENCES
    });
  }

  /**
   * Synchronizes and synthesizes nodes from the legacy Stages 1-5 store
   * so projectGraph always has complete end-to-end representation.
   */
  syncFromLegacyState(state, options = {}) {
    const { ROOT_NODE_DEFAULT, PROJECT_TYPES } = options.projectTypesData || {};
    const { PROJECT_FOCUS } = options.projectFocusData || {};
    const { ARCHITECTURE_PATHS } = options.architecturePathsData || {};
    const { getStackForPath } = options.technologyStacksData || {};

    if (!state) return;

    // 1. Root Node (Project Name)
    const rootId = ROOT_NODE_DEFAULT?.id || "root-project";
    if (!this.hasNode(rootId)) {
      this.addNode({
        id: rootId,
        type: "root",
        title: state.projectName || "PROJECT",
        category: "PROJECT ROOT",
        tagline: "Architecture Baseline",
        description: "Root software specification container.",
        depth: 0,
        status: "locked",
        stage: STAGES.FOUNDATION
      });
    } else {
      const root = this.getNode(rootId);
      if (state.projectName) root.title = state.projectName;
      if (!root.stage) root.stage = STAGES.FOUNDATION;
    }

    // 2. Selected Type
    if (state.selectedType && PROJECT_TYPES) {
      const typeConfig = PROJECT_TYPES.find(t => t.id === state.selectedType);
      if (typeConfig && !this.hasNode(state.selectedType)) {
        this.addNode({
          id: state.selectedType,
          type: "type",
          title: typeConfig.title,
          category: typeConfig.category || "PROJECT TYPE",
          tagline: typeConfig.tagline || "",
          description: typeConfig.description || "",
          parentIds: [rootId],
          depth: 1,
          status: "locked",
          stage: STAGES.ARCHETYPE
        });
        this.connectNodes(rootId, state.selectedType, "branches", "active");
      }
    }

    // 3. Selected Focus Items
    if (state.selectedType && state.selectedFocus && state.selectedFocus.length > 0 && PROJECT_FOCUS) {
      const pool = PROJECT_FOCUS[state.selectedType] || [];
      state.selectedFocus.forEach(focusId => {
        const item = pool.find(f => f.id === focusId);
        const nodeFocusId = `focus-sel-${focusId}`;
        if (item && !this.hasNode(nodeFocusId)) {
          this.addNode({
            id: nodeFocusId,
            type: "focus",
            title: item.title,
            category: item.category || "PROJECT FOCUS",
            tagline: item.tagline || "",
            description: item.description || "",
            iconId: item.iconId || null,
            parentIds: [state.selectedType],
            depth: 2,
            status: "locked",
            stage: STAGES.FOCUS
          });
          this.connectNodes(state.selectedType, nodeFocusId, "focus", "active");
        }
      });
    }

    // 4. Selected Architecture Path
    if (state.selectedArchitecturePath && ARCHITECTURE_PATHS && state.selectedType) {
      const pathList = ARCHITECTURE_PATHS[state.selectedType] || [];
      const chosenPath = pathList.find(p => p.id === state.selectedArchitecturePath);
      if (chosenPath && !this.hasNode(chosenPath.id)) {
        const parentFocusIds = (state.selectedFocus || []).map(f => `focus-sel-${f}`).filter(id => this.hasNode(id));
        const parents = parentFocusIds.length > 0 ? parentFocusIds : [state.selectedType];

        this.addNode({
          id: chosenPath.id,
          type: "path",
          title: chosenPath.title,
          category: chosenPath.category || "ARCHITECTURE PATH",
          tagline: chosenPath.tagline || "",
          description: chosenPath.description || "",
          parentIds: parents,
          depth: 3,
          status: "locked",
          stage: STAGES.ARCHITECTURE
        });

        parents.forEach(pId => {
          this.connectNodes(pId, chosenPath.id, "architecture", "active");
        });
      }
    }

    // 5. Selected Stack Technologies (Stage 5)
    if (state.selectedArchitecturePath && state.selectedStack && getStackForPath) {
      const tiers = getStackForPath(state.selectedArchitecturePath);
      tiers.forEach(tier => {
        const techId = state.selectedStack[tier.id];
        if (techId) {
          const opt = tier.options.find(o => o.id === techId);
          const stackNodeId = `stack-${tier.id}-${techId}`;
          if (opt && !this.hasNode(stackNodeId)) {
            const alternatives = (tier.options || [])
              .filter(o => o.id !== techId)
              .map(o => ({ id: o.id, title: o.title, category: o.category, tagline: o.tagline || "" }));

            this.addNode({
              id: stackNodeId,
              type: "tech",
              title: opt.title,
              category: tier.title || opt.category,
              tagline: opt.tagline || "",
              description: opt.description || "",
              iconId: opt.iconId || null,
              parentIds: [state.selectedArchitecturePath],
              dependencies: opt.dependencies || [],
              relationships: opt.relationships || [],
              exclusions: opt.exclusions || [],
              expansionSubtree: opt.expansionSubtree || null,
              alternatives,
              depth: 4,
              status: "locked",
              stage: STAGES.TECHNOLOGY,
              metadata: { tierId: tier.id, techId: opt.id }
            });
            this.connectNodes(state.selectedArchitecturePath, stackNodeId, "technology", "active", "relationship");
          }
        }
      });

      // Connect direct technical dependencies between chosen stack nodes
      tiers.forEach(tier => {
        const techId = state.selectedStack[tier.id];
        if (!techId) return;
        const opt = tier.options.find(o => o.id === techId);
        if (!opt || !Array.isArray(opt.dependencies) || opt.dependencies.length === 0) return;
        const fromNodeId = `stack-${tier.id}-${techId}`;

        opt.dependencies.forEach(depId => {
          tiers.forEach(otherTier => {
            if (otherTier.id === tier.id) return;
            const otherTechId = state.selectedStack[otherTier.id];
            if (otherTechId === depId) {
              const toNodeId = `stack-${otherTier.id}-${otherTechId}`;
              if (this.hasNode(fromNodeId) && this.hasNode(toNodeId)) {
                this.connectNodes(fromNodeId, toNodeId, "requires", "active", "dependency");
              }
            }
          });
        });
      });
    }
  }

  getSummary() {
    let maxDepth = 0;
    const leafNodes = [];

    for (const node of this.nodes.values()) {
      if (node.depth > maxDepth) maxDepth = node.depth;
      const children = this.getChildren(node.id);
      if (children.length === 0) {
        leafNodes.push(node);
      }
    }

    return {
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      branchCount: leafNodes.length,
      maxDepth: maxDepth
    };
  }

  exportBlueprint() {
    const summary = this.getSummary();
    const rootNode = this.getNode("root-project");
    return {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      summary: summary,
      manifest: {
        projectName: rootNode ? rootNode.title : "DevPath Project",
        totalDecisions: this.nodes.size,
        activeBranches: summary.branchCount,
        maxDepth: summary.maxDepth
      },
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id,
        type: n.type,
        nodeRole: n.nodeRole || "decision",
        title: n.title,
        category: n.category,
        tagline: n.tagline,
        description: n.description,
        whyConsider: n.whyConsider || "",
        crossLinks: n.crossLinks || [],
        iconId: n.iconId,
        parentIds: n.parentIds,
        relationship: n.relationship,
        edgeType: n.edgeType || "relationship",
        dependencies: n.dependencies || [],
        relationships: n.relationships || [],
        exclusions: n.exclusions || [],
        alternatives: n.alternatives || [],
        selectionMode: n.selectionMode,
        status: n.status,
        depth: n.depth,
        metadata: n.metadata,
        // Canonical vocabulary fields
        pathType: n.pathType || null,
        stage: n.stage || null,
        tags: n.tags || []
      })),
      connections: Array.from(this.connections.values()).map(c => ({
        id: c.id,
        from: c.fromNodeId,
        to: c.toNodeId,
        relationship: c.relationship,
        edgeType: c.edgeType || "relationship",
        connectionType: c.connectionType || "hierarchy",
        label: c.label || "",
        status: c.status
      }))
    };
  }
}

export const projectGraph = new ProjectGraph();
if (typeof window !== "undefined") {
  window.DevPathGraph = projectGraph;
}

