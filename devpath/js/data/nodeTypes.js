/**
 * DEVPATH // Node Kind Registry
 * ------------------------------------------------------------------
 * The graph-first model replaces "stages" with node KINDS. A kind
 * describes what a node *is* (a genre, a mechanic, an entity, a
 * technology) so the renderer, layout engine, and colour system can
 * style and place it without knowing anything about the domain.
 *
 * `lane` groups kinds into the broad horizontal bands the layout
 * engine uses. `weight` controls vertical spacing priority.
 * ------------------------------------------------------------------
 */

export const NODE_KINDS = Object.freeze({
  // ── Entry ──
  START: "start",

  // ── Intent / domain ──
  PROJECT_TYPE: "project-type",
  DOMAIN: "domain",
  GOAL: "goal",
  AUDIENCE: "audience",

  // ── What the thing IS ──
  CONCEPT: "concept",
  GENRE: "genre",
  THEME: "theme",

  // ── What the thing DOES (behaviour) ──
  FEATURE: "feature",
  MECHANIC: "mechanic",
  GAMEPLAY: "gameplay",
  SYSTEM: "system",
  RULE: "rule",
  BEHAVIOR: "behavior",

  // ── What the thing CONTAINS ──
  ENTITY: "entity",
  CONTENT: "content",
  DATA: "data",
  ASSET: "asset",

  // ── How it FLOWS ──
  FLOW: "flow",
  SCREEN: "screen",
  INTEGRATION: "integration",

  // ── How it's BUILT ──
  ARCHITECTURE: "architecture",
  TECHNOLOGY: "technology",
  LANGUAGE: "language",
  FRAMEWORK: "framework",
  ENGINE: "engine",
  DATABASE: "database",
  SERVICE: "service",
  PLATFORM: "platform",

  // ── How it RUNS ──
  INFRASTRUCTURE: "infrastructure",
  DEPLOYMENT: "deployment",
  DISTRIBUTION: "distribution",
  SECURITY: "security",
  MONITORING: "monitoring",

  // ── Constraints ──
  CONSTRAINT: "constraint",
  SCOPE: "scope",
  OUTCOME: "outcome"
});

/**
 * Lane assignment. The layout engine stacks lanes top-to-bottom in
 * this order. Nodes in the same lane sit on the same horizontal band,
 * which is what makes a deep path read as a clean vertical spine
 * while parallel branches fan out sideways.
 */
export const KIND_LANES = Object.freeze({
  [NODE_KINDS.START]: { lane: 0, label: "START" },
  [NODE_KINDS.PROJECT_TYPE]: { lane: 1, label: "PROJECT TYPE" },
  [NODE_KINDS.DOMAIN]: { lane: 2, label: "DOMAIN" },
  [NODE_KINDS.GOAL]: { lane: 2, label: "GOAL" },
  [NODE_KINDS.AUDIENCE]: { lane: 2, label: "AUDIENCE" },

  [NODE_KINDS.CONCEPT]: { lane: 3, label: "CONCEPT" },
  [NODE_KINDS.GENRE]: { lane: 3, label: "GENRE" },
  [NODE_KINDS.THEME]: { lane: 3, label: "THEME" },

  [NODE_KINDS.FEATURE]: { lane: 4, label: "FEATURE" },
  [NODE_KINDS.MECHANIC]: { lane: 4, label: "MECHANIC" },
  [NODE_KINDS.GAMEPLAY]: { lane: 4, label: "GAMEPLAY" },
  [NODE_KINDS.SYSTEM]: { lane: 4, label: "SYSTEM" },
  [NODE_KINDS.RULE]: { lane: 5, label: "RULE" },
  [NODE_KINDS.BEHAVIOR]: { lane: 5, label: "BEHAVIOR" },

  [NODE_KINDS.ENTITY]: { lane: 5, label: "ENTITY" },
  [NODE_KINDS.CONTENT]: { lane: 5, label: "CONTENT" },
  [NODE_KINDS.DATA]: { lane: 6, label: "DATA" },
  [NODE_KINDS.ASSET]: { lane: 6, label: "ASSET" },

  [NODE_KINDS.FLOW]: { lane: 6, label: "FLOW" },
  [NODE_KINDS.SCREEN]: { lane: 7, label: "SCREEN" },
  [NODE_KINDS.INTEGRATION]: { lane: 7, label: "INTEGRATION" },

  [NODE_KINDS.ARCHITECTURE]: { lane: 8, label: "ARCHITECTURE" },
  [NODE_KINDS.TECHNOLOGY]: { lane: 9, label: "TECHNOLOGY" },
  [NODE_KINDS.LANGUAGE]: { lane: 10, label: "LANGUAGE" },
  [NODE_KINDS.FRAMEWORK]: { lane: 10, label: "FRAMEWORK" },
  [NODE_KINDS.ENGINE]: { lane: 9, label: "ENGINE" },
  [NODE_KINDS.DATABASE]: { lane: 10, label: "DATABASE" },
  [NODE_KINDS.SERVICE]: { lane: 10, label: "SERVICE" },
  [NODE_KINDS.PLATFORM]: { lane: 10, label: "PLATFORM" },

  [NODE_KINDS.INFRASTRUCTURE]: { lane: 11, label: "INFRASTRUCTURE" },
  [NODE_KINDS.DEPLOYMENT]: { lane: 11, label: "DEPLOYMENT" },
  [NODE_KINDS.DISTRIBUTION]: { lane: 11, label: "DISTRIBUTION" },
  [NODE_KINDS.SECURITY]: { lane: 11, label: "SECURITY" },
  [NODE_KINDS.MONITORING]: { lane: 11, label: "MONITORING" },

  [NODE_KINDS.CONSTRAINT]: { lane: 12, label: "CONSTRAINT" },
  [NODE_KINDS.SCOPE]: { lane: 12, label: "SCOPE" },
  [NODE_KINDS.OUTCOME]: { lane: 12, label: "OUTCOME" }
});

/** Kinds that represent implementation rather than intent. */
export const TECHNICAL_KINDS = Object.freeze([
  NODE_KINDS.ARCHITECTURE,
  NODE_KINDS.TECHNOLOGY,
  NODE_KINDS.LANGUAGE,
  NODE_KINDS.FRAMEWORK,
  NODE_KINDS.ENGINE,
  NODE_KINDS.DATABASE,
  NODE_KINDS.SERVICE,
  NODE_KINDS.PLATFORM,
  NODE_KINDS.INFRASTRUCTURE,
  NODE_KINDS.DEPLOYMENT,
  NODE_KINDS.DISTRIBUTION,
  NODE_KINDS.SECURITY,
  NODE_KINDS.MONITORING
]);

/** Kinds that describe the product itself (what it is and does). */
export const PRODUCT_KINDS = Object.freeze([
  NODE_KINDS.DOMAIN,
  NODE_KINDS.GOAL,
  NODE_KINDS.AUDIENCE,
  NODE_KINDS.CONCEPT,
  NODE_KINDS.GENRE,
  NODE_KINDS.THEME,
  NODE_KINDS.FEATURE,
  NODE_KINDS.MECHANIC,
  NODE_KINDS.GAMEPLAY,
  NODE_KINDS.SYSTEM,
  NODE_KINDS.RULE,
  NODE_KINDS.BEHAVIOR,
  NODE_KINDS.ENTITY,
  NODE_KINDS.CONTENT,
  NODE_KINDS.DATA,
  NODE_KINDS.ASSET,
  NODE_KINDS.FLOW,
  NODE_KINDS.SCREEN,
  NODE_KINDS.INTEGRATION
]);

/** Returns the lane index for a kind (defaults to mid-graph). */
export function getLaneForKind(kind) {
  const entry = KIND_LANES[kind];
  return entry ? entry.lane : 6;
}

/** Returns the human label for a kind. */
export function getLabelForKind(kind) {
  const entry = KIND_LANES[kind];
  return entry ? entry.label : String(kind || "NODE").toUpperCase();
}

/** True when the kind is an implementation/technical concern. */
export function isTechnicalKind(kind) {
  return TECHNICAL_KINDS.includes(kind);
}

/** True when the kind describes the product rather than its build. */
export function isProductKind(kind) {
  return PRODUCT_KINDS.includes(kind);
}