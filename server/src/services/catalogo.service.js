import prisma from '../config/prisma.js';
import * as cache from './cache.service.js';
import { normalizarNombre } from '../utils/texto.js';
import { asegurarCacheVigente } from './version-catalogo.service.js';
import { obtenerJurisdicciones } from './jurisdiccion.service.js';

export const TOPES_RESUMEN = {
  ejemplos: 8,
  sectoresProvincial: 6,
  sectoresPorGrupo: 3,
  ejemplosPorGrupo: 3,
  localidadesConDetalle: 4,
  otrasLocalidades: 20,
};

// Trámites generales y conocidos: van primero entre los ejemplos (si están publicados), porque
// son los que el chat usa para redirigir un tema ajeno. Nombres tal cual están en la base.
export const TRAMITES_DESTACADOS = ['Pasaporte', 'Solicitud de Certificado de Buena Conducta', 'Nuevo Ejemplar para Argentinos'];

const ORDEN_JURISDICCION = ['PROVINCIAL', 'MUNICIPAL', 'NACIONAL'];
const PLURAL = { PROVINCIAL: 'provinciales', MUNICIPAL: 'municipales', NACIONAL: 'nacionales' };
const SINGULAR = { PROVINCIAL: 'provincial', MUNICIPAL: 'municipal', NACIONAL: 'nacional' };

// Orden pseudoaleatorio pero estable entre corridas: no depende del alfabeto ni del id.
export const mezclaEstable = (id) => Math.imul(id ^ 0x9e3779b9, 0x85ebca6b) >>> 0;

// Primero los más consultados; con las mismas consultas, en el orden de la mezcla estable.
const porRepresentatividad = (a, b) => b.consultas - a.consultas || mezclaEstable(a.id) - mezclaEstable(b.id);

const leerPublicados = () => prisma.$queryRaw`
  SELECT t.id, t.nombre, t.sector_id AS "sectorId", s.nombre AS sector, count(c.id)::int AS consultas
  FROM tramites t
  JOIN sectores s ON s.id = t.sector_id
  LEFT JOIN consultas c ON c.tramite_id = t.id AND c.encontrado
  WHERE t.publicado
  GROUP BY t.id, s.nombre
`;

// El catálogo tiene trámites con el mismo nombre en distintos organismos: se nombran una vez.
const tomarSinRepetir = (tramites, cantidad, vistos) => {
  const elegidos = [];
  for (const { nombre } of tramites) {
    if (elegidos.length === cantidad) break;
    const clave = normalizarNombre(nombre);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    elegidos.push(nombre);
  }
  return elegidos;
};

const sectoresConMasTramites = (tramites, cantidad) => {
  const porSector = new Map();
  for (const t of tramites) porSector.set(t.sectorId, { nombre: t.sector, cantidad: (porSector.get(t.sectorId)?.cantidad ?? 0) + 1 });
  return [...porSector.values()].sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es')).slice(0, cantidad);
};

// Provincial y nacional van en un grupo cada una; los municipales, uno por localidad.
const agruparPorJurisdiccion = (tramites, jurisdicciones) => {
  const grupos = new Map();
  for (const t of tramites) {
    const { jurisdiccion, localidad } = jurisdicciones.get(t.sectorId) ?? { jurisdiccion: 'PROVINCIAL', localidad: null };
    const municipal = jurisdiccion === 'MUNICIPAL';
    const clave = municipal ? `${jurisdiccion}|${normalizarNombre(localidad)}` : jurisdiccion;
    if (!grupos.has(clave)) grupos.set(clave, { jurisdiccion, localidad: municipal ? localidad : null, tramites: [] });
    grupos.get(clave).tramites.push(t);
  }
  return [...grupos.values()].sort(
    (a, b) => ORDEN_JURISDICCION.indexOf(a.jurisdiccion) - ORDEN_JURISDICCION.indexOf(b.jurisdiccion)
      || b.tramites.length - a.tramites.length
      || (a.localidad ?? '').localeCompare(b.localidad ?? '', 'es'),
  );
};

// `publicados`: { id, nombre, sectorId, sector, consultas }; `jurisdicciones`: la de cada sector.
export const armarResumen = (publicados, jurisdicciones) => {
  const vistos = new Set();
  const destacados = TRAMITES_DESTACADOS.filter((nombre) => publicados.some((t) => t.nombre === nombre));
  const ordenados = [...publicados].sort(porRepresentatividad);
  const ejemplos = tomarSinRepetir([...destacados.map((nombre) => ({ nombre })), ...ordenados], TOPES_RESUMEN.ejemplos, vistos);

  const grupos = agruparPorJurisdiccion(ordenados, jurisdicciones);
  const municipales = grupos.filter((g) => g.jurisdiccion === 'MUNICIPAL');
  const conDetalle = new Set([...grupos.filter((g) => g.jurisdiccion !== 'MUNICIPAL'), ...municipales.slice(0, TOPES_RESUMEN.localidadesConDetalle)]);

  const detallados = grupos.filter((g) => conDetalle.has(g)).map((g) => ({
    jurisdiccion: g.jurisdiccion,
    localidad: g.localidad,
    cantidad: g.tramites.length,
    sectores: sectoresConMasTramites(g.tramites, g.jurisdiccion === 'PROVINCIAL' ? TOPES_RESUMEN.sectoresProvincial : TOPES_RESUMEN.sectoresPorGrupo),
    ejemplos: tomarSinRepetir(g.tramites, TOPES_RESUMEN.ejemplosPorGrupo, vistos),
  }));
  const otrasLocalidades = municipales.slice(TOPES_RESUMEN.localidadesConDetalle).map((g) => ({ localidad: g.localidad, cantidad: g.tramites.length }));

  const porJurisdiccion = Object.fromEntries(
    ORDEN_JURISDICCION.map((j) => [j, grupos.filter((g) => g.jurisdiccion === j).reduce((n, g) => n + g.tramites.length, 0)]),
  );

  return {
    totalPublicados: publicados.length,
    porJurisdiccion,
    localidadesMunicipales: municipales.length,
    grupos: detallados,
    otrasLocalidades,
    destacados: ejemplos,
    sectores: detallados.flatMap((g) => g.sectores),
    ejemplos: [...ejemplos, ...detallados.flatMap((g) => g.ejemplos)],
  };
};

const tituloDe = ({ jurisdiccion, localidad }) =>
  jurisdiccion === 'MUNICIPAL' ? `Trámites municipales de ${localidad}` : `Trámites ${PLURAL[jurisdiccion]}`;

const listaConCantidad = (items, nombre) => items.map((x) => `${x[nombre]} (${x.cantidad})`).join('; ');

export const armarTexto = (r) => {
  const partes = ORDEN_JURISDICCION.filter((j) => r.porJurisdiccion[j] > 0).map((j) =>
    j === 'MUNICIPAL' && r.localidadesMunicipales > 0
      ? `${r.porJurisdiccion[j]} ${r.porJurisdiccion[j] === 1 ? SINGULAR[j] : PLURAL[j]} de ${r.localidadesMunicipales} ${r.localidadesMunicipales === 1 ? 'localidad' : 'localidades'}`
      : `${r.porJurisdiccion[j]} ${r.porJurisdiccion[j] === 1 ? SINGULAR[j] : PLURAL[j]}`,
  );
  const otras = r.otrasLocalidades.slice(0, TOPES_RESUMEN.otrasLocalidades);
  const sinNombrar = r.otrasLocalidades.length - otras.length;
  return [
    `- Trámites publicados: ${r.totalPublicados}${partes.length > 0 ? ` (${partes.join(', ')})` : ''}.`,
    ...r.grupos.map((g) =>
      [
        `- ${tituloDe(g)} (${g.cantidad}).`,
        g.sectores.length > 0 && ` Sectores con más trámites: ${listaConCantidad(g.sectores, 'nombre')}.`,
        g.ejemplos.length > 0 && ` Ejemplos: ${g.ejemplos.join('; ')}.`,
      ].filter(Boolean).join(''),
    ),
    ...(otras.length > 0
      ? [`- Otras localidades con trámites municipales: ${listaConCantidad(otras, 'localidad')}${sinNombrar > 0 ? ` y ${sinNombrar} más` : ''}.`]
      : []),
    `- Algunos trámites: ${r.destacados.join('; ')}.`,
  ].join('\n');
};

export const obtenerResumenCatalogo = async () => {
  await asegurarCacheVigente();
  const cacheado = cache.obtenerCatalogo();
  if (cacheado) return cacheado;

  const [publicados, jurisdicciones] = await Promise.all([leerPublicados(), obtenerJurisdicciones()]);
  const resumen = armarResumen(publicados, jurisdicciones);
  const valor = { ...resumen, texto: armarTexto(resumen) };
  cache.guardarCatalogo(valor);
  return valor;
};
