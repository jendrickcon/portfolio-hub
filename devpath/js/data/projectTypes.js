/**
 * PROJECT BLUEPRINT // Project Types & Technology Data Schema
 * Data-driven definitions separate from graph rendering logic.
 * Dual-theme iconography using clean inline SVGs (no emojis).
 */

export const THEME_CONFIGS = {
  blueprint: {
    category: "PROJECT ROOT",
    title: "NEW PROJECT",
    subtitle: "Define the core concept to begin architecture synthesis.",
    buttonLabel: "BUILD ARCHITECTURE",
    buttonText: "BUILD ARCHITECTURE",
    inputPlaceholder: "e.g., Campus Companion, AI Agent Hub",
    headerTitle: "DEV<span>PATH</span>",
    headerSubtitle: "Turn Ideas into Technical Blueprints",
    badgeLabel: "STAGE 01 / 06 — PROJECT NAME",
    iconSvg: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"></polygon>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`
  },
  root: {
    category: "PROJECT ROOT",
    title: "NEW PROJECT",
    subtitle: "Start with an idea. Shape your project architecture.",
    buttonLabel: "BUILD ARCHITECTURE",
    buttonText: "BUILD ARCHITECTURE",
    inputPlaceholder: "e.g., Campus Companion, StudyQuest",
    headerTitle: "DEV<span>PATH</span>",
    headerSubtitle: "Turn Ideas into Technical Blueprints",
    badgeLabel: "STAGE 01 / 06 — PROJECT NAME",
    iconSvg: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22v-9"></path>
      <path d="M9 13c0-4 3-7 7-7 0 4-3 7-7 7z"></path>
      <path d="M15 13c0-4-3-7-7-7 0 4 3 7 7 7z"></path>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"></circle>
    </svg>`
  }
};

export const ROOT_NODE_DEFAULT = {
  id: "root-project",
  type: "root",
  width: 350,
  height: 165
};

export const BRANCH_NODE_DIMENSIONS = {
  desktop: {
    width: 280,
    height: 180,
    gap: 36,
    verticalGap: 90
  },
  mobile: {
    width: 340,
    height: 156,
    gap: 24,
    verticalGap: 36
  }
};

export const PROJECT_TYPES = [
  {
    id: "website",
    title: "WEBSITE",
    category: "PROJECT TYPE",
    tagline: "WEB DEVELOPMENT",
    description: "Build an interactive website, web application, public portal, or full-stack service.",
    confirmationText: "Your project is now classified as a web application / web development project.",
    icons: {
      blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>`,
      root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="5" r="3"></circle>
        <circle cx="5" cy="18" r="3"></circle>
        <circle cx="19" cy="18" r="3"></circle>
        <path d="M12 8v4"></path>
        <path d="M12 12l-5 3"></path>
        <path d="M12 12l5 3"></path>
      </svg>`
    }
  },
  {
    id: "game",
    title: "GAME",
    category: "PROJECT TYPE",
    tagline: "GAME DEVELOPMENT",
    description: "Build a 2D, 3D, or browser-based game or interactive experience.",
    confirmationText: "Your project is now classified as a game development project.",
    icons: {
      blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <rect x="2" y="6" width="20" height="12" rx="4"></rect>
        <path d="M6 12h4m-2-2v4"></path>
        <circle cx="15" cy="10" r="1" fill="currentColor"></circle>
        <circle cx="18" cy="13" r="1" fill="currentColor"></circle>
      </svg>`,
      root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9 2.12 0 4.07-.74 5.61-1.97"></path>
        <path d="M17 14l4-4-4-4"></path>
        <path d="M21 10H11"></path>
      </svg>`
    }
  },
  {
    id: "software",
    title: "SOFTWARE",
    category: "PROJECT TYPE",
    tagline: "SOFTWARE DEVELOPMENT",
    description: "Build a desktop application, CLI tool, utility, or other software system.",
    confirmationText: "Your project is now classified as a software development / system project.",
    icons: {
      blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>`,
      root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20"></path>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>`
    }
  }
];
