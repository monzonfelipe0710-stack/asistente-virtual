import 'dotenv/config';
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { normalizarNombre as normalizar } from '../src/utils/texto.js';
import { TOPES_RESUMEN, TRAMITES_DESTACADOS, armarResumen, armarTexto, mezclaEstable, obtenerResumenCatalogo } from '../src/services/catalogo.service.js';

// Un catálogo en memoria: no toca la base.
const SECTORES = new Map([
  [1, { nombre: 'Registro Civil', jurisdiccion: 'PROVINCIAL', localidad: null }],
  [2, { nombre: 'Rentas', jurisdiccion: 'PROVINCIAL', localidad: null }],
  [3, { nombre: 'Delegación Clorinda', jurisdiccion: 'PROVINCIAL', localidad: 'Clorinda' }],
  [4, { nombre: 'Migraciones', jurisdiccion: 'NACIONAL', localidad: null }],
  ...['Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'Ibarreta', 'Laguna Blanca'].map((l, i) => [10 + i, { nombre: `Municipalidad de ${l}`, jurisdiccion: 'MUNICIPAL', localidad: l }]),
]);
let siguiente = 0;
const tramite = (nombre, sectorId, consultas = 0) => ({ id: ++siguiente, nombre, sectorId, sector: SECTORES.get(sectorId).nombre, consultas });
const sintetico = () => {
  siguiente = 0;
  return [
    tramite('Pasaporte', 1, 3),
    tramite('Acta de nacimiento', 1, 9),
    tramite('Acta de matrimonio', 1),
    tramite('Ingresos brutos', 2, 5),
    tramite('Ingresos brutos', 3),
    tramite('Visa de residencia', 4),
    ...[10, 11, 12, 13, 14, 15].flatMap((s, i) => Array.from({ length: 6 - i }, (_, j) => tramite(j === 0 ? 'Habilitación comercial' : `Trámite ${j} ${s}`, s, j === 1 ? 2 : 0))),
  ];
};

describe('resumen del catálogo (en memoria)', () => {
  const r = armarResumen(sintetico(), SECTORES);
  const texto = armarTexto(r);

  it('cuenta por jurisdicción y agrupa los municipales por localidad', () => {
    assert.deepEqual(r.porJurisdiccion, { PROVINCIAL: 5, MUNICIPAL: 21, NACIONAL: 1 });
    assert.equal(r.localidadesMunicipales, 6);
    assert.match(texto, /^- Trámites publicados: 27 \(5 provinciales, 21 municipales de 6 localidades, 1 nacional\)\.$/m);
    const titulos = r.grupos.map((g) => (g.jurisdiccion === 'MUNICIPAL' ? g.localidad : g.jurisdiccion));
    assert.deepEqual(titulos, ['PROVINCIAL', 'Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'NACIONAL']);
  });

  it('una delegación provincial con localidad cuenta como provincial', () => {
    assert.equal(r.grupos[0].cantidad, 5);
    assert.ok(r.grupos[0].sectores.some((s) => s.nombre === 'Delegación Clorinda'));
  });

  it('acota las localidades con detalle y nombra las otras con su cantidad', () => {
    assert.equal(r.grupos.filter((g) => g.jurisdiccion === 'MUNICIPAL').length, TOPES_RESUMEN.localidadesConDetalle);
    assert.match(texto, /^- Otras localidades con trámites municipales: Ibarreta \(2\); Laguna Blanca \(1\)\.$/m);
  });

  it('los ejemplos van por consultas y después en un orden estable que no es el alfabético', () => {
    assert.deepEqual(r.destacados.slice(0, 3), ['Pasaporte', 'Acta de nacimiento', 'Ingresos brutos']);
    const sinConsultas = sintetico().filter((t) => t.consultas === 0);
    const esperado = [...sinConsultas].sort((a, b) => mezclaEstable(a.id) - mezclaEstable(b.id)).map((t) => t.nombre);
    const alfabetico = [...sinConsultas].map((t) => t.nombre).sort((a, b) => a.localeCompare(b, 'es'));
    assert.notDeepEqual(esperado, alfabetico);
    assert.deepEqual(armarResumen(sintetico(), SECTORES), r, 'el mismo catálogo da el mismo resumen');
  });

  it('no repite un nombre en todo el resumen', () => {
    assert.equal(new Set(r.ejemplos.map(normalizar)).size, r.ejemplos.length);
    assert.equal(r.ejemplos.filter((e) => e === 'Habilitación comercial').length, 1);
    for (const g of r.grupos) assert.ok(g.ejemplos.length <= TOPES_RESUMEN.ejemplosPorGrupo);
  });

  it('cada grupo muestra sus sectores con la cantidad, de más a menos', () => {
    for (const g of r.grupos) {
      for (let i = 1; i < g.sectores.length; i++) assert.ok(g.sectores[i - 1].cantidad >= g.sectores[i].cantidad);
      for (const s of g.sectores) assert.ok(texto.includes(`${s.nombre} (${s.cantidad})`));
    }
    assert.match(texto, /^- Trámites municipales de Formosa \(6\)\. Sectores con más trámites: Municipalidad de Formosa \(6\)\. Ejemplos: /m);
  });
});

// Solo lee la base del .env: no crea ni modifica nada.
describe('resumen del catálogo (base)', () => {
  beforeEach(() => cache.limpiar());
  after(() => prisma.$disconnect());

  it('cuenta los trámites publicados y los reparte por jurisdicción', async () => {
    const r = await obtenerResumenCatalogo();
    assert.equal(r.totalPublicados, await prisma.tramite.count({ where: { publicado: true } }));
    assert.equal(Object.values(r.porJurisdiccion).reduce((a, b) => a + b, 0), r.totalPublicados);
    assert.match(r.texto, new RegExp(`Trámites publicados: ${r.totalPublicados}[ .]`));
  });

  it(`trae ${TOPES_RESUMEN.ejemplos} ejemplos publicados, sin nombres repetidos, empezando por los destacados y después el más consultado`, async () => {
    const { destacados: ejemplos, texto } = await obtenerResumenCatalogo();
    assert.equal(ejemplos.length, TOPES_RESUMEN.ejemplos);
    assert.equal(new Set(ejemplos.map(normalizar)).size, ejemplos.length);
    assert.ok(texto.includes(`- Algunos trámites: ${ejemplos.join('; ')}.`));

    const publicados = await prisma.tramite.findMany({ where: { publicado: true, nombre: { in: ejemplos } }, select: { nombre: true } });
    assert.equal(new Set(publicados.map((t) => t.nombre)).size, ejemplos.length);

    const destacados = (
      await prisma.tramite.findMany({ where: { publicado: true, nombre: { in: TRAMITES_DESTACADOS } }, select: { nombre: true } })
    ).map((t) => t.nombre);
    const esperados = TRAMITES_DESTACADOS.filter((n) => destacados.includes(n));
    assert.deepEqual(ejemplos.slice(0, esperados.length), esperados);

    // Con empate cualquiera de los más consultados sirve: el desempate es la mezcla estable.
    const masConsultados = await prisma.$queryRaw`
      WITH conteo AS (
        SELECT t.nombre, count(*) AS n FROM consultas c JOIN tramites t ON t.id = c.tramite_id
        WHERE c.encontrado AND t.publicado AND NOT (t.nombre = ANY(${TRAMITES_DESTACADOS}))
        GROUP BY t.id, t.nombre
      )
      SELECT nombre FROM conteo WHERE n = (SELECT max(n) FROM conteo)`;
    if (masConsultados.length > 0) assert.ok(masConsultados.map((f) => f.nombre).includes(ejemplos[esperados.length]));
  });

  it('los destacados existen en la base y están publicados', async () => {
    const publicados = await prisma.tramite.findMany({ where: { publicado: true, nombre: { in: TRAMITES_DESTACADOS } }, select: { nombre: true } });
    assert.deepEqual(new Set(publicados.map((t) => t.nombre)), new Set(TRAMITES_DESTACADOS));
  });

  it('queda acotado', async () => {
    const { texto } = await obtenerResumenCatalogo();
    assert.ok(texto.length < 2500, `largo ${texto.length}`);
  });

  it('queda en memoria hasta que se limpia la caché', async () => {
    const primero = await obtenerResumenCatalogo();
    assert.equal(await obtenerResumenCatalogo(), primero);

    cache.limpiar();
    const despues = await obtenerResumenCatalogo();
    assert.notEqual(despues, primero);
    assert.deepEqual(despues, primero);
  });
});
