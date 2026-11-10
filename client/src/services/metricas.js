import { api } from "../lib/api";

/**
 * Métricas — hoy solo SUPERUSUARIO (el backend habilitará también al
 * ADMINISTRADOR con alcance propias/generales: pendiente, sección 7.2).
 */

/** GET /api/metricas/por-tramite → [{ _count: { _all }, tramiteId }].
 *  Sin nombre: cruzar con GET /api/tramites. tramiteId puede ser null (borrado). */
export async function porTramite() {
  const { data } = await api.get("/api/metricas/por-tramite");
  return data;
}

/** GET /api/metricas/sin-respuesta → últimas 50 con encontrado=false. */
export async function sinRespuesta() {
  const { data } = await api.get("/api/metricas/sin-respuesta");
  return data;
}
