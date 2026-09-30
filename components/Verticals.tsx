'use client';

import { useEffect, useRef, useState } from 'react';
import { verticals, type Vertical } from '@/lib/verticals';

// Rubros de ejemplo en pestañas (docs/rediseno/REDISENO.md §13, prototipos Rubros.dc.html y RubrosMovil.dc.html).
// El HTML estático y la falta de JS muestran todos los paneles apilados; las pestañas aparecen cuando el JS toma
// el control. Los mensajes del chat entran escalonados solo cuando la persona cambia de pestaña: nada se reproduce
// solo ni depende del scroll, y con movimiento reducido no hay animación (regla global de app/globals.css).

const SPEAKER = { cliente: 'Cliente', citara: 'Citara' };

export default function Verticals() {
  const [tabs, setTabs] = useState(false);
  const [selected, setSelected] = useState(0);
  // Se vuelve true con el primer cambio de pestaña; desde ahí cada panel que aparece anima sus mensajes.
  const [changed, setChanged] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setTabs(true), []);

  const select = (index: number) => {
    if (index === selected) return;
    setSelected(index);
    setChanged(true);
  };

  // Patrón de pestañas WAI-ARIA con activación automática: flechas (cíclicas), Inicio y Fin.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = verticals.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: selected === last ? 0 : selected + 1,
      ArrowLeft: selected === 0 ? last : selected - 1,
      Home: 0,
      End: last,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="verticals">
      {tabs && (
        <div className="verticals-bar">
          <span>Por ejemplo:</span>
          <div role="tablist" aria-label="Rubros de ejemplo" onKeyDown={onKeyDown}>
            {verticals.map((vertical, index) => (
              <button
                key={vertical.id}
                ref={(node) => { tabRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={`rubro-tab-${vertical.id}`}
                aria-selected={index === selected}
                aria-controls={`rubro-${vertical.id}`}
                tabIndex={index === selected ? 0 : -1}
                onClick={() => select(index)}
              >
                {vertical.tab}
              </button>
            ))}
          </div>
        </div>
      )}
      {verticals.map((vertical, index) => (
        <Panel
          key={vertical.id}
          vertical={vertical}
          tabs={tabs}
          hidden={tabs && index !== selected}
          entering={changed && index === selected}
        />
      ))}
    </div>
  );
}

// Un panel oculto sale con display: none; al mostrarse otra vez, sus animaciones empiezan de nuevo.
function Panel({ vertical, tabs, hidden, entering }: { vertical: Vertical; tabs: boolean; hidden: boolean; entering: boolean }) {
  const { example } = vertical;
  const tabProps = tabs ? { role: 'tabpanel', 'aria-labelledby': `rubro-tab-${vertical.id}`, tabIndex: 0 } : {};
  return (
    <div
      id={`rubro-${vertical.id}`}
      className={`verticals-panel${entering ? ' is-entering' : ''}`}
      style={{ background: vertical.tone }}
      hidden={hidden}
      {...tabProps}
    >
      <div className="verticals-copy">
        <h3>{vertical.name}</h3>
        <h4>{vertical.subtitle}</h4>
        <p>{vertical.description}</p>
        <ul className="verticals-tags">
          {vertical.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      </div>
      <div className="verticals-example">
        <div className="verticals-chat">
          <div className="verticals-chat-head">
            <span aria-hidden="true">{example.initial}</span>
            <div>
              <strong>{example.business} · WhatsApp</strong>
              <small>Atendido por Citara</small>
            </div>
          </div>
          <div className="verticals-chat-body">
            {example.messages.map((message, index) => (
              <p key={index} className={`from-${message.from}`} style={{ '--i': index } as React.CSSProperties}>
                <span className="sr-only">{SPEAKER[message.from]}: </span>
                {message.text}
              </p>
            ))}
            {example.handoff && (
              <span className="verticals-handoff" style={{ '--i': example.messages.length } as React.CSSProperties}>
                {example.handoff}
              </span>
            )}
          </div>
        </div>
        <span className="verticals-caption">Conversación de ejemplo</span>
      </div>
    </div>
  );
}
