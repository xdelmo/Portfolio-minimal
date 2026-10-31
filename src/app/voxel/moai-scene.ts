import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
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
import { COS30, isoBounds, isoFaces } from './iso';
import { MOAI_BLEED, MOAI_FRAME, VoxelColor, moaiVoxels } from './moai.model';
import { MotionPause } from '../motion/pause';
import { afterIntro } from '../motion/intro-state';
import { BUBBLE_MS, GUM_LIPS, Gaze, LOOK_DOWN, PHONE_GAZE, SLEEP_MS, WAVE_MS, bubble, bubbleCells, breath, follow, gaze, glance, isPupil, wave } from './motion';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
const SCLERA = '--moai-eye-white';
const GUM = '--gum';
/** The colour of closed eyelids: the stone of the face. */
const LIDS = '--stone';
/** The page counts as scrolling until this long after its last scroll event. */
const SCROLL_REST_MS = 250;
const WAKE_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;
/** Two taps or clicks closer than this, and closer than DOUBLE_TAP_PX, blow a bubble. */
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 12;
/** Pixels a touch or pointer moves before locking into horizontal swipe or vertical page scroll. */
const SWIPE_LOCK_PX = 8;
const CSS_COLORS: Readonly<Record<VoxelColor, string>> = {
  stone: '--stone',
  stoneDark: '--stone-dark',
  stoneLight: '--stone-light',
  eye: '--accent',
  pukao: '--px-6',
  moss: '--stone-light',
};

@Component({
  selector: 'app-moai-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gaze]': 'gaze()',
    '[attr.data-gum]': 'gum() ? "" : null',
    '[attr.data-waving]': 'waving() ? "" : null',
    '[attr.data-scrolling]': 'scrolling() ? "" : null',
    '[attr.data-asleep]': 'asleep() ? "" : null',
  },
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    @if (asleep()) {
      <span class="zzz" aria-hidden="true">
        @for (z of zs; track z) {
          <svg viewBox="0 0 3 3"><path d="M0 0h3v1H0zM1 1h1v1H1zM0 2h3v1H0z" /></svg>
        }
      </span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }
    // a sideways swipe turns the moai; vertical panning and pinch-zoom stay with the browser
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y pinch-zoom;
    }
    // asleep: pixel z's of 8px cells rise from the top of the head and fade, one after the other
    .zzz {
      position: absolute;
      top: 2%;
      left: 58%;
      pointer-events: none;
    }
    svg {
      position: absolute;
      width: 24px;
      fill: var(--px-4);
      shape-rendering: crispEdges;
      opacity: 0;
      animation: zzz 3s steps(6) infinite;
    }
    svg:nth-child(2) {
      animation-delay: 1s;
    }
    svg:nth-child(3) {
      animation-delay: 2s;
    }
    :host-context(html[data-motion-paused]) svg {
      animation-play-state: paused;
    }
    @keyframes zzz {
      0% {
        opacity: 0;
        translate: 0 0;
        scale: 0.5;
      }
      20% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        translate: 24px -48px;
        scale: 1;
      }
    }
  `,
})
export class MoaiScene {
  readonly failed = output();
  /** Fires after the first frame, so the still image can stay underneath until then. */
  readonly drawn = output();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly ready = signal(false);
  protected readonly desktop = signal(false);
  /** Where the pixel pupils look, on desktop once the mouse moves (null keeps the eyes fully lit), fixed on phones. */
  protected readonly gaze = signal<Gaze | null>(null);
  /** While a bubble of pink gum is out (a double click or double tap on the moai). */
  protected readonly gum = signal(false);
  /** The greeting, once per page load, after the intro. */
  protected readonly waving = signal(false);
  /** While the page scrolls the moai looks down. */
  protected readonly scrolling = signal(false);
  /** After SLEEP_MS without input: eyes closed, slower breath, pixel z's. Any input wakes it. */
  protected readonly asleep = signal(false);
  protected readonly zs = [0, 1, 2];
  // its idle life (breath, the phones' glances) stops with the one header pause button (WCAG 2.2.2)
  private readonly pause = inject(MotionPause);

  private readonly cleanups: (() => void)[] = [];
  private raf = 0;
  private visible = false;
  private drag = 0;

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

  private fail(): void {
    this.stop();
    this.failed.emit();
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const root = document.documentElement;
    const desktopQuery = matchMedia('(min-width: 1024px) and (pointer: fine)');
    this.desktop.set(desktopQuery.matches);
    // no pointer to follow on phones: the eyes stay open, looking where the face points
    this.gaze.set(desktopQuery.matches ? null : PHONE_GAZE);

    // create the context ourselves: when WebGL is missing Three.js would log an error before throwing
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!context) {
      this.fail();
      return;
    }
    const renderer = new WebGLRenderer({ canvas, context });
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
    const pivot = new Group();
    pivot.position.set(0.5, 0, 0.5);
    mesh.position.set(-0.5, 0, -0.5);
    pivot.add(mesh);

    // the bubble gum: a ball of pink voxels blown from the lips, its back on their front face; it grows from the lips
    const gumCells = bubbleCells();
    const gumMaterial = new MeshLambertMaterial();
    const gumMesh = new InstancedMesh(geometry, gumMaterial, gumCells.length);
    const gumDummy = new Object3D();
    gumCells.forEach((c, i) => {
      gumDummy.position.set(c.x, c.y, c.z + 0.5);
      gumDummy.updateMatrix();
      gumMesh.setMatrixAt(i, gumDummy.matrix);
    });
    const gumBall = new Group();
    gumBall.position.set(0, GUM_LIPS.y + 0.5, GUM_LIPS.z + 0.5);
    gumBall.visible = false;
    gumBall.add(gumMesh);
    pivot.add(gumBall);
    this.cleanups.push(() => {
      gumMaterial.dispose();
    });
    // the bubble ends on a timer, not in the frame loop: the loop stops whenever the moai is off screen
    let gumStart: number | null = null;
    let gumTimer = 0;
    const endGum = (): void => {
      gumStart = null;
      gumBall.visible = false;
      this.gum.set(false);
    };
    this.cleanups.push(() => {
      clearTimeout(gumTimer);
    });

    const scene = new Scene();
    scene.add(pivot, new HemisphereLight(0xffffff, 0x555555, 2.4));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 3);
    scene.add(sun);

    const sx = (bounds.minX + bounds.width / 2) / COS30;
    const sy = 2 * (bounds.minY + bounds.height / 2);
    const target = new Vector3((sx + sy) / 2, 0, (sy - sx) / 2);
    // the canvas is wider than the figure by MOAI_BLEED on each side, so the moai keeps its size and the bubble its room
    const halfW = ((bounds.width * ISO_TO_WORLD * MOAI_FRAME) / 2) * (1 + 2 * MOAI_BLEED);
    const halfH = (bounds.height * ISO_TO_WORLD * MOAI_FRAME) / 2;
    const camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 200);
    camera.position.copy(target).add(new Vector3(50, 50, 50));
    camera.lookAt(target);

    const eyes = voxels.filter((v) => v.color === 'eye');
    const paint = (): void => {
      const style = getComputedStyle(root);
      const color = new Color();
      const asleep = this.asleep();
      const looking = this.gaze();
      // while the page scrolls the pupils drop to the bottom of the eyes
      const g = this.scrolling() ? looking ? (looking.replace('-up', '-down') as Gaze) : PHONE_GAZE : looking;
      voxels.forEach((v, i) => {
        const eye = v.color === 'eye';
        const token = eye && asleep ? LIDS : eye && g && !isPupil(eyes, v, g) ? SCLERA : CSS_COLORS[v.color];
        mesh.setColorAt(i, color.set(style.getPropertyValue(token).trim()));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      gumMaterial.color.set(style.getPropertyValue(GUM).trim());
    };
    const dummy = new Object3D();
    base.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    paint();

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

    let last = performance.now();
    let pointerX: number | null = null;
    let firstDrawn = false;
    // idle life: it breathes; on desktop the head turns a little towards the pointer, on phones it glances around
    let idle = 0;
    let look = 0;
    let lookTarget = 0;
    let down = 0;
    let waveT = -1;
    let lastScroll = -Infinity;
    const frame = (now: number): void => {
      try {
        const elapsed = Math.max(0, now - last);
        const dt = Math.min(100, elapsed);
        last = now;
        const paused = this.pause.paused();
        // asleep it breathes at half speed
        if (!paused) idle += dt * (this.asleep() ? 0.5 : 1);
        const scrolling = !paused && now - lastScroll < SCROLL_REST_MS;
        if (scrolling !== this.scrolling()) {
          this.scrolling.set(scrolling);
          paint();
        }
        // the greeting runs on real time, not the capped step: on a slow page it still ends within its second
        if (waveT >= 0 && !paused) waveT += elapsed;
        if (this.waving() && waveT > WAVE_MS) this.waving.set(false);
        // a glance is a slow turn of a stone head, slower than the reply to a pointer. Eased over the real time that went
        // by (follow is exact for any step): on a busy phone drawing few frames, the capped dt slowed the head's way
        // back to rest after a pause past ten seconds (issue #203)
        look = this.desktop() ? follow(look, lookTarget, elapsed) : follow(look, paused ? 0 : glance(idle), elapsed, 700);
        down = follow(down, scrolling ? LOOK_DOWN : 0, elapsed);
        pivot.rotation.x = breath(idle) + down;
        pivot.rotation.y = this.drag + look;
        pivot.rotation.z = wave(waveT);
        // no fly-in: the scene replaces a still image that is already on screen
        const size = gumStart === null ? null : bubble(now - gumStart);
        gumBall.visible = size !== null && size > 0;
        if (size !== null) gumBall.scale.setScalar(Math.max(size, 0.001));
        renderer.render(scene, camera);
        if (!firstDrawn) {
          firstDrawn = true;
          this.drawn.emit();
        }
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
    // desktop: drag with the mouse; phones: swipe with a finger, locking to horizontal rotation or vertical page scroll
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerDir: 'x' | 'y' | null = null;
    const onDown = (e: PointerEvent): void => {
      const mouse = this.desktop() && e.pointerType === 'mouse';
      const finger = !this.desktop() && e.pointerType === 'touch';
      if (!mouse && !finger) return;
      pointerX = e.clientX;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerDir = mouse ? 'x' : null;
      if (mouse) canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent): void => {
      if (pointerX === null) return;
      if (pointerDir === null) {
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;
        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
        pointerDir = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (pointerDir === 'x' && !this.desktop()) {
          try {
            if (!canvas.hasPointerCapture(e.pointerId)) canvas.setPointerCapture(e.pointerId);
          } catch {
            // pointer capture not supported or released
          }
        }
      }
      if (pointerDir === 'y') return;
      this.drag += (e.clientX - pointerX) * 0.01;
      pointerX = e.clientX;
    };
    let lastTap: { time: number; x: number; y: number } | null = null;
    const onUp = (e: PointerEvent): void => {
      pointerX = null;
      pointerDir = null;
      const tap = { time: e.timeStamp, x: e.clientX, y: e.clientY };
      const double = lastTap !== null && tap.time - lastTap.time < DOUBLE_TAP_MS && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < DOUBLE_TAP_PX;
      lastTap = double ? null : tap;
      if (double && gumStart === null) {
        gumStart = performance.now();
        this.gum.set(true);
        gumTimer = window.setTimeout(endGum, BUBBLE_MS);
      }
    };
    const onCancel = (): void => {
      pointerX = null;
      pointerDir = null;
    };

    // on phones, cancel vertical scrolling only when the gesture is locked to horizontal swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDir: 'x' | 'y' | null = null;
    const onTouchStart = (e: TouchEvent): void => {
      if (this.desktop() || e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchDir = null;
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (this.desktop() || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (touchDir === null) {
        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
        touchDir = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }
      if (touchDir === 'x' && e.cancelable) {
        e.preventDefault();
      }
    };
    const onTouchEnd = (): void => {
      touchDir = null;
    };
    const onLook = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      lookTarget = (e.clientX / innerWidth - 0.5) * 0.5;
      if (!this.desktop()) return;
      // the eyes sit about 40% down the canvas
      const box = canvas.getBoundingClientRect();
      const next = gaze(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height * 0.4));
      if (next === this.gaze()) return;
      this.gaze.set(next);
      paint();
    };
    const onDesktop = (): void => {
      this.desktop.set(desktopQuery.matches);
      this.gaze.set(desktopQuery.matches ? null : PHONE_GAZE);
      paint();
      resize();
    };
    const onVisibility = (): void => {
      this.sync();
    };
    const onScroll = (): void => {
      lastScroll = performance.now();
      // on a page drawing few frames (WebKit in CI, about 4 a second) the next frame may come after the rest: look down now
      if (this.pause.paused() || this.scrolling()) return;
      this.scrolling.set(true);
      paint();
    };
    let lastInput = performance.now();
    const onInput = (): void => {
      lastInput = performance.now();
      if (!this.asleep()) return;
      this.asleep.set(false);
      paint();
    };
    // the paused moai neither falls asleep nor wakes by itself: its clock starts again from the pause
    const sleepTimer = window.setInterval(() => {
      const now = performance.now();
      if (this.pause.paused()) lastInput = now;
      else if (!this.asleep() && now - lastInput > SLEEP_MS) {
        this.asleep.set(true);
        paint();
      }
    }, 1000);
    for (const type of WAKE_EVENTS) addEventListener(type, onInput, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    const cancelIntro = afterIntro(() => {
      waveT = 0;
      this.waving.set(true);
    });
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
    addEventListener('pointermove', onLook, { passive: true });
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
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      removeEventListener('pointermove', onLook);
      desktopQuery.removeEventListener('change', onDesktop);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const type of WAKE_EVENTS) removeEventListener(type, onInput);
      removeEventListener('scroll', onScroll);
      clearInterval(sleepTimer);
      cancelIntro();
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
