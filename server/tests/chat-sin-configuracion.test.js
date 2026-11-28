import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { jsonDeSalida } from './helpers/formato-stream.js';

// Con la migración del selector sin aplicar (las tablas no existen) el chat sigue andando con el
// modelo por defecto del entorno. La base es la temporal; solo las dos tablas nuevas fallan.
delete process.env.MODELO_CHAT_FORZADO;

const real = new PrismaClient();
const sinTabla = new Proxy({}, {
  get: () => async () => {
    throw Object.assign(new Error('The table `public.modelo_chat` does not exist in the current database.'), { code: 'P2021', name: 'PrismaClientKnownRequestError' });
  },
});
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('config/prisma.js'), {
  defaultExport: new Proxy(real, {
    get(destino, clave) {
      if (clave === 'modeloChat' || clave === 'configuracionChat') return sinTabla;
      const valor = Reflect.get(destino, clave, destino);
      return typeof valor === 'function' ? valor.bind(destino) : valor;
    },
  }),
});
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => [] } });

let modelos;
const SALIDA = { tipo: 'respuesta', saludo: '', tramiteId: null, respuesta: '', tramitesUsados: [], opciones: [] };
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      corregirTexto: async ({ texto, modelo }) => {
        modelos.push(modelo);
        return texto;
      },
      generarRespuesta: async ({ modelo }) => {
        modelos.push(modelo);
        return JSON.stringify(SALIDA);
      },
      async *generarRespuestaStream({ modelo }) {
        modelos.push(modelo);
        const { respuesta, ...meta } = SALIDA;
        yield jsonDeSalida(meta, respuesta);
      },
    },
  },
});
let registros;
mock.module(servicio('services/metrica.service.js'), {
  namedExports: {
    registrarConsulta: async (datos) => {
      registros.push(datos);
      return { id: 1, calificarToken: 't' };
    },
  },
});

const { responderConsulta, responderConsultaStream } = await import('../src/services/chat.service.js');
const cache = await import('../src/services/cache.service.js');

describe('chat sin la configuración del modelo', () => {
  let avisos;
  beforeEach(() => {
    cache.limpiar({ propagar: false });
    modelos = [];
    registros = [];
    avisos = [];
    mock.method(console, 'warn', (m) => avisos.push(String(m)));
  });
  after(async () => {
    mock.restoreAll();
    await real.$disconnect();
  });

  for (const [ruta, consultar] of [
    ['normal', (m) => responderConsulta(m)],
    ['stream', async (m) => {
      let fin = null;
      for await (const e of responderConsultaStream(m)) if (e.tipo === 'fin') fin = e;
      return fin;
    }],
  ]) {
    it(`${ruta}: responde con el modelo por defecto del entorno y lo registra`, async () => {
      const r = await consultar([{ rol: 'usuario', texto: 'cómo hago el trámite de la cédula' }]);
      assert.equal(r.encontrado, false);
      assert.ok(modelos.length > 0);
      for (const m of modelos) assert.deepEqual([m.id, m.origen, m.respaldo], ['gpt-4o-mini', 'entorno', null]);
      assert.deepEqual(registros.map((x) => x.modelo), ['gpt-4o-mini']);
    });
  }
});
