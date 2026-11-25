import './helpers/base-de-prueba.js';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizarError } from '../src/utils/sanitizar-error.js';

const ORIGINAL = { DATABASE_URL: process.env.DATABASE_URL, DATABASE_URL_TEST: process.env.DATABASE_URL_TEST };

describe('sanitizarError', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://usuario_de_prueba:clave_de_prueba@ep-prueba-123.aws.neon.tech:5432/postgres';
    delete process.env.DATABASE_URL_TEST;
  });
  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL.DATABASE_URL;
    if (ORIGINAL.DATABASE_URL_TEST) process.env.DATABASE_URL_TEST = ORIGINAL.DATABASE_URL_TEST;
    else delete process.env.DATABASE_URL_TEST;
  });

  it('saca el host del mensaje y del stack, y conserva nombre y código', () => {
    const err = new Error("Can't reach database server at `ep-prueba-123.aws.neon.tech:5432`");
    err.name = 'PrismaClientInitializationError';
    err.code = 'P1001';
    err.stack = `${err.message}\n    at algo (archivo.js:1:1)`;
    const limpio = sanitizarError(err);
    assert.ok(!limpio.message.includes('ep-prueba-123.aws.neon.tech'), limpio.message);
    assert.ok(!limpio.stack.includes('ep-prueba-123.aws.neon.tech'), limpio.stack);
    assert.equal(limpio.name, 'PrismaClientInitializationError');
    assert.equal(limpio.code, 'P1001');
  });

  it('saca el usuario y la contraseña si aparecen sueltos en el mensaje', () => {
    const err = new Error('Falló con usuario_de_prueba y clave_de_prueba en la cadena.');
    const limpio = sanitizarError(err);
    assert.ok(!limpio.message.includes('usuario_de_prueba'), limpio.message);
    assert.ok(!limpio.message.includes('clave_de_prueba'), limpio.message);
  });

  it('saca la DATABASE_URL completa si por error se imprimiera entera', () => {
    const err = new Error(`No se pudo conectar a ${process.env.DATABASE_URL}`);
    const limpio = sanitizarError(err);
    assert.ok(!limpio.message.includes('ep-prueba-123.aws.neon.tech'), limpio.message);
    assert.ok(!limpio.message.includes('usuario_de_prueba'), limpio.message);
  });

  it('devuelve el mismo error si no tiene nada sensible', () => {
    const err = new Error('Otro error cualquiera, sin datos de conexión.');
    assert.equal(sanitizarError(err), err);
  });

  it('no toca algo que no es un Error', () => {
    assert.equal(sanitizarError('texto'), 'texto');
    assert.equal(sanitizarError(null), null);
    assert.equal(sanitizarError(undefined), undefined);
  });

  it('también revisa DATABASE_URL_TEST si está definida', () => {
    process.env.DATABASE_URL_TEST = 'postgresql://otro_usuario:otra_clave@otro-host.example.com:5432/postgres';
    const err = new Error('Falló contra otro-host.example.com');
    const limpio = sanitizarError(err);
    assert.ok(!limpio.message.includes('otro-host.example.com'), limpio.message);
  });
});
