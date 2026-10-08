# Especificación visual: Autenticación, Reset, Contacto, 404 y Perfil (web frontend, rama dev-felipe)

**Fuente:** checkout local de `monzonfelipe0710-stack/asistente-virtual` en `dev-felipe`, HEAD `b9b83c4` ("arreglo de banner y de recuperar tu contraseña"). Todas las rutas son relativas a la raíz del checkout (`.../scratchpad/dev-felipe/`). Formato de cita: `ruta:línea`.

**Convenciones de este documento**
- Stack visual = Tailwind CSS 4.3.0 (`package.json`, `package-lock.json:2806-2807`) + tokens propios en `src/index.css`. Los valores de utilidades Tailwind sin override en el repo son **defaults de Tailwind v4** (no están en el repo; los marco "TW-default"). Escala TW: `text-xs`=12px/lh16, `text-sm`=14/20, `text-base`=16/24, `text-lg`=18/28, `text-xl`=20/28, `text-2xl`=24/32, `text-3xl`=30/36, `text-4xl`=36/40; spacing unidad = 4px (`p-3`=12px, `py-3.5`=14px, `gap-2.5`=10px); breakpoints `sm`=640, `md`=768, `lg`=1024, `xl`=1280. `text-[Npx]` fija solo tamaño (el interlineado hereda 1.5 de preflight, TW-default).
- Alturas calculadas (input, botón) = línea + padding + 2px de borde (box-sizing border-box, TW preflight). Son **derivadas**, no literales.
- Los colores de la paleta por defecto de Tailwind v4 (emerald, amber, red, slate, neutral, purple, blue) están definidos en oklch; los hex que doy son aproximaciones, marcadas "~".

---

## 0. Tokens y primitivas compartidas (aplican a todas las pantallas)

### Takeaway
La app es "editorial Swiss": paleta azul-hielo, fuente PP Neue Montreal, líneas de 1px en vez de sombras, botones píldora (`rounded-full`) y tarjetas de 20px de radio. Claro y oscuro intercambian tokens de color (`.dark` en `<html>`); **el tema oscuro es el default** de primera visita.

### Cited Findings

**Fuentes**
- `--font-sans`: "PP Neue Montreal", "PP Neue Montreal Text", ui-sans-serif, system-ui, -apple-system, sans-serif — `src/index.css:78`. `--font-neue` = "PP Neue Montreal"; `--font-neue-text` = "PP Neue Montreal Text" — `src/index.css:79-80`. `--font-mono`: ui-monospace, SFMono-Regular, Cascadia Mono, Segoe UI Mono, Menlo, Consolas… — `src/index.css:81`.
- Pesos con archivo real: 250 (Thin), 350 (Book), 400, 500, 600, 700, 900 (Black) + Italic 400; "Text" solo 400 y 500 — `src/index.css:4-73`. **No hay peso 800**: `font-extrabold` (800) se renderiza con Black 900 (inferencia por reglas CSS de matching). Archivos en `public/fonts/*.woff2`.
- Body: `antialiased`, `font-feature-settings: "cv03","cv04","cv09","cv11"` — `src/index.css:197-203`.

**Paleta CLARA (default de `@theme`)** — `src/index.css:84-90, 108-117`
| token | hex |
|---|---|
| ink (texto) | `#0F1730` |
| paper (fondo página) | `#F0F4F9` |
| mist (fondo secundario) | `#E2EAF4` |
| soft | `#D5E2F1` |
| line (bordes) | `rgba(15,23,48,0.12)` |
| muted (texto secundario) | `#4A5578` |
| faint (texto terciario) | `#7E8BA7` |
| brand | `#2F6BFF` |
| brand-dark | `#2558E0` |
| brand-deep (primario sólido) | `#1C44B6` |
| ok | `#18bc42` |
| warn | `#efc21e` |
| bad | `#d82f2f` |
| info | `#2F6BFF` |
| primary-light / primary-lighter | `#EBF2FF` / `#F5F8FF` (`:123-124`) |

**Paleta OSCURA (`.dark`)** — `src/index.css:159-182`
| token | hex |
|---|---|
| ink | `#EAF0FA` |
| paper | `#070E20` |
| mist | `#0D1730` |
| soft | `#132247` |
| line | `rgba(234,240,250,0.12)` |
| muted | `#8A9BC0` |
| faint | `#4E5F85` |
| brand | `#4D7DFF` |
| brand-dark | `#3A6AE0` |
| brand-deep | `#2F55C0` |
| ok / warn / bad | `#18bc42` / `#efc21e` / `#d82f2f` (sin cambio) |
| info | `#4D7DFF` |
| primary-light / lighter | `#0D1B40` / `#091230` |

**Tema por defecto:** `index.html:25-37` fuerza `class="dark"` salvo que `localStorage.theme === "light"`; migra una vez a "dark" (`chatap_dark_default_v1`, `index.html:28-31`). Fondo pre-render: oscuro `#070E20`, claro `#F0F4F9` (`index.html:17,21`). `theme-color` meta: `#070E20` / `#F0F4F9` (`index.html:42-43`).

**Radios (override del tema; TODOS más grandes que TW-default)** — `src/index.css:132-139`: `rounded-sm`=6px, `md`=8px, `lg`=12px, `xl`=16px, `2xl`=20px, `3xl`=28px, `full`=9999px; `--radius-card`=1.25rem (20px).

**Sombras:** `--shadow-soft: none; --shadow-hover: none` (`src/index.css:149-150`), por tanto `shadow-soft` / `hover:shadow-hover` = **sin sombra**. Las utilidades `shadow-xs/sm/md/lg/2xl` NO están sobreescritas: son TW-default (`shadow-sm` ≈ 0 1px 3px rgba(0,0,0,.1); `shadow-md` ≈ 0 4px 6px -1px rgba(0,0,0,.1); `shadow-lg` ≈ 0 10px 15px -3px rgba(0,0,0,.1); `shadow-2xl` ≈ 0 25px 50px -12px rgba(0,0,0,.25)).

**Clases componente (definidas en `src/index.css`)**
- `.card` — `background: color-mix(in srgb, paper 86%, transparent)`; `border 1px line/70%`; `rounded-2xl` (20px) — `:1088-1091`. `.card-border` = solo `border line/70` + `rounded-2xl` (sin fondo) — `:1104-1106`.
- `.card-interactive` — igual que `.card` + transición 0.2s; hover/focus: borde `color-mix(brand 45%, line)`, fondo `primary-lighter` (`#F5F8FF` claro / `#091230` oscuro), `translateY(-2px)`, sin sombra — `:1092-1103`.
- `.input-field` — `w-full px-4 py-2.5 text-sm bg-paper border border-line rounded-xl text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/12` → alto derivado 42px, radio 16px — `:1107-1111`.
- `.btn-primary` — `inline-flex center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-full bg-brand-deep text-paper border border-brand-deep`; hover: fondo `#EBEBEB`, texto `#1A1A1A`, borde `#EBEBEB`; transición 0.15s — `:1117-1122`. Alto derivado 42px. **Ojo oscuro:** `text-paper` = `#070E20` sobre `#2F55C0`.
- `.btn-ghost` — igual pero `bg-transparent text-ink border border-line`; hover idéntico (`#EBEBEB`/`#1A1A1A`) — `:1123-1128`.
- `.btn-danger` — `px-5 py-2.5 text-xs bold uppercase tracking-wider rounded-full bg-bad text-paper hover:opacity-90` (`:1129-1133`; no usado en estas pantallas).
- `.badge` — `inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-line` — `:1134-1136`. Las variantes añaden `bg-<tono>/10 text-<tono>` (el borde queda `line`).
- `.ed-max` = `max-width:80rem` (1280px) centrado; `.section-bleed` = padding-inline 1.25rem (20px) → 3rem (48px) ≥768 → 5rem (80px) ≥1024 — `:1440-1447`.
- `.display-1`: `clamp(2.75rem, 8vw, 6.5rem)`, lh 1.08, ls -0.025em, weight 800 (→Black) — `:1371-1380`. `.display-2`: `clamp(1.85rem, 3.8vw, 3rem)`, lh 1.2, ls -0.02em, weight 600 — `:1381-1390`. `.lead`: `clamp(1.1rem,1.7vw,1.45rem)`, lh 1.45, color muted, ls -0.02em — `:1402-1408`.
- Utilidades de tipografía: `.font-neue`, `.font-neue-text` — `:1425-1426`.
- Animaciones: `animate-scale-in` (0.22s, opacity 0→1 + scale .96→1, cubic-bezier(.22,1,.36,1)) `:1180, 1036-1039`; `animate-fade-in` (opacity, 0.18s) `:1178`; `animate-form-in` (0.32s, translateY 14px→0 + fade) `:327`; `animate-type-in` (0.32s, translateY 6px→0) `:330`; `animate-field-in` (0.3s, translateY -8px + scaleY .9→1) `:329`; `animate-slide-up` (0.22s, translateY 16px→0) `:1157`; `.stagger-children > *` delays 0.03s…0.24s de a 0.03s `:1162-1170`; `dot-ping` (1.6s, scale 1→2.6 y fade) `:1174,1253-1257`. Transición de tema 0.2s en fondos/bordes `:291-301`.

**TRAMPAS (clases usadas pero SIN definición → renderizado efectivo distinto del "intencional")**
1. `bg-card` NO existe: no hay `--color-card` en `src/index.css` (grep sin resultados). Todo `bg-card` en `LoginRegisterPage.jsx` renderiza **fondo transparente** (hereda el de la columna). Afecta inputs (`:360,463,479,495`), marco de foto (`:244`), botón Google (`:640`), caja de empleado (`:560`), modal Google (`:708,767,810`), botón "Copiar enlace" (`:419`). Los `dark:bg-neutral-900` del botón Google sí aplican en oscuro (`:640`).
2. `placeholder-faint` (Login, `:360,463,479,495,567,574,593,601,810`): en Tailwind v4 la utilidad `placeholder-{color}` no existe (se usa `placeholder:text-*`). → efecto probable: color de placeholder **por defecto de preflight** (currentColor al 50%), no `faint`. Los componentes `input-field` y `PasswordField` sí usan `placeholder:text-faint` correctamente. **No verificable sin compilar (no hay node_modules)**.
3. `.kicker` y `.display-3` NO existen en `index.css` en HEAD (solo `.display-1/.display-2`, `.section-kicker`). Fueron eliminadas en el commit `3f8fc49` (`git show 3f8fc49`). Valores históricos (intención de diseño, no HEAD): `.kicker` = 0.72rem, weight 600, ls 0.2em, uppercase, color muted; `.display-3` = `clamp(1.75rem,4.25vw,3.25rem)`, lh 0.98, ls -0.035em, weight 700. **Efecto en HEAD:** los `<p className="kicker">` y los `<h2 className="display-3 …">` caen a preflight de TW (h1-h6 heredan tamaño/peso: ≈16px/400); solo se aplica `uppercase` donde esté en el className. Los `<h1 className="display-2">` y `Kicker` de `editorial.jsx` (que añade `font-neue tracking-[0.22em] text-xs text-muted`, `src/components/common/editorial.jsx:3-5`) sí funcionan.
4. `.btn-primary` hover color `#EBEBEB`: en oscuro también (no hay variante `.dark`).

### Inferences
- Para la app móvil conviene decidir explícitamente si replicar el renderizado efectivo (títulos de sección 16px/400 uppercase) o la intención (28-52px/700). Documento ambos.
- `font-extrabold` ≈ Black 900 visualmente.

### Gaps
- No se puede confirmar el color real del placeholder de Login sin build (ver trampa 2).
- Hex exactos de la paleta TW v4 por defecto son aproximados.

---

## 1. Pantalla de Login / Registro / Recuperar contraseña — `src/pages/LoginRegisterPage.jsx` (841 líneas)

### Takeaway
Ruta única con **pantalla dividida** (≥1024px: izquierda editorial con foto + derecha formulario; <1024px: solo el formulario, con logo compacto arriba). No es una tarjeta: el formulario es una columna centrada de 448px de ancho máximo directamente sobre el fondo. Tres modos en la misma columna: Iniciar sesión, Registrarme y Recuperar contraseña (reemplaza el formulario). Textos del formulario principal en inglés mezclados con español.

### Cited Findings

#### 1.1 Estructura general (plano ensamblado)
- Raíz: `min-h-[100svh] flex flex-col justify-between bg-paper font-sans` (`:208`). Abajo de la grilla va el `<Footer />` completo del sitio (`:702`; fuera de alcance, ver `src/components/common/Footer.jsx`).
- Grilla: `flex-1 grid grid-cols-1 lg:grid-cols-2` (`:213`) → 2 columnas **iguales** (50/50) desde 1024px; 1 columna debajo.
- **Móvil/tablet (<1024px):** columna izquierda `hidden lg:flex` (`:215`) **oculta por completo** (no hay foto, ni titular, ni "Acceso ciudadano"). Se muestra el bloque "logo móvil" (`lg:hidden`, `:318`).
- Orden vertical móvil: (a) barra superior [Volver al inicio | toggle pestañas] → (b) logo móvil → (c) título + subtítulo → (d) formulario → (e) divisor "or continue with" → (f) botón Google → (g) enlace alterno → (h) línea de copyright → (i) Footer del sitio.

#### 1.2 Columna izquierda (solo ≥1024px)
- Contenedor: `relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-line bg-mist/50 dark:bg-slate-900/40 p-12 xl:p-16 select-none` (`:215`) → padding 48px (≥1280: 64px); borde derecho 1px `line`; fondo mist al 50% (claro `#E2EAF4`@50%) / slate-900 al 40% (oscuro).
- Cabecera (`:217-230`): fila `flex items-start justify-between`. Izquierda: icono `h-11 w-11` (44px) `rounded-2xl` (20px) `bg-brand-deep text-paper shadow-md` con `ChatBotAvatar size={26}` (`:219-224`) + texto "ChatAP" `text-lg` (18px) `font-extrabold tracking-tight uppercase text-ink`, gap 12px (`:225-227`). Derecha: `Kicker` "Acceso ciudadano" alineado a la derecha (`:229`; Kicker = 12px, ls 0.22em, `font-neue`, muted, `editorial.jsx:3-5`).
- Bloque editorial (`:233-241`): `my-8`. `DisplayTitle as=1` → `<h1 class="display-1 text-ink m-0 font-neue max-w-xl">` "HABLÁ CON EL ESTADO." (`:234-236`; display-1 = clamp(44px, 8vw, 104px), peso 800→Black, lh 1.08, ls -0.025em, `src/index.css:1371-1380`; a 1280px de viewport = 8vw ≈ 102px). `Lead` `max-w-md mt-6`: "Entrá para seguir tus conversaciones, consultar tus trámites y recibir tus documentos. Todo en Formosa. Todo en línea." (`:237-240`; lead = clamp(17.6px,1.7vw,23.2px), muted, `font-neue-text`).
- **Foto `auth-landscape.jpg`** (`:243-260`): marco `relative z-10 w-full overflow-hidden rounded-2xl border border-line shadow-lg group` (fondo `bg-card` inexistente→transparente). Dentro: `aspect-[21/10]` (relación 2.1:1) `w-full overflow-hidden relative`; `<img src="/assets/auth-landscape.jpg" alt="Paisaje montañoso en niebla - Gobierno de Formosa" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105">` (`:246-250`). **Archivo real:** `public/assets/auth-landscape.jpg`, JPEG **896×1200 (vertical)**; se recorta a banda horizontal centrada 21:10 (muestra la franja media: cordilleras con niebla azul-grisácea, cielo ámbar arriba queda fuera/parcial). Es la **única** referencia a ese archivo en `src/` (grep). Overlay: `absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent` (`:251`). Pie sobre la foto (`:252-258`): `absolute bottom-3 left-4 right-4 flex justify-between text-xs text-white`: izquierda punto `w-2 h-2 rounded-full bg-emerald-400 animate-pulse` (~#00d492) + "Subsecretaría de Recursos Humanos" (`font-semibold tracking-wide`, gap 6px); derecha "Gobierno de Formosa" `text-[11px] text-white/80`.

#### 1.3 Columna derecha (formulario)
- Contenedor: `flex flex-col justify-between px-6 sm:px-12 xl:px-20 py-10 lg:py-14 bg-paper dark:bg-[#09090b] text-ink dark:text-slate-100` (`:264`) → padding horizontal 24px (≥640: 48px; ≥1280: 80px), vertical 40px (≥1024: 56px). **Oscuro: fondo `#09090b`** (distinto de paper `#070E20`); texto slate-100 (~#f1f5f9).
- **Barra superior** (`:266-313`): `flex items-center justify-between w-full max-w-md mx-auto` (448px).
  - Izquierda "Volver al inicio": `inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-ink`; flecha chevron izquierda SVG `w-4 h-4` stroke 2 (que se desplaza -4px en hover) (`:267-280`).
  - Derecha **toggle de pestañas** (segmented control píldora): contenedor `flex items-center gap-1 p-0.5 rounded-full bg-mist dark:bg-neutral-900 border border-line dark:border-neutral-800 text-xs` (`:283`): padding 2px, gap 4px. Botones `px-3 py-1 rounded-full transition-all` (12px/4px) (`:290,304`). **Activo:** `bg-brand-deep text-white font-semibold shadow-sm` claro → `#1C44B6`/blanco; oscuro `dark:bg-white dark:text-black` (`:292,306`). **Inactivo:** `text-muted hover:text-ink`. Etiquetas: "Iniciar sesión" / "Registrarme" (`:296,310`). Con el flujo de recuperación abierto, **ninguna pestaña aparece activa** (`isLogin && !recovery`).
- **Columna de formulario:** `w-full max-w-md mx-auto my-auto py-6` (`:316`): ancho máx 448px, centrada vertical/horizontalmente, sin borde ni fondo ni sombra (no es una tarjeta).
- **Logo móvil** (`lg:hidden flex items-center gap-3 mb-6`, `:318-325`): cuadro `h-10 w-10` (40px) `rounded-xl` (16px) `bg-brand-deep text-white` con `ChatBotAvatar size={22}`; texto "ChatAP · Formosa" `text-base` (16px) `font-bold tracking-tight uppercase`.
- **Encabezado** (`:328-343`, `mb-6`): `h1` `text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white m-0` → 24px (≥640: 30px), peso 700, ls -0.025em. Subtítulo `p text-xs sm:text-sm text-muted m-0 mt-1.5` → 12px (≥640: 14px), margen superior 6px.
  - Login: h1 **"Sign in to your account"**; sub "Ingresá a tu cuenta para continuar tus trámites y consultas."
  - Registro: h1 **"Create your account"**; sub "Creá tu cuenta ciudadana para gestionar expedientes y formularios."
  - Recuperación: h1 "Recuperá tu contraseña"; sub "Ingresá tu correo para recibir un enlace de restablecimiento seguro."

#### 1.4 Campos del formulario principal (login/registro) — `:451-537`
- `<form class="space-y-4">` (16px entre campos).
- **Label:** `block text-xs font-medium text-muted mb-1.5` (12px, peso 500, color muted, 6px bajo) — **no uppercase** (`:454,469,484`). Textos: "Full name" (solo registro), "Email address", "Password".
- **Input (todos los campos):** `w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all` (`:463,479`). Padding 16/12, radio **16px**, borde **1px** `line` (claro `rgba(15,23,48,.12)`, oscuro `rgba(234,240,250,.12)`), texto 14px color ink, fondo **transparente** (ver trampa 1) → **alto derivado 46px**. Foco: borde `brand` (`#2F6BFF` claro/`#4D7DFF` oscuro) + anillo 1px `brand/20`, sin outline. **No hay estilo de error en el campo** (no existe borde rojo ni texto de ayuda bajo el campo; los errores salen como Toast).
- Placeholders: nombre "Ej: Juan Carlos Pérez" (`:462`); email "name@example.com" (`:477`); contraseña login "••••••••", registro "Mínimo 6 caracteres" (`:493`). Recuperación email: "tucorreo@ejemplo.com" (`:359`). Color de placeholder: ver trampa 2.
- **Contraseña con ojo (inline, no usa PasswordField)** (`:487-513`): wrapper `relative`; input `pl-4 pr-10` (40px derecha); botón `absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1` (12px del borde derecho, centrado vertical); icono SVG `w-4 h-4` (16px), `stroke="currentColor" strokeWidth 2`, estilo Heroicons outline: ojo (visible=false) / ojo tachado (visible=true). Sin aria-label.
- **Fila Remember/Forgot (solo login)** (`:517-537`): `flex items-center justify-between text-xs pt-1`. Izquierda: checkbox nativo `w-4 h-4 rounded border-line bg-card text-brand-deep accent-brand-deep` (16px, color de acento `#1C44B6` claro/`#2F55C0` oscuro) + "Remember me" (`gap-2`, color muted, hover ink); **marcado por defecto** (`useState(true)`, `:22`). Derecha: botón texto "Forgot your password?" `text-muted hover:text-ink`, sin fondo ni borde.
- **Solo registro — casilla de agente público** (`:540-557`): `pt-2`; `<label class="flex items-start gap-2.5 p-3 rounded-xl border border-line bg-mist/50 dark:bg-slate-900/40 hover:border-brand/40">` con checkbox `mt-0.5 w-4 h-4 rounded accent-brand-deep` y texto `text-xs`: título `font-semibold text-ink block` "Soy agente público y solicito acceso al panel de administración"; sub `text-muted block mt-0.5` "Un Superadmin revisará tus datos antes de activarte." Desmarcada por defecto.
- **Registro expandido (si marcada)** (`:559-604`): `mt-3 p-3 rounded-xl border border-line bg-card space-y-3`; 2 filas `grid grid-cols-2 gap-2` + textarea. Campos compactos: `w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink focus:outline-none focus:border-brand` (padding 12/8, 12px de texto, radio 12px, **fondo `paper`**, sin anillo). Contenido: Fila 1: input "CUIL (20-12345678-3)" + input tel "Teléfono". Fila 2: `select` con opción vacía "Dependencia..." + opciones **Mesa de Entradas, Recursos Humanos, Legajos, Liquidaciones, Sistemas** (`src/data/mockEmployeeApprovals.js:3-9`) + input "Puesto / Función". `textarea rows=2 resize-none` placeholder "Motivo de la solicitud (opcional)...".
- **Botón primario** (`:609-619`): `w-full py-3.5 mt-2 rounded-full bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md` → ancho completo, alto derivado 48px (14+20+14), píldora, texto 14px peso 600 **sin uppercase**, margen sup. 8px, sombra TW `shadow-md`. Claro: `#1C44B6`/blanco; **oscuro: fondo blanco/texto negro**. Hover: opacidad 0.9. Pulsado: escala 0.98. Deshabilitado: opacidad 0.5. Etiquetas: "Sign in" / "Create account" / "Procesando...".
- **Divisor** (`:623-632`): `relative my-6 text-center`; línea `border-t border-line` a todo el ancho con etiqueta centrada `bg-paper dark:bg-[#09090b] px-3 text-muted font-medium tracking-wider uppercase text-xs` → "or continue with" (el fondo de la etiqueta tapa la línea).
- **Botón Google** (`:636-662`): `w-full py-3 px-4 rounded-full border border-line bg-card hover:bg-mist/70 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-ink dark:text-white text-sm font-medium flex items-center justify-center gap-3 shadow-sm active:scale-[0.99]`. Alto derivado 46px, píldora, borde 1px `line`; fondo transparente en claro (trampa 1) / neutral-900 (~#171717) en oscuro; hover mist@70% / neutral-800 (~#262626). Icono Google multicolor SVG `w-4 h-4` con colores oficiales `#4285F4`, `#34A853`, `#FBBC05`, `#EA4335` (`:644-659`), gap 12px; texto **"Continue with Google"**. Sin estilo `disabled`.
- **Enlace alterno inferior** (`:666-690`): `mt-8 text-center text-xs text-muted`. Login: "¿No tenés una cuenta? **Registrate gratis**"; Registro: "¿Ya tenés una cuenta registrada? **Iniciá sesión**". El botón-enlace: `font-semibold text-brand hover:underline ml-1`, sin fondo.
- **Línea de copyright** (`:695-697`): `w-full max-w-md mx-auto text-center text-[11px] text-muted pt-4` → "ChatAP Formosa © 2026 · Subsecretaría de Recursos Humanos".

#### 1.5 Flujo "Recuperar contraseña" (reemplaza el formulario; `:345-447`)
- Paso A (`:348-370`): `space-y-4`; label `block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5` "Email address" (**aquí sí uppercase/semibold**); input igual al principal; botón primario idéntico (py-3.5, píldora, `bg-brand-deep`/oscuro blanco) "Enviar enlace de recuperación" / "Enviando enlace...".
- Paso B – confirmación (`:372-438`): panel `p-5 rounded-2xl border border-line bg-mist/50 dark:bg-slate-900/60 text-center space-y-4`.
  - Icono: círculo `w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400` con sobre (mail) 24px (`:373-377`).
  - Título `text-sm font-bold`: "¡Correo enviado con EmailJS!" o "Enlace de recuperación generado" (`:381-383`). Texto `text-xs text-muted leading-relaxed`: "Enviamos el enlace a **{email}**. Revisá tu bandeja de entrada o spam para continuar." / "El enlace de restablecimiento para **{email}** está listo para ser utilizado." (`:386-398`; el email en `strong text-ink`).
  - Aviso opcional: `p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400` "Aviso del servicio: …" (`:403`).
  - Botón 1 (link): `w-full inline-flex … py-3 px-4 rounded-xl bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-xs shadow-sm` "Restablecer contraseña ahora →" (`:412-415`; **radio 16px, no píldora**). Botón 2: `w-full py-2.5 text-xs font-medium rounded-xl bg-card border border-line text-ink hover:bg-mist` "Copiar enlace de recuperación" (`:419-421`).
  - Pie: `pt-2 border-t border-line/60` con "Enviar a otro correo" `text-xs text-brand font-medium hover:underline` (`:426-437`).
- Enlace de salida (ambos pasos): `w-full text-center text-xs text-muted hover:text-ink` "← Volver a iniciar sesión" (`:440-446`).

#### 1.6 Modal "Autenticación con Google" (asistente demo; `:705-839`)
- Overlay `fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in` (`:706`). Panel `w-full max-w-md rounded-2xl bg-card border border-line p-6 shadow-2xl text-ink` (`:708`) — fondo transparente por `bg-card` inexistente (se ve el desenfoque detrás: defecto visual probable).
- Cabecera: icono Google 20px + "Autenticación con Google" `text-sm font-bold`; botón cerrar "✕" (`:712-741`), línea inferior `border-b border-line pb-3`.
- Caja info `mt-4 p-3.5 rounded-xl bg-mist/60 dark:bg-slate-900/60 border border-line text-xs` con punto azul `w-2 h-2 rounded-full bg-blue-500` y "¿Cómo funciona el inicio con Google real?" + párrafo (`:744-752`).
- Sección "1. Acceso de prueba inmediato:" (label `text-[11px] font-semibold uppercase tracking-wider text-muted`) con 2 filas-cuenta `p-2.5 rounded-xl border border-line` (avatar redondo `w-8 h-8` 32px, nombre `text-xs font-semibold`, email `text-[11px] font-mono`, chip "Entrar" `text-[10px] px-2 py-0.5 rounded bg-mist`): "Juan Carlos Pérez — juan.perez@gmail.com", "María Elena Gómez — m.gomez@gmail.com" (`:50-61,761-786`).
- Sección "2. Conectar tu propio Google Client ID real:" con botón punteado `py-2 px-3 rounded-xl border border-dashed border-line` "+ Configurar Google Client ID ahora" / "+ Modificar Google Client ID"; al abrir: input mono placeholder "Ej: 1234567890-abcdef.apps.googleusercontent.com" y botones "Cancelar" (borde) / "Guardar y Probar" (`bg-brand-deep text-white rounded-lg`) (`:790-829`).
- Pie: "Integración con Google Identity Services (GIS SDK OAuth 2.0)." `text-[10px] text-muted` (`:832-836`).
- Para la app móvil esto es herramienta de desarrollo/demo; el flujo real es el botón "Continue with Google".

#### 1.7 Feedback (toasts)
Toast (`src/components/common/Toast.jsx:38-76`): `fixed bottom-4 right-4 z-50 max-w-sm`; cada uno `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg bg-linear-to-r text-paper text-sm font-medium animate-slide-up`, degradados `from-emerald-500 to-emerald-600` (success), `from-red-500 to-red-600` (error), `from-amber-500 to-amber-600` (warning), `from-primary to-primary-light` (info); icono 16px + mensaje + ✕; auto-cierre 3.5s (`:15-17`). Mensajes literales relevantes: "¡Bienvenido/a de nuevo!", "¡Cuenta creada con éxito!", "¡Solicitud enviada! Un Superadmin revisará tus datos para el panel interno.", "Ingresá un correo electrónico válido.", "Ocurrió un error." (`LoginRegisterPage.jsx:136,149-153,175,158`).

### Inferences
- En móvil (<1024px) la pantalla es: fondo `paper` (oscuro `#09090b` en la columna), padding lateral 24px (≥640px: 48px), columna centrada de hasta 448px. Para un teléfono (<640px) no hay ningún elemento de la mitad izquierda: sin foto.
- La foto solo aparece en escritorio; si la app móvil quiere usarla, hay que decidirlo explícitamente (sería recorte 21:10 del JPG vertical 896×1200, centrado).
- No existe stepper ni wizard; "pasos" = modos (login/registro/recuperación) y sub-paso de confirmación.

### Gaps
- Color real del placeholder (trampa 2) y fondo transparente de inputs/Google en claro (trampa 1): requieren build para confirmar visualmente; el cálculo se basa en que `--color-card` no existe.
- No hay estados de error por campo (borde rojo) en esta pantalla: no determinable porque no existen en código.
- `ChatBotAvatar` es un SVG animado generado por motor (`src/bloub/*`); su aspecto exacto (blob + ojos) no está especificado en esta pantalla más allá del tamaño (26 / 22 px).

---

## 2. Pantalla de Restablecer contraseña — `src/pages/ResetPasswordPage.jsx` (175 líneas) + `src/components/common/PasswordField.jsx` (48 líneas)

### Takeaway
Tarjeta centrada de 448px sobre fondo `paper`, con avatar del bot (64px) y título arriba. Tres estados: formulario (2 campos con ojo), éxito, y enlace inválido. Footer del sitio abajo. Sin navbar.

### Cited Findings
- Raíz `min-h-screen flex flex-col justify-between bg-paper` (`:49`); centro `flex-1 flex items-center justify-center px-4 py-10` (16px lateral, 40px vertical) (`:50`); contenedor `w-full max-w-md` (448px) (`:51`); `<Footer />` al final (`:172`).
- **Cabecera** (`:52-75`): `flex flex-col items-center text-center mb-8`. `ChatBotAvatar size={64}` (reaction "happy" si hecho, si no "idle") con `mb-4` (`:53-55`). `h1` `text-2xl font-bold text-ink m-0 animate-type-in` (24px, 700). Subtítulo `text-muted text-sm mt-1 m-0 animate-type-in` con delay 80ms (14px).
  - Textos: inválido → "Enlace no válido" / "Ese enlace venció o ya fue usado."; hecho → "¡Listo!" / "Te redirigimos al login para iniciar sesión…"; normal → "Nueva contraseña" / "Para la cuenta {email}. Elegí al menos 6 caracteres." (o "Elegí una contraseña de al menos 6 caracteres." sin email) (`:57-74`).
- **Tarjeta** (`:77`): `rounded-2xl border border-line bg-mist p-6 sm:p-8 shadow-soft` → radio 20px, borde 1px `line`, fondo **`mist`** (claro `#E2EAF4`, oscuro `#0D1730`), padding 24px (≥640: 32px), **sin sombra** (`shadow-soft`=none).
- **Estado formulario** (`:136-158`, `space-y-4 animate-form-in`, gap 16px): dos `PasswordField`:
  1. label "Nueva contraseña", placeholder "Mínimo 6 caracteres", autocomplete new-password.
  2. label "Repetir contraseña", placeholder "Repetí la contraseña".
  Botón enviar: `w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60` (`:154`) → ancho completo, alto derivado 44px, **radio 16px (no píldora)**, texto 14px/600 sin uppercase; claro `#1C44B6`/texto `#F0F4F9`, hover `#2558E0`; oscuro `#2F55C0`/texto `#070E20`, hover `#3A6AE0`. Etiquetas "Guardar nueva contraseña" / "Guardando…".
- **Estado éxito** (`:110-134`, `text-center space-y-4`): icono `w-12 h-12 mx-auto rounded-xl grid place-items-center bg-ok/10 text-ok` (48px, radio 16px, fondo verde `#18bc42`@10%) con check SVG 24px stroke 2; botón idéntico "Iniciar sesión". Tras 1.2s redirige a /login (`:24-28`).
- **Estado enlace inválido** (`:78-109`): icono `w-12 h-12 rounded-xl bg-bad/10 text-bad` con triángulo de alerta 24px stroke 1.8; texto `text-sm text-muted`: "Pedí un enlace nuevo desde **“Olvidé mi contraseña”** (negrita, color ink) en el inicio de sesión."; botón "Ir a iniciar sesión" (mismo estilo).
- **Enlace de pie** (`:162-169`): `text-center mt-6`, "← Volver al chat" `text-sm text-muted hover:text-brand-deep`.
- **PasswordField** (`PasswordField.jsx`): `<label class="block">` (`:12`); texto de label `block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5` (`:13`) → **12px, 600, MAYÚSCULAS, ls 0.025em, color muted, 6px bajo** (mostrado en MAYÚSCULAS aunque el prop sea "Nueva contraseña"). Input `w-full px-4 py-3 pr-12 rounded-xl border border-line bg-paper text-sm text-ink placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none` (`:24`) → alto derivado 46px, radio 16px, **fondo `paper`** (más claro que la tarjeta `mist`), padding derecho 48px; foco: borde `brand` + anillo 2px `brand/15`. Botón ojo (`:26-31`): `absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex center text-faint hover:text-brand-deep hover:bg-mist` → área táctil 36×36px, a 8px del borde derecho, radio 12px; icono 20px (`w-5 h-5`) stroke 1.8, outline ojo/ojo-tachado (`:34-41`); aria-label/title "Mostrar contraseña"/"Ocultar contraseña".
- Error de coincidencia: solo toast "Las contraseñas no coinciden." (`:33`); éxito toast "Contraseña actualizada con éxito." (`:40`). No hay mensaje inline ni indicador de fuerza de contraseña.

### Inferences
- `PasswordField` se reutiliza en Seguridad (perfil) — mismo aspecto (ver §5.9).

### Gaps
- Avatar `ChatBotAvatar` 64px: forma exacta no especificada aquí.

---

## 3. Pantalla de Contacto — `src/pages/ContactoPage.jsx` (397 líneas)

### Takeaway
Página de contenido completa (Navbar flotante + cabecera + 3 tarjetas de canales + formulario + FAQ + dirección + Footer). Todo en `max-w-7xl`/`ed-max` 1280px con padding 20/48/80px. En móvil todo se apila en 1 columna.

### Cited Findings
- Raíz: `min-h-screen flex flex-col bg-paper text-ink` (`:83`); `<Navbar />` (flotante, fuera de flujo; ver 4 y `src/index.css:2167-2211`: píldora `fixed top 1rem` (≥640: 1.25rem), `nav-pill` fondo `rgba(10,17,36,.94)`, borde `rgba(255,255,255,.12)`, radio 9999px); `<main class="flex-1 w-full">` (`:86`); `<Footer />` (`:394`).
- **Sección cabecera** (`:88-189`): `border-b border-line/70 bg-mist/35 py-10 sm:py-14` (40px vertical, ≥640: 56px); contenedor `ed-max section-bleed`; bloque `max-w-3xl` (768px).
  - Migas (`:91-97`): `flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest mb-3`: "Inicio" (link muted) / "/" / **"Soporte"** (`text-brand-deep font-bold`).
  - Kicker `p.kicker mb-2` "SUBSECRETARÍA DE RECURSOS HUMANOS" (`:99`; clase `.kicker` sin definición en HEAD → renderiza ~16px normal, mayúsculas por el texto; intención histórica 11.5px/600/ls 0.2em/muted).
  - `h1` `text-3xl sm:text-4xl font-extrabold tracking-tight text-ink m-0` "¿En qué te podemos ayudar?" (30px; ≥640: 36px; peso 800→Black) (`:100-102`).
  - Párrafo `text-base sm:text-lg text-muted mt-3 m-0 leading-relaxed max-w-2xl`: "Elegí un canal de atención directa o dejanos tu consulta y te responderemos a la brevedad." (`:103-105`).
  - **Pill de estado** (`:108-115`): `mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-paper text-xs shadow-soft` (sin sombra): punto 8px (`h-2 w-2`) emerald-500 (~#00bc7d) con anillo `animate-ping` emerald-400 al 75%; "**Mesa de ayuda activa**" (`font-semibold text-ink`) + "· Lun a Vie 07:00 a 19:00 hs" (muted).
- **3 tarjetas de canal** (`:119-187`): `mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4` → apiladas en móvil (<640), 3 columnas iguales ≥640, gap 16px. Cada una `group p-6 rounded-2xl border … hover:-translate-y-0.5 transition no-underline` (padding 24px, radio 20px). Interior: fila superior `flex items-center justify-between mb-4` con icono `w-11 h-11 rounded-xl` (44px/16px) + chip `text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full`; título `text-base font-bold text-ink m-0`; descripción `text-xs text-muted mt-1`; enlace `mt-4 inline-flex gap-1.5 text-xs font-bold group-hover:underline`.
  1. **WhatsApp** (`:121-142`): `border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500/60`; icono `bg-emerald-500 text-paper shadow-xs` con logo WhatsApp relleno 24px; chip "Respuesta rápida" `text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40`; título "WhatsApp Oficial"; desc "Atención personalizada por chat."; enlace "Abrir WhatsApp (+54 9 3704-000000) →" `text-emerald-700 dark:text-emerald-400`. Destino `https://wa.me/5493704000000?text=Hola,%20necesito%20ayuda%20con%20un%20tr%C3%A1mite%20en%20el%20portal%20de%20Recursos%20Humanos`.
  2. **Teléfono** (`:145-164`): `border-line bg-paper hover:border-brand/40`; icono `bg-brand-deep/10 text-brand-deep` teléfono outline 24px stroke 1.8; chip "Sin costo" `text-muted bg-mist border border-line`; título "0800-555-1234"; desc "Línea gratuita de atención telefónica."; enlace "Llamar ahora por teléfono →" `text-brand-deep`. `tel:08005551234`.
  3. **ChatAP** (`:167-186`): `border-line bg-paper hover:border-brand/40`; icono `bg-primary-light text-brand-deep` (`#EBF2FF` claro / `#0D1B40` oscuro) burbuja de chat; chip "24 horas" `text-brand-deep bg-primary-lighter border border-brand/20`; título "Asistente Virtual ChatAP"; desc "Respuestas automáticas al instante."; enlace "Hacer una consulta en el chat →". Ruta `/chat`.
- **Sección 2 columnas** (`:192-391`): `py-12 sm:py-16` (48/64px); `grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start` (40px; ≥1024: 56px). Formulario `lg:col-span-7`, columna derecha `lg:col-span-5`. <1024: formulario primero y luego FAQ + dirección, apilados.
- **Tarjeta formulario** (`:197-314`): `rounded-3xl border border-line bg-paper p-6 sm:p-9 shadow-soft` → radio **28px**, padding 24px (≥640: 36px), sin sombra. Título `h2 text-xl sm:text-2xl font-bold tracking-tight` "Dejanos tu mensaje" (20/24px); sub `text-sm text-muted mt-1.5 mb-6` "Completá tus datos y te responderemos por correo o teléfono en el transcurso del día."
  - `form space-y-4` (16px). **Label** `block text-xs font-bold uppercase tracking-wider text-muted mb-1.5` (12px, 700, mayúsculas, ls 0.05em). Textos: "Nombre y Apellido *", "Email o Teléfono de contacto *", "¿Sobre qué es tu consulta? *", "Mensaje o detalle *".
  - **Input / select / textarea:** `w-full px-4 py-3 rounded-xl border border-line bg-mist/30 text-ink text-sm focus:outline-none focus:border-brand-deep focus:bg-paper transition-all` → radio 16px, borde 1px `line`, fondo **mist al 30%**, al foco borde `brand-deep` (`#1C44B6` claro / `#2F55C0` oscuro) y fondo `paper`; **sin anillo**; sin color de placeholder definido (preflight por defecto). Select añade `font-medium cursor-pointer`; textarea `rows=4 resize-none leading-relaxed` (alto derivado ≈117px). Placeholders: "Tu nombre completo", "ejemplo@correo.com o 3704-123456", "Escribí brevemente en qué podemos ayudarte...". El select no tiene flecha custom (nativa).
  - Opciones del select (`:27-33`): "Problemas para ingresar o contraseña" (default), "Recibos de sueldo / Liquidaciones", "Licencias e inasistencias", "Seguimiento de expediente / Trámites", "Otra consulta o gestión".
  - **Botón enviar** (`:293-311`): `w-full py-3.5 rounded-xl bg-brand-deep text-paper text-sm font-bold uppercase tracking-wider hover:bg-brand shadow-soft flex center gap-2 disabled:opacity-50` → ancho completo, alto derivado 48px, radio 16px (no píldora), mayúsculas ls 0.05em; icono avión de papel 16px + "Enviar Consulta"; cargando: spinner 16px (`border-2 border-paper border-t-transparent animate-spin`) + "Enviando...".
  - **Estado enviado** (`:206-226`, `py-8 text-center animate-scale-in`): círculo `w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200` con check 28px stroke 2.5; `h3 text-lg font-bold` "¡Consulta enviada con éxito!"; `p text-sm text-muted mt-2 max-w-md mx-auto` "Recibimos tu mensaje. Un agente de la Subsecretaría de Recursos Humanos se pondrá en contacto a la brevedad."; botón `mt-6 px-5 py-2.5 rounded-xl border border-line bg-mist/60 text-xs font-bold uppercase tracking-wider` "Enviar otra consulta".
  - Validación: solo toast "Por favor completá tu nombre, contacto y mensaje" (error) y "¡Consulta enviada! Te responderemos a la brevedad." (`:69,78`); sin error inline.
- **Tarjeta FAQ** (`:319-363`): `rounded-3xl border border-line bg-paper p-6 sm:p-8` (padding 24/32px); `h2 text-lg sm:text-xl font-bold` "Preguntas frecuentes"; sub `text-xs text-muted mb-5` "Respuestas inmediatas a las dudas más comunes." Acordeón `space-y-2.5` (10px): cada ítem `rounded-2xl border border-line/80 bg-mist/20 overflow-hidden`; cabecera botón `w-full p-3.5 text-left flex items-start justify-between gap-3` con pregunta `text-xs sm:text-[13px] font-bold text-ink leading-snug` y chevron `w-5 h-5` (icono 14px) que gira 180° y pasa a `text-brand-deep` al abrir; respuesta `px-3.5 pb-3.5 pt-1 text-xs text-muted leading-relaxed border-t border-line/50 animate-fade-in`. Un solo ítem abierto a la vez; inicia todo cerrado. Preguntas literales (`:8-25`): "¿Dónde consulto mis recibos de haberes?", "¿Cómo solicito una licencia médica o anual?", "¿Cómo hago el seguimiento de un expediente en SIGED?", "¿Qué hago si olvidé mi contraseña o no puedo ingresar?" (respuestas completas en el archivo `:11,15,19,23`).
- **Tarjeta Atención Presencial** (`:366-387`): `rounded-3xl border border-line bg-mist/40 p-6`; icono `w-9 h-9 rounded-xl bg-paper border border-line text-brand-deep` (pin de mapa 20px); `h3 text-sm font-bold` "Atención Presencial"; líneas `text-xs text-muted`: "**Mesa de Entrada Central:** Belgrano 836, Formosa Capital." / "Lunes a Viernes de 07:00 a 13:00 y 14:00 a 19:00 hs." / "Correo oficial: **mesadeayuda@subsechh.formosa.gob.ar**".
- Columna derecha: contenedor `space-y-6` (24px entre tarjetas), `id="faq"`.

### Inferences
- Móvil (<640): tarjetas de canal en 1 columna a ancho completo; no hay ocultamiento de elementos, solo reflujo. Tipografías cambian en el punto 640 (h1 30→36, h2 20→24, p 16→18).
- Las tres tarjetas de canal son el único uso de color "semántico" (verde WhatsApp) en estas pantallas.

### Gaps
- Color de placeholder en inputs de Contacto no está definido explícitamente (preflight por defecto).
- `.kicker` sin estilo en HEAD (ver §0).
- Navbar/Footer: no descritos al detalle (alcance de otra pantalla compartida).

---

## 4. Pantalla 404 — `src/pages/NotFoundPage.jsx` (115 líneas)

### Takeaway
Pantalla centrada a 672px de máximo con una insignia "Error 404", un "404" gigante en arte ASCII 3D animado (canvas WebGL), titular, párrafo, 2 botones píldora y una fila de atajos en chips.

### Cited Findings
- Raíz `min-h-screen flex flex-col justify-between bg-paper text-ink relative overflow-hidden` (`:25`). **Luz ambiental:** `absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[22rem] bg-brand/10 rounded-full blur-3xl -z-10` (óvalo 672×352px, `brand`@10% con desenfoque 64px, centrado arriba) (`:27-30`). `<Navbar />` flotante (`:32`) y `<Footer />` (`:112`).
- `main` `flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center z-10` → padding lateral 16px, **superior 112px** (libera la píldora de navegación fija), inferior 64px (`:34`). Contenedor `w-full max-w-2xl mx-auto flex flex-col items-center` (672px) (`:35`).
- **Insignia** (`:38-41`): `inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand mb-2` → texto mono 12px/700 mayúsculas, color `brand` (`#2F6BFF` claro / `#4D7DFF` oscuro), borde y fondo `brand`@30%/10%; punto `h-2 w-2 rounded-full bg-brand animate-pulse`. Texto: **"Error 404 · Ruta no encontrada"**.
- **Escenario "404"** (`:44-54`): `w-full h-56 sm:h-72 md:h-80 relative flex center my-1` → alto 224px (≥640: 288px; ≥768: 320px). Componente `ASCIIText` (`src/components/common/ASCIIText.jsx`) con props `text="404" enableWaves asciiFontSize={8} textFontSize={190} textColor="#ffffff" planeBaseHeight={8}` y `textGradient` que depende del tema: **claro** `linear-gradient(135deg, #1C44B6 0%, #2563EB 45%, #0284C7 85%, #3B82F6 100%)`; **oscuro** `linear-gradient(135deg, #93C5FD 0%, #60A5FA 45%, #38BDF8 85%, #FFFFFF 100%)` (`:18-22`). Es texto ASCII (caracteres monoespaciados 8px) con ondas animadas, rellenos de degradado diagonal (CSS en `ASCIIText.css:11-40`: `<pre>` centrado con `line-height:1.02em`, `-webkit-background-clip:text`, canvas con `image-rendering: pixelated`).
- **Titular** `h1` `text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-ink mt-1 mb-3 font-neue` (24 / 30 / 36px, peso 800→Black): **"La página que buscás no existe o fue movida"** (`:57-59`).
- **Párrafo** `text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed m-0 font-neue-text` (14/16px; ancho máx 512px): "El trámite, documento o enlace al que intentás acceder no está disponible. Podés regresar al portal de inicio o consultar de inmediato a nuestro asistente virtual." (`:61-64`).
- **Botones** (`:67-87`): contenedor `flex flex-wrap items-center justify-center gap-3.5 mt-8` (gap 14px, margen sup. 32px).
  - Primario: `btn-primary no-underline text-xs sm:text-sm px-6 py-3 shadow-lg shadow-brand/20 flex items-center gap-2` → píldora, `#1C44B6` (oscuro `#2F55C0`) texto `paper`, mayúsculas bold ls 0.1em, 12px (≥640: 14px), sombra TW `shadow-lg` teñida `brand`@20%; icono casa 16px stroke 2; texto "Volver al inicio". Hover: `#EBEBEB`/`#1A1A1A`.
  - Secundario: `btn-ghost no-underline text-ink border-line hover:bg-mist/60 text-xs sm:text-sm px-6 py-3 flex gap-2` → píldora, transparente, borde `line`; icono burbuja de chat 16px `text-brand`; texto "Preguntarle a ChatAP".
  - En móvil estrecho los dos botones envuelven (flex-wrap) en filas centradas.
- **Atajos** (`:90-107`): `mt-10 pt-6 border-t border-line/40 w-full flex flex-col items-center gap-3`. Etiqueta `text-[11px] font-mono font-medium uppercase tracking-widest text-muted/70`: "O accedé a trámites frecuentes". Chips `flex flex-wrap justify-center gap-2`; cada chip `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line/70 bg-paper hover:bg-mist/50 text-xs text-muted hover:text-ink` con punto `w-1.5 h-1.5 rounded-full bg-brand/60`: "Haberes y Sueldos", "Licencias Oficiales", "Mesa de Entrada SIGED", "Soporte y Contacto" (`:8-13`). Los 3 primeros abren /chat con consulta precargada; el último /contacto.

### Inferences
- El "404" no es una imagen: es una escena canvas/ASCII. Para móvil se puede sustituir por texto "404" monoespaciado con degradado diagonal `#1C44B6→#2563EB→#0284C7→#3B82F6` (claro) o `#93C5FD→#60A5FA→#38BDF8→#FFFFFF` (oscuro).

### Gaps
- Aspecto exacto del arte ASCII (caracteres usados, amplitud de las ondas) depende de `ASCIIText.jsx`, no analizado en detalle.

---

## 5. Perfil — `src/pages/ProfilePage.jsx` (43 líneas), `src/components/profile/*`

### Takeaway
Perfil = Navbar flotante + una sola columna `ed-max` con: cabecera-tarjeta (título "MI PERFIL." + avatar de iniciales + nombre/email/insignias + botón "Editar perfil" + grilla de datos), una fila de **pestañas-píldora con scroll horizontal** (no hay sidebar) y debajo la sección activa. Las secciones cambian según rol (Ciudadano / Administrador / Superadmin). Modales de detalle centrados.

### Cited Findings

#### 5.1 Estado sin sesión (`ProfilePage.jsx:11-35`)
Raíz `min-h-screen flex flex-col bg-paper`; `main flex-1 flex center px-4 py-16`; bloque `max-w-md w-full text-center animate-scale-in`. Icono candado `w-14 h-14 mx-auto rounded-2xl bg-brand-deep/10 text-brand-deep mb-6` (56px/20px) con SVG 28px; `p.kicker` "[ Mi perfil ]"; `h2.display-3 text-ink mt-4` "SESIÓN REQUERIDA." (display-3 sin definición en HEAD → 16px normal); `p text-sm text-muted font-medium mt-4 mb-8` "Iniciá sesión para ver tu perfil, tus trámites y tus conversaciones."; botón `btn-primary` "Iniciar sesión".

#### 5.2 Marco de página (`ProfileLayout.jsx`)
- `div min-h-full flex flex-col bg-paper` → `main flex-1 w-full ed-max section-bleed py-12 lg:py-16` (`:78-79`): ancho máx 1280px, padding lateral 20px / 48 (≥768) / 80 (≥1024), vertical 48px (≥1024: 64px). Orden: `ProfileHeader` → pestañas (`mt-10`) → sección (`mt-8`). Navbar y Footer los pone `ProfilePage.jsx:39,41`.
- **Pestañas** (`:83-104`): contenedor `flex gap-2 overflow-x-auto pb-2 mt-10 -mx-1 px-1` (gap 8px, scroll horizontal sin wrap). Cada pestaña `inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-full border whitespace-nowrap` (píldora, padding 16/10px, 13px/600) con icono 16px (`w-4 h-4`, stroke 1.6) + etiqueta. **Activa:** `bg-ink text-paper border-ink` (claro: `#0F1730` con texto `#F0F4F9`; oscuro: `#EAF0FA` con texto `#070E20`). **Inactiva:** `bg-paper text-muted border-line hover:text-ink hover:bg-mist`.
- Pestañas por rol (`:23-45`), orden y etiquetas literales (icono entre paréntesis):
  - **Ciudadano:** Resumen (activity/rayo) · Mis trámites (documento) · Mis solicitudes (documento con líneas) · Mis conversaciones (chat) · Mi actividad (rayo) · Notificaciones (campana) · Seguridad (escudo).
  - **Administrador:** Resumen · Permisos (escudo) · Seguridad (candado).
  - **Superadmin:** Resumen · Permisos · Auditoría (rayo) · Seguridad (candado).
  - Iconos = paths Heroicons outline en `ui.jsx:72-86` (ICONS.profile, tramite, solicitud, chat, bell, shield, activity, users, key, lock, logout, close, check, alert).
- Cada cambio de sección remonta (`key={normalized}`); sin transición declarada en el contenedor.

#### 5.3 Cabecera de perfil (`ProfileHeader.jsx`)
- Contenedor `<header class="card overflow-hidden bg-paper">` (`:47`) → radio 20px, borde `line/70`, fondo `paper`.
- **Bloque superior** `px-6 sm:px-10 pt-10 pb-8 relative overflow-hidden` (`:48`) (24px lateral; ≥640: 40px; arriba 40px; abajo 32px). **Marca de agua** "AP" `absolute -right-6 -top-8 text-ink/[0.05] text-[11rem] font-black tracking-tighter` (176px, ink al 5%, recortada por `overflow-hidden`, `pointer-events-none`) (`:49-54`). `p.kicker` "[ Mi perfil · ChatAP ]" (`:56`); `h1.display-2 text-ink mt-4 mb-0` "MI PERFIL." (`:57-59`; display-2 = clamp(29.6px, 3.8vw, 48px), peso 600, lh 1.2, ls -0.02em).
- **Fila identidad** (`:61-206` → líneas 61-95): `relative mt-10 flex flex-wrap items-start justify-between gap-6` (40px bajo el título; en móvil el botón envuelve debajo).
  - **Avatar** (`:63-65`): `w-20 h-20` (80px) `rounded-full bg-brand-deep text-paper grid place-items-center text-2xl font-bold uppercase ring-4 ring-brand-deep/10 shrink-0` → círculo `#1C44B6` (oscuro `#2F55C0`) con **iniciales** (2 primeras palabras, 24px/700) y anillo 4px `brand-deep`@10%. **No hay portada/cover ni foto.**
  - A su derecha (gap 20px): nombre `text-2xl font-extrabold tracking-tight text-ink m-0 truncate leading-tight` (24px, 800→Black); email `text-sm text-muted m-0 mt-1 font-medium break-all` (14px); fila de insignias `flex flex-wrap items-center gap-2 mt-3` (`:71-84`).
  - **Insignias** (`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full`): Rol — Superadmin: `bg-ink text-paper`; Administrador: `bg-brand-deep/10 text-brand-deep border border-brand-deep/20`; Ciudadano: `bg-mist text-muted border border-line` (`:22-26`); textos "SuperAdmin" / "Administrador" / "Ciudadano" (`:73`). Estado — Activo: `bg-ok/10 text-ok border border-ok/20`; Pendiente: `bg-warn/10 text-warn border border-warn/25`; Suspendido: `bg-bad/10 text-bad border border-bad/25`; Inactivo: `bg-muted/10 text-muted border border-line` (`:15-20`); texto = estado o "—". Si es personal interno: `bg-brand/10 text-brand-deep border border-brand/20` con escudo 12px + "Personal interno" (`:79-83`).
  - **Botón "Editar perfil"** (`:88-94`): `btn-primary shrink-0` (píldora, 42px alto, `#1C44B6`, mayúsculas bold ls 0.1em 12px) con icono usuario 16px + "Editar perfil".
- **Grilla de datos** (`:98-108`): `border-t border-line px-6 sm:px-10 py-8 grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6` → **2 columnas** en móvil, 3 columnas ≥768; gaps 40px × 24px; padding 24/40px lateral, 32px vertical. Cada `InfoItem` (`:28-36`): `border-t border-line/70 pt-4`; etiqueta `text-[10px] font-bold uppercase tracking-[0.22em] text-faint`; valor `text-[15px] text-ink font-medium mt-1 break-words` (mono 13px para correo/DNI/CUIL/teléfono). Orden y etiquetas: Nombre completo · Correo electrónico (mono) · DNI (mono) · CUIL (mono) · Teléfono (mono) · Dependencia · Puesto · Registrado (fecha dd/mm/aaaa `es-AR`) · Último acceso (fecha-hora `es-AR`). Valor vacío → "—". Un `InfoItem` sin valor no se muestra (pero todos reciben "—" salvo nombre/email).

#### 5.4 Componentes compartidos (`ui.jsx`)
- **SectionHeader** (`:9-19`): `flex flex-wrap items-end justify-between gap-4 mb-8`; `h2.display-3 text-ink m-0 uppercase` (efectivo en HEAD: ~16px normal, MAYÚSCULAS, color ink; intención histórica 28-52px/700/ls -0.035em); descripción `text-[15px] text-muted mt-2 m-0 max-w-2xl`; acción opcional a la derecha (gap 8px).
- **EmptyNote** (`:21-32`): `flex flex-col items-center justify-center text-center py-10 px-4`; icono `text-4xl mb-2 opacity-70` (en uso: SVG 40px `w-10 h-10 mx-auto`, o 32px dentro de Resumen); título `text-sm font-semibold text-ink`; descripción `text-xs text-muted mt-1 max-w-sm leading-relaxed`; acción `mt-4`.
- **Pill** (`:34-40`): `inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1`, tono por defecto `bg-mist text-muted border border-line`.
- **Field** (`:59-69`): `dt text-[10px] uppercase tracking-widest text-faint`; `dd text-sm text-ink font-medium mt-0.5` (mono 13px si `mono`).
- **DetailModal** (`:42-57`): overlay `fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in` (**sin fondo oscuro/scrim**: el overlay no tiene color; clic fuera cierra); panel `card w-full max-w-xl p-0 overflow-hidden animate-scale-in shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col` (576px; `max-w-lg` = 512px en Editar perfil). Estructura repetida: cabecera `flex items-start justify-between px-5 pt-4 pb-3 border-b border-line` con icono `w-10 h-10 rounded-xl bg-brand-deep/10 text-brand-deep` (40px/16px) + título `text-base font-bold` + sub `text-[11px] text-muted mt-0.5` y botón cerrar (icono X 20px, `text-muted p-1`); cuerpo `px-5 py-4 overflow-y-auto`; pie `flex justify-end gap-2 px-5 py-3 border-t border-line bg-soft/60` con botón `btn-ghost py-2! px-3.5! text-[13px]!` "Cerrar".
- **StatCard** (`src/components/admin/ui.jsx:48-70`): `card-interactive p-5 animate-list-item`; arriba-izquierda etiqueta `text-[11px] uppercase tracking-widest text-muted truncate`, valor `mt-2 text-3xl font-bold text-ink leading-none` (30px, con animación de conteo 550ms, `:11-35`), hint `text-xs text-faint mt-1.5`; arriba-derecha icono `w-11 h-11 rounded-xl` (44px/16px) con tono. **Tonos** (`:41-46`): brand `bg-brand-deep/10 text-brand-deep`; ok `bg-ok/10 text-ok`; warn `bg-warn/10 text-warn`; bad `bg-bad/10 text-bad`; info `bg-info/10 text-info`; muted `bg-muted/10 text-muted`.
- **Estados de trámite** (`admin/ui.jsx:84-90`, `Resumen.jsx:135-145`): badge (`.badge` 10px/700 mayúsculas, píldora) Ingresado `bg-info/10 text-info`; En proceso `bg-warn/10 text-warn`; Observado `bg-bad/10 text-bad`; Finalizado `bg-ok/10 text-ok`. `StatusPill` añade punto `w-1.5 h-1.5 rounded-full bg-current` (con `dot-ping` si Ingresado/En proceso) (`admin/ui.jsx:100-112`). Hex: info `#2F6BFF`, warn `#efc21e`, bad `#d82f2f`, ok `#18bc42` (fondos al 10%).

#### 5.5 Sección Resumen (`sections/Resumen.jsx`)
- Contenedor `space-y-6` (24px). SectionHeader + grillas de StatCard.
- **Superadmin** (`:10-34`): título "Resumen general"; desc "Estado actual del sistema según los datos registrados."; grilla `grid-cols-2 md:grid-cols-4 gap-4` con 8 tarjetas (etiqueta / tono): Usuarios totales (brand), Ciudadanos (info), Administradores (ok), SuperAdmins (muted), Cuentas activas (ok), Suspendidas (bad), Solicitudes pendientes (warn), Trámites activos (info).
- **Administrador** (`:36-51`): "Resumen de gestión" / "Lo que está sucediendo en tu área en este momento."; grilla `grid-cols-2 lg:grid-cols-4 gap-4`: Solicitudes pendientes (warn, hint "aguardan revisión"), Trámites activos (info, "ingresados o en proceso"), Usuarios registrados (brand, "cuentas de ChatAP"), Notificaciones (ok, "sin leer").
- **Ciudadano** (`:54-132`): "Tu espacio" / "Un resumen de tus trámites, solicitudes y actividad en ChatAP."; 4 StatCards `grid-cols-2 lg:grid-cols-4 gap-4 stagger-children`: Trámites (brand, "a tu nombre"), Solicitudes (info, "de acceso"), Conversaciones (ok, "con ChatAP"), Notificaciones (warn, "sin leer"/"todo leído"). Debajo `grid-cols-1 sm:grid-cols-2 gap-4` con 2 tarjetas `card card-border p-5`:
  - "Mis trámites": cabecera `flex justify-between mb-3` con `h3 text-sm font-bold` + enlace `text-xs font-semibold text-brand` "Ver todos"; lista `divide-y divide-line` (máx 3) con filas `py-2.5 flex justify-between gap-3`: tipo `text-sm font-medium truncate` + id mono `text-[11px] text-faint` + StatusPill. Vacío: EmptyNote "No tenés trámites registrados" / "Cuando inicies un trámite en Mesa de Entradas o SIGED lo vas a ver acá." / botón `btn-ghost text-[13px]!` "Consultar trámites".
  - "Mis solicitudes" (enlace "Ver todas"): filas "Alta como empleado" + id + badge de estado (Pendiente `bg-warn/10 text-warn`, Activo `bg-ok/10 text-ok`, Suspendido `bg-muted/15 text-muted`, Rechazado `bg-bad/10 text-bad`). Vacío: "Todavía no realizaste ninguna solicitud" / "Si sos empleado, podés solicitar el acceso al Panel de Administración." / botón "Contactar al chatbot".

#### 5.6 Mis trámites (`sections/Tramites.jsx`)
- Título "Mis trámites"; desc "Expedientes asociados a tu cuenta. Seleccioná uno para ver el detalle y la línea de tiempo." (vacío: "Expedientes registrados a tu nombre.").
- **Lista** (tabla→lista): `card card-border overflow-hidden` con `ul divide-y divide-line`; fila (`:48-63`) `py-3 px-4 hover:bg-mist/70 cursor-pointer`: izquierda tipo `text-sm font-semibold truncate` + `text-[11px] font-mono text-faint mt-0.5` "{id} · {dd/mm/aaaa}"; derecha StatusPill + chevron "›" `text-faint`. La fila envuelve en móvil (`flex-wrap`).
- **Vacío**: EmptyNote icono 40px, "No tenés trámites registrados" / "Si iniciaste un trámite en la Mesa de Entradas o por SIGED, el detalle va a aparecer acá con su estado y movimiento." / `btn-primary text-[13px]!` "Consultar trámites".
- **Modal detalle** (`:103-155`): cabecera (icono documento, título = tipo, sub "{id} · {fecha}"); cuerpo: fila `StatusPill` + badge `bg-mist text-muted border border-line` con la prioridad; grilla `grid-cols-2 gap-4 mb-5` de Fields: "Solicitante", "Dependencia", y "Último movimiento" a 2 columnas; etiqueta `text-[11px] uppercase tracking-widest text-muted font-semibold mb-3` **"Línea de tiempo"**; caja `rounded-xl border border-line bg-mist/50 p-4 mb-5` con **timeline vertical** (`:11-46`): `ol pl-6`; pasos "Ingresado", "En revisión", "En proceso", "Finalizado"; cada `li pb-6`; punto `absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2` (activo/hecho: `bg-brand-deep border-brand-deep`, activo con `dot-ping`; pendiente: `bg-paper border-line`); línea conectora `absolute left-[5px] top-4 bottom-0 w-0.5` (`bg-brand-deep` si hecho/activo, si no `bg-line`); texto `text-sm font-medium` (activo `text-ink`, hecho `text-muted`, pendiente `text-faint`); si Observado, badge `badge bg-bad/10 text-bad ml-2` "Observado" en el paso 3. Si Observado, nota `text-xs text-bad`: "Tu trámite fue observado por documentación incompleta. Acercate a la Mesa de Entradas para regularizarlo." Pie: botón "Cerrar".
- Mapeo estado→paso activo: Ingresado=0, En proceso=2, Observado=2, Finalizado=3 (`:8`).

#### 5.7 Mis solicitudes (`sections/Solicitudes.jsx`)
- "Mis solicitudes" / "Las solicitudes que registraste y su resolución." Lista de **tarjetas** `space-y-3` (12px) con `card card-interactive w-full p-4 text-left`: icono `w-10 h-10 rounded-xl` con tono del estado (icono: Pendiente documento, Activo check, Suspendido candado, Rechazado X), título `text-sm font-semibold` "Alta como empleado", sub mono `text-[11px] text-faint` "{id} · solicitada el {fecha}", badge de estado a la derecha; nota de resolución opcional `text-xs text-muted mt-3 border-l-2 border-line pl-3`.
- Tonos/meta (`:7-12`): Pendiente "En espera de revisión" (`bg-warn/10 text-warn`); Activo "Acceso habilitado" (`bg-ok/10 text-ok`); Suspendido "Acceso suspendido" (`bg-muted/15 text-muted`); Rechazado "No fue aprobada" (`bg-bad/10 text-bad`).
- Vacío: "Todavía no realizaste ninguna solicitud" / "Si sos empleado público podés pedir el acceso al Panel de Administración desde el registro de cuenta." / `btn-primary` "Volver al inicio".
- Modal "Solicitud de acceso": badge de estado + Pill con la etiqueta (arriba); `dl grid-cols-2 gap-x-4 gap-y-3`: CUIL (mono), Teléfono, Dependencia, Puesto, Motivo (2 col), Resolución (2 col), Aprobado/Revisado "{revisor} · {fecha}"; si Rechazado: `text-xs text-bad` "Esta solicitud fue rechazada. Si considerás que fue un error, contactate con la Mesa de Ayuda." (`:73-137`).

#### 5.8 Conversaciones, Actividad, Notificaciones, Permisos, Auditoría
- **Mis conversaciones** (`Conversaciones.jsx`): "Mis conversaciones" / "Tu historial de consultas con ChatAP, agrupado por sesión." Tarjetas `card card-interactive p-4` `space-y-3`; icono `w-10 h-10 rounded-xl bg-ok/10 text-ok` (chat); título = primer mensaje del usuario `text-sm font-semibold truncate`; sub `text-[11px] text-faint` "{n} mensaje(s) · iniciada {hace…}"; derecha Pill con fecha-hora (dd/mm/aaaa hh:mm) y chevron "▾" que rota 180° al expandir. **Expandida** (`:69-96`): `mt-4 space-y-2.5 border-t border-line pt-4`; burbujas `max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed`: usuario `bg-brand-deep text-paper ml-auto rounded-br-sm` (derecha); bot `bg-mist text-ink rounded-bl-sm` (izquierda); acción `bg-mist text-ink border border-line mx-auto text-center text-xs rounded-full` con punto `bg-brand`; muestra los últimos 12; pie "Última actividad {hace…}" `text-[11px] text-faint` + enlace "Continuar conversación" `text-xs font-semibold text-brand`. Vacío: "Todavía no conversaste con ChatAP" / "Cuando inicies una consulta, tu historial va a aparecer acá para que puedas retomarlo." / `btn-primary` "Chatear con ChatAP".
- **Mi actividad** (`Actividad.jsx`): "Mi actividad" / "Las acciones registradas de tu cuenta: consultas, cambios de perfil y movimientos." Lista dentro de `card card-border overflow-hidden`, `divide-y divide-line`; fila `flex items-start gap-3 px-5 py-3.5`: icono `w-9 h-9 rounded-xl` (36px) con tono por tipo + texto `text-sm` ("acción" en `font-semibold` + objetivo en muted) + fecha `text-[11px] text-faint mt-0.5`. Tonos por tipo (`:16-25`): user `bg-brand-deep/10 text-brand-deep`; solicitud `bg-info/10 text-info`; tramite `bg-warn/10 text-warn`; documento `bg-ok/10 text-ok`; conocimiento `bg-purple-50 text-purple-600` (púrpura TW-default; **no se adapta a oscuro**, ~#faf5ff / ~#9810fa); config `bg-muted/10 text-muted`; seguridad `bg-bad/10 text-bad`; sistema `bg-ink/10 text-ink`. Vacío: "Todavía no hay actividad registrada" / "Cambios de perfil, solicitudes, decisiones y otras acciones van a aparecer acá con su fecha y hora."
- **Notificaciones** (`Notificaciones.jsx`): "Notificaciones" / "Tenés N notificación(es) sin leer." o "No tenés notificaciones pendientes."; acción (si hay no leídas) `btn-ghost text-[13px]!` "Marcar todas como leídas". Lista como Actividad: icono 36px (solicitud/trámite/sistema/seguridad con tonos `info/warn/ink/bad`), título `text-sm leading-snug` (**no leída: `text-ink font-semibold`; leída: `text-muted`**), cuerpo `text-xs text-muted mt-1`, fecha relativa `text-[11px] text-faint`; botón por fila (solo no leídas) `text-xs font-semibold text-brand` "Marcar leída". **No hay punto/indicador de no-leída**, solo peso/color del título. Vacío: "Sin notificaciones" / "Cuando cambie el estado de tus trámites o solicitudes, te avisamos acá."
- **Permisos y acceso** (`Permisos.jsx`, admin/superadmin): "Permisos y acceso" / "Tenés acceso total al Panel de Administración." (super) o "Lo que tu rol de Administrador puede hacer en el sistema."; tarjeta con cabecera `px-5 py-3 border-b bg-mist/60`: "Rol **{rol}**" (rol en mono) + Pill `bg-ink text-paper` "Acceso total" (solo super); lista de permisos (fila: icono 36px `bg-brand-deep/10 text-brand-deep`, label `text-sm font-semibold`, descripción `text-xs text-muted`, badge `bg-ok/10 text-ok` con check 12px "Permitido"); pie `px-5 py-3 border-t bg-soft/60` con `text-[11px] text-faint`: "No podés modificar tu propio rol ni elevar privilegios desde esta pantalla. Eso es exclusivo del Superadmin desde el Panel de Administración." La lista (`perms`) viene de `permissionsForRole` en `AdminContext` (no leído; etiquetas/descripciones concretas no extraídas).
- **Actividad del sistema / Auditoría** (`Auditoria.jsx`, superadmin): "Actividad del sistema" / "Registro de auditoría de las acciones administrativas en ChatAP."; cabecera de tarjeta `px-5 py-3 border-b bg-mist/60` con Pills `bg-ok/10 text-ok` "{n} acciones reales registradas" y `bg-mist text-muted border border-line` "{n} previas"; lista `max-h-[28rem] overflow-y-auto` (448px, scroll interno) con filas como Actividad pero texto "actor (semibold) acción (muted) objetivo (ink medium)"; pie `bg-soft/60` con nota (`text-[11px] text-faint`, `GET /audit` en mono). Vacío: "Sin actividad registrada" / "Las acciones administrativas (aprobaciones, cambios de permiso, configuraciones) se van a registrar acá."

#### 5.9 Seguridad (`sections/Seguridad.jsx`)
- Contenedor `space-y-6`; "Seguridad" / "Controlá el acceso a tu cuenta."
- Grilla `grid-cols-1 lg:grid-cols-2 gap-5` (20px; 1 columna <1024):
  - **Tarjeta "Cambiar contraseña"** `card card-border p-5`: cabecera `flex items-center gap-3 mb-4` con icono `w-9 h-9 rounded-xl bg-bad/10 text-bad` (llave 16px) + `h3 text-sm font-bold`. Form `space-y-3` (12px) con 3 `PasswordField` (labels "Contraseña actual", "Contraseña nueva", "Confirmar contraseña nueva" — se muestran en MAYÚSCULAS; **sin placeholder**), error inline `text-xs text-bad m-0` (único error inline del bloque: "La contraseña nueva debe tener al menos 6 caracteres." / "La confirmación no coincide con la contraseña nueva." / "No se pudo cambiar la contraseña."), botón `btn-primary w-full text-[13px]!` "Actualizar contraseña" / "Actualizando…" (`disabled:opacity-60`).
  - **Tarjeta "Sesiones y acceso"** `card card-border p-5`: icono `bg-brand-deep/10 text-brand-deep` escudo; 2 mini-tarjetas `grid-cols-2 gap-3` `rounded-xl bg-mist px-3 py-2.5` con dt `text-[10px] uppercase tracking-widest text-faint` "Último acceso" / "Miembro desde" y dd `text-ink font-semibold` fecha-hora; etiqueta `text-[11px] uppercase tracking-widest text-muted font-semibold` "Sesiones activas ({n})"; lista `divide-y divide-line` (fila `py-2.5`: dispositivo `text-sm font-medium truncate` + "Esta sesión · última actividad hace…" `text-[11px] text-faint` + badge `bg-ok/10 text-ok` "Actual" en la sesión vigente; vacío "Sin registros de sesión todavía."); botón `btn-ghost w-full text-[13px]!` "Cerrar sesión en otros dispositivos" (deshabilitado si ≤1 sesión; sin estilo disabled propio); nota `text-[11px] text-faint` sobre el backend de sesiones.
- **Tarjeta "Preferencias"** `card card-border p-5` (icono `bg-info/10 text-info`): etiqueta `text-xs font-semibold text-muted` "Tema"; selector de 3 botones **segmentados separados** `flex gap-2`: "Claro", "Oscuro", "Sistema"; cada uno `px-3.5 py-2 text-xs font-semibold rounded-lg border` (radio 12px); activo `bg-brand-deep text-paper border-brand-deep`, inactivo `bg-paper text-muted border-line hover:text-ink hover:bg-mist`. Nota `text-[11px] text-faint`: "Sigue la configuración del sistema operativo." / "Aplica el tema seleccionado en toda la aplicación."
- **Zona de peligro** `card card-border border-bad/30` (borde rojo `#d82f2f`@30%) → `p-5`, `flex-col sm:flex-row sm:items-center justify-between gap-4`: `h3 text-sm font-bold text-bad` "Zona de peligro"; texto `text-sm text-muted`: "Borrá tu cuenta de forma definitiva." → al confirmar: "Se borrará tu cuenta, tus solicitudes, conversaciones y notificaciones. No se puede deshacer."; botón **"Borrar mi cuenta"** `px-4 py-2.5 rounded-xl bg-bad text-paper text-[13px] font-semibold hover:opacity-90` (radio 16px, no píldora); confirmación: "Cancelar" (`border border-line text-muted rounded-xl`) + "Sí, eliminar" / "Eliminando…" (`bg-bad`).

#### 5.10 Modal "Editar perfil" (`EditProfileModal.jsx`)
- `DetailModal width="max-w-lg"` (512px) (`:39`). Cabecera (`:41-56`): icono usuario 40px `bg-brand-deep/10 text-brand-deep`; "Editar perfil" `text-base font-bold`; sub "Solo podés modificar los campos habilitados." `text-[11px] text-muted`; X de cierre.
- Form `px-5 py-4 overflow-y-auto space-y-4` (`:58`). Label `block text-xs font-medium text-muted mb-1` (12px/500, **no** mayúsculas). Campos con `.input-field` (42px alto, radio 16px, fondo `paper`, foco `brand` + anillo 2px): "Nombre completo *" (requerido), "Teléfono" (placeholder "3704 00-0000"); si es empleado: grilla `grid-cols-1 sm:grid-cols-2 gap-4` con select "Dependencia" (opción "Seleccionar" + Mesa de Entradas/Recursos Humanos/Legajos/Liquidaciones/Sistemas) y input "Puesto"; caja informativa `rounded-xl border border-line bg-mist px-4 py-3` con etiqueta `text-[10px] uppercase tracking-widest text-faint` "Datos validados · no editables" y `dl grid-cols-2 gap-x-4 gap-y-2` con Fields mono: DNI, CUIL, Correo electrónico (`:78-125`).
- Error del servidor: `text-sm text-bad` con icono alerta 16px (`:117-122`).
- Pie (`:124-135`): `flex justify-end gap-2 border-t border-line -mx-5 px-5 py-3 -mb-4 bg-soft/60`: `btn-ghost py-2! px-3.5! text-[13px]!` "Cancelar" + `btn-primary` mismos overrides "Guardar cambios" / "Guardando…" (`disabled:opacity-60`). Toast "Perfil actualizado correctamente."

#### 5.11 Responsive del Perfil
- Pestañas: scroll horizontal siempre (no hay cambio de patrón por breakpoint); no hay sidebar en ningún ancho.
- Cabecera: padding lateral 24px (<640) / 40px; bloque identidad envuelve (botón "Editar perfil" baja bajo el avatar en pantallas angostas); datos 2 col (<768) / 3 col.
- StatCards: 2 col (<1024; Superadmin: 2 col <768, 4 col ≥768); Resumen ciudadano: tarjetas de listas 1 col (<640) / 2 col.
- Seguridad: 1 col <1024 / 2 col; zona de peligro apila botón bajo el texto <640.
- Modales: `p-4` alrededor (16px) y `max-h: calc(100vh - 2rem)`; cuerpo con scroll.

### Inferences
- Para móvil, el patrón natural = misma estructura: cabecera-tarjeta, pestañas-píldora scrolleables horizontales, listas separadas por línea de 1px y tarjetas de 20px.
- El overlay de modal no tiene scrim (sin `bg-black/..`): el panel flota directamente sobre la página; en móvil conviene decidir si se añade scrim (no hay evidencia en código).
- La paleta de tonos semánticos (brand/info/ok/warn/bad/muted) se aplica siempre como "fondo 10% + texto sólido" sobre el color.

### Gaps
- Datos reales del listado de permisos (`permissionsForRole` en `src/context/AdminContext.jsx`) no extraídos (texto dinámico).
- Los contenidos de `useProfileData.js` (cómo se calculan los números) no son visuales; omitido.
- La gradación `purple` (conocimiento) usa el color TW-default: sin variante oscura.

---

## 6. Claro vs. oscuro (resumen de diferencias específicas)

### Takeaway
Casi todo se resuelve intercambiando los tokens (`§0`); hay **overrides explícitos `dark:`** solo en Login/Contacto y colores por defecto de Tailwind en algunos chips.

### Cited Findings
- Login: columna derecha fondo `#09090b` (`:264`); botón primario y píldora activa del toggle pasan a **fondo blanco / texto negro** (`:292,306,366,412,612`); botón Google `dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-white` (`:640`); título `dark:text-white` (`:329`); columna izquierda `dark:bg-slate-900/40` (`:215`); toggle `dark:bg-neutral-900 dark:border-neutral-800` (`:283`); caja de recuperación `dark:bg-slate-900/60` (`:372`); aviso `dark:text-amber-400`, icono `dark:text-emerald-400` (`:373,403`).
- Contacto: tarjeta WhatsApp `dark:bg-emerald-950/20`, chip/enlace `dark:text-emerald-400`, `dark:bg-emerald-900/40` (`:125,133,139`).
- Resto de pantallas (Reset, 404, Perfil): solo cambian los tokens ink/paper/mist/soft/line/muted/faint/brand*, p. ej. botón `.btn-primary` = `#2F55C0` con texto `#070E20`; pestaña activa del perfil = `#EAF0FA` con texto `#070E20`; degradado del "404" según tema (§4).
- 404 y Navbar usan `useTheme()` que lee la clase `dark` de `<html>` (`src/hooks/useTheme.js`); el default del servidor/SSR es "dark" (`:19`).

### Gaps
- El panel del modal de Google y otras cajas con `bg-card` quedan transparentes en ambos temas (trampa 1).
