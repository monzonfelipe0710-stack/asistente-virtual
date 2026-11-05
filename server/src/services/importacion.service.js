import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Jurisdiccion } from '@prisma/client';
import prisma from '../config/prisma.js';
import { reindexarCatalogo, tramitesDeSectores } from './embedding.service.js';
import { JURISDICCION_POR_DEFECTO, leerSectoresParaResolver, resolverJurisdicciones, subarbol } from './jurisdiccion.service.js';
import { normalizarNombre } from '../utils/texto.js';
import { marcarCatalogoCambiado } from './version-catalogo.service.js';

const JURISDICCIONES = new Set(Object.values(Jurisdiccion));
export const EMAIL_SISTEMA = 'sistema@chatap.local';

const obtenerUsuarioSistema = async ({ simular }) => {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_SISTEMA } });
  if (existente || simular) return existente;

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  return prisma.usuario.create({
    data: {
      nombre: 'Sistema',
      email: EMAIL_SISTEMA,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'APROBADO', // no es logueable: password aleatorio
    },
  });
};

// Solo se escriben los campos que trae el JSON: un sector existente conserva lo que no venga.
const camposDeJurisdiccion = (s, log) => {
  const campos = {};
  if (s.jurisdiccion !== undefined) {
    if (s.jurisdiccion === null || JURISDICCIONES.has(s.jurisdiccion)) campos.jurisdiccion = s.jurisdiccion;
    else log.warn(`Jurisdicción inválida para el sector "${s.nombre}": ${s.jurisdiccion}`);
  }
  if (s.localidad !== undefined) campos.localidad = s.localidad?.trim() || null;
  return campos;
};

// Índice en el JSON del sector con ese nombre (y ese padre, si se indica). -1 si no hay
// exactamente uno: no existe o es ambiguo.
const buscarEnJson = (sectores, nombre, padre) => {
  const candidatos = sectores
    .map((s, i) => [s, i])
    .filter(([s]) => s.nombre === nombre && (padre === undefined || (s.padre ?? null) === padre));
  return candidatos.length === 1 ? candidatos[0][1] : -1;
};

// En una simulación, los sectores que se crearían reciben un id ficticio.
const esIdReal = (id) => typeof id === 'number';

// Los sectores se identifican por (nombre, padre); el padre tiene que estar en el mismo JSON
// y se crea antes que sus hijos.
const upsertSectores = async (sectores, log, { simular }) => {
  const ids = new Map();
  const resumen = { creados: 0, actualizados: 0 };
  const cambiados = [];
  const padres = sectores.map((s) => (s.padre ? buscarEnJson(sectores, s.padre) : null));
  let pendientes = sectores.map((_, i) => i).filter((i) => padres[i] !== -1);

  while (pendientes.length > 0) {
    const listos = pendientes.filter((i) => padres[i] === null || ids.has(padres[i]));
    if (listos.length === 0) break;

    for (const i of listos) {
      const s = sectores[i];
      const parentId = padres[i] === null ? null : ids.get(padres[i]);
      const campos = camposDeJurisdiccion(s, log);
      const existente = parentId === null || esIdReal(parentId)
        ? await prisma.sector.findFirst({ where: { nombre: s.nombre, parentId } })
        : null;

      if (existente) {
        if (Object.entries(campos).some(([campo, valor]) => existente[campo] !== valor)) {
          if (!simular) await prisma.sector.update({ where: { id: existente.id }, data: campos });
          resumen.actualizados++;
          cambiados.push(existente.id);
        }
        ids.set(i, existente.id);
      } else if (simular) {
        resumen.creados++;
        ids.set(i, `nuevo-${i}`);
      } else {
        const creado = await prisma.sector.create({
          data: {
            nombre: s.nombre,
            tipo: s.tipo,
            parentId,
            ...(parentId === null && { jurisdiccion: JURISDICCION_POR_DEFECTO }),
            ...campos,
          },
        });
        resumen.creados++;
        ids.set(i, creado.id);
      }
    }
    pendientes = pendientes.filter((i) => !listos.includes(i));
  }

  sectores.forEach((s, i) => {
    if (!ids.has(i)) log.warn(`Sector salteado: "${s.nombre}" (su padre "${s.padre}" no está en el JSON, es ambiguo o hay un ciclo)`);
  });
  return { ids, resumen, cambiados };
};

// Un trámite nombra su sector; si el nombre se repite entre sectores con distinto padre, tiene
// que traer `sectorPadre` (null para el sector raíz).
const sectorDelTramite = (t, sectores, ids) => {
  const i = buscarEnJson(sectores, t.sector, t.sectorPadre);
  return i === -1 ? null : ids.get(i) ?? null;
};

const avisarMunicipalesSinLocalidad = async (ids, log) => {
  const resueltas = resolverJurisdicciones(await leerSectoresParaResolver());
  for (const id of new Set(ids.values())) {
    const r = resueltas.get(id);
    if (r?.jurisdiccion === 'MUNICIPAL' && !r.localidad) log.warn(`El sector municipal "${r.nombre}" no tiene localidad.`);
  }
};

const claveDe = (sectorId, nombre) => `${sectorId}|${normalizarNombre(nombre)}`;

const agrupar = (lista, clave) => {
  const grupos = new Map();
  for (const x of lista) {
    const k = clave(x);
    grupos.set(k, [...(grupos.get(k) ?? []), x]);
  }
  return grupos;
};

const textoValido = (v) => typeof v === 'string' && v.trim().length > 0;

const reindexarPorDefecto = (ids, { lote, log }) => reindexarCatalogo({ ids, lote, log, continuarSiFalla: true });

// Importa sectores y trámites sin cortar la corrida: lo que no se puede escribir queda en
// `fallidos` y lo que pisaría un trámite ajeno, en `conflictos`.
//
// - `simular`: calcula el informe sin escribir ni llamar a la API de embeddings.
// - `despublicarFaltantes` (exige `completa`): despublica los trámites del importador que no
//   vinieron en el JSON, dentro de los sectores del JSON y sus descendientes. Nunca toca
//   trámites cargados a mano.
// - `publicar` en false deja los trámites nuevos como borradores (lo usan los tests).
// - `reindexar(ids, { lote, log })` devuelve `{ reindexados, fallidos }`.
export const importarCatalogo = async (datos, {
  reindexar = reindexarPorDefecto,
  log = console,
  publicar = true,
  simular = false,
  completa = false,
  despublicarFaltantes = false,
  lote = 100,
} = {}) => {
  if (despublicarFaltantes && !completa) {
    throw new Error('despublicar faltantes exige una importación completa (--completa): con un JSON parcial se despublicaría el resto del catálogo.');
  }

  const sistema = await obtenerUsuarioSistema({ simular });
  const { ids, resumen: sectores, cambiados } = await upsertSectores(datos.sectores, log, { simular });
  if (!simular) await avisarMunicipalesSinLocalidad(ids, log);

  const existentes = await prisma.tramite.findMany({
    select: { id: true, nombre: true, descripcion: true, sectorId: true, fuenteUrl: true, encargadoId: true, publicado: true },
  });
  const porUrl = new Map(existentes.filter((t) => t.fuenteUrl).map((t) => [t.fuenteUrl, t]));
  const porClave = agrupar(existentes, (t) => claveDe(t.sectorId, t.nombre));
  const sinEmbedding = new Set((await prisma.$queryRaw`SELECT id FROM tramites WHERE embedding IS NULL`).map((f) => f.id));
  const delImportador = (t) => sistema && t.encargadoId === sistema.id;

  // El texto del embedding incluye el sector: si cambió la jurisdicción o la localidad de un
  // sector, se reindexan sus trámites y los de sus descendientes.
  const aIndexar = new Set(cambiados.length > 0 ? await tramitesDeSectores(cambiados) : []);
  const informe = { creados: [], actualizados: [], sinCambios: 0, reindexados: [], fallidos: [], conflictos: [], despublicados: [], despublicacion: null };
  const vistos = new Set();
  const urlsDelJson = new Set();
  const clavesDelJson = new Set();
  let noIdentificados = 0;

  const procesar = async (t, marcar) => {
    const fuenteUrl = typeof t.fuenteUrl === 'string' && t.fuenteUrl.trim() ? t.fuenteUrl.trim() : null;
    const conflicto = (motivo, existenteId = null) => informe.conflictos.push({ nombre: t.nombre, fuenteUrl, existenteId, motivo });
    const fallido = (motivo) => informe.fallidos.push({ nombre: t.nombre ?? null, fuenteUrl, motivo });

    if (fuenteUrl) {
      if (urlsDelJson.has(fuenteUrl)) return marcar(null, () => conflicto('fuenteUrl repetida en el JSON'));
      urlsDelJson.add(fuenteUrl);
    }

    const sectorId = sectorDelTramite(t, datos.sectores, ids);
    if (!sectorId) {
      return marcar(porUrl.get(fuenteUrl)?.id ?? null, () => fallido(`sector no encontrado o ambiguo: "${t.sector}"`), { identificable: Boolean(porUrl.get(fuenteUrl)) });
    }
    if (!textoValido(t.nombre) || !textoValido(t.descripcion)) {
      return marcar(porUrl.get(fuenteUrl)?.id ?? null, () => fallido('falta el nombre o la descripción'), { identificable: Boolean(porUrl.get(fuenteUrl)) });
    }

    const clave = claveDe(sectorId, t.nombre);
    const delSectorSinUrl = (porClave.get(clave) ?? []).filter((c) => !c.fuenteUrl);
    let existente = null;

    if (fuenteUrl) {
      existente = porUrl.get(fuenteUrl) ?? null;
      if (existente && existente.sectorId !== sectorId) {
        return marcar(existente.id, () => conflicto(`la fuenteUrl ya es del trámite ${existente.id} ("${existente.nombre}") de otro sector`, existente.id));
      }
      // Un trámite que el importador creó sin URL la adopta si ahora viene con una.
      if (!existente) {
        const adoptable = delSectorSinUrl.filter(delImportador);
        if (adoptable.length === 1) existente = adoptable[0];
      }
    } else {
      if (clavesDelJson.has(clave)) return marcar(null, () => conflicto('repetido en el JSON (mismo sector y nombre, sin fuenteUrl)'));
      clavesDelJson.add(clave);
      const delSistema = delSectorSinUrl.filter(delImportador);
      if (delSistema.length > 1) {
        delSistema.forEach((c) => vistos.add(c.id));
        return marcar(null, () => conflicto(`hay ${delSistema.length} trámites del importador sin fuenteUrl con ese nombre en el sector`));
      }
      if (delSistema.length === 0 && delSectorSinUrl.length > 0) {
        return marcar(delSectorSinUrl[0].id, () => conflicto('ya hay un trámite cargado a mano con ese nombre en el sector: no se pisa', delSectorSinUrl[0].id));
      }
      existente = delSistema[0] ?? null;
    }

    if (existente) {
      marcar(existente.id);
      const datosNuevos = { nombre: t.nombre.trim(), descripcion: t.descripcion, ...(fuenteUrl && { fuenteUrl }) };
      const cambio = Object.entries(datosNuevos).some(([campo, valor]) => existente[campo] !== valor);
      if (!cambio) {
        informe.sinCambios++;
        if (sinEmbedding.has(existente.id)) aIndexar.add(existente.id);
        return;
      }
      if (!simular) await prisma.tramite.update({ where: { id: existente.id }, data: datosNuevos });
      informe.actualizados.push({ id: existente.id, nombre: t.nombre });
      aIndexar.add(existente.id);
      return;
    }

    marcar(null);
    if (simular) {
      informe.creados.push({ id: null, nombre: t.nombre });
      return;
    }
    const creado = await prisma.tramite.create({
      data: { nombre: t.nombre.trim(), descripcion: t.descripcion, sectorId, encargadoId: sistema.id, publicado: publicar, fuenteUrl },
    });
    informe.creados.push({ id: creado.id, nombre: t.nombre });
    aIndexar.add(creado.id);
  };

  // Un trámite del JSON que no se puede identificar podría ser uno de los "faltantes": si hay
  // alguno, no se despublica nada.
  for (const t of datos.tramites) {
    let marcado = false;
    const marcar = (id, registrar, { identificable = true } = {}) => {
      if (id !== null) vistos.add(id);
      if (!identificable) noIdentificados++;
      marcado = true;
      registrar?.();
    };
    try {
      await procesar(t, marcar);
    } catch (err) {
      if (!marcado) noIdentificados++;
      informe.fallidos.push({ nombre: t?.nombre ?? null, fuenteUrl: t?.fuenteUrl ?? null, motivo: err.message.split('\n').at(-1).trim() });
    }
  }

  if (despublicarFaltantes) {
    if (noIdentificados > 0) {
      informe.despublicacion = `omitida: ${noIdentificados} trámites del JSON no se pudieron identificar y podrían estar entre los faltantes`;
      log.warn(`No se despublica nada: ${informe.despublicacion}`);
    } else {
      // "Completa" vale para los organismos del JSON: un catálogo municipal no despublica el provincial.
      const todos = await leerSectoresParaResolver();
      const alcance = new Set([...ids.values()].filter(esIdReal).flatMap((id) => [...subarbol(todos, id)]));
      const faltantes = existentes.filter((t) => delImportador(t) && t.publicado && alcance.has(t.sectorId) && !vistos.has(t.id));
      if (!simular && faltantes.length > 0) {
        await prisma.tramite.updateMany({
          where: { id: { in: faltantes.map((t) => t.id) }, encargadoId: sistema.id, publicado: true },
          data: { publicado: false },
        });
      }
      informe.despublicados = faltantes.map((t) => ({ id: t.id, nombre: t.nombre }));
      informe.despublicacion = simular ? 'simulada' : 'hecha';
    }
  }

  const pendientes = [...aIndexar].filter((id) => esIdReal(id));
  if (simular) {
    informe.reindexados = pendientes;
  } else if (pendientes.length > 0) {
    log.log(`Generando embeddings de ${pendientes.length} trámites en lotes de ${lote}...`);
    const r = await reindexar(pendientes, { lote, log });
    informe.reindexados = r.reindexados;
    informe.fallidos.push(...r.fallidos);
  }

  const huboCambios = sectores.creados + sectores.actualizados + informe.creados.length + informe.actualizados.length
    + informe.reindexados.length + informe.despublicados.length > 0;
  let cache = { invalidada: false, version: null, error: null };
  if (!simular && huboCambios) {
    try {
      cache = { invalidada: true, version: await marcarCatalogoCambiado(), error: null };
    } catch (err) {
      cache = { invalidada: false, version: null, error: err.message.split('\n').at(-1).trim() };
    }
  }

  const sectorIds = datos.sectores.map((s, i) => ({ nombre: s.nombre, padre: s.padre ?? null, id: ids.get(i) ?? null }));
  return { simulado: simular, sectores, sectorIds, ...informe, cache };
};

const lista = (titulo, items, formato) =>
  items.length === 0 ? [] : [`${titulo}:`, ...items.map((x) => `  - ${formato(x)}`)];

export const formatearInforme = (r) => [
  r.simulado ? 'SIMULACIÓN (--dry-run): no se escribió nada.' : 'Importación terminada.',
  `Sectores: ${r.sectores.creados} ${r.simulado ? 'a crear' : 'creados'}, ${r.sectores.actualizados} ${r.simulado ? 'a actualizar' : 'actualizados'}`,
  `Trámites: ${r.creados.length} creados, ${r.actualizados.length} actualizados, ${r.sinCambios} sin cambios, ${r.reindexados.length} ${r.simulado ? 'a reindexar' : 'reindexados'}, ${r.fallidos.length} fallidos, ${r.conflictos.length} conflictos`,
  ...(r.despublicacion ? [`Despublicación de faltantes: ${r.despublicacion}${r.despublicacion.startsWith('omitida') ? '' : ` (${r.despublicados.length})`}`] : []),
  ...lista('Fallidos', r.fallidos, (f) => `${f.nombre ?? `id ${f.id}`}${f.fuenteUrl ? ` <${f.fuenteUrl}>` : ''}: ${f.motivo}`),
  ...lista('Conflictos', r.conflictos, (c) => `${c.nombre}${c.fuenteUrl ? ` <${c.fuenteUrl}>` : ''}: ${c.motivo}`),
  ...lista(r.simulado ? 'Se despublicarían' : 'Despublicados', r.despublicados, (d) => `${d.id} ${d.nombre}`),
].join('\n');
