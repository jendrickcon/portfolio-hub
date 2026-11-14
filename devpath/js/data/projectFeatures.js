/**
 * DEVPATH // Canonical Project Features & Exploration Paths
 * ------------------------------------------------------------------
 * First-class brainstorming and feature exploration model.
 * Bridges:
 *   Idea -> Decisions -> Possible Implementation Paths -> Features/Behavior -> Interconnected Blueprint
 *
 * Each project type and focus area maps to rich exploration paths
 * with semantic node roles (DECISION, EXPLORE, CONSIDER, DEPENDENCY, CONNECTION),
 * "Why Consider This?" explanations, and cross-feature connection flows.
 * ------------------------------------------------------------------
 */

export const PROJECT_FEATURES = {
  // ── GAME EXPLORATION PATHS ────────────────────────────────────
  game: {
    "game-educational": [
      {
        id: "feat-learning-mechanics",
        title: "Learning Mechanics",
        category: "EXPLORATION PATH",
        tagline: "Core educational loop & retention",
        description: "Mechanics designed for knowledge acquisition and active recall.",
        nodeRole: "explore",
        whyConsider: "Directly reinforces learning outcomes through interactive testing rather than passive reading.",
        iconId: "educational",
        subfeatures: [
          {
            id: "feat-quiz",
            title: "Interactive Quizzes",
            category: "FEATURE",
            tagline: "Timed, multiple-choice & adaptive challenges",
            description: "Modular question challenges that evaluate player comprehension.",
            nodeRole: "explore",
            whyConsider: "Proven active recall tool that provides quantitative player proficiency data.",
            iconId: "educational",
            crossLinks: [
              { toNodeId: "feat-scoring", relationship: "evaluates", edgeType: "relationship", label: "produces score" },
              { toNodeId: "feat-xp", relationship: "rewards", edgeType: "relationship", label: "awards XP" },
              { toNodeId: "feat-answer-damage", relationship: "drives", edgeType: "relationship", label: "inflicts damage" }
            ],
            children: [
              { id: "feat-timed-quiz", title: "Timed Quizzes", category: "MECHANIC", nodeRole: "consider", whyConsider: "Increases gameplay adrenaline and assesses quick-thinking fluency." },
              { id: "feat-adaptive-quiz", title: "Adaptive Difficulty", category: "MECHANIC", nodeRole: "consider", whyConsider: "Scales question difficulty dynamically based on player accuracy." }
            ]
          },
          {
            id: "feat-scoring",
            title: "Performance Scoring",
            category: "SYSTEM",
            tagline: "Accuracy & speed metric calculations",
            description: "Calculates mastery scores from completed learning challenges.",
            nodeRole: "connection",
            whyConsider: "Translates raw player input into quantifiable mastery metrics.",
            iconId: "system",
            crossLinks: [
              { toNodeId: "feat-analytics", relationship: "feeds_into", edgeType: "relationship", label: "metrics feed" }
            ]
          },
          {
            id: "feat-lessons",
            title: "Bite-Sized Lessons",
            category: "FEATURE",
            tagline: "Micro-learning modules",
            description: "Modular interactive content cards presenting theory before challenges.",
            nodeRole: "explore",
            whyConsider: "Prevents cognitive overload by delivering learning material in digestable 3-minute steps.",
            iconId: "framework"
          }
        ]
      },
      {
        id: "feat-gamification",
        title: "Gamification Engine",
        category: "EXPLORATION PATH",
        tagline: "Progression, motivation & engagement loops",
        description: "Incentive systems that keep players returning every day.",
        nodeRole: "explore",
        whyConsider: "Dramatically increases 30-day retention and completion rates through intrinsic and extrinsic rewards.",
        iconId: "action",
        subfeatures: [
          {
            id: "feat-xp",
            title: "Experience Points (XP)",
            category: "MECHANIC",
            tagline: "Cumulative progression currency",
            description: "Awards experience points for every completed quiz and challenge.",
            nodeRole: "explore",
            whyConsider: "Provides continuous immediate positive reinforcement for player effort.",
            iconId: "action",
            crossLinks: [
              { toNodeId: "feat-levels", relationship: "accumulates_to", edgeType: "relationship", label: "levels up" },
              { toNodeId: "feat-analytics", relationship: "logged_in", edgeType: "relationship", label: "progress telemetry" }
            ]
          },
          {
            id: "feat-levels",
            title: "Player Levels & Badges",
            category: "FEATURE",
            tagline: "Milestone unlocks and trophy showcases",
            description: "Visual tiers and trophies signifying subject mastery.",
            nodeRole: "consider",
            whyConsider: "Gives players social proof and tangible milestones to share and strive towards.",
            iconId: "framework"
          },
          {
            id: "feat-streaks",
            title: "Daily Study Streaks",
            category: "MECHANIC",
            tagline: "Habit formation & daily bonuses",
            description: "Tracks consecutive days of active learning.",
            nodeRole: "consider",
            whyConsider: "Builds daily habit loops by rewarding players for regular daily check-ins.",
            iconId: "realtime"
          }
        ]
      },
      {
        id: "feat-combat-learning",
        title: "Action / Combat Mechanics",
        category: "EXPLORATION PATH",
        tagline: "Answer-to-damage battle loops",
        description: "Gamified dungeon battles where correct answers defeat adversaries.",
        nodeRole: "explore",
        whyConsider: "Transforms dry question drills into high-stakes dungeon battles and boss encounters.",
        iconId: "fighting",
        subfeatures: [
          {
            id: "feat-answer-damage",
            title: "Combat-by-Answering",
            category: "MECHANIC",
            tagline: "Accuracy determines attack power",
            description: "Correct answers deal critical blows; wrong answers damage the player.",
            nodeRole: "consider",
            whyConsider: "Creates visceral game tension: player life-points depend on actual subject mastery.",
            iconId: "fighting",
            crossLinks: [
              { toNodeId: "feat-enemies", relationship: "targets", edgeType: "relationship", label: "strikes enemy" }
            ]
          },
          {
            id: "feat-enemies",
            title: "Dungeon Adversaries & Bosses",
            category: "SYSTEM",
            tagline: "Subject-matter monster encounters",
            description: "Thematic enemies that embody difficult quiz questions.",
            nodeRole: "explore",
            whyConsider: "Gives the game world personality and memorable milestone battles.",
            iconId: "rpg"
          }
        ]
      },
      {
        id: "feat-analytics",
        title: "Learning Analytics & Dashboard",
        category: "EXPLORATION PATH",
        tagline: "Student progress & weakness heatmaps",
        description: "Teacher and student overview dashboards of topic masteries.",
        nodeRole: "explore",
        whyConsider: "Identifies knowledge gaps so players and educators know precisely what to review.",
        iconId: "system",
        subfeatures: [
          {
            id: "feat-dashboard",
            title: "Mastery Dashboard",
            category: "FEATURE",
            tagline: "Visual competence graphs and weak-spot alerts",
            description: "Unified dashboard displaying scores, streaks, and focus recommendations.",
            nodeRole: "explore",
            whyConsider: "Gives learners a bird's-eye view of their educational journey.",
            iconId: "devtools"
          }
        ]
      }
    ]
  },

  // ── WEBSITE EXPLORATION PATHS ─────────────────────────────────
  website: {
    "website-dashboard": [
      {
        id: "feat-dashboard-suite",
        title: "Executive Dashboard",
        category: "EXPLORATION PATH",
        tagline: "Real-time metrics & management hub",
        description: "Central command dashboard with live KPI visualization and filtering.",
        nodeRole: "explore",
        whyConsider: "Provides users with an immediate high-level overview of their operational health.",
        iconId: "devtools",
        subfeatures: [
          {
            id: "feat-live-analytics",
            title: "Realtime Analytics",
            category: "FEATURE",
            tagline: "Time-series charts and event feeds",
            description: "Live charts tracking user traffic, throughput, and conversion rates.",
            nodeRole: "explore",
            whyConsider: "Allows instant detection of traffic anomalies and performance bottlenecks.",
            iconId: "realtime",
            crossLinks: [
              { toNodeId: "feat-user-profile", relationship: "correlates_with", edgeType: "relationship", label: "user telemetry" }
            ]
          },
          {
            id: "feat-user-profile",
            title: "User Profile & Account Hub",
            category: "FEATURE",
            tagline: "Preferences, avatars & security settings",
            description: "Self-service settings hub for managing user account details.",
            nodeRole: "explore",
            whyConsider: "Empowers users to configure notification preferences, credentials, and profile state.",
            iconId: "community"
          },
          {
            id: "feat-progress-tracking",
            title: "Activity & Progress Tracking",
            category: "FEATURE",
            tagline: "Audit trails & milestone completion",
            description: "Historical timeline tracking team task completions and project milestones.",
            nodeRole: "explore",
            whyConsider: "Maintains clear transparency and accountability across team members.",
            iconId: "system"
          }
        ]
      },
      {
        id: "feat-file-management",
        title: "Document & File Management",
        category: "EXPLORATION PATH",
        tagline: "Cloud upload, processing & search",
        description: "High-throughput asset storage, processing, and OCR text extraction pipeline.",
        nodeRole: "explore",
        whyConsider: "Centralizes document uploads, attachments, and searchable digital paper trails.",
        iconId: "cloud",
        subfeatures: [
          {
            id: "feat-file-upload",
            title: "Chunked File Upload",
            category: "FEATURE",
            tagline: "Resumable multi-part cloud storage uploads",
            description: "Upload engine supporting large PDFs, images, and video assets.",
            nodeRole: "explore",
            whyConsider: "Handles large files gracefully with auto-retry and progress bars.",
            iconId: "cloud",
            crossLinks: [
              { toNodeId: "feat-ocr-engine", relationship: "triggers", edgeType: "relationship", label: "extracts text" },
              { toNodeId: "feat-file-manager", relationship: "stores_in", edgeType: "relationship", label: "cataloged in" }
            ]
          },
          {
            id: "feat-ocr-engine",
            title: "OCR Text Extraction",
            category: "FEATURE",
            tagline: "Computer vision optical character recognition",
            description: "Extracts textual content from scanned PDFs and photo attachments.",
            nodeRole: "explore",
            whyConsider: "Transforms static uploaded images and paper receipts into searchable digital data.",
            iconId: "system",
            crossLinks: [
              { toNodeId: "feat-semantic-search", relationship: "indexes_into", edgeType: "relationship", label: "search index" }
            ]
          },
          {
            id: "feat-semantic-search",
            title: "Full-Text & Semantic Search",
            category: "FEATURE",
            tagline: "Instant keyword and vector similarity search",
            description: "Indexes document contents for instant sub-second lookup.",
            nodeRole: "explore",
            whyConsider: "Ensures users can find any document or contract instantly by typing keywords.",
            iconId: "devtools",
            crossLinks: [
              { toNodeId: "feat-file-manager", relationship: "filters", edgeType: "relationship", label: "queries files" }
            ]
          },
          {
            id: "feat-file-manager",
            title: "File Explorer UI",
            category: "FEATURE",
            tagline: "Folders, tags & asset preview modals",
            description: "Familiar desktop-style folder browser with thumbnail previews.",
            nodeRole: "explore",
            whyConsider: "Gives end-users a visual, comfortable way to organize their documents.",
            iconId: "framework"
          }
        ]
      }
    ]
  },

  // ── SOFTWARE EXPLORATION PATHS ────────────────────────────────
  software: {
    "software-cli": [
      {
        id: "feat-cli-experience",
        title: "CLI Developer Experience",
        category: "EXPLORATION PATH",
        tagline: "Terminal ergonomics & interactivity",
        description: "Interactive terminal tooling designed for developer speed and joy.",
        nodeRole: "explore",
        whyConsider: "Fast command-line workflows are essential for power users and CI/CD scripts.",
        iconId: "devtools",
        subfeatures: [
          {
            id: "feat-interactive-prompts",
            title: "Interactive Terminal Wizards",
            category: "FEATURE",
            tagline: "Arrow-key selections, fuzzy filters & prompts",
            description: "Conversational terminal prompts replacing complex flag memorization.",
            nodeRole: "explore",
            whyConsider: "Guides beginners through complex setup flows without reading long manual pages.",
            iconId: "action"
          },
          {
            id: "feat-tui-dashboard",
            title: "Terminal TUI Monitor",
            category: "FEATURE",
            tagline: "Curses/bubbletea multi-panel terminal UI",
            description: "Rich ASCII/Unicode dashboard running directly in stdout.",
            nodeRole: "consider",
            whyConsider: "Monitors live system jobs in pure terminal environments without needing a browser.",
            iconId: "framework"
          }
        ]
      },
      {
        id: "feat-data-pipelines",
        title: "Streaming Data Pipeline",
        category: "EXPLORATION PATH",
        tagline: "High-throughput validation & transformation",
        description: "Unix pipe-friendly data ingestion and formatting engine.",
        nodeRole: "explore",
        whyConsider: "Allows the CLI to process gigabytes of data with minimal memory usage via streams.",
        iconId: "database",
        subfeatures: [
          {
            id: "feat-stream-ingest",
            title: "Stream Processing Engine",
            category: "SYSTEM",
            tagline: "Zero-copy chunked stdin reader",
            description: "Reads input streams line-by-line without buffering entire files in RAM.",
            nodeRole: "explore",
            whyConsider: "Prevents out-of-memory crashes when parsing huge server logs or datasets.",
            iconId: "realtime",
            crossLinks: [
              { toNodeId: "feat-schema-validator", relationship: "passes_to", edgeType: "relationship", label: "validates" }
            ]
          },
          {
            id: "feat-schema-validator",
            title: "Schema Validation",
            category: "FEATURE",
            tagline: "Format assertions & error reporting",
            description: "Validates JSON/YAML/CSV data against strict schemas with helpful error pointers.",
            nodeRole: "explore",
            whyConsider: "Catches corrupted data early before it reaches downstream production databases.",
            iconId: "devtools"
          }
        ]
      }
    ]
  }
};

/**
 * Helper to retrieve exploration paths for a given project type and focus id.
 */
export function getExplorationPathsForContext(typeId, focusIds = []) {
  const typePool = PROJECT_FEATURES[typeId] || PROJECT_FEATURES.website;
  const results = [];

  // Match by specific focus key or fall back to first key
  const keys = Object.keys(typePool);
  keys.forEach(k => {
    const paths = typePool[k] || [];
    paths.forEach(p => {
      if (!results.find(r => r.id === p.id)) {
        results.push(p);
      }
    });
  });

  return results;
}

/**
 * Finds a specific feature definition by ID anywhere in the canonical feature tree.
 */
export function findFeatureById(featureId) {
  for (const typeKey of Object.keys(PROJECT_FEATURES)) {
    const typeGroup = PROJECT_FEATURES[typeKey];
    for (const focusKey of Object.keys(typeGroup)) {
      const paths = typeGroup[focusKey];
      for (const path of paths) {
        if (path.id === featureId) return path;
        if (Array.isArray(path.subfeatures)) {
          for (const sub of path.subfeatures) {
            if (sub.id === featureId) return sub;
            if (Array.isArray(sub.children)) {
              for (const ch of sub.children) {
                if (ch.id === featureId) return ch;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

