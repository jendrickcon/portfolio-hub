/* ===================================================
   ENUHRI PORTFOLIO HUB — script.js
   Stage 1: landing screen.
   Stage 2: CRT zoom transition + boot sequence.
   Stage 3: 6-slot application catalog + paused DevPath entry.
=================================================== */

// Automatically strip 'index.html' from browser address bar
if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('index.html')) {
  const cleanPath = (window.location.pathname.replace(/\/index\.html$/, '/') || '/') + window.location.search + window.location.hash;
  window.history.replaceState(null, '', cleanPath);
}

const playBtn = document.getElementById('play-btn');
const screenContent = document.getElementById('screen-content');
const screenOverlay = document.querySelector('.screen-overlay');
const powerButtonHotspot = document.getElementById('power-button-hotspot');
const srStatus = document.getElementById('sr-status');

const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let reducedMotion = Boolean(motionQuery && motionQuery.matches);
let manualMotionOverride = false;
let scanlinesEnabled = true;

function isReducedMotion() {
  return reducedMotion;
}

function announceStatus(message) {
  if (!srStatus) return;
  srStatus.textContent = '';
  window.requestAnimationFrame(() => {
    srStatus.textContent = message;
  });
}

// ---- Display settings bar (Stage 5) ----
const powerBtn = document.getElementById('toggle-power-btn');
const scanlinesBtn = document.getElementById('toggle-scanlines-btn');
const motionBtn = document.getElementById('toggle-motion-btn');

function applyMotionState(isReduced) {
  reducedMotion = Boolean(isReduced);
  document.body.classList.toggle('reduce-motion', reducedMotion);
  motionBtn.setAttribute('aria-pressed', String(reducedMotion));
  motionBtn.textContent = `REDUCE MOTION: ${reducedMotion ? 'ON' : 'OFF'}`;
}

applyMotionState(reducedMotion);

if (motionQuery && typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', (event) => {
    if (!manualMotionOverride) {
      applyMotionState(event.matches);
    }
  });
}

function setPowerState(isOn) {
  if (!powerBtn) return;
  powerBtn.setAttribute('aria-pressed', String(isOn));
  powerBtn.textContent = `POWER: ${isOn ? 'ON' : 'OFF'}`;
}

if (powerBtn) {
  powerBtn.addEventListener('click', () => {
    resetToLanding();
  });
}

scanlinesBtn.addEventListener('click', () => {
  scanlinesEnabled = !scanlinesEnabled;
  document.body.classList.toggle('scanlines-off', !scanlinesEnabled);
  scanlinesBtn.setAttribute('aria-pressed', String(scanlinesEnabled));
  scanlinesBtn.textContent = `SCANLINES: ${scanlinesEnabled ? 'ON' : 'OFF'}`;
});

motionBtn.addEventListener('click', () => {
  manualMotionOverride = true;
  applyMotionState(!reducedMotion);
});

// Captured once, before any interaction, so Escape can restore the
// exact original landing markup (including the PLAY button).
const LANDING_CONTENT_HTML = screenContent.innerHTML;

// Editable app data — six primary catalog entries + separate DevPath paused prototype.
const APPS = [
  {
    index: '01',
    id: 'professional',
    name: 'Professional Portfolio',
    icon: '💼',
    status: 'LIVE',
    category: 'Primary Hiring-Facing Portfolio',
    tagline: 'Evidence-Backed Case Studies, Public Résumé & System Reconstructions',
    description: 'The canonical hiring-facing portfolio served at /, presenting UDM-RADAR, StudyQuest, Mini PCS, supporting media, project-linked capabilities, and a phone-free public résumé.',
    features: [
      'Interactive Light/Dark reconstructions for UDM-RADAR, StudyQuest, and Mini PCS',
      'Project-linked Toolkit and interactive capability evidence cards',
      'Same-page public résumé viewer with direct PDF download',
      'Supporting project media lightbox and career timeline',
    ],
    technologies: ['HTML5', 'CSS3', 'Vanilla JavaScript', 'SVG', 'Responsive Layout'],
    devStatus: 'LIVE — Primary Portfolio at /',
    image: null,
    link: '/',
  },
  {
    index: '02',
    id: 'udm-radar',
    name: 'UDM-RADAR',
    icon: '📡',
    status: 'READY',
    category: 'Academic Analytics & Decision-Support System (Capstone)',
    tagline: 'Advisory Risk Analytics and GWA Projection on Synthetic Records',
    description: 'A four-member BSIT capstone prototype for the College of Computing Studies at Universidad de Manila. Uses synthetic academic data for privacy; Decision Tree Regressor GWA projections remain advisory to support faculty and student review rather than making autonomous academic decisions.',
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
    icon: '📚',
    status: 'READY',
    category: 'AI-Assisted Gamified Learning Platform',
    tagline: 'Turn Syllabi Into Structured Courses and Assessments',
    description: 'An AI-assisted team learning platform that transforms uploaded syllabi, modules, and reviewers into structured chapter reviews, mixed assessments, and progression tracks using Gemini API integration with Pydantic-validated structured output.',
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
    icon: '🎨',
    status: 'READY',
    category: 'Interactive Virtual Museum',
    tagline: 'Classical Architecture & Community Artwork Exhibition',
    description: 'An interactive virtual museum where visitors explore neoclassical halls, inspect procedural and community artworks with plaques, and submit creations from the integrated studio.',
    features: [
      'Neoclassical Entrance Hall & Gallery Hall exploration',
      'Artist Studio with canvas drawing, brush size, and color palette controls',
      'Horizontal exploration with mouse drag, touch swipe, and arrow key navigation',
      'Interactive artwork inspection modal with plaques and metadata',
      'Firebase Authentication & Cloud Firestore exhibition support',
    ],
    technologies: ['HTML5 Canvas', 'CSS3', 'JavaScript', 'Firebase Auth', 'Cloud Firestore'],
    devStatus: 'FUNCTIONAL / LIVE ON /art-gallery/',
    image: null,
    link: '/art-gallery/',
  },
  {
    index: '05',
    id: 'cyberdefender',
    name: 'CyberDefender',
    icon: '🛡',
    status: 'READY',
    category: 'Cybersecurity Tactical Simulation (Web Reimagining)',
    tagline: 'Gamified Threat Neutralization & Incident Response',
    description: 'Originally prototyped in Godot 4 as a mobile cybersecurity simulation, CyberDefender has been reimagined and rebuilt as a native HTML/web tactical adventure where players practice threat recognition, defensive scripting, and incident response.',
    features: [
      'Turn-based incident response combat (EXECUTE, KNOWLEDGE, PATCHES, RUN)',
      'Core malware archetypes: Adware, Spyware, Trojans, Rootkits, and Ransomware',
      'Progressive 3-Tier Difficulty Modes:',
      '• Beginner (PCB Sector): Hardware layer navigation & threat memorization',
      '• Intermediate (Hazard Zone): Quarantined networks, blast doors & stealth enemies',
      '• Advanced (System Overload): Hardcore incident analysis with 1.35x damage multiplier',
      'Offline Unix timestamp-based resource cooldowns and daily retention penalties',
      'Dynamic rank progression from "SCRIPT KIDDIE" to "INCIDENT COMMANDER" with badge system',
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
    id: 'sandbox',
    name: 'Sandbox',
    icon: '🧪',
    status: 'READY',
    category: 'Falling-Sand & Cellular Automata Simulation',
    tagline: 'Interactive Element Physics, Alchemy Combinations & Presets',
    description: 'An interactive falling-sand and cellular-automata simulation featuring physical, organic, digital, and cosmic elements, card-drop combination discoveries, autonomous lifeforms, and starter world presets.',
    features: [
      'Real-time cellular-automata particle simulation on HTML5 Canvas',
      'Drag-and-drop element card interactions with tiered discovery log',
      'Autonomous creatures, cosmic phenomena, and digital Void/Code behaviors',
      'Preset worlds and direct return navigation back to the Explore Hub',
    ],
    technologies: ['HTML5 Canvas', 'CSS3', 'JavaScript (ES6+)'],
    devStatus: 'LIVE EXPERIMENT — /sandbox/',
    image: null,
    link: '/sandbox/',
  },
];

const DEVPATH_APP = {
  id: 'devpath',
  name: 'DevPath',
  icon: '🧭',
  status: 'PAUSED PROTOTYPE',
  category: 'Architecture & Decision-Graph Prototype (Paused)',
  tagline: 'Graph-First Project Architecture Explorer',
  description: 'An experimental decision-graph prototype that maps project goals and constraints to candidate technical stacks and architecture trade-offs. Development is currently paused: the Game Architecture branch is interactive, while Software & Systems and Website & Web App domains remain incomplete.',
  features: [
    'Interactive Game Architecture decision graph with constraint filtering',
    'Dual Blueprint / Root visual themes and live architecture breadcrumb trail',
    'Validated JSON graph schema and standalone Node.js engine test checks',
    'Development intentionally paused while broader non-game domains remain incomplete',
  ],
  technologies: ['HTML5', 'CSS3', 'Vanilla ES Modules', 'SVG Graph', 'JSON Schema'],
  devStatus: 'PAUSED PROTOTYPE — GAME ARCHITECTURE AVAILABLE; BROADER DOMAINS INCOMPLETE',
  image: null,
  actions: [
    { label: 'OPEN PROTOTYPE (/devpath/) ▸', href: '/devpath/', primary: false, external: false },
  ],
};

const ALL_APPS = [...APPS, DEVPATH_APP];

const BOOT_LINES = [
  'ENUHRI SYSTEM v1.1',
  '',
  'Initializing system...',
  'Mounting canonical routes...',
  'Loading Professional Portfolio . OK',
  'Loading UDM-RADAR .............. OK',
  'Loading StudyQuest ............. OK',
  'Loading Enuhri Art Gallery ..... OK',
  'Loading CyberDefender .......... OK',
  'Loading Sandbox ................ OK',
  'Indexing DevPath prototype ..... PAUSED',
  '',
  '6 CATALOG APPS READY (+ DEVPATH PAUSED)',
  '',
  'SYSTEM READY.',
  '',
  'Press ENTER or click to continue...',
];

let bootTimeoutIds = [];
let bootComplete = false;
let zoomTimeoutId = null;
let lastTriggerAppId = null;
let currentViewKey = 'landing';

function focusSafely(el) {
  if (el && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

function triggerFlash() {
  if (isReducedMotion()) return;
  const flash = document.createElement('div');
  flash.className = 'crt-flash';
  screenOverlay.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());
}

function startZoomAndBoot() {
  clearTimeout(zoomTimeoutId);
  document.body.classList.remove('app-menu-active');
  document.body.classList.remove('project-view-active');
  document.body.classList.add('crt-zoomed');
  setPowerState(true);
  triggerFlash();

  const landingBody = screenContent.querySelector('.landing-screen-body');
  if (landingBody && !isReducedMotion()) {
    landingBody.style.transition = 'opacity 0.25s ease';
    landingBody.style.opacity = '0';
  }

  const zoomDuration = isReducedMotion() ? 0 : 900;
  if (zoomDuration === 0) {
    renderBootScreen();
  } else {
    zoomTimeoutId = setTimeout(renderBootScreen, zoomDuration);
  }
}

function renderBootScreen() {
  bootComplete = false;

  screenContent.innerHTML = `
    <div id="boot-sequence" class="boot-sequence">
      <div class="boot-lines-wrap" aria-hidden="true">
        <span id="boot-text"></span><span class="boot-cursor">▍</span>
      </div>
      <button id="boot-skip-btn" class="boot-skip-btn" type="button">SKIP ▸</button>
    </div>
  `;

  const bootSequenceEl = document.getElementById('boot-sequence');
  const bootTextEl = document.getElementById('boot-text');
  const skipBtn = document.getElementById('boot-skip-btn');

  if (isReducedMotion()) {
    bootTextEl.textContent = BOOT_LINES.join('\n');
    finishBoot(skipBtn);
  } else {
    announceStatus('System booting. Activate Skip to open applications.');
    typeBootLines(bootTextEl, skipBtn);
  }

  skipBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    handleBootAdvance(bootTextEl, skipBtn);
  });

  bootSequenceEl.addEventListener('click', () => {
    handleBootAdvance(bootTextEl, skipBtn);
  });

  bootSequenceEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      resetToLanding();
    }
  });

  focusSafely(skipBtn);
}

function handleBootAdvance(bootTextEl, skipBtn) {
  if (!bootComplete) {
    skipTyping(bootTextEl, skipBtn);
    focusSafely(skipBtn);
  } else {
    goToAppMenu({ updateHistory: true, immediate: true, shouldFocus: true });
  }
}

function typeBootLines(bootTextEl, skipBtn) {
  bootTimeoutIds.forEach(clearTimeout);
  bootTimeoutIds = [];
  bootTextEl.textContent = '';

  let delay = 0;
  BOOT_LINES.forEach((line, index) => {
    delay += line === '' ? 130 : 220;
    const id = setTimeout(() => {
      bootTextEl.textContent += (index === 0 ? '' : '\n') + line;
    }, delay);
    bootTimeoutIds.push(id);
  });

  const finishId = setTimeout(() => finishBoot(skipBtn), delay + 300);
  bootTimeoutIds.push(finishId);
}

function skipTyping(bootTextEl, skipBtn) {
  bootTimeoutIds.forEach(clearTimeout);
  bootTimeoutIds = [];
  bootTextEl.textContent = BOOT_LINES.join('\n');
  finishBoot(skipBtn);
}

function finishBoot(skipBtn) {
  bootComplete = true;
  if (skipBtn) {
    skipBtn.textContent = 'CONTINUE ▸';
    skipBtn.setAttribute('aria-label', 'Continue to application menu');
  }
  announceStatus('System ready. Activate Continue to open applications.');
}

const INLINE_APP_IDS = new Set(['udm-radar', 'studyquest', 'cyberdefender', 'devpath']);
let fadeTimeoutId = null;

function setUrlHash(targetHash, { replace = false } = {}) {
  const normalized = targetHash || '';
  if (!normalized) {
    if (window.location.hash) {
      window.history[replace ? 'replaceState' : 'pushState'](
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
    return;
  }
  if (window.location.hash !== normalized) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', normalized);
  }
}

function goToAppMenu({ updateHistory = true, immediate = false, shouldFocus = false, focusAppId = null } = {}) {
  if (updateHistory) setUrlHash('#menu');
  document.body.classList.add('crt-zoomed');
  setPowerState(true);
  if (immediate || isReducedMotion()) {
    clearTimeout(fadeTimeoutId);
    screenContent.classList.remove('screen-fade-out');
    renderAppMenu({ shouldFocus, focusAppId });
  } else {
    renderAppMenu({ shouldFocus, focusAppId });
  }
}

function renderAppMenu({ shouldFocus = false, focusAppId = null } = {}) {
  currentViewKey = 'menu';
  document.body.classList.remove('project-view-active');
  document.body.classList.add('app-menu-active');
  screenContent.innerHTML = `
    <div id="app-menu" class="app-menu">
      <h2 id="app-menu-heading" class="app-menu-header" tabindex="-1">ENUHRI SYSTEM v1.1</h2>
      <nav class="app-nav" aria-label="Explore applications">
        <ul class="app-grid">
          ${APPS.map((app) => {
            const isDirectLink = Boolean(app.link);
            const openTag = isDirectLink
              ? `<a href="${app.link}" class="app-tile" data-app-id="${app.id}" data-status="${app.status.toLowerCase()}" aria-label="${app.name}, ${app.status}">`
              : `<button type="button" class="app-tile" data-app-id="${app.id}" data-status="${app.status.toLowerCase()}" aria-label="${app.name}, ${app.status}">`;
            const closeTag = isDirectLink ? '</a>' : '</button>';
            return `
              <li class="app-grid-item">
                ${openTag}
                  <span class="app-index" aria-hidden="true">${app.index}</span>
                  <span class="app-tile-main">
                    <span class="app-icon" aria-hidden="true">${app.icon}</span>
                    <span class="app-name">${app.name}</span>
                  </span>
                  <span class="app-status" aria-hidden="true">${app.status}</span>
                ${closeTag}
              </li>
            `;
          }).join('')}
        </ul>
      </nav>
      <section class="app-secondary-bar" aria-label="Paused Prototype">
        <button type="button" class="app-secondary-entry"
                data-app-id="${DEVPATH_APP.id}"
                data-status="paused"
                aria-label="${DEVPATH_APP.name}, Paused prototype, inspect details">
          <span class="app-secondary-left">
            <span class="app-secondary-icon" aria-hidden="true">${DEVPATH_APP.icon}</span>
            <span class="app-secondary-name">${DEVPATH_APP.name}</span>
          </span>
          <span class="app-secondary-right">
            <span class="app-secondary-status" aria-hidden="true">${DEVPATH_APP.status}</span>
            <span class="app-secondary-cta" aria-hidden="true">INSPECT ▸</span>
          </span>
        </button>
      </section>
      <div class="app-menu-footer" aria-hidden="true">SELECT APPLICATION</div>
    </div>
  `;

  const menuEl = document.getElementById('app-menu');
  const menuItems = Array.from(menuEl.querySelectorAll('.app-tile, .app-secondary-entry'));

  menuItems.forEach((item) => {
    if (item.tagName === 'BUTTON') {
      item.addEventListener('click', () => {
        lastTriggerAppId = item.dataset.appId;
        selectApp(item.dataset.appId);
      });
    } else {
      item.addEventListener('click', () => {
        lastTriggerAppId = item.dataset.appId;
      });
    }
  });

  menuEl.addEventListener('keydown', (event) => handleMenuKeydown(event, menuItems));

  if (focusAppId) {
    const target = menuItems.find((el) => el.dataset.appId === focusAppId);
    focusSafely(target || menuItems[0]);
  } else if (shouldFocus) {
    focusSafely(menuItems[0]);
  }
}

function getGridRows(gridItems) {
  const rows = [];
  gridItems.forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    const cy = rect.top + rect.height / 2;
    const cx = rect.left + rect.width / 2;
    let row = rows.find((r) => Math.abs(r.cy - cy) < Math.max(12, rect.height * 0.45));
    if (!row) {
      row = { cy, cells: [] };
      rows.push(row);
    }
    row.cells.push({ idx, cx, cy });
  });
  rows.sort((a, b) => a.cy - b.cy);
  rows.forEach((r) => r.cells.sort((a, b) => a.cx - b.cx));
  return rows;
}

function handleMenuKeydown(event, menuItems) {
  if (event.key === 'Escape') {
    event.preventDefault();
    resetToLanding();
    return;
  }

  const currentIndex = menuItems.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  const gridCount = APPS.length;
  const gridItems = menuItems.slice(0, gridCount);
  const secondaryIndex = menuItems.length > gridCount ? gridCount : -1;

  if (event.key === 'Home') {
    event.preventDefault();
    focusSafely(menuItems[0]);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    focusSafely(menuItems[menuItems.length - 1]);
    return;
  }

  let nextIndex = null;
  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % menuItems.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const rows = getGridRows(gridItems);
    const isDown = event.key === 'ArrowDown';

    if (currentIndex === secondaryIndex) {
      if (isDown) {
        nextIndex = 0;
      } else {
        const lastRow = rows[rows.length - 1];
        nextIndex = lastRow ? lastRow.cells[0].idx : gridCount - 1;
      }
    } else if (rows.length > 0) {
      let rowIndex = -1;
      let colIndex = -1;
      let currentCx = 0;
      rows.forEach((row, rIdx) => {
        row.cells.forEach((cell, cIdx) => {
          if (cell.idx === currentIndex) {
            rowIndex = rIdx;
            colIndex = cIdx;
            currentCx = cell.cx;
          }
        });
      });

      if (rowIndex !== -1) {
        if (isDown) {
          if (rowIndex < rows.length - 1) {
            const targetRow = rows[rowIndex + 1];
            const best = targetRow.cells.reduce((a, b) => (Math.abs(b.cx - currentCx) < Math.abs(a.cx - currentCx) ? b : a));
            nextIndex = best.idx;
          } else {
            nextIndex = secondaryIndex !== -1 ? secondaryIndex : 0;
          }
        } else {
          if (rowIndex > 0) {
            const targetRow = rows[rowIndex - 1];
            const best = targetRow.cells.reduce((a, b) => (Math.abs(b.cx - currentCx) < Math.abs(a.cx - currentCx) ? b : a));
            nextIndex = best.idx;
          } else {
            nextIndex = secondaryIndex !== -1 ? secondaryIndex : gridCount - 1;
          }
        }
      }
    }
  } else {
    return;
  }

  if (nextIndex !== null && menuItems[nextIndex]) {
    event.preventDefault();
    focusSafely(menuItems[nextIndex]);
  }
}

function fadeSwap(renderFn, { immediate = false } = {}) {
  clearTimeout(fadeTimeoutId);
  if (immediate || isReducedMotion()) {
    screenContent.classList.remove('screen-fade-out');
    renderFn();
    return;
  }
  screenContent.classList.add('screen-fade-out');
  fadeTimeoutId = setTimeout(() => {
    renderFn();
    screenContent.classList.remove('screen-fade-out');
  }, 180);
}

function selectApp(appId, { updateHistory = true, immediate = false } = {}) {
  const normalizedId = appId === 'app-06' ? 'devpath' : appId;

  if (normalizedId === 'professional') {
    window.location.assign('/');
    return;
  }

  if (normalizedId === 'art-gallery') {
    window.location.assign('/art-gallery/');
    return;
  }

  if (normalizedId === 'sandbox') {
    window.location.assign('/sandbox/');
    return;
  }

  const app = ALL_APPS.find((a) => a.id === normalizedId);
  if (!app || !INLINE_APP_IDS.has(normalizedId)) {
    setUrlHash('#menu', { replace: true });
    goToAppMenu({ updateHistory: false, immediate: true, shouldFocus: false });
    return;
  }

  lastTriggerAppId = app.id;
  currentViewKey = `app:${app.id}`;
  document.body.classList.remove('app-menu-active');
  document.body.classList.add('crt-zoomed');
  setPowerState(true);
  if (updateHistory) setUrlHash(`#app=${app.id}`);
  fadeSwap(() => renderProjectView(app), { immediate });
}

function renderProjectView(app) {
  document.body.classList.add('project-view-active');
  const mediaHtml = app.image
    ? `
      <div class="project-screenshot-frame">
        <img class="project-screenshot" src="${app.image}" alt="${app.name} preview" />
      </div>
    `
    : '';

  const actionsList = Array.isArray(app.actions) && app.actions.length
    ? app.actions
    : (app.link
        ? [{ label: 'LAUNCH / VISIT PROJECT ↗', href: app.link, primary: true, external: app.link.startsWith('http') }]
        : []);

  const primaryActions = actionsList.filter((action) => action.primary);
  const secondaryActions = actionsList.filter((action) => !action.primary);

  const renderActionLink = (action, isPrimary) => {
    const cls = isPrimary ? 'project-play-btn' : 'project-link-btn';
    const relAttr = action.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const srExt = action.external ? '<span class="sr-only"> (opens in a new tab)</span>' : '';
    return `<a class="${cls}" href="${action.href}"${relAttr}>${action.label}${srExt}</a>`;
  };

  const topActionsHtml = primaryActions.length
    ? `
      <div class="project-actions project-actions--primary">
        ${primaryActions.map((action) => renderActionLink(action, true)).join('')}
      </div>
    `
    : '';

  const bottomActionsHtml = secondaryActions.length
    ? `
      <div class="project-actions project-actions--secondary">
        ${secondaryActions.map((action) => renderActionLink(action, false)).join('')}
      </div>
    `
    : '';

  const taglineHtml = app.tagline
    ? `<p class="project-tagline">"${app.tagline}"</p>`
    : '';

  const featuresHtml = app.features.length
    ? `
      <h3 class="project-section-title">KEY FEATURES</h3>
      <ul class="project-features">
        ${app.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `
    : '';

  const techHtml = app.technologies.length
    ? `
      <h3 class="project-section-title">TECH STACK</h3>
      <p class="project-tech-line">${app.technologies.join(' • ')}</p>
    `
    : '';

  screenContent.innerHTML = `
    <article id="project-view" class="project-view" aria-labelledby="project-view-title">
      <div class="project-header">
        <h2 id="project-view-title" class="project-header-title" tabindex="-1">${app.name.toUpperCase()}</h2>
        <button type="button" id="project-close-btn" class="project-close-btn" aria-label="Close ${app.name} dossier and return to hub">✕</button>
      </div>

      <div class="project-body">
        ${mediaHtml}
        ${topActionsHtml}

        <p class="project-category">${app.category}</p>
        ${taglineHtml}
        <p class="project-description">${app.description}</p>

        ${featuresHtml}
        ${techHtml}

        <h3 class="project-section-title">STATUS</h3>
        <p class="project-status-line">${app.devStatus}</p>

        ${bottomActionsHtml}
      </div>

      <div class="project-footer">
        <button type="button" id="return-hub-btn" class="return-hub-btn" aria-label="Return to application hub">◂ RETURN TO HUB</button>
      </div>
    </article>
  `;

  const projectViewEl = document.getElementById('project-view');
  const titleEl = document.getElementById('project-view-title');
  const closeBtn = document.getElementById('project-close-btn');
  const returnBtn = document.getElementById('return-hub-btn');

  closeBtn.addEventListener('click', returnToAppMenu);
  returnBtn.addEventListener('click', returnToAppMenu);

  projectViewEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      returnToAppMenu();
    }
  });

  focusSafely(titleEl);
  announceStatus(`${app.name} dossier opened.`);
}

function returnToAppMenu() {
  const restoreTargetId = lastTriggerAppId;
  setUrlHash('#menu');
  fadeSwap(() => {
    renderAppMenu({ shouldFocus: Boolean(restoreTargetId), focusAppId: restoreTargetId });
    announceStatus('Returned to application hub.');
  });
}

function resetToLanding({ updateHistory = true, immediate = false } = {}) {
  currentViewKey = 'landing';
  clearTimeout(zoomTimeoutId);
  zoomTimeoutId = null;
  clearTimeout(fadeTimeoutId);
  fadeTimeoutId = null;
  bootTimeoutIds.forEach(clearTimeout);
  bootTimeoutIds = [];
  document.body.classList.remove('app-menu-active');
  document.body.classList.remove('project-view-active');
  document.body.classList.remove('crt-zoomed');
  setPowerState(false);
  if (updateHistory) setUrlHash('');

  if (immediate || isReducedMotion()) {
    screenContent.classList.remove('screen-fade-out');
    screenContent.innerHTML = LANDING_CONTENT_HTML;
    const newPlayBtn = document.getElementById('play-btn');
    newPlayBtn.addEventListener('click', startZoomAndBoot);
    focusSafely(newPlayBtn);
    announceStatus('Retro computer powered off.');
  } else {
    screenContent.classList.add('screen-fade-out');
    fadeTimeoutId = setTimeout(() => {
      screenContent.innerHTML = LANDING_CONTENT_HTML;
      screenContent.classList.remove('screen-fade-out');
      const newPlayBtn = document.getElementById('play-btn');
      newPlayBtn.addEventListener('click', startZoomAndBoot);
      focusSafely(newPlayBtn);
      announceStatus('Retro computer powered off.');
    }, 200);
  }
}

function syncFromLocation({ immediate = true, isInitialLoad = false } = {}) {
  const wasInProjectView = document.body.classList.contains('project-view-active');
  const rawHash = window.location.hash;
  if (!rawHash || rawHash === '#') {
    if (currentViewKey === 'landing' && !document.body.classList.contains('crt-zoomed')) return;
    if (document.body.classList.contains('crt-zoomed') || currentViewKey !== 'landing') {
      resetToLanding({ updateHistory: false, immediate: true });
    }
    return;
  }

  clearTimeout(zoomTimeoutId);
  zoomTimeoutId = null;
  clearTimeout(fadeTimeoutId);
  fadeTimeoutId = null;
  bootTimeoutIds.forEach(clearTimeout);
  bootTimeoutIds = [];

  if (rawHash === '#menu') {
    if (!isInitialLoad && currentViewKey === 'menu') return;
    const restoreId = (!isInitialLoad && wasInProjectView) ? lastTriggerAppId : null;
    goToAppMenu({
      updateHistory: false,
      immediate,
      shouldFocus: Boolean(restoreId),
      focusAppId: restoreId,
    });
    return;
  }

  if (rawHash.startsWith('#app=')) {
    const rawAppId = decodeURIComponent(rawHash.slice(5));
    const appId = rawAppId === 'app-06' ? 'devpath' : rawAppId;
    if (rawAppId === 'app-06') {
      setUrlHash('#app=devpath', { replace: true });
    }
    if (INLINE_APP_IDS.has(appId)) {
      if (!isInitialLoad && currentViewKey === `app:${appId}`) return;
      selectApp(appId, { updateHistory: false, immediate });
      return;
    }
  }

  setUrlHash('#menu', { replace: true });
  goToAppMenu({ updateHistory: false, immediate: true, shouldFocus: false });
}

playBtn.addEventListener('click', startZoomAndBoot);
powerButtonHotspot.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  resetToLanding();
});

window.addEventListener('popstate', () => syncFromLocation({ immediate: true, isInitialLoad: false }));
window.addEventListener('hashchange', () => syncFromLocation({ immediate: true, isInitialLoad: false }));

if (window.location.hash && window.location.hash !== '#') {
  syncFromLocation({ immediate: true, isInitialLoad: true });
}
