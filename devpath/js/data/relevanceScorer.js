/**
 * DEVPATH // Context-Aware Relevance & Prioritization Engine
 * Scores technology stack options and infrastructure decisions based on:
 * 1. Project Type (website, game, software)
 * 2. Selected Focus Characteristics (e.g. ecommerce, realtime, mobile, offline)
 * 3. Architecture Path (e.g. fullstack-web, static-jamstack, game-2d, cli-utility)
 * 4. Locked Stack Selections (e.g. Next.js -> Vercel, Godot -> Butler, Tauri -> Rust)
 */

export class RelevanceScorer {
  /**
   * Calculates a numeric relevance score (0..100) for a given candidate option.
   */
  static calculateScore(option, context = {}) {
    if (!option) return 0;

    const {
      type = null,
      focus = [],
      architecturePath = null,
      stack = {}
    } = context;

    let score = 0;
    const optTags = (option.tags || []).map(t => t.toLowerCase());
    const optCategory = (option.category || "").toLowerCase();
    const optId = (option.id || "").toLowerCase();

    // ──────────────────────────────────────────────
    // 1. Architecture Path Direct Affinities (+12 to +20)
    // ──────────────────────────────────────────────
    if (architecturePath) {
      if (architecturePath === "static-jamstack") {
        if (["astro", "tailwind", "netlify", "vercel", "cloudflare-infra"].includes(optId)) score += 18;
        if (["tls-ssl", "gh-actions-web"].includes(optId)) score += 10;
      } else if (architecturePath === "fullstack-web") {
        if (["react", "fastapi", "express", "postgresql", "gh-actions-web"].includes(optId)) score += 16;
        if (["sentry", "datadog", "redis", "postgresql-svc"].includes(optId)) score += 12;
      } else if (architecturePath === "game-2d") {
        if (["godot-2d", "gdscript", "aseprite", "ldtk", "fmod", "steam", "itch", "mobile-stores"].includes(optId)) score += 18;
        if (["github-actions-game", "butler-ci", "game-telemetry"].includes(optId)) score += 14;
      } else if (architecturePath === "game-3d") {
        if (["unreal", "unity", "csharp", "blueprints", "blender", "steam", "epic", "mobile-stores"].includes(optId)) score += 18;
        if (["wwise", "github-actions-game", "game-telemetry"].includes(optId)) score += 14;
      } else if (architecturePath === "cli-utility") {
        if (["rust", "go", "python", "clap", "cobra", "click", "package-managers", "github-releases"].includes(optId)) score += 20;
        if (["gh-actions-matrix"].includes(optId)) score += 14;
      } else if (architecturePath === "desktop-app") {
        if (["tauri", "electron", "code-signing-ci", "package-managers", "github-releases"].includes(optId)) score += 18;
      }
    }

    // ──────────────────────────────────────────────
    // 2. Selected Focus Characteristics Affinities (+8 to +25)
    // ──────────────────────────────────────────────
    (focus || []).forEach(fId => {
      const f = String(fId).toLowerCase();

      // Realtime / Low Latency
      if (f.includes("realtime") || f.includes("action") || f.includes("fighting")) {
        if (["websockets", "webrtc", "redis", "fastapi", "datadog", "prometheus-grafana"].includes(optId)) score += 14;
        if (optTags.includes("realtime") || optTags.includes("performance")) score += 10;
      }

      // Mobile / Cross-Platform
      if (f.includes("mobile") || f.includes("touch") || f.includes("responsive")) {
        if (["mobile-stores", "flutter-desktop", "unity-2d", "unity", "sentry"].includes(optId)) score += 25; // Highest for mobile!
        if (optTags.includes("mobile")) score += 15;
      }

      // E-Commerce / Financial / Transactional
      if (f.includes("commerce") || f.includes("transact") || f.includes("enterprise")) {
        if (["postgresql", "aws-infra", "secrets-vault", "waf-ddos", "tls-ssl", "datadog"].includes(optId)) score += 15;
        if (optTags.includes("security") || optTags.includes("database")) score += 8;
      }

      // Visual / Creative / Interactive
      if (f.includes("interactive") || f.includes("creative") || f.includes("portfolio")) {
        if (["react", "tailwind", "vercel", "aseprite", "spine", "threejs"].includes(optId)) score += 12;
      }

      // Narrative / RPG
      if (f.includes("rpg") || f.includes("narrative") || f.includes("story")) {
        if (["godot-2d", "gdscript", "sqlite", "steam", "steam-cloud", "steam-achievements"].includes(optId)) score += 14;
      }
    });

    // ──────────────────────────────────────────────
    // 3. Stack Synergy Affinities (+10 to +25)
    // ──────────────────────────────────────────────
    const stackValues = Object.values(stack || {});

    // Frontend -> Hosting Synergy
    if (stackValues.includes("react") || stackValues.includes("next-export")) {
      if (optId === "vercel" || optId === "vercel-host") score += 22;
      if (optId === "gh-actions-web") score += 12;
    }
    if (stackValues.includes("astro") || stackValues.includes("eleventy")) {
      if (optId === "netlify" || optId === "cloudflare-infra") score += 20;
    }

    // Game Engine -> Build Pipeline & Distro Synergy
    if (stackValues.includes("godot-2d") || stackValues.includes("godot-3d")) {
      if (optId === "gdscript") score += 25;
      if (optId === "butler-ci") score += 16;
      if (optId === "steam" || optId === "itch") score += 15;
    }
    if (stackValues.includes("unity") || stackValues.includes("unity-2d")) {
      if (optId === "csharp") score += 25;
      if (optId === "steam") score += 16;
      if (optId === "sentry") score += 14;
    }
    if (stackValues.includes("unreal")) {
      if (optId === "blueprints" || optId === "cpp") score += 25;
      if (optId === "epic" || optId === "steam") score += 16;
    }
    if (stackValues.includes("tauri")) {
      if (optId === "rust") score += 25;
      if (optId === "code-signing-ci") score += 18;
    }

    return score;
  }

  /**
   * Sorts candidate options descending by relevance score.
   * Attaches computed score and recommended flag.
   */
  static sortOptions(options = [], context = {}) {
    if (!Array.isArray(options)) return [];

    const scored = options.map(opt => {
      const score = RelevanceScorer.calculateScore(opt, context);
      return {
        ...opt,
        _relevanceScore: score,
        isRecommended: score >= 15
      };
    });

    // Sort descending by score; keep existing relative order on tie
    return scored.sort((a, b) => b._relevanceScore - a._relevanceScore);
  }

  /**
   * Returns the top recommended option ID or null if all zero.
   */
  static getTopRecommendation(options = [], context = {}) {
    const sorted = RelevanceScorer.sortOptions(options, context);
    if (sorted.length > 0 && sorted[0]._relevanceScore > 0) {
      return sorted[0];
    }
    return null;
  }
}

