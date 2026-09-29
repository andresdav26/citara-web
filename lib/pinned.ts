import { useEffect, useState } from 'react';

// Utilidades compartidas por las escenas fijas al scroll (components/BusyDay.tsx y components/ProductDemo.tsx).

export const clamp = (x: number) => Math.max(0, Math.min(1, x));

// true mientras la media query coincide. En el HTML estático siempre es false, así que se renderiza la versión sin fijar.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Sigue el avance de una escena fija: 0 cuando la pista llega bajo el header y 1 cuando termina el recorrido.
// Deja el alto del header en --header-h sobre `root`, para el `top` del sticky. Devuelve la función de limpieza.
export function watchPinned(root: HTMLElement, track: HTMLElement, scene: HTMLElement, onProgress: (p: number) => void) {
  let frame = 0;
  let header = 0;
  const measure = () => {
    header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    root.style.setProperty('--header-h', `${header}px`);
  };
  const apply = () => {
    frame = 0;
    const distance = track.offsetHeight - scene.offsetHeight;
    onProgress(distance > 0 ? clamp((header - track.getBoundingClientRect().top) / distance) : 0);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply);
  };
  const resize = () => {
    measure();
    schedule();
  };

  measure();
  apply();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
  };
}
