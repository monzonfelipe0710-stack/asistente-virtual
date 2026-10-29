import { openai } from '../../config/openai.js';

const MODELO_CHAT = process.env.OPENAI_MODELO_CHAT ?? 'gpt-4o-mini';
const MODELO_EMBEDDING = process.env.OPENAI_MODELO_EMBEDDING ?? 'text-embedding-3-small';
const TEMPERATURA = Number(process.env.OPENAI_TEMPERATURA ?? 0.3);
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
  async generarEmbedding(texto) {
    const r = await openai.embeddings.create({ model: MODELO_EMBEDDING, input: texto });
    return r.data[0].embedding;
  },

  async generarRespuesta({ instruccionSistema, turnos, esquema }) {
    const completion = await openai.chat.completions.create({
      model: MODELO_CHAT,
      temperature: TEMPERATURA,
      messages: construirMensajes(instruccionSistema, turnos),
      ...(esquema && { response_format: { type: 'json_schema', json_schema: esquema } }),
    });
    return completion.choices[0].message.content;
  },

  async *generarRespuestaStream({ instruccionSistema, turnos }) {
    const stream = await openai.chat.completions.create({
      model: MODELO_CHAT,
      temperature: TEMPERATURA,
      stream: true,
      messages: construirMensajes(instruccionSistema, turnos),
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) yield delta;
    }
  },

  infoEmbedding: { modelo: MODELO_EMBEDDING, dimensiones: DIMENSIONES_EMBEDDING },
};
