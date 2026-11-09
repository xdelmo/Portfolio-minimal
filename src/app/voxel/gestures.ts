/** Gestures the moai reacts to (issue #393): pure, so the thresholds are tested without a canvas. */

export interface Sample {
  readonly t: number;
  readonly v: number;
}

/** A shake: at least 4 changes of direction, each stroke at least 30 px, within 1200 ms of the last sample. */
export function isShake(samples: readonly Sample[]): boolean {
  const last = samples.at(-1);
  if (!last) return false;
  const recent = samples.filter((s) => last.t - s.t <= 1200);
  let extreme = recent[0]?.v ?? 0;
  let dir = 0;
  let turns = 0;
  for (const { v } of recent) {
    if (dir === 0) {
      if (Math.abs(v - extreme) >= 30) dir = Math.sign(v - extreme);
      else continue;
    }
    if ((v - extreme) * dir > 0) extreme = v;
    else if (Math.abs(v - extreme) >= 30) {
      dir = -dir;
      extreme = v;
      turns++;
    }
  }
  return turns >= 4;
}

/** Spun round at least twice in one drag: `turned` is the absolute rotation of the gesture, in radians. */
export function isDizzy(turned: number): boolean {
  return turned >= 4 * Math.PI;
}

/** Six taps within 2000 ms: tickled. `taps` are their times, `now` the last. */
export function isTickle(taps: readonly number[], now: number): boolean {
  return taps.filter((t) => now - t <= 2000).length >= 6;
}

/** A gust of scroll: at least 2400 px within 400 ms of the last sample, `v` is the scroll position. */
export function isSneeze(samples: readonly Sample[]): boolean {
  const last = samples.at(-1);
  if (!last) return false;
  let distance = 0;
  for (let i = 1; i < samples.length; i++) {
    if (last.t - samples[i].t <= 400) distance += Math.abs(samples[i].v - samples[i - 1].v);
  }
  return distance >= 2400;
}
