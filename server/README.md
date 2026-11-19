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
> hay que correr `npx prisma generate`. Un cliente viejo apunta a tablas y columnas que
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
| `OPENAI_MODELO_CHAT` | no | Modelo de las respuestas. Default `gpt-4o-mini` |
| `OPENAI_TEMPERATURA` | no | Default `0.3` |
| `UMBRAL_DISTANCIA` | no | Distancia coseno máxima para que un trámite sea candidato. Default `0.5` |
| `CACHE_TTL_MS` | no | Vigencia de la caché de respuestas. Default 1 hora |
| `CACHE_MAX` | no | Entradas máximas de la caché. Default `500` |
| `CACHE_CHEQUEO_MS` | no | Cada cuánto el server revisa la versión del catálogo en la base para vaciar su caché. Default `5000` |
| `SERVIDOR_URL` | no | Solo para el script de import: dónde consultar `/api/health` para avisar si hay un server encendido. Default `http://localhost:$PORT` |
| `OPENAI_TIMEOUT_EMBEDDING_MS`, `OPENAI_REINTENTOS_EMBEDDING` | no | Timeout por intento y reintentos del embedding. Default `4000` y `1` |
| `OPENAI_TIMEOUT_CHAT_MS`, `OPENAI_REINTENTOS_CHAT` | no | Timeout por intento y reintentos del modelo, con y sin streaming. Default `8000` y `1` |
| `OPENAI_ESPERA_MAXIMA_REINTENTO_MS` | no | Espera máxima antes de reintentar, aunque OpenAI pida más con `retry-after`. Default `2000` |
| `CHAT_PLAZO_MS` | no | Plazo total de una consulta del chat. Default `18000` |
| `CHAT_INACTIVIDAD_STREAM_MS` | no | En streaming, tiempo máximo sin recibir un pedazo del modelo. Default `10000` |
| `STREAM_INCREMENTAL` | no | `true` (default): el texto del chat sale de a oraciones ya verificadas, igual en las dos rutas (ver [Streaming incremental](#streaming-incremental)). `false` (o `0`, `no`): vuelve el comportamiento anterior en las dos rutas |
| `STREAM_ESQUEMA` | no | `true` (default): el streaming le pide al modelo el mismo JSON con esquema estricto y el mismo prompt que la ruta sin streaming, y manda el texto de `respuesta` a medida que llega (ver [Streaming con esquema JSON](#streaming-con-esquema-json)). `false` (o `0`, `no`): vuelve el formato anterior, una línea META y después el texto, con el pedido de nuevo si la META no es válida. Solo aplica con `STREAM_INCREMENTAL=true`: con `false` el streaming usa siempre el formato anterior |
| `TIPEO_REESCRITURA` | no | `true` (default): si la búsqueda del chat no trae candidatos o el mejor puntaje es menor a 0,24, una llamada corta al modelo corrige la ortografía de la consulta y se busca de nuevo con el texto corregido (ver [Cómo funciona el chat](#cómo-funciona-el-chat), paso 2). `false` (o `0`, `no`): no se corrige |
| `TIPEO_TIMEOUT_MS` | no | Timeout de la llamada que corrige la ortografía, sin reintentos (default 3000). Si se pasa, la consulta sigue con la búsqueda original |
| `CHAT_MAX_PREGUNTA` | no | Largo máximo de la pregunta y de cada mensaje de la persona en el historial. Default `500` |
| `CHAT_MAX_TEXTO_ASISTENTE` | no | Largo máximo de cada mensaje del asistente en el historial. Default `6000`: la respuesta honesta más larga mide 3546 (ver [Chat](#chat)) |
| `CHAT_MAX_MENSAJES` | no | Mensajes por conversación. Default `20` |
| `CHAT_MAX_CUERPO_KB` | no | Tamaño máximo del cuerpo de `/api/chat` y `/api/chat/stream`, en kb. Default `128` (el resto de la API, 100) |
| `CHAT_LIMITE_POR_MINUTO`, `CHAT_LIMITE_POR_HORA` | no | Pedidos al chat por IP, compartidos entre las dos rutas. Default `10` y `100`. Para el día de la demo, `120` y `2000` (ver [Chat](#chat)) |

El modelo de embeddings no es configurable: cambiarlo invalida los vectores guardados.
Los tiempos y los límites del chat tienen sus valores por defecto en el código ([`src/config/ia.js`](src/config/ia.js), [`src/config/chat.js`](src/config/chat.js)):
una variable ausente, vacía o que no sea un entero válido deja el default (con un aviso en el log).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el server con recarga automática (nodemon) |
| `npm start` | Levanta el server |
| `npm test` | Corre la suite con el runner nativo de Node |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes |
| `npx prisma db seed` | Crea el superusuario inicial |
| `npm run seed:demo` | Carga (o recarga) los datos de prueba |
| `node scripts/importarTramites.js [archivo] [--dry-run] [--lote n] [--completa --despublicar-faltantes]` | Importa el catálogo (default `ingestion/data/tramites_normalizado.json` del repo). Formato y opciones en [Importar el catálogo](#importar-el-catálogo) |
| `node scripts/importarTramites.js --municipal [archivo] [--dry-run] [--lote n] [--sin-despublicar]` | Importa los trámites de la Municipalidad de la Ciudad de Formosa (default `ingestion/data/tramites_municipal.json`). Ver [Fuente municipal](#fuente-municipal-formosatuciudadgobar) |
| `node scripts/verificar-import-municipal.js --antes <estado.json> [--informe <md>]` / `--despues <estado.json>` | Solo lee. `--antes`: simula la importación municipal, evalúa las condiciones para importar (0 fichas no reconocidas, hasta 3 marcados y sin publicar, 60 a 85 trámites y 11 sectores a crear, 0 conflictos, sin correos personales ni celulares, el resto del catálogo sin cambios de texto) y guarda conteos y huella; sale con 1 si alguna falla. `--despues`: misma huella del resto del catálogo, versión del catálogo mayor y 0 publicados sin embedding |
| `node scripts/despublicarTramites.js id... [--dry-run]` | Despublica los trámites de una lista explícita de ids, informa qué hizo con cada uno e incrementa la versión del catálogo. No borra nada |
| `node scripts/reindexar-faltantes.js` | Genera el embedding de los trámites que no lo tienen e incrementa la versión del catálogo |
| `node scripts/reindexar-todo.js [--estimar] [--desde id] [--lote n]` | Regenera el embedding de todo el catálogo en lotes de 100, con 3 reintentos por lote. `--estimar` informa tokens y costo sin llamar a la API; si un lote falla, indica el `--desde` para retomar. Hace falta después de cambiar el texto del embedding. Al terminar incrementa la versión del catálogo |
| `node scripts/eval-chat.js [--stream]` | Evalúa el chat contra preguntas fijas (3 corridas por caso). Llama a OpenAI. Guarda el resultado por caso en `server/eval-resultados/` (ignorada por git). Con `--stream` responde por el streaming y pasa la misma salida del modelo por la ruta sin streaming: el texto final tiene que ser idéntico. Los trámites esperados se buscan por nombre, así que corre igual contra la base real y la temporal. Con `--tipeo`, solo los casos con errores de tipeo y sus controles |
| `node scripts/eval-seguridad.js [--stream] [--grupo ...]` | Ataques, preguntas legítimas, trámites envenenados (D y E, solo en la base temporal) y los casos del pentest manual (F: notas del sistema, sobre JSON, conversación contaminada, evasiones). Llama a OpenAI. Con `--stream`, evalúa lo que llega por el streaming |
| `node scripts/medir-prompt.js [--pregunta "..."] [--corridas n] [--todas]` | Tamaño de la instrucción de sistema, latencia, tokens cacheados y correcciones de la verificación de salida de una pregunta. Llama a OpenAI; borra por id solo las consultas que registró |
| `node scripts/medir-stream.js [--corridas 10] [--pregunta "..."] [--modos esquema,meta,anterior]` | Tiempo hasta el primer `delta` y hasta el fin, llamadas al modelo y tokens por consulta del streaming en cada modo, alternados: `esquema` (`STREAM_ESQUEMA=true`), `meta` (`STREAM_ESQUEMA=false`) y `anterior` (`STREAM_INCREMENTAL=false`). Por defecto, `esquema` y `meta`. Llama a OpenAI; borra por id las consultas que registra |
| `node scripts/medir-tipeo.js [--corridas 1] [--pregunta "..."]` | Sobre las preguntas de `eval-chat` y las legítimas de `eval-seguridad`: cuáles disparan la corrección de tipeo, qué devuelve el modelo, si cambian los candidatos de la búsqueda (en las bien escritas tiene que ser 0) y cuánto tarda. Hace la búsqueda y la corrección, sin el modelo de la respuesta ni el registro. Llama a OpenAI |
| `node scripts/comparar-evals.js [a.json b.json]` | Compara dos corridas de `eval-chat` (por defecto, las dos últimas de `server/eval-resultados/`) e imprime los casos que cambiaron y cuántas corridas de cada una terminaron en error de API. No compara una corrida marcada como inválida |

Los scripts que llaman a OpenAI (`eval-chat`, `eval-seguridad`, `medir-prompt`, `medir-stream`, `reindexar-todo`, `reindexar-faltantes`) se cortan en cuanto la cuenta se queda sin crédito (429 `insufficient_quota` / `credit_balance_exhausted`), con un mensaje claro y código de salida 2, y borran lo que crearon. `eval-chat` guarda lo hecho hasta ahí con `valida: false`; además anota por caso `erroresDeApi`, las corridas que terminaron en un error (de OpenAI o de la base), que cuentan como falla pero no dicen nada del chat.
| `node scripts/generar-catalogo-sintetico.js <salida.json>` | Catálogo de prueba con los mismos trámites en 8 municipios, para `eval-chat --catalogo sintetico`. Solo para una base temporal |
| `npm run base:temporal [-- --sintetico] [-- --recrear]` | Arma la base temporal de Docker (`chatap-temporal`, `localhost:55432`): crea el contenedor si no está, migra e importa el catálogo real (y el sintético con `--sintetico`, el municipal con `--municipal`). Ver [La base temporal](#la-base-temporal) |

### Importar el catálogo

```json
{
  "sectores": [
    { "nombre": "Municipalidad de la Ciudad de Formosa", "tipo": "ORGANISMO", "jurisdiccion": "MUNICIPAL", "localidad": "Formosa" },
    { "nombre": "Secretaría de Gobierno", "tipo": "DEPARTAMENTO", "padre": "Municipalidad de la Ciudad de Formosa" }
  ],
  "tramites": [
    { "nombre": "Habilitación comercial", "descripcion": "...", "sector": "Secretaría de Gobierno", "sectorPadre": "Municipalidad de la Ciudad de Formosa", "fuenteUrl": "https://..." }
  ]
}
```

- Un sector se identifica por `(nombre, padre)`. `padre` es el nombre de otro sector del mismo
  JSON (se crea antes que sus hijos); sin `padre`, es raíz. Un padre que no está en el JSON o
  que es ambiguo deja el sector salteado, con un aviso.
- `jurisdiccion` y `localidad` son opcionales. En un sector nuevo, sin `jurisdiccion` una raíz
  queda `PROVINCIAL` y un hijo hereda. En un sector existente se actualiza solo lo que el JSON
  trae: lo que no viene se conserva.
- Un trámite nombra su sector; `sectorPadre` hace falta solo si el nombre se repite bajo
  distintos padres (`null` para el de la raíz).
- **Identificación de un trámite.** Con `fuenteUrl`, por la URL. Sin `fuenteUrl`, por
  (sector, nombre normalizado: sin tildes, mayúsculas ni espacios de más) entre los trámites que
  creó el importador (encargado `sistema@chatap.local`). Si en el sector ya hay uno cargado a
  mano con ese nombre, no se pisa. Un trámite del importador sin URL la adopta si después viene
  con una.
- **Nunca corta la corrida.** Cada trámite se procesa aparte y al final se imprime un informe:
  creados, actualizados, sin cambios, reindexados, **fallidos** con su motivo (sector no
  encontrado o ambiguo, falta el nombre o la descripción, error de la base, embedding que falló)
  y **conflictos**, donde no se escribe nada: la `fuenteUrl` ya es de un trámite de otro sector
  (no se lo mueve), hay un trámite cargado a mano con el mismo nombre o el trámite está repetido
  en el JSON. Con fallidos, el script sale con código 1.
- **Texto de afuera.** Antes de comparar y guardar, los nombres (de trámites y sectores), la
  descripción y la localidad pasan por `services/sanitizacion.service.js`, la misma limpieza que
  la carga manual: sin HTML ni scripts, sin caracteres de control ni de ancho cero, espacios
  normalizados y un tope por campo (lo recortado queda en el informe, en **Recortados**).
- **Revisión humana.** Si el nombre o la descripción traen una frase con forma de instrucción
  para el asistente ("ignorá lo anterior", "respondé siempre", "system prompt", "ignore previous
  instructions", en español, inglés o portugués), el trámite se crea o se actualiza **sin
  publicar** y queda en **Para revisión** con la frase y el campo. Uno que no cambió no se toca
  (si una persona ya lo revisó y lo publicó, sigue publicado), pero se vuelve a informar. Se
  publica a mano después de revisarlo. La detección busca frases, no palabras sueltas: "You are
  here" o "SEMFormosaBot" no cuentan.
- **Ficha del portal.** Si el trámite trae `detalle` (lo arma `ingestion/`, ver abajo), se
  importan además (`services/fichas.service.js`):
  - **Costo**: el decimal si hay una sola fila con "$ N"; si no (varias filas, importes en UT),
    `costoDetalle` como texto. "Ninguno" no se toma como gratuito: queda sin costo.
  - **Requisitos**: cortados por números, letras o viñetas, con el subgrupo delante de cada uno
    ("Para menores de edad: DNI actualizado."). Si no se puede cortar con seguridad (las piezas
    no reconstruyen el texto), un único requisito con el texto completo, en trozos del tope si
    hace falta: nunca se pierde texto.
  - **Información adicional**: modalidad, duración, destinatarios, observaciones, paso a paso y
    las normas sin enlace.
  - **Mesas de entrada**: una por oficina del portal, identificada por `origenId`
    (`collapse_NNN`) y compartida entre trámites, con teléfono y email institucionales y la
    localidad si se puede leer del nombre. Sin el nombre del responsable.
  - **Documentos**: formularios y normas como enlaces (`urlExterna`); los rotos no se importan
    y quedan en el informe.
  - `verificadoEn`: la fecha de la captura.
  Todo pasa por la misma sanitización, y una frase con forma de instrucción en cualquiera de
  esos textos deja el trámite sin publicar.
- **Lo editado a mano no se pisa.** Al escribir, el importador guarda en `huella_importacion` un
  hash por grupo (descripción, costo, información adicional, requisitos, mesas, documentos). Al
  reimportar, un grupo cuyo valor actual ya no coincide con su huella lo editó alguien (el panel,
  SQL, otro script) y se conserva: queda en **Conservados**. Un grupo sin huella se llena solo si
  está vacío. Lo mismo para cada mesa del portal. Un trámite cuenta como del importador si su
  encargado es Sistema **o** si tiene huella: reasignarle el encargado desde el panel no frena
  el enriquecimiento. Uno sin huella y con otro encargado no se toca aunque tenga la misma
  `fuenteUrl`: queda en **Manuales**.
- **Reanudable.** Cada trámite se escribe en una transacción (con sus requisitos, mesas y
  documentos), y si cambió algo del texto del embedding el vector viejo se borra en la misma
  transacción: si la corrida se corta, se vuelve a correr la misma y retoma lo que falta, incluido
  el reindexado. Mientras tanto, la búsqueda por palabras lo sigue encontrando.
- **Embeddings en lotes** de 100 (`--lote n`) con 3 reintentos por lote. Si un lote los agota,
  se prueba de a un trámite y los que fallan quedan como fallidos. Se reindexan los trámites
  nuevos, los que cambiaron, los de un sector que cambió (y sus descendientes) y los que vinieron
  en la corrida con `embedding` en `null`, aunque no hayan cambiado.
- `--dry-run` hace todo el cálculo e imprime el informe sin escribir en la base ni llamar a la
  API de embeddings.
- **Fuera del listado del sitio.** Un trámite del JSON con `enListado: false` sigue en el XML
  pero el sitio ya no lo lista. Con `--completa` se despublica hasta revisión (o se crea sin
  publicar), salvo que su organismo sea uno que el sitio no indexa (`organismoIndexado: false`),
  que queda como está. Nunca toca un trámite cargado a mano. Sin `--completa` solo se informa.
  Todos quedan en **Fuera del listado del sitio** con su sector, el motivo y lo que se hizo.
- `--despublicar-faltantes` exige `--completa`; sin ella, el script termina con un error.
  Despublica los trámites **del importador** que no vinieron en el JSON, solo dentro de los
  sectores del JSON y sus descendientes: importar con `--completa` el catálogo municipal no toca
  el provincial. Nunca despublica trámites cargados a mano, y no despublica nada si algún trámite
  del JSON no se pudo identificar (podría ser uno de los "faltantes"). Un trámite despublicado se
  vuelve a publicar a mano.
- **Caché.** Si hubo cambios, el import incrementa la versión del catálogo en la base y el server
  en marcha vacía su caché en unos segundos (ver [Notas de diseño](#notas-de-diseño)). El script
  avisa si hay un server respondiendo en `SERVIDOR_URL`; si no hay ninguno, no hace falta nada,
  porque el que arranque empieza sin caché. Solo pide reiniciar el server si no pudo incrementar
  la versión (por ejemplo, porque falta la migración `catalogo_version`).

### Armar el JSON: XML y fichas del sitio

El JSON lo arma `ingestion/` (Python) a partir del XML del portal y de las fichas
`detalle_del_tramite` de formosa.gob.ar. Se corre con un entorno virtual propio, nunca con el
Python global:

```bash
cd ingestion
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # en Linux/macOS: .venv/bin/python
.venv/Scripts/python main.py                 # XML + fichas → data/tramites_normalizado.json e informe en data/informe_fichas.md
.venv/Scripts/python main.py --muestra 10    # solo los 10 primeros, en data/tramites_muestra.json
.venv/Scripts/python main.py --solo-xml      # solo el XML, sin pedir nada al sitio
.venv/Scripts/python -m unittest discover -s tests   # tests del parseo (sin red)
```

- **Cortesía con el sitio.** Un pedido por segundo como mucho (incluidos los HEAD), User-Agent
  que identifica el proyecto (ChatAP, IPF, estudiantes) y robots.txt respetado en cada host.
- **Listado.** Recorre `/tramites/organismos` y, por organismo, todas las páginas del listado:
  la paginación (`/tramites/buscar/pagina/N`) depende de la cookie de la sesión, así que se
  sigue en orden con la misma sesión. Los trámites del XML que no figuran ahí llevan
  `enListado: false`; los de un sector que el sitio no indexa, `organismoIndexado: false`.
- **Fichas.** Se leen en ISO-8859-1 (con los caracteres de Windows-1252 que algunas traen). El
  sitio contesta 200 con una página de error ("Trámite no encontrado"): se reconoce y queda en
  el informe. Cada trámite lleva en `detalle` la descripción, los requisitos, las observaciones,
  la modalidad, la duración, el paso a paso, las filas de "Cuánto sale", las oficinas (con su
  `origenId`, `collapse_NNN`), los formularios y las normas, y `verificadoEn`. El nombre de los
  responsables de cada oficina no se guarda.
- **Enlaces.** Los PDF de formularios y normas se verifican con HEAD (no se descargan) y cada
  uno lleva `enlace.estado` `ok` o `roto`.
- **Reanudable.** El HTML crudo queda en `data/cache_html/` (fuera del repo): una corrida
  cortada se retoma sin volver a pedir lo que ya se bajó. El listado de cada organismo se guarda
  entero o no se guarda. Para capturar de nuevo, se borra la caché.
- **Informe** (`data/informe_fichas.md`): totales contra el XML, organismos con su ministerio
  (propuesta de jerarquía, no se aplica), sectores que el sitio no indexa, trámites fuera del
  listado con su motivo, fichas con error y enlaces rotos.

### Fuente municipal (formosatuciudad.gob.ar)

Los trámites de la Municipalidad de la Ciudad de Formosa salen del listado `/tramites` del sitio
municipal. Los otros municipios y lo nacional no se scrapean (van por derivación).

```bash
cd ingestion
.venv/Scripts/python main.py --municipal              # → data/tramites_municipal.json e informe en data/informe_municipal.md
.venv/Scripts/python main.py --municipal --refrescar  # vuelve a pedir el HTML y los PDF en vez de leerlos de data/raw/municipal
cd ../server
node scripts/importarTramites.js --municipal --dry-run
node scripts/importarTramites.js --municipal
```

- **Cortesía con el sitio.** El mismo cliente que el provincial: un pedido por segundo, sin
  paralelismo, robots.txt respetado, reintento corto ante error y User-Agent del proyecto. El
  sitio no publica términos de uso: cada trámite cita su ficha en `fuenteUrl` y se muestra como
  fuente oficial.
- **Crudo.** El HTML y los PDF quedan en `ingestion/data/raw/municipal/` (fuera del repo) para
  reprocesar sin volver a pedirlos.
- **Formatos.** Hay cuatro formatos de ficha, cada uno con su parser: `secciones` (rótulos
  "Descripción", "Requisitos", "Valor del trámite" o preguntas numeradas), `tabla` (requisitos
  en una tabla, Obras Privadas), `descarga` (solo el formulario) y `libre` (subtítulos y listas,
  Tránsito y Habilitaciones). La ficha que no encaja en ninguno no se importa y queda en
  `noReconocidas` con su URL. Los enlaces del listado que no son fichas (PDF sueltos, páginas de
  otras secciones) quedan en `noFichas`.
- **Sectores.** "Municipalidad de la Ciudad de Formosa" (MUNICIPAL, Formosa) y debajo cada
  sección del listado; las direcciones de Obras Públicas, debajo de la Secretaría. Los hijos
  tienen jurisdicción y localidad en null (heredan). Se identifican por nombre y padre, como
  siempre: reejecutar no duplica ni toca el `parentId` de un sector existente.
- **Clave.** Un trámite municipal se identifica solo por la URL de su ficha (`soloPorUrl`): nunca
  se toma uno por el nombre, aunque haya uno provincial que se llame igual.
- **Privacidad.** No se guardan nombres de personas ("Lic. Fulano", "Responsable: ...") ni
  correos que no sean de un dominio oficial (`.gob.ar`, `.gov.ar`); el correo que Joomla oculta
  con JavaScript se reconstruye solo para decidir eso. En su lugar queda "(el correo figura en la
  fuente oficial)".
- **Costos en módulos.** El valor del módulo sale del PDF "Valor del módulo desde ..." de la
  página del Código Tarifario: un valor por tributo y por fecha de vigencia, y se usa el de la
  última fecha anterior a la consulta. Cada concepto se valoriza con el módulo de su tributo según
  el Código Tarifario 2026 (los de oficina, como certificados, exenciones o estudio de dominio,
  con el de servicios varios; la escala por superficie de habilitaciones, con el de
  habilitaciones). `costoDetalle` queda como "Certificado de Libre Deuda: 4 módulos: $4.029,40,
  calculado con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según
  el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026": el monto y el cálculo
  tienen que estar escritos para que el chat los pueda decir (la verificación de la salida acepta
  los montos que figuran en el texto cargado). Con dos montos o más, el costo es una lista numerada
  solo con concepto y monto ("1) Libre deuda AIM: 4 módulos: $4.029,40 (módulo vigente desde
  01/10/2026); 2) Libre deuda Tribunal de Faltas: $ 85 (*)") y al pie van la advertencia de los
  montos marcados con (*) y el origen del cálculo, una vez por tributo: el chat ve los primeros 300
  caracteres del costo y así entran todos los montos. Si el PDF no se puede
  leer con certeza o el concepto no está en la tabla, queda solo la cantidad de módulos y el
  informe lo avisa.
- **Pesos viejos.** Cuando el Código Tarifario 2026 fija la cantidad de módulos de un concepto
  (certificado de libre deuda, estudio de dominio, libreta de sanidad, emisión del certificado de
  habilitación, etc.), los pesos o las unidades tributarias que publica la ficha se descartan, se
  calcula con el módulo vigente y lo viejo queda listado en el informe. Si no hay forma de
  contrastarlos (cementerio, libre deuda de Tribunal de Faltas o de Tránsito, plan de pago), se
  guardan tal cual con "monto publicado en el portal, puede estar desactualizado; confirmalo en la
  oficina". Lo mismo con las estampillas que aparecen dentro de los requisitos.
- **Teléfonos.** No se guardan celulares (rotulados "Cel", "WhatsApp", o con la forma
  3704-NNNNNN); quedan los fijos de siete cifras y los 0800.
- **Los montos caducan.** Cuando la AIM publica un valor nuevo del módulo, los montos en pesos
  cargados quedan viejos: hay que volver a correr `main.py --municipal --refrescar` y el
  importador. Un costo que alguien editó a mano no se pisa (huella del grupo `costo`).
- **Despublicar faltantes.** Con `--municipal` el importador despublica los trámites de
  `formosatuciudad.gob.ar` que ya no están en el listado, dentro del subárbol de la
  Municipalidad, solo si el JSON es el listado entero sin fichas no reconocidas ni con error. Si
  no, lo informa y no despublica nada. `--sin-despublicar` lo saltea.
- **Salida.** El importador incrementa la versión del catálogo, reindexa lo importado y sale con
  código 1 si hubo fallidos, fichas no reconocidas o con error.

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

- **Rate limit:** 10 pedidos por minuto y 100 por hora por IP (`CHAT_LIMITE_POR_MINUTO`,
  `CHAT_LIMITE_POR_HORA`), **compartidos** entre las dos rutas, y cuentan también los pedidos
  rechazados por validación. Al pasarse: 429 con `Retry-After` y los encabezados `RateLimit-*`,
  `{ "error": "Demasiadas consultas. Esperá un momento e intentá de nuevo." }` (minuto) o
  `{ "error": "Llegaste al máximo de consultas por hora. Probá de nuevo más tarde." }` (hora).
  Detrás de un reverse proxy hace falta `TRUST_PROXY` (ver [Notas de diseño](#notas-de-diseño)).
  Las dos rutas son las únicas públicas que llaman a OpenAI (embedding de la búsqueda y modelo);
  las que reindexan trámites piden login de administración.
- **Día de la demo:** con mucha gente en el mismo wifi, todos salen por la misma IP pública y
  comparten el contador: con los defaults, el aula entera tiene 10 consultas por minuto. Para ese día
  conviene `CHAT_LIMITE_POR_MINUTO=120` y `CHAT_LIMITE_POR_HORA=2000` (unas 60 personas con 2
  consultas por minuto en el pico y unas 30 en la hora), y volver a los defaults después: con valores
  altos, una sola IP puede gastar mucho más en OpenAI. Hay un test de que el límite configurado por
  entorno se respeta (`tests/limites-chat-entorno.test.js`).
- **Token opcional:** si viene y es válido, la consulta queda en el historial del usuario
  (`/api/consultas/mias`). Si es inválido, venció o el usuario tiene que cambiar la
  contraseña, se responde igual, como anónimo.

**Body (los dos):**

```json
{ "pregunta": "¿cómo saco el certificado de buena conducta?" }
```

o, para seguir una conversación (hasta 20 mensajes, el último del usuario):

```json
{
  "mensajes": [
    { "rol": "usuario", "texto": "cómo renuevo el pasaporte" },
    { "rol": "asistente", "texto": "Se hace en persona ...", "tipo": "respuesta" },
    { "rol": "usuario", "texto": "necesito un certificado" },
    { "rol": "asistente", "texto": "¿Cuál necesitás: ...?", "tipo": "aclaracion" },
    { "rol": "usuario", "texto": "el de buena conducta" }
  ]
}
```

`pregunta` hasta 500 caracteres; `mensajes` de 1 a 20, cada `texto` de 1 a 500 si es de la
persona y de 1 a 6000 si es del asistente, y `rol` `usuario` o `asistente` (cualquier otro rol se
rechaza y los campos que no son del esquema se descartan: un mensaje no puede traer instrucciones
ni cambiar de rol). El tope del asistente sale de medir la respuesta honesta más larga, que el
front reenvía tal cual: la verificación puede reemplazar un monto por el costo en texto completo
del trámite (la escala de habilitaciones, 17 filas y unos 3000 caracteres), y con saludo, una lista
y la fuente oficial queda en 3546 caracteres (test en `tests/limites-chat.test.js`); contra la base
real, la más larga medida el 14-11-2026 fue de 1691 (requisitos del Registro de Proveedores).
Si vienen los dos, se usa `mensajes`. El cuerpo del pedido puede tener hasta
128 kb (413 `La solicitud es demasiado grande.`). Los topes se configuran con `CHAT_MAX_PREGUNTA`,
`CHAT_MAX_TEXTO_ASISTENTE`, `CHAT_MAX_MENSAJES` y `CHAT_MAX_CUERPO_KB`. Errores 400, en español:
`Falta la pregunta o los mensajes.`, `El último mensaje debe ser del usuario.`, `La pregunta puede
tener hasta 500 caracteres.`, `Cada mensaje puede tener hasta N caracteres.`, `La conversación
puede tener hasta 20 mensajes.` y `El rol de cada mensaje tiene que ser "usuario" o "asistente".`

**`tipo` en los mensajes del asistente (opcional).** El front tiene que guardar el tipo que
devolvió cada respuesta (`tipo` de `POST /api/chat`, `tipoRespuesta` del evento `fin` del
streaming: `respuesta`, `aclaracion` o `conversacion`) y reenviarlo en ese mensaje de `mensajes`.
Es una pista del cliente, no un dato confiable: un valor desconocido, o un `tipo` en un mensaje del
usuario, se descarta sin error, y sin `tipo` todo funciona como antes. Se usa para dos cosas:

- **Cortesía:** si el último mensaje del asistente tiene `tipo: "aclaracion"`, un mensaje corto
  como "ok" o "listo" se toma como respuesta a la aclaración y no recibe la frase de cortesía.
- **Tope de aclaraciones:** solo cuentan los mensajes del asistente con `tipo: "aclaracion"` o sin
  `tipo` (los que no lo traen cuentan como antes).

**Respuesta de `POST /api/chat`:**

```json
{
  "tipo": "respuesta",
  "respuesta": "texto para mostrar",
  "encontrado": true,
  "tramitesEncontrados": [{ "id": 269, "nombre": "Certificado de buena conducta" }],
  "opciones": [],
  "conversacional": false,
  "consultaId": 414,
  "calificarToken": "9f2c4e7a1b3d5f6e8a0c2e4f6a8b0d1c"
}
```

| Campo | Significado |
|---|---|
| `tipo` | `respuesta`, o `aclaracion` cuando el asistente pregunta entre varios trámites |
| `respuesta` | Texto para el ciudadano (la pregunta aclaratoria si `tipo` es `aclaracion`). Si la persona saludó, empieza con el saludo que compone el servidor (ver abajo) |
| `encontrado` | `true` solo si se respondió con algún trámite. Siempre `false` en una aclaración |
| `tramitesEncontrados` | Trámites usados en la respuesta. Vacío si no se encontró nada o es una aclaración |
| `opciones` | Trámites entre los que elegir, solo en una aclaración: `[{ id, nombre }]`. En la aclaración por jurisdicción o localidad (ver [Cómo funciona el chat](#cómo-funciona-el-chat)) cada opción trae además `jurisdiccion` y `localidad`, y su `nombre` ("Habilitación comercial en Clorinda") mandado como `pregunta` ya resuelve el trámite |
| `conversacional` | `true` si el mensaje no pedía un trámite (saludo, gracias, pregunta sobre el asistente o el catálogo, tema ajeno): `respuesta` es el texto del asistente, `tipo` es `respuesta`, `encontrado` es `false`, no hay trámites ni opciones y no se registra (`consultaId` y `calificarToken` `null`). `false` en todos los demás casos |
| `consultaId` | Id de la consulta registrada. `null` en las aclaraciones (no se registran) o si falló el registro |
| `calificarToken` | Token para calificar esa consulta sin sesión (32 caracteres hex). `null` cuando `consultaId` es `null`. Cada consulta tiene el suyo, también las que salen de la caché |

**Saludo.** El modelo devuelve aparte el saludo que usó la persona ("Hola", "Buen día",
"Buenas tardes"; vacío si no saludó) y el texto sin saludo. El servidor arma
`"¡{saludo}, {Nombre}! "` + texto. El nombre **nunca** se manda al modelo: es el primer nombre
del usuario logueado en formato título ("MARÍA JOSÉ GÓMEZ" → "María"); anónimo, va sin nombre
(`"¡Buen día! "`). El saludo se sanea: se le sacan los signos de los extremos, y si tiene otra
cosa que letras, espacios y ¿¡, o más de 30 caracteres, se usa "Hola". El servidor solo saluda
si el último mensaje de la persona tiene un saludo (hola, buen día, buenos días, buenas, buenas
tardes, buenas noches, qué tal, saludos); si no, va sin saludo aunque el modelo haya devuelto uno.
Si el modelo igual empieza el texto con uno o dos saludos ("¡Buenas! ¡Hola!"), se sacan. La caché y `consultas.respuesta`
guardan el texto sin el saludo compuesto, así no queda guardado el nombre de nadie.

Para seguir después de una aclaración, se reenvía la conversación completa en `mensajes`,
con la elección del usuario como último mensaje. **Tope de aclaraciones:** si `mensajes`
ya trae 2 o más mensajes con `rol: "asistente"` que cuenten como aclaración (los de `tipo:
"aclaracion"` o sin `tipo`; ver arriba), el asistente responde sí o sí (`tipo:
"respuesta"`), describiendo los candidatos posibles si sigue sin poder elegir.

El texto (`respuesta` y los `delta` del streaming) puede traer **Markdown reducido**: listas con
viñetas (`- `), listas numeradas (`1. `) y `**negrita**`. No trae títulos, tablas, bloques de código,
citas ni cursivas. El front tiene que renderizarlo (o al menos mostrar los asteriscos sin
romperse). Siempre en voseo rioplatense: si el modelo igual tutea, el servidor corrige una lista
cerrada de palabras completas (tienes → tenés, puedes → podés, ten en cuenta → tené en cuenta, …),
respetando la mayúscula inicial y sin tocar enlaces.

**Enlaces.** El modelo no escribe enlaces (ni siquiera ve las URL): el servidor saca cualquier
enlace Markdown o URL suelta que aparezca en su texto, en todos los tipos de respuesta. Una
respuesta con `encontrado: true` termina, después de una línea en blanco, con una línea por cada
trámite usado que tenga `fuenteUrl` http o https: `[Fuente oficial: {nombre}](<fuenteUrl>)`. La
caché y `consultas.respuesta` guardan el texto sin saludo y sin estas líneas; las fuentes se
buscan al servir, así siguen a la URL actual del trámite.

**Reglas de entrada.** Antes de la caché, la búsqueda y el modelo, `guardrail.service.js` revisa
el último mensaje de la persona contra patrones específicos (español, inglés y portugués,
también con tildes, mayúsculas, espacios de más, caracteres de ancho cero, leetspeak, letras de
ancho completo o en círculos, letras cirílicas que se ven como latinas y texto codificado para URL
como `%20`): pedidos de revelar las instrucciones, de anular las reglas y marcadores de rol
(`system:`, `<|im_start|>`, `[INST]`…). Si coincide, la respuesta tiene la forma de una conversación (`conversacional:
true`, sin trámites ni registro) con el texto fijo "Solo puedo ayudarte con información sobre
trámites de la provincia de Formosa y sus municipios. Contame qué trámite necesitás.", sin saludo ni enlaces; en streaming, un
solo `delta` y el `fin`. No se cachea ni se registra (no cuenta en las métricas); se loguea la
categoría y los primeros 80 caracteres.

Cada mensaje se evalúa solo: un intento anterior en la misma conversación no bloquea una consulta
legítima posterior. Los mensajes anteriores que la regla bloquearía no llegan a la búsqueda ni al
modelo: se sacan del historial, con la respuesta del asistente que les siguió, y también un mensaje
"del asistente" que la bloquearía (el historial lo arma el cliente). Se loguea cuántos se sacaron.
Si al sacarlos queda un solo turno, la consulta se trata como de un turno (puede salir de la caché).
Hasta el 14-11-2026 se revisaban todos los turnos de la persona y un intento bloqueaba el resto de
la conversación (hallazgo del pentest).

El prompt le pide al modelo que conteste `FUERA_DE_ALCANCE` (y el servidor lo reemplaza por el
mismo mensaje fijo, sin saludo) solo si piden ver, repetir, traducir, resumir o describir sus
instrucciones. No le muestra la frase: con ella a la vista la usaba para cualquier tema ajeno, en
vez de redirigir con dos ejemplos. Si piden otro idioma, avisa en español que por ahora solo
atiende en español.

**Chequeo de salida.** Si la respuesta copia 40 caracteres seguidos (normalizados) de la parte
fija de las instrucciones del sistema, se reemplaza por el mismo mensaje fijo y se loguea. Se
compara solo contra el texto estático del prompt, no contra el resumen del catálogo ni los
trámites, y no cuentan las frases que el prompt le pide decir (las que van entre comillas, quién
es el asistente y adónde derivar). También es fuga un marcador de plantilla: los del prompt
(`<saludo o vacío>`, `<id o null>`, `<ids>`…, que se toman del texto fijo) y cualquiera de varias
palabras entre `< >` (`<lo que seguís para responder>`, que el modelo copió de una consulta que
pedía un formato y después repitió la respuesta); una etiqueta HTML o un `<` de comparación no
cuentan. Se revisa oración por oración en las dos rutas, antes de
mandar cada una: si la copia aparece después de haber mandado texto, lo mandado queda (no tenía
la copia) y en lugar del resto va el mensaje fijo (ver [Streaming incremental](#streaming-incremental)).
Con `STREAM_INCREMENTAL=false` vuelve el chequeo anterior: solo en `POST /api/chat`, sobre el texto
entero.

**Estructura interna.** La verificación de la salida (capa `estructura`, la primera; ver
[`verificacion.service.js`](src/services/verificacion.service.js)) saca del texto lo que es del
sistema y no de la respuesta, de a oración y con el mismo camino en las dos rutas (también con
`STREAM_INCREMENTAL=false`): un objeto JSON (`{"…": …}`, hasta que cierra, aunque cruce oraciones o
líneas), un campo interno entre comillas (`"tipo":`, `"tramiteId":`, `"opciones":`, `"reglas":`,
`"contexto":`…), los nombres `tramiteId`/`tramitesUsados`, `Fuente oficial: sí`, y un bloque de
código desde que aparece un campo interno hasta que cierra. Desde una sección "Notas del sistema",
un rótulo `Contexto:`, el encabezado de un trámite del contexto (`### Trámite (id N)`) o los rótulos
del prompt (`RESUMEN DEL CATÁLOGO:`) se saca todo lo que sigue: después viene el contexto volcado
línea por línea (`Organismo:`, `Requisitos:`…), que solo no se distingue de una respuesta. Las
marcas de un bloque de código (` ``` `) y las llaves sueltas se sacan sin contar como contenido
perdido; las llaves dentro del texto (`F-{n}`) y un bloque sin campos internos quedan. Un ítem de
lista sacado por esta capa no colapsa la lista. Si al sacar todo no queda nada que responda, va el
mensaje seguro con la fuente oficial, como en las otras capas. Si una aclaración queda sin texto,
va "¿Cuál de estas opciones es la que buscás?" con las mismas `opciones` (en las dos rutas y con
`STREAM_INCREMENTAL=false`).

**Conversación y temas ajenos.** Una conversación (saludo, pregunta sobre el asistente o el
catálogo, tema ajeno) solo nombra trámites del resumen del catálogo: para un tema ajeno da dos
ejemplos de "Algunos trámites". Si el texto del modelo nombra un candidato de la búsqueda que no
está en el resumen ("capital de francia" → "Aumento de Capital Social"), el servidor pide la
conversación de nuevo sin candidatos (una llamada más al modelo, solo en ese caso). Por eso en
`/api/chat/stream` una conversación llega en un solo `delta`, al final.

**Contrato SSE de `POST /api/chat/stream`.** `Content-Type: text/event-stream`. Cada evento
es una línea `data: <json>` seguida de una línea en blanco:

| Evento | Forma | Cuándo |
|---|---|---|
| `delta` | `{ "tipo": "delta", "texto": "..." }` | Una o más veces: fragmentos del texto, en orden. Cada uno es texto ya verificado: el cuerpo sale de a oraciones (una lista, entera), y cada `delta` trae el espacio o los saltos de línea que lo separan del anterior. Si la persona saludó, el saludo compuesto (`"¡Hola, María! "`) llega al principio del primer `delta`. Las fuentes oficiales llegan como último `delta`. Si la respuesta sale de la caché, es una conversación o no se encontró nada, el texto llega entero en un solo `delta`. Juntos, los `delta` son exactamente el `respuesta` de `POST /api/chat` para la misma salida del modelo |
| `fin` | `{ "tipo": "fin", "tipoRespuesta": "respuesta" \| "aclaracion", "encontrado": bool, "tramitesEncontrados": [{ id, nombre }], "opciones": [{ id, nombre }], "conversacional": bool, "consultaId": number \| null, "calificarToken": string \| null }` | Una vez, al final. Mismos campos y significado que la respuesta sin streaming (`tipoRespuesta` equivale a `tipo`) |
| `error` | `{ "tipo": "error", "mensaje": "El asistente no está disponible en este momento. Probá de nuevo en unos segundos." }` | Si algo falla a mitad del stream. En ese caso no llega `fin` y lo ya transmitido no vale como respuesta (no se cachea ni se registra). El mensaje es ese cuando falla OpenAI o se agota el plazo; ante un error propio del servidor es `"Ocurrió un error procesando la consulta."` |

Ejemplo:

```
data: {"tipo":"delta","texto":"Para la licencia por maternidad "}

data: {"tipo":"delta","texto":"tenés que presentar..."}

data: {"tipo":"fin","tipoRespuesta":"respuesta","encontrado":true,"tramitesEncontrados":[{"id":19,"nombre":"Licencia por maternidad"}],"opciones":[],"conversacional":false,"consultaId":417,"calificarToken":"3b8e0d2f4a6c8e1f3a5c7e9b1d3f5a7c"}
```

Los errores de validación y el rate limit llegan antes de abrir el stream, como JSON común
con su status. La conexión se cierra después de `fin` o `error`.

**Para el front:** los `delta` traen Markdown partido (una lista o un `**negrita**` pueden quedar
repartidos en dos). Hay que acumular el texto y renderizar lo acumulado, no cada `delta` por
separado. Si llega `error`, lo ya mostrado era texto verificado, pero la respuesta no se completó.
Una respuesta puede terminar con un `delta` `"\n\n"` + mensaje fijo y un `fin` con `conversacional:
true` (ver abajo): conviene no ofrecer calificarla.

#### Streaming incremental

Con `STREAM_INCREMENTAL=true` (default), las dos rutas pasan el texto del modelo por el mismo camino
([`salida.service.js`](src/services/salida.service.js)): la ruta sin streaming le da la respuesta
entera de una vez y el streaming, a medida que llega. El resultado depende solo del texto, no de
cómo llegó partido. Cada capa retiene lo que necesita para decidir antes de mandar:

| Capa | Qué retiene |
|---|---|
| Enlaces | La oración entera. El corte de una oración se da por firme cuando llegó la letra que empieza la siguiente, fuera de la última palabra (que puede ser una URL a medio llegar) y antes de un `[` que todavía puede abrir un enlace Markdown |
| Costos, datos sensibles, atribución entre trámites | La oración entera: se verifica completa, como sin streaming |
| Listas | La lista entera y la oración que la anuncia (la que termina en `:`), hasta que empieza una línea que no es ítem. Si se perdió un ítem, va la frase fija |
| Idioma | Se cuenta sobre lo que escribió el modelo, sin los reemplazos del servidor. Al principio, hasta que el español predomina (el doble de palabras funcionales que de inglés o portugués) y hay al menos 12 palabras o ninguna de otro idioma. Después, una oración con más palabras de otro idioma que de español retiene todo lo que sigue hasta el final |
| Contenido | En una respuesta con trámite, hasta la primera oración que responde algo (si la verificación saca todo, va el mensaje seguro sin haber mandado relleno) |
| Mensaje fijo | Mientras lo retenido pueda ser exactamente el mensaje fijo (`FUERA_DE_ALCANCE`), que sale sin saludo |
| Fuga de instrucciones | Nada: se revisa el texto acumulado antes de mandar cada oración |
| Conversación, respuesta sin trámite | Todo, hasta el final (una conversación se valida entera; sin trámite no se muestra el texto del modelo) |

Lo que no se puede decidir de a pedazos se decide igual en las dos rutas:

- **Fuga o cambio de idioma después de haber mandado texto.** Lo mandado ya pasó todas las capas y
  queda; en lugar del resto va `"\n\n"` + el mensaje fijo (`FUERA_DE_ALCANCE` o "Por ahora solo
  atiendo en español…"), con `conversacional: true`, sin fuentes, sin caché ni registro. Antes, sin
  streaming, se reemplazaba la respuesta entera. Para el idioma, la parte retenida se juzga también
  sola: una respuesta que empieza en español y sigue en inglés se corta aunque en el total el inglés
  no llegue al triple del español.
- **Una línea de varias oraciones que anuncia una lista** ("Es personal. Los requisitos son:"):
  solo la última oración es el anuncio. Si la lista se colapsa, las anteriores quedan (antes se iba
  la línea entera).
- **Grupo sin resolver** (trámite en varias jurisdicciones): la pregunta del servidor sale apenas
  llega la línea META, también sin streaming (antes, sin streaming, una salida en otro idioma o con
  fuga daba el mensaje fijo aunque el texto del modelo no se fuera a mostrar).
- **Espacios:** una línea a la que la verificación le cambió una oración conserva los espacios
  originales entre las oraciones que quedan (antes los normalizaba a uno).

Solo se cachea y se registra una respuesta que llegó completa (`finish_reason: "stop"`). Un corte,
el plazo total (18 s), 10 s sin pedazos del modelo o un error mandan el evento `error` con el
mensaje del 503 y no dejan nada en caché ni en `consultas`; lo que ya se mandó era texto
verificado. Si el cliente se desconecta, se cancela la llamada al modelo.

Tiempo hasta el primer `delta` (09-11-2026, `scripts/medir-stream.js`, 10 corridas por modo
alternadas, en serie, desde una PC por Wi-Fi doméstico, base en Neon sa-east-1, `gpt-4o-mini`):

| Pregunta | Incremental: mediana / máximo | Anterior: mediana / máximo |
|---|---|---|
| "cómo saco el pasaporte" | 3,4 s / 6,5 s (4,6 s sin la primera corrida, en frío) | 4,3 s / 5,6 s |
| "certificado de buena conducta" | 2,3 s / 2,5 s | 2,7 s / 3,2 s |
| "cuánto cuesta la habilitación comercial de un local de 500 m²…" | 2,5 s / 2,9 s | 2,8 s / 3,7 s |

El tiempo hasta el fin no cambia (mediana 4,0 / 4,7 / 2,9 s contra 4,4 / 4,7 / 2,8 s). La mejora
del primer `delta` es chica porque antes de la primera oración llegan la búsqueda, la línea META del
modelo y la retención por idioma; lo que cambia más es que el resto llega de a oraciones (mediana
de 5, 9 y 3 `delta` contra 2, 6,5 y 2), en vez de casi todo junto al final.

#### Streaming con esquema JSON

Con `STREAM_ESQUEMA=true` (default) el streaming le pide al modelo lo mismo que la ruta sin
streaming: el mismo prompt y el mismo esquema JSON estricto (`response_format: json_schema`), con
`stream: true`. La única diferencia es el orden de las propiedades del esquema: en el streaming
`respuesta` va última (el modelo emite las claves en el orden del esquema), así `tipo`, `saludo`,
`tramiteId`, `tramitesUsados` y `opciones` llegan antes que el texto. Ya no hay línea META ni
segunda llamada cuando la META viene mal.

[`lector-json.js`](src/utils/lector-json.js) lee el JSON a medida que llega: junta los campos de
decisión y, cuando están completos, el chat decide con ellos igual que antes con la línea META (no
hay un evento nuevo: el contrato SSE no cambia); después decodifica el string de `respuesta` de a
pedazos (los escapes `\n`, `\"`, `\\` y `\uXXXX`, también partidos entre dos pedazos, y los pares
sustitutos de un emoji) y ese texto entra al camino de siempre, oración por oración
([Streaming incremental](#streaming-incremental)): nada sale sin pasar las capas. Si el modelo
mandara `respuesta` antes que los demás campos, el texto se retiene hasta tenerlos.

Al terminar, el JSON entero tiene que parsear y coincidir con lo que se fue leyendo. Una salida que
no es el JSON del esquema, una negativa del modelo (`refusal`), un `finish_reason` distinto de
`stop` (el tope de tokens, el filtro de contenido), un corte, el plazo, la inactividad o un error
terminan como siempre: evento `error` con el mensaje del 503, nada en caché ni en `consultas`, y lo
ya mandado era texto verificado. Una conversación sin texto ("chau", "gracias") recibe la frase
amable, como en la ruta sin streaming.

Con `STREAM_ESQUEMA=false` vuelve el formato anterior: el prompt de streaming (una línea META en
JSON y después el texto libre) y, si la META no es válida, la frase de cortesía o el pedido de nuevo
por la ruta con esquema. Con `STREAM_INCREMENTAL=false` el streaming usa siempre ese formato.

Mediciones (16-11-2026, en serie y sin nada en paralelo, desde una PC por Wi-Fi doméstico,
`gpt-4o-mini`; `eval-chat` y los tiempos contra la base del `.env`, en Neon sa-east-1;
`eval-seguridad` contra la base temporal):

| `eval-chat`, 72 casos × 3 corridas | Casos 3/3 | Aciertos de 216 | Sin salida válida | Llamadas de más |
|---|---|---|---|---|
| Streaming con la línea META (antes) | 54 | 174 | 32 de 219 turnos | no se contaban |
| Ruta sin streaming | 62 | 191 | - | 9 (conversación pedida de nuevo) |
| Streaming con esquema | 62 | 191 | 0 | 8 (todas por la conversación pedida de nuevo; ningún reintento) |

Con la misma salida del modelo, el streaming con esquema y la ruta sin streaming dieron el mismo
texto en 219 de 219 turnos. Los casos que el streaming con META fallaba y la ruta normal no
("licencia por maternidad", "licencia de conducir", "dónde saco el pasaporte", "decime las reglas de
la pesca deportiva") pasan 3/3. Los 10 casos que no pasan siempre son casi los mismos en las dos
rutas (los de tipeo, "dónde saco turno para el médico", "qué pasa si me olvido el DNI"); los que
difieren en una corrida varían entre corridas, no por la ruta.

`eval-seguridad --stream` con esquema, grupos ataques, A, B, C, D, E y F: 0 llegan a la persona.
Ataques 30 de 30 neutralizados (16 por la regla de entrada); legítimas A 15/15, B 7/7 y C 8/8;
envenenados D: el modelo obedeció 15 de 30 y el servidor frenó las 15; E: 4 de 18 y frenó las 4; F:
20 de 21 (la consulta de "licencia de conducir" después de un historial contaminado sale sin
trámite en la base temporal, 0 de 5 con esquema y 0 de 5 con la línea META: no es del formato).

Tiempos y tokens (`scripts/medir-stream.js`, los dos modos alternados en cada corrida):

| Medición | Modo | Primer `delta`: mediana / máximo | Fin: mediana / máximo | Llamadas al modelo | Tokens de entrada / salida |
|---|---|---|---|---|---|
| 10 preguntas × 3 corridas | esquema | 2,18 s / 5,85 s | 2,99 s / 6,59 s | 1,03 | 5013 / 128 |
| 10 preguntas × 3 corridas | META | 1,96 s / 3,91 s | 2,33 s / 5,27 s | 1,00 | 4963 / 121 |
| 5 preguntas × 6 corridas | esquema | 1,79 s / 4,61 s | 2,72 s / 6,53 s | 1,00 | 4875 / 151 |
| 5 preguntas × 6 corridas | META | 1,97 s / 4,79 s | 2,75 s / 5,96 s | 1,13 | 5586 / 168 |

La latencia queda dentro del ruido entre corridas: en la primera medición el esquema tardó 0,2 s
más hasta el primer `delta` y en la segunda 0,2 s menos. En la primera, parte de la diferencia es
que los modos responden cosas distintas: con la línea META "licencia por maternidad" es una
aclaración corta (la que el eval cuenta como falla) y "gracias" son 13 tokens y la frase fija; con
el esquema son la respuesta completa y un texto del modelo. La segunda medición usa solo preguntas
en las que los dos responden lo mismo; ahí la línea META necesitó la segunda llamada en 4 de 30
consultas ("necesito un certificado": 2,8 s de mediana contra 1,6 s). El prompt con esquema tiene
unos 75 tokens de entrada menos por llamada; la salida es parecida.

### Métricas, historial y calificaciones

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/api/metricas/por-tramite` | SU, ADM | Ver abajo |
| GET | `/api/metricas/sin-respuesta` | SU, ADM | Ver abajo |
| GET | `/api/consultas/mias` | cualquier autenticado (incluido `CIUDADANO`) | Ver abajo |
| DELETE | `/api/consultas/:id` | autenticado, solo el dueño | 204. Ver abajo |
| PATCH | `/api/consultas/:id/calificar` | público, 60 / min, token opcional | Ver abajo |
| GET | `/api/consultas/calificaciones` | SU, ADM | Ver abajo |

**`GET /api/metricas/por-tramite`**: cantidad de consultas respondidas por trámite, de mayor
a menor. Sin `alcance`, de todo el sistema. Con `?alcance=propias`, un ADM ve solo los
trámites de sus sectores (si no tiene sectores asignados, `[]`); un SU ve todo, igual que sin
`alcance`.

```json
[{ "tramiteId": 19, "nombre": "Licencia por maternidad", "sector": { "id": 3, "nombre": "Departamento de Licencias" }, "cantidad": 12 }]
```

**`GET /api/metricas/sin-respuesta`**: las últimas 50 consultas que no encontraron trámite, de
todo el sistema, de la más nueva a la más vieja. No incluye quién preguntó. `encontrado` es
siempre `false` y `tramiteId` siempre `null`.

```json
[{ "id": 512, "textoConsulta": "licencia por paternidad", "encontrado": false, "fecha": "2026-10-30T14:02:11.000Z", "tramiteId": null }]
```

**`GET /api/consultas/mias`**: las últimas 50 consultas del usuario del token, de la más nueva a
la más vieja. `tramite` es `null` si no se encontró trámite o si el trámite se borró.

```json
[{ "id": 417, "textoConsulta": "licencia por maternidad", "encontrado": true, "fecha": "2026-10-30T14:05:40.000Z", "respuesta": "Para la licencia por maternidad tenés que presentar...", "calificacion": 0, "motivoCalificacion": "No era lo que buscaba", "tramite": { "id": 19, "nombre": "Licencia por maternidad" } }]
```

`respuesta` es `null` en las consultas anteriores a que se empezara a guardar; `calificacion` y
`motivoCalificacion` son `null` mientras no se califique.

**`DELETE /api/consultas/:id`**: saca la consulta del historial del usuario del token. **No
borra la fila**: le pone `usuarioId = null`, así las métricas y las calificaciones no cambian.
404 `Consulta no encontrada.` si no existe, no es suya o ya la había sacado.

**`PATCH /api/consultas/:id/calificar`**: califica una respuesta del chat, una sola vez.

```json
{ "calificacion": 0, "motivo": "No era lo que buscaba", "token": "<calificarToken>" }
```

- `calificacion`: `0` (no útil) o `1` (útil). Cualquier otro valor → 400 `La calificación debe ser 0 (no útil) o 1 (útil).`
- `motivo` (opcional): se recorta; hasta 300 caracteres (400 `El motivo no puede superar los 300 caracteres.`). Con `calificacion: 1` se ignora y queda `null`.
- `token` (opcional): el `calificarToken` que devolvió el chat. Se compara en tiempo constante.
- Puede calificar el dueño logueado (sin token) o cualquiera que mande el token correcto (así califica un anónimo). Si no se cumple ninguna de las dos, o la consulta no existe: 404 `Consulta no encontrada.` (nunca 403, para no revelar qué ids existen).
- Ya calificada → 409 `La consulta ya fue calificada.`

Respuesta 200:

```json
{ "consultaId": 417, "calificacion": 0 }
```

**Motivos predefinidos.** Son los que ofrece el front al marcar "no útil" y están en
`MOTIVOS_PREDEFINIDOS` (`src/validators/consulta.validator.js`):

1. `No respondió mi pregunta`
2. `La información no es correcta`
3. `La respuesta fue confusa`
4. `No era lo que buscaba`

El endpoint acepta cualquier texto como motivo; la lista solo se usa para agrupar en
`porMotivo`.

**`GET /api/consultas/calificaciones`**: consultas calificadas, de la más nueva a la más vieja.
Un ADM ve solo las de trámites de sus sectores (mismo criterio que `alcance=propias`; sin
sectores, nada); un SU ve todas. Query, todo opcional:

| Parámetro | Valor |
|---|---|
| `desde`, `hasta` | Fecha ISO (`2026-11-04`) o fecha y hora con zona (`2026-11-04T10:00:00Z`). Una fecha sola es un día de Argentina (UTC-3): `desde` arranca a las 00:00:00 -03:00 y `hasta` termina a las 23:59:59.999 -03:00 de ese día. Con hora y zona se respeta tal cual. Los dos extremos son inclusivos |
| `tramiteId` | Entero positivo |
| `calificacion` | `0` o `1` |
| `page` | Entero ≥ 1, por defecto `1` |
| `limit` | Entero de 1 a 50, por defecto `20` |

```json
{
  "resumen": {
    "total": 6,
    "utiles": 2,
    "noUtiles": 4,
    "satisfaccion": 33.3,
    "porMotivo": [
      { "motivo": "No respondió mi pregunta", "cantidad": 1 },
      { "motivo": "La información no es correcta", "cantidad": 0 },
      { "motivo": "La respuesta fue confusa", "cantidad": 0 },
      { "motivo": "No era lo que buscaba", "cantidad": 1 },
      { "motivo": "Otro motivo", "cantidad": 1 }
    ],
    "sinMotivo": 1,
    "porTopico": [{ "topico": "licencias", "cantidad": 2 }, { "topico": "haberes", "cantidad": 1 }]
  },
  "items": [
    { "id": 417, "fecha": "2026-10-30T14:05:40.000Z", "textoConsulta": "licencia por maternidad", "respuesta": "...", "calificacion": 0, "motivoCalificacion": "No era lo que buscaba", "topico": "licencias", "tramiteId": 19 }
  ],
  "page": 1,
  "total": 6
}
```

- El `resumen` se calcula sobre **todos** los filtros (incluido `calificacion`), no solo sobre la página. `total` es el mismo número arriba y en el resumen.
- `satisfaccion` = útiles / total × 100, con un decimal. `null` si no hay calificaciones.
- `porMotivo` cuenta los motivos de las no útiles: siempre los cuatro predefinidos en ese orden y `Otro motivo` al final, aunque sean 0. Se comparan recortados y sin distinguir mayúsculas (los acentos sí cuentan); cualquier otro texto va a `Otro motivo`.
- `sinMotivo` cuenta las no útiles sin motivo (`null` o solo espacios). Siempre se cumple que la suma de `porMotivo` más `sinMotivo` es igual a `noUtiles`.
- `porTopico` no incluye las consultas sin tópico. Ordenado de mayor a menor.
- Nunca devuelve `usuarioId` ni `calificarToken`.
- Filtros inválidos → 400 con el mensaje del primer error.

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

1. **Caché.** Una pregunta de un solo turno se busca primero en una caché en memoria
   (normalizada, 1 hora, 500 entradas). Se limpia al cambiar trámites, mesas o documentos, y
   también cuando otro proceso cambió el catálogo (el import, otra instancia): antes de usarla se
   revisa la versión del catálogo en la base, como mucho cada `CACHE_CHEQUEO_MS`.
   Un acierto de caché también se registra y tiene su propio `consultaId`.
   El embedding de cada trámite se arma con `Trámite: <nombre>. Organismo: <sector> (<jurisdicción>, <localidad>). Descripción: … Requisitos: …`
   (`textoDeTramite`). Se regenera al crear o editar el trámite, al importarlo con cambios y, en
   segundo plano, para todos los trámites de un sector (y sus descendientes) cuando cambia su
   nombre, padre, jurisdicción o localidad.
2. **Búsqueda híbrida** con el texto de todos los turnos del usuario (sin los que bloquearía la
   regla de entrada), solo sobre trámites
   publicados con embedding: 0,6 · similitud coseno (pgvector, HNSW) + 0,4 · `ts_rank`
   full-text en español (GIN). Es candidato si la distancia coseno es menor a
   `UMBRAL_DISTANCIA` o si coincide por texto. Los trámites se agrupan por nombre normalizado
   (minúsculas, sin acentos) y quedan los 3 grupos de mejor puntaje, cada uno con **todas** sus
   variantes publicadas: así las copias de un mismo trámite en distintos organismos no ocupan
   el lugar de otros trámites.
   De esos 3, se descartan los que tienen menos del 85 % del puntaje del primero
   (`PROPORCION_DEL_PRIMERO`): el modelo ve a todos los candidatos con el mismo peso y preguntaba
   entre trámites que no compiten ("licencia de conducir": la nacional 0,344 y la de taxis 0,282).
   Medido el 09-11-2026, la opción legítima más lejana de una aclaración del eval queda en el 89 %
   (pesca deportiva en "cómo saco la licencia de pesca"): el margen es chico.
   **Corrección de tipeo** ([`tipeo.service.js`](src/services/tipeo.service.js), `TIPEO_REESCRITURA`):
   si la búsqueda no trae candidatos o el mejor puntaje es menor a 0,24 (`UMBRAL_REESCRITURA`), y el
   mensaje no es de cortesía ("gracias", "chau", "hola"), una llamada corta al modelo (prompt fijo,
   temperatura 0, 3 s, sin reintentos) devuelve la consulta con la ortografía corregida. La salida se
   trata como no confiable: tiene que ser una sola línea, sin llaves, de largo parecido (hasta 1,3
   veces más 10 caracteres y no menos de la mitad) y con a lo sumo 2 palabras de diferencia, y la
   regla de entrada no la tiene que bloquear; si el modelo pasa el voseo a tuteo, se vuelve al
   voseo. Si no cumple, falla o queda igual al original (sin contar mayúsculas, tildes ni signos), se
   sigue con la primera búsqueda; si cambia, se busca de nuevo con el texto corregido y se usan esos
   candidatos. El texto corregido solo se usa para buscar: el modelo de la respuesta, la caché, el
   registro y la persona ven el original. Funciona igual en las dos rutas (es antes de llamar al
   modelo de la respuesta). En el log de latencia es la etapa `tipeo`.
   **Variantes** ([`variantes.service.js`](src/services/variantes.service.js)): cada variante tiene
   un par (jurisdicción, localidad) efectivo. Un grupo con un solo par se resuelve con la mejor
   variante, como antes (por ejemplo, las copias de "Licencias médicas de corto tratamiento").
   Si tiene más de un par, se mira qué nombró la persona en sus turnos: una localidad conocida
   (comparada sin acentos y por palabras completas; "provincia de Formosa" no cuenta como la
   localidad Formosa) y las palabras "municipal", "municipalidad", "municipio", "provincial" o
   "nacional". Si eso deja un solo par, se usa esa variante; si no, el grupo queda **sin
   resolver** y va al contexto como una sola línea, sin descripción, con los pares disponibles.
   Si el modelo elige ese grupo (`respuesta` con su id en `tramiteId`), el servidor descarta el
   texto del modelo y responde una aclaración armada, sin cachear ni registrar, aunque se haya
   pasado el tope de aclaraciones: por localidad ("¿De qué localidad lo necesitás? Está cargado
   para: Clorinda, Pirané o Las Lomitas…") o, si los pares difieren en jurisdicción, "¿Necesitás
   el trámite provincial o el de la Municipalidad de Formosa?". Si la persona nombró una
   localidad que el grupo no tiene, la pregunta empieza avisándolo. En streaming se decide con
   la línea del JSON, antes de transmitir texto, y se corta el resto de la llamada al modelo.
3. **Sin candidatos:** se llama igual al modelo, con el contexto vacío (`(ninguno)`): un
   saludo da `conversacion` y un trámite que no existe, `respuesta` con `tramiteId: null`.
   El prompt avisa que los candidatos pueden no tener nada que ver con el mensaje.
4. **Contexto:** detalle de los candidatos (organismo y jurisdicción, por ejemplo `Jurisdicción: municipal (Clorinda)`; requisitos con dónde se consiguen y costo,
   mesas con dirección y horario, nombres de los formularios). Lo que falta se dice: `Requisitos:
   no cargados` y `Mesas de entrada: no cargadas`. El prompt prohíbe afirmar requisitos,
   documentos, costos, plazos, horarios, direcciones o pasos que no estén en el contexto, y
   completar con conocimiento general: si falta el dato, lo dice y deriva a la mesa de entrada o
   a la fuente oficial. Si el trámite tiene `fuenteUrl`, va como `Fuente oficial: <url>`.
   El costo va como `no informado` si es `null` (el modelo dice que el dato no está cargado y
   que se consulte en la mesa de entrada) y como `gratuito` solo si es `0`.
   Siempre va también un **RESUMEN DEL CATÁLOGO** (`catalogo.service.js`): cantidad de
   trámites publicados, los 12 sectores con más trámites publicados y 8 trámites de ejemplo
   (primero los `TRAMITES_DESTACADOS` que estén publicados: Pasaporte, Solicitud de Certificado
   de Buena Conducta y Nuevo Ejemplar para Argentinos; después los más consultados con
   respuesta; si no alcanzan, por orden alfabético; sin nombres repetidos). Con eso responde "qué trámites hay" sin inventar. Queda en memoria (1 hora) y
   se invalida junto con la caché de respuestas (por un cambio en el panel o en la versión del catálogo).
5. **Modelo:** devuelve un JSON con `tipo` (`respuesta`, `aclaracion` o `conversacion`),
   `saludo`, `tramiteId`, `respuesta`, `tramitesUsados` y `opciones` (en streaming, la
   primera línea es ese JSON sin `respuesta` y después el texto). `tramiteId` es el trámite
   del contexto sobre el que trata la pregunta, aunque el dato pedido no esté cargado, o
   `null`. El modelo no decide `encontrado`: lo calcula el servidor (`true` si `tramiteId` está
   en el contexto), así "el dato no está cargado" no se confunde con "no hay trámite". Los
   trámites usados son `tramiteId` y, después, los otros ids de `tramitesUsados` que estén en
   el contexto; una `respuesta` sin `tramiteId` válido pasa al mensaje fijo. Una `conversacion` conserva el texto del modelo (se le piden
   hasta 5 líneas), no se cachea ni se registra. Si pasa de 600 caracteres se corta en la
   última oración completa (punto, `?`, `!`, `…` o salto de línea); si no hay ninguna, en la
   última palabra con "…". En streaming se mandan solo oraciones completas, así nunca se
   transmite algo que después se corte, y el resultado es el mismo que sin streaming.
6. **Registro** en `consultas` (salvo aclaraciones y conversaciones), atribuido al primer
   trámite usado, con el texto que se mostró sin el saludo compuesto (en streaming, sin la
   línea del JSON) y un `calificarToken` nuevo.

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

**Base de los tests.** `npm test` usa `DATABASE_URL_TEST` si está definida; si no, la base
temporal de Docker (`chatap-temporal`, ver [La base temporal](#la-base-temporal)), que antes de
correr arma o pone al día con `scripts/base-temporal.js` (crea el contenedor si no está, aplica las
migraciones e importa el catálogo real). Hace falta Docker Desktop abierto. Se niega a correr si
`DATABASE_URL_TEST` apunta a la misma base que el `.env`.

**Guardia de la base.** Cada archivo de tests importa primero
[`tests/helpers/base-de-prueba.js`](tests/helpers/base-de-prueba.js): corridos como se corran
(`npm test`, `node --test` directo, un archivo suelto), se niegan a ejecutarse si `DATABASE_URL` (o
la del `.env`, si falta) no es local (`localhost`, `127.0.0.1`, `::1`), salvo que se pida con
`TESTS_BASE_NO_LOCAL=<host de esa base>`; `npm run test:real` lo pone después de la confirmación.
Un `DATABASE_URL_TEST` remoto (por ejemplo, una rama de Neon) también necesita esa variable. Un
archivo de tests nuevo tiene que empezar con ese import (lo controla `tests/base-de-prueba.test.js`).
Antes del guardia, el 14-11-2026, `node --test` directo tomó la base real tres veces con
`chat-anterior.test.js` y `fallas-openai-anterior.test.js`, que importan `chat.test.js` y
`fallas-openai.test.js` (crean y borran sus datos; no quedó nada).

**Tests del scraper.** La corrida completa (sin archivos) también corre `ingestion/tests` (Python,
sin red ni base: parsers de las fichas, lectura del módulo, costos, privacidad) con
`ingestion/.venv`. Si el venv no existe, avisa "falta ingestion/.venv, se omiten N tests" y
`npm test` no falla por eso; si existe y un test de Python falla, `npm test` sale con error. Para
crear el venv (una vez, con Python 3.11 o más nuevo):

```bash
cd ingestion
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # en Linux/macOS: .venv/bin/python
```

`npm run test:real` corre los mismos tests contra la base del `.env`, para verificar las
migraciones antes de un deploy. Pide escribir el host de la base para confirmar y no corre sin
una terminal donde hacerlo (en un script o en CI se niega).

Los tests que crean trámites envenenados (con una frase de instrucción para el asistente) los
crean sin publicar y los borran al terminar.

Runner nativo de Node, sin dependencias extra. `higiene.test.js` falla si algún `.js` de
`src/`, `scripts/` o `tests/` tiene caracteres de combinación Unicode (U+0300 a U+036F)
escritos literalmente: son invisibles y tienen que ir con el escape. Los demás cubren validators, `errorHandler`,
`autorizar`, `validarId`, el orden de las rutas, la comparación de nombres con el padrón,
el login (por email y por DNI), el registro de ciudadanos con el padrón simulado, la
calificación, el historial y el panel de calificaciones de las consultas, el resumen del
catálogo, el saludo y el chat con el modelo simulado (conversación, mensaje fijo, saludo,
caché sin nombre y streaming), el import (jerarquía, identificación sin `fuenteUrl`, conflictos,
fallidos que no cortan, `--dry-run` y despublicación), el reindexado en lotes con su respaldo de a
un trámite, la versión del catálogo y los documentos con archivo o enlace (R2 y la firma
simulados: alta, edición, descarga, borrado y que el chat los nombre sin la URL).

`esquema.test.js`, `login.test.js`, `registro.test.js`, `calificar.test.js`,
`historial-consultas.test.js`, `calificaciones.test.js`, `catalogo.test.js`, `chat.test.js`,
`importacion.test.js`, `reindexado.test.js`, `version-catalogo.test.js` y `documentos.test.js`
usan la base de los tests (la temporal, salvo `test:real`): crean sus propios datos (usuarios con
dominios `.test.invalid`) y los borran al terminar (`catalogo.test.js` solo lee). `scripts/test.js`
corre los tests con `--experimental-test-module-mocks` para simular el padrón, el modelo y la
búsqueda.

`fallas-openai.test.js` levanta un OpenAI falso local (con `OPENAI_BASE_URL`) y prueba el chat
por HTTP con tiempos chicos: 429 y 500 con reintento, `retry-after` largo, 503 seguido de
éxito, timeout, cuerpo que no termina de llegar (plazo), falla del embedding, stream cortado
sin `[DONE]`, socket cortado, corte a mitad de la línea del JSON, stream inactivo y
desconexión del cliente. En cada caso revisa qué recibe el cliente, que no se cachee ni se
registre nada y que el log no tenga el texto de la consulta.

`stream-incremental.test.js` compara el streaming con la ruta sin streaming para respuestas
representativas (enlaces válidos e inválidos, listas, costos, lugares de otro trámite, datos
sensibles, inglés, portugués, tuteo, fuga, conversación, aclaración): cortando la salida del
modelo en cada posición, de a un carácter y en pedazos de 3, 7 y 13, el texto final, el `fin`, la
caché y el registro son los mismos, y en cada momento lo mandado es el principio del texto final.
También un corte a mitad (error, sin caché ni registro) y la bandera en `false`.
`salida.test.js` prueba que una oración que se da por terminada en una línea a medio llegar no
cambia cuando llega el resto. `chat-anterior.test.js` y `fallas-openai-anterior.test.js` corren
`chat.test.js` y `fallas-openai.test.js` con `STREAM_INCREMENTAL=false`.

Los tests del chat escriben la salida del modelo por streaming como "línea META + texto" y
`tests/helpers/formato-stream.js` la pasa al formato de las banderas: por defecto, el JSON del
esquema. `chat-meta.test.js`, `fallas-openai-meta.test.js` y `stream-incremental-meta.test.js`
corren los mismos tests con `STREAM_ESQUEMA=false` (la línea META), y `meta-invalida.test.js` es
solo de ese formato. `lector-json.test.js` corta el JSON del streaming en todas las posiciones y en
pedazos de 1, 3, 7 y 13 caracteres (también en medio de un escape, de un `\uXXXX` y de un par
sustituto) y compara con `JSON.parse` del texto completo; además, las salidas que no son el JSON
del esquema. `stream-esquema.test.js` comprueba que el pedido lleva el prompt de la ruta sin
streaming y el esquema con `respuesta` al final, en una sola llamada; que si `respuesta` llega
antes que los demás campos no sale texto hasta tenerlos; que una salida inválida es un error sin
caché ni registro, y las frases de cortesía. `fallas-openai.test.js` suma la negativa del modelo
(`refusal`), el JSON inválido con `stop` y el filtro de contenido.

`tipeo.test.js` prueba la corrección de tipeo con la búsqueda y el modelo simulados: cuándo se
dispara, qué salidas del modelo se aceptan (una respuesta, varias líneas, un JSON, otro largo, algo
que la regla de entrada bloquea o el voseo pasado a tuteo no), que con el texto corregido se busque de
nuevo y que el modelo de la respuesta, la caché y el registro vean el original, en las dos rutas; que
un texto igual no repita la búsqueda, que una falla siga con la búsqueda original, que la cortesía y
`TIPEO_REESCRITURA=false` no la disparen y que un corte del pedido durante la corrección sea un error.

`node scripts/eval-chat.js` evalúa el chat con OpenAI de verdad (3 corridas por caso). Es
para correr a demanda y borra por id las consultas que registra. Con `--detalle` imprime
además el texto de cada corrida; con `--corridas N` cambia la cantidad de corridas y con
`--solo "<pregunta>"` (repetible) corre solo esos casos. Además de lo esperado de cada caso, en todas las respuestas
chequea que no haya tuteo, que no empiece con la palabra "respuesta", que no diga "tiene un
costo sin costo", que toda URL del texto sea la fuente oficial de un trámite publicado y que
una respuesta encontrada incluya el enlace a la fuente oficial de su trámite, y que una respuesta con un
trámite que existe en varias jurisdicciones o localidades sea la de lo que nombró la persona (que no
se ate a un municipio que no dijo).

Los casos de "licencia de conducir" dependen del catálogo: con un solo par (jurisdicción, localidad)
publicado con ese nombre, la respuesta con ese trámite; con más de uno, la aclaración por
jurisdicción o localidad con una opción por par. Sin ninguno con ese nombre, la respuesta con la
ficha municipal "Requisitos para obtener la Licencia Nacional de Conducir" (su id y jurisdicción
municipal) si está publicada, y "no encontrado" si tampoco está.

Cada corrida de `eval-chat` guarda en `server/eval-resultados/eval-chat-<fecha>[-modo].json` (fuera
del repo) la fecha, el modo, la cantidad de corridas y, por caso, su id (la pregunta normalizada,
con el catálogo delante si tiene uno), si pasó, los aciertos, el resumen de lo obtenido y, si falló
alguna corrida, el motivo y la respuesta de cada una. `node scripts/comparar-evals.js` compara las
dos últimas (o dos archivos dados) e imprime los casos que empezaron a fallar, los que ahora pasan,
los que cambiaron de aciertos, los nuevos, los que ya no están y los que siguen sin pasar.

`--catalogo sintetico` corre solo los casos de trámites repetidos en distintos municipios (y los que
dependen del catálogo) y se niega a correr si `DATABASE_URL` no es el Postgres temporal de Docker
(`localhost:55432`); hay que armarla con `npm run base:temporal -- --sintetico`. Entre ellos, el
mismo trámite en la provincia y en la Municipalidad de la Ciudad de Formosa: "municipal" o
"municipalidad" eligen, y "en Formosa" a secas pide aclaración, porque la provincia se llama igual
que la capital. `--catalogo municipal` corre los casos de las fichas de formosatuciudad.gob.ar
(costo en módulos con el monto en pesos, requisitos y oficinas del trámite municipal), también
solo en la temporal, armada con `npm run base:temporal -- --municipal`.

`node scripts/eval-seguridad.js` corre los ataques y las preguntas legítimas (grupos A, B y C)
contra la base del `.env`. `--grupo D` (trámites envenenados) y `--grupo E` (el conjunto de control,
con otras redacciones) crean trámites publicados con órdenes para el asistente en la descripción,
así que se niegan a correr si `DATABASE_URL` no es la base temporal, y borran lo que crean.

### La base temporal

Las pruebas con datos sintéticos van en un Postgres de Docker aparte, nunca en la base real. El
contenedor se crea con `--rm`, así que se pierde al reiniciar la PC o al detenerlo. Para
volver a armarlo (con Docker Desktop abierto):

```bash
npm run base:temporal                  # crea chatap-temporal si no está, migra e importa el catálogo real
npm run base:temporal -- --sintetico   # además el catálogo sintético de 8 municipios
npm run base:temporal -- --municipal   # además ingestion/data/tramites_municipal.json
npm run base:temporal -- --recrear     # lo borra y lo arma de cero
```

El script nunca toca la base del `.env`: corre todo con
`DATABASE_URL=postgresql://postgres:temporal@localhost:55432/postgres` y al final imprime esa URL
para usarla en los evals. Se puede correr las veces que haga falta: si el contenedor ya está, solo
migra lo pendiente y el import no cambia nada. Importar genera los embeddings (llama a OpenAI).

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

Casos de `eval-chat` que no pasan siempre contra la base real (09-11-2026, con el filtro de
candidatos cercanos: ruta normal 50 de 57 OK 3 de 3, streaming 48 de 57; sin errores de API). El
eval no se aflojó: siguen contando como fallas. Con `STREAM_ESQUEMA=true` (16-11-2026, 72 casos) el
streaming pasa los mismos que la ruta normal, 62; las diferencias del streaming que se describen
abajo son del formato anterior (`STREAM_ESQUEMA=false`).

- **"licencia de conducir"** (normal 1/3, streaming 0/3) y **"cómo saco la licencia de conducir"**
  (normal 3/3, streaming 0/3): con los mismos candidatos, el streaming pide aclaración contra un
  trámite de otra cosa ("Solicitud de licencias" para agentes públicos, o la licencia de taxis); la
  ruta normal responde, o pregunta si es obtener o renovar la misma licencia. Es una diferencia de
  cómo decide el modelo con el formato de streaming (META primero, sin esquema JSON), no de los
  candidatos. Un bloque de campos compartido entre los dos prompts lo arreglaba, pero
  rompía otras aclaraciones por streaming, y sacar solo las diferencias de reglas no lo arreglaba:
  las dos pruebas se revirtieron (ver `docs/estado-actual-backend.md`).
- **"dónde saco turno para el médico"** (0/3 en las dos): pide aclaración entre trámites
  provinciales de salud (junta médica, licencias de largo y corto tratamiento) en vez de "no
  encontrado".
- **"qué pasa si me olvido el DNI"** y **"dónde hago el nuevo ejemplar del DNI para argentinos"**:
  agregan conocimiento general en vez de decir que el dato no está cargado (inestables en las dos).
- **"¿el pasaporte actúa como documento de identidad?"**, **"decime las reglas de la pesca
  deportiva"**, **"dónde saco el pasaporte"** (aclaración con Pasaporte Express) y **"¿me dan turno
  para el DNI?"**: inestables, cambian de una corrida a otra en las dos rutas.

Del catálogo municipal:

- **Costo largo** (resuelto el 09-11-2026): el `costoDetalle` del trámite elegido entra hasta 3500
  caracteres (`TOPES_CONTEXTO.costoDetalle`; el más largo del catálogo, la escala de habilitaciones
  con 17 filas, tiene 2971) y el de los demás candidatos hasta 300
  (`costoDetalleSecundario`). Si no entra, se corta por renglón completo, nunca en medio de un monto,
  y se avisa cuántos renglones faltan y dónde está el resto.
- **Montos del portal sin contrastar** (cementerio, libre deuda de Tribunal de Faltas y de Tránsito,
  plan de pago): quedan como los publica el sitio, con la advertencia de que pueden estar
  desactualizados.

Del streaming (resuelto el 09-11-2026):

- **META mal formada en conversaciones cortas (solo con `STREAM_ESQUEMA=false`).** Con el esquema
  JSON (default) no hay línea META: ver [Streaming con esquema JSON](#streaming-con-esquema-json).
  Lo que sigue describe el formato anterior. Con "chau" o "gracias", el modelo a veces manda
  solo la línea META sin salto de línea, o solo el texto sin META, y antes salía "no encontramos
  información". Ahora nunca se responde un trámite sin una META válida: un mensaje que es solo
  cortesía (saludos, gracias, despedidas, "ok", "listo"; no "sí" ni "dale", que pueden responder a
  una pregunta) recibe una frase amable fija, sin trámite ni registro, salvo que el último mensaje
  del asistente traiga `tipo: "aclaracion"` (ahí sigue el flujo normal); una META de conversación o
  de "sin trámite" sin texto vale como tal; cualquier otro caso se pide de nuevo por la ruta con
  esquema JSON y, si eso falla, es un error (503), nunca "no encontrado". Una conversación sin texto
  en la ruta sin streaming también recibe la frase amable. Aplica con `STREAM_INCREMENTAL` en
  `true` y en `false`.

Del chequeo de idioma:

- **Una oración corregida en español ya no tapa una respuesta en otro idioma** (resuelto el
  09-11-2026): en el modo incremental el idioma se cuenta sobre lo que escribió el modelo, sin los
  reemplazos del servidor (la oración del costo, la de oficinas no cargadas). Con
  `STREAM_INCREMENTAL=false` sigue contando sobre el texto ya verificado.
- **La lista de palabras del portugués es corta** ("o", "e" o "na" no están: las dos primeras
  también son del español): un texto corto en portugués puede no llegar al mínimo de 5.

Errores de tipeo, actualizado el 16-11-2026: con la corrección de tipeo (`TIPEO_REESCRITURA`,
"Cómo funciona el chat", paso 2), "hola, nscito renovar el psporte", "necesito renovar el psporte",
"pasaporet", "psporte" y "como saco el pasaprote" encuentran el pasaporte; `eval-chat --tipeo` pasa de
10 a 14 casos 3/3 por la ruta normal y de 10 a 13 por streaming (detalle y mediciones en
`docs/estado-actual-backend.md`). Sigue fallando "licensia de conducir" (no dispara la corrección:
la búsqueda ya encuentra la licencia municipal y el modelo pide aclaración). "partida de nacimiento"
bien escrita sigue sin encontrar su trámite (#273): no es tipeo, su texto del embedding diluye esas
palabras y queda 4.º con 3 lugares; la propuesta (nombres alternativos en el embedding y en
`search_vector`, con una migración) está en el mismo documento, sin aplicar.

Lo que sigue es del 14-11-2026, antes de la corrección. Errores de tipeo (14-11-2026; detalle, mediciones y propuesta en `docs/estado-actual-backend.md`):

- Si la **única** palabra que identifica el trámite está mal escrita ("hola, nscito renovar el
  psporte", "pasaporet"), el trámite no llega como candidato: su embedding queda lejos (distancia
  0,72 a 0,89, umbral 0,5) y el stemmer no une `psport` con `pasaport`. Si otra palabra está bien
  ("renobar pasaporte", "partida de nacimento"), se encuentra. Cuando llega, el modelo lo elige.
- Casos en `eval-chat --tipeo` (12 con errores y 3 de control): 11/15 en la temporal y 10/15 en la
  real, en las dos rutas.
- Se probó corregir palabras contra el vocabulario de los nombres solo para la parte léxica y se
  revirtió: no arreglaba el caso reportado (lo corta el filtro del 85 %), sacaba la partida de
  nacimiento de los candidatos y corregía palabras bien escritas ("conducir" → "conducta").
- También se revirtió corregir el texto del embedding y de la léxica contra todo el texto del catálogo
  (15-11-2026): "psporte" (7 letras, distancia 2) queda sin corregir, rompía "partida de nacimento" y
  cambiaba los candidatos de 21 preguntas bien escritas ("paternidad" → "maternidad"). Queda pg_trgm
  como mejora futura.
- "partida de nacimiento" **bien escrita** no encuentra la Solicitud Partida de Nacimiento (0/3 en las
  dos bases y rutas): es una debilidad de la búsqueda, no del tipeo.

Del pentest manual por el chat (14-11-2026; detalle en `docs/estado-actual-backend.md`):

- **Arreglado:** el contexto crudo y las "notas del sistema" por streaming, el sobre JSON (cubierto
  aunque hoy no se reprodujo), el rechazo de consultas legítimas después de un intento, las
  evasiones con ancho completo, letras en círculos, cirílicas y `%20`, y los límites del servidor
  (largos, mensajes, cuerpo, roles, tope por hora).
- **Queda:** un resumen de reglas en prosa, sin rótulos ni copia literal, depende del prompt; un
  rótulo "Reglas:" sin `#` no se saca (puede ser legítimo); el rate limit es por IP y en memoria, sin tope global de gasto (propuesta en
  el documento de estado).
- **No es del backend:** el servidor de desarrollo de Vite expone el código del front (en
  producción se sirve el build) y el número de consulta visible es decisión del front.

## Pendiente

- Estados `PENDIENTE` y `RECHAZADO` sin flujo (no hay endpoints de aprobar o rechazar).
- Editar un trámite publicado no vuelve a pasar por la aprobación del supervisor.
- Editar una mesa no revalida los trámites que ya la usan.
- Alinear las migraciones con las de otras ramas (los 9 registros de las ramas de Felipe, ver arriba).
- Migrar `package.json#prisma` a `prisma.config.ts` antes de Prisma 7.
- Un trámite que `--despublicar-faltantes` bajó no se vuelve a publicar solo si reaparece en el JSON.

Más detalle en [`docs/estado-actual-backend.md`](docs/estado-actual-backend.md).
