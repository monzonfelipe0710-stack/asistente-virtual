import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

import prisma from '../src/config/prisma.js';
import { login } from '../src/controllers/auth.controller.js';

// Crea sus propios usuarios en la base y los borra al terminar.
const DOMINIO = '@login.test.invalid';
const PASSWORD = 'clave-de-prueba';

const dniLibre = async () => {
  for (;;) {
    const dni = String(70000000 + Math.floor(Math.random() * 9999999));
    if ((await prisma.usuario.count({ where: { dni } })) === 0) return dni;
  }
};

const llamarLogin = async (body) => {
  const res = { json(cuerpo) { res.cuerpo = cuerpo; return res; } };
  await login({ body }, res);
  return res.cuerpo;
};

const credencialesInvalidas = { statusCode: 401, message: 'Credenciales inválidas' };

describe('login', () => {
  let dni;

  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const base = { nombre: 'Prueba', passwordHash, rol: 'CIUDADANO', estado: 'APROBADO' };

    dni = await dniLibre();
    await prisma.usuario.create({ data: { ...base, email: `ana${DOMINIO}`, dni, genero: 'F' } });
  });

  after(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('entra por email, aunque venga con mayúsculas y espacios', async () => {
    const r = await llamarLogin({ email: `  ANA${DOMINIO.toUpperCase()} `, password: PASSWORD });
    assert.equal(r.usuario.email, `ana${DOMINIO}`);
    assert.ok(r.token);
  });

  it('entra por DNI', async () => {
    const r = await llamarLogin({ dni, password: PASSWORD });
    assert.equal(r.usuario.email, `ana${DOMINIO}`);
  });

  it('con un DNI inexistente responde el 401 genérico', async () => {
    await assert.rejects(llamarLogin({ dni: await dniLibre(), password: PASSWORD }), credencialesInvalidas);
  });

  it('con la contraseña incorrecta responde el mismo 401 genérico', async () => {
    await assert.rejects(llamarLogin({ dni, password: 'otra-clave' }), credencialesInvalidas);
    await assert.rejects(llamarLogin({ email: `ana${DOMINIO}`, password: 'otra-clave' }), credencialesInvalidas);
  });

  it('rechaza que vengan email y DNI juntos', async () => {
    await assert.rejects(llamarLogin({ email: `ana${DOMINIO}`, dni, password: PASSWORD }), { name: 'ZodError' });
  });

  it('rechaza que no venga ni email ni DNI', async () => {
    await assert.rejects(llamarLogin({ password: PASSWORD }), { name: 'ZodError' });
  });
});
