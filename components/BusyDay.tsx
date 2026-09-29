'use client';

import { useEffect, useRef, useState } from 'react';

// Sección "El día no tiene más horas" (docs/rediseno/REDISENO.md §5.1, prototipo Problemas.dc.html).
// La escena queda fija mientras se recorre una pista de scroll; el avance `p` (0 a 1) mueve el reloj de 8:00 a. m.
// a 10:00 p. m., activa las tres tarjetas y, al cerrar el negocio, pasa la escena a modo noche.
// El HTML estático, la falta de JS, el movimiento reducido y las pantallas bajas muestran la versión sin fijar:
// las tres tarjetas activas, colores de día y cada viñeta en su estado final.

const TRIGGERS = [0.1556, 0.5, 0.8444];
const LEAD = 0.06; // cada tarjeta se activa un poco antes de su hora
const CLOSE = 0.786; // 7:00 p. m.
const NIGHT = 0.06; // tramo en el que el fondo pasa a pizarra
const STILL_P = 0.5; // la versión sin fijar muestra las 3:00 p. m.
// Se fija con altura suficiente: 700 px en escritorio y 600 px en móvil (el título queda fuera de la escena).
const PIN_QUERY = '(prefers-reduced-motion: no-preference) and (min-width: 900px) and (min-height: 700px), (prefers-reduced-motion: no-preference) and (max-width: 899.98px) and (min-height: 600px)';

const HOURS = [8, 10, 12, 14, 16, 18, 20, 22];
const MINOR = new Set([10, 14, 18, 20]); // marcas sin etiqueta en móvil

const UNREAD = [
  ['Laura', '¿Tienen cita hoy en la tarde?'],
  ['Andrea', '¿Puedo cambiar mi hora?'],
  ['Paula', '¿Cuánto dura la sesión?'],
  ['Sofía', '¿Atienden el sábado?'],
];
const LATE: Array<[string, number, string]> = [
  ['8:14 p. m.', 20 + 14 / 60, '¿Mañana tienen espacio?'],
  ['9:02 p. m.', 21 + 2 / 60, 'Quiero reagendar mi cita.'],
  ['9:47 p. m.', 21 + 47 / 60, '¿Hacen depilación de axilas?'],
];

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const at = (hours: number) => `${((hours - 8) / 14) * 100}%`;

// Formato colombiano: "3:25 p. m." y "12 m." al mediodía.
function clock(p: number) {
  const minutes = Math.min(22 * 60, Math.floor((8 + 14 * p) * 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? 'a. m.' : h === 12 && m === 0 ? 'm.' : 'p. m.';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

function hourLabel(h: number) {
  return h === 12 ? '12 m.' : `${((h + 11) % 12) + 1} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

type View = {
  active: boolean[];
  unreadRows: number;
  unread: number;
  missed: boolean;
  closed: boolean;
  lateRows: number;
  night: boolean;
  hint: boolean;
};

const STILL: View = { active: [true, true, true], unreadRows: 4, unread: 9, missed: true, closed: true, lateRows: 3, night: false, hint: false };

function viewAt(p: number): View {
  const unreadRows = UNREAD.filter((_, j) => p >= TRIGGERS[0] - 0.05 + j * 0.03).length;
  return {
    active: TRIGGERS.map((t) => p >= t - LEAD),
    unreadRows,
    unread: Math.min(12, unreadRows * 2 + Math.max(0, Math.floor((p - TRIGGERS[0]) * 18))),
    missed: p >= TRIGGERS[1] + 0.02,
    closed: p >= CLOSE,
    lateRows: LATE.filter(([, hours]) => p >= (hours - 8) / 14 - 0.004).length,
    night: clamp((p - CLOSE) / NIGHT) >= 0.5,
    hint: p < 0.02,
  };
}

function Check() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Title({ className }: { className: string }) {
  return (
    <div className={`busy-day-title ${className}`}>
      <p className="eyebrow">EL DÍA NO TIENE MÁS HORAS</p>
      <h2>Atender bien no debería<br />ser <em>estar siempre al teléfono.</em></h2>
    </div>
  );
}

const INTRO = 'Entre una cita y la siguiente, hay mensajes, cambios y confirmaciones. Y alguien de tu equipo tiene que resolverlos.';

export default function BusyDay() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLParagraphElement>(null);
  const [pinned, setPinned] = useState(false);
  const [view, setView] = useState<View>(STILL);

  // Decide si la escena se fija; cambia con el tamaño de la ventana y la preferencia de movimiento.
  useEffect(() => {
    const query = window.matchMedia(PIN_QUERY);
    const decide = () => setPinned(query.matches);
    decide();
    query.addEventListener('change', decide);
    return () => query.removeEventListener('change', decide);
  }, []);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    if (!pinned) {
      section.style.setProperty('--p', String(STILL_P));
      section.style.setProperty('--night', '0');
      if (time.current) time.current.textContent = clock(STILL_P);
      setView(STILL);
      return;
    }

    let frame = 0;
    let header = 0;
    let last = '';
    const measure = () => {
      header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
      section.style.setProperty('--header-h', `${header}px`);
    };
    const apply = () => {
      frame = 0;
      if (!track.current || !scene.current) return;
      const distance = track.current.offsetHeight - scene.current.offsetHeight;
      const p = distance > 0 ? clamp((header - track.current.getBoundingClientRect().top) / distance) : 0;
      section.style.setProperty('--p', p.toFixed(4));
      section.style.setProperty('--night', clamp((p - CLOSE) / NIGHT).toFixed(3));
      if (time.current) time.current.textContent = clock(p);
      // React solo vuelve a pintar cuando cambia algún estado discreto, no en cada cuadro.
      const next = viewAt(p);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setView(next);
      }
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
  }, [pinned]);

  // En el mazo de móvil, la última tarjeta activada queda arriba y las anteriores asoman detrás.
  const top = Math.max(0, view.active.lastIndexOf(true));
  const cardClass = (i: number) => {
    const classes = ['busy-day-card'];
    if (view.active[i]) classes.push('is-active');
    classes.push(i < top ? 'is-behind' : i > top ? 'is-ahead' : 'is-top');
    return classes.join(' ');
  };
  const depth = (i: number) => ({ '--depth': top - i } as React.CSSProperties);

  return (
    <section ref={root} id="el-problema" className={`busy-day${pinned ? ' is-pinned' : ''}${view.night ? ' is-night' : ''}`}>
      <div className="wrap busy-day-flow">
        <Title className="for-flow" />
        <p className="busy-day-intro">{INTRO}</p>
      </div>
      <div ref={track} className="busy-day-track">
        <div ref={scene} className="busy-day-scene">
          <div className="wrap busy-day-inner">
            <div className="busy-day-head">
              <Title className="for-scene" />
              <div className="busy-day-clock">
                <p className="busy-day-kicker">HOY, EN TU NEGOCIO</p>
                <p ref={time} className="busy-day-time" aria-hidden="true">{clock(STILL_P)}</p>
                <p className="busy-day-intro for-scene">{INTRO}</p>
              </div>
            </div>

            <div className="busy-day-timeline" aria-hidden="true">
              <span className="busy-day-fill" />
              {HOURS.map((h, i) => (
                <span key={h} className={`busy-day-tick${MINOR.has(h) ? ' is-minor' : ''}${i === 0 ? ' is-first' : i === HOURS.length - 1 ? ' is-last' : ''}`} style={{ left: at(h) }}><span>{hourLabel(h)}</span></span>
              ))}
              <span className="busy-day-close" style={{ left: at(19) }}><span>Cierre · 7:00 p. m.</span></span>
              {TRIGGERS.map((t, i) => <span key={t} className={`busy-day-pin${view.active[i] ? ' is-active' : ''}`} style={{ left: `${t * 100}%` }} />)}
              <span className="busy-day-marker" />
            </div>

            <div className="busy-day-cards">
              <article className={cardClass(0)} style={depth(0)}>
                <div className="busy-day-card-top"><span className="busy-day-chip">10:10 a. m.</span><span className="busy-day-num">01</span></div>
                <h3>Tu recepción, dividida en dos.</h3>
                <p>Atender a quien llega mientras se responde WhatsApp interrumpe al equipo una y otra vez.</p>
                <div className="busy-day-vignette" aria-hidden="true">
                  <div className="busy-day-vignette-head"><strong>WhatsApp del negocio</strong><span className="busy-day-badge">{view.unread} sin leer</span></div>
                  {UNREAD.map(([name, text], j) => (
                    <div key={name} className={`busy-day-message${j < view.unreadRows ? ' is-shown' : ''}`}><span className="busy-day-dot" /><strong>{name}</strong><span>{text}</span></div>
                  ))}
                </div>
                <div className="busy-day-tag"><Check />Tiempo para atender en persona</div>
              </article>

              <article className={cardClass(1)} style={depth(1)}>
                <div className="busy-day-card-top"><span className="busy-day-chip">3:00 p. m.</span><span className="busy-day-num">02</span></div>
                <h3>Una silla vacía. Una hora perdida.</h3>
                <p>Cuando una persona no llega, queda un espacio vacío que el negocio pudo haber aprovechado.</p>
                <div className="busy-day-vignette" aria-hidden="true">
                  <div className="busy-day-slot"><strong>2:00 p. m.</strong><span>Carolina · Fisioterapia</span></div>
                  <div className={`busy-day-swap${view.missed ? ' is-missed' : ''}`}>
                    <div className="busy-day-slot"><strong>3:00 p. m.</strong><span>Daniela · Láser</span></div>
                    <div className="busy-day-slot is-empty"><strong>3:00 p. m.</strong><span>Nadie llegó · Hora sin ocupar</span></div>
                  </div>
                  <div className="busy-day-slot"><strong>4:00 p. m.</strong><span>Juliana · Masaje</span></div>
                </div>
                <div className="busy-day-tag"><Check />Más claridad sobre cada cita</div>
              </article>

              <article className={cardClass(2)} style={depth(2)}>
                <div className="busy-day-card-top"><span className="busy-day-chip">Fuera de horario</span><span className="busy-day-num">03</span></div>
                <h3>Tu negocio cierra. Los mensajes no.</h3>
                <p>Las solicitudes siguen llegando fuera de horario, cuando nadie está pendiente del teléfono.</p>
                <div className="busy-day-vignette" aria-hidden="true">
                  <div className="busy-day-vignette-head"><strong>WhatsApp del negocio</strong><span className={`busy-day-status${view.closed ? ' is-closed' : ''}`}>{view.closed ? 'Cerrado' : 'Abierto hasta 7:00 p. m.'}</span></div>
                  {LATE.map(([hour, , text], j) => (
                    <div key={hour} className={`busy-day-late${j < view.lateRows ? ' is-shown' : ''}`}><span>{hour}</span><span>{text}</span></div>
                  ))}
                </div>
                <div className="busy-day-tag"><Check />La conversación puede continuar</div>
              </article>
            </div>

            <p className={`busy-day-hint${pinned && view.hint ? ' is-shown' : ''}`} aria-hidden="true">
              Desplázate para avanzar el día
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </p>
            <p className="busy-day-note">Vista ilustrativa · datos de ejemplo</p>
          </div>
        </div>
      </div>
    </section>
  );
}
