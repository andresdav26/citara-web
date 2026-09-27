# Ajuste tipográfico — 26 de septiembre de 2026

Base: feature/interactive-demo, commit c93038e179e52a9b53e977d3973413400a6daa14.
Referencia visual: cinco capturas móviles de Freshworks aportadas por el propietario.

- Lora sustituye a Cormorant en titulares, cifras y títulos editoriales.
- Titulares a peso 400, énfasis en cursiva real a 700 y subtítulos a 500.
- DM Sans continúa en párrafos, controles y maquetas del panel.
- Escala e interlineado adaptados para móvil y escritorio, en app/typography.css.
- WOFF2 locales con caracteres españoles, licencia OFL incluida. Se actualiza la precarga.
- Lora aproxima la apariencia de las capturas; no se afirma que sea la fuente de Freshworks.
- No se cambian textos, páginas, animaciones ni componentes de producto.

Validación: TypeScript y exportación estática correctos con Node 22.16.0.
Los anchos del primer renglón del hero se comprobaron con las métricas de Lora
para 320, 360, 390 y 430 px y caben en el espacio disponible.
La inspección visual en navegador sigue pendiente: la vista previa local fue
bloqueada con ERR_BLOCKED_BY_CLIENT. No se ha ejecutado Lighthouse en esta revisión.
