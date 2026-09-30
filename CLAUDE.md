# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Citara's marketing site (Spanish, `lang="es-CO"`). The product is a WhatsApp scheduling agent for businesses that work by appointment in Colombia; spas, physiotherapy centers and laser hair removal clinics are examples, not a closed list. Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4, statically exported and hosted on Firebase. The README is in Spanish and is the reference for business context, deployment and anything still pending.

## Commands

Node 22.16.0 is required (`.nvmrc`, `engines: >=22 <23`). Use npm.

```bash
nvm use && npm ci
npm run dev          # scripts/dev.mjs → `next dev --webpack` (maps --host→--hostname, drops --strictPort)
npm run typecheck    # tsc --noEmit
npm run build        # next build --webpack → static export in out/
npm run check        # typecheck + build (what CI runs; must pass before committing)
npm run preview      # serves out/ on :3000 (PORT env) with 404.html fallback
npm run audit:mobile # Lighthouse mobile against localhost:3000 (optional URL arg) → qa/lighthouse-mobile.report.*
npm run audit:check  # fails if Lighthouse performance < 90 (preview serves uncompressed files, so it scores lower than Firebase)
```

There is no test suite and no linter. Validation means `npm run check`, plus manual browser checks at mobile widths (320/360/390/430 px).

Webpack is used on purpose (`--webpack` in both dev and build). Keep it that way unless asked to change.

## Architecture

- **Static export only.** `next.config.ts` sets `output: 'export'`, `trailingSlash: true` and `images.unoptimized`. Server features (API routes, server actions, middleware, dynamic rendering) are not available. Internal links use trailing slashes (`/planes/`). A future lead form will be a Cloud Function in the `citara-prod` project behind a `/api/...` Hosting rewrite. Do not add a fake endpoint or stub.
- **Content and config live in `lib/site.ts`.** It holds the `site` settings, the `plans` array, the `money()` COP formatter and `salesHref`. Prices, the implementation price and the implementation scope are deliberately `null` or empty, and the UI shows an explicit pending notice for them. **Never invent prices, figures, WhatsApp numbers or legal text.** `salesHref` falls back to `/ventas/` when `NEXT_PUBLIC_SALES_WHATSAPP` is missing or invalid.
- **Verticals live in `lib/verticals.ts`.** It is the single list of example verticals (tab, panel copy, tags, `--rubro-*` tone and example chat). Adding one means adding an entry, not editing components. In copy, describe the category (businesses that work by appointment) and give verticals only as examples ("por ejemplo", "como"). Never count them, never write "hoy funciona en", and never imply Citara already works for a vertical that is not configured (REDISENO.md §12 and §14).
- **Env vars are `NEXT_PUBLIC_*` and are inlined at build time** (see `.env.example`). Rebuild after changing them.
- **Styling is mostly hand-written CSS, not Tailwind utility classes.** `app/globals.css` imports Tailwind and defines `@font-face`, a small `@theme`, the `:root` color tokens of the 2026 palette (ámbar, blanco verdoso, salvia, petróleo, pizarra and their derivatives) and nearly all component classes as dense single-line rules. Use tokens, never hard-coded colors, and follow the contrast rules in `docs/rediseno/REDISENO.md` §1. `app/typography.css` is imported after it and overrides the type scale and breakpoints, so the order matters. Fonts are local WOFF2 files in `public/fonts/`: DM Sans for body text and Lora for headings. The Cormorant files are legacy and no longer loaded.
- **Code style is compact.** Many files (`app/page.tsx`, `components/ui.tsx`, `Header.tsx`, `globals.css`, `scripts/*.mjs`) put a whole component or rule set on one line. Newer components (`ProductDemo.tsx`, `HeroFlow.tsx`, `Reveal.tsx`) are formatted normally. Match the style of the file you edit. The `@/*` path alias maps to the repo root.
- **Client components.** `Reveal` is an IntersectionObserver fade-in wrapper with a `delay` prop; do not wrap the hero copy in it (it is the LCP). `BusyDay` is the scroll-pinned "El día no tiene más horas" section. `ProductDemo` is "Dos lados": a pinned stage with the scene pulse on wide desktop (≥ 1100 px), a pinned one-column stage on phones and tablets (`ProductDemoMobile.tsx`, REDISENO.md §16), and the step-by-step tour under reduced motion, on screens under 600 px tall and in the static HTML. The mobile stage reuses the scene data and `stageAt` from `ProductDemo.tsx` and has its own `.tour-mobile*` styles; the desktop `Stage` and `.tour-stage*` styles are separate. Both use `lib/pinned.ts` and render their unpinned version until JS decides otherwise. `Verticals` renders `lib/verticals.ts` as WAI-ARIA tabs; the static HTML shows every panel stacked until JS takes over, and the example messages animate only on a tab change. `VideoDialog` is the hero play button and the video `<dialog>`; the `<video>` mounts on first open. Everything is illustrative and makes no network calls. There is no animation library.
- **Hero background.** `components/HeroFlow.tsx` → `lib/hero-flow.ts` (animated strings in Canvas 2D, no libraries, ~30 fps) → `lib/hero-flow.worker.ts`. When `OffscreenCanvas` is available the canvas is transferred to a Web Worker, created with `new Worker(new URL(..., import.meta.url))`. Otherwise it renders on the main thread. It pauses when off-screen, draws a single still frame without pulses under `prefers-reduced-motion`, and leaves the plain background when Canvas 2D is unavailable. Keep all of these fallbacks.
- **Performance and accessibility constraints** from the README: no trackers or external embeds on first load, video uses `preload="none"` and never autoplays, `prefers-reduced-motion` is respected everywhere, and the target is Lighthouse mobile ≥ 90 (not yet certified).
- **SEO is off on purpose.** `robots: { index: false, follow: false }` in `app/layout.tsx` stays until the commercial content and legal copy are approved.
- **Brand and video assets.** `public/brand/` holds only the final logo (`citara-claro.svg`, `citara-oscuro.svg` and the two symbols); `public/icon.svg` is the favicon. The product video, captions and poster live in `public/video/` and are the defaults of `site.video`, `site.videoCaptions` and `site.videoPoster`; the env vars override them.

## Deployment

- `firebase.json` uses the Hosting target `marketing` and serves `out/`. The Firebase project is `citara-prod`, whose default site `citara-prod.web.app` is the **existing product panel. Never deploy this site there.**
- `npm run deploy` (`scripts/deploy.mjs`) refuses to run unless `.firebaserc` maps `marketing` to a separate site other than `citara-prod`. Do not weaken this guard.
- CI (`.github/workflows/ci.yml`) runs typecheck and build on push and PR, then uploads `out/` as an artifact. It never deploys.

## Conventions

- UI copy and code comments are in Spanish. Commit messages are in English.
- Record validation results honestly in `docs/` (see `VALIDACION.md` and `TIPOGRAFIA.md`). Never claim a Lighthouse score or a browser check that was not actually run.
- `docs/rediseno/REDISENO.md` is the approved redesign spec (tracked). The rest of `docs/rediseno/` (prototypes, captures, brand sources, video sources) is local and gitignored. The redesign was implemented on the `redesign/brand-2026` branch; its section 9 decisions are settled.
