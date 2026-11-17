/* One decorative, theme-aware routing field for the complete portfolio.
   Lightweight by design: one fixed canvas, plain strokes and fills (no glow, no
   compositing, no route tracking), direct distance-based pointer response, and
   a single shared requestAnimationFrame loop that stops as soon as nothing changes.
   During the enhanced horizontal Work stage the whole drawing field shifts a few
   pixels opposite the foreground track, derived directly from Work progress
   (no velocity, no spring, no momentum, no delayed chase). */
(() => {
  const canvas = document.getElementById('page-field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const PARALLAX = 10;            // total horizontal travel (CSS px) across the Work sequence
  const HOLD = 100;               // ms the pointer response is held after the last movement
  let width = 0, height = 0, nodes = [], routes = [];
  let connected = false, frame = 0, lastOffsetX = 0;
  const pointer = { x: 0, y: 0, strength: 0, lastMove: 0, inside: false };
  const clamp = v => Math.max(0, Math.min(1, v));
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';
  const workOn = () => animated() && html.classList.contains('enh') && window.__portfolioWorkActive === true && html.dataset.activeSection === 'work';
  const workProgress = () => clamp(window.__portfolioWorkProgress || 0);
  const targetOffsetX = () => workOn() ? (workProgress() - .5) * PARALLAX : 0;

  // Theme changes and Work progress updates repaint once at the current geometry.
  window.onFieldThemeChange = () => { if (!document.hidden) paint(); };
  window.onFieldWorkChange = () => {
    if (animated() && Math.abs(targetOffsetX() - lastOffsetX) > .0005 && !frame) paint();
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
          tone: seed(id + 201), active: 0
        });
        if (x > 0 && (x + y) % 3 !== 0) routes.push([id - 1, id]);
        if (y > 0 && (x + y * 2) % 4 === 0) routes.push([id - cols, id]);
      }
    }
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    const isLight = light();
    const fieldOffsetX = targetOffsetX();
    lastOffsetX = fieldOffsetX;

    const px = pointer.x - fieldOffsetX;
    const py = pointer.y;

    // Direct, distance-based proximity: no stored position along a route.
    for (const node of nodes) {
      node.active = pointer.strength
        ? Math.max(0, 1 - Math.hypot(node.x - px, node.y - py) / 145) * pointer.strength
        : 0;
    }

    ctx.save();
    if (fieldOffsetX !== 0) ctx.translate(fieldOffsetX, 0);

    ctx.lineWidth = 1;
    for (const route of routes) {
      const a = nodes[route[0]], b = nodes[route[1]];
      const active = Math.max(a.active, b.active);
      const alpha = isLight ? (.15 + active * .13) : (.075 + active * .08);
      ctx.strokeStyle = (isLight ? 'rgba(52, 82, 138, ' : 'rgba(151, 173, 193, ') + alpha + ')';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
        const mid = (a.x + b.x) / 2;
        ctx.lineTo(mid, a.y);
        ctx.lineTo(mid, b.y);
      } else {
        const mid = (a.y + b.y) / 2;
        ctx.lineTo(a.x, mid);
        ctx.lineTo(b.x, mid);
      }
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const node of nodes) {
      ctx.fillStyle = isLight
        ? (node.tone > .86 ? 'rgba(45, 106, 79, ' + (.36 + node.active * .20) + ')' : 'rgba(52, 82, 138, ' + (.28 + node.active * .18) + ')')
        : (node.tone > .86 ? 'rgba(125, 184, 150, ' + (.17 + node.active * .20) + ')' : 'rgba(161, 182, 200, ' + (.12 + node.active * .16) + ')');
      const size = node.tone > .86 ? 3 : 2;
      ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
    }

    ctx.restore();
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  // The only animation loop. Every event requests it through schedule();
  // it runs only while pointer response is active or Work offset changed.
  function tick(now) {
    frame = 0;
    if (!animated()) return;

    const hold = pointer.inside && now - pointer.lastMove < HOLD;
    const prevStrength = pointer.strength;
    if (hold || pointer.strength > 0) {
      pointer.strength += ((hold ? 1 : 0) - pointer.strength) * (hold ? .35 : .45);
      if (!hold && pointer.strength < .02) pointer.strength = 0;
    }

    const nextOffset = targetOffsetX();
    const offsetChanged = Math.abs(nextOffset - lastOffsetX) > .0005;
    const pointerActive = hold || pointer.strength > 0 || prevStrength > 0;

    if (pointerActive || offsetChanged) paint();
    if (hold || pointer.strength > 0) frame = requestAnimationFrame(tick);
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
    paint();
  }

  function onPointer(event) {
    if (!animated() || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.lastMove = performance.now();
    pointer.inside = true;
    schedule();
  }

  function onLeave() {
    pointer.inside = false;
    pointer.strength = 0;
    paint();
  }

  // Work progress is published by script.js; a scroll only schedules when offset changes.
  function onScroll() {
    if (animated() && Math.abs(targetOffsetX() - lastOffsetX) > .0005) schedule();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      pointer.strength = 0;
      paint();
    }
  }

  function onPreference() {
    stop();
    pointer.inside = false;
    pointer.strength = 0;
    paint();
  }

  const themeObserver = 'MutationObserver' in window
    ? new MutationObserver(() => { if (!document.hidden) paint(); })
    : null;

  function connect() {
    if (connected) return;
    connected = true;
    document.addEventListener('pointermove', onPointer, { passive: true });
    html.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onPreference);
    coarse.addEventListener('change', onPreference);
    if (themeObserver) themeObserver.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    resize();
  }

  function disconnect() {
    if (!connected) return;
    connected = false;
    stop();
    document.removeEventListener('pointermove', onPointer);
    html.removeEventListener('pointerleave', onLeave);
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
