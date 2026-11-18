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

let reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let scanlinesEnabled = true;

function isReducedMotion() {
  return reducedMotion;
}

// ---- Display settings bar (Stage 5) ----
const powerBtn = document.getElementById('toggle-power-btn');
const scanlinesBtn = document.getElementById('toggle-scanlines-btn');
const motionBtn = document.getElementById('toggle-motion-btn');

if (reducedMotion) {
  document.body.classList.add('reduce-motion');
  motionBtn.setAttribute('aria-pressed', 'true');
  motionBtn.textContent = 'REDUCE MOTION: ON';
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
  reducedMotion = !reducedMotion;
  document.body.classList.toggle('reduce-motion', reducedMotion);
  motionBtn.setAttribute('aria-pressed', String(reducedMotion));
  motionBtn.textContent = `REDUCE MOTION: ${reducedMotion ? 'ON' : 'OFF'}`;
});

// Captured once, before any interaction, so Escape can restore the
// exact original landing markup (including the PLAY button).
const LANDING_CONTENT_HTML = screenContent.innerHTML;

// Editable app data — six primary catalog entries + separate DevPath paused prototype.
const APPS = [
  {
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
  zoomTimeoutId = setTimeout(renderBootScreen, zoomDuration);
}

function renderBootScreen() {
  bootComplete = false;

  screenContent.innerHTML = `
    <div id="boot-sequence" class="boot-sequence" role="button" tabindex="0"
         aria-label="Boot sequence. Click, tap, or press Enter to continue.">
      <div class="boot-lines-wrap" aria-live="polite">
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
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBootAdvance(bootTextEl, skipBtn);
    }
  });

  bootSequenceEl.focus();
}

function handleBootAdvance(bootTextEl, skipBtn) {
  if (!bootComplete) {
    skipTyping(bootTextEl, skipBtn);
  } else {
    goToAppMenu();
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
  if (skipBtn) skipBtn.textContent = 'CONTINUE ▸';
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

function goToAppMenu({ updateHistory = true, immediate = false } = {}) {
  if (updateHistory) setUrlHash('#menu');
  document.body.classList.add('crt-zoomed');
  setPowerState(true);
  if (immediate || isReducedMotion()) {
    clearTimeout(fadeTimeoutId);
    screenContent.classList.remove('screen-fade-out');
    renderAppMenu();
  } else {
    renderAppMenu();
  }
}

function renderAppMenu() {
  document.body.classList.remove('project-view-active');
  document.body.classList.add('app-menu-active');
  screenContent.innerHTML = `
    <div id="app-menu" class="app-menu">
      <div class="app-menu-header">ENUHRI SYSTEM v1.1</div>
      <div class="app-grid" role="menu" aria-label="Applications">
        ${APPS.map((app) => `
          <button type="button" class="app-tile" role="menuitem"
                  data-app-id="${app.id}"
                  data-status="${app.status.toLowerCase()}"
                  aria-label="${app.name}, ${app.status}">
            <span class="app-icon" aria-hidden="true">${app.icon}</span>
            <span class="app-name">${app.name}</span>
            <span class="app-status">${app.status}</span>
          </button>
        `).join('')}
      </div>
      <div class="app-secondary-bar" role="group" aria-label="Paused Prototype">
        <button type="button" class="app-secondary-entry"
                data-app-id="${DEVPATH_APP.id}"
                data-status="paused"
                aria-label="${DEVPATH_APP.name}, ${DEVPATH_APP.status}">
          <span class="app-secondary-left">
            <span class="app-secondary-icon" aria-hidden="true">${DEVPATH_APP.icon}</span>
            <span class="app-secondary-name">${DEVPATH_APP.name}</span>
          </span>
          <span class="app-secondary-right">
            <span class="app-secondary-status">${DEVPATH_APP.status}</span>
            <span class="app-secondary-cta" aria-hidden="true">INSPECT ▸</span>
          </span>
        </button>
      </div>
      <div class="app-menu-footer">SELECT APPLICATION</div>
    </div>
  `;

  const menuEl = document.getElementById('app-menu');
  const menuItems = Array.from(menuEl.querySelectorAll('.app-tile, .app-secondary-entry'));

  menuItems.forEach((item) => {
    item.addEventListener('click', () => selectApp(item.dataset.appId));
  });

  menuEl.addEventListener('keydown', (event) => handleMenuKeydown(event, menuItems));

  menuItems[0].focus();
}

function handleMenuKeydown(event, menuItems) {
  const columns = 3;
  const gridCount = APPS.length;

  if (event.key === 'Escape') {
    event.preventDefault();
    resetToLanding();
    return;
  }

  const currentIndex = menuItems.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectApp(menuItems[currentIndex].dataset.appId);
    return;
  }

  let nextIndex = null;
  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % menuItems.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
  } else if (event.key === 'ArrowDown') {
    if (currentIndex < gridCount - columns) {
      nextIndex = currentIndex + columns;
    } else if (currentIndex < gridCount && menuItems.length > gridCount) {
      nextIndex = gridCount;
    } else {
      nextIndex = 0;
    }
  } else if (event.key === 'ArrowUp') {
    if (currentIndex >= gridCount) {
      nextIndex = Math.max(0, gridCount - columns);
    } else if (currentIndex >= columns) {
      nextIndex = currentIndex - columns;
    } else if (menuItems.length > gridCount) {
      nextIndex = gridCount;
    } else {
      nextIndex = (currentIndex - columns + menuItems.length) % menuItems.length;
    }
  } else {
    return;
  }

  event.preventDefault();
  menuItems[nextIndex].focus();
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
    goToAppMenu({ updateHistory: false, immediate: true });
    return;
  }

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
    return `<a class="${cls}" href="${action.href}"${relAttr}>${action.label}</a>`;
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
      <p class="project-section-title">KEY FEATURES</p>
      <ul class="project-features">
        ${app.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `
    : '';

  const techHtml = app.technologies.length
    ? `
      <p class="project-section-title">TECH STACK</p>
      <p class="project-tech-line">${app.technologies.join(' • ')}</p>
    `
    : '';

  screenContent.innerHTML = `
    <div id="project-view" class="project-view">
      <div class="project-header">
        <span class="project-header-title">${app.name.toUpperCase()}</span>
        <button type="button" id="project-close-btn" class="project-close-btn" aria-label="Close and return to hub">✕</button>
      </div>

      <div class="project-body">
        ${mediaHtml}
        ${topActionsHtml}

        <p class="project-category">${app.category}</p>
        ${taglineHtml}
        <p class="project-description">${app.description}</p>

        ${featuresHtml}
        ${techHtml}

        <p class="project-section-title">STATUS</p>
        <p class="project-status-line">${app.devStatus}</p>

        ${bottomActionsHtml}
      </div>

      <div class="project-footer">
        <button type="button" id="return-hub-btn" class="return-hub-btn">◂ RETURN TO HUB</button>
      </div>
    </div>
  `;

  const projectViewEl = document.getElementById('project-view');
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

  returnBtn.focus();
}

function returnToAppMenu() {
  setUrlHash('#menu');
  fadeSwap(renderAppMenu);
}

function resetToLanding({ updateHistory = true, immediate = false } = {}) {
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
    document.getElementById('play-btn').addEventListener('click', startZoomAndBoot);
    document.getElementById('play-btn').focus();
  } else {
    screenContent.classList.add('screen-fade-out');
    fadeTimeoutId = setTimeout(() => {
      screenContent.innerHTML = LANDING_CONTENT_HTML;
      screenContent.classList.remove('screen-fade-out');
      document.getElementById('play-btn').addEventListener('click', startZoomAndBoot);
      document.getElementById('play-btn').focus();
    }, 200);
  }
}

function syncFromLocation({ immediate = true } = {}) {
  const rawHash = window.location.hash;
  if (!rawHash || rawHash === '#') {
    if (document.body.classList.contains('crt-zoomed')) {
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
    goToAppMenu({ updateHistory: false, immediate });
    return;
  }

  if (rawHash.startsWith('#app=')) {
    const rawAppId = decodeURIComponent(rawHash.slice(5));
    const appId = rawAppId === 'app-06' ? 'devpath' : rawAppId;
    if (rawAppId === 'app-06') {
      setUrlHash('#app=devpath', { replace: true });
    }
    if (INLINE_APP_IDS.has(appId)) {
      selectApp(appId, { updateHistory: false, immediate });
      return;
    }
  }

  setUrlHash('#menu', { replace: true });
  goToAppMenu({ updateHistory: false, immediate: true });
}

playBtn.addEventListener('click', startZoomAndBoot);
powerButtonHotspot.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  resetToLanding();
});

window.addEventListener('popstate', () => syncFromLocation({ immediate: true }));
window.addEventListener('hashchange', () => syncFromLocation({ immediate: true }));

if (window.location.hash && window.location.hash !== '#') {
  syncFromLocation({ immediate: true });
}
