import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, beforeEach, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { jsonDeSalida } from './helpers/formato-stream.js';

// Un OpenAI falso que contesta según el modelo pedido: los parámetros que manda cada modelo y el
// respaldo con el modelo por defecto (solo ante fallas transitorias, de cuota o timeout, si queda
// plazo y si el modelo todavía no mandó texto), en la fachada `ia` y en el chat de punta a punta.
const CLAVE = 'sk-prueba-SECRETA-0123456789';
process.env.OPENAI_API_KEY = CLAVE;
process.env.OPENAI_TIMEOUT_CHAT_MS = '1000';
process.env.OPENAI_ESPERA_MAXIMA_REINTENTO_MS = '20';
delete process.env.OPENAI_REINTENTOS_CHAT;

const SALIDA = { tipo: 'respuesta', saludo: '', tramiteId: null, respuesta: '', tramitesUsados: [], opciones: [] };
const { respuesta: _, ...META } = SALIDA;

let pedidos;
let comportamiento;
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (rs, status, cuerpo, headers = {}) => {
  rs.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  rs.end(JSON.stringify(cuerpo));
};
const completion = (body, { contenido, finish = 'stop', refusal = null }) => ({
  id: 'x', object: 'chat.completion', created: 0, model: body.model,
  choices: [{ index: 0, finish_reason: finish, message: { role: 'assistant', content: contenido, refusal } }],
  usage: { prompt_tokens: 100, completion_tokens: 10, total_tokens: 110, prompt_tokens_details: { cached_tokens: 50 } },
});
const pedazo = (body, delta, finish = null) => `data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

const CONTESTA = {
  ok: (rs, body, tipo) => {
    if (tipo === 'tipeo') return json(rs, 200, completion(body, { contenido: body.messages.at(-1).content }));
    if (tipo === 'chat') return json(rs, 200, completion(body, { contenido: JSON.stringify(SALIDA) }));
    rs.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const texto = jsonDeSalida(META, 'Hola.');
    rs.write(pedazo(body, { content: texto.slice(0, 20) }));
    rs.write(pedazo(body, { content: texto.slice(20) }));
    rs.write(pedazo(body, {}, 'stop'));
    rs.write(`data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [], usage: { prompt_tokens: 100, completion_tokens: 10, total_tokens: 110 } })}\n\n`);
    rs.end('data: [DONE]\n\n');
  },
  error500: (rs) => json(rs, 500, { error: { message: 'falla', type: 'server_error' } }),
  cuota: (rs) => json(rs, 429, { error: { message: 'You exceeded your current quota', type: 'insufficient_quota', code: 'insufficient_quota' } }),
  limite: (rs) => json(rs, 429, { error: { message: 'Rate limit reached', type: 'requests', code: 'rate_limit_exceeded' } }, { 'retry-after-ms': '10' }),
  lento: async (rs, body, tipo) => {
    await pausa(2500);
    if (!rs.destroyed) CONTESTA.ok(rs, body, tipo);
  },
  negativa: (rs, body) => json(rs, 200, completion(body, { contenido: null, refusal: 'No puedo ayudar con eso.' })),
  largo: (rs, body) => json(rs, 200, completion(body, { contenido: '{"tipo": "resp', finish: 'length' })),
  invalida: (rs) => json(rs, 400, { error: { message: 'Unsupported value', type: 'invalid_request_error' } }),
  clave: (rs) => json(rs, 401, { error: { message: `Incorrect API key provided: ${CLAVE}.`, type: 'invalid_request_error', code: 'invalid_api_key' } }),
  prohibido: (rs) => json(rs, 403, { error: { message: `Project does not have access, key ${CLAVE}`, type: 'invalid_request_error', code: 'model_not_found' } }),
  cortaDespuesDeTexto: (rs, body) => {
    rs.writeHead(200, { 'Content-Type': 'text/event-stream' });
    rs.write(pedazo(body, { content: jsonDeSalida(META, 'Hola, empiezo a contestar y') }));
    setTimeout(() => rs.destroy(), 30);
  },
};

// Sin keep-alive: un reintento del SDK por una conexión reusada a veces no llegaba al servidor falso.
const falso = createServer((rq, rs) => {
  rs.setHeader('Connection', 'close');
  let cuerpo = '';
  rq.on('data', (c) => (cuerpo += c));
  rq.on('end', () => {
    const body = JSON.parse(cuerpo);
    const tipo = !body.response_format ? 'tipeo' : body.stream ? 'stream' : 'chat';
    pedidos.push({ modelo: body.model, tipo, body });
    const nombre = comportamiento[body.model]?.[tipo] ?? 'ok';
    CONTESTA[nombre](rs, body, tipo);
  });
});
await new Promise((r) => falso.listen(0, '127.0.0.1', r));
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${falso.address().port}/v1`;

const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
let activo;
mock.module(servicio('services/modelo-chat.service.js'), {
  namedExports: { resolverModeloChat: async () => activo, invalidarModeloChat: () => {} },
});
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => [] } });
let registros;
mock.module(servicio('services/metrica.service.js'), {
  namedExports: {
    registrarConsulta: async (datos) => {
      registros.push(datos);
      return { id: registros.length, calificarToken: `t-${registros.length}` };
    },
  },
});

const { ia, MARGEN_RESPALDO_MS } = await import('../src/core/ai/index.js');
const { ErrorProveedorIA } = await import('../src/core/ai/errores.js');
const { modeloDelCatalogo } = await import('../src/config/modelos-chat.js');
const { crearPlazoConVencimiento } = await import('../src/utils/plazo.js');
const cache = await import('../src/services/cache.service.js');
const { responderConsulta, responderConsultaStream, AsistenteNoDisponibleError } = await import('../src/services/chat.service.js');
const { default: prisma } = await import('../src/config/prisma.js');

const MINI = { ...modeloDelCatalogo('gpt-4o-mini'), respaldo: null };
const LUNA = { ...modeloDelCatalogo('gpt-6-luna'), respaldo: MINI };
const ESQUEMA = { name: 'x', strict: true, schema: { type: 'object' } };
const pedido = (extra = {}) => ({ instruccionSistema: 'Sos un asistente.', turnos: [{ rol: 'usuario', texto: 'hola' }], esquema: ESQUEMA, ...extra });
const deLuna = () => pedidos.filter((p) => p.modelo === 'gpt-6-luna');
const deMini = () => pedidos.filter((p) => p.modelo === 'gpt-4o-mini');

let logs;
const capturar = () => {
  for (const nivel of ['warn', 'error', 'info']) {
    mock.method(console, nivel, (...args) => logs.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack} ${JSON.stringify(a.error ?? '')}` : typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')));
  }
};
const juntar = async (gen) => {
  let texto = '';
  for await (const d of gen) texto += d;
  return texto;
};

beforeEach(() => {
  pedidos = [];
  comportamiento = {};
  registros = [];
  logs = [];
  activo = LUNA;
  cache.limpiar({ propagar: false });
  capturar();
});
afterEach(() => mock.restoreAll());
after(async () => {
  falso.closeAllConnections();
  falso.close();
  await prisma.$disconnect();
});

describe('parámetros por modelo', () => {
  it('gpt-4o-mini: temperature 0,3, tope de salida y sin reasoning_effort', async () => {
    await ia.generarRespuesta(pedido({ modelo: MINI }));
    const { body } = pedidos[0];
    assert.equal(body.model, 'gpt-4o-mini');
    assert.equal(body.temperature, 0.3);
    assert.equal(body.max_completion_tokens, 1500);
    assert.equal('reasoning_effort' in body, false);
    assert.equal(body.response_format.type, 'json_schema');
  });

  it('gpt-6-luna: reasoning_effort none y temperature 0,3, en las dos rutas', async () => {
    await ia.generarRespuesta(pedido({ modelo: { ...LUNA, respaldo: null } }));
    await juntar(ia.generarRespuestaStream(pedido({ modelo: { ...LUNA, respaldo: null } })));
    for (const { body } of pedidos) {
      assert.equal(body.model, 'gpt-6-luna');
      assert.equal(body.reasoning_effort, 'none');
      assert.equal(body.temperature, 0.3);
    }
    assert.deepEqual(pedidos[1].body.stream_options, { include_usage: true });
  });

  it('la corrección de tipeo usa el modelo de la consulta con temperature 0 y un tope corto', async () => {
    await ia.corregirTexto({ instruccionSistema: 'Corregí.', texto: 'pasaporet', timeout: 1000, modelo: LUNA });
    await ia.corregirTexto({ instruccionSistema: 'Corregí.', texto: 'pasaporet', timeout: 1000, modelo: MINI });
    assert.deepEqual(pedidos.map((p) => [p.modelo, p.body.temperature, p.body.reasoning_effort, p.body.max_completion_tokens]), [
      ['gpt-6-luna', 0, 'none', 25],
      ['gpt-4o-mini', 0, undefined, 25],
    ]);
  });
});

describe('respaldo con el modelo por defecto', () => {
  for (const [caso, nombre] of [['falla transitoria (500)', 'error500'], ['cuota agotada (429 insufficient_quota)', 'cuota'], ['límite de pedidos (429)', 'limite'], ['timeout', 'lento']]) {
    it(`${caso}: responde gpt-4o-mini, sin reintentar el activo`, async () => {
      comportamiento['gpt-6-luna'] = { chat: nombre };
      const respondio = [];
      const salida = await ia.generarRespuesta(pedido({ modelo: LUNA, alResponder: (m) => respondio.push(m.id) }));
      assert.deepEqual(JSON.parse(salida), SALIDA);
      assert.equal(deLuna().length, 1);
      assert.equal(deMini().length, 1);
      assert.deepEqual(respondio, ['gpt-4o-mini']);
      assert.ok(logs.some((l) => l.includes('gpt-6-luna') && l.includes('responde el modelo por defecto gpt-4o-mini')), logs.join('\n'));
    });
  }

  for (const [caso, nombre] of [['clave rechazada (401)', 'clave'], ['clave sin permiso (403)', 'prohibido']]) {
    it(`${caso}: responde el modelo por defecto y avisa en el log que la clave del activo fue rechazada`, async () => {
      comportamiento['gpt-6-luna'] = { chat: nombre, stream: nombre };
      const respondio = [];
      assert.deepEqual(JSON.parse(await ia.generarRespuesta(pedido({ modelo: LUNA, alResponder: (m) => respondio.push(m.id) }))), SALIDA);
      assert.equal(JSON.parse(await juntar(ia.generarRespuestaStream(pedido({ modelo: LUNA, alResponder: (m) => respondio.push(m.id) })))).respuesta, 'Hola.');
      assert.deepEqual(respondio, ['gpt-4o-mini', 'gpt-4o-mini']);
      assert.equal(deLuna().length, 2, 'sin reintentar el activo');
      const avisos = logs.filter((l) => l.includes('ATENCIÓN, la clave de openai del modelo activo gpt-6-luna fue rechazada'));
      assert.equal(avisos.length, 2, logs.join(' | '));
      for (const l of logs) assert.ok(!l.includes(CLAVE), l);
    });
  }

  it('clave rechazada del modelo por defecto (sin respaldo): falla como siempre, de configuración', async () => {
    comportamiento['gpt-4o-mini'] = { chat: 'clave' };
    await assert.rejects(ia.generarRespuesta(pedido({ modelo: MINI })), (err) => err instanceof ErrorProveedorIA && err.tipo === 'configuracion' && err.claveRechazada);
    assert.equal(deMini().length, 1, 'un 401 no se reintenta');
    assert.equal(logs.some((l) => l.includes('fue rechazada')), false);
  });

  for (const [caso, nombre, tipo] of [['refusal', 'negativa', 'contenido'], ['salida cortada por el tope', 'largo', 'contenido'], ['pedido inválido (400)', 'invalida', 'solicitud']]) {
    it(`${caso}: no usa el respaldo`, async () => {
      comportamiento['gpt-6-luna'] = { chat: nombre };
      await assert.rejects(ia.generarRespuesta(pedido({ modelo: LUNA })), (err) => err instanceof ErrorProveedorIA && err.tipo === tipo);
      assert.equal(deMini().length, 0);
    });
  }

  it('si el activo es el por defecto, rige lo de antes: reintenta una vez y falla', async () => {
    comportamiento['gpt-4o-mini'] = { chat: 'error500' };
    await assert.rejects(ia.generarRespuesta(pedido({ modelo: MINI })), (err) => err.tipo === 'transitorio');
    assert.equal(deMini().length, 2);
  });

  it('sin respaldo (modelo forzado), el activo reintenta según sus parámetros y falla', async () => {
    comportamiento['gpt-6-luna'] = { chat: 'error500' };
    await assert.rejects(ia.generarRespuesta(pedido({ modelo: { ...LUNA, respaldo: null } })));
    assert.equal(deLuna().length, 2);
    assert.equal(deMini().length, 0);
  });

  it('si no queda plazo para el respaldo, falla sin llamarlo', async () => {
    comportamiento['gpt-6-luna'] = { chat: 'error500' };
    const signal = crearPlazoConVencimiento(MARGEN_RESPALDO_MS - 500);
    await assert.rejects(ia.generarRespuesta(pedido({ modelo: LUNA, signal })));
    assert.equal(deMini().length, 0);
    assert.ok(logs.some((l) => l.includes('no queda plazo')));
  });

  it('si fallan los dos, sale el error del respaldo', async () => {
    comportamiento['gpt-6-luna'] = { chat: 'error500' };
    comportamiento['gpt-4o-mini'] = { chat: 'error500' };
    await assert.rejects(ia.generarRespuesta(pedido({ modelo: LUNA })), (err) => err instanceof ErrorProveedorIA);
    assert.equal(deMini().length, 2);
  });

  describe('stream', () => {
    it('una falla antes del primer texto pasa al respaldo', async () => {
      comportamiento['gpt-6-luna'] = { stream: 'error500' };
      const respondio = [];
      const texto = await juntar(ia.generarRespuestaStream(pedido({ modelo: LUNA, alResponder: (m) => respondio.push(m.id) })));
      assert.equal(JSON.parse(texto).respuesta, 'Hola.');
      assert.deepEqual(respondio, ['gpt-4o-mini']);
      assert.equal(deLuna().length, 1);
    });

    it('con texto ya mandado no hay respaldo: la falla sale como siempre', async () => {
      comportamiento['gpt-6-luna'] = { stream: 'cortaDespuesDeTexto' };
      await assert.rejects(juntar(ia.generarRespuestaStream(pedido({ modelo: LUNA }))));
      assert.equal(deMini().length, 0);
    });
  });
});

describe('el chat con el respaldo, de punta a punta', () => {
  for (const [ruta, consultar] of [
    ['normal', (m) => responderConsulta(m)],
    ['stream', async (m) => {
      let fin = null;
      for await (const e of responderConsultaStream(m)) if (e.tipo === 'fin') fin = e;
      return fin;
    }],
  ]) {
    it(`${ruta}: el activo falla, responde el por defecto y queda registrado`, async () => {
      comportamiento['gpt-6-luna'] = { chat: 'error500', stream: 'error500' };
      const r = await consultar([{ rol: 'usuario', texto: 'cómo hago el trámite de la cédula' }]);
      assert.equal(r.encontrado, false);
      assert.deepEqual(registros.map((x) => x.modelo), ['gpt-4o-mini']);
      assert.ok(logs.some((l) => l.includes('responde el modelo por defecto gpt-4o-mini')));
    });

    it(`${ruta}: si fallan los dos, el 503 de siempre, sin registro y sin la clave en los logs`, async () => {
      comportamiento['gpt-6-luna'] = { chat: 'error500', stream: 'error500', tipeo: 'clave' };
      comportamiento['gpt-4o-mini'] = { chat: 'clave', stream: 'clave' };
      await assert.rejects(consultar([{ rol: 'usuario', texto: 'cómo hago el trámite de la cédula' }]), AsistenteNoDisponibleError);
      assert.deepEqual(registros, []);
      assert.equal(deMini().filter((p) => p.tipo !== 'tipeo').length, 1);
      assert.ok(logs.some((l) => l.includes('AuthenticationError 401')), logs.join('\n'));
      for (const l of logs) assert.ok(!l.includes(CLAVE) && !l.includes(CLAVE.slice(-10)), l);
    });
  }
});
