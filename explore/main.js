import { PixelEnvironment, computePixelSceneFrame } from './pixel-env.js';

// The HTML recovery panel owns this visit after a controller-load timeout.
// Reject the guarded import before registering controls or starting a renderer.
if (document.documentElement.dataset.workstationState === 'error') {
  throw new Error('Workstation startup expired');
}

// Normalize explicit /index.html visits to canonical /explore/
if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('index.html')) {
  const cleanPath = (window.location.pathname.replace(/\/index\.html$/, '/') || '/') + window.location.search + window.location.hash;
  window.history.replaceState(null, '', cleanPath);
}

const STORAGE_KEY = 'enuhri_explore_display_mode';
const params = new URLSearchParams(window.location.search);
const DEBUG_MODE = params.get('debug') === '1';
const INITIAL_NO_WEBGL = params.get('nowebgl') === '1';
const INITIAL_PIXEL_MODE = ['smooth', 'quantized', 'lowres75', 'lowres50'].includes(params.get('pixel3d'))
  ? params.get('pixel3d')
  : 'smooth';

const EMBED_CONFIG = {
  virtualDesktopWidth: 980,
  compactMinW: 268,
  compactMinH: 148,
  desktopMinW: 600,
  desktopMinH: 326,
  loadTimeoutMs: 8000,
  allowUrlOverride: true,
};
const rawEmbedWidthParam = params.get('embedw');
const EMBED_WIDTH_OVERRIDE = EMBED_CONFIG.allowUrlOverride &&
  (rawEmbedWidthParam === '980' || rawEmbedWidthParam === '100%' || rawEmbedWidthParam === 'auto')
  ? rawEmbedWidthParam
  : 'auto';

const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;

let reducedMotion = Boolean(motionQuery && motionQuery.matches);
let coarsePointer = Boolean(coarseQuery && coarseQuery.matches);
let storedManualMode = (() => {
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    return val === '3d' || val === '2d' ? val : null;
  } catch {
    return null;
  }
})();

let manual3dQuality = 'auto';
let pixelMode = INITIAL_PIXEL_MODE;
let simulatedNoWebgl = INITIAL_NO_WEBGL;
let webglFailed = false;
let webglScene = null;
let webglLoading = null;
let webglStatusText = INITIAL_NO_WEBGL ? 'simulated-off' : 'inactive';
let displayMode = null; // null until first renderer projects & commits ('3d' | '2d')

const initStartMs = performance.now();
let initComplete = false;
let initRevealing = false;
let modeRequestToken = 0;
let slowInitTimer = null;
let fatalInitTimer = null;
let initFadeTimer = null;

const rootEl = document.documentElement;
const modeGroupEl = document.getElementById('display-mode-group');
const initOverlayEl = document.getElementById('workstation-init');
const initStageTextEl = document.getElementById('init-stage-text');
const initHintEl = document.getElementById('init-hint');
const initActionsEl = document.getElementById('init-actions');
const initSwitch2dBtn = document.getElementById('init-switch-2d-btn');

const canvasEl = document.getElementById('crt-scene-canvas');
const pixelMainEl = document.getElementById('proto-main');
const pixelWorldEl = document.getElementById('pixel2d-world');
const pixelRoomBandsEl = document.getElementById('pixel2d-room-bands');
const pixel2dCanvasEl = document.getElementById('pixel2d-env-canvas');
const pixelEnv = new PixelEnvironment(pixel2dCanvasEl);

const chassisEl = document.getElementById('crt-chassis');
const overlayEl = chassisEl.querySelector('.screen-overlay');
const screenContentEl = document.getElementById('screen-content');
const srStatusEl = document.getElementById('sr-status');
const perfHudEl = document.getElementById('perf-hud');

const modeRadio3d = document.getElementById('mode-radio-3d');
const modeRadio2d = document.getElementById('mode-radio-2d');
const debugControlsEl = document.getElementById('debug-controls');
const qualitySelect = document.getElementById('quality-select');
const pixelModeSelect = document.getElementById('pixel-mode-select');
const webglBtn = document.getElementById('toggle-webgl-btn');
const resetPrefBtn = document.getElementById('reset-pref-btn');

const hwDiskBtn = document.getElementById('hw-disk-btn');
const toolbarPower = document.getElementById('toolbar-power');
const hwPowerBtn = document.getElementById('hw-power-btn');

if (DEBUG_MODE) {
  document.body.classList.add('has-debug');
  debugControlsEl.hidden = false;
  perfHudEl.hidden = false;
}
pixelModeSelect.value = pixelMode;

const GITHUB_MARK_SVG = '<svg class="repo-icon" aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.64 7.64 0 0 1 8 4.61c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

const INTERACTIVE_PREVIEW_CONFIG = {
  'udm-radar': {
    title: 'UDM-RADAR interactive project reconstruction',
    embedUrl: '/?embed=project&project=udm-radar',
    fallbackEmbedUrl: '/professional/index.html?embed=project&project=udm-radar',
    caseStudyHref: '/#udm-radar',
    posterAlt: 'UDM-RADAR analytics dashboard and GWA performance trend screenshot',
  },
  'studyquest': {
    title: 'StudyQuest interactive project reconstruction',
    embedUrl: '/?embed=project&project=studyquest',
    fallbackEmbedUrl: '/professional/index.html?embed=project&project=studyquest',
    caseStudyHref: '/#studyquest',
    posterAlt: 'StudyQuest course dashboard and learning path screenshot',
  },
};

const PREVIEW_ALLOWED_MESSAGES = new Set([
  'project-embed-ready',
  'project-embed-height',
  'project-embed-close-request',
  'project-embed-open-full-case-study',
]);

const LAUNCH_DESTINATIONS = {
  professional: {
    url: '/',
    appName: 'Professional Portfolio',
    headline: 'OPENING PROFESSIONAL PORTFOLIO...',
    detail: 'HANDING OFF TO FULL SITE',
  },
  'udm-radar': {
    url: '/#udm-radar',
    appName: 'UDM-RADAR Case Study',
    headline: 'OPENING UDM-RADAR CASE STUDY...',
    detail: 'LOADING EVIDENCE AND INTERACTIVE RECONSTRUCTION',
  },
  studyquest: {
    url: '/#studyquest',
    appName: 'StudyQuest Case Study',
    headline: 'OPENING STUDYQUEST CASE STUDY...',
    detail: 'LOADING EVIDENCE AND INTERACTIVE RECONSTRUCTION',
  },
  'art-gallery': {
    url: '/art-gallery/',
    appName: 'Enuhri Art Gallery',
    headline: 'OPENING ENUHRI ART GALLERY...',
    detail: 'CONNECTING TO THE VIRTUAL EXHIBIT',
    returnHash: '#menu',
  },
  cyberdefender: {
    url: '/cyberdefender/',
    appName: 'Cyber Defender',
    headline: 'OPENING CYBER DEFENDER...',
    detail: 'INITIALIZING SIMULATED THREAT ENVIRONMENT',
    returnHash: '#menu',
  },
  devpath: {
    url: '/devpath/',
    appName: 'DevPath',
    headline: 'OPENING DEVPATH...',
    detail: 'LOADING GAME ARCHITECTURE GRAPH',
    returnHash: '#menu',
  },
  sandbox: {
    url: '/sandbox/',
    appName: 'Sandbox',
    headline: 'MOUNTING SANDBOX.SYS...',
    detail: 'LOADING MATERIAL SIMULATION',
    returnHash: '#menu',
  },
};

// Six visible catalog slots (DevPath occupies Slot 06; Sandbox launches from centered floppy bay)
const CATALOG_SLOTS = [
  {
    index: '01',
    id: 'professional',
    name: 'Professional Portfolio',
    status: 'LIVE',
    category: 'Primary Hiring-Facing Portfolio',
    tagline: 'Evidence-Backed Case Studies, Public Résumé & System Reconstructions',
    summary: 'The canonical hiring-facing portfolio served at /, presenting UDM-RADAR, StudyQuest, Mini PCS, supporting media, project-linked capabilities, and a phone-free public résumé.',
    devStatus: 'LIVE — Primary Portfolio at /',
    link: '/',
  },
  {
    index: '02',
    id: 'udm-radar',
    name: 'UDM-RADAR',
    status: 'READY',
    category: 'Academic Analytics & Decision-Support System (Capstone)',
    tagline: 'Advisory Risk Analytics and GWA Projection on Synthetic Records',
    summary: 'A four-member BSIT capstone prototype for the College of Computing Studies at Universidad de Manila. Uses synthetic academic data for privacy; Decision Tree Regressor GWA projections remain advisory to support faculty and student review rather than making autonomous academic decisions.',
    features: [
      'Three role-governed portals: Student, Faculty, and Admin',
      'Advisory GWA projections powered by a Decision Tree Regressor on synthetic records',
      'Human-in-the-loop intervention workflow supporting faculty review',
      'Interactive Chart.js longitudinal performance trends and curriculum checklist validation',
      'Audit trails, risk rosters, and branded Dompdf exports (not deployed on live student records)',
    ],
    technologies: ['PHP 8.2', 'MySQL / MariaDB', 'Python', 'Flask', 'scikit-learn', 'Chart.js', 'Dompdf'],
    devStatus: 'FUNCTIONAL CAPSTONE PROTOTYPE — SYNTHETIC DATASET / HUMAN REVIEW ONLY',
    image: '../assets/projects/udm-radar.png',
    actions: [
    { label: 'OPEN FULL CASE STUDY ▸', compactLabel: 'CASE STUDY', ariaLabel: 'Open full case study', href: '/#udm-radar', primary: true, external: false },
    { label: 'VIEW SOURCE REPOSITORY', compactLabel: 'SOURCE', href: 'https://github.com/jendrickcon/udm-radar', primary: false, external: true, icon: 'github' },
    ],
  },
  {
    index: '03',
    id: 'studyquest',
    name: 'StudyQuest',
    status: 'READY',
    category: 'AI-Assisted Gamified Learning Platform',
    tagline: 'Turn Syllabi Into Structured Courses and Assessments',
    summary: 'An AI-assisted team learning platform that transforms uploaded syllabi, modules, and reviewers into structured chapter reviews, mixed assessments, and progression tracks using Gemini API integration with Pydantic-validated structured output.',
    features: [
      'Structured course generation from uploaded documents via Gemini API with Pydantic-validated output',
      'Chapter reviews highlighting core concepts, misconceptions, and exam traps',
      'Server-graded mixed assessments: Multiple Choice, True/False, Identification, and Enumeration',
      'Progression engine with XP rewards, streaks, test-out routes, and anti-farming safeguards',
      'Mobile-first responsive reader and full interactive case study on the main portfolio',
    ],
    technologies: ['Django 5.2', 'Python', 'Gemini API', 'Pydantic', 'SQLite', 'Vanilla JS'],
    devStatus: 'FUNCTIONAL TEAM PROJECT — LEARNING OUTCOMES NOT VERIFIED',
    image: '../assets/projects/studyquest.png',
    actions: [
    { label: 'OPEN FULL CASE STUDY ▸', compactLabel: 'CASE STUDY', ariaLabel: 'Open full case study', href: '/#studyquest', primary: true, external: false },
    { label: 'VIEW SOURCE REPOSITORY', compactLabel: 'SOURCE', href: 'https://github.com/zap1104/studyquest', primary: false, external: true, icon: 'github' },
    ],
  },
  {
    index: '04',
    id: 'art-gallery',
    name: 'Enuhri Art Gallery',
    status: 'READY',
    category: 'Interactive Virtual Museum',
    link: '/art-gallery/',
  },
  {
    index: '05',
    id: 'cyberdefender',
    name: 'Cyber Defender',
    status: 'READY',
    category: 'Cybersecurity Simulation Game',
    tagline: 'Game-Based Mobile Cybersecurity Learning Adaptation',
    summary: 'Cyber Defender is a mobile game-based learning project originally designed for Android with Godot 4 and GDScript. Players navigate system environments, identify simulated cybersecurity threats, and select defensive responses through tactical turn-based encounters.',
    photoAlt: 'Cyber Defender combat encounter showing the player avatar confronting Spyware malware during System Overload.',
    extraSections: [
      {
        title: 'WHY A WEB VERSION?',
        body: 'The original project was designed as an Android game. This portfolio version recreates selected gameplay systems for the browser so visitors can try the experience immediately while preserving the project’s core threat-recognition and response mechanics.',
      },
    ],
    featuresTitle: 'CORE GAMEPLAY',
    features: [
      'Grid-based hardware and hazard-zone exploration',
      'Turn-based incident response using Execute, Knowledge, Patches, and Run',
      'Simulated malware archetypes with distinct behaviors and weaknesses',
      'Beginner, Intermediate, and Advanced difficulty structures',
      'Offline progression and predefined simulated scenarios',
    ],
    boundaryNote: 'Educational simulation only. Cyber Defender does not scan devices or function as antivirus, firewall, or intrusion-detection software.',
    technologies: ['Godot 4 & GDScript (Original Android Design)', 'HTML5 / Vanilla ES Modules (Browser Adaptation)', 'Web Audio API', 'LocalStorage'],
    devStatus: 'ORIGINAL ANDROID DESIGN (GODOT 4 / GDSCRIPT) — PORTFOLIO BROWSER ADAPTATION AT /cyberdefender/ (NOT FULL BUILD PARITY)',
    image: '../assets/projects/cyberdefender.png',
    actions: [
      { label: 'PLAY CYBER DEFENDER ▸', compactLabel: 'PLAY', ariaLabel: 'Play Cyber Defender', href: '/cyberdefender/', primary: true, external: false },
      { label: 'VIEW SOURCE REPOSITORY', compactLabel: 'SOURCE', href: 'https://github.com/jendrickcon/portfolio-hub/tree/main/cyberdefender', primary: false, external: true, icon: 'github' },
    ],
  },
  {
    index: '06',
    id: 'devpath',
    name: 'DevPath',
    status: 'PAUSED PROTOTYPE',
    statusKey: 'paused',
    category: 'Architecture & Decision-Graph Prototype (Paused)',
    tagline: 'Graph-First Project Architecture Explorer',
    summary: 'An experimental decision-graph prototype that maps project goals and constraints to candidate technical stacks and architecture trade-offs. Development is currently paused: the Game Architecture branch is interactive, while Software & Systems and Website & Web App domains remain incomplete.',
    features: [
      'Interactive Game Architecture decision graph with constraint filtering',
      'Dual Blueprint / Root visual themes and live architecture breadcrumb trail',
      'Validated JSON graph schema and standalone Node.js engine test checks',
      'Development intentionally paused while broader non-game domains remain incomplete',
    ],
    technologies: ['HTML5', 'CSS3', 'Vanilla ES Modules', 'SVG Graph', 'JSON Schema'],
    devStatus: 'PAUSED PROTOTYPE — GAME ARCHITECTURE AVAILABLE; BROADER DOMAINS INCOMPLETE',
    actions: [
      { label: 'OPEN DEVPATH ▸', compactLabel: 'OPEN', ariaLabel: 'Open DevPath', href: '/devpath/', primary: true, external: false },
      { label: 'VIEW SOURCE REPOSITORY', compactLabel: 'SOURCE', href: 'https://github.com/jendrickcon/portfolio-hub/tree/main/devpath', primary: false, external: true, icon: 'github' },
    ],
  },
];

const INLINE_DOSSIER_IDS = new Set(['udm-radar', 'studyquest', 'cyberdefender', 'devpath']);

const STATE_GLOW_HEX = {
  standby: '#6b7c3e',
  menu: '#39ff14',
  live: '#00e5ff',
  paused: '#ffbf00',
  off: '#122014',
};

let currentView = 'standby'; // 'standby' | 'boot' | 'menu' | 'dossier' | 'embed' | 'restarting'
let lastTriggerAppId = null;
let activeTimers = [];
let bootDone = false;
let isRestarting = false;
let modeSwitchTimer = null;
let activeEmbedState = null;
let embedProjection = 'pending';
let lastEmbedReloadCount = 0;
let activeDossierPreview = null;
let cancelDossierShellAnim = null;
let activeLaunchState = null;

function clearLaunchTransition() {
  if (!activeLaunchState) return;
  const st = activeLaunchState;
  activeLaunchState = null;
  if (st.raf1) cancelAnimationFrame(st.raf1);
  if (st.raf2) cancelAnimationFrame(st.raf2);
  if (st.navTimerId) clearTimeout(st.navTimerId);
  if (st.recoveryTimerId) clearTimeout(st.recoveryTimerId);
  if (typeof st.onKeyDown === 'function') {
    document.removeEventListener('keydown', st.onKeyDown, true);
  }
}

function teardownDossierPreview() {
  if (typeof cancelDossierShellAnim === 'function') {
    cancelDossierShellAnim();
    cancelDossierShellAnim = null;
  }
  if (!activeDossierPreview) return;
  const preview = activeDossierPreview;
  activeDossierPreview = null;
  if (preview.timeoutId) {
    clearTimeout(preview.timeoutId);
    preview.timeoutId = null;
  }
  if (typeof preview.onMessage === 'function') {
    window.removeEventListener('message', preview.onMessage);
  }
  if (preview.iframe) {
    try {
      preview.iframe.src = 'about:blank';
    } catch {}
    preview.iframe.remove();
  }
  document.body.classList.remove('is-dossier-preview-active');
}

// Floppy bay state machine + 6-frame Pixel 2D stepper
let drivePhase = 'closed'; // 'closed' | 'intent' | 'opening' | 'open'
let driveIntentTimer = null;
let driveOpenTimer = null;
let driveLeaveTimer = null;
let driveStepInterval = null;
let currentPixelFrame = 0;
let driveLatched = false;
let lastDiskPointerType = 'mouse';

// Pixel 2D 13.5 FPS environment loop, inactivity sleep & unified scene-pose tween
let pixel2dRafId = null;
let pixel2dLastMs = performance.now();
let pixel2dActivityMs = performance.now();
let pixel2dUploadTimestamps = [];
let pixel2dStateText = 'idle (0 FPS)';
let pixelPoseTarget = 'standby';
let pixelCamCurrent = null;
let pixelCamTween = null;

function setUrlHash(hashValue, { replace = false } = {}) {
  const nextUrl = window.location.pathname + window.location.search + (hashValue || '');
  const currentUrl = window.location.pathname + window.location.search + window.location.hash;
  if (nextUrl === currentUrl) return;
  if (replace) window.history.replaceState(null, '', nextUrl);
  else window.history.pushState(null, '', nextUrl);
}

// A frame uses one viewport sample for the physical scene and all of its controls.
let settledViewport;
let geometryGeneration = 0;
let resizeFrame = 0;

function publishProjection(screen, disk, power, moving = false) {
  const fitting = currentView === 'dossier' && Boolean(settledViewport.dossierFit) && moving;
  const wasFitting = screenContentEl.inert;
  if (wasFitting !== fitting) {
    screenContentEl.inert = fitting;
    if (!fitting && currentView === 'dossier' && document.activeElement === document.body) {
      focusSafely(document.getElementById('dossier-title'));
    }
  }
  const { left, right, top, bottom } = settledViewport.visible;
  const inside = r => r.x >= left && r.y >= top && r.x + r.w <= right && r.y + r.h <= bottom;
  const hardwareOverlaps = disk.x < power.x + power.w && power.x < disk.x + disk.w
    && disk.y < power.y + power.h && power.y < disk.y + disk.h;
  for (const [prefix, rect] of [['screen', screen], ['disk-hit', disk], ['power-hit', power]]) {
    for (const key of ['x', 'y', 'w', 'h']) {
      chassisEl.style.setProperty(`--${prefix}-${key}`, `${rect[key].toFixed(2)}px`);
    }
  }
  const focused = document.activeElement;
  hwPowerBtn.toggleAttribute('hidden', !inside(power));
  hwDiskBtn.toggleAttribute('hidden', !inside(disk) || (hardwareOverlaps && !hwPowerBtn.hidden));
  toolbarPower.toggleAttribute('hidden', currentView !== 'dossier' || !hwPowerBtn.hidden);
  if (focused === hwPowerBtn && hwPowerBtn.hidden && !toolbarPower.hidden) focusSafely(toolbarPower);
  if (focused === toolbarPower && toolbarPower.hidden && !hwPowerBtn.hidden) focusSafely(hwPowerBtn);
  if (focused === hwDiskBtn && hwDiskBtn.hidden) focusSafely(document.querySelector('.ctrl-btn--return'));
  if (currentView === 'embed') {
    const previous = embedProjection;
    embedProjection = moving ? 'moving' : 'settled';
    if (previous !== embedProjection) updateEmbedViewportMode();
  }
}

function applyPixelSceneProjection(frame, moving = false) {
  if (!frame || displayMode !== '2d') return;
  if (pixelWorldEl) {
    pixelWorldEl.style.transform = `translate3d(${frame.tx.toFixed(2)}px, ${frame.ty.toFixed(2)}px, 0) scale(${frame.scale.toFixed(4)})`;
  }
  if (pixelRoomBandsEl) {
    pixelRoomBandsEl.style.setProperty('--px-dado-y', `${frame.dadoY}px`);
    pixelRoomBandsEl.style.setProperty('--px-desk-top-y', `${frame.deskTopY}px`);
    pixelRoomBandsEl.style.setProperty('--px-desk-lip-y', `${frame.deskLipY}px`);
  }
  const cs = chassisEl.style;
  publishProjection(frame.screenRect, frame.diskRect, frame.powerRect, moving);
  if (frame.powerVis) {
    cs.setProperty('--power-vis-w', `${frame.powerVis.w.toFixed(2)}px`);
    cs.setProperty('--power-vis-h', `${frame.powerVis.h.toFixed(2)}px`);
  }
}

function setPixelScenePose(poseName, immediate = false) {
  pixelPoseTarget = poseName || 'standby';
  if (displayMode !== '2d') return;

  const { w, h, top } = settledViewport.stage;
  const targetFrame = computePixelSceneFrame(w, h, pixelPoseTarget, top, settledViewport.dossierFit);

  if (immediate || reducedMotion || !pixelCamCurrent) {
    pixelCamTween = null;
    pixelCamCurrent = targetFrame;
    applyPixelSceneProjection(targetFrame);
    renderDebugHud();
    return;
  }

  pixelCamTween = {
    from: { ...pixelCamCurrent },
    to: targetFrame,
    startMs: performance.now(),
    durationMs: targetFrame.durationMs || 650,
  };
  pixel2dActivityMs = performance.now();
  startOrResumePixel2dLoop();
}

function clearActiveTimers() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
  clearLaunchTransition();
}

function scheduleTimer(fn, ms) {
  const id = setTimeout(fn, ms);
  activeTimers.push(id);
  return id;
}

function announce(text) {
  if (!srStatusEl) return;
  srStatusEl.textContent = '';
  requestAnimationFrame(() => {
    srStatusEl.textContent = text;
  });
}

function focusSafely(el) {
  if (!initComplete) return;
  if (el && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

function readViewportMetrics() {
  const docEl = document.documentElement;
  const layoutW = Math.max(1, Math.round(docEl?.clientWidth || window.innerWidth));
  const layoutH = Math.max(1, Math.round(window.innerHeight || docEl?.clientHeight));
  const vv = window.visualViewport;
  const visualScale = vv && typeof vv.scale === 'number' ? vv.scale : 1;
  const visualW = Math.max(1, Math.round(vv ? vv.width : layoutW));
  const visualH = Math.max(1, Math.round(vv ? vv.height : layoutH));
  const visualOffsetLeft = vv ? +(vv.offsetLeft || 0).toFixed(2) : 0;
  const visualOffsetTop = vv ? +(vv.offsetTop || 0).toFixed(2) : 0;
  const isScaled = Boolean(vv) && Math.abs(visualScale - 1) >= 0.02;
  const w = isScaled ? layoutW : (vv ? visualW : layoutW);
  const h = isScaled ? layoutH : (vv ? visualH : layoutH);
  return {
    w,
    h,
    layoutW,
    layoutH,
    visualW,
    visualH,
    visualScale: +visualScale.toFixed(3),
    visualOffsetLeft,
    visualOffsetTop,
    isScaled,
  };
}

function isCompactViewport() {
  const { w, h } = settledViewport;
  return w <= 639 || h <= 560;
}

function resolveDisplayMode() {
  if (simulatedNoWebgl || webglFailed) return '2d';
  if (storedManualMode === '3d' || storedManualMode === '2d') return storedManualMode;
  if (isCompactViewport() || coarsePointer || reducedMotion) return '2d';
  return '3d';
}

function resolve3dQualityTier() {
  if (displayMode !== '3d' || simulatedNoWebgl || webglFailed) return 'low';
  if (isCompactViewport() || coarsePointer) return 'mobile';
  if (manual3dQuality === 'medium') return 'medium';
  return 'high';
}

function setScreenLightState(stateName) {
  const color = STATE_GLOW_HEX[stateName] || STATE_GLOW_HEX.menu;
  document.documentElement.style.setProperty('--pixel-desk-glow', color);
  if (displayMode === '3d' && webglScene) {
    webglScene.setScreenState(stateName);
  }
}

function setPixelFloppyFrameTarget(targetFrame) {
  if (driveStepInterval) {
    clearInterval(driveStepInterval);
    driveStepInterval = null;
  }
  const immediate = reducedMotion || displayMode === '3d';
  if (immediate || currentPixelFrame === targetFrame) {
    currentPixelFrame = targetFrame;
    hwDiskBtn.dataset.pixelFrame = String(targetFrame);
    document.body.dataset.pixelFrame = String(targetFrame);
    return;
  }
  driveStepInterval = setInterval(() => {
    if (currentPixelFrame < targetFrame) currentPixelFrame += 1;
    else if (currentPixelFrame > targetFrame) currentPixelFrame -= 1;
    hwDiskBtn.dataset.pixelFrame = String(currentPixelFrame);
    document.body.dataset.pixelFrame = String(currentPixelFrame);
    if (currentPixelFrame === targetFrame) {
      clearInterval(driveStepInterval);
      driveStepInterval = null;
    }
  }, 210);
}

function syncFloppyDomAndScene() {
  hwDiskBtn.dataset.driveState = drivePhase;
  document.body.dataset.driveState = drivePhase;
  const isExpanded = drivePhase === 'opening' || drivePhase === 'open';
  hwDiskBtn.setAttribute('aria-expanded', String(isExpanded));

  setPixelFloppyFrameTarget(isExpanded ? 5 : 0);

  if (displayMode === '3d' && webglScene) {
    const progress = isExpanded ? 1 : 0;
    const led = isExpanded ? 'open' : drivePhase === 'intent' ? 'intent' : 'idle';
    webglScene.setFloppyState({ progress, led });
  }
}

function clearFloppyTimers() {
  if (driveIntentTimer) { clearTimeout(driveIntentTimer); driveIntentTimer = null; }
  if (driveOpenTimer) { clearTimeout(driveOpenTimer); driveOpenTimer = null; }
  if (driveLeaveTimer) { clearTimeout(driveLeaveTimer); driveLeaveTimer = null; }
}

function closeFloppyTray(immediate = false) {
  clearFloppyTimers();
  driveLatched = false;
  if (drivePhase !== 'closed' || immediate) {
    drivePhase = 'closed';
    if (immediate) {
      if (driveStepInterval) { clearInterval(driveStepInterval); driveStepInterval = null; }
      currentPixelFrame = 0;
      hwDiskBtn.dataset.pixelFrame = '0';
      document.body.dataset.pixelFrame = '0';
    }
    syncFloppyDomAndScene();
  }
}

function openFloppyTrayFromHover() {
  clearFloppyTimers();
  drivePhase = 'intent';
  syncFloppyDomAndScene();

  driveIntentTimer = setTimeout(() => {
    driveIntentTimer = null;
    const immediate = reducedMotion;
    drivePhase = immediate ? 'open' : 'opening';
    syncFloppyDomAndScene();

    if (immediate) {
      announce('Unknown disk detected: SANDBOX.SYS. Activate to launch Sandbox.');
    } else {
      driveOpenTimer = setTimeout(() => {
        driveOpenTimer = null;
        if (drivePhase === 'opening') {
          drivePhase = 'open';
          syncFloppyDomAndScene();
          announce('Unknown disk detected: SANDBOX.SYS. Activate to launch Sandbox.');
        }
      }, 1200);
    }
  }, 600);
}

function openFloppyTrayLatched() {
  clearFloppyTimers();
  driveLatched = true;
  const immediate = reducedMotion;
  drivePhase = immediate ? 'open' : 'opening';
  syncFloppyDomAndScene();
  announce('Hidden Sandbox disk opening. SANDBOX.SYS detected. Activate again to launch Sandbox.');

  if (!immediate) {
    driveOpenTimer = setTimeout(() => {
      driveOpenTimer = null;
      if (drivePhase === 'opening') {
        drivePhase = 'open';
        syncFloppyDomAndScene();
      }
    }, 1150);
  }
}

function launchDestination(destKey, { triggerEl = null } = {}) {
  const cfg = LAUNCH_DESTINATIONS[destKey];
  if (!cfg || activeLaunchState || isRestarting) return;

  const restoreView = currentView;
  const restoreAppId = lastTriggerAppId;
  const restoreTriggerId = triggerEl && triggerEl.id ? triggerEl.id : null;

  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  closeFloppyTray(true);

  currentView = 'launch-transition';
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-restarting');
  document.body.classList.add('is-powered');
  setScreenLightState('live');

  screenContentEl.innerHTML = `
    <div id="launch-transition-view" class="launch-transition-view" role="status" aria-live="polite" aria-label="Opening ${cfg.appName}">
      <div class="launch-transition-card">
        <p class="launch-transition-kicker">${cfg.headline}</p>
        <p class="launch-transition-app">${cfg.appName.toUpperCase()}</p>
        <p class="launch-transition-route"><span class="launch-route-label">ROUTE:</span> ${cfg.url}</p>
        <div class="launch-transition-steps">
          <p>${cfg.detail}</p>
          <p>SAVING WORKSTATION STATE &bull; HANDOFF READY</p>
        </div>
        <div id="launch-transition-recovery" class="launch-transition-recovery" hidden>
          <p class="launch-transition-delay">Navigation is taking longer than expected.</p>
          <button type="button" id="launch-cancel-btn" class="dossier-action-btn dossier-action-btn--return">◂ RETURN TO WORKSTATION</button>
        </div>
      </div>
    </div>
  `;
  screenContentEl.scrollTop = 0;
  announce(`Opening ${cfg.appName}.`);

  const state = {
    destKey,
    raf1: 0,
    raf2: 0,
    navTimerId: null,
    recoveryTimerId: null,
    onKeyDown: null,
  };
  activeLaunchState = state;

  const restorePriorScreen = () => {
    if (activeLaunchState !== state) return;
    clearLaunchTransition();
    if (restoreView === 'dossier' && restoreAppId) {
      renderDossier(restoreAppId, { updateHistory: false, immediatePose: true });
      if (restoreTriggerId) focusSafely(document.getElementById(restoreTriggerId));
    } else if (restoreView === 'embed') {
      renderProfessionalEmbed({ updateHistory: false, immediatePose: true });
    } else if (restoreView === 'standby') {
      renderStandby({ restoreFocus: true, updateHistory: false });
    } else {
      renderMenu({ shouldFocus: true, focusAppId: restoreAppId || null, updateHistory: false, immediatePose: true });
    }
    announce(`${cfg.appName} launch cancelled.`);
  };

  state.onKeyDown = (e) => {
    if (activeLaunchState !== state) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      restorePriorScreen();
    }
  };
  document.addEventListener('keydown', state.onKeyDown, true);

  const cancelBtn = document.getElementById('launch-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', restorePriorScreen);
  }

  state.recoveryTimerId = setTimeout(() => {
    if (activeLaunchState !== state) return;
    const recoveryEl = document.getElementById('launch-transition-recovery');
    if (recoveryEl) recoveryEl.hidden = false;
  }, 1050);

  const customDelay = Number(window.__EXPLORE_LAUNCH_DELAY_MS);
  const waitMs = Number.isFinite(customDelay) && customDelay > 0
    ? customDelay
    : (reducedMotion ? 90 : 220);

  state.raf1 = requestAnimationFrame(() => {
    if (activeLaunchState !== state) return;
    state.raf2 = requestAnimationFrame(() => {
      if (activeLaunchState !== state) return;
      state.navTimerId = setTimeout(() => {
        if (activeLaunchState !== state) return;
        try {
          if (cfg.returnHash) {
            setUrlHash(cfg.returnHash, { replace: true });
          }
          window.location.assign(cfg.url);
        } catch {
          restorePriorScreen();
        }
      }, waitMs);
    });
  });
  renderDebugHud();
}

function launchExternalRoute(url) {
  const matchedKey = Object.keys(LAUNCH_DESTINATIONS).find((k) => LAUNCH_DESTINATIONS[k].url === url);
  if (matchedKey) {
    launchDestination(matchedKey);
    return;
  }
  setUrlHash('#menu', { replace: true });
  window.location.assign(url);
}

// ---- Pixel 2D 13.5 FPS Environment Loop ----
function stopPixel2dLoop(reasonState) {
  if (pixel2dRafId) {
    cancelAnimationFrame(pixel2dRafId);
    pixel2dRafId = null;
  }
  pixel2dStateText = reasonState || 'paused (0 FPS)';
  pixel2dUploadTimestamps = [];
  renderDebugHud();
}

function lerpNum(a, b, t) {
  return a + (b - a) * t;
}

function lerpRect(r0, r1, t) {
  return {
    x: lerpNum(r0.x, r1.x, t),
    y: lerpNum(r0.y, r1.y, t),
    w: lerpNum(r0.w, r1.w, t),
    h: lerpNum(r0.h, r1.h, t),
  };
}

function tickPixel2dLoop(now) {
  pixel2dRafId = null;
  if (displayMode !== '2d') {
    stopPixel2dLoop('inactive');
    return;
  }
  if (document.hidden) {
    stopPixel2dLoop('hidden (0 FPS)');
    return;
  }
  if (reducedMotion) {
    if (pixelCamTween) {
      pixelCamCurrent = pixelCamTween.to;
      pixelCamTween = null;
      applyPixelSceneProjection(pixelCamCurrent);
    }
    pixelEnv.renderStatic();
    stopPixel2dLoop('reduced-motion (0 FPS)');
    return;
  }

  if (pixelCamTween) {
    const rawT = Math.min(1, (now - pixelCamTween.startMs) / pixelCamTween.durationMs);
    const e = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
    const { from, to } = pixelCamTween;
    pixelCamCurrent = {
      ...to,
      scale: lerpNum(from.scale, to.scale, e),
      tx: lerpNum(from.tx, to.tx, e),
      ty: lerpNum(from.ty, to.ty, e),
      dadoY: Math.round(lerpNum(from.dadoY, to.dadoY, e)),
      deskTopY: Math.round(lerpNum(from.deskTopY, to.deskTopY, e)),
      deskLipY: Math.round(lerpNum(from.deskLipY, to.deskLipY, e)),
      screenRect: lerpRect(from.screenRect, to.screenRect, e),
      diskRect: lerpRect(from.diskRect, to.diskRect, e),
      powerRect: lerpRect(from.powerRect, to.powerRect, e),
      powerVis: {
        w: lerpNum(from.powerVis.w, to.powerVis.w, e),
        h: lerpNum(from.powerVis.h, to.powerVis.h, e),
      },
    };
    applyPixelSceneProjection(pixelCamCurrent, rawT < 1);
    if (rawT >= 1) {
      pixelCamCurrent = to;
      pixelCamTween = null;
      if (currentView === 'embed') {
        pixelEnv.renderStatic();
        stopPixel2dLoop('embed-paused (0 FPS)');
        return;
      }
      renderDebugHud();
    }
  }

  if (currentView === 'embed' && !pixelCamTween) {
    pixelEnv.renderStatic();
    stopPixel2dLoop('embed-paused (0 FPS)');
    return;
  }

  if (!pixelCamTween && now - pixel2dActivityMs > 10000) {
    stopPixel2dLoop('pixel2d-idle (0 FPS)');
    return;
  }

  const dt = Math.min(0.1, (now - pixel2dLastMs) / 1000);
  pixel2dLastMs = now;
  const updated = pixelEnv.step(dt, true);
  if (updated) {
    pixel2dUploadTimestamps.push(now);
    pixel2dUploadTimestamps = pixel2dUploadTimestamps.filter((ts) => now - ts <= 1000);
    renderDebugHud();
  }
  pixel2dStateText = 'pixel2d-active (13.5 FPS)';
  pixel2dRafId = requestAnimationFrame(tickPixel2dLoop);
}

function startOrResumePixel2dLoop() {
  if (displayMode !== '2d') return;
  if (document.hidden) {
    stopPixel2dLoop('hidden (0 FPS)');
    return;
  }
  if (reducedMotion) {
    pixelEnv.renderStatic();
    stopPixel2dLoop('reduced-motion (0 FPS)');
    return;
  }
  if (currentView === 'embed' && !pixelCamTween) {
    pixelEnv.renderStatic();
    stopPixel2dLoop('embed-paused (0 FPS)');
    return;
  }
  if (!pixel2dRafId) {
    pixel2dLastMs = performance.now();
    pixel2dStateText = 'pixel2d-active (13.5 FPS)';
    pixel2dRafId = requestAnimationFrame(tickPixel2dLoop);
  }
}

function recordUserActivity() {
  pixel2dActivityMs = performance.now();
  if (displayMode === '2d' && !pixel2dRafId && !reducedMotion && !document.hidden && (currentView !== 'embed' || pixelCamTween)) {
    startOrResumePixel2dLoop();
  }
}

// ---- HUD / Metrics ----
function renderDebugHud(sceneMetrics = null) {
  const tickMs = Number.isFinite(pixelEnv.lastTickMs) ? +pixelEnv.lastTickMs.toFixed(2) : null;
  const m = displayMode === '3d' && webglScene
    ? (sceneMetrics || webglScene.getMetrics() || {})
    : displayMode === '2d' ? {
        fps: pixel2dStateText.startsWith('pixel2d-active') ? (pixel2dUploadTimestamps.length || 14) : 0,
        avgFrameMs: tickMs,
        maxFrameMs: tickMs,
        drawCalls: 0,
        triangles: 0,
        dpr: 1,
        renderScale: 1,
        pixelMode: 'pixel-2d',
        cameraPose: `pixel-${pixelPoseTarget}`,
        pixelTickMs: tickMs,
        pixelUploadsPerSec: pixel2dUploadTimestamps.length,
        loopState: pixel2dStateText,
      } : {};

  const effQuality = displayMode === '2d' ? 'low' : resolve3dQualityTier();
  const vpDebug = settledViewport;
  window.__explore3dMetrics = {
    workstationState: rootEl.dataset.workstationState || 'initializing',
    displayMode,
    effectiveQuality: effQuality,
    storedPreference: storedManualMode,
    manual3dQuality,
    webglStatus: webglStatusText,
    reducedMotion,
    coarsePointer,
    currentView,
    drivePhase,
    viewport: vpDebug,
    embed: currentView === 'embed' && activeEmbedState
      ? {
          active: true,
          loaded: activeEmbedState.loaded,
          failed: activeEmbedState.failed,
          src: activeEmbedState.currentSrc,
          docWidthSetting: activeEmbedState.docWidthSetting,
          panActive: activeEmbedState.panActive,
          reloadCount: activeEmbedState.reloadCount,
        }
      : {
          active: false,
          reloadCount: lastEmbedReloadCount,
        },
    ...m,
  };

  if (!DEBUG_MODE || !perfHudEl || perfHudEl.hidden) return;
  const mode = displayMode?.toUpperCase() ?? 'INITIALIZING';
  const ms = value => Number.isFinite(value) ? `${value}ms` : '—';
  const rows = [
    ['MODE', `${mode} (${storedManualMode ? 'manual' : 'auto'}) | RM: ${reducedMotion ? 'ON' : 'OFF'}`],
    ['FPS', `${m.fps ?? '—'} | LOOP: ${m.loopState ?? '—'}`],
    ['FRAME', `avg ${ms(m.avgFrameMs)} / max ${ms(m.maxFrameMs)}`],
    ['GPU', `${m.drawCalls ?? '—'} calls | ${m.triangles ?? '—'} tris | DPR ${m.dpr ?? '—'}`],
    ['PIXEL 320×180', `${ms(m.pixelTickMs)} | ${m.pixelUploadsPerSec ?? '—'} up/s | DISK: ${drivePhase}`],
    ['WEBGL', webglStatusText],
  ];
  perfHudEl.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = label + ':';
    row.append(heading, ' ' + value);
    return row;
  }));
}

async function ensureWebGL() {
  if (simulatedNoWebgl || webglFailed) return false;
  if (webglScene) return true;
  // Rapid mode changes share one renderer. Only the latest request activates it.
  if (!webglLoading) webglLoading = createWebGLScene().finally(() => { webglLoading = null; });
  return webglLoading;
}

async function createWebGLScene() {
  try {
    const mod = await import('./crt-scene.js');
    webglScene = await mod.createCrtScene({
      canvas: canvasEl,
      pixelEnv,
      initialQuality: resolve3dQualityTier() === 'low' ? 'high' : resolve3dQualityTier(),
      initialPixelMode: pixelMode,
      reducedMotion,
      coarsePointer,
      getViewportSize: () => settledViewport,
      onFatalFallback(reason) {
        webglFailed = true;
        webglStatusText = 'failed: ' + reason;
        applyDisplayMode('2d', { manual: false, announceChange: true, immediate: true });
      },
    });
    webglStatusText = 'active (three r170)';
    webglScene.setCallbacks({
      autoDowngrade(nextQ, avgMs) {
        if (displayMode !== '3d') return;
        if (nextQ === '2d-fallback') {
          webglFailed = true;
          webglStatusText = `slow-frame fallback (${avgMs.toFixed(1)}ms -> Pixel 2D)`;
          applyDisplayMode('2d', { manual: false, announceChange: true, immediate: true });
          return;
        }
        if (manual3dQuality === 'auto') {
          webglStatusText = `active (auto -> ${nextQ}, ${avgMs.toFixed(1)}ms)`;
          webglScene.setQuality(nextQ);
          renderDebugHud();
        }
      },
      metricsCb: renderDebugHud,
      projectionCb(screen, disk, power, moving) {
        if (displayMode === '3d') publishProjection(screen, disk, power, moving);
      },
    });
    return true;
  } catch (err) {
    webglFailed = true;
    webglStatusText = '3D unavailable';
    webglScene = null;
    return false;
  }
}

function clearInitTimers() {
  if (slowInitTimer) { clearTimeout(slowInitTimer); slowInitTimer = null; }
  if (fatalInitTimer) { clearTimeout(fatalInitTimer); fatalInitTimer = null; }
}

function setInitStatus(stageText, hintText) {
  if (initComplete) return;
  if (initStageTextEl && stageText) initStageTextEl.textContent = stageText;
  if (initHintEl && hintText) initHintEl.textContent = hintText;
}

function showFatalInitError() {
  clearInitTimers();
  window.dispatchEvent(new Event('workstation-startup-failed'));
}

function armSlow3dFallback(reqToken) {
  clearInitTimers();
  slowInitTimer = setTimeout(() => {
    slowInitTimer = null;
    if (initComplete || reqToken !== modeRequestToken) return;
    setInitStatus('3D DISPLAY LOADING SLOWLY', 'Taking longer than expected — switch to Pixel 2D or return to portfolio');
    if (initActionsEl) initActionsEl.hidden = false;
  }, 4500);
  fatalInitTimer = setTimeout(() => {
    fatalInitTimer = null;
    if (initComplete || reqToken !== modeRequestToken) return;
    webglFailed = true;
    webglStatusText = 'init-timeout -> Pixel 2D';
    applyDisplayMode('2d', { manual: false, announceChange: true, immediate: true });
  }, 10000);
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function completeInitialReveal(finalMode, { announceFallback = false } = {}) {
  if (initComplete || initRevealing) return;
  initRevealing = true;

  await nextAnimationFrame();

  const elapsed = performance.now() - initStartMs;
  if (!reducedMotion && elapsed >= 120 && elapsed < 280) {
    await new Promise((resolve) => setTimeout(resolve, Math.round(280 - elapsed)));
  }

  clearInitTimers();
  initComplete = true;
  initRevealing = false;
  if (modeGroupEl) modeGroupEl.removeAttribute('data-initializing');
  rootEl.dataset.workstationState = 'ready';

  const hideInitOverlay = () => {
    if (!initOverlayEl) return;
    initOverlayEl.hidden = true;
    initOverlayEl.setAttribute('aria-hidden', 'true');
  };

  if (initOverlayEl) {
    if (reducedMotion) {
      hideInitOverlay();
    } else {
      const onFadeEnd = (ev) => {
        if (ev.target === initOverlayEl && ev.propertyName === 'opacity') {
          initOverlayEl.removeEventListener('transitionend', onFadeEnd);
          if (initFadeTimer) { clearTimeout(initFadeTimer); initFadeTimer = null; }
          hideInitOverlay();
        }
      };
      initOverlayEl.addEventListener('transitionend', onFadeEnd);
      initFadeTimer = setTimeout(() => {
        initOverlayEl.removeEventListener('transitionend', onFadeEnd);
        initFadeTimer = null;
        hideInitOverlay();
      }, 240);
    }
  }

  if (currentView === 'dossier') {
    focusSafely(document.getElementById('dossier-title'));
  } else if (currentView === 'embed' && activeEmbedState?.returnBtn) {
    focusSafely(activeEmbedState.returnBtn);
  }

  renderDebugHud();
  announce(announceFallback && finalMode === '2d'
    ? '3D display unavailable. Loaded 2D Pixel workstation.'
    : 'Explore workstation ready.');
}

function currentPose() {
  if (currentView === 'embed' || currentView === 'boot' || currentView === 'dossier') return currentView;
  if (currentView === 'standby' || currentView === 'restarting') return 'standby';
  return 'menu';
}

async function applyDisplayMode(targetMode, { manual = false, announceChange = false, immediate = false } = {}) {
  const prevFocus = document.activeElement;
  const wasInitializing = !initComplete;
  const reqToken = ++modeRequestToken;

  if (manual) {
    storedManualMode = targetMode;
    try {
      window.localStorage.setItem(STORAGE_KEY, targetMode);
    } catch {}
  }

  let nextMode = targetMode;
  if (simulatedNoWebgl || webglFailed) {
    nextMode = '2d';
  }

  const changed = displayMode !== nextMode;

  if (modeSwitchTimer) {
    clearTimeout(modeSwitchTimer);
    modeSwitchTimer = null;
  }
  if (!wasInitializing && changed && !immediate && !reducedMotion) {
    document.body.classList.add('mode-switching');
    modeSwitchTimer = setTimeout(() => {
      document.body.classList.remove('mode-switching');
      modeSwitchTimer = null;
    }, 300);
  } else {
    document.body.classList.remove('mode-switching');
  }

  if (drivePhase !== 'closed') {
    closeFloppyTray(true);
  }

  const hasInitialHash = Boolean(window.location.hash && window.location.hash !== '#');

  if (nextMode === '2d') {
    clearInitTimers();
    if (wasInitializing) {
      setInitStatus(hasInitialHash ? 'RESTORING SESSION' : 'CALIBRATING DISPLAY', 'Preparing Pixel 2D display');
    }
    if (webglScene) {
      webglScene.setEmbedMode(false);
      webglScene.setActive(false);
      webglScene.setQuality('low');
    }
    displayMode = '2d';
    document.body.classList.remove('mode-3d');
    document.body.classList.add('mode-pixel-2d');
    captureViewport();
    canvasEl.setAttribute('data-active', 'false');
    pixelEnv.renderStatic();
    setPixelScenePose(currentPose(), true);
    if (currentView === 'embed') {
      updateEmbedViewportMode();
    }
    modeRadio3d.checked = false;
    modeRadio2d.checked = true;
    if (modeGroupEl) modeGroupEl.removeAttribute('data-initializing');
    startOrResumePixel2dLoop();

    if (wasInitializing) {
      await completeInitialReveal('2d', { announceFallback: webglFailed && !simulatedNoWebgl });
      return;
    }
  } else {
    stopPixel2dLoop('inactive (3D mode)');
    if (wasInitializing) {
      setInitStatus(hasInitialHash ? 'RESTORING SESSION' : 'CALIBRATING DISPLAY', 'Preparing 3D display — switch to 2D anytime');
      armSlow3dFallback(reqToken);
    }

    const ok = await ensureWebGL();
    if (reqToken !== modeRequestToken) return;
    if (!ok) {
      return applyDisplayMode('2d', { manual: false, announceChange: !wasInitializing, immediate: true });
    }

    clearInitTimers();
    displayMode = '3d';
    document.body.classList.remove('mode-pixel-2d');
    document.body.classList.add('mode-3d');
    captureViewport();
    canvasEl.setAttribute('data-active', 'true');
    webglScene.setCoarsePointer(coarsePointer);
    webglScene.setActive(true);
    webglScene.setReducedMotion(reducedMotion);
    webglScene.setQuality(resolve3dQualityTier());
    webglScene.setEmbedMode(currentView === 'embed');
    webglScene.syncBeforeShow(currentPose());
    let targetLight = 'menu';
    if (currentView === 'standby') targetLight = 'standby';
    else if (currentView === 'restarting') targetLight = 'paused';
    else if (currentView === 'embed' || currentView === 'launch-transition') targetLight = 'live';
    else if (currentView === 'dossier' && lastTriggerAppId === 'devpath') targetLight = 'paused';
    setScreenLightState(targetLight);
    webglScene.renderSingleFrame();
    if (currentView === 'embed') {
      updateEmbedViewportMode();
    }
    modeRadio3d.checked = true;
    modeRadio2d.checked = false;
    if (modeGroupEl) modeGroupEl.removeAttribute('data-initializing');

    if (wasInitializing) {
      await completeInitialReveal('3d');
      return;
    }
  }

  if (prevFocus && document.body.contains(prevFocus) && document.activeElement !== prevFocus) {
    focusSafely(prevFocus);
  }

  if (announceChange) {
    announce(`Display mode switched to ${displayMode === '3d' ? '3D workstation' : '2D Pixel workstation'}.`);
  }
  renderDebugHud();
}

function applyMotionPreference() {
  document.body.classList.toggle('reduce-motion', reducedMotion);
  if (webglScene) {
    webglScene.setReducedMotion(reducedMotion);
    if (reducedMotion && displayMode === '3d') webglScene.setCameraState(currentPose(), 0);
  }
  if (displayMode === '2d') {
    if (reducedMotion) {
      if (pixelCamTween) setPixelScenePose(currentPose(), true);
      pixelEnv.renderStatic();
      stopPixel2dLoop('reduced-motion (0 FPS)');
    } else {
      startOrResumePixel2dLoop();
    }
  }
  renderDebugHud();
}

function applyNoWebglUI() {
  if (!webglBtn) return;
  webglBtn.setAttribute('aria-pressed', String(simulatedNoWebgl));
  webglBtn.textContent = `SIMULATE NO-WEBGL: ${simulatedNoWebgl ? 'ON' : 'OFF'}`;
}

// ---- Shared Screen States (Layer 3) ----
function renderStandby({ restoreFocus = false, updateHistory = true } = {}) {
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  currentView = 'standby';
  isRestarting = false;
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-powered', 'is-restarting');
  overlayEl.classList.remove('is-collapsing');
  if (updateHistory) setUrlHash('');

  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('standby');
  } else {
    setPixelScenePose('standby');
  }
  setScreenLightState('standby');

  screenContentEl.innerHTML = `
    <div class="standby-view">
      <p class="standby-label">STANDBY · WORKSTATION READY</p>
      <button type="button" id="start-explore-btn" class="start-btn">START EXPLORE ▸</button>
    </div>
  `;
  screenContentEl.scrollTop = 0;
  const startBtn = document.getElementById('start-explore-btn');
  startBtn.addEventListener('click', startWorkstation);
  if (restoreFocus) {
    focusSafely(startBtn);
  }
  renderDebugHud();
}

function startWorkstation() {
  if (isRestarting) return;
  closeFloppyTray(true);
  document.body.classList.add('is-powered');
  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('boot');
  } else {
    setPixelScenePose('boot');
  }
  setScreenLightState('menu');
  renderBoot();
}

function renderBoot() {
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  currentView = 'boot';
  bootDone = false;
  const lines = [
    'ENUHRI SYSTEM v1.1',
    'CHECKING CRT APERTURE SYNC .... OK',
    'MOUNTING PORTFOLIO ROUTES ..... OK',
    'LOADING 6 CATALOG SLOTS ....... READY',
    'SANDBOX.SYS FLOPPY BAY ........ STANDBY',
  ];

  screenContentEl.innerHTML = `
    <div id="boot-view" class="boot-view">
      <pre id="boot-log" class="boot-log" aria-hidden="true"></pre>
      <button type="button" id="boot-skip-btn" class="boot-skip-btn">SKIP ▸</button>
    </div>
  `;
  screenContentEl.scrollTop = 0;
  const logEl = document.getElementById('boot-log');
  const skipBtn = document.getElementById('boot-skip-btn');

  const finishBoot = () => {
    bootDone = true;
    skipBtn.textContent = 'CONTINUE ▸';
    skipBtn.setAttribute('aria-label', 'Continue to portfolio application catalog');
    announce('Workstation ready. Activate Continue to open catalog.');
  };

  if (reducedMotion) {
    logEl.textContent = lines.join('\n');
    finishBoot();
  } else {
    logEl.textContent = '';
    announce('System booting. Activate Skip to continue.');
    let d = 0;
    lines.forEach((line, idx) => {
      d += 180;
      scheduleTimer(() => {
        logEl.textContent += (idx ? '\n' : '') + line;
      }, d);
    });
    scheduleTimer(finishBoot, d + 200);
  }

  skipBtn.addEventListener('click', () => {
    if (!bootDone) {
      clearActiveTimers();
      logEl.textContent = lines.join('\n');
      finishBoot();
      focusSafely(skipBtn);
    } else {
      renderMenu({ shouldFocus: true, updateHistory: true });
    }
  });

  document.getElementById('boot-view').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      triggerRestart();
    }
  });

  focusSafely(skipBtn);
  renderDebugHud();
}

function getGridRows(gridItems) {
  const rows = [];
  gridItems.forEach((el, idx) => {
    const r = el.getBoundingClientRect();
    const cy = r.top + r.height / 2;
    const cx = r.left + r.width / 2;
    let row = rows.find((rowObj) => Math.abs(rowObj.cy - cy) < Math.max(12, r.height * 0.45));
    if (!row) {
      row = { cy, cells: [] };
      rows.push(row);
    }
    row.cells.push({ idx, cx, cy });
  });
  rows.sort((a, b) => a.cy - b.cy);
  rows.forEach((row) => row.cells.sort((a, b) => a.cx - b.cx));
  return rows;
}

function renderMenu({ shouldFocus = false, focusAppId = null, updateHistory = false, immediatePose = false } = {}) {
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  currentView = 'menu';
  screenContentEl.inert = false;
  toolbarPower.hidden = true;
  isRestarting = false;
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-restarting');
  document.body.classList.add('is-powered');
  if (updateHistory) setUrlHash('#menu');
  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('menu', immediatePose ? 0 : undefined);
  } else {
    setPixelScenePose('menu', immediatePose);
  }
  setScreenLightState('menu');

  screenContentEl.innerHTML = `
    <div id="app-menu" class="app-menu">
      <h2 class="app-menu-header" tabindex="-1">APPLICATION CATALOG</h2>
      <nav class="app-nav" aria-label="Portfolio applications">
        <ul class="app-grid">
          ${CATALOG_SLOTS.map((app) => {
            const stateType = app.statusKey || app.status.toLowerCase();
            return `
            <li class="app-grid-item">
              <button type="button" class="app-tile" data-app-id="${app.id}" data-status="${stateType}" aria-label="${app.name}, ${app.status}">
                <span class="app-index" aria-hidden="true">${app.index}</span>
                <span class="app-name">${app.name}</span>
                <span class="app-status" aria-hidden="true">${app.status}</span>
              </button>
            </li>
          `;
          }).join('')}
        </ul>
      </nav>
    </div>
  `;
  screenContentEl.scrollTop = 0;

  const menuEl = document.getElementById('app-menu');
  const items = Array.from(menuEl.querySelectorAll('.app-tile'));

  items.forEach((btn) => {
    const id = btn.dataset.appId;
    const status = btn.dataset.status;

    const hintLight = () => {
      if (status === 'live') setScreenLightState('live');
      else if (status === 'paused') setScreenLightState('paused');
      else setScreenLightState('menu');
    };
    const resetLight = () => {
      if (currentView === 'menu') setScreenLightState('menu');
    };

    btn.addEventListener('mouseenter', hintLight);
    btn.addEventListener('focus', hintLight);
    btn.addEventListener('mouseleave', resetLight);
    btn.addEventListener('blur', resetLight);
    btn.addEventListener('click', () => {
      lastTriggerAppId = id;
      if (id === 'professional') {
        renderProfessionalEmbed({ updateHistory: true });
      } else if (id === 'art-gallery') {
        launchDestination('art-gallery', { triggerEl: btn });
      } else {
        renderDossier(id, { updateHistory: true });
      }
    });
  });

  menuEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      triggerRestart();
      return;
    }
    const idx = items.indexOf(document.activeElement);
    if (idx === -1) return;

    if (event.key === 'Home') {
      event.preventDefault();
      focusSafely(items[0]);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusSafely(items[items.length - 1]);
      return;
    }

    let next = null;
    if (event.key === 'ArrowRight') next = (idx + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const rows = getGridRows(items);
      const isDown = event.key === 'ArrowDown';
      const curRect = items[idx].getBoundingClientRect();
      const cx = curRect.left + curRect.width / 2;
      const rIdx = rows.findIndex((r) => r.cells.some((c) => c.idx === idx));
      if (rIdx !== -1) {
        const targetRow = isDown
          ? rows[(rIdx + 1) % rows.length]
          : rows[(rIdx - 1 + rows.length) % rows.length];
        next = targetRow.cells.reduce((a, b) => (Math.abs(b.cx - cx) < Math.abs(a.cx - cx) ? b : a)).idx;
      }
    }

    if (next !== null && items[next]) {
      event.preventDefault();
      focusSafely(items[next]);
    }
  });

  if (focusAppId) {
    focusSafely(items.find((el) => el.dataset.appId === focusAppId) || items[0]);
  } else if (shouldFocus) {
    focusSafely(items[0]);
  }
  renderDebugHud();
}

function updateEmbedPanState() {
  if (currentView !== 'embed' || !activeEmbedState?.loaded || activeEmbedState.presentation === 'small') return;
  const { viewportEl, stageEl, statusLabelEl, srHintEl, loaded } = activeEmbedState;
  const horizRange = Math.max(0, viewportEl.scrollWidth - viewportEl.clientWidth);
  const hasPan = loaded && horizRange > 2;
  activeEmbedState.panActive = hasPan;
  stageEl.classList.toggle('has-pan', hasPan);
  if (hasPan) {
    const atEnd = viewportEl.scrollLeft + viewportEl.clientWidth >= viewportEl.scrollWidth - 4;
    stageEl.classList.toggle('is-pan-end', atEnd);
    statusLabelEl.textContent = 'LIVE PREVIEW · PAN ⇄ ⇅';
    srHintEl.textContent = 'Professional Portfolio preview. Scroll horizontally and vertically to explore. Use Return to Catalog or press Escape to exit. Use Open Full Site to view the portfolio in the full browser window.';
  } else if (loaded) {
    stageEl.classList.remove('is-pan-end');
    statusLabelEl.textContent = 'LIVE PREVIEW';
    srHintEl.textContent = 'Professional Portfolio preview. Use Return to Catalog or press Escape to exit. Use Open Full Site to view the portfolio in the full browser window.';
  }
}

function updateEmbedViewportMode() {
  const state = activeEmbedState;
  if (!state || embedProjection === 'pending' || state.sizeFrame) return;
  state.sizeFrame = requestAnimationFrame(() => {
    state.sizeFrame = 0;
    if (activeEmbedState === state) state.fit();
  });
}

function embedPresentation(width, height, previous) {
  // Resume from a small-screen fallback with a little clearance. Desktop
  // needs a wider exit band so toolbar and scrollbar rounding cannot flap.
  const clearance = previous === 'small' ? 4 : 0;
  if (width < EMBED_CONFIG.compactMinW + clearance || height < EMBED_CONFIG.compactMinH + clearance) return 'small';
  if (EMBED_WIDTH_OVERRIDE === '980') return 'desktop';
  const band = previous === 'crt-compact' ? 20 : 0;
  if (!coarsePointer && width >= EMBED_CONFIG.desktopMinW + band && height >= EMBED_CONFIG.desktopMinH + band) return 'desktop';
  return 'crt-compact';
}

function teardownProfessionalEmbed() {
  if (!activeEmbedState) return;
  const state = activeEmbedState;
  lastEmbedReloadCount = state.reloadCount;
  activeEmbedState = null;
  state.observer.disconnect();
  cancelAnimationFrame(state.sizeFrame);
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }
  if (typeof state.cleanupDocListeners === 'function') {
    state.cleanupDocListeners();
    state.cleanupDocListeners = null;
  }
  if (state.viewportEl && state.onViewportScroll) {
    state.viewportEl.removeEventListener('scroll', state.onViewportScroll);
  }
  if (state.frame) {
    try {
      state.frame.src = 'about:blank';
    } catch {}
    state.frame.remove();
  }
  if (state.rootEl && state.rootEl.parentNode) {
    state.rootEl.remove();
  }
}

function returnFromEmbedToCatalog() {
  if (currentView !== 'embed') return;
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  renderMenu({ shouldFocus: true, focusAppId: 'professional', updateHistory: true });
  announce('Returned to Explore CRT catalog.');
}

function bindEmbeddedDocumentBridges(state) {
  if (typeof state.cleanupDocListeners === 'function') {
    state.cleanupDocListeners();
    state.cleanupDocListeners = null;
  }
  let win = null;
  let doc = null;
  try {
    win = state.frame.contentWindow;
    doc = state.frame.contentDocument;
  } catch {
    return;
  }
  if (!win || !doc) return;

  const hasInnerInteractiveOpen = () => Boolean(
    doc.querySelector('dialog[open], .tool-takeover.is-active, .tool-card.is-inline-open, .media-lightbox[open]')
  );

  // Track inner modal/disclosure state before same-origin Escape handlers mutate the DOM synchronously
  let innerEscapeWasOpen = false;
  const onWinKeyDownCapture = (e) => {
    if (e.key === 'Escape') {
      innerEscapeWasOpen = hasInnerInteractiveOpen();
    }
  };
  const onWinKeyDownBubble = (e) => {
    if (e.key !== 'Escape') return;
    const consumeInner = innerEscapeWasOpen;
    innerEscapeWasOpen = false;
    if (consumeInner || e.defaultPrevented || hasInnerInteractiveOpen()) return;
    e.preventDefault();
    returnFromEmbedToCatalog();
  };

  // Intercept clicks on Explore CRT Hub links to prevent recursive framing of /explore/
  const onDocClickCapture = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = e.target && typeof e.target.closest === 'function' ? e.target.closest('a[href]') : null;
    if (!anchor) return;
    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:')) return;
    let parsed = null;
    try {
      parsed = new URL(anchor.href, window.location.origin);
    } catch {
      return;
    }
    const isExploreTarget =
      anchor.classList.contains('hdr-explore') ||
      (parsed.origin === window.location.origin && /^\/explore(\/|$)/i.test(parsed.pathname));
    if (isExploreTarget) {
      e.preventDefault();
      e.stopPropagation();
      returnFromEmbedToCatalog();
    }
  };

  win.addEventListener('keydown', onWinKeyDownCapture, true);
  win.addEventListener('keydown', onWinKeyDownBubble, false);
  doc.addEventListener('click', onDocClickCapture, true);

  state.cleanupDocListeners = () => {
    try {
      win.removeEventListener('keydown', onWinKeyDownCapture, true);
      win.removeEventListener('keydown', onWinKeyDownBubble, false);
      doc.removeEventListener('click', onDocClickCapture, true);
    } catch {}
  };
}

function renderProfessionalEmbed({ updateHistory = true, immediatePose = false } = {}) {
  const fromCatalog = currentView === 'menu' && initComplete;
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  lastTriggerAppId = 'professional';
  currentView = 'embed';
  embedProjection = 'pending';
  isRestarting = false;
  hwPowerBtn.disabled = false;
  closeFloppyTray(true);
  document.body.classList.remove('is-restarting');
  document.body.classList.add('is-powered');
  if (updateHistory) setUrlHash('#app=professional');

  if (displayMode === '3d' && webglScene) {
    webglScene.setEmbedMode(true);
    webglScene.setCameraState('embed', immediatePose ? 0 : undefined);
  } else {
    setPixelScenePose('embed', immediatePose);
  }
  setScreenLightState('live');

  screenContentEl.classList.add('is-embed-active');
  screenContentEl.scrollTop = 0;
  screenContentEl.innerHTML = `
    <div id="professional-embed" class="professional-embed" role="region" aria-label="Professional Portfolio CRT preview">
      <div class="professional-embed__toolbar">
        <button type="button" id="embed-return-btn" class="embed-ctrl-btn embed-ctrl-btn--return" aria-label="Return to Catalog">
          <span class="lbl-full">◂ RETURN TO CATALOG</span>
          <span class="lbl-compact" aria-hidden="true">◂ CATALOG</span>
          <span class="embed-narrow-label" aria-hidden="true">Catalog</span>
        </button>

        <span id="embed-status-label" class="professional-embed__status" aria-live="polite">LIVE PREVIEW</span>

        <a id="embed-open-full-link" class="embed-ctrl-btn embed-ctrl-btn--open" href="/" target="_top" aria-label="Open full Professional Portfolio">
          <span class="lbl-full">OPEN FULL SITE ↗</span>
          <span class="lbl-compact" aria-hidden="true">FULL SITE ↗</span>
          <span class="embed-narrow-label" aria-hidden="true">Site ↗</span>
        </a>
      </div>

      <p id="embed-sr-hint" class="sr-only">
        Professional Portfolio preview. Use Return to Catalog or press Escape to exit. Use Open Full Site to view the portfolio in the full browser window.
      </p>

      <div id="embed-stage" class="professional-embed__stage">
        <div id="embed-viewport" class="professional-embed__viewport"></div>
        <div id="embed-loading" class="professional-embed__loading" role="status">
          <p class="professional-embed__loading-text">LOADING PROFESSIONAL PORTFOLIO ...</p>
        </div>
        <div id="embed-fallback" class="professional-embed__fallback" hidden>
          <p class="professional-embed__fallback-title"></p>
          <button type="button" id="embed-retry-btn" class="embed-ctrl-btn embed-ctrl-btn--return">RETRY</button>
        </div>
      </div>
    </div>
  `;

  const rootEl = document.getElementById('professional-embed');
  const stageEl = document.getElementById('embed-stage');
  const viewportEl = document.getElementById('embed-viewport');
  const loadingEl = document.getElementById('embed-loading');
  const fallbackEl = document.getElementById('embed-fallback');
  const statusLabelEl = document.getElementById('embed-status-label');
  const srHintEl = document.getElementById('embed-sr-hint');
  const returnBtn = document.getElementById('embed-return-btn');
  const openFullLink = document.getElementById('embed-open-full-link');
  const retryBtn = document.getElementById('embed-retry-btn');
  const fallbackText = fallbackEl.querySelector('p');

  const state = {
    rootEl,
    stageEl,
    viewportEl,
    loadingEl,
    fallbackEl,
    statusLabelEl,
    srHintEl,
    returnBtn,
    openFullLink,
    frame: null,
    currentSrc: null,
    presentation: null,
    sizeFrame: 0,
    fallbackTried: false,
    loaded: false,
    failed: false,
    timeoutId: null,
    cleanupDocListeners: null,
    onViewportScroll: null,
    reloadCount: 0,
    docWidthSetting: '100%',
    panActive: false,
  };
  activeEmbedState = state;
  lastEmbedReloadCount = 0;

  state.onViewportScroll = () => updateEmbedPanState();
  viewportEl.addEventListener('scroll', state.onViewportScroll, { passive: true });

  const bindFullSiteLaunch = (linkEl) => {
    if (!linkEl) return;
    linkEl.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      launchDestination('professional', { triggerEl: linkEl });
    });
  };
  bindFullSiteLaunch(openFullLink);

  returnBtn.addEventListener('click', returnFromEmbedToCatalog);
  rootEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      returnFromEmbedToCatalog();
    }
  });

  function showSurface() {
    const small = state.presentation === 'small';
    const unavailable = small || state.failed;
    if ((unavailable || !state.loaded) && (document.activeElement === state.frame || document.activeElement === retryBtn)) {
      focusSafely(returnBtn);
    }
    viewportEl.inert = unavailable || !state.loaded;
    loadingEl.hidden = unavailable || state.loaded;
    fallbackEl.hidden = !unavailable;
    retryBtn.hidden = small;
    fallbackText.textContent = small
      ? 'The live portfolio needs more space. Open the full site or return to Catalog.'
      : 'Professional Portfolio preview is unavailable.';
    if (unavailable) {
      statusLabelEl.textContent = small ? 'COMPACT DISPLAY' : 'UNAVAILABLE';
      stageEl.classList.remove('has-pan', 'is-pan-end');
    } else if (state.loaded) updateEmbedPanState();
    else statusLabelEl.textContent = 'LOADING';
  }

  function showFailure() {
    if (activeEmbedState !== state) return;
    clearTimeout(state.timeoutId);
    state.failed = true;
    state.loaded = false;
    showSurface();
    state.cleanupDocListeners?.();
    state.cleanupDocListeners = null;
    state.frame?.remove();
    state.frame = null;
    announce('Professional Portfolio preview is unavailable.');
    renderDebugHud();
  }

  function applyChildMode() {
    const frame = state.frame;
    if (state.presentation === 'small') return true;
    try {
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      if (win.location.origin !== location.origin || doc.documentElement.dataset.embedReady !== 'true'
          || !win.setProfessionalEmbedMode(state.presentation)) return false;
      const styles = win.getComputedStyle(doc.documentElement);
      if (styles.getPropertyValue('--professional-embed-css').trim() !== 'ready') return false;
      return state.presentation !== 'crt-compact' || (doc.documentElement.dataset.embedMode === 'crt-compact'
        && styles.getPropertyValue('--crt-compact-css').trim() === 'ready');
    } catch {
      return false;
    }
  }

  function frameSource(pathname) {
    const compact = state.presentation === 'crt-compact';
    return pathname + (compact ? '?embed=1&mode=crt-compact' : '?embed=1');
  }

  function attachFrame(pathname = '/') {
    clearTimeout(state.timeoutId);
    state.cleanupDocListeners?.();
    state.cleanupDocListeners = null;
    state.frame?.remove();
    state.loaded = false;
    state.failed = false;
    const frame = document.createElement('iframe');
    frame.id = 'professional-embed-frame';
    frame.className = 'professional-embed__frame';
    frame.title = 'Professional Portfolio preview';
    state.frame = frame;
    state.currentSrc = frameSource(pathname);
    frame.src = state.currentSrc;
    const current = () => activeEmbedState === state && state.frame === frame;
    function failedLoad() {
      if (!current()) return;
      // Keep the static file-server fallback for installations without root rewrites.
      if (pathname === '/' && !state.fallbackTried && state.presentation !== 'small') {
        state.fallbackTried = true;
        attachFrame('/professional/index.html');
      } else showFailure();
    }
    let readyDocument = null;
    function acceptDocument() {
      if (!current()) return;
      let doc;
      try {
        if (frame.contentWindow.location.origin !== location.origin) return showFailure();
        if (/^\/explore(\/|$)/i.test(frame.contentWindow.location.pathname)) return returnFromEmbedToCatalog();
        doc = frame.contentDocument;
      } catch { return showFailure(); }
      if (doc && doc === readyDocument) return;
      if (!doc?.getElementById('main') || !doc.getElementById('hdr')) return failedLoad();
      if (doc.documentElement.dataset.embedReady !== 'true' || !applyChildMode()) return showFailure();
      clearTimeout(state.timeoutId);
      readyDocument = doc;
      state.loaded = true;
      bindEmbeddedDocumentBridges(state);
      showSurface();
      if (state.presentation !== 'small') announce('Professional Portfolio preview loaded.');
      renderDebugHud();
    }
    // The child can be usable before images finish loading. The native load
    // event also validates error documents and installations with older HTML.
    frame.addEventListener('professional-embed-ready', acceptDocument);
    frame.addEventListener('load', () => {
      if (!current()) return;
      state.reloadCount++;
      lastEmbedReloadCount = state.reloadCount;
      acceptDocument();
      renderDebugHud();
    });
    frame.addEventListener('error', failedLoad);
    state.timeoutId = setTimeout(() => { if (current() && !state.loaded) showFailure(); }, EMBED_CONFIG.loadTimeoutMs);
    showSurface();
    viewportEl.append(frame);
  }

  state.fit = (approaching = embedProjection === 'moving') => {
    const { clientWidth: width, clientHeight: height } = stageEl;
    const next = embedPresentation(width, height, state.presentation);
    // During the approach, start loading once this measured aperture can host
    // the intended layout. Reclassify an existing frame only at rest.
    if (approaching && (state.presentation || next === 'small' || (!coarsePointer && next !== 'desktop'))) return;
    const changed = next !== state.presentation;
    state.presentation = next;
    rootEl.dataset.presentation = next;
    const docWidth = next === 'desktop' && EMBED_WIDTH_OVERRIDE !== '100%'
      ? Math.max(width, EMBED_CONFIG.virtualDesktopWidth) + 'px' : '100%';
    if (docWidth !== state.docWidthSetting) {
      rootEl.style.setProperty('--embed-doc-w', docWidth);
      state.docWidthSetting = docWidth;
    }
    if (changed && next !== 'desktop') viewportEl.scrollLeft = 0;
    if (next !== 'small' && !state.frame && !state.failed) return attachFrame();
    if (changed && state.loaded && !applyChildMode()) return showFailure();
    if (changed) showSurface();
    else updateEmbedPanState();
  };
  state.observer = new ResizeObserver(() => {
    if (activeEmbedState === state && embedProjection !== 'pending') state.fit();
  });
  state.observer.observe(stageEl);
  retryBtn.addEventListener('click', () => {
    if (state.presentation === 'small') return;
    state.fallbackTried = false;
    focusSafely(returnBtn);
    attachFrame();
  });
  // The existing Catalog aperture may already fit the child before the
  // first camera frame. Begin its request in the selection event in that case.
  if (fromCatalog && !immediatePose && !reducedMotion) state.fit(true);
  updateEmbedViewportMode();
  focusSafely(returnBtn);
  renderDebugHud();
}

function renderDossier(appId, { updateHistory = true, immediatePose = false } = {}) {
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  const normalizedId = appId === 'app-06' ? 'devpath' : appId;
  const entry = CATALOG_SLOTS.find((a) => a.id === normalizedId);
  if (!entry || !INLINE_DOSSIER_IDS.has(entry.id)) {
    setUrlHash('#menu', { replace: true });
    renderMenu({ shouldFocus: false, updateHistory: false, immediatePose: true });
    return;
  }

  lastTriggerAppId = entry.id;
  currentView = 'dossier';
  isRestarting = false;
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-restarting');
  document.body.classList.add('is-powered');
  if (updateHistory) setUrlHash(`#app=${entry.id}`);

  screenContentEl.inert = Boolean(settledViewport.dossierFit && displayMode && !immediatePose && !reducedMotion);
  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('dossier', immediatePose ? 0 : undefined);
  } else {
    setPixelScenePose('dossier', immediatePose);
  }

  setScreenLightState(entry.id === 'devpath' ? 'paused' : 'menu');

  const previewCfg = INTERACTIVE_PREVIEW_CONFIG[entry.id] || null;
  let mediaHtml = '';
  if (previewCfg) {
    mediaHtml = `
      <div id="dossier-media-shell" class="dossier-media-shell" data-preview-state="poster">
        <div id="dossier-poster-view" class="dossier-poster-view">
          <div class="dossier-screenshot-frame">
            <img id="dossier-poster-img" class="dossier-screenshot" src="${entry.image}" alt="${previewCfg.posterAlt}" />
            <p id="dossier-poster-missing" class="dossier-poster-missing" hidden>${entry.name} preview image unavailable.</p>
          </div>
        </div>
        <div id="dossier-preview-loading" class="dossier-preview-loading" role="status" hidden>
          <p class="dossier-preview-loading-text">LOADING INTERACTIVE RECONSTRUCTION ...</p>
        </div>
        <div id="dossier-preview-active" class="dossier-preview-active" hidden>
          <div class="dossier-preview-toolbar">
            <p id="dossier-preview-notice" class="dossier-preview-notice" tabindex="-1">Interactive reconstruction from the Professional Portfolio</p>
            <button type="button" id="dossier-preview-close-btn" class="dossier-preview-close-btn" aria-label="Close interactive preview">
              <span class="lbl-full">CLOSE INTERACTIVE PREVIEW</span>
              <span class="lbl-compact" aria-hidden="true">CLOSE PREVIEW</span>
            </button>
          </div>
          <div id="dossier-preview-mount" class="dossier-preview-mount"></div>
        </div>
        <p id="dossier-preview-error" class="dossier-preview-error" role="alert" hidden>Interactive preview unavailable. Open the full case study instead.</p>
      </div>
    `;
  } else if (entry.image) {
    mediaHtml = `
      <div class="dossier-screenshot-frame">
        <img class="dossier-screenshot" src="${entry.image}" alt="${entry.photoAlt || `${entry.name} preview`}" />
      </div>
    `;
  }

  const actionsList = Array.isArray(entry.actions) ? entry.actions : [];
  const primaryAction = actionsList.find((a) => a.primary) || null;
  const repoAction = actionsList.find((a) => !a.primary && a.icon === 'github') || null;

  const previewToggleHtml = previewCfg
    ? `
      <div id="dossier-preview-launch-row" class="dossier-actions dossier-actions--preview">
        <button type="button" id="dossier-preview-toggle-btn" class="dossier-play-btn dossier-preview-toggle-btn" aria-expanded="false">TRY INTERACTIVE PREVIEW</button>
      </div>
    `
    : '';

  const repoActionHtml = repoAction
    ? `<a id="dossier-repo-link" class="dossier-action-btn dossier-action-btn--repo repo-action" href="${repoAction.href}" target="_blank" rel="noopener noreferrer" aria-label="View source repository, opens in a new tab">${GITHUB_MARK_SVG}<span class="lbl-full">${repoAction.label}</span><span class="lbl-compact" aria-hidden="true">${repoAction.compactLabel || 'SOURCE'}</span><span class="sr-only">, opens in a new tab</span></a>`
    : '';

  let primaryBarHtml = '';
  if (previewCfg) {
    primaryBarHtml = `<a id="dossier-open-case-link" class="dossier-action-btn dossier-action-btn--primary" href="${previewCfg.caseStudyHref}" aria-label="Open full case study"><span class="lbl-full">OPEN FULL CASE STUDY ▸</span><span class="lbl-compact" aria-hidden="true">CASE STUDY</span></a>`;
  } else if (primaryAction) {
    primaryBarHtml = `<a id="dossier-primary-launch-link" class="dossier-action-btn dossier-action-btn--primary" href="${primaryAction.href}" aria-label="${primaryAction.ariaLabel || primaryAction.label}"><span class="lbl-full">${primaryAction.label}</span><span class="lbl-compact" aria-hidden="true">${primaryAction.compactLabel || 'OPEN'}</span></a>`;
  }

  const actionBarHtml = `
    <nav id="dossier-action-bar" class="dossier-action-bar" aria-label="${entry.name} actions">
      <button type="button" id="dossier-return-btn" class="dossier-action-btn dossier-action-btn--return" aria-label="Return to application catalog">
        <span class="lbl-full">◂ RETURN TO CATALOG</span>
        <span class="lbl-compact" aria-hidden="true">RETURN</span>
      </button>
      ${repoActionHtml}
      ${primaryBarHtml}
    </nav>
  `;

  const taglineHtml = entry.tagline
    ? `<p class="dossier-tagline">"${entry.tagline}"</p>`
    : '';

  const extraSectionsHtml = Array.isArray(entry.extraSections) && entry.extraSections.length
    ? entry.extraSections.map((sec) => `
      <h3 class="dossier-section-title">${sec.title}</h3>
      <p class="dossier-body">${sec.body}</p>
    `).join('')
    : '';

  const featuresTitle = entry.featuresTitle || 'KEY FEATURES';
  const featuresHtml = Array.isArray(entry.features) && entry.features.length
    ? `
      <h3 class="dossier-section-title">${featuresTitle}</h3>
      <ul class="dossier-features">
        ${entry.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `
    : '';

  const boundaryHtml = entry.boundaryNote
    ? `<p class="dossier-boundary-note">${entry.boundaryNote}</p>`
    : '';

  const techHtml = Array.isArray(entry.technologies) && entry.technologies.length
    ? `
      <h3 class="dossier-section-title">TECH STACK</h3>
      <p class="dossier-tech-line">${entry.technologies.join(' • ')}</p>
    `
    : '';

  screenContentEl.innerHTML = `
    <article id="dossier-view" class="dossier-view" aria-labelledby="dossier-title">
      <div class="dossier-head">
        <h2 id="dossier-title" class="dossier-title" tabindex="-1">${entry.name.toUpperCase()}</h2>
        <button type="button" id="dossier-close-btn" class="dossier-close-btn" aria-label="Close ${entry.name} dossier and return to catalog">✕</button>
      </div>
      ${mediaHtml}
      ${previewToggleHtml}
      <p class="dossier-meta">${entry.category}</p>
      ${taglineHtml}
      <p class="dossier-body">${entry.summary}</p>
      ${extraSectionsHtml}
      ${featuresHtml}
      ${boundaryHtml}
      ${techHtml}
      <h3 class="dossier-section-title">STATUS</h3>
      <p class="dossier-status">${entry.devStatus || entry.status}</p>
      ${actionBarHtml}
    </article>
  `;
  screenContentEl.scrollTop = 0;

  let closeInteractivePreview = null;
  if (previewCfg) {
    const mediaShell = document.getElementById('dossier-media-shell');
    const posterView = document.getElementById('dossier-poster-view');
    const posterImg = document.getElementById('dossier-poster-img');
    const posterMissing = document.getElementById('dossier-poster-missing');
    const loadingView = document.getElementById('dossier-preview-loading');
    const activeView = document.getElementById('dossier-preview-active');
    const noticeEl = document.getElementById('dossier-preview-notice');
    const toolbarCloseBtn = document.getElementById('dossier-preview-close-btn');
    const mountEl = document.getElementById('dossier-preview-mount');
    const errorEl = document.getElementById('dossier-preview-error');
    const launchRow = document.getElementById('dossier-preview-launch-row');
    const toggleBtn = document.getElementById('dossier-preview-toggle-btn');
    let lastAppliedMountH = -1;

    if (posterImg && posterMissing) {
      posterImg.addEventListener('error', () => {
        posterImg.hidden = true;
        posterMissing.hidden = false;
      });
    }

    const animateMediaShellHeight = (mutateFn) => {
      if (typeof cancelDossierShellAnim === 'function') {
        cancelDossierShellAnim();
        cancelDossierShellAnim = null;
      }
      const fromH = Math.ceil(mediaShell.getBoundingClientRect().height);
      mutateFn();
      mediaShell.style.transition = 'none';
      mediaShell.style.height = 'auto';
      const toH = Math.ceil(mediaShell.getBoundingClientRect().height);

      if (reducedMotion || fromH <= 0 || toH <= 0 || Math.abs(toH - fromH) < 2) {
        mediaShell.style.transition = '';
        mediaShell.style.height = '';
        return;
      }

      mediaShell.style.height = `${fromH}px`;
      void mediaShell.offsetHeight;
      mediaShell.style.transition = 'height 220ms cubic-bezier(0.2, 0.7, 0.2, 1)';
      mediaShell.style.height = `${toH}px`;

      let finished = false;
      let timerId = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        mediaShell.removeEventListener('transitionend', onEnd);
        mediaShell.style.transition = '';
        mediaShell.style.height = '';
        if (cancelDossierShellAnim === abort) cancelDossierShellAnim = null;
      };
      const abort = () => {
        if (finished) return;
        finished = true;
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        mediaShell.removeEventListener('transitionend', onEnd);
      };
      const onEnd = (e) => {
        if (e.target === mediaShell && e.propertyName === 'height') finish();
      };
      cancelDossierShellAnim = abort;
      mediaShell.addEventListener('transitionend', onEnd);
      timerId = setTimeout(finish, 280);
    };

    const getMountHeightBounds = () => {
      const apertureH = screenContentEl.clientHeight || 360;
      const isCompact = window.innerWidth <= 639;
      const maxH = isCompact
        ? Math.max(150, apertureH - 52)
        : Math.max(280, Math.min(460, apertureH - 36));
      const minH = Math.min(280, maxH);
      return { minH, maxH };
    };

    const syncUiToClosed = () => {
      mediaShell.dataset.previewState = 'poster';
      mediaShell.removeAttribute('aria-busy');
      posterView.hidden = false;
      loadingView.hidden = true;
      activeView.hidden = true;
      launchRow.hidden = false;
      toggleBtn.hidden = false;
      mountEl.style.height = '';
      lastAppliedMountH = -1;
      toggleBtn.textContent = 'TRY INTERACTIVE PREVIEW';
      toggleBtn.setAttribute('aria-expanded', 'false');
      setScreenLightState('menu');
    };

    const applyMountHeight = (h) => {
      const numeric = Number(h);
      if (!Number.isFinite(numeric) || numeric <= 0) return;
      const { minH, maxH } = getMountHeightBounds();
      const clamped = Math.max(minH, Math.min(maxH, Math.ceil(numeric)));
      if (lastAppliedMountH > 0 && Math.abs(clamped - lastAppliedMountH) < 2) return;
      lastAppliedMountH = clamped;
      animateMediaShellHeight(() => {
        mountEl.style.height = `${clamped}px`;
      });
    };

    const failInteractivePreview = () => {
      teardownDossierPreview();
      animateMediaShellHeight(() => {
        syncUiToClosed();
        errorEl.hidden = false;
      });
      announce('Interactive preview unavailable. Open the full case study instead.');
      focusSafely(toggleBtn);
    };

    closeInteractivePreview = ({ restoreFocus = true } = {}) => {
      const preservedScroll = screenContentEl.scrollTop;
      teardownDossierPreview();
      animateMediaShellHeight(() => {
        syncUiToClosed();
        errorEl.hidden = true;
      });
      screenContentEl.scrollTop = preservedScroll;
      announce(`${entry.name} interactive preview closed.`);
      if (restoreFocus) focusSafely(toggleBtn);
    };

    const activateLoadedPreview = (state, initialHeight = null) => {
      if (activeDossierPreview !== state || state.ready) return;
      state.ready = true;
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
      animateMediaShellHeight(() => {
        mediaShell.dataset.previewState = 'active';
        mediaShell.removeAttribute('aria-busy');
        posterView.hidden = true;
        loadingView.hidden = true;
        errorEl.hidden = true;
        activeView.hidden = false;
        launchRow.hidden = true;
        toggleBtn.hidden = true;
        const { minH, maxH } = getMountHeightBounds();
        const fallbackH = window.innerWidth <= 639 ? maxH : minH;
        const targetMountH = Number.isFinite(Number(initialHeight)) && Number(initialHeight) > 0
          ? Math.max(minH, Math.min(maxH, Math.ceil(Number(initialHeight))))
          : fallbackH;
        lastAppliedMountH = targetMountH;
        mountEl.style.height = `${targetMountH}px`;
      });
      document.body.classList.add('is-dossier-preview-active');
      setScreenLightState('live');
      announce(`${entry.name} interactive reconstruction loaded.`);
      focusSafely(noticeEl);
    };

    const openInteractivePreview = () => {
      teardownDossierPreview();
      const customOverride = typeof window.__EXPLORE_PREVIEW_URL_OVERRIDE === 'string' && window.__EXPLORE_PREVIEW_URL_OVERRIDE
        ? window.__EXPLORE_PREVIEW_URL_OVERRIDE
        : null;
      const initialSrc = customOverride || previewCfg.embedUrl;

      animateMediaShellHeight(() => {
        mediaShell.dataset.previewState = 'loading';
        mediaShell.setAttribute('aria-busy', 'true');
        posterView.hidden = false;
        errorEl.hidden = true;
        activeView.hidden = true;
        loadingView.hidden = false;
        launchRow.hidden = false;
        toggleBtn.hidden = false;
        toggleBtn.textContent = 'CLOSE INTERACTIVE PREVIEW';
        toggleBtn.setAttribute('aria-expanded', 'true');
      });
      announce(`Loading ${entry.name} interactive reconstruction.`);

      const iframe = document.createElement('iframe');
      iframe.id = 'dossier-project-iframe';
      iframe.className = 'dossier-project-iframe';
      iframe.title = previewCfg.title;
      iframe.setAttribute('allow', '');

      const state = {
        projectId: entry.id,
        iframe,
        currentSrc: initialSrc,
        fallbackTried: Boolean(customOverride),
        ready: false,
        timeoutId: null,
        onMessage: null,
      };
      activeDossierPreview = state;

      state.onMessage = (event) => {
        if (activeDossierPreview !== state) return;
        if (event.origin !== window.location.origin) return;
        if (!state.iframe || event.source !== state.iframe.contentWindow) return;
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.source !== 'enuhri-project-embed') return;
        if (data.project !== entry.id) return;
        if (!PREVIEW_ALLOWED_MESSAGES.has(data.type)) return;

        if (data.type === 'project-embed-ready') {
          activateLoadedPreview(state, data.height);
        } else if (data.type === 'project-embed-height') {
          if (state.ready) applyMountHeight(data.height);
        } else if (data.type === 'project-embed-close-request') {
          closeInteractivePreview({ restoreFocus: true });
        } else if (data.type === 'project-embed-open-full-case-study') {
          launchDestination(entry.id);
        }
      };
      window.addEventListener('message', state.onMessage);

      const armTimeout = () => {
        if (state.timeoutId) clearTimeout(state.timeoutId);
        const ms = Number(window.__EXPLORE_PREVIEW_TIMEOUT_MS) > 0
          ? Number(window.__EXPLORE_PREVIEW_TIMEOUT_MS)
          : 7000;
        state.timeoutId = setTimeout(() => {
          if (activeDossierPreview === state && !state.ready) {
            failInteractivePreview();
          }
        }, ms);
      };

      iframe.addEventListener('load', () => {
        if (activeDossierPreview !== state || state.iframe !== iframe) return;
        let doc = null;
        try {
          doc = iframe.contentDocument;
        } catch {
          failInteractivePreview();
          return;
        }
        const rootDataset = doc && doc.documentElement ? doc.documentElement.dataset : null;
        const isScopedDoc = Boolean(rootDataset && rootDataset.embedProject === entry.id);
        const isFailedDoc = Boolean(rootDataset && rootDataset.embedFailed === '1');
        const hasReadyDemo = Boolean(doc && doc.querySelector('[data-demo-project][data-demo-ready="1"]'));

        if (!isScopedDoc || isFailedDoc || !hasReadyDemo) {
          if (!state.fallbackTried && state.currentSrc === previewCfg.embedUrl && !isFailedDoc) {
            state.fallbackTried = true;
            state.currentSrc = previewCfg.fallbackEmbedUrl;
            armTimeout();
            iframe.src = previewCfg.fallbackEmbedUrl;
            return;
          }
          failInteractivePreview();
          return;
        }
        if (!state.ready) {
          activateLoadedPreview(state);
        }
      });

      iframe.addEventListener('error', () => {
        if (activeDossierPreview !== state || state.iframe !== iframe) return;
        if (!state.fallbackTried && state.currentSrc === previewCfg.embedUrl) {
          state.fallbackTried = true;
          state.currentSrc = previewCfg.fallbackEmbedUrl;
          armTimeout();
          iframe.src = previewCfg.fallbackEmbedUrl;
          return;
        }
        failInteractivePreview();
      });

      armTimeout();
      iframe.src = initialSrc;
      mountEl.appendChild(iframe);
    };

    toggleBtn.addEventListener('click', () => {
      if (activeDossierPreview) {
        closeInteractivePreview({ restoreFocus: true });
      } else {
        openInteractivePreview();
      }
    });

    if (toolbarCloseBtn) {
      toolbarCloseBtn.addEventListener('click', () => {
        closeInteractivePreview({ restoreFocus: true });
      });
    }
  }

  const backOut = () => {
    teardownDossierPreview();
    renderMenu({ shouldFocus: true, focusAppId: entry.id, updateHistory: true });
    announce('Returned to catalog menu.');
  };

  const dossierLaunchLink = document.getElementById('dossier-open-case-link') || document.getElementById('dossier-primary-launch-link');
  if (dossierLaunchLink && LAUNCH_DESTINATIONS[entry.id]) {
    dossierLaunchLink.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      launchDestination(entry.id, { triggerEl: dossierLaunchLink });
    });
  }

  document.getElementById('dossier-close-btn').addEventListener('click', backOut);
  document.getElementById('dossier-return-btn').addEventListener('click', backOut);
  document.getElementById('dossier-view').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (activeDossierPreview && typeof closeInteractivePreview === 'function') {
        closeInteractivePreview({ restoreFocus: true });
        return;
      }
      backOut();
    }
  });

  focusSafely(document.getElementById('dossier-title'));
  announce(`${entry.name} dossier opened.`);
  renderDebugHud();
}

function triggerRestart() {
  if (isRestarting) return;
  if (currentView === 'standby') {
    announce('Workstation is already on Standby.');
    focusSafely(document.getElementById('start-explore-btn'));
    return;
  }

  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  screenContentEl.classList.remove('is-embed-active');
  if (webglScene) webglScene.setEmbedMode(false);
  closeFloppyTray(true);
  isRestarting = true;
  hwPowerBtn.disabled = true;
  currentView = 'restarting';
  screenContentEl.inert = false;
  toolbarPower.hidden = true;
  document.body.classList.add('is-restarting');
  announce('Restarting Explore workstation.');

  const restartLines = [
    'RESTARTING WORKSTATION...',
    'SAVING TERMINAL STATE...',
    'CRT APERTURE SYNC RESET...',
    'SYSTEM READY.',
  ];

  screenContentEl.innerHTML = `
    <div id="restart-view" class="restart-view">
      <pre id="restart-log" class="restart-log"></pre>
    </div>
  `;
  screenContentEl.scrollTop = 0;
  const rLogEl = document.getElementById('restart-log');
  setScreenLightState('paused');

  if (reducedMotion) {
    rLogEl.textContent = restartLines.join('\n');
    if (displayMode === '3d' && webglScene) webglScene.setCameraState('standby', 0);
    else setPixelScenePose('standby', true);
    scheduleTimer(() => renderStandby({ restoreFocus: true, updateHistory: true }), 380);
  } else {
    rLogEl.textContent = restartLines[0];
    scheduleTimer(() => {
      if (displayMode === '3d' && webglScene) webglScene.setCameraState('standby', 850);
      else setPixelScenePose('standby');
    }, 60);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[1]; }, 340);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[2]; }, 680);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[3]; }, 1040);
    scheduleTimer(() => {
      setScreenLightState('off');
      rLogEl.style.opacity = '0.35';
    }, 1360);
    scheduleTimer(() => {
      overlayEl.classList.add('is-collapsing');
    }, 1520);
    scheduleTimer(() => {
      overlayEl.classList.remove('is-collapsing');
    }, 1740);
    scheduleTimer(() => {
      renderStandby({ restoreFocus: true, updateHistory: true });
    }, 1980);
  }
  renderDebugHud();
}

function syncFromLocation({ immediate = true, isInitialLoad = false } = {}) {
  const rawHash = window.location.hash;
  if (!rawHash || rawHash === '#') {
    if (currentView === 'standby' && !document.body.classList.contains('is-powered')) return;
    renderStandby({ restoreFocus: false, updateHistory: false });
    return;
  }

  clearActiveTimers();
  if (rawHash === '#menu') {
    if (!isInitialLoad && currentView === 'menu') return;
    renderMenu({
      shouldFocus: Boolean(!isInitialLoad && lastTriggerAppId),
      focusAppId: !isInitialLoad ? lastTriggerAppId : null,
      updateHistory: false,
      immediatePose: immediate,
    });
    return;
  }

  if (rawHash.startsWith('#app=')) {
    const rawAppId = decodeURIComponent(rawHash.slice(5));
    const appId = rawAppId === 'app-06' ? 'devpath' : rawAppId;
    if (rawAppId === 'app-06') {
      setUrlHash('#app=devpath', { replace: true });
    }
    if (appId === 'professional') {
      if (!isInitialLoad && currentView === 'embed') return;
      renderProfessionalEmbed({ updateHistory: false, immediatePose: immediate });
      return;
    }
    if (INLINE_DOSSIER_IDS.has(appId)) {
      if (!isInitialLoad && currentView === 'dossier' && lastTriggerAppId === appId) return;
      renderDossier(appId, { updateHistory: false, immediatePose: immediate });
      return;
    }
  }

  setUrlHash('#menu', { replace: true });
  renderMenu({ shouldFocus: false, updateHistory: false, immediatePose: true });
}

// ---- Hardware Controls & Floppy Interaction ----
hwPowerBtn.addEventListener('click', triggerRestart);
toolbarPower.addEventListener('click', triggerRestart);

hwDiskBtn.addEventListener('pointerdown', (e) => {
  lastDiskPointerType = e.pointerType || 'mouse';
});

hwDiskBtn.addEventListener('mouseenter', () => {
  if (lastDiskPointerType === 'touch' || isRestarting) return;
  if (driveLeaveTimer) { clearTimeout(driveLeaveTimer); driveLeaveTimer = null; }
  if (drivePhase === 'closed') {
    openFloppyTrayFromHover();
  }
});

hwDiskBtn.addEventListener('mouseleave', () => {
  if (driveIntentTimer) { clearTimeout(driveIntentTimer); driveIntentTimer = null; }
  if (driveOpenTimer) { clearTimeout(driveOpenTimer); driveOpenTimer = null; }
  if (driveLatched || document.activeElement === hwDiskBtn) return;
  driveLeaveTimer = setTimeout(() => {
    driveLeaveTimer = null;
    closeFloppyTray();
  }, 600);
});

hwDiskBtn.addEventListener('focus', () => {
  if (driveLeaveTimer) { clearTimeout(driveLeaveTimer); driveLeaveTimer = null; }
  if (drivePhase === 'closed') {
    drivePhase = 'intent';
    syncFloppyDomAndScene();
  }
});

hwDiskBtn.addEventListener('blur', () => {
  scheduleTimer(() => {
    if (document.activeElement !== hwDiskBtn) {
      closeFloppyTray();
    }
  }, 150);
});

hwDiskBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drivePhase !== 'closed') {
    e.preventDefault();
    closeFloppyTray(true);
    announce('Floppy tray closed.');
  }
});

hwDiskBtn.addEventListener('click', (e) => {
  if (isRestarting) return;
  const fromKeyboard = e.detail === 0;
  const fromTouch = lastDiskPointerType === 'touch' || lastDiskPointerType === 'pen';

  if (drivePhase === 'open' || (drivePhase === 'opening' && !fromTouch && !fromKeyboard) || (drivePhase === 'opening' && driveLatched)) {
    closeFloppyTray(true);
    launchDestination('sandbox', { triggerEl: hwDiskBtn });
    return;
  }

  openFloppyTrayLatched();
});

// ---- Display Mode Selector & Debug Bindings ----
modeRadio3d.addEventListener('change', () => {
  if (modeRadio3d.checked) applyDisplayMode('3d', { manual: true, announceChange: true });
});

modeRadio2d.addEventListener('change', () => {
  if (modeRadio2d.checked) applyDisplayMode('2d', { manual: true, announceChange: true });
});

qualitySelect.addEventListener('change', () => {
  manual3dQuality = qualitySelect.value;
  if (displayMode === '3d' && webglScene) {
    webglScene.setQuality(resolve3dQualityTier());
    renderDebugHud();
  }
});

pixelModeSelect.addEventListener('change', () => {
  pixelMode = pixelModeSelect.value;
  if (webglScene) webglScene.setPixelMode(pixelMode);
  renderDebugHud();
});

webglBtn.addEventListener('click', () => {
  simulatedNoWebgl = !simulatedNoWebgl;
  applyNoWebglUI();
  if (simulatedNoWebgl) {
    webglStatusText = 'simulated-off';
    applyDisplayMode('2d', { manual: false, announceChange: true });
  } else {
    webglFailed = false;
    webglStatusText = webglScene ? 'active (three r170)' : 'inactive';
    applyDisplayMode(resolveDisplayMode(), { manual: false, announceChange: true });
  }
});

resetPrefBtn.addEventListener('click', () => {
  storedManualMode = null;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  const nextAuto = resolveDisplayMode();
  applyDisplayMode(nextAuto, { manual: false, announceChange: true });
  announce(`Preference cleared. Automatic display mode selected: ${nextAuto === '3d' ? '3D workstation' : '2D Pixel workstation'}.`);
});

if (motionQuery && typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', (e) => {
    reducedMotion = e.matches;
    applyMotionPreference();
    if (!storedManualMode) {
      applyDisplayMode(resolveDisplayMode(), { manual: false, announceChange: false, immediate: true });
    }
  });
}

if (coarseQuery && typeof coarseQuery.addEventListener === 'function') {
  coarseQuery.addEventListener('change', (e) => {
    coarsePointer = e.matches;
    scheduleViewportSettlement();
    if (webglScene) webglScene.setCoarsePointer(coarsePointer);
  });
}

function captureViewport() {
  const vp = readViewportMetrics();
  rootEl.style.setProperty('--app-height', `${vp.h}px`);
  rootEl.style.setProperty('--app-width', `${vp.w}px`);
  const stage = pixelMainEl.getBoundingClientRect();
  const style = getComputedStyle(rootEl);
  const inset = edge => parseFloat(style.getPropertyValue('--safe-' + edge)) || 0;
  const left = inset('left'), right = vp.w - inset('right');
  const top = Math.max(stage.top, inset('top')), bottom = vp.h - inset('bottom');
  const width = right - left, height = bottom - top;
  const compact = width <= 639 || (coarsePointer && vp.w <= 950 && height <= 460);
  // Fit the glass, leaving the casing, keyboard and room free to crop.
  const fitWidth = Math.max(1, Math.min(width * 0.98, width - 8));
  const fitHeight = Math.max(1, height - 12);
  settledViewport = {
    ...vp,
    coarsePointer,
    dossierFit: compact ? {
      width: fitWidth,
      height: fitHeight,
      cx: (left + right) / 2,
      cy: top + Math.max(height * 0.43, Math.min(fitHeight, fitWidth * 0.75) / 2 + 6),
    } : null,
    stage: { w: stage.width, h: stage.height, top: stage.top },
    safe: { left, right, top, bottom },
    visible: {
      left: Math.max(left, vp.visualOffsetLeft), top: Math.max(top, vp.visualOffsetTop),
      right: Math.min(right, vp.visualOffsetLeft + vp.visualW),
      bottom: Math.min(bottom, vp.visualOffsetTop + vp.visualH),
    },
  };
  return settledViewport;
}

function settleViewport() {
  const previous = settledViewport;
  const vp = captureViewport();
  if (previous && previous.w === vp.w && previous.h === vp.h
      && previous.coarsePointer === vp.coarsePointer && previous.visualScale === vp.visualScale
      && previous.stage.top === vp.stage.top
      && ['left', 'top', 'right', 'bottom'].every(k => previous.visible[k] === vp.visible[k]
        && previous.safe[k] === vp.safe[k])) return;
  if (!vp.isScaled && (window.scrollY || window.scrollX)) window.scrollTo(0, 0);
  if (displayMode === '3d' && webglScene) {
    webglScene.resizeViewport(vp.w, vp.h, resolve3dQualityTier());
  } else if (displayMode === '2d') {
    setPixelScenePose(currentPose(), true);
  }
  if (initComplete && !storedManualMode && resolveDisplayMode() !== displayMode) {
    applyDisplayMode(resolveDisplayMode(), { manual: false, immediate: true });
  }
}

function scheduleViewportSettlement() {
  const generation = ++geometryGeneration;
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (generation !== geometryGeneration) return;
    resizeFrame = 0;
    settleViewport();
  });
}

window.addEventListener('resize', scheduleViewportSettlement, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleViewportSettlement, { passive: true });
window.visualViewport?.addEventListener('scroll', scheduleViewportSettlement, { passive: true });
if (window.ResizeObserver) new ResizeObserver(scheduleViewportSettlement).observe(document.getElementById('proto-header'));

window.addEventListener('popstate', () => syncFromLocation({ immediate: true, isInitialLoad: false }));
window.addEventListener('hashchange', () => syncFromLocation({ immediate: true, isInitialLoad: false }));

document.addEventListener('visibilitychange', () => {
  if (displayMode === '2d') {
    if (document.hidden) stopPixel2dLoop('hidden (0 FPS)');
    else startOrResumePixel2dLoop();
  }
});

['pointerdown', 'pointermove', 'keydown', 'focusin'].forEach((evName) => {
  window.addEventListener(evName, recordUserActivity, { passive: true });
});

if (initSwitch2dBtn) {
  initSwitch2dBtn.addEventListener('click', () => {
    applyDisplayMode('2d', { manual: true, announceChange: true, immediate: true });
  });
}

// ---- Initialize Production Explore Workstation ----
window.dispatchEvent(new Event('workstation-controller-ready'));
try {
  settleViewport();
  applyMotionPreference();
  applyNoWebglUI();
  if (window.location.hash && window.location.hash !== '#') {
    syncFromLocation({ immediate: true, isInitialLoad: true });
  } else {
    renderStandby({ restoreFocus: false, updateHistory: false });
  }
  applyDisplayMode(resolveDisplayMode(), { manual: false, announceChange: false, immediate: true }).catch((err) => {
    if (!webglFailed) {
      webglFailed = true;
      webglStatusText = 'initialization failed';
      applyDisplayMode('2d', { manual: false, announceChange: true, immediate: true }).catch(showFatalInitError);
    } else {
      showFatalInitError();
    }
  });
} catch {
  showFatalInitError();
}
