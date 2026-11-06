import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import {
  asegurarCacheVigente,
  leerVersion,
  marcarCatalogoCambiado,
  propagarInvalidacion,
  reiniciarParaTests,
} from '../src/services/version-catalogo.service.js';

// Otros archivos de test corren en paralelo y también incrementan la versión: solo se afirma
// que crece, nunca un valor exacto.
const pasadaLaVentana = () => ({ ahora: Date.now() + 60_000 });
const esperarQueCrezca = async (desde) => {
  for (let i = 0; i < 50; i++) {
    if (BigInt(await leerVersion()) > BigInt(desde)) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.fail('la versión no creció');
};

describe('versión del catálogo', () => {
  before(() => reiniciarParaTests());
  after(async () => {
    cache.alLimpiar(propagarInvalidacion);
    await prisma.$disconnect();
  });

  it('la tabla tiene una sola fila', async () => {
    const [{ n }] = await prisma.$queryRaw`SELECT count(*)::int AS n FROM catalogo_version`;
    assert.equal(n, 1);
    await assert.rejects(prisma.$executeRaw`INSERT INTO catalogo_version (id) VALUES (2)`);
  });

  it('marcarCatalogoCambiado incrementa la versión', async () => {
    const antes = await leerVersion();
    const despues = await marcarCatalogoCambiado();
    assert.ok(BigInt(despues) > BigInt(antes));
  });

  it('vacía la caché local cuando otro proceso cambió la versión, pasada la ventana de chequeo', async () => {
    await asegurarCacheVigente(pasadaLaVentana());
    cache.guardar('¿Cómo saco el pasaporte?', { respuesta: 'vieja' });
    cache.guardarCatalogo({ texto: 'resumen viejo' });

    await prisma.$executeRaw`UPDATE catalogo_version SET version = version + 1 WHERE id = 1`;
    await asegurarCacheVigente();
    assert.deepEqual(cache.obtener('¿Cómo saco el pasaporte?'), { respuesta: 'vieja' }, 'dentro de la ventana no se consulta la base');

    await asegurarCacheVigente(pasadaLaVentana());
    assert.equal(cache.obtener('¿Cómo saco el pasaporte?'), null);
    assert.equal(cache.obtenerCatalogo(), null);
  });

  it('cache.limpiar() avisa a los demás procesos; con propagar: false, no', async () => {
    let avisos = 0;
    cache.alLimpiar(() => avisos++);
    cache.limpiar({ propagar: false });
    assert.equal(avisos, 0);
    cache.limpiar();
    assert.equal(avisos, 1);

    cache.alLimpiar(propagarInvalidacion);
    const antes = await leerVersion();
    cache.limpiar();
    await esperarQueCrezca(antes);
  });
});
