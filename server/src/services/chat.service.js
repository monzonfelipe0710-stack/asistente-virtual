import { openai } from "../config/openai.js";
import prisma from "../config/prisma.js";
import { buscarTramites } from "./busqueda.service.js";
import { registrarConsulta, contarConsultasDeUsuario } from "./metrica.service.js";

const MODELO_CHAT = "gpt-4o-mini";

const MENSAJE_SIN_RESPUESTA =
  "No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.";

const SYSTEM_PROMPT = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE la información que te paso en el contexto.

Reglas de contenido:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Si preguntan qué se necesita para un trámite, listá TODOS sus requisitos, indicando dónde se consigue y cuánto cuesta cada uno cuando el contexto lo diga.
- Si el contexto indica dónde se presenta el trámite o qué formularios tiene para descargar, mencionalo cuando sea útil para la consulta.
- Sé claro, amable y conciso. Usá un lenguaje simple.
- No respondas sobre temas ajenos a los trámites.

Formato de salida (obligatorio): devolvés un objeto JSON con estos campos:
- "respuesta": el texto para el ciudadano.
- "encontrado": true SOLO si algún trámite del contexto responde realmente la consulta; false si ninguno sirve (incluidos saludos o preguntas fuera de tema).
- "tramitesUsados": lista con los IDs (el número que aparece como "Trámite (id N)") de los trámites del contexto que efectivamente usaste para responder. Vacía si ninguno sirve.

Si ningún trámite del contexto responde la consulta, poné "encontrado": false, "tramitesUsados": [] y en "respuesta" indicá que no encontraste información y sugerí reformular o consultar en una mesa de entrada.`;

const formatearCosto = (costo) =>
  costo == null || Number(costo) === 0 ? "sin costo" : `${costo}`;

const describirImagen = async (pregunta, imagen) => {
  if (!imagen) return '';

  const completion = await openai.chat.completions.create({
    model: MODELO_CHAT,
    messages: [
      {
        role: 'system',
        content: 'Describí brevemente la imagen y transcribí el texto visible que pueda ayudar a identificar un trámite público. No respondas la consulta, no inventes texto ilegible y no agregues información que no esté en la imagen.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Pregunta del ciudadano: ${pregunta}` },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imagen.mimetype};base64,${imagen.buffer.toString('base64')}`,
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 350,
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
};

const registrarConsultaSeguro = async (datos) => {
  try {
    return await registrarConsulta(datos);
  } catch (err) {
    console.error('Error al registrar consulta:', err.message);
    return null;
  }
};

const formatearTramite = (t) => {
  const lineas = [
    `Trámite (id ${t.id}): ${t.nombre}`,
    `Descripción: ${t.descripcion}`,
    `Costo: ${formatearCosto(t.costo)}`,
  ];

  if (t.requisitos.length > 0) {
    lineas.push("Requisitos:");
    for (const r of t.requisitos) {
      const extra = [
        r.dondeSeConsigue && `se consigue en ${r.dondeSeConsigue}`,
        r.costo != null && Number(r.costo) > 0 && `costo $${r.costo}`,
      ]
        .filter(Boolean)
        .join(", ");
      lineas.push(`- ${r.descripcion}${extra ? ` (${extra})` : ""}`);
    }
  }

  if (t.mesas.length > 0) {
    lineas.push("Dónde se presenta:");
    for (const { mesa } of t.mesas) {
      lineas.push(
        `- ${[mesa.nombre, mesa.direccion, mesa.localidad].filter(Boolean).join(", ")}`,
      );
    }
  }

  if (t.documentos.length > 0) {
    lineas.push(
      `Formularios descargables: ${t.documentos.map((d) => d.nombre).join(", ")}`,
    );
  }

  return lineas.join("\n");
};

const cargarDetalle = async (ids) => {
  const completos = await prisma.tramite.findMany({
    where: { id: { in: ids } },
    include: {
      requisitos: { orderBy: { id: "asc" } },
      mesas: { include: { mesa: true } },
      documentos: { select: { nombre: true } },
    },
  });

  const porId = new Map(completos.map((t) => [t.id, t]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
};

export const responderConsulta = async (pregunta, usuarioId = null, imagen = null) => {
  // Verificar límite de 4 consultas para usuarios autenticados
  if (usuarioId) {
    const consultasCount = await contarConsultasDeUsuario(usuarioId);
    if (consultasCount >= 4) {
      const error = new Error("Has alcanzado el límite de 4 consultas. Elimina alguna consulta del historial para poder hacer más.");
      error.statusCode = 429;
      throw error;
    }
  }

  const descripcionImagen = await describirImagen(pregunta, imagen);
  const preguntaBusqueda = descripcionImagen
    ? `${pregunta}\nInformación visible en la imagen: ${descripcionImagen}`
    : pregunta;

  const encontrados = await buscarTramites(preguntaBusqueda);
  const tramites =
    encontrados.length > 0
      ? await cargarDetalle(encontrados.map((t) => t.id))
      : [];

  if (tramites.length === 0) {
    const consulta = await registrarConsultaSeguro({
      textoConsulta: pregunta,
      tramiteId: null,
      encontrado: false,
      usuarioId,
    });

    return {
      respuesta: MENSAJE_SIN_RESPUESTA,
      tramitesEncontrados: [],
      encontrado: false,
      consultaId: consulta?.id ?? null,
      consultaFecha: consulta?.fecha ?? null,
    };
  }

  const contexto = tramites.map(formatearTramite).join("\n\n");

  const completion = await openai.chat.completions.create({
    model: MODELO_CHAT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Contexto:\n${contexto}\n\nPregunta del ciudadano: ${pregunta}`,
      },
    ],
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "respuesta_tramite",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            respuesta: { type: "string" },
            encontrado: { type: "boolean" },
            tramitesUsados: { type: "array", items: { type: "integer" } },
          },
          required: ["respuesta", "encontrado", "tramitesUsados"],
        },
      },
    },
  });

  const salida = JSON.parse(completion.choices[0].message.content);

  const idsDelContexto = new Set(tramites.map((t) => t.id));
  const idsUsados = (salida.tramitesUsados ?? []).filter((id) =>
    idsDelContexto.has(id),
  );
  const encontrado = salida.encontrado === true && idsUsados.length > 0;

  const tramitesEncontrados = encontrado
    ? idsUsados.map((id) => {
        const t = tramites.find((x) => x.id === id);
        return { id, nombre: t.nombre };
      })
    : [];

  const consulta = await registrarConsultaSeguro({
    textoConsulta: pregunta,
    tramiteId: encontrado ? idsUsados[0] : null,
    encontrado,
    usuarioId,
  });

  return {
    respuesta: encontrado ? salida.respuesta : MENSAJE_SIN_RESPUESTA,
    tramitesEncontrados,
    encontrado,
    consultaId: consulta?.id ?? null,
    consultaFecha: consulta?.fecha ?? null,
  };
};
