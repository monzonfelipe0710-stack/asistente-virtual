import 'dotenv/config';
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// El proveedor de IA se simula: cada texto recibe un vector propio y la primera llamada por
// lotes falla, para probar el reintento. Solo se reindexan los trámites del test (borradores),
// nunca el catálogo.
let llamadasLote = [];
let fallarPrimera = true;
const vectorPara = (texto) => Array.from({ length: 1536 }, (_, i) => (i === 0 ? texto.length / 10000 : 0.001));

mock.module(new URL('../src/core/ai/index.js', import.meta.url).href, {
  namedExports: {
    ia: {
      generarEmbedding: async (texto) => vectorPara(texto),
      generarEmbeddings: async (textos) => {
        llamadasLote.push(textos);
        if (textos.some((t) => t.includes('FALLA-SIEMPRE'))) throw new Error('texto rechazado');
        if (fallarPrimera) {
          fallarPrimera = false;
          throw new Error('falla simulada');
        }
        return { vectores: textos.map(vectorPara), tokens: textos.length * 10 };
      },
    },
  },
});

const { textoDeTramite, reindexarCatalogo, TOPES_EMBEDDING } = await import('../src/services/embedding.service.js');

describe('textoDeTramite', () => {
  it('incluye el organismo con su jurisdicción y localidad', () => {
    const texto = textoDeTramite(
      { nombre: 'Habilitación comercial', descripcion: 'Para abrir un comercio', requisitos: [{ descripcion: 'DNI' }] },
      { nombre: 'Municipalidad de Clorinda', jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' },
    );
    assert.equal(
      texto,
      'Trámite: Habilitación comercial. Organismo: Municipalidad de Clorinda (municipal, Clorinda). Descripción: Para abrir un comercio. Requisitos: DNI.',
    );
  });

  it('suma el costo en texto y la información adicional de la ficha, con tope; sin ellos el texto no cambia', () => {
    const base = { nombre: 'Certificado', descripcion: 'Constancia policial', requisitos: [{ descripcion: 'DNI' }] };
    const organismo = { nombre: 'Policía', jurisdiccion: 'PROVINCIAL', localidad: null };
    const sinFicha = textoDeTramite(base, organismo);
    assert.equal(sinFicha, 'Trámite: Certificado. Organismo: Policía (provincial). Descripción: Constancia policial. Requisitos: DNI.');
    assert.equal(textoDeTramite({ ...base, costoDetalle: null, informacionAdicional: null }, organismo), sinFicha);

    const conFicha = textoDeTramite({
      ...base,
      costoDetalle: 'Estampilla Primera vez: $ 5.000\nEstampilla Renovación: $ 5.000',
      informacionAdicional: `Modalidad: Personal\nDuración aproximada: 24 horas\n${'Observación larga. '.repeat(200)}`,
    }, organismo);
    assert.match(conFicha, /Costo: Estampilla Primera vez: \$ 5\.000; Estampilla Renovación: \$ 5\.000\./);
    const [, info] = conFicha.match(/Información adicional: (.*)$/);
    assert.ok(info.startsWith('Modalidad: Personal; Duración aproximada: 24 horas;'));
    assert.ok(info.length <= TOPES_EMBEDDING.informacionAdicional + 1);
  });

  it('un provincial sin localidad no la nombra', () => {
    const texto = textoDeTramite({ nombre: 'Pasaporte', descripcion: 'x', requisitos: [] }, { nombre: 'Registro Civil', jurisdiccion: 'PROVINCIAL', localidad: null });
    assert.match(texto, /Organismo: Registro Civil \(provincial\)\./);
  });
});

describe('reindexarCatalogo', () => {
  const DOMINIO = '@reindexado.test.invalid';
  const SUFIJO = `reindexado-test-${Date.now()}`;
  let sector;
  let ids;
  const silencioso = { log: () => {}, warn: () => {} };

  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Pirané' } });
    const creados = [];
    for (const n of [1, 2, 3]) {
      creados.push(await prisma.tramite.create({ data: { nombre: `Trámite ${n} ${SUFIJO}`, descripcion: 'x'.repeat(n * 10), sectorId: sector.id, encargadoId: encargado.id } }));
    }
    ids = creados.map((t) => t.id);
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: { in: ids } } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('estima sin llamar a la API', async () => {
    const r = await reindexarCatalogo({ ids, lote: 2, estimar: true, log: silencioso });
    assert.equal(r.tramites, 3);
    assert.equal(r.lotes, 2);
    assert.ok(r.tokens > 0 && r.costoUsd > 0);
    assert.equal(llamadasLote.length, 0);
  });

  it('reindexa en lotes, reintenta el que falla y guarda el vector de cada trámite', async () => {
    const r = await reindexarCatalogo({ ids, lote: 2, esperaBase: 1, log: silencioso });
    assert.equal(r.tramites, 3);
    assert.equal(r.tokens, 30);
    assert.deepEqual(llamadasLote.map((l) => l.length), [2, 2, 1]);
    assert.ok(llamadasLote[0][0].includes('Organismo: ') && llamadasLote[0][0].includes('(municipal, Pirané)'));

    const filas = await prisma.$queryRaw`SELECT id, (embedding::real[])[1] AS primero FROM tramites WHERE id = ANY(${ids}::int[]) ORDER BY id`;
    const textos = llamadasLote.slice(1).flat();
    assert.deepEqual(filas.map((f) => Number(f.primero.toFixed(4))), textos.map((t) => Number((t.length / 10000).toFixed(4))));
  });

  it('retoma desde un id', async () => {
    llamadasLote = [];
    const r = await reindexarCatalogo({ ids, desde: ids[2], log: silencioso });
    assert.equal(r.tramites, 1);
    assert.equal(llamadasLote.length, 1);
  });

  it('con continuarSiFalla prueba de a uno el lote que falla y registra solo el trámite rechazado', async () => {
    const malo = await prisma.tramite.create({ data: { nombre: `FALLA-SIEMPRE ${SUFIJO}`, descripcion: 'x', sectorId: sector.id, encargadoId: (await prisma.tramite.findUnique({ where: { id: ids[0] } })).encargadoId } });
    ids.push(malo.id);
    await prisma.$executeRaw`UPDATE tramites SET embedding = NULL WHERE id = ANY(${ids}::int[])`;
    llamadasLote = [];
    const r = await reindexarCatalogo({ ids: [ids[0], malo.id, ids[1]], lote: 3, reintentos: 1, esperaBase: 1, continuarSiFalla: true, log: silencioso });
    assert.deepEqual(r.reindexados.sort(), [ids[0], ids[1]].sort());
    assert.deepEqual(r.fallidos.map((f) => [f.id, f.motivo]), [[malo.id, 'embedding: texto rechazado']]);
    const filas = await prisma.$queryRaw`SELECT id, embedding IS NULL AS falta FROM tramites WHERE id = ANY(${[ids[0], ids[1], malo.id]}::int[]) ORDER BY id`;
    assert.deepEqual(filas.map((f) => f.falta), [false, false, true]);
  });

  it('sin continuarSiFalla corta e indica desde dónde retomar', async () => {
    await assert.rejects(
      reindexarCatalogo({ ids: [ids.at(-1)], reintentos: 0, esperaBase: 1, log: silencioso }),
      /reanudá con --desde/,
    );
  });
});
