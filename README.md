# Citara web

Sitio comercial de Citara. Next.js App Router + TypeScript + Tailwind CSS. Node **22.16.0**, npm y exportación estática para Firebase Hosting. Rama local: `main`.

## Ejecutar

```bash
nvm use
npm ci
npm run dev
```

Producción local:

```bash
npm run build
npm run preview
# http://localhost:3000
```

`npm run typecheck` valida TypeScript. El wrapper de desarrollo acepta también las opciones del visor supervisado sin cambiar Next.js por otro framework.

## Páginas

- `/`: propuesta comercial, problema, demo ilustrativa, rubros actuales, prueba y preguntas frecuentes.
- `/planes/`: mensual, trimestral, semestral, anual e implementación.
- `/prueba/`: explicación de activación y espacio reservado para el formulario solicitado aparte.
- `/ventas/`: WhatsApp o aviso de número pendiente.
- `/privacidad/`, `/terminos/`: estructuras legales, explícitamente pendientes de aprobación.

## Información pendiente

En `lib/site.ts` están las tarifas (totales en COP por período), el precio de implementación y su alcance. **No hay cifras inventadas.** El equivalente mensual es total / meses; el ahorro es mensual × meses − total del período. Todos los planes van a pedir la prueba, sin checkout.

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_SALES_WHATSAPP`: número de Citara en formato internacional, solo dígitos. Si falta, el botón dirige al aviso de ventas. El mensaje prellenado está en `site.salesMessage`.
- `NEXT_PUBLIC_PRODUCT_VIDEO_URL`: opcional. Por defecto el video del producto (`public/video/citara-video-v1.mp4`, 60 s, 12 MB) se sirve desde Firebase Hosting con caché larga; el nombre lleva versión, así que una versión nueva debe usar otro nombre. Se abre en una ventana desde la portada del hero y no se descarga hasta que alguien la abre.
- `NEXT_PUBLIC_PRODUCT_VIDEO_CAPTIONS_URL`: opcional. Por defecto, `public/video/citara-video-v1.es.vtt` (subtítulos en español).

Las variables públicas se incorporan durante el build: recompilar después de cambiarlas. Falta el formulario por petición expresa; no se registra ningún lead ni se hace pasar una solicitud por enviada. La Cloud Function correspondiente se añadirá en **citara-prod**, con una reescritura `/api/...` del Hosting `marketing`, cuando se defina el formulario; no hay una función vacía desplegada ni un endpoint fingido.

La prueba dura 7 días, sin tarjeta, y empieza cuando el agente contesta en el número del negocio, después de coordinar la conexión.

## Firebase: sitio comercial separado del panel

El panel existente usa `citara-prod.web.app`. **No desplegar este export sobre ese sitio**, porque sustituiría el panel. Se usa el mismo proyecto Firebase `citara-prod`, con otro sitio de Hosting y el target `marketing`.

En una sesión autenticada de Firebase CLI:

```bash
firebase login
firebase hosting:sites:list --project citara-prod
# Crear un sitio comercial con un ID disponible; sustituye SITE_ID_COMERCIAL.
firebase hosting:sites:create SITE_ID_COMERCIAL --project citara-prod
firebase target:apply hosting marketing SITE_ID_COMERCIAL --project citara-prod
npm run build
npm run deploy
```

`npm run deploy` se detiene si falta la asignación o si apunta a `citara-prod`. No hay despliegue automático en cada push. El proyecto solo contiene el target comercial, no altera la configuración del repositorio del panel. `firebase.json` tiene rutas estáticas y caché inmutable para los bundles con hash; no usa una reescritura SPA que rompa los 404.

## GitHub

Repositorio privado: `https://github.com/andresdav26/citara-web`, rama `main`. Separado del repositorio del agente y del panel existente.

Para obtener una copia desde una sesión autenticada:

```bash
gh repo clone andresdav26/citara-web
```

CI valida tipos, compila y conserva el export como artefacto. No despliega en Firebase.

## Rendimiento

HTML prerenderizado, SVG ligeros, tipografías WOFF2 locales, sin fotos pesadas, trackers ni embeds externos al inicio. El video usa `preload="none"`; la demo no hace peticiones a WhatsApp ni al backend. Se respeta `prefers-reduced-motion` y el video no se reproduce solo.

El fondo del hero (`components/HeroFlow.tsx`, con el dibujo en `lib/hero-flow.ts`) son cuerdas animadas en Canvas 2D, sin librerías ni archivos que descargar. Dibuja en un Web Worker con `OffscreenCanvas`, así que el dibujo no bloquea la página; en navegadores sin `OffscreenCanvas` corre en la página. Arranca cuando el navegador queda libre, dibuja a unos 30 cuadros por segundo, se detiene fuera de pantalla, con `prefers-reduced-motion` queda un cuadro quieto sin destellos y, sin Canvas 2D, se ve el fondo pizarra liso.

Las secciones "El día no tiene más horas" (`components/BusyDay.tsx`) y "Dos lados de una misma cita" (`components/ProductDemo.tsx`) se fijan al scroll con `position: sticky` y un solo listener pasivo (`lib/pinned.ts`). El HTML estático, el movimiento reducido y las pantallas bajas muestran la versión sin fijar.

**Lighthouse móvil ≥90: medido en local, no contra Firebase.** Ver `docs/VALIDACION.md`. `npm run preview` sirve los archivos sin comprimir y Firebase Hosting sí los comprime, así que el puntaje de rendimiento del preview local sale más bajo que el real (75 contra 96 con gzip en la misma compilación). Para medir el export servido, con Chrome instalado:

```bash
npm run build
npm run preview
# En otra terminal:
npm run audit:mobile
```

El comando genera `qa/lighthouse-mobile.report.html` y `.report.json`; `npm run audit:check` falla si rendimiento es menor de 90. Ejecutar en inicio y planes, y nuevamente contra Firebase. El resultado de laboratorio no garantiza la velocidad de todas las conexiones en Colombia.

## Identidad

`public/brand/` contiene el logo final, solo en su versión gruesa:

- `citara-claro.svg`: pizarra y ámbar, para fondos claros (header y maquetas del producto).
- `citara-oscuro.svg`: blanco verdoso y ámbar, para fondos oscuros (pie).
- `citara-simbolo-claro.svg` y `citara-simbolo-oscuro.svg`: solo el símbolo.

`public/icon.svg` es el favicon: el símbolo sobre un cuadrado redondeado pizarra. Todos son trazos vectoriales, sin elementos `<text>`, imágenes incrustadas ni fuentes necesarias. Se vectorizaron a partir de una imagen; más adelante conviene un redibujo profesional. Se pronuncia ci-TA-ra, palabra llana y sin tilde. Eslogan: "Tu agenda en orden. Tu negocio, a otro ritmo." Las seis exploraciones anteriores y la página `/identidad/` se retiraron; quedan en el historial de git.

Los WOFF2 locales están bajo OFL; licencias en `docs/licenses/`. No se ha realizado una búsqueda de registro marcario.

## Antes de publicación comercial

Completar número, precios, implementación y textos legales; definir el formulario aparte; conectar GitHub/Firebase; medir Lighthouse; retirar `robots: { index: false, follow: false }` en `app/layout.tsx` una vez aprobados los contenidos.
