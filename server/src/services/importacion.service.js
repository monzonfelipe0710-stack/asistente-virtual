import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Jurisdiccion } from '@prisma/client';
import prisma from '../config/prisma.js';
import { indexarTramite, tramitesDeSectores } from './embedding.service.js';
import { JURISDICCION_POR_DEFECTO, leerSectoresParaResolver, resolverJurisdicciones } from './jurisdiccion.service.js';

const JURISDICCIONES = new Set(Object.values(Jurisdiccion));
const EMAIL_SISTEMA = 'sistema@chatap.local';

const obtenerUsuarioSistema = async () => {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_SISTEMA } });
  if (existente) return existente;

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

// Los sectores se identifican por (nombre, padre); el padre tiene que estar en el mismo JSON
// y se crea antes que sus hijos.
const upsertSectores = async (sectores, log) => {
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
      const existente = await prisma.sector.findFirst({ where: { nombre: s.nombre, parentId } });

      if (existente) {
        if (Object.entries(campos).some(([campo, valor]) => existente[campo] !== valor)) {
          await prisma.sector.update({ where: { id: existente.id }, data: campos });
          resumen.actualizados++;
          cambiados.push(existente.id);
        }
        ids.set(i, existente.id);
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

// `publicar` en false deja los trámites nuevos como borradores (lo usan los tests: no aparecen en el chat).
export const importarCatalogo = async (datos, { indexar = indexarTramite, log = console, publicar = true } = {}) => {
  const sistema = await obtenerUsuarioSistema();
  const { ids, resumen: sectores, cambiados } = await upsertSectores(datos.sectores, log);
  await avisarMunicipalesSinLocalidad(ids, log);

  // El texto del embedding incluye el sector: si cambió la jurisdicción o la localidad de un
  // sector, se reindexan sus trámites y los de sus descendientes.
  const aIndexar = cambiados.length > 0 ? await tramitesDeSectores(cambiados) : [];
  const tramites = { creados: 0, actualizados: 0, salteados: 0 };

  for (const t of datos.tramites) {
    const sectorId = sectorDelTramite(t, datos.sectores, ids);
    if (!sectorId) {
      log.warn(`Sector no encontrado (o ambiguo) para "${t.nombre}": ${t.sector}`);
      tramites.salteados++;
      continue;
    }

    const existente = t.fuenteUrl
      ? await prisma.tramite.findUnique({ where: { fuenteUrl: t.fuenteUrl } })
      : null;

    if (existente) {
      const cambio = existente.descripcion !== t.descripcion || existente.nombre !== t.nombre || existente.sectorId !== sectorId;
      await prisma.tramite.update({
        where: { id: existente.id },
        data: { nombre: t.nombre, descripcion: t.descripcion, sectorId },
      });
      tramites.actualizados++;
      if (cambio && !aIndexar.includes(existente.id)) aIndexar.push(existente.id);
    } else {
      const creado = await prisma.tramite.create({
        data: {
          nombre: t.nombre,
          descripcion: t.descripcion,
          sectorId,
          encargadoId: sistema.id,
          publicado: publicar,
          fuenteUrl: t.fuenteUrl || null,
        },
      });
      tramites.creados++;
      aIndexar.push(creado.id);
    }
  }

  log.log(`Sectores: ${sectores.creados} creados, ${sectores.actualizados} actualizados | Trámites: ${tramites.creados} creados, ${tramites.actualizados} actualizados, ${tramites.salteados} salteados`);
  log.log(`Generando embeddings de ${aIndexar.length} trámites...`);
  let i = 0;
  for (const id of aIndexar) {
    await indexar(id);
    if (++i % 25 === 0) log.log(`  ${i}/${aIndexar.length}`);
  }

  const sectorIds = datos.sectores.map((s, i) => ({ nombre: s.nombre, padre: s.padre ?? null, id: ids.get(i) ?? null }));
  return { sectores, tramites, indexados: aIndexar, sectorIds };
};
