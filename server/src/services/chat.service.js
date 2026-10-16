import { openai } from '../config/openai.js';
import { buscarTramites } from './busqueda.service.js';
import { registrarConsulta } from './metrica.service.js';

const MODELO_CHAT = 'gpt-4o-mini';

const SYSTEM_PROMPT = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando exclusivamente el contexto para datos oficiales y la imagen solo para observaciones visuales.
Reglas estrictas:
- Para requisitos, costos, lugares y demás datos oficiales, respondé solo con la información del contexto. No inventes esos datos.
- Si el contexto no tiene la respuesta sobre un trámite, decí que no encontraste esa información y sugerí reformular.
- Si recibís una imagen, podés describir lo que se ve y señalar campos legibles, vacíos o ilegibles. Evaluá si un documento parece completo solo a partir de los campos visibles y de los requisitos incluidos en el contexto; indicá que es una orientación visual, no una certificación oficial ni legal.
- No afirmes que un documento es válido, auténtico o aceptado por un organismo.
- Sé claro, amable y conciso. Usá un lenguaje simple.
- No respondas sobre temas ajenos a los trámites.`;

export const responderConsulta = async (pregunta, imagen = null, dependencias = {}) => {
  const buscar = dependencias.buscarTramites ?? buscarTramites;
  const crearCompletion = dependencias.crearCompletion ??
    ((params) => openai.chat.completions.create(params));
  const tramites = await buscar(pregunta);

  if (tramites.length === 0 && !imagen) {
    registrarConsulta({
      textoConsulta: pregunta,
      tramiteId: null,
      encontrado: false,
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
  const textoUsuario = `Contexto:\n${contexto || 'No se encontró información de trámites relacionada con la consulta.'}\n\nPregunta del ciudadano: ${pregunta}`;
  const contenidoUsuario = imagen
    ? [
        { type: 'text', text: textoUsuario },
        {
          type: 'image_url',
          image_url: {
            url: `data:${imagen.mimetype};base64,${imagen.buffer.toString('base64')}`,
          },
        },
      ]
    : textoUsuario;

  const completion = await crearCompletion({
    model: MODELO_CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contenidoUsuario },
    ],
    temperature: 0.3,
  });

  const respuesta = completion.choices[0].message.content;

  return {
    respuesta,
    tramitesEncontrados: tramites.map((t) => ({ id: t.id, nombre: t.nombre })),
    encontrado: tramites.length > 0,
  };
};