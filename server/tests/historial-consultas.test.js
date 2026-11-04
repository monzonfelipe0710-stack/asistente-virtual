import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { misConsultas, quitarDelHistorial } from '../src/controllers/consulta.controller.js';

// Crea sus propios usuarios y consultas en la base y los borra al terminar.
const DOMINIO = '@historial.test.invalid';

let duena;
let otra;
const consultasCreadas = [];

const nuevaConsulta = async (datos) => {
  const consulta = await prisma.consulta.create({ data: { textoConsulta: 'consulta de prueba', ...datos } });
  consultasCreadas.push(consulta.id);
  return consulta;
};

const respuesta = () => {
  const res = {
    status(codigo) { res.codigo = codigo; return res; },
    send() { return res; },
    json(cuerpo) { res.cuerpo = cuerpo; return res; },
  };
  return res;
};

const listar = async (usuario) => {
  const res = respuesta();
  await misConsultas({ usuario }, res);
  return res.cuerpo;
};

const quitar = async (id, usuario) => {
  const res = respuesta();
  await quitarDelHistorial({ params: { id: String(id) }, usuario }, res);
  return res.codigo;
};

const noEncontrada = { statusCode: 404, message: 'Consulta no encontrada.' };

describe('historial de consultas', () => {
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

  it('/mias devuelve la respuesta, la calificación y el motivo', async () => {
    const c = await nuevaConsulta({
      usuarioId: duena.id,
      respuesta: 'texto mostrado',
      calificacion: 0,
      motivoCalificacion: 'no me sirvió',
    });
    const item = (await listar(duena)).find((x) => x.id === c.id);
    assert.equal(item.respuesta, 'texto mostrado');
    assert.equal(item.calificacion, 0);
    assert.equal(item.motivoCalificacion, 'no me sirvió');
  });

  it('la dueña la saca de su historial sin borrar la fila', async () => {
    const c = await nuevaConsulta({ usuarioId: duena.id, calificacion: 1 });
    assert.equal(await quitar(c.id, duena), 204);

    assert.ok(!(await listar(duena)).some((x) => x.id === c.id));
    const fila = await prisma.consulta.findUnique({ where: { id: c.id } });
    assert.equal(fila.usuarioId, null);
    assert.equal(fila.calificacion, 1);
  });

  it('otra persona recibe 404 y la consulta sigue en el historial de la dueña', async () => {
    const c = await nuevaConsulta({ usuarioId: duena.id });
    await assert.rejects(quitar(c.id, otra), noEncontrada);
    assert.equal((await prisma.consulta.findUnique({ where: { id: c.id } })).usuarioId, duena.id);
  });

  it('una consulta anónima, inexistente o ya quitada responde 404', async () => {
    const anonima = await nuevaConsulta({});
    await assert.rejects(quitar(anonima.id, duena), noEncontrada);
    await assert.rejects(quitar(2147483647, duena), noEncontrada);

    const c = await nuevaConsulta({ usuarioId: duena.id });
    await quitar(c.id, duena);
    await assert.rejects(quitar(c.id, duena), noEncontrada);
  });
});
