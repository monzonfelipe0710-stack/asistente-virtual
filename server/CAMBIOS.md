# Revisión del backend — cambios aplicados

Registro de la auditoría de código del 7 de septiembre de 2026 sobre la rama `dev-nata`.
Alcance: solo `server/`. El frontend quedó fuera por decisión explícita.

Cada sección explica **qué se cambió** y **por qué**, para que las decisiones no haya que
reconstruirlas leyendo el diff.

---

## Resumen

| Categoría | Cambios |
|---|---|
| Bugs que rompían en runtime | 3 |
| Manejo de errores | 5 códigos de Prisma traducidos + catch-all 404 |
| Seguridad | 5 (revalidación de sesión, CORS, rate limiting, TTL, arranque) |
| Esquema y migraciones | 5 correcciones en 2 migraciones |
| Endpoints nuevos o modificados | 4 |
| Calidad | 23 tests, README, `postinstall` |

19 archivos modificados, 5 agregados.

---

## 1. Bugs que rompían en runtime

### 1.1 `PATCH /api/sectores/:id` fallaba siempre

`sector.controller.js` tenía tres problemas encadenados en tres líneas:

```js
const sector = await sectorService.obtenerSectorPorId(id);
return sector = await sectorService.actualizarSector(id, datos);  // asigna a const
res.json(sector)                                                   // inalcanzable
```

- Asignar a una `const` lanza `TypeError: Assignment to constant variable`, así que el
  endpoint devolvía **500 en el 100 % de los casos**.
- El `return` dejaba el `res.json` muerto.
- El sector que se buscaba en la primera línea nunca se usaba para validar el 404.

Ahora valida existencia, responde 404 si no está, y devuelve el sector actualizado.

### 1.2 `aprobar` no validaba el estado de origen

Faltaba la comprobación `estado !== 'PENDIENTE'` que sí tenía `rechazar`, así que **se
podía volver a aprobar a un usuario ya rechazado**. Además, cuando el usuario no existía
respondía `409 "La solicitud ya fue procesada."` en lugar de un 404.

### 1.3 El mensaje de error del enum de sector se ignoraba en silencio

```js
tipo: z.enum([...], { errorMap: () => ({ message: '...' }) })   // Zod v3
```

`errorMap` no existe en Zod v4 (el proyecto usa 4.4.3). La clave se ignoraba sin avisar y
el cliente recibía el mensaje genérico `Invalid option: expected one of "MINISTERIO"|...`.
En v4 la propiedad correcta es `error`.

---

## 2. Manejo de errores

`error.middleware.js` solo entendía `ZodError` y errores propios con `statusCode`.
Cualquier error de Prisma caía en el `500` genérico y además ensuciaba los logs con
`console.error`, tapando los 500 que sí importan.

| Situación | Código Prisma | Antes | Ahora |
|---|---|---|---|
| Id no numérico en la URL (`/sectores/abc` → `NaN`) | `PrismaClientValidationError` | 500 | **400** |
| Email duplicado | `P2002` | 500 | **409** |
| Borrar un registro inexistente | `P2025` | 500 | **404** |
| Borrar un sector con trámites asociados | `P2003` | 500 | **409** |
| Crear con un `parentId` que no existe | `P2003` | 500 | **400** |

`P2003` se resuelve **según el método HTTP**, porque Prisma usa el mismo código para dos
situaciones opuestas: en un `DELETE` significa "todavía está referenciado" (conflicto,
409), y en un `POST`/`PATCH` significa "la referencia que mandaste no existe" (dato
inválido del cliente, 400).

Resolver esto en el middleware evitó tener que validar el id en los cinco controladores
por separado.

**Catch-all 404.** Una ruta no registrada devolvía el HTML por defecto de Express
(`<pre>Cannot GET /api/...</pre>`), lo que rompe a cualquier cliente que haga
`res.json()`. Ahora responde `{ "error": "Ruta no encontrada." }`.

---

## 3. Seguridad

### 3.1 La sesión se revalida contra la base en cada request

**Este es el cambio de fondo más importante.**

Antes, `autenticar` solo verificaba firma y expiración del JWT, y confiaba en el payload:

```js
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.usuario = payload;   // rol y estado congelados en el momento del login
```

Un JWT es una fotografía firmada del pasado. No sabe si el usuario todavía existe, si
sigue habilitado, o si le cambiaron el rol. Las consecuencias eran dos:

- **No existía forma de revocar el acceso de nadie.** Si un administrador se iba del
  organismo o le robaban el token, la única palanca era rotar `JWT_SECRET`, que desloguea
  a *todos* a la vez.
- **`autorizar` confiaba en un rol congelado**, así que un cambio de rol no tenía efecto
  hasta que expirara el token.

Ahora el middleware relee el usuario y rechaza a quien no esté `APROBADO`. `req.usuario`
sale de la base, no del token.

> **Costo asumido:** una consulta por clave primaria en cada request autenticado. Contra
> Neon en `sa-east-1` es un round trip de red real. Es el precio de tener revocación
> inmediata; si alguna vez pesa, la salida es cachear en memoria unos segundos.

Un detalle que apareció al reescribirlo: el `next()` estaba **dentro del `try`**, así que
una excepción síncrona de cualquier handler posterior caía en ese `catch` y se reportaba
como "token inválido o expirado" — un 401 engañoso para un error sin relación con el
token. Ahora el `try` envuelve solo al `jwt.verify`.

### 3.2 Vigencia del token: 8 h → 2 h

Ocho horas significan que un token robado a las 9 de la mañana sirve toda la jornada.
Configurable con `JWT_EXPIRES_IN`.

### 3.3 CORS restringido

`cors()` sin argumentos acepta cualquier origen. Ahora lee `CORS_ORIGIN` (lista separada
por comas), con `http://localhost:5173` por defecto para desarrollo.

### 3.4 Rate limiting

`express-rate-limit` estaba instalado pero sin usar.

| Endpoint | Límite | Motivo |
|---|---|---|
| `POST /api/auth/login` | 10 cada 15 min | Fuerza bruta |
| `POST /api/usuarios/registro` | 5 por hora | Spam de solicitudes pendientes |

**`TRUST_PROXY` queda apagado por defecto, a propósito.** Detrás de un reverse proxy hay
que decirle a Express cuántos saltos confiar, o el limitador ve siempre la IP del proxy y
limita a todos en conjunto. Pero activarlo "por las dudas" es peor que no tenerlo: si se
confía en `X-Forwarded-For` sin un proxy real adelante, cualquiera manda esa cabecera con
una IP inventada y saltea el límite a voluntad.

### 3.5 El server falla temprano si falta configuración

`index.js` verifica `DATABASE_URL` y `JWT_SECRET` antes de escuchar. Antes, sin
`JWT_SECRET` el server arrancaba normal y **todos los logins devolvían 500** sin pista de
la causa.

---

## 4. Esquema y migraciones

### `20260907094902_coherencia_esquema`

| Cambio | Motivo |
|---|---|
| `vector(1546)` → `vector(1536)` | 1546 era un typo. 1536 es la dimensión de `text-embedding-3-small` |
| Tabla `Consulta` → `consultas` | Única tabla en PascalCase; el resto usa snake_case |
| `+ @@index([tramiteId])` en consultas | La FK no tenía índice |
| `tramites.createdAt` → `created_at` | Único `createdAt` sin `@map` de los cuatro modelos |
| `+ @@unique([nombre, parentId])` en sectores | Nada impedía dos sectores idénticos bajo el mismo padre |

**Esta migración está escrita a mano, y conviene saber por qué.**

Prisma generaba `DROP TABLE "Consulta"` + `CREATE TABLE "consultas"` para el renombre, y
`DROP COLUMN` + `ADD COLUMN` para `createdAt`. Con las tablas vacías no se perdía nada,
pero replayarla en un entorno con datos los **borra**. Se reescribió con
`ALTER TABLE ... RENAME`.

Y más importante: **el `migrate diff` de Prisma se saltaba por completo el cambio del
vector**, porque no diffea tipos `Unsupported()`. Confiando en el flujo automático, ese
typo se habría quedado para siempre. El `ALTER COLUMN` va agregado a mano.

### `20260907100027_estado_suspendido`

Agrega `SUSPENDIDO` al enum `EstadoUsuario`.

`RECHAZADO` y `SUSPENDIDO` **no son lo mismo**: el primero cierra el circuito de alta
(nunca llegó a ser usuario), el segundo da de baja una cuenta que ya operaba. Mezclarlos
haría imposible distinguir a un postulante rechazado de un empleado dado de baja.

---

## 5. Endpoints

### Nuevos

| Método | Ruta | Reglas |
|---|---|---|
| `GET` | `/api/usuarios` | Superusuario. Filtro opcional `?estado=`. Nunca devuelve `passwordHash` |
| `PATCH` | `/api/usuarios/:id/suspender` | Solo sobre `APROBADO`. **Bloquea suspenderse a uno mismo** |
| `PATCH` | `/api/usuarios/:id/reactivar` | Solo sobre `SUSPENDIDO` |

El listado no era opcional: sin él, un superusuario no tenía cómo averiguar el id de a
quién suspender, ni ver quién estaba suspendido para reactivarlo. Los endpoints de baja
habrían quedado inutilizables sin ir a la consola de la base.

`/pendientes` se mantiene aunque ahora sea equivalente a `?estado=PENDIENTE`.

### `PUT /api/sectores/:id` → `PATCH`

El endpoint usa `.partial()`, o sea acepta cuerpos parciales: comportamiento de `PATCH`
con el verbo de `PUT`. El verbo ahora describe lo que realmente hace.

Junto con eso, `parentId` pasa a aceptar `null`, y los tres casos quedan distinguidos:

| Cuerpo | Significado |
|---|---|
| `{"parentId": 5}` | El padre pasa a ser el 5 |
| `{"nombre": "X"}` (sin `parentId`) | El padre no se toca |
| `{"parentId": null}` | El sector pasa a ser raíz |

Antes el tercer caso **no existía**: `.optional()` acepta `undefined` pero no `null`, y
"campo ausente" ya significaba "no lo modifiques". No había forma de desvincular un sector
de su padre salvo editando la base a mano.

Se descartó hacer del `PUT` un reemplazo real (más fiel a REST) porque expone a un error
difícil de detectar: si el front se olvida de incluir `parentId` en un formulario,
**desvincula el sector sin querer**.

---

## 6. Jerarquía de sectores sin ciclos

Nada impedía que un sector fuera su propio padre, ni un ciclo A → B → A. La FK se
satisface sola y Prisma lo guardaba sin chistar.

Hoy no rompía nada porque el árbol no se recorre en ningún lado. Pero el esquema tiene
`parent`/`hijos`, así que en cuanto se escriba la función que arma la jerarquía para el
front, **entra en recursión infinita**.

`generariaCiclo()` sube por la cadena de ancestros con un `WITH RECURSIVE` antes de
guardar, con un tope de profundidad de 100 como red de seguridad: si la tabla ya tuviera
un ciclo previo, la consulta se corta en vez de colgar la conexión.

**La validación va solo en el update**, y el razonamiento importa: un sector recién creado
todavía no tiene descendientes que puedan apuntarle de vuelta, así que un `POST` no puede
cerrar un bucle. Tampoco se ejecuta cuando `parentId` es `null`, porque mover algo a la
raíz nunca forma un ciclo.

---

## 7. Calidad

| Cambio | Detalle |
|---|---|
| **23 tests** | Runner nativo de Node, sin dependencias nuevas. `npm test` dejó de ser `exit 1` |
| **`server/README.md`** | Puesta en marcha, variables de entorno, los 15 endpoints y las decisiones de diseño |
| **`postinstall`** | `prisma generate` — el cliente no estaba generado y el server no arrancaba al clonar |
| **`.env.example`** | Documenta las 6 variables. `JWT_SECRET` queda vacío a propósito; `DATABASE_URL` lleva un placeholder falso |
| **`seed.js`** | `$disconnect` movido a `.finally()`, y `process.exitCode` en vez de `process.exit()`, que cortaba el proceso antes de desconectar |
| **`roles.middleware.js`** | Indentación y un `;;` |
| **Rutas duplicadas** | `/api/auth` y `/api/usuarios` estaban montadas dos veces en `app.js` |

Los tests cubren validadores, el `errorHandler` completo y `autorizar`. Dos están marcados
como regresión: el mensaje del enum que el `errorMap` se comía, y el id no numérico que
salía 500.

> **Alcance de los tests:** son unitarios y **no tocan la base**. No cubren `autenticar`,
> los controladores ni la detección de ciclos. Para eso hace falta una base de test
> separada — no conviene apuntar una suite automatizada contra la base de desarrollo.

---

## 8. Verificación

Lo probado en vivo contra la base real, además de los 23 tests:

- **Revocación de sesión:** token sin header, token basura, token de un id inexistente,
  token de un usuario `PENDIENTE`, token de un usuario `APROBADO`.
- **El token no manda sobre el rol:** un token firmado declarando `rol: 'SUPERUSUARIO'`
  para un usuario que es `ADMINISTRADOR` y está `PENDIENTE` recibe 401. Antes ese token
  pasaba `autorizar('SUPERUSUARIO')` sin problema — era una escalada de privilegios
  latente.
- **Ciclos:** sector como padre de sí mismo (409), sector bajo su propio hijo (409),
  reasignación válida (200), `parentId` inexistente (400).
- **Jerarquía:** `PATCH` de solo el nombre deja el padre intacto; `PATCH` con `null` lo
  desvincula.
- **Errores:** los cinco códigos de Prisma y el catch-all 404 en JSON.

Los sectores usados en las pruebas se crearon y borraron; la tabla quedó vacía.

---

## 9. Fuera de alcance, deliberadamente

| Tema | Motivo |
|---|---|
| Todo el frontend | El trabajo es solo de backend |
| `package.json#prisma` deprecado | Migrar a `prisma.config.ts` queda para antes de Prisma 7 |
| Contraseña del seed hardcodeada | Se usa para pruebas en desarrollo |

---

## 10. Pendiente

- **Tests de integración** con base propia, para cubrir `autenticar`, controladores y
  ciclos.
- **Trámites, requisitos, documentos y búsqueda semántica**: están modelados en el esquema
  pero no tienen endpoints. `multer` y `openai` están instalados para esa etapa.
- **`trust proxy`**: recordar poner `TRUST_PROXY=1` al desplegar detrás de un reverse
  proxy, o el rate limiting no discrimina por cliente.
- **Rate limiter en memoria**: si alguna vez corren más de una instancia, cada una lleva su
  propio conteo.
