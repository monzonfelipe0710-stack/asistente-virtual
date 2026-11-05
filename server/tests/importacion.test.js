import 'dotenv/config';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { importarCatalogo } from '../src/services/importacion.service.js';
import { leerSectoresParaResolver, resolverJurisdicciones } from '../src/services/jurisdiccion.service.js';

// Usa la base del .env con sectores y trámites propios (borradores), que se borran al terminar. Los
// embeddings no se generan: `indexar` solo anota los ids.
const SUFIJO = `importacion-test-${Date.now()}`;
const MUNICIPALIDAD = `Municipalidad de la Ciudad de Formosa ${SUFIJO}`;
const OTRA = `Municipalidad de Clorinda ${SUFIJO}`;
const SECRETARIA = `Secretaría de Gobierno ${SUFIJO}`;
const url = (n) => `https://${SUFIJO}.invalid/tramite/${n}`;

const catalogo = (cambios = {}) => ({
  sectores: [
    { nombre: SECRETARIA, tipo: 'DEPARTAMENTO', padre: MUNICIPALIDAD },
    { nombre: `Secretaría de Obras ${SUFIJO}`, tipo: 'DEPARTAMENTO', padre: MUNICIPALIDAD },
    { nombre: MUNICIPALIDAD, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa', ...cambios.municipalidad },
    { nombre: OTRA, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' },
    { nombre: SECRETARIA, tipo: 'DEPARTAMENTO', padre: OTRA },
  ],
  tramites: [
    { nombre: 'Habilitación comercial', descripcion: 'Formosa', sector: SECRETARIA, sectorPadre: MUNICIPALIDAD, fuenteUrl: url(1) },
    { nombre: 'Permiso de obra', descripcion: 'Formosa', sector: `Secretaría de Obras ${SUFIJO}`, fuenteUrl: url(2) },
    { nombre: 'Habilitación comercial', descripcion: 'Clorinda', sector: SECRETARIA, sectorPadre: OTRA, fuenteUrl: url(3) },
    { nombre: 'Sin sector claro', descripcion: 'x', sector: SECRETARIA, fuenteUrl: url(4) },
  ],
});

const silencioso = { log: () => {}, warn: () => {} };
const importar = (datos) => {
  const indexados = [];
  return importarCatalogo(datos, { indexar: async (id) => indexados.push(id), log: silencioso, publicar: false }).then((r) => ({ ...r, indexados }));
};
const idDe = (r, nombre, padre = null) => r.sectorIds.find((s) => s.nombre === nombre && s.padre === padre).id;

describe('importarCatalogo con jerarquía de sectores', () => {
  let primera;

  after(async () => {
    await prisma.tramite.deleteMany({ where: { fuenteUrl: { startsWith: `https://${SUFIJO}.invalid/` } } });
    const ids = primera?.sectorIds.map((s) => s.id).filter(Boolean) ?? [];
    await prisma.sector.deleteMany({ where: { id: { in: ids }, parentId: { not: null } } });
    await prisma.sector.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it('crea el padre antes que las hijas, que heredan jurisdicción y localidad', async () => {
    primera = await importar(catalogo());
    assert.deepEqual(primera.sectores, { creados: 5, actualizados: 0 });

    const municipalidad = idDe(primera, MUNICIPALIDAD);
    const secretaria = idDe(primera, SECRETARIA, MUNICIPALIDAD);
    const obras = idDe(primera, `Secretaría de Obras ${SUFIJO}`, MUNICIPALIDAD);
    const filas = await prisma.sector.findMany({ where: { id: { in: [secretaria, obras] } } });
    for (const f of filas) {
      assert.equal(f.parentId, municipalidad);
      assert.equal(f.jurisdiccion, null);
      assert.equal(f.localidad, null);
    }

    const resueltas = resolverJurisdicciones(await leerSectoresParaResolver());
    assert.equal(resueltas.get(secretaria).jurisdiccion, 'MUNICIPAL');
    assert.equal(resueltas.get(secretaria).localidad, 'Formosa');
    assert.equal(resueltas.get(obras).localidad, 'Formosa');
    assert.equal(resueltas.get(idDe(primera, SECRETARIA, OTRA)).localidad, 'Clorinda');
  });

  it('distingue hijas con el mismo nombre por su padre y saltea un trámite ambiguo', async () => {
    assert.notEqual(idDe(primera, SECRETARIA, MUNICIPALIDAD), idDe(primera, SECRETARIA, OTRA));
    const tramites = await prisma.tramite.findMany({ where: { fuenteUrl: { startsWith: `https://${SUFIJO}.invalid/` } }, orderBy: { fuenteUrl: 'asc' } });
    assert.deepEqual(tramites.map((t) => t.sectorId), [
      idDe(primera, SECRETARIA, MUNICIPALIDAD),
      idDe(primera, `Secretaría de Obras ${SUFIJO}`, MUNICIPALIDAD),
      idDe(primera, SECRETARIA, OTRA),
    ]);
    assert.deepEqual(primera.tramites, { creados: 3, actualizados: 0, salteados: 1 });
    assert.equal(primera.indexados.length, 3);
  });

  it('reimportar no duplica y actualiza la jurisdicción y la localidad de un sector existente', async () => {
    const segunda = await importar(catalogo({ municipalidad: { localidad: 'Formosa capital' } }));
    assert.equal(segunda.sectores.creados, 0);
    assert.deepEqual(segunda.tramites, { creados: 0, actualizados: 3, salteados: 1 });
    assert.equal(segunda.indexados.length, 0);
    assert.deepEqual(segunda.sectorIds.map((s) => s.id), primera.sectorIds.map((s) => s.id));

    const municipalidad = await prisma.sector.findUnique({ where: { id: idDe(primera, MUNICIPALIDAD) } });
    assert.equal(municipalidad.localidad, 'Formosa capital');
    assert.equal(municipalidad.jurisdiccion, 'MUNICIPAL');
  });

  it('un sector existente conserva lo que el JSON no trae', async () => {
    await importar(catalogo({ municipalidad: { jurisdiccion: undefined, localidad: undefined } }));
    const municipalidad = await prisma.sector.findUnique({ where: { id: idDe(primera, MUNICIPALIDAD) } });
    assert.equal(municipalidad.jurisdiccion, 'MUNICIPAL');
    assert.equal(municipalidad.localidad, 'Formosa capital');
  });
});
