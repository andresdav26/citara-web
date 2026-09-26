'use client';

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const steps = [
  { short: 'Recibe', label: '01 / RECIBE', title: 'La clienta escribe como siempre.', message: 'Hola, ¿tienen espacio para un masaje el viernes?', reply: '¡Hola! Para el viernes tenemos 10:00 a. m. o 3:00 p. m.', panel: 'Nueva conversación', panelNote: 'Citara está atendiendo por WhatsApp.' },
  { short: 'Agenda', label: '02 / AGENDA', title: 'La cita aparece en el panel.', message: 'A las 10 me queda perfecto.', reply: 'Listo, tu masaje quedó agendado para el viernes a las 10:00 a. m.', panel: 'Cita creada', panelNote: 'Mariana · Masaje relajante · 10:00 a. m.' },
  { short: 'Actualiza', label: '03 / ACTUALIZA', title: 'Si cambian los planes, cambia la agenda.', message: '¿Puedo mover mi cita para la tarde?', reply: 'Sí. Tu cita quedó para las 3:00 p. m. del viernes.', panel: 'Horario actualizado', panelNote: 'La nueva hora queda visible para el equipo.' },
  { short: 'Escala', label: '04 / ESCALA', title: 'Cuando hace falta criterio, entra una persona.', message: 'Tengo una lesión. ¿Ese masaje es adecuado?', reply: 'Les paso tu conversación al equipo para que te orienten.', panel: 'Por atender', panelNote: 'Una persona debe continuar la atención.' },
];
const duration = 4200;

export default function AutoFlow() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const step = steps[active];

  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % steps.length), duration);
    return () => window.clearInterval(timer);
  }, [playing, reduced]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="auto-flow" aria-label="Recorrido automático de Citara">
        <div className="auto-flow-head">
          <div><span className="eyebrow">RECORRIDO AUTOMÁTICO</span><h3>Del mensaje a la agenda, sin cortar el hilo.</h3></div>
          <button className="flow-toggle" type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
            {playing ? 'Ⅱ Pausar' : '▷ Reproducir'}
          </button>
        </div>
        <div className="flow-progress" aria-hidden="true"><span key={`${active}-${playing}`} className={playing && !reduced ? 'running' : ''} /></div>
        <div className="flow-body">
          <nav className="flow-steps" aria-label="Pasos del recorrido">
            {steps.map((item, index) => (
              <button key={item.short} type="button" className={active === index ? 'active' : ''} onClick={() => { setActive(index); setPlaying(false); }} aria-current={active === index ? 'step' : undefined}>
                <span>{item.label}</span><b>{item.short}</b>
              </button>
            ))}
          </nav>
          <div className="flow-stage">
            <div className="flow-phone">
              <div className="flow-phone-top"><span className="avatar">S</span><div><strong>Spa · WhatsApp</strong><small>Atendido por Citara</small></div></div>
              <span className="chat-day">Conversación de ejemplo</span>
              <AnimatePresence mode="wait">
                <m.div key={active} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduced ? 0 : 0.28 }}>
                  <p className="bubble user">{step.message}</p><p className="bubble agent">{step.reply}</p>
                </m.div>
              </AnimatePresence>
            </div>
            <div className="flow-connector" aria-hidden="true"><span>↗</span></div>
            <div className="flow-panel">
              <div className="flow-panel-top"><img src="/brand/citara.svg" width="82" height="30" alt="Citara"/><span>Panel de tu negocio</span></div>
              <div className="flow-panel-content"><small>VIERNES 25 · SEPTIEMBRE 2026</small><h4>{step.panel}</h4><AnimatePresence mode="wait"><m.p key={active} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.25 }}>{step.panelNote}</m.p></AnimatePresence><div className={`flow-status status-${active}`}>{active === 3 ? 'Requiere equipo' : 'Actualizado ahora'} <span>✓</span></div></div>
            </div>
          </div>
          <div className="flow-copy"><span className="eyebrow">{step.label}</span><h4>{step.title}</h4><p>El chat y el panel se mantienen sincronizados para que el equipo sepa qué pasó y qué sigue.</p></div>
        </div>
      </div>
    </LazyMotion>
  );
}
