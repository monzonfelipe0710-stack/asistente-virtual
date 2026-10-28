import { openai } from "../config/openai.js";
import prisma from "../config/prisma.js";
import { buscarTramites } from "./busqueda.service.js";
import { registrarConsulta } from "./metrica.service.js";
import * as cache from "./cache.service.js";

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

const SYSTEM_PROMPT_STREAM = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE la información del contexto.

Reglas de contenido:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Si preguntan qué se necesita para un trámite, listá sus requisitos de forma concisa, indicando dónde se consigue y cuánto cuesta cada uno cuando el contexto lo diga.
- Sé claro, amable y breve (máximo 4-6 oraciones; los requisitos, en lista corta).
- No respondas sobre temas ajenos a los trámites.

Formato de salida (OBLIGATORIO):
- La PRIMERA línea debe ser únicamente un objeto JSON en una sola línea, sin texto antes: {"encontrado": <true|false>, "tramitesUsados": [<ids>]}
  - "encontrado": true SOLO si algún trámite del contexto responde realmente la consulta; false si ninguno sirve (incluidos saludos o preguntas fuera de tema).
  - "tramitesUsados": los IDs (el número de "Trámite (id N)") que efectivamente usaste. Vacía si ninguno sirve.
- A partir de la SEGUNDA línea, escribí la respuesta para el ciudadano en texto plano (sin JSON ni marcadores).
- Si ningún trámite responde, poné {"encontrado": false, "tramitesUsados": []} y no escribas nada más.`;

const formatearCosto = (costo) =>
  costo == null || Number(costo) === 0 ? "sin costo" : `$${costo}`;

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

const registrarConsultaCacheada = (pregunta, cacheado, usuarioId) => {
  registrarConsulta({
    textoConsulta: pregunta,
    tramiteId: cacheado.encontrado
      ? (cacheado.tramitesEncontrados[0]?.id ?? null)
      : null,
    encontrado: cacheado.encontrado,
    usuarioId,
  }).catch((err) => console.error("Error al registrar consulta:", err.message));
};

export const responderConsulta = async (pregunta, usuarioId = null) => {
  const cacheado = cache.obtener(pregunta);
  if (cacheado) {
    registrarConsultaCacheada(pregunta, cacheado, usuarioId);
    return cacheado;
  }

  const encontrados = await buscarTramites(pregunta);
  const tramites =
    encontrados.length > 0
      ? await cargarDetalle(encontrados.map((t) => t.id))
      : [];

  if (tramites.length === 0) {
    registrarConsulta({
      textoConsulta: pregunta,
      tramiteId: null,
      encontrado: false,
      usuarioId,
    }).catch((err) =>
      console.error("Error al registrar consulta:", err.message),
    );

    const resultado = {
      respuesta: MENSAJE_SIN_RESPUESTA,
      tramitesEncontrados: [],
      encontrado: false,
    };
    cache.guardar(pregunta, resultado);
    return resultado;
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

  registrarConsulta({
    textoConsulta: pregunta,
    tramiteId: encontrado ? idsUsados[0] : null,
    encontrado,
    usuarioId,
  }).catch((err) => console.error("Error al registrar consulta:", err.message));

  const resultado = {
    respuesta: encontrado ? salida.respuesta : MENSAJE_SIN_RESPUESTA,
    tramitesEncontrados,
    encontrado,
  };
  cache.guardar(pregunta, resultado);
  return resultado;
};

const leerMeta = (linea) => {
  try {
    return JSON.parse(linea.trim());
  } catch {
    return null;
  }
};

export async function* responderConsultaStream(pregunta, usuarioId = null) {
  const cacheado = cache.obtener(pregunta);
  if (cacheado) {
    registrarConsultaCacheada(pregunta, cacheado, usuarioId);
    yield { tipo: "delta", texto: cacheado.respuesta };
    yield {
      tipo: "fin",
      encontrado: cacheado.encontrado,
      tramitesEncontrados: cacheado.tramitesEncontrados,
    };
    return;
  }

  const encontrados = await buscarTramites(pregunta);
  const tramites =
    encontrados.length > 0
      ? await cargarDetalle(encontrados.map((t) => t.id))
      : [];

  if (tramites.length === 0) {
    registrarConsulta({
      textoConsulta: pregunta,
      tramiteId: null,
      encontrado: false,
      usuarioId,
    }).catch((err) =>
      console.error("Error al registrar consulta:", err.message),
    );
    cache.guardar(pregunta, {
      respuesta: MENSAJE_SIN_RESPUESTA,
      tramitesEncontrados: [],
      encontrado: false,
    });
    yield { tipo: "delta", texto: MENSAJE_SIN_RESPUESTA };
    yield { tipo: "fin", encontrado: false, tramitesEncontrados: [] };
    return;
  }

  const contexto = tramites.map(formatearTramite).join("\n\n");
  const idsDelContexto = new Set(tramites.map((t) => t.id));

  const stream = await openai.chat.completions.create({
    model: MODELO_CHAT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_STREAM },
      {
        role: "user",
        content: `Contexto:\n${contexto}\n\nPregunta del ciudadano: ${pregunta}`,
      },
    ],
    temperature: 0.3,
    stream: true,
  });

  let buffer = "";
  let meta = null;
  let fullAnswer = "";
  let respuestaIniciada = false;

  for await (const chunk of stream) {
    let delta = chunk.choices[0]?.delta?.content ?? "";
    if (!delta) continue;

    // Primero juntamos y parseamos la línea META; recién después streameamos la respuesta.
    if (meta === null) {
      buffer += delta;
      const nl = buffer.indexOf("\n");
      if (nl === -1) continue;

      const parsed = leerMeta(buffer.slice(0, nl));
      const idsUsados = (parsed?.tramitesUsados ?? []).filter((id) =>
        idsDelContexto.has(id),
      );
      meta = {
        valida: parsed !== null,
        encontrado: parsed?.encontrado === true && idsUsados.length > 0,
        idsUsados,
      };

      if (!meta.encontrado) break;

      delta = buffer.slice(nl + 1);
    }

    const texto = respuestaIniciada ? delta : delta.trimStart();
    if (!texto) continue;
    respuestaIniciada = true;
    fullAnswer += texto;
    yield { tipo: "delta", texto };
  }

  const encontrado = meta?.encontrado === true;
  const idsUsados = meta?.idsUsados ?? [];
  const tramitesEncontrados = encontrado
    ? idsUsados.map((id) => {
        const t = tramites.find((x) => x.id === id);
        return { id, nombre: t.nombre };
      })
    : [];

  const metaValida = meta ? meta.valida : leerMeta(buffer) !== null;
  if (metaValida) {
    cache.guardar(pregunta, {
      respuesta: encontrado ? fullAnswer.trim() : MENSAJE_SIN_RESPUESTA,
      tramitesEncontrados,
      encontrado,
    });
  }

  registrarConsulta({
    textoConsulta: pregunta,
    tramiteId: encontrado ? idsUsados[0] : null,
    encontrado,
    usuarioId,
  }).catch((err) => console.error("Error al registrar consulta:", err.message));

  if (!encontrado) {
    yield { tipo: "delta", texto: MENSAJE_SIN_RESPUESTA };
  }
  yield { tipo: "fin", encontrado, tramitesEncontrados };
}
