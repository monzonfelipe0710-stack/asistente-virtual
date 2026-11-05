import { openai } from '../../config/openai.js';
import { TIEMPOS_IA } from '../../config/ia.js';
import { combinarSenales } from '../../utils/plazo.js';
import { ErrorProveedorIA } from './errores.js';

const MODELO_CHAT = process.env.OPENAI_MODELO_CHAT ?? 'gpt-4o-mini';
const TEMPERATURA = Number(process.env.OPENAI_TEMPERATURA ?? 0.3);

// El modelo de embeddings queda fijo: cambiarlo invalida los vectores ya guardados
// (otro espacio vectorial) y rompe la búsqueda sin dar error. Se cambia solo con una
// migración + re-embeddear todo, no por configuración.
const MODELO_EMBEDDING = 'text-embedding-3-small';
const DIMENSIONES_EMBEDDING = 1536;

const construirMensajes = (instruccionSistema, turnos) => [
  { role: 'system', content: instruccionSistema },
  ...turnos.map((t) => ({
    role: t.rol === 'usuario' ? 'user' : 'assistant',
    content: t.texto,
  })),
];

/** @type {import('./proveedor.js').ProveedorIA} */
export const openaiAdapter = {
  async generarEmbedding(texto, { signal } = {}) {
    const r = await openai.embeddings.create(
      { model: MODELO_EMBEDDING, input: texto },
      { ...TIEMPOS_IA.embedding, signal },
    );
    return r.data[0].embedding;
  },

  async generarRespuesta({ instruccionSistema, turnos, esquema, signal }) {
    const completion = await openai.chat.completions.create(
      {
        model: MODELO_CHAT,
        temperature: TEMPERATURA,
        messages: construirMensajes(instruccionSistema, turnos),
        ...(esquema && { response_format: { type: 'json_schema', json_schema: esquema } }),
      },
      { ...TIEMPOS_IA.chat, signal },
    );
    return completion.choices[0].message.content;
  },

  // El SDK termina el stream sin error si se corta sin [DONE] o si se lo aborta: por eso un abort
  // propio se relanza con su motivo y sin finish_reason "stop" la respuesta se da por incompleta.
  async *generarRespuestaStream({ instruccionSistema, turnos, signal }) {
    const inactividad = new AbortController();
    const senal = combinarSenales(signal, inactividad.signal);
    let temporizador;
    const rearmar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(
        () => inactividad.abort(new ErrorProveedorIA('stream inactivo', { operacion: 'chat_stream' })),
        TIEMPOS_IA.inactividadStream,
      );
    };

    let finishReason = null;
    try {
      const stream = await openai.chat.completions.create(
        {
          model: MODELO_CHAT,
          temperature: TEMPERATURA,
          stream: true,
          messages: construirMensajes(instruccionSistema, turnos),
        },
        { ...TIEMPOS_IA.chat, signal: senal },
      );
      rearmar();
      for await (const chunk of stream) {
        rearmar();
        const opcion = chunk.choices[0];
        finishReason = opcion?.finish_reason ?? finishReason;
        const delta = opcion?.delta?.content ?? '';
        if (delta) yield delta;
      }
    } catch (err) {
      if (senal.aborted) throw senal.reason;
      throw err;
    } finally {
      clearTimeout(temporizador);
    }

    if (senal.aborted) throw senal.reason;
    if (finishReason !== 'stop') {
      throw new ErrorProveedorIA(`respuesta incompleta (finish_reason: ${finishReason ?? 'ninguno'})`, { operacion: 'chat_stream' });
    }
  },

  infoEmbedding: { modelo: MODELO_EMBEDDING, dimensiones: DIMENSIONES_EMBEDDING },
};
