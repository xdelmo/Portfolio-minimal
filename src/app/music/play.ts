import { watchPause } from '../motion/pause';
import { bell, BELLS, BPM, SONG, STEPS_PER_BEAT, type NoteEvent } from './song';

const STEP = 60 / BPM / STEPS_PER_BEAT;
// look-ahead scheduling: notes are queued on the audio clock 100 ms ahead, checked every 25 ms
const AHEAD = 0.1;
const TICK_MS = 25;

const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** A Game Boy style pulse wave with the given duty cycle (Fourier series of a rectangle wave); fewer harmonics, softer. */
function pulse(ctx: AudioContext, duty: number, harmonics = 32): PeriodicWave {
  const real = new Float32Array(harmonics);
  for (let k = 1; k < real.length; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, new Float32Array(real.length));
}

interface Tone {
  wave: PeriodicWave | null;
  midi: number;
  at: number;
  length: number;
  level: number;
  attack: number;
  /** when the note starts fading out, as a share of its length */
  release: number;
  /** a second oscillator this many cents sharp, for a slow, airy shimmer */
  chorus?: number;
  send?: AudioNode;
}

/** Plays the ambient loop on `ctx`, quietly; returns the function that fades it out and stops it. */
export function play(ctx: AudioContext): () => void {
  // everything goes through a warm low-pass: the raw pulse waves are too bright for a background
  const out = ctx.createGain();
  out.gain.value = 0.22;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 2400;
  warm.connect(out).connect(ctx.destination);

  // a long echo that keeps fading: the sky the bells float in
  const echo = ctx.createDelay(3);
  echo.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.55;
  const dull = ctx.createBiquadFilter();
  dull.type = 'lowpass';
  dull.frequency.value = 1800;
  echo.connect(dull).connect(feedback).connect(echo);
  dull.connect(warm);

  // the bells keep only their first harmonics: a round, soft 8-bit chime
  const chime = pulse(ctx, 0.25, 8);

  const byStep: NoteEvent[][] = Array.from({ length: SONG.length }, () => []);
  for (const event of SONG.events) byStep[event.step]?.push(event);

  const tone = ({ wave, midi, at, length, level, attack, release, chorus, send }: Tone): void => {
    const gain = ctx.createGain();
    for (const detune of chorus ? [0, chorus] : [0]) {
      const osc = ctx.createOscillator();
      if (!wave) osc.type = 'triangle';
      else osc.setPeriodicWave(wave);
      osc.frequency.value = hz(midi);
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + length);
    }
    // a soft swell in and a long fade out: no clicks, nothing that pokes out of the page
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.setTargetAtTime(0, at + length * release, length * 0.12);
    gain.connect(warm);
    if (send) gain.connect(send);
  };

  const voice = (event: NoteEvent, at: number): void => {
    const length = event.length * STEP;
    if (event.voice === 'bass') {
      tone({ wave: null, midi: event.midi, at, length: length + 1, level: 0.07, attack: 1.5, release: 0.7 });
    } else {
      // swells in over seconds and overlaps the next chord: one cloud slowly turning into the next
      tone({ wave: null, midi: event.midi, at, length: length + 2, level: 0.035, attack: 3, release: 0.7, chorus: 7, send: echo });
    }
  };

  let step = 0;
  let last = 3;
  let next = ctx.currentTime + 0.05;
  const schedule = (): void => {
    // after a long stall (a busy main thread) skip ahead instead of playing the missed notes in a burst
    if (next < ctx.currentTime - STEP) next = ctx.currentTime;
    while (next < ctx.currentTime + AHEAD) {
      for (const event of byStep[step] ?? []) voice(event, next);
      const index = bell(last, Math.random);
      if (index !== undefined) {
        last = index;
        const midi = BELLS[index] ?? 74;
        tone({ wave: chime, midi, at: next, length: 2.5, level: 0.018, attack: 0.02, release: 0.1, send: echo });
      }
      step = (step + 1) % SONG.length;
      next += STEP;
    }
  };
  schedule();
  const timer = setInterval(schedule, TICK_MS);

  // a background tab and the site's pause button both hush it; the audio clock stops too, so it resumes in place.
  // The pause state at the press itself is ignored: pressing play is the visitor asking for music.
  let paused = false;
  let first = true;
  const sync = (): void => {
    void (document.hidden || paused ? ctx.suspend() : ctx.resume());
  };
  const unwatch = watchPause((value) => {
    if (first) {
      first = false;
      return;
    }
    paused = value;
    sync();
  });
  document.addEventListener('visibilitychange', sync);

  return () => {
    clearInterval(timer);
    unwatch();
    document.removeEventListener('visibilitychange', sync);
    void ctx.resume();
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => {
      out.disconnect();
      echo.disconnect();
    }, 400);
  };
}
