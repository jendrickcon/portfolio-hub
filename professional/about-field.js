/* A quiet, decorative routing field for the About section. */
(() => {
  const section = document.getElementById('about');
  const canvas = section && section.querySelector('.about-field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let width = 0, height = 0, nodes = [], routes = [];
  let visible = false, connected = false, frame = 0, lastDraw = 0;
  let pointer = { x: 0, y: 0, strength: 0, lastMove: 0, inside: false };
  const enabled = () => !reduced.matches && !coarse.matches && innerWidth >= 769 && width >= 700 && height >= 280;
  const canDraw = () => connected && visible && !document.hidden && enabled();
  const seed = n => { const value = Math.sin(n * 91.437) * 43758.5453; return value - Math.floor(value); };

  function buildField() {
    const cols = width >= 1450 ? 10 : 9;
    const rows = width >= 1450 ? 6 : 5;
    nodes = [];
    routes = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const id = y * cols + x;
        nodes.push({
          x: width * (.04 + .92 * x / (cols - 1)) + (seed(id + 1) - .5) * 20,
          y: height * (.09 + .82 * y / (rows - 1)) + (seed(id + 61) - .5) * 20,
          tone: seed(id + 201)
        });
        if (x > 0 && (x + y) % 3 !== 0) routes.push([id - 1, id]);
        if (y > 0 && (x + y * 2) % 4 === 0) routes.push([id - cols, id]);
      }
    }
  }
  function influence(point) {
    if (!pointer.strength) return 0;
    const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    return Math.max(0, 1 - distance / 145) * pointer.strength;
  }
  function paint() {
    ctx.clearRect(0, 0, width, height);
    if (!canDraw()) return;
    ctx.lineWidth = 1;
    routes.forEach(([from, to]) => {
      const a = nodes[from], b = nodes[to], active = Math.max(influence(a), influence(b));
      const alpha = .055 + active * .11;
      ctx.strokeStyle = `rgba(151, 173, 193, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
        const mid = (a.x + b.x) / 2;
        ctx.lineTo(mid, a.y); ctx.lineTo(mid, b.y);
      } else {
        const mid = (a.y + b.y) / 2;
        ctx.lineTo(a.x, mid); ctx.lineTo(b.x, mid);
      }
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    nodes.forEach(node => {
      const active = influence(node);
      ctx.fillStyle = `rgba(161, 182, 200, ${.13 + active * .22})`;
      const size = node.tone > .86 ? 3 : 2;
      ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
    });
  }
  function tick(now) {
    frame = 0;
    if (!canDraw()) return;
    if (now - lastDraw >= 32) {
      lastDraw = now;
      const target = pointer.inside && now - pointer.lastMove < 800 ? 1 : 0;
      pointer.strength += (target - pointer.strength) * .12;
      if (target === 0 && pointer.strength < .015) pointer.strength = 0;
      paint();
    }
    if (pointer.strength > 0 || (pointer.inside && now - pointer.lastMove < 800)) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (canDraw() && !frame) frame = requestAnimationFrame(tick);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function resize() {
    const box = section.getBoundingClientRect();
    width = box.width; height = box.height;
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
    if (!canDraw() || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    const box = section.getBoundingClientRect();
    pointer.x = event.clientX - box.left; pointer.y = event.clientY - box.top;
    pointer.lastMove = performance.now(); pointer.inside = true;
    schedule();
  }
  function onLeave() { pointer.inside = false; schedule(); }
  function onVisibility() {
    if (document.hidden) stop();
    else { pointer.strength = 0; paint(); }
  }
  function onScrollFallback() {
    const box = section.getBoundingClientRect();
    visible = box.bottom > 0 && box.top < innerHeight;
    if (!visible) stop(); else paint();
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (!visible) stop();
    else { pointer.strength = 0; paint(); }
  }, { threshold: 0 }) : null;

  function connect() {
    if (connected) return;
    connected = true;
    section.addEventListener('pointermove', onPointer, { passive: true });
    section.addEventListener('pointerleave', onLeave, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', resize);
    coarse.addEventListener('change', resize);
    if (observer) observer.observe(section);
    else { window.addEventListener('scroll', onScrollFallback, { passive: true }); onScrollFallback(); }
    resize();
  }
  function disconnect() {
    if (!connected) return;
    connected = false; stop();
    section.removeEventListener('pointermove', onPointer);
    section.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', resize);
    coarse.removeEventListener('change', resize);
    if (observer) observer.disconnect();
    else window.removeEventListener('scroll', onScrollFallback);
  }
  window.addEventListener('pagehide', disconnect);
  window.addEventListener('pageshow', connect);
  connect();
})();
