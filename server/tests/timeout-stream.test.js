import './helpers/base-de-prueba.js';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Qué cubre el timeout del SDK (OPENAI_TIMEOUT_CHAT_MS) en el streaming: el SDK de openai arma el
// temporizador antes del fetch y lo limpia cuando llegan los headers, así que un stream que sigue
// mandando pedazos no se corta por ese timeout aunque dure más. Lo que corta un stream largo es el
// plazo del chat (CHAT_PLAZO_MS) y uno colgado, la inactividad (CHAT_INACTIVIDAD_STREAM_MS).
// Usa los valores por defecto: el stream dura más de los 8 s del timeout.
const INTERVALO_MS = 500;
const PEDAZOS = 19;

const pedazo = (content, finish_reason = null) =>
  `data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 0, model: 'x', choices: [{ index: 0, delta: content ? { content } : {}, finish_reason }] })}\n\n`;

const falso = createServer((rq, rs) => {
  rq.resume();
  rq.on('end', async () => {
    rs.writeHead(200, { 'Content-Type': 'text/event-stream' });
    rs.flushHeaders();
    for (let i = 0; i < PEDAZOS; i++) {
      await new Promise((r) => setTimeout(r, INTERVALO_MS));
      if (rs.destroyed) return;
      rs.write(pedazo(`p${i} `));
    }
    rs.write(pedazo('', 'stop'));
    rs.end('data: [DONE]\n\n');
  });
});
await new Promise((r) => falso.listen(0, '127.0.0.1', r));
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${falso.address().port}/v1`;
process.env.OPENAI_API_KEY ||= 'sk-prueba';
for (const nombre of ['OPENAI_TIMEOUT_CHAT_MS', 'OPENAI_REINTENTOS_CHAT', 'CHAT_INACTIVIDAD_STREAM_MS']) delete process.env[nombre];

const { TIEMPOS_IA } = await import('../src/config/ia.js');
const { chatOpenai } = await import('../src/core/ai/openai.adapter.js');
const { modeloDelCatalogo } = await import('../src/config/modelos-chat.js');

describe('timeout del SDK en el streaming', () => {
  after(() => {
    falso.closeAllConnections();
    falso.close();
  });

  it('un stream lento pero constante que dura más que OPENAI_TIMEOUT_CHAT_MS no se corta', async () => {
    assert.equal(TIEMPOS_IA.chat.timeout, 8000);
    assert.ok(INTERVALO_MS < TIEMPOS_IA.inactividadStream);
    const inicio = Date.now();
    let texto = '';
    for await (const delta of chatOpenai.generarRespuestaStream(modeloDelCatalogo('gpt-4o-mini'), { instruccionSistema: 'x', turnos: [{ rol: 'usuario', texto: 'x' }] })) texto += delta;
    const ms = Date.now() - inicio;
    assert.ok(ms > TIEMPOS_IA.chat.timeout + INTERVALO_MS, `duró ${ms} ms`);
    assert.equal(texto.trim().split(' ').length, PEDAZOS);
  });
});
