import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// Un trámite provincial y uno de la Municipalidad de la Ciudad de Formosa con el mismo nombre (y
// otro par de nombres parecidos). El modelo, la búsqueda y el registro se simulan; los sectores y
// trámites de prueba (borradores) se crean en la base y se borran al final.
let candidatos;
let salidaModelo;
let llamadasModelo;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      generarRespuesta: async (args) => {
        llamadasModelo.push(args);
        return JSON.stringify(salidaModelo);
      },
      async *generarRespuestaStream() {},
    },
  },
});
mock.module(servicio('services/metrica.service.js'), {
  namedExports: { registrarConsulta: async () => ({ id: 1, calificarToken: 'token' }) },
});

const cache = await import('../src/services/cache.service.js');
const { responderConsulta } = await import('../src/services/chat.service.js');

const DOMINIO = '@chat-municipal.test.invalid';
const SUFIJO = `chat-municipal-${Date.now()}`;
const NOMBRE = `Cambio de titularidad ${SUFIJO}`;
const MUNICIPALIDAD = `Municipalidad de la Ciudad de Formosa ${SUFIJO}`;
const AIM = `Administración de Ingresos Municipales ${SUFIJO}`;
let sectores = [];
let tramites = [];
let provincial;
let municipal;
let habilitacionProvincial;
let habilitacionMunicipal;

const turno = (texto) => [{ rol: 'usuario', texto }];
const salida = (datos) => ({ saludo: '', tramiteId: null, tramitesUsados: [], opciones: [], respuesta: '', ...datos });
const grupo = () => ({ id: provincial.id, nombre: NOMBRE, variantes: [provincial, municipal].map((t) => ({ id: t.id, nombre: NOMBRE, sectorId: t.sectorId })) });
const responder = (id) => salida({ tipo: 'respuesta', tramiteId: id, tramitesUsados: [id], respuesta: 'Se hace así.' });
const tras = (respuesta) => [
  { rol: 'usuario', texto: 'cómo hago el cambio de titularidad' },
  { rol: 'asistente', texto: 'Hay más de un trámite. ¿Necesitás el trámite provincial o el de la Municipalidad de Formosa?' },
  { rol: 'usuario', texto: respuesta },
];

describe('chat con un trámite provincial y uno de la Municipalidad de Formosa', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    const rentas = await prisma.sector.create({ data: { nombre: `Dirección General de Rentas ${SUFIJO}`, tipo: 'ORGANISMO', jurisdiccion: 'PROVINCIAL' } });
    const raiz = await prisma.sector.create({ data: { nombre: MUNICIPALIDAD, tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa' } });
    const aim = await prisma.sector.create({ data: { nombre: AIM, tipo: 'DEPARTAMENTO', parentId: raiz.id } });
    sectores = [aim, raiz, rentas];
    const crear = (nombre, descripcion, sector) =>
      prisma.tramite.create({ data: { nombre, descripcion, sectorId: sector.id, encargadoId: encargado.id } });
    provincial = await crear(NOMBRE, 'Cambio de titularidad ante Rentas de la provincia.', rentas);
    municipal = await crear(NOMBRE, 'Cambio de titularidad del vehículo en la AIM.', aim);
    habilitacionProvincial = await crear(`Habilitación de industria ${SUFIJO}`, 'Registro industrial provincial.', rentas);
    habilitacionMunicipal = await crear(`Requisitos de habilitaciones comerciales ${SUFIJO}`, 'Habilitación de un local en la ciudad.', aim);
    tramites = [provincial, municipal, habilitacionProvincial, habilitacionMunicipal];
  });

  beforeEach(() => {
    cache.limpiar();
    candidatos = [grupo()];
    llamadasModelo = [];
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: { in: tramites.map((t) => t.id) } } });
    await prisma.sector.deleteMany({ where: { id: { in: sectores.map((s) => s.id) } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('sin decir cuál, pregunta provincial o municipal con opciones que dicen cuál es cuál', async () => {
    salidaModelo = responder(provincial.id);
    const r = await responderConsulta(turno('cómo hago el cambio de titularidad'));
    assert.equal(r.tipo, 'aclaracion');
    assert.equal(r.respuesta, `Hay más de un trámite «${NOMBRE}». ¿Necesitás el trámite provincial o el de la Municipalidad de Formosa?`);
    assert.deepEqual(r.opciones, [
      { id: provincial.id, nombre: `${NOMBRE} provincial`, jurisdiccion: 'PROVINCIAL', localidad: null },
      { id: municipal.id, nombre: `${NOMBRE} de la Municipalidad de Formosa`, jurisdiccion: 'MUNICIPAL', localidad: 'Formosa' },
    ]);
  });

  for (const [respuesta, cual] of [['el municipal', 'municipal'], ['el de la municipalidad', 'municipal'], ['el provincial', 'provincial']]) {
    it(`"${respuesta}" en la respuesta resuelve la aclaración`, async () => {
      const elegido = cual === 'municipal' ? municipal : provincial;
      salidaModelo = responder(elegido.id);
      const r = await responderConsulta(tras(respuesta));
      assert.equal(r.tipo, 'respuesta');
      assert.deepEqual(r.tramitesEncontrados.map((t) => t.id), [elegido.id]);
      const instruccion = llamadasModelo[0].instruccionSistema;
      assert.ok(instruccion.includes(elegido.descripcion));
      assert.ok(!instruccion.includes((cual === 'municipal' ? provincial : municipal).descripcion));
    });
  }

  it('la opción municipal, mandada como pregunta, ya resuelve', async () => {
    salidaModelo = responder(municipal.id);
    const r = await responderConsulta(turno(`${NOMBRE} de la Municipalidad de Formosa`));
    assert.equal(r.tipo, 'respuesta');
    assert.deepEqual(r.tramitesEncontrados.map((t) => t.id), [municipal.id]);
  });

  it('"en Formosa" a secas no elige: la provincia y la capital se llaman igual', async () => {
    salidaModelo = responder(grupo().id);
    const r = await responderConsulta(turno('cómo hago el cambio de titularidad en Formosa'));
    assert.equal(r.tipo, 'aclaracion');
    assert.equal(r.opciones.length, 2);
  });

  it('el contexto del municipal trae la dirección, la Municipalidad, la jurisdicción y la localidad', async () => {
    salidaModelo = responder(municipal.id);
    await responderConsulta(tras('municipal'));
    const instruccion = llamadasModelo[0].instruccionSistema;
    assert.ok(instruccion.includes(`Organismo: ${AIM}, ${MUNICIPALIDAD}\nJurisdicción: municipal (Formosa)\n`));
  });

  it('una aclaración del modelo entre trámites parecidos de distinta jurisdicción dice cuál es cuál', async () => {
    candidatos = [{ id: habilitacionProvincial.id }, { id: habilitacionMunicipal.id }];
    salidaModelo = salida({ tipo: 'aclaracion', opciones: [habilitacionProvincial.id, habilitacionMunicipal.id], respuesta: '¿Cuál necesitás?' });
    const r = await responderConsulta(turno('quiero habilitar mi negocio'));
    assert.equal(r.tipo, 'aclaracion');
    assert.deepEqual(r.opciones, [
      { id: habilitacionProvincial.id, nombre: `${habilitacionProvincial.nombre} (provincial)` },
      { id: habilitacionMunicipal.id, nombre: `${habilitacionMunicipal.nombre} (Municipalidad de Formosa)` },
    ]);
  });

  it('si todas las opciones del modelo son de la misma jurisdicción, quedan con su nombre', async () => {
    candidatos = [{ id: habilitacionMunicipal.id }, { id: municipal.id }];
    salidaModelo = salida({ tipo: 'aclaracion', opciones: [habilitacionMunicipal.id, municipal.id], respuesta: '¿Cuál?' });
    const r = await responderConsulta(turno('trámites de la municipalidad'));
    assert.deepEqual(r.opciones.map((o) => o.nombre), [habilitacionMunicipal.nombre, NOMBRE]);
  });
});
