import 'dotenv/config';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { municipalSinLocalidad, resolverJurisdicciones, subarbol } from '../src/services/jurisdiccion.service.js';
import { crearSector, actualizarSector } from '../src/services/sector.service.js';

const sector = (id, parentId, jurisdiccion = null, localidad = null) => ({ id, nombre: `S${id}`, parentId, jurisdiccion, localidad });

describe('resolverJurisdicciones', () => {
  it('un sector raíz sin datos es provincial y sin localidad', () => {
    assert.deepEqual(resolverJurisdicciones([sector(1, null)]).get(1), { nombre: 'S1', jurisdiccion: 'PROVINCIAL', localidad: null });
  });

  it('un hijo hereda jurisdicción y localidad del ancestro más cercano que las tenga', () => {
    const r = resolverJurisdicciones([sector(1, null, 'MUNICIPAL', 'Formosa'), sector(2, 1), sector(3, 2)]);
    assert.deepEqual(r.get(3), { nombre: 'S3', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa' });
  });

  it('cada campo se resuelve por separado', () => {
    const r = resolverJurisdicciones([sector(1, null, 'PROVINCIAL'), sector(2, 1, null, 'Clorinda'), sector(3, 2, 'NACIONAL')]);
    assert.deepEqual(r.get(2), { nombre: 'S2', jurisdiccion: 'PROVINCIAL', localidad: 'Clorinda' });
    assert.deepEqual(r.get(3), { nombre: 'S3', jurisdiccion: 'NACIONAL', localidad: 'Clorinda' });
  });

  it('no se cuelga con un ciclo', () => {
    const r = resolverJurisdicciones([sector(1, 2), sector(2, 1)]);
    assert.equal(r.get(1).jurisdiccion, 'PROVINCIAL');
  });

  it('el subárbol incluye a todos los descendientes', () => {
    assert.deepEqual([...subarbol([sector(1, null), sector(2, 1), sector(3, 2), sector(4, null)], 1)].sort(), [1, 2, 3]);
  });

  it('detecta un municipal sin localidad propia ni heredada en el subárbol', () => {
    assert.equal(municipalSinLocalidad([sector(1, null, 'MUNICIPAL', 'Formosa'), sector(2, 1)], 1), undefined);
    assert.equal(municipalSinLocalidad([sector(1, null, 'MUNICIPAL'), sector(2, 1, null, 'Pirané')], 1), 1);
  });
});

describe('sectores con jurisdicción', () => {
  const SUFIJO = `jurisdiccion-test-${Date.now()}`;
  const creados = [];

  after(async () => {
    await prisma.sector.deleteMany({ where: { id: { in: creados } } });
    await prisma.$disconnect();
  });

  it('un sector raíz nuevo queda provincial', async () => {
    const s = await crearSector({ nombre: `Raíz ${SUFIJO}`, tipo: 'ORGANISMO' });
    creados.push(s.id);
    assert.equal(s.jurisdiccion, 'PROVINCIAL');
    assert.equal(s.localidad, null);
  });

  it('rechaza un sector municipal sin localidad propia ni heredada', async () => {
    await assert.rejects(crearSector({ nombre: `Municipal ${SUFIJO}`, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL' }), { statusCode: 400 });
  });

  it('acepta una secretaría que hereda la localidad y rechaza sacársela al padre', async () => {
    const padre = await crearSector({ nombre: `Municipalidad ${SUFIJO}`, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa' });
    creados.push(padre.id);
    const hija = await crearSector({ nombre: `Secretaría ${SUFIJO}`, tipo: 'DEPARTAMENTO', parentId: padre.id });
    creados.push(hija.id);
    assert.equal(hija.jurisdiccion, null);

    await assert.rejects(actualizarSector(padre.id, { localidad: null }), { statusCode: 400 });
  });
});
