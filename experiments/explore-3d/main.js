import { PixelEnvironment } from './pixel-env.js';

const STORAGE_KEY = 'enuhri_explore3d_display_mode';
const params = new URLSearchParams(window.location.search);
const DEBUG_MODE = params.get('debug') === '1';
const INITIAL_NO_WEBGL = params.get('nowebgl') === '1';
const INITIAL_PIXEL_MODE = ['smooth', 'quantized', 'lowres75', 'lowres50'].includes(params.get('pixel3d'))
  ? params.get('pixel3d')
  : 'smooth';

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
let displayMode = '3d'; // '3d' | '2d'

const canvasEl = document.getElementById('crt-scene-canvas');
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

// Six visible catalog slots (DevPath occupies slot 06; Sandbox moves to centered floppy bay)
const CATALOG_SLOTS = [
  {
    index: '01',
    id: 'professional',
    name: 'Professional Portfolio',
    status: 'LIVE',
    category: 'Placeholder — Primary Hiring Portfolio (/ in production)',
    summary: 'Demonstrates cyan LIVE illumination and accessible tile action without navigating away from the isolated prototype.',
  },
  {
    index: '02',
    id: 'udm-radar',
    name: 'UDM-RADAR',
    status: 'READY',
    category: 'Academic Analytics & Decision-Support System (Sample Dossier)',
    summary: 'Four-member BSIT capstone prototype using synthetic academic records and a Decision Tree Regressor for advisory GWA projections supporting faculty review.',
    devStatus: 'FUNCTIONAL CAPSTONE PROTOTYPE — SAMPLE DOSSIER VIEW',
  },
  {
    index: '03',
    id: 'studyquest',
    name: 'StudyQuest',
    status: 'READY',
    category: 'Placeholder — AI-Assisted Learning Platform',
    summary: 'Demonstrates inline catalog presentation and keyboard geometry traversal inside the CRT aperture.',
    devStatus: 'PLACEHOLDER SAMPLE SLOT',
  },
  {
    index: '04',
    id: 'art-gallery',
    name: 'Enuhri Art Gallery',
    status: 'READY',
    category: 'Placeholder — Interactive Virtual Museum',
    summary: 'Navigation disabled in isolated feasibility prototype so production sub-apps remain untouched.',
  },
  {
    index: '05',
    id: 'cyberdefender',
    name: 'CyberDefender',
    status: 'READY',
    category: 'Placeholder — Tactical Web Reimagining',
    summary: 'Placeholder sample card confirming crisp readable monospace body text and predictable focus restoration.',
  },
  {
    index: '06',
    id: 'devpath',
    name: 'DevPath',
    status: 'PAUSED PROTOTYPE',
    statusKey: 'paused',
    category: 'Architecture & Decision-Graph Prototype (Paused)',
    summary: 'Slot 06 placeholder retaining the honest PAUSED PROTOTYPE framing and amber status treatment while external navigation stays disabled.',
    devStatus: 'PAUSED PROTOTYPE — BROADER DOMAINS INTENTIONALLY PAUSED',
  },
];

const SANDBOX_SLOT = {
  id: 'sandbox',
  name: 'SANDBOX.SYS',
  status: 'HIDDEN FLOPPY DISK',
  category: 'Hidden Diskette Preview — Cellular Automata Experiment',
  summary: 'Loaded from the centered 3.5" floppy drive bay (UNKNOWN DISK DETECTED). In this isolated prototype, launching /sandbox/ is simulated inside this preview dossier.',
  devStatus: 'HIDDEN FLOPPY PREVIEW — EXTERNAL ROUTE DISABLED IN PROTOTYPE',
};

const STATE_GLOW_HEX = {
  standby: '#6b7c3e',
  menu: '#39ff14',
  live: '#00e5ff',
  paused: '#ffbf00',
  off: '#122014',
};

let currentView = 'standby'; // 'standby' | 'boot' | 'menu' | 'dossier' | 'restarting'
let preDossierView = 'menu';
let lastTriggerAppId = null;
let lastTriggerSource = 'catalog';
let activeTimers = [];
let bootDone = false;
let isRestarting = false;
let modeSwitchTimer = null;

// Floppy bay state machine + 6-frame Pixel 2D stepper
let drivePhase = 'closed'; // 'closed' | 'intent' | 'opening' | 'open'
let driveIntentTimer = null;
let driveOpenTimer = null;
let driveLeaveTimer = null;
let driveStepInterval = null;
let currentPixelFrame = 0;
let driveLatched = false;
let lastDiskPointerType = 'mouse';

// Pixel 2D 13.5 FPS environment loop & inactivity sleep
let pixel2dRafId = null;
let pixel2dLastMs = performance.now();
let pixel2dActivityMs = performance.now();
let pixel2dUploadTimestamps = [];
let pixel2dStateText = 'idle (0 FPS)';

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
  if (el && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

function readViewportMetrics() {
  const vv = window.visualViewport;
  const w = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
  const h = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
  return { w, h };
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
    return;
  }
  driveStepInterval = setInterval(() => {
    if (currentPixelFrame < targetFrame) currentPixelFrame += 1;
    else if (currentPixelFrame > targetFrame) currentPixelFrame -= 1;
    hwDiskBtn.dataset.pixelFrame = String(currentPixelFrame);
    if (currentPixelFrame === targetFrame) {
      clearInterval(driveStepInterval);
      driveStepInterval = null;
    }
  }, 210); // 5 steps * 210ms = ~1.05s stepped pixel animation
}

function syncFloppyDomAndScene() {
  hwDiskBtn.dataset.driveState = drivePhase;
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
      announce('Unknown disk detected: SANDBOX.SYS. Activate to inspect.');
    } else {
      driveOpenTimer = setTimeout(() => {
        driveOpenTimer = null;
        if (drivePhase === 'opening') {
          drivePhase = 'open';
          syncFloppyDomAndScene();
          announce('Unknown disk detected: SANDBOX.SYS. Activate to inspect.');
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
  announce('Hidden Sandbox disk opening. SANDBOX.SYS detected. Activate again to open.');

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
    pixelEnv.renderStatic();
    stopPixel2dLoop('reduced-motion (0 FPS)');
    return;
  }
  if (now - pixel2dActivityMs > 10000) {
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
  if (!pixel2dRafId) {
    pixel2dLastMs = performance.now();
    pixel2dStateText = 'pixel2d-active (13.5 FPS)';
    pixel2dRafId = requestAnimationFrame(tickPixel2dLoop);
  }
}

function recordUserActivity() {
  pixel2dActivityMs = performance.now();
  if (displayMode === '2d' && !pixel2dRafId && !reducedMotion && !document.hidden) {
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
        cameraPose: '2d-ortho',
        pixelTickMs: +pixelEnv.lastTickMs.toFixed(2),
        pixelUploadsPerSec: pixel2dUploadTimestamps.length,
        loopState: pixel2dStateText,
      };

  const effQuality = displayMode === '2d' ? 'low' : resolve3dQualityTier();
  window.__explore3dMetrics = {
    displayMode,
    effectiveQuality: effQuality,
    storedPreference: storedManualMode,
    manual3dQuality,
    webglStatus: webglStatusText,
    reducedMotion,
    coarsePointer,
    currentView,
    drivePhase,
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
    });
    return true;
  } catch (err) {
    webglFailed = true;
    webglStatusText = 'failed: ' + (err?.message || 'load error');
    webglScene = null;
    return false;
  }
}

async function applyDisplayMode(targetMode, { manual = false, announceChange = false, immediate = false } = {}) {
  const prevFocus = document.activeElement;
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
  displayMode = nextMode;

  modeRadio3d.checked = displayMode === '3d';
  modeRadio2d.checked = displayMode === '2d';

  if (modeSwitchTimer) {
    clearTimeout(modeSwitchTimer);
    modeSwitchTimer = null;
  }
  if (changed && !immediate && !reducedMotion) {
    document.body.classList.add('mode-switching');
    modeSwitchTimer = setTimeout(() => {
      document.body.classList.remove('mode-switching');
      modeSwitchTimer = null;
    }, 300);
  } else {
    document.body.classList.remove('mode-switching');
  }

  // Safely reset transient floppy tray animation without disturbing active screen view
  if (drivePhase !== 'closed') {
    closeFloppyTray(true);
  }

  if (displayMode === '2d') {
    if (webglScene) {
      webglScene.setQuality('low');
    }
    document.body.classList.remove('mode-3d');
    document.body.classList.add('mode-pixel-2d');
    canvasEl.setAttribute('data-active', 'false');
    pixelEnv.renderStatic();
    startOrResumePixel2dLoop();
  } else {
    stopPixel2dLoop('inactive (3D mode)');
    const ok = await ensureWebGL();
    if (!ok || displayMode !== '3d') {
      applyDisplayMode('2d', { manual: false, announceChange: false, immediate: true });
      return;
    }
    const poseName = currentView === 'boot' ? 'boot' : currentView === 'standby' || currentView === 'restarting' ? 'standby' : 'menu';
    webglScene.setReducedMotion(reducedMotion);
    webglScene.setQuality(resolve3dQualityTier());
    webglScene.syncBeforeShow(poseName);
    let targetLight = 'menu';
    if (currentView === 'standby') targetLight = 'standby';
    else if (currentView === 'restarting') targetLight = 'paused';
    else if (currentView === 'dossier') {
      if (lastTriggerAppId === 'devpath') targetLight = 'paused';
      else if (lastTriggerAppId === 'professional' || lastTriggerAppId === 'sandbox') targetLight = 'live';
    }
    setScreenLightState(targetLight);
    webglScene.renderSingleFrame();
    document.body.classList.remove('mode-pixel-2d');
    document.body.classList.add('mode-3d');
    canvasEl.setAttribute('data-active', 'true');
  }

  if (prevFocus && document.body.contains(prevFocus) && document.activeElement !== prevFocus) {
    focusSafely(prevFocus);
  }

  if (announceChange) {
    announce(`Display mode switched to ${displayMode === '3d' ? '3D workstation' : 'Pixel 2D workstation'}.`);
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
function renderStandby(restoreFocus = false) {
  clearActiveTimers();
  currentView = 'standby';
  isRestarting = false;
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-powered', 'is-restarting');
  overlayEl.classList.remove('is-collapsing');

  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('standby');
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
  }
  setScreenLightState('menu');
  renderBoot();
}

function renderBoot() {
  clearActiveTimers();
  currentView = 'boot';
  bootDone = false;
  const lines = [
    'ENUHRI WORKSTATION BIOS r1.0',
    'CHECKING CRT APERTURE SYNC .... OK',
    'LOADING 320x180 ENVIRONMENT ... OK',
    'INDEXING 6 CATALOG SLOTS ...... READY',
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
    skipBtn.setAttribute('aria-label', 'Continue to sample catalog menu');
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
      renderMenu({ shouldFocus: true });
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

function renderMenu({ shouldFocus = false, focusAppId = null } = {}) {
  clearActiveTimers();
  currentView = 'menu';
  document.body.classList.add('is-powered');
  if (displayMode === '3d' && webglScene) {
    webglScene.setCameraState('menu');
  }
  setScreenLightState('menu');

  screenContentEl.innerHTML = `
    <div id="app-menu" class="app-menu">
      <h2 class="app-menu-header" tabindex="-1">SAMPLE CATALOG (PROTOTYPE)</h2>
      <nav class="app-nav" aria-label="Prototype applications">
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
      lastTriggerSource = 'catalog';
      lastTriggerAppId = id;
      preDossierView = 'menu';
      renderDossier(id);
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

function renderDossier(appId) {
  currentView = 'dossier';
  const entry = appId === 'sandbox'
    ? SANDBOX_SLOT
    : CATALOG_SLOTS.find((a) => a.id === appId) || CATALOG_SLOTS[0];

  if (entry.status === 'LIVE' || entry.id === 'sandbox') setScreenLightState('live');
  else if (entry.id === 'devpath') setScreenLightState('paused');
  else setScreenLightState('menu');

  const returnLabel = preDossierView === 'standby' ? '◂ RETURN TO STANDBY' : '◂ RETURN TO CATALOG';
  const closeAria = preDossierView === 'standby'
    ? `Close ${entry.name} preview and return to standby`
    : `Close ${entry.name} dossier and return to catalog`;

  screenContentEl.innerHTML = `
    <article id="dossier-view" class="dossier-view" aria-labelledby="dossier-title">
      <div class="dossier-head">
        <h2 id="dossier-title" class="dossier-title" tabindex="-1">${entry.name.toUpperCase()}</h2>
        <button type="button" id="dossier-close-btn" class="dossier-close-btn" aria-label="${closeAria}">✕</button>
      </div>
      <p class="dossier-meta">${entry.category}</p>
      <p class="dossier-body">${entry.summary}</p>
      <p class="dossier-status">Status: ${entry.devStatus || entry.status}</p>
      <p class="dossier-demo-note">Prototype demonstration only — external production navigation is disabled.</p>
      <div class="dossier-footer">
        <button type="button" id="dossier-return-btn" class="dossier-return-btn">${returnLabel}</button>
      </div>
    </article>
  `;
  screenContentEl.scrollTop = 0;

  const backOut = () => {
    const restoreToDisk = lastTriggerSource === 'disk';
    if (preDossierView === 'standby') {
      renderStandby(false);
    } else {
      renderMenu({ shouldFocus: !restoreToDisk, focusAppId: restoreToDisk ? null : lastTriggerAppId });
    }
    if (restoreToDisk) {
      closeFloppyTray(true);
      focusSafely(hwDiskBtn);
    }
    announce(preDossierView === 'standby' ? 'Returned to standby.' : 'Returned to catalog menu.');
  };

  document.getElementById('dossier-close-btn').addEventListener('click', backOut);
  document.getElementById('dossier-return-btn').addEventListener('click', backOut);
  document.getElementById('dossier-view').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      backOut();
    }
  });

  focusSafely(document.getElementById('dossier-title'));
  announce(`${entry.name} sample dossier opened.`);
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
    scheduleTimer(() => renderStandby(true), 380);
  } else {
    rLogEl.textContent = restartLines[0];
    scheduleTimer(() => {
      if (displayMode === '3d' && webglScene) webglScene.setCameraState('standby', 850);
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
      renderStandby(true);
    }, 1980);
  }
  renderDebugHud();
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
    if (document.activeElement !== hwDiskBtn && currentView !== 'dossier') {
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
    lastTriggerSource = 'disk';
    preDossierView = currentView === 'standby' ? 'standby' : 'menu';
    lastTriggerAppId = 'sandbox';
    closeFloppyTray(true);
    renderDossier('sandbox');
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
  announce(`Preference cleared. Automatic display mode selected: ${nextAuto === '3d' ? '3D workstation' : 'Pixel 2D workstation'}.`);
});

// Internal OS reduced-motion & pointer/viewport adaptation
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
let vpDebounceTimer = null;

function syncAppViewportHeight(force = false) {
  const { w, h } = readViewportMetrics();
  const dW = Math.abs(w - lastAppliedVpW);
  const dH = Math.abs(h - lastAppliedVpH);
  if (!force && dW < 3 && dH < 3) return;
  lastAppliedVpW = w;
  lastAppliedVpH = h;
  document.documentElement.style.setProperty('--app-height', `${h}px`);
  if (window.scrollY !== 0 || window.scrollX !== 0) {
    window.scrollTo(0, 0);
  }
  if (!storedManualMode) {
    const autoMode = resolveDisplayMode();
    if (autoMode !== displayMode) {
      applyDisplayMode(autoMode, { manual: false, announceChange: false, immediate: true });
      return;
    }
  }
  if (displayMode === '3d' && webglScene) {
    webglScene.setQuality(resolve3dQualityTier());
    webglScene.resizeViewport(w, h);
  }
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
    if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
  }, { passive: true });
}

document.addEventListener('visibilitychange', () => {
  if (displayMode === '2d') {
    if (document.hidden) stopPixel2dLoop('hidden (0 FPS)');
    else startOrResumePixel2dLoop();
  }
});

['pointerdown', 'pointermove', 'keydown', 'focusin'].forEach((evName) => {
  window.addEventListener(evName, recordUserActivity, { passive: true });
});

// ---- Initialize Prototype ----
syncAppViewportHeight(true);
applyMotionPreference();
applyNoWebglUI();
renderStandby(false);
applyDisplayMode(resolveDisplayMode(), { manual: false, announceChange: false, immediate: true });
