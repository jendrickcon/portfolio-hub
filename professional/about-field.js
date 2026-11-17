/* One decorative, theme-aware routing field for the complete portfolio.
   Lightweight by design: one fixed canvas, plain strokes plus at most one
   restrained local route halo (one blurred pass + one crisp highlight pass on
   the single nearest route), direct distance projection (no trailing center),
   and a single shared requestAnimationFrame loop that stops when idle. */
(() => {
  const canvas = document.getElementById('page-field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const noHover = matchMedia('(hover: none)');
  const PARALLAX = 10;            // total horizontal travel (CSS px) across the Work sequence
  const HOLD = 40;                // ms before halo begins fading out after last pointer move
  const FADE_IN_MS = 100;         // halo fade-in duration (80-120ms target)
  const FADE_OUT_MS = 155;        // halo fade-out duration (140-200ms target; 40+155=195ms <= 220ms)
  const HALO_LEN = 50;            // local route highlight length (40-60 CSS px target)
  const MAX_HALO_DIST = 80;       // max pointer-to-route capture radius (CSS px; falloff reaches 0 cleanly)
  let width = 0, height = 0, nodes = [], routes = [];
  let connected = false, frame = 0, lastOffsetX = 0, lastTick = 0;
  let haloRoute = -1, haloIntensity = 0, haloTarget = 0;
  const pointer = { x: 0, y: 0, lastMove: 0, inside: false };
  const clamp = v => Math.max(0, Math.min(1, v));
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && !noHover.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';
  const workOn = () => animated() && html.classList.contains('enh') && window.__portfolioWorkActive === true && html.dataset.activeSection === 'work';
  const workProgress = () => clamp(window.__portfolioWorkProgress || 0);
  const targetOffsetX = () => workOn() ? (workProgress() - .5) * PARALLAX : 0;

  // Theme changes and Work progress updates repaint once at the current geometry.
  window.onFieldThemeChange = () => { if (!document.hidden) paint(); };
  window.onFieldWorkChange = () => {
    if (animated() && Math.abs(targetOffsetX() - lastOffsetX) > .0005 && !frame) paint();
  };

  function makeRoute(u, v) {
    const a = nodes[u], b = nodes[v];
    let x1, y1, x2, y2;
    if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
      const mid = (a.x + b.x) / 2;
      x1 = mid; y1 = a.y;
      x2 = mid; y2 = b.y;
    } else {
      const mid = (a.y + b.y) / 2;
      x1 = a.x; y1 = mid;
      x2 = b.x; y2 = mid;
    }
    const pts = [a.x, a.y, x1, y1, x2, y2, b.x, b.y];
    const l0 = Math.hypot(x1 - a.x, y1 - a.y);
    const l1 = Math.hypot(x2 - x1, y2 - y1);
    const l2 = Math.hypot(b.x - x2, b.y - y2);
    const totalLen = l0 + l1 + l2;
    return {
      u, v, pts,
      lens: [l0, l1, l2],
      cum: [0, l0, l0 + l1, totalLen],
      totalLen,
      minX: Math.min(a.x, x1, x2, b.x),
      maxX: Math.max(a.x, x1, x2, b.x),
      minY: Math.min(a.y, y1, y2, b.y),
      maxY: Math.max(a.y, y1, y2, b.y)
    };
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
          tone: seed(id + 201), active: 0
        });
        if (x > 0 && (x + y) % 3 !== 0) routes.push(makeRoute(id - 1, id));
        if (y > 0 && (x + y * 2) % 4 === 0) routes.push(makeRoute(id - cols, id));
      }
    }
  }

  // Direct nearest-point projection across routes: returns at most 1 route and arc length.
  function projectNearest(px, py) {
    let bestIdx = -1, bestS = 0, bestDist2 = MAX_HALO_DIST * MAX_HALO_DIST;
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (r.totalLen < 20) continue;
      if (px < r.minX - MAX_HALO_DIST || px > r.maxX + MAX_HALO_DIST ||
          py < r.minY - MAX_HALO_DIST || py > r.maxY + MAX_HALO_DIST) continue;
      const pts = r.pts;
      for (let seg = 0; seg < 3; seg++) {
        const len = r.lens[seg];
        if (len <= 0) continue;
        const ax = pts[seg * 2], ay = pts[seg * 2 + 1];
        const bx = pts[seg * 2 + 2], by = pts[seg * 2 + 3];
        const dx = bx - ax, dy = by - ay;
        const t = clamp(((px - ax) * dx + (py - ay) * dy) / (len * len));
        const qx = ax + dx * t, qy = ay + dy * t;
        const d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
        if (d2 < bestDist2) {
          bestDist2 = d2;
          bestIdx = i;
          bestS = r.cum[seg] + t * len;
        }
      }
    }
    if (bestIdx < 0) return null;
    const dist = Math.sqrt(bestDist2);
    return { routeIndex: bestIdx, sProj: bestS, falloff: clamp(1 - dist / MAX_HALO_DIST) };
  }

  function extractSegment(route, s0, s1) {
    const coords = [];
    for (let seg = 0; seg < 3; seg++) {
      const len = route.lens[seg];
      if (len <= 0) continue;
      const aS = route.cum[seg], bS = route.cum[seg + 1];
      if (bS < s0 || aS > s1) continue;
      const t0 = clamp((Math.max(aS, s0) - aS) / len);
      const t1 = clamp((Math.min(bS, s1) - aS) / len);
      const pts = route.pts;
      const ax = pts[seg * 2], ay = pts[seg * 2 + 1];
      const dx = pts[seg * 2 + 2] - ax, dy = pts[seg * 2 + 3] - ay;
      if (coords.length === 0) coords.push(ax + dx * t0, ay + dy * t0);
      if (t1 > t0) coords.push(ax + dx * t1, ay + dy * t1);
    }
    return coords;
  }

  function tracePolyline(coords) {
    ctx.beginPath();
    ctx.moveTo(coords[0], coords[1]);
    for (let i = 2; i < coords.length; i += 2) ctx.lineTo(coords[i], coords[i + 1]);
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    const isLight = light();
    const fieldOffsetX = targetOffsetX();
    lastOffsetX = fieldOffsetX;

    const px = pointer.x - fieldOffsetX;
    const py = pointer.y;
    const proj = animated() && haloIntensity > 0 ? projectNearest(px, py) : null;

    ctx.save();
    if (fieldOffsetX !== 0) ctx.translate(fieldOffsetX, 0);

    // 1. Calm static routing lines (no whole-route brightening).
    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? 'rgba(52, 82, 138, .15)' : 'rgba(151, 173, 193, .075)';
    for (const r of routes) {
      tracePolyline(r.pts);
      ctx.stroke();
    }

    // 2. Local route halo around the direct nearest-point projection on max 1 route.
    if (proj && haloIntensity > .005) {
      const route = routes[proj.routeIndex];
      const half = HALO_LEN / 2;
      const s0 = Math.max(0, proj.sProj - half);
      const s1 = Math.min(route.totalLen, proj.sProj + half);
      const seg = extractSegment(route, s0, s1);
      if (seg.length >= 4) {
        const sx = seg[0], sy = seg[1], ex = seg[seg.length - 2], ey = seg[seg.length - 1];
        if (Math.hypot(ex - sx, ey - sy) >= 2) {
          const strength = haloIntensity * proj.falloff;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Pass 1: single restrained blurred glow pass (2-4px radius).
          const glowGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          const gCol = isLight
            ? `rgba(52, 98, 204, ${(0.18 * strength).toFixed(3)})`
            : `rgba(154, 188, 232, ${(0.24 * strength).toFixed(3)})`;
          glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
          glowGrad.addColorStop(.5, gCol);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.save();
          ctx.lineWidth = isLight ? .95 : 1;
          ctx.shadowBlur = isLight ? 2.2 : 3;
          ctx.shadowColor = isLight
            ? `rgba(52, 98, 204, ${(0.22 * strength).toFixed(3)})`
            : `rgba(145, 180, 226, ${(0.34 * strength).toFixed(3)})`;
          ctx.strokeStyle = glowGrad;
          tracePolyline(seg);
          ctx.stroke();
          ctx.restore();

          // Pass 2: crisp 0.9-1.0px local core highlight (no blur).
          const coreGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          const cCol = isLight
            ? `rgba(42, 84, 186, ${(0.42 * strength).toFixed(3)})`
            : `rgba(196, 218, 244, ${(0.40 * strength).toFixed(3)})`;
          coreGrad.addColorStop(0, 'rgba(0,0,0,0)');
          coreGrad.addColorStop(.5, cCol);
          coreGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.lineWidth = isLight ? .9 : .95;
          ctx.strokeStyle = coreGrad;
          tracePolyline(seg);
          ctx.stroke();
        }
      }
    }

    // 3. Nodes with modest local proximity (no shadowBlur on nodes).
    for (const node of nodes) {
      const act = animated() && haloIntensity > 0
        ? Math.max(0, 1 - Math.hypot(node.x - px, node.y - py) / 96) * haloIntensity
        : 0;
      ctx.fillStyle = isLight
        ? (node.tone > .86 ? 'rgba(45, 106, 79, ' + (.36 + act * .18) + ')' : 'rgba(52, 82, 138, ' + (.28 + act * .16) + ')')
        : (node.tone > .86 ? 'rgba(125, 184, 150, ' + (.17 + act * .18) + ')' : 'rgba(161, 182, 200, ' + (.12 + act * .15) + ')');
      const size = node.tone > .86 ? 3 : 2;
      ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
    }

    ctx.restore();
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTick = 0;
  }

  // The only animation loop. Runs while halo is active/fading or Work offset changes;
  // stops cleanly <= 200ms after pointer stops or leaves.
  function tick(now) {
    frame = 0;
    if (!animated()) return;

    const dt = lastTick ? Math.min(50, Math.max(1, now - lastTick)) : 16.7;
    lastTick = now;

    const hold = pointer.inside && now - pointer.lastMove < HOLD;
    const px = pointer.x - targetOffsetX();
    const proj = (hold || haloIntensity > 0) && pointer.inside ? projectNearest(px, pointer.y) : null;

    if (hold && proj) {
      if (proj.routeIndex !== haloRoute) {
        // Switching to another route: old stops immediately (max 1 route), new fades in at current projection.
        haloRoute = proj.routeIndex;
        haloIntensity = 0;
      }
      haloTarget = 1;
    } else {
      haloTarget = 0;
    }

    const prevIntensity = haloIntensity;
    if (haloIntensity < haloTarget) {
      haloIntensity = Math.min(haloTarget, haloIntensity + dt / FADE_IN_MS);
    } else if (haloIntensity > haloTarget) {
      haloIntensity = Math.max(haloTarget, haloIntensity - dt / FADE_OUT_MS);
      if (haloIntensity === 0) haloRoute = -1;
    }

    const offsetChanged = Math.abs(targetOffsetX() - lastOffsetX) > .0005;
    if (haloIntensity > 0 || prevIntensity > 0 || offsetChanged) paint();

    if (haloTarget > 0 || haloIntensity > 0) frame = requestAnimationFrame(tick);
    else lastTick = 0;
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
    haloIntensity = 0;
    haloTarget = 0;
    haloRoute = -1;
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
    haloTarget = 0;
    if (haloIntensity > 0) schedule();
  }

  // Work progress is published by script.js; a scroll only schedules when offset changes.
  function onScroll() {
    if (animated() && Math.abs(targetOffsetX() - lastOffsetX) > .0005) schedule();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      haloIntensity = 0;
      haloTarget = 0;
      haloRoute = -1;
      paint();
    }
  }

  function onPreference() {
    stop();
    pointer.inside = false;
    haloIntensity = 0;
    haloTarget = 0;
    haloRoute = -1;
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
    noHover.addEventListener('change', onPreference);
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
    noHover.removeEventListener('change', onPreference);
    if (themeObserver) themeObserver.disconnect();
  }

  window.addEventListener('pagehide', disconnect);
  window.addEventListener('pageshow', connect);
  connect();
})();
