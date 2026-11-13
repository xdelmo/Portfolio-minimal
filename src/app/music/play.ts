import { watchPause } from '../motion/pause';
import { BPM, SONG, STEPS_PER_BEAT, type NoteEvent } from './song';

const STEP = 60 / BPM / STEPS_PER_BEAT;
// look-ahead scheduling: notes are queued on the audio clock 100 ms ahead, checked every 25 ms
const AHEAD = 0.1;
const TICK_MS = 25;

const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** A Game Boy style pulse wave with the given duty cycle (Fourier series of a rectangle wave). */
function pulse(ctx: AudioContext, duty: number): PeriodicWave {
  const real = new Float32Array(32);
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
  /** cents of vibrato, fading in after the attack */
  vibrato?: number;
  send?: AudioNode;
}

/** Plays SONG in a loop on `ctx`, quietly; returns the function that fades it out and stops it. */
export function play(ctx: AudioContext): () => void {
  // everything goes through a warm low-pass: the raw pulse waves are too bright for a background
  const out = ctx.createGain();
  out.gain.value = 0.22;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 2800;
  warm.connect(out).connect(ctx.destination);

  // a dotted-eighth echo that fades out, for the arpeggio and a touch of the lead
  const echo = ctx.createDelay(1);
  echo.delayTime.value = STEP * 1.5;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  const dull = ctx.createBiquadFilter();
  dull.type = 'lowpass';
  dull.frequency.value = 1500;
  echo.connect(dull).connect(feedback).connect(echo);
  dull.connect(warm);

  const lead = pulse(ctx, 0.5);
  const arp = pulse(ctx, 0.25);
  const noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.05), ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const byStep: NoteEvent[][] = Array.from({ length: SONG.length }, () => []);
  for (const event of SONG.events) byStep[event.step]?.push(event);

  const tone = ({ wave, midi, at, length, level, attack, vibrato, send }: Tone): void => {
    const osc = ctx.createOscillator();
    if (!wave) osc.type = 'triangle';
    else osc.setPeriodicWave(wave);
    osc.frequency.value = hz(midi);
    const gain = ctx.createGain();
    // a soft swell in and a long fade out: no clicks, nothing that pokes out of the page
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.setTargetAtTime(level * 0.5, at + attack, length / 2);
    gain.gain.setTargetAtTime(0, at + length * 0.8, length * 0.08);
    osc.connect(gain).connect(warm);
    if (send) gain.connect(send);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.5;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, at);
      depth.gain.linearRampToValueAtTime(vibrato, at + Math.min(length, 0.8));
      lfo.connect(depth).connect(osc.detune);
      lfo.start(at);
      lfo.stop(at + length);
    }
    osc.start(at);
    osc.stop(at + length);
  };

  const tick = (at: number): void => {
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'highpass';
    band.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
    source.connect(band).connect(gain).connect(warm);
    source.start(at);
    source.stop(at + 0.05);
  };

  const voice = (event: NoteEvent, at: number): void => {
    const length = event.length * STEP;
    switch (event.voice) {
      case 'lead':
        tone({ wave: lead, midi: event.midi, at, length, level: 0.09, attack: 0.06, vibrato: 10, send: echo });
        break;
      case 'arp':
        tone({ wave: arp, midi: event.midi, at, length: STEP * 0.9, level: 0.025, attack: 0.02, send: echo });
        break;
      case 'bass':
        tone({ wave: null, midi: event.midi, at, length, level: 0.16, attack: 0.04 });
        break;
      case 'tick':
        tick(at);
        break;
    }
  };

  let step = 0;
  let next = ctx.currentTime + 0.05;
  const schedule = (): void => {
    // after a long stall (a busy main thread) skip ahead instead of playing the missed notes in a burst
    if (next < ctx.currentTime - STEP) next = ctx.currentTime;
    while (next < ctx.currentTime + AHEAD) {
      for (const event of byStep[step] ?? []) voice(event, next);
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
