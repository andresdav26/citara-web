'use client';

import { useEffect, useRef } from 'react';
import type { HeroFlowState } from '@/lib/hero-flow';

// Fondo animado del hero; el dibujo de las cuerdas vive en lib/hero-flow.ts. Se dibuja en un worker cuando el
// navegador puede cederle el lienzo, así el dibujo no bloquea la página; si no, se dibuja en el hilo principal.
// Sin Canvas 2D queda el color plano del hero; con movimiento reducido se dibuja un solo cuadro fijo.

export default function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // A fresh canvas per mount: control of a canvas can be handed to a worker only once.
    const canvas = document.createElement('canvas');
    host.append(canvas);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onScreen = true;
    let disposed = false;
    let send: (state: HeroFlowState) => void = () => {};
    let stop = () => {};

    const state = (): HeroFlowState => ({
      width: host.clientWidth,
      height: host.clientHeight,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      running: onScreen && !reduced.matches,
    });
    const update = () => send(state());
    const ready = () => host.classList.add('is-ready');
    const lost = () => host.classList.remove('is-ready');

    const setup = async () => {
      if (typeof canvas.transferControlToOffscreen === 'function') {
        const worker = new Worker(new URL('../lib/hero-flow.worker.ts', import.meta.url));
        const offscreen = canvas.transferControlToOffscreen();
        worker.onmessage = (event: MessageEvent<'ready' | 'lost'>) => (event.data === 'ready' ? ready() : lost());
        worker.postMessage({ canvas: offscreen, state: state() }, [offscreen]);
        send = (next) => worker.postMessage({ state: next });
        stop = () => worker.terminate();
        return;
      }
      const { startHeroFlow } = await import('@/lib/hero-flow');
      if (disposed) return;
      const flow = startHeroFlow(canvas, state(), ready, lost);
      if (!flow) return;
      send = flow.update;
      stop = flow.stop;
    };

    // Safari has no requestIdleCallback.
    let cancelIdle: () => void;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => void setup(), { timeout: 1200 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => void setup(), 200);
      cancelIdle = () => window.clearTimeout(id);
    }

    const sizes = new ResizeObserver(update);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    sizes.observe(host);
    visibility.observe(host);
    reduced.addEventListener('change', update);

    return () => {
      disposed = true;
      cancelIdle();
      sizes.disconnect();
      visibility.disconnect();
      reduced.removeEventListener('change', update);
      stop();
      canvas.remove();
      host.classList.remove('is-ready');
    };
  }, []);

  return <div ref={ref} className="hero-flow" aria-hidden="true" />;
}
