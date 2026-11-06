import 'dotenv/config';
import { describe, it, before, beforeEach, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Un OpenAI falso local simula cada falla; el chat se prueba de punta a punta por HTTP con los
// controllers reales. La búsqueda y el registro de consultas se simulan (la búsqueda igual pide
// el embedding al OpenAI falso) y el trámite de prueba se crea sin publicar y se borra al final.
const TIEMPOS = {
  OPENAI_TIMEOUT_EMBEDDING_MS: 1000,
  OPENAI_REINTENTOS_EMBEDDING: 1,
  OPENAI_TIMEOUT_CHAT_MS: 1000,
  OPENAI_REINTENTOS_CHAT: 1,
  OPENAI_ESPERA_MAXIMA_REINTENTO_MS: 100,
  CHAT_PLAZO_MS: 4000,
  CHAT_INACTIVIDAD_STREAM_MS: 600,
};

let alChat;
let alEmbedding;
let pedidos;
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const falso = createServer((rq, rs) => {
  let cuerpo = '';
  rq.on('data', (c) => (cuerpo += c));
  rq.on('end', () => {
    const pedido = { ruta: rq.url.replace(/^\/v1/, ''), llegada: Date.now(), cerrado: null, completo: false };
    pedidos.push(pedido);
    rs.on('finish', () => { pedido.completo = true; });
    rs.on('close', () => { pedido.cerrado = Date.now(); });
    const intento = pedidos.filter((p) => p.ruta === pedido.ruta).length;
    if (pedido.ruta === '/embeddings') return alEmbedding(rs, intento);
    return alChat(rs, intento, JSON.parse(cuerpo));
  });
});
await new Promise((r) => falso.listen(0, '127.0.0.1', r));
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${falso.address().port}/v1`;
for (const [nombre, valor] of Object.entries(TIEMPOS)) process.env[nombre] = String(valor);

let tramite;
let registros;
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;

mock.module(servicio('services/busqueda.service.js'), {
  namedExports: {
    buscarTramites: async (pregunta, { signal } = {}) => {
      const { generarEmbedding } = await import(servicio('services/embedding.service.js'));
      await generarEmbedding(pregunta, { signal });
      return [{ id: tramite.id }];
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

const { default: express } = await import('express');
const { default: prisma } = await import('../src/config/prisma.js');
const cache = await import('../src/services/cache.service.js');
const { obtenerResumenCatalogo } = await import('../src/services/catalogo.service.js');
const chatController = await import('../src/controllers/chat.controller.js');
const { asyncHandler } = await import('../src/middlewares/asyncHandler.js');
const { errorHandler } = await import('../src/middlewares/error.middleware.js');
const { MENSAJE_NO_DISPONIBLE, MENSAJE_SIN_RESPUESTA } = await import('../src/services/chat.service.js');

const app = express();
app.use(express.json());
app.post('/api/chat', asyncHandler(chatController.consultar));
app.post('/api/chat/stream', asyncHandler(chatController.consultarStream));
app.use(errorHandler);
const servidor = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${servidor.address().port}`;

// Respuestas del OpenAI falso.
const VECTOR = Array.from({ length: 1536 }, (_, i) => (i % 7) / 100);
const embeddingOk = (rs) => {
  rs.writeHead(200, { 'Content-Type': 'application/json' });
  rs.end(JSON.stringify({ object: 'list', data: [{ object: 'embedding', index: 0, embedding: VECTOR }], model: 'x', usage: { prompt_tokens: 1, total_tokens: 1 } }));
};
const error = (status, headers = {}) => (rs) => {
  rs.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  rs.end(JSON.stringify({ error: { message: `falla ${status}`, type: 'server_error' } }));
};
const META = () => `${JSON.stringify({ tipo: 'respuesta', saludo: '', tramiteId: tramite.id, tramitesUsados: [tramite.id], opciones: [] })}\n`;
const LINEAS = ['Se pide turno en la mesa de entrada.\n', 'Hay que llevar el DNI.'];
const completion = (contenido) => ({
  id: 'x', object: 'chat.completion', created: 0, model: 'x',
  choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: contenido } }],
});
const chatOk = (rs) => {
  rs.writeHead(200, { 'Content-Type': 'application/json' });
  rs.end(JSON.stringify(completion(JSON.stringify({
    tipo: 'respuesta', saludo: '', tramiteId: tramite.id, respuesta: LINEAS.join(''), tramitesUsados: [tramite.id], opciones: [],
  }))));
};
const pedazo = (content, finish_reason = null) =>
  `data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 0, model: 'x', choices: [{ index: 0, delta: content ? { content } : {}, finish_reason }] })}\n\n`;
const abrirStream = (rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/event-stream' });
  rs.flushHeaders();
};
const streamOk = (partes) => (rs) => {
  abrirStream(rs);
  for (const p of partes) rs.write(pedazo(p));
  rs.write(pedazo('', 'stop'));
  rs.end('data: [DONE]\n\n');
};
const streamQueSeCorta = (partes, final) => async (rs) => {
  abrirStream(rs);
  for (const p of partes) {
    rs.write(pedazo(p));
    await pausa(20);
  }
  final(rs);
};

// Con `cortarAlPrimerDelta` el cliente se desconecta apenas recibe texto.
const pedir = async (ruta, pregunta, { cortarAlPrimerDelta = false } = {}) => {
  const inicio = Date.now();
  const control = new AbortController();
  const res = await fetch(`${BASE}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta }),
    signal: control.signal,
  });
  const lector = res.body.getReader();
  const decodificador = new TextDecoder();
  let texto = '';
  let corte = null;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      texto += decodificador.decode(value, { stream: true });
      if (cortarAlPrimerDelta && texto.includes('"tipo":"delta"')) {
        corte = Date.now();
        control.abort();
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  }
  return { status: res.status, texto, ms: Date.now() - inicio, corte };
};
const pedirStream = async (pregunta, opciones) => {
  const r = await pedir('/api/chat/stream', pregunta, opciones);
  const eventos = r.texto.split('\n').filter((l) => l.startsWith('data: ')).map((l) => JSON.parse(l.slice(6)));
  return { ...r, eventos, tipos: eventos.map((e) => e.tipo) };
};
const intentos = (ruta) => pedidos.filter((p) => p.ruta === ruta).length;
const llegadas = (ruta) => pedidos.filter((p) => p.ruta === ruta).map((p) => p.llegada);

const DOMINIO = '@fallas-openai.test.invalid';
const SUFIJO = `fallas-openai-${Date.now()}`;
let sector;
let pregunta;
let logs;
let errorOriginal;
let numero = 0;

describe('fallas de OpenAI en el chat', () => {
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

  // El resumen del catálogo se rearma afuera de la medición: si no, sus consultas a la base
  // cuentan en los tiempos y en el plazo.
  beforeEach(async () => {
    cache.limpiar();
    await obtenerResumenCatalogo();
    pedidos = [];
    registros = [];
    alEmbedding = embeddingOk;
    alChat = chatOk;
    pregunta = `cómo hago el trámite de prueba ${++numero}`;
    logs = [];
    errorOriginal = console.error;
    console.error = (...args) => logs.push(args.join(' '));
  });

  afterEach(() => {
    console.error = errorOriginal;
  });

  after(async () => {
    servidor.closeAllConnections();
    servidor.close();
    falso.closeAllConnections();
    falso.close();
    await prisma.tramite.deleteMany({ where: { id: tramite?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  const sinCacheNiRegistro = () => {
    assert.equal(cache.obtener(pregunta), null);
    assert.equal(registros.length, 0);
  };
  const noDisponible = (r) => {
    assert.equal(r.status, 503);
    assert.deepEqual(JSON.parse(r.texto), { error: MENSAJE_NO_DISPONIBLE });
  };
  // La causa queda en el log, sin el texto de la consulta.
  const logueado = (...partes) => {
    const linea = logs.find((l) => l.startsWith('Chat: asistente no disponible'));
    assert.ok(linea, `sin log de la falla: ${JSON.stringify(logs)}`);
    for (const parte of partes) assert.match(linea, parte);
    assert.ok(!linea.includes(pregunta));
  };

  describe('sin streaming', () => {
    it('un 429 se reintenta una vez y termina en 503 sin cachear ni registrar', async () => {
      alChat = error(429);
      const r = await pedir('/api/chat', pregunta);
      noDisponible(r);
      assert.equal(intentos('/chat/completions'), 2);
      sinCacheNiRegistro();
      logueado(/etapa modelo/, /RateLimitError 429/, /ms en total/);
    });

    it('un retry-after largo se recorta al tope', async () => {
      alChat = error(429, { 'retry-after': '30' });
      const r = await pedir('/api/chat', pregunta);
      noDisponible(r);
      const [primero, segundo] = llegadas('/chat/completions');
      assert.ok(segundo - primero >= TIEMPOS.OPENAI_ESPERA_MAXIMA_REINTENTO_MS);
      assert.ok(segundo - primero < 1000, `esperó ${segundo - primero} ms entre intentos`);
    });

    it('un 500 se reintenta una vez y termina en 503', async () => {
      alChat = error(500);
      noDisponible(await pedir('/api/chat', pregunta));
      assert.equal(intentos('/chat/completions'), 2);
      sinCacheNiRegistro();
      logueado(/InternalServerError 500/);
    });

    it('un 503 seguido de éxito responde normal, cachea y registra', async () => {
      alChat = (rs, intento) => (intento === 1 ? error(503)(rs) : chatOk(rs));
      const r = await pedir('/api/chat', pregunta);
      assert.equal(r.status, 200);
      assert.equal(JSON.parse(r.texto).encontrado, true);
      assert.equal(intentos('/chat/completions'), 2);
      assert.notEqual(cache.obtener(pregunta), null);
      assert.equal(registros.length, 1);
    });

    it('un modelo lento agota el timeout en cada intento y termina en 503 antes del plazo', async () => {
      alChat = () => {};
      const r = await pedir('/api/chat', pregunta);
      noDisponible(r);
      assert.equal(intentos('/chat/completions'), 2);
      assert.ok(r.ms < TIEMPOS.CHAT_PLAZO_MS, `tardó ${r.ms} ms`);
      sinCacheNiRegistro();
      logueado(/APIConnectionTimeoutError/);
    });

    it('un cuerpo que no termina de llegar se corta con el plazo total', async () => {
      alChat = (rs) => {
        rs.writeHead(200, { 'Content-Type': 'application/json' });
        rs.write('{"id":"x",');
      };
      const r = await pedir('/api/chat', pregunta);
      noDisponible(r);
      assert.ok(r.ms >= TIEMPOS.CHAT_PLAZO_MS - 50 && r.ms < TIEMPOS.CHAT_PLAZO_MS + 1000, `tardó ${r.ms} ms`);
      sinCacheNiRegistro();
      logueado(/plazo agotado/);
    });

    it('una falla del embedding termina en 503 sin llamar al modelo', async () => {
      alEmbedding = error(429);
      noDisponible(await pedir('/api/chat', pregunta));
      assert.equal(intentos('/embeddings'), 2);
      assert.equal(intentos('/chat/completions'), 0);
      logueado(/etapa busqueda/, /embedding: RateLimitError 429/);
    });
  });

  describe('streaming', () => {
    it('un stream completo cachea y registra', async () => {
      alChat = streamOk([META(), ...LINEAS]);
      const r = await pedirStream(pregunta);
      assert.equal(r.tipos.at(-1), 'fin');
      assert.equal(r.eventos.at(-1).encontrado, true);
      assert.notEqual(cache.obtener(pregunta), null);
      assert.equal(registros.length, 1);
    });

    it('sin trámite y con stop, manda el mensaje fijo y lo registra', async () => {
      alChat = streamOk([JSON.stringify({ tipo: 'respuesta', saludo: '', tramiteId: null, tramitesUsados: [], opciones: [] }), '\n', 'texto que no se muestra']);
      const r = await pedirStream(pregunta);
      assert.deepEqual(r.tipos, ['delta', 'fin']);
      assert.equal(r.eventos[0].texto, MENSAJE_SIN_RESPUESTA);
      assert.equal(registros.length, 1);
      assert.equal(registros[0].encontrado, false);
    });

    it('un 429 manda solo el evento de error, sin fin', async () => {
      alChat = error(429);
      const r = await pedirStream(pregunta);
      assert.equal(r.status, 200);
      assert.deepEqual(r.eventos, [{ tipo: 'error', mensaje: MENSAJE_NO_DISPONIBLE }]);
      assert.equal(intentos('/chat/completions'), 2);
      sinCacheNiRegistro();
    });

    it('un stream que termina sin [DONE] ni finish_reason es un error: no cachea ni registra', async () => {
      alChat = streamQueSeCorta([META(), LINEAS[0], 'Hay que'], (rs) => rs.end());
      const r = await pedirStream(pregunta);
      assert.deepEqual(r.tipos, ['delta', 'error']);
      assert.equal(r.eventos.at(-1).mensaje, MENSAJE_NO_DISPONIBLE);
      sinCacheNiRegistro();
      logueado(/respuesta incompleta/);
    });

    it('un socket cortado a mitad manda lo transmitido y el error', async () => {
      alChat = streamQueSeCorta([META(), LINEAS[0]], (rs) => rs.socket.destroy());
      const r = await pedirStream(pregunta);
      assert.deepEqual(r.tipos, ['delta', 'error']);
      sinCacheNiRegistro();
    });

    it('un corte a mitad de la línea META es un error, nunca "no encontrado"', async () => {
      alChat = streamQueSeCorta(['{"tipo":"respuesta","saludo":"","tra'], (rs) => rs.end());
      const r = await pedirStream(pregunta);
      assert.deepEqual(r.eventos, [{ tipo: 'error', mensaje: MENSAJE_NO_DISPONIBLE }]);
      sinCacheNiRegistro();
    });

    it('un stream que se cuelga después de la primera línea se corta por inactividad', async () => {
      alChat = streamQueSeCorta([META(), LINEAS[0]], () => {});
      const r = await pedirStream(pregunta);
      assert.deepEqual(r.tipos, ['delta', 'error']);
      assert.ok(r.ms >= TIEMPOS.CHAT_INACTIVIDAD_STREAM_MS && r.ms < TIEMPOS.CHAT_PLAZO_MS, `tardó ${r.ms} ms`);
      sinCacheNiRegistro();
      logueado(/stream inactivo/);
    });

    it('si el cliente se desconecta, se cancela la llamada al modelo', async () => {
      alChat = streamQueSeCorta([META(), LINEAS[0]], () => {});
      const { corte, tipos } = await pedirStream(pregunta, { cortarAlPrimerDelta: true });
      assert.deepEqual(tipos, ['delta']);
      for (let i = 0; i < 50 && !pedidos.find((p) => p.ruta === '/chat/completions')?.cerrado; i++) await pausa(20);
      const llamada = pedidos.find((p) => p.ruta === '/chat/completions');
      assert.ok(llamada.cerrado, 'la llamada al modelo sigue abierta');
      assert.equal(llamada.completo, false);
      assert.ok(llamada.cerrado - corte < 300, `se cerró ${llamada.cerrado - corte} ms después`);
      sinCacheNiRegistro();
      assert.equal(logs.length, 0);
    });
  });
});
