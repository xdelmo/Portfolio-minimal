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
import { MOAI_BLEED, MOAI_FRAME, Voxel, VoxelColor, moaiVoxels } from './moai.model';
import { MotionPause } from '../motion/pause';
import { BUBBLE_MS, GUM_DROP, GUM_LIPS, Gaze, bubble, bubbleCells, breath, follow, gaze, glance, scrollYaw, sectionProgress } from './motion';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
const SCLERA = '--moai-eye-white';
const GUM = '--gum';
/** Two taps or clicks closer than this, and closer than DOUBLE_TAP_PX, blow a bubble. */
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 12;
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
  host: { '[attr.data-gaze]': 'gaze()', '[attr.data-gum]': 'gum() ? "" : null' },
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
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
  `,
})
export class MoaiScene {
  readonly failed = output();
  /** Fires after the first frame, so the still image can stay underneath until then. */
  readonly drawn = output();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ready = signal(false);
  protected readonly desktop = signal(false);
  /** Where the pixel pupils look, on desktop once the mouse moves; null keeps the eyes fully lit. */
  protected readonly gaze = signal<Gaze | null>(null);
  /** While a bubble of pink gum is out (a double click or double tap on the moai). */
  protected readonly gum = signal(false);
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

    // the bubble gum: a ball of pink voxels hanging from the lips, its back on their front face; it grows from the lips
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
    gumMesh.position.y = -GUM_DROP;
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

    // each eye is a 2×2 block: with a gaze, one voxel is the pupil and the other three the white
    const eyes = voxels.filter((v) => v.color === 'eye');
    const isPupil = (v: Voxel, g: Gaze): boolean => {
      const mine = eyes.filter((e) => Math.sign(e.x) === Math.sign(v.x));
      const xs = mine.map((e) => e.x);
      const ys = mine.map((e) => e.y);
      return v.x === (g.startsWith('right') ? Math.max(...xs) : Math.min(...xs)) && v.y === (g.endsWith('up') ? Math.max(...ys) : Math.min(...ys));
    };
    const paint = (): void => {
      const style = getComputedStyle(root);
      const color = new Color();
      const g = this.gaze();
      voxels.forEach((v, i) => {
        const token = v.color === 'eye' && g && !isPupil(v, g) ? SCLERA : CSS_COLORS[v.color];
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

    const section = this.host.nativeElement.closest('section');
    let last = performance.now();
    let pointerX: number | null = null;
    let firstDrawn = false;
    // idle life: it breathes; on desktop the head turns a little towards the pointer, on phones it glances around
    let idle = 0;
    let look = 0;
    let lookTarget = 0;
    const frame = (now: number): void => {
      try {
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        let scroll = 0;
        if (section) {
          const box = section.getBoundingClientRect();
          scroll = sectionProgress(box.top, box.height, innerHeight);
        }
        const paused = this.pause.paused();
        if (!paused) idle += dt;
        // a glance is a slow turn of a stone head, slower than the reply to a pointer
        look = this.desktop() ? follow(look, lookTarget, dt) : follow(look, paused ? 0 : glance(idle), dt, 700);
        pivot.rotation.x = breath(idle);
        pivot.rotation.y = scrollYaw(scroll) + this.drag + look;
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
    // desktop: drag with the mouse; phones: swipe with a finger (touch pointers are captured by the canvas already)
    const onDown = (e: PointerEvent): void => {
      const mouse = this.desktop() && e.pointerType === 'mouse';
      const finger = !this.desktop() && e.pointerType === 'touch';
      if (!mouse && !finger) return;
      pointerX = e.clientX;
      if (mouse) canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent): void => {
      if (pointerX === null) return;
      this.drag += (e.clientX - pointerX) * 0.01;
      pointerX = e.clientX;
    };
    let lastTap: { time: number; x: number; y: number } | null = null;
    const onUp = (e: PointerEvent): void => {
      pointerX = null;
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
      resize();
    };
    const onVisibility = (): void => {
      this.sync();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
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
      removeEventListener('pointermove', onLook);
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
