
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
    'udm-radar': { tag: 'UDM-RADAR // STUDENT PORTAL', href: '#udm-radar', caption: 'Current CCS light-theme student interface · synthetic example.' },
    'studyquest': { tag: 'STUDYQUEST // LEARNING PATH', href: '#studyquest', caption: 'Course, review and assessment interfaces · sample content.' },
    'mini-pcs': { tag: 'MINI PCS // BATCH WORKFLOW', href: '#mini-pcs', caption: 'Batch and task workflow · sample records.' }
  };
  const frows = $$('.frow'), views = $$('.snippet-view'), mtabs = $$('.mtab');
  document.querySelector('.mobile-tabs').hidden = false;
  const snippetTag = document.getElementById('snippet-tag');
  const snippetJump = document.getElementById('snippet-jump-link');

  function setSnippet(key) {
    if (!snippetData[key]) return;
    frows.forEach(r => {
      const match = r.dataset.target === key;
      r.classList.toggle('active', match);
      const stateEl = r.querySelector('.state');
      if (stateEl) stateEl.textContent = match ? 'Previewing snippet' : 'Hover to inspect';
    });
    mtabs.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === key);
      b.setAttribute('aria-pressed', String(b.dataset.tab === key));
    });
    views.forEach(v => {
      v.classList.toggle('active', v.id === 'view-' + key);
    });
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
    const select = button => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      pages.forEach(page => { page.hidden = page.dataset.demoView !== button.dataset.demoTarget; });
    };
    buttons.forEach(button => {
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') select(button);
      });
      button.addEventListener('focus', () => select(button));
      button.addEventListener('click', () => select(button));
    });
  });

  // A single persistent preview for supporting work; links remain independent.
  const supportData = {
    audiary: ['AUDIARY', 'SOURCE-FAITHFUL RECONSTRUCTION', 'Audiary Explore interface and README · illustrative offline collection.'],
    laya: ['LAYA', 'PLACEHOLDER', 'LAYA repository · device verification pending.'],
    waffle: ['WAFFLE’S NINE LIVES', 'SOURCE-FAITHFUL RECONSTRUCTION', 'Waffle’s Nine Lives Renderer.kt and Palette.kt · illustrative gameplay.'],
    gallery: ['ENUHRI ART GALLERY', 'PLACEHOLDER', 'Portfolio Hub Art Gallery source · security and rendering work remains.'],
    cyber: ['CYBERDEFENDER', 'SOURCE-FAITHFUL RECONSTRUCTION', 'CyberDefender web battle interface · illustrative encounter.'],
    sandbox: ['SANDBOX', 'SOURCE-FAITHFUL RECONSTRUCTION', 'Sandbox canvas and toolbar source · static illustration.'],
    devpath: ['DEVPATH', 'PLACEHOLDER', 'DevPath source · development paused.']
  };
  const supportCards = $$('[data-support-card]'), supportViews = $$('[data-support-view]');
  function selectSupport(key) {
    const data = supportData[key];
    if (!data) return;
    supportCards.forEach(card => {
      const selected = card.dataset.supportCard === key;
      card.classList.toggle('active', selected);
      card.querySelector('[data-support-target]').setAttribute('aria-pressed', String(selected));
    });
    supportViews.forEach(view => { view.hidden = view.dataset.supportView !== key; });
    document.getElementById('support-name').textContent = data[0];
    document.getElementById('support-evidence').textContent = data[1];
    document.getElementById('support-caption').textContent = data[2];
  }
  supportCards.forEach(card => {
    const button = card.querySelector('[data-support-target]');
    button.hidden = false;
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') selectSupport(card.dataset.supportCard);
    });
    card.addEventListener('focusin', () => selectSupport(card.dataset.supportCard));
    button.addEventListener('click', () => selectSupport(card.dataset.supportCard));
  });

  /* Math & Track Geometry */
  let maxX = 1, panelStarts = [], footerVisible = false;
  const END_TOLERANCE = 4;
  const islandWrap = document.getElementById('work-island-wrap');
  const workRuler = document.getElementById('work-ruler');
  const workTicks = $$('[data-work-tick]');
  const ovEdge = document.getElementById('ov-trans-edge');

  function layout() {
    const hh = hdr.offsetHeight;
    html.style.setProperty('--hh', hh + 'px');
    enh = mq.matches && !document.querySelector('.case-more[open]');
    html.classList.toggle('enh', enh);

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
      if (overflows) {
        enh = false;
        html.classList.remove('enh');
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
  document.querySelectorAll('.case-more').forEach(detail => {
    detail.addEventListener('toggle', () => {
      const panel = detail.closest('[data-panel]');
      layout();
      if (detail.open) detail.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      else if (panel && enh) go(panel.id);
    });
  });
  layout();
  if (location.hash) requestAnimationFrame(() => go(decodeURIComponent(location.hash.slice(1))));
})();
