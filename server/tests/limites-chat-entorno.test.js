import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// El rate limit del chat toma los valores del entorno: con los recomendados para la demo (muchas
// personas detrás de la misma IP pública), pasan 120 consultas en el minuto y la 121 es 429.
process.env.CHAT_LIMITE_POR_MINUTO = '120';
process.env.CHAT_LIMITE_POR_HORA = '2000';
delete process.env.TRUST_PROXY;

let llegaron = 0;
mock.module(new URL('../src/services/chat.service.js', import.meta.url).href, {
  namedExports: {
    responderConsulta: async () => {
      llegaron++;
      return { tipo: 'respuesta', respuesta: 'ok' };
    },
    async *responderConsultaStream() {
      llegaron++;
      yield { tipo: 'fin' };
    },
    AsistenteNoDisponibleError: class extends Error {},
  },
});

const { default: app } = await import('../app.js');
const { LIMITES_CHAT } = await import('../src/config/chat.js');
const servidor = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${servidor.address().port}`;
after(() => servidor.close());

const pedir = async (ruta) => {
  const res = await fetch(`${BASE}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta: 'el pasaporte' }) });
  await res.text();
  return res;
};

describe('rate limit del chat configurado por entorno', () => {
  it('lee los valores del entorno', () => {
    assert.equal(LIMITES_CHAT.porMinuto, 120);
    assert.equal(LIMITES_CHAT.porHora, 2000);
  });

  it('desde una sola IP pasan 120 en el minuto, entre las dos rutas, y la 121 es 429', async () => {
    const estados = [];
    for (let i = 0; i < 120; i++) estados.push((await pedir(i % 2 ? '/api/chat/stream' : '/api/chat')).status);
    assert.ok(estados.every((s) => s === 200), `pasaron ${estados.filter((s) => s === 200).length} de 120`);
    const res = await pedir('/api/chat');
    assert.equal(res.status, 429);
    assert.equal(res.headers.get('ratelimit-limit') ?? res.headers.get('ratelimit-policy')?.split(';')[0], '120');
    assert.equal(llegaron, 120);
  });
});
