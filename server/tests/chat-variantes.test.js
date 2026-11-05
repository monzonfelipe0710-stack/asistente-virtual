import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// Trámites con el mismo nombre en dos municipios. El modelo, la búsqueda y el registro se
// simulan; los sectores y trámites de prueba (borradores) se crean en la base y se borran al final.
let candidatos;
let salidaModelo;
let pedazosStream;
let llamadasModelo;
let registros;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      generarRespuesta: async (args) => {
        llamadasModelo.push(args);
        return JSON.stringify(salidaModelo);
      },
      async *generarRespuestaStream(args) {
        llamadasModelo.push(args);
        for (const p of pedazosStream) yield p;
      },
    },
  },
});
mock.module(servicio('services/metrica.service.js'), {
  namedExports: {
    registrarConsulta: async (datos) => {
      registros.push(datos);
      return { id: registros.length, calificarToken: `token-${registros.length}` };
    },
  },
});

const cache = await import('../src/services/cache.service.js');
const { responderConsulta, responderConsultaStream } = await import('../src/services/chat.service.js');

const DOMINIO = '@chat-variantes.test.invalid';
const SUFIJO = `chat-variantes-${Date.now()}`;
const NOMBRE = `Habilitación comercial ${SUFIJO}`;
let sectores = [];
let enClorinda;
let enPirane;
let otro;

const turno = (texto) => [{ rol: 'usuario', texto }];
const salida = (datos) => ({ saludo: '', tramiteId: null, tramitesUsados: [], opciones: [], respuesta: '', ...datos });
const meta = (datos) => `${JSON.stringify(salida({ ...datos, respuesta: undefined }))}\n`;
const grupo = () => ({ id: enClorinda.id, nombre: NOMBRE, variantes: [enClorinda, enPirane].map((t) => ({ id: t.id, nombre: NOMBRE, sectorId: t.sectorId })) });
const consumir = async (generador) => {
  const eventos = [];
  for await (const e of generador) eventos.push(e);
  return eventos;
};

describe('chat con trámites repetidos en distintos municipios', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    const crearSector = (nombre, datos) => prisma.sector.create({ data: { nombre: `${nombre} ${SUFIJO}`, tipo: 'ORGANISMO', ...datos } });
    sectores = [
      await crearSector('Municipalidad de Clorinda', { jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' }),
      await crearSector('Municipalidad de Pirané', { jurisdiccion: 'MUNICIPAL', localidad: 'Pirané' }),
      await crearSector('Dirección provincial', { jurisdiccion: 'PROVINCIAL' }),
    ];
    const crear = (nombre, descripcion, sector) =>
      prisma.tramite.create({ data: { nombre, descripcion, sectorId: sector.id, encargadoId: encargado.id } });
    enClorinda = await crear(NOMBRE, 'Descripción de Clorinda', sectores[0]);
    enPirane = await crear(NOMBRE, 'Descripción de Pirané', sectores[1]);
    otro = await crear(`Libre deuda ${SUFIJO}`, 'Otro trámite', sectores[2]);
  });

  beforeEach(() => {
    cache.limpiar();
    candidatos = [grupo()];
    llamadasModelo = [];
    registros = [];
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: { in: [enClorinda?.id, enPirane?.id, otro?.id].filter(Boolean) } } });
    await prisma.sector.deleteMany({ where: { id: { in: sectores.map((s) => s.id) } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('sin localidad, el servidor pregunta cuál y no usa el texto del modelo', async () => {
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enClorinda.id, tramitesUsados: [enClorinda.id], respuesta: 'En Clorinda se hace así.' });
    const r = await responderConsulta(turno('cómo saco la habilitación comercial'));

    assert.equal(r.tipo, 'aclaracion');
    assert.match(r.respuesta, /¿De qué localidad lo necesitás\? Está cargado para: Clorinda o Pirané\./);
    assert.ok(!r.respuesta.includes('se hace así'));
    assert.deepEqual(r.opciones, [
      { id: enClorinda.id, nombre: `${NOMBRE} en Clorinda`, jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' },
      { id: enPirane.id, nombre: `${NOMBRE} en Pirané`, jurisdiccion: 'MUNICIPAL', localidad: 'Pirané' },
    ]);
    assert.deepEqual(r.tramitesEncontrados, []);
    assert.equal(r.consultaId, null);
    assert.equal(registros.length, 0);
    assert.equal(cache.obtener('cómo saco la habilitación comercial'), null);
  });

  it('el modelo ve el grupo sin la descripción de ninguna variante', async () => {
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enClorinda.id });
    await responderConsulta(turno('habilitación comercial'));
    const instruccion = llamadasModelo[0].instruccionSistema;
    assert.match(instruccion, /Está cargado para varias jurisdicciones o localidades: municipal, Clorinda; municipal, Pirané\./);
    assert.ok(!instruccion.includes('Descripción de Clorinda') && !instruccion.includes('Descripción de Pirané'));
  });

  it('con la localidad nombrada, responde con esa variante', async () => {
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enPirane.id, tramitesUsados: [enPirane.id], respuesta: 'Se pide en la municipalidad.' });
    const r = await responderConsulta(turno('habilitación comercial en Pirane'));

    assert.equal(r.tipo, 'respuesta');
    assert.equal(r.encontrado, true);
    assert.deepEqual(r.tramitesEncontrados, [{ id: enPirane.id, nombre: NOMBRE }]);
    const instruccion = llamadasModelo[0].instruccionSistema;
    assert.ok(instruccion.includes('Descripción de Pirané') && !instruccion.includes('Descripción de Clorinda'));
    assert.equal(registros.length, 1);
  });

  it('el contexto de cada trámite trae el organismo, la jurisdicción y la localidad', async () => {
    candidatos = [{ id: otro.id }, grupo()];
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enPirane.id, tramitesUsados: [enPirane.id], respuesta: 'Así.' });
    await responderConsulta(turno('habilitación comercial en Pirané o libre deuda'));
    const instruccion = llamadasModelo[0].instruccionSistema;
    assert.ok(instruccion.includes(`Trámite (id ${enPirane.id}): ${NOMBRE}\nOrganismo: Municipalidad de Pirané ${SUFIJO}\nJurisdicción: municipal (Pirané)\nDescripción:`));
    assert.ok(instruccion.includes(`Organismo: Dirección provincial ${SUFIJO}\nJurisdicción: provincial\nDescripción:`));
  });

  it('la localidad dicha en un turno anterior también resuelve', async () => {
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enClorinda.id, tramitesUsados: [enClorinda.id], respuesta: 'Así.' });
    const r = await responderConsulta([
      { rol: 'usuario', texto: 'habilitación comercial' },
      { rol: 'asistente', texto: '¿De qué localidad?' },
      { rol: 'usuario', texto: 'clorinda' },
    ]);
    assert.equal(r.tipo, 'respuesta');
    assert.deepEqual(r.tramitesEncontrados.map((t) => t.id), [enClorinda.id]);
  });

  it('pregunta la localidad aunque se haya pasado el tope de aclaraciones', async () => {
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: enClorinda.id });
    const r = await responderConsulta([
      { rol: 'usuario', texto: 'necesito una habilitación' },
      { rol: 'asistente', texto: '¿Cuál?' },
      { rol: 'usuario', texto: 'la comercial' },
      { rol: 'asistente', texto: '¿Para qué rubro?' },
      { rol: 'usuario', texto: 'habilitación comercial' },
    ]);
    assert.equal(r.tipo, 'aclaracion');
    assert.equal(r.opciones.length, 2);
  });

  it('un grupo en "tramitesUsados" de otra respuesta no se cuenta como encontrado', async () => {
    candidatos = [{ id: otro.id }, grupo()];
    salidaModelo = salida({ tipo: 'respuesta', tramiteId: otro.id, tramitesUsados: [otro.id, enClorinda.id], respuesta: 'El libre deuda se pide así.' });
    const r = await responderConsulta(turno('libre deuda'));
    assert.equal(r.tipo, 'respuesta');
    assert.deepEqual(r.tramitesEncontrados.map((t) => t.id), [otro.id]);
  });

  it('una aclaración del modelo entre trámites distintos puede ofrecer el grupo', async () => {
    candidatos = [{ id: otro.id }, grupo()];
    salidaModelo = salida({ tipo: 'aclaracion', opciones: [otro.id, enClorinda.id], respuesta: '¿Cuál de los dos?' });
    const r = await responderConsulta(turno('un trámite municipal o provincial'));
    assert.equal(r.tipo, 'aclaracion');
    assert.deepEqual(r.opciones, [
      { id: otro.id, nombre: otro.nombre },
      { id: enClorinda.id, nombre: NOMBRE },
    ]);
  });

  it('una aclaración del modelo con el grupo como única opción pasa a ser la pregunta del servidor', async () => {
    salidaModelo = salida({ tipo: 'aclaracion', opciones: [enClorinda.id], respuesta: '¿De qué localidad?' });
    const r = await responderConsulta(turno('libre deuda'));
    assert.equal(r.tipo, 'aclaracion');
    assert.deepEqual(r.opciones.map((o) => o.localidad), ['Clorinda', 'Pirané']);
    assert.match(r.respuesta, /Está cargado para: Clorinda o Pirané/);
  });

  it('una conversación no se convierte en aclaración', async () => {
    salidaModelo = salida({ tipo: 'conversacion', respuesta: '¡Hola! ¿En qué trámite te ayudo?' });
    const r = await responderConsulta(turno('hola'));
    assert.equal(r.conversacional, true);
    assert.equal(r.tipo, 'respuesta');
  });

  it('en streaming, la pregunta sale con la línea META y no se transmite el texto del modelo', async () => {
    pedazosStream = [meta({ tipo: 'respuesta', saludo: 'Hola', tramiteId: enClorinda.id }), 'Esto no se tiene que ver.'];
    const eventos = await consumir(responderConsultaStream(turno('hola, habilitación comercial'), { id: null, nombre: 'María' }));

    const texto = eventos.filter((e) => e.tipo === 'delta').map((e) => e.texto).join('');
    assert.match(texto, /^¡Hola, María! «Habilitación comercial .*» depende de cada municipio\./);
    assert.ok(!texto.includes('no se tiene que ver'));
    const fin = eventos.at(-1);
    assert.equal(fin.tipo, 'fin');
    assert.equal(fin.tipoRespuesta, 'aclaracion');
    assert.deepEqual(fin.opciones.map((o) => o.localidad), ['Clorinda', 'Pirané']);
    assert.equal(registros.length, 0);
  });
});
