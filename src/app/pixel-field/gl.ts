import { CELL, COMPOSE_MS, DOT, FieldLayout, MAX_RIPPLES, POINTER_RADIUS, RIPPLE_MS, RIPPLE_SPEED, RIPPLE_WIDTH, easeOutCubic } from './field';
import { FrameState, PUSH, Palette, REST_ALPHA, cellsOf } from './render';

/**
 * The field in WebGL (issue #207): every dot is a point of one draw call, and the maths of `drawFrame` runs on the GPU.
 * In canvas 2D the field was some 9000 fillRects a frame, and the page dropped frames while it scrolled.
 */
const VERTEX = `
attribute vec2 a_pos;
attribute vec4 a_cell; // vignette, twinkle speed, twinkle phase, lit colour (0-1)
uniform vec2 u_size;
uniform float u_dpr;
uniform float u_t;
uniform float u_wave;
uniform vec3 u_pointer; // x, y, 1 when it counts
uniform vec3 u_ripples[${String(MAX_RIPPLES)}]; // x, y, start
uniform int u_count;
uniform vec4 u_dot;
uniform vec4 u_lit[5];
varying vec4 v_color;

float falloff(float d) {
  return d >= ${POINTER_RADIUS.toFixed(1)} ? 0.0 : pow(1.0 - d / ${POINTER_RADIUS.toFixed(1)}, 2.0);
}
float ripple(float d, float age) {
  if (age < 0.0 || age >= ${RIPPLE_MS.toFixed(1)}) return 0.0;
  return max(0.0, 1.0 - abs(d - age * ${String(RIPPLE_SPEED)}) / ${RIPPLE_WIDTH.toFixed(1)}) * (1.0 - age / ${RIPPLE_MS.toFixed(1)});
}

void main() {
  vec2 p = a_pos;
  float e = 0.0;
  if (u_pointer.z > 0.5) {
    vec2 away = p - u_pointer.xy;
    float d = length(away);
    float k = falloff(d);
    if (k > 0.0 && d > 0.0) p += away / d * k * ${PUSH.toFixed(1)};
    e = k;
  }
  for (int i = 0; i < ${String(MAX_RIPPLES)}; i++) {
    if (i >= u_count) break;
    e = max(e, ripple(length(p - u_ripples[i].xy), u_t - u_ripples[i].z));
  }
  if (u_wave > 0.0) e = max(e, 0.6 * pow((sin(u_t * a_cell.y + a_cell.z) + 1.0) / 2.0, 10.0) * u_wave);

  vec4 c = u_dot;
  if (e > 0.05) {
    int lit = int(floor(a_cell.w * 5.0));
    for (int i = 0; i < 5; i++) if (i == lit) c = u_lit[i];
  }
  float alpha = (${REST_ALPHA.toFixed(2)} + ${(1 - REST_ALPHA).toFixed(2)} * e) * a_cell.x * c.a;
  v_color = vec4(c.rgb * alpha, alpha);
  gl_PointSize = ${DOT.toFixed(1)} * (0.25 + 0.75 * e) * u_dpr;
  gl_Position = vec4(p / u_size * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`;

export type Paint = (l: FieldLayout, p: Palette, f: FrameState) => void;

/** Any CSS colour as 0-1 RGBA, as a canvas paints it. */
function rgba(probe: CanvasRenderingContext2D, color: string): number[] {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  return [...probe.getImageData(0, 0, 1, 1).data].map((v) => v / 255);
}

/** A painter for the field on `canvas`, or null where WebGL is missing (the 2D one takes over). */
export function glPaint(canvas: HTMLCanvasElement, dpr: () => number): Paint | null {
  // preserveDrawingBuffer: the picture stays readable between frames, like a 2D canvas's
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: true });
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!gl || !probe) return null;

  const shader = (type: number, source: string): WebGLShader => {
    const s = gl.createShader(type);
    if (!s) throw new Error('pixel field: no shader');
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`pixel field: ${gl.getShaderInfoLog(s) ?? 'shader'}`);
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`pixel field: ${gl.getProgramInfoLog(program) ?? 'program'}`);
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    size: at('u_size'),
    dpr: at('u_dpr'),
    t: at('u_t'),
    wave: at('u_wave'),
    pointer: at('u_pointer'),
    ripples: at('u_ripples'),
    count: at('u_count'),
    dot: at('u_dot'),
    lit: at('u_lit'),
  };
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const pos = gl.getAttribLocation(program, 'a_pos');
  const cell = gl.getAttribLocation(program, 'a_cell');
  gl.enableVertexAttribArray(pos);
  gl.enableVertexAttribArray(cell);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 24, 0);
  gl.vertexAttribPointer(cell, 4, gl.FLOAT, false, 24, 8);

  let layout: FieldLayout | null = null;
  let palette: Palette | null = null;
  const ripples = new Float32Array(MAX_RIPPLES * 3);

  return (l, p, f) => {
    if (l !== layout) {
      // what each dot keeps until the next resize: its place and the values `drawFrame` caches per cell
      const cells = cellsOf(l);
      const data = new Float32Array(l.cols * l.rows * 6);
      for (let i = 0; i < l.cols * l.rows; i++) {
        data.set([l.x0 + (i % l.cols) * CELL + CELL / 2, l.y0 + Math.floor(i / l.cols) * CELL + CELL / 2, cells.vignette[i], cells.speed[i], cells.phase[i], cells.lit[i]], i * 6);
      }
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      layout = l;
    }
    if (p !== palette) {
      gl.uniform4fv(u.dot, rgba(probe, p.dot));
      gl.uniform4fv(u.lit, p.lit.flatMap((c) => rgba(probe, c)));
      palette = p;
    }
    const t = f.animate ? f.t : COMPOSE_MS * 2;
    const scale = dpr();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.size, canvas.width / scale, canvas.height / scale);
    gl.uniform1f(u.dpr, scale);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.wave, f.animate ? easeOutCubic((t - COMPOSE_MS) / 800) : 0);
    gl.uniform3f(u.pointer, f.pointer?.x ?? 0, f.pointer?.y ?? 0, f.animate && f.pointer ? 1 : 0);
    f.ripples.forEach((r, i) => {
      ripples.set([r.x, r.y, r.start], i * 3);
    });
    gl.uniform3fv(u.ripples, ripples);
    gl.uniform1i(u.count, f.ripples.length);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, l.cols * l.rows);
  };
}
