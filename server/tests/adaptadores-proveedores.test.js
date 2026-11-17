import './helpers/base-de-prueba.js';
import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Los adaptadores de Anthropic y Google con los SDK simulados: qué mandan, cómo leen la respuesta y
// el uso de tokens, cómo mapean cada falla (para el respaldo y el 503) y que se carguen solo cuando
// un modelo de ese proveedor responde.
const CLAVE_ANTHROPIC = 'sk-ant-secreta-de-prueba-0123456789';
const CLAVE_GEMINI = 'AIza-secreta-de-prueba-0123456789';
process.env.ANTHROPIC_API_KEY = CLAVE_ANTHROPIC;
process.env.GEMINI_API_KEY = CLAVE_GEMINI;
process.env.OPENAI_API_KEY ||= 'sk-prueba';
delete process.env.OPENAI_TIMEOUT_CHAT_MS;
delete process.env.OPENAI_REINTENTOS_CHAT;
const carpeta = mkdtempSync(join(tmpdir(), 'uso-ia-'));
const ARCHIVO_USO = join(carpeta, 'uso.jsonl');
process.env.IA_REGISTRO_USO = ARCHIVO_USO;

class APIError extends Error {
  constructor(status, error, message = 'falla') {
    super(message);
    this.status = status;
    this.error = error;
    this.type = error?.error?.type ?? null;
  }
}
class APIConnectionError extends APIError {
  constructor() {
    super(undefined, undefined, 'Connection error.');
  }
}
class APIConnectionTimeoutError extends APIConnectionError {}

let construidos;
let pedidosAnthropic;
let contestaAnthropic;
class AnthropicFalso {
  constructor(opciones) {
    construidos.anthropic += 1;
    this.opciones = opciones;
    this.messages = {
      create: async (cuerpo, opcionesDePedido) => {
        pedidosAnthropic.push({ cuerpo, opciones: opcionesDePedido });
        return contestaAnthropic(cuerpo);
      },
    };
  }
}

class ApiError extends Error {
  constructor({ message, status }) {
    super(message);
    this.status = status;
  }
}
let pedidosGoogle;
let contestaGoogle;
class GoogleFalso {
  constructor() {
    construidos.google += 1;
    this.models = {
      generateContent: async (pedido) => {
        pedidosGoogle.push(pedido);
        return contestaGoogle(pedido);
      },
      generateContentStream: async (pedido) => {
        pedidosGoogle.push(pedido);
        return contestaGoogle(pedido);
      },
    };
  }
}

construidos = { anthropic: 0, google: 0 };
mock.module('@anthropic-ai/sdk', { defaultExport: AnthropicFalso, namedExports: { APIError, APIConnectionError, APIConnectionTimeoutError } });
mock.module('@google/genai', { namedExports: { GoogleGenAI: GoogleFalso, ApiError } });

const { ia } = await import('../src/core/ai/index.js');
const { ErrorProveedorIA, esSinCredito } = await import('../src/core/ai/errores.js');
const { modeloDelCatalogo } = await import('../src/config/modelos-chat.js');

const CLAUDE = { ...modeloDelCatalogo('claude-haiku-5-5'), respaldo: null };
const GEMINI = { ...modeloDelCatalogo('gemini-3.1-flash-lite'), respaldo: null };
const ESQUEMA = { name: 'respuesta_chat', strict: true, schema: { type: 'object', properties: { tipo: { type: 'string' } }, required: ['tipo'], additionalProperties: false } };
const TURNOS = [{ rol: 'usuario', texto: 'hola' }, { rol: 'asistente', texto: '¿En qué te ayudo?' }, { rol: 'usuario', texto: 'pasaporte' }];
const pedido = (modelo, extra = {}) => ({ instruccionSistema: 'Sos un asistente.', turnos: TURNOS, esquema: ESQUEMA, modelo, ...extra });
const juntar = async (gen) => {
  let t = '';
  for await (const d of gen) t += d;
  return t;
};
const usos = () => readFileSync(ARCHIVO_USO, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const falla = (tipo, extra = (e) => true) => (err) => err instanceof ErrorProveedorIA && err.tipo === tipo && extra(err);

const mensajeAnthropic = (texto, stop_reason = 'end_turn') => ({
  content: [{ type: 'text', text: texto }],
  stop_reason,
  usage: { input_tokens: 80, cache_read_input_tokens: 20, cache_creation_input_tokens: 0, output_tokens: 7 },
});
async function* eventosAnthropic(partes, stop_reason = 'end_turn') {
  yield { type: 'message_start', message: { usage: { input_tokens: 90, output_tokens: 1 } } };
  for (const text of partes) yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } };
  yield { type: 'message_delta', delta: { stop_reason }, usage: { output_tokens: 12 } };
  yield { type: 'message_stop' };
}
const respuestaGoogle = (text, finishReason = 'STOP', extra = {}) => ({
  text,
  candidates: [{ finishReason }],
  usageMetadata: { promptTokenCount: 70, cachedContentTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 3 },
  ...extra,
});

beforeEach(() => {
  pedidosAnthropic = [];
  pedidosGoogle = [];
  contestaAnthropic = (cuerpo) => (cuerpo.stream ? eventosAnthropic(['{"tipo"', ':"respuesta"}']) : mensajeAnthropic('{"tipo":"respuesta"}'));
  contestaGoogle = () => respuestaGoogle('{"tipo":"respuesta"}');
  rmSync(ARCHIVO_USO, { force: true });
});
after(() => rmSync(carpeta, { recursive: true, force: true }));

describe('carga diferida', () => {
  it('los SDK de Anthropic y Google no se cargan hasta que un modelo de ese proveedor responde', async () => {
    assert.deepEqual(construidos, { anthropic: 0, google: 0 });
    await ia.generarRespuesta(pedido(CLAUDE));
    assert.deepEqual(construidos, { anthropic: 1, google: 0 });
    await ia.generarRespuesta(pedido(CLAUDE));
    await ia.generarRespuesta(pedido(GEMINI));
    assert.deepEqual(construidos, { anthropic: 1, google: 1 }, 'un cliente por proveedor');
  });
});

describe('Anthropic', () => {
  it('manda el esquema en output_config.format, sin pensamiento, effort low y sin temperature', async () => {
    const salida = await ia.generarRespuesta(pedido(CLAUDE));
    assert.equal(salida, '{"tipo":"respuesta"}');
    const [{ cuerpo, opciones }] = pedidosAnthropic;
    assert.equal(cuerpo.model, 'claude-haiku-5-5');
    assert.equal(cuerpo.max_tokens, 1500);
    assert.equal(cuerpo.system, 'Sos un asistente.');
    assert.deepEqual(cuerpo.messages.map((m) => m.role), ['user', 'assistant', 'user']);
    assert.deepEqual(cuerpo.thinking, { type: 'disabled' });
    assert.deepEqual(cuerpo.output_config, { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA.schema } });
    assert.equal('temperature' in cuerpo, false);
    assert.deepEqual([opciones.timeout, opciones.maxRetries], [8000, 1]);
    assert.deepEqual(usos(), [{ modelo: 'claude-haiku-5-5', operacion: 'chat', entrada: 100, cacheada: 20, salida: 7 }]);
  });

  it('con respaldo, el modelo activo no reintenta', async () => {
    await ia.generarRespuesta(pedido({ ...CLAUDE, respaldo: GEMINI }));
    assert.equal(pedidosAnthropic[0].opciones.maxRetries, 0);
  });

  it('la corrección de tipeo: tope corto, sin esquema, sin reintentos y con su timeout', async () => {
    await ia.corregirTexto({ instruccionSistema: 'Corregí.', texto: 'pasaporet', timeout: 3000, modelo: CLAUDE });
    const [{ cuerpo, opciones }] = pedidosAnthropic;
    assert.equal(cuerpo.max_tokens, 25);
    assert.deepEqual(cuerpo.output_config, { effort: 'low' });
    assert.deepEqual([opciones.timeout, opciones.maxRetries], [3000, 0]);
  });

  it('el stream manda el texto a medida que llega y anota el uso', async () => {
    const texto = await juntar(ia.generarRespuestaStream(pedido(CLAUDE)));
    assert.equal(texto, '{"tipo":"respuesta"}');
    assert.equal(pedidosAnthropic[0].cuerpo.stream, true);
    assert.deepEqual(usos(), [{ modelo: 'claude-haiku-5-5', operacion: 'chat_stream', entrada: 90, cacheada: 0, salida: 12 }]);
  });

  for (const [caso, contesta, tipo] of [
    ['refusal', () => mensajeAnthropic('', 'refusal'), 'contenido'],
    ['salida cortada por el tope', () => mensajeAnthropic('{"tip', 'max_tokens'), 'contenido'],
    ['refusal en el stream', (c) => (c.stream ? eventosAnthropic(['{"tipo"'], 'refusal') : null), 'contenido'],
  ]) {
    it(`${caso}: falla de contenido (sin respaldo)`, async () => {
      contestaAnthropic = contesta;
      const llamada = caso.includes('stream') ? juntar(ia.generarRespuestaStream(pedido(CLAUDE))) : ia.generarRespuesta(pedido(CLAUDE));
      await assert.rejects(llamada, falla(tipo));
    });
  }

  for (const [caso, error, tipo, sinCredito] of [
    ['402 billing_error', new APIError(402, { type: 'error', error: { type: 'billing_error', message: 'Your credit balance is too low' } }), 'cuota', true],
    ['400 con el saldo agotado', new APIError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the API.' } }), 'cuota', true],
    ['529 overloaded_error', new APIError(529, { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }), 'transitorio', false],
    ['429 rate_limit_error', new APIError(429, { type: 'error', error: { type: 'rate_limit_error', message: 'x' } }), 'transitorio', false],
    ['error a mitad del stream (sin status)', new APIError(undefined, { type: 'error', error: { type: 'overloaded_error', message: 'x' } }), 'transitorio', false],
    ['timeout del SDK', new APIConnectionTimeoutError(), 'timeout', false],
    ['500 timeout_error', new APIError(500, { type: 'error', error: { type: 'timeout_error', message: 'x' } }), 'timeout', false],
    ['401 clave inválida', new APIError(401, { type: 'error', error: { type: 'authentication_error', message: `invalid x-api-key ${CLAVE_ANTHROPIC}` } }, `401 invalid x-api-key ${CLAVE_ANTHROPIC}`), 'configuracion', false],
    ['400 pedido inválido', new APIError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'x' } }), 'solicitud', false],
  ]) {
    it(`${caso} → ${tipo}${sinCredito ? ', sin crédito' : ''}, sin el mensaje del proveedor`, async () => {
      contestaAnthropic = () => {
        throw error;
      };
      await assert.rejects(ia.generarRespuesta(pedido(CLAUDE)), falla(tipo, (err) => esSinCredito(err) === sinCredito && !err.causa.includes(CLAVE_ANTHROPIC) && !err.message.includes('credit balance')));
    });
  }
});

describe('Google', () => {
  it('manda el esquema como responseJsonSchema, pensamiento minimal, temperature 0,3 y los reintentos del modelo', async () => {
    const salida = await ia.generarRespuesta(pedido(GEMINI));
    assert.equal(salida, '{"tipo":"respuesta"}');
    const [{ model, contents, config }] = pedidosGoogle;
    assert.equal(model, 'gemini-3.1-flash-lite');
    assert.deepEqual(contents.map((c) => c.role), ['user', 'model', 'user']);
    assert.equal(config.systemInstruction, 'Sos un asistente.');
    assert.equal(config.temperature, 0.3);
    assert.equal(config.maxOutputTokens, 1500);
    assert.deepEqual(config.thinkingConfig, { thinkingLevel: 'MINIMAL' });
    assert.equal(config.responseMimeType, 'application/json');
    assert.deepEqual(config.responseJsonSchema, ESQUEMA.schema);
    assert.equal(config.httpOptions.timeout, 8000);
    assert.equal(config.httpOptions.retryOptions.attempts, 2);
    assert.deepEqual(usos(), [{ modelo: 'gemini-3.1-flash-lite', operacion: 'chat', entrada: 70, cacheada: 10, salida: 8, razonamiento: 3 }]);
  });

  it('la corrección de tipeo: temperature 0, tope corto y un solo intento', async () => {
    await ia.corregirTexto({ instruccionSistema: 'Corregí.', texto: 'pasaporet', timeout: 3000, modelo: GEMINI });
    const [{ config }] = pedidosGoogle;
    assert.deepEqual([config.temperature, config.maxOutputTokens, config.httpOptions.timeout, config.httpOptions.retryOptions.attempts], [0, 25, 3000, 1]);
    assert.equal('responseJsonSchema' in config, false);
  });

  it('el stream junta el texto de cada pedazo y anota el uso con el pensamiento', async () => {
    contestaGoogle = () => (async function* () {
      yield { text: '{"tipo"', candidates: [{}] };
      yield { text: ':"respuesta"}', candidates: [{ finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 60, candidatesTokenCount: 6, thoughtsTokenCount: 2 } };
    })();
    assert.equal(await juntar(ia.generarRespuestaStream(pedido(GEMINI))), '{"tipo":"respuesta"}');
    assert.deepEqual(usos(), [{ modelo: 'gemini-3.1-flash-lite', operacion: 'chat_stream', entrada: 60, cacheada: 0, salida: 8, razonamiento: 2 }]);
  });

  for (const [caso, contesta] of [
    ['finishReason SAFETY', () => respuestaGoogle('', 'SAFETY')],
    ['pedido bloqueado', () => respuestaGoogle('', undefined, { candidates: [], promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } })],
    ['MAX_TOKENS', () => respuestaGoogle('{"ti', 'MAX_TOKENS')],
  ]) {
    it(`${caso}: falla de contenido`, async () => {
      contestaGoogle = contesta;
      await assert.rejects(ia.generarRespuesta(pedido(GEMINI)), falla('contenido'));
    });
  }

  const cuerpoDeError = (code, status) => JSON.stringify({ error: { code, message: `detalle con ${CLAVE_GEMINI}`, status } });
  for (const [caso, error, tipo, sinCredito] of [
    ['429 RESOURCE_EXHAUSTED', new ApiError({ status: 429, message: cuerpoDeError(429, 'RESOURCE_EXHAUSTED') }), 'transitorio', false],
    ['402 prepago agotado', new ApiError({ status: 402, message: cuerpoDeError(402, 'RESOURCE_EXHAUSTED') }), 'cuota', true],
    ['400 FAILED_PRECONDITION (facturación)', new ApiError({ status: 400, message: cuerpoDeError(400, 'FAILED_PRECONDITION') }), 'cuota', true],
    ['503 UNAVAILABLE', new ApiError({ status: 503, message: cuerpoDeError(503, 'UNAVAILABLE') }), 'transitorio', false],
    ['504 DEADLINE_EXCEEDED', new ApiError({ status: 504, message: cuerpoDeError(504, 'DEADLINE_EXCEEDED') }), 'timeout', false],
    ['timeout del SDK', Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }), 'timeout', false],
    ['401 clave inválida', new ApiError({ status: 401, message: cuerpoDeError(401, 'UNAUTHENTICATED') }), 'configuracion', false],
    ['400 pedido inválido', new ApiError({ status: 400, message: cuerpoDeError(400, 'INVALID_ARGUMENT') }), 'solicitud', false],
  ]) {
    it(`${caso} → ${tipo}${sinCredito ? ', sin crédito' : ''}, sin el mensaje del proveedor`, async () => {
      contestaGoogle = () => {
        throw error;
      };
      await assert.rejects(ia.generarRespuesta(pedido(GEMINI)), falla(tipo, (err) => esSinCredito(err) === sinCredito && !err.causa.includes(CLAVE_GEMINI) && !err.message.includes('detalle')));
    });
  }
});

describe('respaldo entre proveedores', () => {
  it('clave de Anthropic rechazada (401): responde el por defecto y queda el aviso en el log', async () => {
    contestaAnthropic = () => {
      throw new APIError(401, { type: 'error', error: { type: 'authentication_error', message: `invalid x-api-key ${CLAVE_ANTHROPIC}` } }, `401 ${CLAVE_ANTHROPIC}`);
    };
    const errores = [];
    mock.method(console, 'warn', () => {});
    mock.method(console, 'error', (m) => errores.push(String(m)));
    try {
      const respondio = [];
      await ia.generarRespuesta(pedido({ ...CLAUDE, respaldo: GEMINI }, { alResponder: (m) => respondio.push(m.id) }));
      assert.deepEqual(respondio, ['gemini-3.1-flash-lite']);
      assert.equal(errores.length, 1);
      assert.match(errores[0], /la clave de anthropic del modelo activo claude-haiku-5-5 fue rechazada \(AuthenticationError 401|la clave de anthropic del modelo activo claude-haiku-5-5 fue rechazada/);
      assert.ok(!errores[0].includes(CLAVE_ANTHROPIC));
    } finally {
      mock.restoreAll();
    }
  });

  it('clave de Google sin permiso (403) del modelo por defecto: falla sin respaldo', async () => {
    contestaGoogle = () => {
      throw new ApiError({ status: 403, message: JSON.stringify({ error: { code: 403, message: CLAVE_GEMINI, status: 'PERMISSION_DENIED' } }) });
    };
    await assert.rejects(ia.generarRespuesta(pedido(GEMINI)), (err) => err.tipo === 'configuracion' && err.claveRechazada && !err.causa.includes(CLAVE_GEMINI));
  });

  it('Claude sobrecargado: responde el modelo por defecto aunque sea de otro proveedor', async () => {
    contestaAnthropic = () => {
      throw new APIError(529, { type: 'error', error: { type: 'overloaded_error', message: 'x' } });
    };
    const respondio = [];
    mock.method(console, 'warn', () => {});
    try {
      const salida = await ia.generarRespuesta(pedido({ ...CLAUDE, respaldo: GEMINI }, { alResponder: (m) => respondio.push(m.id) }));
      assert.equal(salida, '{"tipo":"respuesta"}');
      assert.deepEqual(respondio, ['gemini-3.1-flash-lite']);
    } finally {
      mock.restoreAll();
    }
  });
});
