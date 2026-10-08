# Admin/Employee panel + app screen inventory — visual format (repo monzonfelipe0710-stack/asistente-virtual, branch dev-felipe, commit b9b83c4999cbe3fafbb2a5e634747c5b81c2f611)

Source = local checkout read file-by-file. Citation format `path:line` is relative to `src/` unless it starts with another root. Tailwind is **v4.3** (`package.json:14,21`), so all utilities resolve with a 4px spacing unit (`p-5` = 20px, `px-2.5` = 10px, `w-11` = 44px). Tailwind defaults NOT overridden in the repo (type scale, shadows, default color palette) are marked **[TW-default, not in repo]**; their values come from the Tailwind v4 default theme, not from the checkout.

**Reading rule for the report writer:** `DESIGN.md` at repo root is STALE versus the code (it says sidebar #070E20 / 272px / 64px, radius 10/14px, paper #EDF1F9, ok #1FA45C...). The real values are in `src/index.css`. This note uses `index.css` only. Where DESIGN.md and code disagree, code wins (see Gaps in Q8).

Notation: `paper/ink/mist/soft/line/muted/faint/brand...` = CSS tokens defined in `index.css:77-183` (values in Q4/Q9). TW size map used below **[TW-default]**: text-[9px]/[10px]/[11px]/[13px] explicit; `text-xs`=12px (line-height 16px), `text-sm`=14px (20px), `text-base`=16px (24px), `text-lg`=18px (28px), `text-xl`=20px (28px), `text-2xl`=24px (32px), `text-3xl`=30px (36px), `text-4xl`=36px (40px), `text-5xl`=48px (48px). Tracking: `tracking-wide`=0.025em, `wider`=0.05em, `widest`=0.1em, `tighter`=-0.05em, `tight`=-0.025em. Bare text with no size class = 16px / line-height 1.5 (preflight).

---

## Q1. Inventory of ALL screens/routes (public, citizen, auth, profile, admin) and who sees what

### Takeaway
The app has 8 top-level routes (+ 404) and 9 admin sub-routes behind a 2-layer guard (role, then permission). Public pages share the pill Navbar + Footer; the admin panel uses its own shell (dark sidebar + top bar) with no public Navbar. Default theme on first load is **dark**.

### Cited Findings

**Route table** (`router/routes.jsx:63-110`)

| Path | Screen (file) | Who | One-line visual description |
|---|---|---|---|
| `/` | HomePage (`pages/HomePage.jsx`) | Everyone | Full-width landing: WebGL particles bg, floating pill Navbar, cinematic hero (min-h 92svh/100vh, centered `text-4xl sm:6xl lg:7xl` extrabold headline "Tus trámites en Formosa, simples y al instante.", sub-paragraph, 3 trust pills "100% Gratuito y de libre acceso" / "Atención continua 24 horas" / "Subsecretaría de Recursos Humanos", logo marquee "Un proyecto del Gobierno de la Provincia de Formosa"), then 4 bordered sections: live chat mockup ("Una conversación, una respuesta oficial."), 3 feature cards grid-cols-3 ("Todo lo que necesitás, en un solo lugar."), FAQ accordion ("Dudas comunes sobre el servicio"), closing CTA with bot avatar ("¿Tenés una consulta administrativa?" + btn-primary "Iniciar consulta con ChatAP →"), Footer (`pages/HomePage.jsx:145-391`) |
| `/chat` | CiudadanoPage → ChatWindow | Everyone (no guard, `routes.jsx:67`) | `h-screen flex-col bg-paper`: Navbar on top, 56px (h-14) empty header strip with two 36x36 rounded-xl icon buttons at right, scrollable message area; empty state = centered bot avatar + greeting h1 `text-2xl sm:3xl extrabold` + pill buttons (`chatap-pill-btn`); messages in `max-w-3xl`; bottom floating input bar `chatap-floating-bar max-w-2xl` with mic + send buttons (`pages/CiudadanoPage.jsx:10-14`, `components/ciudadano/ChatWindow.jsx:663-830`) |
| `/login` | LoginRegisterPage | Everyone | 2-column `lg:grid-cols-2` (single column <1024px): left (hidden <lg) editorial panel on `bg-mist/50` with ChatAP logo chip (44px rounded-2xl brand-deep), `display-1` "HABLÁ CON EL ESTADO.", lead, 21:10 landscape photo card with gradient; right: "Volver al inicio" link + pill segmented switch "Iniciar sesión" / "Registrarme", form in `max-w-md`, Google sign-in, forgot-password flow ("Recuperá tu contraseña"), employee-request block (CUIL, Teléfono, Puesto / Función, Motivo) on register (`pages/LoginRegisterPage.jsx:207-341,425-600`) |
| `/restablecer` | ResetPasswordPage | Everyone (needs valid link) | Centered `max-w-md`: bot avatar 64px, h1 `text-2xl bold` ("Nueva contraseña" / "Enlace no válido" / "¡Listo!"), form inside `rounded-2xl border bg-mist p-6 sm:p-8` (`pages/ResetPasswordPage.jsx:49-77`) |
| `/contacto`, `/soporte` | ContactoPage (same component) | Everyone | Navbar + kicker "SUBSECRETARÍA DE RECURSOS HUMANOS" + h1 `text-3xl sm:4xl extrabold`; 3 contact cards (WhatsApp Oficial green-tinted, 0800-555-1234, Asistente Virtual ChatAP) as `rounded-2xl p-6`; contact form card `rounded-3xl p-6 sm:p-9`; FAQ accordion cards `rounded-2xl`; "Atención Presencial" card `rounded-3xl bg-mist/40` (`pages/ContactoPage.jsx:83-375`) |
| `/perfil` | ProfilePage → ProfileLayout | Any logged-in user (not logged = "SESIÓN REQUERIDA." card with lock icon + btn "Iniciar sesión", `pages/ProfilePage.jsx:11-35`) | Navbar + `ed-max section-bleed py-12 lg:py-16` page: ProfileHeader, horizontally scrollable pill tabs (`rounded-full border px-4 py-2.5 text-[13px] font-semibold`, active = `bg-ink text-paper`), section body; Footer (`components/profile/ProfileLayout.jsx:78-109`). Tabs by role (`ProfileLayout.jsx:23-45`): **Superadmin** = Resumen, Permisos, Auditoría, Seguridad; **Administrador** = Resumen, Permisos, Seguridad; **Ciudadano** = Resumen, Mis trámites, Mis solicitudes, Mis conversaciones, Mi actividad, Notificaciones, Seguridad |
| `/admin` (index) | AdminLayout > Dashboard | Superadmin + Administrador (`StaffRoute`, `routes.jsx:37-50`; permission `dashboard`) | See Q2/Q10 |
| `/admin/mesa-de-entrada` | MesaDeEntrada | perm `mesa_entrada` (both roles) | PageHeader + 4 stat cards + card with search/status chips/table (Q10) |
| `/admin/solicitudes` | EmployeeApprovals | perm `solicitudes` = **Superadmin only** (`context/AdminContext.jsx:24-34` vs `35-44`); Administrador is redirected to `/admin` (`routes.jsx:52-61`) | PageHeader + 5 stat cards + tabs/search/table (Q10) |
| `/admin/usuarios` | UserTable | perm `usuarios` (both) | Legacy square-cornered table screen |
| `/admin/conocimiento` | KnowledgeManager | perm `conocimiento` (both) | Legacy square-cornered Q&A list + inline form |
| `/admin/siged` | SigedIntegration | perm `siged` (both) | Legacy square table with status filter chips + 3 info cards |
| `/admin/documentos` | DocumentManager | perm `documentos` (both) | Rounded card table with category chips, sorting, pagination (6/page) |
| `/admin/configuracion` | ChatbotSettings | perm `configuracion` (both) | 2-column card form with toggle |
| `/admin/reportes` | ReportsPage | perm `reportes` (both) | Slate/white analytics dashboard with gauge, donut, pipeline bar, table |
| `*` | NotFoundPage | Everyone | Navbar, pulsing badge "Error 404 · Ruta no encontrada", 3D ASCII "404" (h-56 sm:72 md:80), h1 "La página que buscás no existe o fue movida", btn-primary "Volver al inicio" + btn-ghost "Preguntarle a ChatAP", pill shortcuts ("Haberes y Sueldos", "Licencias Oficiales", "Mesa de Entrada SIGED", "Soporte y Contacto"), Footer (`pages/NotFoundPage.jsx:25-113`) |

- Global overlay on every route: `BotOnboardingModal` mounted in `router/AppRouter.jsx:61` (tour modal; out of this note's scope).
- Route transition between pages: exit 180ms (`AppRouter.jsx:6`), classes `animate-route-enter` 0.28s cubic-bezier(.16,1,.3,1) (translateY 8px→0, opacity) and `animate-route-exit` 0.18s (translateY 0→-4px) (`index.css:265-285,333-340`).
- Guard logic: `StaffRoute` redirects unauthenticated or `status === "Suspendido"` to `/login`; non-staff to `/` (`routes.jsx:37-50`). `AdminLayout` additionally renders an in-place "ACCESO RESTRINGIDO." screen if not allowed (`pages/AdminLayout.jsx` ~lines 95-116): centered `max-w-md`, 56px (w-14) rounded-2xl `bg-bad/10 text-bad` lock icon tile, kicker "[ Panel de administración ]", `display-3` "ACCESO RESTRINGIDO.", muted text ("Iniciá sesión con una cuenta de Administrador o Superadmin para entrar al Panel de Administración." / "Tu cuenta de Ciudadano no tiene permiso para entrar al Panel de Administración."), buttons "Iniciar sesión" (btn-primary) and "Volver al inicio" (btn-ghost).
- Entry points to admin from public Navbar: link "Panel Admin" (`components/common/Navbar.jsx:133-143,254-258`), also "Mi perfil" and "Cerrar sesión"; public nav links "Inicio", "ChatAP", "Soporte" (`Navbar.jsx:12-14`); CTA `nav-cta` to `/login` (`Navbar.jsx:441`).
- Roles: `ROLES = ["Superadmin","Administrador","Ciudadano"]` (`AdminContext.jsx:8`). Ciudadano has zero admin permissions (`AdminContext.jsx:45`).
- Theme default: inline script in `index.html:25-40` forces `dark` once (migration flag `chatap_dark_default_v1`), afterwards honors localStorage `theme`; `theme-color` meta = #070E20 dark / #F0F4F9 light (`index.html:42-43`).

### Inferences
- For a mobile app, the "employee/admin" surface = 9 admin screens + Profile (staff variant: Resumen/Permisos/Seguridad[/Auditoría]); citizen surface = Home, Chat, Login/Register/Reset, Contacto, Profile (citizen variant), 404.
- Superadmin sees 9 sidebar items; Administrador sees 8 (no "Solicitudes").

### Gaps
- Profile section visuals (Resumen/Tramites/etc.) were not read in detail (outside the admin file list); only the tab structure is documented.

---

## Q2. Admin shell: sidebar, top bar, content area, mobile behavior

### Takeaway
Desktop-only shell: fixed left sidebar (280px expanded / 72px collapsed icon rail, near-black #141414 in BOTH themes) + sticky-looking 64px top bar + scrolling content with 24px (40px ≥1024) padding. **There is no mobile adaptation**: no drawer, no bottom nav, no breakpoint logic; the sidebar stays open at 280px on phones. A mobile app must therefore design its own navigation (this is not derivable from the web code).

### Cited Findings

**Layout skeleton** (`pages/AdminLayout.jsx:119-150`)
- Root: `h-screen overflow-hidden flex`, background `var(--color-paper)` (l.119). Sidebar is `position:fixed`; the content column is `flex-1 flex flex-col min-w-0 h-screen overflow-hidden` with inline `marginLeft = sidebarOpen ? var(--sidebar-width) : var(--sidebar-collapsed-width)`, transition margin 200ms `cubic-bezier(0.22,1,0.36,1)` (l.121-123).
- `sidebarOpen` initial state `true` (l. `useState(true)`) on every screen size.
- Tokens (`index.css:122-132`): `--sidebar-bg:#141414`, `--sidebar-border:rgba(255,255,255,0.12)`, `--sidebar-hover:#222222`, `--sidebar-text:#9e9e9e`, `--sidebar-text-hover:#ffffff`, `--sidebar-section-text:#5e5e5e`, `--sidebar-active-bg:var(--color-brand)`, `--sidebar-active-text:#ffffff`, `--sidebar-header-bg:#161616` (declared, unused in JSX), `--sidebar-width:280px`, `--sidebar-collapsed-width:72px`. **No `.dark` override exists for any `--sidebar-*` token** (`.dark` block `index.css:159-183`) -> sidebar looks identical in light and dark.

**Sidebar** (`components/admin/AdminSidebar.jsx`)
- `<aside>` fixed top/left/bottom 0, z-40, `flex-col overflow-hidden`, width transition 300ms `cubic-bezier(0.25,0.1,0.25,1)`, bg #141414, `border-right:1px solid rgba(255,255,255,.12)`, height 100vh (l.105-117).
- Header strip height **72px**, `padding:16px 0 0`, `paddingLeft:20px` (l.121-123) containing ONLY a collapse toggle: 40x40 (`w-10 h-10`), `rounded-lg` (12px), bg #222222, icon color #9e9e9e, chevron-left svg 18x18 stroke 2 that rotates 180deg when collapsed (l.129-141). aria-label "Ocultar barra lateral" / "Mostrar barra lateral". **No logo, no app name, no user card in the sidebar.**
- `<nav>`: scrolls vertically, `padding:20px 0` (l.153). Each section block `marginBottom:32px` (l.161).
- Section label: height 18px, `mb-1.5` (6px), 10px semibold UPPERCASE `tracking-widest`, color #5e5e5e, `paddingLeft:20px`, fades to opacity 0 when collapsed (l.164-168). Labels: **PRINCIPAL**, **GESTIÓN**, **SISTEMA** (l.6,23,52).
- Items stacked with `rowGap:12px` (l.173). Each item (`NavLink`, `rounded-xl` = 16px, full sidebar width, no side margin): `padding:14px 20px`, `columnGap:16px`, content left-aligned (l.194-196). Height = 14+20+14 = **48px** [derived]. Icon: 20x20 (`w-5 h-5`) outline svg, stroke-width 1.5, `currentColor` (l.88). Label: `text-sm` (14px), font-medium (inactive) / font-semibold (active), `truncate`, `max-w-40` (160px) expanded, `opacity-0 max-w-0` collapsed (l.230).
- States: inactive = transparent bg, text #9e9e9e. Hover = bg #222222, text #ffffff (JS mouseenter handlers) + icon "wiggle" animation `icon-hover` 0.35s (scale 1→1.15, rotate -6°/+5°, settle 1.1) + a 150%-size circle ring (2px solid `var(--sidebar-active-bg)`) fading in behind the icon (opacity 0→1, scale .6→1, 0.2s) (`index.css:1216-1237`; ring markup `AdminSidebar.jsx` icon wrapper). **Active** = bg `var(--sidebar-active-bg)` = brand (#2F6BFF light / #4D7DFF dark; same element so `.dark` brand applies), text #ffffff, plus a **3px x 20px white bar** at `left:4px`, vertically centered, `rounded-r-full` (l.217) and a **6px white dot** pushed to the right edge (`ml-auto w-1.5 h-1.5`, l.237; hidden when collapsed).
- Active-route logic: exact for `/admin`, prefix match for the others (`isLinkActive`, l. ~100-102).
- Collapsed rail (72px): labels/section titles hidden, icons remain at x = 20px (padding), tooltip `sidebar-tooltip`: `::after` at `left: calc(100% + 10px)`, `padding:5px 10px`, `border-radius:6px`, 12px/500, bg `var(--color-ink)`, text `var(--color-paper)`, shadow `0 4px 12px rgba(0,0,0,.15)`, opacity 0→1 over .15s (`index.css:1190-1214`). NOTE: `<aside>` has `overflow-hidden`, so the tooltip (positioned outside the 72px box) is probably clipped — undeterminable without running (flag).
- Footer block: `border-top:1px solid var(--sidebar-border)`, inner `padding:18px 0`, one item "Volver al inicio" (`<NavLink to="/">`, `rounded-lg`, same 14px/20px padding, left-arrow icon `M10 19l-7-7m0 0l7-7m-7 7h18`, label `text-xs font-semibold uppercase tracking-wide`) (l.254-300).
- **Nav items in order, literal labels, icons (Heroicons-outline paths, 24 viewBox)**:
  1. PRINCIPAL: "Dashboard" (`/admin`, house), "Mesa de Entradas" (`/admin/mesa-de-entrada`, 3D box/cube)
  2. GESTIÓN: "Solicitudes" (`/admin/solicitudes`, check-in-circle; Superadmin only), "Usuarios" (`/admin/usuarios`, two people), "Conocimiento" (`/admin/conocimiento`, lightbulb), "Documentos" (`/admin/documentos`, folder)
  3. SISTEMA: "Integración SIGED" (`/admin/siged`, terminal window), "Configuración" (`/admin/configuracion`, gear), "Reportes" (`/admin/reportes`, bar chart)
  (`AdminSidebar.jsx:4-70`; sections with zero permitted items are not rendered, l. ~155).

**Top bar** (`pages/AdminLayout.jsx:126-145`)
- `h-16` = **64px**, `shrink-0`, `flex items-center justify-between`, `px-5` (20px) / `lg:px-8` (32px), `border-b border-line/70`, `backdrop-blur-md`, bg `color-mix(in srgb, var(--color-paper) 85%, transparent)`.
- Left: kicker "Panel de administración" (10px bold uppercase, tracking 0.24em, color faint, l.130) over the section title (15px bold, leading-tight, tracking-tight, truncate, l.131). Titles (`AdminLayout.jsx:62-72`): `/admin`="Resumen", `/admin/mesa-de-entrada`="Mesa de Entradas", `/admin/solicitudes`="Solicitudes", `/admin/usuarios`="Usuarios", `/admin/conocimiento`="Conocimiento", `/admin/documentos`="Documentos", `/admin/siged`="Integración SIGED", `/admin/configuracion`="Configuración", `/admin/reportes`="Reportes"; fallback "Administración". (Note: sidebar says "Dashboard", top bar says "Resumen" for the same route.)
- Right (gap 12px): user chip visible only ≥640px (`hidden sm:flex`): 32x32 round avatar (`bg-brand-deep text-paper`, 11px bold uppercase initial, l.136), name `text-xs font-semibold truncate max-w-32` (128px, l.138) over role 10px bold uppercase `tracking-wider` (Superadmin/Administrador) color #9e9e9e; then **ThemeToggle** 40x40 `rounded-lg`, `1px solid var(--sidebar-border)` border, icon 20x20 stroke 1.8 (moon in light mode / sun in dark mode), hover bg #222 + white icon (`AdminLayout.jsx:30-60`). Theme switch plays `animate-theme-transition` 0.2s and writes localStorage `theme`.
- **Legibility bug as coded:** title (l.131) and user name (l.138) are colored `var(--sidebar-text-hover)` = **#ffffff** in both themes, and the toggle's border/icon use sidebar tokens (white-ish/grey on translucent paper). In LIGHT mode (paper #F0F4F9) these render white-on-light-grey = nearly invisible. Dark mode is fine. Flag for the mobile port: use `ink` for these.
- There is NO search field, NO notification bell, NO breadcrumb in the top bar (GlobalSearch/NotificationCenter exist but are not mounted anywhere — see Q6).

**Content area** (`AdminLayout.jsx:147`): `<main class="flex-1 min-h-0 p-6 lg:p-10 overflow-y-auto overflow-x-hidden">` -> padding **24px** (<1024) / **40px** (>=1024); scroll resets to top on route change. Layout adds no max-width; individual screens: Dashboard `max-w-6xl` (1152px, `Dashboard.jsx:35`), ReportsPage `space-y-6 pb-10` full width, others full width.

**Responsive / mobile**
- Breakpoints actually used in admin screens: `sm:` 640, `md:` 768, `lg:` 1024 (Tailwind defaults), e.g. user chip `sm:`, padding `lg:`, stat grids `grid-cols-2 lg:grid-cols-4`.
- `index.css:316-319` defines `.admin-content { margin-left: var(--sidebar-width) }` with `@media (max-width:1023px){margin-left:0}` but **no JSX uses `admin-content`** (grep over `src`: only the CSS) -> dead code. No `translate-x`, drawer, hamburger or bottom-nav exists for admin; `animate-slide-in-left/out-left` keyframes exist (`index.css:1176-1177,1259+`) but are not referenced by admin files.
- Consequence at 375px: sidebar 280px + content ~95px (content has `min-w-0`, `overflow-x-hidden`). The web admin is effectively unusable on phones; the user can collapse to the 72px rail manually.

### Inferences
- For a mobile port the natural mapping is: sidebar -> bottom tab bar or drawer; keep the 3 section groupings (PRINCIPAL/GESTIÓN/SISTEMA) and the exact labels; active-state = brand fill + white text; top bar 64px with kicker+title and avatar+theme toggle.
- Because the sidebar tokens never change with theme, treat the nav chrome as a permanently dark surface (#141414).

### Gaps
- Exact rendered height of rows/headers is derived from classes, not measured in a browser.
- Whether the collapsed-tooltip is clipped by `overflow-hidden` (cannot verify without rendering).

---

## Q3. Typography, spacing, radius, elevation base (shared)

### Takeaway
One font family (PP Neue Montreal, self-hosted woff2) with system fallback; small, dense, UPPERCASE micro-labels; rounded geometry driven by theme radii; shadows are mostly absent (flat, border-defined cards).

### Cited Findings
- Font stack `--font-sans: "PP Neue Montreal", "PP Neue Montreal Text", ui-sans-serif, system-ui, -apple-system, sans-serif`; mono `ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, "Liberation Mono", monospace` (`index.css:78-81`). Weights loaded: Thin 250, Book 350, Regular 400, Medium 500, Semibold 600, Bold 700, Black 900, Italic 400 (`index.css:4-59`); files in `public/fonts/`. Body: `font-feature-settings "cv03","cv04","cv09","cv11"`, antialiased (`index.css:195-202`). Body/UI default size 14px (`text-sm`) in forms/tables.
- Radius scale (overrides Tailwind): sm 6px, md 8px, lg 12px, xl 16px, 2xl 20px, 3xl 28px, full 9999 (`index.css:138-144`). Custom `--radius-control: 9999px` and `--radius-card: 1.25rem` (20px) (`index.css:134-135`). So `rounded-lg`=12, `rounded-xl`=16, `rounded-2xl`=20, `rounded-md`=8. `rounded` (no suffix, used in a few badges) = Tailwind default 4px **[TW-default]**.
- Shadows: `--shadow-soft: none; --shadow-hover: none` (`index.css:151-152`) — the `.card*` classes use `var(--shadow-hover)` so they have NO shadow. Utility shadows used in admin come from Tailwind defaults **[TW-default]**: `shadow-sm` (0 1px 3px rgb(0 0 0/.1), 0 1px 2px -1px rgb(0 0 0/.1)), `shadow-lg` (0 10px 15px -3px /.1, 0 4px 6px -4px /.1), `shadow-xl` (0 20px 25px -5px /.1, 0 8px 10px -6px /.1), `shadow-2xl` (0 25px 50px -12px /.25).
- Editorial headings: `.display-1` clamp(2.75rem,8vw,6.5rem)/lh1.08/ls -0.025em/weight 800; `.display-2` clamp(1.85rem,3.8vw,3rem)/lh1.2/ls -0.02em/weight 600; `.lead` clamp(1.1rem,1.7vw,1.45rem)/lh1.45/ls -0.02em/color muted (`index.css:1371-1408`). **`.display-3` and `.kicker` are used in JSX but are NOT defined in any CSS file** (grep over `src/**/*.css`: no match). Hence `PageHeader`'s h1 (`components/admin/ui.jsx:77`: `display-3 text-ink m-0 mt-3 uppercase`) renders as plain 16px / normal-weight / uppercase / ink text; and the kicker `<p class="kicker m-0">[ Administración ]</p>` (`ui.jsx:76`) is plain 16px muted-less text unless via `Kicker` component. The `Kicker` component adds `font-neue tracking-[0.22em] text-xs text-muted` (`components/common/editorial.jsx:3-5`) — still no uppercase transform; brackets are literal characters in the string.
- Labels convention: micro labels 10px/11px bold uppercase tracking widest (0.1em) or arbitrary 0.18–0.24em.

### Inferences
- Treat `display-3`/`kicker` as UNSTYLED in the shipped web UI; the intended look (per DESIGN.md "calm display typography") is not reproducible from code. For the mobile app choose either the real rendered look (16px uppercase ink title under a bracketed 16px kicker) or a designed H1; flag as a decision.

### Gaps
- Final rendered line-heights of arbitrary `text-[Npx]` rely on preflight 1.5 (assumption, standard Tailwind v4).

---

## Q4. Shared primitives (ui.jsx + CSS components) — exact values

### Takeaway
There are two coexisting visual dialects: (a) modern rounded "token" components (`.card`, `.btn-*`, `.input-field`, `.badge`, `StatCard`, `StatusPill`) used by Mesa de Entradas, Solicitudes, Documentos, Configuración and all modals; (b) legacy square/uppercase components (Usuarios, Conocimiento, SIGED). ReportsPage is a third dialect (Tailwind slate/white palette). Document all three.

### Cited Findings

**Color tokens** (`index.css:83-129,159-183`)

| Token | Light | Dark (`.dark`) |
|---|---|---|
| ink | #0F1730 | #EAF0FA |
| paper (page bg) | #F0F4F9 | #070E20 |
| mist | #E2EAF4 | #0D1730 |
| soft | #D5E2F1 | #132247 |
| line | rgba(15,23,48,.12) | rgba(234,240,250,.12) |
| muted | #4A5578 | #8A9BC0 |
| faint | #7E8BA7 | #4E5F85 |
| brand | #2F6BFF | #4D7DFF |
| brand-dark | #2558E0 | #3A6AE0 |
| brand-deep | #1C44B6 | #2F55C0 |
| ok | #18bc42 | #18bc42 |
| warn | #efc21e | #efc21e |
| bad | #d82f2f | #d82f2f |
| info | #2F6BFF | #4D7DFF |
| primary / accent | = brand / = brand-deep | idem |
| primary-light | #EBF2FF | #0D1B40 |
| primary-lighter | #F5F8FF | #091230 |
| band | #0D1730 | #040A18 |
(`text-ok-dark` used in `MesaDeEntrada.jsx:913` is NOT defined -> falls back to inherited color.)

**Card** `.card` (`index.css:1088-1091`): bg `color-mix(paper 86%, transparent)` (slightly translucent), `border:1px line/70`, radius 20px, no shadow. `.card-border` = border line/70 + radius 20px, no bg. `.card-interactive` same + hover: border `color-mix(brand 45%, line)`, bg primary-lighter, `translateY(-2px)`, transition .2s (`1092-1103`). In Reports/Documentos the combo `card card-border` is used.

**StatCard** (`ui.jsx:48-70`): `card-interactive p-5` (20px padding), entry `animate-list-item` (slide-up 16px, .22s) with per-card `animationDelay`. Row: text block left, icon tile right (`gap-3`). Label `text-[11px] uppercase tracking-widest text-muted truncate`; value `mt-2 text-3xl(30px) font-bold text-ink leading-none` with CountUp (550ms ease-out-cubic, 0→value); hint `text-xs text-faint mt-1.5` (6px). **Icon tile 44x44 (`w-11 h-11`), `rounded-xl` (16px)**, icon 20px stroke 1.6; tones (`ui.jsx:39-46`): brand `bg-brand-deep/10 text-brand-deep`, ok `bg-ok/10 text-ok`, warn `bg-warn/10 text-warn`, bad `bg-bad/10 text-bad`, info `bg-info/10 text-info`, muted `bg-muted/10 text-muted`. Grids: Mesa `grid-cols-2 lg:grid-cols-4 gap-4 mb-6` (`MesaDeEntrada.jsx:111`); Solicitudes `grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6` (`EmployeeApprovals.jsx:252`); both with `stagger-children` (child delays 0.03s…0.24s step 0.03, `index.css:1162-1170`).

**Dashboard "metric strip" (the actual landing KPIs; NOT StatCard)** (`Dashboard.jsx:47-56`): container `mt-12 grid gap-px bg-line border border-line overflow-hidden rounded-2xl grid-cols-2 lg:grid-cols-4` (1px line-colored gutters create hairline dividers); cell `bg-paper p-6 md:p-8` (24px / 32px); label 11px bold uppercase tracking 0.22em muted; value `mt-4 text-4xl md:text-5xl(36/48px) font-extrabold tracking-tighter text-ink`; hint `mt-2 text-sm text-faint`; footer accent bar `mt-6 h-[3px] w-10 bg-brand-deep` (40x3px). Four cells literal: "Usuarios activos" (hint "de N usuarios"), "Artículos base" (hint "de N artículos"), "Expedientes SIGED" (no hint), "Requieren atención" (hint "pendientes").

**PageHeader** (`ui.jsx:72-83`): `flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-line/70 pb-8`; kicker "[ Administración ]"; h1 (display-3 unstyled, uppercase, mt-3); description `text-[15px] text-muted mt-3 max-w-2xl` (672px); right slot `flex items-center gap-2 flex-wrap` for actions. Used by Solicitudes ("Solicitudes de empleados" / "Revisá las solicitudes de alta y definí si la persona ingresa como empleada.") and Mesa ("Mesa de Entradas" / "Registrá y dale seguimiento a los ingresos de trámites y expedientes.").

**Inconsistent screen headers (5 patterns)**: (A) PageHeader above; (B) `h1 text-3xl(30px) font-bold uppercase tracking-wide text-ink` + subtitle `text-xs uppercase tracking-wide text-muted mt-2` + square button: Usuarios "Gestión de Usuarios" / "N usuarios registrados" (`UserTable.jsx:63-66`), Conocimiento "Administración del Conocimiento" / "Preguntas y respuestas de la base de conocimiento" (`KnowledgeManager.jsx:28-33`), SIGED "Integración SIGED" / "Sistema de Gestión Documental · Mesa de Entradas" (`SigedIntegration.jsx:23-28`); (C) `h1 text-xl(20px) font-semibold text-primary tracking-tight` + `p text-xs text-muted font-medium mt-0.5`: Configuración "Configuración del Chatbot" / "Personalizá el comportamiento y los mensajes del asistente virtual" (`ChatbotSettings.jsx:50-51`), Documentos "Gestión Documental" / "N documentos · N descargas totales" (`DocumentManager.jsx:69-70`); (D) Reportes `h1 text-2xl bold` + chip (`ReportsPage.jsx:229-239`); (E) Dashboard editorial `display-2` "ADMINISTRACIÓN." (`Dashboard.jsx:38-40`).

**Buttons** (`index.css:1112-1133`; all pill-shaped; labels UPPERCASE):
- `.btn-primary`: `inline-flex gap-2 px-6(24) py-3(12) text-xs(12px) font-bold uppercase tracking-widest(0.1em) rounded-full`, bg brand-deep (#1C44B6 / dark #2F55C0), text paper, border 1px brand-deep, hover bg #EBEBEB + text #1A1A1A + border #EBEBEB (literal hex, same in both themes), transition .15s. Height = 12+16+12+2 = **42px** [derived]. In dark mode the text is paper = #070E20 (dark navy on blue) — as coded.
- `.btn-ghost`: same size, bg transparent, text ink, border line, same #EBEBEB hover.
- `.btn-danger`: `px-5 py-2.5 text-xs bold uppercase tracking-wider rounded-full bg-bad text-paper hover:opacity-90` (height 36px [derived]).
- `.btn`: `px-5 py-2.5 text-xs bold uppercase tracking-wider rounded-full border-line bg-mist text-ink hover:bg-soft`; warning variant composed inline: `btn bg-warn text-paper border-warn hover:bg-warn/90` (`EmployeeApprovals.jsx:640`).
- Compact modal override: `py-1.5! px-3! text-xs!` (6px/12px) -> ~30px high (`DocumentManager.jsx:219-220`, `MesaDeEntrada.jsx:531-534`); `py-2! px-3.5! text-[13px]!` (8px/14px) in Solicitudes modals (`EmployeeApprovals.jsx:543,561,636,640`). NOTE `UserFormModal.jsx:73-74` passes only `text-xs` so those buttons keep px-6 py-3 (42px).
- Inline row action buttons (Solicitudes, `EmployeeApprovals.jsx:423-464`): "Ver" = text link `text-xs font-semibold text-brand hover:underline px-2 py-1`; "Aprobar"/"Reactivar" = `px-3 py-1.5 text-xs font-semibold rounded-lg bg-ok text-paper hover:opacity-90` + 14px icon; "Suspender" = `bg-paper text-warn border border-warn/30 hover:bg-warn/10`; "Rechazar" = `bg-paper text-bad border border-bad/30 hover:bg-bad/10` (all `rounded-lg` 12px, text-xs, gap-1 icon+label).
- Legacy square buttons (Usuarios/Conocimiento/SIGED): primary `px-6 py-3 bg-brand-deep text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand-dark hover:-translate-y-0.5` (NO radius) (`UserTable.jsx:72`); row "Editar" `px-4 py-2 text-xs bold uppercase` brand-deep (l.140); Knowledge row buttons `px-3 py-2 text-[10px] bold uppercase`: toggle "Activo" `bg-ok text-paper` / "Inactivo" `bg-mist text-muted`, "Editar" `bg-brand-deep`, "Eliminar" `bg-bad` (`KnowledgeManager.jsx:84-102`); chips `px-4 py-2 text-xs semibold uppercase`, active `bg-brand-deep text-paper`, inactive `bg-paper text-ink border border-line hover:border-brand` (`KnowledgeManager.jsx:48-52`, `SigedIntegration.jsx:47-51`).
- Pill tabs/chips (modern): Solicitudes tabs `px-3.5 py-2 text-xs font-semibold rounded-lg border`, active `bg-brand-deep text-paper border-brand-deep shadow-sm`, inactive `bg-paper text-muted border-line hover:text-ink hover:bg-mist`, each with 6px dot (status color; paper when active) + label + count bubble `min-w-5 h-5 px-1 rounded-full text-[10px] bold tabular-nums` (`bg-paper/20 text-paper` active / `bg-mist text-muted`) (`EmployeeApprovals.jsx:292-323`). Tab labels: "Todos", "Pendiente", "Activo", "Suspendido", "Rechazado". Mesa status chips: `px-3 py-2 text-xs font-semibold rounded-lg border`, same active style (`MesaDeEntrada.jsx:161-165`), labels "Todos","Ingresado","En proceso","Observado","Finalizado". Documentos chips: `px-3 py-1.5 text-xs font-medium rounded-lg`, active `bg-primary text-paper shadow-sm`, inactive `bg-paper text-muted border border-line/60`, label "Cat (N)" (`DocumentManager.jsx:81-84`); categories "Todos","Formularios","Guías","Modelos" (`data/mockDocuments.js:19`).

**Inputs / selects / textarea** `.input-field` (`index.css:1107-1111`): `w-full px-4(16) py-2.5(10) text-sm(14px) bg-paper border 1px line rounded-xl(16px) text-ink outline-none placeholder:text-faint`; focus = border brand + 2px ring `brand/12`. Height 42px [derived]. Selects use the same class (no custom chevron; native). Textarea = same, `resize:none`, auto-grow (`ChatbotSettings.jsx:5-15`), min-heights `min-h-13`(52) / `min-h-14`(56) / `min-h-20`(80). Search field pattern: 16px magnifier icon absolutely at `left-3`, input `pl-9` (36px) (`EmployeeApprovals.jsx:328-338`). Error state (Mesa): `border-bad focus:border-bad ring-bad/15` + `text-[10px] text-bad` message (`MesaDeEntrada.jsx:385-390`); UserFormModal uses Tailwind red: `border-red-300 focus:border-red-500 focus:ring-red-200`, message `text-[10px] text-red-500` (`UserFormModal.jsx:44,49`). Labels: modern forms `text-xs font-medium text-muted mb-1`; dense forms `text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5` with 12px icon (`DocumentManager.jsx:195`, `MesaDeEntrada.jsx:378`); Solicitudes confirm `text-[11px] semibold uppercase tracking-wide mb-1.5`. Legacy inputs (Usuarios/Conocimiento): square `px-4 py-3 text-sm border border-line bg-paper placeholder:text-muted focus:border-brand`, no ring (`KnowledgeManager.jsx:130`). File drop-zone: `w-full border-2 border-dashed border-line rounded-lg py-2.5 text-xs text-muted bg-soft/50`, hover `border-brand text-brand bg-brand/5`, 16px upload icon, label "Tocar para adjuntar archivos" (`MesaDeEntrada.jsx:501-510`); file rows `text-[11px] bg-mist rounded-lg px-2.5 py-1.5 border border-line`.

**Toggle** (`ChatbotSettings.jsx:95-98`): track 36x20 (`w-9 h-5`) `rounded-full`, off = bg mist, on = bg accent (brand-deep); knob 16x16 (`h-4 w-4`) bg paper, offset 2px, slides 16px (`translate-x-4`). Label row: title `text-xs font-medium text-muted`, description `text-[10px] text-muted`. Row checkbox (Reportes): native 14px `w-3.5 h-3.5 rounded` / task 16px `w-4 h-4`, blue-600 accent (Tailwind) (`ReportsPage.jsx:611-616,805-810`).

**Badges / status pills** `.badge` (`index.css:1134-1136`): `inline-flex gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-line` (≈21px high [derived]). `StatusPill` (`ui.jsx:100-112`) = badge + tone + leading 6px dot (`w-1.5 h-1.5 rounded-full bg-current`), dot gets `dot-ping` (scale 1→2.6 + fade, 1.6s infinite, `index.css:1253-1257`) when status is "En proceso" or "Ingresado". **Exact colors (text color solid; bg = same color at 10% opacity over the surface)**:

| Status | Class (`ui.jsx:86-91`) | Light hex (text) | Dark hex |
|---|---|---|---|
| Ingresado | `bg-info/10 text-info` | #2F6BFF | #4D7DFF |
| En proceso | `bg-warn/10 text-warn` | #efc21e | #efc21e |
| Observado | `bg-bad/10 text-bad` | #d82f2f | #d82f2f |
| Finalizado | `bg-ok/10 text-ok` | #18bc42 | #18bc42 |
| (unknown) | `bg-mist text-muted` | #4A5578 on #E2EAF4 | #8A9BC0 on #0D1730 |
Priority (`ui.jsx:94-98,114-122`): Alta `bad`, Normal `brand`, Baja `muted`; `PriorityDot` = 10px circle (`bg-bad`/`bg-brand`/`bg-muted`).
Employee request statuses (`EmployeeApprovals.jsx:18-39`): Pendiente `bg-warn/10 text-warn` (dot pings), Activo `bg-ok/10 text-ok`, Suspendido `bg-muted/15 text-muted`, Rechazado `bg-bad/10 text-bad`; labels (title tooltips) "Pendiente de revisión", "Empleado activo", "Acceso suspendido", "Solicitud rechazada".
Role badges (`EmployeeApprovals.jsx:60-72` rounded-full; `UserTable.jsx:117-123` square): Superadmin `bg-ink text-paper`; Administrador `bg-brand-deep text-paper`; Ciudadano `bg-mist text-muted` (+ `border border-line` in Solicitudes). Both `px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide`.
SIGED table status (`SigedIntegration.jsx:13-18,99-103`): SOLID square tags `bg-info|warn|bad|ok text-paper px-2.5 py-1 text-[10px] semibold uppercase tracking-wide` (not translucent, not rounded).
Doc format chips (`DocumentManager.jsx:58,116`): PDF `bg-bad/10 text-bad`, DOCX `bg-info/10 text-info`, XLSX `bg-ok/10 text-ok`, `px-2 py-0.5 text-[10px] font-semibold rounded-lg`; category chip `bg-accent-light text-accent rounded-lg`. File badge in attachments 36x36 `rounded-md` 9px bold: PDF `bg-bad/12 text-bad`, IMG `bg-ok/12`, DOC `bg-info/12 text-info`, other `bg-brand/12 text-brand`, XLS label for sheets (`MesaDeEntrada.jsx:907-933`).
**Contrast flag:** `warn` #efc21e text on a 10% yellow tint is very low contrast in light mode (as coded).

**Tables** (modern, Solicitudes/Mesa; `EmployeeApprovals.jsx:374-470`, `MesaDeEntrada.jsx:186-236`): wrapper `overflow-x-auto -mx-5` (bleeds to card edges), `table w-full text-sm` (Solicitudes `min-w-200` = 800px so it scrolls horizontally on phones), header row `text-[10px] uppercase tracking-widest text-muted border-y border-line bg-mist/60` (Mesa: `border-b` only, no bg), th `text-left font-semibold px-5(20) py-3(12)`; body `divide-y divide-line` (1px line, no zebra); td `px-5 py-3.5`(Solicitudes, 14px) / `py-3`(Mesa); row hover `bg-mist`, whole row clickable; "new row" flash `row-new` (bg brand 18% → transparent, 1.2s). Solicitudes row content: 40px round initials avatar (`bg-brand-deep/10 text-brand-deep text-xs bold`), name `font-semibold text-ink truncate`, email `text-xs text-faint`, "CUIL ..." `text-[11px] font-mono text-faint`; 2nd col position (`font-medium`) / department `text-xs text-muted` / RoleBadge; 3rd col id `font-mono text-xs text-muted` + date; 4th col StatusPill + "Aprobado · fecha" `text-[11px] text-faint`; 5th col actions right-aligned `gap-2`. Column headers literal — Solicitudes: "Solicitante","Puesto / Dependencia","Solicitud","Estado","Acciones"; Mesa: "Nº","Nombre","Encargado","Sector","Costo","Estado","Fecha","Acciones"; footer line `text-[11px] text-faint mt-4` "Mostrando N de M solicitudes · Solo el Superadmin puede aprobar o rechazar." Mesa row: id mono xs muted; name semibold ink over description `text-xs text-faint truncate max-w-50`(200px); "Ver" `text-xs semibold text-brand hover:underline`.
Legacy table (Usuarios, `UserTable.jsx:78-150`): outer `bg-paper border border-line` (square), search bar zone `p-6 border-b` with `max-w-xs` (320px) input; header row `bg-mist text-10px uppercase tracking-widest text-muted`, th `px-6(24) py-3 semibold`; td `px-6 py-4`, divide-y, hover `bg-mist`; columns "Nombre","Email","Rol","Departamento","Estado","Último acceso","Acción"; status = 6px SQUARE dot + `text-xs semibold uppercase tracking-wide` (Activo `text-ok`+`bg-ok`, else `text-muted`+`bg-line`). Empty message `text-sm text-muted text-center py-8` "No se encontraron usuarios con ese criterio de búsqueda."
Dashboard table (`Dashboard.jsx:58-88`): see metric strip above; `card mt-16 overflow-hidden`; card header `px-8 py-6 border-b border-line` with title "Últimos movimientos" (display-3 unstyled uppercase) and right label "SIGED" (`text-xs text-faint semibold uppercase tracking-wider`); thead `text-[10px] uppercase tracking-[0.18em] text-faint` (no bg), th `px-8 py-4 font-bold`; td `px-8 py-6`, hover `bg-mist/60`; cols "Expediente" (mono 13px semibold ink), "Tipo", "Solicitante", "Estado" (StatusPill), "Último movimiento" (`text-xs text-muted`); 4 rows.
Documentos table (`DocumentManager.jsx:88-130`): in `card card-border overflow-hidden`; header `bg-soft/80 text-xs text-muted uppercase tracking-wider`, th `px-4 py-3 semibold`, sortable headers (`.sort-header` cursor + hover ink) with 9px accent indicator; td `px-4 py-3`; first cell: 32px-ish file icon tile (`p-1.5 rounded-lg` + format tone, 16px icon) + title `text-xs font-medium text-ink` + description `text-[10px] text-muted`; cols "Título","Categoría","Formato","Tamaño","Descargas","Actualizado","Acción"; row actions `px-2.5 py-1 text-[10px] font-medium rounded-lg`: "Editar" `text-accent bg-accent-light/50`, "Eliminar" `text-bad bg-bad/10`.

**Modals**
- Overlay patterns (INCONSISTENT): (1) `UserFormModal`, `ExpedienteDetail`: `fixed inset-0 z-50 flex center bg-black/30 backdrop-blur-sm p-4` + fade-in .18s (`UserFormModal.jsx:31`); (2) common `Modal`: absolute scrim `bg-black/30 backdrop-blur-sm` (`Modal.jsx:6`); (3) Mesa detail / confirm in Solicitudes: `bg-ink/50` (no blur) (`MesaDeEntrada.jsx:581`, `EmployeeApprovals.jsx:574`), document viewer `bg-ink/60` z-[60] (`MesaDeEntrada.jsx:751`); (4) **no scrim at all**: Documentos form (`DocumentManager.jsx:171`), Mesa form (`MesaDeEntrada.jsx:331`), Solicitudes detail (`EmployeeApprovals.jsx:481`) — fixed full-screen layer with `p-3`/`p-4`, transparent, page remains fully visible behind a translucent `.card` (bg paper 86%) -> flag.
- Panel sizes: UserForm `max-w-md` 448px, `card card-border` (radius 20, border line/70); Documentos/Mesa form `max-w-205` = **820px** (`w-full`, `p-0`, `shadow-2xl`, `p-3` outer); Solicitudes detail `max-w-xl` 576px, `max-h-[calc(100vh-2rem)]`, flex-col with scrollable body; Solicitudes confirm `max-w-md`; Mesa detail `max-w-lg` 512px `p-6`; viewer `max-w-4xl` 896px `max-h-[92vh]`; ExpedienteDetail `max-w-lg max-h-[85vh] overflow-y-auto`; common Modal `max-w-md w-full mx-4 p-6 bg-paper rounded-xl(16px) shadow-2xl`, `animate-slide-up` (translateY 16px→0, .22s).
- Open/close animation: panel `animate-scale-in` (scale .96→1, opacity, 0.22s `cubic-bezier(0.22,1,0.36,1)`), close `animate-scale-out` 0.2s, overlay `animate-fade-in/out` 0.18s (`index.css:1178-1181`); programmatic close delay 220ms/200ms. Form validation fail -> `animate-shake` 0.4s (±6px) (`index.css:1240-1246`).
- Header pattern (form modals): `px-4 pt-3 pb-2 border-b border-line`; 32x32 `rounded-lg bg-brand/10 text-brand` icon tile (16px icon) + title `text-sm font-bold text-ink leading-tight` + subtitle `text-[10px] text-muted` ("Completá los datos del documento" / "Completá los datos del trámite"); close button 28x28 `rounded-md text-muted hover:bg-mist` (14px X). UserForm header: `px-5 py-4 border-b`, title `text-sm font-semibold text-primary` (brand blue), close 20px X in `p-1.5 rounded-lg`. Detail headers: title `text-base`/`text-lg font-bold` + id `font-mono text-[11px]/xs text-muted`.
- Body: forms `p-4 grid grid-cols-2 gap-x-4 gap-y-3` (Documentos) / `gap-y-2` (Mesa); UserForm `px-5 py-4 space-y-3`; footers right-aligned `gap-2`; Solicitudes footers `px-5 py-3 border-t border-line bg-soft/60`.
- Mesa form extra: info strip `px-4 py-2 bg-soft border-b` with "Nº de expediente" (9px uppercase, value `text-xs bold text-brand-deep font-mono tracking-wide`) | 1px divider | "Fecha" (`MesaDeEntrada.jsx:352-374`). Fields: Nombre, Costo, Encargado, Sector (select), Mesa (select: Mesa 1…Mesa 6), Descripción, Requisitos, "Documentación adjunta"; buttons "Cancelar", "Guardar ingreso". Sectors: Mesa de Entradas, Recursos Humanos, Legajos, Liquidaciones, Sistemas (`data/mockMesaEntrada.js:10-16`).
- Mesa detail (`MesaDeEntrada.jsx:568-732`): title, mono id; StatusPill · "Prioridad X" with PriorityDot; `dl` 2 cols (Costo, Encargado, Sector, Mesa, Fecha, Descripción, Requisitos; labels 10px uppercase tracking-widest faint, values `font-medium text-ink`); "Documentación adjunta (N)" rows (FileBadge, name, "PDF · 245 KB", "Ver"/"Descargar" `text-[10px] bold`); **"Progreso del expediente" stepper**: 4 steps (Ingresado → En proceso → Observado → Finalizado), node 14px circle (`bg-brand-deep ring-4 ring-brand-deep/20` current, `bg-brand-deep/60` done, `bg-line` todo), 2px connector bars (`bg-brand-deep/50` done), step label 9px; "Cambiar estado" buttons as `.badge` pills (active = solid tone + paper text + same-tone border: ok/bad/warn/info; inactive `bg-mist text-muted border-line hover:bg-soft`).
- Solicitudes confirm modal (`EmployeeApprovals.jsx:573-651`): 40x40 `rounded-xl` icon tile (ok/warn/bad 10% tint; check / lock / warning-triangle), title `text-base font-bold` ("Aprobar empleado"/"Suspender acceso"/"Rechazar solicitud"), line "{name} · pasará a {Estado}" (estado colored), label ("Nota de aprobación (opcional)"/"Motivo de la suspensión (obligatorio)"/"Motivo del rechazo (obligatorio)"), 2-row textarea, buttons "Cancelar" + ("Confirmar aprobación" btn-primary | "Confirmar suspensión" warn | "Confirmar rechazo" btn-danger).
- Common `Modal` (`Modal.jsx`): title `text-sm font-semibold text-primary`; body `text-sm text-muted mb-6 leading-relaxed`; buttons: ghost + confirm `px-4 py-2 text-sm font-medium text-paper rounded-lg` with gradient `bg-linear-to-r from-primary to-primary-light` (brand #2F6BFF → #EBF2FF in light = ends nearly white under paper-colored text) or danger `from-red-500 to-red-600`. Used for "Eliminar documento" ("¿Estás seguro de eliminar este documento de la biblioteca?", confirm "Eliminar") (`DocumentManager.jsx:147-149`).

**Toast** (`components/common/Toast.jsx`): container `fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm` (16px from edges, stack gap 8px, max 384px) (l.35); each toast `flex items-center gap-2.5 px-4 py-3 rounded-xl(16px) shadow-lg bg-linear-to-r text-paper text-sm font-medium animate-slide-up` (l.39); gradients **[TW-default hexes]**: success emerald-500→600 (#10b981→#059669), error red-500→600 (#ef4444→#dc2626), info brand→primary-light (#2F6BFF→#EBF2FF light), warning amber-500→600 (#f59e0b→#d97706) (l.26-29); 16px icons: check (success), X (error), info-circle (info); warning has no icon; trailing 16px close X `text-paper/60`; auto-dismiss **3500ms** (l.18). Not responsive (no mobile variant). Sample messages: "Usuario "X" actualizado.", "Configuración guardada correctamente", "Documento eliminado" (info).

**Skeletons** (`components/admin/Skeleton.jsx`): `TableSkeleton` = `card card-border` with toolbar `px-4 py-3` + `h-9 rounded-lg` bar, rows `px-4 py-3.5 gap-4` of `h-4 rounded flex-1` cells with opacity `1 - col*0.12`; `StatsSkeleton` = 4 cards (`p-4`, 40x40 `rounded-xl` + 48x16 + 80x28 + 96x16 bars); `CardSkeleton` lines `h-4 rounded mb-2` widths [60,90,75,45]%. Used with a 400ms fake load in Documentos/Configuración. **Flag:** blocks use class `animate-shimmer` which sets only the animation (`index.css:1152`) — the gradient background lives in a different class `.skeleton` (`index.css:1143-1148`: linear-gradient mist 25% / soft 37% / mist 63%, size 800px 100%, 1.4s linear) that is never applied -> in the shipped web UI skeleton bars are effectively transparent. Intended look = `.skeleton` gradient.

**Empty states**: (a) `components/admin/EmptyState.jsx`: centered `py-12 px-4`, icon tile 64x64 `bg-soft rounded-2xl ring-1 ring-line` with 32px muted inbox icon, title `text-sm font-semibold text-muted` default "Sin resultados", description `text-xs text-muted max-w-xs` default "No se encontraron elementos con los filtros actuales." (Documentos: "Sin documentos"/"No hay documentos en esta categoría." + ghost button "Ver todos"). (b) `ui.jsx:124-135`: `py-16 px-4`, icon `text-5xl opacity-80` (emoji "🗂️" or 40px svg), title `text-base font-semibold text-ink`, description `text-sm text-muted mt-1.5 max-w-sm`, action `mt-4` (Mesa: "Sin ingresos para mostrar"/"No hay registros que coincidan con la búsqueda o el filtro seleccionado." + btn-primary "Registrar ingreso"; Solicitudes: "Sin solicitudes para mostrar"/"No hay solicitudes pendientes. Todo está al día." / "No hay registros que coincidan con la búsqueda o los filtros." + btn-ghost "Limpiar filtros"). Plain-text empties: Usuarios/Knowledge/SIGED `text-sm text-muted text-center py-8` ("No hay artículos en esta categoría.", "No hay expedientes con ese estado.").

**Pagination** (`components/common/Pagination.jsx:16-48`): centered row `gap-1 px-4 py-3 border-t border-line`; buttons `px-3 py-1.5 text-xs font-medium rounded-lg`; inactive `text-muted hover:bg-mist`; current `bg-primary text-paper shadow-sm`; "Anterior"/"Siguiente" (disabled `opacity-30`); ellipsis "..." (`px-2 text-xs`); window = first, last, current±1. Page size default 5; Documentos uses 6. Only Documentos uses it (Solicitudes/Mesa/Usuarios have no pagination). Reportes has a static disabled prev/next pair of 24px square icon buttons + "1 - N de N expedientes" (`ReportsPage.jsx:920-947`).

**Access-denied cards inside screens**: Solicitudes: `card p-10 text-center max-w-lg mx-auto mt-10`, 48px `rounded-xl bg-bad/10 text-bad` lock tile, "Acceso restringido" `text-lg bold`, text "Esta sección es exclusiva del rol Superadmin. Tu rol actual es {role}." (`EmployeeApprovals.jsx:118-130`); Mesa: emoji 🔒, "Tu rol actual (X) no tiene permiso para gestionar la Mesa de Entradas. Contactá a un Administrador." (`MesaDeEntrada.jsx:70-81`).

**Animation constants**: easing `cubic-bezier(0.22,1,0.36,1)` everywhere; list/card entries `slide-up` 16px .22s; `animate-fade-in` .18s; `dot-ping` 1.6s; `pulse-dot` 1.2s (scale .7/opacity .4); route enter 0.28s. Respect `prefers-reduced-motion` (`index.css:1951`; CountUp `ui.jsx:4-10`).

### Inferences
- Core mobile tokens to port: 20px card radius, 16px control radius (inputs/chips-large), pill buttons (999px) UPPERCASE 12px bold tracking 0.1em, 10px-radius NOT used anywhere (stale DESIGN.md).
- Treat Usuarios/Conocimiento/SIGED legacy square styling as "pending restyle"; port them with the modern primitives unless fidelity to the exact web look is required.

### Gaps
- Final pixel heights are derived from Tailwind classes, not measured.
- `shadow-*` utility values are Tailwind defaults (not in repo).

---

## Q5. Charts (ReportsPage only; no chart library, pure SVG/CSS)

### Takeaway
Four chart types, all hand-built, using Tailwind default palette (not brand tokens): radial gauge, donut, segmented stacked bar, horizontal progress bars. Reportes is the only screen not using theme tokens (white/slate cards).

### Cited Findings
- **Radial gauge** (KPI "Objetivo mensual · Resolución de Trámites"): `w-24 h-24` (96px) SVG viewBox 100, rotated -90°, track circle r=38 stroke-width 8 `text-slate-100 dark:text-slate-800`, progress circle same r, `strokeDasharray 238.76`, `strokeDashoffset 57.3` (=76%), round caps, color `text-blue-600 dark:text-blue-500`, transition 1000ms ease-out; center text "76%" `text-lg font-black` + "Cumplido" 9px uppercase tracking-wider slate-400; side text "Se ha resuelto el 76% de los expedientes dentro del plazo normativo." `text-xs`; footer "Meta fijada: 80% al cierre del mes" `text-[11px] text-blue-600` with 6px blue dot, top border slate-100 (`ReportsPage.jsx:343-399`).
- **Donut "Canales de Atención"** (l.489-560): SVG `w-44 h-44` (176px), viewBox 160, r=65, stroke-width **22**, arcs via dasharray/dashoffset (no gaps, no round caps), -90° start, hover `opacity-85`, 700ms transition. Data/colors (l.211-216): ChatAP Bot 380 `#3b82f6`; Mesa Digital 265 `#06b6d4`; SIGED Central 190 `#f59e0b`; Presencial 100 `#8b5cf6`; total 935. Center: total `text-2xl font-black`, caption "Trámites" 11px uppercase slate-400. Legend `grid-cols-2 gap-x-6 gap-y-2.5 mt-4 text-xs`: 10px color dot + "Label:" + bold value right-aligned. Header: title "Canales de Atención" / sub "Origen de consultas y trámites" + outline button "Exportar".
- **Pipeline segmented bar "Pipeline SIGED"** (l.679-717): container `flex h-3 (12px) w-full rounded-full overflow-hidden gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800`; segments widths 30/21/16/21/12 %: "Mesa de Entrada" 45 `bg-blue-500`, "En Dictamen" 32 `bg-purple-500`, "Despacho RR.HH." 24 `bg-cyan-500`, "Liquidaciones" 33 `bg-amber-500`, "Finalizado" 18 `bg-emerald-500` (l.202-208); breakdown list rows `text-xs` with 10px dot, label `font-medium`, "N trámites" bold, pct mono 11px right (w-8). Chip "152 Trámites"; footer "Tiempo medio de pase: 1.8 días" / "✓ Circuito fluido" emerald-500.
- **Horizontal progress bars "Usuarios por Rol"** (l.1052-1073): per row label + mono count, track `h-1.5` (6px) `rounded-full bg-slate-100 dark:bg-slate-800`, fill `bg-blue-500` width = count/max, 500ms. Rows: Superadmin, Administrador, Ciudadano.
- **Two-segment status bar "Estado Operativo de Usuarios"** (l.1075-1093): `h-3 rounded-full gap-0.5`, emerald-500 94% + slate-400 6%; below 2 stat tiles `p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg` ("Activos" 94% `text-lg bold emerald-600`, "Inactivos" 6%).
- Tailwind default hexes **[TW-default, not in repo]** for the class-based colors: blue-500 #3b82f6, blue-600 #2563eb, purple-500 #a855f7, cyan-500 #06b6d4, amber-500 #f59e0b, emerald-500 #10b981, slate-100 #f1f5f9, slate-200 #e2e8f0, slate-400 #94a3b8, slate-800 #1e293b, slate-900 #0f172a.
- **Reportes card style** (all widgets): `rounded-xl (16px) border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4|p-5 shadow-sm`; card header `pb-3 border-b border-slate-100 dark:border-slate-800` with title `text-sm font-bold` + sub `text-xs text-slate-500`. KPI grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`; 3-widget row `grid-cols-1 lg:grid-cols-3 gap-6`; top lists `lg:grid-cols-2 gap-6`. KPI cards 2-4: label `text-xs font-semibold uppercase tracking-wider slate-500`, 32px icon tile `p-2 rounded-lg bg-slate-100`, value `text-3xl font-black tracking-tight` with CountUp, delta chip `bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[11px] semibold` ("+12.4%" "vs mes anterior"; "+8.2%" "gestiones activas"; "+20.1%" "vs mes anterior"). KPI titles: "Ciudadanos Atendidos", "Expedientes SIGED", "Vistas e Interacciones".
- Reportes controls: period segmented `bg-slate-100 p-1 rounded-lg border text-xs`, options "7 días","30 días","90 días" (active white card + shadow-sm); date range button "15 Ago 2026 - 11 Sep 2026" (hard-coded); dark solid button "Descargar Informe" (`bg-slate-900 text-white dark:bg-white dark:text-slate-900`); tabs underlined `border-b-2 border-blue-600` text-xs semibold: "Dashboard General & SIGED", "Lo Más Solicitado & Base de Conocimiento (N)".
- Tasks widget "Tareas y Pendientes" (sub "Acciones administrativas urgentes"): "+ Nueva tarea" button `text-blue-600 bg-blue-50 border-blue-200 rounded-md text-xs`; task row `p-2.5 rounded-lg`, checkbox, title `text-xs font-semibold` (completed = line-through slate-400), subtitle `text-[11px] truncate`, right: priority chip `px-1.5 py-0.5 rounded text-[10px] bold` Alta `bg-rose-100 text-rose-700`, Media `bg-amber-100 text-amber-700`, Baja `bg-slate-100 text-slate-600` + due date 10px; footer "N de M completadas" / "Actualizado hace instantes".
- Reportes table: checkbox col + "Solicitante","Trámite / Asunto","Canal","Estado","N° Expediente","Fecha","Acción"; header `text-[11px] uppercase tracking-wider text-slate-400 border-b`, th `py-3 px-3`, rows `divide-y divide-slate-100`, selected row `bg-blue-50/60`; **status badges here use a DIFFERENT palette from StatusPill**: Finalizado emerald-100/800, En proceso blue-100/800, Observado amber-100/800, Ingresado purple-100/800, each `rounded-full border text-[11px] semibold px-2 py-0.5` with 6px dot (Finalizado dot pulses) (l.862-885). Ranked lists: rank chip 24x24 `rounded-md` (1st amber-100/700, 2nd slate-100, others blue-50/600), row `p-2 rounded-lg`, right counter mono bold ("N vistas" / "N descargas" emerald-600) (l.979-1048). Section titles: "Lo Más Solicitado en ChatAP" `text-base bold`, "Preguntas Más Frecuentes", "Documentos y Formularios Más Descargados", "Usuarios por Rol", "Estado Operativo de Usuarios".

### Inferences
- A mobile port can render these as: gauge (96px), donut (176px, 22px stroke), stacked bar (12px) and progress bars (6px) with the exact hex palette above; they stay on white/slate-900/70 cards in light/dark.

### Gaps
- Numbers in Reports are hard-coded demo values (not meaningful for visual spec). No axes/tooltips exist (only native `title` attributes on pipeline segments).

---

## Q6. Notification panel and global search palette (components exist, NOT mounted)

### Takeaway
`NotificationCenter`, `GlobalSearch`, `ActivityLog` and `ExpedienteDetail` are not imported by any file in `src/` (grep for `import` of each name returns none), so they do not appear in the shipped admin UI. They are documented because they are in the requested file list; the mobile app should treat them as optional/legacy.

### Cited Findings
- **NotificationCenter** (`components/admin/NotificationCenter.jsx`): bell button `p-2 rounded-lg hover:bg-paper/10`, 20px bell icon `text-paper/70` (designed for a dark header), unread badge `w-4.5 h-4.5` (18px) `bg-bad text-paper text-[9px] font-bold rounded-full ring-2 ring-primary` at top-right (l.45); dropdown `absolute right-0 top-full mt-2 w-80 (320px) card card-border overflow-hidden z-50 animate-scale-in shadow-xl` (l.52); header `px-4 py-3 border-b` title "Notificaciones" `text-sm font-semibold text-primary` + link "Marcar todas leídas" `text-xs text-accent font-medium`; list `max-h-72 (288px) overflow-y-auto divide-y divide-line`; item `px-4 py-3`, 8px dot (`bg-info` siged/document, `bg-ok` user, `bg-warn` knowledge, `bg-muted` settings; unread dot pulses), title `text-xs` (unread `text-ink font-semibold`, read `text-muted` + row `opacity-60`), description and time `text-[10px] text-muted`; empty = 32px bell + "No hay notificaciones". Sample items: "Nuevo expediente ingresado — EXP-2026-011 — Licencia por Enfermedad (Hace 5 min)", "Usuario creado", "Artículo modificado", "Documento subido", "Configuración actualizada" (l.3-9).
- **GlobalSearch** (`components/admin/GlobalSearch.jsx`): container `min-width:260px`; input `.input-field pl-9 pr-10 text-xs` placeholder "Buscar..." with 16px magnifier left and a `<kbd>` "Ctrl+K" right (`px-1.5 py-0.5 text-[10px] font-mono bg-mist rounded border border-line`) (l.41-47); results panel `absolute top-full mt-1.5 card card-border overflow-hidden z-50 animate-scale-in shadow-lg`, appears at >=2 chars, max 8 results (l.26-30,49); row `px-3 py-2.5 hover:bg-soft border-b border-line`, type chip `px-1.5 py-0.5 text-[10px] font-semibold rounded border`: "Art." purple (`bg-purple-50 text-purple-600 border-purple-200`), "Doc." emerald, "SIGED" amber (l.39,54); title `text-xs font-medium truncate`, desc `text-[10px] text-muted truncate`; empty = 24px magnifier + `Sin resultados para "{query}"`. It is a dropdown under an input, not a full-screen command palette. Esc clears.
- **ActivityLog** (`ActivityLog.jsx`): `card card-border`; header `px-4 py-3 border-b` clock icon + "Actividad Reciente" + count chip `text-[10px] bg-mist px-1.5 py-0.5 rounded` "N eventos" + link "Ver todo"/"Mostrar menos"; rows `px-4 py-2.5` with 28px icon tile `p-1.5 rounded-lg` (colors by type from `data/mockActivity.js:38-44`: user blue-50/600, siged amber-50/600, knowledge purple-50/600, document emerald-50/600, settings slate-50/600), sentence "**{user}** {action} "{target}"" `text-xs`, timestamp `text-[10px]`; empty "No hay actividad reciente." Default limit 6.
- **ExpedienteDetail** (`ExpedienteDetail.jsx`): modal `max-w-lg max-h-[85vh]`; 40px gradient chip (accent → primary-lighter) with last 3 chars of id (mono), 2-col fields (Tipo, Solicitante with 20px avatar, Área, Fecha), status block `bg-soft rounded-xl p-4` with outlined `StatusBadge` (`rounded-lg border`, tone/10 + tone/20 border) and a select "Cambiar estado..." + button "Actualizar" (`bg-accent rounded-lg`), vertical timeline `border-l-2 border-line` with 12px dots (ok / info) titled "Movimientos".

### Gaps
- Because these are not mounted, no real screenshot-equivalent exists; the above is only their code-level style.

---

## Q7. Representative screens — physical layout

### Takeaway
All admin screens sit inside the same shell; content is a single column of: page header -> (optional) stat grid -> one big bordered card containing toolbar (search + filters/chips) -> table or list.

### Cited Findings
1. **Dashboard** (`/admin`): max 1152px column. Top block (border-bottom line/70, pb 48px): bracket kicker "[ Panel de administración ]" -> "ADMINISTRACIÓN." (`display-2`, 30–48px, weight 600) -> lead "Hola, {Nombre}. Resumen de la actividad del panel, los expedientes y la base de conocimiento de ChatAP." (17.6–23.2px muted). 48px gap, then 4-cell hairline metric strip (2x2 on <1024, 1x4 on >=1024, rounded-2xl). 64px gap, then card "Últimos movimientos" with 5-col table of 4 rows. (`Dashboard.jsx:34-90`)
2. **Mesa de Entradas**: PageHeader (right slot: btn-primary "+ Registrar ingreso" with 16px plus icon) -> 4 StatCards ("Ingresos totales" brand, "En proceso" warn hint "requieren atención", "Observados" bad hint "pendientes de corrección", "Finalizados" ok hint "completados") -> `card p-5`: toolbar row `flex-wrap gap-3 mb-4` = search (`flex-1 min-w-55` 220px, placeholder "Buscar por nombre, encargado, sector o nº…") + status chip row -> table (clickable rows) -> opens detail modal; "Registrar ingreso" opens 820px form modal. (`MesaDeEntrada.jsx:97-253`)
3. **Solicitudes**: PageHeader (right: `badge bg-mist text-muted border border-line` with pulsing 6px warn dot "{n} pendiente(s)") -> 5 StatCards ("Pendientes" warn "aguardan tu revisión", "Activos" ok "empleados aprobados", "Suspendidos" warn "acceso suspendido", "Rechazados" bad "no ingresaron", "Solicitudes totales" brand "historial completo") -> `card p-5`: tab row -> search (flex-1) + department select (`sm:w-60` 240px; first option "Todas las dependencias"; departments Mesa de Entradas / Recursos Humanos / Legajos / Liquidaciones / Sistemas) stacked on <640 -> table (min-w 800px, horizontal scroll) -> footnote. (`EmployeeApprovals.jsx:239-477`)
4. **Usuarios**: `flex-col sm:flex-row` header (title+count left, square "+ NUEVO USUARIO" button right) -> square bordered box with search (max 320px) and table. Modal "Nuevo usuario"/"Editar usuario".
5. **Conocimiento**: header with "+ Nuevo Artículo" -> wrap row of square category chips ("Todas","Licencias","Haberes","Ingresos","Trámites","Legajos","Sistemas", `data/mockKnowledge.js:22`) -> vertical stack (`space-y-4`) of square bordered article cards (`p-6`; question `text-sm bold uppercase tracking-wide`, category tag `text-[10px] uppercase bg-mist px-2 py-0.5`, answer `text-xs text-muted leading-relaxed`; right-aligned 3 buttons Activo/Inactivo, Editar, Eliminar) -> inline form card (`mt-8 p-6`, title "Agregar Nuevo Artículo"/"Editar Artículo", fields "Pregunta", "Respuesta", "Categoría", button `bg-ink text-paper` "Agregar Artículo"/"Guardar Cambios" + outlined "Cancelar"). Editing is simulated with `alert`.
6. **SIGED**: title block -> square card: status strip `px-6 py-4 bg-mist` ("■ API conectada | Última sincronización: {fecha}" with 8px SQUARE `bg-ok` + button "Sincronizar ahora") -> filter chips "Todos (N)", "Ingresado (n)"... -> 7-col table ("Expediente" mono brand-deep xs semibold, "Tipo","Solicitante","Área","Fecha","Estado" solid tags,"Último movimiento") -> 3 info cards `md:grid-cols-3 gap-6` ("Mesa de Entradas" text, "API Status" with 8px square ok dot "Operativa | Latencia: 45ms", "Consultas hoy" `text-3xl bold` number).
7. **Documentos**: header (title + count line, `btn-primary` "+ Nuevo Documento") -> `card card-border` containing chip row, sortable table, optional EmptyState, Pagination -> modals.
8. **Configuración**: header with right pill `inline-flex gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600` + 6px dot ("Respuestas automáticas activas" / "…desactivadas" on `bg-mist text-muted`) -> `grid-cols-1 lg:grid-cols-2 gap-6 mb-8` of two `card card-border p-4` cards: "Mensajes del Chatbot" (fields "Nombre del asistente", "Mensaje de bienvenida", "Mensaje secundario"), "Comportamiento" (toggle "Respuestas automáticas" + desc "El chatbot responde automáticamente basado en la base de conocimiento", select "Horario de atención" options "24/7 — Todos los días", "08:00 — 18:00 hs", "08:00 — 20:00 hs", "09:00 — 17:00 hs", input "Dependencia"); card title `text-sm font-semibold text-primary` with 16px accent icon; submit `btn-primary` "✓ Guardar configuración" + inline "Cambios guardados" `text-xs text-emerald-600`. (`ChatbotSettings.jsx:46-126`)
9. **Reportes**: header -> tabs -> 4 KPI cards -> 3 widgets -> table card -> "Lo Más Solicitado" section -> role bars. (Q5)

### Inferences
- Common vertical rhythm: header mb 32px (PageHeader) / 32px (legacy), stat grid mb 24px, card padding 20px (`p-5`), table cell padding 20x12-14px.

### Gaps
- Profile sub-screens and citizen chat visuals are only summarized, not specified.

---

## Q8. Light vs dark differences (admin)

### Takeaway
Theme = `.dark` class on `<html>`; every `paper/ink/mist/soft/line/muted/faint/brand` token flips (table in Q4). Sidebar, status colors (ok/warn/bad) and semantic hexes do NOT change; Reportes switches via explicit `dark:` Tailwind variants.

### Cited Findings
- Swap list (`index.css:159-183`): page bg #F0F4F9 -> #070E20; cards (86% paper) accordingly; text #0F1730 -> #EAF0FA; muted #4A5578 -> #8A9BC0; faint #7E8BA7 -> #4E5F85; brand #2F6BFF -> #4D7DFF; brand-deep #1C44B6 -> #2F55C0; info follows brand; ok/warn/bad identical; primary-lighter #F5F8FF -> #091230 (card-interactive hover); mist #E2EAF4 -> #0D1730; soft #D5E2F1 -> #132247; line alpha base color flips from navy to light-blue-white at the same .12 alpha.
- Always dark regardless of theme: sidebar (#141414, #222 hover, #9e9e9e text), `bg-ink/50` scrims (ink flips: dark navy-ish in light mode, light #EAF0FA at 50% in dark mode — scrim in dark mode is LIGHT), `bg-black/30` scrims, toast gradients, button hover #EBEBEB.
- Dark-specific text risks: `btn-primary` text = paper = #070E20 on #2F55C0; modern pills fine.
- Reportes: light = white cards on paper (#F0F4F9) with slate-200 borders; dark = `bg-slate-900/70` (#0f172a at 70%) with slate-800 borders, text white, accent blue-500/400 (`ReportsPage.jsx:225-244,343`).
- ThemeToggle (`AdminLayout.jsx:30-60`): button in top bar right; sun icon shown in dark, moon in light; persists `localStorage.theme`.
- DESIGN.md stale vs code (do not use): sidebar #070E20/272/64, hover #101B35, text #98A3BE; paper #EDF1F9/#0A1124; ok #1FA45C; radius control 10px/card 14px; "Toast bottom-4 right-4" (this one matches).

### Inferences
- A mobile theme file needs exactly the two columns of the Q4 token table + the always-dark sidebar constants.

### Gaps
- No contrast audit performed; the white-on-light header text (Q2) and yellow `warn` pill text are visible defects in light mode.

---

## Q9. Quick reference — literal Spanish labels (admin)

### Cited Findings
- Sidebar: PRINCIPAL / Dashboard / Mesa de Entradas / GESTIÓN / Solicitudes / Usuarios / Conocimiento / Documentos / SISTEMA / Integración SIGED / Configuración / Reportes / "Volver al inicio" (`AdminSidebar.jsx:4-70,298`); aria "Panel de administración", "Ocultar barra lateral"/"Mostrar barra lateral".
- Top bar: kicker "Panel de administración"; titles Resumen / Mesa de Entradas / Solicitudes / Usuarios / Conocimiento / Documentos / Integración SIGED / Configuración / Reportes; aria "Cambiar tema".
- Status vocab: Ingresado / En proceso / Observado / Finalizado; employee: Pendiente / Activo / Suspendido / Rechazado; user status: Activo / Inactivo; roles: Superadmin / Administrador / Ciudadano; priority: Alta / Normal / Baja (Reportes tasks: Alta / Media / Baja).
- Common buttons: Cancelar, Guardar cambios, Crear usuario, Editar, Eliminar, Ver, Descargar, Aprobar, Reactivar, Suspender, Rechazar, Cerrar, Limpiar filtros, Ver todos, Anterior, Siguiente, Sincronizar ahora, "+ Nuevo Usuario", "+ Nuevo Artículo", "Nuevo Documento", "Registrar ingreso", "Guardar ingreso", "Guardar configuración".

### Gaps
- Strings in mock data (names, expedientes) intentionally omitted.

---

## Q10. Consolidated gaps and flags for the report writer
- Mobile behavior of the admin panel: **does not exist in the web code** (no drawer/bottom nav/breakpoint handling; `.admin-content` is dead CSS). Any mobile navigation is a new design decision.
- `.display-3` and `.kicker` CSS classes are referenced but undefined -> title typography of PageHeader screens is effectively unstyled (16px uppercase). Intended editorial type exists only for `display-1/2` and `lead`.
- Skeletons are invisible as coded (missing background class). `text-ok-dark` undefined.
- Top-bar title and user name are `#ffffff` in light theme (invisible-ish).
- Modal scrims inconsistent (none / black-30+blur / ink-50 / ink-60); several form modals have no scrim.
- Three visual dialects coexist: modern token UI, legacy square UI (Usuarios, Conocimiento, SIGED), slate/white Reports UI. Status colors differ between StatusPill (info/warn/bad/ok) and Reportes table badges (purple/blue/amber/emerald).
- Dead components (not mounted): NotificationCenter, GlobalSearch, ActivityLog, ExpedienteDetail.
- Everything is demo data stored in localStorage/mocks (no backend); visual spec unaffected.
- `DESIGN.md` conflicts with `index.css` (stale doc) — code values used here.
- Pixel heights/line-heights marked [derived] are computed from classes, not measured in a browser; Tailwind default theme values marked [TW-default] are not defined in the repository.
