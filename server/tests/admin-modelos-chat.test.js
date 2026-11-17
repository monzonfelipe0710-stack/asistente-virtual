import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// Los endpoints del selector de modelo, por HTTP contra la base temporal: permisos, lista cerrada,
// auditoría y que ninguna respuesta ni log muestre una clave. El modelo activo se restaura al final.
delete process.env.MODELO_CHAT_FORZADO;
delete process.env.ANTHROPIC_API_KEY;
const CLAVE_GEMINI = 'AIza-clave-secreta-de-prueba-0123456789';
process.env.GEMINI_API_KEY = CLAVE_GEMINI;

const { default: prisma } = await import('../src/config/prisma.js');
const { default: app } = await import('../app.js');
const { modeloDelCatalogo } = await import('../src/config/modelos-chat.js');

const SUFIJO = `${Date.now()}`;
const DOMINIO = '@admin-modelos.test.invalid';
const HABILITADO = `prueba-habilitado-${SUFIJO}`;
const DESHABILITADO = `prueba-deshabilitado-${SUFIJO}`;
const SIN_CLAVE = `prueba-sin-clave-${SUFIJO}`;
const EVALUADO_OK = `prueba-evaluado-ok-${SUFIJO}`;
const EVALUADO_NO = `prueba-evaluado-no-${SUFIJO}`;
const PRUEBAS = [HABILITADO, DESHABILITADO, SIN_CLAVE, EVALUADO_OK, EVALUADO_NO];
const MOTIVO = 'Prueba automática del selector';

let servidor;
let BASE;
let superusuario;
let empleado;
let original;
const tokenDe = (u) => jwt.sign({ id: u.id, rol: u.rol, pwd: 0 }, process.env.JWT_SECRET, { expiresIn: '10m' });

const pedir = async (metodo, ruta, { usuario, cuerpo } = {}) => {
  const r = await fetch(`${BASE}/api/admin/modelos-chat${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(usuario && { Authorization: `Bearer ${tokenDe(usuario)}` }) },
    ...(cuerpo && { body: JSON.stringify(cuerpo) }),
  });
  const texto = await r.text();
  return { status: r.status, texto, json: texto ? JSON.parse(texto) : null };
};

const sinClaves = (texto) => {
  for (const clave of [process.env.OPENAI_API_KEY, CLAVE_GEMINI]) assert.ok(!texto.includes(clave), 'muestra una clave');
};

const filaDePrueba = (id, { proveedor = 'openai', habilitado, estadoEval }) => {
  const mini = modeloDelCatalogo('gpt-4o-mini');
  return { id, proveedor, modeloApi: 'gpt-4o-mini', nombreVisible: id, parametros: mini.parametros, precios: mini.precios, habilitado, ...(estadoEval && { estadoEval }) };
};
const evaluacion = (cumple) => ({ fecha: '2026-11-17T00:00:00.000Z', modelo: 'x', criterio: { cumple, motivos: cumple ? [] : ['eval-chat normal: 50 casos 3/3 contra 62'] }, resumen: { evalChat: {} }, costoPor1000: 0.3 });

describe('/api/admin/modelos-chat', () => {
  let logs = [];
  before(async () => {
    for (const nivel of ['info', 'warn', 'error']) mock.method(console, nivel, (...a) => logs.push(a.map(String).join(' ')));
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    superusuario = await prisma.usuario.create({ data: { nombre: 'Super Prueba', email: `super${DOMINIO}`, passwordHash: 'x', rol: 'SUPERUSUARIO', estado: 'APROBADO' } });
    empleado = await prisma.usuario.create({ data: { nombre: 'Empleado Prueba', email: `empleado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' } });
    await prisma.modeloChat.createMany({
      data: [
        filaDePrueba(HABILITADO, { habilitado: true }),
        filaDePrueba(DESHABILITADO, { habilitado: false }),
        filaDePrueba(SIN_CLAVE, { proveedor: 'anthropic', habilitado: true }),
        filaDePrueba(EVALUADO_OK, { habilitado: false, estadoEval: evaluacion(true) }),
        filaDePrueba(EVALUADO_NO, { habilitado: false, estadoEval: evaluacion(false) }),
      ],
    });
    original = await prisma.configuracionChat.findUnique({ where: { id: 1 } });
    servidor = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    BASE = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    servidor.close();
    await prisma.configuracionChat.update({ where: { id: 1 }, data: { modeloActivoId: original.modeloActivoId, actualizadoPor: original.actualizadoPor, actualizadoEn: original.actualizadoEn } });
    await prisma.auditoriaModeloChat.deleteMany({ where: { usuarioId: { in: [superusuario.id, empleado.id] } } });
    await prisma.modeloChat.deleteMany({ where: { id: { in: PRUEBAS } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
    mock.restoreAll();
  });

  const ENDPOINTS = [
    ['GET', '/'],
    ['PUT', '/activo', { modeloId: HABILITADO, motivo: MOTIVO }],
    ['GET', '/auditoria'],
  ];

  it('sin sesión: 401 en los tres', async () => {
    for (const [metodo, ruta, cuerpo] of ENDPOINTS) assert.equal((await pedir(metodo, ruta, { cuerpo })).status, 401, `${metodo} ${ruta}`);
  });

  it('un empleado (ADMINISTRADOR): 403 en los tres', async () => {
    for (const [metodo, ruta, cuerpo] of ENDPOINTS) assert.equal((await pedir(metodo, ruta, { usuario: empleado, cuerpo })).status, 403, `${metodo} ${ruta}`);
    assert.equal((await prisma.configuracionChat.findUnique({ where: { id: 1 } })).modeloActivoId, original.modeloActivoId);
  });

  it('el superusuario ve la lista con lo que necesita la pantalla y ninguna clave', async () => {
    const { status, texto, json } = await pedir('GET', '/', { usuario: superusuario });
    assert.equal(status, 200);
    sinClaves(texto);
    assert.equal(json.activo, original.modeloActivoId);
    const porId = new Map(json.modelos.map((m) => [m.id, m]));
    const mini = porId.get('gpt-4o-mini');
    assert.equal(mini.esPorDefecto, true);
    assert.equal(mini.claveConfigurada, true);
    assert.equal(typeof mini.costoPor1000.estimado, 'number');
    assert.ok(mini.precios.fuente.startsWith('https://'));
    const claude = porId.get('claude-haiku-5-5');
    assert.deepEqual([claude.habilitado, claude.seleccionable, claude.claveConfigurada], [false, false, false]);
    assert.deepEqual(claude.avisos, ['sin sondear', 'sin evaluar']);
    assert.equal(claude.motivoNoSeleccionable, 'Deshabilitado: sin sondear ni evaluar.');
    assert.equal(porId.get('gpt-6-luna').motivoNoSeleccionable, 'Deshabilitado: falta la evaluación.');
    assert.equal(porId.get('gemini-3.1-flash-lite').claveConfigurada, true);
    assert.equal(porId.get(HABILITADO).seleccionable, true);
    assert.equal(porId.get(SIN_CLAVE).motivoNoSeleccionable, 'Falta la clave de API del proveedor en el servidor.');
    const ok = porId.get(EVALUADO_OK);
    assert.equal(ok.motivoNoSeleccionable, 'Deshabilitado: la evaluación cumple el criterio, falta habilitarlo.');
    assert.deepEqual([ok.eval.cumple, ok.costoPor1000.medido, ok.avisos], [true, 0.3, []]);
    const no = porId.get(EVALUADO_NO);
    assert.equal(no.motivoNoSeleccionable, 'Deshabilitado: la evaluación no cumple el criterio.');
    assert.deepEqual(no.eval.motivos, ['eval-chat normal: 50 casos 3/3 contra 62']);
  });

  it('lista cerrada: rechaza un modelo inexistente, deshabilitado, sin clave o que ya está activo', async () => {
    const casos = [
      [{ modeloId: 'no-existe', motivo: MOTIVO }, 404, 'El modelo no existe.'],
      [{ modeloId: DESHABILITADO, motivo: MOTIVO }, 409, 'Deshabilitado: sin sondear ni evaluar.'],
      [{ modeloId: SIN_CLAVE, motivo: MOTIVO }, 409, 'Falta la clave de API del proveedor en el servidor.'],
      [{ modeloId: original.modeloActivoId, motivo: MOTIVO }, 409, 'Ya es el modelo activo.'],
      [{ modeloId: HABILITADO, motivo: 'x' }, 400, 'El motivo tiene que tener al menos 5 caracteres.'],
      [{ motivo: MOTIVO }, 400, 'Falta el modelo.'],
    ];
    for (const [cuerpo, status, error] of casos) {
      const r = await pedir('PUT', '/activo', { usuario: superusuario, cuerpo });
      assert.deepEqual([r.status, r.json.error], [status, error], JSON.stringify(cuerpo));
    }
    assert.equal((await prisma.configuracionChat.findUnique({ where: { id: 1 } })).modeloActivoId, original.modeloActivoId);
    assert.equal(await prisma.auditoriaModeloChat.count({ where: { usuarioId: superusuario.id } }), 0);
  });

  it('cambia el modelo activo, lo audita y la lista lo muestra en uso', async () => {
    const r = await pedir('PUT', '/activo', { usuario: superusuario, cuerpo: { modeloId: HABILITADO, motivo: MOTIVO } });
    assert.equal(r.status, 200);
    sinClaves(r.texto);
    assert.equal(r.json.activo, HABILITADO);
    assert.equal(r.json.enUso, HABILITADO);
    assert.deepEqual(r.json.actualizadoPor, { id: superusuario.id, nombre: 'Super Prueba' });

    const auditoria = await pedir('GET', '/auditoria?limite=5', { usuario: superusuario });
    assert.equal(auditoria.status, 200);
    sinClaves(auditoria.texto);
    const [ultimo] = auditoria.json.cambios;
    assert.deepEqual(
      { anterior: ultimo.modeloAnterior, nuevo: ultimo.modeloNuevo, motivo: ultimo.motivo, usuario: ultimo.usuario.id },
      { anterior: original.modeloActivoId, nuevo: HABILITADO, motivo: MOTIVO, usuario: superusuario.id },
    );
    assert.ok(logs.some((l) => l.includes(`pasó de ${original.modeloActivoId} a ${HABILITADO}`)));
    for (const l of logs) sinClaves(l);
  });

  it('valida el límite de la auditoría', async () => {
    const r = await pedir('GET', '/auditoria?limite=500', { usuario: superusuario });
    assert.deepEqual([r.status, r.json.error], [400, 'El límite debe ser un entero entre 1 y 200.']);
  });
});
