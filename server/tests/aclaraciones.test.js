import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import { enElFormato } from './helpers/formato-stream.js';

// La búsqueda y el modelo se simulan; el registro y las métricas son los reales, contra la base de
// prueba. Crea su usuario, sector, trámites y consultas, y los borra al terminar.
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
let candidatos = [];
let salidaModelo;
let pedazosStream;
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      corregirTexto: async ({ texto }) => texto,
      generarRespuesta: async () => JSON.stringify(salidaModelo),
      async *generarRespuestaStream() {
        for (const p of enElFormato(pedazosStream)) yield p;
      },
    },
  },
});

const { responderConsulta, responderConsultaStream } = await import('../src/services/chat.service.js');
const cache = await import('../src/services/cache.service.js');
const { consultasPorTramite, consultasSinRespuesta, consultasDeUsuario } = await import('../src/services/metrica.service.js');
const { listarCalificaciones, guardarCalificacion } = await import('../src/services/consulta.service.js');
const { leerPublicados } = await import('../src/services/catalogo.service.js');

const DOMINIO = '@aclaraciones.test.invalid';
const SUFIJO = `aclaraciones-test-${Date.now()}`;
const FECHA = '2019-06-15';
const salida = (datos) => ({ saludo: '', tramiteId: null, tramitesUsados: [], opciones: [], ...datos });
const meta = (datos) => `${JSON.stringify(salida({ ...datos, respuesta: undefined }))}\n`;
const consumir = async (generador) => {
  let fin;
  for await (const e of generador) if (e.tipo === 'fin') fin = e;
  return fin;
};

let usuario;
let sector;
let elegido;
let otro;
const aclaraciones = [];
const respuestas = [];
let sinRespuesta;

describe('aclaraciones en consultas y métricas', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    usuario = await prisma.usuario.create({ data: { nombre: 'Ana Prueba', email: `ana${DOMINIO}`, passwordHash: 'x', rol: 'CIUDADANO', estado: 'APROBADO' } });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'ORGANISMO' } });
    const crear = (nombre) => prisma.tramite.create({ data: { nombre: `${nombre} ${SUFIJO}`, descripcion: 'de prueba', sectorId: sector.id, encargadoId: usuario.id, publicado: true } });
    elegido = await crear('Elegido');
    otro = await crear('Otro');
    candidatos = [{ id: elegido.id }, { id: otro.id }];

    const pregunta = `necesito un trámite ${SUFIJO}`;
    const alRegistrarAclaracion = (id) => aclaraciones.push(id);
    cache.limpiar({ propagar: false });
    salidaModelo = salida({ tipo: 'aclaracion', opciones: [elegido.id, otro.id], respuesta: '¿Cuál de los dos?' });
    const r = await responderConsulta([{ rol: 'usuario', texto: pregunta }], usuario, { alRegistrarAclaracion });
    pedazosStream = [meta({ tipo: 'aclaracion', opciones: [elegido.id, otro.id] }), '¿Cuál de los dos?'];
    const fin = await consumir(responderConsultaStream([{ rol: 'usuario', texto: pregunta }], usuario, { alRegistrarAclaracion }));
    assert.deepEqual([r.tipo, r.consultaId, fin.tipoRespuesta, fin.consultaId], ['aclaracion', null, 'aclaracion', null]);

    const historial = [
      { rol: 'usuario', texto: pregunta },
      { rol: 'asistente', texto: '¿Cuál de los dos?', tipo: 'aclaracion' },
      { rol: 'usuario', texto: 'el elegido' },
    ];
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: elegido.id, respuesta: 'Así se hace.' });
    respuestas.push((await responderConsulta(historial, usuario)).consultaId);
    pedazosStream = [meta({ tipo: 'respuesta', tramiteId: elegido.id }), 'Así se hace.'];
    respuestas.push((await consumir(responderConsultaStream(historial, usuario))).consultaId);

    salidaModelo = salida({ tipo: 'respuesta', tramiteId: null, respuesta: 'No sé.' });
    sinRespuesta = (await responderConsulta([{ rol: 'usuario', texto: `algo que no está ${SUFIJO}` }], usuario)).consultaId;
  });

  after(async () => {
    await prisma.consulta.deleteMany({ where: { OR: [{ usuarioId: usuario?.id }, { id: { in: [...aclaraciones, ...respuestas, sinRespuesta].filter(Boolean) } }] } });
    await prisma.tramite.deleteMany({ where: { sectorId: sector?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('cada aclaración se guarda, en las dos rutas, como aclaración sin trámite ni token', async () => {
    assert.equal(aclaraciones.length, 2);
    const filas = await prisma.consulta.findMany({ where: { id: { in: aclaraciones } } });
    for (const f of filas) {
      assert.deepEqual(
        { tipo: f.tipo, encontrado: f.encontrado, tramiteId: f.tramiteId, calificarToken: f.calificarToken, usuarioId: f.usuarioId, respuesta: f.respuesta },
        { tipo: 'aclaracion', encontrado: false, tramiteId: null, calificarToken: null, usuarioId: usuario.id, respuesta: '¿Cuál de los dos?' },
      );
    }
  });

  it('el turno siguiente se guarda como respuesta con el trámite elegido y su token', async () => {
    assert.ok(respuestas.every(Boolean));
    const filas = await prisma.consulta.findMany({ where: { id: { in: respuestas } } });
    for (const f of filas) {
      assert.deepEqual([f.tipo, f.encontrado, f.tramiteId, f.textoConsulta], ['respuesta', true, elegido.id, 'el elegido']);
      assert.ok(f.calificarToken);
    }
  });

  it('no aparece en "sin respuesta" (una consulta sin trámite común sí)', async () => {
    const ids = new Set((await consultasSinRespuesta()).map((c) => c.id));
    assert.ok(ids.has(sinRespuesta));
    for (const id of aclaraciones) assert.equal(ids.has(id), false);
  });

  it('no aparece en el historial de la persona', async () => {
    const ids = (await consultasDeUsuario(usuario.id)).map((c) => c.id).sort((a, b) => a - b);
    assert.deepEqual(ids, [...respuestas, sinRespuesta].sort((a, b) => a - b));
  });

  it('no cuenta en las consultas por trámite ni en los más consultados del catálogo; el turno siguiente sí', async () => {
    const porTramite = await consultasPorTramite([sector.id]);
    assert.deepEqual(porTramite.map((g) => [g.tramiteId, g.cantidad]), [[elegido.id, 2]]);

    const publicados = new Map((await leerPublicados()).map((t) => [t.id, t.consultas]));
    assert.deepEqual([publicados.get(elegido.id), publicados.get(otro.id)], [2, 0]);
  });

  it('las calificaciones cuentan solo respuestas, aunque una aclaración tuviera calificación', async () => {
    await prisma.consulta.updateMany({ where: { id: { in: [...aclaraciones, ...respuestas] } }, data: { fecha: new Date(`${FECHA}T15:00:00Z`) } });
    assert.equal(await guardarCalificacion(respuestas[0], 1, null), true);
    await prisma.consulta.update({ where: { id: aclaraciones[0] }, data: { calificacion: 0 } });

    const r = await listarCalificaciones({ desde: FECHA, hasta: FECHA, page: 1, limit: 50, sectorIds: null });
    assert.deepEqual(r.items.map((i) => i.id), [respuestas[0]]);
    assert.deepEqual([r.resumen.total, r.resumen.utiles, r.resumen.noUtiles], [1, 1, 0]);
  });
});
