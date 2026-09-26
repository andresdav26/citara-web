# Citara web

Sitio comercial de Citara. Next.js App Router + TypeScript + Tailwind CSS + Framer Motion. Node **22.16.0**, npm y exportación estática para Firebase Hosting. Rama local: `main`.

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
- `/identidad/`: seis direcciones de marca, con descargas SVG.

## Información pendiente

En `lib/site.ts` están las tarifas (totales en COP por período), el precio de implementación y su alcance. **No hay cifras inventadas.** El equivalente mensual es total / meses; el ahorro es mensual × meses − total del período. Todos los planes van a pedir la prueba, sin checkout.

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_SALES_WHATSAPP`: número de Citara en formato internacional, solo dígitos. Si falta, el botón dirige al aviso de ventas. El mensaje prellenado está en `site.salesMessage`.
- `NEXT_PUBLIC_PRODUCT_VIDEO_URL`: MP4 real del producto, preferiblemente alojado en Firebase. Sin él se muestra la demo ilustrativa y un aviso visible. No es una grabación del sistema real.
- `NEXT_PUBLIC_PRODUCT_VIDEO_CAPTIONS_URL`: subtítulos WebVTT en español.

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

HTML prerenderizado, SVG ligeros, tipografías WOFF2 locales, sin fotos pesadas, trackers ni embeds externos al inicio. El video usa `preload="none"`; la demo no hace peticiones a WhatsApp ni al backend. Se respeta `prefers-reduced-motion` y no se inicia reproducción automática.

**El objetivo Lighthouse móvil ≥90 todavía no está certificado.** El entorno permitió inspección visual e interacciones, pero no una auditoría Lighthouse móvil de producción. No se inventa un resultado. Para medir el export servido, con Chrome instalado:

```bash
npm run build
npm run preview
# En otra terminal:
npm run audit:mobile
```

El comando genera `qa/lighthouse-mobile.html` y `.json`; `npm run audit:check` falla si rendimiento es menor de 90. Ejecutar en inicio y planes después de incorporar el video real y nuevamente contra Firebase. El resultado de laboratorio no garantiza la velocidad de todas las conexiones en Colombia.

## Identidad

`public/brand/` contiene 18 SVG: 6 direcciones × claro/oscuro/monocromo. Todos los nombres son trazos vectoriales; no hay elementos `<text>`, imágenes incrustadas ni fuentes necesarias para usarlos. El logo aplicado provisionalmente es **01 Cuerdas**. Para cambiarlo, sustituir `citara.svg` y `citara-light.svg` por la dirección seleccionada.

- **Cuerdas**: lettering original; una t como puente del instrumento.
- **Contrapunto**: contraste editorial y travesaño doble.
- **Armonía**: dos A construidas con cuerdas.
- **Enlace**: gesto que une i y t.
- **Resonancia**: serif de alto contraste y vibración dentro de la c.
- **Compás**: construcción compacta, cortes de cuerda y pulso.

Los WOFF2 locales y las bases de algunos contornos están bajo OFL; licencias en `docs/licenses/`. Los SVG contienen adaptaciones gráficas, no archivos de fuente modificados. No se ha realizado una búsqueda de registro marcario.

## Antes de publicación comercial

Completar número, precios, implementación, video real y textos legales; definir el formulario aparte; conectar GitHub/Firebase; medir Lighthouse; retirar `robots: { index: false, follow: false }` en `app/layout.tsx` una vez aprobados los contenidos. La vista de identidad sigue siendo noindex y no aparece en la navegación comercial.
