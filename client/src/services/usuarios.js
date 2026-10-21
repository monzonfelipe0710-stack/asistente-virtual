import { api } from "../lib/api";

/** POST /api/usuarios/registro-ciudadano — público, con verificación de padrón. */
export async function registroCiudadano({ dni, genero, email, password, nombre, apellido }) {
  const { data } = await api.post(
    "/api/usuarios/registro-ciudadano",
    { dni, genero, email, password, nombre, apellido },
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

/**
 * POST /api/usuarios — SUPERUSUARIO. Alta directa de una cuenta.
 * Body { nombre, email, password, rol, dni?, cuil?, sectorIds? }.
 */
export async function crearUsuario({ nombre, email, password, rol, dni, cuil, sectorIds = [] }) {
  const { data } = await api.post("/api/usuarios", {
    nombre,
    email,
    password,
    rol,
    dni: dni || undefined,
    cuil: cuil || undefined,
    sectorIds,
  });
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
