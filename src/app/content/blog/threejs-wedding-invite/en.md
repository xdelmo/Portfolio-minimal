---
title: A 3D wedding envelope that stops using the GPU
description: A procedural lace envelope in Three.js that renders on demand, frees WebGL once open, and drives HTML, PWA and WCAG AA tests from one TypeScript config.
date: 2026-11-26
project: wedding-3d-invite
---
Two friends wanted their paper wedding invitation—ivory satin, lace, pearls, a burgundy wax seal—rebuilt for the phone their guests already hold. Opening a link in WhatsApp over mobile data leaves little patience for a heavy 3D download, and a 60 fps render loop running behind eleven slides would warm up the phone for nothing.

To keep it light, I generated the geometry in code with no 3D asset files and disposed the WebGL context as soon as the envelope finishes opening.

## Procedural lace and wax, zero 3D assets

The envelope ships no GLTF meshes and no texture images. Each of the four flaps is an `ExtrudeGeometry` built from two quadratic Bézier curves with a scalloped outline, mounted inside a `THREE.Group` pivot placed on its outer hinge so the flaps fold back from the screen edges.

Lace is painted on an offscreen 2D `<canvas>` as a height map: hexagonal tulle net, woven cloth petals, leaves, eyelets and festoon borders. One function, `bakeSurface()`, turns that height map into diffuse colour, a tangent-space `normalMap` and a `roughnessMap` in a single pass. Ambient occlusion comes from a downscale-and-upscale bilinear blur, which avoids iOS Safari filter quirks.

Pearls are placed along the scallops and scattered over the satin with one `THREE.InstancedMesh` per flap (`MeshPhysicalMaterial` with `clearcoat`, `iridescence` and `sheen`), lit by `RoomEnvironment` through `PMREMGenerator`. The wax seal is a 128-segment `LatheGeometry` whose outer rim is nudged by three sine harmonics so it looks poured rather than stamped. Averaging the vertex normals along the first and last column hides the lathe join, and the monogram is rebaked as soon as `document.fonts.load('132px "Great Vibes"')` resolves.

## Render only when something moves, then free WebGL

Most Three.js demos start a `requestAnimationFrame` loop on mount and leave it running forever. While the envelope sits closed, this scene runs no loop at all. `initRenderer()` draws one frame; the canvas only re-renders on resize, when the script font loads, or when a deferred 2D snapshot of the inner lace frame arrives.

`EnvelopeCanvas` loads `EnvelopeScene` with a dynamic `import()`. Guests returning to the invitation—or opening `?opened=true`—never download the Three.js chunk. If the chunk fails on a poor connection, the overlay dismisses itself and shows the invitation directly instead of stalling on a spinner.

A tap starts `open()`: a 1,800 ms sequence folds the top flap (carrying the wax seal), then the bottom, then the two sides. Once `progress` hits `1`, the loop stops, the canvas unmounts and every GPU resource is freed:

```ts
const loop = (currentTime: number) => {
  const elapsed = currentTime - this.animationStartTime;
  const progress = Math.min(1.0, elapsed / this.animationDuration);

  this.updateAnimation(progress);
  this.render();

  if (progress < 1.0) {
    this.animationFrameId = requestAnimationFrame(loop);
  } else {
    this.stopLoop();
  }
};
```

Disposal also resets WebGL’s `UNPACK_FLIP_Y_WEBGL` and `UNPACK_PREMULTIPLY_ALPHA_WEBGL` flags before calling `renderer.dispose()`. Without that reset, a React StrictMode remount reusing the same canvas context hits `INVALID_OPERATION` when creating new textures.

Two more details keep the GPU quiet:

- With `prefers-reduced-motion: reduce`, a tap skips the 1,800 ms sequence and opens the invitation at once.
- The 3D lace frame behind the hero (`LaceFrameScene`) is static too—no animation loop, rendered only on creation and resize. For the inside of the envelope, `LaceFrameScene.snapshot()` paints one frame to a 2D canvas and immediately calls `forceContextLoss()` so no second WebGL context stays alive.

## One typed config for HTML, PWA and offline audio

My friends’ real invitation stays private; the public demo runs on sample names. Both build from the same repository by setting `VITE_COUPLE`, which aliases `@couple` to `couples/<slug>/config.ts`.

Inside `vite.config.ts`, `runnerImport` reads that TypeScript config directly and hands it to a custom Vite plugin (`couplePlugin`). From that one file, the build generates `<title>`, Open Graph tags, `Event` JSON-LD, `:root` CSS custom properties, the inline SVG loader, `manifest.json` and the service worker:

```ts
const hash = createHash('sha1')
  .update(JSON.stringify(config))
  .update(Object.keys(bundle).sort().join());
for (const f of files) {
  const source = fs.readFileSync(path.join(couplePublic, f));
  hash.update(f).update(source);
  this.emitFile({ type: 'asset', fileName: f, source });
}
const sw = fs
  .readFileSync(path.resolve('src/sw.js'), 'utf-8')
  .replace("'__CACHE_NAME__'", JSON.stringify(`wedding-${config.slug}-${hash.digest('hex').slice(0, 8)}`))
  .replace("'__PRECACHE__'", JSON.stringify(precache, null, 2));
```

Because the cache name hashes the config, bundle filenames and couple assets, every deploy invalidates stale caches without manual version bumps.

Offline audio hit one iOS Safari quirk: Safari requests `.m4a` and `.mp3` files with HTTP `Range` headers and rejects a plain `200` from Cache Storage. `src/sw.js` intercepts any request carrying a `Range` header and slices the cached `ArrayBuffer` into a `206 Partial Content` response so playback still works offline.

## One palette, tested for WCAG AA in Vitest

Ivory, cream, burgundy and muted sepia are defined once in `src/config/theme.ts`. `createColors(overrides)` turns each hex value into three formats: the hex string for meta tags and manifests, the numeric colour (`0x581829`) for Three.js, and space-separated RGB channels (`88 24 41`) for Tailwind’s opacity utilities.

Because any couple can override colours in its config, `src/config/theme.test.ts` loads every `couples/*/config.ts` with `import.meta.glob` and checks all eight text/background pairs against WCAG AA (`4.5:1`):

```ts
const couples = import.meta.glob<{ default: WeddingConfig }>('../../couples/*/config.ts', { eager: true });
const PAIRS = [
  ['sepia', 'ivory'],
  ['sepia', 'cream'],
  ['sepiaMuted', 'ivory'],
  ['sepiaMuted', 'cream'],
  ['bordeaux', 'ivory'],
  ['bordeaux', 'blush'],
  ['ivory', 'bordeaux'],
  ['ivory', 'bordeauxDark'],
] as const;

describe.each(Object.values(couples).map((m) => [m.default.slug, m.default] as const))('palette di %s', (_, config) => {
  const colors = createColors(config.colors);
  it.each(PAIRS)('%s su %s rispetta WCAG AA', (fg, bg) => {
    expect(contrastRatio(colors[fg].hex, colors[bg].hex)).toBeGreaterThanOrEqual(4.5);
  });
});
```

A low-contrast palette fails `vitest run` before anyone deploys it.

## Serverless RSVP and what I would change

An invitation for one weekend does not justify paying for a backend. `submitRSVP()` posts JSON to a Google Apps Script web app with `Content-Type: text/plain;charset=utf-8`, which skips the CORS preflight while still returning a readable JSON reply. A 12-second `AbortController` timeout covers both the fetch and `res.json()`. Each device generates a stable `responseId`, so a guest who changes their answer updates the existing row under `LockService.getScriptLock()` instead of creating duplicates. Before writing, the script sets `setNumberFormat('@')` on every free-text column so Google Sheets never evaluates a leading `=`, `+`, `-` or `@` as a formula.

Two things I would change if I built it again:

- **Offload texture baking to a worker.** Drawing the four lace height maps and computing their normals runs on the main thread while the inline SVG loader covers the screen, costing a few hundred milliseconds on older phones. Moving `bakeSurface()` to a Web Worker with `OffscreenCanvas` where supported would keep the UI thread idle during startup.
- **Swap Apps Script for a small function on high-volume events.** Zero hosting cost fits a wedding, though cold starts can pause the first RSVP for a couple of seconds. For an event with hundreds of concurrent replies, a lightweight endpoint over a database would respond more predictably.

You can open the public demo with sample names at [wedding-3d-invite-demo-five.vercel.app](https://wedding-3d-invite-demo-five.vercel.app/).
