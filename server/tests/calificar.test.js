import 'dotenv/config';
import crypto from 'node:crypto';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { calificar } from '../src/controllers/consulta.controller.js';

// Crea sus propios usuarios y consultas en la base y los borra al terminar.
const DOMINIO = '@calificar.test.invalid';

let duena;
let otra;
const consultasCreadas = [];

const nuevaConsulta = async (usuarioId = null) => {
  const consulta = await prisma.consulta.create({
    data: {
      textoConsulta: 'consulta de prueba',
      respuesta: 'respuesta de prueba',
      usuarioId,
      calificarToken: crypto.randomBytes(16).toString('hex'),
    },
  });
  consultasCreadas.push(consulta.id);
  return consulta;
};

const llamar = async (id, body, usuario) => {
  const res = { json(cuerpo) { res.cuerpo = cuerpo; return res; } };
  await calificar({ params: { id: String(id) }, body, usuario }, res);
  return res.cuerpo;
};

const guardada = (id) =>
  prisma.consulta.findUnique({ where: { id }, select: { calificacion: true, motivoCalificacion: true } });

const noEncontrada = { statusCode: 404, message: 'Consulta no encontrada.' };
const errorDeValidacion = (mensaje) => (err) => err.name === 'ZodError' && err.issues[0].message === mensaje;

describe('calificar consulta', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const base = { nombre: 'Prueba', passwordHash: 'x', rol: 'CIUDADANO', estado: 'APROBADO' };
    duena = await prisma.usuario.create({ data: { ...base, email: `duena${DOMINIO}` } });
    otra = await prisma.usuario.create({ data: { ...base, email: `otra${DOMINIO}` } });
  });

  after(async () => {
    await prisma.consulta.deleteMany({ where: { id: { in: consultasCreadas } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('la dueña logueada califica sin token', async () => {
    const c = await nuevaConsulta(duena.id);
    assert.deepEqual(await llamar(c.id, { calificacion: 1 }, duena), { consultaId: c.id, calificacion: 1 });
    assert.deepEqual(await guardada(c.id), { calificacion: 1, motivoCalificacion: null });
  });

  it('un anónimo califica con el token correcto y el motivo se guarda recortado', async () => {
    const c = await nuevaConsulta();
    const r = await llamar(c.id, { calificacion: 0, motivo: '  No era lo que buscaba  ', token: c.calificarToken });
    assert.deepEqual(r, { consultaId: c.id, calificacion: 0 });
    assert.deepEqual(await guardada(c.id), { calificacion: 0, motivoCalificacion: 'No era lo que buscaba' });
  });

  it('con calificación 1 ignora el motivo', async () => {
    const c = await nuevaConsulta();
    await llamar(c.id, { calificacion: 1, motivo: 'no debería quedar', token: c.calificarToken });
    assert.deepEqual(await guardada(c.id), { calificacion: 1, motivoCalificacion: null });
  });

  it('con un token inválido responde 404', async () => {
    const c = await nuevaConsulta();
    await assert.rejects(llamar(c.id, { calificacion: 1, token: 'f'.repeat(32) }), noEncontrada);
    await assert.rejects(llamar(c.id, { calificacion: 1, token: 'corto' }), noEncontrada);
    assert.equal((await guardada(c.id)).calificacion, null);
  });

  it('otra persona logueada sin el token recibe 404', async () => {
    const c = await nuevaConsulta(duena.id);
    await assert.rejects(llamar(c.id, { calificacion: 1 }, otra), noEncontrada);
    assert.equal((await guardada(c.id)).calificacion, null);
  });

  it('un anónimo sin token recibe 404, aunque la consulta sea anónima', async () => {
    const c = await nuevaConsulta();
    await assert.rejects(llamar(c.id, { calificacion: 1 }), noEncontrada);
  });

  it('una consulta inexistente responde 404', async () => {
    await assert.rejects(llamar(2147483647, { calificacion: 1, token: 'x' }), noEncontrada);
  });

  it('una segunda calificación responde 409 y no cambia la primera', async () => {
    const c = await nuevaConsulta(duena.id);
    await llamar(c.id, { calificacion: 0, motivo: 'primera' }, duena);
    await assert.rejects(llamar(c.id, { calificacion: 1 }, duena), {
      statusCode: 409,
      message: 'La consulta ya fue calificada.',
    });
    assert.deepEqual(await guardada(c.id), { calificacion: 0, motivoCalificacion: 'primera' });
  });

  it('rechaza un motivo de más de 300 caracteres', async () => {
    const c = await nuevaConsulta(duena.id);
    await assert.rejects(llamar(c.id, { calificacion: 0, motivo: 'a'.repeat(301) }, duena), errorDeValidacion('El motivo no puede superar los 300 caracteres.'));
    assert.deepEqual(await llamar(c.id, { calificacion: 0, motivo: 'a'.repeat(300) }, duena), {
      consultaId: c.id,
      calificacion: 0,
    });
  });

  it('rechaza una calificación que no sea 0 o 1', async () => {
    const c = await nuevaConsulta(duena.id);
    for (const calificacion of [2, -1, '1', true, null, undefined]) {
      await assert.rejects(llamar(c.id, { calificacion }, duena), errorDeValidacion('La calificación debe ser 0 (no útil) o 1 (útil).'));
    }
    assert.equal((await guardada(c.id)).calificacion, null);
  });
});
