import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// El modelo, la búsqueda y el registro de consultas se simulan; el trámite de prueba
// se crea en la base (sin publicar) y se borra al terminar.
let candidatos;
let salidaModelo;
let pedazosStream;
let llamadasModelo;
let registros;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;

mock.module(servicio('services/busqueda.service.js'), {
  namedExports: { buscarTramites: async () => candidatos },
});
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
const { obtenerResumenCatalogo } = await import('../src/services/catalogo.service.js');
const { responderConsulta, responderConsultaStream, MENSAJE_SIN_RESPUESTA, TOPE_CONVERSACION } =
  await import('../src/services/chat.service.js');

const DOMINIO = '@chat.test.invalid';
const SUFIJO = `chat-test-${Date.now()}`;
let tramite;
let sector;

const turno = (texto) => [{ rol: 'usuario', texto }];
const salida = (datos) => ({ saludo: '', encontrado: false, tramitesUsados: [], opciones: [], ...datos });
const meta = (datos) => `${JSON.stringify(salida({ ...datos, respuesta: undefined }))}\n`;

const consumir = async (generador) => {
  let texto = '';
  let fin;
  for await (const evento of generador) {
    if (evento.tipo === 'delta') texto += evento.texto;
    else fin = evento;
  }
  return { texto, fin };
};

describe('chat', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'DEPARTAMENTO' } });
    tramite = await prisma.tramite.create({
      data: { nombre: `Trámite ${SUFIJO}`, descripcion: 'de prueba', sectorId: sector.id, encargadoId: encargado.id },
    });
  });

  beforeEach(() => {
    cache.limpiar();
    candidatos = [{ id: tramite.id }];
    llamadasModelo = [];
    registros = [];
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: tramite?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  describe('conversación', () => {
    it('conserva el texto del modelo y no lo registra ni lo cachea', async () => {
      salidaModelo = salida({ tipo: 'conversacion', respuesta: 'Soy el asistente de trámites.' });

      for (let i = 0; i < 2; i++) {
        const r = await responderConsulta(turno('¿quién sos?'));
        assert.deepEqual(r, {
          tipo: 'respuesta',
          respuesta: 'Soy el asistente de trámites.',
          encontrado: false,
          tramitesEncontrados: [],
          opciones: [],
          conversacional: true,
          consultaId: null,
          calificarToken: null,
        });
      }
      assert.equal(llamadasModelo.length, 2);
      assert.equal(registros.length, 0);
    });

    it('ignora encontrado e ids si el modelo los manda en una conversación', async () => {
      salidaModelo = salida({ tipo: 'conversacion', respuesta: 'Hola.', encontrado: true, tramitesUsados: [tramite.id] });
      const r = await responderConsulta(turno('hola'));
      assert.equal(r.encontrado, false);
      assert.deepEqual(r.tramitesEncontrados, []);
      assert.equal(r.conversacional, true);
    });

    it(`corta el texto en ${TOPE_CONVERSACION} caracteres`, async () => {
      salidaModelo = salida({ tipo: 'conversacion', respuesta: 'palabra '.repeat(200) });
      const { respuesta } = await responderConsulta(turno('contame algo'));
      assert.ok(respuesta.length <= TOPE_CONVERSACION);
      assert.ok(respuesta.endsWith('…'));
    });
  });

  describe('respuesta', () => {
    it('sin ids válidos del contexto usa el mensaje fijo y se registra como no encontrada', async () => {
      for (const tramitesUsados of [[], [2147483647]]) {
        registros = [];
        cache.limpiar();
        salidaModelo = salida({ tipo: 'respuesta', respuesta: 'texto que no se usa', encontrado: true, tramitesUsados });
        const r = await responderConsulta(turno('licencia de conducir'));
        assert.equal(r.respuesta, MENSAJE_SIN_RESPUESTA);
        assert.equal(r.encontrado, false);
        assert.equal(r.conversacional, false);
        assert.equal(r.consultaId, 1);
        assert.deepEqual(registros.map((x) => x.encontrado), [false]);
      }
    });

    it('con un id del contexto responde con el texto del modelo y conversacional false', async () => {
      salidaModelo = salida({ tipo: 'respuesta', respuesta: 'Así se hace.', encontrado: true, tramitesUsados: [tramite.id] });
      const r = await responderConsulta(turno('cómo hago el trámite'));
      assert.equal(r.respuesta, 'Así se hace.');
      assert.equal(r.encontrado, true);
      assert.equal(r.conversacional, false);
      assert.deepEqual(r.tramitesEncontrados.map((t) => t.id), [tramite.id]);
    });

    it('una respuesta cacheada también trae conversacional false', async () => {
      salidaModelo = salida({ tipo: 'respuesta', respuesta: 'Así se hace.', encontrado: true, tramitesUsados: [tramite.id] });
      await responderConsulta(turno('cómo hago el trámite'));
      const r = await responderConsulta(turno('cómo hago el trámite'));
      assert.equal(llamadasModelo.length, 1);
      assert.equal(r.conversacional, false);
    });
  });

  it('manda siempre el resumen del catálogo al modelo, con candidatos o sin ellos', async () => {
    const { texto } = await obtenerResumenCatalogo();
    salidaModelo = salida({ tipo: 'conversacion', respuesta: 'Hay muchos trámites.' });
    await responderConsulta(turno('¿qué trámites hay?'));
    candidatos = [];
    pedazosStream = [meta({ tipo: 'conversacion' }), 'Hay muchos trámites.'];
    await consumir(responderConsultaStream(turno('¿qué trámites hay?')));

    assert.equal(llamadasModelo.length, 2);
    for (const { instruccionSistema } of llamadasModelo) {
      assert.ok(instruccionSistema.includes(`RESUMEN DEL CATÁLOGO:\n${texto}`));
    }
  });

  describe('sin candidatos', () => {
    beforeEach(() => { candidatos = []; });

    it('llama igual al modelo, con el contexto vacío, y responde la conversación', async () => {
      salidaModelo = salida({ tipo: 'conversacion', respuesta: '¿En qué trámite te ayudo?' });
      const r = await responderConsulta(turno('hola'));
      assert.equal(llamadasModelo.length, 1);
      assert.match(llamadasModelo[0].instruccionSistema, /Contexto \(trámites candidatos\):\n\(ninguno\)/);
      assert.equal(r.respuesta, '¿En qué trámite te ayudo?');
      assert.equal(r.conversacional, true);
      assert.equal(registros.length, 0);
    });

    it('un trámite que no existe da el mensaje fijo y se registra como no encontrado', async () => {
      salidaModelo = salida({ tipo: 'respuesta', respuesta: '' });
      const r = await responderConsulta(turno('licencia de conducir'));
      assert.equal(r.respuesta, MENSAJE_SIN_RESPUESTA);
      assert.equal(r.conversacional, false);
      assert.deepEqual(registros.map((x) => [x.encontrado, x.tramiteId]), [[false, null]]);
    });

    it('en streaming también llama al modelo', async () => {
      pedazosStream = [meta({ tipo: 'conversacion' }), '¡Chau! Que andes bien.'];
      const { texto, fin } = await consumir(responderConsultaStream(turno('chau')));
      assert.equal(llamadasModelo.length, 1);
      assert.equal(texto, '¡Chau! Que andes bien.');
      assert.equal(fin.conversacional, true);
    });
  });

  describe('streaming', () => {
    it('una conversación transmite el texto del modelo y no se registra', async () => {
      pedazosStream = [meta({ tipo: 'conversacion' }), '¡Gracias a vos! ', 'Cuando quieras, preguntame.'];
      const { texto, fin } = await consumir(responderConsultaStream(turno('gracias')));
      assert.equal(texto, '¡Gracias a vos! Cuando quieras, preguntame.');
      assert.deepEqual(fin, {
        tipo: 'fin',
        tipoRespuesta: 'respuesta',
        encontrado: false,
        tramitesEncontrados: [],
        opciones: [],
        conversacional: true,
        consultaId: null,
        calificarToken: null,
      });
      assert.equal(registros.length, 0);
    });

    it(`corta la conversación en ${TOPE_CONVERSACION} caracteres`, async () => {
      pedazosStream = [meta({ tipo: 'conversacion' }), ...Array(100).fill('pedazo de texto ')];
      const { texto } = await consumir(responderConsultaStream(turno('contame algo')));
      assert.ok(texto.length <= TOPE_CONVERSACION);
      assert.ok(texto.endsWith('…'));
    });

    it('una respuesta sin trámite no transmite el texto del modelo, solo el mensaje fijo', async () => {
      pedazosStream = [meta({ tipo: 'respuesta' }), 'esto no se tiene que ver'];
      const { texto, fin } = await consumir(responderConsultaStream(turno('licencia de conducir')));
      assert.equal(texto, MENSAJE_SIN_RESPUESTA);
      assert.equal(fin.conversacional, false);
      assert.equal(fin.consultaId, 1);
      assert.deepEqual(registros.map((x) => x.respuesta), [MENSAJE_SIN_RESPUESTA]);
    });

    it('una respuesta encontrada trae conversacional false en el fin', async () => {
      pedazosStream = [meta({ tipo: 'respuesta', encontrado: true, tramitesUsados: [tramite.id] }), 'Así se hace.'];
      const { texto, fin } = await consumir(responderConsultaStream(turno('cómo hago el trámite')));
      assert.equal(texto, 'Así se hace.');
      assert.equal(fin.encontrado, true);
      assert.equal(fin.conversacional, false);
    });
  });
});
