import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { loginSchema } from '../src/validators/auth.validators.js';
import { registroSchema, filtroUsuariosSchema } from '../src/validators/usuario.validator.js';
import { crearSectorSchema, actualizarSectorSchema } from '../src/validators/sector.validator.js';
import { crearTramiteSchema, actualizarTramiteSchema } from '../src/validators/tramite.validator.js';

const mensaje = (schema, valor) => schema.safeParse(valor).error?.issues[0].message;

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success, true);
    assert.equal(loginSchema.safeParse({ dni: '12345678', password: 'x' }).success, true);
  });

  it('rechaza un email mal formado', () => {
    assert.equal(mensaje(loginSchema, { email: 'no-es-email', password: 'x' }), 'El email no es válido.');
  });

  it('rechaza un DNI con formato inválido', () => {
    assert.equal(loginSchema.safeParse({ dni: '123', password: 'x' }).success, false);
  });

  it('rechaza una contraseña vacía', () => {
    assert.equal(mensaje(loginSchema, { email: 'a@b.com', password: '' }), 'La contraseña es obligatoria.');
  });
});

describe('registroSchema', () => {
  it('exige al menos 8 caracteres de contraseña', () => {
    const m = mensaje(registroSchema, { nombre: 'Ana', email: 'a@b.com', password: 'corta' });
    assert.equal(m, 'La contraseña debe tener al menos 8 caracteres.');
  });

  it('acepta un registro completo', () => {
    const r = registroSchema.safeParse({ nombre: 'Ana', email: 'a@b.com', password: '12345678' });
    assert.equal(r.success, true);
  });
});

describe('crearSectorSchema', () => {
  it('devuelve el mensaje propio cuando el tipo es inválido', () => {
    // Regresión: con `errorMap` (Zod v3) este mensaje se ignoraba en silencio.
    const m = mensaje(crearSectorSchema, { nombre: 'X', tipo: 'OTRO' });
    assert.match(m, /El tipo debe ser uno de los especificados/);
  });

  it('acepta los tres tipos válidos', () => {
    for (const tipo of ['MINISTERIO', 'SUBSECRETARIA', 'DEPARTAMENTO']) {
      assert.equal(crearSectorSchema.safeParse({ nombre: 'X', tipo }).success, true, tipo);
    }
  });

  it('rechaza un parentId que no sea entero positivo', () => {
    assert.equal(crearSectorSchema.safeParse({ nombre: 'X', tipo: 'MINISTERIO', parentId: 0 }).success, false);
    assert.equal(crearSectorSchema.safeParse({ nombre: 'X', tipo: 'MINISTERIO', parentId: 1.5 }).success, false);
  });

  it('acepta parentId null para dejar el sector en la raíz', () => {
    assert.equal(crearSectorSchema.safeParse({ nombre: 'X', tipo: 'MINISTERIO', parentId: null }).success, true);
    assert.equal(actualizarSectorSchema.safeParse({ parentId: null }).success, true);
  });

  it('distingue parentId ausente de parentId null', () => {
    // Ausente = no modificar el padre; null = quitarlo.
    assert.equal('parentId' in actualizarSectorSchema.parse({ nombre: 'X' }), false);
    assert.equal(actualizarSectorSchema.parse({ parentId: null }).parentId, null);
  });

  it('el schema de actualización deja todos los campos opcionales', () => {
    assert.equal(actualizarSectorSchema.safeParse({}).success, true);
  });
});

describe('crearTramiteSchema', () => {
  const base = { nombre: 'Licencia', descripcion: 'Desc', sectorId: 1 };

  it('completa requisitos y mesaIds vacíos si no vienen', () => {
    const t = crearTramiteSchema.parse(base);
    assert.deepEqual([t.requisitos, t.mesaIds], [[], []]);
  });

  it('acepta mesaIds con el nombre que espera el service', () => {
    // Regresión: el validator usaba `mesaId` y el service `mesaIds`, y crear fallaba siempre.
    assert.deepEqual(crearTramiteSchema.parse({ ...base, mesaIds: [1, 2] }).mesaIds, [1, 2]);
  });
});

describe('actualizarTramiteSchema', () => {
  it('no agrega requisitos ni mesas que no vinieron en el body', () => {
    // Regresión: en Zod 4 los .default([]) se aplicaban dentro de .partial(), y un
    // PATCH que solo cambiaba el nombre borraba todos los requisitos y mesas.
    const t = actualizarTramiteSchema.parse({ nombre: 'Otro' });
    assert.equal('requisitos' in t, false);
    assert.equal('mesaIds' in t, false);
  });

  it('respeta un array vacío explícito para vaciar los requisitos', () => {
    assert.deepEqual(actualizarTramiteSchema.parse({ requisitos: [] }).requisitos, []);
  });
});

describe('filtroUsuariosSchema', () => {
  it('acepta los cuatro estados y la ausencia de filtro', () => {
    assert.equal(filtroUsuariosSchema.safeParse({}).success, true);
    for (const estado of ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO']) {
      assert.equal(filtroUsuariosSchema.safeParse({ estado }).success, true, estado);
    }
  });

  it('rechaza un estado desconocido con mensaje propio', () => {
    const m = mensaje(filtroUsuariosSchema, { estado: 'CUALQUIERA' });
    assert.match(m, /El estado debe ser/);
  });
});
