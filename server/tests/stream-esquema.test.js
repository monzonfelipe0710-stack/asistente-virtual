import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { jsonDeSalida } from './helpers/formato-stream.js';

// El streaming con el esquema JSON de la ruta sin streaming (STREAM_ESQUEMA): el mismo prompt, una
// sola llamada, nada de texto antes de tener los campos de decisión y una salida que no es el JSON
// del esquema como falla. El corte en cualquier posición está en stream-incremental.test.js y las
// fallas por HTTP (refusal, cortes, plazo), en fallas-openai.test.js.
let candidatos;
let salidasModelo;
let pedazosStream;
let entregados;
let llamadas;
let registros;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      generarRespuesta: async (args) => {
        llamadas.push({ ruta: 'normal', ...args });
        return JSON.stringify(salidasModelo.shift());
      },
      async *generarRespuestaStream(args) {
        llamadas.push({ ruta: 'stream', ...args });
        for (const p of pedazosStream) {
          entregados++;
          yield p;
        }
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
const { responderConsulta, responderConsultaStream, AsistenteNoDisponibleError } = await import('../src/services/chat.service.js');

const DOMINIO = '@stream-esquema.test.invalid';
const SUFIJO = `stream-esquema-${Date.now()}`;
let tramite;
let sector;

const turno = (texto) => [{ rol: 'usuario', texto }];
const META = (datos) => ({ tipo: 'respuesta', saludo: '', tramiteId: null, tramitesUsados: [], opciones: [], ...datos });
const conTramite = () => META({ tramiteId: tramite.id, tramitesUsados: [tramite.id] });

const transmitir = async (mensajes, pedazos) => {
  entregados = 0;
  pedazosStream = pedazos;
  const deltas = [];
  let fin = null;
  for await (const e of responderConsultaStream(Array.isArray(mensajes) ? mensajes : turno(mensajes))) {
    if (e.tipo === 'delta') deltas.push({ texto: e.texto, entregados });
    else fin = e;
  }
  return { texto: deltas.map((d) => d.texto).join(''), deltas, fin };
};
const normal = async (mensajes, salida) => {
  cache.limpiar();
  salidasModelo = [salida];
  return responderConsulta(Array.isArray(mensajes) ? mensajes : turno(mensajes));
};

const cortesDe = (crudo) => [
  [crudo],
  [...crudo],
  ...Array.from({ length: crudo.length - 1 }, (_, i) => [crudo.slice(0, i + 1), crudo.slice(i + 1)]),
  ...[3, 7, 13].map((n) => crudo.match(new RegExp(`[\\s\\S]{1,${n}}`, 'g'))),
];

describe('streaming con el esquema JSON', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const encargado = await prisma.usuario.create({
      data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' },
    });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'DEPARTAMENTO' } });
    tramite = await prisma.tramite.create({
      data: { nombre: `Pasaporte ${SUFIJO}`, descripcion: 'Trámite personal.', costo: 35000, sectorId: sector.id, encargadoId: encargado.id },
    });
  });

  beforeEach(() => {
    delete process.env.STREAM_ESQUEMA;
    delete process.env.STREAM_INCREMENTAL;
    cache.limpiar();
    candidatos = [{ id: tramite.id }];
    salidasModelo = [];
    llamadas = [];
    registros = [];
  });

  after(async () => {
    delete process.env.STREAM_ESQUEMA;
    delete process.env.STREAM_INCREMENTAL;
    await prisma.tramite.deleteMany({ where: { id: tramite?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  describe('el pedido al modelo', () => {
    const CUERPO = 'Se hace en persona.';

    it('lleva el mismo prompt que la ruta sin streaming y el esquema con "respuesta" al final, en una sola llamada', async () => {
      await normal('cómo saco el pasaporte', { ...conTramite(), respuesta: CUERPO });
      cache.limpiar();
      const r = await transmitir('cómo saco el pasaporte', [jsonDeSalida(conTramite(), CUERPO)]);
      assert.equal(r.texto, CUERPO);
      assert.deepEqual(llamadas.map((l) => l.ruta), ['normal', 'stream']);
      const [sinStream, conStream] = llamadas;
      // El resumen del catálogo cambia mientras otros tests escriben en la base: se compara lo demás.
      const sinResumen = (instruccion) => instruccion.replace(/RESUMEN DEL CATÁLOGO:[^]*?(?=Contexto \(trámites candidatos\):)/, '');
      assert.notEqual(sinResumen(sinStream.instruccionSistema), sinStream.instruccionSistema);
      assert.equal(sinResumen(conStream.instruccionSistema), sinResumen(sinStream.instruccionSistema));
      assert.doesNotMatch(conStream.instruccionSistema, /PRIMERA línea/);
      assert.equal(conStream.esquema.strict, true);
      assert.deepEqual(Object.keys(conStream.esquema.schema.properties), ['tipo', 'saludo', 'tramiteId', 'tramitesUsados', 'opciones', 'respuesta']);
      assert.deepEqual(
        Object.fromEntries(Object.entries(conStream.esquema.schema.properties).sort()),
        Object.fromEntries(Object.entries(sinStream.esquema.schema.properties).sort()),
      );
      assert.deepEqual([...conStream.esquema.schema.required].sort(), [...sinStream.esquema.schema.required].sort());
    });

    for (const [bandera, caso] of [['STREAM_ESQUEMA', 'vuelve el formato anterior'], ['STREAM_INCREMENTAL', 'el formato anterior, aunque STREAM_ESQUEMA esté en true']]) {
      it(`con ${bandera}=false, ${caso}: la línea META, sin esquema`, async () => {
        process.env[bandera] = 'false';
        if (bandera === 'STREAM_INCREMENTAL') process.env.STREAM_ESQUEMA = 'true';
        const r = await transmitir('cómo saco el pasaporte', [`${JSON.stringify(conTramite())}\n`, CUERPO]);
        assert.equal(r.texto, CUERPO);
        assert.equal(llamadas.length, 1);
        assert.equal(llamadas[0].esquema, undefined);
        assert.match(llamadas[0].instruccionSistema, /PRIMERA línea/);
      });
    }
  });

  describe('el texto escapado en el JSON', () => {
    it('saltos de línea, comillas, acentos y emojis (literales o \\uXXXX) dan el mismo texto que sin streaming', async () => {
      const cuerpo = 'El trámite "Pasaporte" es personal 😀.\n\nLos requisitos son:\n- DNI vigente\n- Una foto 4x4\n\nSe hace en la mesa de entradas: ¿querés saber el costo?';
      const esperado = await normal('cómo saco el pasaporte', { ...conTramite(), respuesta: cuerpo });
      const literal = jsonDeSalida(conTramite(), cuerpo);
      const escapado = literal.replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
      assert.notEqual(escapado, literal);
      for (const crudo of [literal, escapado]) {
        for (const pedazos of cortesDe(crudo)) {
          cache.limpiar();
          const r = await transmitir('cómo saco el pasaporte', pedazos);
          assert.equal(r.texto, esperado.respuesta);
          for (const d of r.deltas) assert.doesNotMatch(d.texto, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|\\u|\\n/);
        }
      }
    });
  });

  describe('si "respuesta" llega antes que los campos de decisión', () => {
    const CUERPO = 'El trámite es personal y se hace en la mesa de entradas. Se presenta el DNI vigente y la partida de nacimiento. El turno se pide en la oficina.';
    const ordenes = {
      'primero de todos': (m) => ({ respuesta: CUERPO, ...m }),
      'en el medio, como en el esquema de la ruta sin streaming': ({ tramitesUsados, opciones, ...m }) => ({ ...m, respuesta: CUERPO, tramitesUsados, opciones }),
    };
    for (const [caso, ordenar] of Object.entries(ordenes)) {
      it(`${caso}: no sale texto hasta tener la meta y el final es el mismo`, async () => {
        const esperado = await normal('cómo saco el pasaporte', { ...conTramite(), respuesta: CUERPO });
        const crudo = JSON.stringify(ordenar(conTramite()));
        const finDeLaMeta = crudo.lastIndexOf(']') + 1;
        for (const pedazos of cortesDe(crudo)) {
          cache.limpiar();
          registros = [];
          const r = await transmitir('cómo saco el pasaporte', pedazos);
          assert.equal(r.texto, esperado.respuesta);
          assert.equal(r.fin.encontrado, true);
          assert.equal(registros.length, 1);
          for (const d of r.deltas) {
            const llegado = pedazos.slice(0, d.entregados).join('').length;
            assert.ok(llegado >= finDeLaMeta, `salió ${JSON.stringify(d.texto)} con ${llegado} de ${finDeLaMeta} caracteres`);
          }
        }
      });
    }

    it('con una meta que dice "sin trámite", el texto que llegó antes no se muestra', async () => {
      const esperado = await normal('licencia de conducir', { ...META({}), respuesta: CUERPO });
      cache.limpiar();
      const r = await transmitir('licencia de conducir', [`{"respuesta":${JSON.stringify(CUERPO)},`, '"tipo":"respuesta","saludo":"","tramiteId":null,"tramitesUsados":[],"opciones":[]}']);
      assert.equal(r.texto, esperado.respuesta);
      assert.doesNotMatch(r.texto, /personal/);
    });
  });

  describe('una salida que no es el JSON del esquema', () => {
    const invalidas = {
      'texto suelto': ['El pasaporte es gratis en www.estafa.example.com.\n'],
      'la línea META y el texto, como en el formato anterior': [`${JSON.stringify({ tipo: 'respuesta', saludo: '', tramiteId: 1, tramitesUsados: [1], opciones: [] })}\n`, 'Se hace en persona.'],
      'el JSON sin cerrar': ['{"tipo":"respuesta","saludo":"","tramiteId":null,"tramitesUsados":[],"opciones":[],"respuesta":"Se hace en persona.'],
      'texto después del JSON': [jsonDeSalida(META({}), 'Se hace en persona.'), '\nY algo más.'],
      'nada': [],
    };
    for (const [caso, pedazos] of Object.entries(invalidas)) {
      it(`${caso}: error del asistente, sin caché, registro ni segunda llamada`, async (t) => {
        t.mock.method(console, 'error', () => {});
        await assert.rejects(transmitir('cómo saco el pasaporte', pedazos), AsistenteNoDisponibleError);
        assert.equal(cache.obtener('cómo saco el pasaporte', 'gpt-4o-mini'), null);
        assert.deepEqual(registros, []);
        assert.deepEqual(llamadas.map((l) => l.ruta), ['stream']);
      });
    }

    it('si el JSON se rompe después de haber mandado texto, lo mandado es el principio del texto verificado', async (t) => {
      t.mock.method(console, 'error', () => {});
      const cuerpo = 'El trámite es personal y se hace en la mesa de entradas. Cuesta $9.999 en efectivo. Se presenta el DNI vigente.';
      const esperado = await normal('cómo saco el pasaporte', { ...conTramite(), respuesta: cuerpo });
      cache.limpiar();
      registros = [];
      const completo = jsonDeSalida(conTramite(), cuerpo);
      let mandado = '';
      const falla = await (async () => {
        entregados = 0;
        pedazosStream = [...completo.slice(0, -2), '\\q', '"}'];
        try {
          for await (const e of responderConsultaStream(turno('cómo saco el pasaporte'))) if (e.tipo === 'delta') mandado += e.texto;
        } catch (err) {
          return err;
        }
        return null;
      })();
      assert.ok(falla instanceof AsistenteNoDisponibleError);
      assert.ok(mandado.length > 0 && esperado.respuesta.startsWith(mandado), JSON.stringify(mandado));
      assert.doesNotMatch(mandado, /9\.999/);
      assert.equal(cache.obtener('cómo saco el pasaporte', 'gpt-4o-mini'), null);
      assert.deepEqual(registros, []);
    });
  });

  describe('cortesía', () => {
    const CORTESIA = {
      chau: '¡Que andes bien! Cuando necesites, preguntame por un trámite.',
      gracias: '¡De nada! Cuando quieras, preguntame por otro trámite.',
      hola: '¡Hola! ¿En qué trámite te puedo ayudar?',
      ok: '¡Listo! Si necesitás algo más, preguntame por un trámite.',
    };
    for (const [mensaje, esperado] of Object.entries(CORTESIA)) {
      it(`"${mensaje}" con una conversación sin texto recibe la frase amable, igual que sin streaming`, async () => {
        const meta = META({ tipo: 'conversacion', saludo: mensaje === 'hola' ? 'Hola' : '' });
        const sinStream = await normal(mensaje, { ...meta, respuesta: '' });
        const r = await transmitir(mensaje, [jsonDeSalida(meta, '')]);
        assert.equal(r.texto, esperado);
        assert.equal(sinStream.respuesta, esperado);
        assert.equal(r.fin.conversacional, true);
        assert.deepEqual(registros, []);
        assert.deepEqual(llamadas.map((l) => l.ruta), ['normal', 'stream']);
      });
    }

    it('después de una aclaración, "ok" no recibe la frase de cortesía', async () => {
      const mensajes = [{ rol: 'usuario', texto: 'licencia' }, { rol: 'asistente', texto: '¿Cuál?', tipo: 'aclaracion' }, { rol: 'usuario', texto: 'ok' }];
      const r = await transmitir(mensajes, [jsonDeSalida(META({ tipo: 'conversacion' }), '')]);
      assert.notEqual(r.texto, CORTESIA.ok);
    });

    it('una conversación con texto sale con su texto', async () => {
      const r = await transmitir('gracias', [...jsonDeSalida(META({ tipo: 'conversacion' }), '¡De nada! Cuando quieras, preguntame por otro trámite.')]);
      assert.equal(r.texto, '¡De nada! Cuando quieras, preguntame por otro trámite.');
    });
  });
});
