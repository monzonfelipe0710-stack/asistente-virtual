import { openai } from '../config/openai.js';
import prisma from '../config/prisma.js';
import { buscarTramites } from './busqueda.service.js';
import { registrarConsulta } from './metrica.service.js';

const MODELO_CHAT = 'gpt-4o-mini';

const SYSTEM_PROMPT = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE la información que te paso en el contexto.
Reglas estrictas:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Si preguntan qué se necesita para un trámite, listá TODOS sus requisitos, indicando dónde se consigue y cuánto cuesta cada uno cuando el contexto lo diga.
- Si el contexto indica dónde se presenta el trámite o qué formularios tiene para descargar, mencionalo cuando sea útil para la consulta.
- Si el contexto no tiene la respuesta, decí que no encontraste información sobre esa consulta y sugerí reformular.
- Sé claro, amable y conciso. Usá un lenguaje simple.
- No respondas sobre temas ajenos a los trámites.`;

// Los costos llegan como Decimal de Prisma; null y 0 se informan igual.
const formatearCosto = (costo) =>
  costo == null || Number(costo) === 0 ? 'sin costo' : `$${costo}`;

const formatearTramite = (t, i) => {
  const lineas = [
    `Trámite ${i + 1}: ${t.nombre}`,
    `Descripción: ${t.descripcion}`,
    `Costo: ${formatearCosto(t.costo)}`,
  ];

  if (t.requisitos.length > 0) {
    lineas.push('Requisitos:');
    for (const r of t.requisitos) {
      const extra = [
        r.dondeSeConsigue && `se consigue en ${r.dondeSeConsigue}`,
        r.costo != null && Number(r.costo) > 0 && `costo $${r.costo}`,
      ].filter(Boolean).join(', ');
      lineas.push(`- ${r.descripcion}${extra ? ` (${extra})` : ''}`);
    }
  }

  if (t.mesas.length > 0) {
    lineas.push('Dónde se presenta:');
    for (const { mesa } of t.mesas) {
      lineas.push(`- ${[mesa.nombre, mesa.direccion, mesa.localidad].filter(Boolean).join(', ')}`);
    }
  }

  if (t.documentos.length > 0) {
    lineas.push(`Formularios descargables: ${t.documentos.map((d) => d.nombre).join(', ')}`);
  }

  return lineas.join('\n');
};

// La búsqueda solo devuelve los campos que necesita para rankear. Para el contexto
// del modelo se cargan los trámites completos, conservando el orden del ranking.
const cargarDetalle = async (ids) => {
  const completos = await prisma.tramite.findMany({
    where: { id: { in: ids } },
    include: {
      requisitos: { orderBy: { id: 'asc' } },
      mesas: { include: { mesa: true } },
      documentos: { select: { nombre: true } },
    },
  });

  const porId = new Map(completos.map((t) => [t.id, t]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
};

export const responderConsulta = async (pregunta) => {
  const encontrados = await buscarTramites(pregunta);
  // filter(Boolean) en cargarDetalle cubre un trámite borrado entre la búsqueda y la carga.
  const tramites = encontrados.length > 0 ? await cargarDetalle(encontrados.map((t) => t.id)) : [];

  if (tramites.length === 0) {
    registrarConsulta({ textoConsulta: pregunta, tramiteId: null, encontrado: false })
      .catch((err) => console.error('Error al registrar consulta:', err.message));

    return {
      respuesta: 'No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.',
      tramitesEncontrados: [],
      encontrado: false,
    };
  }

  const contexto = tramites.map(formatearTramite).join('\n\n');

  const completion = await openai.chat.completions.create({
    model: MODELO_CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Contexto:\n${contexto}\n\nPregunta del ciudadano: ${pregunta}` },
    ],
    temperature: 0.3,
  });

  const respuesta = completion.choices[0].message.content;

  // Se atribuye la consulta al trámite mejor rankeado.
  registrarConsulta({
    textoConsulta: pregunta,
    tramiteId: tramites[0].id,
    encontrado: true,
  }).catch((err) => console.error('Error al registrar consulta:', err.message));

  return {
    respuesta,
    tramitesEncontrados: tramites.map((t) => ({ id: t.id, nombre: t.nombre })),
    encontrado: true,
  };
};
