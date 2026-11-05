import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { importarCatalogo, formatearInforme } from '../src/services/importacion.service.js';
import { leerSectoresParaResolver, resolverJurisdicciones } from '../src/services/jurisdiccion.service.js';

// Usa la base del .env con sectores y trámites propios (borradores), que se borran al terminar. Los
// embeddings no se piden a la API: `reindexar` escribe un vector fijo y anota los ids.
const SUFIJO = `importacion-test-${Date.now()}`;
const DOMINIO = '@importacion.test.invalid';
const MUNICIPALIDAD = `Municipalidad de la Ciudad de Formosa ${SUFIJO}`;
const OTRA = `Municipalidad de Clorinda ${SUFIJO}`;
const SECRETARIA = `Secretaría de Gobierno ${SUFIJO}`;
const OBRAS = `Secretaría de Obras ${SUFIJO}`;
const url = (n) => `https://${SUFIJO}.invalid/tramite/${n}`;
const VECTOR = `[${Array.from({ length: 1536 }, () => 0.001).join(',')}]`;

const sectores = (cambios = {}) => [
  { nombre: SECRETARIA, tipo: 'DEPARTAMENTO', padre: MUNICIPALIDAD },
  { nombre: OBRAS, tipo: 'DEPARTAMENTO', padre: MUNICIPALIDAD },
  { nombre: MUNICIPALIDAD, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa', ...cambios.municipalidad },
  { nombre: OTRA, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' },
  { nombre: SECRETARIA, tipo: 'DEPARTAMENTO', padre: OTRA },
];
const tramitesBase = () => [
  { nombre: 'Habilitación comercial', descripcion: 'Formosa', sector: SECRETARIA, sectorPadre: MUNICIPALIDAD, fuenteUrl: url(1) },
  { nombre: 'Permiso de obra', descripcion: 'Formosa', sector: OBRAS, fuenteUrl: url(2) },
  { nombre: 'Habilitación comercial', descripcion: 'Clorinda', sector: SECRETARIA, sectorPadre: OTRA, fuenteUrl: url(3) },
  { nombre: 'Sin sector claro', descripcion: 'x', sector: SECRETARIA, fuenteUrl: url(4) },
];
const catalogo = (cambios = {}, tramites = tramitesBase()) => ({ sectores: sectores(cambios), tramites });

const silencioso = { log: () => {}, warn: () => {} };
let fallarEmbeddingDe = new Set();
const reindexar = async (ids) => {
  const ok = ids.filter((id) => !fallarEmbeddingDe.has(id));
  if (ok.length > 0) await prisma.$executeRaw`UPDATE tramites SET embedding = ${VECTOR}::vector WHERE id = ANY(${ok}::int[])`;
  return { reindexados: ok, fallidos: ids.filter((id) => fallarEmbeddingDe.has(id)).map((id) => ({ id, nombre: null, motivo: 'embedding: falla simulada' })) };
};
const importar = (datos, opciones = {}) => importarCatalogo(datos, { reindexar, log: silencioso, publicar: false, ...opciones });
const idDe = (r, nombre, padre = null) => r.sectorIds.find((s) => s.nombre === nombre && s.padre === padre).id;
const cuantos = (r) => ({ creados: r.creados.length, actualizados: r.actualizados.length, sinCambios: r.sinCambios, fallidos: r.fallidos.length, conflictos: r.conflictos.length });
const foto = async () => ({
  tramites: await prisma.tramite.count({ where: { sector: { nombre: { endsWith: SUFIJO } } } }),
  publicados: await prisma.tramite.count({ where: { publicado: true, sector: { nombre: { endsWith: SUFIJO } } } }),
  sectores: await prisma.sector.count({ where: { nombre: { endsWith: SUFIJO } } }),
});
const delTest = () => prisma.tramite.findMany({ where: { sector: { nombre: { endsWith: SUFIJO } } }, orderBy: { id: 'asc' } });

describe('importarCatalogo', () => {
  let primera;
  let manual;

  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    manual = await prisma.usuario.create({ data: { nombre: 'Carga manual', email: `manual${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' } });
  });

  after(async () => {
    const ids = primera?.sectorIds.map((s) => s.id).filter(Boolean) ?? [];
    await prisma.tramite.deleteMany({ where: { sectorId: { in: ids } } });
    await prisma.sector.deleteMany({ where: { id: { in: ids }, parentId: { not: null } } });
    await prisma.sector.deleteMany({ where: { id: { in: ids } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('crea el padre antes que las hijas, que heredan jurisdicción y localidad', async () => {
    primera = await importar(catalogo());
    assert.deepEqual(primera.sectores, { creados: 5, actualizados: 0 });
    assert.equal(primera.cache.invalidada, true);
    assert.ok(primera.cache.version);

    const municipalidad = idDe(primera, MUNICIPALIDAD);
    const secretaria = idDe(primera, SECRETARIA, MUNICIPALIDAD);
    const obras = idDe(primera, OBRAS, MUNICIPALIDAD);
    const filas = await prisma.sector.findMany({ where: { id: { in: [secretaria, obras] } } });
    for (const f of filas) {
      assert.equal(f.parentId, municipalidad);
      assert.equal(f.jurisdiccion, null);
      assert.equal(f.localidad, null);
    }

    const resueltas = resolverJurisdicciones(await leerSectoresParaResolver());
    assert.equal(resueltas.get(secretaria).localidad, 'Formosa');
    assert.equal(resueltas.get(obras).localidad, 'Formosa');
    assert.equal(resueltas.get(idDe(primera, SECRETARIA, OTRA)).localidad, 'Clorinda');
  });

  it('distingue hijas con el mismo nombre por su padre y registra el trámite ambiguo como fallido', async () => {
    assert.notEqual(idDe(primera, SECRETARIA, MUNICIPALIDAD), idDe(primera, SECRETARIA, OTRA));
    const tramites = await delTest();
    assert.deepEqual(tramites.map((t) => t.sectorId), [
      idDe(primera, SECRETARIA, MUNICIPALIDAD),
      idDe(primera, OBRAS, MUNICIPALIDAD),
      idDe(primera, SECRETARIA, OTRA),
    ]);
    assert.deepEqual(cuantos(primera), { creados: 3, actualizados: 0, sinCambios: 0, fallidos: 1, conflictos: 0 });
    assert.match(primera.fallidos[0].motivo, /sector no encontrado o ambiguo/);
    assert.deepEqual([...primera.reindexados].sort(), tramites.map((t) => t.id).sort());
  });

  it('reimportar no duplica, cuenta sin cambios y reindexa los trámites de un sector que cambió', async () => {
    const segunda = await importar(catalogo({ municipalidad: { localidad: 'Formosa capital' } }));
    assert.equal(segunda.sectores.creados, 0);
    assert.equal(segunda.sectores.actualizados, 1);
    assert.deepEqual(cuantos(segunda), { creados: 0, actualizados: 0, sinCambios: 3, fallidos: 1, conflictos: 0 });
    assert.deepEqual(segunda.sectorIds.map((s) => s.id), primera.sectorIds.map((s) => s.id));

    const deFormosa = await prisma.tramite.findMany({ where: { fuenteUrl: { in: [url(1), url(2)] } }, select: { id: true } });
    assert.deepEqual([...segunda.reindexados].sort(), deFormosa.map((t) => t.id).sort());
  });

  it('sin cambios no reindexa nada; un embedding null se reindexa aunque el trámite no cambie', async () => {
    const tercera = await importar(catalogo({ municipalidad: { localidad: 'Formosa capital' } }));
    assert.equal(tercera.reindexados.length, 0);
    assert.equal(tercera.cache.invalidada, false, 'sin cambios no se invalida la caché');

    const [permiso] = await prisma.tramite.findMany({ where: { fuenteUrl: url(2) } });
    await prisma.$executeRaw`UPDATE tramites SET embedding = NULL WHERE id = ${permiso.id}`;
    const cuarta = await importar(catalogo({ municipalidad: { localidad: 'Formosa capital' } }));
    assert.equal(cuarta.sinCambios, 3);
    assert.deepEqual(cuarta.reindexados, [permiso.id]);
  });

  it('un sector existente conserva lo que el JSON no trae', async () => {
    await importar(catalogo({ municipalidad: { jurisdiccion: undefined, localidad: undefined } }));
    const municipalidad = await prisma.sector.findUnique({ where: { id: idDe(primera, MUNICIPALIDAD) } });
    assert.equal(municipalidad.jurisdiccion, 'MUNICIPAL');
    assert.equal(municipalidad.localidad, 'Formosa capital');
  });

  it('sin fuenteUrl identifica por sector y nombre normalizado y no duplica', async () => {
    const sinUrl = (descripcion, nombre = 'Libre deuda municipal') => [{ nombre, descripcion, sector: OBRAS }];
    const a = await importar(catalogo({}, sinUrl('v1')));
    assert.equal(a.creados.length, 1);
    const b = await importar(catalogo({}, sinUrl('v2', '  LIBRE  deuda Municipal ')));
    assert.deepEqual(cuantos(b), { creados: 0, actualizados: 1, sinCambios: 0, fallidos: 0, conflictos: 0 });
    const filas = await prisma.tramite.findMany({ where: { sectorId: idDe(primera, OBRAS, MUNICIPALIDAD), fuenteUrl: null } });
    assert.equal(filas.length, 1);
    assert.equal(filas[0].descripcion, 'v2');
  });

  it('el mismo trámite repetido en el JSON queda como conflicto', async () => {
    const r = await importar(catalogo({}, [
      { nombre: 'Repetido', descripcion: 'a', sector: OBRAS },
      { nombre: 'repetido', descripcion: 'b', sector: OBRAS },
      { nombre: 'Con URL', descripcion: 'a', sector: OBRAS, fuenteUrl: url(9) },
      { nombre: 'Con URL bis', descripcion: 'b', sector: OBRAS, fuenteUrl: url(9) },
    ]));
    assert.equal(r.creados.length, 2);
    assert.equal(r.conflictos.length, 2);
  });

  it('no pisa un trámite cargado a mano con el mismo nombre en el sector', async () => {
    const sectorId = idDe(primera, SECRETARIA, MUNICIPALIDAD);
    const aMano = await prisma.tramite.create({ data: { nombre: 'Carnet de sanidad', descripcion: 'cargado a mano', sectorId, encargadoId: manual.id } });
    const r = await importar(catalogo({}, [{ nombre: 'Carnet de Sanidad', descripcion: 'del JSON', sector: SECRETARIA, sectorPadre: MUNICIPALIDAD }]));
    assert.deepEqual(cuantos(r), { creados: 0, actualizados: 0, sinCambios: 0, fallidos: 0, conflictos: 1 });
    assert.equal(r.conflictos[0].existenteId, aMano.id);
    assert.equal((await prisma.tramite.findUnique({ where: { id: aMano.id } })).descripcion, 'cargado a mano');
  });

  it('una fuenteUrl que ya es de un trámite de otro sector queda como conflicto y no lo mueve', async () => {
    const r = await importar(catalogo({}, [{ nombre: 'Habilitación comercial', descripcion: 'otra', sector: OBRAS, fuenteUrl: url(1) }]));
    assert.equal(r.conflictos.length, 1);
    assert.match(r.conflictos[0].motivo, /otro sector/);
    const original = await prisma.tramite.findUnique({ where: { fuenteUrl: url(1) } });
    assert.equal(original.sectorId, idDe(primera, SECRETARIA, MUNICIPALIDAD));
    assert.equal(original.descripcion, 'Formosa');
  });

  it('un trámite inválido o un embedding que falla se registran y la corrida sigue', async () => {
    const [clorinda] = await prisma.tramite.findMany({ where: { fuenteUrl: url(3) } });
    fallarEmbeddingDe = new Set([clorinda.id]);
    try {
      const r = await importar(catalogo({}, [
        { nombre: 'Sin descripción', sector: OBRAS, fuenteUrl: url(10) },
        { nombre: 'Habilitación comercial', descripcion: 'Clorinda nueva', sector: SECRETARIA, sectorPadre: OTRA, fuenteUrl: url(3) },
        { nombre: 'Posterior', descripcion: 'sigue', sector: OBRAS, fuenteUrl: url(11) },
      ]));
      assert.equal(r.actualizados.length, 1);
      assert.equal(r.creados.length, 1);
      assert.deepEqual(r.fallidos.map((f) => f.motivo), ['falta el nombre o la descripción', 'embedding: falla simulada']);
      assert.match(formatearInforme(r), /2 fallidos/);
    } finally {
      fallarEmbeddingDe = new Set();
    }
  });

  it('--dry-run informa lo que haría sin escribir', async () => {
    await prisma.tramite.updateMany({ where: { sector: { nombre: { endsWith: SUFIJO } } }, data: { publicado: true } });
    const antes = await foto();
    const r = await importar({
      sectores: [...sectores(), { nombre: `Nueva ${SUFIJO}`, tipo: 'DEPARTAMENTO', padre: MUNICIPALIDAD }],
      tramites: [
        { nombre: 'Nuevo en sector nuevo', descripcion: 'x', sector: `Nueva ${SUFIJO}`, fuenteUrl: url(20) },
        { nombre: 'Habilitación comercial', descripcion: 'cambiada', sector: SECRETARIA, sectorPadre: MUNICIPALIDAD, fuenteUrl: url(1) },
      ],
    }, { simular: true, completa: true, despublicarFaltantes: true });
    assert.equal(r.simulado, true);
    assert.equal(r.cache.invalidada, false);
    assert.equal(r.sectores.creados, 1);
    assert.deepEqual(cuantos(r), { creados: 1, actualizados: 1, sinCambios: 0, fallidos: 0, conflictos: 0 });
    assert.ok(r.despublicados.length > 0);
    assert.deepEqual(await foto(), antes);
    assert.equal((await prisma.tramite.findUnique({ where: { fuenteUrl: url(1) } })).descripcion, 'Formosa');
    assert.match(formatearInforme(r), /SIMULACIÓN/);
  });

  describe('despublicar faltantes', () => {
    it('exige --completa', async () => {
      await assert.rejects(importar(catalogo(), { despublicarFaltantes: true }), /completa/);
    });

    it('despublica solo trámites del importador de esos sectores que no vinieron, nunca los cargados a mano', async () => {
      await prisma.tramite.updateMany({ where: { sector: { nombre: { endsWith: SUFIJO } } }, data: { publicado: true } });
      const soloFormosa = tramitesBase().slice(0, 1);
      const r = await importar(catalogo({}, soloFormosa), { completa: true, despublicarFaltantes: true });
      assert.equal(r.despublicacion, 'hecha');

      const filas = await delTest();
      const publicados = filas.filter((t) => t.publicado);
      assert.deepEqual(
        publicados.map((t) => t.fuenteUrl ?? t.descripcion).sort(),
        [url(1), 'cargado a mano'].sort(),
      );
      assert.ok(r.despublicados.every((d) => filas.some((t) => t.id === d.id)));
    });

    it('no despublica nada si un trámite del JSON no se pudo identificar', async () => {
      await prisma.tramite.updateMany({ where: { sector: { nombre: { endsWith: SUFIJO } } }, data: { publicado: true } });
      const r = await importar(catalogo({}, [{ nombre: 'Huérfano', descripcion: 'x', sector: 'No existe' }]), { completa: true, despublicarFaltantes: true });
      assert.match(r.despublicacion, /^omitida/);
      assert.equal(r.despublicados.length, 0);
      assert.ok((await delTest()).every((t) => t.publicado));
    });
  });
});
