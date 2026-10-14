import { openai } from '../config/openai.js';
import { buscarTramites } from './busqueda.service.js';
import { registrarConsulta } from './metrica.service.js';

const MODELO_CHAT = 'gpt-4o-mini';

const SYSTEM_PROMPT = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE la información que te paso en el contexto.
Reglas estrictas:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Si el contexto no tiene la respuesta, decí que no encontraste información sobre esa consulta y sugerí reformular.
- Sé claro, amable y conciso. Usá un lenguaje simple.
- No respondas sobre temas ajenos a los trámites.`;

export const responderConsulta = async (pregunta) => {
  const tramites = await buscarTramites(pregunta);

  if (tramites.length === 0) {

    ({ textoConsulta: pregunta, tramiteId: null, encontrado: false })
      .catch((err) => console.error('Error al registrar consulta:', err.message));

    registrarConsulta({
      textoConsulta: pregunta,
      tramiteId: tramites[0].id,
      encontrado: true,
    }).catch((err) => console.error('Error al registrar consulta:', err.message));

    return {
      respuesta: 'No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.',
      tramitesEncontrados: [],
      encontrado: false,
    };
  }

  const contexto = tramites
  .map((t, i) => `Trámite ${i + 1}: ${t.nombre}\nDescripción: ${t.descripcion}\nCosto: ${t.costo ?? 'sin costo'}`)
  .join('\n\n');

  const completion = await openai.chat.completions.create({
    model: MODELO_CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Contexto:\n${contexto}\n\nPregunta del ciudadano: ${pregunta}` }, 
    ],
    temperature: 0.3,
  });

  const respuesta = completion.choices[0].message.content;

  return {
    respuesta,
    tramitesEncontrados: tramites.map((t) => ({ id: t.id, nombre: t.nombre })),
    encontrado: true,
  };
};