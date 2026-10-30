import { ia } from "../core/ai/index.js";
import prisma from "../config/prisma.js";
import { buscarTramites } from "./busqueda.service.js";
import { registrarConsulta } from "./metrica.service.js";
import * as cache from "./cache.service.js";

const MENSAJE_SIN_RESPUESTA =
  "No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.";

const SYSTEM_PROMPT_MULTIVUELTA = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE los trámites candidatos del contexto.

Podés hacer dos cosas:
1) RESPONDER: si queda claro a qué trámite se refiere la persona, respondé con la info del contexto.
2) PEDIR ACLARACIÓN: solo si dos o más trámites DISTINTOS del contexto corresponden a lo que pide la persona y no podés determinar cuál quiere (ej. "certificado" → de antecedentes, de residencia, de nacimiento). Hacé UNA pregunta corta para que elija.

Reglas:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Un candidato "corresponde" solo si es lo que la persona pide. Si NINGÚN candidato corresponde, no pidas aclaración: devolvé tipo:"respuesta" con encontrado:false (ej.: piden "licencia de conducir" y los candidatos son licencias de pesca o laborales → ninguno corresponde → encontrado:false).
- Cuando pidas aclaración, ofrecé TODOS los candidatos que corresponden, aunque sean de temas distintos entre sí y aunque uno sea más general que otro. No dejes afuera un candidato que corresponde.
- No descartes un candidato porque su nombre mencione variantes o modalidades (ej. "ordinaria, extraordinaria").
- No dividas un mismo trámite en sub-opciones, ni inventes opciones que no estén entre los candidatos. Si hay un único candidato claro, respondé directo.
- En el texto para el ciudadano nombrá los trámites por su nombre; NUNCA muestres los ids. Los ids van solo en "tramitesUsados" y "opciones".
- Si listás requisitos, hacelo conciso, con dónde se consigue y cuánto cuesta cuando el contexto lo diga.
- Sé claro, amable y breve. Lenguaje simple (el público incluye adultos mayores).
- Usá siempre voseo rioplatense (tenés, podés, acercate, fijate), nunca tuteo (tienes, debes, acércate).
- Escribí en texto plano, sin markdown: nada de negritas, asteriscos (*), viñetas ni almohadillas (#).
- No respondas sobre temas ajenos a los trámites.

Formato de salida (JSON):
- "tipo": "respuesta" o "aclaracion".
- "respuesta": el texto para el ciudadano (la respuesta, o la pregunta aclaratoria si tipo=aclaracion).
- "encontrado": true SOLO si tipo=respuesta y algún trámite del contexto responde realmente; false en cualquier otro caso.
- "tramitesUsados": IDs de los trámites que usaste para responder (vacío si no respondiste).
- "opciones": IDs de los trámites candidatos que ofrecés como opción (solo si tipo=aclaracion; vacío si tipo=respuesta).`;

const INSTRUCCION_TOPE = `
IMPORTANTE: ya se pidió aclaración el máximo de veces, así que en este turno "tipo" DEBE ser "respuesta" (no vuelvas a pedir aclaración). Si podés identificar el trámite, respondé con ese. Si varios candidatos siguen siendo posibles, NO mandes a la persona a la mesa de entrada: respondé igual describiendo brevemente cada uno de esos candidatos para que pueda elegir, con sus IDs en "tramitesUsados" y "encontrado": true. Nunca devuelvas "encontrado": true con "tramitesUsados" vacío: ahí van los IDs de TODOS los candidatos que vas a describir (si el formato te pide escribirlos antes que el texto, como en la primera línea, decidilos primero). Sugerí consultar en una mesa de entrada solo si ningún candidato del contexto corresponde.`;

const SYSTEM_PROMPT_STREAM_MULTIVUELTA = `
Sos el asistente virtual de la administración pública de Formosa.
Tu única función es informar sobre trámites, usando EXCLUSIVAMENTE los trámites candidatos del contexto.

Podés hacer dos cosas:
1) RESPONDER: si queda claro a qué trámite se refiere la persona, respondé con la info del contexto.
2) PEDIR ACLARACIÓN: solo si dos o más trámites DISTINTOS del contexto corresponden a lo que pide la persona y no podés determinar cuál quiere (ej. "certificado" → de antecedentes, de residencia, de nacimiento). Hacé UNA pregunta corta para que elija.

Reglas:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Un candidato "corresponde" solo si es lo que la persona pide. Si NINGÚN candidato corresponde, no pidas aclaración: usá tipo:"respuesta" con encontrado:false.
- Cuando pidas aclaración, ofrecé TODOS los candidatos que corresponden, aunque sean de temas distintos entre sí y aunque uno sea más general que otro. No dejes afuera un candidato que corresponde.
- No descartes un candidato porque su nombre mencione variantes o modalidades (ej. "ordinaria, extraordinaria").
- No dividas un mismo trámite en sub-opciones, ni inventes opciones que no estén entre los candidatos. Si hay un único candidato claro, respondé directo.
- En el texto para el ciudadano nombrá los trámites por su nombre; NUNCA muestres los ids.
- Si listás requisitos, hacelo conciso, con dónde se consigue y cuánto cuesta cuando el contexto lo diga.
- Sé claro, amable y breve (máximo 4-6 oraciones; los requisitos, en lista corta). Lenguaje simple (el público incluye adultos mayores).
- Usá siempre voseo rioplatense (tenés, podés, acercate, fijate), nunca tuteo (tienes, debes, acércate).
- Escribí en texto plano, sin markdown: nada de negritas, asteriscos (*), viñetas ni almohadillas (#).
- No respondas sobre temas ajenos a los trámites.

Formato de salida (OBLIGATORIO):
- La PRIMERA línea debe ser únicamente un objeto JSON en una sola línea, sin texto antes: {"tipo": "<respuesta|aclaracion>", "encontrado": <true|false>, "tramitesUsados": [<ids>], "opciones": [<ids>]}
  - "tipo": "aclaracion" si pedís que elija entre varios trámites; "respuesta" en cualquier otro caso.
  - "encontrado": true SOLO si tipo=respuesta y algún trámite del contexto responde realmente; false en cualquier otro caso (incluida una aclaracion, saludos o temas fuera de tema).
  - "tramitesUsados": los IDs (el número de "Trámite (id N)") que usaste para responder. Vacío si no respondiste.
  - "opciones": los IDs de los trámites que ofrecés como opción. Solo si tipo=aclaracion; vacío si tipo=respuesta.
- A partir de la SEGUNDA línea, escribí en texto plano (sin JSON ni marcadores) la respuesta para el ciudadano, o la pregunta aclaratoria si tipo=aclaracion.
- Si ningún trámite responde, poné {"tipo": "respuesta", "encontrado": false, "tramitesUsados": [], "opciones": []} y no escribas nada más.`;

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

// Si falla el registro la respuesta igual sale, con consultaId null.
const registrar = async (datos) => {
  try {
    const consulta = await registrarConsulta(datos);
    return consulta.id;
  } catch (err) {
    console.error("Error al registrar consulta:", err.message);
    return null;
  }
};

const registrarConsultaCacheada = (pregunta, cacheado, usuarioId) =>
  registrar({
    textoConsulta: pregunta,
    tramiteId: cacheado.encontrado
      ? (cacheado.tramitesEncontrados[0]?.id ?? null)
      : null,
    encontrado: cacheado.encontrado,
    usuarioId,
  });

export const responderConsulta = async (mensajes, usuarioId = null) => {
  const esUnTurno = mensajes.length === 1;
  const preguntaActual = mensajes[mensajes.length - 1].texto;

  // Caché solo para un solo turno (las conversaciones dependen del contexto).
  if (esUnTurno) {
    const cacheado = cache.obtener(preguntaActual);
    if (cacheado) {
      const consultaId = await registrarConsultaCacheada(preguntaActual, cacheado, usuarioId);
      // Las entradas que guarda el streaming no traen tipo ni opciones.
      return { tipo: "respuesta", opciones: [], ...cacheado, consultaId };
    }
  }

  // La búsqueda usa el contexto acumulado (junta los turnos del usuario).
  const consultaBusqueda = mensajes
    .filter((m) => m.rol === "usuario")
    .map((m) => m.texto)
    .join(" ");
  const encontrados = await buscarTramites(consultaBusqueda);
  const tramites =
    encontrados.length > 0
      ? await cargarDetalle(encontrados.map((t) => t.id))
      : [];

  if (tramites.length === 0) {
    const consultaId = await registrar({
      textoConsulta: preguntaActual,
      tramiteId: null,
      encontrado: false,
      usuarioId,
    });

    const resultado = {
      tipo: "respuesta",
      respuesta: MENSAJE_SIN_RESPUESTA,
      tramitesEncontrados: [],
      encontrado: false,
      opciones: [],
    };
    if (esUnTurno) cache.guardar(preguntaActual, resultado);
    return { ...resultado, consultaId };
  }

  const contexto = tramites.map(formatearTramite).join("\n\n");
  const idsDelContexto = new Set(tramites.map((t) => t.id));

  // Tope: contamos las aclaraciones previas (turnos del asistente).
  const topeAlcanzado =
    mensajes.filter((m) => m.rol === "asistente").length >= 2;
  const system = topeAlcanzado
    ? `${SYSTEM_PROMPT_MULTIVUELTA}\n${INSTRUCCION_TOPE}`
    : SYSTEM_PROMPT_MULTIVUELTA;

  const salidaRaw = await ia.generarRespuesta({
    instruccionSistema: `${system}\n\nContexto (trámites candidatos):\n${contexto}`,
    turnos: mensajes,
    esquema: {
      name: "respuesta_chat",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          tipo: { type: "string", enum: ["respuesta", "aclaracion"] },
          respuesta: { type: "string" },
          encontrado: { type: "boolean" },
          tramitesUsados: { type: "array", items: { type: "integer" } },
          opciones: { type: "array", items: { type: "integer" } },
        },
        required: ["tipo", "respuesta", "encontrado", "tramitesUsados", "opciones"],
      },
    },
  });

  const salida = JSON.parse(salidaRaw);

  // ACLARACIÓN (solo si no llegamos al tope).
  if (salida.tipo === "aclaracion" && !topeAlcanzado) {
    const opciones = (salida.opciones ?? [])
      .filter((id) => idsDelContexto.has(id))
      .map((id) => {
        const t = tramites.find((x) => x.id === id);
        return { id, nombre: t.nombre };
      });
    // No registramos consulta: una aclaración no es una consulta resuelta.
    return {
      tipo: "aclaracion",
      respuesta: salida.respuesta,
      opciones,
      encontrado: false,
      tramitesEncontrados: [],
      consultaId: null,
    };
  }

  // RESPUESTA.
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

  const consultaId = await registrar({
    textoConsulta: preguntaActual,
    tramiteId: encontrado ? idsUsados[0] : null,
    encontrado,
    usuarioId,
  });

  const resultado = {
    tipo: "respuesta",
    respuesta: encontrado ? salida.respuesta : MENSAJE_SIN_RESPUESTA,
    tramitesEncontrados,
    encontrado,
    opciones: [],
  };
  if (esUnTurno) cache.guardar(preguntaActual, resultado);
  return { ...resultado, consultaId };
};

const leerMeta = (linea) => {
  try {
    return JSON.parse(linea.trim());
  } catch {
    return null;
  }
};

export async function* responderConsultaStream(mensajes, usuarioId = null) {
  const esUnTurno = mensajes.length === 1;
  const preguntaActual = mensajes[mensajes.length - 1].texto;

  if (esUnTurno) {
    const cacheado = cache.obtener(preguntaActual);
    if (cacheado) {
      const consultaId = await registrarConsultaCacheada(preguntaActual, cacheado, usuarioId);
      yield { tipo: "delta", texto: cacheado.respuesta };
      yield {
        tipo: "fin",
        tipoRespuesta: "respuesta",
        encontrado: cacheado.encontrado,
        tramitesEncontrados: cacheado.tramitesEncontrados,
        opciones: [],
        consultaId,
      };
      return;
    }
  }

  const consultaBusqueda = mensajes
    .filter((m) => m.rol === "usuario")
    .map((m) => m.texto)
    .join(" ");
  const encontrados = await buscarTramites(consultaBusqueda);
  const tramites =
    encontrados.length > 0
      ? await cargarDetalle(encontrados.map((t) => t.id))
      : [];

  if (tramites.length === 0) {
    const consultaId = await registrar({
      textoConsulta: preguntaActual,
      tramiteId: null,
      encontrado: false,
      usuarioId,
    });
    if (esUnTurno) {
      cache.guardar(preguntaActual, {
        respuesta: MENSAJE_SIN_RESPUESTA,
        tramitesEncontrados: [],
        encontrado: false,
      });
    }
    yield { tipo: "delta", texto: MENSAJE_SIN_RESPUESTA };
    yield {
      tipo: "fin",
      tipoRespuesta: "respuesta",
      encontrado: false,
      tramitesEncontrados: [],
      opciones: [],
      consultaId,
    };
    return;
  }

  const contexto = tramites.map(formatearTramite).join("\n\n");
  const idsDelContexto = new Set(tramites.map((t) => t.id));

  const topeAlcanzado =
    mensajes.filter((m) => m.rol === "asistente").length >= 2;
  const system = topeAlcanzado
    ? `${SYSTEM_PROMPT_STREAM_MULTIVUELTA}\n${INSTRUCCION_TOPE}`
    : SYSTEM_PROMPT_STREAM_MULTIVUELTA;

  const deltas = ia.generarRespuestaStream({
    instruccionSistema: `${system}\n\nContexto (trámites candidatos):\n${contexto}`,
    turnos: mensajes,
  });

  let buffer = "";
  let meta = null;
  let fullAnswer = "";
  let respuestaIniciada = false;

  for await (let delta of deltas) {
    if (!delta) continue;

    if (meta === null) {
      buffer += delta;
      const nl = buffer.indexOf("\n");
      if (nl === -1) continue;

      const parsed = leerMeta(buffer.slice(0, nl));
      const idsUsados = (parsed?.tramitesUsados ?? []).filter((id) =>
        idsDelContexto.has(id),
      );
      const esAclaracion = parsed?.tipo === "aclaracion" && !topeAlcanzado;
      const opciones = esAclaracion
        ? (parsed?.opciones ?? [])
            .filter((id) => idsDelContexto.has(id))
            .map((id) => {
              const t = tramites.find((x) => x.id === id);
              return { id, nombre: t.nombre };
            })
        : [];

      meta = {
        valida: parsed !== null,
        tipo: esAclaracion ? "aclaracion" : "respuesta",
        encontrado:
          !esAclaracion && parsed?.encontrado === true && idsUsados.length > 0,
        idsUsados,
        opciones,
      };

      if (meta.tipo === "respuesta" && !meta.encontrado) break;

      delta = buffer.slice(nl + 1);
    }

    const texto = respuestaIniciada ? delta : delta.trimStart();
    if (!texto) continue;
    respuestaIniciada = true;
    fullAnswer += texto;
    yield { tipo: "delta", texto };
  }

  const esAclaracion = meta?.tipo === "aclaracion";
  const encontrado = meta?.encontrado === true;
  const idsUsados = meta?.idsUsados ?? [];
  const opciones = meta?.opciones ?? [];
  const tramitesEncontrados = encontrado
    ? idsUsados.map((id) => {
        const t = tramites.find((x) => x.id === id);
        return { id, nombre: t.nombre };
      })
    : [];

  let consultaId = null;
  if (!esAclaracion) {
    const metaValida = meta ? meta.valida : leerMeta(buffer) !== null;
    if (esUnTurno && metaValida) {
      cache.guardar(preguntaActual, {
        respuesta: encontrado ? fullAnswer.trim() : MENSAJE_SIN_RESPUESTA,
        tramitesEncontrados,
        encontrado,
      });
    }
    consultaId = await registrar({
      textoConsulta: preguntaActual,
      tramiteId: encontrado ? idsUsados[0] : null,
      encontrado,
      usuarioId,
    });
    if (!encontrado) {
      yield { tipo: "delta", texto: MENSAJE_SIN_RESPUESTA };
    }
  }

  yield {
    tipo: "fin",
    tipoRespuesta: esAclaracion ? "aclaracion" : "respuesta",
    encontrado: esAclaracion ? false : encontrado,
    tramitesEncontrados,
    opciones,
    consultaId,
  };
}
