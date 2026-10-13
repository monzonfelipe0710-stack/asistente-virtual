# ChatAP — API

Backend del asistente virtual de la Subsecretaría de Recursos Humanos (Provincia de Formosa).

Express 5 + Prisma + PostgreSQL con `pgvector`.

## Requisitos

- Node.js 18 o superior
- PostgreSQL con la extensión `vector` habilitada

## Puesta en marcha

```bash
npm install          # el postinstall corre "prisma generate" solo
cp .env.example .env # completar los valores
npx prisma migrate deploy
npx prisma db seed   # crea el superusuario inicial
npm run dev
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a PostgreSQL. El server no arranca si falta |
| `JWT_SECRET` | sí | Secreto para firmar los tokens. El server no arranca si falta |
| `PORT` | no | Puerto HTTP (por defecto `3000`) |
| `JWT_EXPIRES_IN` | no | Vigencia del token (por defecto `2h`) |
| `CORS_ORIGIN` | no | Orígenes permitidos, separados por coma (por defecto `http://localhost:5173`) |
| `TRUST_PROXY` | no | Saltos de proxy a confiar. Vacío si el server se expone directo |
| `OPENAI_API_KEY` | sí | Embeddings y chat. El server no arranca si falta |
| `R2_ACCOUNT_ENDPOINT` | para documentos | Endpoint S3 de Cloudflare R2 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | para documentos | Credenciales de R2 |
| `R2_BUCKET` | para documentos | Bucket donde se guardan los archivos |

> Después de cambiar `prisma/schema.prisma` (o de hacer pull de cambios que lo toquen)
> hay que correr `npx prisma generate`. Un cliente viejo apunta a tablas y columnas que
> ya no existen y los endpoints responden 400/500 sin una causa obvia.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el server con recarga automática |
| `npm start` | Levanta el server |
| `npm test` | Corre la suite con el runner nativo de Node |

## Endpoints

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "mensaje" }`.

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/auth/login` | Público (10 intentos cada 15 min) |

### Usuarios

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/usuarios/registro` | Público (5 por hora) |
| `GET` | `/api/usuarios` | Superusuario. Admite `?estado=PENDIENTE\|APROBADO\|RECHAZADO\|SUSPENDIDO` |
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
| `DELETE` | `/api/sectores/:id` | Superusuario |

### Trámites

"Dueño" = administrador que es el encargado del trámite.

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/tramites` | Administrador. El usuario queda como encargado |
| `GET` | `/api/tramites` | Autenticado |
| `GET` | `/api/tramites/:id` | Autenticado |
| `PATCH` | `/api/tramites/:id` | Dueño. Si vienen `requisitos` o `mesaIds`, reemplazan a los actuales |
| `DELETE` | `/api/tramites/:id` | Dueño. Borra también los archivos de sus documentos en R2 |
| `PATCH` | `/api/tramites/:id/publicar` | Dueño |
| `PATCH` | `/api/tramites/:id/despublicar` | Dueño |

Body: `{ nombre, descripcion, costo?, sectorId, requisitos?: [{ descripcion, dondeSeConsigue?, costo? }], mesaIds?: number[] }`.
Al crear o editar, el embedding del trámite se recalcula en segundo plano.

### Documentos

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/tramites/:id/documentos` | Dueño. `multipart/form-data` con `archivo` (PDF o DOCX, hasta 10 MB) y `nombre` opcional |
| `GET` | `/api/tramites/:id/documentos` | Autenticado |
| `GET` | `/api/tramites/:id/documentos/:docId/descargar` | Autenticado. Devuelve `{ url }` firmada por 5 minutos |
| `DELETE` | `/api/tramites/:id/documentos/:docId` | Dueño |

### Chat

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/chat` | Público (10 por minuto). Body `{ pregunta }`, responde `{ respuesta, tramitesEncontrados, encontrado }` |

### Métricas

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/api/metricas/por-tramite` | Superusuario. Cantidad de consultas respondidas por trámite |
| `GET` | `/api/metricas/sin-respuesta` | Superusuario. Últimas 50 consultas sin resultados |

### Otros

`GET /api/health` responde `{ "status": "ok" }` sin autenticación.

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
se recorre la cadena de ancestros para verificar que no se cierre un bucle. La
validación va solo en el `PATCH`: un sector recién creado todavía no tiene descendientes
que puedan apuntarle de vuelta.

**El chat es un RAG híbrido.** La pregunta se convierte en embedding
(`text-embedding-3-small`) y se busca entre los trámites publicados combinando
similitud coseno (pgvector, índice HNSW) con full-text en español (`search_vector`,
índice GIN). Los 5 mejores se pasan como contexto a `gpt-4o-mini`. Cada consulta se
registra en `consultas` para las métricas.

## Estado

Pendiente: CRUD de mesas de entrada, asignación de sectores a usuarios y un listado
público de trámites publicados.
