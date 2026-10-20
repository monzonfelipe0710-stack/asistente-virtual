import { api } from "../lib/api";

/** POST /api/chat — PÚBLICO, limit 10/min. Pregunta de hasta 500 caracteres. */
export async function preguntar(pregunta, imagen = null) {
  if (imagen) {
    const formData = new FormData();
    formData.append("pregunta", pregunta);
    formData.append("imagen", imagen);
    const { data } = await api.post("/api/chat", formData, {
      skipAuthHandler: true,
    });
    return data;
  }

  const { data } = await api.post(
    "/api/chat",
    { pregunta },
    { skipAuthHandler: true }
  );
  return data;
}

/** GET /api/chat/checklist/:tramiteId — requisitos y datos para preparar la presentación. */
export async function obtenerChecklist(tramiteId) {
  const { data } = await api.get(`/api/chat/checklist/${tramiteId}`);
  return data;
}
