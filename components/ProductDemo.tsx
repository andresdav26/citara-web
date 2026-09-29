'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import VideoDialog from './VideoDialog';
import { clamp, useMediaQuery, watchPinned } from '@/lib/pinned';

// Recorrido "Dos lados de una misma cita" (docs/rediseno/REDISENO.md §5.2, prototipo DosLados.dc.html).
// En escritorio es un escenario fijo: el scroll avanza por las cinco escenas, los mensajes aparecen según el avance
// y un pulso lleva el resultado del teléfono a la agenda. En pantallas más chicas, y en el HTML estático, cada paso
// reproduce su conversación al entrar en pantalla y luego el panel muestra el resultado.

type Message = { from: 'client' | 'agent'; text: string };
type Scene = {
  name: string;
  title: string;
  intro: string;
  chat: Message[];
  event: string;
  appointment?: { from: string; to: string; before: string | null; after: string; cancelled?: boolean };
  handoff?: string;
};

const scenes: Scene[] = [
  {
    name: 'Agenda',
    title: 'Una conversación. Una cita en la agenda.',
    intro: 'Tu clienta elige un horario por WhatsApp. Citara registra la cita y tu equipo la ve en el panel.',
    chat: [
      { from: 'client', text: 'Hola, ¿tienen espacio para un masaje el viernes?' },
      { from: 'agent', text: '¡Hola! Para el viernes tenemos 10:00 a. m. o 3:00 p. m. ¿Cuál te sirve?' },
      { from: 'client', text: 'A las 10 me queda perfecto. Sí, confirmo.' },
      { from: 'agent', text: 'Tu masaje quedó agendado para el viernes a las 10:00 a. m.' },
    ],
    event: 'Cita creada desde WhatsApp',
    appointment: { from: '10:00', to: '10:00', before: null, after: 'Agendada' },
  },
  {
    name: 'Confirma',
    title: 'Menos incertidumbre antes de cada cita.',
    intro: 'La confirmación queda a la vista. Tu equipo sabe con quién cuenta y puede organizar su día.',
    chat: [
      { from: 'client', text: 'Hola, quiero confirmar mi cita del viernes.' },
      { from: 'agent', text: 'Tienes un masaje el viernes a las 10:00 a. m. ¿Confirmas tu asistencia?' },
      { from: 'client', text: 'Sí, allí estaré.' },
      { from: 'agent', text: '¡Perfecto! Tu asistencia quedó confirmada.' },
    ],
    event: 'Asistencia confirmada',
    appointment: { from: '10:00', to: '10:00', before: 'Agendada', after: 'Confirmada' },
  },
  {
    name: 'Reprograma',
    title: 'Los planes cambian. La agenda también.',
    intro: 'Citara consulta disponibilidad y actualiza la cita cuando la clienta confirma el nuevo horario.',
    chat: [
      { from: 'client', text: '¿Puedo mover mi cita para la tarde?' },
      { from: 'agent', text: 'El viernes está disponible a las 3:00 p. m. ¿Quieres cambiarla a esa hora?' },
      { from: 'client', text: 'Sí, por favor.' },
      { from: 'agent', text: 'Listo. Tu masaje quedó para el viernes a las 3:00 p. m.' },
    ],
    event: 'Horario actualizado en la agenda',
    appointment: { from: '10:00', to: '15:00', before: 'Agendada', after: 'Reprogramada' },
  },
  {
    name: 'Cancela',
    title: 'Un cambio claro para todo el equipo.',
    intro: 'Si la clienta confirma que desea cancelar, Citara actualiza el estado de su cita.',
    chat: [
      { from: 'client', text: 'Necesito cancelar mi cita.' },
      { from: 'agent', text: '¿Confirmas que quieres cancelar tu masaje del viernes a las 10:00 a. m.?' },
      { from: 'client', text: 'Sí, cancélala por favor.' },
      { from: 'agent', text: 'Tu cita fue cancelada. Cuando quieras, buscamos otro horario.' },
    ],
    event: 'Cita cancelada',
    appointment: { from: '10:00', to: '10:00', before: 'Agendada', after: 'Cancelada', cancelled: true },
  },
  {
    name: 'Pasa al equipo',
    title: 'Cuando hace falta una persona, entra tu equipo.',
    intro: 'Las preguntas clínicas y las solicitudes fuera de alcance pasan al equipo del negocio.',
    chat: [
      { from: 'client', text: 'Tengo una lesión. ¿Ese masaje es adecuado para mí?' },
      { from: 'agent', text: 'Esa pregunta debe revisarla el equipo del negocio. Les paso tu conversación para que te orienten.' },
    ],
    event: 'Conversación transferida al equipo',
    handoff: '“Tengo una lesión. ¿Ese masaje es adecuado para mí?”',
  },
];

const HOURS = ['09:00', '10:00', '11:00', '15:00'];
const TYPING_MS = 1100;
const PAUSE_MS = 700;

export function MiniProduct(){return <div className="hero-product" aria-label="Vista ilustrativa de una cita agendada; datos ficticios"><div className="mini-panel"><div className="mini-top"><img src="/brand/citara-claro.svg" alt="" width="84" height="23"/><span>Tu agenda</span><span className="avatar">LM</span></div><div className="mini-heading"><strong>Viernes, 25 de septiembre</strong><span>Día</span></div><div className="calendar-head"><span/><span>Laura</span><span>Camila</span></div>{['09:00','10:00','11:00','12:00'].map((t,i)=><div key={t} className="calendar-row"><span>{t}</span><div>{i===1&&<div className="appointment"><small>10:00 – 11:00</small><strong>Mariana · Masaje</strong><span>Confirmada ✓</span></div>}</div><div>{i===0&&<div className="appointment muted"><small>09:00 – 10:00</small><strong>Valentina</strong><span>Masaje relajante</span></div>}</div></div>)}</div><div className="mini-chat"><div className="chat-title"><span className="avatar">S</span><div><strong>Spa · WhatsApp</strong><small>Atendido por Citara</small></div></div><p className="bubble user">Hola, ¿tienen cita el viernes?</p><p className="bubble agent">¡Sí! Tenemos a las 10:00 a. m.<br/>¿Te agendo?</p><p className="bubble user">Sí, perfecto ✨</p><p className="bubble agent last">Listo, tu cita quedó agendada.<span>10:00 a. m. · Viernes</span></p></div><div className="sync-note"><span>✓</span><div><strong>Del chat a tu agenda.</strong><small>Sin volver a escribirlo.</small></div></div><VideoDialog/><span className="illustrative">Vista ilustrativa · datos de ejemplo</span></div>}

// Calls `callback` the first time `node` intersects, then stops observing.
function once(node: Element | null, callback: () => void, options: IntersectionObserverInit) {
  if (!node) return () => {};
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    callback();
  }, options);
  observer.observe(node);
  return () => observer.disconnect();
}

function Step({ scene, index }: { scene: Scene; index: number }) {
  const root = useRef<HTMLElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const views = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [started, setStarted] = useState(false);
  const [panelSeen, setPanelSeen] = useState(false);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  // On narrow screens the panel sits below the phone: it updates once its agenda is on screen, so the change is seen.
  const done = chatDone && panelSeen;
  const number = String(index + 1).padStart(2, '0');
  const appointment = scene.appointment;

  // The phone and panel are only built when the step is a screen away, to keep the first load light.
  useEffect(() => once(root.current, () => setNear(true), { rootMargin: '100% 0px' }), []);

  useEffect(() => {
    if (!near) return;
    const stops = [
      once(phone.current, () => setStarted(true), { threshold: 0.6 }),
      once(views.current, () => setPanelSeen(true), { threshold: 0.85 }),
    ];
    return () => stops.forEach((stop) => stop());
  }, [near]);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(scene.chat.length);
      setChatDone(true);
      return;
    }
    const timers: number[] = [];
    let at = 300;
    scene.chat.forEach((message, i) => {
      if (message.from === 'agent') {
        timers.push(window.setTimeout(() => setTyping(true), at));
        at += TYPING_MS;
      }
      timers.push(window.setTimeout(() => {
        setTyping(false);
        setShown(i + 1);
      }, at));
      at += PAUSE_MS;
    });
    timers.push(window.setTimeout(() => setChatDone(true), at));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [started, scene]);

  const slot = (hour: string) => {
    if (!appointment || (hour !== appointment.from && hour !== appointment.to)) return null;
    const moves = appointment.from !== appointment.to;
    const visible = moves ? (hour === appointment.from ? !done : done) : done || appointment.before !== null;
    const label = moves ? (hour === appointment.from ? appointment.before : appointment.after) : done ? appointment.after : appointment.before;
    const classes = ['appointment', 'tour-appt'];
    if (!visible) classes.push('is-hidden');
    if (done) classes.push('is-done');
    if (done && appointment.cancelled) classes.push('cancelled');
    return (
      <div className={classes.join(' ')}>
        <small>{hour} · Mariana</small>
        <strong>Masaje relajante</strong>
        <span>{label ?? appointment.after}</span>
      </div>
    );
  };

  const handedOff = Boolean(scene.handoff) && done;

  return (
    <article className="tour-step" id={`paso-${index + 1}`} data-index={index} ref={root} aria-labelledby={`paso-${index + 1}-titulo`}>
      <div className="tour-copy">
        <p className="eyebrow">{number} / {scene.name.toUpperCase()}</p>
        <h3 id={`paso-${index + 1}-titulo`}>{scene.title}</h3>
        <p>{scene.intro}</p>
      </div>
      <div className="demo">
        {near && (
          <div className="demo-content">
            <div className="demo-phone" ref={phone}>
              <div className="chat-title"><span className="avatar">S</span><div><strong>Spa · WhatsApp</strong><small>Atendido por Citara</small></div><span className="chat-dots">···</span></div>
              <div className="messages">
                <span className="chat-day">Conversación de ejemplo</span>
                {scene.chat.map((message, i) => {
                  const state = i < shown ? ' is-shown' : typing && i === shown ? ' is-typing' : '';
                  return <p key={message.text} className={`bubble ${message.from === 'client' ? 'user' : 'agent'}${state}`}>{message.text}</p>;
                })}
              </div>
              <div className="fake-input">Mensaje <span>♧</span></div>
            </div>
            <div className="demo-panel" aria-hidden="true">
              <div className="panel-top"><img src="/brand/citara-claro.svg" width="85" height="23" alt="Citara" /><span>Panel de tu negocio</span><span className="avatar">LM</span></div>
              <div className="panel-inner">
                <div className="panel-section-nav">
                  <span className={handedOff ? '' : 'selected'}>Agenda</span>
                  <span>Clientes</span>
                  <span className={handedOff ? 'selected' : ''}>Por atender {handedOff && <b>1</b>}</span>
                </div>
                <div className="tour-views" ref={views}>
                  <div className={handedOff ? 'is-off' : ''}>
                    <div className="panel-date"><div><small>SEPTIEMBRE 2026</small><h3>Viernes 25</h3></div><span className="day-tag">Vista del día</span></div>
                    <div className="schedule-col"><span>Hora</span><span>Laura · Masajes</span><span>Camila · Masajes</span></div>
                    {HOURS.map((hour) => (
                      <div className="schedule-row" key={hour}>
                        <span>{hour}</span>
                        <div>{slot(hour)}</div>
                        <div>{hour === '09:00' && <div className="appointment muted"><small>09:00 · Valentina</small><strong>Masaje relajante</strong><span>Agendada</span></div>}</div>
                      </div>
                    ))}
                  </div>
                  {scene.handoff && (
                    <div className={handedOff ? '' : 'is-off'}>
                      <div className="handoff-card"><span className="status">Por atender</span><h4>Mariana · Consulta clínica</h4><p>{scene.handoff}</p><div>Citara pasó la conversación al equipo.<br />Una persona debe continuar la atención.</div></div>
                    </div>
                  )}
                </div>
                <div className={`panel-event${done ? ' is-shown' : ''}`}><span>✓</span>{scene.event}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Tour() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    // The step crossing the middle of the viewport is the one being read.
    const reading = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { rootMargin: '-45% 0px -54% 0px' });
    ref.current?.querySelectorAll('.tour-step').forEach((step) => reading.observe(step));
    return () => reading.disconnect();
  }, []);

  return (
    <div className="tour" ref={ref}>
      <nav className="tour-nav" aria-label="Pasos del recorrido">
        <ol>
          {scenes.map((scene, i) => (
            <li key={scene.name}>
              <a href={`#paso-${i + 1}`} aria-current={active === i ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{scene.name}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div>
        {scenes.map((scene, i) => <Step key={scene.name} scene={scene} index={i} />)}
        <p className="tour-note">{NOTE}</p>
      </div>
    </div>
  );
}

const NOTE = 'Demostración ilustrativa con datos de ejemplo. No se envían mensajes reales.';
const STAGE_QUERY = '(min-width: 1100px) and (min-height: 700px)';
const SCENE_SCROLL = 700; // recorrido por escena: 4400 − 900 px para cinco escenas en el prototipo
const ANCHOR_OFFSET = 40; // el ancla queda un poco dentro de su escena, después del scroll-padding del header
const threshold = (i: number) => 0.06 + i * 0.13; // el mensaje i aparece en este avance de la escena
const PULSE = 0.2; // duración del pulso dentro de la escena

type StageView = { index: number; shown: number; typing: boolean; done: boolean; justDone: boolean; pulse: boolean; hint: boolean };

function stageAt(p: number, reduced: boolean): { view: StageView; t: number } {
  const position = p * scenes.length;
  const index = Math.min(scenes.length - 1, Math.floor(position));
  // Con movimiento reducido cada escena muestra directamente su estado final.
  const sp = reduced ? 1 : Math.min(1, position - index);
  const chat = scenes[index].chat;
  let shown = 0;
  let typing = false;
  for (let i = 0; i < chat.length; i++) {
    if (sp >= threshold(i)) {
      shown = i + 1;
      continue;
    }
    typing = chat[i].from === 'agent' && sp >= threshold(i) - 0.06;
    break;
  }
  const start = threshold(chat.length - 1) + 0.05;
  const end = start + PULSE;
  const done = sp >= end;
  return {
    view: { index, shown, typing, done, justDone: !reduced && done && sp < end + 0.12, pulse: !reduced && sp >= start && sp < end + 0.04, hint: !reduced && p < 0.01 },
    t: clamp((sp - start) / PULSE),
  };
}

function Heading({ scene = false }: { scene?: boolean }) {
  return (
    <>
      <p className="eyebrow">WHATSAPP CONVERSA. TU AGENDA SE ORGANIZA.</p>
      <h2>Dos lados de una{scene ? ' ' : <br />}<em>misma cita.</em></h2>
      <p>Tu clienta escribe como siempre. Citara se ocupa de la cita.{scene ? ' ' : <br />}Tu equipo sigue al mando desde el panel.</p>
    </>
  );
}

function Stage() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const flash = useRef<SVGCircleElement>(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [view, setView] = useState<StageView>(() => stageAt(0, false).view);

  useEffect(() => {
    if (!track.current || !stage.current) return;

    // Traza el pulso del borde del teléfono a la celda afectada, o a la pestaña "Por atender".
    const drawPulse = (index: number, t: number) => {
      const box = stage.current?.getBoundingClientRect();
      const from = phone.current?.getBoundingClientRect();
      const bubbles = phone.current?.querySelectorAll('.bubble');
      const last = bubbles?.[bubbles.length - 1]?.getBoundingClientRect();
      const appointment = scenes[index].appointment;
      const selector = appointment ? `[data-cell="${appointment.to}"]` : '[data-tab="por-atender"]';
      const to = panel.current?.querySelector(selector)?.getBoundingClientRect();
      if (!box || !from || !to) return;
      const s = [from.right - box.left, (last ? last.top + last.height / 2 : from.top + from.height * 0.55) - box.top];
      const e = [to.left - box.left - (appointment ? 0 : 8), to.top + to.height / 2 - box.top];
      const c1 = [s[0] + 80, s[1]];
      const c2 = [e[0] - 80, e[1]];
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

    let last = '';
    return watchPinned(track.current, track.current, stage.current, (p) => {
      const { view: next, t } = stageAt(p, reduced);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setView(next);
      }
      if (next.pulse || next.justDone) drawPulse(next.index, t);
    });
  }, [reduced]);

  const scene = scenes[view.index];
  const appointment = scene.appointment;
  const hour = appointment ? (view.done ? appointment.to : appointment.from) : null;
  const showAppointment = Boolean(appointment) && (view.done || appointment?.before !== null);
  const handoff = Boolean(scene.handoff);
  const ring = view.justDone ? ' is-ring' : '';

  return (
    <div ref={track} className="tour-stage">
      {scenes.map((item, i) => <span key={item.name} id={`paso-${i + 1}`} className="tour-stage-anchor" style={{ top: i * SCENE_SCROLL + ANCHOR_OFFSET }} />)}
      <div ref={stage} className="tour-stage-scene">
        <div className="center-heading tour-heading-scene"><Heading scene /></div>
        <div className="tour-stage-grid">
          <div className="tour-stage-side">
            <nav className="tour-stage-nav" aria-label="Pasos del recorrido">
              <ol>
                {scenes.map((item, i) => (
                  <li key={item.name}>
                    <a href={`#paso-${i + 1}`} aria-current={view.index === i ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{item.name}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="tour-stage-copy" aria-hidden="true">
              <h3>{scene.title}</h3>
              <p>{scene.intro}</p>
            </div>
          </div>

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

          <div className="demo-panel" ref={panel} aria-hidden="true">
            <div className="panel-top"><img src="/brand/citara-claro.svg" width="85" height="23" alt="" /><span>Panel de tu negocio</span><span className="avatar">LM</span></div>
            <div className="panel-inner">
              <div className="panel-section-nav">
                <span className={handoff ? '' : 'selected'}>Agenda</span>
                <span>Clientes</span>
                <span className={handoff ? 'selected' : ''} data-tab="por-atender">Por atender {handoff && view.done && <b>1</b>}</span>
              </div>
              {handoff ? (
                view.done
                  ? <div className={`handoff-card${ring}`}><span className="status">Por atender</span><h4>Mariana · Consulta clínica</h4><p>{scene.handoff}</p><div>Citara pasó la conversación al equipo.<br />Una persona debe continuar la atención.</div></div>
                  : <p className="handoff-empty">No hay conversaciones por atender.</p>
              ) : (
                <div>
                  <div className="panel-date"><div><small>SEPTIEMBRE 2026</small><h3>Viernes 25</h3></div><span className="day-tag">Vista del día</span></div>
                  <div className="schedule-col"><span>Hora</span><span>Laura · Masajes</span><span>Camila · Masajes</span></div>
                  {HOURS.map((h) => (
                    <div className="schedule-row" key={h}>
                      <span>{h}</span>
                      <div data-cell={h}>
                        {showAppointment && appointment && h === hour && (
                          <div className={`appointment${view.done && appointment.cancelled ? ' cancelled' : ''}${ring}`}>
                            <small>{h} · Mariana</small>
                            <strong>Masaje relajante</strong>
                            <span>{view.done ? appointment.after : appointment.before}</span>
                          </div>
                        )}
                      </div>
                      <div>{h === '09:00' && <div className="appointment muted"><small>09:00 · Valentina</small><strong>Masaje relajante</strong><span>Agendada</span></div>}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className={`panel-event${view.done ? ' is-shown' : ''}`}><span>✓</span>{scene.event}</div>
            </div>
          </div>
        </div>

        <svg className={`tour-pulse${view.pulse ? ' is-on' : ''}${view.justDone ? ' is-flash' : ''}`} aria-hidden="true">
          <path ref={path} className="pulse-line" />
          <circle ref={halo} className="pulse-halo" r="15" />
          <circle ref={dot} className="pulse-dot" r="7" />
          <circle ref={flash} className="pulse-flash" r="18" />
        </svg>
        <p className={`tour-stage-hint${view.hint ? ' is-shown' : ''}`} aria-hidden="true">
          Desplázate para ver cada paso
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </p>
        <p className="tour-note">{NOTE}</p>
      </div>

      {/* Las escenas completas, para lectores de pantalla: el escenario visual solo muestra la escena activa. */}
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

export default function ProductDemo() {
  // El escenario fijo necesita ancho para tres columnas y altura para el teléfono.
  const staged = useMediaQuery(STAGE_QUERY);
  return (
    <>
      <Reveal className={`center-heading${staged ? ' tour-heading-flow' : ''}`}><Heading /></Reveal>
      {staged ? <Stage /> : <Tour />}
    </>
  );
}
