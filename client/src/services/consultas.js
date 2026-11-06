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
export async function calificarConsulta(id, calificacion, { motivo = "", token } = {}) {
  const body = { calificacion };
  if (motivo) body.motivo = motivo;
  if (token) body.token = token;
  const { data } = await api.patch(`/api/consultas/${id}/calificar`, body);
  return data;
}

/** GET /api/consultas/calificaciones — supervisor y empleados, con filtros. */
export async function listarCalificaciones(filtros = {}) {
  const { data } = await api.get("/api/consultas/calificaciones", {
    params: filtros,
  });
  return data;
}

/** DELETE /api/consultas/:id — desvincula la consulta propia del historial. */
export async function eliminarConsulta(id) {
  const { data } = await api.delete(`/api/consultas/${id}`);
  return data;
}
