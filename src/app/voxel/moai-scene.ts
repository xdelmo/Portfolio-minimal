import {
  type WritableSignal,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
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
import { BUBBLE_MS, DIZZY_MS, GUM_LIPS, Gaze, HOP_MS, IDLE_GUM_MS, LOOK_DOWN, PHONE_GAZE, PUKAO_MS, SLEEP_MS, SNEEZE_MS, SULK_MS, WAVE_MS, bubble, bubbleCells, breath, follow, gaze, glance, hop, isPupil, pukaoFall, sneeze, stretch, wave, wobble } from './motion';
import { Sample, isDizzy, isShake, isSneeze, isTickle } from './gestures';
import { LINE_MS, QUIET, Reaction, VoiceState, speak } from './voice';
import { LINES } from './lines';
import { HELLO_KEY, MOAI_DESKTOP, MoaiCues } from './moai-cues';

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
/** The eyes roll round while it is dizzy, one corner every 150 ms. */
const ROLL: readonly Gaze[] = ['left-up', 'right-up', 'right-down', 'left-down'];

const CSS_COLORS: Readonly<Record<VoxelColor, string>> = {
  stone: '--stone',
  stoneDark: '--stone-dark',
  stoneLight: '--stone-light',
  eye: '--accent',
  pukao: '--px-6',
  moss: '--stone-light',
};

/**
 * Canvases whose WebGL context a destroyed scene left alive, for the next scene to take over. WebKit counts a lost context
 * as active until it is garbage collected and, past 16, loses the oldest one, also a live one: with the About's moai and
 * the corner's coming and going on every page change (issue #393), a few round trips were enough. Two, one for each.
 */
const spare: HTMLCanvasElement[] = [];

@Component({
  selector: 'app-moai-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gaze]': 'gaze()',
    '[attr.data-gum]': 'gum() ? "" : null',
    '[attr.data-waving]': 'waving() ? "" : null',
    '[attr.data-scrolling]': 'scrolling() ? "" : null',
    '[attr.data-asleep]': 'asleep() ? "" : null',
    '[attr.data-hop]': 'hopping() ? "" : null',
    '[attr.data-line]': 'line()?.reaction ?? null',
    '[attr.data-pukao]': 'pukaoOff() ? "off" : null',
    '[attr.data-sulking]': 'sulking() ? "" : null',
    '[attr.data-dizzy]': 'dizzy() ? "" : null',
    '[attr.data-sneeze]': 'sneezing() ? "" : null',
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
    @if (sneezing()) {
      <span class="dust" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    }
    @if (line(); as said) {
      <p class="moai-line" aria-hidden="true">{{ said.text }}</p>
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
    // what it says: a pixel bubble above its head, the corners cut out of its outline and a tail of two steps down to the
    // face. It opens left and up, so in the corner it stays inside the window, and takes no clicks. In the corner the moai
    // is the About's one scaled down (effects/moai.ts): the bubble scales back up to keep its text readable
    .moai-line {
      position: absolute;
      right: 50%;
      bottom: 98%;
      width: max-content;
      max-width: 14rem;
      margin: 0;
      padding: var(--space-1) var(--space-2);
      background: var(--surface);
      color: var(--fg);
      font-size: var(--step--1);
      line-height: 1.5;
      box-shadow: 0 -4px var(--fg), 0 4px var(--fg), -4px 0 var(--fg), 4px 0 var(--fg);
      pointer-events: none;
      transform-origin: 100% 100%;
      scale: calc(1 / var(--moai-s, 1));
      animation: line-in 160ms steps(2) both;
    }
    .moai-line::after {
      content: '';
      position: absolute;
      right: -8px;
      bottom: -12px;
      width: 8px;
      height: 8px;
      background: var(--fg);
      box-shadow: 8px 8px var(--fg);
    }
    // the sneeze blows a puff of stone dust from the nose: four pixel squares that fly apart and fade
    .dust {
      position: absolute;
      top: 45%;
      left: 50%;
      pointer-events: none;
    }
    .dust i {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--stone-light);
      animation: dust 600ms steps(4) both;
    }
    .dust i:nth-child(1) {
      --to: -24px -16px;
    }
    .dust i:nth-child(2) {
      --to: 24px -8px;
    }
    .dust i:nth-child(3) {
      --to: -16px 16px;
    }
    .dust i:nth-child(4) {
      --to: 32px 16px;
    }
    @keyframes dust {
      to {
        opacity: 0;
        translate: var(--to);
      }
    }
    @keyframes line-in {
      from {
        opacity: 0;
        translate: 0 8px;
      }
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
  /** Whether it waves once the intro is over: only on the home (issue #393). */
  readonly greet = input(true);
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
  /** While a single click's hop lasts. */
  protected readonly hopping = signal(false);
  /** The open speech bubble, for LINE_MS (issue #393). */
  protected readonly line = signal<{ reaction: Reaction; text: string } | null>(null);
  /** Shaken: the pukao is off its head (issue #393). */
  protected readonly pukaoOff = signal(false);
  /** Tickled: its back turned, it takes no clicks. */
  protected readonly sulking = signal(false);
  /** Spun round twice in one drag. */
  protected readonly dizzy = signal(false);
  /** A gust of scroll went by. */
  protected readonly sneezing = signal(false);
  private voice: VoiceState = QUIET;
  private lineTimer = 0;
  private introDone = false;
  // its idle life (breath, the phones' glances) stops with the one header pause button (WCAG 2.2.2)
  private readonly pause = inject(MotionPause);
  private readonly cues = inject(MoaiCues);

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
    let canvas = this.canvas().nativeElement;
    const reused = spare.pop();
    if (reused) {
      canvas.replaceWith(reused);
      canvas = reused;
    }
    const root = document.documentElement;
    const desktopQuery = matchMedia(MOAI_DESKTOP);
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
      if (context.isContextLost() || spare.length >= 2) {
        renderer.forceContextLoss();
        return;
      }
      canvas.remove();
      spare.push(canvas);
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
    const blowGum = (): void => {
      gumStart = performance.now();
      this.gum.set(true);
      gumTimer = window.setTimeout(endGum, BUBBLE_MS);
    };
    // a single click's hop and the stretch on waking up: held poses on timers, like the bubble
    let hopStart: number | null = null;
    let stretchStart: number | null = null;
    let hopTimer = 0;
    let blink = false;
    // whether it fell asleep, or lay asleep, where it could be seen: only then does it grumble on waking up
    let sleptInView = false;
    this.cleanups.push(() => {
      clearTimeout(gumTimer);
      clearTimeout(hopTimer);
      clearTimeout(this.lineTimer);
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
      const asleep = this.asleep() || blink;
      const looking = this.gaze();
      // while the page scrolls the pupils drop to the bottom of the eyes
      const g = rolling ?? (this.scrolling() ? looking ? (looking.replace('-up', '-down') as Gaze) : PHONE_GAZE : looking);
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
    // shaken, the pukao's voxels move off the head together (motion.ts pukaoFall)
    const pukao = voxels.flatMap((v, i) => (v.y >= 22 ? [i] : []));
    let pukaoAt = '0,0';
    const placePukao = (off: { x: number; y: number } | null): void => {
      const at = off ? `${String(off.x)},${String(off.y)}` : '0,0';
      if (at === pukaoAt) return;
      pukaoAt = at;
      for (const i of pukao) {
        dummy.position.copy(base[i]).add(new Vector3(off?.x ?? 0, off?.y ?? 0, 0));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    // the gags (issue #393): each one a state held on a timer, like the bubble; the frame loop reads when it started
    const gagTimers: number[] = [];
    const act = (state: WritableSignal<boolean>, ms: number): number => {
      state.set(true);
      gagTimers.push(
        window.setTimeout(() => {
          state.set(false);
        }, ms),
      );
      return performance.now();
    };
    let pukaoStart = 0;
    let dizzyStart = 0;
    let sneezeStart = 0;
    let rolling: Gaze | null = null;
    this.cleanups.push(() => {
      gagTimers.forEach((t) => {
        clearTimeout(t);
      });
    });
    paint();

    const resize = (): void => {
      const dpr = Math.min(devicePixelRatio || 1, this.desktop() ? 2 : 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    // on arrival (after the intro, once it can be seen) it says what the site kept for it, or hello after a change of
    // language; the hello is read once, so a reload does not repeat it, and dropped if the moai starts out of sight
    let hello = false;
    try {
      hello = sessionStorage.getItem(HELLO_KEY) !== null;
      sessionStorage.removeItem(HELLO_KEY);
    } catch {
      // no storage: no hello
    }
    let firstView = true;
    let arrived = false;
    const arrive = (): void => {
      if (arrived || !this.introDone || !this.visible) return;
      arrived = true;
      const reaction = this.cues.take() ?? (hello ? 'hello' : null);
      if (reaction) this.say(reaction);
    };
    const views = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (firstView && !this.visible) hello = false;
      firstView = false;
      if (this.visible && this.asleep()) sleptInView = true;
      this.sync();
      arrive();
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
        // the pause button silences it
        if (paused && this.line()) this.line.set(null);
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
        pivot.rotation.x = breath(idle) + down + (this.sneezing() ? sneeze(now - sneezeStart) : 0);
        // sulking it turns its back, and holds still
        pivot.rotation.y = this.drag + (this.sulking() ? Math.PI : look);
        pivot.rotation.z = wave(waveT) + (this.dizzy() ? wobble(now - dizzyStart) : 0);
        placePukao(this.pukaoOff() ? pukaoFall(now - pukaoStart) : null);
        const roll = this.dizzy() ? ROLL[Math.floor((now - dizzyStart) / 150) % ROLL.length] : null;
        if (roll !== rolling) {
          rolling = roll;
          paint();
        }
        const pose = (hopStart === null ? null : hop(now - hopStart)) ?? (stretchStart === null ? null : stretch(now - stretchStart));
        pivot.scale.y = pose?.sy ?? 1;
        pivot.position.y = pose?.y ?? 0;
        // it blinks as it crouches for the hop
        const blinking = hopStart !== null && now - hopStart < HOP_MS / 2;
        if (blinking !== blink) {
          blink = blinking;
          paint();
        }
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
    // a press that moved is a drag (or a page scroll), not a click
    let moved = false;
    // the drag's pointer positions, for a shake, and how far it turned the moai in all, for a spin
    let strokes: Sample[] = [];
    let spun = 0;
    const onDown = (e: PointerEvent): void => {
      const mouse = this.desktop() && e.pointerType === 'mouse';
      const finger = !this.desktop() && e.pointerType === 'touch';
      if (!mouse && !finger) return;
      pointerX = e.clientX;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerDir = mouse ? 'x' : null;
      moved = false;
      strokes = [{ t: performance.now(), v: e.clientX }];
      spun = 0;
      if (mouse) canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent): void => {
      if (pointerX === null) return;
      if (Math.abs(e.clientX - pointerStartX) >= SWIPE_LOCK_PX || Math.abs(e.clientY - pointerStartY) >= SWIPE_LOCK_PX) moved = true;
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
      spun += Math.abs(e.clientX - pointerX) * 0.01;
      pointerX = e.clientX;
      // a fast shake comes as fewer moves than it made, merged one per frame: its turns are in the merged ones
      const now = performance.now();
      const merged = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const c of merged.length ? merged : [e]) strokes.push({ t: now, v: c.clientX });
      while (strokes.length > 1 && now - strokes[0].t > 1200) strokes.shift();
    };
    let lastTap: { time: number; x: number; y: number } | null = null;
    // the clicks of the current series, and the voice before its first one: a gag at the end of the series takes the
    // place of the hop's or the gum's line and the cooldown it took
    let taps: number[] = [];
    let seriesVoice = this.voice;
    const replaceTapLine = (): void => {
      const open = this.line()?.reaction;
      if (open === 'hop' || open === 'gum') this.voice = seriesVoice;
    };
    const startHop = (): void => {
      if (this.pause.paused()) return;
      hopStart = performance.now();
      this.hopping.set(true);
      clearTimeout(hopTimer);
      hopTimer = window.setTimeout(() => {
        hopStart = null;
        this.hopping.set(false);
      }, HOP_MS);
    };
    const onUp = (e: PointerEvent): void => {
      const turned = moved && pointerDir === 'x';
      const dragged = moved;
      pointerX = null;
      pointerDir = null;
      moved = false;
      // the end of a drag: it speaks once the gesture is over, never during it
      if (dragged) {
        lastTap = null;
        if (!turned) return;
        // shaken, the pukao falls; spun round twice, it gets dizzy; otherwise it just complains
        const gags = this.desktop() && !this.pause.paused();
        if (gags && isShake(strokes) && !this.pukaoOff()) {
          pukaoStart = act(this.pukaoOff, PUKAO_MS);
          this.say('shake');
        } else if (gags && isDizzy(spun) && !this.dizzy()) {
          dizzyStart = act(this.dizzy, DIZZY_MS);
          this.say('dizzy');
        } else this.say('drag');
        return;
      }
      // sulking, it takes no clicks
      if (this.sulking()) return;
      const now = performance.now();
      taps = taps.filter((t) => now - t <= 2000);
      if (!taps.length) seriesVoice = this.voice;
      taps.push(now);
      // tickled with six quick clicks, it turns its back
      if (this.desktop() && !this.pause.paused() && isTickle(taps, now)) {
        taps = [];
        lastTap = null;
        replaceTapLine();
        act(this.sulking, SULK_MS);
        this.say('sulk');
        return;
      }
      const tap = { time: e.timeStamp, x: e.clientX, y: e.clientY };
      const double = lastTap !== null && tap.time - lastTap.time < DOUBLE_TAP_MS && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < DOUBLE_TAP_PX;
      lastTap = double ? null : tap;
      // the first click hops at once, without waiting to see whether a second one comes; the second blows the gum, and
      // its line takes the place of the first one's, whose cooldown it takes back
      if (!double) {
        startHop();
        this.say('hop');
      } else if (gumStart === null) {
        blowGum();
        replaceTapLine();
        this.say('gum');
      }
    };
    const onCancel = (): void => {
      pointerX = null;
      pointerDir = null;
      moved = false;
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
    // a gust of the wheel (or a trackpad's flick) makes it sneeze: the wheel, not the scroll, so a jump to an anchor never does
    let wheeled = 0;
    let gust: Sample[] = [{ t: performance.now(), v: 0 }];
    const onWheel = (e: WheelEvent): void => {
      const now = performance.now();
      wheeled += Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      gust.push({ t: now, v: wheeled });
      while (gust.length > 2 && now - gust[1].t > 400) gust.shift();
      if (!this.desktop() || !this.visible || this.pause.paused() || this.sneezing() || !isSneeze(gust)) return;
      gust = [{ t: now, v: wheeled }];
      sneezeStart = act(this.sneezing, SNEEZE_MS);
      this.say('sneeze');
    };
    let lastInput = performance.now();
    // one bubble per wait: the next comes only after some input
    let idleGum = false;
    const onInput = (): void => {
      lastInput = performance.now();
      idleGum = false;
      if (!this.asleep()) return;
      this.asleep.set(false);
      paint();
      if (this.pause.paused()) return;
      stretchStart = performance.now();
      if (sleptInView) this.say('wake');
    };
    // the paused moai neither falls asleep nor wakes by itself: its clock starts again from the pause
    const sleepTimer = window.setInterval(() => {
      const now = performance.now();
      if (this.pause.paused()) lastInput = now;
      else if (!idleGum && gumStart === null && this.visible && !this.scrolling() && now - lastInput >= IDLE_GUM_MS) {
        idleGum = true;
        blowGum();
      } else if (!this.asleep() && now - lastInput > SLEEP_MS) {
        this.asleep.set(true);
        sleptInView = this.visible;
        paint();
      }
    }, 1000);
    for (const type of WAKE_EVENTS) addEventListener(type, onInput, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('wheel', onWheel, { passive: true });
    const cancelIntro = afterIntro(() => {
      this.introDone = true;
      arrive();
      if (!this.greet()) return;
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
    const unlisten = this.cues.listen((reaction) => this.say(reaction));
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
      removeEventListener('wheel', onWheel);
      clearInterval(sleepTimer);
      cancelIntro();
      unlisten();
    });

    resize();
    this.ready.set(true);
    this.sync();
  }

  private loop: () => void = () => undefined;

  /**
   * Opens a speech bubble for `reaction`, or keeps quiet: only where it can be seen and follows the pointer (desktop),
   * after the intro, not while paused, and at most once per COOLDOWN_MS (voice.ts). A line it cannot say now is dropped; it answers whether it spoke.
   */
  private say(reaction: Reaction): boolean {
    if (!this.visible || document.hidden || !this.desktop() || !this.introDone || this.pause.paused()) return false;
    const lines = LINES[reaction];
    const spoken = speak(this.voice, reaction, lines.length, performance.now(), Math.random);
    if (!spoken) return false;
    this.voice = spoken.state;
    this.line.set({ reaction, text: lines[spoken.variant] });
    clearTimeout(this.lineTimer);
    this.lineTimer = window.setTimeout(() => {
      this.line.set(null);
    }, LINE_MS);
    return true;
  }

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
