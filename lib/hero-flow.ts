// Fondo animado del hero (components/HeroFlow.tsx): un haz de cuerdas dibujadas en Canvas 2D que nacen abajo a la
// izquierda y se reúnen arriba a la derecha. Corre en un worker cuando la página puede cederle el lienzo
// (lib/hero-flow.worker.ts) o en la página en caso contrario. Especificación: docs/rediseno/REDISENO.md §4.1.

export type HeroFlowState = { width: number; height: number; dpr: number; running: boolean };

type Point = [number, number];
type Pulse = { length: number; duration: number; phase: number; color: string; glow: number };
type Cuerda = {
  start: Point;
  c1: Point;
  c2: Point;
  end: Point;
  amplitude: number;
  angle: number;
  duration: number;
  phase: number;
  color: string;
  width: number;
  opacity: number;
  pulse: Pulse | null;
};

// Los colores salen de la paleta de app/globals.css; el worker no puede leer variables CSS.
const PETROLEO = '#0C7489';
const SALVIA = '#C0D8D1';
const AGUA = '#66A6AD';
const AMBAR = '#F0A135';
const BLANCO = '#FBFEF9';
const COLORES: Array<[string, number]> = [[PETROLEO, 1], [SALVIA, 0.6], [AGUA, 0.5], [AMBAR, 0.35], [BLANCO, 0.35]];

const PULSOS = 10;
const TRAMO_DEL_PULSO = 0.42; // parte del ciclo en la que el destello recorre la cuerda
const FRAME_MS = 1000 / 30;

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function createCuerdas(width: number, height: number): Cuerda[] {
  const random = seeded(20260929);
  const between = (min: number, max: number) => min + (max - min) * random();
  const pick = () => {
    let r = random() * COLORES.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [color, weight] of COLORES) if ((r -= weight) < 0) return color;
    return PETROLEO;
  };
  const wide = width >= 800;
  const count = wide ? 46 : 30;
  const [minAmp, maxAmp] = wide ? [35, 80] : [15, 35];

  // Los destellos van en unas 10 cuerdas elegidas al azar, siempre las mismas para un mismo tamaño.
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const pulsed = new Set(order.slice(0, PULSOS));

  return Array.from({ length: count }, (_, i) => {
    // Inicio fuera del lienzo: el 62 % sobre el borde inferior y el resto sobre el izquierdo.
    const start: Point = random() < 0.62
      ? [between(-0.04, 0.55) * width, height * between(1.01, 1.05)]
      : [-width * between(0.02, 0.045), between(0.8, 1) * height];
    return {
      start,
      c1: [start[0] + between(0.12, 0.3) * width, between(0.7, 0.92) * height],
      c2: [between(0.7, 0.87) * width, between(0.16, 0.4) * height],
      end: [width * between(1.005, 1.025), height * between(-0.02, 0.05)],
      amplitude: between(minAmp, maxAmp),
      angle: random() * Math.PI * 2,
      duration: between(8, 14),
      phase: random(),
      color: pick(),
      width: between(0.8, 2.5),
      opacity: between(0.22, 0.72),
      pulse: pulsed.has(i)
        ? { length: between(70, 90), duration: between(7, 12), phase: random(), color: random() < 0.75 ? AMBAR : BLANCO, glow: between(5, 7) }
        : null,
    };
  });
}

// Puntos de control desplazados en el instante `time`; los extremos quedan fijos.
function shape(c: Cuerda, time: number): [Point, Point] {
  const phase = 2 * Math.PI * (time / c.duration + c.phase);
  const s1 = Math.sin(phase);
  const s2 = Math.sin(phase * 0.5 + 1.3);
  const cos = Math.cos(c.angle) * c.amplitude;
  const sin = Math.sin(c.angle) * c.amplitude;
  return [
    [c.c1[0] + 0.6 * cos * s1, c.c1[1] + sin * s1],
    [c.c2[0] - 0.5 * cos * s2, c.c2[1] - 0.8 * sin * s2],
  ];
}

// Longitud aproximada de la Bézier por muestreo; en el worker no existe getTotalLength.
function length(a: Point, b: Point, c: Point, d: Point) {
  let total = 0;
  let [px, py] = a;
  for (let k = 1; k <= 24; k++) {
    const t = k / 24;
    const s = 1 - t;
    const x = s * s * s * a[0] + 3 * s * s * t * b[0] + 3 * s * t * t * c[0] + t * t * t * d[0];
    const y = s * s * s * a[1] + 3 * s * s * t * b[1] + 3 * s * t * t * c[1] + t * t * t * d[1];
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

export function startHeroFlow(canvas: HTMLCanvasElement | OffscreenCanvas, initial: HeroFlowState, onReady: () => void, onLost: () => void) {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return null;

  // Los workers tienen requestAnimationFrame en los navegadores actuales; donde no, lo reemplaza un temporizador.
  const nextFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (callback: FrameRequestCallback) => self.setTimeout(() => callback(performance.now()), FRAME_MS);
  const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : (id: number) => self.clearTimeout(id);
  let state = initial;
  let cuerdas: Cuerda[] = [];
  let size = '';
  let frame = 0;
  let last = 0;
  let time = 12;
  let lost = false;

  const draw = () => {
    const { width, height, dpr, running } = state;
    if (!width || !height) return;
    const key = `${width}x${height}`;
    if (key !== size) {
      cuerdas = createCuerdas(width, height);
      size = key;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    for (const c of cuerdas) {
      const [c1, c2] = shape(c, time);
      ctx.beginPath();
      ctx.moveTo(c.start[0], c.start[1]);
      ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], c.end[0], c.end[1]);
      ctx.globalAlpha = c.opacity;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.width;
      ctx.stroke();

      // Con movimiento reducido o fuera de pantalla queda un cuadro fijo, sin destellos.
      const pulse = c.pulse;
      if (!pulse || !running) continue;
      const u = (time / pulse.duration + pulse.phase) % 1;
      if (u > TRAMO_DEL_PULSO) continue;
      const total = length(c.start, c1, c2, c.end);
      const from = -pulse.length + (total + pulse.length) * ease(u / TRAMO_DEL_PULSO);
      ctx.setLineDash([pulse.length, total + pulse.length]);
      ctx.lineDashOffset = -from;
      ctx.strokeStyle = pulse.color;
      for (const [extra, alpha] of [[pulse.glow, 0.16], [1.6, 0.95]]) {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = c.width + extra;
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  };

  // Limita el dibujo a unos 30 cuadros por segundo.
  const tick = (now: number) => {
    frame = nextFrame(tick);
    if (now - last < FRAME_MS - 2) return;
    time += Math.min(now - last, 100) / 1000;
    last = now;
    draw();
  };

  // Recibe el estado de la página: tamaño, densidad de píxeles y si debe moverse (en pantalla y sin movimiento reducido).
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
  const onContextRestored = () => {
    lost = false;
    onReady();
    update(state);
  };
  canvas.addEventListener('contextlost', onContextLost);
  canvas.addEventListener('contextrestored', onContextRestored);

  const stop = () => {
    cancelFrame(frame);
    frame = 0;
    canvas.removeEventListener('contextlost', onContextLost);
    canvas.removeEventListener('contextrestored', onContextRestored);
  };

  update(initial);
  onReady();
  return { update, stop };
}
