import './helpers/base-de-prueba.js';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// La resolución del modelo de cada consulta, con la base simulada: el modelo activo, el por defecto
// como respaldo, los que no se pueden usar, la configuración que falta y el modelo forzado.
delete process.env.MODELO_CHAT_FORZADO;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.MODELO_CHAT_POR_DEFECTO;
process.env.OPENAI_API_KEY ||= 'sk-prueba';

let filas;
let config;
let fallo;
let lecturas;
const leer = (valor) => async () => {
  lecturas += 1;
  if (fallo) throw fallo;
  return valor();
};
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('config/prisma.js'), {
  defaultExport: {
    modeloChat: { findMany: leer(() => filas) },
    configuracionChat: { findUnique: leer(() => config) },
  },
});

const { resolverModeloChat, invalidarModeloChat } = await import('../src/services/modelo-chat.service.js');
const { modeloDelCatalogo } = await import('../src/config/modelos-chat.js');

const fila = (id, extra = {}) => {
  const m = modeloDelCatalogo(id);
  return { id, proveedor: m.proveedor, modeloApi: m.modeloApi, nombreVisible: m.nombre, parametros: m.parametros, precios: m.precios, habilitado: m.habilitado, estadoEval: null, esPorDefecto: id === 'gpt-4o-mini', ...extra };
};
const errorPrisma = (code) => Object.assign(new Error(`falla ${code}`), { code, name: 'PrismaClientKnownRequestError' });

let avisos;
describe('resolverModeloChat', () => {
  beforeEach(() => {
    filas = ['gpt-4o-mini', 'gpt-6-luna', 'claude-haiku-5-5', 'gemini-3.1-flash-lite'].map((id) => fila(id));
    config = { id: 1, modeloActivoId: 'gpt-4o-mini' };
    fallo = null;
    lecturas = 0;
    avisos = [];
    mock.method(console, 'warn', (m) => avisos.push(String(m)));
    invalidarModeloChat();
  });
  afterEach(() => {
    mock.restoreAll();
    delete process.env.MODELO_CHAT_FORZADO;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NODE_ENV;
  });

  it('el activo es el por defecto: sin respaldo', async () => {
    const m = await resolverModeloChat();
    assert.equal(m.id, 'gpt-4o-mini');
    assert.equal(m.origen, 'base');
    assert.equal(m.respaldo, null);
  });

  it('otro activo habilitado y con clave: lo usa, con el por defecto de respaldo', async () => {
    filas = filas.map((f) => (f.id === 'gpt-6-luna' ? { ...f, habilitado: true } : f));
    config.modeloActivoId = 'gpt-6-luna';
    const m = await resolverModeloChat();
    assert.equal(m.id, 'gpt-6-luna');
    assert.equal(m.parametros.reasoningEffort, 'none');
    assert.equal(m.respaldo.id, 'gpt-4o-mini');
    assert.equal(m.respaldo.respaldo, null);
  });

  it('un activo deshabilitado no se usa: responde el por defecto', async () => {
    config.modeloActivoId = 'gpt-6-luna';
    const m = await resolverModeloChat();
    assert.equal(m.id, 'gpt-4o-mini');
    assert.ok(avisos.some((a) => a.includes('gpt-6-luna') && a.includes('deshabilitado')));
  });

  it('un activo sin clave del proveedor no se usa', async () => {
    filas = filas.map((f) => (f.id === 'claude-haiku-5-5' ? { ...f, habilitado: true } : f));
    config.modeloActivoId = 'claude-haiku-5-5';
    assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-prueba';
    invalidarModeloChat();
    assert.equal((await resolverModeloChat()).id, 'claude-haiku-5-5');
  });

  for (const codigo of ['P2021', 'P2022', 'P1001']) {
    it(`sin configuración (${codigo}): usa el modelo por defecto del entorno y no falla`, async () => {
      fallo = errorPrisma(codigo);
      const m = await resolverModeloChat();
      assert.equal(m.id, 'gpt-4o-mini');
      assert.equal(m.origen, 'entorno');
      assert.equal(m.respaldo, null);
      assert.equal(m.parametros.temperature, 0.3);
      assert.ok(avisos.some((a) => a.includes(codigo)));
    });
  }

  it('sin configuración, MODELO_CHAT_POR_DEFECTO elige el del entorno (si está en el catálogo)', async () => {
    fallo = errorPrisma('P2021');
    process.env.MODELO_CHAT_POR_DEFECTO = 'gpt-6-luna';
    try {
      assert.equal((await resolverModeloChat()).id, 'gpt-6-luna');
      process.env.MODELO_CHAT_POR_DEFECTO = 'no-existe';
      invalidarModeloChat();
      assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini');
    } finally {
      delete process.env.MODELO_CHAT_POR_DEFECTO;
    }
  });

  it('la configuración se cachea y se vuelve a leer al invalidarla', async () => {
    await resolverModeloChat();
    await resolverModeloChat();
    await resolverModeloChat();
    assert.equal(lecturas, 2, 'una lectura de modelos y una de configuración');
    config.modeloActivoId = 'gpt-6-luna';
    filas = filas.map((f) => (f.id === 'gpt-6-luna' ? { ...f, habilitado: true } : f));
    assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini', 'dentro de la vigencia sigue el anterior');
    invalidarModeloChat();
    assert.equal((await resolverModeloChat()).id, 'gpt-6-luna');
  });

  it('MODELO_CHAT_FORZADO usa ese modelo aunque esté deshabilitado, sin respaldo', async () => {
    process.env.MODELO_CHAT_FORZADO = 'gpt-6-luna';
    const m = await resolverModeloChat();
    assert.equal(m.id, 'gpt-6-luna');
    assert.equal(m.origen, 'forzado');
    assert.equal(m.respaldo, null);
  });

  it('MODELO_CHAT_FORZADO funciona aunque falte la configuración (sale del catálogo)', async () => {
    fallo = errorPrisma('P2021');
    process.env.MODELO_CHAT_FORZADO = 'gpt-6-luna';
    assert.equal((await resolverModeloChat()).id, 'gpt-6-luna');
  });

  it('MODELO_CHAT_FORZADO se ignora en producción, con un modelo que no existe o sin clave', async () => {
    process.env.MODELO_CHAT_FORZADO = 'gpt-6-luna';
    process.env.NODE_ENV = 'production';
    assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini');
    delete process.env.NODE_ENV;
    process.env.MODELO_CHAT_FORZADO = 'no-existe';
    assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini');
    process.env.MODELO_CHAT_FORZADO = 'claude-haiku-5-5';
    assert.equal((await resolverModeloChat()).id, 'gpt-4o-mini');
  });
});
