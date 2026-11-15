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
  let scrollInput = 0, workVelocity = 0, contactCalm = 0;
  const pointer = { x: 0, y: 0, strength: 0, lastMove: 0, inside: false };
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };
  const animated = () => connected && !document.hidden && !reduced.matches && !coarse.matches && width >= 769 && height >= 300;
  const light = () => html.getAttribute('data-theme') === 'light';

  // Palette interpolation state
  let paletteMix = light() ? 1 : 0;
  let paletteTarget = paletteMix;

  function setPaletteTarget(isLt, animate) {
    paletteTarget = isLt ? 1 : 0;
    if (!animate || reduced.matches) {
      paletteMix = paletteTarget;
    }
    schedule();
  }

  // Exposed for script.js theme transitions
  window.onFieldThemeChange = (newTheme, animate) => {
    setPaletteTarget(newTheme === 'light', animate);
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(cDark, cLight, mix, alphaMult = 1) {
    const r = Math.round(lerp(cDark.r, cLight.r, mix));
    const g = Math.round(lerp(cDark.g, cLight.g, mix));
    const b = Math.round(lerp(cDark.b, cLight.b, mix));
    const a = +(lerp(cDark.a, cLight.a, mix) * alphaMult).toFixed(3);
    return `rgba(${r},${g},${b},${a})`;
  }

  // Color tokens
  const colInactive = { dark: { r: 151, g: 173, b: 193, a: 0.08 }, light: { r: 52, g: 82, b: 138, a: 0.16 } };
  const colCrisp = { dark: { r: 155, g: 185, b: 255, a: 0.85 }, light: { r: 49, g: 95, b: 202, a: 0.82 } };
  const colInner = { dark: { r: 127, g: 166, b: 255, a: 0.45 }, light: { r: 49, g: 95, b: 202, a: 0.35 } };
  const colInnerShadow = { dark: { r: 127, g: 166, b: 255, a: 0.55 }, light: { r: 49, g: 95, b: 202, a: 0.45 } };
  const colOuter = { dark: { r: 127, g: 166, b: 255, a: 0.20 }, light: { r: 49, g: 95, b: 202, a: 0.15 } };
  const colOuterShadow = { dark: { r: 127, g: 166, b: 255, a: 0.35 }, light: { r: 49, g: 95, b: 202, a: 0.28 } };
  const colNodeActive = { dark: { r: 155, g: 185, b: 255, a: 0.60 }, light: { r: 49, g: 95, b: 202, a: 0.65 } };
  const colNodeGlow = { dark: { r: 127, g: 166, b: 255, a: 0.40 }, light: { r: 49, g: 95, b: 202, a: 0.35 } };
  const colNodeIn1 = { dark: { r: 125, g: 184, b: 150, a: 0.17 }, light: { r: 45, g: 106, b: 79, a: 0.36 } };
  const colNodeIn2 = { dark: { r: 161, g: 182, b: 200, a: 0.12 }, light: { r: 52, g: 82, b: 138, a: 0.28 } };

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
        if (x > 0 && (x + y) % 3 !== 0) {
          routes.push({
            u: id - 1, v: id,
            targetStrength: 0, currentStrength: 0,
            targetCenter: 0, currentCenter: 0,
            points: [], segLengths: [], totalLength: 0
          });
        }
        if (y > 0 && (x + y * 2) % 4 === 0) {
          routes.push({
            u: id - cols, v: id,
            targetStrength: 0, currentStrength: 0,
            targetCenter: 0, currentCenter: 0,
            points: [], segLengths: [], totalLength: 0
          });
        }
      }
    }
  }

  function computeRouteGeometry(route, drift) {
    const a = nodes[route.u], b = nodes[route.v];
    let p0, p1, p2, p3;
    if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
      const mid = (a.drawX + b.drawX) / 2 - workVelocity * drift * 2;
      p0 = { x: a.drawX, y: a.drawY };
      p1 = { x: mid, y: a.drawY };
      p2 = { x: mid, y: b.drawY };
      p3 = { x: b.drawX, y: b.drawY };
    } else {
      const mid = (a.drawY + b.drawY) / 2;
      p0 = { x: a.drawX, y: a.drawY };
      p1 = { x: a.drawX, y: mid };
      p2 = { x: b.drawX, y: mid };
      p3 = { x: b.drawX, y: b.drawY };
    }
    const l0 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const l1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const l2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
    route.points = [p0, p1, p2, p3];
    route.segLengths = [l0, l1, l2];
    route.totalLength = l0 + l1 + l2;
  }

  function getPointAtDistance(route, s) {
    const P = route.points, L = route.segLengths;
    if (s <= L[0]) {
      const t = L[0] > 0 ? s / L[0] : 0;
      return { x: P[0].x + t * (P[1].x - P[0].x), y: P[0].y + t * (P[1].y - P[0].y) };
    } else if (s <= L[0] + L[1]) {
      const t = L[1] > 0 ? (s - L[0]) / L[1] : 0;
      return { x: P[1].x + t * (P[2].x - P[1].x), y: P[1].y + t * (P[2].y - P[1].y) };
    } else {
      const t = L[2] > 0 ? (s - L[0] - L[1]) / L[2] : 0;
      return { x: P[2].x + t * (P[3].x - P[2].x), y: P[2].y + t * (P[3].y - P[2].y) };
    }
  }

  function projectPointOnRoute(route, px, py) {
    const P = route.points, L = route.segLengths;
    let minDist = 1e9, bestS = 0;
    let prefix = 0;
    for (let k = 0; k < 3; k++) {
      const pA = P[k], pB = P[k + 1], l = L[k];
      if (l > 0) {
        const dx = pB.x - pA.x, dy = pB.y - pA.y;
        let t = ((px - pA.x) * dx + (py - pA.y) * dy) / (l * l);
        t = Math.max(0, Math.min(1, t));
        const qx = pA.x + t * dx, qy = pA.y + t * dy;
        const d = Math.hypot(px - qx, py - qy);
        if (d < minDist) {
          minDist = d;
          bestS = prefix + t * l;
        }
      }
      prefix += l;
    }
    return { dist: minDist, s: bestS };
  }

  function paint(now, moving) {
    ctx.clearRect(0, 0, width, height);
    const drift = moving ? 1 - contactCalm : 0;

    // Palette interpolation
    if (Math.abs(paletteMix - paletteTarget) > 0.005) {
      paletteMix += (paletteTarget - paletteMix) * 0.18;
    } else {
      paletteMix = paletteTarget;
    }

    // 1. Update node draw positions
    for (const node of nodes) {
      node.drawX = node.x + drift * (Math.sin(now / 1100 + node.phase) * 1.25 - workVelocity * 3.2 * (.4 + node.tone * .6));
      node.drawY = node.y + drift * Math.cos(now / 1400 + node.phase) * .8;
      node.active = 0;
    }

    // 2. Compute route geometries
    for (const route of routes) {
      computeRouteGeometry(route, drift);
    }

    // 3. Find pointer projections and assign target strength for nearest routes
    const activationRadius = 48; // CSS px proximity threshold
    const candidates = [];
    if (pointer.inside && pointer.strength > 0) {
      for (const route of routes) {
        const proj = projectPointOnRoute(route, pointer.x, pointer.y);
        if (proj.dist < activationRadius) {
          candidates.push({ route, dist: proj.dist, s: proj.s });
        }
      }
      candidates.sort((a, b) => a.dist - b.dist);
    }

    // Reset all targets
    for (const route of routes) {
      route.targetStrength = 0;
    }

    // Max 1 primary route, optionally 1 secondary route at lower strength
    if (candidates.length > 0) {
      const prim = candidates[0];
      const primNorm = 1 - prim.dist / activationRadius;
      prim.route.targetStrength = Math.pow(primNorm, 1.3) * pointer.strength;
      prim.route.targetCenter = prim.s;

      if (candidates.length > 1 && candidates[1].dist < 36) {
        const sec = candidates[1];
        const secNorm = 1 - sec.dist / 36;
        sec.route.targetStrength = Math.pow(secNorm, 1.5) * 0.35 * pointer.strength;
        sec.route.targetCenter = sec.s;
      }
    }

    // 4. Update easing for persistent route states
    for (const route of routes) {
      if (route.targetStrength > route.currentStrength) {
        // Fade in: ~160ms
        route.currentStrength += (route.targetStrength - route.currentStrength) * 0.16;
      } else {
        // Fade out: ~350ms
        route.currentStrength += (route.targetStrength - route.currentStrength) * 0.07;
      }
      if (route.targetStrength === 0 && route.currentStrength < 0.005) {
        route.currentStrength = 0;
      }

      // Smooth position travel along route line
      if (route.targetStrength > 0) {
        route.currentCenter += (route.targetCenter - route.currentCenter) * 0.18;
      }
    }

    // 5. Draw flat inactive routes in one crisp background batch (0.7-1px, no shadow)
    ctx.save();
    ctx.lineWidth = 1.0;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = lerpColor(colInactive.dark, colInactive.light, paletteMix);
    ctx.beginPath();
    for (const route of routes) {
      const P = route.points;
      if (P.length === 4) {
        ctx.moveTo(P[0].x, P[0].y);
        ctx.lineTo(P[1].x, P[1].y);
        ctx.lineTo(P[2].x, P[2].y);
        ctx.lineTo(P[3].x, P[3].y);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 6. Draw local route halos for active routes
    const glowRadius = 36; // 36px radius = ~72px total visible glow length along route
    const activeRoutes = routes.filter(r => r.currentStrength > 0.005 && r.totalLength > 0);

    const outerBlur = Math.round(lerp(9, 7, paletteMix));
    const innerBlur = Math.round(lerp(5, 4, paletteMix));

    for (const route of activeRoutes) {
      const center = Math.max(0, Math.min(route.totalLength, route.currentCenter));
      const sMin = Math.max(0, center - glowRadius);
      const sMax = Math.min(route.totalLength, center + glowRadius);
      if (sMax <= sMin) continue;

      const L = route.segLengths;
      const corner1 = L[0];
      const corner2 = L[0] + L[1];

      // Collect ordered sample points along subpath
      const sampleSet = new Set();
      sampleSet.add(sMin);
      sampleSet.add(sMax);
      if (corner1 > sMin && corner1 < sMax) sampleSet.add(corner1);
      if (corner2 > sMin && corner2 < sMax) sampleSet.add(corner2);
      const step = 6; // CSS px per piece
      for (let s = sMin + step; s < sMax; s += step) {
        sampleSet.add(s);
      }
      const sortedS = Array.from(sampleSet).sort((a, b) => a - b);

      // Build pieces with falloff intensities
      const pieces = [];
      for (let i = 0; i < sortedS.length - 1; i++) {
        const sA = sortedS[i], sB = sortedS[i + 1];
        const midS = (sA + sB) / 2;
        const delta = Math.abs(midS - center);
        let falloff = 1;
        if (delta > 10) {
          const u = (delta - 10) / (glowRadius - 10);
          falloff = Math.max(0, Math.pow(1 - u, 2));
        }
        const intensity = route.currentStrength * falloff;
        if (intensity > 0.005) {
          pieces.push({
            pA: getPointAtDistance(route, sA),
            pB: getPointAtDistance(route, sB),
            intensity
          });
        }
      }

      // Update connected nodes if near active glow
      if (center <= glowRadius) {
        const falloffU = Math.max(0, 1 - center / glowRadius);
        nodes[route.u].active = Math.max(nodes[route.u].active, route.currentStrength * falloffU);
      }
      if (route.totalLength - center <= glowRadius) {
        const falloffV = Math.max(0, 1 - (route.totalLength - center) / glowRadius);
        nodes[route.v].active = Math.max(nodes[route.v].active, route.currentStrength * falloffV);
      }

      if (!pieces.length) continue;

      // Pass A: Outer local halo (shadowBlur: 7-10px, line: 1.0px, lighter)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = outerBlur;
      for (const p of pieces) {
        ctx.strokeStyle = lerpColor(colOuter.dark, colOuter.light, paletteMix, p.intensity);
        ctx.shadowColor = lerpColor(colOuterShadow.dark, colOuterShadow.light, paletteMix, p.intensity);
        ctx.beginPath();
        ctx.moveTo(p.pA.x, p.pA.y);
        ctx.lineTo(p.pB.x, p.pB.y);
        ctx.stroke();
      }
      ctx.restore();

      // Pass B: Inner local halo (shadowBlur: 4-5px, line: 1.0px, lighter)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = innerBlur;
      for (const p of pieces) {
        ctx.strokeStyle = lerpColor(colInner.dark, colInner.light, paletteMix, p.intensity);
        ctx.shadowColor = lerpColor(colInnerShadow.dark, colInnerShadow.light, paletteMix, p.intensity);
        ctx.beginPath();
        ctx.moveTo(p.pA.x, p.pA.y);
        ctx.lineTo(p.pB.x, p.pB.y);
        ctx.stroke();
      }
      ctx.restore();

      // Pass C: Crisp local highlight (shadowBlur: 0, line: 1.0px, source-over)
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;
      for (const p of pieces) {
        ctx.strokeStyle = lerpColor(colCrisp.dark, colCrisp.light, paletteMix, p.intensity);
        ctx.beginPath();
        ctx.moveTo(p.pA.x, p.pA.y);
        ctx.lineTo(p.pB.x, p.pB.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. Draw nodes
    for (const node of nodes) {
      const pulse = drift * (Math.sin(now / 1300 + node.phase) + 1) * .025;
      if (node.active > 0.01) {
        // Subtle glowing active node
        ctx.save();
        ctx.shadowColor = lerpColor(colNodeGlow.dark, colNodeGlow.light, paletteMix, node.active);
        ctx.shadowBlur = innerBlur;
        ctx.fillStyle = lerpColor(colNodeActive.dark, colNodeActive.light, paletteMix, 0.45 + pulse + node.active * 0.45);
        const size = node.tone > .86 ? 3 : 2;
        ctx.fillRect(node.drawX - size / 2, node.drawY - size / 2, size, size);
        ctx.restore();
      } else {
        // Flat inactive node
        ctx.shadowBlur = 0;
        const colDef = node.tone > .86 ? colNodeIn1 : colNodeIn2;
        ctx.fillStyle = lerpColor(colDef.dark, colDef.light, paletteMix, 1.0 + pulse);
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
    if (now - lastDraw >= 32) {
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

    const hasActiveGlow = routes.some(r => r.currentStrength > 0.005 || r.targetStrength > 0);
    const paletteChanging = Math.abs(paletteMix - paletteTarget) > 0.005;

    if (contactCalm < 1 || pointer.strength || hasActiveGlow || paletteChanging || (pointer.inside && now - pointer.lastMove < 800) || workVelocity) {
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
    setPaletteTarget(light(), false);
    paint(performance.now(), animated());
    schedule();
  }

  const themeObserver = 'MutationObserver' in window
    ? new MutationObserver(() => {
        if (!document.hidden) setPaletteTarget(light(), !reduced.matches);
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
    for (const route of routes) {
      route.targetStrength = 0;
    }
    schedule();
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
