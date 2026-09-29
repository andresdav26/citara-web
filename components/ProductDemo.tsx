'use client';

import { useEffect, useRef, useState } from 'react';
import VideoDialog from './VideoDialog';

// Scroll-driven product tour: each step plays its WhatsApp conversation when it scrolls into view,
// then the panel shows the result. A sticky list on wide screens marks the step being read.

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

export default function ProductDemo() {
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
        <p className="tour-note">Demostración ilustrativa con datos de ejemplo. No se envían mensajes reales.</p>
      </div>
    </div>
  );
}
