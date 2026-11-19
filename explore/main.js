import { PixelEnvironment, computePixelSceneFrame } from './pixel-env.js';

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
  minApertureW: 600,
  minApertureH: 380,
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
const initTitleEl = document.getElementById('init-title');
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
const hwPowerBtn = document.getElementById('hw-power-btn');

if (DEBUG_MODE) {
  document.body.classList.add('has-debug');
  debugControlsEl.hidden = false;
  perfHudEl.hidden = false;
}
pixelModeSelect.value = pixelMode;

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
      { label: 'VIEW INTERACTIVE CASE STUDY ▸', href: '/#udm-radar', primary: true, external: false },
      { label: 'VIEW SOURCE REPOSITORY ↗', href: 'https://github.com/jendrickcon/udm-radar', primary: false, external: true },
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
      { label: 'VIEW INTERACTIVE CASE STUDY ▸', href: '/#studyquest', primary: true, external: false },
      { label: 'VIEW SOURCE REPOSITORY ↗', href: 'https://github.com/zap1104/studyquest', primary: false, external: true },
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
    name: 'CyberDefender',
    status: 'READY',
    category: 'Cybersecurity Tactical Simulation (Web Reimagining)',
    tagline: 'Gamified Threat Neutralization & Incident Response',
    summary: 'Originally prototyped in Godot 4 as a mobile cybersecurity simulation, CyberDefender has been reimagined and rebuilt as a native HTML/web tactical adventure where players practice threat recognition, defensive scripting, and incident response.',
    features: [
      'Turn-based incident response combat (EXECUTE, KNOWLEDGE, PATCHES, RUN)',
      'Core malware archetypes: Adware, Spyware, Trojans, Rootkits, and Ransomware',
      'Progressive 3-Tier Difficulty Modes (PCB Sector, Hazard Zone, System Overload)',
      'Offline Unix timestamp-based resource cooldowns and daily retention penalties',
      'Dynamic rank progression from SCRIPT KIDDIE to INCIDENT COMMANDER',
    ],
    technologies: ['HTML5 & Modern DOM', 'Vanilla ES Modules', 'SVG Vector Graphics', 'Web Audio API', 'Offline LocalStorage'],
    devStatus: 'LIVE NATIVE WEB REIMAGINING — /cyberdefender/',
    image: '../assets/projects/cyberdefender.png',
    actions: [
      { label: '▶ PLAY WEB REIMAGINING', href: '/cyberdefender/', primary: true, external: false },
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
      { label: 'OPEN PROTOTYPE (/devpath/) ▸', href: '/devpath/', primary: true, external: false },
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
let lastEmbedReloadCount = 0;
let activeDossierPreview = null;

function teardownDossierPreview() {
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

function readPixelStageBox() {
  if (!pixelMainEl) {
    const vp = readViewportMetrics();
    return { w: vp.w, h: vp.h, top: 0 };
  }
  const rect = pixelMainEl.getBoundingClientRect();
  const vp = readViewportMetrics();
  return {
    w: rect.width > 10 ? rect.width : vp.w,
    h: rect.height > 10 ? rect.height : Math.max(120, vp.h - 62),
    top: rect.top || 0,
  };
}

function applyPixelSceneProjection(frame) {
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
  cs.setProperty('--screen-x', `${frame.screenRect.x.toFixed(2)}px`);
  cs.setProperty('--screen-y', `${frame.screenRect.y.toFixed(2)}px`);
  cs.setProperty('--screen-w', `${frame.screenRect.w.toFixed(2)}px`);
  cs.setProperty('--screen-h', `${frame.screenRect.h.toFixed(2)}px`);

  cs.setProperty('--disk-hit-x', `${frame.diskRect.x.toFixed(2)}px`);
  cs.setProperty('--disk-hit-y', `${frame.diskRect.y.toFixed(2)}px`);
  cs.setProperty('--disk-hit-w', `${frame.diskRect.w.toFixed(2)}px`);
  cs.setProperty('--disk-hit-h', `${frame.diskRect.h.toFixed(2)}px`);

  cs.setProperty('--power-hit-x', `${frame.powerRect.x.toFixed(2)}px`);
  cs.setProperty('--power-hit-y', `${frame.powerRect.y.toFixed(2)}px`);
  cs.setProperty('--power-hit-w', `${frame.powerRect.w.toFixed(2)}px`);
  cs.setProperty('--power-hit-h', `${frame.powerRect.h.toFixed(2)}px`);

  if (frame.powerVis) {
    cs.setProperty('--power-vis-w', `${frame.powerVis.w.toFixed(2)}px`);
    cs.setProperty('--power-vis-h', `${frame.powerVis.h.toFixed(2)}px`);
  }
  if (currentView === 'embed' && activeEmbedState) {
    updateEmbedViewportMode(frame.screenRect);
  }
}

function setPixelScenePose(poseName, immediate = false) {
  pixelPoseTarget = poseName || 'standby';
  if (displayMode !== '2d') return;

  const { w, h, top } = readPixelStageBox();
  const targetFrame = computePixelSceneFrame(w, h, pixelPoseTarget, top);

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
  const { w, h } = readViewportMetrics();
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

function launchExternalRoute(url) {
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
    applyPixelSceneProjection(pixelCamCurrent);
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
  const m = displayMode === '3d' && webglScene
    ? (sceneMetrics || webglScene.getMetrics())
    : {
        fps: pixel2dStateText.startsWith('pixel2d-active') ? (pixel2dUploadTimestamps.length || 14) : 0,
        avgFrameMs: +pixelEnv.lastTickMs.toFixed(2),
        maxFrameMs: +pixelEnv.lastTickMs.toFixed(2),
        drawCalls: 0,
        triangles: 0,
        dpr: 1,
        renderScale: 1,
        pixelMode: 'pixel-2d',
        cameraPose: `pixel-${pixelPoseTarget}`,
        pixelTickMs: +pixelEnv.lastTickMs.toFixed(2),
        pixelUploadsPerSec: pixel2dUploadTimestamps.length,
        loopState: pixel2dStateText,
      };

  const effQuality = displayMode === '2d' ? 'low' : resolve3dQualityTier();
  const vpDebug = readViewportMetrics();
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

  if (!DEBUG_MODE || perfHudEl.hidden) return;
  perfHudEl.innerHTML = [
    `<div><strong>MODE:</strong> ${displayMode.toUpperCase()} (${storedManualMode ? 'manual' : 'auto'}) | <strong>RM:</strong> ${reducedMotion ? 'ON' : 'OFF'}</div>`,
    `<div><strong>FPS:</strong> ${m.fps} | <strong>LOOP:</strong> ${m.loopState}</div>`,
    `<div><strong>FRAME:</strong> avg ${m.avgFrameMs}ms / max ${m.maxFrameMs}ms</div>`,
    `<div><strong>GPU:</strong> ${m.drawCalls} calls | ${m.triangles} tris | DPR ${m.dpr}</div>`,
    `<div><strong>PIXEL 320×180:</strong> ${m.pixelTickMs}ms | ${m.pixelUploadsPerSec} up/s | <strong>DISK:</strong> ${drivePhase}</div>`,
    `<div><strong>WEBGL:</strong> ${webglStatusText}</div>`,
  ].join('');
}

async function ensureWebGL() {
  if (webglScene || simulatedNoWebgl || webglFailed) return Boolean(webglScene);

  try {
    const mod = await import('./crt-scene.js');
    webglScene = await mod.createCrtScene({
      canvas: canvasEl,
      overlayContainer: chassisEl,
      pixelEnv,
      initialQuality: resolve3dQualityTier() === 'low' ? 'high' : resolve3dQualityTier(),
      initialPixelMode: pixelMode,
      reducedMotion,
      coarsePointer,
      getViewportSize: readViewportMetrics,
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
      projectionCb(scr) {
        if (displayMode === '3d' && currentView === 'embed' && activeEmbedState) {
          updateEmbedViewportMode(scr);
        }
      },
    });
    return true;
  } catch (err) {
    webglFailed = true;
    webglStatusText = 'failed: ' + (err?.message || 'load error');
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

function showFatalInitError(message) {
  clearInitTimers();
  rootEl.dataset.workstationState = 'error';
  if (initOverlayEl) {
    initOverlayEl.hidden = false;
    initOverlayEl.removeAttribute('aria-hidden');
  }
  if (initTitleEl) initTitleEl.textContent = 'WORKSTATION UNAVAILABLE';
  if (initStageTextEl) initStageTextEl.textContent = 'INITIALIZATION FAILED';
  if (initHintEl) initHintEl.textContent = message || 'Unable to initialize workstation display.';
  if (initSwitch2dBtn) initSwitch2dBtn.hidden = true;
  if (initActionsEl) initActionsEl.hidden = false;
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

  const poseName = currentView === 'embed'
    ? 'embed'
    : currentView === 'boot'
      ? 'boot'
      : currentView === 'standby' || currentView === 'restarting'
        ? 'standby'
        : 'menu';

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
    canvasEl.setAttribute('data-active', 'false');
    pixelEnv.renderStatic();
    setPixelScenePose(poseName, true);
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
    canvasEl.setAttribute('data-active', 'true');
    webglScene.setActive(true);
    webglScene.setReducedMotion(reducedMotion);
    webglScene.setQuality(resolve3dQualityTier());
    webglScene.setEmbedMode(currentView === 'embed');
    webglScene.syncBeforeShow(poseName);
    let targetLight = 'menu';
    if (currentView === 'standby') targetLight = 'standby';
    else if (currentView === 'restarting') targetLight = 'paused';
    else if (currentView === 'embed') targetLight = 'live';
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
  if (webglScene) webglScene.setReducedMotion(reducedMotion);
  if (displayMode === '2d') {
    if (reducedMotion) {
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
        launchExternalRoute('/art-gallery/');
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

function readCurrentScreenApertureRect() {
  const w = parseFloat(chassisEl.style.getPropertyValue('--screen-w'));
  const h = parseFloat(chassisEl.style.getPropertyValue('--screen-h'));
  if (Number.isFinite(w) && Number.isFinite(h) && w > 10 && h > 10) {
    return { w, h };
  }
  const r = overlayEl.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

function updateEmbedPanState() {
  if (currentView !== 'embed' || !activeEmbedState || activeEmbedState.failed) return;
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

function updateEmbedViewportMode(knownScreenRect = null) {
  if (currentView !== 'embed' || !activeEmbedState) return;
  const screenRect = knownScreenRect || readCurrentScreenApertureRect();
  let docWidth;
  if (EMBED_WIDTH_OVERRIDE === '980') {
    docWidth = `${Math.max(Math.round(screenRect.w), EMBED_CONFIG.virtualDesktopWidth)}px`;
  } else if (EMBED_WIDTH_OVERRIDE === '100%') {
    docWidth = '100%';
  } else {
    const useDesktopVirtualWidth =
      !coarsePointer &&
      screenRect.w >= EMBED_CONFIG.minApertureW &&
      screenRect.h >= EMBED_CONFIG.minApertureH;
    docWidth = useDesktopVirtualWidth
      ? `${Math.max(Math.round(screenRect.w), EMBED_CONFIG.virtualDesktopWidth)}px`
      : '100%';
  }
  if (activeEmbedState.docWidthSetting !== docWidth) {
    activeEmbedState.docWidthSetting = docWidth;
    activeEmbedState.rootEl.style.setProperty('--embed-doc-w', docWidth);
  }
  requestAnimationFrame(() => updateEmbedPanState());
}

function teardownProfessionalEmbed() {
  if (!activeEmbedState) return;
  const state = activeEmbedState;
  lastEmbedReloadCount = state.reloadCount;
  activeEmbedState = null;
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
  clearActiveTimers();
  teardownDossierPreview();
  teardownProfessionalEmbed();
  lastTriggerAppId = 'professional';
  currentView = 'embed';
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
        </button>

        <span id="embed-status-label" class="professional-embed__status" aria-live="polite">LIVE PREVIEW</span>

        <a id="embed-open-full-link" class="embed-ctrl-btn embed-ctrl-btn--open" href="/" target="_top" aria-label="Open full Professional Portfolio">
          <span class="lbl-full">OPEN FULL SITE ↗</span>
          <span class="lbl-compact" aria-hidden="true">FULL SITE ↗</span>
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
          <p class="professional-embed__fallback-title">Professional Portfolio preview is unavailable.</p>
          <div class="professional-embed__fallback-actions">
            <button type="button" id="embed-retry-btn" class="embed-ctrl-btn embed-ctrl-btn--return">RETRY</button>
            <a id="embed-fallback-open-link" class="embed-ctrl-btn embed-ctrl-btn--open" href="/" target="_top" aria-label="Open full Professional Portfolio">OPEN FULL SITE ↗</a>
            <button type="button" id="embed-fallback-return-btn" class="embed-ctrl-btn embed-ctrl-btn--return">RETURN TO CATALOG</button>
          </div>
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
  const fallbackReturnBtn = document.getElementById('embed-fallback-return-btn');

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
    currentSrc: '/',
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

  returnBtn.addEventListener('click', returnFromEmbedToCatalog);
  fallbackReturnBtn.addEventListener('click', returnFromEmbedToCatalog);
  rootEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      returnFromEmbedToCatalog();
    }
  });

  const showFailure = () => {
    if (activeEmbedState !== state) return;
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
    state.failed = true;
    state.loaded = false;
    loadingEl.hidden = true;
    fallbackEl.hidden = false;
    statusLabelEl.textContent = 'UNAVAILABLE';
    announce('Professional Portfolio preview is unavailable.');
    renderDebugHud();
  };

  const armTimeout = () => {
    if (state.timeoutId) clearTimeout(state.timeoutId);
    state.timeoutId = setTimeout(() => {
      if (activeEmbedState === state && !state.loaded) {
        showFailure();
      }
    }, EMBED_CONFIG.loadTimeoutMs);
  };

  const attachFrame = (initialSrc) => {
    if (state.frame) {
      try { state.frame.src = 'about:blank'; } catch {}
      state.frame.remove();
    }
    if (typeof state.cleanupDocListeners === 'function') {
      state.cleanupDocListeners();
      state.cleanupDocListeners = null;
    }
    state.loaded = false;
    state.failed = false;
    state.currentSrc = initialSrc;
    loadingEl.hidden = false;
    fallbackEl.hidden = true;
    announce('Loading Professional Portfolio preview.');

    const frame = document.createElement('iframe');
    frame.id = 'professional-embed-frame';
    frame.className = 'professional-embed__frame';
    frame.title = 'Professional Portfolio preview';
    frame.src = initialSrc;
    state.frame = frame;

    frame.addEventListener('load', () => {
      if (activeEmbedState !== state || state.frame !== frame) return;
      state.reloadCount += 1;
      lastEmbedReloadCount = state.reloadCount;

      let doc = null;
      let locPath = '';
      try {
        doc = frame.contentDocument;
        locPath = frame.contentWindow?.location?.pathname || '';
      } catch {
        showFailure();
        return;
      }

      if (locPath && /^\/explore(\/|$)/i.test(locPath)) {
        returnFromEmbedToCatalog();
        return;
      }

      const isValidPortfolio = Boolean(doc && doc.getElementById('main') && doc.getElementById('hdr'));
      if (!isValidPortfolio) {
        if (!state.fallbackTried && (locPath === '/' || locPath === '/index.html' || state.currentSrc === '/')) {
          state.fallbackTried = true;
          state.currentSrc = '/professional/index.html';
          armTimeout();
          frame.src = '/professional/index.html';
          return;
        }
        showFailure();
        return;
      }

      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
      state.loaded = true;
      state.failed = false;
      loadingEl.hidden = true;
      fallbackEl.hidden = true;
      bindEmbeddedDocumentBridges(state);
      viewportEl.scrollLeft = 0;
      updateEmbedViewportMode();
      announce('Professional Portfolio preview loaded.');
      renderDebugHud();
    });

    frame.addEventListener('error', () => {
      if (activeEmbedState !== state || state.frame !== frame) return;
      if (!state.fallbackTried && state.currentSrc === '/') {
        state.fallbackTried = true;
        state.currentSrc = '/professional/index.html';
        armTimeout();
        frame.src = '/professional/index.html';
        return;
      }
      showFailure();
    });

    armTimeout();
    viewportEl.appendChild(frame);
  };

  retryBtn.addEventListener('click', () => {
    state.fallbackTried = false;
    attachFrame('/');
    focusSafely(returnBtn);
  });

  updateEmbedViewportMode();
  attachFrame('/');
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

  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('menu', immediatePose ? 0 : undefined);
  } else {
    setPixelScenePose('menu', immediatePose);
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
          </div>
          <div id="dossier-preview-mount" class="dossier-preview-mount"></div>
        </div>
        <p id="dossier-preview-error" class="dossier-preview-error" role="alert" hidden>Interactive preview unavailable. Open the full case study instead.</p>
      </div>
    `;
  } else if (entry.image) {
    mediaHtml = `
      <div class="dossier-screenshot-frame">
        <img class="dossier-screenshot" src="${entry.image}" alt="${entry.name} preview" />
      </div>
    `;
  }

  const actionsList = Array.isArray(entry.actions) ? entry.actions : [];
  const primaryActions = actionsList.filter((a) => a.primary);
  const secondaryActions = actionsList.filter((a) => !a.primary);

  const renderActionLink = (action, isPrimary) => {
    const cls = isPrimary ? 'dossier-play-btn' : 'dossier-link-btn';
    const relAttr = action.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const srExt = action.external ? '<span class="sr-only"> (opens in a new tab)</span>' : '';
    return `<a class="${cls}" href="${action.href}"${relAttr}>${action.label}${srExt}</a>`;
  };

  const primaryActionsHtml = previewCfg
    ? `
      <div class="dossier-actions dossier-actions--preview">
        <button type="button" id="dossier-preview-toggle-btn" class="dossier-play-btn dossier-preview-toggle-btn" aria-expanded="false">TRY INTERACTIVE PREVIEW</button>
        <a id="dossier-open-case-link" class="dossier-link-btn dossier-case-btn" href="${previewCfg.caseStudyHref}">OPEN FULL CASE STUDY ▸</a>
      </div>
    `
    : (primaryActions.length
      ? `<div class="dossier-actions">${primaryActions.map((a) => renderActionLink(a, true)).join('')}</div>`
      : '');

  const secondaryActionsHtml = secondaryActions.length
    ? `<div class="dossier-actions">${secondaryActions.map((a) => renderActionLink(a, false)).join('')}</div>`
    : '';

  const taglineHtml = entry.tagline
    ? `<p class="dossier-tagline">"${entry.tagline}"</p>`
    : '';

  const featuresHtml = Array.isArray(entry.features) && entry.features.length
    ? `
      <h3 class="dossier-section-title">KEY FEATURES</h3>
      <ul class="dossier-features">
        ${entry.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `
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
      ${primaryActionsHtml}
      <p class="dossier-meta">${entry.category}</p>
      ${taglineHtml}
      <p class="dossier-body">${entry.summary}</p>
      ${featuresHtml}
      ${techHtml}
      <h3 class="dossier-section-title">STATUS</h3>
      <p class="dossier-status">${entry.devStatus || entry.status}</p>
      ${secondaryActionsHtml}
      <div class="dossier-footer">
        <button type="button" id="dossier-return-btn" class="dossier-return-btn">◂ RETURN TO CATALOG</button>
      </div>
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
    const mountEl = document.getElementById('dossier-preview-mount');
    const errorEl = document.getElementById('dossier-preview-error');
    const toggleBtn = document.getElementById('dossier-preview-toggle-btn');

    if (posterImg && posterMissing) {
      posterImg.addEventListener('error', () => {
        posterImg.hidden = true;
        posterMissing.hidden = false;
      });
    }

    const syncUiToClosed = () => {
      mediaShell.dataset.previewState = 'poster';
      posterView.hidden = false;
      loadingView.hidden = true;
      activeView.hidden = true;
      mountEl.style.height = '';
      toggleBtn.textContent = 'TRY INTERACTIVE PREVIEW';
      toggleBtn.setAttribute('aria-expanded', 'false');
      setScreenLightState('menu');
    };

    const applyMountHeight = (h) => {
      const numeric = Number(h);
      if (!Number.isFinite(numeric) || numeric <= 0) return;
      const isCompact = window.innerWidth <= 639;
      const clamped = isCompact
        ? Math.max(150, Math.min(260, Math.ceil(numeric)))
        : Math.max(180, Math.min(410, Math.ceil(numeric)));
      mountEl.style.height = `${clamped}px`;
    };

    const failInteractivePreview = () => {
      teardownDossierPreview();
      syncUiToClosed();
      errorEl.hidden = false;
      announce('Interactive preview unavailable. Open the full case study instead.');
    };

    closeInteractivePreview = ({ restoreFocus = true } = {}) => {
      const preservedScroll = screenContentEl.scrollTop;
      teardownDossierPreview();
      syncUiToClosed();
      errorEl.hidden = true;
      screenContentEl.scrollTop = preservedScroll;
      announce(`${entry.name} interactive preview closed.`);
      if (restoreFocus) focusSafely(toggleBtn);
    };

    const activateLoadedPreview = (state) => {
      if (activeDossierPreview !== state || state.ready) return;
      state.ready = true;
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
      mediaShell.dataset.previewState = 'active';
      posterView.hidden = true;
      loadingView.hidden = true;
      errorEl.hidden = true;
      activeView.hidden = false;
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

      mediaShell.dataset.previewState = 'loading';
      posterView.hidden = false;
      errorEl.hidden = true;
      activeView.hidden = true;
      loadingView.hidden = false;
      toggleBtn.textContent = 'CLOSE INTERACTIVE PREVIEW';
      toggleBtn.setAttribute('aria-expanded', 'true');
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
          activateLoadedPreview(state);
          applyMountHeight(data.height);
        } else if (data.type === 'project-embed-height') {
          applyMountHeight(data.height);
        } else if (data.type === 'project-embed-close-request') {
          closeInteractivePreview({ restoreFocus: true });
        } else if (data.type === 'project-embed-open-full-case-study') {
          window.location.assign(previewCfg.caseStudyHref);
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
        activateLoadedPreview(state);
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
  }

  const backOut = () => {
    teardownDossierPreview();
    renderMenu({ shouldFocus: true, focusAppId: entry.id, updateHistory: true });
    announce('Returned to catalog menu.');
  };

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
    launchExternalRoute('/sandbox/');
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
    if (webglScene) webglScene.setCoarsePointer(coarsePointer);
    if (!storedManualMode) {
      applyDisplayMode(resolveDisplayMode(), { manual: false, announceChange: false, immediate: true });
    } else if (displayMode === '3d' && webglScene) {
      webglScene.setQuality(resolve3dQualityTier());
    }
  });
}

let lastAppliedVpW = 0;
let lastAppliedVpH = 0;
let lastAppliedScale = 1;
let vpDebounceTimer = null;
let settledProjRafId = null;

function applySettledProjection(w, h) {
  if (displayMode === '3d' && webglScene) {
    webglScene.setQuality(resolve3dQualityTier());
    webglScene.resizeViewport(w, h);
  } else if (displayMode === '2d') {
    setPixelScenePose(pixelPoseTarget, true);
  }
}

function syncAppViewportHeight(force = false) {
  const vp = readViewportMetrics();
  const { w, h, layoutH, visualScale, isScaled } = vp;
  const appH = isScaled ? layoutH : h;
  const dW = Math.abs(w - lastAppliedVpW);
  const dH = Math.abs(appH - lastAppliedVpH);
  const dScale = Math.abs(visualScale - lastAppliedScale);
  if (!force && dW < 2 && dH < 2 && dScale < 0.02) return;
  lastAppliedVpW = w;
  lastAppliedVpH = appH;
  lastAppliedScale = visualScale;
  document.documentElement.style.setProperty('--app-height', `${appH}px`);
  if (!isScaled && visualScale <= 1.01 && (window.scrollY !== 0 || window.scrollX !== 0)) {
    window.scrollTo(0, 0);
  }
  if (initComplete && !storedManualMode) {
    const autoMode = resolveDisplayMode();
    if (autoMode !== displayMode) {
      applyDisplayMode(autoMode, { manual: false, announceChange: false, immediate: true });
      return;
    }
  }
  if (force) {
    applySettledProjection(w, h);
    return;
  }
  if (settledProjRafId) cancelAnimationFrame(settledProjRafId);
  settledProjRafId = requestAnimationFrame(() => {
    settledProjRafId = null;
    const settled = readViewportMetrics();
    applySettledProjection(settled.w, settled.h);
  });
}

function onViewportChangedDebounced() {
  if (vpDebounceTimer) clearTimeout(vpDebounceTimer);
  vpDebounceTimer = setTimeout(() => {
    vpDebounceTimer = null;
    syncAppViewportHeight(false);
  }, 110);
}

window.addEventListener('resize', onViewportChangedDebounced, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onViewportChangedDebounced, { passive: true });
  window.visualViewport.addEventListener('scroll', () => {
    const vv = window.visualViewport;
    if (vv && (vv.scale || 1) > 1.01) return;
    if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
  }, { passive: true });
}

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
try {
  syncAppViewportHeight(true);
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
      webglStatusText = 'init-error: ' + (err?.message || 'error');
      applyDisplayMode('2d', { manual: false, announceChange: true, immediate: true }).catch((fallbackErr) => {
        showFatalInitError(fallbackErr?.message);
      });
    } else {
      showFatalInitError(err?.message);
    }
  });
} catch (err) {
  showFatalInitError(err?.message);
}
