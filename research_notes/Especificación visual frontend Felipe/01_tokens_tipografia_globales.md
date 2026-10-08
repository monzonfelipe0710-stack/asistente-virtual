# Sistema de diseño global (tokens, tipografía, color, radios, sombras, motion, spacing, breakpoints, tema) — ChatAP, rama `dev-felipe`

Conventions used in this file
- Fuente única de verdad leída: checkout local de `dev-felipe` (HEAD `b9b83c4 arreglo de banner y de recuperar tu contraseña`). Todas las rutas son relativas a la raíz del repo; `CSS` = `src/index.css` (3254 líneas, leído completo, líneas 1-3254), `HTML` = `index.html`, `DM` = `DESIGN.md`, `PM` = `PRODUCT.md`, `VD` = `docs/chatap-visual-direction.md`, `RP` = `docs/reference-reimplementation-plan.md`.
- `px = rem × 16`. El root font-size NO se define en ningún lado (el bloque `html {}` en CSS:187-193 no tiene `font-size`; `HTML` tampoco) → es el default del navegador, 16 px. Para móvil nativo: 1rem = 16 pt/dp.
- `[TW]` = valor que NO está en el repo sino en el default de Tailwind CSS v4 (`tailwindcss ^4.3.0`, `package.json:148`; lock `package-lock.json:2806-2807` = 4.3.0). `node_modules` no está instalado en el checkout, así que los valores `[TW]` son conocimiento del framework, no verificados contra su código fuente aquí.
- Convención de cuál manda: **el código (`CSS`) manda sobre `DM`, `VD` y `RP`**. Los tres documentos están desactualizados o describen intención distinta del código (ver sección 1).
- Citas a "Source" en el formato de investigación se expresan como `archivo:línea` porque la fuente es código local, no páginas web.

---

## 1. Jerarquía de fuentes de verdad y contradicciones entre documentos y código

### Takeaway
`src/index.css` es el único archivo con valores reales; `DESIGN.md`, `docs/chatap-visual-direction.md` y `docs/reference-reimplementation-plan.md` contradicen el CSS en colores, radios, botones, tipografía y sidebar. Para replicar la UI hay que usar los valores del CSS (secciones 2-9) y tratar los documentos solo como declaración de intención.

### Cited Findings
Tabla de contradicciones (CSS = lo que realmente se renderiza):

| Tema | Valor real en CSS | Lo que dice el documento | Veredicto |
|---|---|---|---|
| Tipografía | PP Neue Montreal + PP Neue Montreal Text cargadas por `@font-face` locales (CSS:3-73), `--font-sans` (CSS:78) | DM:86 "No webfont is loaded (CSP blocks external fonts)"; DM:209 "Don't add webfonts" | DM obsoleto. VD:25 sí dice "Mantener PP Neue Montreal y PP Neue Montreal Text". |
| Paper claro | `#F0F4F9` (CSS:85) | DM:27,49 `#EDF1F9` | usar `#F0F4F9` |
| Paper oscuro | `#070E20` (CSS:161) | DM:49 `#0A1124` | usar `#070E20` |
| Mist L/D | `#E2EAF4` / `#0D1730` (CSS:86,162) | DM:50 `#E3E9F6` / `#111B34` | usar CSS |
| Soft L/D | `#D5E2F1` / `#132247` (CSS:87,163) | DM:51 `#D8E1F2` / `#0C1530` | usar CSS |
| Line | `rgba(15,23,48,0.12)` / `rgba(234,240,250,0.12)` (CSS:88,164) | DM:52 alpha `.14` | usar 0.12 |
| Muted L/D | `#4A5578` / `#8A9BC0` (CSS:89,165) | DM:55 `#4A5676` / `#A2AEC7` | usar CSS |
| Faint L/D | `#7E8BA7` / `#4E5F85` (CSS:90,166) | DM:56 `#8490AE` / `#6A7590` | usar CSS |
| Brand-dark L/D | `#2558E0` / `#3A6AE0` (CSS:105,168) | DM:43 `#2657D8` / `#3A68F2` | usar CSS |
| Brand-deep dark | `#2F55C0` (CSS:169) | DM:44 `#2A55D6` | usar CSS |
| Primary-light L/D | `#EBF2FF` / `#0D1B40` (CSS:117,176) | DM:45 `#E1E9FF` / `#13264E` | usar CSS |
| Primary-lighter L/D | `#F5F8FF` / `#091230` (CSS:118,177) | DM:46 `#F2F6FF` / `#0C1A38` | usar CSS |
| ok / warn / bad | `#18bc42` / `#efc21e` / `#d82f2f` iguales en ambos temas (CSS:107-109,170-172) | DM:65-67 ok `#1FA45C`/`#2FBF71`, warn `#E29C2C`/`#EEB253`, bad `#E24A4F`/`#F26067` | usar CSS |
| Brand | `#2F6BFF` / `#4D7DFF` (CSS:104,167) | DM:42 igual; RP:28 dice `--color-brand: #ff4000` | RP obsoleto (naranja retirado, DM:30) |
| Sidebar admin | `#141414` neutro gris, hover `#222222`, texto `#9e9e9e`, activo = `var(--color-brand)` (CSS:122-129); NO se redefine en `.dark` | DM:70-78 navy `#070E20`, hover `#101B35`, activo brand-deep | usar CSS (`AdminSidebar.jsx:107-189` consume `var(--sidebar-*)`) |
| Sidebar ancho | `280px` / colapsado `72px` (CSS:131-132) | DM:160,212 `272px` / `64px`; VD:201 "240px-280px", rail "64px-72px" | usar CSS |
| Radio control | `--radius-control: 9999px` (pill) (CSS:134) | DM:32,125 `10px`; VD:133 "6-10px"; RP:28 `0px` | usar CSS |
| Radio card | `--radius-card: 1.25rem` = 20px (CSS:135) | DM:32,128 `14px` | usar CSS |
| Escala de radios | sm 6 / md 8 / lg 12 / xl 16 / 2xl 20 / 3xl 28 (CSS:138-143) | DM:124-127 sm 4 / md 6 / lg 8 / xl 12 / 2xl 16 / 3xl 20 | usar CSS |
| Sombras | `--shadow-soft: none; --shadow-hover: none;` (CSS:151-152); `.card` sin sombra (CSS:1088-1091) | DM:114-119 `shadow-sm/md/lg` en cards/modales | usar CSS: cards planas |
| Botones | `.btn*` = pill 9999px, `text-xs` bold, UPPERCASE, tracking (CSS:1112-1133) | DM:133-136 `rounded-xl`, semibold, "sentence case — no uppercase" | usar CSS |
| Hover btn-primary | bg `#EBEBEB`, texto `#1A1A1A` (CSS:1120,1126) | DM:133 `hover:bg-brand-dark hover:-translate-y-0.5` | usar CSS |
| Tema por defecto | **dark** (`HTML:26-40`) | RP:30 y RP:88,101 "tema claro por defecto" (a corregir en el plan) | el código es dark por defecto hoy |
| Intención "sin pills/sin glass" | `.bubble-chip`, `.chatap-pill-btn`, `.nav-pill`, `.hud-glass-badge` etc. son 9999px; hay `backdrop-filter` (CSS:2371,2386,3182) | VD:139,465-466; PM:125 "light backdrop-blur only on sticky header" | el código implementa pills + blur; los docs piden lo contrario |

### Inferences
- El diseño efectivo es una mezcla: (a) sistema "Azul de Estado" con radios redondos y botones pill (CSS), (b) capa editorial/mono heredada del plan de reimplementación (labels mono en MAYÚSCULAS con tracking ancho). Para un clon móvil usar CSS tal cual y no los docs.

### Gaps
- No se trazó qué componente JSX consume cada clase CSS (fuera de alcance de esta tarea); por eso las tablas indican "clase" y no "pantalla".
- `src/components/common/*.css` (BannerCarousel, ScrollFloat, LogoLoop, ASCIIText, ScrollExpand, HeroCinematicBackground, GooeyNav) y `src/pages/HomePage.css` (458 líneas) existen e importan estilos propios de la landing (p. ej. `HomePage.css:159` `font-size: clamp(2.25rem, 5.2vw, 4.75rem)`, `:207` `clamp(3.45rem, 16vw, 5.5rem)`); NO fueron leídos íntegros por estar fuera de "global design system". Sus valores no están en este documento.

---

## 2. Familias tipográficas, archivos y pesos

### Takeaway
Una sola familia con dos "cortes": **PP Neue Montreal** (display, UI, títulos) y **PP Neue Montreal Text** (lectura/nav-links/notas), más una pila mono de sistema (sin archivo) para micro-etiquetas. Los archivos son 10 `.woff2` locales; solo existen los pesos 250, 350, 400, 500, 600, 700, 900 + itálica 400 (Neue) y 400/500 (Text).

### Cited Findings
Stacks (`@theme`, CSS:77-81):

| Token | Valor exacto | Línea |
|---|---|---|
| `--font-sans` | `"PP Neue Montreal", "PP Neue Montreal Text", ui-sans-serif, system-ui, -apple-system, sans-serif` | CSS:78 |
| `--font-neue` | `"PP Neue Montreal", sans-serif` | CSS:79 |
| `--font-neue-text` | `"PP Neue Montreal Text", sans-serif` | CSS:80 |
| `--font-mono` | `ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, "Liberation Mono", monospace` | CSS:81 |
| body | `font-family: var(--font-sans)` + `@apply ... font-sans antialiased` | CSS:196-197 |
| body extras | `text-rendering: optimizeLegibility; font-feature-settings: "cv03", "cv04", "cv09", "cv11";` (alternates estilísticos de la fuente) | CSS:198-199 |
| `.display-*`, `.lead`, `.section-kicker`, `.specimen-tag`, `.giant-outline` | `font-family: "PP Neue Montreal", sans-serif` | CSS:1372,1382,1394,1403,1427,1492 |
| `.editorial-text` | `"PP Neue Montreal Text", "PP Neue Montreal", sans-serif` | CSS:1411 |
| `.font-neue` / `.font-neue-text` utilities | familias respectivas | CSS:1418-1419 |

`@font-face` (todas `font-display: swap`, ruta `/fonts/…`, formato woff2):

| Family | Archivo | font-weight | font-style | Líneas CSS | Tamaño archivo |
|---|---|---|---|---|---|
| PP Neue Montreal | PPNeueMontreal-Thin.woff2 | 250 | normal | 4-10 | 77 364 B |
| PP Neue Montreal | PPNeueMontreal-Book.woff2 | 350 | normal | 11-17 | 80 084 B |
| PP Neue Montreal | PPNeueMontreal-Regular.woff2 | 400 | normal | 18-24 | 77 236 B |
| PP Neue Montreal | PPNeueMontreal-Medium.woff2 | 500 | normal | 25-31 | 83 592 B |
| PP Neue Montreal | PPNeueMontreal-Semibold.woff2 | 600 | normal | 32-38 | 87 852 B |
| PP Neue Montreal | PPNeueMontreal-Bold.woff2 | 700 | normal | 39-45 | 85 360 B |
| PP Neue Montreal | PPNeueMontreal-Black.woff2 | 900 | normal | 46-52 | 90 516 B |
| PP Neue Montreal | PPNeueMontreal-Italic.woff2 | 400 | italic | 53-59 | 80 108 B |
| PP Neue Montreal Text | PPNeueMontreal-Text-Regular.woff2 | 400 | normal | 60-66 | 77 452 B |
| PP Neue Montreal Text | PPNeueMontreal-Text-Medium.woff2 | 500 | normal | 67-73 | 84 240 B |

(`ls public/fonts`: exactamente estos 10 archivos; tamaños por `ls -la`.)

- Precarga en `index.html:7-10`: Regular, Bold, Medium, Black.
- **Peso 800 se usa mucho pero no existe archivo 800** (usos: `.display-1` CSS:1376, `.reference-title` 1876, `.hero-headline` 1999, `.nav-brand-mark` 2233, `.services-count__num` 2549, `.services-row__title` 2594, `.trust-stat__val` 2794, `.tour-kicker` 1585 usa 800, `.finalcta-btn-primary` 2128 usa 800). Por la regla CSS de matching de pesos (desired > 500 → primero el siguiente peso mayor disponible), 800 se renderiza con el archivo **Black (900)**. Para móvil: mapear "800" → PP Neue Montreal Black.
- Peso 250 (Thin) y 350 (Book) están registrados pero ningún selector del CSS los pide explícitamente; sólo se activarían con utilidades Tailwind `font-light`(300→cae en 250) / `font-thin`(100→250) [TW]. No se verificó su uso en JSX.
- Mono: sin archivo, pila de sistema (en iOS resuelve `ui-monospace` = SF Mono; en Android no hay `ui-monospace` → cae a `monospace`) — inferencia sobre plataformas, no está en el repo.
- Dónde se usa cada familia:
  - PP Neue Montreal (display): `display-1/2`, `lead`, `section-kicker`, `specimen-tag`, `giant-outline`, `nav-brand-mark` (CSS:2231), `nav-brand-name` (CSS:2239), `services-count__num/row__title`, `trust-card__quote`, `trust-stat__val`, `cap-row__title` (CSS:2655).
  - PP Neue Montreal Text: `editorial-text` (CSS:1411), `nav-link` (2263), `nav-cta` (2318), `cap-row__note` (2665).
  - Body/UI por defecto: `--font-sans` (Neue primero; Text sólo como 2º fallback).
  - Mono: `mono-label`, `sec-meta`, `chat-msg__meta`, `chat-divider`, `tech-label`, `tech-badge`, `nav-tab`, `nav-profile-avatar`, `hero-btn-*`, `finalcta-btn-*`, `reference-button`, `prompt-chip`, `spec-strip__*`, `fig-num`, `eyebrows` (ver sección 3).
  - Números/estadísticas: `trust-stat__val` y `services-count__num` usan PP Neue Montreal 800 (→Black) con `letter-spacing` negativo; no hay `font-variant-numeric: tabular-nums` en todo el CSS (grep sin resultados por lectura completa).
- Selección de texto: `::selection { background: var(--color-brand); color:#ffffff }` (CSS:204-207); en `HTML:12-15` color `#ffffff` sobre `#2F6BFF`. `.band-dark ::selection` = fondo brand, texto `#070E20` (CSS:1786).

### Inferences
- "800" visual = Black. Para app nativa cargar sólo: Regular(400), Medium(500), Semibold(600), Bold(700), Black(900) (+ Text-Regular/Medium si se replica `nav-link`/`editorial-text`); Thin, Book e Italic parecen no usarse en el CSS global.

### Gaps
- No se encontró (en CSS) qué glifos activan `cv03/cv04/cv09/cv11` de la fuente; dependen del archivo woff2 (no inspeccionado).
- No se verificó el uso real de `italic` ni de `font-light/thin` en JSX.
- Línea-base `line-height: 1.5` de `<html>` y reset de `h1-h6 {font-size:inherit; font-weight:inherit}` provienen del Preflight de Tailwind [TW] (no del repo).

---

## 3. Escala tipográfica (por nivel)

### Takeaway
No hay escala "h1-h6 global": los headings heredan 16 px/peso normal (Preflight [TW]); la jerarquía se arma con utilidades `.display-1/2`, `.hero-headline`, `.reference-*`, `.lead`, `.section-kicker`, labels mono y utilidades Tailwind (`text-xs` 12 px, `text-sm` 14 px). Los tamaños fluidos usan `clamp(rem, vw, rem)`; en móvil (360-430 px) casi todos caen en el MÍNIMO del clamp.

### Cited Findings
Cálculo de clamp: valor = `min(max(ancho·vw/100, mín), máx)`. Columnas = px resultantes en 360 / 390 / 430 / 768 / 1280 / 1440 px de ancho de viewport.

**3.1 Display / títulos (PP Neue Montreal)**

| Clase | Líneas | Font-size (fórmula) | Mín px | Máx px | 360 | 390 | 430 | 768 | 1280 | 1440 | line-height | letter-spacing | peso | otros |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `.display-1` | CSS:1371-1380 | `clamp(2.75rem, 8vw, 6.5rem)` | 44 | 104 | 44 | 44 | 44 | 61.4 | 102.4 | 104 | 1.08 | -0.025em | 800 (→Black) | `text-wrap: balance` |
| `.display-2` | CSS:1381-1390 | `clamp(1.85rem, 3.8vw, 3rem)` | 29.6 | 48 | 29.6 | 29.6 | 29.6 | 29.6 | 48 | 48 | 1.2 | -0.02em | 600 | `text-wrap: balance` |
| `.hero-headline` | CSS:1995-2000 | `clamp(3.2rem, 8vw, 8rem)` | 51.2 | 128 | 51.2 | 51.2 | 51.2 | 61.4 | 102.4 | 115.2 | 0.88 | -0.055em | 800 (→Black) | |
| `.hero-lead` | CSS:2001-2004 | `clamp(0.95rem, 1.4vw, 1.1rem)` | 15.2 | 17.6 | 15.2 | 15.2 | 15.2 | 15.2 | 17.6 | 17.6 | 1.6 | — | — | |
| `.reference-title` (≥768) | CSS:1872-1877 | `clamp(4.5rem, 9.3vw, 10rem)` | 72 | 160 | 72 | 72 | 72 | 72 | 119 | 133.9 | 0.82 | -0.07em | 800 | |
| `.reference-title` (≤767) | CSS:1921 (dentro de `@media (max-width:767px)` CSS:1918) | `clamp(4rem, 18vw, 7rem)` | 64 | 112 | 64.8 | 70.2 | 77.4 | 112 | — | — | 0.82 | -0.07em | 800 | |
| `.reference-subtitle` (≥768) | CSS:1878-1883 | `clamp(1.7rem, 3.2vw, 3.55rem)` | 27.2 | 56.8 | 27.2 | 27.2 | 27.2 | 27.2 | 41 | 46.1 | 0.94 | -0.045em | 700 | |
| `.reference-subtitle` (≤767) | CSS:1922 | `clamp(1.8rem, 8vw, 3rem)` | 28.8 | 48 | 28.8 | 31.2 | 34.4 | 48 | — | — | 0.94 | -0.045em | 700 | |
| `.giant-outline` | CSS:1491-1503 | `clamp(4rem, 17vw, 15rem)` | 64 | 240 | 64 | 66.3 | 73.1 | 130.6 | 217.6 | 240 | 0.8 | -0.05em | 900 | UPPERCASE, texto transparente con `-webkit-text-stroke: 1.5px color-mix(in srgb, var(--color-ink) 25%, transparent)` (`.is-strong` → 70%, CSS:1504-1506), `white-space: nowrap` |
| `.welcome-content h1` | CSS:804-809 | `clamp(2rem, 4vw, 2.25rem)` | 32 | 36 | 32 | 32 | 32 | 32 | 36 | 36 | 1.15 | -0.025em | (heredado, sin peso fijado) | `max-width: 38rem` (608 px) |
| `.welcome-content p` | CSS:811-814 | `1rem` | 16 | 16 | 16 | | | | | | 1.6 | — | — | |
| `.services-count__num` | CSS:2546-2553 | `clamp(2.5rem, 5vw, 4rem)` | 40 | 64 | 40 | 40 | 40 | 40 | 64 | 64 | 1 | -0.05em | 800 | color `rgba(243,241,233,0.15)` |
| `.services-row__title` | CSS:2590-2599 | `clamp(1.6rem, 4.5vw, 3rem)` | 25.6 | 48 | 25.6 | 25.6 | 25.6 | 34.6 | 48 | 48 | 1 | -0.04em | 800 | color `#EAF0FA` |
| `.trust-stat__val` | CSS:2791-2798 | `clamp(1.6rem, 3vw, 2.25rem)` | 25.6 | 36 | 25.6 | 25.6 | 25.6 | 25.6 | 36 | 36 | 1 | -0.045em | 800 | |
| `.trust-card__quote` | CSS:2754-2763 | `clamp(1rem, 1.6vw, 1.25rem)` | 16 | 20 | 16 | 16 | 16 | 16 | 20 | 20 | 1.4 | -0.02em | 500 | color `rgba(243,241,233,0.8)` |
| `.tour-title` | CSS:1590-1595 | `1.05rem` | 16.8 | | | | | | | | 1.2 | -0.01em | 700 | |
| `.nav-brand-name` | CSS:2238-2244 | `0.875rem` | 14 | | | | | | | | — | -0.01em | 700 | color #ffffff |
| `.cap-row__title` | CSS:2653-2660 | `0.95rem` | 15.2 | | | | | | | | — | -0.01em | 600 | |

**3.2 Cuerpo / lectura**

| Clase | Líneas | Tamaño | line-height | letter-spacing | peso | color |
|---|---|---|---|---|---|---|
| `body` | CSS:195-202 | sin `font-size` explícito → 16 px; line-height 1.5 [TW preflight] | 1.5 [TW] | — | normal(400) | `text-ink` |
| `.lead` | CSS:1402-1408 | `clamp(1.1rem, 1.7vw, 1.45rem)` → 17.6 px móvil (mín), 21.8 px @1280, 23.2 máx | 1.45 | -0.02em | — | `var(--color-muted)` |
| `.editorial-text` | CSS:1410-1415 | 1rem = 16 px | 1.6 | — | — | muted (familia Text) |
| `.chat-msg__body` | CSS:907-915 | 0.9rem = 14.4 px | 1.5 | — | — | `var(--color-ink)` (usuario: `#ffffff`, CSS:920-924) |
| `.container-ia-chat .input-text` | CSS:528-542 | 0.875rem = 14 px, height 3.25rem (52 px) | `1.125rem` (18 px) | — | 500 | ink; placeholder `--color-faint` (CSS:544-546); caret brand |
| `.chatap-floating-bar input` | CSS:759-770 | 0.875rem = 14 px, height 2.75rem (44 px) | — | — | 500 | ink; placeholder faint |
| `.input-field` | CSS:1107-1111 | `text-sm` [TW] = 14 px / lh 1.4286 [TW] | | | normal | `text-ink`, placeholder `text-faint` |
| `.tour-desc` | CSS:1596-1601 | 0.82rem = 13.12 px | 1.45 | — | 500 | muted |
| `.chip-suggest` | CSS:1713-1727 | 0.85rem = 13.6 px | — | -0.01em | 600 | ink |
| `.chatap-pill-btn` | CSS:692-708 | 0.8125rem = 13 px | — | — | 600 | ink (dark: `#f1f5f9`, CSS:710-714) |
| `.quick-reply-label` | CSS:441-444 | 0.76rem = 12.16 px | — | — | 700 | |
| `.quick-reply-description` | CSS:446-449 | 0.68rem = 10.88 px | — | — | — | muted |
| `.nav-link` | CSS:2256-2270 | 0.78rem = 12.48 px (Text) | — | 0.01em | 500 (activo 600, CSS:2277-2282) | `rgba(255,255,255,0.70)` |
| `.nav-cta` | CSS:2311-2326 | 0.75rem = 12 px (Text) | — | 0.01em | 600 | #ffffff |
| `.cap-row__note` | CSS:2661-2666 | 0.8rem = 12.8 px (Text) | — | — | — | muted |
| `.text-voice` (escuchando) | CSS:607-615 | 0.75rem = 12 px | — | — | — | ink |

**3.3 Labels / captions / badges / botones**

| Clase | Líneas | Familia | Tamaño | letter-spacing | peso | transform | color |
|---|---|---|---|---|---|---|---|
| `.section-kicker` | CSS:1393-1400 | Neue | 0.72rem = 11.52 px | 0.2em | 600 | uppercase | muted |
| `.specimen-tag` | CSS:1426-1432 | Neue | 11px | 0.18em | 600 | uppercase | — |
| `.specimen-mono` | CSS:1433-1437 | mono | 11px | 0.08em | — | — | — |
| `.mono-label` | CSS:845-852 | mono | 0.625rem = 10 px | 0.22em | 600 | uppercase | faint |
| `.sec-meta` | CSS:854-864 | mono | 0.625rem = 10 px | 0.16em | 500 | uppercase | muted; `::before` línea 1.25rem(20px)×1px brand |
| `.tech-label` | CSS:1676-1683 | mono | 0.68rem = 10.88 px | 0.22em | 500 | uppercase | muted |
| `.tech-badge` | CSS:1685-1700 | mono | 0.62rem = 9.92 px | 0.2em | 600 | uppercase | muted |
| `.fig-num` | CSS:1509-1514 | mono | 10px | 0.14em | — | — | faint |
| `.chat-msg__meta` | CSS:896-906 | mono | 0.563rem = 9.01 px | 0.18em | 600 | uppercase | faint |
| `.chat-divider` | CSS:940-951 | mono | 0.563rem = 9.01 px | 0.2em | 600 | uppercase | faint |
| `.quick-replies-title` | CSS:368-376 | sans | 0.68rem = 10.88 px | 0.12em | 700 | uppercase, centrado | muted |
| `.navbar-badge` | CSS:800-802 | — | (tamaño por utilidad) | 0.14em | — | — | — |
| `.nav-tab` | CSS:1830-1840 | mono | 0.66rem = 10.56 px | 0.18em | 500 | uppercase | muted |
| `.hero-eyebrow` | CSS:2006-2016 | mono | 0.6rem = 9.6 px | 0.22em | 600 | uppercase | faint |
| `.hero-meta-bar` | CSS:2026-2036 | mono | 0.6rem = 9.6 px | 0.2em | 500 | uppercase | faint |
| `.intro-kicker` | CSS:2435-2442 | mono | 0.6rem = 9.6 px | 0.22em | 600 | uppercase | brand |
| `.spec-strip__key` | CSS:2419-2426 | mono | 0.58rem = 9.28 px | 0.2em | 600 | uppercase | faint |
| `.spec-strip__val` | CSS:2427-2434 | mono | 0.72rem = 11.52 px | 0.1em | 700 | uppercase | ink |
| `.services-eyebrow` / `.chat-section-eyebrow` / `.light-eyebrow` | CSS:2521-2531 / 2618-2629 / 2844-2855 | mono | 0.62rem = 9.92 px | 0.2em | 600 | uppercase | `rgba(243,241,233,0.45)` / faint / faint |
| `.services-row__num` | CSS:2581-2589 | mono | 0.6rem = 9.6 px | 0.16em | 600 | — | `rgba(243,241,233,0.3)` (hover: brand, CSS:2986-2988) |
| `.services-row__tag` / `.service-tag` | CSS:2600-2612 / 1768-1780 | mono | 0.6rem / 0.62rem | 0.18em | — | uppercase | `rgba(243,241,233,0.45)` / faint |
| `.trust-card__num/meta/title` | CSS:2739-2772 | mono | 0.62 / 0.58 / 0.6 rem | 0.16 / 0.18 / 0.2em | 700 / 600 / 700 | meta,title uppercase | `rgba(243,241,233,0.3/0.25/0.35)` |
| `.trust-stat__label` | CSS:2799-2806 | mono | 0.6rem | 0.18em | 600 | uppercase | faint |
| `.cap-row__num` | CSS:2644-2651 | mono | 0.6rem | 0.14em | 700 | — | brand |
| `.prompt-chip` | CSS:3213-3228 | mono | 0.62rem = 9.92 px | 0.08em | 600 | — | muted |
| `.tour-kicker` | CSS:1583-1589 | sans | 10px | 0.14em | 800 | uppercase | brand-deep |
| `.tour-btn` / `.tour-skip` | CSS:1614-1637 / 1639-1650 | sans | 0.72rem = 11.52 px | 0.04em | 700 / 600 | uppercase | muted |
| `.bubble-chip` | CSS:471-484 | sans | 0.72rem = 11.52 px, lh 1.2 | — | 600 | — | brand-deep |
| `.bubble-wizard` | CSS:494-509 | sans | 0.72rem = 11.52 px, lh 1.2 | — | 600 | — | #ffffff |
| `.nav-profile-avatar` | CSS:2350-2362 | mono | 0.625rem = 10 px | — | 700 | uppercase | #ffffff |
| `.nav-brand-mark` | CSS:2223-2236 | Neue | 0.65rem = 10.4 px | -0.02em | 800 | — | #ffffff |
| `.hero-btn-primary` / `.hero-btn-ghost` | CSS:2062-2079 / 2094-2111 | mono | 0.65rem = 10.4 px | 0.16em | 700 | uppercase | paper / ink |
| `.finalcta-btn-primary` / `-ghost` | CSS:2118-2135 / 2141-2157 | mono | 0.65rem = 10.4 px | 0.16em | 800 / 700 | uppercase | `#070E20` / `rgba(243,241,233,0.85)` |
| `.reference-button` | CSS:1884-1897 | mono | 0.65rem = 10.4 px | 0.12em | 700 | uppercase | |
| `.btn` | CSS:1112-1116 | sans | `text-xs` [TW] = 12 px / lh 1.3333 [TW] | `tracking-wider` [TW] = 0.05em | `font-bold` = 700 | uppercase | `text-ink` |
| `.btn-primary` | CSS:1117-1122 | sans | `text-xs` = 12 px | `tracking-widest` [TW] = 0.1em | 700 | uppercase | `text-paper` |
| `.btn-ghost` | CSS:1123-1128 | sans | 12 px | 0.1em | 700 | uppercase | `text-ink` |
| `.btn-danger` | CSS:1129-1133 | sans | 12 px | 0.05em | 700 | uppercase | `text-paper` |
| `.badge` | CSS:1134-1136 | sans | `text-[10px]` = 10 px (line-height hereda 1.5) | `tracking-widest` = 0.1em | 700 | uppercase | |
| `.input-field` | CSS:1107-1111 | sans | 14 px | — | — | — | ink |
| `.zzz-letter` | CSS:1021-1028 | — | (hereda) | — | 700 | — | `var(--color-muted, #555)` |

Escala "oficial" de la intención (no del código): `VD:46-52`: display principal `clamp(3.8rem, 9vw, 8rem)` desktop / `clamp(3rem, 17vw, 5.4rem)` mobile; título de superficie `clamp(2.4rem,5vw,5rem)` / `clamp(2rem,11vw,3.6rem)`; título de bloque 1.25-2rem / 1.15-1.55rem; cuerpo 1-1.125rem / 0.95-1rem; meta 0.6-0.72rem / 0.58-0.68rem. Reglas de VD:36-41: texto conversacional 15-18 px; pesos 400 lectura / 500 controles / 600 título de bloque / 700-800 solo display; line-height 0.88-0.98 display, 1.05-1.18 títulos, 1.45-1.65 cuerpo, 1.2-1.35 meta; letter-spacing -0.06…-0.02em display, 0 lectura, 0.12-0.18em solo mono. Estos números NO coinciden exactamente con el CSS (p. ej. `.display-1` mín 44 px vs VD móvil 48 px).

### Inferences
- Escala móvil efectiva (360-430 px): display 44-51 px (display-1/hero-headline), título de sección 29.6 px (display-2), título servicio 25.6 px, lead 17.6 px, cuerpo 16 px/1.6, mensaje de chat 14.4 px/1.5, input 14 px, controles/botones 10-12 px MAYÚSCULAS con tracking 0.05-0.16em, micro-labels mono 9-10.9 px.
- El tracking en `em` se convierte a px multiplicando por el font-size final (p. ej. btn-primary 12 px × 0.1em = 1.2 px).

### Gaps
- Tamaños de `h1..h6` dentro de componentes JSX (clases Tailwind `text-2xl`, `text-3xl`…) no leídos; DM:89-97 los lista como "Tailwind scale": `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20, `text-2xl` 24, `text-3xl` 30 (el `text-3xl` real de Tailwind v4 es 1.875rem = 30 px, coherente) — son valores [TW]/DM, no del CSS.
- Line-height/peso de `.navbar-badge`: sólo letter-spacing definido (CSS:800-802).

---

## 4. Paleta de color completa (claro y oscuro)

### Takeaway
Tema por defecto = **oscuro** (clase `dark` en `<html>`); claro se activa al guardar `theme=light`. Paleta "Azul de Estado": navy `#070E20` (dark paper) / frío `#F0F4F9` (light paper), acento único `#2F6BFF` (claro) / `#4D7DFF` (oscuro). Todos los valores del CSS ya son hex o rgba; ninguna conversión de oklch/hsl fue necesaria.

### Cited Findings
**4.1 Mecanismo de tema**
- Hook `src/hooks/useTheme.js:1-24`: tema = `"dark"` si `<html>` tiene clase `dark`, si no `"light"` (líneas 14-15, 24 snapshot servidor = `"dark"`). Sólo dos nombres: `dark`, `light`.
- `index.html:25-41`: migración única `chatap_dark_default_v1` que escribe `theme=dark` si no existe; luego `if (t !== "light") add class "dark"` → **dark por defecto**, light sólo si `localStorage.theme === "light"`.
- Tailwind: `@custom-variant dark (&:where(.dark, .dark *));` (CSS:75). `:root{color-scheme: light}` (CSS:155-157); `.dark{… color-scheme: dark}` (CSS:159-183).
- Pre-pintado (anti-flash) en `index.html:11-24`: dark → `html, body {background-color:#070E20; color:#EAF0FA}`; `html:not(.dark)` → `#F0F4F9` / `#0F1730`.
- `<meta name="theme-color">` (`index.html:42-43`): `#070E20` con `(prefers-color-scheme: dark)`, `#F0F4F9` con `(prefers-color-scheme: light)`. Viewport: `width=device-width, initial-scale=1.0` (`index.html:6`). `lang="es"`, `<html class="lenis">` (`index.html:2`).
- Transición de tema: `html, body` `transition: background-color 0.2s ease, color 0.2s ease` (CSS:192,201); superficies `body,.bg-paper,.bg-mist,.card,.card-interactive,.nav-pill,.border-line,header,footer,input,textarea,select` → `transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease` (CSS:288-301).
- `html{ scroll-behavior:smooth; overflow-x:hidden }` y `body{ overflow-x:hidden; margin:0 }` (CSS:187-202).
- `:focus-visible { outline: 1px solid var(--color-brand); outline-offset: 2px }` (CSS:209-212).

**4.2 Tokens semánticos (@theme = claro; `.dark` = oscuro)**

| Token | Claro | Oscuro | Línea claro / oscuro |
|---|---|---|---|
| `--color-ink` (texto principal) | `#0F1730` | `#EAF0FA` | CSS:84 / 160 |
| `--color-paper` (fondo principal) | `#F0F4F9` | `#070E20` | CSS:85 / 161 |
| `--color-mist` (superficie sutil/hover) | `#E2EAF4` | `#0D1730` | CSS:86 / 162 |
| `--color-soft` (superficie terciaria) | `#D5E2F1` | `#132247` | CSS:87 / 163 |
| `--color-line` (bordes) | `rgba(15,23,48,0.12)` = ink @12% | `rgba(234,240,250,0.12)` = ink @12% | CSS:88 / 164 |
| `--color-muted` (texto secundario) | `#4A5578` | `#8A9BC0` | CSS:89 / 165 |
| `--color-faint` (texto terciario/placeholder) | `#7E8BA7` | `#4E5F85` | CSS:90 / 166 |
| `--color-brand` / `--color-primary` / `--color-info` | `#2F6BFF` | `#4D7DFF` | CSS:104,110,114 / 167,173 |
| `--color-brand-dark` / `--color-primary-dark` | `#2558E0` | `#3A6AE0` | CSS:105,115 / 168 |
| `--color-brand-deep` / `--color-primary-deep` / `--color-accent` | `#1C44B6` | `#2F55C0` | CSS:106,116,119 / 169 |
| `--color-primary-light` / `--color-accent-light` | `#EBF2FF` | `#0D1B40` | CSS:117,120 / 176,178 |
| `--color-primary-lighter` | `#F5F8FF` | `#091230` | CSS:118 / 177 |
| `--color-ok` (éxito) | `#18bc42` | `#18bc42` | CSS:107 / 170 |
| `--color-warn` (aviso) | `#efc21e` | `#efc21e` | CSS:108 / 171 |
| `--color-bad` (error/peligro) | `#d82f2f` | `#d82f2f` | CSS:109 / 172 |
| `--color-info` | `#2F6BFF` | `#4D7DFF` | CSS:110 / 173 |
| `--bot-body` (avatar cuerpo) | `#0F1730` | `#EAF0FA` | CSS:111 / 174 |
| `--bot-eye` (avatar ojo) | `#F0F4F9` | `#0F1730` | CSS:112 / 175 |
| `--color-band` (bandas oscuras) | `#0D1730` | `#040A18` | CSS:147 / 180 |
| `--color-band-fg` | `#EAF0FA` | `#EAF0FA` | CSS:148 / 181 |
| `--color-dark` | `#0F1730` | (sin override) `#0F1730` | CSS:93 |
| `--color-pitch` | `#000000` | idem | CSS:94 |
| `--color-cream` / `--color-cream-ink` | `#F0F4F9` / `#0F1730` | idem (sin override) | CSS:95-96 |
| `--color-orange` | `#ff9100` | idem | CSS:97 |
| `--color-crimson` | `#d82f2f` | idem | CSS:98 |
| `--color-cobalt` | `#2F6BFF` | idem | CSS:99 |
| `--color-lime` | `#18bc42` | idem | CSS:100 |
| `--color-violet` | `#6157bd` | idem | CSS:101 |

Tokens del sidebar admin (NO se redefinen en dark; CSS:122-132): `--sidebar-bg #141414`, `--sidebar-border rgba(255,255,255,0.12)`, `--sidebar-hover #222222`, `--sidebar-text #9e9e9e`, `--sidebar-text-hover #ffffff`, `--sidebar-section-text #5e5e5e`, `--sidebar-active-bg var(--color-brand)` (→ `#2F6BFF` claro / `#4D7DFF` oscuro), `--sidebar-active-text #ffffff`, `--sidebar-header-bg #161616`, `--sidebar-width 280px`, `--sidebar-collapsed-width 72px`.

`--color-brand-rgb` NO está definido en ningún sitio (única referencia: CSS:756 `rgba(var(--color-brand-rgb, 14, 165, 233), 0.2)`) → el halo del `:focus-within` de `.chatap-floating-bar` renderiza con el fallback `rgba(14,165,233,0.2)` = sky `#0EA5E9` @20%, NO el azul de marca.

**4.3 Colores literales usados fuera de tokens (hex/rgba, claro y oscuro)**

| Uso | Valor | Línea |
|---|---|---|
| Navbar flotante pill | `rgba(10,17,36,0.94)` (scrolled `rgba(7,14,32,0.96)`), borde `rgba(255,255,255,0.12)` (scrolled `0.18`) | CSS:2193-2194, 2208-2209 |
| Dropdown / drawer nav | `rgba(10,17,36,0.96)`, borde `rgba(255,255,255,0.14)` | CSS:2370,2373,2385,2388 |
| Texto sobre bandas oscuras ("papel cálido") | `rgba(243,241,233, α)` con α = 0.03-0.85; `#f1f0e8` (reference-hero-art/botones, `.site-navbar`) | CSS:1805,1871,1899,1910,2148,2411-2612… |
| Terminal / chat-terminal | fondo `#070E20`, barra `#111111`, borde `rgba(243,241,233,0.14)` | CSS:2449-2450, 2457, 2669-2672, 2680 |
| Hero right panel | `#070E20` | CSS:1977-1979 |
| Hero art (reference) | `#202020` / texto `#f1f0e8` | CSS:1871 |
| Floating bar dark | `#141518`, borde `rgba(255,255,255,0.12)` | CSS:748-751 |
| Pill-btn dark | bg `rgba(255,255,255,0.05)`, borde `rgba(255,255,255,0.1)`, texto `#f1f5f9` | CSS:710-714 |
| Hover btn-primary/ghost | bg `#EBEBEB`, texto `#1A1A1A`, borde `#EBEBEB` | CSS:1120,1126 |
| Hover `.site-navbar .hover:bg-mist` (≥1024) | `#252525` | CSS:1915 |
| Brand glows | `rgba(47,107,255, 0.12…0.55)` | CSS:2085,2133,2139,2914,3118,3150,3162,3208 |
| Punto estado hero | `#18bc42` | CSS:2047 |
| Tour dim | `rgba(5,10,25,0.22)` | CSS:1527 |
| Tooltip sidebar | fondo `var(--color-ink)`, texto `var(--color-paper)` | CSS:1208-1209 |

**4.4 Valores derivados (calculados, para app nativa sin color-mix)**

| Derivado | Fórmula | Claro | Oscuro |
|---|---|---|---|
| Línea sólida sobre paper | ink@12% sobre paper | `#D5D9E1` | `#22293A` |
| Línea sólida sobre mist | ink@12% sobre mist | `#C9D1DC` | `#283148` |
| `border-line/70` (cards) sobre paper | ink@8.4% sobre paper | `#DDE1E8` | `#1A2132` |
| Meta mensaje usuario (`color-mix(ink 55%, transparent)`, CSS:927) sobre paper | ink@55% | `#747A8A` | `#848A98` |

**4.5 Contrastes calculados (WCAG, para a11y; cálculo propio)**

| Par | Claro | Oscuro |
|---|---|---|
| ink / paper | 16.04 | 16.79 |
| muted / paper | 6.64 | 6.89 |
| faint / paper (texto terciario/placeholder) | 3.10 (bajo AA texto normal) | 3.02 (bajo AA) |
| #ffffff sobre brand (burbuja usuario/CTA) | 4.50 | 3.69 (bajo AA texto normal) |
| paper sobre brand-deep (texto del `.btn-primary`) | 7.45 | 2.91 (texto `#070E20` sobre `#2F55C0`; bajo AA) |

### Inferences
- Para móvil: usar `Paper/Ink/Mist/Soft/Line/Muted/Faint/Brand*` como pares claro/oscuro; ok/warn/bad no cambian entre temas.
- Varias superficies (navbar pill, terminal, bandas, hero derecho) son siempre oscuras (navy) en AMBOS temas.
- El botón primario `.btn-primary` invierte: en claro texto `#F0F4F9` sobre `#1C44B6`; en oscuro texto `#070E20` sobre `#2F55C0` (ver contraste bajo).

### Gaps
- Colores que dependan de utilidades Tailwind en JSX (`bg-ok/10`, `text-bad`…) no se trazaron; DM:146-149 dice que los badges de estado usan `bg-<tone>/10 text-<tone>` (10% opacidad del color de tono) — no verificado en JSX.
- `--color-brand-rgb` indefinido: confirmar si el halo sky `#0EA5E9` es intencional (probablemente bug).

---

## 5. Tabla "tokens → mobile-ready" (resumen consolidado, listo para trasladar)

### Takeaway
Tabla única de tokens con valores claro y oscuro, en hex/px, lista para un tema nativo.

### Cited Findings
| Nombre token | Valor claro | Valor oscuro | Fuente |
|---|---|---|---|
| color.ink | #0F1730 | #EAF0FA | CSS:84/160 |
| color.paper (fondo app) | #F0F4F9 | #070E20 | CSS:85/161 |
| color.mist | #E2EAF4 | #0D1730 | CSS:86/162 |
| color.soft | #D5E2F1 | #132247 | CSS:87/163 |
| color.line (alpha) | #0F1730 @12% | #EAF0FA @12% | CSS:88/164 |
| color.line (sólido s/ paper) | #D5D9E1 | #22293A | calc. |
| color.muted | #4A5578 | #8A9BC0 | CSS:89/165 |
| color.faint | #7E8BA7 | #4E5F85 | CSS:90/166 |
| color.brand | #2F6BFF | #4D7DFF | CSS:104/167 |
| color.brandDark | #2558E0 | #3A6AE0 | CSS:105/168 |
| color.brandDeep | #1C44B6 | #2F55C0 | CSS:106/169 |
| color.primaryLight | #EBF2FF | #0D1B40 | CSS:117/176 |
| color.primaryLighter | #F5F8FF | #091230 | CSS:118/177 |
| color.ok | #18BC42 | #18BC42 | CSS:107/170 |
| color.warn | #EFC21E | #EFC21E | CSS:108/171 |
| color.bad | #D82F2F | #D82F2F | CSS:109/172 |
| color.info | #2F6BFF | #4D7DFF | CSS:110/173 |
| color.band | #0D1730 | #040A18 | CSS:147/180 |
| color.bandFg | #EAF0FA | #EAF0FA | CSS:148/181 |
| bot.body | #0F1730 | #EAF0FA | CSS:111/174 |
| bot.eye | #F0F4F9 | #0F1730 | CSS:112/175 |
| color.onBrand (texto sobre brand) | #FFFFFF | #FFFFFF | CSS:922-923 |
| statusBar / themeColor | #F0F4F9 | #070E20 | index.html:42-43 |
| selection bg / text | #2F6BFF / #FFFFFF | #2F6BFF / #FFFFFF (HTML) ó `var(--color-brand)` (CSS) | HTML:12-15; CSS:204-207 |
| font.sans | PP Neue Montreal → PP Neue Montreal Text → system | idem | CSS:78 |
| font.mono | ui-monospace / SF Mono / Menlo / Consolas / monospace | idem | CSS:81 |
| radius.sm / md / lg / xl / 2xl / 3xl | 6 / 8 / 12 / 16 / 20 / 28 px | idem | CSS:138-143 |
| radius.full / control | 9999 | 9999 | CSS:134,144 |
| radius.card | 20 px | 20 px | CSS:135 |
| shadow.soft / hover | none | none | CSS:151-152 |
| border.hairline | 1px solid color.line | idem | CSS:872 |
| focus.outline | 1px solid brand, offset 2px | brand dark `#4D7DFF` | CSS:209-212 |
| input focus ring | border brand + ring 2px brand@12% | idem | CSS:1110 |
| sidebar.width / collapsed | 280 / 72 px | idem | CSS:131-132 |
| nav.shell top | 16 px (móvil); 20 px desde 640 px | idem | CSS:2169,2180-2182 |
| motion.ease.primary | cubic-bezier(0.22,1,0.36,1) | idem | CSS:323… |
| motion.duration (base transición color) | 200 ms ease | idem | CSS:192 |
| bubble.max-width | min(78%, 46rem) | idem | CSS:894 |

### Inferences
- `nav.shell top`: valor correcto = 1rem (16 px) por defecto y 1.25rem (20 px) desde 640 px (CSS:2169,2179-2183).

### Gaps
- Sin valores para el padding de pantalla móvil global (sólo `.section-bleed` 1.25rem y las medidas de VD).

---

## 6. Radios, bordes, sombras, gradientes, opacidades, blur

### Takeaway
Radios generosos (pill 9999px en botones/inputs/chips/nav; 20 px en cards; 24 px en squircle), bordes de 1 px `--color-line`, sombras casi ausentes en componentes base (`none`) pero presentes en nav, terminal, floating bar, hero buttons y badges; gradientes sólo decorativos/avatar.

### Cited Findings
**6.1 Radios por componente**

| Componente | Radio | Línea |
|---|---|---|
| `.card`, `.card-interactive`, `.card-border` | `rounded-2xl` = `--radius-2xl` = 1.25rem = **20 px** | CSS:1090,1094,1105 (token CSS:139) |
| `.input-field` | `rounded-xl` = `--radius-xl` = 1rem = **16 px** | CSS:1108 (token 140) |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.badge` | `rounded-full` = 9999 | CSS:1114,1119,1125,1131,1135 |
| `.skeleton` | `rounded-md` = 0.5rem = **8 px** | CSS:1144 (token `--radius-md` CSS:139) |
| `--radius-control` (quick-reply-icon, bubble-chip, bubble-wizard, container-ia-chat y su input/botones) | 9999 | CSS:134, 416, 476, 501, 524, 532, 564, 600 |
| `--radius-card` (quick-reply-card, chat-msg__body, card-raised) | 1.25rem = **20 px** | CSS:135, 392, 910, 1466 |
| `.chatap-squircle-badge` | 1.5rem = **24 px**, 76×76 px (4.75rem) | CSS:647-651 |
| `.chatap-pill-btn` | 9999 | CSS:697 |
| `.chatap-floating-bar` | 1.25rem = 20 px | CSS:740 |
| `.nav-pill`, `.nav-link`, `.nav-icon-btn`, `.nav-cta`, `.nav-profile-btn`, `.nav-profile-avatar` | 9999 | CSS:2192,2262,2297,2315,2338,2354 |
| `.nav-brand-mark` | 0.55rem = 8.8 px, 26.4×26.4 px (1.65rem) | CSS:2223-2228 |
| `.nav-dropdown` | 1rem = 16 px; ancho 15rem = 240 px | CSS:2365-2369 |
| `.nav-drawer` | 1.25rem = 20 px | CSS:2384 |
| `.spec-strip` | 1rem = 16 px | CSS:2401 |
| `.problems-terminal`, `.chat-terminal-wrap`, `.spotlight-card` | 1.25rem = 20 px | CSS:2450,2670,3140,3158 |
| `.hud-glass-badge`, `.hero-prompt-bar`, `.hero-btn-*`, `.finalcta-btn-*`, `.prompt-chip` | 9999 | CSS:3180,3199,2067,2099,2123,2146,3218 |
| `.tour-ring`, `.tour-bubble`, `.tour-controls` | 0.375rem = 6 px | CSS:1534,1546,1611 |
| `.tour-btn` | 0.25rem = 4 px, height 30 px | CSS:1615-1620 |
| `.sidebar-tooltip::after` | 6 px | CSS:1200 |
| `.reference-button`, `.chip-suggest`, `.tech-badge`, `.service-tag`, `.trust-*`, `.panel-tech` | 0 (cuadrado; sin `border-radius`) | CSS:1884-1897,1713-1727,1685-1700,1768-1780,2717-2807,1746-1750 |
| `.mic-eq span`, `.eq-bar`, `.ui-dot`, `.status-dot` | 9999 / 999px | CSS:351,3241,877,1708 |
| Utility `rounded-*` resultantes | sm 6, md 8, lg 12, xl 16, 2xl 20, 3xl 28 px | CSS:138-143 |

**6.2 Bordes**
- Estándar: `1px solid var(--color-line)` (p.ej. CSS:523,872,1420-1424,1718,2400). Card base: `border border-line/70` (`border-line/70` en Tailwind v4 = `color-mix(in oklab, var(--color-line) 70%, transparent)` → alpha efectivo 0.12×0.7 = 0.084 [TW]) — CSS:1090,1094,1105.
- Mensaje chat: `1px solid var(--color-line)` (CSS:909); usuario `border-color: var(--color-brand)` (CSS:922).
- Hover card: `border-color: color-mix(in srgb, var(--color-brand) 45%, var(--color-line))` (CSS:1099).
- Focus input: `border-color: brand` + `ring-2` brand/12 (CSS:1110); outline global `1px solid brand offset 2px` (CSS:209-212).
- Tour ring: `2px solid var(--color-brand)` (CSS:1533).
- Divider/regla: `.hairline*` 1px (CSS:1420-1424); `.sec-meta::before` 1.25rem × 1px brand (CSS:865-870); `.services-eyebrow-line` 2.5rem × 1px (CSS:2533-2538); `.trust-bento` gap 1 px sobre fondo line (CSS:2717-2722).
- Stroke de texto gigante `-webkit-text-stroke: 1.5px` (CSS:1499).

**6.3 Sombras (box-shadow / drop-shadow completos)**

| Elemento | Valor | Línea |
|---|---|---|
| `--shadow-soft`, `--shadow-hover` | `none` | CSS:151-152 |
| `.container-ia-chat .label-voice.is-listening` | `0 6px 24px color-mix(in srgb, var(--color-ink) 14%, transparent)` | CSS:602 |
| `.chatap-squircle-badge` (dark/default) | `0 16px 36px -8px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.2)` | CSS:656 |
| `:root:not(.dark) .chatap-squircle-badge` | `0 12px 28px -6px rgba(0,0,0,0.08)` | CSS:664 |
| `.chatap-star-icon` | `filter: drop-shadow(0 0 10px rgba(255,255,255,0.45))`; claro `drop-shadow(0 0 6px rgba(0,0,0,0.15))` | CSS:675,679 |
| `.chatap-pill-btn` | `0 2px 5px rgba(0,0,0,0.03)`; hover `0 6px 16px -2px rgba(0,0,0,0.08)`; dark hover `0 8px 24px -4px rgba(0,0,0,0.45)` | CSS:704,720,726 |
| `.chatap-floating-bar` | `0 10px 30px -5px rgba(0,0,0,0.1)`; dark `0 12px 35px -5px rgba(0,0,0,0.55)`; focus `0 12px 32px -5px rgba(14,165,233,0.2)` (fallback, ver gap) | CSS:743,751,756 |
| `.navbar-action` | `0 1px 3px rgba(15,23,42,0.04)`; hover `0 4px 12px rgba(15,23,42,0.1)` | CSS:782,789 |
| `.sidebar-tooltip::after` | `0 4px 12px rgba(0,0,0,0.15)` | CSS:1210 |
| `.panel-tech` | `0 1px 2px rgba(7,14,32,0.05), 0 18px 40px -24px rgba(7,14,32,0.22)` | CSS:1749 |
| `.hero-btn-primary:hover` | `0 8px 24px -4px rgba(47,107,255,0.35)` | CSS:2085 |
| `.finalcta-btn-primary` / hover | `0 10px 30px -4px rgba(47,107,255,0.4)` / `0 14px 36px -4px rgba(47,107,255,0.55)` | CSS:2133,2139 |
| `.nav-pill` | `0 10px 30px -4px rgba(0,0,0,0.28), inset 0 1px 0 0 rgba(255,255,255,0.10)`; scrolled `0 14px 38px -4px rgba(0,0,0,0.44), inset 0 1px 0 0 rgba(255,255,255,0.14)` | CSS:2195,2210 |
| `.nav-link--active` | `inset 0 0 0 1px rgba(255,255,255,0.08)` | CSS:2281 |
| `.nav-brand-mark` | `0 2px 8px rgba(47,107,255,0.35)` | CSS:2235 |
| `.nav-cta` / hover | `0 2px 8px rgba(47,107,255,0.32)` / `0 4px 14px rgba(47,107,255,0.45)` | CSS:2324,2330 |
| `.nav-dropdown`, `.nav-drawer` | `0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)` | CSS:2374,2389 |
| `.problems-terminal` | `0 16px 48px -12px rgba(0,0,0,0.45)` | CSS:2452 |
| `.chat-terminal-wrap` | `0 20px 50px -12px rgba(0,0,0,0.55)` | CSS:2673 |
| `.trust-card:hover` | `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(47,107,255,0.18)` | CSS:2951-2952 |
| `.spotlight-card:hover` | `0 16px 40px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(47,107,255,0.18)` | CSS:3150-3151 |
| `.hud-glass-badge` | `0 8px 32px rgba(0,0,0,0.36), 0 1px 0 rgba(255,255,255,0.08) inset` | CSS:3185 |
| `.hero-prompt-bar` / focus | `0 4px 20px -4px rgba(35,35,35,0.08)` / `0 8px 30px -4px rgba(47,107,255,0.2), 0 0 0 1px var(--color-brand)` | CSS:3202,3208 |
| `.hero-avatar-wrap` | `filter: drop-shadow(0 0 28px rgba(47,107,255,0.18))` | CSS:2914 |
| keyframes `ring-pulse` | `0 0 0 0 brand@25% → 0 0 0 16px transparent` | CSS:1323-1327 |
| keyframes `tour-glow` | `0 0 0 4px brand@18% ↔ 0 0 0 12px brand@32%` | CSS:1354-1357 |
| Cards base (`.card*`) | **sin sombra** (hover = `var(--shadow-hover)` = none) | CSS:1088-1103 |

**6.4 Gradientes (completos)**

| Elemento | Valor | Línea |
|---|---|---|
| `.footer-striped-pattern` | bg `color-mix(in srgb, var(--color-mist) 40%, var(--color-paper))`; `repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-line) 80%, transparent) 0px, color-mix(in srgb, var(--color-line) 80%, transparent) 1px, transparent 1px, transparent 10px)` | CSS:304-313 |
| `.chatap-squircle-badge` (dark) | `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)` | CSS:654 |
| idem (claro) | `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)` | CSS:662 |
| `.skeleton` | `linear-gradient(90deg, var(--color-mist) 25%, var(--color-soft) 37%, var(--color-mist) 63%)`, size 800px 100%, shimmer 1.4s linear infinite | CSS:1145-1147 |
| `.nav-brand-mark`, `.nav-profile-avatar` | `linear-gradient(135deg, #2F6BFF 0%, #1C44B6 100%)` | CSS:2229,2356 |
| `.reference-radial-texture` | `radial-gradient(circle at 52% 47%, transparent 0 6%, rgba(255,255,255,0.06) 6.1% 6.25%, transparent 6.35% 13%, … 52.1% 52.25%, transparent 52.35%)` (anillos concéntricos a 6/13/21/30/40/52%) | CSS:1808 |
| `.ambient-glow-brand` | `radial-gradient(circle, rgba(47,107,255,0.22) 0%, rgba(47,107,255,0.06) 45%, transparent 70%)` + `filter: blur(28px)`, pulso 6s | CSS:3118-3120 |
| `.text-shimmer-brand` | `linear-gradient(90deg, var(--color-ink) 0%, var(--color-brand) 50%, var(--color-ink) 100%)`, size 200% 100%, clip text, 5s | CSS:3126-3130 |
| `.spotlight-card::before` | `radial-gradient(450px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(47,107,255,0.12), transparent 70%)` | CSS:3159-3163 |

**6.5 Opacidades / mezclas de color**
- Superficies translúcidas: `.card` y `.card-interactive` bg `color-mix(in srgb, var(--color-paper) 86%, transparent)` (CSS:1089,1093); `.quick-reply-card` 86% (393); `.chatap-pill-btn` 92% (698); `.chatap-floating-bar` 96% (741); `.tech-badge` 72% (1691); `.container-ia-chat` sólido paper (525).
- Bordes translúcidos: `color-mix(line 80%…)` (391), 85% (475,699,742).
- Hover tints: `.chip-suggest:hover` brand 8% (1731); `.service-row:hover` brand 7% (1756); `.prompt-chip:hover` brand 10% (3233); `.row-flash` brand 18% (1249); `.chatap-pill-btn:hover` mist 80% (718); services-row hover `rgba(243,241,233,0.04)` / `rgba(234,240,250,0.04)` (2574,3027).
- Capas: `.hero-orbit` opacity 0.48 (3008; antes 0.55 en 2056, gana el posterior), `.texture-words` opacity 0.05 (1799), `.reference-radial-texture` 0.9 (1804), `.scale-on-scroll` opacity 0.45 → 1 (1940), `.label-text` opacity 0→1 (627,632), `.pulse-soft` 1↔0.45 (225-228), `.pulse-dot` 1↔0.4 y escala 1↔0.7 (1066-1069).
- Overlay del tour: `rgba(5,10,25,0.22)` (1527). Overlay modal (DM:165) `bg-black/30 backdrop-blur-sm` (no está en CSS; ver gap).

**6.6 Blur / glass (backdrop-filter)**

| Elemento | Valor | Línea |
|---|---|---|
| `.nav-dropdown` | `backdrop-filter: blur(20px)` + bg `rgba(10,17,36,0.96)` | CSS:2370-2372 |
| `.nav-drawer` | `blur(20px)` + bg `rgba(10,17,36,0.96)` | CSS:2385-2387 |
| `.hud-glass-badge` | `blur(16px)` + bg `rgba(7,14,32,0.78)` | CSS:3181-3183 |
| `keyframes blur-in` | `filter: blur(14px) → 0` + translateY 6→0, 0.6s ease | CSS:1306-1309, 1457 |
| `.ambient-glow-brand` | `filter: blur(28px)` | CSS:3119 |

### Inferences
- Para móvil: cards = fondo paper (86% opaco; efectivamente casi paper) + hairline `#DDE1E8` (claro) / `#1A2132` (oscuro) + radio 20 sin sombra; inputs pill/16 px; CTA pill; navbar = pill oscura con blur.
- Los radios `0` de `chip-suggest`, `tech-badge`, `trust-*`, `panel-tech` pertenecen a la capa "editorial cuadrada" de la landing; las pantallas de chat/admin usan pill/20 px.

### Gaps
- Overlay de modal y sombras Tailwind (`shadow-sm/md/lg`) usados en JSX no verificadas; DM:114-119 los cita.
- Dos reglas duplicadas para `.hero-orbit` (CSS:2053-2057 y 3005-3011): prevalece la última (72%, 34rem, 0.48).

---

## 7. Movimiento: duraciones y easings

### Takeaway
Easing dominante `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out expresivo); duraciones de microinteracción 150-300 ms, entradas de página 220-500 ms, loops 0.9-6 s; `prefers-reduced-motion` fuerza 0.01 ms.

### Cited Findings
| Concepto | Duración / easing | Línea |
|---|---|---|
| Cambio de tema / superficies | 0.2 s ease | CSS:192,201,300 |
| `.animate-fade-up` | 0.22 s `cubic-bezier(0.22,1,0.36,1)` backwards; translateY 10→0 | CSS:323, 215-218 |
| `.animate-fade-in` | 0.25 s ease-out (luego redefinido 0.18 s ease-out, 1155 y 1178) | CSS:324,1155,1178 |
| `.animate-form-in` / `-out` | 0.32 s cubic(.22,1,.36,1) / 0.18 s ease-in | CSS:327-328 |
| `.animate-route-enter` / `-exit` | 0.28 s `cubic-bezier(0.16,1,0.3,1)` / 0.18 s `cubic-bezier(0.4,0,1,1)` | CSS:333-340 |
| `.animate-page-enter` (final) / `-exit` | 0.5 s cubic(.22,1,.36,1), translateY 22→0 + scale .99→1 / 0.24 s ease-in | CSS:1485-1486, 1344-1352 |
| `.animate-scale-in` / `-out` (final) | 0.22 s cubic(.22,1,.36,1), scale .96→1 / 0.2 s | CSS:1180-1181 |
| `.animate-slide-up` / `.animate-list-item` | 0.22 s cubic(.22,1,.36,1), translateY 16→0 | CSS:1157,1161 |
| `.stagger-children > *` | 0.22 s slide-up; delays 0.03, 0.06, … 0.24 s (8 hijos, paso 0.03 s) | CSS:1162-1170 |
| `.animate-shimmer` / `.skeleton` | 1.4 s linear infinite | CSS:1152,1147 |
| `.animate-pulse-soft` | 2 s ease-in-out infinite (opacity 1↔0.45) | CSS:325 |
| `.animate-pulse-dot` (final) | 1.8 s ease-in-out infinite | CSS:1481 |
| `.dot-ping` | 1.6 s ease-out infinite (scale 1→2.6, opacity 1→0) | CSS:1174, 1253-1257 |
| `.mic-eq span` | 0.9 s ease-in-out infinite; scaleY .35↔1; delays 0, .15, .3, .45 s; 3 px de ancho, gap 2 px, alto 16 px | CSS:346-357 |
| `.mic-ripple` | 1.2 s ease-out infinite (scale 1→1.7, opacity .5→0) | CSS:358, 235-238 |
| `.wave-bar` | 1.2 s ease-in-out infinite; delays .15….6 s | CSS:1515-1522 |
| `.eq-bar` | 1 s ease-in-out infinite alternate; alturas 16/10/18/12 px | CSS:3238-3247 |
| Avatar `.animate-speak` | 0.9 s ease-in-out infinite | CSS:360, 977-982 |
| `.rx-tilt/-bounce/-squash/-stretch` | 0.9 / 0.8 / 0.8 / 0.8 s ease-in-out both (rebote sólo del avatar) | CSS:1015-1019 |
| `.zzz-letter` | 2.4 s ease-in-out infinite | CSS:1021-1028 |
| `microphone-idle` / `-pulse` | 2.4 s / 1.15 s ease-in-out infinite | CSS:592-594, 621 |
| `.container-ia-chat .label-voice/.label-text` | `transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.05)` (leve overshoot) | CSS:570 |
| `.quick-reply-card` | 0.18 s ease; hover translateY(-1px) | CSS:398,407 |
| `.chatap-pill-btn` | 0.2 s `cubic-bezier(0.16,1,0.3,1)`; hover translateY(-1.5px); active scale(.98) | CSS:705,717,729-731 |
| `.chatap-squircle-badge` | 0.25 s `cubic-bezier(0.16,1,0.3,1)`; hover translateY(-2px) scale(1.04) | CSS:658,667-669 |
| `.navbar-action` | 180 ms ease; hover translateY(-2px); active scale(.98) | CSS:783-794 |
| `.btn` | 0.15 s ease (bg, color, border) | CSS:1115 |
| `.card-interactive` | 0.2 s ease; transform 0.2 s cubic(.22,1,.36,1); hover translateY(-2px) | CSS:1095-1103 |
| Reveal al scroll | `reveal-up` 0.7 s; `reveal-img` 0.9 s (scale 1.06→1); `blur-reveal` 0.6 s ease; translateY 30 px | CSS:1451,1454,1457, 1296-1309 |
| Hero enter slots | 0.55/0.6/0.6/0.55/0.5 s, delays 0.05/0.18/0.38/0.54/0.72 s; avatar pop 0.7 s delay 0.3 s | CSS:2884-2901 |
| `.nav-shell` | top 0.25 s ease | CSS:2176 |
| `.nav-pill` | 0.25 s ease | CSS:2196 |
| `.nav-link`, `.nav-icon-btn`, `.nav-cta` | 0.18 s ease | CSS:2269,2302,2325 |
| `.trust-card` hover | 0.25 s cubic(.22,1,.36,1) translateY(-4px); línea inferior scaleX 0.35 s | CSS:2946-2967 |
| `.spotlight-card` | 0.28 s cubic(.22,1,.36,1) hover translateY(-4px) | CSS:3142-3152 |
| `.terminal-caret` | 0.5×0.875 rem (8×14 px), `blink-caret 1.1s step-end infinite` | CSS:2699-2705 |
| `.animate-ticker` (marquee) | 30 s linear infinite, pausa en hover | CSS:1478-1479 |
| `.animate-float` | 7 s ease-in-out infinite, translateY 0↔-14px | CSS:1480, 1316-1319 |
| `orbit-spin` | rotate 0→360° (duración inline) | CSS:2824, 2836-2839 |
| `.fonts-ready` | `body-appear` 0.35 s ease | CSS:3085-3087 |
| `prefers-reduced-motion: reduce` | `animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important` | CSS:1951-1957 |
| Easings usados | `cubic-bezier(0.22,1,0.36,1)` (principal); `cubic-bezier(0.16,1,0.3,1)`; `cubic-bezier(0.4,0,1,1)`; `cubic-bezier(0.175,0.885,0.32,1.05)`; `ease`, `ease-out`, `ease-in`, `ease-in-out`, `linear`, `step-end` | varios |

### Inferences
- DM:174-176 coincide con el easing principal (0.22,1,0.36,1); el `cubic-bezier(0.25,0.1,0.25,1)` del sidebar (DM:176) no aparece en `index.css` (debe estar en el JSX del sidebar).
- Se duplican definiciones (`animate-fade-in`, `animate-scale-in`, `animate-page-enter`, `animate-pulse-dot`): rige la última declarada en el archivo.

### Gaps
- Durations de animaciones inline en JSX (GSAP/three/ogl, `BotReactionController`) no cubiertas.

---

## 8. Spacing, contenedores, z-index y breakpoints

### Takeaway
No hay escala de spacing custom (no existe `--spacing` en `@theme`): rige la escala Tailwind (4 px por unidad) [TW]. El CSS global fija padding lateral de sección 20 / 48 / 80 px (móvil / ≥768 / ≥1024), contenedor máx 80rem (1280 px). Breakpoints propios del CSS: 480, 639/640, 767/768, 1023/1024 px.

### Cited Findings
**8.1 Spacing (valores literales del CSS global, rem→px)**

| Contexto | Valor | Línea |
|---|---|---|
| `.section-bleed` padding-inline | 1.25rem = **20 px**; ≥768 px: 3rem = **48 px**; ≥1024 px: 5rem = **80 px** | CSS:1441-1447 |
| `.ed-max` | `max-width: 80rem` = **1280 px**, `margin-inline:auto` | CSS:1440 |
| `.welcome-content` gap | 1.25rem = 20 px | CSS:776-778 |
| `.quick-replies` | padding `0 0 0.25rem` (4 px abajo); título margin-bottom 0.875rem (14 px); grid 2 columnas gap 0.625rem (10 px); ≤640 px 1 columna | CSS:364-380,465-469 |
| `.quick-reply-card` | min-height 4.25rem (68 px), padding `0.75rem 0.875rem` (12 / 14 px), gap 0.75rem (12 px); icono 2.5rem (40 px), svg 1.2rem (19.2 px); flecha 1rem | CSS:384-424,451-457 |
| `.bubble-chip` | padding `0.4rem 0.8rem` (6.4 / 12.8 px) | CSS:471-474 |
| `.bubble-wizard` | padding `0.5rem 0.9rem`, margin-top 0.5rem | CSS:494-499 |
| `.container-ia-chat` | padding 0.5rem (8 px); ≤480 px: padding-inline 0.75rem (12 px); input height 3.25rem (52 px), padding `0.75rem 3.5rem 0.75rem 0.875rem`; botón voz/enviar 2.5rem (40 px) a `right: 1.5rem`; escuchando: `right: 1rem; width: min(300px, calc(100% - 2rem)); height: 9rem` | CSS:517-531,556-562,596-600,820-823 |
| `.chatap-pills-container` | gap 0.625rem (10 px), `max-width: 36rem` (576 px) | CSS:682-690 |
| `.chatap-pill-btn` | padding `0.55rem 1.15rem` (8.8 / 18.4 px), gap 0.55rem | CSS:692-696 |
| `.chatap-floating-bar` | `max-width: 44rem` (704 px), padding `0.4rem 0.6rem 0.4rem 1rem`, input height 2.75rem (44 px) | CSS:733-770 |
| `.chat-msg` | gap 0.4rem (6.4 px), **max-width `min(78%, 46rem)`** (46rem = 736 px) | CSS:890-895 |
| `.chat-msg__body` | padding `0.75rem 0.875rem` (12 / 14 px) | CSS:908 |
| `.chat-msg__meta` | gap 0.5rem | CSS:898 |
| `.chat-divider` | margin `1.25rem 0` (20 px), gap 0.75rem | CSS:942-944 |
| `.btn` | `px-5 py-2.5` [TW] = 20 / 10 px, gap-2 = 8 px | CSS:1113 |
| `.btn-primary`, `.btn-ghost` | `px-6 py-3` [TW] = 24 / 12 px, gap 8 px | CSS:1118,1124 |
| `.btn-danger` | `px-5 py-2.5` = 20 / 10 px | CSS:1130 |
| `.badge` | `px-2.5 py-0.5` [TW] = 10 / 2 px, gap-1.5 = 6 px | CSS:1135 |
| `.input-field` | `px-4 py-2.5` [TW] = 16 / 10 px | CSS:1108 |
| `.nav-shell` | top 1rem (16 px); ≥640 px: 1.25rem (20 px); `max-width: calc(100vw - 2rem)` (16 px laterales) | CSS:2167-2183 |
| `.nav-pill` | padding `0.35rem 0.5rem 0.35rem 0.65rem`, gap 0.65rem; ≥768: gap 1.15rem, padding `0.35rem 0.55rem 0.35rem 0.75rem` | CSS:2189-2203 |
| `.nav-link` | padding `0.32rem 0.75rem` | CSS:2261 |
| `.nav-cta` | padding `0.32rem 0.85rem` | CSS:2314 |
| `.nav-icon-btn` | 1.85rem = 29.6 px | CSS:2292-2293 |
| `.nav-brand-mark` | 1.65rem = 26.4 px | CSS:2225-2226 |
| `.nav-profile-avatar` | 1.55rem = 24.8 px | CSS:2353-2354 |
| `.nav-dropdown` | ancho 15rem (240 px), top `calc(100% + 8px)` | CSS:2364-2368 |
| `.nav-drawer` | left/right 0, top `calc(100% + 8px)` | CSS:2379-2383 |
| `.hero-btn-primary` / `-ghost` | padding `0.85rem 1.75rem` (13.6 / 28 px), gap 0.6 / 0.5rem | CSS:2062-2099 |
| `.finalcta-btn-*` | padding `0.9rem 2rem` (14.4 / 32 px) | CSS:2118-2146 |
| `.reference-button` | min-height 2.75rem (44 px), padding `0.75rem 1.1rem` | CSS:1884-1889 |
| `.spec-strip__cell` | padding `0.875rem 1.25rem`, min-width 8rem (128 px); ≤639 px: min-width 45%, borde inferior | CSS:2404-2418 |
| `.trust-card` | min-height 20rem (320 px); ≤639 px: 14rem (224 px) | CSS:2729,2735-2737 |
| `.trust-stat` | padding `1.5rem 1.75rem` | CSS:2787 |
| `.services-row` | padding `1.25rem 0`, gap 1.5rem | CSS:2563-2568 |
| `.cap-row` | padding `1rem 0`, gap 1.25rem | CSS:2637-2643 |
| `.hero-avatar-wrap` | 160 × 160 px | CSS:2906-2910 |
| `.hero-orbit` | `min(72%, 34rem)` (544 px), opacity 0.48 | CSS:3005-3011 |
| `.hero-split__left/right` | min-height 100svh; ≤1023 px: right 60svh; ≤639 px: right 52svh | CSS:1972-1993 |
| `.reference-hero` | min-height `calc(100svh - 1.5rem)`; ≤767 px: 1 col, art min-height 30rem (480 px) | CSS:1864-1923 |
| `.tour-*` | bubble padding `12px 16px`; controls padding 4 px, gap 0.5rem; botón 30 px alto; dots 6×6 px (activo 18 px) | CSS:1544,1608,1618,1652-1659 |
| `.problems-terminal__row` | padding `0.85rem 1rem` | CSS:2487 |
| Admin `.admin-content` | `margin-left: var(--sidebar-width)` (280 px); ≤1023 px: 0 | CSS:316-319 |
| Sidebar | 280 px expandido / 72 px colapsado | CSS:131-132 |

Spacing conceptual de VD (intención, no CSS): micro 0.35-0.75rem; control 0.75-1.25rem; bloque 2-4rem; sección `clamp(5rem, 10vw, 10rem)`; chat 1-1.5rem entre mensajes; lectura 34-48rem (VD:103-108). Móvil: padding lateral 16-20 px, mensajes max-width 88 %, composer ≥56 px, pausa vertical 48 px (VD:89,231). Controles ≥44 px en ≤420 px (VD:397).

**8.2 z-index (CSS)**

| Elemento | z-index | Línea |
|---|---|---|
| `.spotlight-card::before` | 1 | CSS:3167 |
| `.container-ia-chat .label-voice/.label-text` | 2 | CSS:571 |
| `.tour-dim` | 30 | CSS:1528 |
| `.tour-ring` | 31 | CSS:1532 |
| `.sidebar-tooltip::after` | 50 | CSS:1207 |
| `.nav-shell` | 60 | CSS:2172 |
| `.nav-drawer` | 65 | CSS:2390 |
| `.nav-dropdown` | 70 | CSS:2375 |
Clases Tailwind z en JSX (conteo por grep, sin mapear a componente): `z-10`, `z-20`, `z-50` (muchas), `z-[60]` (3). Toast: `fixed bottom-4 right-4 z-50`, auto-dismiss 3500 ms (DM:169-170; no verificado en JSX).

**8.3 Breakpoints y qué cambia**

| Condición | Qué cambia | Línea |
|---|---|---|
| `max-width: 480px` | `.container-ia-chat` padding-inline 0.75rem (12 px) (y un bloque anidado `prefers-reduced-motion` que desactiva animación en navbar-action, quick-reply-*, input, label-*) | CSS:820-837 |
| `max-width: 639px` | `.hero-split__right` min-height 52svh; `.spec-strip__cell` min-width 45% + borde inferior + `--border:nth-child(even)` sin borde derecho; `.trust-card` min-height 14rem; `.trust-stats` 1 columna | CSS:1989-1993, 2415-2418, 2735-2737, 2780-2782 |
| `max-width: 640px` | `.quick-replies-grid` pasa de 2 columnas a 1 | CSS:465-469 |
| `min-width: 640px` | `.nav-shell` top 1.25rem; `.services-row__tag` visible (`display:inline-flex`; por defecto `none`) | CSS:2179-2183, 2613 |
| `max-width: 767px` | `.reference-hero` 1 col, art min-height 30rem; `.reference-title` y `.reference-subtitle` con clamp móvil; `.trust-bento` 1 columna | CSS:1918-1923, 2724-2726 |
| `min-width: 768px` | `.section-bleed` padding-inline 3rem; `.nav-pill` gap 1.15rem y padding mayor | CSS:1442-1444, 2199-2204 |
| `max-width: 1023px` | `.admin-content` margin-left 0; `.hero-split` 1 col y right min-height 60svh | CSS:317-319, 1980-1987 |
| `min-width: 1024px` | `.section-bleed` padding-inline 5rem; `.site-navbar` fijo top 1rem, max-width 54rem (864 px), fondo `#070E20 !important`, borde `rgba(241,240,232,0.16)`, textos `#f1f0e8 !important` | CSS:1445-1447, 1904-1916 |
| `prefers-reduced-motion: reduce` | animaciones/transiciones 0.01 ms | CSS:1951-1957 |
- Breakpoints Tailwind v4 por defecto [TW] (no redefinidos en `@theme`): sm 40rem = 640, md 48rem = 768, lg 64rem = 1024, xl 80rem = 1280, 2xl 96rem = 1536 px.
- Breakpoints de intención (VD:393-397): Desktop ≥1280; Laptop 1024-1279; Tablet 768-1023; Mobile ≤767; Mobile pequeño ≤420 (no hay `@media (max-width:420px)` en el CSS). Grid declarado: 12 col desktop / 8 tablet / 4 mobile (VD:60-65), no implementado como CSS global.

### Inferences
- Para móvil (360-430 px) aplican: padding lateral 20 px (`.section-bleed`), quick-replies en 1 columna, `trust-bento`/`hero-split`/`reference-hero` en 1 columna, `nav-shell` ancho máx `100vw - 32px`, tracking/clamps en su mínimo.
- Mensajes de chat: ancho `min(78%, 736 px)` en el CSS; VD:231 pide 88% en mobile (no implementado en CSS global).

### Gaps
- Paddings de `ChatWindow`, header y composer reales (clases Tailwind en JSX) no cubiertos aquí.
- `100svh`/`100dvh` solo en `.hero-split` y `.reference-hero`; safe-area insets no aparecen en el CSS global (`env(safe-area-inset-*)` sin resultados en `index.css`).

---

## 9. Especificación de componentes globales (resumen físico)

### Takeaway
Receta física de los componentes definidos en `index.css` (los que realmente tienen estilo global).

### Cited Findings
| Componente | Receta | Línea |
|---|---|---|
| **Botón primario `.btn-primary`** | pill 9999; padding 24×12; borde 1px `brand-deep`; fondo `brand-deep` (`#1C44B6` / `#2F55C0`); texto `paper` (`#F0F4F9` / `#070E20`); 12 px/700/MAYÚSC./0.1em; hover: fondo+borde `#EBEBEB`, texto `#1A1A1A`; transición 0.15 s ease | CSS:1117-1122 |
| **Botón ghost `.btn-ghost`** | pill; 24×12; fondo transparente; texto ink; borde 1px line; hover igual que primary (`#EBEBEB`/`#1A1A1A`); 12 px/700/0.1em/MAYÚSC. | CSS:1123-1128 |
| **Botón `.btn`** | pill; 20×10; borde line; fondo mist; texto ink; hover fondo soft; 12 px/700/0.05em/MAYÚSC. | CSS:1112-1116 |
| **Botón peligro `.btn-danger`** | pill; 20×10; fondo `bad` (`#d82f2f`); texto paper; hover opacity .9; 12 px/700/0.05em/MAYÚSC. | CSS:1129-1133 |
| **Hero CTA `.hero-btn-primary`** | pill; padding 13.6×28; fondo ink; texto paper; mono 10.4 px/700/0.16em/MAYÚSC.; hover fondo brand, texto `#070E20`, translateY(-2px), sombra `0 8px 24px -4px rgba(47,107,255,.35)` | CSS:2062-2086 |
| **CTA final `.finalcta-btn-primary`** | pill; 14.4×32; fondo brand; texto `#070E20`; mono 10.4 px/800/0.16em; sombra `0 10px 30px -4px rgba(47,107,255,.4)` | CSS:2118-2140 |
| **Input `.input-field`** | ancho 100%; padding 16×10; fondo paper; borde 1px line; radio 16; texto 14 px ink; placeholder faint; foco: borde brand + ring 2 px brand/12 | CSS:1107-1111 |
| **Composer `.container-ia-chat`** | pill; borde 1px line; fondo paper; padding 8; input 52 px alto, 14 px/500; caret brand; botón enviar 40 px circular fondo `brand-deep` texto paper; botón voz 40 px circular color faint; escuchando: panel 300 px × 144 px, fondo mist, sombra `0 6px 24px ink@14%`, color bad | CSS:517-645 |
| **Burbuja asistente `.chat-msg__body`** | 14.4 px/1.5; padding 12×14; borde 1px line; radio 20; fondo paper; texto ink | CSS:907-915 |
| **Burbuja usuario `.chat-msg--user`** | alineada a la derecha; fondo y borde `brand`; texto `#ffffff`; links `#ffffff` | CSS:916-924,938 |
| **Meta de mensaje** | mono 9 px/600/0.18em/MAYÚSC., color faint, debajo del texto (alineada derecha en usuario) | CSS:896-906,925-931 |
| **Card `.card`** | fondo `paper` 86%; borde 1px line/70; radio 20; sin sombra | CSS:1088-1091 |
| **Card hover `.card-interactive`** | + hover: borde `brand 45% / line`, fondo `primary-lighter`, translateY(-2px) | CSS:1092-1103 |
| **Quick reply card** | grid 2 col (1 col ≤640); min-h 68; padding 12×14; borde line@80%; radio 20; fondo paper@86%; icono 40 px circular `primary-light`/`brand-deep`; hover borde brand + fondo `primary-lighter` + translateY(-1px) | CSS:364-469 |
| **Badge `.badge`** | pill; 10×2; borde line; 10 px/700/MAYÚSC./0.1em | CSS:1134-1136 |
| **Chip `.bubble-chip`** | pill; 6.4×12.8; borde line@85%; fondo paper; texto `brand-deep` 11.5 px/600 | CSS:471-492 |
| **Wizard `.bubble-wizard`** | pill; 8×14.4; fondo `brand-deep`; texto #fff; 11.5 px/600; hover fondo brand | CSS:494-515 |
| **Navbar flotante `.nav-pill`** | pill; fondo `rgba(10,17,36,.94)`; borde 1px `rgba(255,255,255,.12)`; sombra `0 10px 30px -4px rgba(0,0,0,.28)` + brillo interno; centrado top 16 px (20 px ≥640) | CSS:2167-2210 |
| **Sidebar admin** | 280 px / 72 px; bg `#141414`; borde `rgba(255,255,255,.12)`; texto `#9e9e9e`, hover fondo `#222`/texto #fff; sección `#5e5e5e`; activo fondo brand + texto #fff | CSS:122-132 |
| **Skeleton** | gradiente 90° mist/soft/mist (25%/37%/63%), 800 px, 1.4 s linear, radio 8 | CSS:1143-1148 |
| **Scrollbar chat `.chat-scroll`** | ancho 6 px (0.375rem), thumb `--color-line` radio 999, track transparente | CSS:881-887 |
| **Tooltip sidebar** | fondo ink, texto paper, 12 px/500, padding 5×10, radio 6, sombra `0 4px 12px rgba(0,0,0,.15)`, z 50 | CSS:1193-1211 |
| **Punto de estado `.status-dot` / `.ui-dot` / `.hero-eyebrow-dot`** | círculos 8 / 6 / 6.4 px | CSS:1706-1711, 874-879, 2017-2024 |

### Inferences
- La capa más "global" para móvil: Composer, burbujas, quick-replies, cards, botones, badge, inputs. La capa mono/MAYÚSCULAS con tracking ancho es la firma tipográfica.

### Gaps
- Estados disabled/loading de botones no definidos en CSS global (sólo `.label-text:disabled` `cursor:not-allowed`, CSS:642-644).
- Toasts, modales, tablas admin y StatusPill se definen por utilidades Tailwind en JSX (DM:146-170), no verificadas.

---

## 10. Identidad visual declarada (citas) y atributos físicos que la implementan

### Takeaway
La documentación declara una identidad "Azul de Estado": navy institucional + un único azul eléctrico usado con moderación + papel frío; avatar "blob" procedural como firma; tono cálido, confiable, gubernamental pero amigable (ciudadano) y sobrio/denso (admin). El CSS implementa navy/azul y avatar, pero añade capa mono-editorial y pills que los docs VD critican.

### Cited Findings
Citas textuales:
- DM:8-12: "ChatAP is a governmental virtual assistant with two surfaces: a citizen-facing chatbot (Persuade + Experience) and an internal admin panel (Operate). The system is built on a deep-navy, institutional-blue token system with dark/light theming. The signature element is a procedurally-animated blob avatar driven by the `--bot-body` / `--bot-eye` CSS variables."
- DM:14 "Identity — 'Azul de Estado'", tres ideas: "Navy chrome … deep ocean-navy instead of near-black grey" (DM:19-22); "Key accent (`--color-brand`) — a single charged electrical blue … used *sparingly*: CTAs, active nav, caret, focus rings, section numbers and the avatar glow. Nothing else is colored." (DM:23-26); "Cool paper … blue-grey off-white (not warm cream) so every surface reads cool, calm and official." (DM:27-29).
- DM:30-37: "The orange 'specimen' identity was retired. The product now runs on a **friendly & rounded** expression of the navy system … soft elevation shadows, calm display typography (no oversized editorial type), and plain-language section copy. Decorative layers (terminal windows, dot grids, orbit rings, marquees, watermark numerals, word-by-word reveals) were removed from the landing" — **pero el CSS actual sí contiene** terminal (`problems-terminal`, `chat-terminal`), orbit rings, marquee/ticker, `word-reveal` y `giant-outline`; y `--shadow-soft: none`, tipografía display muy grande. DM:30-37 está desactualizado respecto del CSS.
- PM:111-117: "Citizen chatbot: a blend of *Operate* … and *Experience* (the animated blob leads the interface)"; "Citizen-facing: warm, trustworthy, governmental but friendly. The assistant helps, never confuses."; "Admin panel: calm, work-focused, professional. No hype, no decorative excess. Data density with clear hierarchy."
- PM:123-127 Anti-references: "Purple gradients / rainbow palettes."; "Glassmorphism heavy frosted panels (only light backdrop-blur is acceptable on the sticky header)."; "'Boost your productivity' marketing copy; empty-state fluff."; "Emoji-everywhere UI, animated bouncing CTAs."
- VD:8: "ChatAP no sera una landing que contiene un chat. Sera un producto conversacional con una identidad editorial continua."; VD:19 "debe sentirse institucional, contemporanea y precisa. No debe parecer un portfolio, una startup, un dashboard SaaS ni una pagina generada con bloques repetidos."
- VD:25 tipografía: "Mantener PP Neue Montreal y PP Neue Montreal Text como familia principal. Usar la familia display para titulos, navegacion de seccion y numeracion; usar la familia Text para lectura, conversaciones y formularios." (el CSS usa Neue —no Text— para el cuerpo; ver sección 2).
- VD:133-139 radios: "0-6px en estructura editorial, 6-10px en controles, circular solo para avatar, indicadores y acciones claramente circulares … No usar pills para navegacion, filtros o respuestas rapidas salvo que representen una etiqueta de estado." (contradicho por CSS: nav/chips/quick-replies/botones son pill o 20 px.)
- VD:145-161 color: "Conservar el sistema Azul de Estado … El azul debe indicar accion o estado, nunca decorar cada bloque. No usar gradientes como identidad principal."
- VD:116-127 bordes: "1px para estructura. 2px solo para foco visible o estado critico."
- VD:241 composer: "una linea de trabajo continua: input amplio, microfono y envio funcionales, sin panel elevado ni grupo de botones pill." VD:239-240: usuario se diferencia "por alineacion y tono de superficie, no por una burbuja saturada"; asistente "puede incluir una regla lateral azul". (El CSS actual pinta la burbuja de usuario con `brand` saturado y no tiene regla lateral azul.)
- VD:458-477 antipatrones: pills para navegación/CTAs, glassmorphism como superficie principal, sombras para profundidad, iconos de relleno, fade-in idéntico, etc.
- DM:99-102: micro labels `font-semibold uppercase tracking-widest`; botones `font-semibold`; stats `font-bold`.
- DM:172-191 Motion: easing preferido `cubic-bezier(0.22, 1, 0.36, 1)`; "No bounce/elastic for UI chrome; only the bot avatar's playful `rx-bounce`"; micro-interacciones 150-250 ms, páginas/listas 300-500 ms, skeleton 1.4 s.
- RP:19 "theme `dark` por clase"; RP:44-57 mapa referencia→proyecto (contenido histórico).

Atributos físicos que implementan la identidad (CSS):
- Navy: `#070E20` (paper oscuro, terminal, hero derecho, navbar `rgba(10,17,36,.94)`).
- Un acento: `--color-brand` `#2F6BFF`/`#4D7DFF` en CTA, caret (`caret-color`, CSS:540), focus (CSS:209-212, 1110), `sec-meta::before`, `nav-link-dot`, mensajes de usuario.
- Papel frío: `#F0F4F9`.
- Avatar: `--bot-body`/`--bot-eye` (CSS:111-112,174-175); contenedor `.hero-avatar-wrap` 160×160 px con glow `drop-shadow(0 0 28px rgba(47,107,255,.18))` (CSS:2906-2915); estados: `rx-*` (CSS:984-1019), `speak` (977-982), `avatar-pop` (1081-1085, 1184), `zzz` (1007-1028).
- Rigor "técnico": labels mono MAYÚSC., hairlines 1 px, numeración (`fig-num`, `cap-row__num`, `services-row__num`).

### Inferences
- Hay dos lenguajes conviviendo en el CSS: (1) "friendly & rounded" (cards 20 px, inputs 16 px, pills) y (2) "editorial/mono cuadrado" (chips y paneles de la landing con radio 0). Un clon móvil del chat debe seguir (1) + labels mono de (2).

### Gaps
- Ninguna fuente declara explícitamente un "espaciado base" en px más allá de Tailwind; DM:104-112 lista `px-3 py-2.5`, `px-4 py-3`, `p-4/p-5`, `gap-2/3/4`.
- No se encontró guía textual específica de la UI móvil nativa; VD:379-397 es la más cercana.
