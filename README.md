# ChatAP — Asistente Virtual

Asistente virtual de la Municipalidad de Formosa. Frontend en **React + Vite + Tailwind CSS v4**, con persistencia local en `localStorage` y autenticación por roles (Ciudadano / Administrador / Superadmin).

## Stack

- **React 19 + Vite** (build con rolldown)
- **Tailwind CSS v4** (tema vía `tailwind/index.css`; modo oscuro con la clase `dark`)
- **react-router-dom** (rutas públicas, `/perfil`, `/admin/*`)
- **react-pdf** (`pdfjs-dist`) para la vista de documentos
- **EmailJS** para recuperación de contraseña

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción (verifica que compile)
npm run lint      # eslint (hay errores preexistentes no bloqueantes)
```

## Estructura relevante

- `src/pages/` — páginas públicas: `ProfilePage.jsx` (rediseño completo del perfil), `ContactoPage.jsx`, `ResetPasswordPage.jsx`, `Login`, `Register`, etc.
- `src/components/profile/` — perfil por rol: `ProfileLayout.jsx` (tabs por rol), `ProfileHeader.jsx`, `EditProfileModal.jsx`, `sections/` (Resumen, Tramites, Solicitudes, Conversaciones, Actividad, Notificaciones, Seguridad, Permisos, Auditoria) y `useProfileData.js` (hook que ensambla todos los datos reales).
- `src/components/admin/` — panel de administración (`AdminLayout.jsx`), alta de empleados (`EmployeeApprovals.jsx`), mesas y documentos.
- `src/lib/` — capa de datos local: `auth.js`, `employeeRequests.js` (clave `chatap.employeeRequests.v2`), `notifications.js`, `sessions.js`, `activity.js` (auditoría sembrada desde `mockActivity.js`), `preferences.js` (tema/idioma/avisos), `emailService.js` (EmailJS).
- `src/context/` — `AuthContext.jsx` (login/registro/sesión/borrar cuenta, comentarios EmailJS), `AdminContext.jsx` (roles y permisos).

## Claves de localStorage

| Clave | Contenido |
|---|---|
| `chatap.users` | Cuentas registradas |
| `chatap.session` | Sesión activa |
| `chatap.pwreset` | Intentos de recuperación de contraseña |
| `chatap.employeeRequests.v2` | Solicitudes de alta de empleados |
| `chatap.history.<userId>` | Historial de chat por usuario |
| `chatap.notifications.<userId>` | Notificaciones por usuario |
| `chatap.sessions` | Sesiones activas de todos los usuarios |
| `chatap.activity` | Registro de auditoría global |
| `chatap.preferences.<userId>` | Preferencias del perfil (tema) |
| `theme` | Tema aplicado (`dark`/`light`) |

## Mi Perfil según rol

- **Ciudadano**: resumen, mis trámites (expedientes SIGED), mis solicitudes, mis conversaciones, mi actividad, notificaciones y seguridad (contraseña, sesiones activas, borrar cuenta).
- **Administrador**: resumen, permisos del rol y seguridad.
- **Superadmin**: resumen, permisos del rol, auditoría (feed global) y seguridad.

> El perfil es un espacio personal: no muestra accesos rápidos ni funciones de gestión, que viven exclusivamente en el Panel de Administración (`/admin`). Un usuario con estado `Suspendido` no puede iniciar sesión ni entrar al panel.

## Backend pendiente / endpoints necesarios

La app actual es 100% frontend (localStorage). Para producción real se necesitan estos endpoints, que las secciones del perfil ya consumen o asumen:

1. **SIGED — vinculación exacta de expedientes al usuario.** Hoy "Mis trámites" vincula por coincidencia de `applicant === user.name` sobre `sigedRecords` (heurística). Se necesita un campo `userId` (o `email`) en el expediente, p. ej. `GET /tramites` devolviendo `{ userId, ... }` o `GET /tramites/mis`.
   - Referencia: `src/components/profile/useProfileData.js` (comentario `NOTA BACKEND`).
2. **Auditoría persistente.** `src/lib/activity.js` mantiene el registro global en `localStorage` y lo siembra desde `mockActivity.js` (entradas con id `seed-*`). La pestaña Auditoría del Superadmin muestra un aviso de que el registro actual es local. Endpoint necesario: `GET /audit` (paginado, filtrar por `actorId` y fecha).
3. **Gestión de sesiones.** `src/lib/sessions.js` y la sección Seguridad revocan sesiones de otros dispositivos solo en `localStorage`. Endpoint necesario: `POST /auth/sessions/revoke-others` o `DELETE /auth/sessions/:id`.
4. **Notificaciones en tiempo real.** `src/lib/notifications.js` guarda avisos por usuario en `localStorage` (generadas al aprobar/suspender/rechazar solicitudes desde `EmployeeApprovals`, y en registrar cuenta). Endpoint necesario: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, y push/websocket para el canal en vivo.
5. **Preferencias de cuenta.** `src/lib/preferences.js` persiste tema/idioma/avisos localmente. Endpoint necesario: `GET/PUT /me/preferences`.
6. **Cambio de contraseña en servidor.** `changePassword` (Seguridad) valida y actualiza el hash dentro de `chatap.users`. Endpoint necesario: `PUT /auth/password` con validación de la contraseña actual.

> Las estadísticas del perfil (resumen por rol) se calculan con los datos reales de `localStorage`; al migrar al backend deben reemplazarse por los agregados del servidor en `GET /me/summary`.