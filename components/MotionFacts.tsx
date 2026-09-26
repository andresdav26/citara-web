'use client';

import { LazyMotion, domAnimation, m, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

const facts = [
  { value: 4, label: 'acciones de cita', note: 'Agenda, confirma, reprograma y cancela.' },
  { value: 1, label: 'panel para el equipo', note: 'Agenda, clientes y conversaciones por atender.' },
  { value: 3, label: 'rubros donde funciona hoy', note: 'Spas, fisioterapia y depilación láser.' },
];

export default function MotionFacts() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <div ref={ref} className="facts-grid" aria-label="Alcance actual de Citara">
        {facts.map((fact, index) => (
          <div className="fact-card" key={fact.label}>
            <m.strong
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.08 }}
            >
              {inView && !reduced ? <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{fact.value}</m.span> : fact.value}
            </m.strong>
            <div><b>{fact.label}</b><p>{fact.note}</p></div>
          </div>
        ))}
      </div>
    </LazyMotion>
  );
}
