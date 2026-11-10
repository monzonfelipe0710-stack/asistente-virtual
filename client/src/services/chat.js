import { api } from "../lib/api";

/** POST /api/chat — público. Admite pregunta simple o historial conversacional. */
export async function preguntar(pregunta, imagen = null, mensajes = null) {
  if (imagen) {
    const formData = new FormData();
    formData.append("pregunta", pregunta);
    formData.append("imagen", imagen);
    const { data } = await api.post("/api/chat", formData, {
      skipAuthHandler: true,
    });
    return data;
  }

  const payload = Array.isArray(mensajes) && mensajes.length
    ? { mensajes }
    : { pregunta };

  const { data } = await api.post("/api/chat", payload, {
    skipAuthHandler: true,
  });
  return data;
}

/** GET /api/chat/checklist/:tramiteId — requisitos y datos para preparar la presentación. */
export async function obtenerChecklist(tramiteId) {
  const { data } = await api.get(`/api/chat/checklist/${tramiteId}`);
  return data;
}
