import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { DirectionalLight, HemisphereLight, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { COS30, isoBounds, isoFaces } from '../voxel/iso';
import { follow } from '../voxel/motion';
import { MotionPause } from '../motion/pause';
import { AVATAR_BLEED, AVATAR_FRAME, avatarVoxels } from './avatar.model';
import { type AvatarBody, voxelBody } from './body';
import { type Gait, MOVES } from './poses';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
/** A press that moves less than this is a tap: it plays a move. */
const TAP_PX = 12;
/** Where it faces, as a turn from the still image's pose: towards the viewer walking down, its back walking up. */
const FACING: Readonly<Record<string, number>> = { front: 0, down: Math.PI / 4, up: Math.PI * 1.25, right: Math.PI / 2 };

/**
 * The 3D avatar. It draws inside the `.avatar` layer that motion/effects/walker.ts moves along the page, and reads
 * from that layer where it is (`data-place`), whether it walks (`data-gait`) and which way it faces (`data-facing`).
 */
@Component({
  selector: 'app-avatar-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y pinch-zoom;
    }
  `,
})
export class AvatarScene {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pause = inject(MotionPause);
  /** The layer it draws in; `data-drawn` on it after the first frame shows it and hides the still image (walker.ts). */
  private layer: HTMLElement | null = null;

  private readonly cleanups: (() => void)[] = [];
  private raf = 0;
  private ready = false;
  private visible = false;

  constructor() {
    afterNextRender(() => {
      try {
        this.start();
      } catch {
        this.stop();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const root = document.documentElement;
    this.layer = this.host.nativeElement.closest<HTMLElement>('.avatar');
    const layer: DOMStringMap = this.layer?.dataset ?? {};
    const desktopQuery = matchMedia('(min-width: 1024px) and (pointer: fine)');

    // create the context ourselves: when WebGL is missing Three.js would log an error before throwing
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!context) return;
    const renderer = new WebGLRenderer({ canvas, context });
    renderer.setClearColor(0x000000, 0);
    const body: AvatarBody = voxelBody();
    this.cleanups.push(() => {
      body.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    });
    const paint = (): void => {
      const style = getComputedStyle(root);
      body.paint((token) => style.getPropertyValue(token).trim());
    };
    paint();

    const scene = new Scene();
    scene.add(body.object, new HemisphereLight(0xffffff, 0x555555, 2.4));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 3);
    scene.add(sun);

    // framed like the still image: the same isometric view, centred on the same bounds
    const bounds = isoBounds(isoFaces(avatarVoxels()));
    const sx = (bounds.minX + bounds.width / 2) / COS30;
    const sy = 2 * (bounds.minY + bounds.height / 2);
    const target = new Vector3((sx + sy) / 2, 0, (sy - sx) / 2);
    const halfW = ((bounds.width * ISO_TO_WORLD * AVATAR_FRAME) / 2) * (1 + 2 * AVATAR_BLEED);
    const halfH = (bounds.height * ISO_TO_WORLD * AVATAR_FRAME) / 2;
    const camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 300);
    camera.position.copy(target).add(new Vector3(80, 80, 80));
    camera.lookAt(target);

    const resize = (): void => {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, desktopQuery.matches ? 2 : 1.5));
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
    let yaw = 0;
    let look = 0;
    let lookTarget = 0;
    let drawn = false;
    const frame = (now: number): void => {
      try {
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        const goal = FACING[layer['facing'] ?? 'front'] ?? 0;
        yaw = follow(yaw, yaw + Math.atan2(Math.sin(goal - yaw), Math.cos(goal - yaw)), dt, 120);
        body.object.rotation.y = yaw;
        // the head turns to the pointer only while it stands in the hero
        look = follow(look, layer['place'] === 'hero' && desktopQuery.matches ? lookTarget : 0, dt);
        const gait: Gait = layer['gait'] === 'walk' ? 'walk' : 'idle';
        body.update(dt, gait, look, this.pause.paused());
        renderer.render(scene, camera);
        if (!drawn) {
          drawn = true;
          this.layer?.setAttribute('data-drawn', '');
        }
        this.raf = requestAnimationFrame(frame);
      } catch {
        this.stop();
      }
    };
    this.loop = (): void => {
      last = performance.now();
      this.raf = requestAnimationFrame(frame);
    };

    let press: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent): void => {
      press = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent): void => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < TAP_PX) body.play(MOVES[Math.floor(Math.random() * MOVES.length)]);
      press = null;
    };
    const onLook = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      const box = canvas.getBoundingClientRect();
      lookTarget = Math.max(-0.6, Math.min(0.6, ((e.clientX - (box.left + box.width / 2)) / innerWidth) * 1.5));
    };
    const onLost = (event: Event): void => {
      event.preventDefault();
      this.stop();
    };
    const onVisibility = (): void => {
      this.sync();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    addEventListener('pointermove', onLook, { passive: true });
    desktopQuery.addEventListener('change', resize);
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanups.push(() => {
      sizes.disconnect();
      views.disconnect();
      themes.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      removeEventListener('pointermove', onLook);
      desktopQuery.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    });

    resize();
    this.ready = true;
    this.sync();
  }

  private loop: () => void = () => undefined;

  /** Draws only while the avatar can be seen. */
  private sync(): void {
    const run = this.ready && this.visible && !document.hidden;
    if (run && !this.raf) this.loop();
    else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  /** Also the failure path: the layer hides again and the still image comes back. */
  private stop(): void {
    // the server destroys components too, and has no animation frames
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ready = false;
    this.layer?.removeAttribute('data-drawn');
    this.cleanups.splice(0).reverse().forEach((cleanup) => {
      cleanup();
    });
  }
}
