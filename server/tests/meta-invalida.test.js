import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// La línea META del streaming mal formada: solo la META sin salto de línea, o el texto sin la META.
let candidatos;
let salidasModelo;
let pedazosStream;
let llamadasJson;
let registros;
let instrucciones;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      generarRespuesta: async ({ instruccionSistema }) => {
        instrucciones.push(instruccionSistema);
        llamadasJson++;
        return JSON.stringify(salidasModelo.shift());
      },
      async *generarRespuestaStream({ instruccionSistema }) {
        instrucciones.push(instruccionSistema);
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

const { default: prisma } = await import('../src/config/prisma.js');
const cache = await import('../src/services/cache.service.js');
const { responderConsulta, responderConsultaStream, TEXTOS_FIJOS_DEL_PROMPT } = await import('../src/services/chat.service.js');
const { consultaMultivueltaSchema } = await import('../src/controllers/chat.controller.js');
const INSTRUCCION_TOPE = TEXTOS_FIJOS_DEL_PROMPT[2];

const DOMINIO = '@meta-invalida.test.invalid';
const SUFIJO = `meta-invalida-${Date.now()}`;
let tramite;
let sector;
let avisos;

const turno = (texto) => [{ rol: 'usuario', texto }];
const salida = (datos) => ({ tipo: 'respuesta', saludo: '', tramiteId: null, respuesta: '', tramitesUsados: [], opciones: [], ...datos });
const meta = (datos) => JSON.stringify((({ respuesta, ...resto }) => resto)(salida(datos)));
const transmitir = async (pregunta, pedazos) => {
  pedazosStream = pedazos;
  let texto = '';
  let fin = null;
  for await (const e of responderConsultaStream(Array.isArray(pregunta) ? pregunta : turno(pregunta))) {
    if (e.tipo === 'delta') texto += e.texto;
    else fin = e;
  }
  return { texto, fin };
};

const CORTESIA = {
  chau: { texto: '¡Que andes bien! Cuando necesites, preguntame por un trámite.', saludo: '' },
  gracias: { texto: '¡De nada! Cuando quieras, preguntame por otro trámite.', saludo: '' },
  hola: { texto: '¡Hola! ¿En qué trámite te puedo ayudar?', saludo: 'Hola' },
  ok: { texto: '¡Listo! Si necesitás algo más, preguntame por un trámite.', saludo: '' },
  'muchas gracias': { texto: '¡De nada! Cuando quieras, preguntame por otro trámite.', saludo: '' },
};

for (const modo of ['true', 'false']) {
  describe(`META mal formada (STREAM_INCREMENTAL=${modo})`, () => {
    before(async () => {
      process.env.STREAM_INCREMENTAL = modo;
      await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
      const encargado = await prisma.usuario.create({
        data: { nombre: 'Prueba', email: `encargado-${modo}${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
      });
      sector = await prisma.sector.create({ data: { nombre: `${SUFIJO}-${modo}`, tipo: 'DEPARTAMENTO' } });
      tramite = await prisma.tramite.create({
        data: { nombre: `Pasaporte ${SUFIJO}`, descripcion: 'Trámite personal.', costo: 35000, sectorId: sector.id, encargadoId: encargado.id },
      });
    });

    beforeEach(() => {
      process.env.STREAM_INCREMENTAL = modo;
      cache.limpiar();
      candidatos = [{ id: tramite.id }];
      salidasModelo = [];
      llamadasJson = 0;
      registros = [];
      instrucciones = [];
      avisos = mock.method(console, 'warn', () => {});
    });

    after(async () => {
      avisos?.mock.restore();
      delete process.env.STREAM_INCREMENTAL;
      await prisma.tramite.deleteMany({ where: { id: tramite?.id } });
      await prisma.sector.deleteMany({ where: { id: sector?.id } });
      await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    });

    for (const [mensaje, { texto: esperado, saludo }] of Object.entries(CORTESIA)) {
      describe(`"${mensaje}"`, () => {
        it('sin streaming, una conversación sin texto da una frase amable', async () => {
          salidasModelo = [salida({ tipo: 'conversacion', saludo })];
          const r = await responderConsulta(turno(mensaje));
          assert.equal(r.respuesta, esperado);
          assert.equal(r.conversacional, true);
          assert.deepEqual(registros, []);
        });

        it('en streaming, solo la META sin salto de línea', async () => {
          const r = await transmitir(mensaje, [meta({ tipo: 'conversacion', saludo })]);
          assert.equal(r.texto, esperado);
          assert.equal(r.fin.conversacional, true);
          assert.deepEqual(registros, []);
        });

        it('en streaming, el texto sin META: frase amable, sin trámite ni reintento', async () => {
          const r = await transmitir(mensaje, ['¡De nada! El pasaporte cuesta $1.', '\nOtra línea.']);
          assert.equal(r.texto, esperado);
          assert.equal(r.fin.conversacional, true);
          assert.equal(r.fin.encontrado, false);
          assert.equal(llamadasJson, 0);
          assert.deepEqual(registros, []);
        });
      });
    }

    describe('un mensaje que no es solo cortesía', () => {
      it('sin META se pide de nuevo por la ruta con esquema y nunca se muestra el texto suelto', async () => {
        salidasModelo = [salida({ tramiteId: tramite.id, tramitesUsados: [tramite.id], respuesta: 'Se hace en persona.' })];
        const r = await transmitir('cómo saco el pasaporte', ['El pasaporte es gratis', ' en www.estafa.example.com.\n']);
        assert.equal(llamadasJson, 1);
        assert.equal(r.texto, 'Se hace en persona.');
        assert.equal(r.fin.encontrado, true);
      });

      it('una META con trámite y sin texto también se pide de nuevo', async () => {
        salidasModelo = [salida({ tramiteId: tramite.id, tramitesUsados: [tramite.id], respuesta: 'Se hace en persona.' })];
        const r = await transmitir('cómo saco el pasaporte', [meta({ tramiteId: tramite.id, tramitesUsados: [tramite.id] })]);
        assert.equal(llamadasJson, 1);
        assert.equal(r.texto, 'Se hace en persona.');
      });

      it('una META sin trámite y sin texto sigue siendo "no encontrado", sin reintento', async () => {
        const r = await transmitir('licencia de conducir', [meta({})]);
        assert.equal(llamadasJson, 0);
        assert.equal(r.fin.encontrado, false);
        assert.equal(r.fin.conversacional, false);
      });

      it('si el reintento falla, es un error y no "no encontramos información"', async (t) => {
        t.mock.method(console, 'error', () => {});
        salidasModelo = [];
        await assert.rejects(transmitir('cómo saco el pasaporte', ['texto sin meta']));
        assert.deepEqual(registros, []);
      });
    });

    // El historial con el `tipo` que devolvió cada respuesta, como lo manda el front.
    const historial = (tipos, pregunta) => [
      ...tipos.flatMap((tipo, i) => [{ rol: 'usuario', texto: `pregunta ${i}` }, { rol: 'asistente', texto: `respuesta ${i}`, ...(tipo ? { tipo } : {}) }]),
      { rol: 'usuario', texto: pregunta },
    ];

    describe('después de una aclaración', () => {
      for (const mensaje of ['ok', 'listo']) {
        it(`"${mensaje}" sin streaming no recibe la frase de cortesía`, async () => {
          salidasModelo = [salida({ tipo: 'conversacion' })];
          const r = await responderConsulta(historial(['aclaracion'], mensaje));
          assert.notEqual(r.respuesta, CORTESIA.ok.texto);
        });

        it(`"${mensaje}" en streaming, solo la META: no recibe la frase de cortesía`, async () => {
          const r = await transmitir(historial(['aclaracion'], mensaje), [meta({ tipo: 'conversacion' })]);
          assert.notEqual(r.texto, CORTESIA.ok.texto);
        });

        it(`"${mensaje}" en streaming, sin META: sigue el flujo normal con el reintento`, async () => {
          salidasModelo = [salida({ tramiteId: tramite.id, tramitesUsados: [tramite.id], respuesta: 'Se hace en persona.' })];
          const r = await transmitir(historial(['aclaracion'], mensaje), ['¡Listo!', '\nOtra línea.']);
          assert.equal(llamadasJson, 1);
          assert.equal(r.texto, 'Se hace en persona.');
          assert.equal(r.fin.encontrado, true);
        });
      }

      it('cuenta el último mensaje del asistente, no una aclaración anterior', async () => {
        salidasModelo = [salida({ tipo: 'conversacion' })];
        const r = await responderConsulta(historial(['aclaracion', 'respuesta'], 'ok'));
        assert.equal(r.respuesta, CORTESIA.ok.texto);
      });
    });

    for (const [caso, mensajes] of [
      ['sin historial', (m) => turno(m)],
      ['tras una respuesta normal', (m) => historial(['respuesta'], m)],
      ['con historial sin tipo', (m) => historial([null], m)],
    ]) {
      for (const mensaje of ['gracias', 'chau']) {
        describe(`"${mensaje}" ${caso}`, () => {
          it('sin streaming recibe la frase de cortesía', async () => {
            salidasModelo = [salida({ tipo: 'conversacion' })];
            assert.equal((await responderConsulta(mensajes(mensaje))).respuesta, CORTESIA[mensaje].texto);
          });

          it('en streaming, solo la META: recibe la frase de cortesía', async () => {
            assert.equal((await transmitir(mensajes(mensaje), [meta({ tipo: 'conversacion' })])).texto, CORTESIA[mensaje].texto);
          });

          it('en streaming, sin META: recibe la frase de cortesía sin reintento', async () => {
            const r = await transmitir(mensajes(mensaje), ['¡De nada!', '\nOtra línea.']);
            assert.equal(r.texto, CORTESIA[mensaje].texto);
            assert.equal(llamadasJson, 0);
          });
        });
      }
    }

    describe('tope de aclaraciones', () => {
      const conTope = async (mensajes) => {
        salidasModelo = [salida({ tipo: 'conversacion', respuesta: 'Bien.' })];
        await responderConsulta(mensajes);
        await transmitir(mensajes, [meta({ tipo: 'conversacion' }), '\nBien.']);
        assert.equal(instrucciones.length, 2);
        const [normal, stream] = instrucciones.map((i) => i.includes(INSTRUCCION_TOPE));
        assert.equal(normal, stream, 'las dos rutas cuentan igual');
        return normal;
      };

      it('con historial mixto cuenta solo las aclaraciones', async () => {
        assert.equal(await conTope(historial(['respuesta', 'aclaracion', 'respuesta', 'conversacion'], 'el primero')), false);
        instrucciones = [];
        assert.equal(await conTope(historial(['aclaracion', 'respuesta', 'aclaracion'], 'el primero')), true);
      });

      it('sin tipo cuenta cada mensaje del asistente, como antes', async () => {
        assert.equal(await conTope(historial([null], 'el primero')), false);
        instrucciones = [];
        assert.equal(await conTope(historial([null, null], 'el primero')), true);
      });

      it('un mensaje sin tipo cuenta aunque los demás lo traigan', async () => {
        assert.equal(await conTope(historial([null, 'respuesta', 'aclaracion'], 'el primero')), true);
      });
    });

    describe('un tipo inválido', () => {
      const conTipo = (tipo) => consultaMultivueltaSchema.parse({
        mensajes: [{ rol: 'usuario', texto: 'licencia' }, { rol: 'asistente', texto: '¿Cuál?', tipo }, { rol: 'usuario', texto: 'ok' }],
      }).mensajes;

      it('se ignora sin error, también en un mensaje del usuario', () => {
        for (const tipo of ['otro', 'ACLARACION', 5, null]) assert.deepEqual(conTipo(tipo)[1], { rol: 'asistente', texto: '¿Cuál?' });
        assert.equal(conTipo('aclaracion')[1].tipo, 'aclaracion');
        const delUsuario = consultaMultivueltaSchema.parse({ mensajes: [{ rol: 'usuario', texto: 'ok', tipo: 'aclaracion' }] }).mensajes[0];
        assert.deepEqual(delUsuario, { rol: 'usuario', texto: 'ok' });
      });

      it('se trata como ausente: hay cortesía y el mensaje cuenta para el tope', async () => {
        salidasModelo = [salida({ tipo: 'conversacion' })];
        assert.equal((await responderConsulta(conTipo('otro'))).respuesta, CORTESIA.ok.texto);
        const mensajes = consultaMultivueltaSchema.parse({ mensajes: historial(['otro', 'otro'], 'el primero') }).mensajes;
        salidasModelo = [salida({ tipo: 'conversacion', respuesta: 'Bien.' })];
        await responderConsulta(mensajes);
        assert.ok(instrucciones.at(-1).includes(INSTRUCCION_TOPE));
      });
    });
  });
}

after(() => prisma.$disconnect());
