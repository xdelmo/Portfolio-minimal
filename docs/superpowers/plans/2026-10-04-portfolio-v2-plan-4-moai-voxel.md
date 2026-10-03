# Portfolio v2 · Piano 4: Moai voxel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** il moai voxel della sezione About (spec §4.3, §10.2 riga About, §10.3): modello definito in TypeScript, scena Three.js caricata solo quando serve, rotazione con lo scroll e trascinamento su desktop, rotazione automatica su mobile, esplosione in cubetti a fine sezione, e un'immagine statica identica come riserva per movimento ridotto, assenza di WebGL, errori o JavaScript disattivato.

**Architecture:** in `src/app/voxel/`:
- `moai.model.ts`: forma e colori come funzione pura, senza import a runtime;
- `iso.ts`: proiezione isometrica pura (facce visibili, limiti, SVG);
- `motion.ts`: calcoli puri di scroll, esplosione e smorzamento;
- `moai-scene.ts`: Three.js con `InstancedMesh`, camera ortografica lungo (1, 1, 1);
- `moai-figure.ts`: decide fra immagine statica e scena, con `@defer (on viewport)` e i blocchi `@placeholder`/`@error`.

L'immagine statica `public/images/moai.png` è generata una volta da `scripts/moai-image.mjs`: rasterizza con Playwright l'SVG isometrico del modello. Siccome la camera della scena guarda lungo la stessa direzione con proiezione ortografica, immagine e scena coincidono e lo scambio non si nota.

**Tech Stack:** Angular 22 (`@defer`, signals, `afterNextRender`, `output`), Three.js 0.186 (`WebGLRenderer`, `InstancedMesh`, `OrthographicCamera`, `MeshLambertMaterial`), Node 24 (type stripping per lo script), Vitest, Playwright + axe, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§4.3, §7, §9, §10.2, §10.3, §11, §12, §13)

**Base:** Piani 1–3 completati sul branch `v2`.

## Global Constraints

- Node 24: nei comandi `export PATH="$HOME/.local/node/current/bin:$PATH";`.
- Ogni task termina con `npm run lint` (0 errori, 0 warning), `npx ng test --no-watch` e `npm run build` verdi; i task che toccano l'interfaccia anche con `npx playwright test`.
- TypeScript 6 strict senza `noUncheckedIndexedAccess`; nei template literal i numeri passano da `String()` (regola `restrict-template-expressions`).
- Three.js usato direttamente, non angular-three (spec §5). Import nominativi da `three` solo in `moai-scene.ts`, che arriva solo tramite `@defer`: il JavaScript iniziale resta sotto 150 KB gzip (spec §12), controllato dal postbuild (Task 6).
- Niente GSAP in questo piano. Il pin di §10.2 è `position: sticky`, nativo; rotazione ed esplosione si calcolano dalla posizione della sezione nel ciclo di disegno. Ruling: è il gradino nativo che copre il requisito; GSAP resta disponibile per il Piano 5.
- Colori dalle variabili CSS (spec §4.3): corpo `--stone`, `--stone-dark`, `--stone-light` (nuovi token, grigi del tema), occhi `--accent`, pukao `--px-6`, muschio `--px-5`. La scena li rilegge al cambio di `data-theme`.
- Decorativo (spec §9): canvas e immagine con `aria-hidden="true"` e `alt=""`. I controlli (ruota a sinistra e a destra, pausa) sono veri `<button>` con nome localizzato, target 48×48.
- WCAG 2.2: 2.1.1 e 2.5.7, ogni rotazione da trascinamento ha l'alternativa nei bottoni; 2.2.2, la rotazione automatica su mobile ha la pausa; 2.3.1, nessun lampeggio; con `prefers-reduced-motion` niente scena, solo l'immagine.
- Robustezza (spec §11): ogni passo della scena è in `try/catch`. Eccezioni, `webglcontextlost` e pacchetto non scaricato portano all'immagine statica. Su touch `touch-action: pan-y`, niente trascinamento né `preventDefault`. DPR massimo 2 su desktop e 1.5 su mobile. Alla distruzione si rilasciano geometria, materiale e contesto WebGL.
- CLS = 0: immagine, segnaposto e scena hanno lo stesso `aspect-ratio`, fissato da CSS.
- Messaggi di commit conventional commits, chiusi da:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_014t4Wg7xppYvDZKWdUJ4WtA`.

## Review Focus

1. **Contesto WebGL perso a metà sessione** (reset della GPU, troppe schede): il moai torna all'immagine, nessun errore in console. → e2e in Task 6 (`WEBGL_lose_context`).
2. **Andare e tornare dalla home molte volte:** i contesti WebGL vengono rilasciati, nessun avviso "Too many active WebGL contexts". → e2e in Task 6.
3. **Cambio di tema con la scena visibile:** i cubetti prendono i nuovi colori. → e2e in Task 6.
4. **Pacchetto Three.js lento o bloccato:** resta l'immagine, nessuno spostamento di layout quando arriva la scena. → e2e in Task 6 (richiesta bloccata) + CLS.
5. **Utente solo da tastiera o con movimento ridotto:** i bottoni sono raggiungibili, il focus è visibile, niente trappole, e con movimento ridotto non si scarica Three.js. → e2e in Task 6.

---

### Task 1: Modello voxel del moai e token di colore

**Files:**
- Create: `src/app/voxel/moai.model.ts`, `src/app/voxel/moai.model.spec.ts`
- Modify: `src/styles/_tokens.scss`

**Interfaces:**
- Produces:
  - `type VoxelColor = 'stone' | 'stoneDark' | 'stoneLight' | 'eye' | 'pukao' | 'moss'`
  - `interface Voxel { x: number; y: number; z: number; color: VoxelColor }`
  - `MOAI_BOUNDS = { minX: -5, maxX: 5, minY: 0, maxY: 24, minZ: -3, maxZ: 5 }`
  - `moaiCell(x, y, z): VoxelColor | null` (solo forma, senza muschio)
  - `moaiVoxels(): Voxel[]`
  - token CSS `--stone`, `--stone-dark`, `--stone-light` in light e dark
- Il file non ha import a runtime: lo script del Task 2 lo importa direttamente con Node.

- [ ] **Step 1: Test (RED)** — `src/app/voxel/moai.model.spec.ts`

```ts
import { MOAI_BOUNDS, moaiCell, moaiVoxels } from './moai.model';

describe('moai model', () => {
  const voxels = moaiVoxels();
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;
  const positions = new Set(voxels.map((v) => key(v.x, v.y, v.z)));

  it('has a sensible number of unique voxels inside its bounds', () => {
    expect(voxels.length).toBeGreaterThan(1200);
    expect(voxels.length).toBeLessThan(2200);
    expect(positions.size).toBe(voxels.length);
    for (const v of voxels) {
      expect(v.x).toBeGreaterThanOrEqual(MOAI_BOUNDS.minX);
      expect(v.x).toBeLessThanOrEqual(MOAI_BOUNDS.maxX);
      expect(v.y).toBeGreaterThanOrEqual(MOAI_BOUNDS.minY);
      expect(v.y).toBeLessThanOrEqual(MOAI_BOUNDS.maxY);
      expect(v.z).toBeGreaterThanOrEqual(MOAI_BOUNDS.minZ);
      expect(v.z).toBeLessThanOrEqual(MOAI_BOUNDS.maxZ);
    }
  });

  it('is symmetric left to right', () => {
    for (const v of voxels) expect(positions.has(key(-v.x, v.y, v.z))).toBe(true);
  });

  it('wears the pukao on top and looks out with two accent eyes', () => {
    expect(voxels.filter((v) => v.y === MOAI_BOUNDS.maxY).every((v) => v.color === 'pukao')).toBe(true);
    expect(voxels.filter((v) => v.color === 'eye')).toHaveLength(8);
  });

  it('only the nose reaches the front-most layer', () => {
    const front = voxels.filter((v) => v.z === MOAI_BOUNDS.maxZ);
    expect(front.length).toBeGreaterThan(0);
    expect(front.every((v) => v.x === 0)).toBe(true);
  });

  it('grows moss only on stone with nothing above it', () => {
    const moss = voxels.filter((v) => v.color === 'moss');
    expect(moss.length).toBeGreaterThan(0);
    for (const v of moss) {
      expect(moaiCell(v.x, v.y, v.z)).toBe('stone');
      expect(moaiCell(v.x, v.y + 1, v.z)).toBeNull();
    }
  });

  it('is the same every time', () => {
    expect(moaiVoxels()).toEqual(voxels);
  });
});
```

Run: `npx ng test --no-watch --include src/app/voxel/moai.model.spec.ts` → FAIL (`Could not resolve "./moai.model"`).

- [ ] **Step 2: Implementa `src/app/voxel/moai.model.ts`**

```ts
/**
 * The moai as a voxel grid: x across (0 is the nose column), y up, z towards the viewer
 * (the face looks at +z). No runtime imports: scripts/moai-image.mjs loads this file directly.
 */

export type VoxelColor = 'stone' | 'stoneDark' | 'stoneLight' | 'eye' | 'pukao' | 'moss';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: VoxelColor;
}

export const MOAI_BOUNDS = { minX: -5, maxX: 5, minY: 0, maxY: 24, minZ: -3, maxZ: 5 } as const;

/** Shape only: the colour a cell has before moss and weathering, or null when it is empty. */
export function moaiCell(x: number, y: number, z: number): VoxelColor | null {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  if (y < MOAI_BOUNDS.minY || y > MOAI_BOUNDS.maxY || ax > MOAI_BOUNDS.maxX || z < MOAI_BOUNDS.minZ || z > MOAI_BOUNDS.maxZ) {
    return null;
  }

  if (y <= 7) {
    // torso: rounded back corners, arms down the sides, hands meeting on the belly
    if (z > 3 || (ax === 5 && az === 3)) return null;
    if (y === 3 && z === 3 && ax <= 4) return 'stoneDark';
    if (ax === 5 && y >= 2 && z >= 0) return 'stoneDark';
    return 'stone';
  }
  if (y <= 9) return ax <= 4 && z <= 3 ? 'stone' : null; // neck
  if (y <= 20) {
    if (ax === 5) return y >= 11 && y <= 18 && (z === -1 || z === 0) ? 'stoneDark' : null; // long ears
    if (z <= 3) return z === 3 && y >= 15 && y <= 16 && ax >= 2 && ax <= 3 ? 'eye' : 'stone';
    if (z === 4) {
      if (y >= 18 && y <= 19) return 'stoneLight'; // heavy brow
      if (ax === 0 && y >= 11) return 'stoneLight'; // long nose
      if (ax === 1 && y === 11) return 'stoneLight'; // nostrils
      if (y === 10 && ax <= 2) return 'stoneDark'; // pursed lips
      return null;
    }
    return ax === 0 && y >= 11 && y <= 13 ? 'stoneLight' : null; // tip of the nose (z = 5)
  }
  if (y <= 21) return ax <= 3 && az <= 2 ? 'stone' : null; // crown
  return x * x + z * z <= 9 ? 'pukao' : null; // pukao (y 22–24)
}

/** Deterministic noise in [0, 1) for moss and weathering. */
function noise(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function moaiVoxels(): Voxel[] {
  const voxels: Voxel[] = [];
  for (let y = MOAI_BOUNDS.minY; y <= MOAI_BOUNDS.maxY; y++) {
    for (let z = MOAI_BOUNDS.minZ; z <= MOAI_BOUNDS.maxZ; z++) {
      for (let x = MOAI_BOUNDS.minX; x <= MOAI_BOUNDS.maxX; x++) {
        const base = moaiCell(x, y, z);
        if (!base) continue;
        let color: VoxelColor = base;
        if (base === 'stone') {
          const n = noise(x, y, z);
          if (moaiCell(x, y + 1, z) === null && n < 0.3) color = 'moss';
          else if (n > 0.86) color = 'stoneLight';
        }
        voxels.push({ x, y, z, color });
      }
    }
  }
  return voxels;
}
```

Run il test → PASS (6 test). Se il conteggio esce dall'intervallo, controlla i rami della funzione: la stima è torso 584, collo 126, testa circa 760, corona 35, pukao 87 (in totale circa 1590).

- [ ] **Step 3: Token di colore**

In `src/styles/_tokens.scss`, accanto a `--px-6` del tema light aggiungi:

```scss
  --stone: #a3a39d;
  --stone-dark: #85857f;
  --stone-light: #bdbdb6;
```

e accanto a `--px-6` del tema dark:

```scss
  --stone: #7d7d78;
  --stone-dark: #62625e;
  --stone-light: #9a9a94;
```

- [ ] **Step 4: Lint, commit**

Run: `npm run lint && npx ng test --no-watch`
Commit: `feat: model the moai as a voxel grid`

---

### Task 2: Proiezione isometrica e immagine statica

**Files:**
- Create: `src/app/voxel/iso.ts`, `src/app/voxel/iso.spec.ts`, `scripts/moai-image.mjs`, `public/images/moai.png`, `src/app/voxel/moai-image.ts`

**Interfaces:**
- Consumes: `Voxel`, `VoxelColor`, `moaiVoxels` (Task 1).
- Produces:
  - `COS30`, `project(x, y, z): [number, number]`
  - `interface IsoFace { points: readonly (readonly [number, number])[]; color: VoxelColor; shade: number }`
  - `isoFaces(voxels): IsoFace[]` (solo facce esposte, dalla più lontana)
  - `interface IsoBounds { minX: number; minY: number; width: number; height: number }`, `isoBounds(faces): IsoBounds`
  - `shadeHex(hex: string, k: number): string`
  - `isoSvg(voxels, palette: Record<VoxelColor, string>, unit: number): string`
  - `MOAI_IMAGE = { src: 'images/moai.png', width: number, height: number }` (dimensioni CSS)

- [ ] **Step 1: Test (RED)** — `src/app/voxel/iso.spec.ts`

```ts
import { Voxel } from './moai.model';
import { COS30, isoBounds, isoFaces, isoSvg, project, shadeHex } from './iso';

const cube: Voxel[] = [{ x: 0, y: 0, z: 0, color: 'stone' }];
const palette = { stone: '#808080', stoneDark: '#404040', stoneLight: '#c0c0c0', eye: '#0066d4', pukao: '#ffc9a8', moss: '#a8e0c8' };

describe('isometric projection', () => {
  it('projects x down-right, z down-left and y straight up', () => {
    expect(project(1, 0, 0)).toEqual([COS30, 0.5]);
    expect(project(0, 0, 1)).toEqual([-COS30, 0.5]);
    expect(project(0, 1, 0)).toEqual([0, -1]);
  });

  it('draws the three visible faces of a lone cube', () => {
    const faces = isoFaces(cube);
    expect(faces).toHaveLength(3);
    expect(faces.map((f) => f.shade).sort()).toEqual([0.72, 0.86, 1]);
  });

  it('hides faces covered by a neighbour', () => {
    const faces = isoFaces([...cube, { x: 1, y: 0, z: 0, color: 'stone' }]);
    expect(faces).toHaveLength(5);
  });

  it('paints far cubes before near ones', () => {
    const faces = isoFaces([
      { x: 2, y: 2, z: 2, color: 'eye' },
      { x: 0, y: 0, z: 0, color: 'stone' },
    ]);
    expect(faces[0].color).toBe('stone');
    expect(faces.at(-1)?.color).toBe('eye');
  });

  it('measures the drawing', () => {
    const b = isoBounds(isoFaces(cube));
    expect(b.width).toBeCloseTo(2 * COS30);
    expect(b.height).toBeCloseTo(2);
  });

  it('darkens colours for the shaded faces', () => {
    expect(shadeHex('#808080', 0.5)).toBe('#404040');
    expect(shadeHex('#ffffff', 1)).toBe('#ffffff');
  });

  it('writes a self-contained SVG sized to the drawing', () => {
    const svg = isoSvg(cube, palette, 10);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(3);
    expect(svg).toContain(`width="${String(Math.round(2 * COS30 * 10))}"`);
  });
});
```

Run: `npx ng test --no-watch --include src/app/voxel/iso.spec.ts` → FAIL (`Could not resolve "./iso"`).

- [ ] **Step 2: Implementa `src/app/voxel/iso.ts`**

Solo import di tipo, così Node può caricarlo nello script.

```ts
import type { Voxel, VoxelColor } from './moai.model';

export const COS30 = Math.cos(Math.PI / 6);

export interface IsoFace {
  points: readonly (readonly [number, number])[];
  color: VoxelColor;
  shade: number;
}

export interface IsoBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/** True isometric view from (1, 1, 1): x goes down-right, z down-left, y straight up. */
export function project(x: number, y: number, z: number): [number, number] {
  return [(x - z) * COS30, (x + z) / 2 - y];
}

/** Exposed front (+z), right (+x) and top (+y) faces, ordered from the farthest cube to the nearest. */
export function isoFaces(voxels: readonly Voxel[]): IsoFace[] {
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;
  const filled = new Set(voxels.map((v) => key(v.x, v.y, v.z)));
  const faces: IsoFace[] = [];
  const farFirst = [...voxels].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z));
  for (const { x, y, z, color } of farFirst) {
    if (!filled.has(key(x, y, z + 1))) {
      faces.push({ color, shade: 0.86, points: [project(x, y, z + 1), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
    }
    if (!filled.has(key(x + 1, y, z))) {
      faces.push({ color, shade: 0.72, points: [project(x + 1, y, z), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x + 1, y + 1, z)] });
    }
    if (!filled.has(key(x, y + 1, z))) {
      faces.push({ color, shade: 1, points: [project(x, y + 1, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
    }
  }
  return faces;
}

export function isoBounds(faces: readonly IsoFace[]): IsoBounds {
  const xs = faces.flatMap((f) => f.points.map((p) => p[0]));
  const ys = faces.flatMap((f) => f.points.map((p) => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(c * k).toString(16).padStart(2, '0')).join('')}`;
}

export function isoSvg(voxels: readonly Voxel[], palette: Readonly<Record<VoxelColor, string>>, unit: number): string {
  const faces = isoFaces(voxels);
  const b = isoBounds(faces);
  const num = (n: number): string => String(Math.round(n * 10) / 10);
  const point = (p: readonly [number, number]): string => `${num((p[0] - b.minX) * unit)},${num((p[1] - b.minY) * unit)}`;
  const polygons = faces.map((f) => {
    const fill = shadeHex(palette[f.color], f.shade);
    return `<polygon points="${f.points.map(point).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"/>`;
  });
  const w = String(Math.round(b.width * unit));
  const h = String(Math.round(b.height * unit));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${polygons.join('')}</svg>`;
}
```

Run il test → PASS (7 test).

- [ ] **Step 3: Script dell'immagine `scripts/moai-image.mjs`**

```js
// Renders the still moai used before the 3D scene loads, with reduced motion and when WebGL fails.
// Run after changing the model: node scripts/moai-image.mjs, then update src/app/voxel/moai-image.ts.
import { chromium } from 'playwright';
import { isoSvg } from '../src/app/voxel/iso.ts';
import { moaiVoxels } from '../src/app/voxel/moai.model.ts';

const UNIT = 16; // CSS px per voxel edge
const palette = {
  stone: '#a3a39d',
  stoneDark: '#85857f',
  stoneLight: '#bdbdb6',
  eye: '#0066d4',
  pukao: '#ffc9a8',
  moss: '#a8e0c8',
};

const svg = isoSvg(moaiVoxels(), palette, UNIT);
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
const figure = page.locator('svg');
await figure.screenshot({ path: 'public/images/moai.png', omitBackground: true });
const box = await figure.boundingBox();
await browser.close();
console.log(`public/images/moai.png: ${String(box?.width)} × ${String(box?.height)} CSS px (2x pixels)`);
```

Run: `node scripts/moai-image.mjs`
Expected: stampa le dimensioni CSS (circa 260 × 560) e crea `public/images/moai.png` (meno di 60 KB, controlla con `ls -la`). Aprila con lo strumento Read: deve mostrare il moai di tre quarti, con il volto in basso a sinistra, il pukao pesca, gli occhi blu e qualche pixel di muschio.

- [ ] **Step 4: Costante dell'immagine `src/app/voxel/moai-image.ts`**

Con le dimensioni stampate dallo script (arrotondate all'intero):

```ts
/** Still render of the moai, made by scripts/moai-image.mjs; width and height are CSS pixels. */
export const MOAI_IMAGE = { src: 'images/moai.png', width: 260, height: 560 } as const;
```

- [ ] **Step 5: Lint, commit**

Run: `npm run lint && npx ng test --no-watch`
Commit: `feat: render a still isometric moai from the voxel model`

---

### Task 3: Calcoli di movimento

**Files:**
- Create: `src/app/voxel/motion.ts`, `src/app/voxel/motion.spec.ts`

**Interfaces:**
- Produces:
  - `sectionProgress(top: number, height: number, viewport: number): number` in [0, 1]
  - `smoothstep(edge0: number, edge1: number, x: number): number`
  - `explodeAmount(scroll: number, entry: number): number` in [0, 1]
  - `approach(current: number, target: number, rate: number, dt: number): number`
  - `SCROLL_TURNS = 0.75`, `ENTRY_MS = 900`, `TURN_STEP = Math.PI / 6`

- [ ] **Step 1: Test (RED)** — `src/app/voxel/motion.spec.ts`

```ts
import { approach, explodeAmount, sectionProgress, smoothstep } from './motion';

describe('moai motion', () => {
  it('measures how far the section has scrolled past the middle of the screen', () => {
    expect(sectionProgress(1000, 800, 900)).toBe(0);
    expect(sectionProgress(450, 800, 900)).toBe(0);
    expect(sectionProgress(50, 800, 900)).toBeCloseTo(0.5);
    expect(sectionProgress(-1000, 800, 900)).toBe(1);
  });

  it('eases between two edges', () => {
    expect(smoothstep(0.8, 1, 0.5)).toBe(0);
    expect(smoothstep(0.8, 1, 0.9)).toBeCloseTo(0.5);
    expect(smoothstep(0.8, 1, 2)).toBe(1);
  });

  it('assembles on entry and bursts at the end of the section', () => {
    expect(explodeAmount(0, 0)).toBe(1);
    expect(explodeAmount(0, 1)).toBe(0);
    expect(explodeAmount(0.5, 1)).toBe(0);
    expect(explodeAmount(1, 1)).toBe(1);
  });

  it('approaches a target without overshooting, whatever the frame time', () => {
    expect(approach(0, 10, 10, 0)).toBe(0);
    const step = approach(0, 10, 10, 16);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(10);
    expect(approach(0, 10, 10, 10_000)).toBeCloseTo(10);
  });
});
```

Run → FAIL (`Could not resolve "./motion"`).

- [ ] **Step 2: Implementa `src/app/voxel/motion.ts`**

```ts
import { easeOutCubic } from '../pixel-field/field';

export const SCROLL_TURNS = 0.75; // turns of the moai while its section crosses the screen
export const ENTRY_MS = 900;
export const TURN_STEP = Math.PI / 6;

/** 0 while the section top is below the middle of the screen, 1 once its bottom is above it. */
export function sectionProgress(top: number, height: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport / 2 - top) / height));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Cubes fly in when the moai first appears (`entry` 0 → 1) and burst out at the end of the section. */
export function explodeAmount(scroll: number, entry: number): number {
  return Math.max(smoothstep(0.8, 1, scroll), 1 - easeOutCubic(entry));
}

/** Frame-rate independent smoothing: `rate` is per second, `dt` in milliseconds. */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp((-rate * dt) / 1000);
}
```

Run → PASS (4 test).

- [ ] **Step 3: Lint, commit**

Run: `npm run lint && npx ng test --no-watch`
Commit: `feat: add scroll, burst and smoothing maths for the moai`

---

### Task 4: Scena Three.js

**Files:**
- Create: `src/app/voxel/moai-scene.ts`, `src/app/voxel/moai-scene.spec.ts`
- Modify: `package.json` (dipendenze `three`, `@types/three`), `src/locale/messages.it.xlf`

**Interfaces:**
- Consumes: `moaiVoxels`, `VoxelColor` (Task 1); `isoFaces`, `isoBounds`, `COS30` (Task 2); `MOAI_IMAGE` (Task 2); `sectionProgress`, `explodeAmount`, `approach`, `SCROLL_TURNS`, `ENTRY_MS`, `TURN_STEP` (Task 3); `hash` (Piano 3, `pixel-field/field.ts`).
- Produces: `<app-moai-scene (failed)="…" />` (`MoaiScene`, output `failed: void`). Bottoni `Rotate the moai left` / `Rotate the moai right`, e su mobile `Stop the moai` / `Spin the moai` (IT: `Ruota il moai a sinistra`, `Ruota il moai a destra`, `Ferma il moai`, `Fai girare il moai`).

- [ ] **Step 1: Dipendenze**

Run: `npm install three@0.186.1 && npm install -D @types/three@0.186.0`
Expected: `package.json` e `package-lock.json` aggiornati, nessun errore di peer dependency.

- [ ] **Step 2: Test (RED)** — `src/app/voxel/moai-scene.spec.ts`

jsdom non ha WebGL: `WebGLRenderer` lancia un'eccezione all'avvio, ed è proprio il guasto che il componente deve gestire.

```ts
import { TestBed } from '@angular/core/testing';
import { MoaiScene } from './moai-scene';

describe('MoaiScene', () => {
  it('reports a failure instead of throwing when WebGL is missing, and shows no controls', async () => {
    const fixture = TestBed.createComponent(MoaiScene);
    const failed = vi.fn();
    fixture.componentInstance.failed.subscribe(failed);
    await fixture.whenStable();
    expect(failed).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('keeps the canvas decorative', async () => {
    const fixture = TestBed.createComponent(MoaiScene);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
```

Run: `npx ng test --no-watch --include src/app/voxel/moai-scene.spec.ts` → FAIL (`Could not resolve "./moai-scene"`).

- [ ] **Step 3: Implementa `src/app/voxel/moai-scene.ts`**

La camera ortografica guarda lungo (1, 1, 1) come la proiezione del Task 2. Il frustum misura i limiti dell'SVG × √(2/3), il fattore tra unità isometriche e unità del mondo; il bersaglio è il centro del disegno riportato sul piano y = 0. Con rotazione 0 la scena coincide con `moai.png`.

```ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { hash } from '../pixel-field/field';
import { COS30, isoBounds, isoFaces } from './iso';
import { MOAI_IMAGE } from './moai-image';
import { VoxelColor, moaiVoxels } from './moai.model';
import { ENTRY_MS, SCROLL_TURNS, TURN_STEP, approach, explodeAmount, sectionProgress } from './motion';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
const SPIN_PER_MS = 0.0004;
const CSS_COLORS: Readonly<Record<VoxelColor, string>> = {
  stone: '--stone',
  stoneDark: '--stone-dark',
  stoneLight: '--stone-light',
  eye: '--accent',
  pukao: '--px-6',
  moss: '--px-5',
};

@Component({
  selector: 'app-moai-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    @if (ready()) {
      <div class="controls">
        <button type="button" (click)="turn(-1)" i18n-aria-label="@@moai.left" aria-label="Rotate the moai left">
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M2 3h1v2H2zM3 2h1v4H3zM4 1h1v6H4zM5 3h2v2H5z" />
          </svg>
        </button>
        <button type="button" (click)="turn(1)" i18n-aria-label="@@moai.right" aria-label="Rotate the moai right">
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M5 3h1v2H5zM4 2h1v4H4zM3 1h1v6H3zM1 3h2v2H1z" />
          </svg>
        </button>
        @if (!desktop()) {
          <button type="button" (click)="spinning.set(!spinning())" [attr.aria-label]="spinLabel()">
            <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
              @if (spinning()) {
                <path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z" />
              } @else {
                <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />
              }
            </svg>
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y;
    }
    .controls {
      position: absolute;
      right: 0;
      bottom: 0;
      display: flex;
    }
    button {
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
    button + button {
      border-left: 0;
    }
  `,
})
export class MoaiScene {
  readonly failed = output();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ready = signal(false);
  protected readonly desktop = signal(false);
  protected readonly spinning = signal(true);
  protected readonly spinLabel = computed(() =>
    this.spinning() ? $localize`:@@moai.stop:Stop the moai` : $localize`:@@moai.spin:Spin the moai`,
  );

  private readonly cleanups: (() => void)[] = [];
  private raf = 0;
  private visible = false;
  private turnTarget = 0;
  private turnNow = 0;
  private drag = 0;
  private spin = 0;
  private entry = 0;

  constructor() {
    afterNextRender(() => {
      try {
        this.start();
      } catch {
        this.fail();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  protected turn(direction: 1 | -1): void {
    this.turnTarget += direction * TURN_STEP;
  }

  private fail(): void {
    this.stop();
    this.failed.emit();
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const root = document.documentElement;
    const desktopQuery = matchMedia('(min-width: 1024px) and (pointer: fine)');
    this.desktop.set(desktopQuery.matches);

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    this.cleanups.push(() => {
      renderer.dispose();
      renderer.forceContextLoss();
    });

    // model, centred like the still image
    const voxels = moaiVoxels();
    const bounds = isoBounds(isoFaces(voxels));
    const geometry = new BoxGeometry(0.94, 0.94, 0.94);
    const material = new MeshLambertMaterial();
    const mesh = new InstancedMesh(geometry, material, voxels.length);
    this.cleanups.push(() => {
      geometry.dispose();
      material.dispose();
    });
    const base = voxels.map((v) => new Vector3(v.x + 0.5, v.y + 0.5, v.z + 0.5));
    const centre = base.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(base.length);
    const pivot = new Group();
    pivot.position.set(0.5, 0, 0.5);
    mesh.position.set(-0.5, 0, -0.5);
    pivot.add(mesh);

    const scene = new Scene();
    scene.add(pivot, new HemisphereLight(0xffffff, 0x555555, 2.4));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 3);
    scene.add(sun);

    const sx = (bounds.minX + bounds.width / 2) / COS30;
    const sy = 2 * (bounds.minY + bounds.height / 2);
    const target = new Vector3((sx + sy) / 2, 0, (sy - sx) / 2);
    const halfW = (bounds.width * ISO_TO_WORLD) / 2;
    const halfH = (bounds.height * ISO_TO_WORLD) / 2;
    const camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 200);
    camera.position.copy(target).add(new Vector3(50, 50, 50));
    camera.lookAt(target);

    const paint = (): void => {
      const style = getComputedStyle(root);
      const color = new Color();
      voxels.forEach((v, i) => {
        mesh.setColorAt(i, color.set(style.getPropertyValue(CSS_COLORS[v.color]).trim()));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const dummy = new Object3D();
    let lastBurst = -1;
    const place = (burst: number): void => {
      if (burst === lastBurst) return;
      lastBurst = burst;
      base.forEach((p, i) => {
        const away = p.clone().sub(centre).multiplyScalar(burst * (0.8 + hash(i) * 0.8));
        dummy.position.copy(p).add(away);
        dummy.position.y += burst * hash(i + 11) * 3;
        dummy.scale.setScalar(1 - 0.4 * burst);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    paint();
    place(1);

    const resize = (): void => {
      const dpr = Math.min(devicePixelRatio || 1, this.desktop() ? 2 : 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const views = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    views.observe(canvas);
    const themes = new MutationObserver(paint);
    themes.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const section = this.host.nativeElement.closest('section');
    let last = performance.now();
    let pointerX: number | null = null;
    const frame = (now: number): void => {
      try {
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        this.entry = Math.min(1, this.entry + dt / ENTRY_MS);
        this.turnNow = approach(this.turnNow, this.turnTarget, 8, dt);
        let scroll = 0;
        if (this.desktop() && section) {
          const box = section.getBoundingClientRect();
          scroll = sectionProgress(box.top, box.height, innerHeight);
        } else if (this.spinning()) {
          this.spin += dt * SPIN_PER_MS * Math.PI * 2;
        }
        pivot.rotation.y = scroll * SCROLL_TURNS * Math.PI * 2 + this.spin + this.turnNow + this.drag;
        place(Math.round(explodeAmount(scroll, this.entry) * 1000) / 1000);
        renderer.render(scene, camera);
        this.raf = requestAnimationFrame(frame);
      } catch {
        this.fail();
      }
    };
    this.loop = (): void => {
      last = performance.now();
      this.raf = requestAnimationFrame(frame);
    };

    const onLost = (event: Event): void => {
      event.preventDefault();
      this.fail();
    };
    const onDown = (e: PointerEvent): void => {
      if (!this.desktop() || e.pointerType !== 'mouse') return;
      pointerX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent): void => {
      if (pointerX === null) return;
      this.drag += (e.clientX - pointerX) * 0.01;
      pointerX = e.clientX;
    };
    const onUp = (): void => {
      pointerX = null;
    };
    const onDesktop = (): void => {
      this.desktop.set(desktopQuery.matches);
      resize();
    };
    const onVisibility = (): void => {
      this.sync();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    desktopQuery.addEventListener('change', onDesktop);
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanups.push(() => {
      sizes.disconnect();
      views.disconnect();
      themes.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      desktopQuery.removeEventListener('change', onDesktop);
      document.removeEventListener('visibilitychange', onVisibility);
    });

    resize();
    this.ready.set(true);
    this.sync();
  }

  private loop: () => void = () => undefined;

  /** Draws only while the moai can be seen. */
  private sync(): void {
    const run = this.ready() && this.visible && !document.hidden;
    if (run && !this.raf) this.loop();
    else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private stop(): void {
    // the server destroys components too, and has no animation frames
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ready.set(false);
    this.cleanups.splice(0).reverse().forEach((cleanup) => {
      cleanup();
    });
  }
}
```

Note per chi implementa:
- `MOAI_IMAGE` non serve qui: lo usa `MoaiFigure` per l'`aspect-ratio`. Non importarlo nella scena (ESLint segnala gli import inutilizzati).
- Se `this.loop` dichiarato dopo il costruttore dà errore di ordine dei campi, spostalo tra i campi privati in alto.
- I cleanup vengono eseguiti in ordine inverso: prima gli observer e i listener, poi la geometria, per ultimo il renderer.

Run il test → PASS (2 test).

- [ ] **Step 4: Traduzioni**

`npm run i18n:extract`, poi in `messages.it.xlf`: `moai.left` → `Ruota il moai a sinistra`, `moai.right` → `Ruota il moai a destra`, `moai.stop` → `Ferma il moai`, `moai.spin` → `Fai girare il moai`. (Se l'estrazione non trova ancora i messaggi perché il componente non è montato, aggiungi le traduzioni nel Task 5, dopo il montaggio.)

- [ ] **Step 5: Lint, commit**

Run: `npm run lint && npx ng test --no-watch && npm run build`
Commit: `feat: render the voxel moai with Three.js instancing`

---

### Task 5: `MoaiFigure` nella sezione About

**Files:**
- Create: `src/app/voxel/moai-figure.ts`, `src/app/voxel/moai-figure.spec.ts`
- Modify: `src/app/pages/home/home.ts`, `src/locale/messages.it.xlf`

**Interfaces:**
- Consumes: `MoaiScene` (Task 4), `MOAI_IMAGE` (Task 2).
- Produces: `<app-moai-figure />`. Sul server, con movimento ridotto o dopo un guasto, mostra `<img class="still">`; altrimenti `@defer (on viewport)` carica la scena, con l'immagine come segnaposto e come blocco `@error`.

- [ ] **Step 1: Test (RED)** — `src/app/voxel/moai-figure.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { MoaiFigure } from './moai-figure';

describe('MoaiFigure', () => {
  afterEach(() => vi.restoreAllMocks());

  function prefersReducedMotion(reduce: boolean): void {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: reduce && query.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
    );
  }

  it('shows the still moai with reduced motion and never loads the scene', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(MoaiFigure);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img.still')?.getAttribute('alt')).toBe('');
    expect(el.querySelector('app-moai-scene')).toBeNull();
  });

  it('reserves the space of the image before anything loads', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(MoaiFigure);
    await fixture.whenStable();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img.still');
    expect(img?.getAttribute('width')).toBe('260');
    expect(img?.getAttribute('height')).toBe('560');
  });
});
```

(Se `MOAI_IMAGE` ha dimensioni diverse da 260 × 560, usa le sue nei due `toBe`.)

Run → FAIL (`Could not resolve "./moai-figure"`).

- [ ] **Step 2: Implementa `src/app/voxel/moai-figure.ts`**

```ts
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { MOAI_IMAGE } from './moai-image';
import { MoaiScene } from './moai-scene';

@Component({
  selector: 'app-moai-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiScene, NgTemplateOutlet],
  host: { '[style.aspect-ratio]': 'ratio' },
  template: `
    <ng-template #still>
      <img class="still" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
    </ng-template>
    @if (live() && !failed()) {
      @defer (on viewport) {
        <app-moai-scene class="scene" (failed)="failed.set(true)" />
      } @placeholder {
        <img class="still" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
      } @error {
        <ng-container [ngTemplateOutlet]="still" />
      }
    } @else {
      <ng-container [ngTemplateOutlet]="still" />
    }
  `,
  styles: `
    :host {
      display: block;
      width: min(100%, 20rem);
    }
    .still,
    .scene {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class MoaiFigure {
  protected readonly image = MOAI_IMAGE;
  protected readonly ratio = `${String(MOAI_IMAGE.width)} / ${String(MOAI_IMAGE.height)}`;
  protected readonly live = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.live.set(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  }
}
```

Run il test → PASS (2 test).

- [ ] **Step 3: About a due colonne con il moai fermo durante lo scroll**

In `src/app/pages/home/home.ts` sostituisci la sezione `#about` con:

```html
<section id="about" class="section container about" aria-labelledby="about-title">
  <div class="about-text">
    <h2 id="about-title" i18n="@@home.about.title">About</h2>
    <p>{{ content.about }}</p>
    <app-at-a-glance [items]="content.glance" />
  </div>
  <app-moai-figure class="about-moai" />
</section>
```

Importa `MoaiFigure` e aggiungilo agli `imports`. Negli stili:

```scss
.about-text {
  display: grid;
  gap: var(--space-4);
}
@include bp.up(lg) {
  .about {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    column-gap: var(--space-8);
    align-items: start;
  }
  .about-moai {
    position: sticky;
    top: var(--space-8);
    justify-self: center;
  }
}
```

(Il blocco `@include bp.up(lg)` dell'hero esiste già: aggiungi queste regole lì dentro.)

- [ ] **Step 4: Traduzioni, verifica e commit**

`npm run i18n:extract` e aggiungi le quattro unità `moai.*` se il Task 4 non ha potuto farlo.

Run: `npm run lint && npx ng test --no-watch && npm run build && npx playwright test`
Expected: tutto verde. Il controllo dei titoli e axe non cambiano (l'`h2` resta nella sezione). In `dist/portfolio/browser/en/index.html` la sezione About contiene `<img class="still"` (HTML prerenderizzato, spec §11).

Commit: `feat: show the moai in the about section, deferred until it is in view`

---

### Task 6: Test di guasto, budget JavaScript e controllo visivo

**Files:**
- Create: `e2e/moai.spec.ts`, `scripts/js-budget.mjs`, `scripts/js-budget.test.mjs`
- Modify: `scripts/postbuild.mjs`

**Interfaces:**
- Consumes: `<app-moai-figure>`, `<app-moai-scene>`, nomi dei bottoni (Task 4–5); bottone del tema (Piano 1).
- Produces: `initialScripts(html: string): string[]` e `INITIAL_JS_BUDGET = 150 * 1024` in `scripts/js-budget.mjs`; il postbuild fallisce se il JavaScript iniziale (gzip) di `/en/` supera il budget.

- [ ] **Step 1: Test del budget (RED)** — `scripts/js-budget.test.mjs`

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialScripts } from './js-budget.mjs';

test('lists the entry module and its modulepreloads once each', () => {
  const html =
    '<head><link rel="modulepreload" href="chunk-A.js"><link rel="modulepreload" href="chunk-B.js"></head>' +
    '<body><script src="main-X.js" type="module"></script><script src="chunk-A.js" type="module"></script></body>';
  assert.deepEqual(initialScripts(html).sort(), ['chunk-A.js', 'chunk-B.js', 'main-X.js']);
});

test('ignores inline scripts', () => {
  assert.deepEqual(initialScripts('<script>window.x = 1</script>'), []);
});
```

Run: `npm run test:scripts` → FAIL (`Cannot find module './js-budget.mjs'`).

- [ ] **Step 2: Implementa `scripts/js-budget.mjs` e collegalo al postbuild**

```js
/** Initial JavaScript of a page: the module entry points plus what the page preloads. */
export const INITIAL_JS_BUDGET = 150 * 1024; // gzip bytes, spec §12

export function initialScripts(html) {
  const found = new Set();
  for (const [, src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*type="module"/g)) found.add(src);
  for (const [, src] of html.matchAll(/<script[^>]*type="module"[^>]*\ssrc="([^"]+)"/g)) found.add(src);
  for (const [, href] of html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)) found.add(href);
  return [...found];
}
```

In `scripts/postbuild.mjs`, dopo la scrittura di `robots.txt`:

```js
const homeHtml = await readFile(join(ROOT, 'en', 'index.html'), 'utf8');
let initialBytes = 0;
for (const file of initialScripts(homeHtml)) initialBytes += gzipSync(await readFile(join(ROOT, 'en', file))).length;
console.log(`postbuild: initial JavaScript ${(initialBytes / 1024).toFixed(1)} KB gzip (budget ${String(INITIAL_JS_BUDGET / 1024)} KB)`);
if (initialBytes > INITIAL_JS_BUDGET) throw new Error('postbuild: initial JavaScript is over budget');
```

con gli import `import { gzipSync } from 'node:zlib';` e `import { INITIAL_JS_BUDGET, initialScripts } from './js-budget.mjs';`.

Run: `npm run test:scripts && npm run build`
Expected: test PASS; il build stampa il JavaScript iniziale (atteso ben sotto 150 KB: Three.js deve stare in un chunk caricato da `@defer`, non tra i `modulepreload`).

- [ ] **Step 3: Scrivi `e2e/moai.spec.ts`**

```ts
import { expect, test, type Page } from '@playwright/test';

const hasWebGL = (page: Page) => page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')));
const scene = (page: Page) => page.locator('app-moai-scene canvas');
const still = (page: Page) => page.locator('app-moai-figure img.still');
const snapshot = (page: Page) => scene(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('WebGL'))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('swaps the still image for the 3D moai once it is in view', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await expect(still(page)).toHaveCount(1);
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rotate the moai right' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the rotate buttons turn the moai, from the keyboard too', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  const right = page.getByRole('button', { name: 'Rotate the moai right' });
  await expect(right).toBeVisible();
  const stop = page.getByRole('button', { name: 'Stop the moai' });
  if (await stop.isVisible()) await stop.click();
  await page.waitForTimeout(1200); // entry animation
  const before = await snapshot(page);
  await right.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('repaints with the new colours when the theme changes', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  const stop = page.getByRole('button', { name: 'Stop the moai' });
  if (await stop.isVisible()) await stop.click();
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('falls back to the still image without WebGL', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('/en/');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(still(page)).toBeVisible();
  await expect(scene(page)).toHaveCount(0);
  await page.locator('footer').scrollIntoViewIfNeeded();
  expect(errors).toEqual([]);
});

test('falls back when the 3D code cannot be downloaded', async ({ page }) => {
  await page.route('**/*.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes('WebGLRenderer')) await route.abort();
    else await route.fulfill({ response, body });
  });
  await page.goto('/en/');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await expect(still(page)).toBeVisible();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(page.locator('footer')).toBeInViewport();
});

test('goes back to the still image when the WebGL context is lost', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await scene(page).evaluate((c) => {
    const gl = (c as HTMLCanvasElement).getContext('webgl2') ?? (c as HTMLCanvasElement).getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(still(page)).toBeVisible();
  expect(errors.filter((e) => !e.includes('CONTEXT_LOST'))).toEqual([]);
});

test('releases WebGL when leaving and coming back many times', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  for (let i = 0; i < 8; i++) {
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(scene(page)).toBeVisible();
    await page.getByRole('link', { name: 'ApexFlow' }).first().click();
    await expect(page.locator('h1')).toHaveText('ApexFlow');
    await page.goBack();
  }
  expect(errors).toEqual([]);
});

test('never blocks vertical scrolling on touch screens', async ({ page, browserName, hasTouch }) => {
  test.skip(browserName === 'chromium' && !hasTouch, 'desktop Chromium hides touch-action without touch support');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  expect(await scene(page).evaluate((c) => getComputedStyle(c).touchAction)).toBe('pan-y');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the still image and never downloads Three.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (response) => {
      if (response.url().endsWith('.js') && (await response.text()).includes('WebGLRenderer')) scripts.push(response.url());
    });
    await page.goto('/en/');
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(still(page)).toBeVisible();
    await expect(scene(page)).toHaveCount(0);
    expect(scripts).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the still moai', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(still(page)).toBeVisible();
  });
});
```

- [ ] **Step 4: Esegui**

Run: `npm run lint && npm run build && npx playwright test`
Expected: tutto verde. I test che richiedono WebGL si saltano solo dove il browser headless non lo offre: annota nel ledger quali progetti li hanno saltati. Se "releases WebGL" segnala "Too many active WebGL contexts", controlla che `stop()` venga chiamato alla distruzione e che il cleanup del renderer esegua `forceContextLoss()`.

- [ ] **Step 5: Prestazioni e CLS**

Run: `npm run lhci`
Expected: Performance ≥ 0.95 e CLS 0 su tutte le pagine. In più, con lo script di misura del Piano 3 (PerformanceObserver `layout-shift` bufferizzato, 412 px, rete lenta, CPU ×4), scorri fino ad About e attendi la scena: nessuno spostamento.

- [ ] **Step 6: Controllo visivo**

Con Playwright headless (la scheda di Chrome controllata può risultare nascosta e fermare `requestAnimationFrame`), a 1440 e 375 px, light e dark:
- l'immagine e la scena coincidono, senza scatti al momento dello scambio;
- su desktop il moai ruota con lo scroll e a fine sezione esplode, poi si ricompone tornando su;
- su mobile ruota da solo e il bottone di pausa lo ferma;
- i colori seguono il tema.

Valuta con lo sguardo della skill `frontend-design`. Se la luce appiattisce i volumi, regola le intensità di `HemisphereLight` e `DirectionalLight`, registrando la ruling.

- [ ] **Step 7: Commit**

Commit: `test: cover moai fallbacks, WebGL loss, theme and the initial JavaScript budget`

---

### Fine piano

- [ ] `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npx playwright test && npm run lhci` tutto verde.
- [ ] Push del branch `v2` e CI di GitHub verde.
