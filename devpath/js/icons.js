/**
 * DEVPATH // Presentation Layer Icon Registry
 * Encapsulates theme-specific vector SVGs for Blueprint (CAD/monoline) and Root (organic/biophilic).
 * Decoupled completely from technical data schemas.
 */

const PATH_ICONS = {
  "static-jamstack": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L9 9h6l-3 7"></path>
      <circle cx="12" cy="19" r="2"></circle>
    </svg>`
  },
  "fullstack-web": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="2" width="20" height="8" rx="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="18" r="3"></circle>
      <path d="M12 8v4M12 12l-6 3M12 12l6 3"></path>
    </svg>`
  },
  "interactive-spa": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 3v18M3 12h18"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22C6.5 22 2 17.5 2 12A10 10 0 0 1 12 2c5 0 9 4 9 9"></path>
      <circle cx="17" cy="15" r="4"></circle>
    </svg>`
  },
  "game-2d": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>
      <path d="M12 4v16M8 12h8"></path>
    </svg>`
  },
  "game-3d": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 3 1.5 6 4 8"></path>
      <path d="M12 6c-3.3 0-6 2.7-6 6 0 2 1 3.8 2.5 5"></path>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>`
  },
  "game-browser": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M8 12h8M12 8v8"></path>
    </svg>`
  },
  "desktop-app": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="3" width="20" height="18" rx="2"></rect>
      <line x1="2" y1="8" x2="22" y2="8"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20M4 7h16M7 17h10"></path>
    </svg>`
  },
  "cli-utility": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12l5-5-5-5"></path>
      <path d="M13 18h6"></path>
      <circle cx="16" cy="18" r="1.5"></circle>
    </svg>`
  },
  "backend-service": {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6"></path>
    </svg>`
  }
};

const FOCUS_ICONS = {
  educational: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 3v18M12 3c-4 0-8 2-8 7 0 6 8 11 8 11s8-5 8-11c0-5-4-7-8-7z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`
  },
  action: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h7.5z"></path>
    </svg>`
  },
  fighting: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M9 12l2 2 4-4"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M6 9l6 6 6-6"></path>
      <circle cx="12" cy="12" r="8"></circle>
    </svg>`
  },
  rpg: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z"></path>
      <path d="M12 6v6"></path>
    </svg>`
  },
  adventure: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7l2 5-5 2 3-7z"></path>
    </svg>`
  },
  puzzle: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <path d="M9 4v3a2 2 0 0 0 4 0V4M20 9h-3a2 2 0 0 0 0 4h3"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="9" cy="9" r="4"></circle>
      <circle cx="15" cy="15" r="4"></circle>
      <path d="M9 13l6-2"></path>
    </svg>`
  },
  strategy: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 20h16M7 20v-5l3-3V7a2 2 0 1 1 4 0v5l3 3v5"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"></path>
    </svg>`
  },
  simulation: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)"></ellipse>
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)"></ellipse>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="8"></circle>
      <path d="M12 4a8 8 0 0 1 8 8M12 20a8 8 0 0 1-8-8"></path>
    </svg>`
  },
  portfolio: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2"></rect>
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path>
    </svg>`
  },
  informational: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>`
  },
  interactive: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0 0 16.3 7.7"></path>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>`
  },
  automation: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
    </svg>`
  },
  productivity: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M8 6h8M8 12h8M8 18h5"></path>
      <rect x="3" y="3" width="18" height="18" rx="4"></rect>
    </svg>`
  },
  analytics: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M3 18l6-6 4 4 8-8"></path>
      <circle cx="21" cy="8" r="2"></circle>
    </svg>`
  },
  devtools: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"></path>
    </svg>`
  },
  system: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="6"></circle>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
    </svg>`
  },
  cli: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M5 12l5-5-5-5"></path>
      <path d="M13 18h6"></path>
      <circle cx="16" cy="18" r="1.5"></circle>
    </svg>`
  },
  desktop: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <rect x="3" y="4" width="18" height="14" rx="3"></rect>
      <path d="M8 20h8M12 18v2"></path>
    </svg>`
  },
  database: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <ellipse cx="12" cy="6" rx="8" ry="3"></ellipse>
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"></path>
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>
    </svg>`
  },
  monitoring: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M2 12h4l3 7 4-14 3 7h6"></path>
    </svg>`
  },
  security: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2l7 4v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V6l7-4z"></path>
    </svg>`
  },
  ai: {
    blueprint: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"></path>
      <circle cx="12" cy="17" r="5"></circle>
    </svg>`,
    root: `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"></path>
    </svg>`
  }
};

export function getPathIcon(pathId, theme = "blueprint") {
  const iconSet = PATH_ICONS[pathId];
  if (!iconSet) {
    return `<svg class="node-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"></circle></svg>`;
  }
  return iconSet[theme] || iconSet.blueprint;
}

export function getFocusIcon(iconId, theme = "blueprint") {
  const iconSet = FOCUS_ICONS[iconId] || FOCUS_ICONS.interactive;
  return iconSet[theme] || iconSet.blueprint;
}
