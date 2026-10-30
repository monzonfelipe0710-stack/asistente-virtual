import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TipoSector, EstadoUsuario, Genero } from '@prisma/client';

import { loginSchema, recuperarSchema } from '../src/validators/auth.validators.js';
import { registroCiudadanoSchema, filtroUsuariosSchema, crearEmpleadoSchema } from '../src/validators/usuario.validator.js';
import { crearSectorSchema, actualizarSectorSchema } from '../src/validators/sector.validator.js';
import { crearTramiteSchema, actualizarTramiteSchema } from '../src/validators/tramite.validator.js';

const mensaje = (schema, valor) => schema.safeParse(valor).error?.issues[0].message;

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success, true);
  });

  it('rechaza un email mal formado', () => {
    assert.equal(mensaje(loginSchema, { email: 'no-es-email', password: 'x' }), 'El email no es válido.');
  });

  it('rechaza una contraseña vacía', () => {
    assert.equal(mensaje(loginSchema, { email: 'a@b.com', password: '' }), 'La contraseña es obligatoria.');
  });

  it('acepta un DNI en lugar del email', () => {
    assert.deepEqual(loginSchema.parse({ dni: '12345678', password: 'x' }), { dni: '12345678', password: 'x' });
  });

  it('exige exactamente uno entre email y DNI', () => {
    const m = 'Ingresá el email o el DNI, uno de los dos.';
    assert.equal(mensaje(loginSchema, { email: 'a@b.com', dni: '12345678', password: 'x' }), m);
    assert.equal(mensaje(loginSchema, { password: 'x' }), m);
  });

  it('normaliza el email con trim y minúsculas', () => {
    assert.equal(loginSchema.parse({ email: '  Ana@Mail.COM ', password: 'x' }).email, 'ana@mail.com');
  });
});

describe('email normalizado en los demás formularios', () => {
  it('recuperar, registro y alta de empleado guardan el email en minúsculas y sin espacios', () => {
    const email = ' Ana@Mail.COM ';
    assert.equal(recuperarSchema.parse({ email }).email, 'ana@mail.com');
    assert.equal(
      registroCiudadanoSchema.parse({ dni: '12345678', genero: 'F', email, password: '12345678' }).email,
      'ana@mail.com'
    );
    assert.equal(
      crearEmpleadoSchema.parse({ nombre: 'Ana', email, password: '12345678' }).email,
      'ana@mail.com'
    );
  });
});

describe('registroCiudadanoSchema', () => {
  const base = { dni: '12345678', genero: 'F', email: 'a@b.com', password: '12345678' };

  it('exige al menos 8 caracteres de contraseña', () => {
    const m = mensaje(registroCiudadanoSchema, { ...base, password: 'corta' });
    assert.equal(m, 'La contraseña debe tener al menos 8 caracteres.');
  });

  it('exige un DNI de 7 u 8 dígitos', () => {
    assert.equal(mensaje(registroCiudadanoSchema, { ...base, dni: '123' }), 'El DNI debe tener 7 u 8 dígitos.');
    assert.equal(registroCiudadanoSchema.safeParse({ ...base, dni: '1234567' }).success, true);
  });

  it('acepta todos los géneros del enum de Prisma', () => {
    const nombreCompleto = { nombre: 'Ana', apellido: 'Gómez' };
    for (const genero of Object.values(Genero)) {
      assert.equal(registroCiudadanoSchema.safeParse({ ...base, ...nombreCompleto, genero }).success, true, genero);
    }
  });

  it('con M o F ignora el nombre y apellido tipeados', () => {
    const datos = registroCiudadanoSchema.parse({ ...base, genero: 'M', nombre: 'Ana', apellido: 'Gómez' });
    assert.equal('nombre' in datos, false);
    assert.equal('apellido' in datos, false);
  });

  it('con X exige nombre y apellido, sin espacios de más', () => {
    const x = { ...base, genero: 'X' };
    assert.equal(mensaje(registroCiudadanoSchema, { ...x, apellido: 'Gómez' }), 'El nombre es obligatorio.');
    assert.equal(mensaje(registroCiudadanoSchema, { ...x, nombre: 'Ana', apellido: '   ' }), 'El apellido es obligatorio.');
    const datos = registroCiudadanoSchema.parse({ ...x, nombre: ' Ana ', apellido: ' Gómez ' });
    assert.deepEqual([datos.nombre, datos.apellido], ['Ana', 'Gómez']);
  });

  it('rechaza un género fuera del enum con mensaje propio', () => {
    assert.match(mensaje(registroCiudadanoSchema, { ...base, genero: 'Z' }), /El género debe ser uno de/);
  });

  it('acepta un registro completo', () => {
    assert.equal(registroCiudadanoSchema.safeParse(base).success, true);
  });
});

describe('crearSectorSchema', () => {
  it('devuelve el mensaje propio cuando el tipo es inválido', () => {
    // Regresión: con `errorMap` (Zod v3) este mensaje se ignoraba en silencio.
    const m = mensaje(crearSectorSchema, { nombre: 'X', tipo: 'OTRO' });
    assert.match(m, /El tipo debe ser uno de/);
  });

  it('acepta todos los tipos del enum de Prisma, incluido ORGANISMO', () => {
    assert.ok(Object.values(TipoSector).includes('ORGANISMO'));
    for (const tipo of Object.values(TipoSector)) {
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
  it('acepta todos los estados del enum y la ausencia de filtro', () => {
    assert.equal(filtroUsuariosSchema.safeParse({}).success, true);
    for (const estado of Object.values(EstadoUsuario)) {
      assert.equal(filtroUsuariosSchema.safeParse({ estado }).success, true, estado);
    }
  });

  it('rechaza un estado desconocido con mensaje propio', () => {
    const m = mensaje(filtroUsuariosSchema, { estado: 'CUALQUIERA' });
    assert.match(m, /El estado debe ser/);
  });
});
