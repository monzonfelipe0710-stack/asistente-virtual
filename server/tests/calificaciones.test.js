import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { calificaciones } from '../src/controllers/consulta.controller.js';

// Crea sus propios sectores, trámites (sin publicar), usuarios y consultas en la base y los
// borra al terminar. Las consultas son de 2020 para que los filtros de fecha no mezclen datos reales.
const DOMINIO = '@calificaciones.test.invalid';
const SUFIJO = `calificaciones-test-${Date.now()}`;

let admA;
let admB;
let admSinSectores;
let su;
let tramiteA;
let tramiteB;
const sectoresCreados = [];
const consultas = {};

const llamar = async (usuario, query = {}) => {
  const res = { json(cuerpo) { res.cuerpo = cuerpo; return res; } };
  await calificaciones({ usuario, query }, res);
  return res.cuerpo;
};

const ids = (r) => r.items.map((i) => i.id);
const errorDeValidacion = (mensaje) => (err) => err.name === 'ZodError' && err.issues[0].message === mensaje;

describe('calificaciones de consultas', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const base = { nombre: 'Prueba', passwordHash: 'x', estado: 'APROBADO' };
    admA = await prisma.usuario.create({ data: { ...base, rol: 'ADMINISTRADOR', email: `a${DOMINIO}` } });
    admB = await prisma.usuario.create({ data: { ...base, rol: 'ADMINISTRADOR', email: `b${DOMINIO}` } });
    admSinSectores = await prisma.usuario.create({ data: { ...base, rol: 'ADMINISTRADOR', email: `sin${DOMINIO}` } });
    su = await prisma.usuario.create({ data: { ...base, rol: 'SUPERUSUARIO', email: `su${DOMINIO}` } });
    const ciudadano = await prisma.usuario.create({ data: { ...base, rol: 'CIUDADANO', email: `c${DOMINIO}` } });

    const sectorA = await prisma.sector.create({ data: { nombre: `A ${SUFIJO}`, tipo: 'DEPARTAMENTO' } });
    const sectorB = await prisma.sector.create({ data: { nombre: `B ${SUFIJO}`, tipo: 'DEPARTAMENTO' } });
    sectoresCreados.push(sectorA.id, sectorB.id);
    await prisma.usuarioSector.createMany({
      data: [{ usuarioId: admA.id, sectorId: sectorA.id }, { usuarioId: admB.id, sectorId: sectorB.id }],
    });

    const tramite = (sector, encargado) =>
      prisma.tramite.create({ data: { nombre: `T ${SUFIJO}`, descripcion: 'prueba', sectorId: sector.id, encargadoId: encargado.id } });
    tramiteA = await tramite(sectorA, admA);
    tramiteB = await tramite(sectorB, admB);

    const crear = async (clave, tramiteId, fecha, datos = {}) => {
      consultas[clave] = await prisma.consulta.create({
        data: {
          textoConsulta: `consulta ${clave}`,
          respuesta: `respuesta ${clave}`,
          tramiteId,
          fecha: new Date(fecha),
          usuarioId: ciudadano.id,
          calificarToken: `token-${SUFIJO}-${clave}`,
          ...datos,
        },
      });
    };
    await crear('a1', tramiteA.id, '2020-01-10T12:00:00Z', { calificacion: 1, topico: 'licencias' });
    await crear('a2', tramiteA.id, '2020-01-15T12:00:00Z', { calificacion: 1, topico: 'licencias' });
    await crear('a3', tramiteA.id, '2020-01-20T12:00:00Z', { calificacion: 0, motivoCalificacion: '  no respondió mi pregunta ', topico: 'haberes' });
    await crear('a4', tramiteA.id, '2020-01-31T23:00:00Z', { calificacion: 0, motivoCalificacion: 'NO ERA LO QUE BUSCABA' });
    await crear('a5', tramiteA.id, '2020-02-05T12:00:00Z', { calificacion: 0, motivoCalificacion: 'No me gusta' });
    await crear('a6', tramiteA.id, '2020-02-10T12:00:00Z', { calificacion: 0 });
    await crear('aSinCalificar', tramiteA.id, '2020-01-12T12:00:00Z');
    await crear('b1', tramiteB.id, '2020-01-11T12:00:00Z', { calificacion: 1, topico: 'licencias' });
    await crear('b2', tramiteB.id, '2020-01-12T12:00:00Z', { calificacion: 0, motivoCalificacion: 'La respuesta fue confusa' });
  });

  after(async () => {
    await prisma.consulta.deleteMany({ where: { id: { in: Object.values(consultas).map((c) => c.id) } } });
    await prisma.tramite.deleteMany({ where: { id: { in: [tramiteA?.id, tramiteB?.id].filter(Boolean) } } });
    await prisma.sector.deleteMany({ where: { id: { in: sectoresCreados } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('un ADM ve solo las calificadas de los trámites de sus sectores, con el resumen', async () => {
    const r = await llamar(admA);
    const { a1, a2, a3, a4, a5, a6 } = consultas;

    assert.deepEqual(ids(r), [a6.id, a5.id, a4.id, a3.id, a2.id, a1.id]);
    assert.equal(r.total, 6);
    assert.equal(r.page, 1);
    assert.deepEqual(r.resumen, {
      total: 6,
      utiles: 2,
      noUtiles: 4,
      satisfaccion: 33.3,
      porMotivo: [
        { motivo: 'No respondió mi pregunta', cantidad: 1 },
        { motivo: 'La información no es correcta', cantidad: 0 },
        { motivo: 'La respuesta fue confusa', cantidad: 0 },
        { motivo: 'No era lo que buscaba', cantidad: 1 },
        { motivo: 'Otro motivo', cantidad: 1 },
      ],
      porTopico: [{ topico: 'licencias', cantidad: 2 }, { topico: 'haberes', cantidad: 1 }],
    });
  });

  it('cada item trae solo los campos públicos, sin usuarioId ni calificarToken', async () => {
    const [item] = (await llamar(admA, { tramiteId: String(tramiteA.id), limit: '1' })).items;
    assert.deepEqual(Object.keys(item).sort(), [
      'calificacion', 'fecha', 'id', 'motivoCalificacion', 'respuesta', 'textoConsulta', 'topico', 'tramiteId',
    ]);
    assert.equal(item.respuesta, 'respuesta a6');
  });

  it('un ADM de otro sector no ve nada ajeno, ni filtrando por ese trámite', async () => {
    const r = await llamar(admB, { tramiteId: String(tramiteA.id) });
    assert.deepEqual(r.items, []);
    assert.equal(r.total, 0);
    assert.equal(r.resumen.satisfaccion, null);

    assert.deepEqual(ids(await llamar(admB)), [consultas.b2.id, consultas.b1.id]);
  });

  it('un ADM sin sectores no ve nada', async () => {
    const r = await llamar(admSinSectores);
    assert.equal(r.total, 0);
    assert.deepEqual(r.items, []);
  });

  it('un SU ve las de cualquier sector', async () => {
    assert.equal((await llamar(su, { tramiteId: String(tramiteA.id) })).total, 6);
    assert.deepEqual(ids(await llamar(su, { tramiteId: String(tramiteB.id) })), [consultas.b2.id, consultas.b1.id]);
  });

  it('filtra por calificación', async () => {
    const r = await llamar(admA, { calificacion: '0' });
    assert.deepEqual(ids(r), [consultas.a6.id, consultas.a5.id, consultas.a4.id, consultas.a3.id]);
    assert.equal(r.resumen.utiles, 0);
    assert.equal(r.resumen.satisfaccion, 0);
  });

  it('filtra por fechas: "hasta" con solo la fecha incluye ese día entero', async () => {
    const { a2, a3, a4 } = consultas;
    assert.deepEqual(ids(await llamar(admA, { desde: '2020-01-15', hasta: '2020-01-31' })), [a4.id, a3.id, a2.id]);
    assert.deepEqual(
      ids(await llamar(admA, { desde: '2020-01-15T00:00:00Z', hasta: '2020-01-31T00:00:00Z' })),
      [a3.id, a2.id],
    );
  });

  it('pagina con page y limit', async () => {
    const r = await llamar(admA, { page: '2', limit: '2' });
    assert.deepEqual(ids(r), [consultas.a4.id, consultas.a3.id]);
    assert.equal(r.page, 2);
    assert.equal(r.total, 6);
  });

  it('rechaza filtros inválidos', async () => {
    await assert.rejects(llamar(admA, { limit: '51' }), errorDeValidacion('El límite debe ser un entero entre 1 y 50.'));
    await assert.rejects(llamar(admA, { page: '0' }), errorDeValidacion('La página debe ser un entero mayor o igual a 1.'));
    await assert.rejects(llamar(admA, { calificacion: '2' }), errorDeValidacion('La calificación debe ser 0 o 1.'));
    await assert.rejects(llamar(admA, { tramiteId: 'abc' }), errorDeValidacion('El tramiteId debe ser un entero positivo.'));
    await assert.rejects(
      llamar(admA, { desde: 'ayer' }),
      errorDeValidacion('Las fechas deben estar en formato ISO (2026-11-04 o 2026-11-04T10:00:00Z).'),
    );
  });
});
