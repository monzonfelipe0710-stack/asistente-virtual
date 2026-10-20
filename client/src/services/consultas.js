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
export async function calificarConsulta(id, calificacion) {
  const { data } = await api.patch(`/api/consultas/${id}/calificar`, {
    calificacion,
  });
  return data;
}
