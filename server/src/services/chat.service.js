import { ia } from "../core/ai/index.js";
import prisma from "../config/prisma.js";
import { buscarTramites } from "./busqueda.service.js";
import { registrarConsulta } from "./metrica.service.js";
import { obtenerResumenCatalogo } from "./catalogo.service.js";
import * as cache from "./cache.service.js";
import { primerNombre } from "../utils/nombres.js";
import { componerSaludo, largoParaDetectarSaludo, quitarSaludoRepetido, sanitizarSaludo } from "../utils/saludo.js";

export const MENSAJE_SIN_RESPUESTA =
  "No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.";

// Por si el modelo marca conversación pero no escribe nada.
const MENSAJE_CONVERSACION_VACIA = "¿En qué trámite te puedo ayudar?";

export const TOPE_CONVERSACION = 600;

// Las reglas son las mismas para las dos rutas; solo cambia el formato de salida.
const ROL_Y_REGLAS = `
Sos el asistente virtual de la administración pública de Formosa.
Tu función es informar sobre trámites, usando EXCLUSIVAMENTE los trámites candidatos del contexto.

Podés hacer tres cosas:
1) RESPONDER (tipo "respuesta"): si queda claro a qué trámite se refiere la persona, respondé con la info del contexto.
2) PEDIR ACLARACIÓN (tipo "aclaracion"): solo si dos o más trámites DISTINTOS del contexto corresponden a lo que pide la persona y no podés determinar cuál quiere (ej. "certificado" → de antecedentes, de residencia, de nacimiento). Hacé UNA pregunta corta para que elija.
3) CONVERSAR (tipo "conversacion"): si el mensaje NO pide un trámite. Es conversación un saludo, un agradecimiento o una despedida; una pregunta sobre vos ("quién sos", "qué podés hacer"); una pregunta general sobre el catálogo ("qué trámites hay", "qué trámites puedo hacer"); o un tema ajeno a los trámites. Contestá en pocas oraciones e invitá a preguntar por un trámite.

Reglas:
- Respondé solo con la información del contexto. No inventes datos, costos, requisitos ni lugares.
- Un candidato "corresponde" solo si ES el trámite que la persona pide, o una forma o variante del MISMO trámite. Un trámite parecido pero de otra cosa NO corresponde, aunque sea de la misma familia (una licencia por maternidad no corresponde a un pedido de licencia por paternidad; una licencia de pesca no corresponde a una licencia de conducir). Si la persona pide algo específico y ningún candidato es ese trámite, NO ofrezcas los parecidos como aclaración: devolvé tipo "respuesta" con encontrado false.
- Si la persona pide un trámite (aunque no exista en el contexto), el tipo es "respuesta" o "aclaracion", nunca "conversacion".
- Los candidatos los trae una búsqueda automática que casi siempre devuelve algunos, aunque no tengan nada que ver con el mensaje. Si el mensaje no pide un trámite (saludo, gracias, despedida, pregunta sobre vos o sobre el catálogo, tema ajeno), ignorá los candidatos y respondé tipo "conversacion". Si no hay candidatos ("ninguno") y la persona pide un trámite, respondé tipo "respuesta" con encontrado false.
- Para una pregunta general sobre el catálogo ("qué trámites hay", "qué trámites puedo hacer"), respondé tipo "conversacion" con los datos del RESUMEN DEL CATÁLOGO (cuántos trámites hay, algunos sectores y algunos ejemplos) e invitá a preguntar por un trámite concreto.
- PROHIBIDO nombrar trámites que no estén en el RESUMEN DEL CATÁLOGO o entre los candidatos, y sectores que no estén en el resumen.
- Cuando pidas aclaración, ofrecé TODOS los candidatos que corresponden, aunque sean de temas distintos entre sí y aunque uno sea más general que otro. No dejes afuera un candidato que corresponde.
- No descartes un candidato porque su nombre mencione variantes o modalidades (ej. "ordinaria, extraordinaria").
- No dividas un mismo trámite en sub-opciones, ni inventes opciones que no estén entre los candidatos. Si hay un único candidato claro, respondé directo.
- En el texto para el ciudadano nombrá los trámites por su nombre; NUNCA muestres los ids.
- No empieces el texto con un saludo ni con el nombre de la persona: el saludo lo agrega el sistema a partir del campo "saludo". Tampoco inventes ni preguntes el nombre.
- Si listás requisitos, hacelo conciso, con dónde se consigue y cuánto cuesta cuando el contexto lo diga.
- Sé claro, amable y breve (máximo 4-6 oraciones; los requisitos, en lista corta). Lenguaje simple (el público incluye adultos mayores).
- Usá siempre voseo rioplatense (tenés, podés, acercate, fijate), nunca tuteo (tienes, debes, acércate).
- Escribí en texto plano, sin markdown: nada de negritas, asteriscos (*), viñetas ni almohadillas (#).
- No respondas sobre temas ajenos a los trámites.`;

const SYSTEM_PROMPT_MULTIVUELTA = `${ROL_Y_REGLAS}

Formato de salida (JSON):
- "tipo": "respuesta", "aclaracion" o "conversacion".
- "saludo": el saludo con el que empezó la persona (ej. "Hola", "Buen día", "Buenas tardes"), o "" si no saludó.
- "respuesta": el texto para el ciudadano, sin saludo ni nombre (la respuesta, la pregunta aclaratoria si tipo=aclaracion, o lo que contestás si tipo=conversacion).
- "encontrado": true SOLO si tipo=respuesta y algún trámite del contexto responde realmente; false en cualquier otro caso (siempre false en conversacion).
- "tramitesUsados": IDs de los trámites que usaste para responder (vacío si no respondiste o si tipo=conversacion). Los ids van solo acá y en "opciones".
- "opciones": IDs de los trámites candidatos que ofrecés como opción (solo si tipo=aclaracion; vacío en los demás casos).`;

const INSTRUCCION_TOPE = `
IMPORTANTE: ya se pidió aclaración el máximo de veces, así que en este turno "tipo" DEBE ser "respuesta" (o "conversacion" si el mensaje no pide un trámite); no vuelvas a pedir aclaración. Si podés identificar el trámite, respondé con ese. Si varios candidatos siguen siendo posibles, NO mandes a la persona a la mesa de entrada: respondé igual describiendo brevemente cada uno de esos candidatos para que pueda elegir, con sus IDs en "tramitesUsados" y "encontrado": true. Nunca devuelvas "encontrado": true con "tramitesUsados" vacío: ahí van los IDs de TODOS los candidatos que vas a describir (si el formato te pide escribirlos antes que el texto, como en la primera línea, decidilos primero). Sugerí consultar en una mesa de entrada solo si ningún candidato del contexto corresponde.`;

const SYSTEM_PROMPT_STREAM_MULTIVUELTA = `${ROL_Y_REGLAS}

Formato de salida (OBLIGATORIO):
- La PRIMERA línea debe ser únicamente un objeto JSON en una sola línea, sin texto antes: {"tipo": "<respuesta|aclaracion|conversacion>", "saludo": "<saludo o vacío>", "encontrado": <true|false>, "tramitesUsados": [<ids>], "opciones": [<ids>]}
  - "tipo": "aclaracion" si pedís que elija entre varios trámites; "conversacion" si el mensaje no pide un trámite; "respuesta" en cualquier otro caso.
  - "saludo": el saludo con el que empezó la persona (ej. "Hola", "Buen día", "Buenas tardes"), o "" si no saludó.
  - "encontrado": true SOLO si tipo=respuesta y algún trámite del contexto responde realmente; false en cualquier otro caso (incluidas aclaracion y conversacion).
  - "tramitesUsados": los IDs (el número de "Trámite (id N)") que usaste para responder. Vacío si no respondiste o si tipo=conversacion.
  - "opciones": los IDs de los trámites que ofrecés como opción. Solo si tipo=aclaracion; vacío en los demás casos.
- A partir de la SEGUNDA línea, escribí (sin JSON ni marcadores, sin saludo ni nombre) el texto para el ciudadano: la respuesta, la pregunta aclaratoria o lo que contestás si tipo=conversacion.
- Si la persona pide un trámite y ningún candidato responde, poné {"tipo": "respuesta", "saludo": "<saludo o vacío>", "encontrado": false, "tramitesUsados": [], "opciones": []} y no escribas nada más.`;

const ESQUEMA_SALIDA = {
  name: "respuesta_chat",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      tipo: { type: "string", enum: ["respuesta", "aclaracion", "conversacion"] },
      saludo: { type: "string" },
      respuesta: { type: "string" },
      encontrado: { type: "boolean" },
      tramitesUsados: { type: "array", items: { type: "integer" } },
      opciones: { type: "array", items: { type: "integer" } },
    },
    required: ["tipo", "saludo", "respuesta", "encontrado", "tramitesUsados", "opciones"],
  },
};

const limitarConversacion = (texto) => {
  const limpio = texto.trim();
  if (!limpio) return MENSAJE_CONVERSACION_VACIA;
  return limpio.length < TOPE_CONVERSACION ? limpio : `${limpio.slice(0, TOPE_CONVERSACION - 1).trimEnd()}…`;
};

// Conversación: no se cachea ni se registra en consultas (no es una consulta de trámite).
const respuestaConversacional = (respuesta) => ({
  tipo: "respuesta",
  respuesta,
  encontrado: false,
  tramitesEncontrados: [],
  opciones: [],
  conversacional: true,
  ...SIN_REGISTRO,
});

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

// Sin candidatos también se llama al modelo: un saludo o un "gracias" merecen respuesta.
const armarInstruccion = async (prompt, topeAlcanzado, tramites) => {
  const system = topeAlcanzado ? `${prompt}\n${INSTRUCCION_TOPE}` : prompt;
  const { texto: resumen } = await obtenerResumenCatalogo();
  const contexto = tramites.length > 0 ? tramites.map(formatearTramite).join("\n\n") : "(ninguno)";
  return `${system}\n\nRESUMEN DEL CATÁLOGO:\n${resumen}\n\nContexto (trámites candidatos):\n${contexto}`;
};

const SIN_REGISTRO = { consultaId: null, calificarToken: null };

// Si falla el registro la respuesta igual sale, con consultaId y calificarToken null.
const registrar = async (datos) => {
  try {
    const consulta = await registrarConsulta(datos);
    return { consultaId: consulta.id, calificarToken: consulta.calificarToken };
  } catch (err) {
    console.error("Error al registrar consulta:", err.message);
    return SIN_REGISTRO;
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
    respuesta: cacheado.respuesta,
  });

const nombreParaSaludo = (usuario) => (usuario ? primerNombre(usuario.nombre) : null);

// La caché y `consultas` guardan el cuerpo sin el saludo: el nombre se agrega al servir.
const conSaludo = (cuerpo, saludo, usuario) =>
  `${componerSaludo(saludo, nombreParaSaludo(usuario))}${cuerpo}`;

export const responderConsulta = async (mensajes, usuario = null) => {
  const usuarioId = usuario?.id ?? null;
  const esUnTurno = mensajes.length === 1;
  const preguntaActual = mensajes[mensajes.length - 1].texto;

  // Caché solo para un solo turno (las conversaciones dependen del contexto).
  if (esUnTurno) {
    const cacheado = cache.obtener(preguntaActual);
    if (cacheado) {
      const registro = await registrarConsultaCacheada(preguntaActual, cacheado, usuarioId);
      return {
        tipo: "respuesta",
        respuesta: conSaludo(cacheado.respuesta, cacheado.saludo ?? "", usuario),
        tramitesEncontrados: cacheado.tramitesEncontrados,
        encontrado: cacheado.encontrado,
        opciones: [],
        conversacional: false,
        ...registro,
      };
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

  const idsDelContexto = new Set(tramites.map((t) => t.id));

  // Tope: contamos las aclaraciones previas (turnos del asistente).
  const topeAlcanzado =
    mensajes.filter((m) => m.rol === "asistente").length >= 2;

  const salidaRaw = await ia.generarRespuesta({
    instruccionSistema: await armarInstruccion(SYSTEM_PROMPT_MULTIVUELTA, topeAlcanzado, tramites),
    turnos: mensajes,
    esquema: ESQUEMA_SALIDA,
  });

  const salida = JSON.parse(salidaRaw);
  const saludo = sanitizarSaludo(salida.saludo);
  const cuerpoModelo = quitarSaludoRepetido((salida.respuesta ?? "").trim(), saludo);

  if (salida.tipo === "conversacion") {
    return respuestaConversacional(conSaludo(limitarConversacion(cuerpoModelo), saludo, usuario));
  }

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
      respuesta: conSaludo(cuerpoModelo, saludo, usuario),
      opciones,
      encontrado: false,
      tramitesEncontrados: [],
      conversacional: false,
      ...SIN_REGISTRO,
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

  const cuerpo = encontrado ? cuerpoModelo : MENSAJE_SIN_RESPUESTA;
  const registro = await registrar({
    textoConsulta: preguntaActual,
    tramiteId: encontrado ? idsUsados[0] : null,
    encontrado,
    usuarioId,
    respuesta: cuerpo,
  });

  if (esUnTurno) cache.guardar(preguntaActual, { respuesta: cuerpo, saludo, tramitesEncontrados, encontrado });
  return {
    tipo: "respuesta",
    respuesta: conSaludo(cuerpo, saludo, usuario),
    tramitesEncontrados,
    encontrado,
    opciones: [],
    conversacional: false,
    ...registro,
  };
};

const leerMeta = (linea) => {
  try {
    return JSON.parse(linea.trim());
  } catch {
    return null;
  }
};

export async function* responderConsultaStream(mensajes, usuario = null) {
  const usuarioId = usuario?.id ?? null;
  const nombre = nombreParaSaludo(usuario);
  const esUnTurno = mensajes.length === 1;
  const preguntaActual = mensajes[mensajes.length - 1].texto;

  if (esUnTurno) {
    const cacheado = cache.obtener(preguntaActual);
    if (cacheado) {
      const registro = await registrarConsultaCacheada(preguntaActual, cacheado, usuarioId);
      const prefijo = componerSaludo(cacheado.saludo ?? "", nombre);
      if (prefijo) yield { tipo: "delta", texto: prefijo };
      yield { tipo: "delta", texto: cacheado.respuesta };
      yield {
        tipo: "fin",
        tipoRespuesta: "respuesta",
        encontrado: cacheado.encontrado,
        tramitesEncontrados: cacheado.tramitesEncontrados,
        opciones: [],
        conversacional: false,
        ...registro,
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

  const idsDelContexto = new Set(tramites.map((t) => t.id));

  const topeAlcanzado =
    mensajes.filter((m) => m.rol === "asistente").length >= 2;

  const deltas = ia.generarRespuestaStream({
    instruccionSistema: await armarInstruccion(SYSTEM_PROMPT_STREAM_MULTIVUELTA, topeAlcanzado, tramites),
    turnos: mensajes,
  });

  let buffer = "";
  let meta = null;
  let saludo = "";
  let cuerpo = "";
  let inicio = "";
  let cuerpoIniciado = false;

  // Solo la conversación tiene tope; el resto pasa entero.
  const recortar = (texto) => {
    if (meta?.tipo !== "conversacion") return { texto, llegoAlTope: false };
    const lugar = TOPE_CONVERSACION - 1 - cuerpo.length;
    return texto.length > lugar
      ? { texto: `${texto.slice(0, lugar).trimEnd()}…`, llegoAlTope: true }
      : { texto, llegoAlTope: false };
  };

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

      const esConversacion = parsed?.tipo === "conversacion";
      saludo = sanitizarSaludo(parsed?.saludo);
      meta = {
        valida: parsed !== null,
        tipo: esConversacion ? "conversacion" : esAclaracion ? "aclaracion" : "respuesta",
        encontrado:
          !esAclaracion && !esConversacion && parsed?.encontrado === true && idsUsados.length > 0,
        idsUsados: esConversacion ? [] : idsUsados,
        opciones,
      };

      // Se decide con la línea META, antes de mandar texto: lo que se transmite no se descarta.
      if (meta.tipo === "respuesta" && !meta.encontrado) break;

      const prefijo = componerSaludo(saludo, nombre);
      if (prefijo) yield { tipo: "delta", texto: prefijo };
      delta = buffer.slice(nl + 1);
    }

    // El comienzo del cuerpo se retiene unos caracteres para poder sacar un saludo repetido.
    if (!cuerpoIniciado) {
      inicio += delta;
      if (inicio.trimStart().length < largoParaDetectarSaludo(saludo)) continue;
      delta = quitarSaludoRepetido(inicio.trimStart(), saludo);
      inicio = "";
      cuerpoIniciado = true;
    }

    const { texto, llegoAlTope } = recortar(delta);
    if (!texto) continue;
    cuerpo += texto;
    yield { tipo: "delta", texto };
    if (llegoAlTope) break;
  }

  // Un cuerpo más corto que lo retenido sale al final.
  if (meta !== null && !cuerpoIniciado && inicio.trim()) {
    const { texto } = recortar(quitarSaludoRepetido(inicio.trim(), saludo));
    if (texto) {
      cuerpo += texto;
      yield { tipo: "delta", texto };
    }
  }

  // Sin salto de línea no hubo META separada: el buffer entero puede ser el JSON.
  if (meta === null) saludo = sanitizarSaludo(leerMeta(buffer)?.saludo);

  if (meta?.tipo === "conversacion") {
    if (!cuerpo.trim()) yield { tipo: "delta", texto: MENSAJE_CONVERSACION_VACIA };
    yield {
      tipo: "fin",
      tipoRespuesta: "respuesta",
      encontrado: false,
      tramitesEncontrados: [],
      opciones: [],
      conversacional: true,
      ...SIN_REGISTRO,
    };
    return;
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

  let registro = SIN_REGISTRO;
  if (!esAclaracion) {
    // Sin trámite el loop corta antes de mandar texto: solo se muestra el mensaje fijo.
    const respuesta = encontrado ? cuerpo.trim() : MENSAJE_SIN_RESPUESTA;
    const metaValida = meta ? meta.valida : leerMeta(buffer) !== null;
    if (esUnTurno && metaValida) {
      cache.guardar(preguntaActual, { respuesta, saludo, tramitesEncontrados, encontrado });
    }
    registro = await registrar({
      textoConsulta: preguntaActual,
      tramiteId: encontrado ? idsUsados[0] : null,
      encontrado,
      usuarioId,
      respuesta,
    });
    if (!encontrado) {
      const prefijo = componerSaludo(saludo, nombre);
      if (prefijo) yield { tipo: "delta", texto: prefijo };
      yield { tipo: "delta", texto: MENSAJE_SIN_RESPUESTA };
    }
  }

  yield {
    tipo: "fin",
    tipoRespuesta: esAclaracion ? "aclaracion" : "respuesta",
    encontrado: esAclaracion ? false : encontrado,
    tramitesEncontrados,
    opciones,
    conversacional: false,
    ...registro,
  };
}
