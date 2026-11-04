import 'dotenv/config';
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { obtenerResumenCatalogo } from '../src/services/catalogo.service.js';

// Solo lee la base del .env: no crea ni modifica nada.
const normalizar = (nombre) =>
  nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

describe('resumen del catálogo', () => {
  beforeEach(() => cache.limpiar());
  after(() => prisma.$disconnect());

  it('cuenta los trámites publicados', async () => {
    const r = await obtenerResumenCatalogo();
    assert.equal(r.totalPublicados, await prisma.tramite.count({ where: { publicado: true } }));
    assert.match(r.texto, new RegExp(`Trámites publicados: ${r.totalPublicados}\\.`));
  });

  it('trae hasta 12 sectores, de más a menos trámites publicados', async () => {
    const { sectores, texto } = await obtenerResumenCatalogo();
    assert.ok(sectores.length > 0 && sectores.length <= 12);
    for (let i = 1; i < sectores.length; i++) assert.ok(sectores[i - 1].cantidad >= sectores[i].cantidad);

    const [mayor] = await prisma.$queryRaw`
      SELECT count(*)::int AS cantidad FROM tramites WHERE publicado GROUP BY sector_id ORDER BY 1 DESC LIMIT 1`;
    assert.equal(sectores[0].cantidad, mayor.cantidad);
    for (const s of sectores) assert.ok(texto.includes(`${s.nombre} (${s.cantidad})`));
  });

  it('trae 8 ejemplos publicados, sin nombres repetidos, empezando por el más consultado', async () => {
    const { ejemplos } = await obtenerResumenCatalogo();
    assert.equal(ejemplos.length, 8);
    assert.equal(new Set(ejemplos.map(normalizar)).size, 8);

    const publicados = await prisma.tramite.findMany({ where: { publicado: true, nombre: { in: ejemplos } }, select: { nombre: true } });
    assert.equal(new Set(publicados.map((t) => t.nombre)).size, 8);

    const [masConsultado] = await prisma.$queryRaw`
      SELECT t.nombre FROM consultas c JOIN tramites t ON t.id = c.tramite_id
      WHERE c.encontrado AND t.publicado
      GROUP BY t.id, t.nombre ORDER BY count(*) DESC, t.id ASC LIMIT 1`;
    if (masConsultado) assert.equal(ejemplos[0], masConsultado.nombre);
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
