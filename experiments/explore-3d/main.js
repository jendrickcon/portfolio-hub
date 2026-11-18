import { PixelEnvironment } from './pixel-env.js';

const params = new URLSearchParams(window.location.search);
const DEBUG_MODE = params.get('debug') === '1';
const INITIAL_NO_WEBGL = params.get('nowebgl') === '1';
const INITIAL_PIXEL_MODE = ['smooth', 'quantized', 'lowres75', 'lowres50'].includes(params.get('pixel3d'))
  ? params.get('pixel3d')
  : 'smooth';

const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;

let reducedMotion = Boolean(motionQuery && motionQuery.matches);
let manualMotionOverride = false;
let manualQuality = 'auto';
let pixelMode = INITIAL_PIXEL_MODE;
let simulatedNoWebgl = INITIAL_NO_WEBGL;
let webglScene = null;
let webglStatusText = 'inactive';

const pixelEnv = new PixelEnvironment();
const staticBgEl = document.getElementById('static-pixel-bg');
staticBgEl.style.backgroundImage = `url("${pixelEnv.getSnapshotDataUrl()}")`;

const canvasEl = document.getElementById('crt-scene-canvas');
const chassisEl = document.getElementById('crt-chassis');
const overlayEl = chassisEl.querySelector('.screen-overlay');
const screenContentEl = document.getElementById('screen-content');
const srStatusEl = document.getElementById('sr-status');
const perfHudEl = document.getElementById('perf-hud');

const motionBtn = document.getElementById('toggle-motion-btn');
const qualitySelect = document.getElementById('quality-select');
const debugControlsEl = document.getElementById('debug-controls');
const pixelModeSelect = document.getElementById('pixel-mode-select');
const webglBtn = document.getElementById('toggle-webgl-btn');

const hwDiskBtn = document.getElementById('hw-disk-btn');
const hwPowerBtn = document.getElementById('hw-power-btn');

if (DEBUG_MODE) {
  debugControlsEl.hidden = false;
  perfHudEl.hidden = false;
}
pixelModeSelect.value = pixelMode;

// Final six visible catalog slots (DevPath occupies slot 06; Sandbox moves to hidden floppy bay)
const CATALOG_SLOTS = [
  {
    index: '01',
    id: 'professional',
    name: 'Professional Portfolio',
    status: 'LIVE',
    category: 'Placeholder — Primary Hiring Portfolio (/ in production)',
    summary: 'Demonstrates cyan LIVE bounce-light tint and accessible tile action without navigating away from the isolated prototype.',
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
    summary: 'Demonstrates inline catalog presentation and keyboard geometry traversal inside the 3D aperture.',
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
    summary: 'Placeholder sample card confirming readable 1:1 DOM text and keyboard focus restoration.',
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
  summary: 'Loaded from the lower-bezel 3.5" floppy bay (UNKNOWN DISK DETECTED). In this isolated prototype, launching /sandbox/ is simulated safely inside this preview dossier.',
  devStatus: 'HIDDEN FLOPPY PREVIEW — EXTERNAL ROUTE DISABLED IN PROTOTYPE',
};

let currentView = 'standby'; // 'standby' | 'boot' | 'menu' | 'dossier' | 'restarting'
let preDossierView = 'menu';
let lastTriggerAppId = null;
let lastTriggerSource = 'catalog'; // 'catalog' | 'disk'
let activeTimers = [];
let bootDone = false;
let isRestarting = false;

// Floppy bay state machine
let drivePhase = 'closed'; // 'closed' | 'intent' | 'opening' | 'open'
let driveIntentTimer = null;
let driveOpenTimer = null;
let driveLeaveTimer = null;
let driveLatched = false;
let lastDiskPointerType = 'mouse';

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

function isCompactViewport() {
  return window.innerWidth <= 639 || window.innerHeight <= 560;
}

function resolveEffectiveQuality() {
  if (simulatedNoWebgl || webglStatusText.startsWith('failed')) return 'low';
  if (reducedMotion || isCompactViewport()) return 'low';
  if (manualQuality !== 'auto') return manualQuality;
  return 'high';
}

function syncFloppyDomAndScene() {
  hwDiskBtn.dataset.driveState = drivePhase;
  const isExpanded = drivePhase === 'opening' || drivePhase === 'open';
  hwDiskBtn.setAttribute('aria-expanded', String(isExpanded));

  if (webglScene) {
    const progress = drivePhase === 'opening' || drivePhase === 'open' ? 1 : 0;
    const led = drivePhase === 'open' || drivePhase === 'opening'
      ? 'open'
      : drivePhase === 'intent'
        ? 'intent'
        : 'idle';
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
    syncFloppyDomAndScene();
  }
}

function openFloppyTrayFromHover() {
  clearFloppyTimers();
  drivePhase = 'intent';
  syncFloppyDomAndScene();

  driveIntentTimer = setTimeout(() => {
    driveIntentTimer = null;
    const immediate = reducedMotion || resolveEffectiveQuality() === 'low';
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
      }, 1250);
    }
  }, 600);
}

function openFloppyTrayLatched() {
  clearFloppyTimers();
  driveLatched = true;
  const immediate = reducedMotion || resolveEffectiveQuality() === 'low';
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
    }, 1250);
  }
}

function applyMotionUI() {
  document.body.classList.toggle('reduce-motion', reducedMotion);
  motionBtn.setAttribute('aria-pressed', String(reducedMotion));
  motionBtn.textContent = `REDUCE MOTION: ${reducedMotion ? 'ON' : 'OFF'}`;
  if (webglScene) webglScene.setReducedMotion(reducedMotion);
}

function applyNoWebglUI() {
  if (!webglBtn) return;
  webglBtn.setAttribute('aria-pressed', String(simulatedNoWebgl));
  webglBtn.textContent = `SIMULATE NO-WEBGL: ${simulatedNoWebgl ? 'ON' : 'OFF'}`;
}

function updateQualityAndFallback() {
  const eff = resolveEffectiveQuality();
  const useCssFallback = eff === 'low' || !webglScene;
  document.body.classList.toggle('crt-fallback-css', useCssFallback);

  if (webglScene) {
    webglScene.setQuality(eff);
  }
  canvasEl.setAttribute('data-active', useCssFallback ? 'false' : 'true');

  renderDebugHud(webglScene ? webglScene.getMetrics() : {
    fps: 0,
    avgFrameMs: 0,
    maxFrameMs: 0,
    drawCalls: 0,
    triangles: 0,
    dpr: 1,
    renderScale: 1,
    pixelMode,
    cameraPose: currentView === 'boot' ? 'boot' : currentView === 'standby' ? 'standby' : 'menu',
    pixelTickMs: +pixelEnv.lastTickMs.toFixed(2),
    pixelUploadsPerSec: 0,
    loopState: 'css-fallback (0 FPS)',
  });
}

function renderDebugHud(m) {
  const eff = resolveEffectiveQuality();
  window.__explore3dMetrics = {
    effectiveQuality: eff,
    manualQuality,
    webglStatus: webglStatusText,
    reducedMotion,
    currentView,
    drivePhase,
    ...m,
  };
  if (!DEBUG_MODE || perfHudEl.hidden) return;
  perfHudEl.innerHTML = [
    `<div><strong>TIER:</strong> ${eff.toUpperCase()} (${manualQuality}) | <strong>CAM:</strong> ${m.cameraPose || currentView}</div>`,
    `<div><strong>FPS:</strong> ${m.fps} | <strong>LOOP:</strong> ${m.loopState}</div>`,
    `<div><strong>FRAME:</strong> avg ${m.avgFrameMs}ms / max ${m.maxFrameMs}ms</div>`,
    `<div><strong>GPU:</strong> ${m.drawCalls} calls | ${m.triangles} tris | DPR ${m.dpr} (${m.renderScale || 1}x)</div>`,
    `<div><strong>3D STYLE:</strong> ${m.pixelMode || pixelMode} | <strong>DISK:</strong> ${drivePhase}</div>`,
    `<div><strong>PIXEL 320×180:</strong> ${m.pixelTickMs}ms | ${m.pixelUploadsPerSec} up/s</div>`,
    `<div><strong>WEBGL:</strong> ${webglStatusText}</div>`,
  ].join('');
}

async function ensureWebGL() {
  if (webglScene || simulatedNoWebgl || resolveEffectiveQuality() === 'low') {
    if (simulatedNoWebgl) webglStatusText = 'simulated-off (css-fallback)';
    updateQualityAndFallback();
    return;
  }

  try {
    const mod = await import('./crt-scene.js');
    webglScene = await mod.createCrtScene({
      canvas: canvasEl,
      overlayContainer: chassisEl,
      pixelEnv,
      initialQuality: resolveEffectiveQuality(),
      initialPixelMode: pixelMode,
      reducedMotion,
      onFatalFallback(reason) {
        webglStatusText = 'failed: ' + reason;
        updateQualityAndFallback();
      },
    });
    webglStatusText = 'active (three r170)';
    webglScene.setCallbacks({
      autoDowngrade(nextQ, avgMs) {
        if (manualQuality === 'auto') {
          webglStatusText = `active (auto -> ${nextQ}, ${avgMs.toFixed(1)}ms)`;
          webglScene.setQuality(nextQ);
          updateQualityAndFallback();
        }
      },
      metricsCb: renderDebugHud,
    });

    if (currentView === 'boot') {
      webglScene.setCameraState('boot', 0);
      webglScene.setScreenState('menu');
    } else if (currentView === 'menu' || currentView === 'dossier') {
      webglScene.setCameraState('menu', 0);
      webglScene.setScreenState('menu');
    } else {
      webglScene.setCameraState('standby', 0);
      webglScene.setScreenState('standby');
    }
    syncFloppyDomAndScene();
    updateQualityAndFallback();
  } catch (err) {
    webglStatusText = 'failed: ' + (err?.message || 'load error');
    webglScene = null;
    updateQualityAndFallback();
  }
}

// ---- Screen States (Layer 3) ----
function renderStandby(restoreFocus = false) {
  clearActiveTimers();
  currentView = 'standby';
  isRestarting = false;
  hwPowerBtn.disabled = false;
  document.body.classList.remove('is-powered', 'is-restarting');
  overlayEl.classList.remove('is-collapsing');

  if (webglScene) {
    webglScene.setCameraState('standby');
    webglScene.setScreenState('standby');
  }

  screenContentEl.innerHTML = `
    <div class="standby-view">
      <p class="standby-label">STANDBY · WORKSTATION READY</p>
      <button type="button" id="start-explore-btn" class="start-btn">START EXPLORE ▸</button>
    </div>
  `;
  const startBtn = document.getElementById('start-explore-btn');
  startBtn.addEventListener('click', startWorkstation);
  if (restoreFocus) {
    focusSafely(startBtn);
  }
  updateQualityAndFallback();
}

function startWorkstation() {
  if (isRestarting) return;
  closeFloppyTray(true);
  document.body.classList.add('is-powered');
  if (webglScene) {
    webglScene.setCameraState('boot');
    webglScene.setScreenState('menu');
  }
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
  const logEl = document.getElementById('boot-log');
  const skipBtn = document.getElementById('boot-skip-btn');

  const finishBoot = () => {
    bootDone = true;
    skipBtn.textContent = 'CONTINUE ▸';
    skipBtn.setAttribute('aria-label', 'Continue to sample catalog menu');
    announce('Workstation ready. Activate Continue to open catalog.');
  };

  if (reducedMotion || resolveEffectiveQuality() === 'low') {
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
  updateQualityAndFallback();
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
  if (webglScene) {
    webglScene.setCameraState('menu');
    webglScene.setScreenState('menu');
  }

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

  const menuEl = document.getElementById('app-menu');
  const items = Array.from(menuEl.querySelectorAll('.app-tile'));

  items.forEach((btn) => {
    const id = btn.dataset.appId;
    const status = btn.dataset.status;

    const hintLight = () => {
      if (!webglScene) return;
      if (status === 'live') webglScene.setScreenState('live');
      else if (status === 'paused') webglScene.setScreenState('paused');
      else webglScene.setScreenState('menu');
    };
    const resetLight = () => {
      if (webglScene && currentView === 'menu') webglScene.setScreenState('menu');
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
  updateQualityAndFallback();
}

function renderDossier(appId) {
  currentView = 'dossier';
  const entry = appId === 'sandbox'
    ? SANDBOX_SLOT
    : CATALOG_SLOTS.find((a) => a.id === appId) || CATALOG_SLOTS[0];

  if (webglScene) {
    if (entry.status === 'LIVE' || entry.id === 'sandbox') webglScene.setScreenState('live');
    else if (entry.id === 'devpath') webglScene.setScreenState('paused');
    else webglScene.setScreenState('menu');
  }

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
  updateQualityAndFallback();
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
  const rLogEl = document.getElementById('restart-log');

  if (webglScene) {
    webglScene.setScreenState('paused');
  }

  if (reducedMotion || resolveEffectiveQuality() === 'low') {
    rLogEl.textContent = restartLines.join('\n');
    if (webglScene) webglScene.setCameraState('standby', 0);
    scheduleTimer(() => {
      renderStandby(true);
    }, 420);
  } else {
    rLogEl.textContent = restartLines[0];
    scheduleTimer(() => {
      if (webglScene) webglScene.setCameraState('standby', 850);
    }, 60);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[1]; }, 340);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[2]; }, 680);
    scheduleTimer(() => { rLogEl.textContent += '\n' + restartLines[3]; }, 1040);
    scheduleTimer(() => {
      if (webglScene) webglScene.setScreenState('off');
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
  updateQualityAndFallback();
}

// ---- Physical Hardware Button Bindings (Layer 3 Projected Controls) ----
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
  if (driveLatched || document.activeElement === hwDiskBtn) {
    if (drivePhase === 'intent') {
      drivePhase = 'intent';
      syncFloppyDomAndScene();
    }
    return;
  }
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

// ---- Global Header Controls ----
motionBtn.addEventListener('click', () => {
  manualMotionOverride = true;
  reducedMotion = !reducedMotion;
  applyMotionUI();
  updateQualityAndFallback();
  if (!reducedMotion) ensureWebGL();
});

qualitySelect.addEventListener('change', () => {
  manualQuality = qualitySelect.value;
  if (manualQuality === 'low') {
    updateQualityAndFallback();
  } else {
    ensureWebGL().then(updateQualityAndFallback);
  }
});

pixelModeSelect.addEventListener('change', () => {
  pixelMode = pixelModeSelect.value;
  if (webglScene) webglScene.setPixelMode(pixelMode);
  updateQualityAndFallback();
});

webglBtn.addEventListener('click', () => {
  simulatedNoWebgl = !simulatedNoWebgl;
  applyNoWebglUI();
  if (simulatedNoWebgl) {
    webglStatusText = 'simulated-off (css-fallback)';
    updateQualityAndFallback();
  } else {
    webglStatusText = webglScene ? 'active (three r170)' : 'initializing';
    ensureWebGL().then(updateQualityAndFallback);
  }
});

if (motionQuery && typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', (e) => {
    if (!manualMotionOverride) {
      reducedMotion = e.matches;
      applyMotionUI();
      updateQualityAndFallback();
      if (!reducedMotion) ensureWebGL();
    }
  });
}

window.addEventListener('resize', () => {
  updateQualityAndFallback();
  if (!isCompactViewport() && !simulatedNoWebgl && !reducedMotion && manualQuality !== 'low') {
    ensureWebGL();
  }
}, { passive: true });

applyMotionUI();
applyNoWebglUI();
renderStandby(false);
ensureWebGL();
