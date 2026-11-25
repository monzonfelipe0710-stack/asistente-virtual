import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { jsonDeSalida } from './helpers/formato-stream.js';

// El modelo en el chat: se resuelve una vez por consulta y el mismo va a la corrección de tipeo, a la
// respuesta (normal o stream), a la caché (en la clave) y al registro. Si responde el de respaldo,
// el registro y la caché quedan con ese.
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;

const LUNA = { id: 'gpt-6-luna', proveedor: 'openai', modeloApi: 'gpt-6-luna', parametros: {}, precios: {} };
const MINI = { id: 'gpt-4o-mini', proveedor: 'openai', modeloApi: 'gpt-4o-mini', parametros: {}, precios: {}, respaldo: null };
let activo;
let resoluciones;
mock.module(servicio('services/modelo-chat.service.js'), {
  namedExports: {
    resolverModeloChat: async () => {
      resoluciones += 1;
      return activo;
    },
    invalidarModeloChat: () => {},
  },
});

let resultados;
mock.module(servicio('services/busqueda.service.js'), {
  namedExports: {
    buscarTramites: async (texto, { alPuntaje } = {}) => {
      const { grupos, mejor } = resultados(texto);
      alPuntaje?.(mejor);
      return grupos;
    },
  },
});

let llamadas;
let salidaModelo;
let respondeElRespaldo;
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      corregirTexto: async (args) => {
        llamadas.push({ ruta: 'tipeo', modelo: args.modelo?.id });
        return args.texto.replace('psporte', 'pasaporte');
      },
      generarRespuesta: async (args) => {
        llamadas.push({ ruta: 'normal', modelo: args.modelo?.id });
        if (respondeElRespaldo) args.alResponder(args.modelo.respaldo);
        return JSON.stringify(salidaModelo);
      },
      async *generarRespuestaStream(args) {
        llamadas.push({ ruta: 'stream', modelo: args.modelo?.id });
        if (respondeElRespaldo) args.alResponder(args.modelo.respaldo);
        const { respuesta, ...meta } = salidaModelo;
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
      return { id: registros.length, calificarToken: `token-${registros.length}` };
    },
  },
});

const { default: prisma } = await import('../src/config/prisma.js');
const cache = await import('../src/services/cache.service.js');
const { responderConsulta, responderConsultaStream } = await import('../src/services/chat.service.js');
const { limpiarCacheTipeo } = await import('../src/services/tipeo.service.js');

const DOMINIO = '@chat-modelo.test.invalid';
const SUFIJO = `chat-modelo-${Date.now()}`;
let tramite;
let sector;

const turno = (texto) => [{ rol: 'usuario', texto }];
const transmitir = async (mensajes) => {
  let texto = '';
  let fin = null;
  for await (const e of responderConsultaStream(mensajes)) {
    if (e.tipo === 'delta') texto += e.texto;
    else fin = e;
  }
  return { respuesta: texto, ...fin };
};
const RUTAS = { normal: (m) => responderConsulta(m), stream: transmitir };

describe('el modelo en el chat', () => {
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
    limpiarCacheTipeo();
    cache.limpiar({ propagar: false });
    activo = { ...LUNA, respaldo: MINI };
    resoluciones = 0;
    llamadas = [];
    registros = [];
    respondeElRespaldo = false;
    resultados = (texto) => (/pasaporte/.test(texto) ? { grupos: [{ id: tramite.id }], mejor: 0.36 } : { grupos: [], mejor: null });
    salidaModelo = { tipo: 'respuesta', saludo: '', tramiteId: tramite.id, respuesta: 'Se hace en persona.', tramitesUsados: [tramite.id], opciones: [] };
  });

  after(async () => {
    await prisma.tramite.deleteMany({ where: { id: tramite.id } });
    await prisma.sector.deleteMany({ where: { id: sector.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  for (const [ruta, consultar] of Object.entries(RUTAS)) {
    describe(`ruta ${ruta}`, () => {
      it('resuelve el modelo una vez y lo usa en la corrección de tipeo y en la respuesta', async () => {
        const r = await consultar(turno('necesito renovar el psporte'));
        assert.equal(r.encontrado, true);
        assert.equal(resoluciones, 1);
        assert.deepEqual(llamadas, [{ ruta: 'tipeo', modelo: 'gpt-6-luna' }, { ruta, modelo: 'gpt-6-luna' }]);
        assert.deepEqual(registros.map((x) => x.modelo), ['gpt-6-luna']);
      });

      it('la caché lleva el modelo en la clave: con otro modelo activo no se sirve', async () => {
        await consultar(turno('pasaporte'));
        assert.notEqual(cache.obtener('pasaporte', 'gpt-6-luna'), null);
        assert.equal(cache.obtener('pasaporte', 'gpt-4o-mini'), null);

        activo = MINI;
        llamadas = [];
        await consultar(turno('pasaporte'));
        assert.deepEqual(llamadas.map((l) => l.modelo), ['gpt-4o-mini'], 'con otro modelo se llama al modelo');

        activo = { ...LUNA, respaldo: MINI };
        llamadas = [];
        const r = await consultar(turno('pasaporte'));
        assert.deepEqual(llamadas, [], 'con el mismo modelo sale de la caché');
        assert.equal(r.encontrado, true);
        assert.equal(registros.at(-1).modelo, 'gpt-6-luna', 'la consulta cacheada se registra con el modelo de la caché');
      });

      it('si responde el de respaldo, el registro y la caché quedan con ese modelo', async () => {
        respondeElRespaldo = true;
        await consultar(turno('pasaporte'));
        assert.deepEqual(registros.map((x) => x.modelo), ['gpt-4o-mini']);
        assert.notEqual(cache.obtener('pasaporte', 'gpt-4o-mini'), null);
        assert.equal(cache.obtener('pasaporte', 'gpt-6-luna'), null);
      });
    });
  }

  it('las dos rutas usan el mismo modelo para la misma consulta', async () => {
    await RUTAS.normal(turno('pasaporte'));
    cache.limpiar({ propagar: false });
    await RUTAS.stream(turno('pasaporte'));
    assert.deepEqual(llamadas, [{ ruta: 'normal', modelo: 'gpt-6-luna' }, { ruta: 'stream', modelo: 'gpt-6-luna' }]);
    assert.deepEqual(registros.map((x) => x.modelo), ['gpt-6-luna', 'gpt-6-luna']);
  });
});
