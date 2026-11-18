import { PixelEnvironment } from './pixel-env.js';

const params = new URLSearchParams(window.location.search);
const DEBUG_MODE = params.get('debug') === '1';
const INITIAL_NO_WEBGL = params.get('nowebgl') === '1';

const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;

let reducedMotion = Boolean(motionQuery && motionQuery.matches);
let manualMotionOverride = false;
let manualQuality = 'auto';
let simulatedNoWebgl = INITIAL_NO_WEBGL;
let webglScene = null;
let webglStatusText = 'inactive';

const pixelEnv = new PixelEnvironment();
const staticBgEl = document.getElementById('static-pixel-bg');
staticBgEl.style.backgroundImage = `url("${pixelEnv.getSnapshotDataUrl()}")`;

const canvasEl = document.getElementById('crt-scene-canvas');
const chassisEl = document.getElementById('crt-chassis');
const screenContentEl = document.getElementById('screen-content');
const srStatusEl = document.getElementById('sr-status');
const perfHudEl = document.getElementById('perf-hud');

const powerBtn = document.getElementById('toggle-power-btn');
const motionBtn = document.getElementById('toggle-motion-btn');
const qualitySelect = document.getElementById('quality-select');
const webglBtn = document.getElementById('toggle-webgl-btn');

if (DEBUG_MODE) {
  perfHudEl.hidden = false;
}

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
    summary: 'Placeholder sample card confirming readable `1:1` DOM text and keyboard focus restoration.',
  },
  {
    index: '06',
    id: 'sandbox',
    name: 'Sandbox',
    status: 'READY',
    category: 'Placeholder — Cellular Automata Experiment',
    summary: 'Placeholder sample card verifying 3×2 desktop and 2×3 / 1×6 responsive grid reflow.',
  },
];

const DEVPATH_SLOT = {
  id: 'devpath',
  name: 'DevPath',
  status: 'PAUSED PROTOTYPE',
  category: 'Architecture & Decision-Graph Prototype (Paused)',
  summary: 'Separate paused entry demonstrating amber workstation illumination and accessible non-color status badges. Broader domains remain intentionally paused.',
  devStatus: 'PAUSED PROTOTYPE — SAMPLE DOSSIER VIEW',
};

let currentView = 'standby'; // 'standby' | 'boot' | 'menu' | 'dossier'
let lastTriggerAppId = null;
let bootTimers = [];
let bootDone = false;

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

function applyMotionUI() {
  document.body.classList.toggle('reduce-motion', reducedMotion);
  motionBtn.setAttribute('aria-pressed', String(reducedMotion));
  motionBtn.textContent = `REDUCE MOTION: ${reducedMotion ? 'ON' : 'OFF'}`;
  if (webglScene) webglScene.setReducedMotion(reducedMotion);
}

function applyNoWebglUI() {
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
  if (useCssFallback) {
    canvasEl.setAttribute('data-active', 'false');
  } else {
    canvasEl.setAttribute('data-active', 'true');
  }

  renderDebugHud(webglScene ? webglScene.getMetrics() : {
    fps: 0, avgFrameMs: 0, maxFrameMs: 0, drawCalls: 0, triangles: 0, dpr: 1, pixelTickMs: +pixelEnv.lastTickMs.toFixed(2), pixelUploadsPerSec: 0, loopState: 'css-fallback (0 FPS)'
  });
}

function renderDebugHud(m) {
  const eff = resolveEffectiveQuality();
  const payload = {
    effectiveQuality: eff,
    manualQuality,
    webglStatus: webglStatusText,
    reducedMotion,
    ...m,
  };
  window.__explore3dMetrics = payload;
  if (!DEBUG_MODE || perfHudEl.hidden) return;
  perfHudEl.innerHTML = [
    `<div><strong>TIER:</strong> ${eff.toUpperCase()} (${manualQuality})</div>`,
    `<div><strong>FPS:</strong> ${m.fps} | <strong>LOOP:</strong> ${m.loopState}</div>`,
    `<div><strong>FRAME:</strong> avg ${m.avgFrameMs}ms / max ${m.maxFrameMs}ms</div>`,
    `<div><strong>GPU:</strong> ${m.drawCalls} calls | ${m.triangles} tris | DPR ${m.dpr}</div>`,
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
      reducedMotion,
      coarsePointer: Boolean(coarseQuery && coarseQuery.matches),
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
    if (currentView !== 'standby') {
      webglScene.setPoweredView(true);
      webglScene.setScreenState(currentView === 'dossier' ? 'menu' : 'menu');
    }
    updateQualityAndFallback();
  } catch (err) {
    webglStatusText = 'failed: ' + (err?.message || 'load error');
    webglScene = null;
    updateQualityAndFallback();
  }
}

// ---- Prototype Screen States (Layer 3) ----
function renderStandby(restoreFocus = false) {
  clearBootTimers();
  currentView = 'standby';
  document.body.classList.remove('is-powered');
  powerBtn.setAttribute('aria-pressed', 'false');
  powerBtn.textContent = 'POWER: OFF';
  if (webglScene) {
    webglScene.setPoweredView(false);
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
    announce('Workstation powered off.');
  }
}

function clearBootTimers() {
  bootTimers.forEach(clearTimeout);
  bootTimers = [];
}

function startWorkstation() {
  document.body.classList.add('is-powered');
  powerBtn.setAttribute('aria-pressed', 'true');
  powerBtn.textContent = 'POWER: ON';
  if (webglScene) {
    webglScene.setPoweredView(true);
    webglScene.setScreenState('menu');
  }
  renderBoot();
}

function renderBoot() {
  currentView = 'boot';
  bootDone = false;
  const lines = [
    'ENUHRI WORKSTATION BIOS r1.0',
    'CHECKING CRT APERTURE SYNC .... OK',
    'LOADING 320x180 ENVIRONMENT ... OK',
    'INDEXING 6 CATALOG SLOTS ...... READY',
    'DEVPATH MODULE STATUS ......... PAUSED',
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
      bootTimers.push(setTimeout(() => {
        logEl.textContent += (idx ? '\n' : '') + line;
      }, d));
    });
    bootTimers.push(setTimeout(finishBoot, d + 200));
  }

  skipBtn.addEventListener('click', () => {
    if (!bootDone) {
      clearBootTimers();
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
      renderStandby(true);
    }
  });

  focusSafely(skipBtn);
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
  clearBootTimers();
  currentView = 'menu';
  if (webglScene) webglScene.setScreenState('menu');

  screenContentEl.innerHTML = `
    <div id="app-menu" class="app-menu">
      <h2 class="app-menu-header" tabindex="-1">SAMPLE CATALOG (PROTOTYPE)</h2>
      <nav class="app-nav" aria-label="Prototype applications">
        <ul class="app-grid">
          ${CATALOG_SLOTS.map((app) => `
            <li class="app-grid-item">
              <button type="button" class="app-tile" data-app-id="${app.id}" data-status="${app.status.toLowerCase()}" aria-label="${app.name}, ${app.status}">
                <span class="app-index" aria-hidden="true">${app.index}</span>
                <span class="app-name">${app.name}</span>
                <span class="app-status" aria-hidden="true">${app.status}</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </nav>
      <section class="app-secondary-bar" aria-label="Paused Prototype">
        <button type="button" class="app-secondary-entry" data-app-id="devpath" data-status="paused" aria-label="DevPath, Paused prototype, inspect sample">
          <span class="app-secondary-name">DevPath</span>
          <span class="app-secondary-status" aria-hidden="true">PAUSED PROTOTYPE</span>
        </button>
      </section>
    </div>
  `;

  const menuEl = document.getElementById('app-menu');
  const items = Array.from(menuEl.querySelectorAll('.app-tile, .app-secondary-entry'));

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
      lastTriggerAppId = id;
      renderDossier(id);
    });
  });

  menuEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      renderStandby(true);
      return;
    }
    const idx = items.indexOf(document.activeElement);
    if (idx === -1) return;

    const gridItems = items.slice(0, CATALOG_SLOTS.length);
    const secIdx = CATALOG_SLOTS.length;

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
      const rows = getGridRows(gridItems);
      const isDown = event.key === 'ArrowDown';
      if (idx === secIdx) {
        next = isDown ? 0 : (rows[rows.length - 1]?.cells[0].idx ?? secIdx - 1);
      } else {
        const curRect = items[idx].getBoundingClientRect();
        const cx = curRect.left + curRect.width / 2;
        const rIdx = rows.findIndex((r) => r.cells.some((c) => c.idx === idx));
        if (rIdx !== -1) {
          if (isDown) {
            if (rIdx < rows.length - 1) {
              next = rows[rIdx + 1].cells.reduce((a, b) => (Math.abs(b.cx - cx) < Math.abs(a.cx - cx) ? b : a)).idx;
            } else {
              next = secIdx;
            }
          } else if (rIdx > 0) {
            next = rows[rIdx - 1].cells.reduce((a, b) => (Math.abs(b.cx - cx) < Math.abs(a.cx - cx) ? b : a)).idx;
          } else {
            next = secIdx;
          }
        }
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
}

function renderDossier(appId) {
  currentView = 'dossier';
  const entry = appId === 'devpath' ? DEVPATH_SLOT : CATALOG_SLOTS.find((a) => a.id === appId) || CATALOG_SLOTS[1];
  if (webglScene) {
    if (entry.status === 'LIVE') webglScene.setScreenState('live');
    else if (entry.id === 'devpath') webglScene.setScreenState('paused');
    else webglScene.setScreenState('menu');
  }

  screenContentEl.innerHTML = `
    <article id="dossier-view" class="dossier-view" aria-labelledby="dossier-title">
      <div class="dossier-head">
        <h2 id="dossier-title" class="dossier-title" tabindex="-1">${entry.name.toUpperCase()}</h2>
        <button type="button" id="dossier-close-btn" class="dossier-close-btn" aria-label="Close ${entry.name} dossier and return to catalog">✕</button>
      </div>
      <p class="dossier-meta">${entry.category}</p>
      <p class="dossier-body">${entry.summary}</p>
      <p class="dossier-status">Status: ${entry.devStatus || entry.status}</p>
      <p class="dossier-demo-note">Prototype demonstration only — external production navigation is disabled.</p>
      <div class="dossier-footer">
        <button type="button" id="dossier-return-btn" class="dossier-return-btn">◂ RETURN TO CATALOG</button>
      </div>
    </article>
  `;

  const backToMenu = () => {
    renderMenu({ shouldFocus: true, focusAppId: lastTriggerAppId });
    announce('Returned to catalog menu.');
  };

  document.getElementById('dossier-close-btn').addEventListener('click', backToMenu);
  document.getElementById('dossier-return-btn').addEventListener('click', backToMenu);
  document.getElementById('dossier-view').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      backToMenu();
    }
  });

  focusSafely(document.getElementById('dossier-title'));
  announce(`${entry.name} sample dossier opened.`);
}

// ---- Global Prototype Bindings ----
powerBtn.addEventListener('click', () => renderStandby(true));

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
