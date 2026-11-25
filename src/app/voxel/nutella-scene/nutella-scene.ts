import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, output, viewChild } from '@angular/core';
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
import { isHead, isTail, NECK, nutellaShadowCells, nutellaVoxels, type NutellaVoxel } from '../nutella.model';

const ISO_TO_WORLD = Math.sqrt(2 / 3);
/** Room round the dog for the head's tilt and the tail's wag. */
const FRAME = 1.25;
const SHADOW = '--moai-shadow';

/**
 * Nutella on the 404 (issue #632), drawn like the moai: the same cubes, lights and isometric camera. She wags her tail
 * and tilts her head now and then; with reduced motion, the pause button or out of sight she stands still. The canvas
 * is decorative: the page's heading says what she is. `failed` fires when WebGL is missing, so the page can fall back.
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
  readonly failed = output();
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

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const root = document.documentElement;
    // create the context ourselves: when WebGL is missing Three.js would log an error before throwing
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
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

    // three parts, each turning round its own joint; the cubes sit at their centres, x + 0.5
    const voxels = nutellaVoxels();
    const tailVoxels = voxels.filter(isTail);
    const headVoxels = voxels.filter((v) => !isTail(v) && isHead(v));
    const bodyVoxels = voxels.filter((v) => !isTail(v) && !isHead(v));
    const meshes: { mesh: InstancedMesh; voxels: NutellaVoxel[] }[] = [];
    const dummy = new Object3D();
    const part = (list: NutellaVoxel[], pivot: Vector3): Group => {
      const material = new MeshLambertMaterial();
      const mesh = new InstancedMesh(geometry, material, list.length);
      list.forEach((v, i) => {
        dummy.position.set(v.x + 0.5 - pivot.x, v.y + 0.5 - pivot.y, v.z + 0.5 - pivot.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      meshes.push({ mesh, voxels: list });
      this.cleanups.push(() => {
        material.dispose();
      });
      const group = new Group();
      group.position.copy(pivot);
      group.add(mesh);
      scene.add(group);
      return group;
    };
    part(bodyVoxels, new Vector3());
    const tail = part(tailVoxels, new Vector3(NECK.x + 0.5, 0, Math.max(...tailVoxels.map((v) => v.z)) + 0.5));
    const head = part(headVoxels, new Vector3(NECK.x + 0.5, NECK.y + 0.5, NECK.z + 0.5));

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
    const half = (Math.max(bounds.width, bounds.height) * ISO_TO_WORLD * FRAME) / 2;
    const camera = new OrthographicCamera(-half, half, half, -half, 0.1, 200);
    camera.position.copy(target).add(new Vector3(50, 50, 50));
    camera.lookAt(target);

    const paint = (): void => {
      const style = getComputedStyle(root);
      const color = new Color();
      for (const { mesh, voxels: list } of meshes) {
        list.forEach((v, i) => {
          mesh.setColorAt(i, color.set(style.getPropertyValue(`--nutella-${v.color}`).trim()));
        });
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      // a see-through token, rgb(r g b / a): Three.js does not read the space-separated form
      const [r = 0, g = 0, b = 0, a = 1] = (style.getPropertyValue(SHADOW).match(/[\d.]+/g) ?? []).map(Number);
      shadowMaterial.color.setStyle(`rgb(${String(r)},${String(g)},${String(b)})`);
      shadowMaterial.opacity = a;
      renderer.render(scene, camera);
    };

    let t = 0;
    let last = 0;
    const pose = (): void => {
      tail.rotation.y = Math.sin(t * 14) * 0.45;
      const phase = t % 4;
      head.rotation.z = phase < 1.4 ? Math.sin((phase / 1.4) * Math.PI) * 0.28 : 0;
    };
    const frame = (now: number): void => {
      t += Math.min(now - last, 100) / 1000;
      last = now;
      pose();
      renderer.render(scene, camera);
      this.raf = requestAnimationFrame(frame);
    };

    // she moves only while seen, with motion allowed and the pause button off; otherwise she rests in her pose
    const still = matchMedia('(prefers-reduced-motion: reduce)');
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
    const resize = (): void => {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.render(scene, camera);
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
