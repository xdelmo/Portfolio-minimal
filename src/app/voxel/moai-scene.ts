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
import { hash } from '../pixel-field/field';
import { COS30, isoBounds, isoFaces } from './iso';
import { MOAI_FRAME, VoxelColor, moaiVoxels } from './moai.model';
import { MotionPause } from '../motion/pause';
import { breath, explodeAmount, follow, scrollYaw, sectionProgress } from './motion';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
const SPIN_PER_MS = 0.0004;
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
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
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
  // phones: it spins by itself unless all motion is paused (one header button, WCAG 2.2.2)
  private readonly pause = inject(MotionPause);

  private readonly cleanups: (() => void)[] = [];
  private raf = 0;
  private visible = false;
  private drag = 0;
  private spin = 0;

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
    const halfW = (bounds.width * ISO_TO_WORLD * MOAI_FRAME) / 2;
    const halfH = (bounds.height * ISO_TO_WORLD * MOAI_FRAME) / 2;
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
    place(0);

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
    // idle life: it breathes, and on desktop the head turns a little towards the pointer
    let idle = 0;
    let look = 0;
    let lookTarget = 0;
    const frame = (now: number): void => {
      try {
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        let scroll = 0;
        if (this.desktop() && section) {
          const box = section.getBoundingClientRect();
          scroll = sectionProgress(box.top, box.height, innerHeight);
        } else if (!this.pause.paused()) {
          this.spin += dt * SPIN_PER_MS * Math.PI * 2;
        }
        if (!this.pause.paused()) idle += dt;
        look = follow(look, this.desktop() ? lookTarget : 0, dt);
        pivot.rotation.x = breath(idle);
        pivot.rotation.y = scrollYaw(scroll) + this.spin + this.drag + look;
        // no fly-in: the scene replaces a still image that is already on screen
        place(Math.round(explodeAmount(scroll) * 1000) / 1000);
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
    const onLook = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') lookTarget = (e.clientX / innerWidth - 0.5) * 0.5;
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
      canvas.removeEventListener('pointercancel', onUp);
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
