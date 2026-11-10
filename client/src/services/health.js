import { api } from "../lib/api";

/** GET /api/health — público. { status, servicio }. */
export async function health() {
  const { data } = await api.get("/api/health");
  return data;
}
