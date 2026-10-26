import { api } from "../lib/api";

/** GET /api/consultas/mias — historial propio de consultas y respuestas. */
export async function misConsultas() {
  const { data } = await api.get("/api/consultas/mias");
  return data;
}

/** GET /api/consultas/resumen — métricas personales del ciudadano. */
export async function resumenConsultas() {
  const { data } = await api.get("/api/consultas/resumen");
  return data;
}

/** PATCH /api/consultas/:id/calificar — calificación propia de la respuesta. */
export async function calificarConsulta(id, calificacion, { publico = false } = {}) {
  const endpoint = publico
    ? `/api/consultas/${id}/calificar-publica`
    : `/api/consultas/${id}/calificar`;
  const { data } = await api.patch(endpoint, { calificacion });
  return data;
}

/** DELETE /api/consultas/:id — elimina una consulta propia del historial. */
export async function eliminarConsulta(id) {
  const { data } = await api.delete(`/api/consultas/${id}`);
  return data;
}
