import { ia } from '../core/ai/index.js';
import prisma from '../config/prisma.js';
import { describirJurisdiccion, obtenerJurisdicciones, subarbol, leerSectoresParaResolver } from './jurisdiccion.service.js';

export const generarEmbedding = (texto, opciones) => ia.generarEmbedding(texto, opciones);

// `organismo` es el sector con su jurisdicción y localidad efectivas: dos trámites con el mismo
// nombre en distintos municipios no quedan con el mismo vector.
export const textoDeTramite = (tramite, organismo) => {
  const partes = [`Trámite: ${tramite.nombre}.`];
  if (organismo) partes.push(`Organismo: ${organismo.nombre} (${describirJurisdiccion(organismo)}).`);
  partes.push(`Descripción: ${tramite.descripcion}.`);

  if (tramite.requisitos && tramite.requisitos.length > 0) {
    const reqs = tramite.requisitos.map((r) => r.descripcion).join(', ');
    partes.push(`Requisitos: ${reqs}.`);
  }

  return partes.join(' ');
};

const textosDe = async (tramites) => {
  const jurisdicciones = await obtenerJurisdicciones();
  return tramites.map((t) => textoDeTramite(t, jurisdicciones.get(t.sectorId)));
};

export const guardarEmbedding = async (tramiteId, embedding) => {
  const vectorSql = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
  UPDATE tramites
  SET embedding = ${vectorSql}::vector
  WHERE id = ${tramiteId}
  `;
};

export const indexarTramite = async (tramiteId) => {
  const tramite = await prisma.tramite.findUnique({
    where: { id : tramiteId },
    include: { requisitos: true },
  });

  if (!tramite) return;

  const [texto] = await textosDe([tramite]);
  const embedding = await generarEmbedding(texto);
  await guardarEmbedding(tramiteId, embedding);
};

export const indexarSiFalta = async (tramiteId) => {
  const [fila] = await prisma.$queryRaw`
    SELECT embedding IS NULL AS falta FROM tramites WHERE id = ${tramiteId}
  `;
  if (!fila?.falta) return false;

  await indexarTramite(tramiteId);
  return true;
};

// Ids de los trámites de esos sectores y de sus descendientes: cambiar un sector cambia el texto
// de todos ellos.
export const tramitesDeSectores = async (sectorIds) => {
  const sectores = await leerSectoresParaResolver();
  const todos = new Set(sectorIds.flatMap((id) => [...subarbol(sectores, id)]));
  const tramites = await prisma.tramite.findMany({ where: { sectorId: { in: [...todos] } }, select: { id: true }, orderBy: { id: 'asc' } });
  return tramites.map((t) => t.id);
};

const PRECIO_USD_POR_MILLON = 0.02;
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Reindexa en lotes (un pedido de embeddings y un UPDATE por lote), con reintentos por lote.
// `ids` limita a esos trámites; `desde` retoma a partir de un id. Con `estimar` no llama a la API:
// el costo sale de ~3,5 caracteres por token.
export const reindexarCatalogo = async ({
  ids,
  desde = 0,
  lote = 100,
  reintentos = 3,
  esperaBase = 2000,
  estimar = false,
  log = console,
} = {}) => {
  const tramites = await prisma.tramite.findMany({
    where: { id: { gte: desde, ...(ids && { in: ids }) } },
    include: { requisitos: true },
    orderBy: { id: 'asc' },
  });
  const textos = await textosDe(tramites);

  if (estimar) {
    const caracteres = textos.reduce((n, t) => n + t.length, 0);
    const tokens = Math.round(caracteres / 3.5);
    return { tramites: tramites.length, lotes: Math.ceil(tramites.length / lote), caracteres, tokens, costoUsd: (tokens / 1e6) * PRECIO_USD_POR_MILLON };
  }

  let tokens = 0;
  for (let i = 0; i < tramites.length; i += lote) {
    const parte = tramites.slice(i, i + lote);
    let resultado;
    for (let intento = 1; ; intento++) {
      try {
        resultado = await ia.generarEmbeddings(textos.slice(i, i + lote));
        break;
      } catch (err) {
        if (intento > reintentos) throw new Error(`Falló el lote que empieza en el trámite ${parte[0].id}: reanudá con --desde ${parte[0].id}`, { cause: err });
        log.warn(`Lote desde ${parte[0].id}: intento ${intento} falló (${err.message}), se reintenta`);
        await pausa(esperaBase * 2 ** (intento - 1));
      }
    }
    const vectores = resultado.vectores.map((v) => `[${v.join(',')}]`);
    await prisma.$executeRaw`
      UPDATE tramites AS t SET embedding = d.e::vector
      FROM unnest(${parte.map((t) => t.id)}::int[], ${vectores}::text[]) AS d(id, e)
      WHERE t.id = d.id
    `;
    tokens += resultado.tokens ?? 0;
    log.log(`  ${Math.min(i + lote, tramites.length)}/${tramites.length} (hasta el id ${parte.at(-1).id})`);
  }
  return { tramites: tramites.length, tokens, costoUsd: (tokens / 1e6) * PRECIO_USD_POR_MILLON };
};
