import prisma from '../config/prisma.js';
import * as cache from './cache.service.js';

const CANTIDAD_SECTORES = 12;
const CANTIDAD_EJEMPLOS = 8;

// Trámites generales y conocidos: van primero entre los ejemplos (si están publicados), porque
// son los que el chat usa para redirigir un tema ajeno. Nombres tal cual están en la base.
export const TRAMITES_DESTACADOS = ['Pasaporte', 'Solicitud de Certificado de Buena Conducta', 'Nuevo Ejemplar para Argentinos'];

const normalizarNombre = (nombre) =>
  nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

// El catálogo tiene trámites con el mismo nombre en distintos organismos: se cuentan una vez.
const agregarSinRepetir = (destino, nombres) => {
  const vistos = new Set(destino.map(normalizarNombre));
  for (const nombre of nombres) {
    if (destino.length === CANTIDAD_EJEMPLOS) break;
    const clave = normalizarNombre(nombre);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    destino.push(nombre);
  }
};

const sectoresConMasTramites = async () => {
  const grupos = await prisma.tramite.groupBy({
    by: ['sectorId'],
    where: { publicado: true },
    _count: { _all: true },
  });
  const sectores = await prisma.sector.findMany({
    where: { id: { in: grupos.map((g) => g.sectorId) } },
    select: { id: true, nombre: true },
  });
  const nombrePorId = new Map(sectores.map((s) => [s.id, s.nombre]));

  return grupos
    .map((g) => ({ nombre: nombrePorId.get(g.sectorId), cantidad: g._count._all }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, CANTIDAD_SECTORES);
};

const destacadosPublicados = async () => {
  const publicados = await prisma.tramite.findMany({
    where: { publicado: true, nombre: { in: TRAMITES_DESTACADOS } },
    select: { nombre: true },
  });
  const nombres = new Set(publicados.map((t) => t.nombre));
  return TRAMITES_DESTACADOS.filter((nombre) => nombres.has(nombre));
};

// Primero los destacados publicados; después los más consultados con respuesta y, si no
// alcanzan, se completa por orden alfabético.
const tramitesDeEjemplo = async () => {
  const ejemplos = [];
  agregarSinRepetir(ejemplos, await destacadosPublicados());

  const masConsultados = await prisma.consulta.groupBy({
    by: ['tramiteId'],
    where: { encontrado: true, tramite: { publicado: true } },
    _count: { _all: true },
    orderBy: [{ _count: { tramiteId: 'desc' } }, { tramiteId: 'asc' }],
    take: CANTIDAD_EJEMPLOS * 4,
  });
  const conNombre = await prisma.tramite.findMany({
    where: { id: { in: masConsultados.map((g) => g.tramiteId) } },
    select: { id: true, nombre: true },
  });
  const nombrePorId = new Map(conNombre.map((t) => [t.id, t.nombre]));

  agregarSinRepetir(ejemplos, masConsultados.map((g) => nombrePorId.get(g.tramiteId)).filter(Boolean));
  if (ejemplos.length < CANTIDAD_EJEMPLOS) {
    const alfabeticos = await prisma.tramite.findMany({
      where: { publicado: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      select: { nombre: true },
      take: CANTIDAD_EJEMPLOS * 4,
    });
    agregarSinRepetir(ejemplos, alfabeticos.map((t) => t.nombre));
  }
  return ejemplos;
};

const armarTexto = ({ totalPublicados, sectores, ejemplos }) =>
  [
    `- Trámites publicados: ${totalPublicados}.`,
    `- Sectores con más trámites: ${sectores.map((s) => `${s.nombre} (${s.cantidad})`).join('; ')}.`,
    `- Algunos trámites: ${ejemplos.join('; ')}.`,
  ].join('\n');

export const obtenerResumenCatalogo = async () => {
  const cacheado = cache.obtenerCatalogo();
  if (cacheado) return cacheado;

  const [totalPublicados, sectores, ejemplos] = await Promise.all([
    prisma.tramite.count({ where: { publicado: true } }),
    sectoresConMasTramites(),
    tramitesDeEjemplo(),
  ]);
  const resumen = { totalPublicados, sectores, ejemplos };
  const valor = { ...resumen, texto: armarTexto(resumen) };
  cache.guardarCatalogo(valor);
  return valor;
};
