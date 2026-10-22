import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearOpcionesCors } from '../src/config/cors.js';

const consultarOrigen = (opciones, origen) =>
  new Promise((resolve, reject) => {
    opciones.origin(origen, (error, permitido) => {
      if (error) reject(error);
      else resolve(permitido);
    });
  });

describe('configuración CORS', () => {
  it('permite los puertos locales reales del frontend durante desarrollo', async () => {
    const opciones = crearOpcionesCors({
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:5173',
    });

    assert.equal(await consultarOrigen(opciones, 'http://localhost:3000'), true);
    assert.equal(await consultarOrigen(opciones, 'http://localhost:5173'), true);
    assert.equal(await consultarOrigen(opciones, 'http://127.0.0.1:3000'), true);
  });

  it('no agrega orígenes locales automáticamente en producción', async () => {
    const opciones = crearOpcionesCors({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://chatap.example.gov.ar',
    });

    assert.equal(await consultarOrigen(opciones, 'https://chatap.example.gov.ar'), true);
    assert.equal(await consultarOrigen(opciones, 'http://localhost:3000'), false);
    assert.equal(await consultarOrigen(opciones, 'https://sitio-malicioso.example'), false);
  });

  it('permite solicitudes sin encabezado Origin', async () => {
    const opciones = crearOpcionesCors({ NODE_ENV: 'production', CORS_ORIGIN: '' });
    assert.equal(await consultarOrigen(opciones, undefined), true);
  });
});
