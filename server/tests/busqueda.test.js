import './helpers/base-de-prueba.js';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// La consulta a la base y el embedding se simulan: se prueba qué hace buscarTramites con las filas.
let filas;
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('config/prisma.js'), { defaultExport: { $queryRaw: async () => filas } });
let pedidosDeEmbedding = 0;
let ultimoTextoEmbedding;
let fallaEmbedding = null;
mock.module(servicio('services/embedding.service.js'), {
  namedExports: { generarEmbedding: async (texto) => {
    pedidosDeEmbedding++;
    ultimoTextoEmbedding = texto;
    if (fallaEmbedding) throw fallaEmbedding;
    return [0.1, 0.2];
  } },
});

const { PROPORCION_DEL_PRIMERO, buscarTramites, soloLosCercanos } = await import('../src/services/busqueda.service.js');
const cache = await import('../src/services/cache.service.js');

const grupo = (id, mejor) => ({ id, mejor });

describe('soloLosCercanos', () => {
  it('saca los candidatos con un puntaje mucho menor que el primero', () => {
    // "licencia de conducir" (09-11-2026): la nacional, la solicitud de licencias y la de taxis.
    assert.deepEqual(soloLosCercanos([grupo(1879, 0.3436), grupo(207, 0.3052), grupo(1882, 0.2818)]).map((g) => g.id), [1879, 207]);
  });

  it('deja las opciones de una aclaración legítima', () => {
    // "cómo saco la licencia de pesca": turística, comercial y deportiva (89 % del primero).
    assert.equal(soloLosCercanos([grupo(88, 1), grupo(87, 0.9), grupo(166, 0.89)]).length, 3);
  });

  it('el límite es la proporción del primero, incluida', () => {
    assert.equal(soloLosCercanos([grupo(1, 1), grupo(2, PROPORCION_DEL_PRIMERO)]).length, 2);
    assert.deepEqual(soloLosCercanos([]), []);
  });
});

describe('buscarTramites', () => {
  // Una fila por variante: `mejor` es el del grupo (el mismo nombre), `score` el de la variante.
  const fila = (id, clave, mejor, score, sectorId = id) => ({ id, nombre: clave, sectorId, clave, mejor, score });

  it('el filtro va por grupo de nombre: las variantes de otra jurisdicción quedan aunque su puntaje sea bajo', async () => {
    filas = [
      fila(10, 'habilitacion comercial', 0.40, 0.40), // provincial
      fila(11, 'habilitacion comercial', 0.40, 0.12), // municipal, muy por debajo del primero
      fila(12, 'habilitacion comercial', 0.40, null), // otra localidad, sin pasar el umbral
      fila(20, 'otro tramite', 0.30, 0.30), // 75 % del primero
    ];
    const grupos = await buscarTramites('habilitación comercial');
    assert.equal(grupos.length, 1);
    assert.deepEqual(grupos[0].variantes.map((v) => v.id), [10, 11, 12]);
    assert.equal('mejor' in grupos[0], false);
  });

  it('un segundo grupo cercano queda con todas sus variantes', async () => {
    filas = [fila(10, 'pasaporte', 0.40, 0.40), fila(20, 'pasaporte express', 0.39, 0.39), fila(21, 'pasaporte express', 0.39, 0.10)];
    const grupos = await buscarTramites('pasaporte');
    assert.deepEqual(grupos.map((g) => g.variantes.map((v) => v.id)), [[10], [20, 21]]);
  });

  it('expande la pregunta con los sinónimos curados antes de pedir el embedding', async () => {
    filas = [];
    await buscarTramites('certificado de nacimiento');
    assert.equal(ultimoTextoEmbedding, 'certificado de nacimiento partida acta');
  });

  it('sin ningún sinónimo, pide el embedding con la pregunta sin cambios', async () => {
    filas = [];
    await buscarTramites('cómo saco el pasaporte');
    assert.equal(ultimoTextoEmbedding, 'cómo saco el pasaporte');
  });
});

describe('caché de embeddings de la búsqueda', () => {
  const buscar = (pregunta, cachearEmbedding) => {
    filas = [];
    return buscarTramites(pregunta, { cachearEmbedding });
  };

  it('con cachearEmbedding, la misma pregunta (salvo mayúsculas y espacios) pide el embedding una vez', async () => {
    cache.limpiarEmbeddings();
    pedidosDeEmbedding = 0;
    await buscar('cómo saco el pasaporte', true);
    await buscar('  Cómo  saco el PASAPORTE ', true);
    assert.equal(pedidosDeEmbedding, 1);
    await buscar('cómo saco el pasaporte?', true);
    assert.equal(pedidosDeEmbedding, 2);
  });

  it('sin cachearEmbedding (varios turnos) no se lee ni se guarda', async () => {
    cache.limpiarEmbeddings();
    pedidosDeEmbedding = 0;
    await buscar('cómo renuevo el pasaporte ¿y cuánto cuesta?', false);
    await buscar('cómo renuevo el pasaporte ¿y cuánto cuesta?', false);
    assert.equal(pedidosDeEmbedding, 2);
    assert.equal(cache.cantidadDeEmbeddings(), 0);
  });

  it('un embedding que falla no se guarda: la siguiente consulta lo pide de nuevo', async () => {
    cache.limpiarEmbeddings();
    pedidosDeEmbedding = 0;
    fallaEmbedding = new Error('timeout');
    await assert.rejects(buscar('cómo saco el pasaporte', true), /timeout/);
    fallaEmbedding = null;
    assert.equal(cache.cantidadDeEmbeddings(), 0);
    await buscar('cómo saco el pasaporte', true);
    assert.equal(pedidosDeEmbedding, 2);
    assert.equal(cache.cantidadDeEmbeddings(), 1);
  });

  it('cache.limpiar() (cambio del catálogo) no vacía los embeddings', async () => {
    cache.limpiarEmbeddings();
    cache.guardarEmbedding('pasaporte', [0.5, 0.25]);
    cache.limpiar({ propagar: false });
    assert.deepEqual(cache.obtenerEmbedding('pasaporte'), [0.5, 0.25]);
  });

  it('tiene un límite de tamaño: sale la menos usada', () => {
    cache.limpiarEmbeddings();
    for (let i = 0; i < 200; i++) cache.guardarEmbedding(`pregunta ${i}`, [i]);
    cache.obtenerEmbedding('pregunta 0');
    cache.guardarEmbedding('una más', [1]);
    assert.equal(cache.cantidadDeEmbeddings(), 200);
    assert.notEqual(cache.obtenerEmbedding('pregunta 0'), null);
    assert.equal(cache.obtenerEmbedding('pregunta 1'), null);
  });

  it('vence', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 0 });
    cache.limpiarEmbeddings();
    cache.guardarEmbedding('pasaporte', [1]);
    t.mock.timers.tick(60 * 60 * 1000);
    assert.deepEqual(cache.obtenerEmbedding('pasaporte'), [1]);
    t.mock.timers.tick(60 * 60 * 1000 + 1);
    assert.equal(cache.obtenerEmbedding('pasaporte'), null);
  });
});
