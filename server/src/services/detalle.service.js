import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';

const aDecimal = (valor) => (valor === null ? null : new Prisma.Decimal(valor));

// Las columnas del detalle de `t` (tramites), además de id, nombre y sector_id, que cada consulta
// agrega: la búsqueda (busqueda.service.js) las pide en la misma consulta y cargarDetalle por id.
export const COLUMNAS_DETALLE = Prisma.sql`
  t.descripcion, t.costo,
  t.costo_detalle AS "costoDetalle", t.informacion_adicional AS "informacionAdicional",
  t.verificado_en AS "verificadoEn", t.huella_importacion AS "huellaImportacion",
  t.encargado_id AS "encargadoId", t.publicado,
  t.created_at AS "createdAt", t.updated_at AS "updatedAt",
  t.fuente_url AS "fuenteUrl",
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', r.id, 'descripcion', r.descripcion, 'dondeSeConsigue', r.donde_se_consigue,
      'costo', r.costo::text, 'tramiteId', r.tramite_id
    ) ORDER BY r.id)
    FROM requisitos r WHERE r.tramite_id = t.id
  ), '[]') AS requisitos,
  COALESCE((
    SELECT json_agg(json_build_object(
      'tramiteId', tm.tramite_id, 'mesaId', tm.mesa_id,
      'mesa', json_build_object(
        'id', m.id, 'nombre', m.nombre, 'direccion', m.direccion, 'localidad', m.localidad,
        'horario', m.horario, 'telefono', m.telefono, 'email', m.email,
        'esGeneral', m.es_general, 'sectorId', m.sector_id,
        'origenId', m.origen_id, 'huellaImportacion', m.huella_importacion
      )
    ) ORDER BY m.id)
    FROM tramite_mesa tm JOIN mesas_entrada m ON m.id = tm.mesa_id
    WHERE tm.tramite_id = t.id
  ), '[]') AS mesas,
  COALESCE((
    SELECT json_agg(json_build_object('id', d.id, 'nombre', d.nombre, 'urlExterna', d.url_externa, 'conArchivo', d.archivo IS NOT NULL) ORDER BY d.id)
    FROM documentos d WHERE d.tramite_id = t.id
  ), '[]') AS documentos`;

const CLAVES_DETALLE = [
  'id', 'nombre', 'descripcion', 'costo', 'costoDetalle', 'informacionAdicional', 'verificadoEn', 'huellaImportacion',
  'encargadoId', 'publicado', 'createdAt', 'updatedAt', 'sectorId', 'fuenteUrl', 'requisitos', 'mesas', 'documentos',
];

// Una fila con COLUMNAS_DETALLE (y las de la búsqueda, que se descartan) → el trámite con su detalle.
export const detalleDeFila = (fila) => {
  const tramite = Object.fromEntries(CLAVES_DETALLE.map((c) => [c, fila[c]]));
  tramite.requisitos = fila.requisitos.map((r) => ({ ...r, costo: aDecimal(r.costo) }));
  return tramite;
};

// Un solo viaje a la base: el include de Prisma hacía una consulta por relación, en serie.
// Devuelve lo mismo que findMany con requisitos (por id), mesas con su mesa y los documentos (id, nombre,
// enlace externo, que la verificación de la salida acepta como enlace del trámite, y si tiene archivo en
// R2, sin la clave).
export const cargarDetalle = async (ids) => {
  const filas = await prisma.$queryRaw`
    SELECT t.id, t.nombre, t.sector_id AS "sectorId", ${COLUMNAS_DETALLE}
    FROM tramites t
    WHERE t.id = ANY(${ids}::int[])
  `;
  const porId = new Map(filas.map((t) => [t.id, detalleDeFila(t)]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
};
