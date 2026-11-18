/* ===================================================
   ENUHRI PORTFOLIO HUB — script.js
   Stage 1: landing screen.
   Stage 2: CRT zoom transition + boot sequence.
   Stage 3 will replace goToAppMenu() with the real
   six-application menu.
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

// Editable app data — update names/status/content here as projects evolve.
const APPS = [
  {
    id: 'portfolio',
    name: 'Portfolio / Resume',
    icon: '📄',
    status: 'READY',
    category: 'Personal Profile & Credentials',
    tagline: 'BSIT Software Engineering & Technical Profile',
    description: 'A digital personnel file covering technical background, BSIT education at Universidad de Manila, core engineering competencies, project history, and contact credentials.',
    features: [
      'Professional Summary & BSIT Background',
      'Technical Skills Matrix (Frontend, Systems, Dev)',
      'Interactive Project Showcases & Architecture',
      'Downloadable Resume & Academic Credentials',
      'Direct Inquiries & Professional Contact Channels',
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript'],
    devStatus: 'ACTIVE / DEPLOYED',
    image: null,
    link: '/portfolio/',
  },
  {
    id: 'udm-radar',
    name: 'UDM Radar',
    icon: '📡',
    status: 'READY',
    category: 'Academic Analytics & Decision-Support System',
    tagline: 'Risk Analytics & Decision-Support for Academic Records',
    description: 'A role-based academic decision-support platform for early student risk detection, projected GWA analysis, grade governance, and academic interventions for the College of Computing Studies at Universidad de Manila.',
    features: [
      'Three role-governed portals: Student, Faculty, and Admin',
      'Machine Learning GWA projection powered by a Decision Tree Regressor',
      'Human-in-the-Loop intervention workflow (Support Notices & student acknowledgment)',
      'Curriculum Checklist (.xlsx) batch ingestion and schema validation',
      'Administrative grade-correction approval & batch submission workflows',
      'Interactive Chart.js visualizations & longitudinal performance trends',
      'Comprehensive audit trails, CSV risk rosters & branded Dompdf exports',
    ],
    technologies: ['PHP 8.2', 'MySQL / MariaDB', 'Python', 'Flask', 'scikit-learn', 'Chart.js', 'Dompdf'],
    devStatus: 'FUNCTIONAL PROTOTYPE / ACTIVE DEVELOPMENT',
    image: '../assets/projects/udm-radar.png',
    link: null,
  },
  {
    id: 'studyquest',
    name: 'StudyQuest',
    icon: '📚',
    status: 'READY',
    category: 'AI-Powered Gamified Learning Platform',
    tagline: 'Turn Your Syllabus Into a Game',
    description: 'An AI-assisted learning platform that transforms uploaded academic materials (syllabi, modules, reviewers) into structured courses with interactive chapter reviews, secure server-graded mixed assessments, progression gates, and game-inspired motivation.',
    features: [
      'AI-powered course generation from uploaded documents via Gemini 3.6 Flash',
      'Structured chapter reviews with analogies, misconceptions & exam traps',
      'Server-graded mixed assessments: Multiple Choice, True/False, Identification & Enumeration',
      'Gamification engine: XP rewards, levels, streaks, and anti-farming safeguards',
      'Dual progression paths: guided lesson mastery and quiz-based test-out routes',
      'Free and Plus plan tiers with course generation quotas and completion credits',
      'Mobile-first responsive reader with slide-up assessment feedback drawers',
    ],
    technologies: ['Django 5.2', 'Python', 'Google Gemini 3.6 Flash', 'Pydantic', 'SQLite', 'Vanilla JS'],
    devStatus: 'CORE PLATFORM COMPLETE / POLISH PHASE',
    image: '../assets/projects/studyquest.png',
    link: null,
  },
  {
    id: 'art-gallery',
    name: 'Enuhri Art Gallery',
    icon: '🎨',
    status: 'READY',
    category: 'Interactive Virtual Museum',
    tagline: 'Classical Architecture & Community Artwork Exhibition',
    description: 'An interactive virtual museum where visitors explore neoclassical halls, view community artworks with museum plaques, and submit their own art created in the integrated studio.',
    features: [
      'Neoclassical Entrance Hall & Gallery Hall exploration',
      'Artist Studio with canvas drawing, brush size, and color palette controls',
      'Horizontal exploration with mouse drag, touch swipe, and arrow key navigation',
      'Interactive artwork inspection modal with plaques and metadata',
      'Community artwork submission and local storage persistence',
    ],
    technologies: ['HTML5 Canvas', 'CSS3', 'JavaScript'],
    devStatus: 'FUNCTIONAL / DEPLOYED',
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
    devStatus: 'LIVE NATIVE WEB BUILD / FULLY OPERATIONAL',
    image: '../assets/projects/cyberdefender.png',
    link: '/cyberdefender/',
  },
  {
    id: 'app-06',
    name: 'App 06',
    icon: '❓',
    status: 'COMING SOON',
    category: 'Future Terminal Slot',
    tagline: 'System Slot Reserved',
    description: 'This terminal slot is reserved for a future application or utility currently under concept validation.',
    features: [],
    technologies: [],
    devStatus: 'PENDING',
    image: null,
    link: null,
  },
];

const BOOT_LINES = [
  'ENUHRI SYSTEM v1.0',
  '',
  'Initializing system...',
  'Detecting applications...',
  'Loading portfolio........ OK',
  'Loading UDM Radar........ OK',
  'Loading StudyQuest....... OK',
  'Loading Art Gallery...... OK',
  'Loading CyberDefender.... OK',
  'Checking unknown app..... PENDING',
  '',
  '6 APPLICATIONS DETECTED',
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

const INLINE_APP_IDS = new Set(['udm-radar', 'studyquest', 'cyberdefender', 'app-06']);
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
      <div class="app-menu-header">ENUHRI SYSTEM v1.0</div>
      <div class="app-grid" role="menu" aria-label="Applications">
        ${APPS.map((app) => `
          <button type="button" class="app-tile" role="menuitem"
                  data-app-id="${app.id}"
                  data-status="${app.status === 'COMING SOON' ? 'coming-soon' : 'ready'}"
                  aria-label="${app.name}, ${app.status}">
            <span class="app-icon" aria-hidden="true">${app.icon}</span>
            <span class="app-name">${app.name}</span>
            <span class="app-status">${app.status}</span>
          </button>
        `).join('')}
      </div>
      <div class="app-menu-footer">SELECT APPLICATION</div>
    </div>
  `;

  const menuEl = document.getElementById('app-menu');
  const tiles = Array.from(menuEl.querySelectorAll('.app-tile'));

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => selectApp(tile.dataset.appId));
  });

  menuEl.addEventListener('keydown', (event) => handleMenuKeydown(event, tiles));

  tiles[0].focus();
}

function handleMenuKeydown(event, tiles) {
  const columns = 3;

  if (event.key === 'Escape') {
    event.preventDefault();
    resetToLanding();
    return;
  }

  const currentIndex = tiles.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectApp(tiles[currentIndex].dataset.appId);
    return;
  }

  let nextIndex = null;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tiles.length;
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tiles.length) % tiles.length;
  else if (event.key === 'ArrowDown') nextIndex = (currentIndex + columns) % tiles.length;
  else if (event.key === 'ArrowUp') nextIndex = (currentIndex - columns + tiles.length) % tiles.length;
  else return;

  event.preventDefault();
  tiles[nextIndex].focus();
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
  if (appId === 'portfolio') {
    window.location.assign('/portfolio/');
    return;
  }

  if (appId === 'art-gallery') {
    window.location.assign('/art-gallery/');
    return;
  }

  const app = APPS.find((a) => a.id === appId);
  if (!app || !INLINE_APP_IDS.has(appId)) {
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

  const playDemoHtml = app.id === 'cyberdefender'
    ? `
      <div class="project-play-wrap">
        <a class="project-play-btn" href="/cyberdefender/">▶ PLAY REMADE WEB DEMO</a>
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

  const linkHtml = app.link
    ? `<a class="project-link-btn" href="${app.link}" ${app.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${app.id === 'cyberdefender' ? '▶ PLAY REMADE WEB DEMO ↗' : 'LAUNCH / VISIT PROJECT ↗'}</a>`
    : '';

  screenContent.innerHTML = `
    <div id="project-view" class="project-view">
      <div class="project-header">
        <span class="project-header-title">${app.name.toUpperCase()}</span>
        <button type="button" id="project-close-btn" class="project-close-btn" aria-label="Close and return to hub">✕</button>
      </div>

      <div class="project-body">
        ${mediaHtml}
        ${playDemoHtml}

        <p class="project-category">${app.category}</p>
        ${taglineHtml}
        <p class="project-description">${app.description}</p>

        ${featuresHtml}
        ${techHtml}

        <p class="project-section-title">STATUS</p>
        <p class="project-status-line">${app.devStatus}</p>

        ${linkHtml}
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
    const appId = decodeURIComponent(rawHash.slice(5));
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
