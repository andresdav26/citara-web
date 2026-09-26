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

Precios y cobro único; alcance de implementación; número de WhatsApp; video real y subtítulos; aprobación de textos legales; formulario y su función (solicitados aparte); selección final del logo.

## Fuentes de contexto

- Brief del usuario y lámina adjunta de propuestas previas.
- Repositorio `andresdav26/Citara`: README, prompts de conversación, agenda del panel y configuración Firebase, consultados por GitHub.
- `andresdav26/citara-legal/privacidad.html`: describe una fase de pruebas; no se trasladó como política comercial definitiva.
- Referencia visual: https://www.freshworks.com/latam/freshdesk/
- Export estático: https://nextjs.org/docs/app/guides/static-exports
- Hosting separado dentro del mismo proyecto: https://firebase.google.com/docs/hosting/multisites
