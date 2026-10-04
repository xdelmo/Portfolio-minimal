import { CELL, COMPOSE_MS, DOT, FieldLayout, composeProgress, easeOutCubic, falloff, hash, morphProgress, ripple, twinkle, vignette } from './field';

export interface Palette {
  glyph: string;
  dot: string;
  lit: readonly string[];
  /** Colours of portrait slots 1–5. */
  face: readonly string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Ripple extends Point {
  start: number;
}

export interface FrameState {
  /** Milliseconds of animation played so far. */
  t: number;
  animate: boolean;
  pointer: Point | null;
  ripples: readonly Ripple[];
  /** The scene the field is heading to (0 "edm.", 1 the face) and when that morph started, in `t` time. */
  scene: { to: 0 | 1; start: number };
}

const PUSH = 10; // px a pixel moves away from the pointer
const REST_ALPHA = 0.18;

export function readPalette(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Palette {
  const read = (name: string): string => style.getPropertyValue(name).trim();
  return {
    glyph: read('--px-1'),
    dot: read('--fg'),
    lit: ['--px-2', '--px-3', '--px-4', '--px-5', '--px-6'].map(read),
    // slots: 1–2 clothes, beard and glasses in the blues; 3 skin in shadow in lavender; 4–5 skin in peach
    face: ['--px-1', '--px-2', '--px-4', '--px-6', '--px-6'].map(read),
  };
}

export function drawFrame(ctx: CanvasRenderingContext2D, l: FieldLayout, p: Palette, f: FrameState): void {
  ctx.clearRect(0, 0, l.x0 * 2 + l.cols * CELL, l.y0 * 2 + l.rows * CELL);
  const t = f.animate ? f.t : COMPOSE_MS * 2;
  const pointer = f.animate ? f.pointer : null;
  const waveIn = f.animate ? easeOutCubic((t - COMPOSE_MS) / 800) : 0;

  for (let row = 0; row < l.rows; row++) {
    for (let col = 0; col < l.cols; col++) {
      const i = row * l.cols + col;
      let x = l.x0 + col * CELL + CELL / 2;
      let y = l.y0 + row * CELL + CELL / 2;
      let energy = 0;

      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d = Math.hypot(dx, dy);
        const k = falloff(d);
        if (k > 0 && d > 0) {
          x += (dx / d) * k * PUSH;
          y += (dy / d) * k * PUSH;
        }
        energy = k;
      }
      for (const r of f.ripples) energy = Math.max(energy, ripple(Math.hypot(x - r.x, y - r.y), t - r.start));

      const face = l.face[i];
      // background dot, glyph pixel or portrait pixel, each drawn at `k` of its full size
      const look = (scene: 0 | 1, k: number): void => {
        if (scene === 0 && l.glyph[i]) {
          const c = composeProgress(i, t);
          const size = DOT * k;
          const gx = x + (hash(i + 7) - 0.5) * l.cols * CELL * (1 - c);
          const gy = y + (hash(i + 13) - 0.5) * l.rows * CELL * (1 - c);
          ctx.globalAlpha = c;
          ctx.fillStyle = p.glyph;
          ctx.fillRect(gx - size / 2, gy - size / 2, size, size);
        } else if (scene === 1 && face) {
          const size = DOT * k;
          ctx.globalAlpha = face === 4 ? 0.75 : 1;
          ctx.fillStyle = p.face[face - 1];
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        } else {
          const e = Math.max(energy, 0.6 * twinkle(i, t) ** 10 * waveIn);
          const size = DOT * (0.25 + 0.75 * e) * k;
          ctx.globalAlpha = (REST_ALPHA + (1 - REST_ALPHA) * e) * vignette(col, row, l.cols, l.rows);
          ctx.fillStyle = e > 0.05 ? p.lit[Math.floor(hash(i + 3) * p.lit.length)] : p.dot;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      };

      if (!l.glyph[i] && !face) {
        look(0, 1);
        continue;
      }
      // a cell that changes flips like a pixel: it shrinks in the old scene and grows back in the new one
      const k = f.animate ? morphProgress(i, col, row, l.cols, l.rows, t - f.scene.start) : 1;
      const toFace = f.scene.to === 1 ? k : 1 - k;
      if (toFace < 0.5) look(0, 1 - toFace * 2);
      else look(1, toFace * 2 - 1);
    }
  }
  ctx.globalAlpha = 1;
}
