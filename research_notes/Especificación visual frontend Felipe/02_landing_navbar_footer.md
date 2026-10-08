# Landing pública (HomePage, Navbar, Footer, hero, carruseles, decorativos) — rama dev-felipe

**Fuente**: checkout local de `monzonfelipe0710-stack/asistente-virtual@dev-felipe` (commit `b9b83c4999cbe3fafbb2a5e634747c5b81c2f611`), carpeta `/tmp/claude-0/-home-user-asistente-virtual/4cdb6b8f-1612-5897-a440-536f8ba0cd2f/scratchpad/dev-felipe`. Sin búsqueda web. "Fuente" = ruta de archivo:línea relativa a esa carpeta.

**Abreviaturas de rutas**: `HP.jsx` = `src/pages/HomePage.jsx` · `HP.css` = `src/pages/HomePage.css` · `IDX` = `src/index.css` · `C/` = `src/components/common/` · `HCB` = `C/HeroCinematicBackground` · `NAV` = `C/Navbar.jsx` · `FOO` = `C/Footer.jsx` · `GOO` = `C/GooeyNav` · `LL` = `C/LogoLoop` · `ICM` = `C/InteractiveChatMockup.jsx`.

**Convenciones de lectura (importante para no equivocarse al replicar)**
- Tailwind v4.3 (`package.json:12-13`, `IDX:1` `@import "tailwindcss"`). Breakpoints = defaults de Tailwind (no hay `--breakpoint-*` en `@theme`): `sm`=640px, `md`=768px, `lg`=1024px. 1rem = 16px. Escala de texto Tailwind v4: `text-xs` 12/16px, `sm` 14/20, `base` 16/24, `lg` 18/28, `xl` 20/28, `3xl` 30/36, `4xl` 36/40, `5xl` 48/48(lh 1), `6xl` 60/60, `7xl` 72/72.
- Radios redefinidos en `@theme` (`IDX:134-144`): `rounded-md`=8px, `rounded-lg`=12px, `rounded-xl`=16px, `rounded-2xl`=20px, `rounded-3xl`=28px, `--radius-control`=9999px (pill), `--radius-card`=20px. (NO coinciden con DESIGN.md, que dice 10px/14px: **el código manda**).
- Cascada: CSS sin `@layer` (HP.css, GooeyNav.css, HeroCinematicBackground.css, LogoLoop.css, ScrollFloat.css) **gana siempre** sobre utilidades Tailwind. Lo marco "(CSS gana)" donde una utilidad en el JSX queda anulada.
- Los valores de color/sombra de la paleta por defecto de Tailwind (p. ej. `emerald-500`, `shadow-lg`, `neutral-800`) **no están en el repo**: los marco "(default Tailwind)".
- Tema por defecto = **OSCURO** para visitantes nuevos (`index.html:24-33`: si no existe `chatap_dark_default_v1` se fuerza `theme=dark`; solo `theme==="light"` quita la clase `dark`). Fondo inicial `#070E20` (oscuro) / `#F0F4F9` (claro) (`index.html:14-20`).

---

## 0. Tokens base (usados en todas las secciones)

### Takeaway
Paleta "Azul de Estado": papel azul-gris frío (claro) o navy profundo (oscuro), un único acento azul eléctrico. Tipografía PP Neue Montreal (familia propia en `public/fonts`).

### Cited Findings
| Token | Claro | Oscuro | Fuente |
|---|---|---|---|
| `--color-ink` (texto) | `#0F1730` | `#EAF0FA` | IDX:84 / IDX:160 |
| `--color-paper` (fondo) | `#F0F4F9` | `#070E20` | IDX:85 / IDX:161 |
| `--color-mist` | `#E2EAF4` | `#0D1730` | IDX:86 / IDX:162 |
| `--color-soft` | `#D5E2F1` | `#132247` | IDX:87 / ~163 |
| `--color-line` (bordes) | `rgba(15,23,48,.12)` | `rgba(234,240,250,.12)` | IDX:88 / IDX:164 |
| `--color-muted` (texto secundario) | `#4A5578` | `#8A9BC0` | IDX:89 / IDX:165 |
| `--color-faint` | `#7E8BA7` | `#4E5F85` | IDX:90 / IDX:166 |
| `--color-brand` (acento) | `#2F6BFF` | `#4D7DFF` | IDX:104 / IDX:167 |
| `--color-brand-dark` | `#2558E0` | `#3A6AE0` | IDX:105 / IDX:168 |
| `--color-brand-deep` | `#1C44B6` | `#2F55C0` | IDX:106 / IDX:169 |
| `--color-primary-lighter` | `#F5F8FF` | `#091230` | IDX:118 / IDX:177 |
| `--color-ok` | `#18bc42` | igual | IDX:108 |
- Fuentes: `--font-sans` = "PP Neue Montreal", "PP Neue Montreal Text", system (IDX:78); `--font-neue` = "PP Neue Montreal" (IDX:79); `--font-neue-text` = "PP Neue Montreal Text" (IDX:80); `--font-mono` = ui-monospace, SFMono-Regular, Cascadia Mono… (IDX:81). `body` usa `font-sans`, `antialiased`, `font-feature-settings: "cv03","cv04","cv09","cv11"` (IDX:195-203).
- Pesos con archivo real (`IDX:3-68` `@font-face`): Thin 250, Book 350, Regular 400, Medium 500, Semibold 600, Bold 700, Black 900, Italic 400; "Text": Regular 400 y Medium 500 (solo estos dos). Archivos en `public/fonts/PPNeueMontreal-*.woff2` (10 archivos).
- Transición de tema: `html/body` `background-color .2s ease, color .2s ease` (IDX:187-205); nav-pill, bordes, header/footer: `.2s ease` (IDX:~279-292).
- Selección de texto: fondo `--color-brand`, texto `#fff` (IDX:~207; HP.jsx:145 `selection:bg-brand selection:text-white`).
- Raíz de la página: `<div class="min-h-screen flex flex-col bg-paper text-ink font-sans relative …">` (HP.jsx:145). Orden en pantalla: [Partículas fijas] → Navbar fija → `<main id="contenido" class="flex-1 w-full relative z-10">` con 5 secciones → Footer (HP.jsx:147-389).

### Inferences
- `font-extrabold` (800) se usa en casi todos los títulos, pero **no existe cara 800** en `@font-face`: por la regla CSS de coincidencia de peso (>500 busca hacia arriba) se renderiza con **PPNeueMontreal-Black (900)**. En móvil nativo usar la cara Black/ExtraBold más pesada disponible. `font-bold` (700) = Bold; `font-semibold` (600) = Semibold; `font-medium` (500) = Medium.

### Gaps
- PP Neue Montreal es una fuente comercial; el repo incluye los .woff2 pero no se verificó licencia. Para app móvil hay que convertirlos a TTF/OTF o usar fallback del sistema (`ui-sans-serif, system-ui`).

---

## 1. Sección 1 — Hero (`#inicio`)

### Takeaway
Pantalla completa (≥92% del alto visible) con foto de fondo rotativa difuminada por un velo del color del tema, título centrado de 36/60/72px, subtítulo, 3 "sellos" de confianza y, abajo, una marquesina de logos institucionales. Todo centrado horizontalmente.

### Cited Findings — estructura física (de arriba abajo)
- **Contenedor `<section id="inicio">`**: clases `hero-cinematic section-bleed relative flex flex-col justify-between min-h-[92svh] lg:min-h-screen` (HP.jsx:165-169). **(CSS gana)** `.hero-cinematic{position:relative;overflow:hidden;isolation:isolate;background:transparent;display:flex;flex-direction:column;justify-content:space-between;min-height:92vh;min-height:92svh}` (HP.css:1-11) → **min-height = 92svh en TODOS los anchos** (el `lg:min-h-screen` queda anulado). Padding horizontal por `.section-bleed`: **20px** (<768) / **48px** (≥768) / **80px** (≥1024) (IDX:1441-1447).
- **Fondo (`<HeroCinematicBackground/>`, HP.jsx:171)**: capa `position:absolute; inset:0; overflow:hidden; z-index:0; isolation:isolate; pointer-events:none` (HCB.css:13-22). Pila de capas (todas inset:0 salvo indicación):
  1. **Imágenes** (HCB.jsx:4-20): 3 slides cuadro completo, `object-fit:cover; object-position:center 36%` (HCB.css:50-56): `/assets/hero/hero-bg-1.jpg` (1376×768, edificio cívico de vidrio al anochecer reflejado en espejo de agua, cielo nublado azul), `hero-bg-2.jpg` (1376×768, río/costanera al atardecer con puente iluminado, cielo azul-rosado), `hero-bg-3.jpg` (**896×1200 vertical**, montañas con bruma al amanecer, tonos dorado/azul). Se verificó visualmente cada imagen.
  2. **Tinte** `z-index:2`: claro `linear-gradient(180deg, rgba(240,244,249,.68) 0%, rgba(240,244,249,.84) 100%)` (HCB.css:74-78); oscuro `linear-gradient(180deg, rgba(7,14,32,.62) 0%, rgba(7,14,32,.82) 100%)` (HCB.css:82-84). **Móvil ≤768px**: claro `.80→.92`, oscuro `.75→.90` (HCB.css:157-166).
  3. **Foco** `z-index:3`: `radial-gradient(ellipse 75% 65% at 50% 40%, rgba(240,244,249,.88) 0%, rgba(240,244,249,.45) 55%, transparent 100%)`; oscuro mismo con `rgba(7,14,32,.9)/.5` (HCB.css:87-96).
  4. **Viñeta** `z-index:4`: `radial-gradient(ellipse at center, transparent 55%, rgba(15,23,48,.18) 100%)`; oscuro `rgba(0,0,0,.35)` (HCB.css:99-108).
  5. **Fade inferior** `z-index:5`, `bottom:0; left:0; right:0; height:38%`: `linear-gradient(to bottom, transparent 0%, rgba(240,244,249,.7) 65%, #F0F4F9 100%)`; oscuro `… rgba(7,14,32,.7) 65%, #070E20 100%` (HCB.css:111-124). Funde el hero con la sección 2.
  6. **Brillo ambiental** `z-index:6`: `top:0; left:50%; translateX(-50%); width:90vw; max-width:1100px; height:280px; radial-gradient(ellipse at 50% 0%, rgba(47,107,255,.14) 0%, transparent 70%)`; oscuro `rgba(77,125,255,.18)` (HCB.css:127-141). Móvil: `height:180px; opacity:.7` (HCB.css:168-171).
- **Rotación del fondo**: 3 slides, **10 s** cada una (HCB.jsx:22), crossfade `opacity 2200ms cubic-bezier(.4,0,.2,1)` (HCB.css:38). Slide activa con "Ken Burns": `animation: heroKenBurns 22s cubic-bezier(.25,1,.5,1) infinite alternate`; keyframes `0%: scale(1.03) translate(0,0)` → `50%: scale(1.075) translate(-0.6%,-0.35%)` → `100%: scale(1.105) translate(0.5%,-0.65%)` (HCB.css:44-69). Móvil ≤768px: duración **28 s** (HCB.css:154-158). Con `prefers-reduced-motion`: solo slide 1 fija sin animación (HCB.css:145-153; HCB.jsx:71).
- **Bloque de contenido** `<div class="ed-max hero-cinematic__inner relative z-10 flex flex-col items-center justify-center flex-1 w-full text-center px-4 pt-28 sm:pt-32 pb-10">` (HP.jsx:173): `max-width:80rem (1280px)` centrado (`.ed-max`, IDX:1440); `padding-inline:16px` (`px-4`); **(CSS gana)** `padding-top: clamp(6rem, 13vh, 8.5rem)` = **96–136px** y `padding-bottom: clamp(1.5rem, 3vh, 2.5rem)` = **24–40px** (HP.css:113-123; anulan `pt-28/sm:pt-32/pb-10`). Contenido centrado vertical y horizontalmente. Margen horizontal efectivo del texto en móvil = 20px (section-bleed) + 16px (px-4) = **36px por lado**.
- **Título H1** (HP.jsx:175-187): wrapper `.hero-anim-title max-w-4xl mx-auto` (**896px**). Componente `ScrollFloat as="h1" mode="once"`; texto literal: **"Tus trámites en Formosa, simples y al instante."** Clases del texto: `text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink leading-[1.08] m-0 block` → **36px (<640) / 60px (≥640) / 72px (≥1024)**, peso 800 (cara Black), tracking −0.025em, line-height **1.08**, color `ink`. Cada palabra es `inline-block; white-space:nowrap; margin-right:.32em` y cada letra `inline-block` (ScrollFloat.css:1-17); el span del texto queda `display:inline` (CSS gana) (ScrollFloat.css:4-8). Centrado (`text-center` del padre). `containerClassName="hero-cinematic__title-container"` no tiene CSS definido (grep sin resultados).
- **Subtítulo** (HP.jsx:190-192): `<p class="hero-anim-sub mt-6 text-base sm:text-lg lg:text-xl text-muted max-w-2xl mx-auto leading-relaxed m-0 font-normal">` → margen superior **24px**, **16px / 18px (≥640) / 20px (≥1024)**, line-height 1.625, peso 400, color `muted`, ancho máx **672px**, centrado. Texto literal: **"Consultá expedientes SIGED, descargá formularios oficiales y obtené respuestas verificadas las 24 horas, sin filas ni traslados."**
- **Fila de 3 sellos** (HP.jsx:195-214): contenedor `flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mt-10 text-xs text-muted font-medium select-none` → margen superior **40px**, separación horizontal **24px**, vertical **10px**, 12px/peso 500, color `muted`, centrado, envuelve a varias líneas en móvil. Cada sello: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs` → píldora con padding **12px × 4px**, gap icono-texto **6px**, fondo `rgba(255,255,255,.6)` (claro) / `#0D1730` al 60% (oscuro), borde 1px `line` al 40% (≈ alpha .048), blur de fondo 4px, sombra `shadow-xs` (default Tailwind: `0 1px 2px 0 rgb(0 0 0/.05)`). Icono: círculo con check relleno, SVG viewBox 20, **14×14px**, `text-emerald-500` (default Tailwind v4 ≈ `#00BC7D`; en v3 era `#10B981`). Textos literales, en orden: **"100% Gratuito y de libre acceso"**, **"Atención continua 24 horas"**, **"Subsecretaría de Recursos Humanos"**.
- **Pie del hero (marquesina)** (HP.jsx:218-235): `<div class="hero-anim-footer hero-cinematic__footer relative z-10 w-full bg-transparent pb-6">`; **(CSS gana)** `padding-bottom: clamp(1.25rem, 3vh, 2.25rem)` = 20–36px (HP.css:125-131). Interior `ed-max flex flex-col items-center gap-2` (gap **8px**). 1) Etiqueta `text-[10px] uppercase tracking-[0.22em] text-muted/70 font-semibold`: **"Un proyecto del Gobierno de la Provincia de Formosa"** (10px, tracking 0.22em, peso 600, muted al 70%). 2) `LogoLoop` (HP.jsx:223-233): `speed=26` (px/s), `direction="left"` (desplaza hacia la izquierda), `logoHeight=28`, `gap=56`, `fadeOut` (máscara horizontal `transparent → black 10% → black 90% → transparent`, LL.css:95-111), `pauseOnHover` (velocidad 0 al pasar el cursor, LL.jsx:151-156), `scaleOnHover` (agrega `padding-top/bottom = 10% de 28px = 2.8px`, LL.css:14-17), ancho 100%. La pista repite la secuencia el nº de copias necesario; cada lista tiene `gap:56px` y `padding-right:56px` (LL.css:31-44; LL.jsx:206-234). Easing de velocidad: τ=0.25 s (LL.jsx:4).
  - Items (HP.jsx:78-119): (a) imagen **Todos Unidos** `todos-unidos-light.png` / `-dark.png` (336×132 px reales → renderiza ≈ **71×28px**, `height:28px; width:auto; object-fit:contain`, LL.css:182-191); (b) imagen **Gobierno de Formosa** `gobierno-formosa-light.png` / `-dark.png` (426×132 → ≈ **90×28px**); (c) marca de texto **ChatAP**: monograma "AP" en cuadrado de `1.85rem` (29.6px), radio `.45rem` (7.2px), fondo `brand`, texto blanco 0.64rem (10.2px) peso 800 tracking −0.05em (LL.css:193-204) + texto "ChatAP" + "." en color `brand`, 16px (1rem) peso 700 tracking −0.03em, color `ink`, gap .65rem (10.4px) (LL.css:164-174). Los PNG "light" son oscuros (tinta navy sobre transparente) para tema claro; los "dark" son blanco-azulados para tema oscuro (verificado visualmente). El tema se detecta con `useTheme` (HP.jsx:122, 135-138).
- **Animaciones de entrada** (HP.css:60-97): keyframes `heroSlideUp` de `opacity:0; translateY(16px)` a `opacity:1; translateY(0)`, easing `cubic-bezier(.16,1,.3,1)`, `both`. Título: **.75s, delay .18s**; subtítulo: **.7s, delay .28s**; fila de sellos: **.7s, delay .58s**; pie/marquesina: **.7s, delay .68s**. Adicionalmente las letras del H1 (ScrollFloat `mode="once"`, HP.jsx:176-181; ScrollFloat.jsx:152-174): cada carácter parte de `opacity:0; yPercent:45` (origen 50% 100%) hacia `opacity:1; yPercent:0`, duración **.85s**, ease `power3.out` (≈ easeOutCubic), stagger **0.012s por carácter**, se dispara una vez cuando el tope del título cruza el 85% del viewport. `prefers-reduced-motion`: sin animaciones, todo visible (HP.css:99-111).
- **Capa de partículas global** (HP.jsx:147-158; HP.css:14-34): contenedor `position:fixed; inset:0; z-index:2; pointer-events:none; opacity:.72`, fade-in `1.2s ease .1s` de 0 a .72. Canvas WebGL (OGL) con `particleCount` **320** (≥768px al cargar) o **180** (<768), `speed .05`, `particleBaseSize 16`, `moveParticlesOnHover`. Colores claro `#1E40AF #2563EB #0284C7 #3B82F6 #1D4ED8 #0369A1`; oscuro `#FFFFFF #FFFFFF #93C5FD #60A5FA #38BDF8 #BFDBFE` (HP.jsx:129-133). Cada punto es un disco con núcleo + aura suave, tamaño 3–36px (clamp), alpha `(núcleo*.55 + aura²*.45) * parpadeo(0.8–1.0) * .85` (Particles.jsx:64-80, vertex ~38-52), deriva vertical lenta (+0.1/s), oscilación horizontal sinusoidal ±.25, paralaje con el scroll.

### Inferences
- Como `<main>` es `relative z-10` (stacking context) y la capa de partículas es `z-index:2`, las partículas quedan **detrás** de todo el contenido de `<main>`: el hero (imagen opaca + velo) las tapa; **solo se ven en las secciones 2-5 (fondo transparente)** y atenuadas a través del footer (`bg-paper/95`). Inferido de la cascada de z-index, no verificado en navegador.
- Alto real del hero en móvil = 92% del alto visible (p. ej. 736px en un viewport de 800px).
- Con una pantalla de 360px de ancho: ancho útil del H1 = 360 − 40 − 32 = **288px** a 36px de fuente; el título ocupa ~4 líneas.

### Gaps
- No se midió el ancho de texto renderizado ni la altura exacta del H1 (depende de la métrica de la fuente).
- La clase `.hero-cinematic__title` (HP.css:153-168, con `clamp(2.25rem,5.2vw,4.75rem)` y override móvil `clamp(3.45rem,16vw,5.5rem)` en HP.css:205-209) **no se usa** en el H1 del Home (solo la usa `BannerCarousel`, sin montar). No aplicar esos valores.
- Código muerto en HP.css (clases sin uso en el JSX): `.home-fallback-drift` (37-57), `.hero-anim-bot/search/pills` (60-78), `.hero-cinematic__kicker` (133-151), `.cta-cinematic` (182-203), `.hero-quick-*` (212-258), `.bento-*` (261-295), `.siged-step-indicator` (298-319), `.hero-search-bar` (322-370). No forman parte de la pantalla.

---

## 2. Sección 2 — "El Asistente en Acción" (`#en-accion`)

### Takeaway
Bloque centrado con kicker, título, bajada, una maqueta de chat (tarjeta de 512px de ancho máx.) que reproduce 3 conversaciones en bucle, y un botón CTA pill.

### Cited Findings
- **Sección** (HP.jsx:239): `section-bleed bg-transparent py-20 lg:py-28 border-t border-line/40` → padding vertical **80px (<1024) / 112px (≥1024)**; borde superior 1px `line` al 40%; fondo transparente (se ve el fondo `paper` + partículas). Interior `ed-max flex flex-col items-center gap-12` (HP.jsx:240): columna centrada, separación **48px**.
- **Cabecera** `text-center max-w-2xl mx-auto space-y-3` (HP.jsx:241-251; ancho 672px): (1) kicker `<span class="text-xs font-mono font-bold uppercase tracking-wider text-brand">` **"Demostración en vivo"** (12px, monoespaciada, bold, tracking .05em, color `brand`); (2) `<h2 class="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">` **"Una conversación, una respuesta oficial."** (**30px / 36px ≥640**, line-height 36/40px, peso 800, tracking −.025em); (3) `<p class="text-base text-muted m-0 leading-relaxed">` **"Mirá cómo resuelve dudas en tiempo real con datos de la Subsecretaría de Recursos Humanos y el Sistema SIGED."** (16px, lh 1.625, `muted`).
- **Contenedor de la maqueta** `w-full max-w-4xl mx-auto` (HP.jsx:254) pero la tarjeta (ICM.jsx:140-143) es `w-full max-w-lg mx-auto` → **ancho máx. 512px** centrada.
- **Tarjeta maqueta** (ICM.jsx:141): `rounded-3xl` (**28px**) · `border border-line` · fondo `bg-gradient-to-b from-mist/90 via-paper to-mist/60` (degradado vertical: arriba `mist` 90%, centro `paper`, abajo `mist` 60%) · padding **12px (<640) / 20px (≥640)** · `shadow-xl` (default Tailwind: `0 20px 25px -5px rgb(0 0 0/.1), 0 8px 10px -6px rgb(0 0 0/.1)`) · `relative select-none`.
  - **Cabecera de la tarjeta** (ICM.jsx:145-205): fila `flex justify-between pb-3.5 border-b border-line/70` (padding-bottom 14px). Izquierda: (a) **3 puntos decorativos "ventana"** solo ≥640px: círculos de **10px**, gap 6px, colores `red-400/80`, `amber-400/80`, `emerald-400/80` (default Tailwind); (b) **avatar ChatBot 30px** (blob animado, `reaction` idle/thinking/happy según paso) con **punto de estado** 10px `emerald-500` con `ring-2 ring-paper` posicionado `-bottom-0.5 -right-0.5` (−2px) y pulso; gap entre elementos 10px; (c) texto: línea 1 **"ChatAP"** (12px bold `ink` tracking-tight) + chip **"Oficial"** (10px semibold, color `brand-deep` sobre `brand-deep/10`, padding ≈6px×0.8px, radio 8px); línea 2 **"Gobierno de Formosa · En línea"** (10.5px, `muted`, leading-tight). Derecha: botón **"Reiniciar"** (texto oculto <640px, solo icono) `px-2.5 py-1 text-[11px] font-medium text-muted bg-paper border border-line rounded-full shadow-2xs`, icono refrescar 14px que gira 180° (500ms) al hover; hover: texto `brand-deep`, fondo blanco.
  - **Selector de ejemplos** (ICM.jsx:208-229): `mt-2.5` (10px) fila `flex gap-1.5 (6px) overflow-x-auto pb-1`. Etiqueta **"Ejemplos:"** (10px semibold uppercase tracking .05em `muted`, pl 4px). 3 píldoras `text-xs font-semibold px-2.5 py-1 rounded-full border`: **"Licencia médica"**, **"Recibo de haberes"**, **"Estado de expediente"**. Activa: `bg-brand-deep text-white border-brand-deep shadow-xs`. Inactiva: `bg-paper/80 text-muted border-line`, hover borde `brand/40`, texto `ink`.
  - **Área de mensajes** (ICM.jsx:232-366): `mt-3 flex flex-col gap-3 min-h-[340px] max-h-[370px] overflow-y-auto px-1 py-1.5`, transición 300ms; al cambiar de escenario `opacity:0; translateY(4px)` y vuelve. Se desplaza (scroll interno suave) al final en cada paso.
    - **Burbuja ciudadano** (clase `.chat-msg--user`, IDX:890-925): alineada a la derecha, ancho máx `min(78%, 46rem)`; cuerpo `padding .75rem .875rem` (12×14px), borde 1px `brand`, radio `--radius-card` **20px**, fondo `brand`, texto `#fff` **12px (<640) / 13px (≥640)** line-height 1.625, `shadow-xs`. Meta bajo la burbuja: `"Vos · HH:MM"` en mono **9px (0.563rem)** peso 600 tracking .18em MAYÚSCULAS, color `ink` al 55%, alineada a la derecha; separación burbuja-meta 6.4px (.4rem).
    - **Burbuja bot**: fila `flex items-start gap-2.5` (10px) con avatar **26px** (estático, `mt-1`) + cuerpo `bg-paper border border-line text-ink` mismo padding/radio 20px/`shadow-xs`; meta `● ChatAP · HH:MM` (punto 6px `brand` + 10px `muted`).
    - **Chips de acción** dentro de la burbuja bot (`mt-2.5 pt-2 border-t border-line/60 flex flex-wrap gap-1.5`): `.bubble-chip` (IDX:471-492): píldora, fondo `paper`, borde 1px `line`, texto `brand-deep`, peso 600, line-height 1.2; en el JSX `text-[11px] py-1 px-2.5` (utilidades ganan en capa) → fuente **11px**, padding **4×10px**; hover: borde `brand`, fondo `primary-lighter`, `scale(1.02)`; active `scale(.98)`.
    - **Indicador "escribiendo"** (pasos 2 y 5): avatar 24px + burbuja `py-2 px-3.5 bg-paper border border-line rounded-2xl (20px) flex gap-1.5 shadow-2xs`; texto 11px `muted` **"ChatAP está respondiendo"** (paso 2) / **"ChatAP verificando canales"** (paso 5) + 3 puntos de **6px** color `brand` con rebote (`animate-bounce` default Tailwind: 1s infinito, `translateY(-25%)`) y delays **0 / 150 / 300 ms**.
    - **Insignia de verificación** (paso 6): `mt-2.5 inline-flex gap-1.5 rounded-lg (12px) bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700` (oscuro `emerald-400`), con icono check 14px (stroke 2.5).
    - Entrada de cada mensaje: `animate-fade-up` = `opacity 0→1; translateY(10px→0)`, **.22s cubic-bezier(.22,1,.36,1)** (IDX:215-218, 323).
  - **Tiempos del guion** (ICM.jsx:90-97): paso 1 muestra pregunta 1 → +1100ms escribiendo → +1300ms respuesta bot 1 con chips → +2800ms pregunta 2 → +1100ms escribiendo → +1300ms respuesta 2 con insignia → +4500ms y disuelve (300ms) al siguiente escenario (bucle infinito entre 3).
  - **Toast al tocar un chip** (ICM.jsx:369-374): `absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-ink text-paper text-xs rounded-full shadow-lg border border-line`, "✓" `emerald-400` + `Acción: "<etiqueta del chip>"`, visible 2.2 s.
  - **Barra de entrada simulada** (ICM.jsx:377-415): `mt-3 pt-2.5 border-t border-line/60`. Input (solo lectura) `w-full rounded-full border border-line bg-paper/90 pl-4 pr-20 py-2 text-xs text-ink shadow-inner`, placeholder **"Escribí tu consulta sobre trámites o servicios..."** (`muted/60`). A la derecha (right 6px): icono micrófono 14px `muted` + botón enviar **24px** circular `bg-brand-deep` icono flecha blanca 12px (hover `bg-brand`). Debajo (`mt-1.5 px-1 text-[10px] muted`, justify-between): **"Respuestas oficiales en lenguaje sencillo"** (izq) / **"Gobierno de Formosa"** (der, mono).
  - **Contenido literal de los 3 escenarios** (ICM.jsx:4-61):
    1. *Licencia médica* (badge "Salud y Personal", no se muestra): Usuario 10:14 "¿Cómo solicito una licencia médica y qué documentación necesito?" → Bot 10:14 "Para gestionar una licencia médica oficial debés presentar dentro de las 48 hs hábiles el certificado médico con diagnóstico y el Formulario F-04." Chips: "📥 Descargar Formulario F-04", "📋 Requisitos completos", "📍 Mesa de Entradas Digital". Usuario 10:15 "¿Puedo hacer la presentación de manera 100% digital?" → Bot 10:15 "¡Sí! Podés adjuntar el formulario y el certificado escaneado a través de MiPortal Formosa con tu Clave Fiscal provincial, sin necesidad de acercarte a la oficina." Insignia: "Trámite 100% digital · Validez provincial inmediata".
    2. *Recibo de haberes*: U 11:20 "¿Dónde puedo consultar y descargar mi último recibo de haberes?" → B "Tu recibo de sueldo digital se encuentra disponible en MiPortal Formosa dentro de la sección 'Mis Haberes', habilitado desde el último día hábil de cada mes." Chips: "📄 Ir a Mis Haberes", "📅 Cronograma de pagos", "🔑 Recuperar clave fiscal". U 11:21 "¿El recibo digital tiene validez legal para trámites bancarios?" → B "Sí, cuenta con firma digital certificada y código QR de validación fiscal avalado por el Gobierno de la Provincia de Formosa." Insignia: "Documento oficial con Firma Digital y código QR".
    3. *Estado de expediente*: U 14:05 "Tengo el expediente EXP-2024-8841-ME, ¿en qué estado se encuentra?" → B "¡Encontrado! El expediente EXP-2024-8841-ME se encuentra en la Dirección de Recursos Humanos con pase aprobado el día de ayer." Chips: "🔍 Ver historial de pases", "🔔 Activar notificaciones". U 14:06 "¿Cuánto tiempo demora el siguiente paso del trámite?" → B "El tiempo estimado de resolución es de 3 a 5 días hábiles. Podés consultar las actualizaciones en tiempo real aquí mismo cuando lo desees." Insignia: "Estado: En curso (Paso 3 de 4) · Próxima resolución en 72 hs".
- **Avatar ChatBot** (`src/components/ChatBotAvatar.jsx`): SVG cuadrado `size × size` con un blob procedural de forma por defecto `cercle` (`bloub/skins.ts:97`) y 2 ojos; color de cuerpo `--bot-body` (`#0F1730` claro / `#EAF0FA` oscuro, IDX:111/174), ojos `--bot-eye` (`#F0F4F9` / `#0F1730`); expresiones: idle, thinking, happy, etc. (ChatBotAvatar.jsx:11-98, 425-460). Sigue el cursor salvo `followMouse={false}`.
- **Botón CTA** (HP.jsx:258-267): contenedor `text-center pt-2` (8px). `<Link to="/chat" class="btn-primary no-underline text-sm sm:text-base font-bold px-8 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-brand/20 transition-all">`. Base `.btn-primary` (IDX:1117-1122): `inline-flex center gap-2; uppercase; tracking-widest (.1em); rounded-full; bg brand-deep; text paper; border 1px brand-deep`. Efectivo: padding **14px × 32px**, fuente **14px (<640) / 16px (≥640)** peso 700, **MAYÚSCULAS** con tracking .1em, radio pill, fondo `#1C44B6` (claro) / `#2F55C0` (oscuro), texto `paper` (`#F0F4F9` claro / **`#070E20` oscuro — texto casi negro sobre azul**), borde 1px del mismo color, sombra `shadow-lg` con color `brand` al 20% (`0 10px 15px -3px rgb(brand/.2), 0 4px 6px -4px rgb(brand/.2)`), `transition: all 150ms` (default). Hover: fondo `#EBEBEB`, texto `#1A1A1A`, borde `#EBEBEB` (ambos temas). Texto literal: **"Abrir el asistente completo"** + espacio + **"→"**. Prefetch de la página chat en `pointerenter`.

### Inferences
- El kicker es un `<span>` inline dentro de un contenedor `space-y-3`: el margen vertical no se aplica a elementos inline, por lo que el kicker queda **pegado** al H2 (sin los 12px de separación), mientras que H2→párrafo sí tiene 12px. Inferido de CSS, no verificado en navegador.
- En móvil la tarjeta ocupa el ancho disponible (viewport − 40px de `section-bleed`), tope 512px.
- En tema oscuro el botón CTA primario muestra texto `#070E20` sobre `#2F55C0` (contraste bajo); es el resultado literal de `text-paper`, no una errata de este informe.

### Gaps
- `scrollbar-none` (ICM.jsx:208) **no está definido** en `index.css` ni es utilidad de Tailwind v4: en móvil/escritorio la fila de ejemplos puede mostrar scrollbar nativa cuando desborda.
- Valores de `animate-bounce`, `shadow-xs/2xs/lg/xl/inner`, `emerald-*`, `red-400`, `amber-400`, `neutral-800` son defaults de Tailwind v4, no del repo.

---

## 3. Sección 3 — "Servicios integrados" (`#capacidades`)

### Takeaway
Encabezado alineado a la izquierda y grilla de 3 tarjetas "cristal" (1 columna en móvil, 3 columnas desde 768px).

### Cited Findings
- **Sección** (HP.jsx:272): `section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40` → padding vertical **80px / 96px (≥1024)**. Interior `ed-max flex flex-col gap-12` (48px) (HP.jsx:273).
- **Cabecera** `max-w-2xl space-y-3` alineada a la izquierda (HP.jsx:274-284): kicker **"Servicios integrados"** (mismo estilo que sección 2), H2 **"Todo lo que necesitás, en un solo lugar."** (30/36px, 800), párrafo **"Diseñado para reducir la burocracia y brindarte respuestas inmediatas desde tu casa o lugar de trabajo."** (16px, `muted`, lh 1.625).
- **Grilla** `grid grid-cols-1 md:grid-cols-3 gap-6` (HP.jsx:286): **1 columna <768px, 3 columnas iguales ≥768px, gap 24px**.
- **Tarjeta `.minimal-feature-card`** (HP.css:373-396): radio **20px**; borde 1px `--color-line`; fondo `rgba(255,255,255,.6)` (claro) / `rgba(13,23,48,.4)` con borde `rgba(255,255,255,.08)` (oscuro); `backdrop-filter: blur(10px)`; padding **36px vertical × 32px horizontal**; `display:flex; flex-direction:column; justify-content:space-between; gap:24px`; transición `all .25s ease`. **Hover**: borde `rgba(47,107,255,.35)`, `translateY(-2px)`, sombra `0 10px 28px -4px rgba(47,107,255,.08)`. Sin sombra en reposo.
  - Bloque superior `space-y-4` (16px): fila `flex items-center justify-between`: **tile de icono** `grid h-10 w-10 place-items-center rounded-xl bg-mist dark:bg-neutral-800 border border-line` (**40×40px**, radio 16px, fondo `mist` / `#262626`(default) en oscuro, borde `line`) con SVG **20×20px** trazo 2 sin relleno; y **badge** `text-[11px] font-mono text-muted uppercase tracking-wider font-semibold` (11px mono).
  - Título `<h3 class="text-xl font-bold text-ink tracking-tight m-0 group-hover:text-brand transition-colors">` (**20px**/28px, 700, tracking −.025em; hover → `brand`). Descripción `text-sm text-muted leading-relaxed` (**14px**, lh 1.625).
  - Bloque inferior: `pt-4 border-t border-line/60` con enlace `text-xs font-bold text-brand hover:underline inline-flex gap-1 no-underline`: **"Consultar ahora"** + **"→"** (12px, 700, `brand`). Navega a `/chat`.
  - **Contenido literal de las 3 tarjetas** (HP.jsx:19-53): 
    1. Icono "documento con líneas" (azul: `text-blue-600` / oscuro `text-blue-400`, default Tailwind). Badge **"Transparencia oficial"**. Título **"Seguimiento SIGED en vivo"**. Texto **"Ingresá el número de tu trámite y conocé al instante en qué despacho se encuentra, quién lo tiene y qué resolución espera."**
    2. Icono "documento con flecha de descarga" (`emerald-600` / `emerald-400`). Badge **"Validez provincial"**. Título **"Formularios y modelos en PDF"**. Texto **"Descargá directamente el Formulario F-04, modelos de notas de elevación y solicitudes validadas listas para presentar."**
    3. Icono "reloj" (`purple-600` / `purple-400`). Badge **"100% Gratuito"**. Título **"Atención 24/7 sin intermediarios"**. Texto **"Consultá en lenguaje cotidiano las 24 horas del día, los 365 días del año. Respuestas verificadas en menos de 3 segundos."**
  - Iconos (trazados Heroicons-outline 24×24, `strokeWidth 2`, `stroke=currentColor`): documento `M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5…` (HP.jsx:24); descarga `M12 10v6m0 0l-3-3m3 3l3-3m2 8H7…` (HP.jsx:35); reloj `M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z` (HP.jsx:46).

### Inferences
- Alto de cada tarjeta lo define la más alta de la fila (grid stretch) y el enlace inferior queda anclado abajo por `space-between`.

### Gaps
- Colores `blue/emerald/purple-600/400` son defaults de Tailwind v4 (oklch); no hay hex en el repo.

---

## 4. Sección 4 — "Preguntas frecuentes" (`#preguntas`)

### Takeaway
Columna central de 768px con encabezado centrado y 4 acordeones `<details>` tipo tarjeta; el primero viene abierto.

### Cited Findings
- **Sección** (HP.jsx:322): `section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40` (80/96px). Interior `ed-max flex flex-col gap-10 max-w-3xl mx-auto` (HP.jsx:323) → columna de **768px máx.**, separación **40px**.
- **Cabecera centrada** (`text-center space-y-3`, HP.jsx:324-334): kicker **"Preguntas frecuentes"**; H2 **"Dudas comunes sobre el servicio"** (30/36px); párrafo **"Todo lo que necesitás saber para utilizar ChatAP con total tranquilidad."** (16px `muted`, sin `leading-relaxed`).
- **Lista** `flex flex-col gap-3` (12px) (HP.jsx:336).
- **Acordeón `.faq-item`** (HP.css:399-421): borde 1px `line`; radio **16px**; fondo `rgba(255,255,255,.6)` (claro) / `rgba(13,23,48,.4)` + borde `rgba(255,255,255,.08)` (oscuro); `backdrop-filter: blur(8px)`; `overflow:hidden`; transición `all .2s ease`. **Abierto**: borde `--color-brand` (oscuro `rgba(77,125,255,.35)`), fondo `rgba(255,255,255,.9)` (oscuro `rgba(13,23,48,.75)`).
- **`summary`** (`.faq-summary`, HP.css:423-435): `flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; cursor:pointer; list-style:none` (sin marcador nativo). Pregunta en `<span class="text-base sm:text-lg font-bold text-ink">` → **16px (<640) / 18px (≥640)**, peso 700. Chevron "v" (`M19 9l-7 7-7-7`, trazo 2.2) **20×20px** color `brand`, rota **180°** al abrir con `transform .25s cubic-bezier(.16,1,.3,1)` (HP.css:441-451). (`shrink:0` en `.faq-icon` es una propiedad inválida → el icono podría comprimirse con textos largos.)
- **Contenido** `.faq-content` (HP.css:453-458, **CSS gana** sobre `text-sm sm:text-base leading-relaxed`): `padding: 0 24px 21.6px; color muted; font-size .95rem (15.2px); line-height 1.6`. No hay animación de altura (el `<details>` abre/cierra instantáneo).
- **Textos literales** (HP.jsx:55-76): 
  1. "¿Tiene algún costo utilizar ChatAP?" → "No, es un servicio 100% gratuito, público y de libre acceso desarrollado por el Gobierno de la Provincia de Formosa a través de la Subsecretaría de Recursos Humanos." (**abierto por defecto**, `open={idx===0}`)
  2. "¿Es obligatorio registrarse para consultar?" → "No es necesario. Podés consultar de forma libre y anónima en cualquier momento. Si iniciás sesión, podrás guardar el historial de tus conversaciones y el seguimiento de tus trámites."
  3. "¿Qué formularios oficiales puedo descargar directamente?" → "Podés descargar el Formulario F-04 para justificación de licencias médicas, modelos de notas de elevación, declaraciones juradas y constancias oficiales con un solo clic."
  4. "¿Cómo funciona el rastreo de expedientes?" → "Solo tenés que escribir el número de tu expediente o trámite en la conversación. ChatAP consulta la base del Sistema de Gestión Documental e informa su ubicación actual y último movimiento."

### Inferences
- Los acordeones son independientes (no exclusivos): cada `<details>` se abre/cierra por separado.

### Gaps
- Sin altura/animación de despliegue definida (comportamiento nativo de `<details>`).

---

## 5. Sección 5 — Cierre / CTA final (`#cierre`)

### Takeaway
Bloque centrado de 672px: avatar del bot en un tile, título grande, bajada, botón pill grande y línea legal en monoespaciada.

### Cited Findings
- **Sección** (HP.jsx:355): `section-bleed bg-transparent py-20 lg:py-28 border-t border-line/40` (80/112px). Interior `ed-max` > `max-w-2xl mx-auto text-center flex flex-col items-center gap-6` (**672px**, gap **24px**) (HP.jsx:357).
- **Tile del avatar** (HP.jsx:358-360): `p-2 rounded-2xl bg-brand/10 border border-brand/20` (padding 8px, radio 20px, fondo `brand` al 10%, borde `brand` al 20%) conteniendo `ChatBotAvatar size=56 reaction="happy" followMouse=false` → tile de ≈ **72×72px**.
- **H2** (HP.jsx:362-364): `text-3xl sm:text-5xl font-extrabold tracking-tight text-ink m-0` → **30px (<640) / 48px (≥640)**, lh 36px / 48px, peso 800. Literal: **"¿Tenés una consulta administrativa?"**
- **Párrafo** (HP.jsx:366-368): `text-base sm:text-lg text-muted max-w-xl leading-relaxed m-0` (16/18px, ancho máx **576px**): **"Comenzá en lenguaje cotidiano y obtené tu respuesta oficial de la provincia al instante."**
- **Botón** (HP.jsx:370-379): wrapper `pt-2`. `btn-primary no-underline text-base font-bold px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-brand/25 transition-all transform hover:-translate-y-0.5` → padding **16px × 36px**, fuente **16px** 700, MAYÚSCULAS tracking .1em, fondo `brand-deep`, texto `paper`, radio pill, `shadow-xl` con color `brand` 25%, hover: sube 2px además del cambio a `#EBEBEB`/`#1A1A1A`. Literal: **"Iniciar consulta con ChatAP"** + **"→"**.
- **Línea legal** (HP.jsx:381-383): `text-xs text-muted/70 font-mono m-0` (12px mono): **"Servicio público oficial · Subsecretaría de Recursos Humanos de Formosa"**.

### Gaps
- Ninguno relevante.

---

## 6. Navbar (`C/Navbar.jsx`)

### Takeaway
No es una barra a ancho completo: es una **píldora flotante** centrada, fija arriba, siempre azul-navy oscuro (idéntica en tema claro y oscuro). En ≥768px muestra marca + menú "gooey" + controles; en <768px marca + controles y un menú hamburguesa que abre un panel flotante bajo la píldora.

### Cited Findings — contenedor y píldora
- **`<header class="nav-shell">`** (NAV:365; IDX:2167-2183): `position:fixed; top:1rem (16px); left:50%; transform:translateX(-50%); z-index:60; width:max-content; max-width:calc(100vw - 2rem); pointer-events:none; transition: top .25s ease`. **≥640px: `top:1.25rem` (20px)**. Quedan 16px mínimos a cada lado en móvil.
- **Píldora `.nav-pill`** (IDX:2185-2197): `pointer-events:auto; position:relative; display:inline-flex; align-items:center; gap:.65rem (10.4px); padding:.35rem .5rem .35rem .65rem (5.6 / 8 / 5.6 / 10.4px); border-radius:9999px; background:rgba(10,17,36,.94); border:1px solid rgba(255,255,255,.12); box-shadow: 0 10px 30px -4px rgba(0,0,0,.28), inset 0 1px 0 0 rgba(255,255,255,.10); transition .25s`. **≥768px**: `gap:1.15rem (18.4px); padding:.35rem .55rem .35rem .75rem (5.6/8.8/5.6/12px)` (IDX:2199-2204).
- **Estado "scrolled"** (se activa con `scrollY > 24`, NAV:313-324; IDX:2207-2211): `background:rgba(7,14,32,.96); border-color:rgba(255,255,255,.18); box-shadow:0 14px 38px -4px rgba(0,0,0,.44), inset 0 1px 0 0 rgba(255,255,255,.14)`.
- **Alto aproximado de la píldora ≈ 43–46px** (derivado: contenido ≈ 30–32px + padding 11.2px + borde 2px). Es un valor calculado, no literal.

### Cited Findings — contenido, izquierda → derecha (NAV:367-464)
1. **Marca** `<Link class="nav-brand">` (IDX:2213-2222): `inline-flex; gap:.55rem (8.8px); padding-right:.2rem`, texto blanco. **Cuadrado "AP"** `.nav-brand-mark` (IDX:2223-2236): **26.4×26.4px** (1.65rem), radio **8.8px** (.55rem), fondo `linear-gradient(135deg, #2F6BFF 0%, #1C44B6 100%)`, texto "AP" blanco **10.4px** (.65rem) peso 800 tracking −.02em (font-neue), sombra `0 2px 8px rgba(47,107,255,.35)`. **Nombre** `.nav-brand-name` (IDX:2238-2245): **"ChatAP"** + **"."** en color `--color-brand` (`#2F6BFF` claro / `#4D7DFF` oscuro): **14px** (.875rem) peso 700 tracking −.01em, blanco. Sin ocultar en móvil.
2. **Separador vertical** `.nav-divider` — solo ≥768px (`hidden md:block`): **1px × 16px**, `rgba(255,255,255,.12)` (IDX:2250-2254).
3. **Menú central** (solo ≥768px, `hidden md:flex`): `GooeyNav` con ítems **"Inicio"** (`/`), **"ChatAP"** (`/chat`), **"Soporte"** (`/contacto`) (NAV:11-15, 378-390). Estilos (GOO.css; **CSS gana** sobre las utilidades del JSX):
   - `<ul>` `flex gap-1 (4px) sm:gap-2 (8px) px-1 (4px)` (GOO.jsx:229).
   - Enlace `li a` (GOO.css:151-165): `padding:.38rem .88rem` (**6.08px × 14.08px**), fuente **13px** (.8125rem), peso **500**, tracking .02em, color `rgba(255,255,255,.78)`; hover `#fff` (transición .25s); radio pill.
   - **Ítem activo**: un **fondo píldora blanco** (`.effect.filter::after`, GOO.css:45-55: `background:#fff; border-radius:9999px; box-shadow:0 2px 8px rgba(0,0,0,.18)`) que se posiciona exactamente detrás del `li` activo; el texto del activo se dibuja en una capa aparte `.effect.text` con color **`#070e20`**, 13px, peso 600, tracking .02em (GOO.css:24-33) y el `a` activo pasa a `color:transparent` (GOO.css:171-174). Resultado: píldora blanca con texto navy sobre la barra oscura. Página inicial: "Inicio" activo (índice 0; NAV:306-311).
   - **Animación de cambio**: el fondo se desliza (`left/top/width/height` **.3s cubic-bezier(.2,1,.3,1)**, GOO.css:18-22), hace "pulso" `scale .92 → 1.04 → 1` en **.4s** (GOO.css:57-71) y emite **15 partículas** (círculos de 16px, escala ≈1±0.1) con colores `--color-1 #2F6BFF`, `--color-2 #60A5FA`, `--color-3 #38BDF8`, `--color-4 #FFFFFF` (secuencia [1,2,3,1,2,3,1,4]), distancia inicial 90px → final 10px, duración ≈ 900–1500ms (animationTime 600×2 ± 300), con filtro SVG "gooey" (blur σ=5, matriz alfa `18 −7`) que las fusiona (GOO.jsx:213-224; NAV:383-388).
4. **Separador vertical** (≥768px) igual al anterior.
5. **Grupo derecho** `flex items-center gap-1.5 (6px) sm:gap-2 (8px)` (NAV:395):
   - **Botón tema** `.nav-icon-btn` (IDX:2291-2309): **29.6×29.6px** (1.85rem) circular, borde 1px `rgba(255,255,255,.10)`, fondo transparente, color `rgba(255,255,255,.65)`; hover: color `#fff`, fondo `rgba(255,255,255,.08)`, borde `rgba(255,255,255,.20)`. Icono **14×14px**: en tema claro **luna** (`text-white/75`, hover rota −12°); en tema oscuro **sol** (`text-amber-300`, hover rota 45°); rotación 500ms; `active` escala .9. Alterna `html.dark` y guarda `localStorage.theme` (NAV:352-362).
   - **CTA "Ingresar"** (visitante, NAV:441-443; `.nav-cta` IDX:2311-2331): `padding:.32rem .85rem (5.12 × 13.6px); radius pill; background:var(--color-brand); color:#fff; font:12px (.75rem) peso 600 tracking .01em (font-neue-text); border:1px solid rgba(255,255,255,.15); box-shadow:0 2px 8px rgba(47,107,255,.32)`. Hover: fondo `--color-brand-dark`, sombra `0 4px 14px rgba(47,107,255,.45)`. Etiqueta **"Ingresar"** → `/login`.
   - **Menú de perfil** (autenticado, NAV:24-183; IDX:2333-2377): botón `.nav-profile-btn` (pill, padding .22rem .55rem .22rem .22rem, borde `rgba(255,255,255,.10)`, fondo `rgba(255,255,255,.04)`), avatar circular **24.8px** (gradiente 135° `#2F6BFF→#1C44B6`, inicial en mono 10px bold), nombre (≥640, 12px, `white/90`, máx 5.5rem) y chevron 12px. Dropdown `.nav-dropdown`: ancho **15rem (240px)**, radio **16px**, fondo `rgba(10,17,36,.96)` + blur 20px, borde `rgba(255,255,255,.14)`, `top: calc(100% + 8px)`, alineado a la derecha; ítems 12px `white/80`: "Mi perfil", "MiPortal", "Panel Admin" (staff), "Cerrar sesión" (`text-red-400`). Cierre de sesión muestra overlay a pantalla completa `paper` con spinner de 40px y texto "Cerrando sesión…".
   - **Botón hamburguesa** (solo <768px, `md:hidden`): `.nav-icon-btn` 29.6px con icono **14px** de 3 líneas (`M4 7h16M4 12h16M4 17h16`, trazo 2) o "X" (`M6 18L18 6M6 6l12 12`) cuando está abierto.

### Cited Findings — menú móvil (`MobileDrawer`, NAV:185-293; `.nav-drawer` IDX:2379-2394)
- Panel `<nav class="nav-drawer animate-fade-up">` **hijo de `.nav-shell`**: `position:absolute; left:0; right:0; top:calc(100% + 8px)` → **mismo ancho que la píldora** (no ancho de pantalla), 8px debajo de ella; `border-radius:1.25rem (20px); background:rgba(10,17,36,.96); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.14); box-shadow:0 16px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08); z-index:65; overflow:hidden`.
- Entrada: `fade-up` = `opacity 0→1, translateY(10px→0)`, **.22s cubic-bezier(.22,1,.36,1)** (IDX:215-218, 323). Sin animación de salida (se desmonta). Se cierra: cambio de ruta, clic/toque fuera, Escape, o pulsar el botón (NAV:326-350).
- Contenido: `flex flex-col gap-1 (4px) p-2 (8px)`. Ítems (NAV:192-214): **"Inicio"**, **"ChatAP"**, **"Soporte"**: `flex items-center justify-between px-3.5 (14px) py-2.5 (10px) rounded-xl (16px) text-xs (12px) font-medium tracking-wide (.025em)`; alto ≈ **36px**; inactivo `text-white/70` (hover `text-white bg-white/5`); **activo** `bg-white/10 text-white font-semibold` con **punto de 6×6px `bg-brand`** a la izquierda del texto; chevron derecho `>` (`M9 5l7 7-7 7`) **14px** `text-white/30`.
- Si NO autenticado (NAV:279-289): separador `border-t border-white/10 mt-1 pt-2` y botón **"Ingresar"** ancho completo, `flex center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand hover:bg-brand-dark shadow-xs` (alto ≈ 32px).
- Si autenticado (NAV:216-278): separador, fila con avatar 20px (`bg-brand-deep`, inicial 10px bold, `ring-1 ring-white/20`) + nombre (12px semibold blanco) + email (10px `white/50`); ítems "Mi perfil", "MiPortal", "Panel Admin" (staff; chevron `brand`) con `px-3.5 py-2 rounded-xl text-xs text-white/75`; "Cerrar sesión" `text-red-400 hover:bg-red-500/10`.
- Rol de píldora/etiqueta de perfil en dropdown: badge `px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded bg-brand/15 text-brand border border-brand/25` (NAV:101).

### Inferences
- Ancho de la píldora en móvil ≈ 270px (derivado: 10.4 + marca ≈95 + gap 10.4 + grupo derecho ≈146 [29.6+6+≈75+6+29.6] + 8 + 2 de borde); el panel móvil mide lo mismo. Estimación, no literal.
- **Posible bug visual/funcional**: `.nav-shell` tiene `pointer-events:none` y `.nav-drawer` no lo restablece a `auto` (sí lo hace `.nav-pill`), por lo que en navegador el panel móvil heredaría `pointer-events:none` y los toques atravesarían el panel. Inferido de la cascada CSS (IDX:2167-2172 vs 2379-2394); no se ejecutó la app.
- La navegación de escritorio tiene clases `.nav-link*` (IDX:2256-2289) que **no se usan** (el menú real es GooeyNav).
- El navbar es idéntico en claro/oscuro (siempre fondo navy `rgba(10,17,36,.94)`); solo cambia el color del punto de la marca (`brand`) y la CTA (`brand` claro/oscuro), y el icono luna/sol.

### Gaps
- No hay animación de cierre del panel móvil.
- No se midió el alto exacto de la píldora ni del panel (depende de la métrica de la fuente).

---

## 7. Footer (`C/Footer.jsx`)

### Takeaway
Footer sobre fondo `paper` (95%) con borde superior: zona superior en grilla (marca + 3 columnas de enlaces) y barra inferior con patrón de rayas diagonales.

### Cited Findings
- **`<footer class="w-full bg-paper/95 border-t border-line relative z-10">`** (FOO:78): fondo `paper` al 95%, borde superior 1px `line`.
- **Zona superior** (FOO:80-81): `ed-max section-bleed py-12 sm:py-16` → ancho máx 1280px, padding horizontal 20/48/80px, **padding vertical 48px (<640) / 64px (≥640)**. Grilla `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12`: **1 columna <768px; 2 columnas 768–1023px; 12 columnas ≥1024px**; gap **40px** (48px ≥1024).
- **Columna izquierda** (`lg:col-span-5 flex flex-col justify-between gap-8` = 5/12, gap 32px) (FOO:84-121):
  - Enlace marca `inline-flex items-center gap-2.5 text-ink`: tile **36×36px** (`h-9 w-9`) `rounded-xl` (16px) `bg-brand text-white font-extrabold text-xs shadow-xs` con "AP" (12px); a su lado dos líneas (`flex-col leading-none`): **"ChatAP."** (`text-base font-extrabold tracking-tight text-ink uppercase font-neue`, 16px MAYÚSCULAS → "CHATAP." con "." `brand`) y **"Recursos Humanos · Formosa"** (`mt-1 text-[8px] font-mono font-semibold uppercase tracking-[0.24em] text-faint`, 8px mono).
  - Párrafo `mt-4 text-sm leading-relaxed text-muted font-neue-text max-w-sm m-0` (14px, lh 1.625, máx 384px): **"La Administración Pública respondiendo a cada persona, en lenguaje claro y a toda hora. Consultá trámites, haberes, licencias y expedientes sin filas."**
  - **Redes** `flex items-center gap-2` (8px): 5 botones **32×32px** (`w-8 h-8`) `rounded-lg` (12px), icono **16×16px** `text-muted`, borde transparente; hover: `text-ink bg-mist/70 border-line`, 150ms. Orden: **Instagram** (glifo relleno), **Facebook**, **X (Twitter)**, **LinkedIn**, **Sitio Oficial Formosa** (globo, trazo 2 sin relleno) (FOO:26-72, 107-120).
- **Columnas derechas** (`lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8` = 7/12; **1 columna <640px, 3 columnas ≥640px**, gap 32px) (FOO:124):
  - Cabecera de columna `text-xs font-bold font-mono uppercase tracking-[0.2em] text-ink m-0 mb-4` (12px mono bold MAYÚSCULAS, tracking .2em, `mb` 16px): **"Trámites"**, **"Institucional"**, **"Soporte"**.
  - Listas `flex flex-col gap-2.5` (10px); enlaces `text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand` (**12px <640 / 14px ≥640**, font-neue-text; hover `brand-deep` claro / `brand` oscuro).
  - **Trámites**: "Recibos de haberes", "Licencias e inasistencias", "Expedientes SIGED", "Mesa de entradas digital" (FOO:4-9).
  - **Institucional**: "Equipo de desarrollo" (botón con chip a la derecha **"IPF · RRHH"** = `text-[10px] font-mono px-1.5 rounded bg-brand/10 text-brand font-semibold`; hover invierte a `bg-brand text-white`; abre un modal), "Recursos Humanos", "Gobierno de Formosa" ↗, "Portal del Empleado" ↗, "Politécnico Formosa" ↗; los externos llevan icono ↗ de **12px** con opacidad .6 (FOO:11-17, 171-181).
  - **Soporte**: "Mesa de ayuda", "WhatsApp oficial", "Línea gratuita 0800", "Preguntas frecuentes" (FOO:19-24).
- **Barra inferior** (FOO:223-242): `.footer-striped-pattern border-t border-line w-full` — fondo `color-mix(in srgb, mist 40%, paper)` + `repeating-linear-gradient(-45deg, color-mix(line 80%, transparent) 0 1px, transparent 1px 10px)` → **rayas diagonales de 1px cada 10px** a −45° (IDX:304-314). Interior `ed-max section-bleed py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4`: **apilado y centrado <640px; fila ≥640px**, padding vertical 16/20px, gap 16px.
  - Copyright `text-xs text-muted font-neue-text text-center sm:text-left` (12px): **"© {año actual} ChatAP · Desarrollado en articulación conjunta por la Subsecretaría de Recursos Humanos y el Instituto Politécnico Formosa · Gobierno de Formosa."**
  - Enlaces `flex items-center gap-5` (20px) 12px `muted` (hover `ink`): **"Términos y Condiciones"** · **"Privacidad"** · **"Accesibilidad"** separados por "·" (color `line`). Los tres apuntan a `/contacto`.
- **Modal "Equipo de desarrollo"** (FOO:245-360): overlay `fixed inset-0 z-50 bg-ink/70 backdrop-blur-md animate-fade-in` p-16px; panel `max-w-2xl bg-paper border border-line rounded-3xl (28px) p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto`; kicker "Innovación Pública · Formosa" (10px mono `brand`), título "El equipo que hizo posible ChatAP" (20/24px 800), botón cerrar circular 32px "✕"; párrafo 14px; 2 tarjetas (`p-5 rounded-2xl bg-mist/50 border border-line`, 1 col <640 / 2 col ≥640, gap 16px): "Subsecretaría de Recursos Humanos" (tile "RRHH" `bg-brand/10 text-brand` 32px radio 12px) e "Instituto Politécnico Formosa" (tile "IPF" `bg-brand-deep text-white`); bloque "Pilares del proyecto" (`p-4 rounded-xl bg-brand/5 border border-brand/20`) con 3 ítems "✦ …"; botón "Cerrar" `px-5 py-2.5 rounded-xl bg-ink text-paper text-xs font-semibold`. Textos en FOO:277-346.
- **No hay logos de imagen en el footer** (solo el monograma "AP" y texto). Los PNG de logos solo se usan en la marquesina del hero.

### Inferences
- En <640px las 3 columnas de enlaces se apilan una bajo otra (cada una con su cabecera).

### Gaps
- Enlaces con destino `tel:` y `wa.me` son datos placeholder (`5493704000000`, `08005551234`): no afecta lo visual.

---

## 8. Cambios móviles consolidados (≤768 / ≤640 / ≤480)

### Takeaway
No hay reglas `@media (max-width: 480px)` que afecten a la landing (la de IDX:820 es de `.container-ia-chat`). El diseño responde con los breakpoints de Tailwind (mobile-first): 640 / 768 / 1024, más 2 reglas `max-width` propias.

### Cited Findings
- **≤768px** (HCB.css:150-172): hero bg Ken Burns 28s; tinte más opaco (claro .80→.92, oscuro .75→.90); brillo ambiental 180px alto y opacidad .7. En JS: partículas **180** en vez de 320 (`window.innerWidth < 768`, evaluado una vez, HP.jsx:124-127,152).
- **<768px** (Tailwind `md`): navbar sin separadores ni menú gooey, con hamburguesa y panel flotante; footer en 1 columna (2 columnas desde 768, 12 desde 1024); grilla de capacidades en 1 columna; `.section-bleed` = 20px (48px ≥768, 80px ≥1024).
- **<640px** (Tailwind `sm`): navbar `top:16px` (20px ≥640), `gap-1.5` en controles; H1 36px (60px ≥640); subtítulo 16px; H2 de sección 30px (36px ≥640); H2 cierre 30px (48px ≥640); CTA 14px (16px ≥640); puntos "ventana" de la maqueta ocultos; tarjeta maqueta padding 12px (20px ≥640); texto de burbujas 12px (13px ≥640); botón "Reiniciar" solo icono; FAQ pregunta 16px (18px ≥640); footer: padding vertical 48px (64px ≥640), columnas de enlaces apiladas (3 cols ≥640), enlaces 12px (14px ≥640), barra inferior apilada y centrada.
- **max-width:640px en HP.css:205-209**: solo afecta a `.hero-cinematic__title`, que **no se usa** en el Home (sin efecto en la landing).
- **≥1024px**: H1 72px; subtítulo 20px; paddings de sección 112/96px; footer 12 columnas.
- **Preferencia de movimiento reducido**: se desactivan hero-anim*, partículas con fade, Ken Burns, LogoLoop, ScrollFloat (HP.css:32-34, 99-111; HCB.css:145-153; LL.css:113-118; ScrollFloat.css:22-26; IDX:1951-1957).

### Gaps
- No existe regla específica ≤480px para Home: los 360–480px usan los valores móviles (<640).

---

## 9. Animaciones visibles (resumen de parámetros)

| Elemento | Tipo | Duración / easing | Valores | Fuente |
|---|---|---|---|---|
| Transición de ruta (toda la página) | fade+slide | enter .28s `cubic-bezier(.16,1,.3,1)`; exit .18s `cubic-bezier(.4,0,1,1)` | enter `opacity 0→1, translateY(8px→0)`; exit `1→0, 0→−4px` | IDX:333-340, keyframes ~245-265; AppRouter.jsx:6,46-52 |
| Hero título/sub/sellos/pie | slide-up | .7–.75s `cubic-bezier(.16,1,.3,1)`, delays .18/.28/.58/.68s | `opacity 0→1; translateY(16px→0)` | HP.css:64-97 |
| Letras del H1 | float-in por carácter | .85s `power3.out`, stagger .012s | `opacity 0→1; yPercent 45→0` | HP.jsx:176-181; ScrollFloat.jsx |
| Fondo hero | crossfade | 2.2s `cubic-bezier(.4,0,.2,1)`, cada 10s | opacity 0↔1 | HCB.css:38; HCB.jsx:22 |
| Fondo hero | Ken Burns | 22s (28s móvil) infinite alternate `cubic-bezier(.25,1,.5,1)` | scale 1.03→1.075→1.105 + translate ≤0.65% | HCB.css:44-69 |
| Partículas | fade-in | 1.2s ease, delay .1s | opacity 0→.72 | HP.css:23,27-30 |
| Marquesina de logos | scroll continuo | 26 px/s hacia la izquierda, pausa al hover (suavizado τ .25s) | — | HP.jsx:225; LL.jsx |
| Pill del menú gooey | deslizamiento + pulso + partículas | .3s `cubic-bezier(.2,1,.3,1)`; pulso .4s | ver §6 | GOO.css |
| Navbar scrolled | cambio fondo/borde/sombra | .25s ease | ver §6 | IDX:2185-2211 |
| Panel móvil | fade-up | .22s `cubic-bezier(.22,1,.36,1)` | `opacity 0→1; translateY(10px→0)` | IDX:323 |
| Tarjeta capacidad hover | lift | .25s ease | `translateY(−2px)` + borde/sombra azul | HP.css:384-396 |
| FAQ chevron | rotación | .25s `cubic-bezier(.16,1,.3,1)` | 0→180° | HP.css:441-451 |
| Botón CTA final hover | lift | 150ms | `translateY(−2px)` | HP.jsx:374 |
| Maqueta chat | aparición de mensajes | .22s; guion 1.1/1.3/2.8/1.1/1.3/4.5s | `fade-up` | ICM.jsx:90-114 |
| ClickSpark (global, toda la app) | chispas al clic | 420ms `ease-out` | 8 rayos de 10px que se alejan hasta 18px, trazo 2px redondeado; color `#2F6BFF` (claro) / `#FFFFFF` (oscuro) | `C/ClickSpark.jsx:8-17,72-95`; App.jsx:16 |

### Gaps
- Keyframes de `route-enter/exit` en IDX ~245-265 (no se imprimió su número de línea exacto); valores tomados de la lectura de IDX.

---

## 10. Claro vs oscuro (diferencias visibles en la landing)

### Cited Findings
- Fondo base `#F0F4F9` ↔ `#070E20`; texto `#0F1730` ↔ `#EAF0FA`; secundario `#4A5578` ↔ `#8A9BC0`; acento `#2F6BFF` ↔ `#4D7DFF` (§0).
- Hero: velo de la foto cambia de `rgba(240,244,249,.68→.84)` a `rgba(7,14,32,.62→.82)`; foco, viñeta, fade inferior y brillo también cambian (§1). El Hero deja ver la foto más "lavada" en claro y más oscura en oscuro.
- Partículas: azules oscuros en claro; blancos/azules claros en oscuro (§1).
- Logos marquesina: PNG "light" (tinta navy) vs "dark" (blanco-azulado) (§1).
- Sellos del hero: `bg-white/60` ↔ `mist/60` (#0D1730 60%).
- Tarjetas capacidades / FAQ: fondo `rgba(255,255,255,.6)` ↔ `rgba(13,23,48,.4)`, borde `--line` ↔ `rgba(255,255,255,.08)`; FAQ abierto: borde `brand` ↔ `rgba(77,125,255,.35)`.
- Tile de icono de capacidades: `mist` ↔ `neutral-800`; iconos `*-600` ↔ `*-400`.
- Maqueta: gradiente `mist/paper` cambia con los tokens; "Oficial" `brand-deep`; insignia `emerald-700` ↔ `emerald-400`.
- CTA primario: fondo `#1C44B6` ↔ `#2F55C0`; texto `#F0F4F9` ↔ `#070E20`; hover `#EBEBEB`/`#1A1A1A` en ambos.
- Navbar: **sin cambio de fondo** (siempre navy); solo cambian acento e icono luna/sol.
- Footer: tokens `paper/mist/line/muted`; hover de enlaces `brand-deep` (claro) / `brand` (oscuro).
- ClickSpark: azul `#2F6BFF` (claro) / blanco (oscuro).
- Selector de tema: botón en navbar, `localStorage.theme`; por defecto oscuro (§0).

---

## 11. Imágenes y archivos en `public/` y dónde se usan

### Cited Findings (dimensiones verificadas con `file`)
| Archivo | Dimensiones | Uso en landing | Fuente |
|---|---|---|---|
| `public/assets/hero/hero-bg-1.jpg` | 1376×768 JPEG | Slide 1 del fondo del hero (edificio cívico/espejo de agua) | HCB.jsx:6-9 |
| `public/assets/hero/hero-bg-2.jpg` | 1376×768 JPEG | Slide 2 (río/puente al atardecer) | HCB.jsx:11-14 |
| `public/assets/hero/hero-bg-3.jpg` | 896×1200 JPEG (vertical) | Slide 3 (montañas con bruma) | HCB.jsx:16-19 |
| `public/assets/logos/todos-unidos-light.png` / `-dark.png` | 336×132 PNG RGBA | Marquesina del hero, render ≈71×28px | HP.jsx:86 |
| `public/assets/logos/gobierno-formosa-light.png` / `-dark.png` | 426×132 PNG RGBA | Marquesina del hero, render ≈90×28px | HP.jsx:100 |
| `public/assets/logos/formosa-completo-{light,dark}.png`, `formosa-institucional-completo.png` | 906×156 PNG | **No usados** en la landing | grep sin referencias |
| `public/assets/logos/todos-unidos.png`, `gobierno-formosa.png` | 336×132 / 426×132 | No usados en la landing (variante sin tema) | — |
| `public/assets/auth-landscape.jpg` | 896×1200 | Solo pantalla Login (LoginRegisterPage.jsx:247), no landing | — |
| `src/assets/hero.png` (343×361), `src/assets/vite.svg`, `src/assets/logos/*` | — | No referenciados en la landing | — |
| `public/favicon.svg` | 64×64 viewBox, degradado `#122657→#070e20` | Favicon | public/favicon.svg:1-5 |
- La marca "AP" **no es imagen**: es un cuadrado con degradado (navbar) o color sólido (footer, marquesina) + texto.
- Iconografía: SVG inline estilo Heroicons outline (24×24, trazo 2) en navbar/capacidades/FAQ/maqueta; íconos de redes en footer (FOO:26-72). Emojis (📥📋📍📄📅🔑🔍🔔) solo dentro de los chips de la maqueta.

---

## 12. Componentes de la lista que NO se montan en la landing (visual si se necesitan)

### Cited Findings
- **BannerCarousel** (`C/BannerCarousel.jsx/.css`): sin importadores en `src/`. Slides apiladas; transición `opacity/transform 650ms cubic-bezier(.16,1,.3,1)`, inactiva `translateY(12px) scale(.985)`; autoplay 5000ms; slide con Kicker (12px, tracking .22em, con punto `brand` 7.2px + halo `0 0 0 .3rem rgba(47,107,255,.13)`), título y párrafo `text-sm sm:text-base md:text-lg` `muted` (BannerCarousel.css:1-45).
- **ScrollExpand** (`.jsx/.css`): sin importadores. Marco sticky con `clip-path` animado, radio inicial 28px → 0, tamaño inicial 46%×60%, velo `linear-gradient(to top, rgba(240,244,249,.88), .4 45%, .6)` (oscuro `rgba(7,14,32,…)`), título centrado, pista "↓" mono 11.5px tracking .18em con rebote 4px 1.6s (ScrollExpand.css; ScrollExpand.jsx:11-27).
- **ScrollReveal** (`.jsx`): sin importadores; palabras con `opacity .15→1` y blur opcional 4px.
- **ASCIIText** (`.jsx/.css`): usado solo en `NotFoundPage` (texto "404", `asciiFontSize 8`, `textFontSize 190`); no en landing.
- **CRTWarp** (`.jsx`): canvas WebGL sin importadores ni clases visuales relevantes.
- **ImageStage** (`.jsx`): sin importadores; SVG línea 800×600, aspecto `4/3` (md `3/2`), figcaption 11px bold MAYÚSCULAS tracking .22em `muted` (ImageStage.jsx:128-151).
- **editorial.jsx**: `Kicker` (12px, tracking .22em, `muted`), `DisplayTitle`, `Lead`, `ArrowLink` (12px bold MAYÚSCULAS tracking .2em, flecha "→" que se mueve 4px al hover), `SectionHeading` (máx 768px, gap 16px), `Wordmark` (texto transparente con `-webkit-text-stroke:1px rgba(255,255,255,.08)`, 13vw/11vw), `MetricStrip` (grid `gap-px` en `bg-line`, radio 20px, celdas `p-6 md:p-8`, valor 36/48px 800). Usados por Dashboard (admin) y Login, **no por Home**; `.display-1/.display-2` en IDX:1371-1390.
- **Logo.jsx**: componente `Logo` (cuadrado 32px o 28px `bg-brand-deep text-paper` **sin radio**, + texto); **sin importadores**.
- **Modal.jsx** (usado solo en admin DocumentManager): overlay `bg-black/30 backdrop-blur-sm`; panel `bg-paper rounded-xl (16px) shadow-2xl max-w-md w-full mx-4 p-6`, animación `slide-up` .22s (translateY 16px); título 14px semibold color `--color-primary`; botones "Cancelar" (`btn-ghost`) y confirmar (degradado `from-primary to-primary-light`, 14px medium, radio 12px).
- **Toast.jsx** (`ToastProvider` envuelve toda la app, App.jsx:12; se dispara en admin/perfil): `fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm`; cada toast `px-4 py-3 rounded-xl (16px) shadow-lg bg-linear-to-r text-paper text-sm font-medium animate-slide-up`; degradados success `emerald-500→600`, error `red-500→600`, info `primary→primary-light (#EBF2FF)`, warning `amber-500→600`; auto-cierre **3500 ms**; icono 16px + botón X.
- **Pagination.jsx** (admin): fila centrada `gap-1 px-4 py-3 border-t border-line`, botones `px-3 py-1.5 text-xs font-medium rounded-lg (12px)`, activo `bg-primary text-paper shadow-sm`, textos "Anterior"/"Siguiente", disabled `opacity .3`.
- **BotOnboardingModal** (`.jsx`, montado globalmente en AppRouter.jsx:61 pero **solo abre para usuarios autenticados** con el flag `chatap_tutorial_trigger_<id>`; en la landing de visitante no aparece): overlay `fixed inset-0 z-50 p-4 sm:p-6`, bot en tile 64×64 (`rounded-2xl bg-paper border border-line`, avatar 44px) con chip "ChatAP" 9px; burbuja `.tour-bubble` (padding 12×16px, radio **6px**, borde `line`, flecha 8px); controles `.tour-controls` (radio 6px, botones 30px alto, 11.5px bold MAYÚSCULAS tracking .04em; primario `brand-deep`); puntos de progreso 6px (activo 18px `brand-deep`); resaltado `.tour-ring` borde 2px `brand` con pulso `box-shadow 4px→12px` 1.8s; velo `.tour-dim` `rgba(5,10,25,.22)`; 7 pasos con textos en BotOnboardingModal.jsx:9-88; ancho máx del bloque 400px (IDX:1525-1659).

### Gaps
- No se analizó el interior de CRTWarp/ASCIIText/Particles (shaders): no aportan especificación visual de la landing salvo lo indicado.

---

## Divergencias documentación vs código (importante)
- `DESIGN.md` (raíz del repo) describe radios 10/14px, papel `#EDF1F9`/`#0A1124`, marca `#4D7DFF`, footer sin rayas, etc. **No coincide** con `src/index.css` actual (papel `#F0F4F9`/`#070E20`, radios 16/20/28px, pill). `docs/chatap-visual-direction.md` pide portada alineada a la izquierda y sin filas de cards; el código real de Home está **centrado** y sí usa 3 cards. Este informe sigue exclusivamente el código.
