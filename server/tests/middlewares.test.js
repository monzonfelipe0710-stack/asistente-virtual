import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { errorHandler } from '../src/middlewares/error.middleware.js';
import { autorizar } from '../src/middlewares/roles.middleware.js';

// Recolecta el status y el cuerpo con los que responde el errorHandler.
const respuestaFalsa = () => {
  const res = {
    status(codigo) { res.codigo = codigo; return res; },
    json(cuerpo) { res.cuerpo = cuerpo; return res; },
  };
  return res;
};

const manejar = (err, method = 'GET') => {
  const res = respuestaFalsa();
  errorHandler(err, { method }, res, () => {});
  return res;
};

const prismaKnown = (code) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: '6' });

describe('errorHandler', () => {
  it('traduce un ZodError a 400 con el primer mensaje', () => {
    const err = z.object({ a: z.string('a es obligatorio') }).safeParse({}).error;
    const res = manejar(err);
    assert.equal(res.codigo, 400);
    assert.ok(res.cuerpo.error);
  });

  it('respeta el statusCode de los errores propios', () => {
    const res = manejar(Object.assign(new Error('Sector no encontrado.'), { statusCode: 404 }));
    assert.deepEqual([res.codigo, res.cuerpo], [404, { error: 'Sector no encontrado.' }]);
  });

  it('convierte argumentos inválidos de Prisma en 400 y no en 500', () => {
    // Regresión: un id no numérico llegaba como NaN y salía 500.
    const res = manejar(new Prisma.PrismaClientValidationError('x', { clientVersion: '6' }));
    assert.equal(res.codigo, 400);
  });

  it('P2002 (unicidad) devuelve 409', () => {
    assert.equal(manejar(prismaKnown('P2002')).codigo, 409);
  });

  it('P2025 (no encontrado) devuelve 404', () => {
    assert.equal(manejar(prismaKnown('P2025')).codigo, 404);
  });

  it('P2003 distingue el borrado de la referencia inválida', () => {
    assert.equal(manejar(prismaKnown('P2003'), 'DELETE').codigo, 409);
    assert.equal(manejar(prismaKnown('P2003'), 'POST').codigo, 400);
  });

  it('cae en 500 genérico ante un error desconocido', () => {
    const original = console.error;
    console.error = () => {};
    try {
      const res = manejar(new Error('algo raro'));
      assert.equal(res.codigo, 500);
      // No debe filtrar el mensaje interno al cliente.
      assert.equal(res.cuerpo.error, 'Error del servidor.');
    } finally {
      console.error = original;
    }
  });
});

describe('autorizar', () => {
  it('devuelve 401 si no hay usuario autenticado', () => {
    assert.throws(() => autorizar('SUPERUSUARIO')({}, {}, () => {}), { statusCode: 401 });
  });

  it('devuelve 403 si el rol no está permitido', () => {
    const req = { usuario: { rol: 'ADMINISTRADOR' } };
    assert.throws(() => autorizar('SUPERUSUARIO')(req, {}, () => {}), { statusCode: 403 });
  });

  it('continúa si el rol está permitido', () => {
    let siguio = false;
    autorizar('SUPERUSUARIO', 'ADMINISTRADOR')({ usuario: { rol: 'ADMINISTRADOR' } }, {}, () => { siguio = true; });
    assert.equal(siguio, true);
  });
});
