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
  const PARALLAX = 8;             // total horizontal travel (CSS px: 0px at Overview start to 8px at Projects end)
  const BOUNDARY_MS = 130;        // exit/re-entry boundary interpolation (100-140ms) at Projects <-> Capabilities
  const HOLD = 40;                // ms before halo begins fading out after last pointer move
  const FADE_IN_MS = 115;         // halo fade-in duration
  const FADE_OUT_MS = 180;        // halo fade-out duration (40+180=220ms idle stop)
  const HALO_LEN = 85;            // local route highlight length (CSS px)
  const MAX_HALO_DIST = 110;      // max pointer-to-route capture radius (CSS px; falloff reaches 0 cleanly)
  let width = 0, height = 0, nodes = [], routes = [];
  let connected = false, frame = 0, lastOffsetX = 0, lastTick = 0;
  let haloRoute = -1, haloIntensity = 0, haloTarget = 0;
  let boundaryBlend = 0, blendFrom = 0, blendTo = 0, blendStart = 0, lastActiveProgress = 0, lastWorkOn = false;
  const pointer = { x: 0, y: 0, lastMove: 0, inside: false };
  const clamp = v => Math.max(0, Math.min(1, v));
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && !noHover.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';
  const workOn = () => animated() && html.classList.contains('enh') && window.__portfolioWorkActive === true;
  const workProgress = () => clamp(window.__portfolioWorkProgress || 0);

  // Exact cubic-bezier(.2, .7, .2, 1) easing without overshoot for boundary return only.
  function easeStandard(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 5; i++) {
      const u2 = u * u, u3 = u2 * u, inv = 1 - u, inv2 = inv * inv;
      const px = 0.6 * inv2 * u + 0.6 * inv * u2 + u3 - x;
      const dx = 0.6 * inv2 - 1.2 * inv * u + 1.2 * inv * u - 0.6 * u2 + 3 * u2;
      if (Math.abs(dx) < 1e-5) break;
      u = clamp(u - px / dx);
    }
    const u2 = u * u, u3 = u2 * u, inv = 1 - u;
    return 2.1 * inv * inv * u + 3 * inv * u2 + u3;
  }

  function syncBoundary(now) {
    if (!animated() || !html.classList.contains('enh')) {
      boundaryBlend = 0; blendFrom = 0; blendTo = 0; blendStart = 0;
      lastActiveProgress = 0; lastWorkOn = false;
      return 0;
    }
    const active = workOn();
    const prog = workProgress();
    if (active !== lastWorkOn) {
      lastWorkOn = active;
      const target = active ? 1 : 0;
      // Direct at Overview boundary (prog near 0 and current offset near 0); interpolate only at Capabilities boundary.
      if (active && prog <= .5 && Math.abs(lastOffsetX) <= .5) {
        boundaryBlend = 1; blendFrom = 1; blendTo = 1; blendStart = 0;
      } else if (!active && lastActiveProgress <= .15 && Math.abs(lastOffsetX) <= 1.2) {
        boundaryBlend = 0; blendFrom = 0; blendTo = 0; blendStart = 0;
      } else {
        blendFrom = boundaryBlend;
        blendTo = target;
        blendStart = now;
      }
    }
    if (active) lastActiveProgress = prog;
    if (blendStart > 0) {
      const t = clamp((now - blendStart) / BOUNDARY_MS);
      boundaryBlend = blendFrom + (blendTo - blendFrom) * easeStandard(t);
      if (t >= 1) {
        boundaryBlend = blendTo;
        blendStart = 0;
        if (!active) lastActiveProgress = 0;
      }
    } else {
      boundaryBlend = active ? 1 : 0;
    }
    const baseProg = active ? prog : lastActiveProgress;
    return baseProg * boundaryBlend * PARALLAX;
  }

  // Theme changes and Work progress updates repaint at the current geometry.
  window.onFieldThemeChange = () => { if (!document.hidden) paint(performance.now()); };
  window.onFieldWorkChange = () => {
    if (!animated()) return;
    const now = performance.now();
    const active = workOn();
    const prog = workProgress();
    const needsBoundaryAnim = (active !== lastWorkOn) && (active ? prog > .5 : lastActiveProgress > .15 || Math.abs(lastOffsetX) > 1.2);
    if (needsBoundaryAnim || blendStart > 0) {
      schedule();
      return;
    }
    const directOffset = active ? prog * PARALLAX : 0;
    if ((active !== lastWorkOn || Math.abs(directOffset - lastOffsetX) > .0005) && !frame) paint(now);
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

  function nearestOnRoute(r, px, py) {
    let bestD2 = Infinity, bestS = 0;
    const pts = r.pts;
    for (let seg = 0; seg < 3; seg++) {
      const len = r.lens[seg];
      if (len <= 0) continue;
      const ax = pts[seg * 2], ay = pts[seg * 2 + 1];
      const dx = pts[seg * 2 + 2] - ax, dy = pts[seg * 2 + 3] - ay;
      const t = clamp(((px - ax) * dx + (py - ay) * dy) / (len * len));
      const qx = ax + dx * t, qy = ay + dy * t;
      const d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
      if (d2 < bestD2) {
        bestD2 = d2;
        bestS = r.cum[seg] + t * len;
      }
    }
    return { d2: bestD2, s: bestS };
  }

  function buildField() {
    const cols = width >= 1280 ? 10 : width >= 769 ? 9 : 6;
    const rows = width >= 1280 ? 6 : 5;
    nodes = [];
    routes = [];
    const seen = new Set();
    const candidates = [];
    const addEdge = (u, v) => {
      const key = u < v ? u + ':' + v : v + ':' + u;
      if (seen.has(key)) return null;
      seen.add(key);
      const r = makeRoute(u, v);
      routes.push(r);
      return r;
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const id = y * cols + x;
        nodes.push({
          x: width * (.04 + .92 * x / (cols - 1)) + (seed(id + 1) - .5) * 20,
          y: height * (.09 + .82 * y / (rows - 1)) + (seed(id + 61) - .5) * 20,
          tone: seed(id + 201), active: 0
        });
        if (x > 0) {
          if ((x + y) % 3 !== 0) addEdge(id - 1, id);
          else candidates.push({ u: id - 1, v: id, order: candidates.length });
        }
        if (y > 0) {
          if ((x + y * 2) % 4 === 0) addEdge(id - cols, id);
          else candidates.push({ u: id - cols, v: id, order: candidates.length });
        }
      }
    }

    // Dead-zone-aware orthogonal bridges (~15% extra routes) to reduce large empty regions without clutter.
    const targetExtra = Math.round(routes.length * .15);
    for (const c of candidates) {
      const a = nodes[c.u], b = nodes[c.v];
      c.mx = (a.x + b.x) / 2;
      c.my = (a.y + b.y) / 2;
      let minD2 = Infinity;
      for (const r of routes) {
        const d2 = nearestOnRoute(r, c.mx, c.my).d2;
        if (d2 < minD2) minD2 = d2;
      }
      c.d2 = minD2;
    }

    for (let k = 0; k < targetExtra && candidates.length; k++) {
      let bestPos = 0;
      for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].d2 > candidates[bestPos].d2) bestPos = i;
      }
      const chosen = candidates.splice(bestPos, 1)[0];
      const added = addEdge(chosen.u, chosen.v);
      if (!added) continue;
      for (const c of candidates) {
        const d2 = nearestOnRoute(added, c.mx, c.my).d2;
        if (d2 < c.d2) c.d2 = d2;
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
      const hit = nearestOnRoute(r, px, py);
      if (hit.d2 < bestDist2) {
        bestDist2 = hit.d2;
        bestIdx = i;
        bestS = hit.s;
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

  function paint(now = performance.now(), offset) {
    ctx.clearRect(0, 0, width, height);
    const isLight = light();
    const fieldOffsetX = typeof offset === 'number' ? offset : syncBoundary(now);
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

          // Pass 1: single outer bloom pass with fixed shadowColor alpha so bloom does not fade quadratically.
          const glowGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          const gCol = isLight
            ? `rgba(52, 98, 204, ${(0.36 * strength).toFixed(3)})`
            : `rgba(140, 182, 242, ${(0.44 * strength).toFixed(3)})`;
          glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
          glowGrad.addColorStop(.22, gCol);
          glowGrad.addColorStop(.78, gCol);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.save();
          ctx.lineWidth = isLight ? 1.25 : 1.3;
          ctx.shadowBlur = isLight ? 4 : 5;
          ctx.shadowColor = isLight
            ? 'rgba(52, 98, 204, 0.78)'
            : 'rgba(145, 180, 226, 0.86)';
          ctx.strokeStyle = glowGrad;
          tracePolyline(seg);
          ctx.stroke();
          ctx.restore();

          // Pass 2: crisp 0.95-1.0px local core highlight (no blur).
          const coreGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          const cCol = isLight
            ? `rgba(37, 82, 192, ${(0.52 * strength).toFixed(3)})`
            : `rgba(205, 226, 252, ${(0.54 * strength).toFixed(3)})`;
          coreGrad.addColorStop(0, 'rgba(0,0,0,0)');
          coreGrad.addColorStop(.22, cCol);
          coreGrad.addColorStop(.78, cCol);
          coreGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.lineWidth = isLight ? .95 : 1;
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

  // The only animation loop. Runs while halo is active/fading or boundary transition is running;
  // stops cleanly <= 200ms after pointer stops or leaves, and <= 140ms on boundary exit.
  function tick(now) {
    frame = 0;
    if (!animated()) return;

    const dt = lastTick ? Math.min(50, Math.max(1, now - lastTick)) : 16.7;
    lastTick = now;

    const fieldOffsetX = syncBoundary(now);
    const offsetChanged = Math.abs(fieldOffsetX - lastOffsetX) > .0005;

    const hold = pointer.inside && now - pointer.lastMove < HOLD;
    const px = pointer.x - fieldOffsetX;
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

    if (haloIntensity > 0 || prevIntensity > 0 || offsetChanged) paint(now, fieldOffsetX);

    if (haloTarget > 0 || haloIntensity > 0 || blendStart > 0) frame = requestAnimationFrame(tick);
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
    blendStart = 0;
    buildField();
    stop();
    paint(performance.now());
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

  // Work progress is published by script.js via window.onFieldWorkChange().
  function onScroll() {
    if (animated() && blendStart > 0) schedule();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      haloIntensity = 0;
      haloTarget = 0;
      haloRoute = -1;
      blendStart = 0;
      paint(performance.now());
    }
  }

  function onPreference() {
    stop();
    pointer.inside = false;
    haloIntensity = 0;
    haloTarget = 0;
    haloRoute = -1;
    boundaryBlend = 0; blendFrom = 0; blendTo = 0; blendStart = 0;
    lastActiveProgress = 0; lastWorkOn = false;
    paint(performance.now());
  }

  const themeObserver = 'MutationObserver' in window
    ? new MutationObserver(() => { if (!document.hidden) paint(performance.now()); })
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
