// Renderer for the animated hero background (components/HeroFlow.tsx): a twisting ribbon of particles drawn
// with WebGL. It runs in a worker when the page can hand the canvas over (lib/hero-flow.worker.ts), or on the page
// otherwise. Every position is computed on the GPU; each frame only updates a few uniforms.

export type HeroFlowState = { width: number; height: number; dpr: number; running: boolean };

const VERTEX = `
attribute vec4 a_path; // x: position along the ribbon, y: position across it, z and w: seeds
attribute vec4 a_look; // x: size, y: opacity, z: tint (negative means copper), w: drift
uniform vec2 u_size;
uniform float u_dpr;
uniform float u_time;
uniform float u_width;
uniform vec2 u_p0;
uniform vec2 u_p1;
uniform vec2 u_p2;
uniform vec2 u_p3;
varying vec3 v_color;
varying float v_alpha;
varying float v_soft;

vec2 curve(float t) {
  float s = 1.0 - t;
  return s * s * s * u_p0 + 3.0 * s * s * t * u_p1 + 3.0 * s * t * t * u_p2 + t * t * t * u_p3;
}

vec2 tangent(float t) {
  float s = 1.0 - t;
  return 3.0 * s * s * (u_p1 - u_p0) + 6.0 * s * t * (u_p2 - u_p1) + 3.0 * t * t * (u_p3 - u_p2);
}

void main() {
  float t = fract(a_path.x + u_time * (0.008 + 0.01 * a_path.z));
  vec2 along = normalize(tangent(t));
  vec2 normal = vec2(-along.y, along.x);

  // A thin sheet that twists along its length: face-on it opens up, edge-on it folds into a bright seam.
  float turn = 10.0 * t - u_time * 0.25;
  float width = u_width * (0.45 + 0.55 * sin(3.1416 * t)) * (1.0 + 0.2 * sin(7.0 * t + u_time * 0.35));
  float across = a_path.y * width;
  float thick = (a_path.w - 0.5) * 0.14 * width;
  float lateral = across * cos(turn) - thick * sin(turn);
  float depth = (across * sin(turn) + thick * cos(turn)) / width;
  vec2 drift = vec2(
    sin(u_time * (0.3 + 0.5 * a_path.z) + a_path.w * 6.2832),
    cos(u_time * (0.25 + 0.4 * a_path.w) + a_path.z * 6.2832)
  ) * a_look.w * width;

  vec2 point = curve(t) + normal * lateral + drift;
  vec2 clip = point / u_size * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

  float near = clamp(0.5 + 0.5 * depth, 0.0, 1.0);
  float ends = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.88, 1.0, t));
  gl_PointSize = a_look.x * (0.6 + 0.9 * near) * u_dpr;
  v_alpha = a_look.y * (0.4 + 0.6 * near) * ends;
  v_soft = step(5.0, a_look.x);
  vec3 tint = a_look.z < 0.0
    ? vec3(0.95, 0.68, 0.5)
    : a_look.z < 0.5
      ? mix(vec3(0.3, 0.72, 0.62), vec3(0.5, 0.92, 0.76), a_look.z * 2.0)
      : mix(vec3(0.5, 0.92, 0.76), vec3(0.88, 1.0, 0.94), a_look.z * 2.0 - 1.0);
  v_color = tint * (0.6 + 0.4 * near);
}
`;

const FRAGMENT = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;
varying float v_soft;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = v_alpha * (1.0 - smoothstep(mix(0.35, 0.0, v_soft), 1.0, r));
  if (a < 0.004) discard;
  gl_FragColor = vec4(v_color * a, a);
}
`;

const MAX_PARTICLES = 24000;
const FLOATS = 8;
const UNIFORMS = ['u_size', 'u_dpr', 'u_time', 'u_width', 'u_p0', 'u_p1', 'u_p2', 'u_p3'] as const;

// Bézier control points as fractions of the hero: an S from the lower left to the upper right when it is wide,
// a rise behind the headline when the layout stacks.
const WIDE: Array<[number, number]> = [[-0.1, 0.9], [0.45, 1.25], [0.35, 0], [1.1, 0.12]];
const TALL: Array<[number, number]> = [[-0.35, 0.26], [0.35, 0.3], [0.55, -0.02], [1.35, 0.03]];

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createParticles() {
  const random = seeded(20260926);
  const data = new Float32Array(MAX_PARTICLES * FLOATS);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const o = i * FLOATS;
    const bokeh = random() < 0.03;
    const loose = random() < 0.12;
    data[o] = random();
    data[o + 1] = random() < 0.15 ? (random() + random() + random()) / 1.5 - 1 : random() * 2 - 1;
    data[o + 2] = random();
    data[o + 3] = random();
    data[o + 4] = bokeh ? 6 + random() * 10 : 1.1 + random() * random() * 2.6;
    data[o + 5] = bokeh ? 0.05 + random() * 0.08 : 0.5 + random() * 0.5;
    data[o + 6] = random() < 0.06 ? -1 : random();
    data[o + 7] = loose ? 0.1 + random() * 0.4 : 0.02 + random() * 0.03;
  }
  return data;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.warn('HeroFlow:', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

export function startHeroFlow(canvas: HTMLCanvasElement | OffscreenCanvas, initial: HeroFlowState, onReady: () => void, onLost: () => void) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' }) as WebGLRenderingContext | null;
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, createParticles(), gl.STATIC_DRAW);
  for (const [name, offset] of [['a_path', 0], ['a_look', 16]] as const) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, FLOATS * 4, offset);
  }
  const at = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // Workers have requestAnimationFrame in current browsers; a timer stands in where they do not.
  const nextFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (callback: FrameRequestCallback) => self.setTimeout(() => callback(performance.now()), 16);
  const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : (id: number) => self.clearTimeout(id);
  let state = initial;
  let frame = 0;
  let last = 0;
  let time = 12;
  let lost = false;

  const draw = () => {
    const { width, height, dpr } = state;
    if (!width || !height) return;
    const wide = width >= height;
    const sway: Array<[number, number]> = [
      [0, 0],
      [0.03 * Math.sin(time * 0.11), 0.04 * Math.sin(time * 0.17 + 1)],
      [0.04 * Math.sin(time * 0.13 + 2), 0.05 * Math.cos(time * 0.09)],
      [0, 0.05 * Math.sin(time * 0.07 + 0.5)],
    ];
    const points = wide ? WIDE : TALL;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(at.u_size, width, height);
    gl.uniform1f(at.u_dpr, dpr);
    gl.uniform1f(at.u_time, time);
    gl.uniform1f(at.u_width, wide ? Math.min(width, height) * 0.2 : width * 0.24);
    for (let i = 0; i < 4; i++) {
      gl.uniform2f(at[UNIFORMS[4 + i]], (points[i][0] + sway[i][0]) * width, (points[i][1] + sway[i][1]) * height);
    }
    gl.drawArrays(gl.POINTS, 0, Math.min(MAX_PARTICLES, Math.round((width * height) / 40)));
  };

  const tick = (now: number) => {
    time += Math.min(now - last, 50) / 1000;
    last = now;
    draw();
    frame = nextFrame(tick);
  };

  // Called with the page's state: size, pixel ratio, and whether it should move (on screen, no reduced motion).
  const update = (next: HeroFlowState) => {
    if (lost) return;
    state = next;
    const width = Math.round(next.width * next.dpr);
    const height = Math.round(next.height * next.dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    draw();
    if (next.running && !frame) {
      last = performance.now();
      frame = nextFrame(tick);
    } else if (!next.running && frame) {
      cancelFrame(frame);
      frame = 0;
    }
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelFrame(frame);
    frame = 0;
    onLost();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const stop = () => {
    cancelFrame(frame);
    frame = 0;
    canvas.removeEventListener('webglcontextlost', onContextLost);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };

  update(initial);
  onReady();
  return { update, stop };
}
