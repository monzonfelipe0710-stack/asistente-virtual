import { api } from "../lib/api";

/**
 * POST /api/usuarios/registro — público.
 * rol ADMINISTRADOR (empleado) → estado PENDIENTE (requiere aprobación).
 * rol CIUDADANO → estado APROBADO (habilitado al instante).
 */
export async function registro({ nombre, dni, genero, email, password, cuil }) {
  const { data } = await api.post(
    "/api/usuarios/registro",
    { nombre, dni, genero, email, password, cuil },
    { skipAuthHandler: true }
  );
  return data;
}

/** GET /api/usuarios — SUPERUSUARIO. Filtro opcional ?estado=. */
export async function listar({ estado } = {}) {
  const { data } = await api.get("/api/usuarios", { params: estado ? { estado } : {} });
  return data;
}

/** GET /api/usuarios/pendientes — SUPERUSUARIO. */
export async function pendientes() {
  const { data } = await api.get("/api/usuarios/pendientes");
  return data;
}

/** PATCH /api/usuarios/:id/aprobar — SUPERUSUARIO, solo PENDIENTE. */
export async function aprobar(id) {
  const { data } = await api.patch(`/api/usuarios/${id}/aprobar`);
  return data;
}

/** PATCH /api/usuarios/:id/rechazar — SUPERUSUARIO, solo PENDIENTE. */
export async function rechazar(id) {
  const { data } = await api.patch(`/api/usuarios/${id}/rechazar`);
  return data;
}

/** PATCH /api/usuarios/:id/suspender — SUPERUSUARIO, solo APROBADO (no a uno mismo). */
export async function suspender(id) {
  const { data } = await api.patch(`/api/usuarios/${id}/suspender`);
  return data;
}

/** PATCH /api/usuarios/:id/reactivar — SUPERUSUARIO, solo SUSPENDIDO. */
export async function reactivar(id) {
  const { data } = await api.patch(`/api/usuarios/${id}/reactivar`);
  return data;
}
