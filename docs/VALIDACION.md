# Validación del anexo 1 (rubros de ejemplo y video v2) — 30 de septiembre de 2026

Rama `redesign/brand-2026`, secciones 12 a 15 de `docs/rediseno/REDISENO.md`. Pruebas con el Chrome del sistema (Chrome 131, headless, vía puppeteer-core) sobre el export servido en local con `scripts/serve.mjs`. Node 22.23.2.

- `npm run check`: correcto al final de cada fase.
- `grep -rniE "tres rubros|hoy funciona en" app components lib`: sin resultados.
- **Pestañas solo con teclado (1440 px):** Tab entra en la pestaña seleccionada. Flecha derecha y flecha izquierda cambian de pestaña y dan la vuelta en los extremos; Inicio y Fin van a la primera y a la última. El `tabindex` itinerante queda en 0 solo en la seleccionada, se muestra un único panel y el siguiente Tab lleva al panel. Cada pestaña apunta a su panel con `aria-controls`, cada panel (`role="tabpanel"`) remite a su pestaña con `aria-labelledby`, y el `tablist` ("Rubros de ejemplo") solo contiene pestañas. Revisado en el DOM, no con un lector de pantalla real.
- **Sin JavaScript:** los tres paneles se ven apilados (500 px de alto cada uno a 1440 px) y no aparece el `tablist`. El encabezado de la sección usa `Reveal`, que sin JS se queda con opacidad 0; es el comportamiento previo de todas las secciones con `Reveal` y no cambió en este anexo.
- **Movimiento:** al cargar no hay animación. Al cambiar de pestaña, el panel y sus mensajes usan `verticals-in` (0,38 s), con retrasos de 0,12, 0,28, 0,44, 0,60 y 0,76 s. Con `prefers-reduced-motion: reduce` emulado no hay animación, ni al cargar ni al cambiar de pestaña.
- **Desbordamiento horizontal:** ninguno a 320, 360, 390 y 430 px en la página de inicio con cada una de las tres pestañas, ni en `/ventas/`. Es emulación de viewport; no sustituye una prueba en un teléfono físico.
- **Video v2 (1440 y 390 px):** ninguna solicitud a `/video/` antes de abrir la ventana. Al abrirla con Enter se piden `citara-video-v2-portada.jpg`, `citara-video-v2.mp4` y `citara-video-v2.es.vtt`. El video (61 s, 1920×1080) se reproduce, los subtítulos en español quedan activos (19 señales) y el foco pasa a "Cerrar video". Esc cierra la ventana, pausa el video y devuelve el foco a "Ver video".
- `public/video/` solo contiene los tres archivos v2 (revisado con `git ls-files`).
- Revisión visual del prototipo contra capturas a 1440 y 390 px: coincide en estructura, colores y tamaños.
- **No ejecutado en este anexo:** Lighthouse, Safari, Firefox, teléfonos físicos y lectores de pantalla reales. Los resultados de Lighthouse de abajo son anteriores al anexo.

# Validación del rediseño — 29 de septiembre de 2026

Rama `redesign/brand-2026`, especificación `docs/rediseno/REDISENO.md`. Pruebas en Chrome headless (Google Chrome 131 de Lighthouse y el Chrome del sistema vía puppeteer-core) sobre el export servido en local. Node 22.23.2 (el proyecto fija 22.16.0; `engines` admite 22.x).

- `npm run check` (TypeScript estricto y compilación estática): correcto al final de cada fase.
- **Logo final: resuelto.** `public/brand/` tiene `citara-claro.svg`, `citara-oscuro.svg` y los dos símbolos; `public/icon.svg` es el favicon nuevo. Sin `<text>` ni imágenes raster (revisado con grep). Se retiraron `/identidad/`, las 18 exploraciones y `concepts.json`.
- **Video con subtítulos: resuelto.** `public/video/` (v1: MP4 de 60 s y 12 MB, VTT en español y portada; reemplazado por la v2 el 30 de septiembre, ver arriba). A 1440 y 390 px: ninguna solicitud a `/video/` antes de abrir la ventana; al abrirla se piden portada, MP4 y VTT, el video se reproduce y los subtítulos en español quedan activos. Solo con teclado: Tab hasta "Ver video", Enter abre (foco en "Cerrar video"), Esc cierra, el video queda en pausa y el foco vuelve al botón.
- Rutas generadas: inicio, planes, prueba, ventas, privacidad, términos y 404.
- Sin desbordamiento horizontal en las 7 rutas a 320, 360, 390, 430, 1024 y 1440 px, recorriendo cada página completa. Es emulación de viewport; no sustituye una prueba en un teléfono físico.
- "El día no tiene más horas": escena fija revisada a 1440×900, 1440×789, 1280×720, 390×844 y 360×640 (mazo de tarjetas); a 320×568 se muestra sin fijar. En p = 0,53 el reloj marca 3:25 p. m., como en la captura aprobada; el modo noche entra después de las 7:00 p. m.
- "Dos lados de una misma cita": escenario fijo desde 1100×700. Los pasos 1 a 5 llevan a su escena con clic y con Enter; el pulso termina en la celda afectada (15:00 al reprogramar) o en "Por atender". A 1024 y 390 px se usa el recorrido por pasos. Una lista `sr-only` conserva las cinco conversaciones para lectores de pantalla (revisada en el DOM, no con un lector de pantalla real).
- `prefers-reduced-motion` emulado: el hero dibuja un cuadro fijo sin destellos; "El día" no se fija y muestra las tres tarjetas activas con colores de día; "Dos lados" muestra el estado final de cada escena, sin pulso.
- Contraste calculado con la fórmula WCAG para los pares de la paleta usados en texto: todos cumplen (por ejemplo, pizarra sobre ámbar 5,00:1; blanco verdoso sobre petróleo 5,33:1; `#EFF7F3` sobre petróleo 4,97:1; salvia sobre petróleo 3,61:1 solo en titulares). El foco ámbar sobre la banda petróleo daba 2,54:1, así que ahí el foco es blanco verdoso (5,33:1).
- Lighthouse 12.8.2, móvil, página de inicio:
  - Con `npm run preview`, que sirve sin compresión: rendimiento 75 en 3 de 3 corridas (en `main`, 69–70), LCP 5,3 s, TBT 230–250 ms y CLS 0,001.
  - El mismo `out/` servido con gzip, como lo sirve Firebase Hosting (servidor temporal, fuera del repositorio): rendimiento 96 en 3 de 3 corridas (en `main`, 93), FCP 1,2 s, LCP 2,7 s, TBT 60–70 ms y CLS 0,001. Accesibilidad 96, buenas prácticas 100, SEO 63 por el `noindex` intencional.
  - **No se ha medido contra Firebase.** Queda pendiente para el sitio publicado.
- Accesibilidad en Lighthouse: el único fallo es contraste en la tarjeta todavía inactiva de "El día", que usa la opacidad 0,32 del prototipo. En `main` había 9 fallos de contraste de la paleta anterior.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas.
- Corregido: `scripts/check-lighthouse.mjs` buscaba `qa/lighthouse-mobile.json`, pero Lighthouse escribe `qa/lighthouse-mobile.report.json`.
- No revisado: Safari, Firefox, teléfonos físicos y lectores de pantalla reales.

# Validación de esta entrega — 25 de septiembre de 2026

- Compilación estática con Node 22.16.0 y Next.js 16.3.6: correcta.
- TypeScript estricto: correcto.
- npm audit --omit=dev: 0 vulnerabilidades conocidas en las dependencias de producción en el momento de la comprobación.
- 18 logos SVG parseados: válidos, sin `<text>` renderizado ni imágenes raster incrustadas.
- Rutas generadas: inicio, planes, prueba, ventas, privacidad, términos, identidad y 404.
- Navegación escritorio a planes y navegación mediante menú móvil: verificadas en navegador.
- Móvil: marcos de 320 y 390 px, con área útil de 305 y 375 px por la barra del navegador; sin overflow horizontal. No sustituye una prueba en un teléfono físico.
- Demo: reprogramación muestra el nuevo horario; la consulta clínica muestra la transferencia al equipo. No conecta con el agente real.
- Precios ausentes: aviso visible y los cuatro planes sin cifras ficticias.
- Despliegue sin target comercial asignado: el script se detiene antes de invocar Firebase.
- Auditoría Lighthouse de producción: **no ejecutada**; el umbral móvil de 90 está pendiente de comprobar. El comando y el validador están incluidos.
- Repositorio privado `andresdav26/citara-web` creado, rama `main`. Publicación en Firebase pendiente; el panel existente no se ha modificado.

## Contenido que requiere datos del propietario

Precios y cobro único; alcance de implementación; número de WhatsApp; aprobación de textos legales; formulario y su función (solicitados aparte). El video con subtítulos y el logo final se resolvieron el 29 de septiembre de 2026.

## Fuentes de contexto

- Brief del usuario y lámina adjunta de propuestas previas.
- Repositorio `andresdav26/Citara`: README, prompts de conversación, agenda del panel y configuración Firebase, consultados por GitHub.
- `andresdav26/citara-legal/privacidad.html`: describe una fase de pruebas; no se trasladó como política comercial definitiva.
- Referencia visual: https://www.freshworks.com/latam/freshdesk/
- Export estático: https://nextjs.org/docs/app/guides/static-exports
- Hosting separado dentro del mismo proyecto: https://firebase.google.com/docs/hosting/multisites
