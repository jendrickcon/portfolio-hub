/**
 * SANDBOX — Forces
 *
 * Environmental forces that act on the world independently of materials:
 *   - Gravity direction (down / up / left / right)
 *   - Wind field (painted by the user, decays over time)
 *
 * The simulation reads these each tick, so the player manipulates *forces*,
 * not just materials. Everything is stored as tiny typed arrays for speed.
 */

export const GRAVITY = {
  DOWN: { id: "DOWN", dx: 0, dy: 1 },
  UP: { id: "UP", dx: 0, dy: -1 },
  LEFT: { id: "LEFT", dx: -1, dy: 0 },
  RIGHT: { id: "RIGHT", dx: 1, dy: 0 },
};

export class ForceField {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    // Wind velocity per cell (signed). Positive = rightward/downward.
    this.windX = new Float32Array(cols * rows);
    this.windY = new Float32Array(cols * rows);
    this.gravity = GRAVITY.DOWN;
  }

  index(x, y) { return y * this.cols + x; }

  clear() {
    this.windX.fill(0);
    this.windY.fill(0);
  }

  /** Paint a soft radial gust of wind centred on (cx, cy). */
  paintWind(cx, cy, radius, strength, dirX, dirY) {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const px = cx + dx, py = cy + dy;
        if (px < 0 || px >= this.cols || py < 0 || py >= this.rows) continue;
        const falloff = 1 - Math.sqrt(d2) / (radius + 0.001);
        const i = this.index(px, py);
        this.windX[i] += dirX * strength * falloff;
        this.windY[i] += dirY * strength * falloff;
      }
    }
  }

  /** Wind is ephemeral — it bleeds off every tick so gusts die down. */
  decay(factor = 0.94) {
    const wx = this.windX, wy = this.windY;
    for (let i = 0; i < wx.length; i++) {
      wx[i] *= factor;
      wy[i] *= factor;
      if (wx[i] > -0.01 && wx[i] < 0.01) wx[i] = 0;
      if (wy[i] > -0.01 && wy[i] < 0.01) wy[i] = 0;
    }
  }

  sampleX(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 0;
    return this.windX[this.index(x, y)];
  }

  sampleY(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 0;
    return this.windY[this.index(x, y)];
  }

  setGravity(id) {
    if (GRAVITY[id]) this.gravity = GRAVITY[id];
  }
}
