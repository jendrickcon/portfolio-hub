
(() => {
  const $$ = s => [...document.querySelectorAll(s)];
  const html = document.documentElement, hdr = document.getElementById('hdr');
  const run = document.getElementById('story'), track = run.querySelector('.track');
  const stage = run.querySelector('.stage');
  const footer = document.querySelector('footer');
  const panels = $$('[data-panel]'), marks = $$('[data-mk]'), links = $$('[data-sec]');
  const secs = ['about','work','capabilities','journey','contact'].map(id => document.getElementById(id));
  const mq = matchMedia('(min-width:1024px) and (min-height:600px) and (prefers-reduced-motion:no-preference)');
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = (from, to, value) => { const t = clamp((value - from) / (to - from)); return t * t * (3 - 2 * t); };
  const top = el => el.getBoundingClientRect().top + scrollY;
  let enh = false, queued = false;

  /* Snippet interactive state controller */
  const snippetData = {
    'udm-radar': { tag: 'UDM-RADAR · Student portal', href: '#udm-radar', caption: 'Current CCS light-theme student interface · fictional demo data.' },
    'studyquest': { tag: 'StudyQuest · Learning path', href: '#studyquest', caption: 'Course, review and assessment interfaces · fictional demo data.' },
    'mini-pcs': { tag: 'Mini PCS · Batch workflow', href: '#mini-pcs', caption: 'Batch and task workflow · fictional demo records.' }
  };
  const frows = $$('.frow'), views = $$('.snippet-view'), mtabs = $$('.mtab');
  document.querySelector('.mobile-tabs').hidden = false;
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

  // Keep a direct image link as the fallback when dialogs are unavailable.
  const imageLink = document.querySelector('.audiary-image-link');
  const imageDialog = document.querySelector('.media-lightbox');
  if (imageDialog && typeof imageDialog.showModal === 'function') {
    imageLink.setAttribute('aria-haspopup', 'dialog');
    imageLink.addEventListener('click', event => {
      event.preventDefault();
      imageDialog.showModal();
    });
    imageDialog.querySelector('button').addEventListener('click', () => imageDialog.close());
    imageDialog.addEventListener('click', event => {
      if (event.target === imageDialog) imageDialog.close();
    });
    imageDialog.addEventListener('close', () => imageLink.focus({ preventScroll: true }));
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
    if (!matchMedia('(min-width:961px)').matches) {
      caseItems.forEach(item => {
        item.root.style.removeProperty('--case-h');
        const layout = item.root.closest('.feature-layout');
        layout.style.removeProperty('--feature-top');
        layout.style.removeProperty('--feature-body-h');
      });
      return false;
    }
    let needsVerticalLayout = false;
    caseItems.forEach(item => {
      const layout = item.root.closest('.feature-layout');
      const header = layout.querySelector('.feature-head');
      layout.style.removeProperty('--feature-top');
      const style = getComputedStyle(layout);
      const minTop = parseFloat(style.paddingTop) || 0;
      const bottom = parseFloat(style.paddingBottom) || 0;
      const gap = parseFloat(style.rowGap) || 0;
      const headerHeight = header.getBoundingClientRect().height;
      const summaryH = naturalCaseHeight(item, item.summary);
      const detailH = naturalCaseHeight(item, item.detail);
      const caseH = Math.max(summaryH, detailH);
      const figure = item.root.closest('.feature-body').querySelector('.chapter-preview');
      const previews = naturalPreviewHeights(figure);
      const largestRow = Math.max(caseH, ...previews);

      // Reserve one shared center for the preview and details, keeping both
      // narratives visible and the right column still as preview pages change.
      item.root.style.setProperty('--case-h', caseH + 'px');
      layout.style.setProperty('--feature-body-h', largestRow + 'px');
      if (enh) {
        const available = layout.clientHeight - bottom - headerHeight - gap;
        const centeredTop = minTop + Math.max(0, (available - minTop - largestRow) / 2);
        if (available - largestRow < minTop - 1) needsVerticalLayout = true;
        layout.style.setProperty('--feature-top', centeredTop + 'px');
      }
    });
    return needsVerticalLayout;
  }

  /* Math & Track Geometry */
  let maxX = 1, panelStarts = [], footerVisible = false;
  const END_TOLERANCE = 4;
  const islandWrap = document.getElementById('work-island-wrap');
  const workRuler = document.getElementById('work-ruler');
  const workTicks = $$('[data-work-tick]');
  const ovEdge = document.getElementById('ov-trans-edge');

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

      // A bell-shaped local transition: gently enter and widen, then recede.
      // At the first project's exact destination the blend is fully absent.
      if (ovEdge) {
        const t = clamp(x / Math.max(1, panelStarts[1]));
        const edgeOpacity = smooth(0, .22, t) * (1 - smooth(.62, 1, t));
        const baseWidth = Math.max(96, Math.min(180, stage.clientWidth * .11));
        // Fade the blend's extent, not its opaque Ink join: fading the whole
        // layer exposes Paper at the chapter boundary and creates a pale seam.
        const blendWidth = baseWidth * (.8 + .42 * Math.sin(Math.PI * t)) * edgeOpacity;
        ovEdge.style.opacity = t > 0 && t < 1 ? '1' : '0';
        ovEdge.style.setProperty('--blend-width', blendWidth.toFixed(1) + 'px');
      }
    } else {
      workRuler.style.setProperty('--work-p', '0');

      if (ovEdge) ovEdge.style.opacity = '0';
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

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
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
