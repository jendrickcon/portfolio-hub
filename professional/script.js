
(() => {
  const $$ = s => [...document.querySelectorAll(s)];
  const html = document.documentElement, hdr = document.getElementById('hdr');
  const run = document.getElementById('story'), track = run.querySelector('.track');
  const stage = run.querySelector('.stage');
  const footer = document.querySelector('footer');
  const panels = $$('[data-panel]'), marks = $$('[data-mk]'), links = $$('[data-sec]');
  const secs = ['about','profile','work','capabilities','journey','contact'].map(id => document.getElementById(id));

  /* Theme Controller: Light, Dark only */
  const themeKey = 'portfolio-theme';
  const themeOpts = [...document.querySelectorAll('.theme-opt')];
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let currentTheme = 'dark';
  try {
    let saved = localStorage.getItem(themeKey);
    if (saved === 'system') {
      saved = 'dark';
      localStorage.setItem(themeKey, 'dark');
    }
    if (saved === 'light' || saved === 'dark') {
      currentTheme = saved;
    }
  } catch (e) {}

  let themeTransitionTimer = null;
  function applyTheme(pref, { animate = false } = {}) {
    let workPosition = null;
    if (animate && enh) {
      const start = top(run) - hdr.offsetHeight;
      if (scrollY >= start && scrollY <= start + span()) {
        const x = curX();
        const nearest = panelStarts.reduce((best, position, i) =>
          Math.abs(position - x) < Math.abs(panelStarts[best] - x) ? i : best, 0);
        workPosition = { progress: clamp(x / maxX), nearest, wasEnhanced: true };
      }
    } else if (animate) {
      const start = top(run), line = scrollY + hdr.offsetHeight + innerHeight * .35;
      if (line >= start && line < start + run.offsetHeight) {
        let nearest = -1;
        panels.forEach((panel, i) => { if (top(panel) <= line) nearest = i; });
        if (nearest >= 0) workPosition = { progress: null, nearest, wasEnhanced: false };
      }
    }
    const resolved = (pref === 'light' || pref === 'dark') ? pref : 'dark';
    currentTheme = resolved;

    if (animate && !motion.matches) {
      html.classList.add('theme-transitioning');
      clearTimeout(themeTransitionTimer);
      themeTransitionTimer = setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 240);
    }

    html.setAttribute('data-theme', resolved);
    html.removeAttribute('data-theme-preference');
    html.style.colorScheme = resolved;
    if (metaTheme) metaTheme.content = resolved === 'dark' ? '#11151b' : '#f4f6f5';

    themeOpts.forEach(btn => {
      const active = btn.dataset.themeVal === resolved;
      btn.setAttribute('aria-pressed', String(active));
    });

    try {
      localStorage.setItem(themeKey, resolved);
    } catch (e) {}

    // Notify field canvas for smooth palette interpolation
    if (typeof window.onFieldThemeChange === 'function') {
      window.onFieldThemeChange(resolved, animate && !motion.matches);
    }

    // Work layout recomputation after theme switch
    if (animate) requestAnimationFrame(() => {
      finishAllPreviewResizes();
      layout();
      if (workPosition && (workPosition.wasEnhanced || enh)) {
        const destination = enh
          ? top(run) - hdr.offsetHeight + (workPosition.progress === null
            ? panelStarts[workPosition.nearest] / maxX : workPosition.progress) * span()
          : top(panels[workPosition.nearest]) - hdr.offsetHeight - 8;
        scrollTo({ top: Math.max(0, destination), behavior: 'instant' });
        update();
      }
    });
  }

  themeOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeVal, { animate: true });
    });
  });

  applyTheme(currentTheme, { animate: false });

  /* Project-Linked Toolkit: Adaptive Natural Height & Spatial Takeover Lifecycle */
  (() => {
    const shelves = $$('.toolkit-shelf');
    if (!shelves.length) return;

    let activeEntry = null;
    let closingEntry = null;
    let isTransitioning = false;
    let openTimer1 = null, openTimer2 = null, openTimer3 = null;
    let closeTimer1 = null, closeTimer2 = null;

    function clearAllTimers() {
      clearTimeout(openTimer1);
      clearTimeout(openTimer2);
      clearTimeout(openTimer3);
      clearTimeout(closeTimer1);
      clearTimeout(closeTimer2);
    }

    function cancelActiveCleanly() {
      clearAllTimers();
      const cur = activeEntry || closingEntry;
      activeEntry = null;
      closingEntry = null;
      isTransitioning = false;

      // Unconditionally ensure all shelves are in clean collapsed state
      shelves.forEach(s => {
        const t = s.querySelector('.tool-takeover');
        if (t) {
          t.hidden = true;
          t.classList.remove('is-active', 'is-revealed');
          t.setAttribute('aria-hidden', 'true');
          t.style.transform = 'none';
          t.style.transition = 'none';
        }
        const stg = s.querySelector('.tool-stage');
        if (stg) stg.style.height = '';

        const toggles = s.querySelectorAll('.tool-toggle');
        toggles.forEach(b => b.setAttribute('aria-expanded', 'false'));

        const cards = s.querySelectorAll('.tool-card');
        cards.forEach(c => {
          c.inert = false;
          c.removeAttribute('aria-hidden');
          c.style.visibility = '';
          c.classList.remove('is-sibling-exiting', 'is-sibling-entering', 'is-selected-source');
        });
      });
    }

    // Build takeover element contents and card toggles
    shelves.forEach((shelf, gi) => {
      const stage = shelf.querySelector('.tool-stage');
      const grid = shelf.querySelector('.toolkit-grid');
      const takeover = shelf.querySelector('.tool-takeover');
      if (!stage || !grid || !takeover) return;

      const takeoverId = 'tool-takeover-' + gi;
      takeover.id = takeoverId;

      // Build takeover skeleton
      takeover.innerHTML = `
        <button type="button" class="tool-takeover-head" aria-label="Collapse tool details">
          <span class="tool-takeover-main">
            <span class="tool-takeover-title"></span>
            <span class="tool-takeover-refs mono"></span>
          </span>
          <span class="tool-takeover-chev" aria-hidden="true"></span>
        </button>
        <div class="tool-takeover-body" role="region" aria-labelledby="${takeoverId}-head">
          <p class="tool-takeover-desc"></p>
          <div class="tool-takeover-footer">
            <span class="tool-takeover-proof mono"></span>
            <button type="button" class="tool-takeover-close-btn mono">
              <span>Close details</span>
              <svg class="tool-takeover-close-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      `;

      const takeoverHead = takeover.querySelector('.tool-takeover-head');
      takeoverHead.id = `${takeoverId}-head`;
      const takeoverClose = takeover.querySelector('.tool-takeover-close-btn');

      takeoverHead.addEventListener('click', () => closeActive(true));
      takeoverClose.addEventListener('click', e => {
        e.stopPropagation();
        closeActive(true);
      });

      const cards = [...grid.querySelectorAll(':scope > .tool-card')];
      cards.forEach((card, ci) => {
        const head = card.querySelector('.tool-card-head');
        const desc = card.querySelector('.tool-desc');
        const refs = card.querySelector('.tool-refs');
        if (!head || !desc || !refs) return;

        const name = head.textContent.trim();
        const refText = refs.textContent.trim();
        const descText = desc.textContent.trim();

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tool-toggle';
        btn.id = `tool-btn-${gi}-${ci}`;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', takeoverId);

        const toggleMain = document.createElement('span');
        toggleMain.className = 'tool-toggle-main';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tool-name';
        nameSpan.textContent = name;
        const usedSpan = document.createElement('span');
        usedSpan.className = 'tool-used mono';
        usedSpan.textContent = refText;
        toggleMain.append(nameSpan, usedSpan);

        const chev = document.createElement('span');
        chev.className = 'tool-chev';
        chev.setAttribute('aria-hidden', 'true');
        btn.append(toggleMain, chev);

        card.replaceChildren(btn);

        card._toolData = {
          name,
          refs: refText,
          desc: descText,
          card,
          grid,
          stage,
          shelf,
          takeover,
          btn,
          cardIndex: ci
        };

        btn.addEventListener('click', () => {
          if (activeEntry && activeEntry.card === card) {
            closeActive(true);
          } else {
            performOpen(card);
          }
        });
      });
    });

    function performOpen(card) {
      if (activeEntry || closingEntry) {
        cancelActiveCleanly();
      }
      isTransitioning = true;
      clearAllTimers();

      const d = card._toolData;
      const stage = d.stage;
      const grid = d.grid;
      const takeover = d.takeover;
      const siblings = [...grid.querySelectorAll('.tool-card')].filter(c => c !== card);

      // Step 1: Measure current collapsed grid height
      const gridH = grid.offsetHeight;
      stage.style.height = gridH + 'px';

      // Step 2: Measure starting geometry relative to stage
      const cardRect = card.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const startX = cardRect.left - stageRect.left;
      const startY = cardRect.top - stageRect.top;
      const startW = cardRect.width;
      const startH = cardRect.height;
      const endW = stageRect.width;

      // Step 3: Populate takeover content
      takeover.querySelector('.tool-takeover-title').textContent = d.name;
      takeover.querySelector('.tool-takeover-refs').textContent = d.refs;
      takeover.querySelector('.tool-takeover-desc').textContent = d.desc;
      takeover.querySelector('.tool-takeover-proof').innerHTML = '<span class="tool-takeover-proof-label">Evidence:</span> ' + d.refs;
      takeover.querySelector('.tool-takeover-close-btn').setAttribute('aria-label', `Close ${d.name} details`);
      takeover.querySelector('.tool-takeover-head').setAttribute('aria-expanded', 'true');

      // Step 4: Measure required expanded height in DOM
      takeover.hidden = false;
      takeover.style.width = '100%';
      takeover.style.transition = 'none';
      takeover.style.transform = 'none';
      takeover.classList.remove('is-revealed', 'is-active');

      const naturalExpH = takeover.offsetHeight;
      const expH = Math.min(naturalExpH, 360);
      const targetStageH = Math.max(gridH, expH);
      const sx = endW > 0 ? startW / endW : 1;
      const sy = expH > 0 ? startH / expH : 1;

      // Invert: position takeover exactly matching clicked card
      takeover.style.transform = `translate(${startX}px, ${startY}px) scale(${sx}, ${sy})`;
      takeover.classList.add('is-active');
      takeover.setAttribute('aria-hidden', 'false');

      // Exit siblings
      card.classList.add('is-selected-source');
      siblings.forEach(s => s.classList.add('is-sibling-exiting'));

      openTimer1 = setTimeout(() => {
        siblings.forEach(s => {
          s.inert = true;
          s.setAttribute('aria-hidden', 'true');
          s.style.visibility = 'hidden';
        });
      }, 120);

      // Force reflow
      void takeover.offsetHeight;

      // Step 5: Animate stage height to target expanded height (following group moves down once)
      if (targetStageH > gridH && !motion.matches) {
        stage.style.height = targetStageH + 'px';
      } else if (targetStageH > gridH) {
        stage.style.height = targetStageH + 'px';
      }

      // Step 6: Play FLIP takeover animation
      if (motion.matches) {
        takeover.style.transform = 'translate(0px, 0px) scale(1, 1)';
        takeover.classList.add('is-revealed');
        isTransitioning = false;
      } else {
        takeover.style.transition = 'transform 260ms cubic-bezier(.2,.7,.2,1)';
        takeover.style.transform = 'translate(0px, 0px) scale(1, 1)';

        openTimer2 = setTimeout(() => {
          takeover.classList.add('is-revealed');
        }, 140);

        openTimer3 = setTimeout(() => {
          isTransitioning = false;
        }, 280);
      }

      d.btn.setAttribute('aria-expanded', 'true');
      activeEntry = {
        card,
        stage,
        grid,
        takeover,
        siblings,
        startX,
        startY,
        sx,
        sy,
        trigger: d.btn,
        expandedH: targetStageH
      };
    }

    function closeActive(restoreFocus = true, callback = null) {
      if (!activeEntry) {
        if (typeof callback === 'function') callback();
        return;
      }

      const current = activeEntry;
      closingEntry = current;
      activeEntry = null;
      isTransitioning = true;
      clearAllTimers();

      // Phase A: Hide detail text immediately
      current.takeover.classList.remove('is-revealed');

      // Phase B: Temporary height floor - keep stage height held at current expanded height!
      const currentStageH = current.stage.offsetHeight;
      current.stage.style.height = currentStageH + 'px';

      function finishClose() {
        // Hide takeover shell
        current.takeover.hidden = true;
        current.takeover.classList.remove('is-active');
        current.takeover.setAttribute('aria-hidden', 'true');
        current.takeover.style.transform = 'none';
        current.takeover.style.transition = 'none';

        // Restore siblings while height floor remains held
        current.card.classList.remove('is-selected-source');
        current.siblings.forEach(s => {
          s.inert = false;
          s.removeAttribute('aria-hidden');
          s.style.visibility = '';
          s.classList.remove('is-sibling-exiting');
          s.classList.add('is-sibling-entering');
        });

        // Force layout settle and measure true collapsed grid height
        void current.stage.offsetHeight;
        requestAnimationFrame(() => {
          current.siblings.forEach(s => s.classList.remove('is-sibling-entering'));

          const finalCollapsedH = current.grid.offsetHeight;

          if (motion.matches || Math.abs(currentStageH - finalCollapsedH) <= 1) {
            current.stage.style.height = '';
            current.trigger.setAttribute('aria-expanded', 'false');
            if (restoreFocus) current.trigger.focus({ preventScroll: true });
            isTransitioning = false;
            closingEntry = null;
            if (typeof callback === 'function') callback();
          } else {
            // Animate group height ONCE from held expanded height to final collapsed height
            current.stage.style.height = finalCollapsedH + 'px';
            closeTimer2 = setTimeout(() => {
              current.stage.style.height = '';
              current.trigger.setAttribute('aria-expanded', 'false');
              if (restoreFocus) current.trigger.focus({ preventScroll: true });
              isTransitioning = false;
              closingEntry = null;
              if (typeof callback === 'function') callback();
            }, 260);
          }
        });
      }

      if (motion.matches) {
        finishClose();
      } else {
        // Reverse takeover shell animation to source card geometry (260ms)
        // Stage height is rock-solid at currentStageH during this entire return!
        current.takeover.style.transition = 'transform 260ms cubic-bezier(.2,.7,.2,1)';
        current.takeover.style.transform = `translate(${current.startX}px, ${current.startY}px) scale(${current.sx}, ${current.sy})`;

        closeTimer1 = setTimeout(finishClose, 260);
      }
    }

    if (shelves.length) html.classList.add('toolkit-ready');

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && activeEntry) {
        closeActive(true);
      }
    });

    window.addEventListener('resize', () => {
      if (activeEntry && !isTransitioning) {
        activeEntry.stage.style.height = activeEntry.takeover.offsetHeight + 'px';
      }
    }, { passive: true });
  })();

  const mq = matchMedia('(min-width:1024px) and (min-height:600px) and (prefers-reduced-motion:no-preference)');
  const clamp = v => Math.max(0, Math.min(1, v));
  const top = el => el.getBoundingClientRect().top + scrollY;
  let enh = false, queued = false;

  /* Snippet interactive state controller */
  const snippetData = {
    'udm-radar': { tag: 'UDM-RADAR · Student portal', href: '#udm-radar', caption: 'Current CCS light-theme student interface · fictional demo data.' },
    'studyquest': { tag: 'StudyQuest · Learning path', href: '#studyquest', caption: 'Course, review and assessment interfaces · fictional demo data.' },
    'mini-pcs': { tag: 'Mini PCS · Batch workflow', href: '#mini-pcs', caption: 'Batch and task workflow · fictional demo records.' }
  };
  const frows = $$('.frow'), views = $$('.snippet-view'), mtabs = $$('.mtab');
  const mobileTabs = document.querySelector('.mobile-tabs');
  if (mobileTabs) mobileTabs.hidden = false;
  const snippetTag = document.getElementById('snippet-tag');
  const snippetJump = document.getElementById('snippet-jump-link');

  // Transition between measured content heights, then restore intrinsic sizing.
  const previewBody = document.querySelector('.snippet-body');
  const reducePreviewMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const previewResizes = new Map();
  function finishPreviewResize(container) {
    const resize = previewResizes.get(container);
    if (!resize) return;
    clearTimeout(resize.timer);
    cancelAnimationFrame(resize.frame);
    container.style.transition = resize.transition;
    container.style.height = resize.height;
    container.style.overflow = resize.overflow;
    previewResizes.delete(container);
  }
  function finishAllPreviewResizes() {
    [...previewResizes.keys()].forEach(finishPreviewResize);
  }
  function resizePreview(container, change) {
    const from = container.getBoundingClientRect().height;
    finishPreviewResize(container);
    change();
    if (reducePreviewMotion.matches) return;
    const to = container.getBoundingClientRect().height;
    if (Math.abs(from - to) < 1) return;
    const resize = { transition: container.style.transition, height: container.style.height, overflow: container.style.overflow };
    previewResizes.set(container, resize);
    container.style.overflow = 'hidden';
    container.style.transition = 'none';
    container.style.height = from + 'px';
    void container.offsetHeight;
    container.style.transition = 'height 280ms cubic-bezier(.2,.7,.2,1)';
    resize.frame = requestAnimationFrame(() => { container.style.height = to + 'px'; });
    resize.timer = setTimeout(() => finishPreviewResize(container), 320);
  }
  window.addEventListener('resize', finishAllPreviewResizes);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { finishAllPreviewResizes(); layout(); });

  function setSnippet(key) {
    if (!snippetData[key]) return;
    frows.forEach(r => {
      const match = r.dataset.target === key;
      r.classList.toggle('active', match);
      const stateEl = r.querySelector('.state');
      if (stateEl) stateEl.textContent = match ? 'Previewing' : 'Hover to preview';
    });
    mtabs.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === key);
      b.setAttribute('aria-pressed', String(b.dataset.tab === key));
    });
    if (!document.getElementById('view-' + key).classList.contains('active')) {
      resizePreview(previewBody, () => views.forEach(v => {
        v.classList.toggle('active', v.id === 'view-' + key);
      }));
    }
    if (snippetTag) snippetTag.textContent = snippetData[key].tag;
    document.querySelector('.snippet-caption').textContent = snippetData[key].caption;
    if (snippetJump) snippetJump.setAttribute('href', snippetData[key].href);
  }

  // Pointer hover and keyboard focus
  frows.forEach(r => {
    r.addEventListener('mouseenter', () => setSnippet(r.dataset.target));
    r.addEventListener('focus', () => setSnippet(r.dataset.target));
  });

  // Mobile quick tab buttons
  mtabs.forEach(b => {
    b.addEventListener('click', () => setSnippet(b.dataset.tab));
  });

  // Layout changes can move a button under a stationary pointer. Count only
  // actual pointer movement so those synthetic entries cannot trigger a loop.
  let pointerRevision = 0, pointerPosition = null;
  function trackPointer(event) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (!pointerPosition || event.clientX !== pointerPosition.x || event.clientY !== pointerPosition.y) {
      pointerRevision++;
      pointerPosition = { x: event.clientX, y: event.clientY };
    }
  }
  document.addEventListener('pointermove', trackPointer, true);
  document.addEventListener('pointerdown', trackPointer, true);

  // Each reconstruction owns its own preview state. Hover is an enhancement;
  // focus, activation and touch use the same controls without navigating.
  document.querySelectorAll('[data-demo-project]').forEach(demo => {
    const nav = demo.querySelector('.demo-nav, .demo-tabs');
    const fallback = demo.querySelector('.demo-nav-static, .demo-study-nav-static, .demo-pcs-nav-static');
    if (!nav || !fallback) return;
    nav.hidden = false;
    fallback.hidden = true;
    const buttons = [...nav.querySelectorAll('[data-demo-target]')];
    const pages = [...demo.querySelectorAll('[data-demo-view]')];
    let hoverTimer, hoverCandidate, lastSelectionRevision = -1;
    const cancelHover = () => {
      clearTimeout(hoverTimer);
      hoverTimer = undefined;
      hoverCandidate = null;
    };
    const select = button => {
      cancelHover();
      if (button.getAttribute('aria-pressed') === 'true') return;
      lastSelectionRevision = pointerRevision;
      const change = () => {
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        pages.forEach(page => { page.hidden = page.dataset.demoView !== button.dataset.demoTarget; });
      };
      const container = demo.closest('.snippet-body, .chapter-preview');
      if (container) resizePreview(container, change);
      else change();
    };
    const scheduleHover = (button, event) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      if (button.getAttribute('aria-pressed') === 'true') { cancelHover(); return; }
      if (lastSelectionRevision === pointerRevision || hoverCandidate === button) return;
      cancelHover();
      hoverCandidate = button;
      hoverTimer = setTimeout(() => {
        if (button.matches(':hover')) select(button);
        else cancelHover();
      }, 200);
    };
    buttons.forEach(button => {
      button.addEventListener('pointerenter', event => scheduleHover(button, event));
      button.addEventListener('pointermove', event => scheduleHover(button, event));
      button.addEventListener('pointerleave', () => { if (hoverCandidate === button) cancelHover(); });
      button.addEventListener('focus', () => select(button));
      button.addEventListener('click', () => select(button));
    });
  });

  // Supporting-project media: one reusable dialog shared by Audiary and CyberDefender.
  // Direct image links remain the fallback when dialogs are unavailable or JavaScript is disabled.
  const mediaDialog = document.querySelector('.media-lightbox');
  const mediaTriggers = $$('.media-image-link, .audiary-image-link');
  if (mediaDialog && typeof mediaDialog.showModal === 'function' && mediaTriggers.length) {
    const dialogTitle = mediaDialog.querySelector('#media-lightbox-title') || mediaDialog.querySelector('.media-lightbox-bar p');
    const dialogImg = mediaDialog.querySelector('.media-lightbox-img') || mediaDialog.querySelector('img');
    const dialogClose = mediaDialog.querySelector('.media-lightbox-bar button');
    let activeMediaTrigger = null;

    mediaTriggers.forEach(trigger => {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', event => {
        event.preventDefault();
        activeMediaTrigger = trigger;
        const src = trigger.getAttribute('href') || trigger.dataset.mediaSrc;
        const title = trigger.dataset.mediaTitle || 'Project screenshot';
        const alt = trigger.dataset.mediaAlt || title;
        if (dialogTitle) dialogTitle.textContent = title;
        if (dialogImg) {
          dialogImg.src = src;
          dialogImg.alt = alt;
          if (trigger.dataset.mediaWidth) dialogImg.setAttribute('width', trigger.dataset.mediaWidth);
          if (trigger.dataset.mediaHeight) dialogImg.setAttribute('height', trigger.dataset.mediaHeight);
        }
        mediaDialog.showModal();
      });
    });

    if (dialogClose) dialogClose.addEventListener('click', () => mediaDialog.close());
    mediaDialog.addEventListener('click', event => {
      if (event.target === mediaDialog) mediaDialog.close();
    });
    mediaDialog.addEventListener('close', () => {
      const target = activeMediaTrigger;
      activeMediaTrigger = null;
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    });
  }

  /* Public résumé: one image-preview dialog, opened from every View résumé control. */
  const resumeDialog = document.getElementById('resume-dialog');
  if (resumeDialog) {
    const resumeOpeners = $$('[data-resume-open]');
    const resumeClose = resumeDialog.querySelector('[data-resume-close]');
    const resumeScroll = resumeDialog.querySelector('.resume-dialog-scroll');
    const resumePreview = resumeDialog.querySelector('.resume-preview img');
    const resumeError = resumeDialog.querySelector('.resume-dialog-error');
    const resumePdf = resumeDialog.querySelector('[data-resume-download]').getAttribute('href');
    const resumeName = 'Jendrick_Coniconde_Resume.pdf';
    const resumeFigure = resumeDialog.querySelector('.resume-preview');
    const resumeZoomIn = resumeDialog.querySelector('[data-resume-zoom-in]');
    const resumeZoomOut = resumeDialog.querySelector('[data-resume-zoom-out]');
    const resumeFit = resumeDialog.querySelector('[data-resume-fit]');
    const resumeZoomLabel = resumeDialog.querySelector('[data-resume-zoom-value]');
    let resumeTrigger = null;

    /* Zoom model: 1 is "Fit page" — the whole document scaled into the viewport.
       Percentages reported to the visitor are absolute (natural px × percent),
       while the steps they move through are relative to the fitted page. */
    const ZOOM_MIN = 1;            // multiplier of the fit scale (1 = Fit page)
    const ZOOM_MAX_WIDTH = 2;      // never wider than 2× the document's own pixels
    let resumeFitScale = 1;
    let resumeScale = 1;           // multiplier of fit scale
    let resumeZoomReset = true;    // scale is still "fit" (label shows Fit page)
    let resumeZoomTimer = 0;

    // Space the viewer may use: the viewport's width, and whatever vertical room
    // is left once the header, toolbar and footer are laid out. The scroller's own
    // height depends on the sheet, so it cannot be used to size the sheet.
    const availableBox = () => {
      const cs = getComputedStyle(resumeScroll);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      // Measure the bars directly: the scroller's own height already reflects the
      // sheet it contains, so deriving the budget from it would be circular.
      const panel = resumeDialog.querySelector('.resume-dialog-panel');
      // Height of the header, toolbar and footer only — never the sheet itself.
      const bars = [...panel.children]
        .filter(el => el !== resumeScroll)
        .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
      // The dialog's own limit (94dvh) is the budget the panel can grow into.
      const dcs = getComputedStyle(resumeDialog);
      const limit = parseFloat(dcs.maxBlockSize) || parseFloat(dcs.maxHeight) || resumeDialog.getBoundingClientRect().height;
      const room = Math.max(0, limit - bars - padY);
      return { w: resumeScroll.getBoundingClientRect().width - padX, h: room };
    };

    const measureFit = () => {
      const img = resumePreview;
      if (!img || !img.naturalWidth) return 1;
      const box = availableBox();
      if (box.w <= 0 || !isFinite(box.h)) return resumeFitScale || 1;
      const byWidth = box.w / img.naturalWidth;
      const scale = box.h > 0 ? Math.min(byWidth, box.h / img.naturalHeight) : byWidth;
      return scale || 1;
    };

    // Scale is stored as a fraction of the document's own pixel width, so the
    // label, the rendered size and the scroll area can never disagree. Steps are
    // relative to Fit page: with a ~28% fit scale, absolute 33%/50% steps barely
    // change anything while 100% quadruples the sheet. Relative steps keep every
    // press the same size of change, and the label still reports the real value.
    const ZOOM_RELATIVE = [1, 1.5, 2, 2.5, 3, 3.5, 4];
    const ZOOM_MAX_RELATIVE = 4;   // 4× the fitted page ≈ 100–115% of native size
    const currentPercent = () => Math.round(resumeFitScale * resumeScale * 100);
    const maxScale = () => Math.min(ZOOM_MAX_RELATIVE, ZOOM_MAX_WIDTH / Math.max(0.0001, resumeFitScale));

    const applyZoom = () => {
      const w = Math.round(resumePreview.naturalWidth * resumeFitScale * resumeScale);
      resumePreview.style.width = w + 'px';
      resumePreview.style.height = 'auto';
      resumeZoomLabel.textContent = resumeZoomReset ? 'Fit page' : currentPercent() + '%';
      resumeZoomOut.disabled = resumeZoomReset || resumeScale <= ZOOM_MIN;
      resumeZoomIn.disabled = resumeScale >= maxScale() - 0.001;
    };

    // Restore the viewer's centre, not the document's top-left, when re-scaling.
    const setZoom = (next, { center = true } = {}) => {
      const from = resumeScale;
      if (!resumeFitScale) resumeFitScale = measureFit();
      const target = Math.min(maxScale(), Math.max(ZOOM_MIN, next));
      if (Math.abs(target - from) < 0.001) return;
      const box = resumeScroll;
      const cx = (box.scrollLeft + box.clientWidth / 2) / Math.max(1, box.scrollWidth);
      const cy = (box.scrollTop + box.clientHeight / 2) / Math.max(1, box.scrollHeight);
      resumeScale = target;
      resumeZoomReset = Math.abs(target - ZOOM_MIN) < 0.001;
      // Animate every zoom change, in and out, including returns to Fit page.
      resumeScroll.classList.add('is-zooming');
      clearTimeout(resumeZoomTimer);
      resumeZoomTimer = setTimeout(() => resumeScroll.classList.remove('is-zooming'), 240);
      applyZoom();
      // Switch the viewport between "centred page" and "scrollable sheet".
      resumeScroll.classList.toggle('is-fitted', resumeZoomReset);
      const newW = resumePreview.offsetWidth, newH = resumePreview.offsetHeight;
      if (resumeZoomReset) {
        box.scrollLeft = 0; box.scrollTop = 0;
      } else if (center) {
        box.scrollLeft = cx * (newW + 8) - box.clientWidth / 2;
        box.scrollTop = cy * (newH + 16) - box.clientHeight / 2;
      } else {
        box.scrollLeft = 0; box.scrollTop = 0;
      }
    };
    const fitResume = ({ animate = false } = {}) => {
      resumeFitScale = measureFit();
      resumeScale = ZOOM_MIN;
      resumeZoomReset = true;
      if (animate) {
        resumeScroll.classList.add('is-zooming');
        clearTimeout(resumeZoomTimer);
        resumeZoomTimer = setTimeout(() => resumeScroll.classList.remove('is-zooming'), 240);
      } else {
        resumeScroll.classList.remove('is-zooming');
        clearTimeout(resumeZoomTimer);
      }
      clearTimeout(resumeZoomTimer);
      if (animate) resumeZoomTimer = setTimeout(() => resumeScroll.classList.remove('is-zooming'), 240);
      applyZoom();
      resumeScroll.classList.add('is-fitted');
      resumeScroll.scrollLeft = 0;
      resumeScroll.scrollTop = 0;
    };
    // Each press moves one relative step: Fit page → 1.5× → 2× → 2.5× …
    const zoomStep = direction => {
      if (!resumeFitScale) resumeFitScale = measureFit();
      const from = resumeScale;
      const next = direction > 0
        ? (ZOOM_RELATIVE.find(s => s > from + 0.001) || ZOOM_MAX_RELATIVE)
        : ([...ZOOM_RELATIVE].reverse().find(s => s < from - 0.001) || ZOOM_MIN);
      setZoom(next);
    };

    const canShowResume = typeof resumeDialog.showModal === 'function';
    const openResume = trigger => {
      if (!canShowResume) { location.href = resumePdf; return; }
      resumeTrigger = trigger;
      const pageScroll = scrollY, pageScrollX = scrollX;
      const wasOpen = resumeDialog.open;
      resumeDialog.showModal();
      fitResume();
      // A freshly opened dialog has no layout yet; measure again once it does.
      // Focus the sheet, not Close: the page behind cannot scroll, and Enter does
      // not immediately re-trigger the close button.
      resumeScroll.focus({ preventScroll: true });
      if (!wasOpen) {
        // Re-fit once the dialog's bars and image have their final sizes.
        const settle = () => { if (!resumeDialog.open) return; if (resumeZoomReset) fitResume(); else setZoom(resumeScale, { center: false }); };
        requestAnimationFrame(settle);
        setTimeout(settle, 80);
        setTimeout(settle, 260);
      }
      if (scrollY !== pageScroll) scrollTo({ top: pageScroll, left: pageScrollX, behavior: 'instant' });
    };
    const closeResume = () => resumeDialog.close();

    resumeOpeners.forEach(button => {
      button.addEventListener('click', () => openResume(button));
    });
    resumeClose.addEventListener('click', closeResume);
    resumeDialog.addEventListener('click', event => {
      if (event.target === resumeDialog) closeResume();
    });
    // Return focus to the exact control that opened the dialog, keeping the page
    // at the position the visitor left it at instead of jumping to that control.
    resumeDialog.addEventListener('close', () => {
      const target = resumeTrigger;
      const pageScroll = scrollY, pageScrollX = scrollX;
      resumeTrigger = null;
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      if (scrollY !== pageScroll) scrollTo({ top: pageScroll, left: pageScrollX, behavior: 'instant' });
    });
    resumeDialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeResume();
    });

    resumeZoomIn.addEventListener('click', () => zoomStep(1));
    resumeZoomOut.addEventListener('click', () => zoomStep(-1));
    resumeFit.addEventListener('click', () => { fitResume({ animate: true }); resumeScroll.focus({ preventScroll: true }); });

    // Keyboard zoom, but only while the viewer is what the visitor is using.
    resumeDialog.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key;
      if (key === '+' || key === '=') { event.preventDefault(); zoomStep(1); }
      else if (key === '-' || key === '_') { event.preventDefault(); zoomStep(-1); }
      else if (key === '0') { event.preventDefault(); fitResume({ animate: true }); }
    });

    // Refit when the viewport changes, so "Fit page" stays fit after rotation or
    // a window resize. A zoomed sheet keeps its zoom and just re-centres.
    let resumeResizeFrame = 0;
    addEventListener('resize', () => {
      if (!resumeDialog.open) return;
      cancelAnimationFrame(resumeResizeFrame);
      resumeResizeFrame = requestAnimationFrame(() => {
        if (resumeZoomReset) { fitResume(); return; }
        const pct = currentPercent();
        resumeFitScale = measureFit();
        setZoom(pct / 100 / resumeFitScale);
      });
    });

    // Native `download` is preferred. Only step in because a browser would render
    // the PDF in place instead of saving it, so the page never navigates away.
    const saveResume = event => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (typeof fetch !== 'function' || !URL.createObjectURL) return;
      event.preventDefault();
      if (resumeError) { resumeError.hidden = true; resumeError.textContent = ''; }
      fetch(resumePdf, { credentials: 'same-origin' })
        .then(response => {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.blob();
        })
        .then(blob => {
          // Make sure the saved file keeps the PDF type even if the host omits it.
          const objectUrl = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'application/pdf' }));
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = resumeName;
          link.rel = 'noopener';
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        })
        .catch(() => {
          if (!resumeError) { location.href = resumePdf; return; }
          resumeError.textContent = 'The download could not start. Use “Open PDF in browser” instead.';
          resumeError.hidden = false;
        });
    };
    $$('[data-resume-download]').forEach(link => link.addEventListener('click', saveResume));

    // A preview that never loaded can only be reached once the dialog opens,
    // so detect the failure then instead of silently showing an empty box.
    resumePreview.addEventListener('error', () => {
      if (!resumeError) return;
      resumeError.textContent = 'The résumé preview could not load. Use “Download PDF” or “Open PDF in browser”.';
      resumeError.hidden = false;
    });
    if (resumePreview.complete && resumePreview.naturalWidth === 0) {
      resumePreview.dispatchEvent(new Event('error'));
    }
  }

  // The unenhanced page keeps both narratives in normal document flow.
  // Once initialized, each case replaces its summary with its own detail.
  function revealCaseControl(control) {
    if (enh) return;
    const rect = control.getBoundingClientRect();
    const safeTop = hdr.offsetHeight + 12;
    const safeBottom = innerHeight - 12;
    const delta = rect.top < safeTop ? rect.top - safeTop : rect.bottom > safeBottom ? rect.bottom - safeBottom : 0;
    if (delta) window.scrollBy({ top: delta, behavior: reducePreviewMotion.matches ? 'instant' : 'smooth' });
  }
  const caseItems = $$('[data-case]').map(root => {
    const summary = root.querySelector('.case-summary');
    const detail = root.querySelector('.case-detail');
    const open = root.querySelector('.case-toggle');
    const back = root.querySelector('.case-back');
    const heading = detail.querySelector('h3');
    const item = { root, summary, detail, open, back, heading, busy: false };
    detail.hidden = true;
    open.hidden = false;
    back.hidden = false;
    root.classList.add('case-ready');

    const change = showDetail => {
      if (item.busy || (showDetail && !detail.hidden) || (!showDetail && !summary.hidden)) return;
      item.busy = true;
      const scrollAtActivation = scrollY;
      const outgoing = showDetail ? summary : detail;
      const incoming = showDetail ? detail : summary;
      open.setAttribute('aria-expanded', String(showDetail));
      const finish = () => {
        const restoreFocus = outgoing.contains(document.activeElement);
        outgoing.hidden = true;
        outgoing.classList.remove('is-out', 'is-in');
        incoming.hidden = false;
        if (!reducePreviewMotion.matches) {
          incoming.classList.add('is-in');
          setTimeout(() => incoming.classList.remove('is-in'), 200);
        }
        if (showDetail) {
          if (restoreFocus) heading.focus({ preventScroll: true });
          if (restoreFocus || (document.activeElement === document.body && Math.abs(scrollY - scrollAtActivation) < 8)) revealCaseControl(heading);
        } else if (restoreFocus) {
          open.focus({ preventScroll: true });
          revealCaseControl(open);
        }
        item.busy = false;
      };
      if (reducePreviewMotion.matches) finish();
      else {
        outgoing.classList.add('is-out');
        setTimeout(finish, 130);
      }
    };
    open.addEventListener('click', () => change(true));
    back.addEventListener('click', () => change(false));
    return item;
  });

  if (caseItems.length) html.classList.add('has-case-controls');

  // Measure invisible clones so the current state, focus and layout stay intact.
  function naturalCaseHeight(item, state) {
    const clone = state.cloneNode(true);
    clone.hidden = false;
    clone.classList.remove('is-out', 'is-in');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    Object.assign(clone.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: 'auto', visibility: 'hidden', pointerEvents: 'none' });
    item.root.appendChild(clone);
    const height = Math.ceil(clone.getBoundingClientRect().height);
    clone.remove();
    return height;
  }
  function naturalPreviewHeights(figure) {
    const clone = figure.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    Object.assign(clone.style, {
      position: 'absolute', left: '0', top: '0', width: figure.getBoundingClientRect().width + 'px',
      height: 'auto', visibility: 'hidden', pointerEvents: 'none'
    });
    figure.parentElement.appendChild(clone);
    const pages = [...clone.querySelectorAll('[data-demo-view]')];
    const heights = pages.map(page => {
      pages.forEach(other => { other.hidden = other !== page; });
      return Math.ceil(clone.getBoundingClientRect().height);
    });
    clone.remove();
    return heights;
  }
  function measureCases() {
    if (!matchMedia('(min-width:961px)').matches || !enh) {
      caseItems.forEach(item => {
        item.root.style.removeProperty('--case-h');
        const layout = item.root.closest('.feature-layout');
        if (layout) {
          layout.style.removeProperty('--feature-top');
          layout.style.removeProperty('--feature-head-h');
          layout.style.removeProperty('--feature-body-h');
        }
      });
      return false;
    }

    // Reset properties before measuring intrinsic dimensions
    caseItems.forEach(item => {
      const layout = item.root.closest('.feature-layout');
      if (layout) {
        layout.style.removeProperty('--feature-top');
        layout.style.removeProperty('--feature-head-h');
        layout.style.removeProperty('--feature-body-h');
      }
    });

    const caseMetrics = caseItems.map(item => {
      const layout = item.root.closest('.feature-layout');
      const header = layout.querySelector('.feature-head');
      const style = getComputedStyle(layout);
      const minTop = parseFloat(style.paddingTop) || 0;
      const bottom = parseFloat(style.paddingBottom) || 0;
      const gap = parseFloat(style.rowGap) || 0;
      const headerHeight = Math.ceil(header.getBoundingClientRect().height);
      const summaryH = naturalCaseHeight(item, item.summary);
      const detailH = naturalCaseHeight(item, item.detail);
      const caseH = Math.max(summaryH, detailH);
      const figure = item.root.closest('.feature-body').querySelector('.chapter-preview');
      const previews = naturalPreviewHeights(figure);
      const largestRow = Math.max(caseH, ...previews);
      return { item, layout, minTop, bottom, gap, headerHeight, caseH, largestRow };
    });

    // Compute single shared header height and body baseline across all chapters
    const sharedHeaderH = Math.max(...caseMetrics.map(m => m.headerHeight));
    const sharedBodyH = Math.max(...caseMetrics.map(m => m.largestRow));
    const maxMinTop = Math.max(...caseMetrics.map(m => m.minTop));
    const maxBottom = Math.max(...caseMetrics.map(m => m.bottom));
    const maxGap = Math.max(...caseMetrics.map(m => m.gap));
    const clientH = caseMetrics[0] ? caseMetrics[0].layout.clientHeight : 0;
    const available = clientH - maxBottom - sharedHeaderH - maxGap;
    const centeredTop = Math.round(maxMinTop + Math.max(0, (available - maxMinTop - sharedBodyH) / 2));

    let needsVerticalLayout = false;
    // Disable horizontal enhancement if shared layout cannot fit viewport safely or header exceeds reasonable maximum
    if (available - sharedBodyH < maxMinTop - 1 || sharedHeaderH > 180) {
      needsVerticalLayout = true;
    }

    caseMetrics.forEach(m => {
      m.item.root.style.setProperty('--case-h', m.caseH + 'px');
      m.layout.style.setProperty('--feature-head-h', sharedHeaderH + 'px');
      m.layout.style.setProperty('--feature-body-h', sharedBodyH + 'px');
      m.layout.style.setProperty('--feature-top', centeredTop + 'px');
    });

    return needsVerticalLayout;
  }

  /* Math & Track Geometry */
  let maxX = 1, panelStarts = [], footerVisible = false;
  const END_TOLERANCE = 4;
  const islandWrap = document.getElementById('work-island-wrap');
  const workRuler = document.getElementById('work-ruler');
  const workTicks = $$('[data-work-tick]');

  function measureOverview() {
    const main = document.querySelector('.ov-main');
    if (!matchMedia('(min-width:961px)').matches) {
      main.style.removeProperty('--overview-main-h');
      return;
    }
    const frame = main.querySelector('.snippet-frame');
    const clone = frame.cloneNode(true);
    const projectViews = [...clone.querySelectorAll('.snippet-view')].map(view => ({
      view, key: view.id.replace('view-', '')
    }));
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    Object.assign(clone.style, {
      position: 'absolute', left: '0', top: '0', width: frame.getBoundingClientRect().width + 'px',
      height: 'auto', visibility: 'hidden', pointerEvents: 'none'
    });
    const body = clone.querySelector('.snippet-body');
    body.style.removeProperty('height');
    body.style.removeProperty('overflow');
    body.style.removeProperty('transition');
    frame.parentElement.appendChild(clone);
    let tallest = Math.ceil(main.querySelector('.ov-index').getBoundingClientRect().height);
    projectViews.forEach(({ view, key }) => {
      projectViews.forEach(project => project.view.classList.toggle('active', project.view === view));
      clone.querySelector('.snippet-proj-label').textContent = snippetData[key].tag;
      clone.querySelector('.snippet-caption').textContent = snippetData[key].caption;
      const pages = [...view.querySelectorAll('[data-demo-view]')];
      pages.forEach(page => {
        pages.forEach(other => { other.hidden = other !== page; });
        tallest = Math.max(tallest, Math.ceil(clone.getBoundingClientRect().height));
      });
    });
    clone.remove();
    main.style.setProperty('--overview-main-h', tallest + 'px');
  }

  function updateWorkNavigationSpace() {
    // The navigator is absolutely positioned. Measure it without displaying it
    // so chapter introductions can start below it at every supported width.
    const hidden = getComputedStyle(islandWrap).display === 'none';
    const oldDisplay = islandWrap.style.display;
    const oldVisibility = islandWrap.style.visibility;
    if (hidden) { islandWrap.style.visibility = 'hidden'; islandWrap.style.display = 'flex'; }
    const topInset = parseFloat(getComputedStyle(islandWrap).top) || 0;
    const bottom = Math.ceil(topInset + islandWrap.getBoundingClientRect().height);
    islandWrap.style.display = oldDisplay;
    islandWrap.style.visibility = oldVisibility;
    html.style.setProperty('--work-nav-space', bottom + 'px');
  }

  function layout() {
    const hh = hdr.offsetHeight;
    html.style.setProperty('--hh', hh + 'px');
    enh = mq.matches;
    html.classList.toggle('enh', enh);
    if (enh) updateWorkNavigationSpace();
    const caseOverflow = measureCases();
    measureOverview();

    if (enh) {
      // Use actual panel positions, including after zoom/resize, for travel,
      // clickable destinations, and the single ruler's chapter ticks.
      const trackLeft = track.getBoundingClientRect().left;
      panelStarts = panels.map(p => p.getBoundingClientRect().left - trackLeft);
      maxX = Math.max(1, track.scrollWidth - stage.clientWidth);
      workTicks.forEach((tick, i) => {
        tick.style.setProperty('--tick', (panelStarts[i] / maxX * 100).toFixed(3) + '%');
      });

      // Height safety: if content inside any panel overflows stage, fall back to vertical
      const stageH = innerHeight - hh;
      const overflows = panels.some(p => {
        const wrap = p.querySelector('.wrap');
        return wrap && wrap.scrollHeight > stageH - 20;
      });
      if (overflows || caseOverflow) {
        enh = false;
        html.classList.remove('enh');
        measureCases();
      }
    }

    // Direct, responsive travel ratio: verticalTravel = horizontalTravel * 1.0
    const vertTravel = Math.round(maxX * 1.0);
    run.style.height = enh ? (innerHeight - hdr.offsetHeight + vertTravel) + 'px' : '';
    track.style.transform = '';
    update();
  }

  const span = () => Math.max(1, run.offsetHeight - (innerHeight - hdr.offsetHeight));

  // CurX: continuous mapping directly from vertical scroll position
  function curX() {
    if (!enh) return 0;
    const scrollStart = top(run) - hdr.offsetHeight;
    const p = clamp((scrollY - scrollStart) / span());
    return p * maxX;
  }

  // Target scroll position to center panel i
  function dest(i) {
    if (!enh) return top(panels[i]) - hdr.offsetHeight - 8;
    const scrollStart = top(run) - hdr.offsetHeight;
    const t = panelStarts[i] / maxX;
    return scrollStart + t * span();
  }

  function update() {
    queued = false;
    const hh = hdr.offsetHeight;
    const line = scrollY + hh + 20;
    const remaining = Math.max(0, html.scrollHeight - innerHeight - scrollY);
    const footerBottom = footer ? footer.getBoundingClientRect().bottom : Infinity;
    // Document end is primary; a visible footer supports an 8px rounding
    // allowance. Merely seeing the footer is not enough to mark completion.
    const atEnd = remaining <= END_TOLERANCE ||
      (footerVisible && footerBottom <= innerHeight + 8 && remaining <= 8);
    const contact = secs[secs.length - 1];
    const contactEntry = Math.max(0, top(contact) - (innerHeight - hh));
    const lastScroll = Math.max(0, html.scrollHeight - innerHeight);
    // The final section cannot travel all the way past the header. Use its
    // reachable entry-to-document-end range instead of leaving a stalled line.
    const contactProgress = clamp((scrollY - contactEntry) / Math.max(1, lastScroll - contactEntry));

    // Top global navigation progress
    let a = 0;
    secs.forEach((s, i) => { if (top(s) <= line) a = i; });
    if (atEnd || (footerVisible && contact.getBoundingClientRect().top < innerHeight - hh)) a = secs.length - 1;
    if (html.dataset.activeSection !== secs[a].id) html.dataset.activeSection = secs[a].id;
    links.forEach((l, i) => {
      const s = secs[i];
      const p = i === secs.length - 1 && atEnd ? 1 :
        i === secs.length - 1 && i === a ? contactProgress :
        i === a ? clamp((line - top(s)) / s.offsetHeight) : i < a ? 1 : 0;
      l.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      l.classList.toggle('past', i < a);
      l.classList.toggle('at-end', i === secs.length - 1 && atEnd);
      if (i === a) l.setAttribute('aria-current', 'location');
      else l.removeAttribute('aria-current');
    });

    // Work horizontal translation & active marker update
    let cur = 0;
    if (enh) {
      const x = curX();
      track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';

      cur = panelStarts.reduce((nearest, start, i) =>
        Math.abs(start - x) < Math.abs(panelStarts[nearest] - x) ? i : nearest, 0);
      const workProgress = clamp(x / maxX);
      workRuler.style.setProperty('--work-p', workProgress.toFixed(5));



      // Control Floating Work Navigator visibility (only visible during Work stage)
      const scrollStart = top(run) - hh;
      const isWorkActive = scrollY >= scrollStart - 16 && scrollY < scrollStart + span() + 20;
      if (islandWrap) {
        islandWrap.classList.toggle('visible', isWorkActive);
        islandWrap.setAttribute('aria-hidden', isWorkActive ? 'false' : 'true');
      }

    } else {
      workRuler.style.setProperty('--work-p', '0');
      if (islandWrap) {
        islandWrap.classList.remove('visible');
        islandWrap.setAttribute('aria-hidden', 'true');
      }
      panels.forEach((p, i) => {
        if (top(p) <= scrollY + hh + innerHeight * 0.35) cur = i;
      });
      if (top(run) > scrollY + hh + innerHeight * 0.35) cur = -1;
    }

    marks.forEach((m, i) => {
      m.classList.toggle('past', cur >= 0 && i < cur);
      if (i === cur) m.setAttribute('aria-current', 'step');
      else m.removeAttribute('aria-current');
    });
  }

  const sched = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      footerVisible = entries[0].isIntersecting;
      sched();
    }, { threshold: [0, 1] }).observe(footer);
  }

  let navigationId = 0;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function destination(id) {
    const target = document.getElementById(id);
    if (!target) return null;
    const index = panels.indexOf(target);
    return { target, y: Math.max(0, index >= 0 && enh ? dest(index) : top(target) - hdr.offsetHeight - 12) };
  }

  function focusDestination(target) {
    const focus = target.matches('main, p') ? target : (target.querySelector('h1, h2, h3') || target);
    if (!focus.hasAttribute('tabindex')) focus.setAttribute('tabindex', '-1');
    focus.focus({ preventScroll: true });
  }

  function go(id, { historyEntry = false, animate = false, focus = false } = {}) {
    const point = destination(id);
    if (!point) return false;
    const token = ++navigationId;
    if (historyEntry && location.hash !== '#' + id) history.pushState(null, '', '#' + encodeURIComponent(id));
    const targetY = Math.min(point.y, Math.max(0, html.scrollHeight - innerHeight));
    const animated = animate && !motion.matches;
    scrollTo({ top: targetY, behavior: animated ? 'smooth' : 'instant' });
    if (focus) {
      const started = performance.now();
      const finishWhenReached = () => {
        if (token !== navigationId) return;
        if (Math.abs(scrollY - targetY) < 2 || !animated) { focusDestination(point.target); return; }
        if (performance.now() - started < 4000) requestAnimationFrame(finishWhenReached);
      };
      requestAnimationFrame(finishWhenReached);
    }
    return true;
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('download') || a.hasAttribute('data-native') || (a.target && a.target !== '_self')) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (go(id, { historyEntry: true, animate: true, focus: true })) e.preventDefault();
  });

  addEventListener('popstate', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) go(id, { focus: true });
    else { navigationId++; scrollTo({ top: 0, behavior: 'instant' }); }
  });

  // Native same-document hash changes can target an offscreen translated panel.
  addEventListener('hashchange', () => {
    if (!enh) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const index = panels.findIndex(panel => panel.id === id);
    if (index >= 0) setTimeout(() => {
      if (decodeURIComponent(location.hash.slice(1)) === id && Math.abs(scrollY - dest(index)) > 2) go(id, { focus: true });
    }, 80);
  });

  // Keep stage scrollLeft at 0 to avoid native container focus shift
  stage.addEventListener('scroll', () => {
    if (enh && stage.scrollLeft !== 0) stage.scrollLeft = 0;
  });

  // Keyboard accessibility: tabbing into an offscreen panel centers it
  track.addEventListener('focusin', e => {
    if (!enh) return;
    const p = e.target.closest('[data-panel]');
    if (!p) return;
    if (stage.scrollLeft !== 0) stage.scrollLeft = 0;
    const box = e.target.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    // A visible control needs no chapter recentering. Move only when keyboard
    // focus reaches a control outside the horizontally visible stage.
    if (box.left < stageBox.left - 1 || box.right > stageBox.right + 1) {
      scrollTo({ top: dest(panels.indexOf(p)), behavior: 'instant' });
    }
  });

  addEventListener('scroll', sched, { passive: true });
  addEventListener('resize', layout);
  mq.addEventListener('change', layout);
  layout();
  if (location.hash) requestAnimationFrame(() => go(decodeURIComponent(location.hash.slice(1))));
})();
