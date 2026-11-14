/**
 * DEVPATH // Application Bootstrap
 * ------------------------------------------------------------------
 * Entry point for the graph-first roadmap.
 *
 * The legacy stage-wizard (js/main.js) is intentionally NOT loaded.
 * This app replaces it: there is one loop — offer choices, commit one,
 * reveal what it unlocks — instead of seven hardcoded stages.
 *
 * To verify the knowledge graph without a browser:
 *   node tests/validate_graph.mjs
 *   node tests/test_graph_engine.mjs
 * ------------------------------------------------------------------
 */

import { assembleKnowledge } from "./knowledge.js";
import { roadmapApp } from "./roadmapApp.js";

function boot() {
  try {
    // Register every domain's seeds before the first render, so the
    // entry frontier resolves immediately.
    assembleKnowledge();

    roadmapApp.init();

    // Surface the validator in the console for authoring feedback.
    import("./validateGraph.js")
      .then(({ validateGraph }) => {
        const result = validateGraph();
        if (!result.ok) {
          console.error(`[DevPath]: knowledge graph has ${result.errors.length} error(s)`);
          result.errors.forEach(e => console.error(`  \u2717 ${e}`));
        } else {
          console.log(`[DevPath]: knowledge graph OK \u2014 ${result.seedCount} seeds, all reachable`);
        }
      })
      .catch(() => { /* validator is a dev convenience only */ });
  } catch (err) {
    // A silent boot failure leaves a rendered-but-dead UI, which is the
    // hardest kind to debug. Fail loudly instead.
    console.error("[DevPath]: boot failed", err);
    const badge = document.getElementById("bp-stage-badge-text");
    if (badge) badge.textContent = `BOOT FAILED \u2014 ${err && err.message ? err.message : err}`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}