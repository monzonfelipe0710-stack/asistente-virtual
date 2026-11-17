import './helpers/base-de-prueba.js';
import { describe, it, before, beforeEach, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { jsonDeSalida } from './helpers/formato-stream.js';

// El reintento ante una caída de la base (Neon que tarda en despertar, un corte de red): el helper
// solo y el chat de punta a punta por HTTP, con la base simulada (config/prisma.js reemplazado por
// un objeto que contesta según la consulta y falla cuando el test lo pide), sin tocar ninguna base.
const TIEMPOS = { CHAT_PLAZO_MS: 3000, BASE_ESPERA_REINTENTO_MS: 300, BASE_MARGEN_REINTENTO_MS: 300 };
for (const [nombre, valor] of Object.entries(TIEMPOS)) process.env[nombre] = String(valor);
process.env.OPENAI_API_KEY ||= 'sk-prueba';

const HOST = 'ep-falso-123456.us-east-2.aws.neon.tech';
const VERSION_PRISMA = '6.19.3';
const caida = (code = 'P1001') =>
  new Prisma.PrismaClientKnownRequestError(`Can't reach database server at \`${HOST}:5432\``, { code, clientVersion: VERSION_PRISMA });
const caidaAlConectar = () =>
  new Prisma.PrismaClientInitializationError(`Can't reach database server at \`${HOST}:5432\``, VERSION_PRISMA, 'P1001');
const noTransitorio = () =>
  new Prisma.PrismaClientKnownRequestError(`Raw query failed on ${HOST}`, { code: 'P2010', clientVersion: VERSION_PRISMA });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// --- La base simulada -------------------------------------------------------------------------
const PASAPORTE = {
  id: 10, nombre: 'Pasaporte', descripcion: 'Documento de viaje para salir del país.', costo: null,
  costoDetalle: null, informacionAdicional: null, verificadoEn: null, huellaImportacion: null,
  encargadoId: null, publicado: true, createdAt: new Date(), updatedAt: new Date(), sectorId: 1,
  fuenteUrl: 'https://tramites.ejemplo.gob.ar/pasaporte', requisitos: [], mesas: [], documentos: [],
};
const FILAS = {
  version: () => [{ version: 1n }],
  publicados: () => [{ id: 10, nombre: 'Pasaporte', sectorId: 1, sector: 'Registro de prueba', consultas: 0 }],
  busqueda: () => [{ id: 10, nombre: 'Pasaporte', sectorId: 1, clave: 'pasaporte', mejor: 0.9, score: 0.9 }],
  detalle: () => [PASAPORTE],
  sectores: () => [{ id: 1, nombre: 'Registro de prueba', parentId: null, jurisdiccion: 'PROVINCIAL', localidad: null }],
  fuentes: () => [{ id: 10, nombre: 'Pasaporte', fuenteUrl: PASAPORTE.fuenteUrl }],
  registro: () => ({ id: 1, calificarToken: 'token-1' }),
};

// `fallas[nombre]`: lo que pasa en las próximas llamadas, en orden (un error o una función async
// que lo tira); vacío, contesta bien.
let fallas;
let llamadas;
const operacion = async (nombre) => {
  llamadas.push(nombre);
  const falla = fallas[nombre]?.shift();
  if (typeof falla === 'function') await falla();
  else if (falla) throw falla;
  return FILAS[nombre]();
};
const consultaDe = (sql) => {
  if (sql.includes('catalogo_version')) return 'version';
  if (sql.includes('WITH puntuados')) return 'busqueda';
  if (sql.includes('json_agg')) return 'detalle';
  if (sql.includes('LEFT JOIN consultas')) return 'publicados';
  throw new Error(`Consulta no simulada: ${sql.slice(0, 60)}`);
};
const baseSimulada = {
  $queryRaw: (partes) => operacion(consultaDe(partes.join('?'))),
  sector: { findMany: () => operacion('sectores') },
  tramite: { findMany: () => operacion('fuentes') },
  consulta: { create: () => operacion('registro') },
};

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('config/prisma.js'), { defaultExport: baseSimulada });
mock.module(servicio('services/embedding.service.js'), {
  namedExports: { generarEmbedding: async () => Array.from({ length: 1536 }, (_, i) => (i % 7) / 100) },
});
const SALIDA = { tipo: 'respuesta', saludo: '', tramiteId: 10, respuesta: 'El pasaporte es un documento de viaje para salir del país.', tramitesUsados: [10], opciones: [] };
let modelo;
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      corregirTexto: async () => null,
      generarRespuesta: async () => {
        modelo += 1;
        return JSON.stringify(SALIDA);
      },
      async *generarRespuestaStream() {
        modelo += 1;
        const { respuesta, ...meta } = SALIDA;
        yield jsonDeSalida(meta, respuesta);
      },
    },
  },
});

const { default: express } = await import('express');
const cache = await import('../src/services/cache.service.js');
const { reiniciarParaTests } = await import('../src/services/version-catalogo.service.js');
const chatController = await import('../src/controllers/chat.controller.js');
const { asyncHandler } = await import('../src/middlewares/asyncHandler.js');
const { errorHandler } = await import('../src/middlewares/error.middleware.js');
const { MENSAJE_NO_DISPONIBLE } = await import('../src/services/chat.service.js');
const { conReintentoBase, codigoTransitorio, ESPERA_REINTENTO_BASE_MS } = await import('../src/utils/reintento-base.js');
const { crearPlazoConVencimiento, msRestantes } = await import('../src/utils/plazo.js');

const app = express();
app.use(express.json());
app.post('/api/chat', asyncHandler(chatController.consultar));
app.post('/api/chat/stream', asyncHandler(chatController.consultarStream));
app.use(errorHandler);
let servidor;
let BASE;

// Lo que el chat deja en el log, para revisar que no tenga el host de la base.
let logs;
let consolas = [];
const capturarLogs = () => {
  consolas = ['error', 'warn', 'info'].map((nivel) =>
    mock.method(console, nivel, (...args) => logs.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(' '))));
};

const PREGUNTA = 'cómo saco el pasaporte';
const normal = async (pregunta = PREGUNTA) => {
  const r = await fetch(`${BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta }) });
  const cuerpo = await r.text();
  return { status: r.status, cuerpo, json: JSON.parse(cuerpo) };
};
const stream = async (pregunta = PREGUNTA) => {
  const r = await fetch(`${BASE}/api/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta }) });
  const cuerpo = await r.text();
  const eventos = cuerpo.split('\n\n').filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, '')));
  return { status: r.status, cuerpo, eventos };
};
const RUTAS = {
  normal: async (pregunta) => {
    const { status, cuerpo, json } = await normal(pregunta);
    return { cuerpo, ok: status === 200, noDisponible: status === 503 && json.error === MENSAJE_NO_DISPONIBLE, status };
  },
  stream: async (pregunta) => {
    const { cuerpo, eventos } = await stream(pregunta);
    const error = eventos.find((e) => e.tipo === 'error');
    return { cuerpo, ok: eventos.at(-1)?.tipo === 'fin', noDisponible: error?.mensaje === MENSAJE_NO_DISPONIBLE, fin: eventos.at(-1) };
  },
};

const cuantas = (nombre) => llamadas.filter((l) => l === nombre).length;
const sinDetallesInternos = (texto) => {
  for (const fragmento of [HOST, 'neon', 'P1001', 'P1008', 'P1017', 'Prisma', "Can't reach", '5432']) {
    assert.ok(!texto.includes(fragmento), `filtra "${fragmento}": ${texto.slice(0, 200)}`);
  }
};

describe('reintento ante caídas de la base', () => {
  before(async () => {
    servidor = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    BASE = `http://127.0.0.1:${servidor.address().port}`;
  });
  after(() => servidor.close());
  beforeEach(() => {
    fallas = {};
    llamadas = [];
    logs = [];
    modelo = 0;
    cache.limpiar({ propagar: false });
    reiniciarParaTests();
    capturarLogs();
  });
  afterEach(() => consolas.forEach((m) => m.mock.restore()));

  describe('el helper', () => {
    it('reconoce los códigos de conexión en code (consulta) y en errorCode (al conectar)', () => {
      for (const code of ['P1001', 'P1002', 'P1008', 'P1017']) assert.equal(codigoTransitorio(caida(code)), code);
      assert.equal(codigoTransitorio(caidaAlConectar()), 'P1001');
      assert.equal(codigoTransitorio(noTransitorio()), null);
      assert.equal(codigoTransitorio(new Error('otra cosa')), null);
      assert.equal(codigoTransitorio(undefined), null);
    });

    it('falla una vez, espera y anda al reintentar', async () => {
      let veces = 0;
      const inicio = Date.now();
      const r = await conReintentoBase(async () => {
        veces += 1;
        if (veces === 1) throw caidaAlConectar();
        return 'ok';
      });
      assert.equal(r, 'ok');
      assert.equal(veces, 2);
      assert.ok(Date.now() - inicio >= ESPERA_REINTENTO_BASE_MS - 20);
    });

    it('reintenta una sola vez: si falla de nuevo, tira el segundo error', async () => {
      let veces = 0;
      const segundo = caida('P1017');
      await assert.rejects(conReintentoBase(async () => {
        veces += 1;
        throw veces === 1 ? caida() : segundo;
      }), (err) => err === segundo);
      assert.equal(veces, 2);
    });

    it('un error que no es de conexión pasa directo, sin reintento', async () => {
      let veces = 0;
      const error = noTransitorio();
      await assert.rejects(conReintentoBase(async () => {
        veces += 1;
        throw error;
      }), (err) => err === error);
      assert.equal(veces, 1);
    });

    it('una escritura solo se reintenta con P1001 (no llegó a conectarse)', async () => {
      for (const [code, esperadas] of [['P1001', 2], ['P1002', 1], ['P1008', 1], ['P1017', 1]]) {
        let veces = 0;
        await assert.rejects(conReintentoBase(async () => {
          veces += 1;
          throw caida(code);
        }, { escritura: true, espera: 10 }));
        assert.equal(veces, esperadas, code);
      }
    });

    it('si al plazo no le alcanza para esperar y reintentar, falla en el momento', async () => {
      const plazo = crearPlazoConVencimiento(500);
      assert.ok(msRestantes(plazo) <= 500);
      let veces = 0;
      const inicio = Date.now();
      await assert.rejects(conReintentoBase(async () => {
        veces += 1;
        throw caida();
      }, { signal: plazo, espera: 400, margen: 200 }));
      assert.equal(veces, 1);
      assert.ok(Date.now() - inicio < 100, `tardó ${Date.now() - inicio} ms`);
    });

    it('si el plazo vence durante la espera, corta ahí y no reintenta', async () => {
      const controlador = new AbortController();
      let veces = 0;
      const inicio = Date.now();
      setTimeout(() => controlador.abort(new DOMException('corte', 'TimeoutError')), 50);
      await assert.rejects(conReintentoBase(async () => {
        veces += 1;
        throw caida();
      }, { signal: controlador.signal, espera: 1000 }), { name: 'TimeoutError' });
      assert.equal(veces, 1);
      assert.ok(Date.now() - inicio < 500);
    });

    it('el log del reintento lleva el código y no el mensaje de Prisma', async () => {
      await assert.rejects(conReintentoBase(async () => { throw caida(); }, { espera: 10 }));
      assert.ok(logs.some((l) => l.includes('P1001')));
      for (const l of logs) assert.ok(!l.includes(HOST), l);
    });
  });

  for (const [ruta, pedir] of Object.entries(RUTAS)) {
    describe(`el chat (${ruta})`, () => {
      it('la búsqueda falla una vez y la consulta anda al reintentar', async () => {
        fallas.busqueda = [caida()];
        const r = await pedir();
        assert.ok(r.ok, r.cuerpo);
        assert.equal(cuantas('busqueda'), 2);
        assert.equal(cuantas('registro'), 1);
        assert.equal(modelo, 1);
      });

      it('el detalle del trámite falla una vez (al conectar) y anda al reintentar', async () => {
        fallas.detalle = [caidaAlConectar()];
        const r = await pedir();
        assert.ok(r.ok, r.cuerpo);
        assert.equal(cuantas('detalle'), 2);
      });

      it('la versión del catálogo falla una vez y se reintenta', async () => {
        fallas.version = [caida('P1017')];
        const r = await pedir();
        assert.ok(r.ok, r.cuerpo);
        assert.equal(cuantas('version'), 2);
      });

      it('el registro se reintenta con P1001 y la respuesta trae su consultaId', async () => {
        fallas.registro = [caida('P1001')];
        const r = await pedir();
        assert.ok(r.ok, r.cuerpo);
        assert.equal(cuantas('registro'), 2);
        assert.ok(r.cuerpo.includes('"consultaId":1'), r.cuerpo);
      });

      it('el registro no se reintenta con P1017 (pudo haberse guardado): la respuesta sale sin consultaId', async () => {
        fallas.registro = [caida('P1017')];
        const r = await pedir();
        assert.ok(r.ok, r.cuerpo);
        assert.equal(cuantas('registro'), 1);
        assert.ok(r.cuerpo.includes('"consultaId":null'), r.cuerpo);
      });

      it('falla dos veces: 503 con el mensaje de siempre, sin caché ni registro ni detalles internos', async () => {
        fallas.busqueda = [caida(), caida('P1017')];
        const r = await pedir();
        assert.ok(r.noDisponible, r.cuerpo);
        assert.equal(cuantas('busqueda'), 2);
        assert.equal(cuantas('registro'), 0);
        assert.equal(modelo, 0);
        assert.equal(cache.obtener(PREGUNTA, 'gpt-4o-mini'), null);
        sinDetallesInternos(r.cuerpo);
        assert.ok(logs.some((l) => l.includes('base P1017')), logs.join('\n'));
        for (const l of logs) assert.ok(!l.includes(HOST), l);
      });

      it('un error de la base que no es de conexión no se reintenta ni se presenta como 503', async () => {
        fallas.busqueda = [noTransitorio()];
        const r = await pedir();
        assert.ok(!r.ok && !r.noDisponible, r.cuerpo);
        assert.equal(cuantas('busqueda'), 1);
        assert.equal(cuantas('registro'), 0);
        sinDetallesInternos(r.cuerpo);
      });

      it('no se pasa del tope: si la primera falla llega tarde, no reintenta y responde directo', async () => {
        // La búsqueda tarda 2,5 s de los 3 s del plazo y falla: no quedan los 600 ms de espera y margen.
        fallas.busqueda = [async () => { await pausa(2500); throw caida('P1008'); }];
        const inicio = Date.now();
        const r = await pedir();
        const ms = Date.now() - inicio;
        assert.ok(r.noDisponible, r.cuerpo);
        assert.equal(cuantas('busqueda'), 1);
        assert.ok(ms < TIEMPOS.CHAT_PLAZO_MS, `tardó ${ms} ms`);
        sinDetallesInternos(r.cuerpo);
      });

      it('no se pasa del tope: si el reintento también tarda, corta en el plazo con el 503', async () => {
        fallas.busqueda = [caida(), async () => { await pausa(5000); throw caida(); }];
        const inicio = Date.now();
        const r = await pedir();
        const ms = Date.now() - inicio;
        assert.ok(r.noDisponible, r.cuerpo);
        assert.equal(cuantas('busqueda'), 2);
        assert.ok(ms < TIEMPOS.CHAT_PLAZO_MS + 300, `tardó ${ms} ms`);
        assert.equal(cuantas('registro'), 0);
      });
    });
  }
});
