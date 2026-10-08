# Replicar ChatAP en mobile: especificación visual exacta

**Resumen.** La UI web de ChatAP (rama `dev-felipe`, HEAD `b9b83c4`) se puede portar a mobile con valores concretos, pero solo si se toma `src/index.css` como única fuente de verdad: `DESIGN.md`, `docs/chatap-visual-direction.md` y `docs/reference-reimplementation-plan.md` contradicen el CSS en colores, radios, botones, sombras y sidebar (sección 1). El producto es una familia tipográfica (PP Neue Montreal, 10 archivos `.woff2`), una paleta navy/azul con **tema oscuro por defecto** (paper `#070E20`, acento `#4D7DFF`; claro: paper `#F0F4F9`, acento `#2F6BFF`), botones y navbar en forma de píldora (9999 px), tarjetas de 20 px con borde de 1 px y **sin sombras** en los componentes base. Dos hechos condicionan el port: PP Neue Montreal **no tiene archivo de peso 800** (los títulos "extrabold" se ven en Black 900) y es una fuente comercial cuya licencia el repo no verifica. Además hay **al menos 25 defectos del código** (variables CSS sin definir como `--color-card` y `--color-brand-rgb`, clases `.kicker`/`.display-3` inexistentes, modales sin velo, componentes sin montar, panel admin sin layout móvil) que obligan al desarrollador mobile a decidir caso por caso entre "copiar lo que se renderiza" y "copiar la intención" (sección 8). Este documento entrega las tablas de tokens, tipografía y componentes, y la composición física de cada pantalla a ancho de teléfono.

**Convenciones.** `[V]` = verificado en código, con cita `archivo:línea` (`CSS` = `src/index.css`; `CW` = `ChatWindow.jsx`; `MB` = `MessageBubble.jsx`; `HP` = `HomePage.jsx`; `NAV` = `Navbar.jsx`; `FOO` = `Footer.jsx`; `LRP` = `LoginRegisterPage.jsx`). `[E]` = estimado o derivado (aritmética sobre clases, o default de Tailwind v4.3 que no está en el repo; `node_modules` no está instalado en el checkout, así que esos defaults no se contrastaron con el paquete). 1 rem = 16 px = 16 pt/dp: el `font-size` raíz no se define en ningún archivo `[V CSS:187-193]`. Los números de línea de `index.css` varían ±2 entre notas de investigación; se usan los de la nota de tokens (lectura completa de las 3254 líneas). Los textos literales van entre comillas. No hay URLs: la fuente es un checkout local.

---

## 1. El CSS manda: qué contradicen los documentos y el tema por defecto

Cuando un documento y el CSS discrepan, **gana el CSS** porque es lo que se renderiza. Los documentos solo sirven como declaración de intención.

| Tema | Valor real (CSS) | Lo que dice el documento | Usar |
|---|---|---|---|
| Fuente | PP Neue Montreal + Text cargadas por `@font-face` `[V CSS:3-73]` | DM:86 "No webfont is loaded"; DM:209 "Don't add webfonts" | CSS |
| Paper claro / oscuro | `#F0F4F9` / `#070E20` `[V CSS:85,161]` | DM:49 `#EDF1F9` / `#0A1124` | CSS |
| Mist, soft | `#E2EAF4`/`#0D1730`; `#D5E2F1`/`#132247` | DM `#E3E9F6`/`#111B34`; `#D8E1F2`/`#0C1530` | CSS |
| Muted / faint | `#4A5578`/`#8A9BC0`; `#7E8BA7`/`#4E5F85` | DM `#4A5676`/`#A2AEC7`; `#8490AE`/`#6A7590` | CSS |
| Brand-dark, brand-deep, primary-light(er) | ver sección 3 | DM valores distintos (`#2657D8`, `#2A55D6`, `#E1E9FF`, `#F2F6FF`…) | CSS |
| ok / warn / bad | `#18bc42` / `#efc21e` / `#d82f2f`, iguales en ambos temas `[V CSS:107-109,170-172]` | DM `#1FA45C`/`#2FBF71`, `#E29C2C`/`#EEB253`, `#E24A4F`/`#F26067` | CSS |
| Sidebar admin | `#141414`, hover `#222222`, texto `#9e9e9e`, ancho 280 / 72 px; **no cambia con el tema** `[V CSS:122-132]` | DM navy `#070E20`, 272 / 64 px; VD "240-280px" | CSS |
| Radio de controles | `--radius-control: 9999px` (píldora) `[V CSS:134]` | DM 10 px; VD "6-10px"; RP 0 | CSS |
| Radio de tarjeta | `--radius-card: 1.25rem` = 20 px `[V CSS:135]` | DM 14 px | CSS |
| Escala de radios | sm 6 / md 8 / lg 12 / xl 16 / 2xl 20 / 3xl 28 `[V CSS:138-143]` | DM sm 4 … 3xl 20 | CSS |
| Sombras de cards | `--shadow-soft: none; --shadow-hover: none` `[V CSS:151-152]` | DM `shadow-sm/md/lg` | CSS: cards planas |
| Botones | píldora, 12 px, 700, MAYÚSCULAS, tracking 0.1em `[V CSS:1112-1133]` | DM `rounded-xl`, semibold, "no uppercase"; hover `-translate-y-0.5` | CSS |
| Hover de `.btn-primary` | fondo `#EBEBEB`, texto `#1A1A1A` `[V CSS:1120,1126]` | DM `hover:bg-brand-dark` | CSS |
| Marca | `#2F6BFF`/`#4D7DFF`; RP:28 dice `--color-brand: #ff4000` | RP obsoleto (naranja retirado, DM:30) | CSS |
| Tema por defecto | **oscuro** `[V index.html:25-40]` | RP:30,88,101 "tema claro por defecto" | CSS |
| "Sin pills / sin glass" | hay píldoras (nav, chips, botones) y `backdrop-filter` `[V CSS:2371,2386,3182]` | VD:139,465-466; PM:125 | CSS |

**Tema por defecto = oscuro.** `index.html:25-41` ejecuta una migración única (`chatap_dark_default_v1`) que escribe `theme=dark` y agrega la clase `dark` a `<html>` salvo que `localStorage.theme === "light"` `[V]`. Un usuario nuevo ve el oscuro; el claro es el secundario. El mobile debe arrancar en oscuro y respetar la elección guardada. Pre-pintado anti-flash: `#070E20` (texto `#EAF0FA`) / `#F0F4F9` (texto `#0F1730`) `[V index.html:11-24]`. Color de barra de estado (`theme-color`): `#070E20` oscuro, `#F0F4F9` claro `[V index.html:42-43]`.

**Dos lenguajes visuales conviven** `[E]`: (a) "friendly & rounded" (cards 20 px, inputs 16 px, píldoras), que domina chat, login, perfil y admin moderno; (b) "editorial mono cuadrado" (labels mono en MAYÚSCULAS, chips y paneles con radio 0 en la landing). Para el chat y las pantallas de cuenta seguir (a) más las etiquetas mono de (b). En el admin coexisten además un dialecto legado cuadrado (Usuarios, Conocimiento, SIGED) y uno slate/blanco (Reportes).

---

## 2. Tipografía: una familia, tres pilas y una trampa de pesos

### 2.1 Familias y archivos `[V CSS:3-81]`

| Token | Valor exacto | Línea |
|---|---|---|
| `--font-sans` (cuerpo y UI) | `"PP Neue Montreal", "PP Neue Montreal Text", ui-sans-serif, system-ui, -apple-system, sans-serif` | CSS:78 |
| `--font-neue` (display/títulos) | `"PP Neue Montreal", sans-serif` | CSS:79 |
| `--font-neue-text` (lectura, nav, footer) | `"PP Neue Montreal Text", sans-serif` | CSS:80 |
| `--font-mono` (micro-etiquetas) | `ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, "Liberation Mono", monospace` | CSS:81 |
| Alternates estilísticos | `font-feature-settings: "cv03","cv04","cv09","cv11"`, `text-rendering: optimizeLegibility`, `antialiased` | CSS:196-199 |

Archivos en `public/fonts/` (10 `.woff2`, todos `font-display: swap`): Thin 250, Book 350, Regular 400, Medium 500, Semibold 600, Bold 700, Black 900, Italic 400 (familia Neue); Text-Regular 400 y Text-Medium 500 (familia Text) `[V CSS:4-73]`. Precarga: Regular, Bold, Medium, Black `[V index.html:7-10]`.

**Para mobile cargar solo:** Regular 400, Medium 500, Semibold 600, Bold 700, Black 900, más Text-Regular y Text-Medium. Thin, Book e Italic no los pide ningún selector del CSS `[V]`; su uso en JSX por utilidades (`font-light`, `italic`) no se verificó `[E]`.

### 2.2 Dos advertencias que bloquean el port

| Tema | Hecho | Decisión del desarrollador mobile |
|---|---|---|
| **Peso 800 inexistente** | No hay `@font-face` de peso 800. Se pide 800 en `.display-1`, `.hero-headline`, `.reference-title`, `.nav-brand-mark`, `.services-*`, `.trust-stat__val`, `.tour-kicker`, `.finalcta-btn-primary` (CSS:1376,1876,1999,2233,2549,2594,2794,1585,2128) y como `font-extrabold` en los títulos de landing, chat, contacto, 404 y perfil `[V]`. Por la regla de coincidencia de pesos de CSS (deseado > 500 → primer peso mayor disponible) **800 se renderiza con Black 900** `[E, regla CSS]`. | Mapear todo "800" a `PPNeueMontreal-Black`. En Android/RN declarar la familia Black explícitamente para el peso 800 o el sistema sintetizará otro corte. |
| **Licencia** | PP Neue Montreal es una fuente comercial; el repo incluye los `.woff2` pero **no se verificó la licencia** (nota de landing, Gaps). El `.woff2` es formato web: para una app hay que convertir a TTF/OTF. | Verificar la licencia de uso en apps móviles antes de empaquetar. Si no cubre app: fallback del propio CSS (`ui-sans-serif, system-ui` → SF Pro en iOS, Roboto en Android) con los mismos pesos, aceptando métricas distintas `[E]`. |
| Mono en Android | `ui-monospace` resuelve a SF Mono en iOS; en Android no existe y cae a `monospace` `[E]` | Fijar una mono explícita (p. ej. Roboto Mono) `[propuesta]`. |

### 2.3 Escala tipográfica para mobile (360-430 px de ancho)

No hay escala `h1-h6` global: los encabezados heredan 16 px / peso normal del preflight de Tailwind `[V CSS, E preflight]`. La jerarquía se arma con utilidades Tailwind y clases `.display-*`. Los `clamp()` caen en su **mínimo** a 360-430 px. Line-height de utilidades Tailwind: `text-xs` 12/16, `sm` 14/20, `base` 16/24, `lg` 18/28, `xl` 20/28, `2xl` 24/32, `3xl` 30/36, `4xl` 36/40 `[E]`. El tracking en `em` se multiplica por el tamaño (12 px × 0.1em = 1.2 px).

**A. Títulos y párrafos**

| Nivel | Pantalla / uso | Familia | Tamaño (360-430) | Peso | Line-height | Letter-spacing | Transform | Fuente |
|---|---|---|---|---|---|---|---|---|
| H1 hero | Landing | Neue | **36 px** (60 px ≥640) | 800 → Black | 1.08 | -0.025em | — | HP.jsx:175-187 `[V]` |
| H2 sección | Landing (en acción, capacidades, FAQ) | Neue | **30 px** / lh 36 (36 px ≥640) | 800 → Black | 36 px | -0.025em | — | HP.jsx:241-251 `[V]` |
| H2 cierre | Landing | Neue | **30 px** (48 px ≥640) | 800 → Black | 36 px | -0.025em | — | HP.jsx:362 `[V]` |
| H1 bienvenida | Chat | Neue | **24 px** / lh 32 (30 px ≥640) | 800 → Black | 32 px | -0.025em | — | CW:719 `[V]` |
| Saludo "Hola," | Chat | Text | **16 px** / lh 24 (18 px ≥640) | 500 | 24 px | — | — | CW:714 `[V]` |
| Subtítulo bienvenida | Chat | Text | **12 px** (14 px ≥640) | 400 | 1.625 | — | — | CW:725 `[V]` |
| H1 formulario | Login | Sans | **24 px** (30 px ≥640) | 700 | 32 px | -0.025em | — | LRP:328-343 `[V]` |
| Subtítulo formulario | Login | Sans | **12 px** (14 px ≥640) | 400 | 1.5 | — | — | LRP:328-343 `[V]` |
| H1 | Reset contraseña | Sans | **24 px** | 700 | 32 px | — | — | ResetPasswordPage:52 `[V]` |
| H1 | Contacto | Sans | **30 px** (36 px ≥640) | 800 → Black | 36 px | -0.025em | — | ContactoPage:100 `[V]` |
| H1 | 404 | Neue | **24 px** (30 ≥640, 36 ≥768) | 800 → Black | 32 px | -0.025em | — | NotFoundPage:57 `[V]` |
| Título de tarjeta capacidad | Landing (H3) | Sans | **20 px** / lh 28 | 700 | 28 px | -0.025em | — | HP.jsx `[V]` |
| Título sección admin editorial (`.display-2`) | Dashboard admin, perfil | Neue | **29.6 px** | 600 | 1.2 | -0.02em | — | CSS:1381-1390 `[V]` |
| `.lead` | Dashboard admin | Neue | **17.6 px** | 400 | 1.45 | -0.02em | — | CSS:1402-1408 `[V]` |
| Nombre de usuario | Perfil | Sans | **24 px** | 800 → Black | 1.25 (leading-tight) | -0.025em | — | ProfileHeader `[V]` |
| Título admin (barra superior) | Admin | Sans | **15 px** bold | 700 | 1.25 | -0.025em (tight) | — | AdminLayout:131 `[V]` |
| Párrafo cuerpo (default) | General | Sans | **16 px** | 400 | 1.5 | — | — | Preflight `[E]` |
| Subtítulo hero | Landing | Sans | **16 px** (18 ≥640) | 400 | 1.625 | — | — | HP.jsx:190 `[V]` |
| Mensaje de chat | Chat | Sans | **14.4 px** (0.9rem) | 400 | 1.5 (21.6 px) | — | — | CSS:907-915 `[V]` |
| Pregunta FAQ | Landing | Sans | **16 px** (18 ≥640) | 700 | — | — | — | HP.css:423 `[V]` |
| Respuesta FAQ | Landing | Sans | **15.2 px** | 400 | 1.6 | — | — | HP.css:453 `[V]` |
| Texto de descripción tarjeta | Landing | Sans | **14 px** | 400 | 1.625 | — | — | HP.jsx `[V]` |

**B. Etiquetas, botones y microtexto**

| Nivel | Uso | Familia | Tamaño | Peso | Letter-spacing | Transform | Fuente |
|---|---|---|---|---|---|---|---|
| Botón `.btn-primary`/`.btn-ghost` | Todos los CTA | Sans | **12 px** | 700 | 0.1em (1.2 px) | UPPERCASE | CSS:1117-1128 `[V]` |
| Botón CTA landing | "Abrir el asistente completo →" | Sans | **14 px** (16 ≥640) | 700 | 0.1em | UPPERCASE | HP.jsx:258 `[V]` |
| Botón login principal | "Sign in" | Sans | **14 px** | 600 | — | no | LRP:609 `[V]` |
| `.btn`, `.btn-danger` | Botones secundarios | Sans | **12 px** | 700 | 0.05em | UPPERCASE | CSS:1112-1133 `[V]` |
| `.badge` | Estados | Sans | **10 px** | 700 | 0.1em | UPPERCASE | CSS:1134-1136 `[V]` |
| Meta de mensaje | Chat | Mono | **9.01 px** (0.563rem) | 600 | 0.18em | UPPERCASE | CSS:896-906 `[V]` |
| Chip `.bubble-chip` | Chat | Sans | **11.52 px** | 600 | — | no | CSS:471-484 `[V]` |
| Píldora de bienvenida | Chat | Sans | **13 px** | 600 | — | no | CSS:692-708 `[V]` |
| Input del chat | Chat | Sans | **14 px** | 500 | — | no | CSS:759-770 `[V]` |
| Placeholder chat | Chat | Sans | 14 px color faint | 500 | — | no | CSS:759-770 `[V]` |
| Kicker de sección (`text-xs font-mono font-bold`) | Landing | Mono | **12 px** | 700 | 0.05em | UPPERCASE | HP.jsx:241 `[V]` |
| `.section-kicker` | Landing | Neue | **11.52 px** | 600 | 0.2em | UPPERCASE | CSS:1393-1400 `[V]` |
| `.mono-label` | Etiquetas | Mono | **10 px** | 600 | 0.22em | UPPERCASE | CSS:845-852 `[V]` |
| Label de formulario login | Login | Sans | **12 px** | 500 | — | no | LRP:454 `[V]` |
| Label de formulario contacto/reset | Contacto, PasswordField | Sans | **12 px** | 700 / 600 | 0.05em / 0.025em | UPPERCASE | ContactoPage; PasswordField:13 `[V]` |
| Label InfoItem | Perfil | Sans | **10 px** | 700 | 0.22em | UPPERCASE | ProfileHeader `[V]` |
| Valor InfoItem | Perfil | Sans (mono 13 px para DNI/CUIL/correo/teléfono) | **15 px** | 500 | — | no | ProfileHeader `[V]` |
| Nav links del drawer | Navbar móvil | Sans | **12 px** | 500 (activo 600) | 0.025em | no | NAV:192-214 `[V]` |
| Marca "ChatAP" | Navbar | Neue | **14 px** | 700 | -0.01em | no | CSS:2238-2245 `[V]` |
| Marca "AP" (cuadro) | Navbar | Neue | **10.4 px** | 800 → Black | -0.02em | no | CSS:2223-2236 `[V]` |
| Etiqueta sección sidebar | Admin | Sans | **10 px** | 600 | 0.1em (widest) | UPPERCASE | AdminSidebar:164 `[V]` |
| Ítem sidebar | Admin | Sans | **14 px** | 500 (activo 600) | — | no | AdminSidebar:230 `[V]` |
| Kicker barra superior admin | Admin | Sans | **10 px** | 700 | 0.24em | UPPERCASE | AdminLayout:130 `[V]` |
| Cabecera de tabla | Admin | Sans | **10 px** | 600 | 0.1em | UPPERCASE | EmployeeApprovals:374 `[V]` |
| Valor de StatCard | Admin/Perfil | Sans | **30 px** | 700 | 1 | — | admin/ui.jsx:48 `[V]` |
| Valor metric strip | Dashboard admin | Sans | **36 px** (48 ≥768) | 800 → Black | — | -0.05em | Dashboard:47 `[V]` |
| Pestaña de perfil | Perfil | Sans | **13 px** | 600 | — | no | ProfileLayout:83 `[V]` |

**Jerarquía resumida:** display 36 → título de sección 30 → título de bloque 24-20 → cuerpo 16 / mensajes 14.4 → controles 12-14 (MAYÚSCULAS con tracking en botones) → microlabels 9-10 px mono con tracking 0.16-0.24em. **Títulos con `.kicker` y `.display-3`:** ver defecto D3 en la sección 8.

---

## 3. Tokens → mobile (claro y oscuro)

### 3.1 Color

| Token | Claro (hex · RGB) | Oscuro (hex · RGB) | Uso | Fuente |
|---|---|---|---|---|
| `ink` | `#0F1730` · 15,23,48 | `#EAF0FA` · 234,240,250 | Texto principal | CSS:84/160 `[V]` |
| `paper` | `#F0F4F9` · 240,244,249 | `#070E20` · 7,14,32 | Fondo de app, burbuja bot, chips | CSS:85/161 `[V]` |
| `mist` | `#E2EAF4` · 226,234,244 | `#0D1730` · 13,23,48 | Superficie sutil, hover | CSS:86/162 `[V]` |
| `soft` | `#D5E2F1` · 213,226,241 | `#132247` · 19,34,71 | Superficie terciaria, pie de modal | CSS:87/163 `[V]` |
| `line` (alpha) | `#0F1730` @12% | `#EAF0FA` @12% | Bordes de 1 px | CSS:88/164 `[V]` |
| `line` sólido sobre paper | `#D5D9E1` | `#22293A` | Equivalente sin alpha | `[E calc]` |
| `line` sólido sobre mist | `#C9D1DC` | `#283148` | Idem | `[E calc]` |
| Borde de card (`line/70`) sobre paper | `#DDE1E8` | `#1A2132` | Borde real de `.card` | `[E calc]` |
| `muted` | `#4A5578` · 74,85,120 | `#8A9BC0` · 138,155,192 | Texto secundario | CSS:89/165 `[V]` |
| `faint` | `#7E8BA7` · 126,139,167 | `#4E5F85` · 78,95,133 | Placeholder, meta | CSS:90/166 `[V]` |
| `brand` (= info) | `#2F6BFF` · 47,107,255 | `#4D7DFF` · 77,125,255 | Acento, burbuja usuario, enviar | CSS:104/167 `[V]` |
| `brand-dark` | `#2558E0` · 37,88,224 | `#3A6AE0` · 58,106,224 | Hover de CTA | CSS:105/168 `[V]` |
| `brand-deep` | `#1C44B6` · 28,68,182 | `#2F55C0` · 47,85,192 | Botón primario, chips (texto) | CSS:106/169 `[V]` |
| `primary-light` | `#EBF2FF` | `#0D1B40` | Tile de icono | CSS:117/176 `[V]` |
| `primary-lighter` | `#F5F8FF` | `#091230` | Hover de chip/card | CSS:118/177 `[V]` |
| `ok` | `#18BC42` · 24,188,66 | igual | Éxito | CSS:107/170 `[V]` |
| `warn` | `#EFC21E` · 239,194,30 | igual | Aviso | CSS:108/171 `[V]` |
| `bad` | `#D82F2F` · 216,47,47 | igual | Error, mic escuchando | CSS:109/172 `[V]` |
| `band` / `band-fg` | `#0D1730` / `#EAF0FA` | `#040A18` / `#EAF0FA` | Bandas oscuras | CSS:147-148/180-181 `[V]` |
| `bot-body` / `bot-eye` | `#0F1730` / `#F0F4F9` | `#EAF0FA` / `#0F1730` | Avatar | CSS:111-112/174-175 `[V]` |
| Texto sobre brand | `#FFFFFF` | `#FFFFFF` | Burbuja usuario, enviar | CSS:922-923 `[V]` |
| Selección de texto | fondo `#2F6BFF`, texto `#FFFFFF` | ídem | — | CSS:204-207 `[V]` |
| Foco global | `1px solid brand`, offset 2 px | brand oscuro | Accesibilidad | CSS:209-212 `[V]` |
| Barra de estado | `#F0F4F9` | `#070E20` | `theme-color` | index.html:42-43 `[V]` |

**Superficies que no cambian con el tema** `[V]`: navbar pill `rgba(10,17,36,0.94)` (con scroll >24 px: `rgba(7,14,32,0.96)`), borde `rgba(255,255,255,0.12)` (scroll 0.18) CSS:2193-2209; dropdown y drawer `rgba(10,17,36,0.96)`, borde `rgba(255,255,255,0.14)` CSS:2370-2388; sidebar admin `#141414`, borde `rgba(255,255,255,0.12)`, hover `#222222`, texto `#9e9e9e`, texto de sección `#5e5e5e`, activo = `brand` con texto `#FFFFFF` CSS:122-130; hover de botón primario y ghost `#EBEBEB` / `#1A1A1A` CSS:1120,1126. **Excepciones por tema** `[V]`: barra de entrada del chat en oscuro `#141518` con borde `rgba(255,255,255,0.12)` CSS:748-751; píldoras de bienvenida en oscuro: fondo `rgba(255,255,255,0.05)`, borde `rgba(255,255,255,0.1)`, texto `#F1F5F9` CSS:710-714; columna derecha de login en oscuro `#09090B` y texto slate-100 (~`#F1F5F9`) LRP:264.

**Colores Tailwind por defecto (no están en el repo) `[E]`.** La app los usa en iconos de píldoras del chat (sky-400, amber-400, emerald-400, pink-400, yellow-400, purple-400), puntos de estado (emerald-500), toasts (gradientes emerald/red/amber 500→600), Contacto (WhatsApp verde) y Reportes (blue/slate/cyan/purple/amber). Tailwind v4 los define en oklch; hex aproximados citados en las notas: emerald-500 ≈ `#00BC7D` (v4) o `#10B981` (v3), emerald-400 ≈ `#00D492`. **Las notas discrepan** (una usa hex de v3, otra de v4); el repo declara Tailwind 4.3 `[V package.json]`, así que corresponde la paleta v4, pero sus hex no se contrastaron. Para el port, fijar un hex por color y documentarlo.

### 3.2 Radios

| Token / uso | Valor | Fuente |
|---|---|---|
| sm / md / lg / xl / 2xl / 3xl | 6 / 8 / 12 / 16 / 20 / 28 px | CSS:138-143 `[V]` |
| `control` (botones, chips, nav, composer legado) | 9999 | CSS:134 `[V]` |
| `card` | 20 px | CSS:135 `[V]` |
| Botones `.btn*`, `.badge` | 9999 | CSS:1114-1135 `[V]` |
| `.input-field`, inputs de login/contacto, tiles de icono, botones de header chat | 16 px | CSS:1108 `[V]` |
| `.card`, burbuja chat, quick-reply, tarjetas de capacidad, tarjetas de canal contacto | 20 px | CSS:1090,910 `[V]` |
| Maqueta de chat (landing), tarjeta de formulario contacto, modal de equipo | 28 px | ICM:141; ContactoPage:197; FOO:245 `[V]` |
| FAQ landing (`.faq-item`) | 16 px | HP.css:399 `[V]` |
| Barra de entrada del chat | 20 px | CSS:740 `[V]` |
| Navbar pill / drawer / dropdown | 9999 / 20 / 16 px | CSS:2192,2384,2365 `[V]` |
| "AP" cuadro de marca | 8.8 px (26.4×26.4) | CSS:2223-2228 `[V]` |
| Skeleton | 8 px | CSS:1144 `[V]` |
| Tour (tooltip de onboarding) | 6 px (botones 4 px) | CSS:1534-1620 `[V]` |
| Cuadrado, sin radio | chips `.chip-suggest`, `.tech-badge`, `.reference-button`, paneles `trust-*` de la landing; botones y tablas legados de Usuarios/Conocimiento/SIGED | CSS:1884,1713,1685 `[V]` |

### 3.3 Bordes, sombras, gradientes, blur, opacidades

| Categoría | Valor exacto | Fuente |
|---|---|---|
| Borde estándar | `1px solid line`; card `1px line/70` | CSS:872,1090 `[V]` |
| Borde de foco de input | `brand` + anillo `ring-2 brand/12` (`.input-field`); login: anillo 1 px `brand/20` | CSS:1110; LRP:463 `[V]` |
| Borde 2 px | solo foco/estado crítico (`tour-ring` 2 px brand; dropzone 2 px dashed) | CSS:1533 `[V]` |
| Sombras de cards | **ninguna** (`none`) | CSS:151-152,1088-1103 `[V]` |
| Barra de entrada chat | claro `0 10px 30px -5px rgba(0,0,0,0.1)`; oscuro `0 12px 35px -5px rgba(0,0,0,0.55)` | CSS:743,751 `[V]` |
| Foco de la barra de entrada | `0 12px 32px -5px rgba(14,165,233,0.2)` (celeste por variable ausente; ver D2) | CSS:756 `[V]` |
| Píldora de bienvenida | `0 2px 5px rgba(0,0,0,0.03)`; hover `0 6px 16px -2px rgba(0,0,0,0.08)`; oscuro hover `0 8px 24px -4px rgba(0,0,0,0.45)` | CSS:704,720,726 `[V]` |
| Navbar pill | `0 10px 30px -4px rgba(0,0,0,0.28), inset 0 1px 0 0 rgba(255,255,255,0.10)`; con scroll `0 14px 38px -4px rgba(0,0,0,0.44), inset 0 1px 0 0 rgba(255,255,255,0.14)` | CSS:2195,2210 `[V]` |
| Dropdown / drawer | `0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)` | CSS:2374,2389 `[V]` |
| Marca "AP" | `0 2px 8px rgba(47,107,255,0.35)` | CSS:2235 `[V]` |
| CTA "Ingresar" | `0 2px 8px rgba(47,107,255,0.32)`; hover `0 4px 14px rgba(47,107,255,0.45)` | CSS:2324,2330 `[V]` |
| CTA landing | Tailwind `shadow-lg` teñida `brand` al 20% (`0 10px 15px -3px`, `0 4px 6px -4px`); cierre `shadow-xl` `brand` 25% | HP.jsx:258,370 `[V]`, valores base `[E TW]` |
| Maqueta de chat (landing) | Tailwind `shadow-xl` (`0 20px 25px -5px rgb(0 0 0/.1)`, `0 8px 10px -6px rgb(0 0 0/.1)`) | ICM:141 `[V]`/`[E]` |
| Tarjeta de ubicación (chat) | `shadow-sm` (`0 1px 3px 0 rgb(0 0 0/.1)`, `0 1px 2px -1px rgb(0 0 0/.1)`) | MB:22 `[V]`/`[E]` |
| Modales | Tailwind `shadow-2xl` (`0 25px 50px -12px rgba(0,0,0,.25)`) | ProfileLayout `DetailModal` `[V]`/`[E]` |
| Gradiente marca "AP" y avatar de perfil en navbar | `linear-gradient(135deg, #2F6BFF 0%, #1C44B6 100%)` | CSS:2229,2356 `[V]` |
| Gradiente tarjeta maqueta | `bg-gradient-to-b from-mist/90 via-paper to-mist/60` (vertical) | ICM:141 `[V]` |
| Gradiente foto login | `bg-gradient-to-t from-black/70 via-black/20 to-transparent` | LRP:251 `[V]` |
| Hero: tinte | claro `rgba(240,244,249,.68)→.84`; oscuro `rgba(7,14,32,.62)→.82`; **≤768 px** claro `.80→.92`, oscuro `.75→.90` (vertical 180°) | HCB.css:74-84,157-166 `[V]` |
| Hero: foco, viñeta, fade, brillo | foco `radial-gradient(ellipse 75% 65% at 50% 40%, paper .88 → .45 55% → transparent)`; viñeta `transparent 55% → rgba(15,23,48,.18)` (oscuro `rgba(0,0,0,.35)`); fade inferior 38% de alto `transparent → paper .7 65% → paper`; brillo `rgba(47,107,255,.14)` (oscuro `rgba(77,125,255,.18)`), 180 px de alto y opacidad .7 en móvil | HCB.css:87-141,168-171 `[V]` |
| Skeleton (intención) | `linear-gradient(90deg, mist 25%, soft 37%, mist 63%)`, 800 px, 1.4 s lineal | CSS:1143-1148 `[V]` |
| Blur | dropdown/drawer `blur(20px)`; `hud-glass-badge` `blur(16px)`; sellos del hero `blur(4px)`; tarjetas capacidad `blur(10px)`; FAQ `blur(8px)`; top bar admin `backdrop-blur-md` (12 px `[E TW]`) | CSS:2370,3181; HP.css `[V]` |
| Opacidades de superficie | `.card`: paper al 86%; barra de entrada chat: paper al 96%; píldora de bienvenida: paper 92%; top bar admin: paper 85% | CSS:1089,741,698; AdminLayout:126 `[V]` |
| Capas translúcidas (tarjetas landing) | claro `rgba(255,255,255,.6)`; oscuro `rgba(13,23,48,.4)` con borde `rgba(255,255,255,.08)` | HP.css:373-396 `[V]` |

### 3.4 Movimiento (para animar igual)

| Concepto | Valor | Fuente |
|---|---|---|
| Easing principal | `cubic-bezier(0.22, 1, 0.36, 1)`; secundarios `(0.16,1,0.3,1)`, `(0.4,0,1,1)` | CSS varias `[V]` |
| Aparición de mensaje / listas | fade-up: opacidad 0→1, `translateY` 10→0 px, 0.22 s | CSS:215-218,323 `[V]` |
| Transición de tema | 0.2 s ease (fondos, bordes, color) | CSS:192,288-301 `[V]` |
| Transición de pantalla | entrar 0.28 s (`translateY` 8→0 + fade); salir 0.18 s (0→-4 px) | CSS:333-340 `[V]` |
| Modal | entrada `scale .96→1` 0.22 s; velo fade 0.18 s | CSS:1178-1181 `[V]` |
| Bienvenida → chat | `opacity-0 scale-95` en 300 ms; cambio de fase a los 480 ms | CW:703-705,277 `[V]` |
| Máquina de escribir | ≤240 caracteres: 1 car./24 ms; >240: 2 car./16 ms; cursor 2×1.05em `brand-deep`, pulso 2 s (opacidad 1↔0.45) | CW:419-475; MB:98 `[V]` |
| Espera del bot | 900-1700 ms sin indicador visible | CW:294 `[V]` |
| Sin movimiento | `prefers-reduced-motion`: animaciones 0.01 ms | CSS:1951-1957 `[V]` |

---

## 4. Especificación de componentes

Altura de botones e inputs = línea + padding vertical + 2 px de borde `[E derivado]`.

### 4.1 Botones y controles

| Componente | Radio | Padding (H × V) | Borde | Fondo claro / oscuro | Texto claro / oscuro | Sombra | Alto | Fuente |
|---|---|---|---|---|---|---|---|---|
| `.btn-primary` | 9999 | 24 × 12 | 1 px `brand-deep` | `#1C44B6` / `#2F55C0` | `#F0F4F9` / **`#070E20`** | ninguna | 42 | CSS:1117-1122 `[V]` |
| `.btn-primary` hover | — | — | `#EBEBEB` | `#EBEBEB` (ambos temas) | `#1A1A1A` | — | — | CSS:1120 `[V]` |
| `.btn-ghost` | 9999 | 24 × 12 | 1 px `line` | transparente | `ink` | ninguna | 42 | CSS:1123-1128 `[V]` |
| `.btn` | 9999 | 20 × 10 | 1 px `line` | `mist` (hover `soft`) | `ink` | ninguna | 36 | CSS:1112-1116 `[V]` |
| `.btn-danger` | 9999 | 20 × 10 | — | `#D82F2F` (hover opacidad .9) | `paper` | ninguna | 36 | CSS:1129-1133 `[V]` |
| CTA landing | 9999 | 32 × 14 | 1 px brand-deep | brand-deep | paper | `shadow-lg` brand 20% | ~48 | HP.jsx:258 `[V]` |
| CTA cierre landing | 9999 | 36 × 16 | ídem | brand-deep | paper | `shadow-xl` brand 25%; hover sube 2 px | ~56 | HP.jsx:370 `[V]` |
| Botón principal login | 9999 | ancho completo × 14 | — | `#1C44B6` / **blanco** | blanco / **negro** | `shadow-md` `[E]` | 48 | LRP:609 `[V]` |
| Botón Google | 9999 | 16 × 12 | 1 px `line` | transparente (D1) / `#171717` aprox. | `ink` / blanco | `shadow-sm` `[E]` | 46 | LRP:636-662 `[V]` |
| Botón enviar (reset, contacto, "Borrar mi cuenta") | **16** | ancho completo × 12-14 | — | brand-deep / `#D82F2F` | paper | ninguna | 44-48 | ResetPasswordPage:154; ContactoPage:293 `[V]` |
| Chip `.bubble-chip` | 9999 | 12.8 × 6.4 | 1 px `line` al 85% | `paper` | `brand-deep` | ninguna | ~28 | CSS:471-492 `[V]` |
| Botón wizard `.bubble-wizard` | 9999 | 14.4 × 8 | — | `brand-deep` (hover `brand`) | `#FFFFFF` | ninguna | ~28 | CSS:494-515 `[V]` |
| Botón descarga (burbuja) | 16 | 12 × 8 | — | `brand-deep` | `paper` (oscuro: casi negro) | ninguna | ~32 | MB:15-18 `[V]` |
| Píldora de bienvenida | 9999 | 18.4 × 8.8 | 1 px `line` 85% | paper 92% / `rgba(255,255,255,.05)` | `ink` / `#F1F5F9` | ver 3.3 | ~38 | CSS:692-731 `[V]` |
| Botón de header del chat | 16 | 36 × 36 (cuadrado) | 1 px `line` | transparente (hover `mist`) | `muted` (hover `ink`) | ninguna | 36 | CW:666-697 `[V]` |
| Botón tema (navbar) | 9999 | 29.6 × 29.6 | 1 px `rgba(255,255,255,.10)` | transparente | `rgba(255,255,255,.65)` | ninguna | 29.6 | CSS:2291-2309 `[V]` |
| CTA "Ingresar" (navbar) | 9999 | 13.6 × 5.12 | 1 px `rgba(255,255,255,.15)` | `brand` (hover `brand-dark`) | `#FFFFFF` 12 px/600 | ver 3.3 | ~29 | CSS:2311-2331 `[V]` |
| Pestaña de perfil | 9999 | 16 × 10 | 1 px | activa `ink` / inactiva `paper` | activa `paper` / inactiva `muted` | ninguna | ~40 | ProfileLayout:83 `[V]` |
| Toggle login (segmentado) | 9999 (contenedor y botones) | 12 × 4; contenedor padding 2, gap 4 | 1 px `line` | activo `#1C44B6` / blanco; contenedor `mist` / `#171717` | blanco / negro | `shadow-sm` | ~26 | LRP:283-310 `[V]` |
| Chip de filtro admin | 12 | 14 × 8 | 1 px | activo `brand-deep` | `paper` | `shadow-sm` | ~34 | EmployeeApprovals:292 `[V]` |
| Toggle (ajustes) | 9999 | pista 36×20, perilla 16×16 con 2 px de margen | — | apagado `mist`, encendido `brand-deep`; perilla `paper` | — | — | 20 | ChatbotSettings:95 `[V]` |

### 4.2 Campos de formulario

| Componente | Radio | Padding | Borde | Fondo | Texto | Foco | Alto | Fuente |
|---|---|---|---|---|---|---|---|---|
| `.input-field` | 16 | 16 × 10 | 1 px `line` | `paper` | 14 px `ink`; placeholder `faint` | borde `brand` + anillo 2 px `brand/12` | 42 | CSS:1107-1111 `[V]` |
| Input login | 16 | 16 × 12 | 1 px `line` | **`bg-card` inexistente → transparente** (D1) | 14 px `ink` | borde `brand` + anillo 1 px `brand/20` | 46 | LRP:463 `[V]` |
| Input contacto | 16 | 16 × 12 | 1 px `line` | `mist` al 30% | 14 px `ink` | borde `brand-deep`, fondo `paper`, sin anillo | 46 | ContactoPage:223 `[V]` |
| `PasswordField` | 16 | 16 × 12, derecha 48 | 1 px `line` | `paper` | 14 px; placeholder `faint` | borde `brand` + anillo 2 px `brand/15` | 46 | PasswordField:24 `[V]` |
| Botón ojo | 12 | 36 × 36, a 8 px del borde | — | transparente | `faint` (hover `brand-deep`) | — | 36 | PasswordField:26 `[V]` |
| Input compacto (registro empleado) | 12 | 12 × 8 | 1 px `line` | `paper` | 12 px | borde `brand` | ~34 | LRP:559-604 `[V]` |
| Barra de entrada del chat | 20 | izq 16, der 9.6, vert 6.4 | 1 px `line` 85% | paper 96% / `#141518` | input 14 px/500 | borde `brand` + halo (D2) | **58.8** | CSS:733-770 `[V]` |
| Casilla (checkbox) | 4 | 16 × 16 | `line` | — | acento `brand-deep` | — | 16 | LRP:517 `[V]` |

Sin estado de error por campo en login, reset y contacto: los errores salen como toast. Con error: Mesa de Entradas usa borde `bad` + anillo `bad/15` + mensaje 10 px `bad`; UserFormModal usa rojo de Tailwind (`red-300/500`) `[V]`.

### 4.3 Tarjetas, badges, tablas, modales

| Componente | Radio | Padding | Borde | Fondo claro / oscuro | Sombra | Fuente |
|---|---|---|---|---|---|---|
| `.card` | 20 | según uso (20-36) | 1 px `line/70` | paper 86% | ninguna | CSS:1088-1091 `[V]` |
| `.card-interactive` hover | 20 | ídem | `brand` 45% sobre `line` | `primary-lighter` (`#F5F8FF` / `#091230`) | ninguna; `translateY(-2px)` 0.2 s | CSS:1092-1103 `[V]` |
| Tarjeta capacidad (landing) | 20 | 32 × 36 | 1 px `line` / `rgba(255,255,255,.08)` | `rgba(255,255,255,.6)` / `rgba(13,23,48,.4)`, blur 10 | hover `0 10px 28px -4px rgba(47,107,255,.08)`, borde `rgba(47,107,255,.35)` | HP.css:373-396 `[V]` |
| Tarjeta de reset | 20 | 24 (32 ≥640) | 1 px `line` | **`mist`** | ninguna | ResetPasswordPage:77 `[V]` |
| Tarjeta formulario contacto | 28 | 24 (36 ≥640) | 1 px `line` | `paper` | ninguna | ContactoPage:197 `[V]` |
| Tarjeta canal contacto | 20 | 24 | 1 px (WhatsApp `emerald-500/30`, otros `line`) | WhatsApp `emerald-50/40` / `emerald-950/20` | ninguna | ContactoPage:119-187 `[V]` |
| Cabecera de perfil | 20 | 24-40 H, 40 arriba, 32 abajo | `line/70` | `paper` | ninguna | ProfileHeader:47 `[V]` |
| Tarjeta de ubicación (chat) | 16 | 12 | 1 px `line` | `paper` | `shadow-sm` | MB:22 `[V]` |
| `.badge` | 9999 | 10 × 2 | 1 px `line` | tono al 10% | ninguna | CSS:1134-1136 `[V]` |
| StatusPill | 9999 | 10 × 2 + punto 6 px | 1 px | tono al 10% (texto: color pleno) | ninguna | admin/ui.jsx:100-112 `[V]` |
| StatCard | 20 | 20 | `line/70` | paper 86% | ninguna; icono 44×44 radio 16 | admin/ui.jsx:48-70 `[V]` |
| Tabla moderna | contenedor 20 | celda 20 × 12-14 | cabecera `border-y line`, filas `divide-y line` | cabecera `mist/60`; hover `mist` | ninguna | EmployeeApprovals:374 `[V]` |
| Modal (`DetailModal`) | 20 | cuerpo 20 × 16; cabecera 20 × 16 / 12; pie 20 × 12 sobre `soft/60` | `line/70` | `paper` 86% | `shadow-2xl` | ProfileLayout `ui.jsx:42` `[V]` |
| Toast | 16 | 16 × 12 | — | gradiente horizontal de tono (ver 6) | `shadow-lg` | Toast.jsx:39 `[V]` |

Colores de estado `[V admin/ui.jsx:86-91]`: texto del tono pleno, fondo del tono al 10%: Ingresado `info` (`#2F6BFF`/`#4D7DFF`), En proceso `warn` (`#EFC21E`), Observado `bad` (`#D82F2F`), Finalizado `ok` (`#18BC42`). Prioridad: Alta `bad`, Normal `brand`, Baja `muted`.

### 4.4 Chat (burbujas, avatar, barra de entrada)

| Componente | Especificación | Fuente |
|---|---|---|
| Burbuja bot | radio **20 en las 4 esquinas** (sin cola), padding 14 H × 12 V, borde 1 px `line`, fondo **igual al fondo de página** (`paper`), texto `ink` 14.4/21.6, sin sombra | CSS:907-915 `[V]` |
| Burbuja usuario | fondo y borde `brand`, texto `#FFFFFF`, misma geometría; alineada a la derecha | CSS:916-924 `[V]` |
| Ancho máximo de burbuja | `min(78%, 46rem)` de la fila; en 390 px: fila 358 px → burbuja ≤ **279 px** `[E calc]`. VD:231 pide 88% pero el CSS no lo implementa | CSS:890-895 `[V]` |
| Meta | mono 9.01 px/600/0.18em MAYÚSCULAS, `faint`, gap 6.4 px bajo la burbuja. Bot: punto `brand` 6 px + "ASISTENTE · hh:mm" a la izquierda. Usuario: "VOS · hh:mm" a la derecha en `ink` al 55% | CSS:896-931; MB:123-130 `[V]` |
| Fila de mensaje | gap 12 px entre avatar (32 px, solo bot) y burbuja; 24 px entre mensajes; lista `max-width` 768, padding 16 H × 24 V | CW:759; MB:85 `[V]` |
| Contenido | texto plano (`whitespace-pre-wrap`); sin Markdown, sin negritas, sin listas HTML, URLs como texto | MB:96 `[V]` |
| Acciones bajo el texto | chips (gap 8), botón wizard, botón descarga, tarjeta de ubicación; margen superior 8 px; aparecen al terminar de escribir | MB:107-122 `[V]` |
| Barra de entrada | tarjeta radio 20, alto 58.8, `max-width` 672 (el CSS dice 44rem=704 pero `max-w-2xl` gana `[E]`); orden: lupa 20 px `muted/70` (padding 8/4) → input → micrófono 36×36 radio 16 (si hay reconocimiento de voz; escuchando: icono `#D82F2F`, fondo `bad/10`, pulso) → enviar 32×32 radio 16 `brand` con flecha ↑ trazo 2.5 (solo con texto; sin texto colapsa a ancho 0). Placeholder "Escribí tu consulta aquí…" | CW:775-828 `[V]` |
| Avatar bot | SVG cuadrado; bola de diámetro ≈ **63.3% del lado** (92 px → 58.2 px; 32 px → 20.3 px); cuerpo `bot-body`, ojos `bot-eye` (2 cápsulas de 0.186 × 0.412 radios); sin sombra ni borde; forma única `cercle`; 16 expresiones y estados "…" (pensando) y "!" | ChatBotAvatar.jsx; expressions.ts:59-168 `[V]` |

---

## 5. Composición física de cada pantalla (ancho de teléfono, 360-430 px)

Se describe de arriba hacia abajo; cada bloque es un objeto con ancho, alto y margen. "Plano" = capa visible. Los márgenes de flex **no colapsan**.

### 5.1 Capa global: navbar flotante (todas las pantallas públicas, sin admin)

Objeto 1, una **píldora oscura flotante** fija: `top` 16 px (20 px ≥640), centrada horizontalmente, `max-width: calc(100vw - 32px)`, `z-index` 60, **fuera del flujo** (no empuja nada) `[V CSS:2167-2183]`. Fondo `rgba(10,17,36,0.94)`, borde 1 px `rgba(255,255,255,.12)`, padding 5.6 / 8 / 5.6 / 10.4 px, gap 10.4 px, radio 9999. **Siempre navy, en ambos temas.** Alto ≈ **43 px** (29.6 de botón + 11.2 de padding + 2 de borde) `[E]`; una nota de chat lo estima en ~38 px, pero la propia derivación de esa nota da 42.8 y la de landing da 43-46, así que se usa ≈43. Ancho ≈ 270 px `[E]`.

En orden, izquierda → derecha, a ≤767 px:

1. Marca: cuadro "AP" 26.4×26.4, radio 8.8, gradiente 135° `#2F6BFF → #1C44B6`, texto 10.4 px blanco; a 8.8 px, "ChatAP" 14 px/700 blanco con el punto "." en `brand`.
2. Grupo derecho (gap 6 px): botón tema 29.6 px (luna `white/75` en claro; sol `amber-300` en oscuro, icono 14 px) → "Ingresar" (visitante) o botón de perfil (avatar 24.8 px con iniciales + chevron 12 px; el nombre solo ≥640) → hamburguesa 29.6 px (3 líneas 14 px, o X al abrir).

Se **ocultan en móvil** los separadores verticales (1×16 px) y el menú central GooeyNav ("Inicio", "ChatAP", "Soporte") `[V NAV:378-390]`.

Objeto 2, **drawer** al abrir la hamburguesa: `position:absolute` debajo de la píldora, a 8 px, **mismo ancho que la píldora**, radio 20, fondo `rgba(10,17,36,0.96)` + blur 20, borde 1 px `rgba(255,255,255,.14)`, padding 8, gap 4 `[V CSS:2379-2394]`. Ítems de 36 px de alto (12 px/500, padding 14×10, radio 16): inactivo `white/70`, activo fondo `white/10`, texto blanco 600 y punto `brand` 6 px; chevron `>` 14 px `white/30` a la derecha. Si no hay sesión: separador `white/10` y "Ingresar" ancho completo (`brand`, radio 16, ~32 px). Con sesión: avatar 20 px + nombre + correo, "Mi perfil", "MiPortal", "Panel Admin" (solo personal), "Cerrar sesión" en `red-400`. Entra con fade-up 0.22 s; sin animación de salida; se cierra al tocar fuera, con Escape o al cambiar de ruta.

### 5.2 Landing (`/`)

Plano de fondo: `paper` + capa fija de partículas (canvas, 180 partículas <768 px, opacidad .72, `z-index` 2) que queda **detrás del contenido de `<main>`** y solo se ve en las secciones 2-5 `[E, deducido de z-index]`. Orden:

| # | Bloque | Geometría a ≤640 px | Contenido |
|---|---|---|---|
| 1 | **Hero** | alto mínimo **92 svh** en todos los anchos; padding horizontal 20 (`section-bleed`) + 16 interno = **36 px por lado**; padding superior `clamp(96px, 13vh, 136px)`, inferior `clamp(24px, 3vh, 40px)`; columna centrada | H1 36/1.08 "Tus trámites en Formosa, simples y al instante."; subtítulo (mt 24, 16 px, `muted`, máx 672); fila de 3 sellos (mt 40, gap 24×10, envuelve): píldoras 12 px/500 con padding 12×4, fondo `rgba(255,255,255,.6)` / `#0D1730` al 60%, borde `line/40`, blur 4, icono check 14 px emerald; pie con etiqueta de 10 px (tracking 0.22em, peso 600, `muted/70`) y **marquesina de logos** de 28 px de alto, gap 56 px, 26 px/s hacia la izquierda |
| 1b | Fondo del hero | 3 fotos a pantalla completa (`object-fit:cover; object-position:center 36%`), rotación cada 10 s con fundido de 2.2 s, zoom lento 28 s en móvil; encima tinte (más opaco en móvil), foco radial, viñeta, fade inferior (38% del alto) y brillo de 180 px | `hero-bg-1/2.jpg` 1376×768; `hero-bg-3.jpg` 896×1200 |
| 2 | **"El Asistente en Acción"** | `py` 80; borde superior 1 px `line/40`; columna centrada gap 48 | kicker mono 12 px "Demostración en vivo"; H2 30 px; párrafo 16 px; **maqueta de chat** (ancho ≤512, radio 28, padding 12, gradiente vertical `mist/90 → paper → mist/60`, borde `line`, `shadow-xl`); botón CTA |
| 3 | **Servicios integrados** | `py` 80; encabezado alineado a la **izquierda** (máx 672); **1 columna**, gap 24 (3 columnas desde 768) | 3 tarjetas capacidad (tile de icono 40×40 radio 16 + badge mono 11 px; título 20 px; texto 14 px; pie `border-t line/60` con enlace 12 px/700 `brand`) |
| 4 | **FAQ** | `py` 80; columna ≤768, gap 40; lista gap 12 | 4 acordeones `<details>` independientes (el primero abierto): radio 16, summary padding 24×20, pregunta 16/700, chevron 20 px `brand` que gira 180° en 0.25 s; respuesta 15.2 px/1.6 `muted` con padding 24 |
| 5 | **Cierre** | `py` 80; columna centrada ≤672 gap 24 | tile de avatar ≈72×72 (padding 8, radio 20, fondo `brand` 10%, borde `brand` 20%) con bot de 56 px; H2 30 px; párrafo 16 px; botón; línea mono 12 px `muted/70` |
| 6 | **Footer** | fondo `paper` 95%, borde superior 1 px `line`; `py` 48; **1 columna** gap 40 | marca + párrafo (14 px, ≤384) + 5 botones sociales 32×32 radio 12 (icono 16); 3 columnas de enlaces apiladas (cabecera mono 12 px/700/0.2em; enlaces 12 px, gap 10); barra inferior con **rayas diagonales** `repeating-linear-gradient(-45deg, line 80% 0 1px, transparent 1px 10px)`, apilada y centrada, `py` 16, texto 12 px |

Las secciones 2 a 5 usan fondo transparente. Del footer se omiten logos de imagen (no hay; solo el monograma "AP").

### 5.3 Chat (`/chat`)

Pantalla de **una columna a alto completo** (`h-screen` = 100vh; sin `dvh` ni safe-area `[V]`). Fondo `paper`. De arriba hacia abajo:

| Zona | y inicial | Alto | Contenido | Fuente |
|---|---|---|---|---|
| Navbar pill | 16 | ~43 | flota encima (ver 5.1) | CSS:2167 |
| Header del chat | 0 | **56 px** (`shrink-0`) | **vacío**: sin título, sin logo, sin fondo ni borde; a la derecha dos botones 36×36 (radio 16, borde 1 px `line`, `muted`): ⠿ "9 puntos" (reiniciar) y ✕ (nueva conversación), gap 8, padding horizontal 16 (24 ≥640) | CW:664-697 |
| Área de mensajes | 56 | resto, `overflow-y: auto` | fase bienvenida o lista de mensajes | CW:700 |
| Barra de entrada | abajo | 58.8 + padding (8 arriba, 16 abajo / 24 ≥640, 16 lateral) | tarjeta flotante radio 20 | CW:775 |

**Fase bienvenida** (centrada vertical y horizontalmente; padding 16 H × 32 V; **gap de 20 px** entre hijos): avatar 92 px (margen inferior 16) → "Hola, {Nombre}," 16/24 `muted` → H1 24/32 "¡Bienvenido! ¿En qué te podemos ayudar?" (ancho ≤608; probablemente salte de línea a 360-390 px `[E]`) → subtítulo 12 px `muted` (ancho ≤448, margen inferior 24) "Estoy para ayudarte con tus gestiones y trámites provinciales. Elegí una de las opciones o escribí directamente lo que necesitás." → **6 píldoras** en flex-wrap centrado, gap 10, ancho ≤576 (en ~358 px quedan ~3 filas de 2 `[E]`; **no es una grilla fija**): "Recibo de haberes", "Expedientes SIGED", "Licencias médicas", "Mesa de Entradas", "Formularios y notas", "Más consultas", con icono 16 px a la izquierda (sky-400, amber-400, emerald-400, pink-400, yellow-400, purple-400) → opcional "Continuá tu última consulta: {tema}" (12 px, mt 16).

**Fase chat:** columna centrada ≤768, padding 16 H × 24 V, 24 px entre mensajes, mensajes apilados desde arriba, scroll suave al final. Alto útil ≈ 100vh − 139 px (<640) `[E]`.

**Lo que NO está en la pantalla** `[V]`: indicador "escribiendo" con puntos (`isTyping` nunca es true), botón de scroll al fondo, estado de error/offline, adjuntar archivos, `QuickReplies`, `DocumentCard`, `DownloadSection`, `ExternalAccess` (código sin montar), mensajes iniciales de `mockMessages.js`.

Superposición probable `[E]`: a 360-390 px la píldora (~16-59 px de alto) cubre los dos botones del header (10-46 px), porque tiene `z-index` 60.

### 5.4 Login / Registro / Recuperar (`/login`)

A <1024 px **la columna izquierda editorial (foto, "HABLÁ CON EL ESTADO.", panel `mist/50`) se oculta por completo**; queda una sola columna. Fondo de la columna: `paper` (oscuro `#09090B`); padding horizontal **24 px** (48 ≥640), vertical 40 `[V LRP:264]`. Orden:

1. Barra superior (ancho ≤448, centrada): enlace "Volver al inicio" (12 px/500 `muted`, flecha 16) a la izquierda; toggle segmentado "Iniciar sesión" / "Registrarme" a la derecha.
2. Logo móvil (mb 24): cuadro 40×40 radio 16 `brand-deep` con avatar de 22 px + "ChatAP · Formosa" 16 px/700 MAYÚSCULAS.
3. Encabezado (mb 24): H1 24 px/700 ("Sign in to your account" / "Create your account") + subtítulo 12 px (mt 6).
4. Formulario (`space-y` 16): etiqueta 12 px/500 `muted` (mb 6) + input 46 px; contraseña con ojo 16 px a 12 px del borde; fila "Remember me" (marcado por defecto) / "Forgot your password?" 12 px; en registro, casilla de agente público (radio 16, padding 12, borde `line`, fondo `mist/50`) que expande un bloque con campos compactos.
5. Botón principal ancho completo 48 px (mt 8).
6. Divisor "OR CONTINUE WITH" (mt/mb 24): línea 1 px `line` con etiqueta 12 px/500 tracking 0.05em sobre fondo de la columna.
7. Botón Google ancho completo, 46 px, píldora, icono multicolor 16 px (`#4285F4 #34A853 #FBBC05 #EA4335`).
8. Enlace alterno (mt 32, 12 px): "¿No tenés una cuenta? **Registrate gratis**" (`brand`/600).
9. Línea "ChatAP Formosa © 2026 · Subsecretaría de Recursos Humanos" 11 px `muted` → Footer del sitio.

Recuperación **reemplaza** el formulario en la misma columna: campo de correo + botón "Enviar enlace de recuperación"; luego panel de confirmación (padding 20, radio 20, `mist/50`, centrado) con círculo 48 px `emerald-500/15`, título 14 px/700, botón "Restablecer contraseña ahora →" (**radio 16**, no píldora), "Copiar enlace…" y "Enviar a otro correo". Los textos del formulario principal están **mezclados en inglés y español** (D24).

### 5.5 Restablecer contraseña (`/restablecer`)

Sin navbar. Centro con padding 16 H × 40 V; columna de 448 px: avatar bot de 64 px (mb 16) → H1 24 px/700 → subtítulo 14 px `muted` → **tarjeta** (radio 20, borde `line`, fondo **`mist`**, padding 24/32, sin sombra) con 2 `PasswordField` (etiqueta 12 px/600/MAYÚSCULAS, input con fondo `paper` sobre la tarjeta `mist`) y botón de **radio 16** → enlace "← Volver al chat" 14 px (mt 24) → Footer. Tres estados: formulario, éxito (icono 48 px radio 16 `ok/10`) y enlace inválido (icono `bad/10`).

### 5.6 Contacto (`/contacto`, `/soporte`)

Navbar flotante → cabecera (`mist/35`, borde inferior `line/70`, padding 40 V): migas 12 px/600/0.1em ("Inicio / **Soporte**") → kicker → H1 30 px/800 → párrafo 16 px → píldora de estado ("Mesa de ayuda activa · Lun a Vie 07:00 a 19:00 hs", punto 8 px con ping) → **3 tarjetas de canal apiladas** (gap 16, padding 24, radio 20, icono 44×44 radio 16 + chip 11 px) → **tarjeta de formulario** (radio 28, padding 24) con 4 campos y botón "ENVIAR CONSULTA" → tarjeta FAQ (radio 28, acordeón de uno abierto a la vez, ítems radio 20 con `mist/20`) → tarjeta "Atención Presencial" (radio 28, `mist/40`) → Footer. Todo el contenido se apila en 1 columna; en ≥1024 el formulario ocupa 7/12 y FAQ + dirección 5/12.

### 5.7 404

Fondo `paper`; óvalo de luz `brand/10` de 672×352 px con blur 64 px, centrado arriba. Columna centrada ≤672 con padding 16 H, **112 arriba** (libera la píldora), 64 abajo: insignia mono 12 px/700 "ERROR 404 · RUTA NO ENCONTRADA" (píldora, borde `brand/30`, fondo `brand/10`, punto pulsante) → "404" ASCII animado de 224 px de alto (288 ≥640, 320 ≥768) → H1 24 px/800 "La página que buscás no existe o fue movida" → párrafo 14 px (≤512) → botones "Volver al inicio" + "Preguntarle a ChatAP" (píldoras, gap 14, envuelven) → separador `line/40` y 4 chips de atajos (12 px, radio 9999). Degradado del "404": claro `#1C44B6 → #2563EB → #0284C7 → #3B82F6`; oscuro `#93C5FD → #60A5FA → #38BDF8 → #FFFFFF`, diagonal 135° `[V NotFoundPage:18-22]`.

### 5.8 Perfil (`/perfil`)

Sin sesión: tarjeta centrada con candado y "SESIÓN REQUERIDA." (D3). Con sesión, columna `ed-max` con padding lateral **20 px** y vertical 48:

1. **Cabecera-tarjeta** (radio 20): marca de agua "AP" de 176 px al 5% de `ink` cortada arriba a la derecha; kicker; "MI PERFIL." (`.display-2`, 29.6 px); fila identidad (mt 40, envuelve): avatar de **80 px** circular `brand-deep` con iniciales 24 px/700 y anillo 4 px `brand-deep/10`; nombre 24 px; correo 14 px; insignias de rol y estado (10 px/700, píldoras); botón "EDITAR PERFIL" (baja bajo el avatar en pantallas angostas); grilla de datos de **2 columnas** (3 ≥768), cada dato con `border-t line/70`, etiqueta 10 px y valor 15 px.
2. **Pestañas-píldora** (mt 40) con scroll horizontal, gap 8, sin saltar de línea; activa `ink` con texto `paper`. Ciudadano: Resumen, Mis trámites, Mis solicitudes, Mis conversaciones, Mi actividad, Notificaciones, Seguridad. Administrador: Resumen, Permisos, Seguridad. Superadmin: Resumen, Permisos, Auditoría, Seguridad. **No hay sidebar en ningún ancho.**
3. **Sección activa** (mt 32): StatCards en 2 columnas (gap 16); listas dentro de `card card-border` con `divide-y line`; modales de detalle centrados con padding 16 alrededor y `max-height: calc(100vh − 32px)`.

### 5.9 Panel admin (`/admin/*`): no existe layout móvil

**Hecho `[V]`:** el web no tiene drawer, hamburguesa ni barra inferior en admin; `.admin-content` (CSS:316-319) es código muerto; `sidebarOpen` arranca en `true` en cualquier ancho. En 375 px el sidebar de 280 px deja ~95 px al contenido. Cualquier navegación móvil es **diseño nuevo**.

Shell de escritorio, como referencia fiel:

| Elemento | Especificación | Fuente |
|---|---|---|
| Sidebar | `fixed`, 280 px (colapsado 72), fondo `#141414`, borde derecho `rgba(255,255,255,.12)`, transición 300 ms | AdminSidebar:105-117 `[V]` |
| Cabecera del sidebar | 72 px, solo un botón 40×40 (radio 12, fondo `#222`) con chevron 18 px; **sin logo ni nombre ni tarjeta de usuario** | AdminSidebar:121-141 `[V]` |
| Grupos | **PRINCIPAL** (Dashboard, Mesa de Entradas), **GESTIÓN** (Solicitudes [solo Superadmin], Usuarios, Conocimiento, Documentos), **SISTEMA** (Integración SIGED, Configuración, Reportes); etiqueta 10 px/600 `#5e5e5e`, grupos separados 32 px, ítems separados 12 px | AdminSidebar:4-70 `[V]` |
| Ítem | alto 48, padding 14 × 20, gap 16, radio 16, icono 20 px trazo 1.5, texto 14 px; inactivo `#9e9e9e`; hover `#222` + `#FFF`; **activo** fondo `brand`, texto `#FFF`, barra blanca 3×20 a 4 px del borde izquierdo y punto blanco de 6 px a la derecha | AdminSidebar:194-237 `[V]` |
| Pie | "Volver al inicio" con flecha ← (12 px/600/MAYÚSCULAS) tras borde superior | AdminSidebar:254-300 `[V]` |
| Barra superior | 64 px, padding 20 (32 ≥1024), borde inferior `line/70`, fondo paper 85% con blur; izquierda: kicker "Panel de administración" (10 px) sobre título (15 px/700); derecha: usuario (solo ≥640: avatar 32 px `brand-deep`, nombre 12 px, rol 10 px) y botón tema 40×40 radio 12 | AdminLayout:126-145 `[V]` |
| Contenido | padding 24 (40 ≥1024); Dashboard ≤1152 px | AdminLayout:147 `[V]` |

Patrón de cada pantalla admin: cabecera → (cuadrícula de StatCards 2 col <1024) → **una tarjeta grande** con barra de herramientas (búsqueda + filtros) → tabla (la de Solicitudes mide **≥800 px** y hace scroll horizontal) → modal. **Propuesta, no del código `[propuesta]`:** sidebar → barra inferior de 5 destinos o drawer, conservando los tres grupos y las etiquetas literales, superficie `#141414` en ambos temas, activo `brand` con texto blanco; tablas → listas de tarjetas.

---

## 6. Qué cambia en la web a ≤768 / ≤640 / ≤480 px

No existe diseño móvil dedicado: la web es mobile-first con los breakpoints por defecto de Tailwind (sm 640, md 768, lg 1024) y pocas reglas `max-width` propias `[V]`. **Ninguna regla ≤480 px afecta a pantallas montadas**: la única (`.container-ia-chat`, CSS:820) corresponde a una clase sin uso. A 360-480 px rigen los valores `<640`.

| Umbral | Qué cambia | Fuente |
|---|---|---|
| **≤768** | Hero: tinte más opaco, zoom 28 s, brillo 180 px/.7; partículas 180 en vez de 320 (se evalúa una vez al cargar) | HCB.css:150-172; HP.jsx:124-127 |
| **<768** (`md`) | Navbar: sin separadores ni menú central; aparece hamburguesa + drawer. Footer 1 columna (2 en 768-1023). Capacidades 1 columna. `section-bleed` 20 px (48 ≥768). Perfil: datos 2 col (3 ≥768); StatCards superadmin 2 col (4 ≥768) | Navbar; Footer; CSS:1441-1447 |
| **≤767** (CSS) | `.reference-hero`, `.trust-bento`: 1 columna (clases sin uso verificado en pantallas montadas) | CSS:1918-1923,2724 |
| **<640** (`sm`) | H1 hero 36 (60), H2 30 (36), cierre 30 (48), CTA 14 (16); maqueta: puntos "ventana" ocultos, padding 12, texto de burbujas 12 (13), botón "Reiniciar" solo icono; FAQ 16 (18); footer: columnas de enlaces apiladas, enlaces 12 (14), barra inferior apilada, `py` 48 (64); navbar `top` 16 (20); chat: header `px` 16 (24), saludo 16 (18), H1 24 (30), subtítulo 12 (14), padding inferior de entrada 16 (24); login: padding lateral 24 (48); contacto: tarjetas de canal en 1 columna, H1 30 (36), tarjetas `p` 24 (36); admin: se oculta el chip de usuario de la barra superior | varios |
| **≤639** (CSS) | `.spec-strip__cell`, `.trust-card`, `.hero-split__right`: reglas de bloques sin uso verificado | CSS:1989-1993,2415-2418 |
| **≤640** (CSS) | `.quick-replies-grid` pasa a 1 columna (componente sin montar) | CSS:465-469 |
| **<1024** | Login: se oculta la columna izquierda (foto + titular); admin: sin adaptación (sidebar sigue en 280 px) | LRP:215 |
| **≤480** | Sin cambios en pantallas montadas | CSS:820 |

Ausentes en todo el código `[V]`: `env(safe-area-inset-*)`, `dvh`, `viewport-fit=cover` y ajuste para teclado virtual. Hover: los efectos `:hover` (elevar 1.5-2 px, bordes) son de puntero; en táctil solo cuenta `:active` (píldoras `scale(.98)`, botón login `scale(.98)`). El efecto `ClickSpark` (8 chispas de 10 px, radio 18, 420 ms, `#2F6BFF` claro / `#FFFFFF` oscuro) envuelve toda la app y es decorativo.

---

## 7. Discrepancias entre las notas y cuál gana

| Punto | Lo que dicen las notas | Gana |
|---|---|---|
| Alto de la píldora de navbar | ~38 px (tabla de chat) vs ≈43-46 px (landing); la propia derivación del chat suma 42.8 | **≈43 px** (suma de clases, `CSS:2185-2204`) |
| Color de emerald/sky/etc. | Hex de Tailwind v3 en unas notas, v4 en otras | Repo usa Tailwind 4.3: paleta v4 (sin verificar hex); decidir y fijar |
| Números de línea de radios / sombras en `index.css` | 138-143 y 151-152 (tokens, admin) vs 132-139 y 149-150 (auth) | Nota de tokens (lectura completa de 3254 líneas) |
| Ancho de la barra de entrada | CSS `44rem` (704) vs clase `max-w-2xl` (672) | **672** `[E]` (utilidad gana a componente) |
| Sueño del avatar | comentario del código "5 minutos"; controlador 10 s (cabecea) y 15 s (duerme) | **15 s** (BotReactionController) |
| Duplicados en CSS (`.hero-orbit`, `animate-fade-in`, `animate-scale-in`, `animate-page-enter`, `animate-pulse-dot`) | dos definiciones | **La última declarada** |
| Alto del hero | `min-h-[92svh] lg:min-h-screen` en JSX | **92 svh** siempre (CSS de `.hero-cinematic` gana) |
| Ancho de burbuja | VD:231 "88% en mobile" | **78%** (CSS) |
| Dirección Mesa de Entradas | chat/wizard "Belgrano 878"; contacto "Belgrano 836" | Dato de contenido, sin ganador en el código; confirmar con el cliente |
| `.hero-headline`, `.hero-cinematic__title`, `.reference-*` | listados en el CSS global con tamaños fluidos | **No usar**: el H1 real de la landing es `text-4xl` (36 px); esas clases no están montadas en Home |

---

## 8. Defectos del código y decisión que debe tomar el desarrollador mobile

"Copiar render" = reproducir lo que hoy se ve en la web; "copiar intención" = lo que el diseño pretendía.

| # | Defecto `[V salvo nota]` | Efecto en la web | Opciones y recomendación |
|---|---|---|---|
| D1 | **`--color-card` no existe** (`bg-card` en `LRP:244,360,419,463,479,495,560,640,708,767,810`) | Inputs, marco de foto, botón Google, caja de empleado y panel del modal Google quedan **transparentes** | Copiar render para inputs (= fondo de la columna: `#F0F4F9` / `#09090B`). Para el panel del modal de Google usar `paper`: transparente sobre un velo borroso es un error evidente `[propuesta]` |
| D2 | **`--color-brand-rgb` indefinido** (CSS:756) | El halo de foco de la barra de entrada usa el fallback `rgba(14,165,233,0.2)` (celeste sky) | Usar el `brand` de cada tema al 20% (`#2F6BFF`/`#4D7DFF`); el celeste es casi seguro un descuido `[E]` |
| D3 | **`.kicker` y `.display-3` indefinidas** (eliminadas en commit `3f8fc49`) | Kickers y títulos de admin/perfil se ven a ~16 px/400, solo en MAYÚSCULAS cuando el texto lo pide. Afecta: "SESIÓN REQUERIDA.", "ACCESO RESTRINGIDO.", título de `PageHeader`, `SectionHeader`, "Últimos movimientos", kicker de Contacto | Copiar intención: kicker 11.5 px/600/0.2em/MAYÚSC./`muted`; `display-3` `clamp(28px, 4.25vw, 52px)` → **28 px** en móvil, lh 0.98, tracking -0.035em, peso 700 (valores históricos del commit, no de HEAD). Copiar render solo si se exige fidelidad pixel a pixel |
| D4 | **Modales sin velo**: Documentos, Mesa (formulario), Solicitudes (detalle), `DetailModal` de Perfil; otros usan `black/30` + blur, `ink/50` o `ink/60` | El contenido de fondo queda visible bajo un panel translúcido (paper 86%) | Unificar: velo negro 30-50% (+ blur 4 px opcional). Nota: `bg-ink/50` y `ink/70` (Footer) en **oscuro** son un velo **claro** (`#EAF0FA` al 50-70%); usar negro `[propuesta]` |
| D5 | **Componentes sin montar**: `QuickReplies`, `DocumentCard`, `DownloadSection`, `ExternalAccess`; `NotificationCenter`, `GlobalSearch`, `ActivityLog`, `ExpedienteDetail`; `BannerCarousel`, `ScrollExpand`, `ScrollReveal`, `CRTWarp`, `ImageStage`, `Logo` | No aparecen en ninguna pantalla | **No portar.** Si se necesita un sustituto (p. ej. respuestas rápidas), usar las 6 píldoras de bienvenida y los chips de burbuja |
| D6 | **Sin layout móvil en admin** | Sidebar 280 px fijo en un teléfono; `.admin-content` es CSS muerto | Diseñar navegación nueva (sección 5.9). Conservar tokens, etiquetas y grupos |
| D7 | **`isTyping` nunca es `true`** | Sin indicador de espera durante 900-1700 ms | Copiar render (nada) o añadir puntos animados; la landing ya define unos (3 puntos `brand` de 6 px, rebote 1 s con retardos 0/150/300 ms, en la maqueta) `[V ICM]` |
| D8 | **Título y nombre de la barra superior admin en `#FFFFFF` en claro** (usa `--sidebar-text-hover`); botón tema con tokens de sidebar | Casi invisible en tema claro | Usar `ink` en claro `[propuesta]` |
| D9 | **Skeleton invisible**: bloques usan `animate-shimmer` (solo animación) sin la clase `.skeleton` con el gradiente | Barras transparentes | Copiar intención: gradiente `mist/soft/mist` 1.4 s |
| D10 | **Peso 800 inexistente** | Se ve Black 900 | Ver 2.2: mapear 800 → Black |
| D11 | **Contraste**: `btn-primary` oscuro = texto `#070E20` sobre `#2F55C0` (2.91:1); `#FFFFFF` sobre `brand` oscuro (3.69:1); `faint` sobre paper 3.10 / 3.02; `warn` `#EFC21E` como texto sobre su tinte en claro | Bajo AA | Login ya usa blanco/negro invertido en oscuro (inconsistente). Decidir un criterio único; recomendación: texto `#FFFFFF` sobre `brand-deep` en ambos temas `[propuesta]` |
| D12 | **Botón primario con dos recetas** (píldora vs radio 16; login oscuro blanco/negro vs `brand-deep`) | Inconsistencia interna | Elegir: píldora 9999 como `.btn-primary` global; reservar radio 16 para formularios si se quiere fidelidad |
| D13 | **`placeholder-faint` inválido en Tailwind v4** (Login) | Placeholder con color por defecto del preflight (no `faint`) `[E, sin build]` | Usar `faint` (intención) |
| D14 | **Contacto: placeholders sin color definido** | Color por defecto del navegador | Usar `faint` |
| D15 | **`scrollbar-none`, `text-ok-dark` indefinidas** | Fila "Ejemplos" de la maqueta puede mostrar scrollbar; texto hereda color | Ocultar barra de scroll; usar `ok` |
| D16 | **Toast `info` con degradado `brand → #EBF2FF` y texto `paper`**; Modal común usa el mismo | Texto casi invisible hacia el extremo claro en tema claro | Usar un tono sólido (`brand`) con texto blanco `[propuesta]`. Toast: `fixed bottom-4 right-4`, `max-w-sm`, gap 8, cierre a 3500 ms; no es responsive |
| D17 | **Avatar: el motor calcula `arcs` y `notif` pero `paint()` no los dibuja** | Sin anillos, estelas ni pastilla azul | No portar esos efectos; solo cuerpo + 2 ojos + puntos "…" / "!" |
| D18 | **Primer frame del texto del bot**: `typedText || message.text` muestra el texto completo antes de empezar a escribir | Parpadeo del texto completo | Comenzar vacío (intención) |
| D19 | **Bug del wizard**: `finishWizard` pasa `step0/step1` pero los `summary` leen `answers[0/1]` | Texto final siempre "Perfecto. Para tu licencia…" y expediente cae en la rama "Sin el número…" | Decidir qué texto replicar; lo lógico es el texto correcto por respuesta |
| D20 | **Tres dialectos en admin**: moderno redondeado, legado cuadrado (Usuarios, Conocimiento, SIGED; botones sin radio, chips cuadrados), Reportes slate/blanco con paleta distinta (estados purple/blue/amber/emerald) | Incoherencia | Portar todo con los primitivos modernos (20/16/píldora); Reportes con tokens de marca. Para fidelidad exacta, mantener cada dialecto |
| D21 | **`.nav-drawer` hereda `pointer-events:none`** de `.nav-shell` `[E, no ejecutado]` | En web, los toques podrían atravesar el panel | No aplica a nativo; ignorar |
| D22 | **Altura `100vh`, sin safe-area, sin teclado** | La barra de entrada puede quedar tapada por la barra del navegador | En nativo respetar safe area y teclado (el original no lo hace); el input va fijo al borde inferior con margen 16 |
| D23 | **Tooltip del sidebar colapsado puede quedar recortado** por `overflow-hidden` `[E]` | — | No aplica a móvil |
| D24 | **Textos de login mezclados** ("Sign in to your account", "Email address", "Continue with Google") | Español/inglés mezclados | Mantener literales o localizar; decisión de producto |
| D25 | **Variante `purple` de "conocimiento" y emerald/amber del login sin versión oscura** | Tono pastel en oscuro | Definir equivalente oscuro `[propuesta]` |
| D26 | **Superposición de la píldora sobre el header del chat** `[E]` | Cubre los botones de reiniciar/cerrar a 360-390 px | En nativo reservar la franja superior (56 pt + safe area) y no superponer |
| D27 | **Footer: `.faq-icon { shrink:0 }` es propiedad inválida** | El chevron del FAQ puede comprimirse con preguntas largas | Fijar 20×20 con no-shrink |
| D28 | **Kicker `span` inline**: el `space-y-3` no aplica a inline | El kicker queda pegado al H2 `[E]` | Decidir 0 px (render) o 12 px (intención) |
| D29 | **Fuente mono sin archivo** (pila de sistema) | Distinta por plataforma | Fijar una mono (ver 2.2) |
| D30 | **Imágenes**: `auth-landscape.jpg` (896×1200) solo se muestra en login ≥1024 px recortada a 21:10; `hero-bg-3.jpg` también es vertical | En móvil la foto de login no aparece | No portar la foto de login salvo decisión explícita; hero: `cover` con posición `center 36%` |

---

## 9. Vacíos que no se pueden cerrar con este material

| Vacío | Por qué |
|---|---|
| Anchos reales de texto, de la píldora de navbar y de las píldoras del chat | Dependen de las métricas de PP Neue Montreal; no se renderizó la app ni hay `node_modules` |
| Valores de `src/pages/HomePage.css` (458 líneas) y `src/components/common/*.css` fuera de lo citado | Se leyeron las partes citadas; los tamaños `clamp` del hero antiguo no se usan en Home |
| Hex exactos de la paleta de Tailwind v4 y valores de `shadow-*` por defecto | No están en el repo |
| Estados `disabled`/`loading` de botones | Solo `opacity` en algunos (.5-.6); sin estilo global |
| Formato de hora (24 h vs 12 h) en las metas del chat | Depende de ICU del navegador (`es-AR`) |
| Lista real de permisos de `permissionsForRole` | Texto dinámico de `AdminContext.jsx`, no extraído |
| Geometría de los estados `egg`, `hexagon`, `triangle` del avatar | Perfiles radiales tabulados en `profiles.ts`; reutilizar los arrays o los SVG generados |
| Guía textual específica para UI móvil nativa | Solo existe `VD:379-397` (controles ≥44 px en ≤420 px, composer ≥56 px); ninguna fuente la implementa |
| Tamaños `text-*` dentro de componentes JSX no leídos | Se cubrieron las pantallas y componentes listados |

---

## Conclusión

El hallazgo útil para el equipo mobile es que la web tiene **un sistema pequeño y coherente** (tokens de color con dos columnas, cuatro radios que importan: 9999 / 20 / 16 / 28, cero sombras en componentes base, una receta de botón en MAYÚSCULAS de 12 px) cubierto por **defectos puntuales y enumerables**. Con las tablas de las secciones 3 y 4 se reconstruyen los componentes de chat, cuenta y landing; lo que queda abierto son las 30 decisiones de la sección 8, y las que pesan de verdad son cuatro: la licencia y el mapeo del peso 800 de la fuente, el contraste del botón primario en oscuro, la navegación móvil del admin (que no existe) y el criterio de "copiar render" frente a "copiar intención" para `.kicker`/`.display-3`.

Un riesgo no obvio: copiar la web "tal cual" reproduce errores visibles (títulos de admin sin estilo, texto blanco sobre fondo claro en la barra superior, modales sin velo, halo celeste en el input). Conviene fijar esa política antes de implementar, y revisar con el cliente los datos de contenido que difieren entre pantallas (por ejemplo, "Belgrano 878" frente a "Belgrano 836").
