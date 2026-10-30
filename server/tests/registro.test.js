import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// El padrón se simula: cada prueba define qué persona devuelve para cada sexo.
// Los usuarios se crean en la base de verdad y se borran al terminar.
let padron;
let llamadas;
// namedExports y no exports: exports recién existe en versiones nuevas de Node y
// el proyecto soporta desde 22.3 (en las nuevas solo avisa que está deprecado).
mock.module(new URL('../src/services/turnos.service.js', import.meta.url).href, {
  namedExports: {
    buscarPersona: async (dni, sexo) => {
      llamadas.push(sexo);
      return padron[sexo] ?? null;
    },
  },
});
const { registrarCiudadano } = await import('../src/controllers/usuario.controller.js');

const DOMINIO = '@registro.test.invalid';
const PASSWORD = 'clave-de-prueba';

const persona = (nombre, apellido) => ({ nombre, apellido, nombreCompleto: `${nombre} ${apellido}`, cuil: null });

const dniLibre = async () => {
  for (;;) {
    const dni = String(70000000 + Math.floor(Math.random() * 9999999));
    if ((await prisma.usuario.count({ where: { dni } })) === 0) return dni;
  }
};

let numero = 0;
const registrar = async (datos) => {
  const body = { email: `ciudadano${++numero}${DOMINIO}`, password: PASSWORD, ...datos };
  const res = {
    status(codigo) { res.codigo = codigo; return res; },
    json(cuerpo) { res.cuerpo = cuerpo; return res; },
  };
  await registrarCiudadano({ body }, res);
  return res;
};

const guardado = (dni) => prisma.usuario.findUnique({ where: { dni }, select: { nombre: true, genero: true } });

const noVerificado = { statusCode: 422, message: 'No pudimos verificar tus datos en el padrón. Revisá el DNI y el sexo.' };

describe('registro de ciudadanos', () => {
  before(() => prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } }));
  beforeEach(() => { padron = {}; llamadas = []; });
  after(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('con M o F consulta solo ese sexo y guarda el nombre del padrón, ignorando el tipeado', async () => {
    padron.F = persona('ANA', 'GÓMEZ');
    const dni = await dniLibre();
    const res = await registrar({ dni, genero: 'F', nombre: 'Otra', apellido: 'Persona' });

    assert.equal(res.codigo, 201);
    assert.deepEqual(llamadas, ['F']);
    assert.deepEqual(await guardado(dni), { nombre: 'ANA GÓMEZ', genero: 'F' });
  });

  it('con M o F responde 422 si el padrón no tiene a la persona', async () => {
    await assert.rejects(registrar({ dni: await dniLibre(), genero: 'M' }), noVerificado);
    assert.deepEqual(llamadas, ['M']);
  });

  it('con X la encuentra consultando con M', async () => {
    padron.M = persona('MARÍA JOSÉ', 'PEÑA');
    const dni = await dniLibre();
    const res = await registrar({ dni, genero: 'X', nombre: 'maria', apellido: 'pena' });

    assert.equal(res.codigo, 201);
    assert.deepEqual(llamadas, ['M']);
    assert.deepEqual(await guardado(dni), { nombre: 'MARÍA JOSÉ PEÑA', genero: 'X' });
  });

  it('con X la encuentra consultando con F si con M no aparece', async () => {
    padron.F = persona('LUCÍA', 'BENÍTEZ');
    const dni = await dniLibre();
    const res = await registrar({ dni, genero: 'X', nombre: 'Lucía', apellido: 'Benítez' });

    assert.equal(res.codigo, 201);
    assert.deepEqual(llamadas, ['M', 'F']);
    assert.deepEqual(await guardado(dni), { nombre: 'LUCÍA BENÍTEZ', genero: 'X' });
  });

  it('con X responde 422 si el nombre tipeado no coincide con el del padrón', async () => {
    padron.M = persona('CARLOS', 'ROMERO');
    const dni = await dniLibre();
    await assert.rejects(registrar({ dni, genero: 'X', nombre: 'Carlos', apellido: 'Acosta' }), noVerificado);
    assert.deepEqual(llamadas, ['M', 'F']);
    assert.equal(await guardado(dni), null);
  });

  it('con X responde 422 si el padrón no tiene a la persona con ningún sexo', async () => {
    await assert.rejects(registrar({ dni: await dniLibre(), genero: 'X', nombre: 'Ana', apellido: 'Gómez' }), noVerificado);
    assert.deepEqual(llamadas, ['M', 'F']);
  });

  it('responde 409 si el DNI ya está registrado con otro género, sin consultar el padrón', async () => {
    padron.M = persona('JUAN', 'PÉREZ');
    const dni = await dniLibre();
    assert.equal((await registrar({ dni, genero: 'M' })).codigo, 201);
    llamadas = [];

    await assert.rejects(registrar({ dni, genero: 'X', nombre: 'Juan', apellido: 'Pérez' }), {
      statusCode: 409,
      message: 'Ya existe una cuenta registrada con ese DNI.',
    });
    assert.deepEqual(llamadas, []);
  });
});
