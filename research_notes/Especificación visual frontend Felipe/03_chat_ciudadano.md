# Chat ciudadano (pantalla principal del asistente) — formato visual, web frontend `dev-felipe`

Fuente: checkout local de `monzonfelipe0710-stack/asistente-virtual` rama `dev-felipe`, HEAD `b9b83c4` ("arreglo de banner y de recuperar tu contraseña"). Ruta: `/chat` -> `CiudadanoPage` (`src/router/routes.jsx:67`).
Convención de citas: `archivo:línea`. Rutas relativas a la raíz del repo. `CSS` = `src/index.css`. `CW` = `src/components/ciudadano/ChatWindow.jsx`. `MB` = `src/components/ciudadano/MessageBubble.jsx`.
Marca `[TW]` = valor que NO está en el repo sino que es el default de Tailwind CSS v4 (`@tailwindcss/vite ^4.3.0`, `package.json`); `node_modules` no existe en el checkout, así que esos defaults no se pudieron verificar contra el paquete. Marca `[INF]` = inferencia mía (no está escrito en el código).
1 rem = 16 px (no hay `font-size` raíz custom; `grep` de `html {font-size` sin resultados; CSS:187-202).

---

## 0. Hallazgos que cambian el diseño a replicar (leer primero)

1. **Los componentes `QuickReplies.jsx`, `DocumentCard.jsx`, `DownloadSection.jsx`, `ExternalAccess.jsx` NO se usan en la pantalla de chat de esta rama.** `grep -rn "QuickReplies|DownloadSection|ExternalAccess|DocumentCard" src` solo devuelve ocurrencias dentro de sus propios archivos (DownloadSection importa DocumentCard). `CW` importa únicamente `MessageBubble`, `ChatBotAvatar`, `BotReactionController` (CW:1-5). Son código muerto respecto a `/chat`; se documentan en el apéndice A por si se quieren, pero **no forman parte de la UI visible**. Lo que sí hace de "respuestas rápidas" son las 6 píldoras de bienvenida (`CHATAP_PILLS`, CW:37-98) y los chips dentro de burbujas (MB:36-56).
2. **No hay indicador de "escribiendo" con puntos.** `isTyping` se declara (CW:165) pero nunca se pone en `true` (`grep "setIsTyping(true"` sin resultados). Durante la espera del bot (900–1700 ms, CW:294) no se muestra nada en la lista. Lo único "typing" visible es el efecto máquina de escribir con cursor parpadeante dentro de la burbuja del bot (sección 5.5).
3. **No hay encabezado con logo/título/subtítulo dentro del chat.** El `header` de `ChatWindow` (CW:664-698) está vacío salvo dos botones cuadrados a la derecha. La identidad "ChatAP" vive en la píldora de navegación flotante `Navbar` (fija, superpuesta).
4. **No hay botón "scroll al fondo", ni estado de error/offline con estilo propio, ni adjuntos.** Hay auto-scroll suave (CW:191-194). "Error" solo existe como texto del bot (CW:120-122, 391).
5. **El texto de las burbujas es texto plano** (`<p class="m-0 whitespace-pre-wrap">`, MB:96). No hay Markdown, ni negritas, ni listas HTML, ni código, ni autolinkado (la clase `.mono-link` existe en CSS:932-938 pero `grep mono-link src/**/*.jsx` = 0 usos). Las URLs aparecen como texto plano. Los saltos de línea (`\n`) se respetan por `pre-wrap`; los "bullets" son los caracteres literales `•` y `1)` de los textos de `wizard.js`.
6. **Tema por defecto = OSCURO.** `index.html` agrega la clase `dark` salvo que `localStorage.theme === "light"` (index.html:~25-37; en la primera visita fuerza `theme=dark`). Se debe replicar ambos temas; el oscuro es el que ve un usuario nuevo.
7. **Altura de pantalla = `100vh`** (`h-screen`), no `dvh`/`svh`; no hay `safe-area` ni `env()` en ningún lugar del chat (grep sin resultados en `src/**/*.jsx|js`).
8. **El avatar (bloub) tiene UNA sola "skin" en la web**: círculo, color tomado de variables CSS por tema. Los `SHAPES`/`COLORS` del personalizador (`skins.ts`) NO se usan en `ChatBotAvatar` (solo `DEFAULT_SHAPE='cercle'`, ChatBotAvatar.jsx:3,221). Además `paint()` solo dibuja cuerpo + 2 ojos + 6 puntos (ChatBotAvatar.jsx:227-262): **no dibuja `arcs` (anillos de orbit/play/comet) ni `notif` (punto azul de notify)**, aunque el motor los calcule.

---

## 1. Anatomía de la pantalla, de arriba a abajo (plano ensamblado)

### Takeaway
Pantalla de columna única a pantalla completa (`100vh`): una píldora de navegación flotante oscura superpuesta arriba; debajo, una franja vacía de 56 px con 2 botones cuadrados a la derecha; un área central scrolleable que muestra (a) la bienvenida centrada con el avatar grande y 6 píldoras, o (b) la lista de mensajes en columna de máx. 768 px; y abajo una barra de entrada flotante redondeada (radio 20 px, máx. 672 px) con lupa, input, micrófono opcional y botón enviar que solo aparece al haber texto.

### Cited findings

**Contenedor de página** — `CiudadanoPage.jsx:10-15`: `<div class="h-screen flex flex-col bg-paper">` -> `<Navbar/>` + `<main class="flex-1 min-h-0">` -> `<ChatWindow/>`. `h-screen` = `height:100vh` [TW]. Fondo `bg-paper` (#F0F4F9 claro / #070E20 oscuro; CSS:85,161).
Como `Navbar` es `position:fixed` (CSS:2167-2177), no ocupa alto en el flujo: `ChatWindow` empieza en y=0 y mide los 100vh completos.
Todo el árbol de ruta está envuelto en `<div class="animate-route-enter">` (AppRouter.jsx, `animation: route-enter 0.28s cubic-bezier(0.16,1,0.3,1) both`, translateY 8px->0 + fade; CSS:265-274,333-336).

**Raíz del chat** — CW:663: `flex flex-col h-full bg-paper relative`.

**Plano vertical (de arriba a abajo), ancho = viewport W:**

| Zona | y inicial | Alto | Contenido / estilo | Fuente |
|---|---|---|---|---|
| Píldora Navbar (flotante, encima de todo, z-60) | top = 16 px (<640) / 20 px (>=640), centrada horizontal, `max-width: calc(100vw - 2rem)` | ~38 px [INF: 29.6 botón + 2×5.6 padding + 2 borde ≈ 42.8; ver 2.1] | Oscura siempre, ver 2.1 | CSS:2167-2204 |
| Header del chat | 0 | **56 px** (`h-14`) `shrink-0` | `flex items-center justify-end gap-2`, padding horizontal 16 px (<640) / 24 px (`sm:px-6`). Sin fondo propio, sin borde, sin título. Dos botones 36×36 | CW:664 |
| Área de mensajes | 56 px | `flex-1` (resto) `overflow-y-auto relative flex flex-col` | Sin padding propio, fondo = paper heredado. Scrollbar nativo (no se usa `.chat-scroll`) | CW:700 |
| Barra de entrada (wrapper) | al fondo | `shrink-0`: pt 8 px, px 16 px, pb 16 px (<640) / 24 px (>=640) | `bg-transparent` | CW:775 |

Clases del wrapper: `p-4 sm:pb-6 pt-2` -> `padding: 16px` luego `pt-2` pisa solo el top a 8 px; `sm:pb-6` (>=640 px) pisa el bottom a 24 px.

**Dos "fases" visibles en el área de mensajes** (`phase` = `welcome` -> `leaving` -> `chat`, CW:166, 273-278, 701):
- `welcome`: bienvenida centrada (sección 3). Se muestra si no hay historial.
- `leaving`: la bienvenida hace `opacity-0 scale-95` con `transition-all duration-300 ease-out` (CW:703-705); a los 480 ms pasa a `chat` (CW:277).
- `chat`: lista de burbujas (sección 4-5). Si el usuario autenticado vuelve con historial guardado en localStorage, entra directo a `chat` (CW:242-247).

**Header — botones (CW:666-697).** Ambos hacen lo mismo (`resetConversation`: vuelve a la bienvenida y borra historial, CW:596-613).
- Tamaño `w-9 h-9` = 36×36 px; `rounded-xl` = **16 px** (porque `@theme` redefine `--radius-xl: 1rem`, CSS:141; el default de TW sería 12 px); `border border-line` (1 px, rgba(15,23,48,.12) claro / rgba(234,240,250,.12) oscuro, CSS:88,164); contenido centrado; color `text-muted` (#4A5578 / #8A9BC0); hover `text-ink` + `bg-mist` (#E2EAF4 / #0D1730); `transition-colors`.
- Botón 1 (izq.): icono "9 puntos" 3×3, SVG 16×16 (`w-4 h-4`), `fill=currentColor`, 9 círculos r=2 en viewBox 24 en (5|12|19, 5|12|19) (CW:673-683). `title`/`aria-label`: "Reiniciar y ver opciones".
- Botón 2 (der.): icono X, SVG 16×16, stroke 2, trazo `M6 18L18 6M6 6l12 12` (CW:694-696). `title`: "Nueva conversación".
- Separación entre ambos: `gap-2` = 8 px. Margen derecho = padding del header (16/24 px).

### Inferences
- [INF] El chat entero es una sola columna sin sidebar ni panel lateral; en móvil y escritorio el layout es el mismo, solo cambian paddings y tamaños de tipografía (ver sección 9).
- [INF] Altura útil del área de mensajes = 100vh − 56 (header) − (8 + 58.8 + 16|24) (barra) ≈ 100vh − 138.8 px (<640) / − 146.8 px (>=640). Alto de la barra: input 44 + padding vertical 6.4×2 + borde 2×1 = 58.8 px (CSS:733-770).

### Gaps
- Alto exacto de la píldora Navbar depende de la fuente PP Neue Montreal y no se pudo medir sin renderizar; ver 2.1 (estimación).

---

## 2. Navbar flotante (parte visible de la pantalla; solo lo necesario)

### 2.1 Takeaway
Píldora oscura redondeada, centrada y flotante sobre el contenido (no empuja el layout). Siempre oscura en ambos temas. En móvil puede cubrir los botones del header del chat (ver Inferences).

### Cited findings
- Contenedor `.nav-shell`: `position:fixed; top:1rem` (>=640: `1.25rem`); `left:50%; translateX(-50%)`; `z-index:60`; `width:max-content; max-width:calc(100vw - 2rem)`; `pointer-events:none` (CSS:2167-2183).
- Píldora `.nav-pill`: `inline-flex; align-items:center; gap:0.65rem; padding:0.35rem 0.5rem 0.35rem 0.65rem; border-radius:9999px; background:rgba(10,17,36,0.94); border:1px solid rgba(255,255,255,0.12); box-shadow:0 10px 30px -4px rgba(0,0,0,0.28), inset 0 1px 0 0 rgba(255,255,255,0.10)` (CSS:2185-2197). >=768 px: `gap:1.15rem; padding:0.35rem 0.55rem 0.35rem 0.75rem` (CSS:2199-2204). Con scroll de ventana >24 px: bg `rgba(7,14,32,0.96)`, borde `rgba(255,255,255,0.18)`, sombra más profunda (CSS:2207-2211; en `/chat` la ventana no scrollea, así que no se activa).
- Marca (`Navbar.jsx:368-373`): marca "AP" = cuadrado `1.65rem` (26.4 px), radio `0.55rem` (8.8 px), `linear-gradient(135deg,#2F6BFF 0%,#1C44B6 100%)`, texto blanco `0.65rem` (10.4 px) peso 800 `letter-spacing:-0.02em`, `box-shadow:0 2px 8px rgba(47,107,255,0.35)` (CSS:2223-2236); texto "ChatAP" `0.875rem` (14 px) peso 700 blanco, `letter-spacing:-0.01em`; el punto "." en `--color-brand` (CSS:2238-2248). `gap:0.55rem` entre marca y nombre (CSS:2216).
- Divisores `.nav-divider`: 1×16 px, `rgba(255,255,255,0.12)`; solo >=768 px (`hidden md:block`) (CSS:2250-2254; Navbar.jsx:375,392).
- Links centrales (solo >=768 px): Inicio, ChatAP, Soporte (Navbar.jsx:11-15) vía GooeyNav: texto `0.8125rem` (13 px) peso 500 (`rgba(255,255,255,0.78)`), padding `0.38rem 0.88rem`; el activo es una píldora **blanca** con texto `#070e20` 13 px peso 600 y animación "gooey" con partículas de colores #2F6BFF/#60A5FA/#38BDF8/#FFFFFF (GooeyNav.css:1-12, 25-31, 109-130). En `/chat` el activo es "ChatAP" (índice 1, Navbar.jsx:306-311).
- Controles derechos (`gap-1.5 sm:gap-2`, Navbar.jsx:395): botón tema `.nav-icon-btn` 1.85 rem (29.6 px) circular, borde `rgba(255,255,255,0.10)`, icono 14 px (luna `text-white/75` en claro; sol ámbar `text-amber-300` en oscuro) (CSS:2291-2309; Navbar.jsx:396-436); sin sesión: CTA "Ingresar" `.nav-cta` (fondo brand, texto blanco 0.75 rem peso 600, padding `0.32rem 0.85rem`, borde `rgba(255,255,255,0.15)`, sombra `0 2px 8px rgba(47,107,255,0.32)`) (CSS:2311-2326); con sesión: botón de perfil (avatar circular 1.55 rem con inicial, degradado azul, chevron; el nombre solo >=640) (CSS:2333-2362; Navbar.jsx:78-83); botón hamburguesa `.nav-icon-btn md:hidden` 29.6 px (Navbar.jsx:447-463). En móvil el menú se abre como "drawer" bajo la píldora (`.nav-drawer`, radio 1.25 rem, bg `rgba(10,17,36,0.96)`, blur 20px, CSS:2379-2392).

### Inferences
- [INF] En un teléfono de 360–390 px de ancho la píldora (marca + tema + Ingresar + hamburguesa, ancho estimado ~265–290 px centrada) cubre en x el rango de los dos botones del header del chat (que están a 16 px del borde derecho, y 10–46 px de alto) y se superpone parcialmente en y (píldora ~16–54 px). Por `z-index:60` la píldora queda encima. Estimación mía, no medida.
- [INF] Como `Navbar` está dentro de un ancestro con `transform` residual (`route-enter ... both`), el `position:fixed` se resuelve contra ese wrapper, que mide 100vh; efecto visual equivalente.

### Gaps
- Anchos reales de texto/píldora no medibles sin renderizar (fuente PP Neue Montreal).

---

## 3. Estado de bienvenida / vacío (literal)

### Takeaway
Bloque centrado vertical y horizontalmente: avatar animado de 92 px, saludo "Hola[, Nombre]," + título grande "¡Bienvenido! ¿En qué te podemos ayudar?", subtítulo, y 6 píldoras de consulta rápida que envuelven en filas centradas (comentario del código: "2 filas de 3"). Opcionalmente un enlace "Continuá tu última consulta".

### Cited findings
- Contenedor (CW:702-706): `welcome-content flex-1 flex flex-col items-center justify-center px-4 py-8 text-center transition-all duration-300 ease-out`; padding 16 px laterales / 32 px vertical; `.welcome-content{gap:1.25rem}` = 20 px entre hijos directos (CSS:776-778). Fase `leaving`: `opacity-0 scale-95`.
- **Avatar**: wrapper `mb-4 relative flex items-center justify-center select-none` (16 px margen inferior, CW:708); `<ChatBotAvatar size={92} reaction={reaction} followMouse={true}/>` (CW:709) -> SVG 92×92, animado (no `static`). Sin marco ni fondo (comentario CW:707).
- **Saludo** (CW:713-722) wrapper `space-y-1 mb-2`:
  - `<p>`: `text-base sm:text-lg font-medium text-muted font-neue-text m-0` -> 16/24 px (>=640: 18/28 px) [TW], peso 500, color muted (#4A5578 / #8A9BC0), fuente "PP Neue Montreal Text". Texto: `Hola {PrimerNombre},` si autenticado con nombre, si no `Hola,` (CW:715-717).
  - `<h1>`: `text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-neue m-0` -> 24/32 px (>=640: 30/36 px) [TW], peso 800, `letter-spacing:-0.025em`, color ink (#0F1730 / #EAF0FA), fuente "PP Neue Montreal". Texto: **`¡Bienvenido! ¿En qué te podemos ayudar?`**. `.welcome-content h1{max-width:38rem}` = 608 px (CSS:804-809; `font-size/line-height/letter-spacing` de esa regla pierden contra las utilidades por orden de capas @layer components < utilities).
  - Entre "Hola," y h1: `space-y-1` = 4 px.
- **Subtítulo** (CW:725-727): `text-xs sm:text-sm text-muted font-neue-text max-w-md mx-auto leading-relaxed mb-6 m-0` -> 12/16 px (>=640: 14/20 px) [TW], `line-height:1.625`, ancho máx. 28 rem = 448 px, centrado, color muted. Margen inferior 24 px (si `mb-6` gana a `m-0` — [INF] Tailwind v4 ordena longhands después del shorthand). Texto literal: **`Estoy para ayudarte con tus gestiones y trámites provinciales. Elegí una de las opciones o escribí directamente lo que necesitás.`**
- **Píldoras** (CW:730-742, definición CW:37-98, CSS:682-731): contenedor `.chatap-pills-container`: `display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:0.625rem (10 px); max-width:36rem (576 px); margin:0 auto`. Cada `.chatap-pill-btn`: `inline-flex; align-items:center; gap:0.55rem (8.8 px); padding:0.55rem 1.15rem (8.8 px 18.4 px); border-radius:9999px; background:color-mix(in srgb, paper 92%, transparent); border:1px solid color-mix(in srgb, line 85%, transparent); color: ink; font-size:0.8125rem (13 px); font-weight:600; box-shadow:0 2px 5px rgba(0,0,0,0.03); transition: all .2s cubic-bezier(.16,1,.3,1); user-select:none`. Oscuro: `background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#f1f5f9` (CSS:710-714). Hover: `translateY(-1.5px)`, fondo `mist 80%`, borde `--color-brand`, sombra `0 6px 16px -2px rgba(0,0,0,0.08)`; oscuro hover: bg `rgba(255,255,255,0.09)`, borde `rgba(255,255,255,0.22)`, sombra `0 8px 24px -4px rgba(0,0,0,0.45)`. Active: `translateY(0) scale(0.98)` (CSS:716-731). Icono: SVG 16×16 (`w-4 h-4`), stroke 2, `shrink-0` a la izquierda del texto.
  Las 6 píldoras (orden, etiqueta -> consulta que envía -> color del icono Tailwind):
  1. "Recibo de haberes" -> "¿Dónde puedo ver mi recibo de sueldo?" -> `text-sky-400` (icono "imagen/paisaje") (CW:39-47)
  2. "Expedientes SIGED" -> "¿Cómo puedo seguir mi expediente?" -> `text-amber-400` (icono "gráfico de barras") (CW:49-57)
  3. "Licencias médicas" -> "¿Cómo solicito una licencia médica?" -> `text-emerald-400` (icono "escudo con tilde") (CW:59-67)
  4. "Mesa de Entradas" -> "¿Cómo inicio un trámite en Mesa de Entradas?" -> `text-pink-400` (icono "sobre") (CW:69-77)
  5. "Formularios y notas" -> "¿Dónde descargo los formularios oficiales?" -> `text-yellow-400` (icono "lápiz") (CW:79-87)
  6. "Más consultas" -> "¿Cuáles son los trámites más consultados?" -> `text-purple-400` (icono "estrella" **rellena**, `fill=currentColor`) (CW:89-97)
  Colores `*-400` no están definidos en `@theme` -> son los de la paleta default de Tailwind [TW]; equivalentes v3: sky #38bdf8, amber #fbbf24, emerald #34d399, pink #f472b6, yellow #facc15, purple #c084fc (v4 los emite en oklch, visualmente casi idénticos) [INF].
  Al tocar una píldora se envía su consulta como mensaje de usuario y se pasa a fase `leaving`->`chat` (CW:279-282,479-492).
- **Continuar consulta previa** (solo si hay memoria del usuario, CW:745-756): `mt-4 text-xs text-muted font-neue-text flex items-center justify-center gap-1.5 animate-fade-in` (12 px, gap 6 px) con texto `Continuá tu última consulta:` + botón-texto `text-brand font-semibold hover:underline` cuyo label viene de `suggestedTopics(mem)[0].label` (p. ej. "Retomar expediente", "Recursos Humanos", "Legajos", "Retomar trámites", "Retomar formularios", "Oficinas y horarios" — chatMemory.js).
- **Orden/espaciado vertical resultante** (de arriba a abajo, centrado en el área): avatar 92 px -> (mb 16 + gap 20) -> "Hola," (24/28) -> 4 -> h1 (32/36 por línea) -> (mb 8 + gap 20) -> subtítulo -> (mb 24 + gap 20) -> píldoras -> [(mt 16 + gap 20) -> "Continuá..."]. [INF: suma de márgenes + `gap` de flex; los `margin` no colapsan en flex].

### Inferences
- [INF] El título h1 en 24 px con ~39 caracteres peso 800 probablemente haga salto de línea en 360–390 px (ancho útil 328–358 px); no verificado.
- [INF] Peso 800 solicitado en h1: el CSS solo declara @font-face de 250,350,400,500,600,700,900 (CSS:4-52 aprox.; 800 no existe). Por las reglas de coincidencia de peso, 800 resuelve a la cara **Black (900)** (`PPNeueMontreal-Black.woff2`, CSS:46-52). La píldora de marca (`font-weight:800`) igual.
- [INF] Con 6 píldoras de ~120–170 px de ancho y contenedor máx. 576 px, en escritorio quedan en ~2–3 filas; en móvil (≈358 px) quedarán ~3 filas de 2 aprox. Ancho exacto no medible.

### Gaps
- Anchos reales de píldoras (dependen de la fuente). No existe "grid fijo de 3 columnas": es flex-wrap centrado; el "2 filas de 3" es solo un comentario.
- La clase `welcome-content` aplica además `.welcome-content p{font-size:1rem;line-height:1.6}` (CSS:811-814) pero queda anulada por las utilidades de texto en los `<p>` de bienvenida.

---

## 4. Lista de mensajes (fase chat)

### Takeaway
Columna centrada de máx. 768 px, 16 px de padding lateral, 24 px arriba/abajo y 24 px de separación entre mensajes, sobre el mismo fondo paper (sin color de fondo propio para la zona de chat). Cada mensaje entra con fade-up.

### Cited findings
- Contenedor de la lista (CW:759): `max-w-3xl w-full mx-auto px-4 py-6 space-y-6 animate-fade-up` -> ancho máx. 48 rem = **768 px** [TW], padding 16 px horizontal / 24 px vertical, **24 px** entre mensajes (`space-y-6`), animación de entrada del bloque `fade-up 0.22s cubic-bezier(0.22,1,0.36,1) backwards` (opacity 0->1, translateY 10 px->0; CSS:215-218,323).
- Fila de mensaje (MB:85): `flex gap-3 {justify-start|justify-end} animate-fade-up` -> 12 px entre avatar y burbuja; bot a la izquierda, usuario a la derecha; cada mensaje nuevo entra con el mismo fade-up.
- Los mensajes se apilan desde arriba (el contenedor no usa `flex-1`/`justify-end`), no hay agrupación por fecha ni separadores (`.chat-divider` está en CSS:940-958 pero no se usa en JSX).
- Auto-scroll: `scrollTo({top: scrollHeight, behavior:"smooth"})` en cada cambio de `messages`, `isTyping`, `phase`, `typedText` (CW:191-194).

### Inferences
- [INF] Fondo de la zona de chat = `--color-paper`; las burbujas del bot tienen el MISMO color que el fondo y solo se distinguen por el borde de 1 px (ver 5.1).

### Gaps
- Sin padding inferior extra salvo el `py-6` (24 px) de la lista; no hay espaciador para el teclado móvil.

---

## 5. Burbujas, avatar junto a la burbuja, metadatos, acciones

### 5.1 Takeaway
Burbuja del bot: transparente-al-fondo con borde hairline y radio 20 px parejo en las 4 esquinas, texto ink. Burbuja de usuario: sólida azul brand con texto blanco. Ambas con padding 12×14 px, 14.4 px/21.6 px, ancho máx. 78 % de la fila. Debajo de cada burbuja, una línea de metadatos mono en mayúsculas ("ASISTENTE · hh:mm" / "VOS · hh:mm"). Sin sombras.

### Cited findings

**Columna del mensaje `.chat-msg`** (CSS:890-895; MB:94): `display:flex; flex-direction:column; gap:0.4rem (6.4 px); max-width:min(78%, 46rem)`. El 78 % es relativo a la fila (ancho de la columna de 768−32 = 736 px como máximo) -> burbuja máx. ≈ 574 px en escritorio; en un móvil de 390 px: fila 358 px -> **máx. 279.2 px** de burbuja. [INF aritmética; `46rem`=736 px nunca limita porque la fila ≤ 736 px]. Usuario: `.chat-msg--user{align-self:flex-end; align-items:flex-end}` (CSS:916-919).

**Cuerpo `.chat-msg__body`** (CSS:907-915):
- `padding: 0.75rem 0.875rem` = **12 px vertical / 14 px horizontal**.
- `border: 1px solid var(--color-line)` (claro rgba(15,23,48,.12); oscuro rgba(234,240,250,.12)).
- `border-radius: var(--radius-card)` = **1.25 rem = 20 px en las 4 esquinas** (sin "cola"/esquina distinta, ni para bot ni para usuario).
- `background: var(--color-paper)` (#F0F4F9 / #070E20) **= mismo que el fondo de página**.
- `color: var(--color-ink)` (#0F1730 / #EAF0FA).
- `font-size: 0.9rem` = **14.4 px**; `line-height: 1.5` = **21.6 px**; peso heredado 400; fuente `--font-sans` PP Neue Montreal (CSS:78,196-199). Sin `box-shadow`, sin `letter-spacing` especial.
- Texto: `<p class="m-0 whitespace-pre-wrap">` (MB:96): respeta `\n` y espacios.
- **Usuario** `.chat-msg--user .chat-msg__body` (CSS:920-924): `background: var(--color-brand)` (#2F6BFF claro / #4D7DFF oscuro), `border-color` igual, `color:#ffffff`.

**Avatar junto a la burbuja del bot** (MB:86-92): `ChatBotAvatar size={32}`, `static={!speaking}` (dibujo único estático en reposo; animado solo mientras el bot "habla" ese mensaje), `reaction` = la reacción actual solo si `speaking`, si no `"idle"`. Va a la izquierda de la burbuja, 12 px de separación, alineado al borde superior de la fila ([INF]: SVG con `height=32` fijo no se estira en el flex). Aparece en **todos** los mensajes del bot (no solo el último). El usuario no tiene avatar. Detalle del avatar en sección 10.

**Metadatos `.chat-msg__meta`** (CSS:896-906,925-931; MB:123-130): línea debajo del cuerpo (separada 6.4 px por el `gap`): `display:flex; align-items:center; gap:0.5rem (8 px); font-family:var(--font-mono)` (ui-monospace, SFMono-Regular, Cascadia Mono, Segoe UI Mono, Menlo, Consolas, Liberation Mono; CSS:80); `font-size:0.563rem` = **9.01 px**; `font-weight:600`; `letter-spacing:0.18em`; `text-transform:uppercase`; color `--color-faint` (#7E8BA7 claro / #4E5F85 oscuro).
- Bot: punto `.ui-dot` de 0.375 rem = **6×6 px** circular, color `var(--color-brand)` (CSS:874-879; MB:124) + texto `Asistente · {hora}` (se renderiza en mayúsculas: "ASISTENTE · HH:MM"). Alineado a la izquierda.
- Usuario: sin punto; texto `Vos · {hora}` ("VOS · HH:MM"); `justify-content:flex-end` (alineado a la derecha); color `color-mix(in srgb, var(--color-ink) 55%, transparent)` (claro rgba(15,23,48,.55); oscuro rgba(234,240,250,.55)).
- Hora: `new Date(ts).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})` (MB:126-129).

**Cursor de tipeo dentro de la burbuja** (MB:98-104): `<span class="inline-block w-0.5 h-[1.05em] -mb-0.5 ml-0.5 align-middle animate-pulse-soft bg-brand-deep">` = barra de **2 px de ancho × 1.05 em de alto**, margen izq. 2 px, margen inf. −2 px, vertical-align middle; color `--color-brand-deep` (#1C44B6 / #2F55C0) para bot (para usuario `bg-[#070E20]`, pero el usuario nunca está en modo "typing"). Animación `pulse-soft 2s ease-in-out infinite`: opacity 1 -> 0.45 -> 1 (CSS:225-228,325). Se muestra solo mientras `typedText.length < message.text.length`.

**Efecto máquina de escribir** (CW:419-475): respuestas <=240 caracteres: 1 carácter cada 24 ms; >240: 2 caracteres cada 16 ms. Las acciones (chips, descarga, mapa, wizard) NO se muestran hasta terminar de escribir (`!typing`, MB:107). Tras terminar, +550 ms hasta quitar el estado "speaking" (avatar vuelve a estático).
Retardo previo del bot: 900 + rand×800 ms = 900–1700 ms (CW:294) sin ningún indicador visible.
[INF/bug visible] Al empezar, `typedText=""` y MB:75 usa `typedText || message.text`, por lo que en el primer frame (hasta el primer tick de 16–24 ms) se vería el texto completo antes de empezar a "escribirse".

**Acciones dentro de la columna de mensaje** (MB:107-122), todas con 8 px de margen superior (`mt-2` o `margin-top:0.5rem`) además del `gap` de 6.4 px de la columna:

1. **Chips** (`type:"chips"`, MB:36-56): wrapper `mt-2 flex flex-wrap items-center gap-2` (8 px). Título opcional `text-[10px] font-semibold uppercase tracking-wider text-muted` (10 px, peso 600, mayúsculas, `letter-spacing:0.05em` [TW], muted). Texto del título de chips relacionados: `También te puede servir:` (CW:284). Chip `.bubble-chip` (CSS:471-492): `inline-flex; align-items:center; padding:0.4rem 0.8rem (6.4 × 12.8 px); border:1px solid color-mix(line 85%, transparent); border-radius:9999px; background:var(--color-paper); color:var(--color-brand-deep); font-size:0.72rem (11.52 px); font-weight:600; line-height:1.2`; hover/focus: borde `--color-brand`, fondo `--color-primary-lighter` (#F5F8FF claro / #091230 oscuro), sombra none; transición .18s. El label del chip es la pregunta completa (p. ej. "¿Cómo puedo seguir mi expediente?"); al tocarlo se envía como mensaje de usuario (MB:47-48).
2. **Botón de wizard** (`type:"wizard"`, MB:58-71) `.bubble-wizard` (CSS:494-515): `inline-flex; align-items:center; gap:0.4rem (6.4 px); margin-top:0.5rem; padding:0.5rem 0.9rem (8 × 14.4 px); border:none; border-radius:9999px; background:var(--color-brand-deep); color:#fff; font-size:0.72rem; font-weight:600; line-height:1.2`; hover/focus bg `--color-brand`. Icono rayo SVG 16×16 stroke 1.8 (`M13 10V3L4 14h7v7l9-11h-7z`). Labels: "Iniciar asistencia paso a paso para la licencia" / "Asistirme a seguir mi expediente" / "Asistirme a pedir el certificado de servicios" (wizard.js:220-226).
3. **Botón de descarga** (`type:"download"`, MB:15-18): `mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-deep px-3 py-2 text-xs font-semibold text-paper transition-colors hover:bg-brand` -> radio 16 px, fondo brand-deep, padding 8 × 12 px, texto 12/16 px peso 600, color `text-paper` (#F0F4F9 en claro; en oscuro `--color-paper` = #070E20, o sea **texto casi negro sobre #2F55C0**), icono flecha-abajo SVG 16×16 stroke 1.8. Labels p. ej. "Descargar formulario de licencia", `Descargar "{título}" ({formato})` (knowledgeEngine.js:208).
4. **Tarjeta de ubicación** (`type:"location"`, MB:22-34): `mt-2 rounded-xl border border-line bg-paper p-3 text-xs text-ink shadow-sm` -> radio 16 px, borde 1 px line, fondo paper, padding 12 px, texto 12 px, `shadow-sm` [TW: `0 1px 3px 0 rgb(0 0 0/.1), 0 1px 2px -1px rgb(0 0 0/.1)`]. Contenido: `place` (peso 600, `m-0`), `address` (`mt-1` 4 px, muted), `hours` (`mt-1`, muted), enlace `mt-2 inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline` con icono pin SVG 16×16 stroke 1.8 + label "Buscar {oficina} en Google Maps" (abre `https://www.google.com/maps/search/?api=1&query=…`). Oficinas literales (knowledgeEngine.js:5-25 y mockMessages.js): Recursos Humanos – José María Uriburu 670; Legajos – Fotheringham 1360 (mockMessages dice "1.360"); Mesa de Entradas – Belgrano 878; Liquidaciones – Sarmiento 320; horario "Lunes a viernes, 07:00 a 13:00".

### Inferences
- [INF] Los botones `inline-flex` (wizard, descarga) y la tarjeta de ubicación son hijos de una columna flex (`.chat-msg`, `align-items` por defecto `stretch` en el bot) -> por semántica CSS se estiran al ancho de la columna del mensaje (ancho = el mayor entre el texto y el contenido, hasta el 78 %). El contenido del botón queda alineado a la izquierda. No verificado en navegador.
- [INF] Para el usuario (`align-items:flex-end`) la burbuja se ajusta al ancho de su contenido y se alinea a la derecha.
- [INF] `timestamp` en formato `es-AR`: el patrón (24 h vs 12 h "p. m.") depende de ICU del navegador; no determinable desde el código. Los datos de ejemplo usan "09:00".

### Gaps
- Formato exacto de hora (24 h / 12 h) no determinable.
- Los mensajes iniciales de `mockMessages.js` (`initialMessages`: "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. ¿En qué puedo ayudarte?" y "Podés consultarme sobre trámites, documentación requerida, guías de procedimientos o acceder a descargas de formularios.") **no se importan** en `ChatWindow` (CW:5 importa solo `botResponses`); `ChatContext` arranca con `messages=[]` (ChatContext.jsx: `useState([])`). No aparecen en pantalla.

---

## 6. Estados de UI existentes (typing, vacío, error, bienvenida) — `ChatContext.jsx`

### Takeaway
Solo existen: bienvenida/vacío (fase `welcome`), chat con historial, bot "escribiendo" (máquina de escribir), micrófono escuchando. No hay estados visuales de error de red, offline, ni carga con puntos/skeleton en el chat.

### Cited findings
- `ChatContext` expone solo `messages`, `addMessage`, `clearHistory`, `hasHistory` (ChatContext.jsx:~69-75 en la numeración del archivo). Cada mensaje: `{id, type:"bot"|"user", text, action, timestamp}`. Historial se persiste en localStorage solo para usuarios autenticados (últimos 400 mensajes); invitados: conversación efímera.
- Estados en `ChatWindow`: `phase` (`welcome`/`leaving`/`chat`), `isTyping` (inerte), `listening` (micrófono), `speakingId`/`typedText` (máquina de escribir), `reaction` (avatar) (CW:164-170).
- "Error": no hay UI; solo textos del bot. Mensajes de fallback literales (CW):
  - Con memoria de última respuesta: `No entendí del todo la consulta, pero vi que la última vez preguntabas sobre "{label}". ¿Retomamos eso?` + chips (CW:377).
  - Con último tema: `No entendí del todo la consulta, pero veo que la última vez estabas viendo {tema}. ¿Retomamos eso?` + chips (CW:382).
  - Sin memoria: `No entendí la consulta. ¿Podés reescribirla con otras palabras? O elegí una opción para empezar:` + 3 chips sin título: "¿Cómo puedo seguir mi expediente?", "¿Dónde puedo ver mi recibo de sueldo?", "¿Cómo solicito una licencia?" (CW:391; chatFollowUp.js:73-77,162-164).
  - Saludo personalizado antepuesto a la primera respuesta de una sesión autenticada: `Claro, {PrimerNombre}. ` + texto con primera letra en minúscula (CW:414).
  - Seguimiento de oficina: `Esperá, te acerco esa info: {oficina} atiende de {horario}, en {dirección}.` + tarjeta de ubicación (chatFollowUp.js:101).
- Textos de respuestas de ejemplo (`mockMessages.js` `botResponses`, solo los que alimentan `findIntent`): saludo "¡Hola! Puedo ayudarte con trámites, expedientes, recibos y documentación. ¿Qué necesitás?" (l.20); licencia (l.26) con botón de descarga; recibo (l.32) "Consultá tus recibos en MiPortal: https://www.formosa.gob.ar/miportal/login. Si no podés ingresar, llamá al 0800-555-1234."; trámite (l.37); expediente (l.43); RRHH (l.48) con ubicación; Legajos (l.55); formulario (l.62); ubicación/Mesa de Entradas (l.69); seguridad "Por seguridad, no compartas contraseñas, tokens, datos bancarios ni números completos de DNI o CUIL en este chat. …" (l.76, reacción `worried`); operador (l.80); gracias "¡De nada! ¿Necesitás algo más?" (l.85); despedida "¡Hasta luego! Podés volver cuando quieras." (l.89). La entrada `default` (l.92-95: "No entendí la consulta. Indicame el trámite o tema que necesitás resolver.") es ignorada por `findIntent` (CW:103) -> no se muestra.

### Gaps
- No existe pantalla/estado de offline o error de servidor (no hay llamadas de red en este flujo; el bot es local).

---

## 7. Wizard / pasos guiados

### Takeaway
El wizard no tiene UI propia: cada paso es un mensaje normal del bot con chips de opción; las respuestas del usuario aparecen como burbujas azules; el resultado final es un mensaje del bot con texto multilínea, y opcionalmente botón de descarga y tarjeta de ubicación. Sin barra de progreso ni contador de pasos.

### Cited findings
- Inicio: botón `.bubble-wizard` (5.1 punto 2) -> `startWizard` (CW:541-547) -> primer paso (CW:526-539, `addMessage("bot", step.question, {type:"chips", options})`, chips **sin título**).
- Contenido literal (`src/data/wizard.js`):
  - **Licencia** (l.1-39): P1 "¿Qué tipo de licencia necesitás?" chips ["Licencia anual ordinaria","Por enfermedad","Por estudio"]; P2 "¿Ya tenés descargado el formulario de solicitud?" chips ["Sí, lo tengo","Todavía no, descargarlo"]; final: "Perfecto. Para tu {tipo} seguí estos pasos:\n1) Descargá y completá el Formulario de Licencia Anual con tus datos.\n2) Presentalo en Mesa de Entradas (Belgrano 878) con 15 días hábiles de anticipación.\n3) Seguí el estado de la solicitud por SIGED hasta la notificación de aprobación." (+ línea extra insertada en pos. 2 si "enfermedad": "Adjuntá el certificado médico dentro de las 48 horas de iniciada la licencia."; si "estudio": "Adjuntá el certificado de inscripción o constancia de cursada.").
  - **Expediente** (l.41-90): P1 "¿Tenés a mano el número de expediente?" ["Sí, lo tengo","No lo tengo"]; P2 "¿Desde dónde lo vas a consultar?" ["Desde SIGED (web)","Desde MiPortal","Presencial en Mesa de Entradas"]; final con viñetas "•" ("Perfecto, con el número de expediente podés seguir el avance así:", "• Ingresá a SIGED con tu usuario y clave personal en la sección Seguimiento de Expedientes.", "• Cargá el número de expediente para ver el estado y las actuaciones.", "• Pasá por Mesa de Entradas (Belgrano 878) con el número de expediente y tu DNI.", "• Si preferís MiPortal, …", "Dudas: Departamento de Sistemas, interno 4567."; variante sin número: "Sin el número de expediente no se puede consultar el estado. Lo vas a encontrar en la constancia que te entregó Mesa de Entradas al iniciar el trámite.").
  - **Certificado** (l.91-120): P1 "¿Para qué necesitás el certificado de servicios?" ["Jubilación / trámite previsional","Préstamo o banco","Otro trámite"]; P2 "¿Ya pediste turno en el Departamento de Legajos?" ["Sí, tengo turno","Todavía no"]; final: "El certificado de servicios se emite en el Departamento de Legajos.\n• Presentá tu DNI y, si corresponde, avisá que es para jubilación o préstamo.\n• La emisión tarda entre 5 y 10 días hábiles.\n• El certificado detalla tu antigüedad, cargos desempeñados y régimen horario.\nNecesitás turno previo: podés pedirlo por teléfono al interno 4567 o directamente en la oficina."
- Mientras hay wizard activo, lo que el usuario escriba/toque se toma como respuesta del paso (CW:484-487,549-569). El resultado final puede añadir botón de descarga + tarjeta de ubicación (CW:571-594).

### Inferences
- [INF/discrepancia de texto visible] `finishWizard` pasa `w.data` con claves `step0`,`step1` (CW:554) pero los `summary(answers)` leen `answers[0]`,`answers[1]` (wizard.js:114,157-158) -> en la práctica `tipo` cae a "licencia" ("Perfecto. Para tu licencia seguí estos pasos:") y el wizard de expediente tomaría siempre la rama "Sin el número de expediente…". Es un bug de lógica con efecto en el texto visible; la app móvil debería decidir cuál texto replicar.

### Gaps
- Sin indicador de progreso de pasos (no existe).

---

## 8. Barra de entrada (input bar)

### Takeaway
Tarjeta flotante redondeada (radio 20 px, borde hairline, sombra grande suave) centrada, ancho máx. 672 px, con lupa decorativa a la izquierda, campo de texto sin borde, botón de micrófono (solo si el navegador soporta SpeechRecognition) y botón enviar circular azul que solo aparece cuando hay texto.

### Cited findings
- Wrapper CW:775: `p-4 sm:pb-6 pt-2 bg-transparent shrink-0` (ver sección 1).
- Form `.chatap-floating-bar` + `max-w-2xl mx-auto` (CW:776; CSS:733-757): `position:relative; display:flex; align-items:center; width:100%; border-radius:1.25rem (20 px); background:color-mix(in srgb, var(--color-paper) 96%, transparent); border:1px solid color-mix(in srgb, var(--color-line) 85%, transparent); box-shadow:0 10px 30px -5px rgba(0,0,0,0.1); padding:0.4rem 0.6rem 0.4rem 1rem (6.4 / 9.6 / 6.4 / 16 px)`. El CSS pone `max-width:44rem` pero la utilidad `max-w-2xl` (**42 rem = 672 px**) gana por capa `utilities` [INF capa; TW].
  Oscuro: `background:#141518; border-color:rgba(255,255,255,0.12); box-shadow:0 12px 35px -5px rgba(0,0,0,0.55)` (CSS:748-752).
  Foco (`:focus-within`): `border-color: var(--color-brand)`; `box-shadow:0 12px 32px -5px rgba(var(--color-brand-rgb, 14,165,233), 0.2)` — `--color-brand-rgb` **no está definida en ningún lado** (grep) => cae al fallback `14,165,233` (celeste sky) al 20 % (CSS:754-757).
- **Lupa** (CW:778-782): `<span class="text-muted/70 pl-2 pr-1 flex items-center justify-center shrink-0 pointer-events-none">` -> SVG 20×20 (`w-5 h-5`) stroke 2, color muted al 70 %, padding izq. 8 px / der. 4 px.
- **Input** (CW:785-792; CSS:759-774): `type=text`, `required`, `flex:1; min-width:0; height:2.75rem (44 px); padding:0 0.75rem (12 px); background:transparent; border:0; outline:none; color:var(--color-ink); font-size:0.875rem (14 px); font-weight:500`. Placeholder: **`Escribí tu consulta aquí…`** (o **`Escuchando tu voz…`** mientras dicta), color `--color-faint` (#7E8BA7 claro / #4E5F85 oscuro). `aria-label="Consulta para ChatAP"`.
- **Micrófono** (CW:795-812): solo si `window.SpeechRecognition || webkitSpeechRecognition` (CW:185-189; p. ej. ausente en Firefox). Botón `p-2 rounded-xl transition-all` -> 8 px de padding + icono SVG 20×20 = **36×36 px**, radio 16 px. Reposo: `text-muted hover:text-ink hover:bg-mist`. Escuchando: `text-bad bg-bad/10 animate-pulse` -> icono #d82f2f, fondo rojo al 10 %, parpadeo opacity 1->0.5 cada 2 s [TW animate-pulse]. Icono micrófono outline: rect x=9,y=3,w=6,h=11,rx=3 + arco `M5 11a7 7 0 0014 0M12 18v3m-4 0h8`, stroke 2. `title`/`aria-label`: "Hablar con el asistente" / "Detener dictado".
- **Enviar** (CW:815-828): `ml-1 p-2 rounded-xl flex items-center justify-center transition-all` + icono flecha-arriba SVG 16×16 stroke **2.5** (`m5 12l7-7l7 7m-7 7V5`) -> botón **32×32 px**, radio 16 px (círculo). Con texto: `bg-brand text-white hover:bg-brand-deep shadow-xs` (#2F6BFF / #4D7DFF; `shadow-xs` [TW] `0 1px 2px 0 rgb(0 0 0/.05)`). Sin texto: `opacity-0 pointer-events-none w-0 p-0 overflow-hidden` (colapsa a ancho 0; solo queda el `ml-1` de 4 px) con `transition-all`. `aria-label="Enviar consulta"`, `disabled` si input vacío.
- **Alto total** de la tarjeta = 44 (input) + 12.8 (padding vert.) + 2 (borde) = **58.8 px**.
- Cuando se escribe, el controlador del avatar a veces hace reaccionar al bot ("attention") tras 800 ms de pausa (CW:501-509).
- No hay botón de adjuntar archivos.

### Inferences
- [INF] El foco del input produce un halo celeste (fallback sky) y no azul brand; es probablemente un descuido del autor, pero es lo que se renderiza hoy.

### Gaps
- Comportamiento del teclado virtual (resize/pan) no está tratado en código; depende del navegador (ver sección 9).

---

## 9. Comportamiento móvil (<=768 / 640 / 480) y diferencias con escritorio

### Takeaway
No hay reglas `@media` específicas del chat. El único breakpoint relevante es `sm` = 640 px (Tailwind); pantalla completa siempre; sin safe-area; altura 100vh.

### Cited findings
- Breakpoints usados en el chat: solo `sm:` (>=640 px): header `px-4`->`sm:px-6` (16->24 px) (CW:664); saludo 16->18 px (CW:714); h1 24->30 px (CW:719); subtítulo 12->14 px (CW:725); wrapper de entrada `sm:pb-6` (16->24 px) (CW:775). Navbar: `top` 16->20 px a 640 px (CSS:2179-2183); a 768 px (`md`) aparecen links GooeyNav + divisores y desaparece el hamburguesa; `gap`/padding de la píldora cambian (CSS:2199-2204).
- No hay `@media (max-width: 768px|640px|480px)` que afecte a clases del chat: las únicas reglas `max-width` encontradas en `index.css` relacionadas son `.quick-replies-grid` a 640 px (1 columna; CSS:465-469, **componente no usado**) y `.container-ia-chat` a 480 px (CSS:820-824, **clase no usada**).
- Pantalla completa: `h-screen` = 100vh; fija el input abajo porque la columna es `flex-col` con el área de mensajes `flex-1 overflow-y-auto` y el wrapper de input `shrink-0` (no usa `position:fixed`).
- Sin `env(safe-area-inset-*)`, sin `dvh`/`svh` en el chat (sí se usa `svh` en otras páginas: LoginRegisterPage.jsx:208, HomePage.jsx:168, hero CSS:1974,1978).
- `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (sin `viewport-fit=cover`) y `theme-color` `#070E20` (oscuro) / `#F0F4F9` (claro) (index.html).
- Medidas derivadas para un móvil de 390 px de ancho [INF aritmética con los valores citados]: fila de mensajes 358 px; burbuja máx. 279.2 px (texto útil ≈ 249 px); tarjeta de entrada 358 px; área mensajes alto = 100vh − 56 − 8 − 58.8 − 16 = 100vh − 138.8 px.
- Hover: no hay estilos táctiles específicos; los efectos `:hover` (píldoras elevan 1.5 px, chips, botones) son de puntero. `:active` solo en píldoras de bienvenida (scale .98).
- `prefers-reduced-motion: reduce` desactiva animaciones/transiciones globalmente (duración 0.01 ms; CSS:1951-1957) y el avatar pasa a dibujo estático (ChatBotAvatar.jsx:264-279,357-361).
- Sacudida de tema: transición `background-color/border-color/color 0.2s ease` en `body`, `.bg-paper`, `.bg-mist`, `.border-line`, `header`, `input`… (CSS:287-301).
- Efecto global `ClickSpark`: envuelve toda la app (App.jsx:16) y dibuja chispas en un canvas al hacer clic/tap: color `#FFFFFF` en oscuro / `#2F6BFF` en claro, 8 chispas, tamaño 10, radio 18, 420 ms (ClickSpark.jsx:8-76 defaults).

### Inferences
- [INF] En móviles con barra de navegador dinámica, `100vh` mayor que el viewport visible puede dejar la barra de entrada parcialmente oculta bajo la barra del navegador, y no hay padding para la zona del indicador de inicio (home bar) ni teclado.
- [INF] Para una app nativa: replicar como pantalla completa, columna única, header de 56 pt (vacío con 2 botones a la derecha), lista con padding 16, barra de entrada con margen 16 (8 arriba, 16 abajo) y respetando safe area del sistema (el original no lo hace).

### Gaps
- No existe diseño distinto para móvil que se pueda extraer; lo anterior es todo el "responsive".

---

## 10. Avatar animado "bloub" (solo salida visual)

### Takeaway
Un círculo sólido (tinta oscura en tema claro, casi-blanco en tema oscuro) con dos ojos en forma de cápsula vertical del color inverso; sin boca, sin marco. Cambia de expresión (forma/inclinación de los ojos y orientación de la cabeza) y de forma (puntos "...", signo "!", óvalo, hexágono, triángulo, etc.). Se usa a 92 px en la bienvenida y a 32 px junto a cada burbuja del bot.

### Cited findings

**Componente y tamaños** — `src/components/ChatBotAvatar.jsx`:
- SVG cuadrado `width=height=size`, `viewBox = -158 -158 316 316` (`DEMI_VIEWBOX=158`, repere.ts:200). El radio de la bola en reposo es 100 unidades (`RAYON=100`, repere.ts:190), o sea **diámetro de la bola = 200/316 = 63.3 % del lado del SVG**; el resto es margen para anillos/decoración.
  - `size=92` (bienvenida, CW:709): lado 92 px, bola de ≈ **58.2 px** de diámetro.
  - `size=32` (junto a cada burbuja, MB:88): lado 32 px, bola de ≈ **20.3 px**.
  - `size=44` es el default (ChatBotAvatar.jsx:190), usado en otros lugares (p. ej. onboarding), no en el chat.
- Colores (ChatBotAvatar.jsx:8-9,209-216, 447-449; index.css): cuerpo = `--bot-body`: **#0F1730 (claro)** / **#EAF0FA (oscuro)** (CSS:111,174); ojos = `--bot-eye`: **#F0F4F9 (claro)** / **#0F1730 (oscuro)** (CSS:112,175). Fallbacks en JS: cuerpo `#0a0a0c`, ojos `#ffffff`. Los puntos decorativos usan el color del cuerpo. Se actualizan en vivo al cambiar de tema (MutationObserver, l.282-286). `fill-opacity`=1.
- "Skin"/forma: solo `cercle` (radii todos 1, skins.ts:80,97). Paleta `COLORS` del personalizador (encre #0a0a0c, brun #8b5e3c, rouge #e8483f, orange #f08a24, ambre #f0b429, vert #3ecf8e, turquoise #2fbfa0, bleu #3b93f0, violet #8b5cf6, rose #e152b0, gris #a3a3a3, creme #f1efe9; skins.ts:119-132) y `SHAPES` (cercle, galet, squircle, capsule, triangle, hexagone, nuage, goutte; skins.ts:79-92) **no se usan en el avatar del chat**.
- Sin sombra, sin borde, sin fondo. Clases en el `<svg>`: `block`, `animate-speak` si habla, `rx-*` si hay transformación, `opacity-70` si duerme (l.445).

**Cara neutral (reposo)** — face.ts:221-224, states.ts:66-69: 2 ojos = cápsulas (rect con radio = min(w,h)/2, `capsulePath` shape.ts:296-309) de **0.186 × 0.412 radios** (18.6 × 41.2 unidades de 200 de diámetro de bola => ancho ≈ 9.3 % y alto ≈ 20.6 % del diámetro de la bola), colocados sobre una esfera a ±15.46° de la dirección de mirada (separación entre centros ≈ 2×26.7 = 53.3 unidades). En px: a size 92: cada ojo ≈ 5.4 × 12.0 px, separación entre centros ≈ 15.5 px; a size 32: ≈ 1.9 × 4.2 px, separación ≈ 5.4 px [INF aritmética: unidad = size/316 px]. Los ojos se desplazan/comprimen según hacia dónde mire la cabeza (proyección de esfera: el ojo más lejano del centro se ve más angosto/inclinado).
Vida en reposo (face.ts:313-378): parpadeo cada 1.9–4.6 s (dura 0.18 s; a veces doble parpadeo, 18 %); deriva suave de la mirada (±~7° yaw, ±~5.5° pitch, ±2.2° roll); flotación mínima del centro (±0.006/0.007 radios) y "respiración" ±0.5 % en alto. Parpadeo = aplastamiento vertical del ojo hasta 6 % (`blinkScale`: 0.06 + 0.94·lid).
Seguimiento del cursor (solo escritorio con mouse, solo avatar animado de 92 px; el de 32 px estático no sigue): hasta ±35° yaw y ±28° pitch (ChatBotAvatar.jsx:89-90,331-349); en móvil/táctil el avatar solo "divaga" (wander).
Avatares de 32 px junto a burbujas (`static`): se dibuja **una sola imagen** del estado `idle` en t=1 s con la reacción `idle` (ChatBotAvatar.jsx:266-279; `POSES.idle=1`, states.ts:584): bola + 2 ojos abiertos mirando casi de frente (con la deriva de t=1 s). Cuando ese mensaje está "hablando": pasa a animado + clase `animate-speak` (CSS:360,977-982: `speak 0.9s ease-in-out infinite`, el SVG sube hasta 2 px y escala 1.03; ciclo 0 %/50 % posición base, 25 % -2px/1.03, 75 % -1px/1.02) y toma la reacción actual.

**Expresiones (16)** — `src/bloub/expressions.ts:59-168`. Cada una: orientación de cabeza (yaw°, pitch°, roll°; yaw>0 mira a la derecha, pitch>0 mira arriba por la doc. de face.ts / ojo), separación `split°`, y por ojo `[w, h, tilt°, open]` en radios de bola (ojo 1 / ojo 2; `pair()` = espejo: el segundo ojo usa −tilt). `tilt>0` = la parte superior de la cápsula se inclina a la derecha.
| id | cabeza (yaw,pitch,roll) | split | ojos [w,h,tilt,open] | Aspecto |
|---|---|---|---|---|
| neutre | 0,0,0 | 15.46 | 0.186×0.412 | cápsulas verticales normales |
| attentif | 4,5,−4 | 16 | 0.21×0.44 | cápsulas algo más grandes, cabeza levemente ladeada |
| surpris | 3,−3,0 | 19 | 0.45×0.47 | ojos grandes casi redondos |
| excite | 6,−14,0 | 19.5 | 0.40×0.56, tilt −10 | ojos grandes, ligeramente inclinados, cabeza hacia arriba |
| heureux | 5,9,0 | 17 | 0.27×0.17, tilt 14 | ojos achicados/arqueados (sonrisa) |
| hilare | 4,14,0 | 18 | 0.34×0.13, tilt 20 | ojos muy planos y arqueados (risa) |
| colere | 3,7,0 | 17 | 0.34×0.15, tilt 30 | ojos finos con los extremos superiores hacia el centro (ceño) |
| triste | 3,−13,0 | 16 | 0.22×0.40, tilt −28 | cápsulas con los extremos superiores hacia afuera, mirada caída |
| effraye | 2,−20,0 | 20.5 | 0.40×0.60 | ojos grandes y altos, muy separados |
| mefiant | 12,6,−6 | 16 | [0.21×0.40] / [0.22×0.15] | un ojo abierto y otro entrecerrado |
| confus | −14,3,8 | 16.5 | [0.20×0.44, tilt −18] / [0.28×0.17, tilt 14] | ojos dispares |
| curieux | 16,−9,−15 | 16.5 | [0.24×0.46, −8] / [0.20×0.38, −8] | cabeza inclinada, ojos algo distintos |
| fier | 5,17,0 | 17 | 0.30×0.15, tilt 18 | ojos achicados, mentón arriba |
| timide | −19,−14,−7 | 14 | 0.17×0.30 | ojos chicos juntos, mirada al costado y abajo |
| blase | −22,2,0 | 16 | 0.30×0.12 | ranuras horizontales, mirada lateral |
| somnolent | 6,−9,−3 | 16 | 0.20×0.42, open 0.42 | párpados a medio cerrar |
Además `sleeping` (ChatBotAvatar.jsx:18-26): cabeza (4,−6,−3), ojos 0.2×0.42 con `open:0` -> ojos cerrados = rayas finas horizontales (6 % de alto), SVG con `opacity-70`, y overlay "Zzz" (ver abajo).

**Estados de cuerpo (`STATES`, states.ts:206-573; POSES de captura states.ts:583-599)** — forma/aspecto resultante:
- `idle`: bola + cara (expresión elegida).
- `thinking` (reacción `thinking`): **tres puntos en fila** (sin ojos): radio 0.165 radios (16.5 u), centros x = −55.7 / −1.3 / +53.2 u, y=0; cada uno pulsa hasta ×1.25 de tamaño y opacidad 0.55->1 con onda de izquierda a derecha (período 1.5 s, desfase 0.5 s).
- `wink` (reacción `wink`): ojo izq. cápsula 0.236×0.464 y ojo der. convertido en **guion horizontal** 0.447×0.089; cabeza (−5.37, 4.55, 6.7), split 16.25.
- `wide` (reacción `surprised`): ojos muy grandes 0.356×0.875, cabeza (6.92, −21.96, 11.6), split 18.43.
- `alert` (reacción `alert`/`fierce`): signo **"!" inclinado 17.7°** (barra cápsula 0.269×0.776 + punto en gota r 0.118) que se desliza horizontalmente (−0.087->+0.732 radios en 1.5 s) y vuelve; sin ojos; cuerpo en tinta.
- `notify` (reacción `notify`): ojos grandes ~0.505×0.498, mirada desviada, cabeza (−21.94, −5.82, −12.2); el motor calcula una pastilla azul `#2496e8` (r 0.15, ángulo −42°, distancia 1.003, pop ×1.14; decor.ts:274-285) **pero el componente web no la dibuja** (se ve solo la cara de ojos grandes).
- `exclaim` (reacción `exclaim`): signo **"!" vertical** (barra troncocónica: círculo superior r 0.132 en y=−0.505, inferior r 0.075 en y=0.13; punto r 0.113 en y=0.526); sin ojos.
- `sleep` (estado): bola pequeña r 0.1585 que rebota (±0.19 en y, período 0.6 s), sin ojos (el avatar usa `sleep` como *expresión* custom, no este estado; ver `sleeping`).
- `egg` (óvalo, perfil medido; cabeza (19.97, 26.01, −17.1), ojos 0.164×0.385), `hexagon` (hexágono de esquinas muy redondeadas, ojos 0.177×0.411), `play` (**triángulo** apuntando arriba con ojos 0.18×0.34; los arcos "swoosh" no se dibujan en web), `orbit` (triángulo que gira y se relaja a bola; **anillos no se dibujan en web**), `swirl`, `burst` (bola que se colapsa a r 0.166 y regresa, con 5 partículas puntuales en espiral que entran al centro; sí se dibujan los puntos), `comet` (punto r 0.129 que oscila; **estelas no se dibujan en web**).
- Duración/morph entre estados: 0.3–0.6 s con ease-out (states.ts, `morph`), clignotement para disimular el cambio en varios estados.

**Mapa reacción -> apariencia** (`REACTION_CONFIG`, ChatBotAvatar.jsx:28-86): `idle` (mirada vagando), `blink`, `lookLeft/Right/Up/Down/Around` (yaw ±35°, pitch ∓20/20°, giro 360°), `tilt/tiltLeft/tiltRight` (clase `rx-tilt`), `bounce/microBounce` (`rx-bounce`), `squash/microSquash`, `stretch`, `wink`, `surprised`->wide, `thinking`, `attention`->attentif, `happy`->heureux, `excited`->excite (+idle), `proud`->fier, `shy`->timide, `relieved`->heureux atenuado, `worried`/`apologetic`->triste, `confus`, `curious`->curieux, `angry`->colere, `scared`->effraye, `bored`->blase, `sleepy`->somnolent, `suspicious`->mefiant, `fierce`->colere+alert, `notify`, `exclaim`, `playful` (wink+excite), `nod`/`shake` (solo mirada), `sleep` (ojos cerrados), `hilare`, `giggle`, `cheer`, `peek`, `intrigued`, `glee`, `smug`, `amazed`, `celebrate`, `play`, `orbit`, `swirl`, `burst`, `egg`, `hexagon`, `comet`, `alert`.
Transformaciones CSS aplicadas al SVG entero cuando no habla y sin reduced-motion (CSS:984-1005,1014-1019): `rx-tilt` (rota 0°->−9°(40 %)->4°(70 %)->0°, 0.9 s ease-in-out), `rx-bounce` (translateY 0 -> −12 % (30 %) -> 0 (55 %) -> −5 % (75 %) -> 0, 0.8 s), `rx-squash` (scale 1.08,0.84 a 45 %, 0.8 s), `rx-stretch` (scale 0.92,1.12 a 45 %, 0.8 s).
Autoreacciones decorativas: cuando la reacción es `idle` y el avatar no es estático, elige al azar de un pool de ~43 reacciones (ChatBotAvatar.jsx:92-135): espera 1.5–3.3 s, la mantiene 1.1–1.9 s, descansa 2.2–4 s, y repite (l.400-433). El `BotReactionController` además emite secuencias de reposo ("curious", "bored", "happy", "sleepy", "alert"…) con tiempos por paso (BotReactionController.js:59-118, 241-345).
Eventos del chat -> reacción visible del avatar grande de bienvenida / del avatar del mensaje que habla: al enviar mensaje del usuario (saludo -> pool greeting; "gracias" -> happy; "urgente/ayuda/necesito" -> concern; etc.), `botThinking` (pool thinking: thinking, lookLeft/Right…), `botResponding` (pool según tono: proud si hay descarga, happy si hay mapa, concern si seguridad, apologetic si "no encontr…"), `botSuccess` (happy -> nod), `botConcern` (worried/confus). Pool completo en BotReactionController.js:124-190.
Sueño por inactividad (BotReactionController.js:~243-345): tras **10 s** sin actividad empieza a cabecear (`sleepy`), tras **15 s** emite `sleep` (ojos cerrados + Zzz); solo mientras `conversationCount === 0` (antes del primer mensaje). Se despierta con `surprised` -> `stretch` -> `nod`. (El comentario en ChatBotAvatar.jsx:15-17 dice "5 minutos"; el valor efectivo del controlador es 15 s.)
**Overlay Zzz** (ChatBotAvatar.jsx:172-186, 461-467; CSS:1007-1029): tres letras "Z", "z", "z" de peso 700 en `var(--color-muted)`; tamaños = `size×0.38`, ×0.8, ×0.6 (a size 92: 34.96 / 27.97 / 20.98 px); posición del grupo `top: −0.15·size; right: −0.1·size`; animación `zzFloat 2.4s ease-in-out infinite` (aparece 0->1 sube/derecha hasta ≈(+14 px, −40 px), escala 0.6->1.1->0.8 y se desvanece), escalonadas 0 / 0.6 / 1.2 s.

### Inferences
- [INF] Para móvil nativo bastaría implementar: círculo + 2 cápsulas, parpadeo, 16 expresiones por (w,h,tilt,open,gaze), y los estados "…" (thinking) y "!" (exclaim/alert); no existe ningún signo de pregunta ni boca; los efectos de anillos/estela/pastilla azul no se ven en la web (el avatar web ignora `arcs`/`notif`).
- [INF] El tamaño del cuerpo es ≈63 % del lado del SVG: si la app móvil usa un contenedor de 32/92 pt, la bola real mide 20.3/58.2 pt.

### Gaps
- No se extrajo la geometría exacta de `egg`, `hexagon`, `triangle` (perfiles radiales tabulados de 64 muestras en profiles.ts:156-166; no reproducibles "a ojo" sin el script); para fidelidad total reutilizar esos arrays o los SVG generados.
- Tono exacto del giro de mirada con `look` en cada reacción y mezcla (`mix`) no se detalló (lógica del motor, fuera de alcance).

---

## 11. Tema claro vs oscuro (tokens usados en el chat)

### Takeaway
Dos paletas azul-pizarra; el default es oscuro (script de `index.html`). La burbuja del bot y el fondo comparten color; el acento es el azul brand.

### Cited findings (CSS:84-112 claro; 160-182 oscuro)
| Token | Claro | Oscuro | Usos en el chat |
|---|---|---|---|
| `--color-paper` | #F0F4F9 | #070E20 | fondo de página/chat, fondo burbuja bot, fondo chips |
| `--color-ink` | #0F1730 | #EAF0FA | texto principal, h1, input |
| `--color-mist` | #E2EAF4 | #0D1730 | hover botones header / mic |
| `--color-soft` | #D5E2F1 | #132247 | (no usado en el chat) |
| `--color-line` | rgba(15,23,48,0.12) | rgba(234,240,250,0.12) | bordes burbuja bot, header buttons |
| `--color-muted` | #4A5578 | #8A9BC0 | saludo, subtítulo, icono lupa/mic, direcciones |
| `--color-faint` | #7E8BA7 | #4E5F85 | placeholder, metadatos |
| `--color-brand` | #2F6BFF | #4D7DFF | burbuja usuario, punto bot, botón enviar, foco |
| `--color-brand-dark` | #2558E0 | #3A6AE0 | (nav CTA hover) |
| `--color-brand-deep` | #1C44B6 | #2F55C0 | chips (texto), botones wizard/descarga (fondo), cursor |
| `--color-primary-lighter` | #F5F8FF | #091230 | hover de chips |
| `--color-ok` | #18bc42 | #18bc42 | (iconos de documentos; no usado en el chat activo) |
| `--color-bad` | #d82f2f | #d82f2f | micrófono "escuchando" |
| `--bot-body` / `--bot-eye` | #0F1730 / #F0F4F9 | #EAF0FA / #0F1730 | avatar |
- Barra de entrada oscura usa `#141518` literal (no un token) y sombra más densa (CSS:748-752); píldoras de bienvenida oscuras usan blancos translúcidos (CSS:710-727).
- Sombras en general: `--shadow-soft/hover: none` (CSS:151-152) ("estética Swiss"): las burbujas y chips no tienen sombra; solo píldoras de bienvenida, barra de entrada, tarjeta de ubicación y píldora de navegación.
- Tipografía: "PP Neue Montreal" (pesos 250,350,400,500,600,700,900 + itálica 400; CSS:4-52) y "PP Neue Montreal Text" (400,500; CSS:54-65); `font-sans` = PP Neue Montreal -> PP Neue Montreal Text -> ui-sans-serif -> system-ui… (CSS:78); `font-mono` = ui-monospace… (CSS:80). `body` con `antialiased`, `font-feature-settings:"cv03","cv04","cv09","cv11"` (CSS:196-199). Los archivos de fuente son `.woff2` en `/public/fonts` (precargados Regular/Bold/Medium/Black en index.html).
- Selección de texto: fondo #2F6BFF, texto blanco (CSS:204-207; index.html).
- Foco de teclado global: `outline:1px solid var(--color-brand); outline-offset:2px` (CSS:209-212), pero el input lo anula (`outline:none`).

### Gaps
- Verificar contraste real del texto `text-paper` en botón de descarga en oscuro (#070E20 sobre #2F55C0) — parece una inconsistencia; no se corrigió en la rama.

---

## 12. Markdown / contenido rico dentro de burbujas

### Takeaway
No hay renderizado de Markdown/HTML. Solo texto plano con saltos de línea, más las "acciones" estructuradas (chips, botón wizard, botón descarga, tarjeta de ubicación) debajo del texto.

### Cited findings
- Texto: `<p className="m-0 whitespace-pre-wrap">{shown}</p>` (MB:96): sin parser. Sin estilos de negrita, cursiva, listas, `code`, citas o tablas. `.chat-msg .mono-link` (subrayado 1 px, offset 2 px, color brand / blanco en usuario; CSS:932-938) está definido pero **sin uso**.
- URLs (ej. "https://www.formosa.gob.ar/miportal/login", mockMessages.js:32) se muestran como texto plano no clickeable en la burbuja.
- Listas: se simulan con `\n` + `•` o `1) 2) 3)` en el propio string (wizard.js).
- Tipos de acción soportados por `MessageBubble`: `chips`, `wizard`, `download`, `location` (MB:107-122); cualquier otro `type` no renderiza nada. `message.actions` puede ser array o `message.action` único (MB:78-82).

### Gaps
- Nada más; no hay contenido enriquecido adicional.

---

## 13. Resumen de medidas clave para replicar (hoja rápida)

- Pantalla: columna única 100 % alto; fondo paper; header vacío 56 px con 2 botones 36×36 (radio 16, borde 1 px line, iconos 16 px) a la derecha, padding 16 (24 desde 640).
- Lista: ancho máx. 768, padding 16 H / 24 V, separación entre mensajes 24, fila `gap` 12 entre avatar(32) y burbuja.
- Burbuja: radio 20 (todas las esquinas), padding 12×14, borde 1 px, fuente 14.4/21.6; bot = fondo paper + texto ink + borde line; usuario = fondo brand + texto blanco; ancho máx. 78 % de la fila; sin sombra.
- Meta: mono 9.01 px, peso 600, tracking 0.18 em, MAYÚSCULAS, color faint; bot: punto brand 6 px + "ASISTENTE · hh:mm" a la izquierda; usuario: "VOS · hh:mm" a la derecha (55 % ink).
- Chips: píldora 11.52 px/600, padding 6.4×12.8, borde 1 px, texto brand-deep, fondo paper; botón wizard: píldora brand-deep, texto blanco 11.52/600, padding 8×14.4, icono rayo 16.
- Bienvenida: avatar 92, "Hola," 16/24 (500, muted), h1 24/32 (800->Black, ink, -0.025em), subtítulo 12/16 muted máx. 448, 6 píldoras (13 px/600, padding 8.8×18.4, gap 10, máx. 576).
- Entrada: tarjeta radio 20, altura 58.8, máx. 672, padding 6.4/9.6/6.4/16, lupa 20 muted/70, input 14/500 altura 44 placeholder faint "Escribí tu consulta aquí…", mic 36×36 (rojo al escuchar), enviar 32×32 circular brand con flecha arriba (solo con texto); wrapper padding 8/16/16 (24 desde 640 px).
- Animaciones: aparición de cada mensaje `fade-up` 0.22 s (translateY 10 px); cursor de tipeo `pulse-soft` 2 s; escritura 1 car./24 ms (2 car./16 ms si >240); bienvenida->chat: fade+scale 0.95 en 300 ms, cambio de fase a 480 ms.

---

## Apéndice A. Componentes NO usados en `/chat` (código muerto en esta rama), valores por si se quieren

Todos por `grep` sin importadores (ver Hallazgo 0.1). Fuentes: archivos en `src/components/ciudadano/` (líneas relativas al archivo).

**QuickReplies.jsx** (+CSS:364-469): título de sección `.quick-replies-title` (`0.68rem`, peso 700, `letter-spacing:0.12em`, mayúsculas, centrado, muted, margen inferior 0.875rem) con textos "Continuá donde quedaste" y "Preguntas frecuentes" (l.~56,68); grilla `.quick-replies-grid` 2 columnas, `gap:0.625rem`, 1 columna a <=640 px; tarjeta `.quick-reply-card` (flex, `min-height:4.25rem`, padding `0.75rem 0.875rem`, gap 0.75rem, borde 1px color-mix(line 80%), radio 20 px, fondo color-mix(paper 86%), hover borde brand + fondo primary-lighter + translateY(−1px)); icono circular 2.5 rem (`primary-light`, color brand-deep, SVG 1.2 rem); `label` 0.76 rem/700; `description` 0.68 rem muted; flecha 1 rem faint. 4 opciones literales: "¿Cómo sigo mi expediente?" / "Consultá el estado de tu trámite"; "¿Cómo pido una licencia?" / "Conocé los pasos y requisitos"; "¿Dónde veo mi recibo?" / "Accedé a tus recibos de haberes"; "¿Dónde atienden?" / "Encontrá oficinas y horarios".

**DocumentCard.jsx**: fila `flex items-center gap-4 p-4 bg-paper border border-line` (esquinas rectas), hover borde brand + translateY(−2px); icono cuadrado 40×40 (`bg-brand` para PDF/DOC con texto "PDF"/"DOC" 10 px bold; `bg-ok` para XLS); título `text-sm font-bold uppercase tracking-wide truncate`; descripción `text-xs text-muted truncate`; metadatos 10 px mayúsculas separados por "|"; botón "Descargar" (`px-4 py-2 text-xs font-bold uppercase bg-brand-deep text-paper`, sin radio).

**DownloadSection.jsx**: `<section class="bg-paper border border-line">`; cabecera con kicker "Documentos" (10 px, semibold, mayúsculas, `tracking-widest`, brand-deep) y título "Descargas" (`text-xl font-bold uppercase tracking-wide`); filtros por categoría como botones rectos (`px-3 py-1.5 text-xs font-semibold uppercase`; activo `bg-brand-deep text-paper`, inactivo `border border-line hover:border-brand`); lista `p-5 space-y-3`; vacío: "No hay documentos en esta categoría." (`text-sm text-muted text-center py-6`).

**ExternalAccess.jsx**: caja `bg-paper border border-line`, kicker "Accesos", título "Accesos Rápidos"; dos filas-enlace (`flex items-center gap-4 px-4 py-4 border border-line hover:border-brand|ink`): "MiPortal — Accedé a tus trámites y recibos" (icono usuario sobre cuadrado 40 px `bg-brand`, enlace a https://www.formosa.gob.ar/miportal/login) y "WhatsApp — Contactanos al 3704-000000" (icono WhatsApp sobre cuadrado `bg-ok`, enlace https://wa.me/5493700000000), con icono "abrir externo" 16 px muted a la derecha.

(Estos componentes usan estética "Swiss" de esquinas rectas, distinta del chat actual de píldoras y radios grandes; confirman que quedaron de una versión anterior.)

---

## Apéndice B. Qué NO pudo determinarse

1. Alturas/anchos reales renderizados dependientes de fuente (píldora Navbar, ancho de píldoras de bienvenida, saltos de línea del h1) — no hay navegador.
2. Formato de hora `es-AR` (12 h vs 24 h).
3. Valores hex exactos de los colores `sky-400`, `amber-400`, `emerald-400`, `pink-400`, `yellow-400`, `purple-400` y de los defaults de Tailwind (`shadow-sm`, `shadow-xs`, `animate-pulse`, escala de tamaños de texto, `tracking-*`): no están en el repo (sin `node_modules`); los valores citados con `[TW]` son los de Tailwind CSS v4 por defecto y deberían verificarse al renderizar.
4. Si el estiramiento de botones/tarjeta dentro de la burbuja (columna flex) es el resultado visual real — razonado por semántica CSS, no probado.
5. Geometría exacta de las siluetas `egg`, `hexagon`, `triangle` (perfiles tabulados; replicar copiando `profiles.ts`).
6. El onboarding (`BotOnboardingModal`, montado globalmente en AppRouter.jsx:61) referencia un `target:"#chat-here"` en el paso 4, pero ningún elemento del chat define `id="chat-here"` (grep): fuera de alcance de esta nota; no se detalló su UI.
