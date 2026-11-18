// Deterministic 320x180 code-generated pixel-art studio environment.
// Strict constraints: integer-aligned primitives, imageSmoothingEnabled = false,
// no external textures, luminance capped <= ~22% so it remains subordinate to HTML UI.

export const PIXEL_WIDTH = 320;
export const PIXEL_HEIGHT = 180;
export const PIXEL_SEED = 0xE40971;
export const PIXEL_STEP_FPS = 13.5;

// Centralized 4:3 Pixel 2D logical workstation world (2:1 mapped from 960x720 integer grid)
export const PIXEL_WORLD = {
  width: 480,
  height: 360,
  monitorBounds: { x: 112, y: 26, w: 256, h: 218 },
  screenBounds: { x: 136, y: 48, w: 208, h: 156 }, // exact 4:3 CRT glass aperture
  floppyBounds: { x: 204, y: 216, w: 72, h: 20 },  // centered on [112..368] monitor center x=240
  powerBounds: { x: 318, y: 216, w: 30, h: 20 },   // lower-right physical power control
  dadoY: 162,
  deskTopY: 254,
  deskLipY: 346,
};

export const PIXEL_SCENE_POSES = {
  standby: {
    name: 'standby',
    focusY: 186,
    portrait: { focalW: 332, focalH: 334 },
    landscape: { focalW: 472, focalH: 330 },
    shortLandscape: { focalW: 316, focalH: 328 },
    durationMs: 700,
  },
  boot: {
    name: 'boot',
    focusY: 152,
    portrait: { focalW: 288, focalH: 278 },
    landscape: { focalW: 400, focalH: 274 },
    shortLandscape: { focalW: 288, focalH: 266 },
    durationMs: 650,
  },
  menu: {
    name: 'menu',
    focusY: 136,
    portrait: { focalW: 264, focalH: 242 },
    landscape: { focalW: 356, focalH: 236 },
    shortLandscape: { focalW: 268, focalH: 232 },
    durationMs: 600,
  },
};

export function computePixelSceneFrame(stageW, stageH, poseName = 'standby', stageTop = 0) {
  const safeW = Math.max(200, stageW);
  const safeH = Math.max(120, stageH);
  const pose = PIXEL_SCENE_POSES[poseName] || PIXEL_SCENE_POSES.standby;

  let framing = pose.landscape;
  if (safeW < safeH && safeW < 760) {
    framing = pose.portrait;
  } else if (safeH <= 460 || safeW < 760) {
    framing = pose.shortLandscape;
  }

  const rawScale = Math.min(safeW / framing.focalW, safeH / framing.focalH);
  // Guarantee complete 4:3 CRT outer shell (256x218) remains unclipped inside stage bounds
  const margin = safeW <= 360 || safeH <= 260 ? 6 : 12;
  const maxScaleW = (safeW - margin) / PIXEL_WORLD.monitorBounds.w;
  const maxScaleH = (safeH - margin) / PIXEL_WORLD.monitorBounds.h;
  const scale = Math.max(0.35, Math.min(rawScale, maxScaleW, maxScaleH));

  const cx = safeW * 0.5;
  const centerBias = poseName === 'standby' && safeW < 760 && safeH >= 620 ? 0.54 : 0.50;
  const cy = safeH * centerBias;

  const tx = cx - 240 * scale;
  let ty = cy - pose.focusY * scale;

  // Keep monitor shell top/bottom inside available stage area
  const minTy = 4 - PIXEL_WORLD.monitorBounds.y * scale;
  const maxTy = (safeH - 4) - (PIXEL_WORLD.monitorBounds.y + PIXEL_WORLD.monitorBounds.h) * scale;
  if (minTy <= maxTy) {
    ty = Math.max(minTy, Math.min(maxTy, ty));
  } else {
    ty = (minTy + maxTy) * 0.5;
  }

  const toViewportRect = (b, minW = 0, minH = 0) => {
    const rawW = b.w * scale;
    const rawH = b.h * scale;
    const w = Math.max(minW, rawW);
    const h = Math.max(minH, rawH);
    const cxRect = tx + (b.x + b.w * 0.5) * scale;
    const cyRect = stageTop + ty + (b.y + b.h * 0.5) * scale;
    return {
      x: cxRect - w * 0.5,
      y: cyRect - h * 0.5,
      w,
      h,
    };
  };

  const screenRect = {
    x: tx + PIXEL_WORLD.screenBounds.x * scale,
    y: stageTop + ty + PIXEL_WORLD.screenBounds.y * scale,
    w: PIXEL_WORLD.screenBounds.w * scale,
    h: PIXEL_WORLD.screenBounds.h * scale,
  };
  const diskRect = toViewportRect(PIXEL_WORLD.floppyBounds, 44, 44);
  const powerRect = toViewportRect(PIXEL_WORLD.powerBounds, 44, 44);

  // Prevent Disk & Power hitboxes colliding at extreme low zoom while keeping Power centered on its switch
  const overlap = (diskRect.x + diskRect.w + 4) - powerRect.x;
  if (overlap > 0) {
    diskRect.x -= overlap;
  }

  return {
    pose: pose.name,
    durationMs: pose.durationMs,
    scale,
    tx,
    ty,
    screenRect,
    diskRect,
    powerRect,
    dadoY: Math.round(ty + PIXEL_WORLD.dadoY * scale),
    deskTopY: Math.round(ty + PIXEL_WORLD.deskTopY * scale),
    deskLipY: Math.round(ty + PIXEL_WORLD.deskLipY * scale),
  };
}

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
  constructor(targetCanvas = null) {
    this.canvas = targetCanvas || document.createElement('canvas');
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

    // Three skyline depth layers positioned inside the studio window (x: 24..296, y: 16..130)
    const skyLeft = 24;
    const skyRight = 296;
    const skyBottom = 130;

    // Layer 0: Distant towers with beacons
    let x = skyLeft;
    while (x < skyRight) {
      const w = 9 + Math.floor(rand() * 13);
      const h = 34 + Math.floor(rand() * 44);
      const clampedW = Math.min(w, skyRight - x);
      this.buildings.push({
        layer: 0,
        x,
        y: skyBottom - h,
        w: clampedW,
        h,
        hasAntenna: rand() > 0.62 && clampedW >= 11,
        antennaH: 5 + Math.floor(rand() * 9),
        hasAcUnit: false,
        hasTank: false,
        color: '#1d2d45',
        trim: '#2a4162',
      });
      x += clampedW + 1;
    }

    // Layer 1: Midground towers with rooftop utility boxes, water tanks & warm/cool windows
    x = skyLeft + 2;
    while (x < skyRight - 4) {
      const w = 13 + Math.floor(rand() * 16);
      const h = 24 + Math.floor(rand() * 46);
      const clampedW = Math.min(w, skyRight - x);
      const by = skyBottom - h;
      this.buildings.push({
        layer: 1,
        x,
        y: by,
        w: clampedW,
        h,
        hasAntenna: rand() > 0.78 && clampedW >= 14,
        antennaH: 4 + Math.floor(rand() * 5),
        hasAcUnit: rand() > 0.45 && clampedW >= 14,
        hasTank: rand() > 0.75 && clampedW >= 16,
        color: '#17253b',
        trim: '#213452',
      });

      const cols = Math.floor((clampedW - 4) / 4);
      const rows = Math.floor((h - 6) / 6);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.28) {
            const paletteRoll = rand();
            const color = paletteRoll < 0.5 ? '#c49010' : paletteRoll < 0.85 ? '#1f5e70' : '#2a384c';
            this.windows.push({
              x: x + 2 + c * 4,
              y: by + 4 + r * 6,
              lit: rand() < 0.55,
              canToggle: rand() < 0.3,
              color,
            });
          }
        }
      }
      x += clampedW + 3 + Math.floor(rand() * 6);
    }

    // Layer 2: Foreground dark building silhouettes + fire-escape rungs & sparse windows
    x = skyLeft + 5;
    while (x < skyRight - 8) {
      const w = 14 + Math.floor(rand() * 18);
      const h = 16 + Math.floor(rand() * 38);
      const clampedW = Math.min(w, skyRight - x);
      const by = skyBottom - h;
      this.buildings.push({
        layer: 2,
        x,
        y: by,
        w: clampedW,
        h,
        hasAntenna: false,
        hasAcUnit: false,
        hasTank: false,
        hasFireEscape: rand() > 0.5 && h >= 26,
        color: '#111b2c',
        trim: '#18273e',
      });

      const cols = Math.floor((clampedW - 4) / 4);
      const rows = Math.floor((h - 6) / 6);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.34) {
            const paletteRoll = rand();
            const color = paletteRoll < 0.56 ? '#c49010' : paletteRoll < 0.88 ? '#1f5e70' : '#2a384c';
            this.windows.push({
              x: x + 3 + c * 4,
              y: by + 4 + r * 6,
              lit: rand() < 0.6,
              canToggle: rand() < 0.36,
              color,
            });
          }
        }
      }
      x += clampedW + 6 + Math.floor(rand() * 9);
    }

    // 42 restrained integer-stepped diagonal rain drops + splash phase
    for (let i = 0; i < 42; i++) {
      this.rainDrops.push({
        x: 26 + Math.floor(rand() * 268),
        y: 16 + Math.floor(rand() * 112),
        len: 3 + Math.floor(rand() * 3),
        speed: 1 + Math.floor(rand() * 2),
        splashPhase: i % 3,
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

    // 1. Deep-ink editorial wall surrounding the recessed window + dado trim
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT);

    // Subtle wall paneling seam lines, skirting & routing-field index hairlines
    ctx.fillStyle = '#0c0e11';
    ctx.fillRect(0, 141, PIXEL_WIDTH, 1);
    ctx.fillRect(0, 144, PIXEL_WIDTH, 36);
    ctx.fillStyle = '#151e2c';
    ctx.fillRect(0, 142, PIXEL_WIDTH, 2);
    ctx.fillRect(2, 18, 12, 1);
    ctx.fillRect(2, 21, 7, 1);
    ctx.fillRect(306, 18, 12, 1);
    ctx.fillRect(310, 21, 8, 1);

    // 2. Window opening & 4-band midnight sky with distant horizon haze
    ctx.fillStyle = '#070a10';
    ctx.fillRect(24, 16, 272, 36);
    ctx.fillStyle = '#0c131f';
    ctx.fillRect(24, 52, 272, 34);
    ctx.fillStyle = '#111b2c';
    ctx.fillRect(24, 86, 272, 28);
    ctx.fillStyle = '#17253b';
    ctx.fillRect(24, 114, 272, 16);

    // 3. Skyline depth layers + rooftop antennas/AC/tanks/fire escapes
    for (const b of this.buildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = b.trim;
      ctx.fillRect(b.x, b.y, b.w, 1);
      if (b.hasAcUnit) {
        ctx.fillStyle = '#2a384c';
        ctx.fillRect(b.x + 2, b.y - 3, 5, 3);
      }
      if (b.hasTank) {
        ctx.fillStyle = '#2a384c';
        ctx.fillRect(b.x + b.w - 7, b.y - 5, 5, 4);
        ctx.fillRect(b.x + b.w - 6, b.y - 1, 1, 1);
        ctx.fillRect(b.x + b.w - 4, b.y - 1, 1, 1);
      }
      if (b.hasFireEscape) {
        ctx.fillStyle = '#213452';
        for (let fy = b.y + 6; fy < 126; fy += 7) {
          ctx.fillRect(b.x + 1, fy, 4, 1);
        }
      }
      if (b.hasAntenna) {
        const ax = b.x + Math.floor(b.w / 2);
        ctx.fillStyle = '#151e2c';
        ctx.fillRect(ax, b.y - b.antennaH, 1, b.antennaH);
        ctx.fillStyle = this.ledOn ? '#a83232' : '#331418';
        ctx.fillRect(ax, b.y - b.antennaH - 1, 1, 1);
      }
    }

    // 4. City window lights
    for (const w of this.windows) {
      if (!w.lit) continue;
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x, w.y, 2, 2);
    }

    // 5. Restrained diagonal rain streaks + 2-3 frame edge impacts at mullions/sill
    ctx.fillStyle = '#2a384c';
    for (const d of this.rainDrops) {
      for (let s = 0; s < d.len; s++) {
        const px = Math.floor(d.x - s);
        const py = Math.floor(d.y + s * 2);
        if (px >= 25 && px <= 294 && py >= 16 && py <= 128) {
          ctx.fillRect(px, py, 1, 2);
        }
      }
    }
    ctx.fillStyle = '#3c5068';
    for (let i = 0; i < 6; i++) {
      const spPhase = (this.tickCount + i) % 3;
      if (spPhase === 0) {
        const sx = 28 + ((i * 47 + this.tickCount * 5) % 262);
        const sy = i % 2 === 0 ? 70 : 128;
        ctx.fillRect(sx, sy, 1, 1);
        ctx.fillRect(sx + 2, sy, 1, 1);
      }
    }

    // 6. Stepped window frame, inner shadow bevel & mullions
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(20, 12, 280, 4);
    ctx.fillRect(20, 130, 280, 4);
    ctx.fillRect(20, 16, 4, 114);
    ctx.fillRect(296, 16, 4, 114);
    ctx.fillRect(110, 16, 2, 114);
    ctx.fillRect(208, 16, 2, 114);
    ctx.fillRect(24, 72, 272, 2);
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(24, 16, 272, 1);
    ctx.fillRect(24, 16, 1, 114);
    ctx.fillStyle = '#26282b';
    ctx.fillRect(18, 133, 284, 2);

    // 7. Left-wall recessed technical panel + conduit + routing-field ticks + dual LEDs
    ctx.fillStyle = '#0c0e11';
    ctx.fillRect(9, 78, 2, 62);
    ctx.fillStyle = '#151e2c';
    ctx.fillRect(3, 46, 15, 32);
    ctx.fillStyle = '#223044';
    ctx.fillRect(4, 47, 13, 30);
    ctx.fillStyle = '#1f5e70';
    ctx.fillRect(6, 50, 9, 1);
    ctx.fillRect(6, 53, 6, 1);
    ctx.fillRect(9, 56, 6, 1);
    ctx.fillRect(6, 59, 4, 1);
    ctx.fillStyle = '#2a4162';
    ctx.fillRect(6, 64, 9, 1);
    ctx.fillStyle = this.ledOn ? '#226e45' : '#133324';
    ctx.fillRect(6, 70, 2, 2);
    ctx.fillStyle = this.ledOn ? '#3b2b10' : '#7a5518';
    ctx.fillRect(11, 70, 2, 2);

    // 8. Desk-margin inhabited props
    // Left shelf stack of 3 beveled 3.5" floppy disks
    ctx.fillStyle = '#26282b';
    ctx.fillRect(8, 152, 19, 6);
    ctx.fillStyle = '#7a5518';
    ctx.fillRect(13, 153, 6, 3);
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(10, 146, 18, 6);
    ctx.fillStyle = '#1f5e70';
    ctx.fillRect(15, 147, 6, 3);
    ctx.fillStyle = '#343840';
    ctx.fillRect(11, 141, 16, 5);
    ctx.fillStyle = '#464b54';
    ctx.fillRect(16, 142, 6, 2);

    // Coiled desk cable + connector & subtle 2-frame data pulse
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(30, 156, 13, 2);
    ctx.fillRect(42, 154, 4, 2);
    ctx.fillRect(45, 152, 14, 2);
    ctx.fillStyle = this.ledOn ? '#1f5e70' : '#181a1d';
    ctx.fillRect(47, 152, 2, 1);

    // Right edge small studio desk lamp silhouette (subdued warm down-cone)
    ctx.fillStyle = '#595246';
    ctx.fillRect(304, 149, 12, 5);
    ctx.fillRect(310, 128, 2, 21);
    ctx.fillRect(303, 124, 9, 2);
    ctx.fillStyle = '#857c6d';
    ctx.fillRect(297, 125, 8, 5);
    ctx.fillStyle = '#3b2b10';
    ctx.fillRect(294, 130, 10, 10);

    // Botanical plant pot on right ledge with stepped pot rim + foliage
    ctx.fillStyle = '#18273e';
    ctx.fillRect(284, 145, 13, 11);
    ctx.fillStyle = '#343840';
    ctx.fillRect(283, 144, 15, 2);
    ctx.fillStyle = '#133324';
    ctx.fillRect(288, 136, 2, 8);
    ctx.fillRect(292, 134, 2, 10);
    ctx.fillStyle = '#226e45';
    ctx.fillRect(284, 138, 4, 2);
    ctx.fillRect(294, 137, 4, 2);
    ctx.fillRect(289, 132, 2, 3);

    this.lastTickMs = performance.now() - t0;
  }

  getSnapshotDataUrl() {
    return this.canvas.toDataURL('image/png');
  }
}

/**
 * Deterministic 64x32 pixel-grid texture for the 3.5" floppy diskette carrier
 * so hardware labeling remains integer-aligned with zero external images.
 */
export function createFloppyDiskCanvas() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // Matte dark slate diskette shell
  ctx.fillStyle = '#26282b';
  ctx.fillRect(0, 0, 64, 32);

  // Subtle top lip & write-protect corner notch accents
  ctx.fillStyle = '#343840';
  ctx.fillRect(1, 1, 62, 3);
  ctx.fillStyle = '#0c0e11';
  ctx.fillRect(4, 24, 5, 5);

  // Brushed silver metal shutter in upper center
  ctx.fillStyle = '#9ea8b4';
  ctx.fillRect(18, 2, 28, 12);
  ctx.fillStyle = '#68737d';
  ctx.fillRect(36, 4, 7, 8);
  ctx.fillStyle = '#c8d2dc';
  ctx.fillRect(18, 2, 28, 2);

  // Label block with restrained cyan/amber micro-stripes
  ctx.fillStyle = '#181a1d';
  ctx.fillRect(12, 16, 40, 14);
  ctx.fillStyle = '#00a8be';
  ctx.fillRect(14, 18, 36, 2);
  ctx.fillStyle = '#c49010';
  ctx.fillRect(14, 21, 18, 2);
  ctx.fillStyle = '#68737d';
  ctx.fillRect(14, 25, 28, 1);
  ctx.fillRect(14, 27, 20, 1);

  return c;
}
