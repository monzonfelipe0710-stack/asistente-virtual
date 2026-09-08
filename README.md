# ChatAP — Asistente Virtual de la Administración Pública

Portal web con **asistente virtual (bot)** para el ciudadano y **panel de gestión** para la administración, orientado a la Subsecretaría de Recursos Humanos de la Provincia de Formosa.

El proyecto es 100 % **frontend**: toda la información se simula con datos mock y se persiste en `localStorage`. No requiere backend ni base de datos.

---

## ✨ Funcionalidades

### 🧑💻 Para el ciudadano
- **Chat con el bot ChatAP**: consultas por texto o **por voz** (Web Speech API).
- **Respuestas con la base de conocimiento**: el bot responde con los artículos reales administrados en el panel (licencias, haberes, expedientes, legajos, obra social, entre otros).
- **Descargas**: formularios, guías y modelos oficiales que se generan desde la respuesta del bot o desde la sección de descargas.
- **Ubicaciones**: tarjetas con dirección, horarios y acceso al mapa (Google Maps) de cada oficina.
- **Diálogo multi-turno**: el bot recuerda la última oficina/tema y responde seguimientos como "¿y hasta qué hora atienden?" o hace *bridging* cuando no entendió ("vi que estabas viendo <tema>. ¿Retomamos eso?").
- **Asistentes por pasos (wizards)**: flujos guiados con chips para *licencia*, *seguimiento de expediente* y *certificado de servicios*.
- **Memoria por cuenta**: las consultas de cada usuario autenticado se guardan en `localStorage`; en la bienvenida el bot ofrece "Continuá donde quedaste" y sugiere temas frecuentes.
- **Tipos de respuesta del bot**: respuestas escritas con animación, chips de continuación, botones de descarga y tarjetas de ubicación.
- **Avatar animado**: el bot reacciona al estado de la conversación, sigue el cursor y tiene auto-reacciones.

### 🔐 Autenticación
- Registro, inicio de sesión y restablecimiento de contraseña (envío de mail real vía **EmailJS** o enlace en pantalla en modo demo).
- Historial de chat separado por usuario e invitados efímeros.
- Toggle mostrar/ocultar contraseña.

### 🛠️ Panel de administración
- **Dashboard** con métricas generales.
- **Mesa de Entradas**: expedientes, documentos y **visor de PDF embebido** (pdf.js) con descarga.
- **Base de conocimiento**: alta, edición, activación/desactivación y búsqueda de artículos (el bot los usa en línea).
- **Documentos**: gestión de formularios y guías oficiales.
- **SIGED**: integración simulada de gestión documental y expedientes.
- **Usuarios**: tabla, alta, edición y roles (Superadmin, Administrador, Ciudadano).
- **Reportes** con estadísticas de artículos y actividad.
- **Actividad reciente**, **notificaciones** y **buscador global** del panel.
- **Configuración** del chatbot y **approbación de solicitudes de empleados**.
- Modo oscuro/claro.

---

## 🧱 Stack

| Tecnología | Versión | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | UI |
| [Vite](https://vitejs.dev) | 8 | Bundler y dev server |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilos y tema |
| [React Router](https://reactrouter.com) | 7 | Rutas |
| [pdf.js (`pdfjs-dist`)](https://mozilla.github.io/pdf.js/) | 6 | Renderizado de PDFs en el visor |
| [EmailJS](https://www.emailjs.com) | 4 | Envío de mails (recuperación de contraseña) |

---

## 📁 Estructura del proyecto

```
src/
├── App.jsx                    # Rutas y providers
├── main.jsx                   # Entry point
├── pages/                     # Ciudadano, Login/Registro, Reset, Contacto, Panel admin, 404
├── components/
│   ├── ciudadano/             # ChatWindow, MessageBubble, QuickReplies, BotReactionController
│   ├── admin/                 # Dashboard, MesaDeEntrada, KnowledgeManager, SIGED, Documentos, Reportes…
│   ├── common/                # Navbar, Footer, Modal, Toast, PasswordField, Pagination…
│   └── ChatBotAvatar.jsx      # Avatar animado
├── context/                   # AuthContext, ChatContext, AdminContext
├── hooks/                     # useLocalStorage, useSortable, useNotifications, useKeyboardShortcut
├── lib/
│   ├── auth.js                # Credenciales y helpers de localStorage
│   ├── chatMemory.js          # Memoria del bot por usuario
│   ├── chatFollowUp.js        # Follow-ups, related y disparadores de wizard
│   ├── knowledgeEngine.js     # Matcher de consultas vs base de conocimiento y documentos
│   ├── email.js / emailConfig.js  # Envío de mails (EmailJS)
│   └── employeeRequests.js    # Solicitudes de empleados
└── data/                      # Datos mock (usuarios, mensajes, conocimiento, documentos, SIGED…)
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
npm run build     # Build de producción en /dist
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
  - `chatap.history.<userId>` — historial de chat por cuenta
  - `chatap.memory.<userId>` — memoria del bot por cuenta
- No hay backend ni base de datos: limpiar el `localStorage` reinicia la demo.

---

## 🧭 Rutas principales

| Ruta | Vista |
|---|---|
| `/` | Asistente del ciudadano |
| `/login` | Inicio de sesión / Registro |
| `/restablecer` | Restablecer contraseña |
| `/contacto` | Contacto |
| `/admin` | Panel de administración |
| `/admin/mesa-de-entrada` | Mesa de Entradas (visor PDF) |
| `/admin/conocimiento` | Base de conocimiento del bot |
| `/admin/reportes` | Reportes y estadísticas |

---

## 🤝 Estado del proyecto

Demo funcional y visual completa para presentación y pruebas. Pensado para evolucionar a una integración real (API, autenticación server-side y persistencia en base de datos) manteniendo la misma UI.