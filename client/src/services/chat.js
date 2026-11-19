import { api, getAuthToken } from "../lib/api";

/** POST /api/chat — público. Admite pregunta simple o historial conversacional. */
export async function preguntar(pregunta, imagen = null, mensajes = null, signal = undefined) {
  if (imagen) {
    const formData = new FormData();
    formData.append("pregunta", pregunta);
    formData.append("imagen", imagen);
    const { data } = await api.post("/api/chat", formData, {
      skipAuthHandler: true,
      signal,
    });
    return data;
  }

  const payload = Array.isArray(mensajes) && mensajes.length
    ? { mensajes }
    : { pregunta };

  const { data } = await api.post("/api/chat", payload, {
    skipAuthHandler: true,
    signal,
  });
  return data;
}

/** POST /api/chat/stream — lee deltas SSE usando fetch para poder enviar POST. */
export async function preguntarStream(payload, { signal, onDelta }) {
  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(api.getUri({ url: "/api/chat/stream" }), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data?.error || "Error");
    error.response = { status: response.status, data };
    throw error;
  }
  if (!response.body) throw new Error("No se pudo leer la respuesta en streaming.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let resultado = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separador;
      while ((separador = /\r?\n\r?\n/.exec(buffer))) {
        const bloque = buffer.slice(0, separador.index);
        buffer = buffer.slice(separador.index + separador[0].length);
        const linea = bloque.split(/\r?\n/).find((item) => item.startsWith("data: "));
        if (!linea) continue;

        const evento = JSON.parse(linea.slice(6));
        if (evento.tipo === "delta") {
          onDelta?.(evento.texto);
        } else if (evento.tipo === "fin") {
          resultado = evento;
        } else if (evento.tipo === "error") {
          const error = new Error(evento.mensaje || "Error");
          error.streamEventError = true;
          throw error;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!resultado) throw new Error("La respuesta en streaming terminó antes de finalizar.");
  return resultado;
}

/** GET /api/chat/checklist/:tramiteId — requisitos y datos para preparar la presentación. */
export async function obtenerChecklist(tramiteId) {
  const { data } = await api.get(`/api/chat/checklist/${tramiteId}`);
  return data;
}
