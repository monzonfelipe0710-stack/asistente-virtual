# Plan de Reimplementación — ChatAP · Referencia Content Architecture

> FASE 1 · Auditoría y plan. Estado: aprobado → implementación por etapas sobre la base integrada
> (commits del equipo `c1b17a4` + `7edb8fd` fusionados en `dev-felipe`, + nuestro sistema de diseño propio respaldado en `backup-rediseno-previo`).

## 1. Inventario actual (rutas y funcionalidades verificadas)

| Ruta | Vista | Funcionalidad |
|---|---|---|
| `/` | **Landing** (nueva, del equipo) | Hero + marquee + intro + servicios + chat + confianza + CTA final |
| `/chat` | Ciudadano / Chat | Bot con conocimiento, voz, wizards, follow-ups, memoria, PDF, avatar (bloub) |
| `/login` | Login / Registro | Auth con email y contraseña, pestañas, recuperación |
| `/restablecer` | Reset contraseña | Token de un solo uso (1 h), EmailJS o enlace en pantalla |
| `/perfil` | **Mi Perfil** (nueva) | Tab por rol: Resumen, Trámites, Solicitudes, Conversaciones, Actividad, Notificaciones, Seguridad, Permisos, Auditoría |
| `/contacto` y `/soporte` | Contacto | Form + canales |
| `/admin/*` | Panel de gestión | Dashboard, Mesa de Entrada (PDF), Solicitudes, Usuarios, Conocimiento, SIGED, Documentos, Configuración, Reportes |
| `*` | 404 | — |

Proveedores: `ToastProvider → AuthProvider → ChatProvider → AdminProvider`; router con `PageTransition` (route/enter-exit), onboarding global (`BotOnboardingModal`), theme `dark` por clase.

Stack: React 19 · Vite 8 · Tailwind v4 · react-router 7 · pdfjs · EmailJS. Sin backend: datos mock + localStorage. Scripts: `dev`, `build`, `preview`, `lint`.

## 2. Estado del diseño tras el merge

El equipo ya reimplementó gran parte del lenguaje editorial en la base (compatible con nuestra dirección):

- **Tipografía real de la referencia**: PP Neue Montreal / Text (woff2 en `/public/fonts`).
- Tokens claros/oscuros, `--color-brand: #ff4000`, `--radius-control: 0px`, `--shadow-soft: none`.
- Landing con Hero, Marquee (ticker), secciones numeradas, `giant-outline`, `nav-tab`, panel técnico con `TechnologyTexture`, reveal al scroll.
- Perfil completo (9 secciones), onboarding con spotlight/`tour-*`, footer con tipografía gigante.
- `.display-1..3` (escala vw), `.kicker`, `.lead`, `.ed-max`, `.section-bleed`, `.status-dot`, `.chip-suggest`.

**Gaps / inconsistencias detectadas en la base (a resolver):**
1. `npm run lint` → 33 problemas (patrones conocidos: refresh-only-export, setState-in-effect, no-useless-assignment, unused, conditional hooks).
2. Tema: `index.html` fuerza **dark por defecto** (contradice "claro predeterminado" del commit `e734f83`).
3. Radios mixtos: `--radius-control: 0` pero `.card` usa `rounded-2xl` (≈1rem) y varios componentes `rounded-xl` — el lugar geométrico del radio no es unificado.
4. Navbar del equipo: `NAV_LINKS` con `key` duplicados y anchors a `#capacidades/#confianza/#charla` que deben existir en el landing; botón "Ingresar" con utilidades `!` v4 dudosas (`px-4!`) — verificar en navegador.
5. La conversación por mensajes hereda quedó con `bubble-chip` **pill** (9999px) y `container-ia-chat` con **backdrop-blur** — fuera del lenguaje editorial (nuestro `chat-msg` ya lo resolvía en el respaldo).
6. Consola admin: verificar sidebar/cabecera/tablas contra nuestro lenguaje (tokens `--sidebar-*` ya presentes).
7. `MessageBubble.jsx` del merge es **nuestro archivo** (no fue tocado por el equipo) → alinear sus clases con la base (tokens/brand naranja) y portar el resto del lenguaje de mensajes.

Nuestro respaldo (`backup-rediseno-previo`, 36 archivos) aporta: tokens + coerción de radios/sombras, `chat-msg` editorial, consola admin con barra activa cuadrada, sidebar negra con `sidebar-bot-surface`, páginas de auth editoriales, Toast/Motivar planas, móvil ≤520px para nav, y los 33 fixes de lint (algunos ya aplicados por el equipo).

## 3. Mapa referencia → proyecto

| Patrón de referencia | Pieza base (equipo) | Unidad: conservar | Unidad: aportar (nosotros) |
|---|---|---|---|
| Nav flotante técnica | `.nav-tab` en navbar sticky | `.nav-tab`, MobileMenu | Corregir NAV_LINKS (keys/anchors), utilidades `!`, default light |
| Hero editorial dividido | `landing/Hero` | Hero + TechnologyTexture | Verificar clamp/consistencia con tokens |
| Ticker/Marquee | `landing/Marquee` + `.animate-ticker` | Marquee | Asegurar `prefers-reduced-motion` + pausa hover |
| Secciones numeradas | `.kicker`/`.fig-num` + landing sections | Sections | — (ya cubierto) |
| Tipografía de mensajes | legacy `bubble-chip`/`container-ia-chat` | Composer (micro-auto = input-text) | Portar `chat-msg` editorial (borde izq, meta mono) |
| Consola admin | tokens `--sidebar-*`, Dashboard, ui.jsx | Funcionalidad completa | Mono-labels, thead mono, StatusPill/PriorityDot, barra activa cuadrada |
| Formularios editoriales | LoginRegister/Contacto/Reset (grandes) | Estados/flujos | Pestañas segmentadas sin pill, `input-field`, `btn-primary` naranja, headers display |
| Perfil | 9 secciones + ProfileLayout | Todo | Revisión de herencia de tokens y pulido puntual |
| Footer | Editorial + tipografía gigante | Footer | — |
| Onboarding | `BotOnboardingModal` + `.tour-*` | Todo | Asegurar que respeta reduced-motion y rounds |

## 4. Componentes a crear / modificar

- **Modificar (unificación)**: `src/index.css` (tokens + coerción + `.chat-msg` + port de utilidades), `src/pages/LoginRegisterPage.jsx`, `src/pages/ContactoPage.jsx` (rama "sent" incluida), `src/pages/ResetPasswordPage.jsx`, `src/pages/NotFoundPage.jsx`, `src/components/ciudadano/ChatWindow.jsx`, `src/components/ciudadano/MessageBubble.jsx`, `src/components/ciudadano/QuickReplies.jsx`, `src/components/admin/AdminSidebar.jsx`, `src/components/admin/Dashboard.jsx`, `src/components/admin/ui.jsx`, `src/pages/AdminLayout.jsx`, `src/components/common/Navbar.jsx` (fixes), `src/components/common/Footer.jsx` (retoque), `index.html` (tema default light).
- **Crear/portar**: `src/components/ui/` primitivas compartidas si se necesitan (SIN duplicar Reveal/Marquee del equipo) — decisión: reutilizar `common/Reveal` y `landing/Marquee`.
- **Lint**: corregir los 33 errores sobre la base (mismos patrones ya resueltos en el respaldo).

## 5. Interacciones y animaciones

- Reveal al scroll (`reveal-up`, `blur-reveal`), ticker con pausa hover, `page-enter/exit` por ruta, `tour-glow` del onboarding.
- Micro: `chip-suggest` (arrow sliding), `service-row` (title translate), `status-dot` con `dot-ping`, cursor del bot por `BotReactionController`.
- Todas bajo `prefers-reduced-motion` (ya hay bloque global).

## 6. Estrategia responsive

- Desktop ≥ 1024: grid editorial `ed-max/section-bleed`, nav sticky con DesktopNav (sm/2xl).
- Tablet 640–1023: grid 1 col, `quick-replies` a 2 → 1, MobileMenu en <1024.
- Móvil ≤ 520: paddings tipo `section-bleed` con 1.25rem, nav compacto, hero clamp vw.
- Sin escala forzada: todos los display en `clamp(…vw)`.

## 7. Riesgos y mitigación

- **Duplicación de sistemas CSS** (tokens del equipo vs. nuestros). → La base del equipo es la fuente; nosotros añadimos/conciliamos, nunca reemplazamos.
- **OH: nombres iguales (Reveal, Marquee)**. → Reutilizar los del equipo; no portar copias.
- **Tocar componentes grandes del equipo (Login/Contacto/Perfil) puede romper estados.** → Cambios solo de clases + verificación `build`/`lint` por etapa y recorrido manual.
- **`bubble-chip` pill / blur**: no son rompimiento, pero atendemos luego de estabilizar.
- **No puedo revisar el navegador en vivo**: cierro con etapas verificadas por compilación + recorrido por consola de dev server; el usuario hace la pasada visual final de comparación con la referencia.

## 8. Plan por etapas

1. **Estabilizar**: 33 fixes de lint · tema claro por defecto · build verde.
2. **Unificar sistema visual** en `index.css`: radios uniformes (control 2px / card 3px + coerción de `rounded-*`), portar `.chat-msg`, `.sec-meta`, `.mono-label`, `.cta-block`, `.status-indicator` y utilidades faltantes.
3. **Navbar/Footer**: corregir NAV_LINKS y utilidades v4; verificar presentación mobile.
4. **Chat ciudadano**: `MessageBubble` + `QuickReplies` + composer → lenguaje editorial de mensajes; verificar wizard/chips/voice.
5. **Admin consola**: sidebar con barra activa cuadrada + mono; `ui.jsx`/`Dashboard` armónicos; tablas con thead mono y puntos de estado.
6. **Páginas públicas**: Login/Registro/Reset/Contacto/404 editoriales (mantener estados/flujos).
7. **Perfil + Landing**: revisión de herencia y pulido puntual.
8. **QA final**: lint + build + recorrido de todas las rutas/flujos (ciudadano, adm, superadmin, dark/light, 320/768/1440) + comparación visual con la referencia.

## 9. Criterios verificables de aceptación

- [ ] `npm run lint` y `npm run build` sin errores.
- [ ] Todas las rutas cargan y los flujos reales funcionan (login, registro, reset, chat + voz + wizard, perfil × rol, admin completo, buscador, notificaciones, PDF).
- [ ] Tema claro por defecto y toggle dark/light correcto y persistente.
- [ ] Radios/sombras unificados; sin pil(x) ni glassmorphism en estados finales donde el lenguaje pide rectángulo plano.
- [ ] Nav móvil operativo (menú, anchors del landing, login, perfil).
- [ ] `reduced-motion` respetado (ticker, reveal, tour, page transitions).
- [ ] Contraste y foco visible suficientes en estados hover/focus/activo/vacío.
- [ ] Comparación visual con la referencia: nada genérico, desproporcionado o incompleto.