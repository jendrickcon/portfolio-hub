/**
 * SANDBOX — Renderer
 *
 * Canvas renderer with CRT flicker for thermal/living materials
 * and distinct digital glyph streams for CODE and CORRUPTED_CODE.
 * GLITCH gets its own reality-tearing visual: strobing magenta/white
 * with random pixel noise in a small corona around each cell.
 */

import {
  EMPTY, CODE, CORRUPTED_CODE, FIRE, BURNING_WOOD, LAVA, STEAM,
  HEATED_STONE, HOT_METAL, EMBER, VOID, DARK_MATTER, GLITCH, MATERIALS
} from "./materials.js";

const GLYPH_0 = [[1, 1], [1, 0], [1, 0], [1, 1]];
const GLYPH_1 = [[0, 1], [1, 1], [0, 1], [0, 1]];
const GLYPH_X = [[1, 1], [0, 1], [1, 0], [1, 1]];
const GLYPH_7 = [[1, 1], [0, 1], [0, 1], [0, 1]];
// Extra glitch glyphs — more chaotic fragments
const GLYPH_ERR = [[1, 0], [1, 1], [0, 1], [1, 0]];
const GLYPH_QST = [[1, 1], [0, 1], [1, 0], [0, 1]];

const GLYPH_W = 2;
const GLYPH_H = 4;

export class Renderer {
  constructor(displayCanvas, cols, rows) {
    this.displayCanvas = displayCanvas;
    this.displayCtx = displayCanvas.getContext("2d");
    this.displayCtx.imageSmoothingEnabled = false;
    this.cols = cols;
    this.rows = rows;
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = cols;
    this.offscreen.height = rows;
    this.offCtx = this.offscreen.getContext("2d");
    this.imageData = this.offCtx.createImageData(cols, rows);
    this.bg = [10, 12, 16];
    this._frame = 0;
  }

  draw(simulation) {
    this._frame++;
    const { grid } = simulation;
    const data = this.imageData.data;
    const bg = this.bg;
    const f = this._frame;

    for (let i = 0; i < grid.length; i++) {
      const id = grid[i];
      const o = i * 4;

      if (id === EMPTY) {
        data[o]     = bg[0];
        data[o + 1] = bg[1];
        data[o + 2] = bg[2];
        data[o + 3] = 255;
        continue;
      }

      // Background under digital glyphs
      if (id === CODE) {
        const c = MATERIALS[CODE].color;
        data[o]     = (c[0] * 0.12) | 0;
        data[o + 1] = (c[1] * 0.14) | 0;
        data[o + 2] = (c[2] * 0.12) | 0;
        data[o + 3] = 255;
        continue;
      }

      if (id === CORRUPTED_CODE) {
        const c = MATERIALS[CORRUPTED_CODE].color;
        data[o]     = (c[0] * 0.18) | 0;
        data[o + 1] = (c[1] * 0.08) | 0;
        data[o + 2] = (c[2] * 0.22) | 0;
        data[o + 3] = 255;
        continue;
      }

      // GLITCH: strobing magenta → white → black → magenta at ~10Hz.
      // The strobe period is intentionally irregular (uses prime offsets per
      // cell index so adjacent glitches don't pulse in lockstep).
      if (id === GLITCH) {
        const phase = (f * 3 + i * 7) % 18;
        if (phase < 4) {
          // bright white flash
          data[o] = 255; data[o + 1] = 255; data[o + 2] = 255;
        } else if (phase < 10) {
          // hot magenta
          data[o] = 255; data[o + 1] = 30; data[o + 2] = 220;
        } else if (phase < 13) {
          // near-black gap
          data[o] = 18; data[o + 1] = 8; data[o + 2] = 18;
        } else {
          // dim magenta
          data[o] = 160; data[o + 1] = 20; data[o + 2] = 140;
        }
        data[o + 3] = 255;
        continue;
      }

      const def = MATERIALS[id];
      const c = def ? def.color : [255, 0, 255];

      // Dynamic flicker for thermodynamics & living energies
      if (id === FIRE || id === BURNING_WOOD || id === LAVA || id === STEAM ||
          id === HEATED_STONE || id === HOT_METAL || id === EMBER) {
        const flk = 0.68 + Math.random() * 0.48;
        data[o]     = Math.min(255, (c[0] * flk) | 0);
        data[o + 1] = Math.min(255, (c[1] * flk) | 0);
        data[o + 2] = Math.min(255, (c[2] * flk) | 0);
      } else if (id === VOID) {
        // The void is almost black, but never quite still — a faint violet
        // shimmer betrays that something is there.
        const s = Math.random() < 0.06 ? 60 : 0;
        data[o]     = 8 + s;
        data[o + 1] = 4;
        data[o + 2] = 18 + (s >> 1);
      } else if (id === DARK_MATTER) {
        const s = (f + ((o >> 2) & 15)) % 40 < 6 ? 30 : 0;
        data[o]     = 30 + s;
        data[o + 1] = 12;
        data[o + 2] = 55 + s;
      } else {
        data[o]     = c[0];
        data[o + 1] = c[1];
        data[o + 2] = c[2];
      }
      data[o + 3] = 255;
    }

    this.offCtx.putImageData(this.imageData, 0, 0);
    const dc = this.displayCtx;
    const canvas = this.displayCanvas;
    dc.clearRect(0, 0, canvas.width, canvas.height);
    dc.drawImage(
      this.offscreen,
      0, 0, this.cols, this.rows,
      0, 0, canvas.width, canvas.height
    );

    this._drawCodeGlyphs(simulation);
  }

  _drawCodeGlyphs(simulation) {
    const { grid, life, cols, rows } = simulation;
    const dc = this.displayCtx;
    const canvas = this.displayCanvas;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    const maxX = Math.max(0, cellW - GLYPH_W);
    const maxY = Math.max(0, cellH - GLYPH_H);

    for (let i = 0; i < grid.length; i++) {
      const id = grid[i];
      if (id !== CODE && id !== CORRUPTED_CODE && id !== GLITCH) continue;

      const isCorrupted = id === CORRUPTED_CODE;
      const isGlitch    = id === GLITCH;

      if (isGlitch) {
        // Glitch uses rapidly-alternating chaotic glyph colours
        const phase = (this._frame * 3 + i * 7) % 18;
        dc.fillStyle = phase < 4 ? "#ffffff" : phase < 10 ? "#ff20dc" : "#8010a0";
      } else {
        dc.fillStyle = isCorrupted ? "#e266ff" : "#5cff88";
      }

      const gx = i % cols;
      const gy = (i / cols) | 0;
      const cellLeft = gx * cellW;
      const cellTop  = gy * cellH;

      const l = life[i];
      dc.globalAlpha = isGlitch
        ? (0.5 + Math.random() * 0.5)               // intentionally jittery
        : (l > 120 ? 1.0 : l > 50 ? 0.75 : 0.45);

      const glyphCount = isGlitch ? 3 : isCorrupted ? 2 : (2 + ((i * 13) % 2));
      for (let g = 0; g < glyphCount; g++) {
        const seed = i + g * 17 + ((this._frame >> (isGlitch ? 1 : 3)) & 7);
        const sx = ((i * 31 + g * 73) % 100) / 100;
        const sy = ((i * 47 + g * 91) % 100) / 100;
        const px = Math.round(cellLeft + sx * maxX);
        const py = Math.round(cellTop  + sy * maxY);

        let shape = GLYPH_0;
        const pick = seed % 6;
        if      (pick === 1) shape = GLYPH_1;
        else if (pick === 2) shape = GLYPH_X;
        else if (pick === 3) shape = GLYPH_7;
        else if (pick === 4) shape = GLYPH_ERR;
        else if (pick === 5) shape = GLYPH_QST;

        for (let row = 0; row < GLYPH_H; row++) {
          const sr = shape[row];
          for (let col = 0; col < GLYPH_W; col++) {
            if (sr[col]) dc.fillRect(px + col, py + row, 1, 1);
          }
        }
      }
    }

    dc.globalAlpha = 1.0;
  }
}