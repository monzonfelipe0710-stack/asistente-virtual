# ChatAP — Contrato del backend para el frontend (fuente de verdad)

Documento orientado al **frontend**, derivado del estado real del backend (`BACKEND_CONTEXTO.md`, verificado end-to-end el 13/10/2026). El detalle interno exhaustivo (schema, validadores textuales, RAG) está en ese otro documento; este es el **contrato que el front debe seguir**.

**Cómo leerlo:**
- Secciones 1 a 6: el backend tal como está. **El front se alinea a esto, no al revés.**
- Sección 7: **cambios decididos que el front YA tiene y el backend va a incorporar.** El front NO los toca.
- Sección 8: cosas **no implementadas** en el backend. El front no debe conectarlas.
- Sección 9: desajustes concretos detectados entre el front actual y el backend.

---

## 1. Reglas generales

- API REST, todo JSON. Error siempre con la forma `{ "error": "mensaje" }`.
- URL base en desarrollo: `http://localhost:3000/api`.
- CORS: por defecto `http://localhost:5173` (variable `CORS_ORIGIN`).
- Fechas: ISO 8601.
- **`costo` (Decimal) viaja como STRING en las respuestas** (`"0"`, `"1500.5"`), nunca como número. En el body de entrada, en cambio, se manda como número. El front tiene que parsearlo al mostrarlo.

---

## 2. Autenticación y sesión

- JWT por header: `Authorization: Bearer <token>`. El payload del token es `{ id, rol }`, pero la autorización **se resuelve releyendo el usuario de la base en cada request**, no con lo que dice el token.
- El token vence a las **2 horas** (`JWT_EXPIRES_IN`).
- **Un `401` puede llegar en cualquier momento** aunque el token no haya expirado (por ejemplo, si suspenden la cuenta: tiene efecto inmediato). El front debe manejar el 401 de forma global: cerrar sesión y mandar al login.
- Mensajes de `autenticar`: `No autorizado: falta el token.` / `No autorizado: token inválido o expirado.` / `No autorizado: la cuenta no está activa.`

---

## 3. Roles y estados

- **Roles actuales:** `SUPERUSUARIO` y `ADMINISTRADOR`.
- **`SUPERUSUARIO`** aprueba/rechaza/suspende/reactiva cuentas, gestiona sectores y ve métricas. **NO puede crear ni editar trámites** (recibe 403).
- **`ADMINISTRADOR`** crea y edita **sus propios** trámites (con requisitos, mesas y documentos) y los publica/despublica.
- **Estados de cuenta:** `PENDIENTE`, `APROBADO`, `RECHAZADO`, `SUSPENDIDO`. Solo los `APROBADO` inician sesión. **Estos estados son exclusivos de los administradores.**
- **Rol a incorporar:** `CIUDADANO`, con registro opcional y **sin** flujo de estados (ver sección 7).
- El ciudadano usa el chat de forma **anónima**; la cuenta será opcional.

---

## 4. Contrato de endpoints (real)

Notación: `auth` = requiere token; `SUPERUSUARIO`/`ADMINISTRADOR` = rol exigido; `dueño` = ser el encargado del trámite; `limit` = rate limit.

### Auth — `/api/auth`
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/login` | público, limit 10/15min | Body `{ email, password }`. OK: `{ token, usuario: { id, nombre, email, rol } }`. 401 `Credenciales inválidas` (email o pass). 403 solo si la pass es correcta pero la cuenta está pendiente/rechazada/suspendida (mensaje según estado). |

### Usuarios — `/api/usuarios`
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/registro` | público, limit 5/h | Body `{ nombre, email, password }` (pass mín. 8). Siempre crea `rol: ADMINISTRADOR`, `estado: PENDIENTE`. 201 `{ mensaje, usuario: { id, nombre, email, estado } }`. 409 email duplicado. |
| GET | `/` | auth, SUPERUSUARIO | Filtro `?estado=`. Devuelve `[{ id, nombre, email, rol, estado, createdAt }]`. Nunca el hash. |
| GET | `/pendientes` | auth, SUPERUSUARIO | |
| PATCH | `/:id/aprobar` | auth, SUPERUSUARIO | Solo sobre PENDIENTE. 200 `{ mensaje, usuario:{id,nombre,email,estado} }`. 404 / 409 "ya procesada". |
| PATCH | `/:id/rechazar` | auth, SUPERUSUARIO | Solo sobre PENDIENTE. |
| PATCH | `/:id/suspender` | auth, SUPERUSUARIO | Solo sobre APROBADO. No a uno mismo (409). |
| PATCH | `/:id/reactivar` | auth, SUPERUSUARIO | Solo sobre SUSPENDIDO. |

### Sectores — `/api/sectores`
Forma del sector (en todas las respuestas, **sin padre ni hijos**): `{ id, nombre, tipo, createdAt, updatedAt, parentId }`.

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/` | auth, SUPERUSUARIO | Body `{ nombre, tipo, parentId? }`. `tipo`: `MINISTERIO\|SUBSECRETARIA\|DEPARTAMENTO`. 400 si `parentId` no existe; 409 nombre repetido bajo el mismo padre. |
| GET | `/` | auth | **Lista plana**, ordenada por nombre. El árbol se arma en el front con `parentId`. |
| GET | `/:id` | auth | 404 si no existe. |
| PATCH | `/:id` | auth, SUPERUSUARIO | Parcial. Sin `parentId` → no se toca; `parentId: null` → pasa a raíz. 409 si genera ciclo. |
| DELETE | `/:id` | auth, SUPERUSUARIO | 204. 409 si tiene trámites. |

### Trámites — `/api/tramites`
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/` | auth, ADMINISTRADOR | Body `{ nombre, descripcion, costo?, sectorId, requisitos?, mesaIds? }`. `encargadoId` se toma del token (si se manda, se ignora). `publicado` arranca en false. **La respuesta 201 incluye `requisitos` y `mesas` (las mesas SIN el objeto mesa, solo `{tramiteId, mesaId}`), pero NO `sector` ni `encargado`.** |
| GET | `/` | auth | **Todos** los trámites, publicados o no. Incluye `sector {id,nombre}` y `encargado {id,nombre}`. No incluye requisitos ni mesas. |
| GET | `/:id` | auth | Detalle completo: `requisitos`, `mesas` (con `mesa`), `sector`, `encargado`. 404 si no existe. |
| PATCH | `/:id` | auth, ADMINISTRADOR, dueño | Parcial. `requisitos:[...]` **reemplaza todos**; `requisitos:[]` los vacía. Ídem `mesaIds`. Responde el detalle completo. |
| DELETE | `/:id` | auth, ADMINISTRADOR, dueño | 204. Borra también los archivos de R2. |
| PATCH | `/:id/publicar` | auth, ADMINISTRADOR, dueño | Sin body. 200 `{ mensaje, tramite }` (el trámite **sin** includes). |
| PATCH | `/:id/despublicar` | auth, ADMINISTRADOR, dueño | Ídem. Solo los publicados aparecen en el chat. |

`requisitos`: array de `{ descripcion, dondeSeConsigue?, costo? }`. `mesaIds`: array de ids (números).

### Documentos — `/api/tramites/:id/documentos`
Forma: `{ id, nombre, archivo, tipo, createdAt, tramiteId }`. **`archivo` es la key en R2, no una URL.**

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/` | auth, ADMINISTRADOR, dueño | `multipart/form-data`: campo `archivo` (PDF/DOCX, ≤10 MB) + opcional `nombre`. 400/413 según el caso. |
| GET | `/` | auth | Lista, del más nuevo al más viejo. Si el trámite no existe, devuelve `[]`. |
| GET | `/:docId/descargar` | auth | 200 `{ url }` (URL firmada, válida **5 minutos**). 404 (también si el doc es de otro trámite). |
| DELETE | `/:docId` | auth, ADMINISTRADOR, dueño | 204. 404 (también si es de otro trámite). |

### Chat — `/api/chat`
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/` | **público**, limit 10/min | Body `{ pregunta }` (1–500 caracteres). OK: `{ respuesta, tramitesEncontrados: [{ id, nombre }], encontrado }`. Si `encontrado=false`, no llama al LLM. 500 si falla OpenAI. |

### Métricas — `/api/metricas`
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/por-tramite` | auth, SUPERUSUARIO | Devuelve `[{ _count: { _all }, tramiteId }]`. **Sin el nombre del trámite**: el front lo cruza con `GET /tramites`. `tramiteId` puede ser `null` (trámite borrado). |
| GET | `/sin-respuesta` | auth, SUPERUSUARIO | Últimas 50 con `encontrado=false`: `[{ id, textoConsulta, encontrado, fecha, tramiteId }]`. |

### Salud
`GET /health` — público. `{ status, servicio }`. Ruta inexistente → 404 `{ error: "Ruta no encontrada." }`.

---

## 5. Formas de los datos

```
usuario   = { id, nombre, email, rol, estado }          // rol SUPERUSUARIO|ADMINISTRADOR (CIUDADANO a futuro)
sector    = { id, nombre, tipo, createdAt, updatedAt, parentId }   // sin parent ni hijos
tramite   = { id, nombre, descripcion, costo(string|null), encargadoId, publicado,
              createdAt, updatedAt, sectorId,
              // según el endpoint: sector{id,nombre}, encargado{id,nombre},
              // requisitos[], mesas[] (con o sin .mesa) }
requisito = { id, descripcion, dondeSeConsigue(null?), costo(string|null), tramiteId }
documento = { id, nombre, archivo(key R2), tipo, createdAt, tramiteId }
consulta  = { id, textoConsulta, encontrado, fecha, tramiteId(null?) }
```

---

## 6. Gotchas que el front DEBE manejar

Cosas no obvias del backend real que, si no se contemplan, rompen el front:

1. **`costo` llega como string** (`"0"`, `"1500.5"`), no número. Parsearlo al mostrar.
2. **La forma del trámite cambia según el endpoint.** `POST /tramites` devuelve requisitos y mesas pero **no** sector ni encargado, y las mesas sin el objeto `mesa`. `GET /:id` y `PATCH` sí devuelven todo. No asumir una forma única.
3. **`GET /tramites` devuelve TODOS los trámites** (publicados o no) a cualquier usuario logueado, sin filtrar por dueño. Si el panel del admin debe mostrar solo los suyos, hay que **filtrar en el front** por `encargado.id` (no hay filtro en el backend).
4. **`/metricas/por-tramite` no trae el nombre**, solo `tramiteId` y el conteo. Cruzar con `GET /tramites`.
5. **Los mensajes de error de Zod salen en inglés cuando un campo FALTA o viene con otro tipo** (los mensajes propios en español solo aparecen cuando el campo viene pero no cumple la regla, p. ej. string vacío). No confiar en recibir siempre el mensaje en español.
6. **El `401` es global y puede pasar en cualquier momento** (sesión revalidada en DB). Manejarlo en el interceptor.
7. **Publicar/despublicar** responde `{ mensaje, tramite }` con el trámite **sin** includes.

---

## 7. Cambios decididos pendientes en el backend (el front los mantiene)

El front **ya tiene** estas funcionalidades; el backend se va a adaptar para igualarse. El agente del front **NO debe quitarlas ni modificarlas**: son trabajo de backend.

### 7.1 Registro opcional de ciudadanos (solo para guardar su historial)
- Decisión del equipo (recomendada por el profesor; sin contacto con el cliente desde el fallecimiento del stakeholder).
- La cuenta de ciudadano es **totalmente opcional** (sin pop-up ni obligación) y su **única** función es guardar el historial de consultas de esa persona. Todo el uso público sigue andando sin cuenta.
- **El ciudadano NO tiene flujo de estados** (nada de PENDIENTE/APROBADO/RECHAZADO ni aprobación). Se registra y queda habilitado al instante. Esa complejidad es solo para administradores. Se decidió así porque la plataforma la usa gente de todas las edades y el ciudadano no interactúa con nada interno del sistema.
- **Principio de diseño:** el historial es **privado de cada ciudadano** (solo él lo ve). Las métricas de los dashboards siguen siendo **anónimas y agregadas**. Así se mantiene "datos de la aplicación, no de las personas".
- **Recuperación de contraseña: la hace el backend, NO el front.** EmailJS manda correos desde el navegador, pero un reseteo seguro necesita que el backend genere un token de reseteo, lo mande por mail como link, lo valide y recién ahí permita el cambio. **El front no debe resolver el reseteo con emailjs.** Mantiene la pantalla de "olvidé mi contraseña" y la conecta a los endpoints del backend cuando existan.
- Los endpoints exactos (registro/login de ciudadano, mi historial, pedir/confirmar reseteo) se definirán al implementarlo. El chat seguirá siendo público; si el ciudadano está logueado, su consulta podrá asociarse a su cuenta para el historial (token opcional).

### 7.2 Dashboard del administrador con métricas propias y generales
- El administrador tiene un dashboard con un **selector**: ver las métricas de **su** mesa o las **generales**.
- Cambio de backend: los endpoints de métricas (hoy solo SUPERUSUARIO) **pasarán a aceptar también al ADMINISTRADOR**, con un parámetro de alcance (propias/generales) a definir.
- Confirmado que está OK que el admin vea las métricas generales (datos anónimos y agregados).

---

## 8. No implementado en el backend (el front NO debe conectarlo)

Si el front tiene pantallas para esto, dejarlas marcadas como "pendiente de backend", no conectadas:

- **CRUD de mesas de entrada.** Hoy no existe; para usar `mesaIds` las mesas se cargan directo en la DB.
- **Asignación de sectores a usuarios** (`UsuarioSector` existe en el modelo pero ningún endpoint ni código lo usa). Consecuencia: **un administrador puede crear trámites en cualquier sector**, no solo el suyo.
- **Acceso público del ciudadano a trámites y documentos** (listado/detalle/descarga). Hoy el ciudadano solo tiene el chat; todo lo demás requiere login.
- **Borrar usuarios, cambiar rol, editar perfil, cambiar contraseña** (más allá del reseteo del punto 7.1).
- **Cambio del modelo de IA desde el panel.**
- **Ingesta de documentos para que el bot los lea** (hoy el chat responde con los datos estructurados del trámite, no con el contenido de los PDF/DOCX).
- **Correo de aviso al aprobar un administrador.**
- **Campo `horario` en las mesas de entrada.**
- **Reindexado manual de embeddings.**

---

## 9. Sobre el frontend

Este documento describe el **backend**. El frontend real lo desarrolla el equipo de front (React + Tailwind); su estado exacto no se conoce desde acá, así que su agente debe **auditarlo** y alinearlo al contrato de las secciones 1–6, manejando los gotchas de la sección 6.

Lo que sí se sabe del front y hay que **respetar** (son los cambios de la sección 7, donde el backend se adapta): tiene **registro/login de ciudadano**, **recuperación de contraseña** y un **dashboard de métricas para el administrador**. Esas pantallas se mantienen; el backend las va a acompañar.

> **Aclaración importante:** la sección "Frontend" de `BACKEND_CONTEXTO.md` (la carpeta `client/`, con React 19/Vite/Tailwind/react-router, datos mock, vista SIGED, etc.) describe un **frontend de prueba del backend**, NO el frontend real del equipo. Hay que ignorarla a la hora de trabajar sobre el front real.

---

## 10. Cómo usar este documento (frontend)

1. Secciones 1–6: alinear el front a este contrato real. Prestar atención especial a la sección 6 (gotchas).
2. Sección 7: **no tocar**; el backend se adapta. En particular, **no implementar el reseteo de contraseña con emailjs**.
3. Sección 8: no conectar esas features; dejarlas como pendientes.
4. Sección 9: el front real del equipo se audita y se alinea a este contrato.
5. Para el detalle interno exhaustivo del backend (schema, validadores textuales, pipeline RAG), ver `BACKEND_CONTEXTO.md`.
