# ChatAP — API

Backend del asistente virtual de la Subsecretaría de Recursos Humanos (Provincia de Formosa).

Permite a los administradores cargar y publicar trámites (con requisitos, mesas de entrada
y formularios descargables), y expone un chat público donde el ciudadano pregunta en
lenguaje natural y recibe una respuesta generada a partir de esos trámites (RAG).

## Stack

| Capa | Tecnología |
|---|---|
| Servidor HTTP | Express 5 (ES modules) |
| Base de datos | PostgreSQL + `pgvector`, a través de Prisma 6 |
| Autenticación | JWT (`jsonwebtoken`) + `bcrypt` |
| Validación | Zod 4 |
| Archivos | Cloudflare R2 (API S3, `@aws-sdk/client-s3`) + `multer` en memoria |
| IA | OpenAI: `text-embedding-3-small` (embeddings) y `gpt-4o-mini` (respuestas) |
| Seguridad | `helmet`, `cors`, `express-rate-limit` |
| Logs | `morgan` |

## Requisitos

- Node.js 22 o superior (el script de tests usa globs en `node --test`, disponibles desde Node 21)
- PostgreSQL con la extensión `vector` habilitada
- Una API key de OpenAI
- Un bucket de Cloudflare R2 (solo para la subida de documentos)

## Puesta en marcha

```bash
npm install          # el postinstall corre "prisma generate" solo
cp .env.example .env # completar los valores
npx prisma migrate deploy
npx prisma db seed   # crea el superusuario inicial
npm run dev
```

El seed crea (o deja como está, si ya existe) un superusuario `APROBADO` con las
credenciales definidas en [`prisma/seed.js`](prisma/seed.js). Son credenciales de
desarrollo: **cambialas antes de usar el seed en cualquier entorno compartido**.

### Datos de prueba

```bash
npm run seed:demo              # borra los datos de prueba anteriores y los vuelve a crear
npm run seed:demo -- --borrar  # solo los borra
```

Carga una estructura de sectores, 4 mesas de entrada, 7 administradores (en todos los
estados: aprobados, pendientes, suspendido y rechazado) y 15 trámites con requisitos,
13 publicados, todos con su embedding generado, para que el chat tenga sobre qué
responder. Los montos, oficinas y requisitos son ficticios. El script imprime los
emails y la contraseña de los administradores al terminar.

Solo toca lo que creó: usuarios con email `@chatap.test` (y sus trámites) y las mesas y
sectores con los nombres definidos en [`prisma/seed-demo.js`](prisma/seed-demo.js).
Necesita `OPENAI_API_KEY`, porque genera un embedding por trámite.

> Después de cambiar `prisma/schema.prisma` (o de hacer pull de cambios que lo toquen)
> hay que correr `npx prisma generate` (`npm run dev` ya lo corre antes de arrancar). Un cliente viejo apunta a tablas y columnas que
> ya no existen y los endpoints responden 400/500 sin una causa obvia.

## Variables de entorno

Ver [`.env.example`](.env.example). El archivo `.env` está en `.gitignore`: nunca se
commitean valores reales.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a PostgreSQL. El server no arranca si falta |
| `JWT_SECRET` | sí | Secreto para firmar los tokens. Usar un valor largo y aleatorio. El server no arranca si falta |
| `OPENAI_API_KEY` | sí | Embeddings y chat. El server no arranca si falta |
| `PORT` | no | Puerto HTTP (por defecto `3000`) |
| `JWT_EXPIRES_IN` | no | Vigencia del token (por defecto `2h`) |
| `CORS_ORIGIN` | no | Orígenes permitidos, separados por coma (por defecto `http://localhost:5173`) |
| `TRUST_PROXY` | no | Saltos de proxy a confiar. Vacío si el server se expone directo; `1` detrás de un reverse proxy |
| `R2_ACCOUNT_ENDPOINT` | para documentos | Endpoint S3 de Cloudflare R2 (`https://<account_id>.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | para documentos | Credenciales de R2 |
| `R2_BUCKET` | para documentos | Bucket donde se guardan los archivos |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Regenera el cliente de Prisma y levanta el server con recarga automática (nodemon) |
| `npm start` | Levanta el server |
| `npm test` | Corre la suite con el runner nativo de Node |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes |
| `npx prisma db seed` | Crea el superusuario inicial |
| `npm run seed:demo` | Carga (o recarga) los datos de prueba |

## Estructura

```
server/
├── index.js              # Valida variables de entorno y levanta el server
├── app.js                # Middlewares globales, montaje de rutas, 404 y errorHandler
├── prisma/
│   ├── schema.prisma     # Modelo de datos
│   ├── migrations/       # Migraciones (algunas escritas a mano)
│   └── seed.js           # Superusuario inicial
├── src/
│   ├── config/           # Clientes de Prisma, OpenAI, R2; multer; rate limiters
│   ├── routes/           # Definición de endpoints y middlewares por ruta
│   ├── controllers/      # Validan la entrada (Zod) y arman la respuesta HTTP
│   ├── services/         # Lógica de negocio y acceso a datos
│   ├── middlewares/      # autenticar, autorizar, esPropietario, asyncHandler, errorHandler
│   └── validators/       # Schemas de Zod
└── tests/                # Tests unitarios (validators y middlewares)
```

El flujo de un request es `route → middlewares → controller → service → Prisma`. Los
controllers lanzan errores con `statusCode` y `asyncHandler` los deriva al
`errorHandler` central.

## Modelo de datos

| Modelo (tabla) | Descripción |
|---|---|
| `Usuario` (`usuarios`) | Personal que opera el sistema. Rol `SUPERUSUARIO` o `ADMINISTRADOR`; estado `PENDIENTE`, `APROBADO`, `RECHAZADO` o `SUSPENDIDO` |
| `Sector` (`sectores`) | Jerarquía organizativa (`MINISTERIO`, `SUBSECRETARIA`, `DEPARTAMENTO`) con `parentId`. Nombre único bajo un mismo padre |
| `Tramite` (`tramites`) | Trámite con nombre, descripción, costo, sector, encargado (usuario), flag `publicado` y `embedding vector(1536)` |
| `Requisito` (`requisitos`) | Requisitos de un trámite, con dónde se consigue y costo |
| `MesaEntrada` (`mesas_entrada`) | Lugares donde se presentan los trámites |
| `TramiteMesa` (`tramite_mesa`) | Relación N a N trámite ↔ mesa |
| `Documento` (`documentos`) | Formularios descargables. Guarda la key del archivo en R2, no el archivo |
| `UsuarioSector` (`usuario_sector`) | Relación N a N usuario ↔ sector (todavía sin endpoints) |
| `Consulta` (`consultas`) | Registro de cada pregunta del chat, para las métricas |

Además, la tabla `tramites` tiene una columna generada `search_vector` (full-text en
español sobre nombre + descripción) que no figura en el schema de Prisma: se crea en la
migración `indices_vectoriales`, junto con un índice HNSW sobre `embedding` y un índice
GIN sobre `search_vector`.

Reglas de borrado relevantes:

- Borrar un trámite borra en cascada sus requisitos, documentos y vínculos con mesas. Las
  consultas asociadas quedan con `tramiteId = null`.
- No se puede borrar un sector que tenga trámites, ni un usuario que sea encargado de
  algún trámite (`ON DELETE RESTRICT` → 409).

## Roles y ciclo de vida de los usuarios

1. Un administrador se registra en `POST /api/usuarios/registro` y queda `PENDIENTE`.
2. Un superusuario lo aprueba (`APROBADO`) o lo rechaza (`RECHAZADO`).
3. Un usuario aprobado puede ser suspendido (`SUSPENDIDO`) y luego reactivado.

Solo los usuarios `APROBADO` pueden iniciar sesión. El login responde 401 ante
credenciales incorrectas (mensaje genérico) y 403 con el motivo cuando la contraseña es
correcta pero la cuenta no está habilitada.

| Rol | Puede |
|---|---|
| `SUPERUSUARIO` | Gestionar usuarios y sectores, ver métricas |
| `ADMINISTRADOR` | Crear trámites y gestionar los suyos (editar, publicar, borrar, documentos) |

## Endpoints

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "mensaje" }`.
Los endpoints autenticados esperan el header `Authorization: Bearer <token>`.

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/auth/login` | Público (10 intentos cada 15 min). Body `{ email, password }`, responde `{ token, usuario }` |

### Usuarios

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/usuarios/registro` | Público (5 por hora). Body `{ nombre, email, password }` (mínimo 8 caracteres) |
| `GET` | `/api/usuarios` | Superusuario. Admite `?estado=PENDIENTE\|APROBADO\|RECHAZADO\|SUSPENDIDO`. Nunca devuelve el hash |
| `GET` | `/api/usuarios/pendientes` | Superusuario |
| `PATCH` | `/api/usuarios/:id/aprobar` | Superusuario. Solo sobre `PENDIENTE` |
| `PATCH` | `/api/usuarios/:id/rechazar` | Superusuario. Solo sobre `PENDIENTE` |
| `PATCH` | `/api/usuarios/:id/suspender` | Superusuario. Solo sobre `APROBADO`, y no sobre uno mismo |
| `PATCH` | `/api/usuarios/:id/reactivar` | Superusuario. Solo sobre `SUSPENDIDO` |

### Sectores

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/api/sectores` | Autenticado |
| `GET` | `/api/sectores/:id` | Autenticado |
| `POST` | `/api/sectores` | Superusuario |
| `PATCH` | `/api/sectores/:id` | Superusuario. Actualización parcial |
| `DELETE` | `/api/sectores/:id` | Superusuario. 409 si tiene trámites asociados |

Body: `{ nombre, tipo: "MINISTERIO" | "SUBSECRETARIA" | "DEPARTAMENTO", parentId?: number | null }`.

### Trámites

"Dueño" = administrador que es el encargado del trámite.

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/tramites` | Administrador. El usuario queda como encargado |
| `GET` | `/api/tramites` | Autenticado. Incluye publicados y no publicados |
| `GET` | `/api/tramites/:id` | Autenticado. Incluye requisitos, mesas, sector y encargado |
| `PATCH` | `/api/tramites/:id` | Dueño. Si vienen `requisitos` o `mesaIds`, reemplazan a los actuales |
| `DELETE` | `/api/tramites/:id` | Dueño. Borra también los archivos de sus documentos en R2 |
| `PATCH` | `/api/tramites/:id/publicar` | Dueño |
| `PATCH` | `/api/tramites/:id/despublicar` | Dueño |

Body: `{ nombre, descripcion, costo?, sectorId, requisitos?: [{ descripcion, dondeSeConsigue?, costo? }], mesaIds?: number[] }`.

En el `PATCH` todos los campos son opcionales. Si `requisitos` o `mesaIds` no vienen,
quedan como están; si vienen (aunque sea `[]`), reemplazan a los actuales. Al crear o
editar, el embedding del trámite se recalcula en segundo plano.

### Documentos

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/tramites/:id/documentos` | Dueño. `multipart/form-data` con `archivo` (PDF o DOCX, hasta 10 MB) y `nombre` opcional |
| `GET` | `/api/tramites/:id/documentos` | Autenticado |
| `GET` | `/api/tramites/:id/documentos/:docId/descargar` | Autenticado. Devuelve `{ url }` firmada por 5 minutos |
| `DELETE` | `/api/tramites/:id/documentos/:docId` | Dueño |

Los archivos se guardan en R2 con una key aleatoria (`documentos/<uuid>.<ext>`). Las
rutas con `:docId` verifican que el documento pertenezca al trámite `:id` de la URL.

### Chat

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/chat` | Público (10 por minuto). Body `{ pregunta }` (hasta 500 caracteres), responde `{ respuesta, tramitesEncontrados, encontrado }` |

### Métricas

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/api/metricas/por-tramite` | Superusuario. Cantidad de consultas respondidas agrupadas por `tramiteId` |
| `GET` | `/api/metricas/sin-respuesta` | Superusuario. Últimas 50 consultas sin resultados |

### Otros

`GET /api/health` responde `{ "status": "ok", "servicio": "ChatAP API" }` sin autenticación.
Cualquier ruta no registrada responde `404 { "error": "Ruta no encontrada." }`.

## Cómo funciona el chat (RAG)

1. **Indexación.** Al crear o editar un trámite se arma un texto con su nombre,
   descripción y requisitos, se genera su embedding con `text-embedding-3-small` y se
   guarda en `tramites.embedding`. Corre en segundo plano: si falla, solo se loguea.
2. **Búsqueda híbrida.** La pregunta se convierte en embedding y se buscan trámites
   **publicados** combinando:
   - similitud coseno con pgvector (peso 0,6, índice HNSW), y
   - full-text en español sobre `search_vector` (peso 0,4, índice GIN).

   Un trámite entra como candidato si su distancia coseno es menor a 0,8 o si coincide
   por texto. Se toman los 5 mejores por puntaje.
3. **Contexto.** De esos trámites se carga el detalle completo (requisitos con dónde se
   consiguen y su costo, mesas de entrada, nombres de formularios descargables).
4. **Respuesta.** Se envía a `gpt-4o-mini` (temperatura 0,3) con un system prompt que le
   exige responder solo con la información del contexto y limitarse a temas de trámites.
5. **Registro.** Cada consulta se guarda en `consultas`. Si hubo resultados se atribuye
   al trámite mejor rankeado; si no, queda como `encontrado = false` y se responde un
   mensaje fijo sin llamar al modelo.

Un trámite sin embedding (recién creado, o cuya indexación falló) no aparece en el chat.

## Manejo de errores

El `errorHandler` central traduce los errores conocidos a códigos HTTP:

| Origen | Respuesta |
|---|---|
| `ZodError` (validación) | 400 con el primer mensaje |
| Error propio con `statusCode` | Ese código y mensaje |
| `multer`: archivo mayor a 10 MB | 413 |
| `multer`: otro error de archivo | 400 |
| Prisma: parámetros inválidos (p. ej. id no numérico) | 400 |
| Prisma `P2002` (registro duplicado) | 409 |
| Prisma `P2025` (registro inexistente) | 404 |
| Prisma `P2003` en `DELETE` (tiene registros asociados) | 409 |
| Prisma `P2003` en `POST`/`PATCH` (referencia inexistente) | 400 |
| Postgres `23001` (`ON DELETE RESTRICT`) | 409 |
| Cualquier otro | 500 genérico, con el detalle solo en el log |

## Tests

```bash
npm test
```

29 tests unitarios con el runner nativo de Node, sin dependencias extra. Cubren los
validators de Zod, el `errorHandler` completo y `autorizar`. **No tocan la base**: no
cubren `autenticar`, los controllers, la detección de ciclos ni el chat. Para eso hace
falta una base de test separada.

## Notas de diseño

**El estado del usuario se revalida en cada request.** El JWT lleva el `id`, pero
`autenticar` relee el usuario de la base y rechaza a quien no esté `APROBADO`. Por eso
una suspensión tiene efecto inmediato en lugar de esperar a que expire el token, y el
rol que evalúa `autorizar` es siempre el actual, no el que había al iniciar sesión.
El costo es una consulta por clave primaria en cada request autenticado.

**`RECHAZADO` y `SUSPENDIDO` no son lo mismo.** El primero cierra el circuito de alta
(nunca llegó a ser usuario); el segundo da de baja una cuenta que ya operaba. Por eso
`rechazar` solo actúa sobre `PENDIENTE` y `suspender` solo sobre `APROBADO`.

**El `PATCH` de sectores es parcial, y `parentId` distingue ausente de `null`.** Si el
campo no viene, el padre queda como está; si viene `null`, el sector pasa a ser raíz.
Por eso la ruta es `PATCH` y no `PUT`: nunca reemplaza el recurso completo, y así un
campo olvidado por el cliente no desvincula un sector sin querer.

**La jerarquía de sectores no admite ciclos.** Antes de reasignar el padre de un sector
se recorre la cadena de ancestros (`WITH RECURSIVE`, con tope de profundidad 100) para
verificar que no se cierre un bucle. La validación va solo en el `PATCH`: un sector
recién creado todavía no tiene descendientes que puedan apuntarle de vuelta.

**El schema de actualización de trámites no tiene defaults.** En Zod 4 un `.default()`
se aplica aunque el campo esté dentro de `.partial()`, y el service interpreta un array
presente como "reemplazar todo". Con defaults, un `PATCH` que solo cambiaba el nombre
borraba requisitos y mesas.

**Borrar un trámite limpia R2 a mano.** La cascada de la base borra los registros de
documentos pero no los archivos. El service lee las keys antes de borrar y después
elimina los archivos; si alguno falla, solo se loguea.

**`TRUST_PROXY` está apagado por defecto.** Detrás de un reverse proxy hay que
activarlo, o el rate limiting ve siempre la IP del proxy y limita a todos en conjunto.
Activarlo sin un proxy real permite falsear la IP con `X-Forwarded-For`.

**El rate limiting es en memoria.** Si corre más de una instancia, cada una lleva su
propio conteo.

## Estado

Implementado: autenticación, gestión de usuarios, sectores, trámites con requisitos y
mesas, documentos en R2, chat RAG y métricas.

Pendiente:

- CRUD de mesas de entrada (hoy los trámites referencian mesas por id, pero no hay
  endpoints para crearlas).
- Asignación de sectores a usuarios (`UsuarioSector` está modelado, sin endpoints).
- Listado público de trámites publicados (hoy `GET /api/tramites` requiere sesión).
- Tests de integración contra una base propia.
- Migrar la configuración de `package.json#prisma` a `prisma.config.ts` antes de Prisma 7.
