import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';

import prisma from '../src/config/prisma.js';
import { cargarDetalle } from '../src/services/chat.service.js';
import { puntuarGrupos } from '../src/services/busqueda.service.js';

// La implementación anterior, con el include de Prisma: el resultado nuevo tiene que ser idéntico.
const cargarDetalleAnterior = async (ids) => {
  const completos = await prisma.tramite.findMany({
    where: { id: { in: ids } },
    include: {
      requisitos: { orderBy: { id: 'asc' } },
      mesas: { include: { mesa: true }, orderBy: { mesaId: 'asc' } },
      documentos: { select: { id: true, nombre: true, urlExterna: true, archivo: true }, orderBy: { id: 'asc' } },
    },
  });
  const porId = new Map(completos.map((t) => [
    t.id,
    { ...t, documentos: t.documentos.map(({ archivo, ...d }) => ({ ...d, conArchivo: archivo !== null })) },
  ]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
};

const DOMINIO = '@detalle.test.invalid';
const SUFIJO = `detalle-test-${Date.now()}`;
let sector;
let mesaPropia;
let mesaGeneral;
let completo;
let vacio;
let enUso;

describe('cargarDetalle', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'DEPARTAMENTO' } });
    const base = { sectorId: sector.id, encargadoId: encargado.id };

    mesaPropia = await prisma.mesaEntrada.create({
      data: { nombre: `Mesa ${SUFIJO}`, direccion: 'Av. Siempre Viva 742', localidad: 'Formosa', horario: '7 a 13', sectorId: sector.id },
    });
    mesaGeneral = await prisma.mesaEntrada.create({ data: { nombre: `Mesa general ${SUFIJO}`, esGeneral: true } });

    completo = await prisma.tramite.create({
      data: {
        ...base,
        nombre: `Completo ${SUFIJO}`,
        descripcion: 'con todo cargado',
        costo: '1500.50',
        publicado: true,
        fuenteUrl: `https://${SUFIJO}.invalid/tramite`,
        requisitos: {
          create: [
            { descripcion: 'DNI', dondeSeConsigue: 'Registro Civil', costo: '250.75' },
            { descripcion: 'Foto carnet', costo: '0' },
            { descripcion: 'Formulario firmado' },
          ],
        },
        documentos: {
          create: [
            { nombre: 'Formulario A', archivo: `${SUFIJO}/a.pdf`, tipo: 'pdf' },
            { nombre: 'Formulario B', archivo: `${SUFIJO}/b.pdf` },
          ],
        },
      },
    });
    await prisma.tramiteMesa.create({ data: { tramiteId: completo.id, mesaId: mesaPropia.id } });
    await prisma.tramiteMesa.create({ data: { tramiteId: completo.id, mesaId: mesaGeneral.id } });

    vacio = await prisma.tramite.create({ data: { ...base, nombre: `Vacío ${SUFIJO}`, descripcion: '' } });

    enUso = await prisma.tramite.create({
      data: { ...base, nombre: `En uso ${SUFIJO}`, descripcion: 'comparte la mesa general', costo: '0', requisitos: { create: [{ descripcion: 'Nota' }] } },
    });
    await prisma.tramiteMesa.create({ data: { tramiteId: enUso.id, mesaId: mesaGeneral.id } });
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: { in: [completo?.id, vacio?.id, enUso?.id].filter(Boolean) } } });
    await prisma.mesaEntrada.deleteMany({ where: { id: { in: [mesaPropia?.id, mesaGeneral?.id].filter(Boolean) } } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('devuelve lo mismo que el include para un trámite completo', async () => {
    const anterior = await cargarDetalleAnterior([completo.id]);
    assert.equal(anterior[0].requisitos.length, 3);
    assert.equal(anterior[0].mesas.length, 2);
    assert.equal(anterior[0].documentos.length, 2);
    assert.ok(anterior[0].costo instanceof Prisma.Decimal);
    assert.deepStrictEqual(await cargarDetalle([completo.id]), anterior);
  });

  it('devuelve lo mismo que el include para un trámite sin datos', async () => {
    const anterior = await cargarDetalleAnterior([vacio.id]);
    assert.equal(anterior[0].costo, null);
    assert.equal(anterior[0].fuenteUrl, null);
    assert.deepStrictEqual(await cargarDetalle([vacio.id]), anterior);
  });

  it('devuelve lo mismo que el include para un trámite con una mesa que usa otro trámite', async () => {
    const anterior = await cargarDetalleAnterior([enUso.id]);
    assert.equal(anterior[0].mesas[0].mesa.id, mesaGeneral.id);
    assert.deepStrictEqual(await cargarDetalle([enUso.id]), anterior);
  });

  it('respeta el orden de los ids y descarta los que no existen', async () => {
    const ids = [enUso.id, -1, completo.id, vacio.id];
    const anterior = await cargarDetalleAnterior(ids);
    assert.deepEqual(anterior.map((t) => t.id), [enUso.id, completo.id, vacio.id]);
    assert.deepStrictEqual(await cargarDetalle(ids), anterior);
  });

  it('la búsqueda con alDetalle trae el mismo detalle que cargarDetalle, sin cambiar los grupos', async () => {
    const vector = Array.from({ length: 1536 }, (_, i) => Math.sin(i + 1));
    const ids = [completo.id, vacio.id, enUso.id];
    await prisma.$executeRaw`UPDATE tramites SET publicado = true, embedding = ${`[${vector.join(',')}]`}::vector WHERE id = ANY(${ids}::int[])`;
    let detalles = null;
    const sinDetalle = await puntuarGrupos(SUFIJO, vector, { limite: 10 });
    const conDetalle = await puntuarGrupos(SUFIJO, vector, { limite: 10, alDetalle: (porId) => (detalles = porId) });
    assert.deepStrictEqual(conDetalle, sinDetalle);
    const variantes = conDetalle.flatMap((g) => g.variantes.map((v) => v.id));
    for (const id of ids) assert.ok(variantes.includes(id), `falta ${id}`);
    assert.deepEqual([...detalles.keys()].sort(), [...variantes].sort());
    assert.deepStrictEqual(ids.map((id) => detalles.get(id)), await cargarDetalle(ids));
  });
});
