import { api } from "../lib/api";

/**
 * Trámites. Ojo con las formas según el endpoint:
 * - GET /      → todos los trámites (publicados o no), con sector y encargado,
 *                sin requisitos ni mesas. No filtra por dueño: el panel del
 *                admin filtra en el front por encargado.id.
 * - POST /     → 201 con requisitos y mesas (mesas SIN objeto .mesa),
 *                pero SIN sector ni encargado.
 * - GET /:id   → detalle completo (requisitos, mesas con .mesa, sector, encargado).
 * - PATCH /:id → detalle completo; requisitos[] y mesaIds[] REEMPLAZAN todo.
 * - publicar/despublicar → { mensaje, tramite } sin includes.
 * `costo` viaja como STRING; al crear/editar se manda como número.
 */

/** GET /api/tramites — auth. */
export async function listar() {
  const { data } = await api.get("/api/tramites");
  return data;
}

/** GET /api/tramites/:id — auth. Detalle completo. */
export async function obtener(id) {
  const { data } = await api.get(`/api/tramites/${id}`);
  return data;
}

/** POST /api/tramites — ADMINISTRADOR. encargadoId se toma del token (no enviarlo). */
export async function crear(body) {
  const { data } = await api.post("/api/tramites", body);
  return data;
}

/** PATCH /api/tramites/:id — ADMINISTRADOR y dueño. Parcial. */
export async function actualizar(id, cambios) {
  const { data } = await api.patch(`/api/tramites/${id}`, cambios);
  return data;
}

/** DELETE /api/tramites/:id — ADMINISTRADOR y dueño. 204 (borra también archivos de R2). */
export async function eliminar(id) {
  await api.delete(`/api/tramites/${id}`);
}

/** PATCH /api/tramites/:id/publicar — ADMINISTRADOR y dueño. Sin body. */
export async function publicar(id) {
  const { data } = await api.patch(`/api/tramites/${id}/publicar`);
  return data;
}

/** PATCH /api/tramites/:id/despublicar — ADMINISTRADOR y dueño. Sin body. */
export async function despublicar(id) {
  const { data } = await api.patch(`/api/tramites/${id}/despublicar`);
  return data;
}
