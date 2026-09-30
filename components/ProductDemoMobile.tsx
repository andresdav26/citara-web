'use client';

import { useEffect, useRef, useState } from 'react';
import { watchPinned } from '@/lib/pinned';
import type { Scene, StageView } from './ProductDemo';

// Escenario fijo de "Dos lados" en celulares y tablets (docs/rediseno/REDISENO.md §16).
// Usa las mismas escenas y el mismo avance (stageAt) que el escenario de escritorio, que no cambia. Aquí se ve un paso
// a la vez: el teléfono con la conversación y, debajo, una tarjeta compacta con la cita afectada. Al terminar la
// conversación, el pulso baja del teléfono a la tarjeta y aplica el resultado.

const SCENE_SCROLL = 600; // recorrido por escena (700 px en escritorio)
const ANCHOR_OFFSET = 90; // con el scroll-padding de 105 px y el header móvil, el ancla cae dentro de su escena

type Props = {
  scenes: Scene[];
  stageAt: (p: number, reduced: boolean) => { view: StageView; t: number };
  note: string;
};

export default function MobileStage({ scenes, stageAt, note }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const flash = useRef<SVGCircleElement>(null);
  const [view, setView] = useState<StageView>(() => stageAt(0, false).view);

  useEffect(() => {
    if (!track.current || !stage.current) return;

    // Traza el pulso desde el último mensaje hasta la hora de la tarjeta.
    const drawPulse = (t: number) => {
      const box = stage.current?.getBoundingClientRect();
      const from = phone.current?.getBoundingClientRect();
      const bubbles = phone.current?.querySelectorAll('.bubble');
      const last = bubbles?.[bubbles.length - 1]?.getBoundingClientRect();
      const to = card.current?.getBoundingClientRect();
      if (!box || !from || !to) return;
      const s = last
        ? [last.left + last.width / 2 - box.left, last.bottom - box.top]
        : [from.left + from.width / 2 - box.left, from.bottom - 40 - box.top];
      const time = card.current?.querySelector('.tour-mobile-time, .tour-mobile-card-body')?.getBoundingClientRect() ?? to;
      const e = [Math.min(time.left + 28, to.left + to.width / 2) - box.left, to.top - box.top];
      const c1 = [s[0], s[1] + 45];
      const c2 = [e[0], e[1] - 45];
      const point = (u: number) => {
        const v = 1 - u;
        return [0, 1].map((k) => v * v * v * s[k] + 3 * v * v * u * c1[k] + 3 * v * u * u * c2[k] + u * u * u * e[k]);
      };
      let length = 0;
      let previous = point(0);
      for (let k = 1; k <= 30; k++) {
        const next = point(k / 30);
        length += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
        previous = next;
      }
      const [x, y] = point(t);
      path.current?.setAttribute('d', `M${s[0]} ${s[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e[0]} ${e[1]}`);
      path.current?.setAttribute('stroke-dasharray', `${length} ${length}`);
      path.current?.setAttribute('stroke-dashoffset', String(length * (1 - t)));
      for (const circle of [halo.current, dot.current]) {
        circle?.setAttribute('cx', String(x));
        circle?.setAttribute('cy', String(y));
      }
      flash.current?.setAttribute('cx', String(e[0]));
      flash.current?.setAttribute('cy', String(e[1]));
    };

    // Esta versión solo se usa sin movimiento reducido (MOBILE_QUERY en ProductDemo.tsx).
    let last = '';
    return watchPinned(track.current, track.current, stage.current, (p) => {
      const { view: next, t } = stageAt(p, false);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setView(next);
      }
      if (next.pulse || next.justDone) drawPulse(t);
    });
  }, [stageAt]);

  const scene = scenes[view.index];
  const appointment = scene.appointment;
  const ring = view.justDone ? ' is-ring' : '';

  let cardContent: React.ReactNode;
  if (appointment) {
    const free = !view.done && appointment.before === null;
    const cancelled = view.done && appointment.cancelled;
    cardContent = (
      <div ref={card} className={`tour-mobile-card${free ? ' is-free' : ''}${cancelled ? ' is-cancelled' : ''}${ring}`}>
        <div className="tour-mobile-card-head"><span>Agenda · Viernes 25</span><span>Laura · Masajes</span></div>
        <div className="tour-mobile-card-body">
          <span className="tour-mobile-time">{view.done ? appointment.to : appointment.from}</span>
          {free ? (
            <div><strong>Hora libre</strong></div>
          ) : (
            <>
              <div><strong>Mariana · Masaje relajante</strong></div>
              <span className="status">{view.done ? appointment.after : appointment.before}</span>
            </>
          )}
        </div>
      </div>
    );
  } else {
    cardContent = (
      <div ref={card} className={`tour-mobile-card${ring}`}>
        <div className="tour-mobile-card-head"><span>Por atender {view.done && <b>1</b>}</span><span>Panel de tu negocio</span></div>
        <div className="tour-mobile-card-body">
          {view.done ? (
            <div><strong>Mariana · Consulta clínica</strong><small>{scene.handoff}</small></div>
          ) : (
            <div><small>No hay conversaciones por atender.</small></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={track} className="tour-mobile">
      {scenes.map((item, i) => <span key={item.name} id={`paso-${i + 1}`} className="tour-mobile-anchor" style={{ top: i * SCENE_SCROLL + ANCHOR_OFFSET }} />)}
      <div ref={stage} className="tour-mobile-scene">
        <nav className="tour-mobile-steps" aria-label="Pasos del recorrido">
          <p aria-hidden="true">Paso {view.index + 1} de {scenes.length} · <strong>{scene.name}</strong></p>
          <ol>
            {scenes.map((item, i) => (
              <li key={item.name}>
                <a href={`#paso-${i + 1}`} aria-current={view.index === i ? 'step' : undefined} className={i <= view.index ? 'is-reached' : undefined}>
                  <span className="sr-only">{`${i + 1}. ${item.name}`}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <h3 className="tour-mobile-title" aria-hidden="true">{scene.title}</h3>

        <div className="demo-phone" ref={phone} aria-hidden="true">
          <div className="chat-title"><span className="avatar">S</span><div><strong>Spa · WhatsApp</strong><small>Atendido por Citara</small></div><span className="chat-dots">···</span></div>
          <div className="messages">
            <span className="chat-day">Conversación de ejemplo</span>
            {scene.chat.slice(0, view.shown).map((message) => (
              <p key={`${view.index}-${message.text}`} className={`bubble ${message.from === 'client' ? 'user' : 'agent'}`}>{message.text}</p>
            ))}
            {view.typing && <p key={`${view.index}-typing`} className="bubble agent"><span className="typing-dots"><i /><i /><i /></span></p>}
          </div>
          <div className="fake-input">Mensaje <span>♧</span></div>
        </div>

        <div className="tour-mobile-result" aria-hidden="true">
          {cardContent}
          <p className={`tour-mobile-event${view.done ? ' is-shown' : ''}`}><span>✓</span>{scene.event}</p>
        </div>

        <svg className={`tour-pulse${view.pulse ? ' is-on' : ''}${view.justDone ? ' is-flash' : ''}`} aria-hidden="true">
          <path ref={path} className="pulse-line" />
          <circle ref={halo} className="pulse-halo" r="13" />
          <circle ref={dot} className="pulse-dot" r="6" />
          <circle ref={flash} className="pulse-flash" r="16" />
        </svg>
        <p className="tour-mobile-note">{note}</p>
      </div>

      {/* Las escenas completas, para lectores de pantalla: la escena visual solo muestra el paso activo. */}
      <ol className="sr-only">
        {scenes.map((item) => (
          <li key={item.name}>
            <h3>{item.title}</h3>
            <p>{item.intro}</p>
            <ul>{item.chat.map((message) => <li key={message.text}>{message.from === 'client' ? 'Clienta' : 'Citara'}: {message.text}</li>)}</ul>
            <p>Resultado en el panel: {item.event}.</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
