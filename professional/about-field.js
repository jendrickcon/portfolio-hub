/* One decorative, theme-aware routing field for the complete portfolio.
   Restored simple, lightweight architecture based on commit 8593ee1. */
(() => {
  const canvas = document.getElementById('page-field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let width = 0, height = 0, nodes = [], routes = [];
  let connected = false, frame = 0, lastDraw = 0;
  let lastScrollY = scrollY, lastScrollTime = performance.now(), lastScrollAt = 0;
  let scrollInput = 0, workVelocity = 0, contactCalm = 0;
  const pointer = { x: 0, y: 0, strength: 0, lastMove: 0, inside: false };
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';

  // Quick theme change handler
  window.onFieldThemeChange = () => {
    if (!document.hidden) {
      paint(performance.now(), animated());
    }
  };

  function buildField() {
    const cols = width >= 1450 ? 10 : width >= 769 ? 9 : 6;
    const rows = width >= 1450 ? 6 : 5;
    nodes = [];
    routes = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const id = y * cols + x;
        nodes.push({
          x: width * (.04 + .92 * x / (cols - 1)) + (seed(id + 1) - .5) * 20,
          y: height * (.09 + .82 * y / (rows - 1)) + (seed(id + 61) - .5) * 20,
          tone: seed(id + 201), phase: seed(id + 301) * Math.PI * 2,
          drawX: 0, drawY: 0, active: 0
        });
        if (x > 0 && (x + y) % 3 !== 0) routes.push([id - 1, id]);
        if (y > 0 && (x + y * 2) % 4 === 0) routes.push([id - cols, id]);
      }
    }
  }

  function paint(now, moving) {
    ctx.clearRect(0, 0, width, height);
    const isLight = light(), drift = moving ? 1 - contactCalm : 0;

    // 1. Calculate node positions & modest distance-based activation
    for (const node of nodes) {
      node.drawX = node.x + drift * (Math.sin(now / 1100 + node.phase) * 1.25 - workVelocity * 3.2 * (.4 + node.tone * .6));
      node.drawY = node.y + drift * Math.cos(now / 1400 + node.phase) * .8;
      node.active = pointer.strength ? Math.max(0, 1 - Math.hypot(node.x - pointer.x, node.y - pointer.y) / 145) * pointer.strength : 0;
    }

    // 2. Draw routes in a single lightweight pass (1px crisp stroke, zero shadow blur)
    ctx.lineWidth = 1;
    for (const route of routes) {
      const a = nodes[route[0]], b = nodes[route[1]];
      const active = Math.max(a.active, b.active);
      const alpha = isLight ? (.15 + active * .13) : (.075 + active * .08);
      ctx.strokeStyle = (isLight ? 'rgba(52, 82, 138, ' : 'rgba(151, 173, 193, ') + alpha + ')';
      ctx.beginPath();
      ctx.moveTo(a.drawX, a.drawY);
      if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
        const mid = (a.drawX + b.drawX) / 2 - workVelocity * drift * 2;
        ctx.lineTo(mid, a.drawY);
        ctx.lineTo(mid, b.drawY);
      } else {
        const mid = (a.drawY + b.drawY) / 2;
        ctx.lineTo(a.drawX, mid);
        ctx.lineTo(b.drawX, mid);
      }
      ctx.lineTo(b.drawX, b.drawY);
      ctx.stroke();
    }

    // 3. Draw nodes in a single lightweight pass
    for (const node of nodes) {
      const pulse = drift * (Math.sin(now / 1300 + node.phase) + 1) * .025;
      if (isLight) {
        ctx.fillStyle = node.tone > .86
          ? 'rgba(45, 106, 79, ' + (.36 + pulse + node.active * .20) + ')'
          : 'rgba(52, 82, 138, ' + (.28 + pulse + node.active * .18) + ')';
      } else {
        ctx.fillStyle = node.tone > .86
          ? 'rgba(125, 184, 150, ' + (.17 + pulse + node.active * .20) + ')'
          : 'rgba(161, 182, 200, ' + (.12 + pulse + node.active * .16) + ')';
      }
      const size = node.tone > .86 ? 3 : 2;
      ctx.fillRect(node.drawX - size / 2, node.drawY - size / 2, size, size);
    }
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function tick(now) {
    frame = 0;
    if (!animated()) return;
    if (now - lastDraw >= 32) {
      lastDraw = now;
      const pointerTarget = pointer.inside && now - pointer.lastMove < 100 ? 1 : 0;
      const rate = pointerTarget ? .30 : .45;
      pointer.strength += (pointerTarget - pointer.strength) * rate;
      if (!pointerTarget && pointer.strength < .02) pointer.strength = 0;

      const work = html.dataset.activeSection === 'work' && html.classList.contains('enh');
      const target = work && now - lastScrollAt < 160 ? scrollInput : 0;
      workVelocity += (target - workVelocity) * .15;
      if (!target && Math.abs(workVelocity) < .002) workVelocity = 0;

      const calmTarget = html.dataset.activeSection === 'contact' ? 1 : 0;
      contactCalm += (calmTarget - contactCalm) * .05;
      if (calmTarget && contactCalm > .995) contactCalm = 1;
      if (!calmTarget && contactCalm < .005) contactCalm = 0;

      paint(now, true);
    }
    const calmActive = html.dataset.activeSection === 'contact' ? contactCalm < 0.995 : contactCalm > 0.005;
    if (calmActive || pointer.strength > 0 || (pointer.inside && now - pointer.lastMove < 100) || workVelocity !== 0) {
      frame = requestAnimationFrame(tick);
    }
  }

  function schedule() {
    if (animated() && !frame) frame = requestAnimationFrame(tick);
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    pointer.strength = 0;
    buildField();
    stop();
    paint(performance.now(), animated());
    schedule();
  }

  function onPointer(event) {
    if (!animated() || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.lastMove = performance.now();
    pointer.inside = true;
    schedule();
  }

  function onScroll() {
    const now = performance.now(), delta = scrollY - lastScrollY;
    if (Math.abs(delta) > .5) {
      scrollInput = Math.max(-1, Math.min(1, delta / Math.max(16, now - lastScrollTime) * .45));
      lastScrollAt = now;
    }
    lastScrollY = scrollY;
    lastScrollTime = now;
    schedule();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      pointer.strength = 0;
      workVelocity = 0;
      lastScrollY = scrollY;
      paint(performance.now(), animated());
      schedule();
    }
  }

  function onPreference() {
    stop();
    pointer.inside = false;
    pointer.strength = 0;
    workVelocity = 0;
    paint(performance.now(), animated());
    schedule();
  }

  const themeObserver = 'MutationObserver' in window
    ? new MutationObserver(() => {
        if (!document.hidden) paint(performance.now(), animated());
      })
    : null;

  function connect() {
    if (connected) return;
    connected = true;
    document.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onPreference);
    coarse.addEventListener('change', onPreference);
    if (themeObserver) themeObserver.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    resize();
  }

  function onLeave() {
    pointer.inside = false;
    pointer.strength = 0;
    paint(performance.now(), animated());
  }

  function disconnect() {
    if (!connected) return;
    connected = false;
    stop();
    document.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onPreference);
    coarse.removeEventListener('change', onPreference);
    if (themeObserver) themeObserver.disconnect();
  }

  window.addEventListener('pagehide', disconnect);
  window.addEventListener('pageshow', connect);
  connect();
})();
