# Estado actual del backend

**Fecha del análisis:** 30-10-2026 (después del commit `89b8be1`) · **Rama:** `dev-nata` (48 commits adelante de `main`, `main` no tiene nada que falte acá)
**Stack:** Node + Express 5 (ES modules, JavaScript) + PostgreSQL con `pgvector` vía Prisma 6 + Zod 4 + OpenAI + Cloudflare R2
**Organización:** `route → middlewares → controller → service → Prisma`, carpetas por tipo de archivo
**Tests:** ✅ `npm test` pasa 41/41 (los 2 de `tests/esquema.test.js` necesitan la base levantada)

> **Actualización posterior (30-10-2026).** Este documento es una foto del commit `89b8be1`. Lo que cambió después está en el `README.md`, que es el contrato vigente de la API:
> - Padrón consultado con `node:https` y el parser permisivo; un DNI inexistente (`nombre: "."`) devuelve `null`.
> - `TURNOS_URL` obligatoria al arrancar (punto 7.8).
> - Login por email **o** DNI y email normalizado en login, registro, alta y recuperación (puntos 2 y 7.9, en parte).
> - `consultaId` en `/api/chat` y en el evento `fin` del streaming.
> - `errorHandler` devuelve `{ error, codigo }` cuando el error trae `codigo` (punto 7.18).
> - `/api/metricas/sin-respuesta` sin `usuarioId`, y el superusuario ve todo con `?alcance=propias` (punto 7.10).
> - Migración `20261030000000_genero_x_dni_unico`: `Genero` pasa a `M`, `F`, `X`, y `dni` es único por sí solo en vez de `(dni, genero)` (secciones 4.1 y 4.2).
> - Registro con género `X` verificado por nombre y apellido contra el padrón (punto 2, en parte).
> - README reescrito, `.env.example` completo, `engines`, default de `importarTramites.js` y erratas (puntos 7.1, 7.15, 7.21, 7.22, 7.24 y 7.25).
>
> De la sección 5.2 siguen abiertos `rol`/`dni`/`cuil` en el alta de empleados y los endpoints `pendientes`, `aprobar`, `rechazar`, `me/perfil` y `DELETE me`.

---

## 1. Resumen rápido

| Área | Estado |
|---|---|
| Base (`index.js` valida env y falla temprano, `app.js`, `errorHandler` central, 404 JSON) | ✅ Hecho |
| Autenticación: login, JWT, invalidación de tokens al cambiar contraseña | ✅ Hecho |
| Recuperación de contraseña por correo (token hasheado, 1 h, anti-enumeración) | ✅ Hecho |
| Cambio de contraseña obligatorio en el primer ingreso de un empleado | ✅ Hecho |
| Roles `SUPERUSUARIO` / `ADMINISTRADOR` / `CIUDADANO` | ✅ Hecho |
| Registro de ciudadanos con DNI verificado contra el padrón de turnos | ✅ Hecho (timeout de 10 s) |
| Alta de empleados por el superusuario + asignación de sectores | ✅ Hecho |
| Suspender / reactivar usuarios | ✅ Hecho |
| Aprobar / rechazar solicitudes (`PENDIENTE` → `APROBADO`/`RECHAZADO`) | ❌ Ya no existe: los estados quedaron en el enum sin endpoints (ver 7.4) |
| Sectores (jerarquía con validación de ciclos, tipo `ORGANISMO`) | ✅ Hecho |
| Mesas de entrada (CRUD con horario, generales o por sector) | ✅ Hecho |
| Trámites (CRUD, requisitos, mesas validadas contra el sector, publicar solo el supervisor) | ✅ Hecho |
| Documentos en R2 (visibilidad según el trámite, URL firmada de 5 min) | ✅ Hecho |
| Chat RAG (búsqueda híbrida, aclaración multivuelta, streaming SSE, caché) | ✅ Hecho |
| Métricas (por trámite con alcance, sin respuesta) e historial del ciudadano | ✅ Hecho |
| Capa de IA desacoplada (`core/ai`: puerto + adaptador de OpenAI) | ✅ Hecho |
| Scripts: importar catálogo, reindexar faltantes, evaluar el chat | ✅ Hecho |
| Compatibilidad con el frontend de `dev-felipe` | ❌ Login por DNI, géneros `O`/`X`, alta con `rol` y 5 endpoints que no existen (ver 5.2) |
| Migraciones alineadas entre ramas | ❌ `dev-felipe` y `mejora-ux-historial-tutorial-legales` tienen migraciones propias que chocan con las de esta rama (ver 4.4) |
| Documentación | 🟡 `README.md` y `docs/revision-chat-encontrado.md` están desactualizados (ver 7.1) |
| Despliegue | ❌ No hay Dockerfile ni configuración de despliegue en `server/` |

**En una frase:** el backend de esta rama está completo a nivel funcional y la suite pasa. Lo urgente es **alinearlo con la rama de Felipe**: el frontend manda cuerpos que los validators rechazan y las migraciones de las dos ramas no se pueden aplicar juntas. Después vienen el README, los estados `PENDIENTE`/`RECHAZADO` y dos huecos de reglas de negocio.

> El frontend que está en `client/` de esta rama trabaja con datos de prueba (`client/src/data/mock*.js`) y no llama a la API. El que sí la llama es el de `origin/dev-felipe`.

---

## 2. Archivos, servicios y versiones

### 2.1 Archivos

| Capa | Archivos |
|---|---|
| Arranque | `index.js` (valida las variables obligatorias e importa `app.js` de forma dinámica), `app.js` (middlewares globales, montaje de rutas, 404, `errorHandler`) |
| Config | `config/prisma.js`, `openai.js`, `r2.js`, `correo.js`, `multer.js`, `rateLimit.js`, `origenes.js` |
| IA | `core/ai/proveedor.js` (contrato `ProveedorIA`), `openai.adapter.js`, `index.js` (proveedor activo) |
| Middlewares | `auth.middleware.js`, `roles.middleware.js`, `propiedad.middleware.js`, `validarId.middleware.js`, `asyncHandler.js`, `error.middleware.js` |
| Validators (Zod) | `auth`, `usuario`, `sector`, `tramite`, `mesa`, `documento` |
| Controllers | `auth`, `usuario`, `sector`, `tramite`, `mesa`, `documento`, `chat`, `metrica`, `consulta` |
| Services | ver 2.2 |
| Rutas | `auth`, `usuario`, `sector`, `tramite`, `documento` (anidada en trámites), `mesa`, `chat`, `metrica`, `consulta` |
| Prisma | `schema.prisma`, 15 migraciones, `seed.js` (superusuario), `seed-demo.js` (datos de prueba), `fix_search_vector.sql` |
| Scripts | `importarTramites.js`, `reindexar-faltantes.js`, `eval-chat.js` |
| Tests | `validators.test.js`, `middlewares.test.js`, `rutas.test.js`, `esquema.test.js` |

### 2.2 Servicios y clientes externos

| Archivo | Qué hace |
|---|---|
| `services/usuario.service.js` | Búsquedas de usuarios, listado sin hash, cambio de estado, sectores asignados (reemplazo en transacción), registro de ciudadano y alta de empleado (bcrypt, 10 rondas), tokens de recuperación y cambio de contraseña (actualiza `passwordCambiadaEn`) |
| `services/sector.service.js` | CRUD de sectores y `generariaCiclo` (recorre ancestros con `WITH RECURSIVE`, tope 100) |
| `services/tramite.service.js` | CRUD de trámites con requisitos y mesas en transacción, publicar/despublicar, dispara la indexación en segundo plano, borra los archivos de R2 al borrar el trámite y limpia la caché |
| `services/mesa.service.js` | CRUD de mesas, verifica que las mesas sean generales o del sector, cuenta los trámites que usan una mesa |
| `services/documento.service.js` | **R2:** sube con `PutObject` a la key `documentos/<uuid>.<ext>`, genera la URL firmada de `GetObject` (300 s), borra con `DeleteObject`; lista los documentos sin exponer la key |
| `services/embedding.service.js` | Arma el texto del trámite, pide el embedding a `core/ai` y lo guarda con SQL crudo; `indexarSiFalta` para los que no tienen |
| `services/busqueda.service.js` | Búsqueda híbrida (pgvector + full-text) sobre trámites publicados, deduplicada por nombre |
| `services/chat.service.js` | Orquesta el RAG: caché, búsqueda, contexto, prompts, aclaración multivuelta, streaming y registro de la consulta |
| `services/cache.service.js` | `Map` en memoria con TTL y tope de entradas, clave = pregunta normalizada |
| `services/metrica.service.js` | Registra consultas, las agrupa por trámite (con filtro de sectores), lista las sin respuesta y el historial de un usuario |
| `services/correo.service.js` | Arma el correo de recuperación (texto + HTML, escapa el nombre) y lo manda con el `transporter` |
| `services/turnos.service.js` | Consulta el padrón: `POST` form-urlencoded a `TURNOS_URL` con `dni` y `sexo`, parsea el XML, timeout de 10 s. Devuelve `null` si la persona no existe (incluido el relleno "SIN DATOS") y lanza si el servicio falla |
| `config/r2.js` | `S3Client` con `region: 'auto'` y el endpoint de R2 |
| `config/correo.js` | `transporter` de nodemailer con `service: 'gmail'`; al arrancar corre `verify()` y loguea si conectó |
| `config/openai.js` | Cliente de OpenAI (solo lo usa `core/ai/openai.adapter.js`) |
| `config/multer.js` | Almacenamiento en memoria, 10 MB, solo PDF o DOCX |

### 2.3 Variables de entorno

Solo nombres; los valores que figuran son los defaults del código, no los del `.env`.

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY` | sí | El server no arranca sin ellas |
| `R2_ACCOUNT_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | sí | Ídem |
| `SMTP_USER`, `SMTP_PASS`, `FRONTEND_URL` | sí | Correo de recuperación y base del link |
| `TURNOS_URL` | no se valida | Necesaria para registrar ciudadanos (ver 7.8) |
| `PORT` | no | `3000` |
| `JWT_EXPIRES_IN` | no | `2h` |
| `CORS_ORIGIN` | no | `http://localhost:5173`; también decide a qué origen se manda el link de recuperación |
| `TRUST_PROXY` | no | Apagado |
| `OPENAI_MODELO_CHAT`, `OPENAI_TEMPERATURA` | no | `gpt-4o-mini`, `0.3` (no figuran en `.env.example`) |
| `UMBRAL_DISTANCIA` | no | `0.5` (no figura en `.env.example`) |
| `CACHE_TTL_MS`, `CACHE_MAX` | no | 1 hora, 500 entradas (no figuran en `.env.example`) |

### 2.4 Versiones

`package.json` no tiene campo `engines`. El README pide Node 22 o superior, porque `npm test` usa globs en `node --test`. En esta máquina: **Node v26.7.0**, npm 11.16.0.

| Dependencia | En `package.json` | Instalada |
|---|---|---|
| `express` | `^5.2.1` | 5.2.1 |
| `@prisma/client` / `prisma` | `^6.19.3` | 6.19.3 |
| `zod` | `^4.4.3` | 4.4.3 |
| `openai` | `^6.49.0` | 6.49.0 |
| `@aws-sdk/client-s3` / `s3-request-presigner` | `^3.1142.0` | 3.1142.0 |
| `jsonwebtoken` | `^9.0.3` | 9.0.3 |
| `bcrypt` | `^6.0.0` | 6.0.0 |
| `nodemailer` | `^10.1.7` | 10.1.7 |
| `multer` | `^2.1.1` | 2.4.0 |
| `express-rate-limit` | `^8.5.2` | 8.5.2 |
| `helmet` | `^8.2.0` | 8.2.0 |
| `cors` | `^2.8.6` | 2.8.6 |
| `morgan` | `^1.11.0` | 1.12.1 |
| `fast-xml-parser` | `^5.11.2` | 5.11.2 |
| `dotenv` | `^17.4.2` | 17.4.2 |
| `nodemon` (dev) | `^3.1.14` | 3.1.14 |

---

## 3. Rutas

**Globales (`app.js`), en orden:** `trust proxy` (si hay `TRUST_PROXY`) → `helmet()` → `cors({ origin: origenesPermitidos })` → `morgan('dev')` → `express.json()` → rutas → 404 JSON → `errorHandler`.

**Abreviaturas:** `auth` = `autenticar` · `auth?` = `autenticarOpcional` · `authPwd` = `autenticarCambioPassword` · `rol(SU)` / `rol(ADM)` / `rol(SU,ADM)` = `autorizar(...)` · `sector` = `puedeGestionarTramite` (el ADM tiene asignado el sector del trámite). Todos los controllers y `sector` van envueltos en `asyncHandler`. Los routers con `:id` / `:docId` tienen `router.param(..., validarId(...))`: un id que no es entero positivo de rango `Int` responde 404 antes de llegar a Prisma.

**Rate limits:** `loginLimiter` 10 / 15 min · `recuperarLimiter` 3 / 15 min · `restablecerLimiter` 10 / 15 min · `registroLimiter` 5 / hora · `publicoLimiter` 60 / min · `chatLimiter` 10 / min (definido en `chat.routes.js`). Todos en memoria y por IP.

| Método | Ruta | Middlewares | Controller | Notas |
|---|---|---|---|---|
| GET | `/api/health` | — | inline en `app.js` | `{ status: "ok", servicio: "ChatAP API" }` |
| POST | `/api/auth/login` | `loginLimiter` | `auth.login` | 401 genérico; 403 con el motivo si no está `APROBADO` |
| POST | `/api/auth/recuperar` | `recuperarLimiter` | `auth.solicitarRecuperacion` | Responde igual exista o no el email |
| POST | `/api/auth/restablecer` | `restablecerLimiter` | `auth.restablecer` | |
| POST | `/api/auth/cambiar-password` | `authPwd` | `auth.cambiarPassword` | Devuelve token nuevo |
| POST | `/api/usuarios/registro-ciudadano` | `registroLimiter` | `usuario.registrarCiudadano` | 409 email/DNI repetido, 422 no está en el padrón, 503 padrón caído |
| GET | `/api/usuarios` | `auth`, `rol(SU)` | `usuario.listar` | `?estado=` |
| POST | `/api/usuarios` | `auth`, `rol(SU)` | `usuario.crearEmpleado` | Siempre ADM, `APROBADO`, `debeCambiarPassword: true` |
| GET | `/api/usuarios/me/sectores` | `auth`, `rol(SU,ADM)` | `usuario.misSectores` | |
| GET | `/api/usuarios/:id/sectores` | `auth`, `rol(SU)` | `usuario.listarSectores` | |
| PUT | `/api/usuarios/:id/sectores` | `auth`, `rol(SU)` | `usuario.asignarSectores` | Solo a ADM (409 si no) |
| PATCH | `/api/usuarios/:id/suspender` | `auth`, `rol(SU)` | `usuario.suspender` | Solo `APROBADO`, no a uno mismo |
| PATCH | `/api/usuarios/:id/reactivar` | `auth`, `rol(SU)` | `usuario.reactivar` | Solo `SUSPENDIDO` |
| GET | `/api/sectores` | `auth`, `rol(SU,ADM)` | `sector.listar` | |
| GET | `/api/sectores/:id` | `auth`, `rol(SU,ADM)` | `sector.obtener` | |
| POST | `/api/sectores` | `auth`, `rol(SU)` | `sector.crear` | |
| PATCH | `/api/sectores/:id` | `auth`, `rol(SU)` | `sector.actualizar` | Parcial; 409 si genera un ciclo |
| DELETE | `/api/sectores/:id` | `auth`, `rol(SU)` | `sector.eliminar` | 409 si tiene trámites |
| GET | `/api/mesas` | `auth`, `rol(SU,ADM)` | `mesa.listar` | Incluye el sector |
| GET | `/api/mesas/:id` | `auth`, `rol(SU,ADM)` | `mesa.obtener` | |
| POST | `/api/mesas` | `auth`, `rol(SU)` | `mesa.crear` | 400 si el sector no existe |
| PATCH | `/api/mesas/:id` | `auth`, `rol(SU)` | `mesa.actualizar` | |
| DELETE | `/api/mesas/:id` | `auth`, `rol(SU)` | `mesa.eliminar` | 409 si tiene trámites |
| GET | `/api/tramites/publicados` | `publicoLimiter` | `tramite.listarPublicados` | Solo `id` y `nombre`. Declarada antes de `/:id` |
| GET | `/api/tramites` | `auth`, `rol(SU,ADM)` | `tramite.listar` | Todos los sectores, publicados y borradores |
| GET | `/api/tramites/:id` | `auth`, `rol(SU,ADM)` | `tramite.obtener` | |
| POST | `/api/tramites` | `auth`, `rol(ADM)` | `tramite.crear` | El controller exige el sector del body y valida las mesas |
| PATCH | `/api/tramites/:id` | `auth`, `rol(ADM)`, `sector` | `tramite.actualizar` | `requisitos`/`mesaIds` presentes reemplazan |
| DELETE | `/api/tramites/:id` | `auth`, `rol(ADM)`, `sector` | `tramite.eliminar` | Borra también en R2 |
| PATCH | `/api/tramites/:id/publicar` | `auth`, `rol(SU)` | `tramite.publicar` | Indexa si falta el embedding |
| PATCH | `/api/tramites/:id/despublicar` | `auth`, `rol(SU)` | `tramite.despublicar` | |
| POST | `/api/tramites/:id/documentos` | `auth`, `rol(ADM)`, `sector`, `upload.single('archivo')` | `documento.subir` | PDF o DOCX, 10 MB |
| GET | `/api/tramites/:id/documentos` | `publicoLimiter`, `auth?` | `documento.listar` | Borrador: solo SU o ADM del sector; al resto 404 |
| GET | `/api/tramites/:id/documentos/:docId/descargar` | `publicoLimiter`, `auth?` | `documento.descargar` | `{ url }` firmada por 5 min |
| DELETE | `/api/tramites/:id/documentos/:docId` | `auth`, `rol(ADM)`, `sector` | `documento.eliminar` | |
| POST | `/api/chat` | `chatLimiter`, `auth?` | `chat.consultar` | `{ tipo, respuesta, encontrado, tramitesEncontrados, opciones }` |
| POST | `/api/chat/stream` | `chatLimiter`, `auth?` | `chat.consultarStream` | SSE: eventos `delta`, `fin`, `error` |
| GET | `/api/metricas/por-tramite` | `auth`, `rol(SU,ADM)` | `metrica.porTramite` | `?alcance=propias` |
| GET | `/api/metricas/sin-respuesta` | `auth`, `rol(SU,ADM)` | `metrica.sinRespuesta` | Últimas 50, de todo el sistema |
| GET | `/api/consultas/mias` | `auth` | `consulta.misConsultas` | Últimas 50 del usuario (cualquier rol) |

Errores siempre como `{ "error": "mensaje" }`. `autenticar` responde 403 con `codigo: 'PASSWORD_CHANGE_REQUIRED'` en el error si el usuario tiene que cambiar la contraseña. Ojo: el `errorHandler` solo devuelve `{ error }`, así que ese `codigo` no llega al cliente (ver 7.18).

---

## 4. Base de datos

### 4.1 Enums

| Enum | Valores |
|---|---|
| `Rol` | `SUPERUSUARIO`, `ADMINISTRADOR`, `CIUDADANO` |
| `TipoSector` | `MINISTERIO`, `SUBSECRETARIA`, `DEPARTAMENTO`, `ORGANISMO` |
| `EstadoUsuario` | `PENDIENTE`, `APROBADO`, `RECHAZADO`, `SUSPENDIDO` |
| `Genero` | `M`, `F` |

### 4.2 Modelos y relaciones

| Modelo (tabla) | Campos | Relaciones (al borrar el padre) |
|---|---|---|
| `Sector` (`sectores`) | `nombre`, `tipo`, `parentId?`, timestamps. Único `(nombre, parentId)` | `parent` → `Sector` (SET NULL); `hijos`, `tramites`, `mesasEntrada`, `usuarios` |
| `Tramite` (`tramites`) | `nombre`, `descripcion`, `costo?` Decimal(12,2), `publicado` (false), `embedding?` vector(1536), `searchVector?` tsvector, `fuenteUrl?` único, timestamps | `encargado` → `Usuario` (RESTRICT), `sector` → `Sector` (RESTRICT); `requisitos`, `documentos`, `mesas`, `consultas` |
| `Requisito` (`requisitos`) | `descripcion`, `dondeSeConsigue?`, `costo?` | `tramite` (CASCADE) |
| `MesaEntrada` (`mesas_entrada`) | `nombre`, `direccion?`, `localidad?`, `horario?`, `esGeneral` (false) | `sector?` (SET NULL); `tramites` |
| `TramiteMesa` (`tramite_mesa`) | PK `(tramiteId, mesaId)` | `tramite` (CASCADE), `mesa` (CASCADE) |
| `Documento` (`documentos`) | `nombre`, `archivo` (key de R2), `tipo?`, `createdAt` | `tramite` (CASCADE) |
| `Usuario` (`usuarios`) | `nombre`, `email` único, `passwordHash`, `rol` (default `ADMINISTRADOR`), `estado` (default `PENDIENTE`), `dni?`, `genero?`, único `(dni, genero)`, `resetTokenHash?`, `resetTokenExpira?`, `debeCambiarPassword` (false), `passwordCambiadaEn?`, timestamps | `sectores`, `tramitesACargo`, `consultar` (sic) |
| `UsuarioSector` (`usuario_sector`) | PK `(usuarioId, sectorId)` | `usuario` (CASCADE), `sector` (CASCADE) |
| `Consulta` (`consultas`) | `textoConsulta`, `encontrado` (false), `fecha` | `tramite?` (SET NULL), `usuario?` (SET NULL) |

Índices: `sectorId`, `parentId`, `tramiteId` y `usuarioId` donde corresponde, más los dos de búsqueda de 4.3.

### 4.3 Lo que está en la base pero no (del todo) en `schema.prisma`

- **`tramites.search_vector`:** en la base es una columna `GENERATED ALWAYS AS (to_tsvector('spanish', nombre || ' ' || descripcion)) STORED`. Desde `e7c0f95` está declarada en el schema como `Unsupported("tsvector")` con `@default(dbgenerated(...))`. Prisma no sabe expresar una columna generada y la ve como un default. La definición real vive solo en la migración `20261017193000_search_vector_indices`.
- **`tramites.embedding`:** `Unsupported("vector(1536)")`. No aparece en el cliente de Prisma, así que se lee y se escribe solo con `$queryRaw` / `$executeRaw` (`busqueda.service`, `embedding.service`, `reindexar-faltantes.js`). Lo mismo vale para `search_vector`.
- **Índice `tramites_embedding_idx`:** en el schema figura como un `@@index([embedding])` común, pero en la base es `USING hnsw (embedding vector_cosine_ops)`. El tipo HNSW y el operador de coseno están solo en el SQL de la migración. `tramites_search_idx` sí coincide (`type: Gin`).
- **Extensión `vector`:** declarada en el schema (`extensions = [vector]`, preview `postgresqlExtensions`) y creada en la migración `init`.
- **En una base donde se aplicaron las migraciones de Felipe (4.4)** existen además `usuarios.cuil`, `consultas.calificacion`, `consultas.respuesta`, `consultas.topico` y los valores `O` y `X` en `Genero`, que esta rama no conoce.

`tests/esquema.test.js` verifica que la columna y los dos índices existan.

### 4.4 Migraciones

**En esta rama (`dev-nata`), las 15 son tuyas:** todos los commits que las agregan tienen tu email (`zenagsuma5@…`), aunque estén firmados como "Nata", "Natanael Obed" o "unknown" (los "unknown" vienen de una máquina sin `user.name` configurado).

| # | Carpeta | Commit | Qué hace |
|---|---|---|---|
| 1 | `20260612173413_init` | `73a45b1` | Tablas base, extensión `vector`, enums `Rol` y `TipoSector` |
| 2 | `20260904005046_estado_usuario` | `529591e` | Enum `EstadoUsuario`, reemplaza `activo` |
| 3 | `20260907094902_coherencia_esquema` | `d63e36e` | Renombres, `embedding` a vector(1536), índice de consultas |
| 4 | `20260907100027_estado_suspendido` | `d63e36e` | Agrega `SUSPENDIDO` |
| 5 | `20260907143702_encargado_relacion` | `d63e36e` | `encargado` texto → FK `encargado_id` |
| 6 | `20260930055653_indices_vectoriales` | `23c1500` | HNSW, `search_vector` y GIN (SQL a mano) |
| 7 | `20261016130415_tipo_organismo_y_fuente_url` | `5b3f772` | `fuente_url`; **borra** `search_vector` y los dos índices (migración generada) |
| 8 | `20261016133441_tipo_organismo` | `5b3f772` | Agrega `ORGANISMO` |
| 9 | `20261017193000_search_vector_indices` | `107af9e` | Vuelve a crear `search_vector` y los índices |
| 10 | `20261017233000_rol_ciudadano` | `107af9e` | Agrega `CIUDADANO` |
| 11 | `20261018000000_ciudadano_dni_genero` | `107af9e` | Enum `Genero`, `dni`, `genero` |
| 12 | `20261018010000_consulta_usuario` | `107af9e` | `consultas.usuario_id` |
| 13 | `20261019000000_reset_password` | `738bc20` | `reset_token_hash`, `reset_token_expira` |
| 14 | `20261021000000_alta_empleados` | `763066f` | `debe_cambiar_password`, `password_cambiada_en` |
| 15 | `20261026000000_mesa_horario` | `b7f7656` | `mesas_entrada.horario` |

**Las de tu compañero (Felipe) están solo en otras ramas** y no existen en `dev-nata`:

| Rama | Carpeta | Qué hace |
|---|---|---|
| `origin/dev-felipe` | `20261022180000_usuario_cuil_y_calificacion_consulta` | `usuarios.cuil` TEXT único, `consultas.calificacion` |
| `origin/mejora-ux-historial-tutorial-legales` | `20261014120000_rol_ciudadano` | `ADD VALUE 'CIUDADANO'`: lo mismo que tu #10 con otro nombre |
| ídem | `20261015130000_cuil_solicitudes_empleados` | `usuarios.cuil` VARCHAR(11) único |
| ídem | `20261020000000_consulta_respuesta_calificacion_topico` | `consultas.respuesta`, `calificacion`, `topico` |
| ídem | `20261021120000_genero_otro_prefiero_no_decirlo` | Agrega `O` y `X` a `Genero` |

Además, `dev-felipe` no tiene tu #15 (`mesa_horario`), y `mejora-ux-historial-tutorial-legales` no tiene ni la #14 ni la #15. `dev-alfonso` no agrega migraciones. Las consecuencias están en 7.3.

---

## 5. Validadores Zod

### 5.1 Lo que acepta esta rama

En Zod 4, `z.object` **descarta en silencio** las claves que no declara. Ningún schema hace `trim` ni pasa el email a minúsculas, salvo `subirDocumentoSchema.nombre`.

| Schema | Archivo | Campos |
|---|---|---|
| **`loginSchema`** | `auth.validators.js` | `email`: `z.email()` **obligatorio**; `password`: string min 1 |
| `recuperarSchema` | ídem | `email`: `z.email()` |
| `restablecerSchema` | ídem | `token`: string min 1; `password`: min 8 |
| `cambiarPasswordSchema` | ídem | `passwordActual`: min 1; `passwordNueva`: min 8 |
| **`registroCiudadanoSchema`** | `usuario.validator.js` | `dni`: `/^\d{7,8}$/`; `genero`: enum de Prisma (`M`, `F`); `email`: `z.email()`; `password`: min 8. El nombre no se recibe: sale del padrón |
| **`crearEmpleadoSchema`** | ídem | `nombre`: min 1; `email`: `z.email()`; `password`: min 8; `sectorIds`: array de enteros positivos, default `[]`. **No acepta `rol`, `dni` ni `cuil`** |
| `asignarSectoresSchema` | ídem | `sectorIds`: array de enteros positivos |
| `filtroUsuariosSchema` | ídem | `estado?`: enum de Prisma |
| `crearSectorSchema` / `actualizarSectorSchema` | `sector.validator.js` | `nombre`, `tipo` (enum de Prisma), `parentId?` nullable; el de actualizar es `.partial()` |
| `crearTramiteSchema` / `actualizarTramiteSchema` | `tramite.validator.js` | `nombre`, `descripcion`, `costo?` ≥ 0, `sectorId`, `requisitos[]`, `mesaIds[]`. Crear pone `[]` por defecto; actualizar es `.partial()` sin defaults |
| `crearMesaSchema` / `actualizarMesaSchema` | `mesa.validator.js` | `nombre`, `direccion?`, `localidad?`, `horario?`, `esGeneral?`, `sectorId?` nullable |
| `subirDocumentoSchema` | `documento.validator.js` | `nombre?`: trim, 1 a 200 |
| chat (inline) | `chat.controller.js` | `pregunta?` 1 a 500, o `mensajes?` 1 a 20 de `{ rol: usuario\|asistente, texto 1-2000 }`; uno de los dos obligatorio |

### 5.2 Incompatibilidades con el frontend de `origin/dev-felipe`

Esto sale de comparar lo que manda `client/src/services/auth.js` y `usuarios.js` de esa rama con los schemas de 5.1:

| Caso | Qué manda el front | Qué hace esta rama |
|---|---|---|
| **Login** | `{ dni, password }` si la persona escribe un DNI (el comentario del front dice "acepta email o DNI") | 400 "El email no es válido.": `email` es obligatorio y no hay login por DNI |
| **Registro de ciudadano** | `{ dni, genero, email, password, nombre, apellido }`, con `genero` ∈ `M`, `F`, `O`, `X` | `O` y `X` → 400 (el enum tiene solo `M` y `F`, y el padrón espera un `sexo`). `nombre` y `apellido` se descartan en silencio |
| **Alta de empleados** | `{ nombre, email, password, rol, dni, cuil, sectorIds }` | `rol`, `dni` y `cuil` se descartan en silencio: siempre crea un `ADMINISTRADOR` sin DNI, aunque en la pantalla se haya elegido otro rol |
| Email | El front lo pasa a minúsculas en el alta y el login | El backend lo guarda como llega. Un email con mayúsculas guardado desde otro cliente no matchea en el login, y la unicidad distingue mayúsculas |
| Endpoints | `GET /api/usuarios/pendientes`, `PATCH /api/usuarios/:id/aprobar`, `PATCH /:id/rechazar`, `PATCH /api/usuarios/me/perfil`, `DELETE /api/usuarios/me` | No existen → 404 |

---

## 6. Diseño

### Roles

| Rol | Puede |
|---|---|
| `SUPERUSUARIO` | Gestionar usuarios, sectores y mesas; crear empleados; publicar y despublicar trámites; ver métricas. **No** crea ni edita trámites (se revirtió en `2f93513`) |
| `ADMINISTRADOR` | Crear y gestionar trámites y documentos de los sectores que tiene asignados; ver sectores, mesas y métricas |
| `CIUDADANO` | Usar el chat logueado y ver su historial (`/api/consultas/mias`) |

`autenticar` relee el usuario de la base en cada request: una suspensión o un cambio de rol tienen efecto inmediato. El JWT lleva un claim `pwd` con la fecha del último cambio de contraseña; si no coincide con la base, el token se rechaza.

### Capa de IA (puerto + adaptador)

`core/ai/proveedor.js` define el contrato `ProveedorIA` (`generarEmbedding`, `generarRespuesta`, `generarRespuestaStream`, `infoEmbedding`) y `openai.adapter.js` lo implementa. Los services solo importan `ia` desde `core/ai/index.js`. El modelo de chat se puede cambiar por variable de entorno. El de embeddings (`text-embedding-3-small`, 1536 dimensiones) está fijo en el código, porque cambiarlo invalida los vectores guardados.

### Cómo funciona el chat

```
POST /api/chat  (o /stream)
  └─ chat.service.responderConsulta(mensajes, usuarioId)
       ├─ un solo turno → busca en la caché (clave normalizada, TTL 1 h, 500 entradas)
       ├─ busqueda.buscarTramites(texto de todos los turnos del usuario, 3)
       │    ├─ solo trámites publicados y con embedding
       │    ├─ puntaje = 0,6 · similitud coseno + 0,4 · ts_rank (términos con OR)
       │    ├─ candidato si distancia < UMBRAL_DISTANCIA (0,5) o coincide por texto
       │    └─ trae 12 y descarta nombres repetidos → los 3 mejores
       ├─ sin candidatos → mensaje fijo, sin llamar al modelo
       ├─ contexto: requisitos, mesas y nombres de formularios de cada candidato
       ├─ modelo: JSON con { tipo, respuesta, encontrado, tramitesUsados, opciones }
       │    (en streaming, la primera línea es ese JSON y después el texto)
       │    después de 2 aclaraciones se le exige responder
       ├─ se descartan los ids que no estén en el contexto;
       │    encontrado = el modelo dice true y quedó algún id válido
       └─ registra la consulta en `consultas` (las aclaraciones no se registran ni se cachean)
```

La caché se limpia al crear, editar, borrar, publicar o despublicar un trámite, al editar o borrar una mesa y al subir o borrar un documento.

### Indexación

- Al crear o editar un trámite, el embedding se genera en segundo plano a partir del nombre, la descripción y los requisitos. Si falla, solo se loguea.
- Al publicar, si el trámite no tiene embedding, se genera.
- `node scripts/reindexar-faltantes.js` genera los que falten.

### Catálogo real

`node scripts/importarTramites.js <archivo>` carga el JSON que genera `ingestion/`: 278 trámites, publicados de entrada, a cargo de un usuario `sistema@chatap.local` que no puede loguearse. El catálogo trae solo nombre, descripción, sector y URL de origen, sin requisitos ni mesas. Los trámites se actualizan por `fuenteUrl` y solo se reindexan los que cambiaron.

---

## 7. Problemas y observaciones

### ✅ Resuelto en los últimos commits

- Ids inválidos en trámites, mesas, sectores, usuarios y documentos → 404 en vez de 500 (`800c783`).
- Documentos: visibilidad según si el trámite está publicado; el documento tiene que ser del trámite de la URL; no se expone la key de R2 (`fc84321`).
- `autenticarOpcional` hace los mismos chequeos que `autenticar` y nunca es más permisivo (`fc84321`).
- `encontrado` ya no depende de que la búsqueda haya traído algo: hace falta que el modelo diga que respondió y que use un id del contexto (`c9fbe8a`).
- Tipos de sector, estados y géneros derivados del enum de Prisma (`8fb410c`).
- Timeout de 10 s al padrón de turnos (`452988a`).
- Errores de JSON mal formado y de body ausente en español (`77dc49f`).
- Variables de R2, SMTP y `FRONTEND_URL` obligatorias al arrancar (`94c44ce`).
- Trámites con nombre repetido descartados en la búsqueda (`89b8be1`).

### 🔴 Bloqueantes

1. **`README.md` describe una versión vieja de la API.** Lo que ya no es cierto:
   - Habla de dos roles; falta `CIUDADANO`.
   - Documenta `POST /api/usuarios/registro`, `GET /pendientes`, `PATCH /:id/aprobar` y `/rechazar`, que no existen. Faltan `registro-ciudadano`, `POST /api/usuarios` y las rutas de sectores de usuario.
   - Dice que el "dueño" del trámite es el encargado y que él publica. Hoy se gestiona por sector y publica el superusuario.
   - Los documentos figuran como "Autenticado"; hoy son públicos si el trámite está publicado.
   - Faltan `/api/auth/recuperar`, `/restablecer`, `/cambiar-password`, `/api/chat/stream`, `/api/mesas`, `/api/consultas/mias` y el `alcance` de métricas.
   - Chat: dice que toma 5 trámites con distancia < 0,8. Hoy son 3 con < 0,5, deduplicados, y acepta `mensajes` (multivuelta).
   - "Pendiente: CRUD de mesas" y "`UsuarioSector` sin endpoints": las dos cosas ya están hechas.
   - R2 aparece como "para documentos", pero hoy es obligatorio. Faltan `SMTP_*`, `FRONTEND_URL` y `TURNOS_URL`.
   - Dice 29 tests que no tocan la base: hoy son 41 y `esquema.test.js` sí la necesita.
   - Falta `ORGANISMO` en los tipos de sector.

   Además, `docs/revision-chat-encontrado.md` describe como abierto un bug que ya se arregló.
2. **El frontend de `dev-felipe` no es compatible con esta API** (detalle en 5.2): login por DNI, géneros `O`/`X`, `rol`/`dni`/`cuil` en el alta y 5 endpoints inexistentes. Hay que acordar el contrato: o el backend agrega esas cosas, o el front deja de mandarlas.
3. **Las migraciones de las ramas no se pueden aplicar juntas** (4.4):
   - `20261014120000_rol_ciudadano` (de Felipe) y tu `20261017233000_rol_ciudadano` hacen `ALTER TYPE "Rol" ADD VALUE 'CIUDADANO'` sin `IF NOT EXISTS`: la segunda que corra falla.
   - Las dos de Felipe que agregan `usuarios.cuil` (una TEXT, otra VARCHAR(11)) crean el mismo índice `usuarios_cuil_key`: tampoco pueden convivir.
   - Si una base compartida ya tiene aplicadas migraciones de otra rama, `prisma migrate deploy` desde `dev-nata` las ve como aplicadas pero inexistentes en el repo, y `prisma migrate dev` detecta *drift* y propone resetear la base.

   Hay que elegir una sola historia de migraciones (la de esta rama, que es la más completa) y que las otras ramas agreguen sus cambios (`cuil`, `calificacion`, `respuesta`, `topico`, `O`/`X`) como migraciones nuevas encima de la #15.

### 🟠 Reglas de negocio con huecos

4. **Estados `PENDIENTE` y `RECHAZADO` sin flujo.** Se quitaron los endpoints de aprobar y rechazar, pero los estados siguen en el enum, el default del schema es `PENDIENTE`, el login tiene mensajes para ellos y solo `seed-demo.js` los genera. El front de `dev-felipe` todavía los usa (`EmployeeApprovals.jsx`). Hay que decidir si se eliminan o si vuelve el flujo de solicitud.
5. **Editar un trámite publicado se salta la aprobación.** Publicar quedó restringido al supervisor (`2df6210`), pero el `PATCH /api/tramites/:id` no toca `publicado`: el cambio de un administrador sale al chat al instante.
6. **Editar una mesa no revalida los trámites que la usan.** Si `PATCH /api/mesas/:id` cambia `sectorId` o apaga `esGeneral`, quedan trámites con una mesa de otro sector, justo lo que crear y editar un trámite impiden.

### 🟡 Robustez y seguridad

7. **El superusuario del seed tiene una contraseña fija** (`admin@chatap.gob.ar` / `cambiar123`) y `debeCambiarPassword: false`. Debería crearse con `true`.
8. **`TURNOS_URL` no se valida al arrancar.** Si falta, el registro de ciudadanos responde 503 "el padrón no está disponible", que confunde.
9. **El email no se normaliza** (`trim` + minúsculas) en login, registro ni alta (ver 5.2).
10. **`/api/metricas/sin-respuesta` no tiene alcance:** cualquier administrador ve las consultas sin respuesta de todo el sistema, con el `usuarioId` de quien preguntó. Además, `?alcance=propias` con un superusuario (que no tiene sectores) devuelve siempre `[]`.
11. **Documentos:** el tipo es el `mimetype` que declara el cliente y la extensión sale del nombre original, así que se puede subir cualquier archivo declarado como PDF. Si el `PUT` a R2 sale bien y el `create` falla, el archivo queda huérfano.
12. **Chat sin streaming:** un `refusal` del modelo deja `content` en `null` → `salida.tipo` revienta → 500 genérico.
13. **Chat con streaming:** si el cliente corta la conexión, no se registra la consulta.
14. **La caché es en memoria y por proceso.** Los scripts de importación y reindexado no la limpian: el server puede responder con datos viejos hasta 1 hora. Lo mismo pasa entre instancias, igual que con el rate limiting.

### 🟢 Prolijidad

15. `.env.example` no lista `OPENAI_MODELO_CHAT`, `OPENAI_TEMPERATURA`, `UMBRAL_DISTANCIA`, `CACHE_TTL_MS` y `CACHE_MAX`.
16. `chatLimiter` vive en `chat.routes.js` con `max` y sin `standardHeaders`; el resto está en `config/rateLimit.js` con `limit`.
17. Capas salteadas: `auth.controller.js` usa `prisma` y `bcrypt` directo, y `propiedad.middleware.js` consulta `prisma` sin pasar por un service.
18. El `codigo: 'PASSWORD_CHANGE_REQUIRED'` que arma `autenticar` no llega al cliente, porque el `errorHandler` solo devuelve `{ error }`. El front tiene que adivinar por el mensaje.
19. `asyncHandler` no hace falta en Express 5 (`autenticar` no está envuelto y funciona). Conviene ser consistente.
20. `metrica.controller.js`: `s.sectorId ?? s.id` es un resto; alcanza con `s.id`.
21. `prisma/fix_search_vector.sql` repite la migración #9. Borrarlo.
22. `scripts/importarTramites.js` busca por defecto `tramites_normalizado.json` en el directorio actual, pero el archivo está en `ingestion/data/`.
23. `scripts/eval-chat.js` usa ids fijos que dependen de la base donde se importó el catálogo, tiene casos marcados "hoy falla" y quedó pendiente un "Nata agrega 10-15 más".
24. Estilo mezclado: comillas dobles en `usuario.controller.js` y `chat.service.js`, simples en el resto. Erratas: "adminstradores" en `asignarSectores` y la relación `consultar` (en vez de `consultas`) en `Usuario`.
25. Falta `engines` en `package.json` para fijar la versión mínima de Node.
26. La config de seed en `package.json#prisma` deja de funcionar en Prisma 7: migrar a `prisma.config.ts` antes de actualizar.

---

## 8. Lo que está bien (para defender)

- **Fallar temprano:** `index.js` valida las 10 variables obligatorias antes de importar nada y nombra las que faltan.
- **Autorización en el backend:** cada ruta tiene `autenticar` + `autorizar(rol)`, y la gestión de trámites además verifica el sector del usuario.
- **Sesiones que se pueden revocar:** el estado y el rol se releen en cada request, y el claim `pwd` invalida los tokens viejos al cambiar la contraseña.
- **Recuperación de contraseña segura:** responde igual exista o no el email, guarda solo el hash del token, vence en 1 hora, es de un solo uso y solo manda el link a orígenes permitidos por CORS.
- **Documentos sin filtraciones:** un borrador responde 404 (no 403), la key de R2 nunca sale del server y la descarga es por URL firmada de 5 minutos.
- **IA desacoplada:** los services dependen del contrato `ProveedorIA`, no del SDK de OpenAI.
- **El chat no inventa trámites:** solo usa publicados, descarta los ids fuera del contexto, responde un mensaje fijo sin llamar al modelo cuando no hay candidatos y limita las aclaraciones a 2.
- **Métricas confiables:** `encontrado` refleja si se respondió de verdad, y `eval-chat.js` detecta respuestas inestables y borra las consultas que registró.
- **Integridad de datos:** jerarquía de sectores sin ciclos, `ON DELETE RESTRICT` traducido a 409, reemplazo de requisitos y mesas en transacción, limpieza de R2 al borrar un trámite.
- **Regresiones cubiertas con tests:** defaults de Zod 4 dentro de `.partial()`, `/publicados` antes de `/:id`, `23001` → 409, columna e índices de búsqueda.
- **Rate limiting por tipo de ruta**, y `TRUST_PROXY` apagado por defecto para que no se pueda falsear la IP.

---

## 9. Próximos pasos sugeridos (en orden)

1. Acordar con Felipe una sola historia de migraciones: la de esta rama, con lo de él como migraciones nuevas encima (punto 3).
2. Acordar el contrato de login, registro y alta con el front de `dev-felipe`, y agregar o quitar los endpoints que llama (puntos 2, 4 y 9).
3. Reescribir el `README.md` con lo de las secciones 2 a 6 de este documento y actualizar o borrar `docs/revision-chat-encontrado.md` (punto 1).
4. Decidir qué pasa al editar un trámite publicado y validar la edición de mesas en uso (puntos 5 y 6).
5. Seed con `debeCambiarPassword: true`, `TURNOS_URL` validada al arrancar y `codigo` en la respuesta de error (puntos 7, 8 y 18).
6. Alcance de `sin-respuesta`, `refusal` del modelo y registro de consultas cortadas en el streaming (puntos 10, 12 y 13).
7. Limpieza: puntos 15 a 26.
8. Tests de integración contra una base propia (controllers, `autenticar`, chat con el proveedor de IA simulado).
9. Configuración de despliegue (Dockerfile o la plataforma que se elija).
