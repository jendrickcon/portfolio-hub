/* One decorative, theme-aware routing field with line-local glow for the complete portfolio. */
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
  let scrollInput = 0, workVelocity = 0, contactCalm = 0, localActive = false;
  const pointer = { x: 0, y: 0, strength: 0, lastMove: 0, inside: false };
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

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
        if (x > 0 && (x + y) % 3 !== 0) routes.push({ u: id - 1, v: id, active: 0 });
        if (y > 0 && (x + y * 2) % 4 === 0) routes.push({ u: id - cols, v: id, active: 0 });
      }
    }
  }

  function traceRoutePath(route, drift) {
    const a = nodes[route.u], b = nodes[route.v];
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
  }

  function routeDistance(route, px, py, drift) {
    const a = nodes[route.u], b = nodes[route.v];
    if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
      const mid = (a.drawX + b.drawX) / 2 - workVelocity * drift * 2;
      const d1 = distToSegment(px, py, a.drawX, a.drawY, mid, a.drawY);
      const d2 = distToSegment(px, py, mid, a.drawY, mid, b.drawY);
      const d3 = distToSegment(px, py, mid, b.drawY, b.drawX, b.drawY);
      return Math.min(d1, d2, d3);
    } else {
      const mid = (a.drawY + b.drawY) / 2;
      const d1 = distToSegment(px, py, a.drawX, a.drawY, a.drawX, mid);
      const d2 = distToSegment(px, py, a.drawX, mid, b.drawX, mid);
      const d3 = distToSegment(px, py, b.drawX, mid, b.drawX, b.drawY);
      return Math.min(d1, d2, d3);
    }
  }

  function paint(now, moving) {
    ctx.clearRect(0, 0, width, height);
    const isLight = light(), drift = moving ? 1 - contactCalm : 0;
    localActive = false;

    // 1. Calculate node positions
    for (const node of nodes) {
      node.drawX = node.x + drift * (Math.sin(now / 1100 + node.phase) * 1.25 - workVelocity * 3.2 * (.4 + node.tone * .6));
      node.drawY = node.y + drift * Math.cos(now / 1400 + node.phase) * .8;
      node.active = 0;
    }

    // 2. Calculate route activation directly from pointer distance to route geometry
    const activeRadius = 52;
    for (const route of routes) {
      let target = 0;
      if (pointer.inside && pointer.strength > 0) {
        const dist = routeDistance(route, pointer.x, pointer.y, drift);
        if (dist < activeRadius) {
          target = (1 - dist / activeRadius) * pointer.strength;
        }
      }
      route.active = moving ? route.active + (target - route.active) * .22 : 0;
      if (!target && route.active < .003) route.active = 0;
      if (route.active > 0) {
        localActive = true;
        nodes[route.u].active = Math.max(nodes[route.u].active, route.active);
        nodes[route.v].active = Math.max(nodes[route.v].active, route.active);
      }
    }

    // 3. Draw flat inactive routes in one crisp batch (zero shadow)
    ctx.save();
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isLight ? 'rgba(52, 82, 138, 0.16)' : 'rgba(151, 173, 193, 0.08)';
    ctx.beginPath();
    for (const route of routes) {
      if (route.active <= 0.01) traceRoutePath(route, drift);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Draw active routes: Pass 1 - Outer wide soft halo (extends well beyond line geometry)
    const glowColor = isLight ? 'rgba(49, 95, 202, ' : 'rgba(127, 166, 255, ';
    for (const route of routes) {
      if (route.active > 0.01) {
        ctx.save();
        ctx.strokeStyle = glowColor + (isLight ? (0.10 * route.active) : (0.14 * route.active)) + ')';
        ctx.shadowColor = glowColor + (isLight ? (0.22 * route.active) : (0.30 * route.active)) + ')';
        ctx.shadowBlur = isLight ? 12 : 14;
        ctx.lineWidth = 6.5 + 2.0 * route.active;
        ctx.beginPath();
        traceRoutePath(route, drift);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Draw active routes: Pass 2 - Inner halo (focused luminous core hugging the line)
    for (const route of routes) {
      if (route.active > 0.01) {
        ctx.save();
        ctx.strokeStyle = glowColor + (isLight ? (0.18 * route.active) : (0.24 * route.active)) + ')';
        ctx.shadowColor = glowColor + (isLight ? (0.30 * route.active) : (0.40 * route.active)) + ')';
        ctx.shadowBlur = isLight ? 5 : 6;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        traceRoutePath(route, drift);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. Draw active routes: Pass 3 - Crisp top stroke (exact 1px vector line, zero shadow)
    const topColor = isLight ? 'rgba(49, 95, 202, ' : 'rgba(180, 205, 235, ';
    for (const route of routes) {
      if (route.active > 0.01) {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        const topAlpha = isLight ? (0.28 + 0.45 * route.active) : (0.16 + 0.52 * route.active);
        ctx.strokeStyle = topColor + topAlpha + ')';
        ctx.beginPath();
        traceRoutePath(route, drift);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 7. Draw nodes
    for (const node of nodes) {
      const pulse = drift * (Math.sin(now / 1300 + node.phase) + 1) * .025;
      if (node.active > 0.01) {
        // Glowing active node
        ctx.save();
        ctx.shadowColor = glowColor + (isLight ? 0.3 * node.active : 0.4 * node.active) + ')';
        ctx.shadowBlur = isLight ? 6 : 7;
        ctx.fillStyle = isLight
          ? 'rgba(49, 95, 202, ' + (.45 + pulse + node.active * .40) + ')'
          : 'rgba(127, 166, 255, ' + (.30 + pulse + node.active * .45) + ')';
        const size = node.tone > .86 ? 3.5 : 2.5;
        ctx.fillRect(node.drawX - size / 2, node.drawY - size / 2, size, size);
        ctx.restore();
      } else {
        // Flat inactive node
        ctx.shadowBlur = 0;
        if (isLight) {
          ctx.fillStyle = node.tone > .86
            ? 'rgba(45, 106, 79, ' + (.36 + pulse) + ')'
            : 'rgba(52, 82, 138, ' + (.28 + pulse) + ')';
        } else {
          ctx.fillStyle = node.tone > .86
            ? 'rgba(125, 184, 150, ' + (.17 + pulse) + ')'
            : 'rgba(161, 182, 200, ' + (.12 + pulse) + ')';
        }
        const size = node.tone > .86 ? 3 : 2;
        ctx.fillRect(node.drawX - size / 2, node.drawY - size / 2, size, size);
      }
    }
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function tick(now) {
    frame = 0;
    if (!animated()) return;
    if (now - lastDraw >= 34) {
      lastDraw = now;
      const pointerTarget = pointer.inside && now - pointer.lastMove < 800 ? 1 : 0;
      pointer.strength += (pointerTarget - pointer.strength) * .12;
      if (!pointerTarget && pointer.strength < .015) pointer.strength = 0;
      const work = html.dataset.activeSection === 'work' && html.classList.contains('enh');
      const target = work && now - lastScrollAt < 160 ? scrollInput : 0;
      workVelocity += (target - workVelocity) * .12;
      if (!target && Math.abs(workVelocity) < .002) workVelocity = 0;
      const calmTarget = html.dataset.activeSection === 'contact' ? 1 : 0;
      contactCalm += (calmTarget - contactCalm) * .035;
      if (calmTarget && contactCalm > .995) contactCalm = 1;
      if (!calmTarget && contactCalm < .005) contactCalm = 0;
      paint(now, true);
    }
    if (contactCalm < 1 || pointer.strength || localActive || (pointer.inside && now - pointer.lastMove < 800) || workVelocity) {
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
    ? new MutationObserver(() => { if (!document.hidden) paint(performance.now(), animated()); })
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
  function onLeave() { pointer.inside = false; }
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
