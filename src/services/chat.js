import { api } from "../lib/api";

/** POST /api/chat — PÚBLICO, limit 10/min. Body { pregunta } (1–500 car.). */
export async function preguntar(pregunta) {
  const { data } = await api.post(
    "/api/chat",
    { pregunta },
    { skipAuthHandler: true }
  );
  return data;
}
