/** Custom event dispatched on `app-moai-figure` as the desktop About-to-corner transition scrubs (issue #661). */
export const MOAI_TRANSIT = 'moai-transit';

/** Total voxel rows of the moai (y = 0..24); kept import-free so the home chunk stays under the initial JS budget. */
export const MOAI_TRANSIT_ROWS = 25;

const EXIT_END = 0.45;
const ENTER_START = 0.55;
export const MOAI_TRANSIT_GAP = [EXIT_END, ENTER_START] as const;

export interface MoaiTransitState {
  readonly phase: 'about' | 'gap' | 'corner';
  readonly corner: boolean;
  readonly cutY: number;
  readonly frontier: boolean;
  readonly pukaoVisible: boolean;
  readonly pukaoLift: number;
  readonly shadow: number;
  readonly tilt: number;
  readonly sy: number;
}

const PUKAO_DROP_STEPS = [5, 2.5, 0.5] as const;

/**
 * Desktop About-to-corner scroll choreography (issue #661):
 * 0..0.45 unbuilds top-down row by row in About; 0.45..0.55 clears across the band seam (switching corner placement
 * while hidden); 0.55..1 rematerializes bottom-up in the corner with the pukao dropping last and a stone settle.
 */
export function moaiTransit(progress: number): MoaiTransitState {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const fullY = MOAI_TRANSIT_ROWS;
  if (p <= 0) {
    return { phase: 'about', corner: false, cutY: fullY, frontier: false, pukaoVisible: true, pukaoLift: 0, shadow: 1, tilt: 0, sy: 1 };
  }
  if (p >= 1) {
    return { phase: 'corner', corner: true, cutY: fullY, frontier: false, pukaoVisible: true, pukaoLift: 0, shadow: 1, tilt: 0, sy: 1 };
  }
  if (p < EXIT_END) {
    const t = p / EXIT_END;
    const cutY = Math.max(0, Math.min(fullY - 1, Math.floor((1 - t) * fullY)));
    const shadow = cutY < 1 ? 0 : cutY < 3 ? 0.35 : cutY < 7 ? 0.65 : 1;
    return { phase: 'about', corner: false, cutY, frontier: true, pukaoVisible: cutY >= 22, pukaoLift: 0, shadow, tilt: t * 0.14, sy: 1 };
  }
  if (p <= ENTER_START) {
    return { phase: 'gap', corner: p >= 0.5, cutY: -1, frontier: false, pukaoVisible: false, pukaoLift: 0, shadow: 0, tilt: 0, sy: 1 };
  }
  const t = (p - ENTER_START) / (1 - ENTER_START);
  const shadow = t < 0.06 ? 0.5 : 1;
  if (t < 0.8) {
    const u = Math.max(0, (t - 0.05) / 0.75);
    const cutY = Math.min(21, Math.floor(u * 22));
    return { phase: 'corner', corner: true, cutY, frontier: true, pukaoVisible: false, pukaoLift: 0, shadow, tilt: (1 - t) * 0.1, sy: 1 };
  }
  if (t < 0.94) {
    const step = Math.min(PUKAO_DROP_STEPS.length - 1, Math.floor(((t - 0.8) / 0.14) * PUKAO_DROP_STEPS.length));
    return { phase: 'corner', corner: true, cutY: 22, frontier: false, pukaoVisible: true, pukaoLift: PUKAO_DROP_STEPS[step], shadow, tilt: (1 - t) * 0.1, sy: 1 };
  }
  const sy = t < 0.97 ? 0.94 : t < 0.99 ? 1.02 : 1;
  return { phase: 'corner', corner: true, cutY: fullY, frontier: false, pukaoVisible: true, pukaoLift: 0, shadow, tilt: 0, sy };
}
