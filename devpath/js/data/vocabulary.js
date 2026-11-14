/**
 * DEVPATH // Canonical Vocabulary Registry
 * ------------------------------------------------------------------
 * Single source of truth for all type enumerations used across the
 * DevPath exploration engine. Every node type, path type, relationship
 * type, node state, and role is defined here as a frozen constant.
 *
 * Design principles:
 *   - Object.freeze makes registries immutable at runtime.
 *   - Legacy aliases (CHOICE, TIER, TECH, etc.) ensure backward
 *     compatibility with existing code that uses old string literals.
 *   - Validation helpers enable optional runtime checks in dev mode.
 *   - Values are simple lowercase strings — zero overhead vs. today.
 * ------------------------------------------------------------------
 */

/* ══════════════════════════════════════════════════════════════════
   NODE TYPES (31 canonical + 5 legacy aliases)
   ══════════════════════════════════════════════════════════════════ */
export const NODE_TYPES = Object.freeze({
  // ── Core structural types ──
  ROOT:           "root",
  TYPE:           "type",
  FOCUS:          "focus",
  PURPOSE:        "purpose",
  AUDIENCE:       "audience",
  EXPERIENCE:     "experience",
  CONTENT:        "content",

  // ── Feature / concept types ──
  FEATURE:        "feature",
  MECHANIC:       "mechanic",
  SYSTEM:         "system",
  CONCEPT:        "concept",
  DECISION:       "decision",

  // ── Architecture / path types ──
  ARCHITECTURE:   "architecture",
  PATH:           "path",

  // ── Technology types ──
  TECHNOLOGY:     "technology",
  ENGINE:         "engine",
  LANGUAGE:       "language",
  DATABASE:       "database",
  API:            "api",
  SERVICE:        "service",
  PLATFORM:       "platform",
  INTEGRATION:    "integration",

  // ── Infrastructure types ──
  INFRASTRUCTURE: "infrastructure",
  DEPLOYMENT:     "deployment",
  DISTRIBUTION:   "distribution",
  SECURITY:       "security",
  MONITORING:     "monitoring",

  // ── Meta types ──
  CONSTRAINT:     "constraint",
  DEPENDENCY:     "dependency",
  ALTERNATIVE:    "alternative",
  OUTCOME:        "outcome",

  // ── Legacy compatibility aliases ──
  // These map to the same string values used by existing code.
  // Over time, callers should migrate to canonical names.
  CHOICE:         "choice",
  TIER:           "tier",
  TECH:           "tech",
  INFRA:          "infra",
  BLUEPRINT:      "blueprint",
  MODULE:         "module"
});

/* ══════════════════════════════════════════════════════════════════
   PATH TYPES (16)
   Classify paths / decision branches through the exploration space.
   ══════════════════════════════════════════════════════════════════ */
export const PATH_TYPES = Object.freeze({
  DECISION:       "decision",
  EXPLORATION:    "exploration",
  FEATURE:        "feature",
  GAMEPLAY:       "gameplay",
  PRODUCT:        "product",
  UX:             "ux",
  TECHNICAL:      "technical",
  ARCHITECTURE:   "architecture",
  DATA:           "data",
  INTEGRATION:    "integration",
  INFRASTRUCTURE: "infrastructure",
  SECURITY:       "security",
  DEPLOYMENT:     "deployment",
  ALTERNATIVE:    "alternative",
  DEPENDENCY:     "dependency",
  CONVERGENCE:    "convergence"
});

/* ══════════════════════════════════════════════════════════════════
   RELATIONSHIP TYPES (21 canonical + 8 legacy aliases)
   Describe semantic edges between nodes in the project graph.
   ══════════════════════════════════════════════════════════════════ */
export const RELATIONSHIP_TYPES = Object.freeze({
  // ── Canonical relationships ──
  CONTAINS:           "contains",
  UNLOCKS:            "unlocks",
  LEADS_TO:           "leads_to",
  REQUIRES:           "requires",
  DEPENDS_ON:         "depends_on",
  SUPPORTS:           "supports",
  IMPLEMENTS:         "implements",
  ENABLES:            "enables",
  USES:               "uses",
  INTEGRATES_WITH:    "integrates_with",
  COMPATIBLE_WITH:    "compatible_with",
  INCOMPATIBLE_WITH:  "incompatible_with",
  PREFERRED_WITH:     "preferred_with",
  ALTERNATIVE_TO:     "alternative_to",
  DERIVES_FROM:       "derives_from",
  CONVERGES_TO:       "converges_to",
  INFLUENCES:         "influences",
  FEEDS_INTO:         "feeds_into",
  PRODUCES:           "produces",
  CONSUMES:           "consumes",
  RELATED_TO:         "related_to",

  // ── Legacy compatibility aliases ──
  CHILD:              "child",
  BRANCHES:           "branches",
  FOCUS:              "focus",
  ARCHITECTURE:       "architecture",
  TECHNOLOGY:         "technology",
  COMPONENT:          "component",
  CROSS_LINK:         "cross_link",
  EXPLORES:           "explores",
  SUBFEATURE:         "subfeature"
});

/* ══════════════════════════════════════════════════════════════════
   NODE STATES (12 canonical + 1 legacy alias)
   Lifecycle / visibility states for graph nodes.
   ══════════════════════════════════════════════════════════════════ */
export const NODE_STATES = Object.freeze({
  AVAILABLE:      "available",
  VISIBLE:        "visible",
  SELECTED:       "selected",
  SEEN:           "seen",
  RECOMMENDED:    "recommended",
  POSSIBLE:       "possible",
  INCOMPATIBLE:   "incompatible",
  LOCKED:         "locked",
  EXPLORED:       "explored",
  ACTIVE:         "active",
  ALTERNATIVE:    "alternative",
  CONVERGENCE:    "convergence",

  // ── Legacy compatibility alias ──
  TENTATIVE:      "tentative"
});

/* ══════════════════════════════════════════════════════════════════
   NODE ROLES (8)
   Semantic role of a node within the exploration context.
   ══════════════════════════════════════════════════════════════════ */
export const NODE_ROLES = Object.freeze({
  DECISION:     "decision",
  EXPLORE:      "explore",
  CONSIDER:     "consider",
  DEPENDENCY:   "dependency",
  CONNECTION:   "connection",
  RECOMMEND:    "recommend",
  ALTERNATIVE:  "alternative",
  OUTCOME:      "outcome"
});

/* ══════════════════════════════════════════════════════════════════
   EDGE TYPES (2)
   Binary classification of connection edges.
   ══════════════════════════════════════════════════════════════════ */
export const EDGE_TYPES = Object.freeze({
  DEPENDENCY:   "dependency",
  RELATIONSHIP: "relationship"
});

/* ══════════════════════════════════════════════════════════════════
   CONNECTION TYPES (4)
   Structural classification of how two nodes are linked.
   ══════════════════════════════════════════════════════════════════ */
export const CONNECTION_TYPES = Object.freeze({
  HIERARCHY:    "hierarchy",
  CROSS_LINK:   "cross_link",
  DEPENDENCY:   "dependency",
  CONVERGENCE:  "convergence"
});

/* ══════════════════════════════════════════════════════════════════
   STAGES (7)
   Logical milestone numbers in the DevPath exploration flow.
   ══════════════════════════════════════════════════════════════════ */
export const STAGES = Object.freeze({
  FOUNDATION:     1,
  ARCHETYPE:      2,
  FOCUS:          3,
  ARCHITECTURE:   4,
  TECHNOLOGY:     5,
  INFRASTRUCTURE: 6,
  BLUEPRINT:      7
});

/* ══════════════════════════════════════════════════════════════════
   NODE TYPE → VISUAL CATEGORY MAPPING
   Maps canonical node types to display category labels.
   Falls back to the node's own `.category` field for unlisted types.
   ══════════════════════════════════════════════════════════════════ */
export const NODE_TYPE_CATEGORIES = Object.freeze({
  [NODE_TYPES.ROOT]:           "PROJECT ROOT",
  [NODE_TYPES.TYPE]:           "PROJECT TYPE",
  [NODE_TYPES.FOCUS]:          "PROJECT FOCUS",
  [NODE_TYPES.PURPOSE]:        "PURPOSE",
  [NODE_TYPES.AUDIENCE]:       "AUDIENCE",
  [NODE_TYPES.EXPERIENCE]:     "EXPERIENCE",
  [NODE_TYPES.CONTENT]:        "CONTENT",
  [NODE_TYPES.FEATURE]:        "FEATURE",
  [NODE_TYPES.MECHANIC]:       "MECHANIC",
  [NODE_TYPES.SYSTEM]:         "SYSTEM",
  [NODE_TYPES.CONCEPT]:        "CONCEPT",
  [NODE_TYPES.DECISION]:       "DECISION",
  [NODE_TYPES.ARCHITECTURE]:   "ARCHITECTURE",
  [NODE_TYPES.PATH]:           "ARCHITECTURE PATH",
  [NODE_TYPES.TECHNOLOGY]:     "TECHNOLOGY",
  [NODE_TYPES.ENGINE]:         "ENGINE",
  [NODE_TYPES.LANGUAGE]:       "LANGUAGE",
  [NODE_TYPES.DATABASE]:       "DATABASE",
  [NODE_TYPES.API]:            "API",
  [NODE_TYPES.SERVICE]:        "SERVICE",
  [NODE_TYPES.PLATFORM]:       "PLATFORM",
  [NODE_TYPES.INTEGRATION]:    "INTEGRATION",
  [NODE_TYPES.INFRASTRUCTURE]: "INFRASTRUCTURE",
  [NODE_TYPES.DEPLOYMENT]:     "DEPLOYMENT",
  [NODE_TYPES.DISTRIBUTION]:   "DISTRIBUTION",
  [NODE_TYPES.SECURITY]:       "SECURITY",
  [NODE_TYPES.MONITORING]:     "MONITORING",
  [NODE_TYPES.CONSTRAINT]:     "CONSTRAINT",
  [NODE_TYPES.DEPENDENCY]:     "DEPENDENCY",
  [NODE_TYPES.ALTERNATIVE]:    "ALTERNATIVE",
  [NODE_TYPES.OUTCOME]:        "OUTCOME",
  // Legacy types
  [NODE_TYPES.CHOICE]:         "CHOICE",
  [NODE_TYPES.TIER]:           "TIER",
  [NODE_TYPES.TECH]:           "TECHNOLOGY",
  [NODE_TYPES.INFRA]:          "INFRASTRUCTURE",
  [NODE_TYPES.BLUEPRINT]:      "BLUEPRINT",
  [NODE_TYPES.MODULE]:         "MODULE"
});

/* ══════════════════════════════════════════════════════════════════
   VALIDATION HELPERS
   Runtime checks to ensure type safety across the codebase.
   ══════════════════════════════════════════════════════════════════ */

const _nodeTypeValues  = new Set(Object.values(NODE_TYPES));
const _pathTypeValues  = new Set(Object.values(PATH_TYPES));
const _relTypeValues   = new Set(Object.values(RELATIONSHIP_TYPES));
const _nodeStateValues = new Set(Object.values(NODE_STATES));
const _nodeRoleValues  = new Set(Object.values(NODE_ROLES));
const _edgeTypeValues  = new Set(Object.values(EDGE_TYPES));
const _connTypeValues  = new Set(Object.values(CONNECTION_TYPES));

/** Returns true if the value is a recognized node type string. */
export function isValidNodeType(t) {
  return typeof t === "string" && _nodeTypeValues.has(t);
}

/** Returns true if the value is a recognized path type string. */
export function isValidPathType(p) {
  return typeof p === "string" && _pathTypeValues.has(p);
}

/** Returns true if the value is a recognized relationship type string. */
export function isValidRelationship(r) {
  return typeof r === "string" && _relTypeValues.has(r);
}

/** Returns true if the value is a recognized node state string. */
export function isValidNodeState(s) {
  return typeof s === "string" && _nodeStateValues.has(s);
}

/** Returns true if the value is a recognized node role string. */
export function isValidNodeRole(r) {
  return typeof r === "string" && _nodeRoleValues.has(r);
}

/** Returns true if the value is a recognized edge type string. */
export function isValidEdgeType(e) {
  return typeof e === "string" && _edgeTypeValues.has(e);
}

/** Returns true if the value is a recognized connection type string. */
export function isValidConnectionType(c) {
  return typeof c === "string" && _connTypeValues.has(c);
}

/**
 * Returns the display category label for a given node type.
 * Falls back to the provided fallback string if type is not in the mapping.
 */
export function getCategoryForNodeType(nodeType, fallback = "GENERAL") {
  return NODE_TYPE_CATEGORIES[nodeType] || fallback;
}

