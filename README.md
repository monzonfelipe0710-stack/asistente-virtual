# ChatAP — Asistente Virtual de la Administración Pública

Portal web con **asistente virtual (bot)** para el ciudadano y **panel de gestión** para la administración, orientado a la Subsecretaría de Recursos Humanos de la Provincia de Formosa.

El proyecto es 100 % **frontend**: toda la información se simula con datos mock y se persiste en `localStorage`. No requiere backend ni base de datos.

---

## ✨ Funcionalidades

### 🧑💻 Para el ciudadano
- **Landing editorial** en `/`: hero dividido, ticker, secciones narrativas, demostración del chat y CTA final.
- **Chat con el bot ChatAP** en `/chat`: consultas por texto o **por voz** (Web Speech API).
- **Respuestas con la base de conocimiento**: el bot responde con los artículos reales administrados en el panel (licencias, haberes, expedientes, legajos, obra social, entre otros).
- **Descargas**: formularios, guías y modelos oficiales que se generan desde la respuesta del bot o desde la sección de descargas.
- **Ubicaciones**: tarjetas con dirección, horarios y acceso al mapa (Google Maps) de cada oficina.
- **Diálogo multi-turno**: el bot recuerda la última oficina/tema y responde seguimientos como "¿y hasta qué hora atienden?" o hace *bridging* cuando no entendió ("vi que estabas viendo <tema>. ¿Retomamos eso?").
- **Asistentes por pasos (wizards)**: flujos guiados con chips para *licencia*, *seguimiento de expediente* y *certificado de servicios*.
- **Memoria por cuenta**: las consultas de cada usuario autenticado se guardan en `localStorage`; en la bienvenida el bot ofrece "Continuá donde quedaste" y sugiere temas frecuentes.
- **Onboarding interactivo** del bot y **tipos de respuesta** (escritas con animación, chips de continuación, botones de descarga y tarjetas de ubicación).
- **Avatar animado**: el bot reacciona al estado de la conversación, sigue el cursor y tiene auto-reacciones.

### 🔐 Autenticación
- Registro, inicio de sesión y restablecimiento de contraseña (envío de mail real vía **EmailJS** o enlace en pantalla en modo demo).
- Historial de chat separado por usuario e invitados efímeros.
- Toggle mostrar/ocultar contraseña.
- Sesiones por dispositivo, preferencias de cuenta (tema/idioma/avisos), notificaciones y cierre/revocación de sesiones.

### 👤 Mi perfil (`/perfil`) según rol
- **Ciudadano**: resumen, mis trámites (expedientes SIGED), mis solicitudes, mis conversaciones, mi actividad, notificaciones y seguridad (contraseña, sesiones activas, borrar cuenta).
- **Administrador**: resumen, permisos del rol y seguridad.
- **Superadmin**: resumen, permisos del rol, auditoría (feed global) y seguridad.
- El perfil usa datos reales de `localStorage` ensamblados por `useProfileData.js`. No muestra funciones de gestión (viven en `/admin`). Un usuario `Suspendido` no puede iniciar sesión ni entrar al panel.

### 🛠️ Panel de administración
- **Dashboard** con métricas generales.
- **Mesa de Entradas**: expedientes, documentos y **visor de PDF embebido** (pdf.js) con descarga.
- **Base de conocimiento**: alta, edición, activación/desactivación y búsqueda de artículos (el bot los usa en línea).
- **Documentos**: gestión de formularios y guías oficiales.
- **SIGED**: integración simulada de gestión documental y expedientes.
- **Usuarios**: tabla, alta, edición y roles (Superadmin, Administrador, Ciudadano).
- **Reportes** con estadísticas de artículos y actividad.
- **Actividad reciente**, **notificaciones** y **buscador global** del panel.
- **Configuración** del chatbot y **aprobación de solicitudes de empleados**.
- Modo oscuro/claro.

---

## 🧱 Stack

| Tecnología | Versión | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | UI |
| [Vite](https://vitejs.dev) | 8 | Bundler y dev server (rolldown) |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilos y tema (tema vía `src/index.css`, modo oscuro con clase `dark`) |
| [React Router](https://reactrouter.com) | 7 | Rutas |
| [pdf.js (`pdfjs-dist`)](https://mozilla.github.io/pdf.js/) | 6 | Renderizado de PDFs en el visor |
| [EmailJS](https://www.emailjs.com) | 4 | Envío de mails (recuperación de contraseña) |

---

## 📁 Estructura del proyecto

```
src/
├── App.jsx                    # Rutas y providers
├── main.jsx                   # Entry point
├── pages/                     # Home (landing), Chat/Ciudadano, Login/Registro, Reset, Perfil, Contacto, Panel admin, 404
├── components/
│   ├── landing/               # Hero, Services, Marquee, ChatSection, TrustSection, FinalCta, AnimatedText…
│   ├── ciudadano/             # ChatWindow, MessageBubble, QuickReplies, BotReactionController
│   ├── admin/                 # Dashboard, MesaDeEntrada, KnowledgeManager, SIGED, Documentos, Reportes…
│   ├── profile/               # ProfileLayout, ProfileHeader, EditProfileModal, sections/…
│   ├── common/                # Navbar, Footer, Logo, Modal, Toast, PasswordField, Pagination…
│   └── ChatBotAvatar.jsx      # Avatar animado (motor bloub)
├── context/                   # AuthContext, ChatContext, AdminContext
├── hooks/                     # useSortable, useKeyboardShortcut…
├── lib/
│   ├── auth.js                # Credenciales y helpers de localStorage
│   ├── chatMemory.js          # Memoria del bot por usuario
│   ├── chatFollowUp.js        # Follow-ups, related y disparadores de wizard
│   ├── knowledgeEngine.js     # Matcher de consultas vs base de conocimiento y documentos
│   ├── email.js / emailConfig.js  # Envío de mails (EmailJS)
│   ├── employeeRequests.js    # Solicitudes de empleados
│   ├── notifications.js       # Notificaciones por usuario
│   ├── sessions.js            # Sesiones activas
│   ├── activity.js            # Registro de auditoría global
│   └── preferences.js         # Preferencias de cuenta (tema/idioma/avisos)
└── data/                      # Datos mock (usuarios, mensajes, conocimiento, documentos, SIGED, actividad…)
```

### Cómo funciona el motor del bot
Al recibir una consulta, `ChatWindow` resuelve con esta prioridad:

1. **Intento exacto** (`mockMessages.js` → `botResponses`): saludos, seguridad, etc.
2. **Base de conocimiento** (`lib/knowledgeEngine.js`): matcher por tokens ponderados (pregunta > respuesta > categoría) que responde con el artículo del panel y adjunta herramientas (descarga, mapa).
3. **Follow-up multi-turno** (`lib/chatFollowUp.js`): preguntas de seguimiento sobre la última oficina.
4. **Memoria del usuario**: retoma el último tema/consulta de la cuenta.
5. **Fallback**: mensaje de "no entendí" + chips para reencaminar.

---

## 🚀 Empezar

Requisitos: **Node.js 20+** y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el entorno de desarrollo
npm run dev
```

El dev server imprime la URL (por defecto `http://localhost:5173`).

### Scripts

```bash
npm run dev       # Dev server con HMR
npm run build     # Build de producción /dist
npm run preview   # Servir el build localmente
npm run lint      # ESLint sobre todo el proyecto
```

---

## ✉️ Configurar EmailJS (opcional)

El restablecimiento de contraseña puede enviar un mail real. Pasos en `src/lib/emailConfig.js`:

1. Crear una cuenta en [emailjs.com](https://www.emailjs.com) y conectar Gmail en *Email Services*.
2. Crear una plantilla con los campos `{{to_email}}`, `{{user_name}}` y `{{reset_link}}`.
3. Pegar la *Public Key*, el *Service ID* y el *Template ID* en `EMAIL_CONFIG` y poner `enabled: true`.

Con `enabled: false` la app muestra el enlace de restablecimiento en pantalla (modo demostración).

---

## 💾 Datos y persistencia

- Todos los datos de negocio son **mock** (`src/data/*`).
- La persistencia real usa `localStorage` con estas claves:
  - `chatap.users` — cuentas registradas
  - `chatap.session` — sesión activa
  - `chatap.pwreset` — intentos de recuperación de contraseña
  - `chatap.employeeRequests.v2` — solicitudes de alta de empleados
  - `chatap.history.<userId>` — historial de chat por cuenta
  - `chatap.memory.<userId>` — memoria del bot por cuenta
  - `chatap.notifications.<userId>` — notificaciones por usuario
  - `chatap.sessions` — sesiones activas de todos los usuarios
  - `chatap.activity` — registro de auditoría global
  - `chatap.preferences.<userId>` — preferencias del perfil (tema)
  - `theme` — tema aplicado (`dark`/`light`)
- No hay backend ni base de datos: limpiar el `localStorage` reinicia la demo.

---

## 🧭 Rutas principales

| Ruta | Vista |
|---|---|
| `/` | Landing |
| `/chat` | Asistente del ciudadano |
| `/login` | Inicio de sesión / Registro |
| `/restablecer` | Restablecer contraseña |
| `/perfil` | Mi Perfil (según rol) |
| `/contacto` | Contacto |
| `/soporte` | Soporte (Contacto) |
| `/admin` | Panel de administración |
| `/admin/mesa-de-entrada` | Mesa de Entradas (visor PDF) |
| `/admin/conocimiento` | Base de conocimiento del bot |
| `/admin/reportes` | Reportes y estadísticas |

## 🎯 Backend pendiente / endpoints necesarios

La app actual es 100% frontend (localStorage). Para producción real se necesitan estos endpoints, que las secciones del perfil ya consumen o asumen:

1. **SIGED — vinculación exacta de expedientes al usuario.** Hoy "Mis trámites" vincula por coincidencia de `applicant === user.name` sobre `sigedRecords` (heurística). Se necesita un campo `userId` (o `email`) en el expediente, p. ej. `GET /tramites` devolviendo `{ userId, ... }` o `GET /tramites/mis`.
   - Referencia: `src/components/profile/useProfileData.js` (comentario `NOTA BACKEND`).
2. **Auditoría persistente.** `src/lib/activity.js` mantiene el registro global en `localStorage` y lo siembra desde `mockActivity.js` (entradas con id `seed-*`). La pestaña Auditoría del Superadmin muestra un aviso de que el registro actual es local. Endpoint necesario: `GET /audit` (paginado, filtrar por `actorId` y fecha).
3. **Gestión de sesiones.** `src/lib/sessions.js` y la sección Seguridad revocan sesiones solo en `localStorage`. Endpoint necesario: `POST /auth/sessions/revoke-others` o `DELETE /auth/sessions/:id`.
4. **Notificaciones en tiempo real.** `src/lib/notifications.js` guarda avisos por usuario en `localStorage`. Endpoint necesario: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, y push/websocket para el canal en vivo.
5. **Preferencias de cuenta.** `src/lib/preferences.js` persiste tema/idioma/avisos localmente. Endpoint necesario: `GET/PUT /me/preferences`.
6. **Cambio de contraseña en servidor.** `changePassword` (Seguridad) valida y actualiza el hash dentro de `chatap.users`. Endpoint necesario: `PUT /auth/password` con validación de la contraseña actual.

> Las estadísticas del perfil (resumen por rol) se calculan con los datos reales de `localStorage`; al migrar al backend deben reemplazarse por los agregados del servidor en `GET /me/summary`.

---

## 🤝 Estado del proyecto

Demo funcional y visual completa para presentación y pruebas. Pensado para evolucionar a una integración real (API, autenticación server-side y persistencia en base de datos) manteniendo la misma UI.