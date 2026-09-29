'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/lib/site';

// Botón de reproducir sobre la portada del hero y ventana modal con el video del producto.
// El <video> se crea la primera vez que se abre la ventana: antes no se descarga ni el video ni su póster.
// Esc cierra la ventana (evento nativo del <dialog>); al cerrar, el video se pausa y el foco vuelve al botón.

export default function VideoDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  // La reproducción la inicia la persona con su clic, así que puede empezar con sonido.
  useEffect(() => {
    if (open) video.current?.play().catch(() => {});
  }, [open, loaded]);

  if (!site.video) return null;

  const show = () => {
    setLoaded(true);
    setOpen(true);
    dialog.current?.showModal();
  };

  const onClose = () => {
    setOpen(false);
    video.current?.pause();
    trigger.current?.focus();
  };

  return (
    <>
      <button ref={trigger} type="button" className="video-trigger" aria-label="Reproducir el video de Citara" onClick={show}>
        <span className="video-trigger-circle" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
        </span>
        <span className="video-trigger-label" aria-hidden="true">Ver video</span>
      </button>
      <dialog
        ref={dialog}
        className="video-dialog"
        aria-label="Video de Citara"
        onClose={onClose}
        onClick={(event) => {
          // Un clic en el velo, fuera del video, también cierra la ventana.
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="video-frame">
          <button type="button" className="video-close" aria-label="Cerrar video" onClick={() => dialog.current?.close()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          {loaded && (
            <video ref={video} controls playsInline preload="none" poster={site.videoPoster}>
              <source src={site.video} type="video/mp4" />
              {site.videoCaptions && <track kind="captions" src={site.videoCaptions} srcLang="es" label="Español" default />}
              Tu navegador no puede reproducir este video.
            </video>
          )}
        </div>
      </dialog>
    </>
  );
}
