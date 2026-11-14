/**
 * DEVPATH // Decision Pipelines Architecture
 * ------------------------------------------------------------------
 * Decouples stage progression from rigid hardcoded numbers into
 * archetype-driven Decision Categories.
 *
 * Each project type declares its pipeline of decision categories.
 * The core engine queries the active pipeline dynamically.
 * ------------------------------------------------------------------
 */

export const DECISION_PIPELINES = {
  game: [
    { stage: 1, id: "foundation", title: "PROJECT NAME", archetypeTitle: "PROJECT FOUNDATION", subtitle: "Project identity & baseline", category: "FOUNDATION" },
    { stage: 2, id: "archetype", title: "PROJECT TYPE", archetypeTitle: "GAME DIRECTION & GENRE", subtitle: "Core genre and loop identity", category: "ARCHETYPE" },
    { stage: 3, id: "focus", title: "PROJECT FOCUS", archetypeTitle: "GAMEPLAY FOCUS", subtitle: "Pillars & player experience", category: "DIRECTION" },
    { stage: 4, id: "architecture", title: "ARCHITECTURE PATH", archetypeTitle: "RENDER & PLATFORM PATH", subtitle: "Engine topology & dimensions", category: "ARCHITECTURE" },
    { stage: 5, id: "technology", title: "TECHNOLOGY STACK", archetypeTitle: "ENGINE & CORE SYSTEMS", subtitle: "Engine, language & asset pipeline", category: "TECHNOLOGY" },
    { stage: 6, id: "infrastructure", title: "INFRASTRUCTURE & DEPLOYMENT", archetypeTitle: "SERVICES & DISTRIBUTION", subtitle: "Hosting, builds & telemetry", category: "INFRASTRUCTURE" },
    { stage: 7, id: "blueprint", title: "PROJECT BLUEPRINT", archetypeTitle: "PROJECT BLUEPRINT", subtitle: "Synthesized architectural DAG", category: "BLUEPRINT" }
  ],
  website: [
    { stage: 1, id: "foundation", title: "PROJECT NAME", archetypeTitle: "PROJECT FOUNDATION", subtitle: "Project identity & baseline", category: "FOUNDATION" },
    { stage: 2, id: "archetype", title: "PROJECT TYPE", archetypeTitle: "SITE PURPOSE & AUDIENCE", subtitle: "Functional archetype & scope", category: "ARCHETYPE" },
    { stage: 3, id: "focus", title: "PROJECT FOCUS", archetypeTitle: "CAPABILITIES & FOCUS", subtitle: "Experience & interaction goals", category: "DIRECTION" },
    { stage: 4, id: "architecture", title: "ARCHITECTURE PATH", archetypeTitle: "DELIVERY ARCHITECTURE", subtitle: "Delivery & state topology", category: "ARCHITECTURE" },
    { stage: 5, id: "technology", title: "TECHNOLOGY STACK", archetypeTitle: "CLIENT & SERVER STACK", subtitle: "Frontend, backend & persistence", category: "TECHNOLOGY" },
    { stage: 6, id: "infrastructure", title: "INFRASTRUCTURE & DEPLOYMENT", archetypeTitle: "HOSTING & EDGE NETWORKS", subtitle: "CDN, deployment & monitoring", category: "INFRASTRUCTURE" },
    { stage: 7, id: "blueprint", title: "PROJECT BLUEPRINT", archetypeTitle: "PROJECT BLUEPRINT", subtitle: "Synthesized architectural DAG", category: "BLUEPRINT" }
  ],
  software: [
    { stage: 1, id: "foundation", title: "PROJECT NAME", archetypeTitle: "PROJECT FOUNDATION", subtitle: "Project identity & baseline", category: "FOUNDATION" },
    { stage: 2, id: "archetype", title: "PROJECT TYPE", archetypeTitle: "DOMAIN & WORKFLOW", subtitle: "Problem domain and audience", category: "ARCHETYPE" },
    { stage: 3, id: "focus", title: "PROJECT FOCUS", archetypeTitle: "SYSTEM ATTRIBUTES", subtitle: "Performance, CLI & boundaries", category: "DIRECTION" },
    { stage: 4, id: "architecture", title: "ARCHITECTURE PATH", archetypeTitle: "RUNTIME TOPOLOGY", subtitle: "Application architecture model", category: "ARCHITECTURE" },
    { stage: 5, id: "technology", title: "TECHNOLOGY STACK", archetypeTitle: "CORE RUNTIME & LIBRARIES", subtitle: "Core language, CLI & packages", category: "TECHNOLOGY" },
    { stage: 6, id: "infrastructure", title: "INFRASTRUCTURE & DEPLOYMENT", archetypeTitle: "PACKAGING & RELEASES", subtitle: "Package managers & pipelines", category: "INFRASTRUCTURE" },
    { stage: 7, id: "blueprint", title: "PROJECT BLUEPRINT", archetypeTitle: "PROJECT BLUEPRINT", subtitle: "Synthesized architectural DAG", category: "BLUEPRINT" }
  ]
};

export function getPipelineForType(typeId) {
  return DECISION_PIPELINES[typeId] || DECISION_PIPELINES.website;
}

export function getStageConfig(typeId, stageNumber) {
  const pipeline = getPipelineForType(typeId);
  return pipeline.find(s => s.stage === stageNumber) || pipeline[0];
}

export function getTotalStagesForType(typeId) {
  return getPipelineForType(typeId).length;
}
