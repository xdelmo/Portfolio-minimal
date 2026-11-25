import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { watchPause } from '../../motion/pause';
import { COS30, isoBounds, isoFaces } from '../iso';
import {
  isEar,
  isEye,
  isHead,
  isTail,
  LEFT_EAR,
  lidColor,
  NECK,
  NUTELLA_FRAME,
  nutellaShadowCells,
  nutellaVoxels,
  RIGHT_EAR,
  type NutellaColor,
  type NutellaVoxel,
} from '../nutella.model';
import { createNutellaMotion, POSE_FPS, quantize, type NutellaMood } from '../nutella.motion';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
const SHADOW = '--moai-shadow';
const ARRIVAL_CRY_S = 0.5;

/**
 * Nutella on the 404 (issue #632, #639), drawn like the moai: the same cubes, lights and isometric camera. Her pose
 * steps at 12 fps with idle wag bursts, random blinks, head tilts and ear flicks, reacts to the battle menu's mood,
 * barks on arrival and on click, and follows the pointer on desktop; with reduced motion, the pause button or out of
 * sight she stands still. The canvas is decorative: the page's heading says what she is. `drawn` fires after the first
 * frame so the still render underneath can step aside; `failed` fires when WebGL is missing.
 */
@Component({
  selector: 'app-nutella-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host,
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class NutellaScene {
  readonly mood = input<NutellaMood>('idle');
  readonly drawn = output();
  readonly barked = output();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly cleanups: (() => void)[] = [];
  private raf = 0;

  constructor() {
    afterNextRender(() => {
      try {
        this.start();
      } catch {
        this.stop();
        this.failed.emit();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  readonly failed = output();

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const root = document.documentElement;
    // create the context ourselves: when WebGL is missing Three.js would log an error before throwing
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
    if (!context) {
      this.failed.emit();
      return;
    }
    const renderer = new WebGLRenderer({ canvas, context });
    renderer.setClearColor(0x000000, 0);
    const geometry = new BoxGeometry(0.94, 0.94, 0.94);
    const scene = new Scene();
    this.cleanups.push(() => {
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    });

    const dog = new Group();
    scene.add(dog);

    // articulated parts, each turning round its own joint; cubes sit at their centres, x + 0.5
    const voxels = nutellaVoxels();
    const tailVoxels = voxels.filter(isTail);
    const headAll = voxels.filter((v) => !isTail(v) && isHead(v));
    const leftEarVoxels = headAll.filter((v) => isEar(v) && v.x <= 4);
    const rightEarVoxels = headAll.filter((v) => isEar(v) && v.x >= 7);
    const headVoxels = headAll.filter((v) => !isEar(v));
    const bodyVoxels = voxels.filter((v) => !isTail(v) && !isHead(v));

    const meshes: { mesh: InstancedMesh; voxels: NutellaVoxel[] }[] = [];
    const eyeSlots: { mesh: InstancedMesh; index: number; lid: NutellaColor }[] = [];
    const dummy = new Object3D();
    const part = (list: NutellaVoxel[], pivot: Vector3, parent: Object3D = scene, parentPivot: Vector3 = new Vector3()): Group => {
      const material = new MeshLambertMaterial();
      const mesh = new InstancedMesh(geometry, material, list.length);
      list.forEach((v, i) => {
        dummy.position.set(v.x + 0.5 - pivot.x, v.y + 0.5 - pivot.y, v.z + 0.5 - pivot.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (isEye(v)) eyeSlots.push({ mesh, index: i, lid: lidColor(voxels, v) });
      });
      meshes.push({ mesh, voxels: list });
      this.cleanups.push(() => {
        material.dispose();
      });
      const group = new Group();
      group.position.copy(pivot).sub(parentPivot);
      group.add(mesh);
      parent.add(group);
      return group;
    };

    part(bodyVoxels, new Vector3(), dog);
    const tail = part(
      tailVoxels,
      new Vector3(NECK.x + 0.5, Math.min(...tailVoxels.map((v) => v.y)) + 0.5, Math.max(...tailVoxels.map((v) => v.z)) + 0.5),
      dog,
    );
    const headPivot = new Vector3(NECK.x + 0.5, NECK.y + 0.5, NECK.z + 0.5);
    const head = part(headVoxels, headPivot, dog);
    const leftEar = part(leftEarVoxels, new Vector3(LEFT_EAR.x + 0.5, LEFT_EAR.y + 0.5, LEFT_EAR.z + 0.5), head, headPivot);
    const rightEar = part(rightEarVoxels, new Vector3(RIGHT_EAR.x + 0.5, RIGHT_EAR.y + 0.5, RIGHT_EAR.z + 0.5), head, headPivot);

    // shadow stays directly on the scene so it stays grounded while Nutella hops
    const cells = nutellaShadowCells(voxels);
    const shadowGeometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const shadowMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false });
    const shadow = new InstancedMesh(shadowGeometry, shadowMaterial, cells.length);
    cells.forEach((c, i) => {
      dummy.position.set(c.x + 0.5, 0.01, c.z + 0.5);
      dummy.updateMatrix();
      shadow.setMatrixAt(i, dummy.matrix);
    });
    scene.add(shadow, new HemisphereLight(0xffffff, 0x555555, 2.4));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 3);
    scene.add(sun);
    this.cleanups.push(() => {
      shadowGeometry.dispose();
      shadowMaterial.dispose();
    });

    // the same camera as the moai: isometric from (1, 1, 1), framed on the still drawing's bounds
    const bounds = isoBounds(isoFaces(voxels.map(({ x, y, z }) => ({ x, y, z, color: 'stone' as const }))));
    const sx = (bounds.minX + bounds.width / 2) / COS30;
    const sy = 2 * (bounds.minY + bounds.height / 2);
    const target = new Vector3((sx + sy) / 2, 0, (sy - sx) / 2);
    const half = (Math.max(bounds.width, bounds.height) * ISO_TO_WORLD * NUTELLA_FRAME) / 2;
    const camera = new OrthographicCamera(-half, half, half, -half, 0.1, 200);
    camera.position.copy(target).add(new Vector3(50, 50, 50));
    camera.lookAt(target);

    let hasDrawn = false;
    const renderScene = (): void => {
      renderer.render(scene, camera);
      if (!hasDrawn) {
        hasDrawn = true;
        this.drawn.emit();
      }
    };

    let currentBlink = false;
    const setBlink = (blink: boolean, style = getComputedStyle(root)): void => {
      const color = new Color();
      const updated = new Set<InstancedMesh>();
      for (const slot of eyeSlots) {
        const token = blink ? slot.lid : 'black';
        slot.mesh.setColorAt(slot.index, color.set(style.getPropertyValue(`--nutella-${token}`).trim()));
        updated.add(slot.mesh);
      }
      for (const mesh of updated) {
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    };

    const paint = (): void => {
      const style = getComputedStyle(root);
      const color = new Color();
      for (const { mesh, voxels: list } of meshes) {
        list.forEach((v, i) => {
          mesh.setColorAt(i, color.set(style.getPropertyValue(`--nutella-${v.color}`).trim()));
        });
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      if (currentBlink) setBlink(true, style);
      // a see-through token, rgb(r g b / a): Three.js does not read the space-separated form
      const [r = 0, g = 0, b = 0, a = 1] = (style.getPropertyValue(SHADOW).match(/[\d.]+/g) ?? []).map(Number);
      shadowMaterial.color.setStyle(`rgb(${String(r)},${String(g)},${String(b)})`);
      shadowMaterial.opacity = a;
      renderScene();
    };

    const motion = createNutellaMotion();
    const look = { yaw: 0, pitch: 0 };
    let t = 0;
    let last = 0;
    let lastFrame = -1;
    let arrived = false;

    const applyPose = (): void => {
      const qt = quantize(t);
      const p = motion.pose(qt, this.mood(), look);
      tail.rotation.y = p.tail;
      tail.rotation.x = -p.tailLift;
      head.rotation.set(p.headPitch, p.headYaw, p.headTilt);
      leftEar.rotation.z = -p.earLeft;
      rightEar.rotation.z = p.earRight;
      dog.position.y = p.hop;
      if (p.blink !== currentBlink) {
        currentBlink = p.blink;
        setBlink(currentBlink);
      }
    };

    const frame = (now: number): void => {
      t += Math.min(now - last, 100) / 1000;
      last = now;
      const frameIndex = Math.floor(t * POSE_FPS);
      if (frameIndex !== lastFrame) {
        lastFrame = frameIndex;
        if (!arrived && t >= ARRIVAL_CRY_S) {
          arrived = true;
          motion.bark(quantize(t));
        }
        applyPose();
        renderScene();
      }
      this.raf = requestAnimationFrame(frame);
    };

    // she moves only while seen, with motion allowed and the pause button off; otherwise she rests in her pose
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const desktopPointer = matchMedia('(min-width: 1024px) and (hover: hover)');
    let visible = false;
    let paused = false;
    const sync = (): void => {
      const run = visible && !paused && !still.matches && !document.hidden;
      if (run && !this.raf) {
        last = performance.now();
        this.raf = requestAnimationFrame(frame);
      } else if (!run && this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    };

    const onPointerDown = (): void => {
      if (paused || still.matches || document.hidden) return;
      motion.bark(quantize(t));
      lastFrame = -1;
      this.barked.emit();
    };
    const onPointerMove = (event: PointerEvent): void => {
      if (!desktopPointer.matches) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      look.yaw = Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth / 2 || 1))) * 0.35;
      look.pitch = Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight / 2 || 1))) * 0.2;
    };

    const resize = (): void => {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderScene();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const views = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    views.observe(canvas);
    const themes = new MutationObserver(paint);
    themes.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    still.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    const unwatch = watchPause((p) => {
      paused = p;
      sync();
    });
    this.cleanups.push(() => {
      sizes.disconnect();
      views.disconnect();
      themes.disconnect();
      still.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      unwatch();
    });
    resize();
    paint();
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.cleanups.splice(0).reverse().forEach((cleanup) => {
      cleanup();
    });
  }
}
