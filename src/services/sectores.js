import { api } from "../lib/api";

/**
 * Sectores — lista plana ordenada por nombre; el árbol se arma en el front
 * con `parentId`. Forma: { id, nombre, tipo, createdAt, updatedAt, parentId }.
 */

/** GET /api/sectores — auth. */
export async function listar() {
  const { data } = await api.get("/api/sectores");
  return data;
}

/** GET /api/sectores/:id — auth. 404 si no existe. */
export async function obtener(id) {
  const { data } = await api.get(`/api/sectores/${id}`);
  return data;
}

/** POST /api/sectores — SUPERUSUARIO. Body { nombre, tipo, parentId? }. tipo: MINISTERIO|SUBSECRETARIA|DEPARTAMENTO. */
export async function crear({ nombre, tipo, parentId = null }) {
  const body = { nombre, tipo };
  if (parentId != null) body.parentId = parentId;
  const { data } = await api.post("/api/sectores", body);
  return data;
}

/** PATCH /api/sectores/:id — SUPERUSUARIO, parcial. parentId: null → raíz; ausente → no se toca. */
export async function actualizar(id, cambios) {
  const { data } = await api.patch(`/api/sectores/${id}`, cambios);
  return data;
}

/** DELETE /api/sectores/:id — SUPERUSUARIO. 204. 409 si tiene trámites. */
export async function eliminar(id) {
  await api.delete(`/api/sectores/${id}`);
}
