# Portfolio v2 · Piano 3: Pixel field — Implementation Plan

## Stato (2026-10-06): completato, poi superato: niente più glifo "edm." né volto in pixel; l'hero tiene solo il campo astratto di puntini pastello (spec §17, 2026-10-05).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** il campo di pixel dell'hero (spec §10.2 riga Hero, §10.4): pixel che si compongono in "edm.", poi un'onda continua; il mouse li respinge e li accende; un tocco o un clic genera un'onda circolare. Con controllo di pausa (WCAG 2.2.2), immagine ferma con `prefers-reduced-motion`, nessun impatto su CLS, LCP e scroll.

**Architecture:** tre file in `src/app/pixel-field/`. `field.ts` contiene solo funzioni pure (glifo bitmap, griglia, easing, onda, attenuazione del puntatore, onda circolare), testate in isolamento. `render.ts` disegna un fotogramma su un `CanvasRenderingContext2D` a partire da griglia, palette e stato. `pixel-field.ts` è il componente: canvas `aria-hidden`, ciclo `requestAnimationFrame` avviato in `afterNextRender`, fermo quando è fuori schermo, con la scheda nascosta o in pausa; ridisegna al cambio di tema e di dimensione. Niente GSAP: il campo è un ciclo canvas puro (GSAP arriva nel Piano 5 per le animazioni allo scroll).

**Tech Stack:** Angular 22 (signals, `afterNextRender`, `viewChild`), Canvas 2D, `ResizeObserver`, `IntersectionObserver`, `MutationObserver`, Vitest, Playwright + axe, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§4.1 colori pixel, §7 tema, §10.2, §10.4, §11, §12)

**Base:** Piani 1 e 2 completati sul branch `v2`.

## Global Constraints

- Node 24: nei comandi `export PATH="$HOME/.local/node/current/bin:$PATH";`.
- Ogni task termina con `npm run lint` (0 errori, 0 warning), `npx ng test --no-watch` e `npm run build` verdi; i task che toccano l'interfaccia anche con `npx playwright test`.
- TypeScript 6 con `strict` attivo di default e senza `noUncheckedIndexedAccess`: con ESLint strict niente `??`/`?.` su accessi a indice tipizzati come non nulli; per le ricerche che possono fallire usare `Map#get`.
- Colori solo dalle variabili CSS: `--px-1` (glifo), `--px-2`…`--px-6` (pixel accesi), `--fg` (pixel a riposo, con trasparenza). I pastello non vanno mai su testo o bottoni (spec §4.1).
- Il canvas è decorativo: `aria-hidden="true"`, nessun contenuto solo lì (spec §9). Il titolo dell'hero resta l'elemento LCP (spec §12).
- Tutto parte in `afterNextRender` dentro `try/catch`; un errore va a `ErrorHandler` e lascia la pagina usabile (spec §11).
- Lo scroll non viene mai bloccato: `touch-action: pan-y` sul canvas, nessun `preventDefault`.
- Spazio riservato via CSS prima del JavaScript: CLS = 0.
- Sistema visivo del Piano 1: angoli vivi, griglia di 8 px, niente etichette decorative. La parte "etichette con effetto scramble" della spec §10.2 non si fa: il Piano 1 ha eliminato le etichette (ruling già accettato).
- Messaggi di commit conventional commits, chiusi da:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_014t4Wg7xppYvDZKWdUJ4WtA`.

## Review Focus

1. **Ridimensionamento e rotazione del telefono durante l'animazione:** la griglia si ricalcola e il canvas resta nitido (backing store = dimensione CSS × DPR, max 2). → e2e in Task 4.
2. **Campo fuori schermo o scheda nascosta:** il ciclo si ferma (batteria, CPU). → e2e in Task 4 (due fotogrammi uguali a fondo pagina).
3. **Cambio di tema in pausa o con movimento ridotto:** il fotogramma fermo si ridisegna con i nuovi colori. → e2e in Task 4.
4. **Dito che scorre la pagina sopra il campo:** lo scroll verticale passa sempre. → e2e in Task 4 (`touch-action: pan-y`) + nessun `preventDefault` nel codice.
5. **Canvas 2D assente o API mancante (browser vecchio, errore):** niente eccezioni non gestite, niente bottone di pausa orfano, contenuto intatto. → unit test in Task 3.

---

### Task 1: Funzioni pure del campo

**Files:**
- Create: `src/app/pixel-field/field.ts`, `src/app/pixel-field/field.spec.ts`

**Interfaces:**
- Produces:
  - `CELL = 12`, `DOT = 8`, `COMPOSE_MS = 1400`, `POINTER_RADIUS = 96`, `RIPPLE_MS = 1600`
  - `interface Glyph { width: number; height: number; cells: readonly (readonly [number, number])[] }`
  - `glyph(text: string): Glyph` (caratteri supportati: `e`, `d`, `m`, `.`)
  - `interface FieldLayout { cols: number; rows: number; x0: number; y0: number; scale: number; glyph: Uint8Array }`
  - `layout(width: number, height: number, g: Glyph): FieldLayout`
  - `hash(n: number): number` in [0, 1)
  - `easeOutCubic(t: number): number` (con clamp a [0, 1])
  - `composeProgress(index: number, t: number): number` in [0, 1]
  - `wave(col: number, row: number, t: number): number` in [0, 1]
  - `falloff(distance: number, radius?: number): number` in [0, 1]
  - `ripple(distance: number, age: number): number` in [0, 1]

- [ ] **Step 1: Test (RED)** — `src/app/pixel-field/field.spec.ts`

```ts
import { CELL, COMPOSE_MS, POINTER_RADIUS, RIPPLE_MS, composeProgress, easeOutCubic, falloff, glyph, hash, layout, ripple, wave } from './field';

describe('pixel field maths', () => {
  it('builds the "edm." glyph from a 7-row bitmap font', () => {
    const g = glyph('edm.');
    expect(g.height).toBe(7);
    expect(g.width).toBe(5 + 1 + 5 + 1 + 5 + 1 + 1);
    expect(g.cells).toContainEqual([g.width - 1, 6]); // the dot sits on the baseline
    expect(g.cells.every(([x, y]) => x >= 0 && x < g.width && y >= 0 && y < 7)).toBe(true);
  });

  it('rejects characters it cannot draw', () => {
    expect(() => glyph('x')).toThrow('No pixel glyph for "x"');
  });

  it('fits a grid to the canvas and centres both grid and glyph', () => {
    const g = glyph('edm.');
    const l = layout(1000, 300, g);
    expect(l.cols).toBe(Math.floor(1000 / CELL));
    expect(l.rows).toBe(Math.floor(300 / CELL));
    expect(l.x0).toBeCloseTo((1000 - l.cols * CELL) / 2);
    expect(l.scale).toBe(2);
    const lit = [...l.glyph.keys()].filter((i) => l.glyph[i] === 1);
    expect(lit).toHaveLength(g.cells.length * l.scale * l.scale);
    const cols = lit.map((i) => i % l.cols);
    const left = Math.min(...cols);
    const right = l.cols - 1 - Math.max(...cols);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it('keeps the glyph at scale 1 and inside the grid on a 320 px phone', () => {
    const l = layout(288, 192, glyph('edm.'));
    expect(l.scale).toBe(1);
    expect(l.glyph).toHaveLength(l.cols * l.rows);
  });

  it('never writes outside a grid that is smaller than the glyph', () => {
    const l = layout(100, 40, glyph('edm.'));
    expect(l.glyph).toHaveLength(l.cols * l.rows);
  });

  it('keeps hash, easing, compose and wave within [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
      const w = wave(i % 40, i % 13, i * 37);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(composeProgress(5, 0)).toBe(0);
    expect(composeProgress(5, COMPOSE_MS)).toBe(1);
  });

  it('pushes hardest at the pointer and not at all outside its radius', () => {
    expect(falloff(0)).toBe(1);
    expect(falloff(POINTER_RADIUS)).toBe(0);
    expect(falloff(POINTER_RADIUS * 2)).toBe(0);
    expect(falloff(10)).toBeGreaterThan(falloff(50));
  });

  it('moves the ripple ring outwards and fades it out', () => {
    const peakEarly = [0, 20, 40, 60, 80].map((d) => ripple(d, 100));
    const peakLate = [0, 200, 300, 400].map((d) => ripple(d, 700));
    expect(peakEarly.indexOf(Math.max(...peakEarly))).toBeLessThan(3);
    expect(peakLate.indexOf(Math.max(...peakLate))).toBeGreaterThan(0);
    expect(ripple(0, RIPPLE_MS)).toBe(0);
    expect(ripple(0, -1)).toBe(0);
  });
});
```

Run: `npx ng test --no-watch --include src/app/pixel-field/field.spec.ts`
Expected: FAIL (`Could not resolve "./field"`).

- [ ] **Step 2: Implementa `src/app/pixel-field/field.ts`**

```ts
/** Pure maths for the hero pixel field. Sizes are CSS pixels, times are milliseconds. */

export const CELL = 12;
export const DOT = 8;
export const COMPOSE_MS = 1400;
export const POINTER_RADIUS = 96;
export const RIPPLE_MS = 1600;

const RIPPLE_SPEED = 0.45; // px per ms
const RIPPLE_WIDTH = 36;

// 5×7 bitmap font, lowercase sits on rows 2–6.
const FONT = new Map<string, readonly string[]>([
  ['e', ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####']],
  ['d', ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####']],
  ['m', ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#']],
  ['.', ['.', '.', '.', '.', '.', '.', '#']],
]);

export interface Glyph {
  width: number;
  height: number;
  cells: readonly (readonly [number, number])[];
}

export function glyph(text: string): Glyph {
  const cells: [number, number][] = [];
  let x = 0;
  for (const char of text) {
    const rows = FONT.get(char);
    if (!rows) throw new Error(`No pixel glyph for "${char}"`);
    rows.forEach((row, y) => {
      [...row].forEach((bit, dx) => {
        if (bit === '#') cells.push([x + dx, y]);
      });
    });
    x += Math.max(...rows.map((row) => row.length)) + 1;
  }
  return { width: x - 1, height: 7, cells };
}

export interface FieldLayout {
  cols: number;
  rows: number;
  /** Offset of the first cell, so the grid sits centred in the canvas. */
  x0: number;
  y0: number;
  scale: number;
  /** 1 where a cell belongs to the glyph, indexed row * cols + col. */
  glyph: Uint8Array;
}

export function layout(width: number, height: number, g: Glyph): FieldLayout {
  const cols = Math.max(1, Math.floor(width / CELL));
  const rows = Math.max(1, Math.floor(height / CELL));
  const scale = Math.max(1, Math.floor(Math.min((cols * 0.6) / g.width, (rows * 0.7) / g.height)));
  const left = Math.floor((cols - g.width * scale) / 2);
  const top = Math.floor((rows - g.height * scale) / 2);
  const mask = new Uint8Array(cols * rows);
  for (const [gx, gy] of g.cells) {
    for (let sy = 0; sy < scale; sy++) {
      for (let sx = 0; sx < scale; sx++) {
        const col = left + gx * scale + sx;
        const row = top + gy * scale + sy;
        if (col >= 0 && col < cols && row >= 0 && row < rows) mask[row * cols + col] = 1;
      }
    }
  }
  return { cols, rows, x0: (width - cols * CELL) / 2, y0: (height - rows * CELL) / 2, scale, glyph: mask };
}

/** Deterministic pseudo-random number in [0, 1). */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
}

/** How far glyph cell `index` has travelled to its place, with a per-cell delay. */
export function composeProgress(index: number, t: number): number {
  const delay = hash(index) * 500;
  return easeOutCubic((t - delay) / (COMPOSE_MS - 500));
}

/** Diagonal wave that keeps rolling across the field. */
export function wave(col: number, row: number, t: number): number {
  return (Math.sin(col * 0.35 + row * 0.2 - t * 0.0022) + 1) / 2;
}

/** 1 at the pointer, 0 at `radius` and beyond. */
export function falloff(distance: number, radius = POINTER_RADIUS): number {
  return distance >= radius ? 0 : (1 - distance / radius) ** 2;
}

/** Strength of a circular wave `age` ms after a tap, `distance` px from it. */
export function ripple(distance: number, age: number): number {
  if (age < 0 || age >= RIPPLE_MS) return 0;
  const ring = Math.max(0, 1 - Math.abs(distance - age * RIPPLE_SPEED) / RIPPLE_WIDTH);
  return ring * (1 - age / RIPPLE_MS);
}
```

Run il test → PASS (8 test). Se `scale` per 1000×300 non è 2, ricontrolla la formula: `cols = 83`, `rows = 25` → `min(83·0.6/19, 25·0.7/7) = min(2.62, 2.5)` → 2.

- [ ] **Step 3: Lint, commit**

Run: `npm run lint`
Commit: `feat: add pure maths for the hero pixel field`

---

### Task 2: Disegno di un fotogramma

**Files:**
- Create: `src/app/pixel-field/render.ts`, `src/app/pixel-field/render.spec.ts`

**Interfaces:**
- Consumes: tutto quanto prodotto dal Task 1.
- Produces:
  - `interface Palette { glyph: string; dot: string; lit: readonly string[] }`
  - `interface Point { x: number; y: number }`
  - `interface Ripple extends Point { start: number }`
  - `interface FrameState { t: number; animate: boolean; pointer: Point | null; ripples: readonly Ripple[] }`
  - `readPalette(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Palette`
  - `drawFrame(ctx: CanvasRenderingContext2D, l: FieldLayout, p: Palette, f: FrameState): void`

- [ ] **Step 1: Test (RED)** — `src/app/pixel-field/render.spec.ts`

Il contesto finto registra solo le chiamate che `drawFrame` usa.

```ts
import { COMPOSE_MS, glyph, layout } from './field';
import { FrameState, Palette, drawFrame, readPalette } from './render';

interface Rect { x: number; y: number; size: number; alpha: number; color: string }

function fakeContext() {
  const rects: Rect[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    clearRect: vi.fn(),
    fillRect(x: number, y: number, w: number) {
      rects.push({ x, y, size: w, alpha: ctx.globalAlpha, color: ctx.fillStyle });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects };
}

const palette: Palette = { glyph: '#0066d4', dot: '#1d1d1c', lit: ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#a8e0c8', '#ffc9a8'] };
const grid = layout(600, 240, glyph('edm.'));
const still: FrameState = { t: 0, animate: false, pointer: null, ripples: [] };

describe('drawFrame', () => {
  it('draws one square per cell, glyph cells in the glyph colour', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, still);
    expect(rects).toHaveLength(grid.cols * grid.rows);
    const glyphCells = grid.glyph.reduce((n, v) => n + v, 0);
    expect(rects.filter((r) => r.color === palette.glyph && r.alpha === 1)).toHaveLength(glyphCells);
  });

  it('shows the finished glyph and a calm field when not animating', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, t: 50 });
    const dots = rects.filter((r) => r.color !== palette.glyph);
    expect(new Set(dots.map((r) => r.color))).toEqual(new Set([palette.dot]));
  });

  it('starts with the glyph invisible and scattered when animating', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: 0 });
    expect(rects.filter((r) => r.color === palette.glyph).every((r) => r.alpha === 0)).toBe(true);
  });

  it('lights the pixels around the pointer', () => {
    const { ctx, rects } = fakeContext();
    const pointer = { x: 30, y: 30 };
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, pointer });
    const near = rects.filter((r) => Math.hypot(r.x - pointer.x, r.y - pointer.y) < 24);
    expect(near.some((r) => palette.lit.includes(r.color))).toBe(true);
  });

  it('ignores the pointer when the field is still', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, pointer: { x: 30, y: 30 } });
    expect(rects.some((r) => palette.lit.includes(r.color))).toBe(false);
  });
});

describe('readPalette', () => {
  it('reads the pixel colours from CSS custom properties', () => {
    const values: Record<string, string> = { '--px-1': ' #0066d4', '--fg': '#1d1d1c', '--px-2': 'a', '--px-3': 'b', '--px-4': 'c', '--px-5': 'd', '--px-6': 'e' };
    const p = readPalette({ getPropertyValue: (name: string) => values[name] });
    expect(p).toEqual({ glyph: '#0066d4', dot: '#1d1d1c', lit: ['a', 'b', 'c', 'd', 'e'] });
  });
});
```

Run: `npx ng test --no-watch --include src/app/pixel-field/render.spec.ts` → FAIL (`Could not resolve "./render"`).

- [ ] **Step 2: Implementa `src/app/pixel-field/render.ts`**

```ts
import { CELL, COMPOSE_MS, DOT, FieldLayout, composeProgress, easeOutCubic, falloff, hash, ripple, wave } from './field';

export interface Palette {
  glyph: string;
  dot: string;
  lit: readonly string[];
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
}

const PUSH = 10; // px a pixel moves away from the pointer
const REST_ALPHA = 0.18;

export function readPalette(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Palette {
  const read = (name: string): string => style.getPropertyValue(name).trim();
  return { glyph: read('--px-1'), dot: read('--fg'), lit: ['--px-2', '--px-3', '--px-4', '--px-5', '--px-6'].map(read) };
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

      if (l.glyph[i]) {
        const k = composeProgress(i, t);
        x += (hash(i + 7) - 0.5) * l.cols * CELL * (1 - k);
        y += (hash(i + 13) - 0.5) * l.rows * CELL * (1 - k);
        ctx.globalAlpha = k;
        ctx.fillStyle = p.glyph;
        ctx.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT);
      } else {
        const e = Math.max(energy, wave(col, row, t) ** 4 * waveIn);
        const size = DOT * (0.25 + 0.75 * e);
        ctx.globalAlpha = REST_ALPHA + (1 - REST_ALPHA) * e;
        ctx.fillStyle = e > 0.05 ? p.lit[Math.floor(hash(i + 3) * p.lit.length)] : p.dot;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  }
  ctx.globalAlpha = 1;
}
```

Run il test → PASS (6 test). Nota: con `animate: false` il glifo è completo (`t = 2 × COMPOSE_MS`), l'onda è spenta e il puntatore ignorato: è l'"immagine ferma" usata per il movimento ridotto e per la pausa.

- [ ] **Step 3: Lint, commit**

Run: `npm run lint && npx ng test --no-watch`
Commit: `feat: draw pixel field frames on a 2D canvas`

---

### Task 3: Componente `PixelField` nell'hero

**Files:**
- Create: `src/app/pixel-field/pixel-field.ts`, `src/app/pixel-field/pixel-field.spec.ts`
- Modify: `src/app/pages/home/home.ts`, `src/locale/messages.it.xlf`

**Interfaces:**
- Consumes: `glyph`, `layout`, `RIPPLE_MS`, `FieldLayout` (Task 1); `drawFrame`, `readPalette`, `FrameState`, `Palette` (Task 2).
- Produces: `<app-pixel-field />` (`PixelField`, nessun input). Bottone di pausa con nome accessibile `Pause the pixel animation` / `Play the pixel animation` (IT: `Metti in pausa l'animazione dei pixel` / `Riprendi l'animazione dei pixel`), mostrato solo quando l'animazione è possibile.

- [ ] **Step 1: Test (RED)** — `src/app/pixel-field/pixel-field.spec.ts`

jsdom non ha né Canvas 2D né `ResizeObserver`: sono proprio i due guasti da coprire (Review Focus #5).

```ts
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelField } from './pixel-field';

describe('PixelField', () => {
  afterEach(() => vi.restoreAllMocks());

  async function render() {
    const handleError = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useValue: { handleError } }] });
    const fixture = TestBed.createComponent(PixelField);
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, handleError };
  }

  it('renders a decorative canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { el } = await render();
    expect(el.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays quiet and offers no pause button without a 2D canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { el, handleError } = await render();
    expect(el.querySelector('button')).toBeNull();
    expect(handleError).not.toHaveBeenCalled();
  });

  it('reports a failure while starting and leaves no pause button behind', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    vi.stubGlobal('ResizeObserver', undefined);
    const { el, handleError } = await render();
    expect(handleError).toHaveBeenCalledOnce();
    expect(el.querySelector('button')).toBeNull();
    vi.unstubAllGlobals();
  });
});
```

Run: `npx ng test --no-watch --include src/app/pixel-field/pixel-field.spec.ts` → FAIL (`Could not resolve "./pixel-field"`).

- [ ] **Step 2: Implementa `src/app/pixel-field/pixel-field.ts`**

L'altezza è riservata da CSS (`:host`), quindi il canvas non sposta nulla quando parte. Il bottone di pausa compare solo dopo l'avvio, posizionato in assoluto sopra il canvas: anche lui non sposta il layout.

```ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FieldLayout, RIPPLE_MS, glyph, layout } from './field';
import { FrameState, Palette, Point, drawFrame, readPalette } from './render';

const MAX_RIPPLES = 4;
const MAX_STEP_MS = 100; // a long pause between frames must not jump the animation

@Component({
  selector: 'app-pixel-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    @if (animated()) {
      <button type="button" class="pause" (click)="toggle()" [attr.aria-label]="label()">
        <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          @if (playing()) {
            <path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z" />
          } @else {
            <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />
          }
        </svg>
      </button>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      height: clamp(12rem, 32vw, 22rem);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y;
    }
    .pause {
      position: absolute;
      right: 0;
      bottom: 0;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 1px solid var(--rule);
      background: var(--bg);
      color: var(--fg);
      cursor: pointer;
    }
  `,
})
export class PixelField {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly animated = signal(false);
  protected readonly playing = signal(true);
  protected readonly label = computed(() =>
    this.playing()
      ? $localize`:@@field.pause:Pause the pixel animation`
      : $localize`:@@field.play:Play the pixel animation`,
  );

  private ctx: CanvasRenderingContext2D | null = null;
  private grid: FieldLayout | null = null;
  private palette: Palette = { glyph: '', dot: '', lit: [] };
  private readonly frame: FrameState & { ripples: FrameState['ripples'] } = { t: 0, animate: false, pointer: null, ripples: [] };
  private visible = true;
  private raf = 0;
  private last = 0;
  private readonly cleanups: (() => void)[] = [];

  constructor() {
    const errors = inject(ErrorHandler);
    afterNextRender(() => {
      try {
        this.start();
      } catch (err: unknown) {
        this.stop();
        errors.handleError(err);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  protected toggle(): void {
    this.playing.update((playing) => !playing);
    this.frame.animate = this.playing();
    this.render();
    this.sync();
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const win = window;
    const root = document.documentElement;
    const text = glyph('edm.');
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = (): void => {
      const dpr = Math.min(win.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.grid = layout(canvas.clientWidth, canvas.clientHeight, text);
      this.render();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    this.cleanups.push(() => {
      sizes.disconnect();
    });

    const views = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    views.observe(canvas);
    this.cleanups.push(() => {
      views.disconnect();
    });

    const themes = new MutationObserver(() => {
      this.palette = readPalette(win.getComputedStyle(root));
      this.render();
    });
    themes.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    this.cleanups.push(() => {
      themes.disconnect();
    });

    const onVisibility = (): void => {
      this.sync();
    };
    const onMotion = (): void => {
      this.animated.set(!motion.matches);
      this.frame.animate = this.animated() && this.playing();
      this.render();
      this.sync();
    };
    const local = (e: PointerEvent): Point => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') this.frame.pointer = local(e);
    };
    const onLeave = (): void => {
      this.frame.pointer = null;
    };
    const onDown = (e: PointerEvent): void => {
      if (!this.frame.animate) return;
      this.frame.ripples = [...this.frame.ripples.slice(1 - MAX_RIPPLES), { ...local(e), start: this.frame.t }];
    };
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    this.cleanups.push(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    });

    this.ctx = ctx;
    this.palette = readPalette(win.getComputedStyle(root));
    resize();
    onMotion();
  }

  private stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.cleanups.splice(0).forEach((cleanup) => {
      cleanup();
    });
    this.animated.set(false);
  }

  /** Runs the loop only while it can be seen and nobody asked it to stop. */
  private sync(): void {
    const run = this.frame.animate && this.visible && !document.hidden;
    if (run && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private readonly tick = (now: number): void => {
    this.frame.t += Math.min(MAX_STEP_MS, Math.max(0, now - this.last));
    this.last = now;
    this.frame.ripples = this.frame.ripples.filter((r) => this.frame.t - r.start < RIPPLE_MS);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (this.ctx && this.grid) drawFrame(this.ctx, this.grid, this.palette, this.frame);
  }
}
```

Nota: `stop()` rimette `animated` a `false`, così un errore all'avvio non lascia il bottone di pausa (test 3). Se `FrameState.ripples` è `readonly Ripple[]`, l'assegnazione di un nuovo array funziona comunque: il campo `ripples` dell'oggetto non è `readonly`.

Run il test → PASS (3 test).

- [ ] **Step 3: Inserisci il campo nell'hero**

In `src/app/pages/home/home.ts`: importa `PixelField` e aggiungilo agli `imports`; nel template, subito dopo `<div class="actions">…</div>` dentro la sezione `.hero`, aggiungi `<app-pixel-field class="field" />`; negli stili aggiungi `.field { margin-top: var(--space-6); }`.

- [ ] **Step 4: Traduzioni**

`npm run i18n:extract`, poi in `messages.it.xlf`: `field.pause` → `Metti in pausa l'animazione dei pixel`, `field.play` → `Riprendi l'animazione dei pixel`.

- [ ] **Step 5: Verifica e commit**

Run: `npm run lint && npx ng test --no-watch && npm run build && npx playwright test`
Expected: tutto verde, axe compreso (il bottone di pausa ha un nome).

Commit: `feat: animate the hero pixel field with pause, reduced motion and pointer effects`

---

### Task 4: Test end-to-end, prestazioni e controllo visivo

**Files:**
- Create: `e2e/pixel-field.spec.ts`

**Interfaces:**
- Consumes: `<app-pixel-field>` nella home (Task 3), bottone del tema `Switch to light theme` / `Switch to dark theme` (Piano 1).
- Produces: copertura e2e di Review Focus #1–#4 e dei requisiti §11 su movimento ridotto, pausa, CLS e JavaScript disattivato.

- [ ] **Step 1: Scrivi `e2e/pixel-field.spec.ts`**

```ts
import { expect, test, type Page } from '@playwright/test';

const canvas = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => canvas(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
const isPainted = (page: Page) =>
  canvas(page).evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const blank = document.createElement('canvas');
    blank.width = el.width;
    blank.height = el.height;
    return el.toDataURL() !== blank.toDataURL();
  });

test('draws the field and keeps it moving', async ({ page }) => {
  await page.goto('/en/');
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => isPainted(page)).toBe(true);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('the pause button stops the animation and works from the keyboard', async ({ page }) => {
  await page.goto('/en/');
  const pause = page.getByRole('button', { name: 'Pause the pixel animation' });
  await pause.focus();
  await page.keyboard.press('Enter');
  const play = page.getByRole('button', { name: 'Play the pixel animation' });
  await expect(play).toBeFocused();
  const still = await snapshot(page);
  await page.waitForTimeout(300);
  expect(await snapshot(page)).toBe(still);
  await play.press('Enter');
  await expect(pause).toBeVisible();
});

test('repaints with the new colours when the theme changes while paused', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Pause the pixel animation' }).click();
  const before = await snapshot(page);
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('stops drawing when scrolled out of view', async ({ page }) => {
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const away = await snapshot(page);
  await page.waitForTimeout(300);
  expect(await snapshot(page)).toBe(away);
});

test('stays sharp after the window is resized', async ({ page }) => {
  await page.goto('/en/');
  await page.setViewportSize({ width: 375, height: 800 });
  await expect
    .poll(() =>
      canvas(page).evaluate((c) => {
        const el = c as HTMLCanvasElement;
        return el.width - Math.round(el.clientWidth * Math.min(window.devicePixelRatio, 2));
      }),
    )
    .toBe(0);
});

test('never blocks vertical scrolling on touch screens', async ({ page }) => {
  await page.goto('/en/');
  expect(await canvas(page).evaluate((c) => getComputedStyle(c).touchAction)).toBe('pan-y');
});

test('does not shift the layout while it starts', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'layout-shift entries exist only in Chromium');
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  const shift = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) total += (entry as PerformanceEntry & { value: number }).value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          resolve(total);
        }, 200);
      }),
  );
  expect(shift).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows a still picture and no pause button', async ({ page }) => {
    await page.goto('/it/');
    await expect.poll(() => isPainted(page)).toBe(true);
    await expect(page.getByRole('button', { name: "Metti in pausa l'animazione dei pixel" })).toHaveCount(0);
    const still = await snapshot(page);
    await page.waitForTimeout(300);
    expect(await snapshot(page)).toBe(still);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the hero text and the space for the field', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toBeVisible();
    const box = await page.locator('app-pixel-field').boundingBox();
    expect(box?.height).toBeGreaterThan(150);
  });
});
```

- [ ] **Step 2: Esegui**

Run: `npm run lint && npm run build && npx playwright test`
Expected: tutto verde in Chromium, Firefox e Android (WebKit solo in CI). Se il test "stops drawing when scrolled out of view" fallisce, il ciclo non si ferma: correggi `sync()` (il problema è nel codice, non nel test).

- [ ] **Step 3: Prestazioni**

Run: `npm run lhci`
Expected: Performance ≥ 0.95 su tutte le pagine, LCP sul titolo dell'hero (controlla `largest-contentful-paint-element` nei report `.lighthouseci/lhr-*.json`).

- [ ] **Step 4: Controllo visivo**

Con il build servito (`npx http-server dist/portfolio/browser -p 4301 -s`), in Chrome a 1440 px e in Playwright a 375 px, light e dark: il glifo "edm." si compone in circa 1,5 s, l'onda è lenta e non lampeggia (WCAG 2.3.1), il mouse respinge e accende i pixel, un clic crea l'onda circolare, il bottone di pausa è leggibile in entrambi i temi. Valuta l'effetto con lo sguardo della skill `frontend-design`: se i pixel a riposo distraggono dal titolo, abbassa `REST_ALPHA` in `render.ts` (registra la ruling).

- [ ] **Step 5: Commit**

Commit: `test: cover the pixel field end to end: pause, reduced motion, resize, theme and CLS`

---

### Fine piano

- [ ] `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npx playwright test && npm run lhci` tutto verde.
- [ ] Push del branch `v2` e CI di GitHub verde.
