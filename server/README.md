# ChatAP — API

Backend del asistente virtual de trámites de la Provincia de Formosa.

El personal carga trámites (requisitos, mesas de entrada y formularios descargables) y un
supervisor los publica. El ciudadano pregunta en lenguaje natural en un chat público y
recibe una respuesta generada solo a partir de los trámites publicados (RAG).

## Stack

| Capa | Tecnología |
|---|---|
| Servidor HTTP | Express 5 (ES modules, JavaScript) |
| Base de datos | PostgreSQL + `pgvector`, a través de Prisma 6 |
| Autenticación | JWT (`jsonwebtoken`) + `bcrypt` |
| Validación | Zod 4 |
| Archivos | Cloudflare R2 (API S3, `@aws-sdk/client-s3`) + `multer` en memoria |
| IA | OpenAI: `text-embedding-3-small` (embeddings) y `gpt-4o-mini` (respuestas), detrás de `src/core/ai` |
| Correo | `nodemailer` con Gmail (recuperación de contraseña) |
| Padrón | Servicio de turnos de la provincia (verificación de identidad en el registro) |
| Seguridad | `helmet`, `cors`, `express-rate-limit` |

## Requisitos

- Node.js 22.3 o superior (`engines` en `package.json`). Los tests usan globs en `node --test` y `mock.module` de `node:test`.
- PostgreSQL con la extensión `vector`.
- API key de OpenAI, bucket de Cloudflare R2, cuenta de Gmail con contraseña de aplicación y la URL del padrón de turnos.

## Puesta en marcha

```bash
npm install                # el postinstall corre "prisma generate"
cp .env.example .env       # completar los valores
npx prisma migrate deploy  # nunca "migrate dev" contra una base compartida
npx prisma db seed         # crea el superusuario inicial
npm run dev
```

El seed crea (o deja como está) un superusuario `APROBADO` con las credenciales de
[`prisma/seed.js`](prisma/seed.js). Son credenciales de desarrollo: **cambialas antes de
usar el seed en un entorno compartido**.

`npm run seed:demo` carga sectores, mesas, administradores y 15 trámites ficticios con su
embedding; `npm run seed:demo -- --borrar` los quita. Solo toca lo que creó (usuarios
`@chatap.test` y los sectores y mesas con los nombres de [`prisma/seed-demo.js`](prisma/seed-demo.js)).

> Después de cambiar `prisma/schema.prisma` hay que correr `npx prisma generate`
> (`npm run dev` ya lo hace). Un cliente viejo apunta a columnas que ya no existen.

## Variables de entorno

Ver [`.env.example`](.env.example). El `.env` está en `.gitignore`. El server valida las
obligatorias al arrancar y, si falta alguna, termina nombrándolas.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a PostgreSQL |
| `JWT_SECRET` | sí | Secreto para firmar los tokens. Largo y aleatorio |
| `OPENAI_API_KEY` | sí | Embeddings y chat |
| `R2_ACCOUNT_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | sí | Cloudflare R2 para los documentos |
| `SMTP_USER`, `SMTP_PASS` | sí | Cuenta de Gmail que manda el correo de recuperación |
| `FRONTEND_URL` | sí | Base del link de recuperación cuando el pedido no viene de un origen de `CORS_ORIGIN` |
| `TURNOS_URL` | sí | Servicio del padrón para verificar a los ciudadanos |
| `PORT` | no | Puerto HTTP. Default `3000` |
| `JWT_EXPIRES_IN` | no | Vigencia del token. Default `2h` |
| `CORS_ORIGIN` | no | Orígenes permitidos, separados por coma. Default `http://localhost:5173` |
| `TRUST_PROXY` | no | Saltos de proxy a confiar. Vacío si el server se expone directo; `1` detrás de un reverse proxy |
| `OPENAI_MODELO_CHAT` | no | Modelo de las respuestas. Default `gpt-4o-mini` |
| `OPENAI_TEMPERATURA` | no | Default `0.3` |
| `UMBRAL_DISTANCIA` | no | Distancia coseno máxima para que un trámite sea candidato. Default `0.5` |
| `CACHE_TTL_MS` | no | Vigencia de la caché de respuestas. Default 1 hora |
| `CACHE_MAX` | no | Entradas máximas de la caché. Default `500` |

El modelo de embeddings no es configurable: cambiarlo invalida los vectores guardados.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Regenera el cliente de Prisma y levanta el server con nodemon |
| `npm start` | Levanta el server |
| `npm test` | Corre los tests. Algunos usan la base del `.env` (crean y borran sus propios datos) |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes |
| `npx prisma db seed` | Crea el superusuario inicial |
| `npm run seed:demo` | Carga (o recarga) los datos de prueba |
| `node scripts/importarTramites.js [archivo]` | Importa el catálogo real (default `ingestion/data/tramites_normalizado.json` del repo) |
| `node scripts/reindexar-faltantes.js` | Genera el embedding de los trámites que no lo tienen |
| `node scripts/eval-chat.js` | Evalúa el chat contra preguntas fijas (3 corridas por caso). Llama a OpenAI |

## Estructura

```
server/
├── index.js              # Valida variables de entorno y levanta el server
├── app.js                # Middlewares globales, rutas, 404 y errorHandler
├── prisma/               # schema.prisma, migraciones, seeds
├── scripts/              # Importación, reindexado y evaluación del chat
├── src/
│   ├── config/           # Prisma, OpenAI, R2, correo, multer, rate limiters, orígenes
│   ├── core/ai/          # Puerto ProveedorIA y adaptador de OpenAI
│   ├── routes/           # Endpoints y middlewares por ruta
│   ├── controllers/      # Validan la entrada (Zod) y arman la respuesta
│   ├── services/         # Lógica de negocio y acceso a datos
│   ├── middlewares/      # autenticar, autorizar, puedeGestionarTramite, validarId, errorHandler
│   ├── validators/       # Schemas de Zod
│   └── utils/            # Funciones puras (comparación de nombres con el padrón)
├── tests/
└── docs/                 # Estado del backend
```

Flujo de un request: `route → middlewares → controller → service → Prisma`.

## Modelo de datos

| Modelo (tabla) | Descripción |
|---|---|
| `Usuario` (`usuarios`) | Rol `SUPERUSUARIO`, `ADMINISTRADOR` o `CIUDADANO`; estado `PENDIENTE`, `APROBADO`, `RECHAZADO` o `SUSPENDIDO`. `email` único; `dni` único (los empleados no tienen); `genero` `M`, `F` o `X` |
| `Sector` (`sectores`) | Jerarquía (`MINISTERIO`, `SUBSECRETARIA`, `DEPARTAMENTO`, `ORGANISMO`) con `parentId`. Nombre único bajo un mismo padre |
| `UsuarioSector` (`usuario_sector`) | Sectores asignados a cada administrador |
| `Tramite` (`tramites`) | Nombre, descripción, costo, sector, encargado, `publicado`, `embedding vector(1536)`, `fuenteUrl` (catálogo importado) |
| `Requisito` (`requisitos`) | Requisitos de un trámite, con dónde se consigue y costo |
| `MesaEntrada` (`mesas_entrada`) | Lugares de presentación, con horario. Generales o de un sector |
| `TramiteMesa` (`tramite_mesa`) | Relación N a N trámite ↔ mesa |
| `Documento` (`documentos`) | Formularios descargables. Guarda la key del archivo en R2 |
| `Consulta` (`consultas`) | Cada pregunta del chat que se respondió (o no), para las métricas y el historial |

La columna `tramites.search_vector` es generada (`GENERATED ALWAYS AS ... STORED`, full-text
en español sobre nombre y descripción). En el schema figura como `Unsupported("tsvector")`,
pero su definición real, el índice HNSW sobre `embedding` y el GIN sobre `search_vector`
están en el SQL de la migración `20261017193000_search_vector_indices`. `tests/esquema.test.js`
verifica que existan.

Reglas de borrado: un trámite borra en cascada sus requisitos, documentos (y sus archivos
en R2) y vínculos con mesas; sus consultas quedan con `tramiteId = null`. No se puede
borrar un sector ni una mesa que tengan trámites (409).

## Roles

| Rol | Puede |
|---|---|
| `SUPERUSUARIO` | Gestionar usuarios, sectores y mesas; crear empleados; publicar y despublicar trámites; ver métricas. No crea ni edita trámites |
| `ADMINISTRADOR` | Crear y gestionar trámites y documentos de los sectores que tiene asignados; ver sectores, mesas y métricas |
| `CIUDADANO` | Usar el chat logueado y ver su historial |

Solo inician sesión las cuentas `APROBADO`. El token se revalida contra la base en cada
request: una suspensión, un cambio de rol o un cambio de contraseña tienen efecto inmediato.

## Errores

Todas las respuestas son JSON. Los errores tienen la forma:

```json
{ "error": "mensaje para mostrar", "codigo": "OPCIONAL" }
```

`codigo` solo viene cuando el cliente tiene que reaccionar distinto según el caso. Hoy hay uno:

| `codigo` | Status | Cuándo |
|---|---|---|
| `PASSWORD_CHANGE_REQUIRED` | 403 | Cualquier ruta autenticada, si el usuario tiene que cambiar la contraseña (empleado en su primer ingreso). Solo puede usar `POST /api/auth/cambiar-password` |

| Status | Cuándo |
|---|---|
| 400 | Validación (primer mensaje de Zod), JSON mal formado, body ausente, archivo inválido, referencia inexistente |
| 401 | Sin token, token inválido o vencido, cuenta no activa, sesión invalidada por cambio de contraseña, credenciales inválidas |
| 403 | Rol sin permiso, sector no asignado, cuenta no aprobada en el login, cambio de contraseña pendiente |
| 404 | Recurso inexistente, id que no es entero positivo, borrador que el usuario no puede ver, ruta no registrada |
| 409 | Duplicado (email, DNI, nombre de sector), borrado con registros asociados, ciclo de sectores, cambio de estado inválido |
| 413 | Archivo de más de 10 MB |
| 422 | El padrón no confirma la identidad en el registro |
| 429 | Rate limit |
| 503 | El padrón no responde |
| 500 | Error inesperado: mensaje genérico, el detalle queda en el log |

## Endpoints

Los endpoints autenticados esperan `Authorization: Bearer <token>`. SU = superusuario,
ADM = administrador. "ADM del sector" = administrador que tiene asignado el sector del
trámite. Las rutas con `:id` responden 404 si el id no es un entero positivo.

### Autenticación

| Método | Ruta | Acceso | Body → Respuesta |
|---|---|---|---|
| POST | `/api/auth/login` | público, 10 / 15 min | `{ email, password }` **o** `{ dni, password }` (exactamente uno) → `{ token, usuario: { id, nombre, email, rol, debeCambiarPassword } }` |
| POST | `/api/auth/recuperar` | público, 3 / 15 min | `{ email }` → `{ mensaje }` (igual exista o no el email) |
| POST | `/api/auth/restablecer` | público, 10 / 15 min | `{ token, password }` → `{ mensaje }` |
| POST | `/api/auth/cambiar-password` | autenticado, aunque deba cambiarla | `{ passwordActual, passwordNueva }` → `{ mensaje, token, usuario }`. El token anterior queda invalidado |

- El email se normaliza (trim y minúsculas) en login, recuperar, registro y alta de empleados.
- Login: todo fallo de identidad (email o DNI inexistente, contraseña incorrecta) responde
  401 `Credenciales inválidas`. Con la contraseña correcta y la cuenta no `APROBADO`,
  responde 403 con el motivo. Mandar email y DNI juntos, o ninguno, es 400.
- Recuperar: el link (`<origen>/restablecer?token=...`) vence en 1 hora y es de un solo uso.
  Se arma con el origen del pedido si está en `CORS_ORIGIN`; si no, con `FRONTEND_URL`.
- Contraseñas: mínimo 8 caracteres.

### Usuarios

| Método | Ruta | Acceso | Body → Respuesta |
|---|---|---|---|
| POST | `/api/usuarios/registro-ciudadano` | público, 5 / hora | ver abajo → 201 `{ mensaje, usuario: { id, nombre, email, rol } }` |
| GET | `/api/usuarios` | SU | `?estado=PENDIENTE\|APROBADO\|RECHAZADO\|SUSPENDIDO` → `[{ id, nombre, email, rol, estado, createdAt }]` |
| POST | `/api/usuarios` | SU | `{ nombre, email, password, sectorIds? }` → 201 `{ mensaje, usuario }`. Crea un ADM `APROBADO` que debe cambiar la contraseña en el primer ingreso |
| GET | `/api/usuarios/me/sectores` | SU, ADM | → `[{ id, nombre, tipo }]` |
| GET | `/api/usuarios/:id/sectores` | SU | → `[{ id, nombre, tipo }]` |
| PUT | `/api/usuarios/:id/sectores` | SU | `{ sectorIds }` → `{ mensaje, sectores }`. Reemplaza todos. Solo a ADM |
| PATCH | `/api/usuarios/:id/suspender` | SU | → `{ mensaje, usuario }`. Solo sobre `APROBADO`, no sobre uno mismo |
| PATCH | `/api/usuarios/:id/reactivar` | SU | → `{ mensaje, usuario }`. Solo sobre `SUSPENDIDO` |

**Registro de ciudadanos.** Body `{ dni, genero, email, password }`, con `dni` de 7 u 8
dígitos y `genero` `M`, `F` o `X`. Queda `APROBADO` y con el nombre del padrón, no el tipeado.

| `genero` | Body extra | Verificación |
|---|---|---|
| `M` o `F` | — (`nombre` y `apellido` se ignoran) | Se consulta el padrón con ese sexo |
| `X` | `nombre` y `apellido` obligatorios | El padrón solo distingue M y F: se consulta con `M` y después con `F`, y se acepta la persona cuyo nombre y apellido coincidan con los tipeados |

La comparación ignora mayúsculas y tildes y va por palabras: cada palabra tipeada del
nombre tiene que estar en el nombre del padrón, y lo mismo con el apellido (se puede
escribir solo parte de un nombre compuesto, o en otro orden). Respuestas: 409 si el email
o el DNI ya están registrados (el DNI es único, sin importar el género), 422 si el padrón
no confirma la identidad, 503 si el padrón no responde.

### Sectores

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/api/sectores`, `/api/sectores/:id` | SU, ADM | |
| POST | `/api/sectores` | SU | `{ nombre, tipo, parentId? }` → 201 |
| PATCH | `/api/sectores/:id` | SU | Parcial. `parentId` ausente no lo toca; `null` lo vuelve raíz. 409 si genera un ciclo |
| DELETE | `/api/sectores/:id` | SU | 204. 409 si tiene trámites |

### Mesas de entrada

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/api/mesas`, `/api/mesas/:id` | SU, ADM | Incluyen `sector: { id, nombre }` |
| POST | `/api/mesas` | SU | `{ nombre, direccion?, localidad?, horario?, esGeneral?, sectorId? }` → 201 `{ mensaje, mesa }` |
| PATCH | `/api/mesas/:id` | SU | Parcial → `{ mensaje, mesa }` |
| DELETE | `/api/mesas/:id` | SU | `{ mensaje }`. 409 si tiene trámites |

Una mesa con `esGeneral: true` sirve para cualquier trámite; si no, solo para los de su sector.

### Trámites

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/api/tramites/publicados` | público, 60 / min | `[{ id, nombre }]` |
| GET | `/api/tramites` | SU, ADM | Todos, publicados y borradores, con sector y encargado |
| GET | `/api/tramites/:id` | SU, ADM | Con requisitos, mesas, sector y encargado |
| POST | `/api/tramites` | ADM con el sector del body | → 201. El usuario queda como encargado |
| PATCH | `/api/tramites/:id` | ADM del sector | Parcial. `requisitos` o `mesaIds` presentes (aunque sea `[]`) reemplazan a los actuales |
| DELETE | `/api/tramites/:id` | ADM del sector | 204. Borra también los archivos en R2 |
| PATCH | `/api/tramites/:id/publicar` | SU | `{ mensaje, tramite }` |
| PATCH | `/api/tramites/:id/despublicar` | SU | `{ mensaje, tramite }` |

Body: `{ nombre, descripcion, costo?, sectorId, requisitos?: [{ descripcion, dondeSeConsigue?, costo? }], mesaIds?: number[] }`.
Las mesas tienen que existir y ser generales o del sector del trámite (400 si no). Al crear
o editar, el embedding se recalcula en segundo plano; al publicar se genera si falta.

### Documentos

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/api/tramites/:id/documentos` | ADM del sector | `multipart/form-data`: `archivo` (PDF o DOCX, hasta 10 MB) y `nombre` opcional → 201 `{ id, nombre, tipo, createdAt, tramiteId }` |
| GET | `/api/tramites/:id/documentos` | público, 60 / min | `[{ id, nombre, tipo, createdAt }]` |
| GET | `/api/tramites/:id/documentos/:docId/descargar` | público, 60 / min | `{ url }` firmada por 5 minutos |
| DELETE | `/api/tramites/:id/documentos/:docId` | ADM del sector | 204 |

Las rutas públicas siguen la visibilidad del trámite: si está publicado, cualquiera; si
es un borrador, solo un SU o un ADM del sector (con token), y al resto se le responde 404.

### Chat

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/chat` | público, 10 / min. Token opcional: si viene, la consulta queda en el historial del usuario |
| POST | `/api/chat/stream` | ídem, respuesta por Server-Sent Events |

**Body (los dos):**

```json
{ "pregunta": "¿cómo saco el certificado de buena conducta?" }
```

o, para seguir una conversación (hasta 20 mensajes, el último del usuario):

```json
{
  "mensajes": [
    { "rol": "usuario", "texto": "necesito un certificado" },
    { "rol": "asistente", "texto": "¿Cuál necesitás: ...?" },
    { "rol": "usuario", "texto": "el de buena conducta" }
  ]
}
```

`pregunta` hasta 500 caracteres; cada `texto` hasta 2000.

**Respuesta de `POST /api/chat`:**

```json
{
  "tipo": "respuesta",
  "respuesta": "texto para mostrar",
  "encontrado": true,
  "tramitesEncontrados": [{ "id": 269, "nombre": "Certificado de buena conducta" }],
  "opciones": [],
  "consultaId": 414
}
```

| Campo | Significado |
|---|---|
| `tipo` | `respuesta`, o `aclaracion` cuando el asistente pregunta entre varios trámites |
| `respuesta` | Texto plano para el ciudadano (la pregunta aclaratoria si `tipo` es `aclaracion`) |
| `encontrado` | `true` solo si se respondió con algún trámite. Siempre `false` en una aclaración |
| `tramitesEncontrados` | Trámites usados en la respuesta. Vacío si no se encontró nada o es una aclaración |
| `opciones` | Trámites entre los que elegir, solo en una aclaración |
| `consultaId` | Id de la consulta registrada. `null` en las aclaraciones (no se registran) o si falló el registro |

Para seguir después de una aclaración, se reenvía la conversación en `mensajes` con la
elección del usuario. Después de 2 aclaraciones el asistente responde sí o sí.

**Contrato SSE de `POST /api/chat/stream`.** `Content-Type: text/event-stream`. Cada evento
es una línea `data: <json>` seguida de una línea en blanco:

| Evento | Forma | Cuándo |
|---|---|---|
| `delta` | `{ "tipo": "delta", "texto": "..." }` | Varias veces: fragmentos del texto, en orden |
| `fin` | `{ "tipo": "fin", "tipoRespuesta": "respuesta" \| "aclaracion", "encontrado", "tramitesEncontrados", "opciones", "consultaId" }` | Una vez, al final. Mismos campos y significado que la respuesta sin streaming |
| `error` | `{ "tipo": "error", "mensaje": "..." }` | Si algo falla a mitad del stream |

Los errores de validación y el rate limit llegan antes de abrir el stream, como JSON común.
La conexión se cierra después de `fin` o `error`.

### Métricas e historial

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/api/metricas/por-tramite` | SU, ADM | `[{ tramiteId, nombre, sector: { id, nombre }, cantidad }]`, de mayor a menor. Con `?alcance=propias`, un ADM ve solo sus sectores; un SU ve todo |
| GET | `/api/metricas/sin-respuesta` | SU, ADM | Últimas 50: `[{ id, textoConsulta, encontrado, fecha, tramiteId }]`. No incluye quién preguntó |
| GET | `/api/consultas/mias` | cualquier autenticado | Últimas 50 del usuario: `[{ id, textoConsulta, encontrado, fecha, tramite: { id, nombre } \| null }]` |

### Otros

`GET /api/health` responde `{ "status": "ok", "servicio": "ChatAP API" }`. Cualquier ruta no
registrada responde 404 `{ "error": "Ruta no encontrada." }`.

## Cómo funciona el chat

1. **Caché.** Una pregunta de un solo turno se busca primero en una caché en memoria
   (normalizada, 1 hora, 500 entradas). Se limpia al cambiar trámites, mesas o documentos.
   Un acierto de caché también se registra y tiene su propio `consultaId`.
2. **Búsqueda híbrida** con el texto de todos los turnos del usuario, solo sobre trámites
   publicados con embedding: 0,6 · similitud coseno (pgvector, HNSW) + 0,4 · `ts_rank`
   full-text en español (GIN). Es candidato si la distancia coseno es menor a
   `UMBRAL_DISTANCIA` o si coincide por texto. Se descartan los nombres repetidos y quedan 3.
3. **Sin candidatos:** mensaje fijo, sin llamar al modelo.
4. **Contexto:** detalle de los candidatos (requisitos con dónde se consiguen y costo,
   mesas, nombres de los formularios).
5. **Modelo:** devuelve un JSON con `tipo`, `respuesta`, `encontrado`, `tramitesUsados` y
   `opciones` (en streaming, la primera línea es ese JSON y después el texto). Se descartan
   los ids que no estén en el contexto, y `encontrado` exige que quede alguno.
6. **Registro** en `consultas` (salvo aclaraciones), atribuido al primer trámite usado.

## Tests

```bash
npm test
```

Runner nativo de Node, sin dependencias extra. Cubren validators, `errorHandler`,
`autorizar`, `validarId`, el orden de las rutas, la comparación de nombres con el padrón,
el login (por email y por DNI) y el registro de ciudadanos con el padrón simulado.

`esquema.test.js`, `login.test.js` y `registro.test.js` usan la base del `.env`: crean sus
propios usuarios con dominios `.test.invalid` y los borran al terminar. El script de
`npm test` incluye `--experimental-test-module-mocks` para simular el padrón.

`node scripts/eval-chat.js` evalúa el chat con OpenAI de verdad. Es para correr a demanda
y borra las consultas que registra.

## Notas de diseño

**El estado del usuario se revalida en cada request.** El JWT lleva el `id` y un claim
`pwd` con la fecha del último cambio de contraseña. `autenticar` relee el usuario y
rechaza a quien no esté `APROBADO` o tenga un `pwd` viejo.

**El `PATCH` de sectores es parcial y `parentId` distingue ausente de `null`.** Antes de
reasignar el padre se recorre la cadena de ancestros (`WITH RECURSIVE`, tope 100) para no
cerrar un ciclo.

**El schema de actualización de trámites no tiene defaults.** En Zod 4 un `.default()` se
aplica aunque el campo esté en `.partial()`, y un array presente significa "reemplazar
todo".

**Borrar un trámite limpia R2 a mano.** La cascada borra los registros, no los archivos.

**El padrón se consulta con `node:https` y `insecureHTTPParser`.** El servicio responde
encabezados que no cumplen HTTP/1.1 y `fetch` los rechaza. El parser permisivo se habilita
solo en esa request.

**`TRUST_PROXY` está apagado por defecto.** Detrás de un reverse proxy hay que activarlo,
o el rate limiting ve siempre la IP del proxy. Activarlo sin proxy permite falsear la IP.

**El rate limiting y la caché son en memoria.** Con más de una instancia, cada una lleva
los suyos. Los scripts de importación corren en otro proceso y no limpian la caché del server.

## Pendiente

- Estados `PENDIENTE` y `RECHAZADO` sin flujo (no hay endpoints de aprobar o rechazar).
- Editar un trámite publicado no vuelve a pasar por la aprobación del supervisor.
- Editar una mesa no revalida los trámites que ya la usan.
- Alinear las migraciones con las de otras ramas.
- Migrar `package.json#prisma` a `prisma.config.ts` antes de Prisma 7.

Más detalle en [`docs/estado-actual-backend.md`](docs/estado-actual-backend.md).
