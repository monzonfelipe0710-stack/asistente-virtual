import { api } from "../lib/api";

/** GET /api/mesas — mesas visibles para superusuarios y empleados. */
export async function listarMesas() {
  const { data } = await api.get("/api/mesas");
  return data;
}
