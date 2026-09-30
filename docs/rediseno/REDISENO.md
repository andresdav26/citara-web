# Rediseño de citara-web — traspaso para Claude Code

Este documento resume el rediseño aprobado en claude.ai (lienzo "Citara — exploración de paletas", página **Sitio**). Úsalo como especificación. Donde este documento y el código actual no coincidan, manda este documento. Donde este documento no diga nada, se conserva el comportamiento actual.

## 0. Cómo trabajar

- Crea una rama nueva desde `main` (nombre sugerido: `redesign/brand-2026`).
- **Primero presenta un plan** con los archivos que vas a crear, modificar y borrar. No modifiques nada hasta que el plan esté aprobado.
- **Una fase = un commit.** Mensajes de commit en inglés. Conversación, comentarios en el código y textos de la interfaz en español.
- Al final de cada fase, `npm run check` debe pasar (typecheck y build estático).
- **Antes de tocar cualquiera de las decisiones pendientes (sección 9), pregunta.** No asumas.
- No inventes precios, cifras, números de WhatsApp ni textos legales.
- Los archivos de `referencias/lienzo/*.dc.html` son prototipos en un formato propio del lienzo: HTML con estilos en línea y una clase `Component` cuya función `renderVals()` contiene la lógica de animación. No se copian tal cual: sirven para sacar medidas, colores, tiempos y comportamiento.

## 1. Paleta y tokens

Paleta base (aprobada):

| Nombre | Hex | Uso principal |
|---|---|---|
| Ámbar | `#F0A135` | Burbuja del logo, botón principal (siempre con texto pizarra), acento sobre oscuro |
| Blanco verdoso | `#FBFEF9` | Fondo principal, texto sobre oscuro |
| Salvia | `#C0D8D1` | Superficies suaves, énfasis grande sobre petróleo |
| Petróleo | `#0C7489` | Énfasis, cifras, banda de prueba, pulso de las animaciones |
| Pizarra | `#2E4052` | Texto, hero, pie de página |

Derivados (ya verificados en contraste):

| Token sugerido | Hex | Uso |
|---|---|---|
| `--petroleo-texto` | `#1A5F73` | Texto pequeño en petróleo sobre salvia o tintes (≥ 4,5:1) |
| `--muted` | `#4D5C6B` | Texto secundario sobre fondos claros |
| `--line` | `#DEE3E2` | Líneas y bordes sobre claro |
| `--line-accent` | `#8FC0C7` | Bordes superiores de artículos y tarjetas |
| Hero, texto secundario | `#D6DCDB` | Sobre pizarra |
| Hero, línea inferior | `#576673` | Sobre pizarra |
| Sección "Dos lados" | `#DEEBE5` | Fondo de la sección |
| Paneles de rubros (`--rubro-1` a `--rubro-3`) | `#D5E5DF`, `#F9EDD6`, `#DAEBE9` | Spas, fisioterapia, láser (ver sección 13) |
| Pestañas de rubros, borde (`--borde-pestana`) | `#7C8891` | Pestaña no seleccionada sobre blanco (3,57:1) |
| Chat de ejemplo (`--chat-cabecera`, `--chat-fondo`, `--chat-linea`) | `#F5FAF8`, `#EEF5F2`, `#DDE7E4` | Cabecera, fondo y línea del chat de los paneles de rubros |
| Banda de prueba, texto secundario | `#EFF7F3` | Sobre petróleo |
| Banda de prueba, línea | `#549DAB` | Sobre petróleo |
| Cierre, fondo | `#F9F0DC` | Tarjeta de cierre |
| Pie, texto secundario | `#BEC5C7` | Sobre pizarra |
| Pie, línea | `#4F5E6D` | Sobre pizarra |
| Tarjeta de ventas, fondo | `#E3F0EE` | Ver sección 6 |

Reglas de contraste (no romperlas):

- Ámbar **nunca** como texto sobre fondos claros: da 2,1:1.
- Petróleo y pizarra **nunca** juntos, en ningún orden: 1,97:1.
- Botón principal: fondo ámbar con texto pizarra (5,0:1).
- Blanco verdoso sobre petróleo: 5,33:1. Salvia sobre petróleo: 3,61:1, **solo** para titulares de 24 px o más.
- Todo texto de menos de 24 px debe cumplir 4,5:1 como mínimo.

Hoy `app/globals.css` define `--ink`, `--green`, `--mid`, `--copper`, `--paper`, `--line` y `--muted`, pero además tiene **muchos colores escritos directamente** (por ejemplo `#123f3b`, `#e2ac89`, `#1f5f5b`, `#e8ede5`, `#dfb296`). La fase 1 debe llevar todos esos colores a tokens de la paleta nueva, sin dejar ninguno de la paleta anterior.

## 2. Logo y marca

- Los SVG están en `marca/`. Van a `public/brand/`:
  - `citara-claro.svg`: pizarra y ámbar, para fondos claros (header y maquetas).
  - `citara-oscuro.svg`: blanco verdoso y ámbar, para fondos oscuros (pie).
  - `citara-simbolo-claro.svg` y `citara-simbolo-oscuro.svg`: solo el símbolo.
  - `icon.svg`: favicon, con el símbolo sobre un cuadrado redondeado pizarra. Reemplaza `public/icon.svg`.
- Se usa **solo la versión gruesa** del logo.
- Hoy el logo se referencia como `/brand/citara.svg` en `components/Header.tsx`, `components/Footer.tsx` y dos veces en `components/ProductDemo.tsx` (en `MiniProduct` y en el panel del recorrido). Actualiza todas esas referencias.
- Los SVG se vectorizaron a partir de una imagen. No tienen `<text>` ni imágenes rasterizadas, así que cumplen `docs/VALIDACION.md`. Más adelante conviene un redibujo profesional.
- Pronunciación: ci-TA-ra, palabra llana y sin tilde.
- Eslogan de marca: **"Tu agenda en orden. Tu negocio, a otro ritmo."**. El titular del hero no cambia: "Tu agenda fluye. Tu equipo respira."
- Tipografía: **sin cambios**. Se mantienen Lora y DM Sans locales, según `public/fonts/README.md`.

## 3. Estructura de la página de inicio (`app/page.tsx`)

Orden nuevo:

1. Header
2. Hero (fondo de cuerdas y portada del video)
3. "El día no tiene más horas" (nueva, reemplaza la grilla de problemas)
4. "Dos lados de una misma cita" (recorrido con pulso)
5. "Citara habla el idioma de tu negocio" (rubros de ejemplo en pestañas y tarjeta de ventas; ver sección 13)
6. Banda de prueba
7. Preguntas frecuentes
8. Cierre
9. Pie

Se eliminan de la página:

- La franja "HOY FUNCIONA EN" (`.industries-strip`).
- `MotionFacts`. Si ya no se usa en ningún otro lugar, borra `components/MotionFacts.tsx` y sus estilos (`.facts-grid`, `.fact-card`).
- El bloque de video dentro de la sección "Dos lados" (`.product-video`, `.video-placeholder` y `.video-pending`). El video se mueve al hero.

## 4. Hero

### 4.1 Fondo de cuerdas animadas

Reemplaza el motor de partículas WebGL de `lib/hero-flow.ts` por cuerdas dibujadas en **Canvas 2D**.

- Se conservan `components/HeroFlow.tsx`, el worker `lib/hero-flow.worker.ts` y su contrato (`OffscreenCanvas`, mensajes `ready` y `lost`, pausa fuera de pantalla y cuadro fijo con movimiento reducido).
- Canvas 2D funciona en un `OffscreenCanvas` dentro del worker. Si el navegador no tiene `OffscreenCanvas`, dibuja en el hilo principal o deja el color plano, igual que el comportamiento actual sin WebGL.
- La máscara de `.hero-flow` en `globals.css` (degradado que atenúa la izquierda) se mantiene.

Especificación (referencia: el SVG de cuerdas de `referencias/lienzo/Main.dc.html` y la función `buildCuerdas` / `drawCuerdas` de `referencias/video-fuente/video.html`):

| Parámetro | Valor |
|---|---|
| Cantidad | unas 46 en escritorio, unas 30 en móvil |
| Inicio | fuera del lienzo abajo a la izquierda: 62 % sobre el borde inferior (x entre -4 % y 55 % del ancho), 38 % sobre el borde izquierdo (y entre 80 % y 100 % del alto) |
| Final | agrupadas arriba a la derecha: x = ancho + 0,5 % a 2,5 %, y entre -2 % y 5 % del alto |
| Curva | Bézier cúbica. c1 = inicio + (12 % a 30 % del ancho) en x, y entre 70 % y 92 % del alto. c2: x entre 70 % y 87 % del ancho, y entre 16 % y 40 % del alto |
| Ondulación | los extremos quedan fijos. c1 y c2 oscilan con una senoidal de período 8 a 14 s, amplitud de 35 a 80 px en escritorio (15 a 35 en móvil) y fase aleatoria |
| Colores (peso relativo) | petróleo 1,0 · salvia 0,6 · `#66A6AD` 0,5 · ámbar 0,35 · blanco verdoso 0,35 |
| Grosor y opacidad | 0,8 a 2,5 px; opacidad 0,22 a 0,72 |
| Pulsos | unas 10 cuerdas llevan un destello: segmento de 70 a 90 px (75 % ámbar, 25 % blanco verdoso) que viaja hacia el haz de arriba durante el 42 % de un ciclo de 7 a 12 s. Brillo: segundo trazo de +5 a 7 px al 16 % de opacidad |
| Movimiento reducido | un cuadro fijo, sin pulsos |

Limita el dibujo a unos 30 fps. Con pausa fuera de pantalla y en pestaña oculta, el costo es bajo.

### 4.2 Portada del video y ventana

- `MiniProduct` sigue siendo la portada. Encima, centrado, va un botón de reproducir:
  - Círculo ámbar de 76 px con un triángulo pizarra y un halo `0 0 0 10px rgba(240,161,53,.25)`.
  - Debajo, la etiqueta "Ver video": píldora pizarra con texto blanco verdoso.
  - Es un `<button>` con `aria-label="Reproducir el video de Citara"`.
- Al hacer clic se abre un `<dialog>` modal:
  - Fondo `rgba(24,34,44,.86)`.
  - Video 16:9, de 960 px como máximo y ancho completo en móvil.
  - `controls`, `playsInline` y `preload="none"`. No se descarga nada hasta que se abre.
  - Reproduce al abrir; como lo inicia el usuario, puede tener sonido.
  - Pista `<track kind="captions" srcLang="es" default>`.
  - `poster` con `citara-video-v2-portada.jpg` (ver sección 15).
  - Botón de cerrar de 44 px con `aria-label="Cerrar video"`.
  - Se cierra con Esc. Al cerrar, el video se pausa y el foco vuelve al botón de reproducir.
- Fuente del video: se mantiene `site.video` y `site.videoCaptions` en `lib/site.ts` (`NEXT_PUBLIC_PRODUCT_VIDEO_URL` y `NEXT_PUBLIC_PRODUCT_VIDEO_CAPTIONS_URL`). **Si no hay video configurado, el botón de reproducir no se muestra.** Nada de botones muertos.
- Colores del hero: fondo pizarra, titular blanco verdoso, `em` en ámbar, eyebrow en salvia, botón principal ámbar con texto pizarra, botón secundario con borde `#8A969D` y texto blanco verdoso. La tarjeta flotante "Del chat a tu agenda." es ámbar con texto pizarra.

## 5. Secciones con movimiento

### 5.1 "El día no tiene más horas" (componente nuevo)

Referencia: `referencias/lienzo/Problemas.dc.html`. Toda la lógica está en `renderVals()`.

- **Sección fija con recorrido de scroll.** La escena mide 100 vh y se queda fija mientras la pista de scroll mide unas 3,9 veces el alto de la ventana (en el prototipo, 3500 px para una ventana de 900 px). El progreso `p` va de 0 a 1.
- **Reloj.** Va de 8:00 a. m. a 10:00 p. m. Formato colombiano: "3:25 p. m." y "12 m." al mediodía.
- **Línea de tiempo.** Marcas cada 2 horas, marcador "Cierre · 7:00 p. m.", barra de progreso y un punto que avanza.
- **Tres tarjetas** con los textos actuales de la grilla de problemas. Disparadores:
  - p = 0,1556, con la etiqueta "10:10 a. m."
  - p = 0,5, con la etiqueta "3:00 p. m."
  - p = 0,8444, con la etiqueta "Fuera de horario"
- Cada tarjeta se activa cuando p ≥ disparador − 0,06: su opacidad pasa de 0,32 a 1 y sube 14 px.
- **Viñetas:**
  - 01: mensajes sin leer (4 filas escalonadas cada 0,03 y la insignia "N sin leer").
  - 02: la cita de las 3:00 p. m. se convierte en "Nadie llegó · Hora sin ocupar" en disparador + 0,02.
  - 03: el estado pasa de "Abierto hasta 7:00 p. m." a "Cerrado" en p = 0,786, y entran mensajes a las 8:14, 9:02 y 9:47 p. m.
- **Modo noche.** Entre p = 0,786 y 0,846, el fondo pasa de blanco verdoso a pizarra, el texto cambia a la mitad del recorrido y el acento pasa de petróleo a ámbar (petróleo sobre pizarra no se lee). Colores de noche: tarjeta `#3D4D5E`, texto secundario `#CED4D4`, eyebrow salvia, `em` ámbar.
- **Movimiento reducido.** Sin sección fija: las tres tarjetas activas, colores de día y sin animaciones.
- **Altura mínima.** En escritorio se fija desde 620 px de alto útil (antes 700 px), para cubrir laptops de 768 px de alto con el navegador al 100 %. Entre 620 y 700 px se usa una versión compacta (menos márgenes y viñetas que ocupan el espacio libre de cada tarjeta). Por debajo de 620 px se muestra sin fijar.
- **Móvil.** No se prototipó. Propón en el plan una versión vertical (por ejemplo, el reloj fijo arriba y las tarjetas apiladas, con el mismo modo noche) antes de implementarla.

### 5.2 "Dos lados de una misma cita" (`components/ProductDemo.tsx`)

Referencia: `referencias/lienzo/DosLados.dc.html`.

- Se conservan las 5 escenas y su texto actual: Agenda, Confirma, Reprograma, Cancela y Pasa al equipo.
- **Escenario fijo** desde 1100 px de ancho y 620 px de alto útil (antes 700 px); entre 620 y 700 px, el panel compacta sus márgenes para que la fila de las 15:00 y el resultado quepan. Unos 700 px de scroll por escena. Los mensajes aparecen según el avance dentro de la escena (`sp`): el mensaje i aparece en sp = 0,06 + i × 0,13. Los mensajes del agente muestran "escribiendo" 0,06 antes.
- **Pulso.** Tras el último mensaje, un punto petróleo con halo y trazo recorre, durante 0,2 de la escena, el camino del teléfono a la celda de la agenda afectada, o a la pestaña "Por atender" en la escena del equipo. Al llegar se aplica el resultado (estado u hora de la cita), con un anillo de realce breve.
- La lista de pasos lleva a cada escena.
- **Movimiento reducido.** Cada escena muestra directamente su estado final, sin pulso.

### 5.3 Pestañas de rubros

Ver sección 13. Al cambiar de pestaña, los mensajes del chat de ejemplo entran escalonados. No hay reproducción automática ni animación ligada al scroll, y con movimiento reducido no hay animación.

## 6. Tarjeta "¿Tu negocio es otro? Hablemos."

Reemplaza `.other-business`:

- Tarjeta con borde de 2 px petróleo, fondo `#E3F0EE`, radio de 12 px y relleno de 26 × 32 px.
- Ícono: círculo petróleo de 52 px con un ícono de chat blanco.
- Título en Lora de 28 px: "¿Tu negocio es otro? *Hablemos.*", con "Hablemos." en cursiva 700 y petróleo.
- Texto en 16 px, color `--muted`: "Si tu negocio trabaja con citas, cuéntanos cómo agendas hoy y vemos juntos si Citara encaja." (texto del anexo 1, sección 13).
- Botón principal ámbar con texto pizarra: "Habla con nosotros" (antes "Hablar con ventas").
- En móvil, todo apilado y el botón a ancho completo.

## 7. Resto de secciones: solo cambia el color

- **Header:** fondo blanco verdoso, logo claro, botón "Prueba gratis 7 días" ámbar con texto pizarra.
- **Rubros:** fondos de la tabla de la sección 1. La estructura cambió en el anexo 1: pestañas en lugar de la grilla (ver sección 13).
- **Banda de prueba:** fondo petróleo, texto blanco verdoso, `em` y números en salvia, botón ámbar.
- **Preguntas:** signos "+" en petróleo.
- **Cierre:** fondo `#F9F0DC`.
- **Pie:** fondo pizarra, logo oscuro y texto secundario `#BEC5C7`.
- **Foco visible:** hoy es cobre. Cámbialo por petróleo sobre fondos claros y ámbar sobre oscuros.
- **Subpáginas** (planes, prueba, ventas, legales, 404): mismos tokens, sin cambios de estructura.

## 8. Archivos que se tocan

| Archivo | Cambio |
|---|---|
| `app/globals.css` | Tokens nuevos, eliminar colores fijos antiguos, estilos de las secciones nuevas |
| `app/page.tsx` | Orden de secciones, eliminar franja, cifras y bloque de video, sección "El día" y tarjeta de ventas |
| `lib/hero-flow.ts` | Motor de cuerdas en Canvas 2D |
| `lib/hero-flow.worker.ts` | Ajustar solo si cambia el contrato |
| `components/HeroFlow.tsx` | Ajustar solo si cambia el contrato |
| `components/ProductDemo.tsx` | Pulso, escenario fijo, logo nuevo en `MiniProduct` y panel; portada con botón de reproducir |
| `components/` (nuevos) | Sección "El día" y ventana del video (nombres a definir en el plan) |
| `components/Header.tsx`, `components/Footer.tsx` | Logo nuevo (y texto del pie si se aprueba, ver 9.3) |
| `components/MotionFacts.tsx` | Borrar si queda sin uso |
| `lib/site.ts` | Solo si cambia el manejo del video |
| `public/brand/`, `public/icon.svg` | Logos nuevos |
| `app/layout.tsx` | Favicon si cambia la ruta |
| `docs/VALIDACION.md` | Marcar como resueltos el logo final y el video con subtítulos; registrar las validaciones nuevas |

Anexo 1 (secciones 12 a 15):

| Archivo | Cambio |
|---|---|
| `lib/verticals.ts` (nuevo) | Única lista de rubros de ejemplo |
| `components/Verticals.tsx` (nuevo) | Pestañas y paneles de rubros |
| `app/page.tsx` | Encabezado de rubros, pestañas, texto de la tarjeta de ventas y pregunta "¿Sirve para mi tipo de negocio?" |
| `app/globals.css`, `app/typography.css` | Estilos de pestañas y paneles; eliminar `.sector-grid`, `.sector-index` y `.sector-foot` |
| `app/ventas/page.tsx`, `app/layout.tsx` | Textos sin lista fija |
| `lib/site.ts` | Video v2 por defecto |
| `public/video/` | Archivos v2 con nombres nuevos; se borran los v1 |
| `CLAUDE.md`, `README.md` | Descripción del producto, "rubros de ejemplo" y video v2 |
| `docs/VALIDACION.md` | Registrar las comprobaciones del anexo que se ejecutaron |

## 9. Decisiones pendientes: preguntar antes de implementar

1. **Alojamiento del video** (12 MB):
   - (a) En `public/video/` dentro del repositorio, servido por Firebase Hosting.
   - (b) En un bucket externo, configurado con `NEXT_PUBLIC_PRODUCT_VIDEO_URL`.
2. **Página `/identidad`.** Hoy muestra públicamente las 6 exploraciones de logo anteriores. ¿Se elimina o se convierte en la página del logo final?
3. **Texto del pie.** ¿Se cambia "Tu WhatsApp y tu agenda, al mismo ritmo." por el eslogan de marca?
4. **Nombre de la bandeja.** El sitio dice "Por atender" y el panel real dice "Escalamientos". ¿Cuál se usa?
5. **Logos anteriores.** ¿Se borran o se archivan los 18 SVG y `concepts.json` de `public/brand/`?

## 10. Criterios de aceptación

- `npm run check` pasa y el flujo de CI (`.github/workflows/ci.yml`) queda en verde.
- `npm run audit:mobile`: sin desbordamiento horizontal a 320 y 390 px.
- Lighthouse móvil ≥ 90 (`npm run audit:check`). El video no se descarga hasta abrir la ventana, y las cuerdas no bloquean el hilo principal.
- Contraste: se cumplen las reglas de la sección 1.
- `prefers-reduced-motion` respetado en el hero, "El día" y "Dos lados".
- Ventana del video operable solo con teclado: abrir, reproducir, cerrar con Esc y foco devuelto al botón.
- Ninguna referencia a colores ni logos de la paleta anterior.

## 11. Contenido del paquete

- `marca/`: logos SVG y favicon.
- `video/`: video v1 y guion v3. Reemplazados por la v2 del anexo 1 (ver abajo y sección 15).
- `referencias/lienzo/`: prototipos aprobados (`Main`, `Problemas`, `DosLados`, `Movil`, `Paleta` y `Logo`).
- `referencias/video-fuente/`: código con el que se generó el video v1 (ver su README). No forma parte del sitio; no lo copies dentro de `app/` ni de `components/`.

Paquete del anexo 1 (`cambios-2/`, local y fuera de git):

- `ANEXO.md`: el texto original del anexo, integrado aquí como secciones 12 a 15.
- `video/`: `citara-video-v2.mp4` (61 s, 1080p, 12,4 MB, -16 LUFS), `citara-video-v2.es.vtt`, `citara-video-v2-portada.jpg` y el guion v4.
- `referencias/lienzo/`: prototipos de la sección de rubros (`Rubros` para escritorio y `RubrosMovil` para móvil).
- `referencias/video-fuente/`: código actualizado con el que se generó el video v2. Reemplaza al del primer paquete y tampoco forma parte del sitio.

## 12. Una sola lista de rubros: `lib/verticals.ts`

*Anexo 1.* La lista de rubros (spas, centros de fisioterapia y depilación láser) estaba escrita a mano en varios archivos, en algunos con conteos ("estos tres rubros") o con la frase "hoy funciona en". Cada rubro nuevo obligaba a editar todos esos lugares y dejaba textos desactualizados.

La regla desde ahora:

- **Se describe la categoría y los rubros van como ejemplos.** Citara es para negocios con cita previa; los rubros son ejemplos ("por ejemplo", "como").
- **Nunca se cuentan rubros ni se escribe "hoy funciona en".**
- **Nunca se promete que Citara ya funciona para rubros que no están configurados.** Por eso "por ejemplo", y no "entre otros".

`lib/verticals.ts` es la única fuente de los rubros del sitio. Agregar un rubro debe ser agregar una entrada, sin tocar componentes.

```ts
export type Vertical = {
  id: string;               // 'spa' | 'fisioterapia' | 'depilacion-laser'
  tab: string;              // etiqueta de la pestaña
  name: string;             // título del panel
  subtitle: string;
  description: string;
  tags: string[];
  tone: string;             // variable CSS del fondo del panel (tokens de rubros)
  example: {
    business: string;       // "Tu spa", "Tu centro de fisioterapia", "Tu clínica"
    initial: string;
    messages: { from: 'cliente' | 'citara'; text: string }[];
    handoff?: string;       // aviso de paso al equipo, si aplica
  };
};
```

El contenido sale de `cambios-2/referencias/lienzo/Rubros.dc.html`:

| Pestaña | Título | Subtítulo | Etiquetas |
|---|---|---|---|
| Spas | Spas | Más calma, también en recepción. | Masajes · Servicios · Cabinas |
| Fisioterapia | Centros de fisioterapia | La agenda acompaña cada sesión. | Pacientes · Sesiones · Profesionales |
| Depilación láser | Depilación láser | Cada sesión tiene su espacio. | Sesiones · Horarios · Equipo |

Las descripciones son las de la grilla anterior de `app/page.tsx`. Conversaciones de ejemplo:

- **Spa:**
  - Cliente: "Hola, ¿tienen masaje relajante el sábado en la tarde?"
  - Citara: "¡Hola! El sábado tengo 3:00 p. m. o 4:30 p. m. en la cabina 2. ¿Cuál prefieres?"
  - Cliente: "La de las 3:00 p. m."
  - Citara: "Listo. Tu masaje quedó para el sábado a las 3:00 p. m."
- **Fisioterapia:**
  - Cliente: "Buenas, necesito agendar mi próxima sesión con Juliana."
  - Citara: "Claro. Juliana tiene espacio el martes a las 7:00 a. m. o a las 6:00 p. m. ¿Cuál te sirve?"
  - Cliente: "Martes a las 7:00 a. m., por favor."
  - Citara: "Hecho. Tu sesión con Juliana quedó para el martes a las 7:00 a. m."
- **Depilación láser:**
  - Cliente: "Hola, quiero agendar mi sesión de depilación láser."
  - Citara: "¡Hola! Tengo el jueves a las 11:00 a. m. o a las 5:30 p. m. ¿Cuál prefieres?"
  - Cliente: "¿La sesión duele?"
  - Citara: "Esa pregunta la responde el equipo de la clínica. Ya les paso tu mensaje."
  - Aviso: "Pasa a tu equipo · Por atender"

## 13. Sección "Citara habla el idioma de tu negocio" (`#para-quien`)

*Anexo 1.* Referencias: `cambios-2/referencias/lienzo/Rubros.dc.html` (escritorio) y `RubrosMovil.dc.html` (móvil).

- **Encabezado:** se conservan el eyebrow y el título. El párrafo de la derecha pasa a ser: "Cada negocio con cita previa agenda a su manera: con sus servicios, sus profesionales y sus horarios. Citara trabaja con los tuyos. La atención profesional sigue en manos de tu equipo."
- **Pestañas en lugar de la grilla de tres tarjetas:**
  - Se generan desde `lib/verticals.ts`, precedidas por el texto "Por ejemplo:".
  - Forma de píldora. La seleccionada lleva fondo pizarra y texto blanco verdoso; las demás, fondo blanco, borde `#7C8891` (3,57:1) y texto pizarra.
  - Se acomodan en varias líneas si hacen falta. Sin números.
- **Panel:**
  - En escritorio, dos columnas: a la izquierda el título en Lora de 44 px, subtítulo, descripción y etiquetas en píldoras; a la derecha la tarjeta de chat de ejemplo.
  - Debajo del chat, la leyenda "Conversación de ejemplo".
  - Fondo según el tono del rubro (tokens `--rubro-*`), radio de 16 px.
  - En móvil, todo apilado (título de 32 px).
- **Accesibilidad:** patrón de pestañas WAI-ARIA completo.
  - `role="tablist"`, `tab` y `tabpanel`, con `aria-selected` y `aria-controls`.
  - `tabindex` itinerante; flechas izquierda y derecha, Inicio y Fin.
- **Sin JavaScript** (HTML estático): se muestran todos los paneles apilados, y las pestañas aparecen cuando el JS toma el control. Es el mismo criterio de "versión sin fijar hasta que el JS decida" que usan `BusyDay` y `ProductDemo`.
- **Movimiento:**
  - Al cambiar de pestaña, los mensajes entran escalonados: 0,38 s cada uno, con 0,16 s de separación.
  - Sin reproducción automática y sin animación ligada al scroll.
  - Con `prefers-reduced-motion`, sin animación.
- **Tarjeta de ventas:** se conserva el diseño de la sección 6. Texto nuevo: "Si tu negocio trabaja con citas, cuéntanos cómo agendas hoy y vemos juntos si Citara encaja."
- **Limpieza:** se eliminan los estilos de la grilla anterior (`.sector-grid`, `.sector-index`, `.sector-foot`).

## 14. Textos sin lista fija en el resto del sitio

*Anexo 1.*

| Archivo | Texto nuevo |
|---|---|
| `app/page.tsx`, pregunta "¿Sirve para mi tipo de negocio?" | "Citara está pensada para negocios que trabajan con cita previa, como spas, centros de fisioterapia y clínicas de depilación láser. Si el tuyo es de otro tipo, conversemos para evaluar el caso." |
| `app/ventas/page.tsx` | "Si tu negocio trabaja con citas pero no se parece a nuestros ejemplos, primero evaluamos tu caso contigo." |
| `app/layout.tsx`, `description` | "Citara agenda, confirma, reprograma y cancela citas por WhatsApp para negocios con cita previa en Colombia, como spas, centros de fisioterapia y clínicas de depilación láser." |
| `CLAUDE.md` | Describir el producto como agente de agendamiento para negocios con cita previa, con los tres rubros como ejemplos |
| `README.md` | "rubros actuales" → "rubros de ejemplo" |

Los ejemplos ilustrativos de `components/BusyDay.tsx` (mensajes y citas de ejemplo) no son listas de rubros y se quedan como están.

## 15. Video v2

*Anexo 1.* Archivos en `cambios-2/video/`:

- `citara-video-v2.mp4`: 61 s, 1080p, 12,4 MB, -16 LUFS. Tiene la narración actualizada, música nueva y la escena de rubros nueva.
- `citara-video-v2.es.vtt`
- `citara-video-v2-portada.jpg`

Pasos:

1. Copiar los tres archivos a `public/video/`.
2. Actualizar los valores por defecto de `site.video`, `site.videoCaptions` y `site.videoPoster` en `lib/site.ts`.
3. Borrar los tres archivos v1 de `public/video/`.
4. **No reemplazar los archivos v1 con el mismo nombre.** `firebase.json` sirve `/video/**` con `Cache-Control: public,max-age=31536000,immutable`, así que cualquier navegador o CDN que ya tenga la v1 la seguiría mostrando durante un año. El nombre nuevo es lo que hace llegar la v2. Toda versión futura del video debe llevar también un nombre nuevo.
5. Actualizar las menciones a la v1 en este documento y en `CLAUDE.md`.

Criterios de aceptación del anexo:

- `npm run check` pasa.
- `grep -rniE "tres rubros|hoy funciona en" app components lib` no devuelve nada.
- Las pestañas se operan solo con teclado; sin JavaScript se ven los tres paneles; con movimiento reducido no hay animaciones.
- Sin desbordamiento horizontal a 320, 360, 390 y 430 px.
- La ventana del video reproduce la v2 con sus subtítulos.
- En `public/video/` solo quedan los archivos v2.
- `docs/VALIDACION.md` registra solo las comprobaciones que realmente se ejecutaron.
