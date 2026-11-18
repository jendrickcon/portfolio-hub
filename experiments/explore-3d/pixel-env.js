// Deterministic 320x180 code-generated pixel-art studio environment.
// Strict constraints: integer-aligned primitives, imageSmoothingEnabled = false,
// no external textures, luminance capped <= ~22% so it remains subordinate to HTML UI.

export const PIXEL_WIDTH = 320;
export const PIXEL_HEIGHT = 180;
export const PIXEL_SEED = 0xE40971;
export const PIXEL_STEP_FPS = 13.5;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PixelEnvironment {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = PIXEL_WIDTH;
    this.canvas.height = PIXEL_HEIGHT;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    this.stepAccum = 0;
    this.tickCount = 0;
    this.windowClock = 0;
    this.ledClock = 0;
    this.ledOn = true;
    this.lastTickMs = 0;

    this.buildings = [];
    this.windows = [];
    this.rainDrops = [];

    this.#generateSceneData();
    this.renderFrame();
  }

  #generateSceneData() {
    const rand = mulberry32(PIXEL_SEED);

    // Distant & midground skyline silhouettes positioned inside the studio window (x: 24..296, y: 16..130)
    const skyLeft = 24;
    const skyRight = 296;
    const skyBottom = 130;

    // Distant layer
    let x = skyLeft;
    while (x < skyRight) {
      const w = 10 + Math.floor(rand() * 14);
      const h = 26 + Math.floor(rand() * 44);
      const clampedW = Math.min(w, skyRight - x);
      this.buildings.push({
        layer: 0,
        x,
        y: skyBottom - h,
        w: clampedW,
        h,
        hasAntenna: rand() > 0.65 && clampedW >= 12,
        antennaH: 5 + Math.floor(rand() * 8),
        color: '#151f30',
      });
      x += clampedW + 1;
    }

    // Foreground skyline layer with sparse toggleable windows
    x = skyLeft + 4;
    while (x < skyRight - 6) {
      const w = 12 + Math.floor(rand() * 18);
      const h = 18 + Math.floor(rand() * 52);
      const clampedW = Math.min(w, skyRight - x);
      const by = skyBottom - h;
      this.buildings.push({
        layer: 1,
        x,
        y: by,
        w: clampedW,
        h,
        hasAntenna: false,
        color: '#0f1724',
      });

      const cols = Math.floor((clampedW - 4) / 4);
      const rows = Math.floor((h - 6) / 6);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.34) {
            const paletteRoll = rand();
            const color = paletteRoll < 0.55 ? '#463619' : paletteRoll < 0.85 ? '#1c3944' : '#2c3440';
            this.windows.push({
              x: x + 3 + c * 4,
              y: by + 4 + r * 6,
              lit: rand() < 0.62,
              canToggle: rand() < 0.35,
              color,
            });
          }
        }
      }
      x += clampedW + 3 + Math.floor(rand() * 5);
    }

    // 42 restrained integer-stepped diagonal rain drops confined to window opening
    for (let i = 0; i < 42; i++) {
      this.rainDrops.push({
        x: 26 + Math.floor(rand() * 268),
        y: 16 + Math.floor(rand() * 112),
        len: 3 + Math.floor(rand() * 3),
        speed: 1 + Math.floor(rand() * 2),
      });
    }
  }

  step(dtSeconds, animated) {
    if (!animated) return false;

    const stepInterval = 1 / PIXEL_STEP_FPS;
    this.stepAccum += dtSeconds;
    if (this.stepAccum < stepInterval) return false;
    this.stepAccum %= stepInterval;

    // Advance rain drops on integer pixel grid
    for (let i = 0; i < this.rainDrops.length; i++) {
      const d = this.rainDrops[i];
      d.x -= d.speed;
      d.y += d.speed * 2;
      if (d.y > 128 || d.x < 26) {
        d.x = 34 + ((d.x * 37 + i * 19) % 260);
        d.y = 16 + ((d.y + i * 7) % 10);
      }
    }

    // Toggle 1-2 building windows every ~3 seconds
    this.windowClock += stepInterval;
    if (this.windowClock >= 3.1) {
      this.windowClock = 0;
      const toggleables = this.windows.filter((w) => w.canToggle);
      if (toggleables.length > 0) {
        const idxA = (this.tickCount * 7 + 3) % toggleables.length;
        toggleables[idxA].lit = !toggleables[idxA].lit;
        if (toggleables.length > 4) {
          const idxB = (this.tickCount * 13 + 11) % toggleables.length;
          toggleables[idxB].lit = !toggleables[idxB].lit;
        }
      }
    }

    // Slow wall technical-panel LED pulse (~1.2s toggle)
    this.ledClock += stepInterval;
    if (this.ledClock >= 1.2) {
      this.ledClock = 0;
      this.ledOn = !this.ledOn;
    }

    this.tickCount += 1;
    this.renderFrame();
    return true;
  }

  renderStatic() {
    this.renderFrame();
  }

  renderFrame() {
    const t0 = performance.now();
    const ctx = this.ctx;

    // 1. Deep-ink editorial wall surrounding the recessed window
    ctx.fillStyle = '#07090d';
    ctx.fillRect(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT);

    // Subtle wall paneling horizontal seam lines (ultra-low luminance)
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 140, PIXEL_WIDTH, 1);
    ctx.fillRect(0, 144, PIXEL_WIDTH, 36);

    // 2. Window opening & stepped midnight sky (kept <= 22% luminance)
    ctx.fillStyle = '#060a10';
    ctx.fillRect(24, 16, 272, 114);
    ctx.fillStyle = '#080e16';
    ctx.fillRect(24, 52, 272, 38);
    ctx.fillStyle = '#0a121c';
    ctx.fillRect(24, 90, 272, 40);

    // 3. Skyline buildings + beacons
    for (const b of this.buildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      if (b.hasAntenna) {
        const ax = b.x + Math.floor(b.w / 2);
        ctx.fillStyle = '#141d2a';
        ctx.fillRect(ax, b.y - b.antennaH, 1, b.antennaH);
        ctx.fillStyle = this.ledOn ? '#6d2525' : '#2d1215';
        ctx.fillRect(ax, b.y - b.antennaH - 1, 1, 1);
      }
    }

    // 4. City window lights
    for (const w of this.windows) {
      if (!w.lit) continue;
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x, w.y, 2, 2);
    }

    // 5. Restrained diagonal rain streaks
    ctx.fillStyle = '#1f3040';
    for (const d of this.rainDrops) {
      for (let s = 0; s < d.len; s++) {
        const px = Math.floor(d.x - s);
        const py = Math.floor(d.y + s * 2);
        if (px >= 25 && px <= 294 && py >= 16 && py <= 128) {
          ctx.fillRect(px, py, 1, 2);
        }
      }
    }

    // 6. Window frame & mullions (crisp integer border framing the center monitor silhouette)
    ctx.fillStyle = '#1c232e';
    ctx.fillRect(20, 12, 280, 4);
    ctx.fillRect(20, 130, 280, 4);
    ctx.fillRect(20, 16, 4, 114);
    ctx.fillRect(296, 16, 4, 114);
    ctx.fillRect(110, 16, 2, 114);
    ctx.fillRect(208, 16, 2, 114);
    ctx.fillRect(24, 72, 272, 2);

    // Window sill highlight
    ctx.fillStyle = '#232c3b';
    ctx.fillRect(18, 133, 284, 2);

    // 7. Left-wall small technical wall panel silhouette + slow activity LED
    ctx.fillStyle = '#10141c';
    ctx.fillRect(4, 52, 13, 22);
    ctx.fillStyle = '#18202c';
    ctx.fillRect(5, 53, 11, 20);
    ctx.fillStyle = '#12313b';
    ctx.fillRect(7, 56, 7, 1);
    ctx.fillRect(7, 59, 5, 1);
    ctx.fillRect(10, 61, 4, 1);
    ctx.fillStyle = this.ledOn ? '#236b38' : '#102b19';
    ctx.fillRect(7, 68, 2, 2);

    // 8. Desk-margin inhabited pixel props (flanked outside central CRT monitor silhouette)
    // Stacked 3.5" floppy disks (bottom-left shelf edge)
    ctx.fillStyle = '#1a202b';
    ctx.fillRect(10, 152, 18, 6);
    ctx.fillStyle = '#382f1b';
    ctx.fillRect(14, 153, 6, 3);
    ctx.fillStyle = '#151a24';
    ctx.fillRect(12, 146, 17, 6);
    ctx.fillStyle = '#1c3a44';
    ctx.fillRect(16, 147, 6, 3);

    // Coiled desk cable silhouette (left-to-center)
    ctx.fillStyle = '#141922';
    ctx.fillRect(32, 156, 12, 2);
    ctx.fillRect(43, 154, 4, 2);
    ctx.fillRect(46, 152, 12, 2);

    // Small plant silhouette on right ledge
    ctx.fillStyle = '#161b23';
    ctx.fillRect(288, 146, 12, 10);
    ctx.fillStyle = '#10231b';
    ctx.fillRect(291, 138, 2, 8);
    ctx.fillRect(295, 136, 2, 10);
    ctx.fillRect(288, 140, 3, 2);
    ctx.fillRect(297, 139, 3, 2);

    this.lastTickMs = performance.now() - t0;
  }

  getSnapshotDataUrl() {
    return this.canvas.toDataURL('image/png');
  }
}
