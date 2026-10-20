import { api } from "../lib/api";

/**
 * Documentos de un trámite. Forma: { id, nombre, archivo, tipo, createdAt, tramiteId }.
 * `archivo` es la key en R2, NO una URL.
 * La descarga devuelve { url } (URL firmada, válida 5 minutos), no el archivo.
 */

/** GET /api/tramites/:id/documentos — auth. Más nuevo primero. [] si el trámite no existe. */
export async function listar(tramiteId) {
  const { data } = await api.get(`/api/tramites/${tramiteId}/documentos`);
  return data;
}

/**
 * POST /api/tramites/:id/documentos — ADMINISTRADOR y dueño.
 * multipart/form-data: campo `archivo` (PDF/DOCX, ≤10 MB) + opcional `nombre`.
 */
export async function subir(tramiteId, { archivo, nombre } = {}) {
  const form = new FormData();
  form.append("archivo", archivo);
  if (nombre) form.append("nombre", nombre);
  const { data } = await api.post(`/api/tramites/${tramiteId}/documentos`, form);
  return data;
}

/** GET /api/tramites/:id/documentos/:docId/descargar — auth. Devuelve { url } firmada (5 min). */
export async function obtenerUrlDescarga(tramiteId, docId) {
  const { data } = await api.get(
    `/api/tramites/${tramiteId}/documentos/${docId}/descargar`
  );
  return data;
}

/** DELETE /api/tramites/:id/documentos/:docId — ADMINISTRADOR y dueño. 204. */
export async function eliminar(tramiteId, docId) {
  await api.delete(`/api/tramites/${tramiteId}/documentos/${docId}`);
}
