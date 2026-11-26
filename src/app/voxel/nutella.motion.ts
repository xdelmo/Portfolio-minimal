export type NutellaMood = 'idle' | 'eager' | 'curious' | 'down';

export interface NutellaPose {
  tail: number;
  tailLift: number;
  headTilt: number;
  headPitch: number;
  headYaw: number;
  earLeft: number;
  earRight: number;
  blink: boolean;
  hop: number;
}

export const POSE_FPS = 12;
export const quantize = (t: number): number => Math.floor(t * POSE_FPS) / POSE_FPS;

const MAX_STEP = 0.35;
const BLINK_FRAMES = 2;
const BARK_HOP_S = 0.4;
const BARK_WAG_S = 1.0;

const clamp = (value: number, limit: number): number => Math.max(-limit, Math.min(limit, value));

const approach = (current: number, target: number): number => {
  const delta = target - current;
  return Math.abs(delta) <= MAX_STEP ? target : current + Math.sign(delta) * MAX_STEP;
};

/**
 * Pure state machine for Nutella's stepped 12 fps pose: idle wag bursts, random blinks, head tilts and ear flicks,
 * smooth mood transitions driven by the 404 menu, pointer gaze and a bark hop.
 */
export function createNutellaMotion(random: () => number = Math.random): {
  pose(t: number, mood: NutellaMood, look: { yaw: number; pitch: number }): NutellaPose;
  bark(t: number): void;
} {
  let prevT = 0;
  let tailPhase = 0;
  let tailAmp = 0;
  let tailLift = 0;
  let headTilt = 0;
  let headPitch = 0;
  let headYaw = 0;
  let earLeft = 0;
  let earRight = 0;

  let nextBlink = 2.5 + random() * 2.5;
  let blinkStart = -1;

  let nextTilt = 3 + random() * 3;
  let tiltStart = -1;
  let tiltDir = 1;

  let nextFlick = 4 + random() * 4;
  let flickStart = -1;
  let flickSide: 'left' | 'right' = 'left';
  let flickDir = 1;

  let burstActive = true;
  let burstEnd = 1 + random();

  let barkStart = -1;

  return {
    bark(t: number): void {
      barkStart = t;
    },
    pose(t: number, mood: NutellaMood, look: { yaw: number; pitch: number }): NutellaPose {
      const dt = Math.max(0, t - prevT);
      prevT = t;

      if (t >= nextBlink) {
        blinkStart = t;
        nextBlink = t + 2.5 + random() * 2.5;
      }
      const blink = blinkStart >= 0 && t - blinkStart < BLINK_FRAMES / POSE_FPS - 1e-6;

      if (t >= nextFlick) {
        flickStart = t;
        flickSide = random() < 0.5 ? 'left' : 'right';
        flickDir = random() < 0.5 ? 1 : -1;
        nextFlick = t + 4 + random() * 4;
      }
      const flick = flickStart >= 0 && t - flickStart < 0.25 ? Math.sin(((t - flickStart) / 0.25) * Math.PI) * 0.3 * flickDir : 0;

      if (t >= nextTilt) {
        if (mood === 'idle' || mood === 'eager') {
          tiltStart = t;
          tiltDir = random() < 0.5 ? 1 : -1;
        }
        nextTilt = t + 3 + random() * 3;
      }
      const tiltEvent =
        mood !== 'down' && mood !== 'curious' && tiltStart >= 0 && t - tiltStart < 1.4
          ? Math.sin(((t - tiltStart) / 1.4) * Math.PI) * 0.28 * tiltDir
          : 0;

      if (t >= burstEnd) {
        burstActive = !burstActive;
        burstEnd = t + (burstActive ? 1 + random() : 1.5 + random() * 1.5);
      }

      const bt = barkStart >= 0 ? t - barkStart : -1;
      const barking = bt >= 0 && bt < BARK_HOP_S;
      const barkWag = bt >= 0 && bt < BARK_HOP_S + BARK_WAG_S;
      const hop = barking ? Math.sin((bt / BARK_HOP_S) * Math.PI) * 1.5 : 0;

      let targetAmp = burstActive ? 0.45 : 0.08;
      let freq = 14;
      let targetLift = 0;
      let targetPitch = 0;
      let targetTilt = tiltEvent;
      let targetEar = 0;

      if (mood === 'eager') {
        targetAmp = 0.6;
        freq = 16;
        targetPitch = -0.1;
      } else if (mood === 'curious') {
        targetAmp = 0.25;
        freq = 6;
        targetTilt = 0.3;
        targetEar = 0.15;
      } else if (mood === 'down') {
        targetAmp = 0;
        targetLift = 0.5;
        targetPitch = 0.3;
        targetTilt = 0;
        targetEar = -0.25;
      }

      if (barkWag && mood !== 'down') {
        targetAmp = 0.6;
        freq = 16;
      }
      if (barking) targetPitch -= 0.2;

      tailPhase += dt * freq;
      tailAmp = approach(tailAmp, targetAmp);
      tailLift = approach(tailLift, targetLift);
      headTilt = approach(headTilt, targetTilt);
      headPitch = approach(headPitch, targetPitch + clamp(look.pitch, 0.2));
      headYaw = approach(headYaw, clamp(look.yaw, 0.35));
      earLeft = approach(earLeft, targetEar + (flickSide === 'left' ? flick : 0));
      earRight = approach(earRight, targetEar + (flickSide === 'right' ? flick : 0));

      return {
        tail: tailAmp === 0 ? 0 : Math.sin(tailPhase) * tailAmp,
        tailLift,
        headTilt,
        headPitch,
        headYaw,
        earLeft,
        earRight,
        blink,
        hop,
      };
    },
  };
}
