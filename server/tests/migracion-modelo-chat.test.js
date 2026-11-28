import './helpers/base-de-prueba.js';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { default: prisma } = await import('../src/config/prisma.js');
const { MODELOS_DEL_CATALOGO, modeloDelCatalogo } = await import('../src/config/modelos-chat.js');

const SERVIDOR = fileURLToPath(new URL('..', import.meta.url));
const MIGRACION = fileURLToPath(new URL('../prisma/migrations/20261117120000_selector_modelo_chat/migration.sql', import.meta.url));
const esTemporal = /@(localhost|127\.0\.0\.1):55432\//.test(process.env.DATABASE_URL ?? '');

const aplicar = () =>
  spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'execute', '--file', MIGRACION, '--url', process.env.DATABASE_URL], { cwd: SERVIDOR, encoding: 'utf8' });

describe('migración del selector de modelo', { skip: !esTemporal && 'solo contra la base temporal de Docker' }, () => {
  after(() => prisma.$disconnect());

  it('se aplica dos veces seguidas sin error y no duplica nada', () => {
    for (let i = 0; i < 2; i++) {
      const r = aplicar();
      assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
    }
  });

  it('deja una sola fila de configuración, un solo modelo por defecto y la columna consultas.modelo', async () => {
    assert.equal(await prisma.configuracionChat.count(), 1);
    const porDefecto = await prisma.modeloChat.findMany({ where: { esPorDefecto: true }, select: { id: true } });
    assert.deepEqual(porDefecto, [{ id: 'gpt-4o-mini' }]);
    const [{ n }] = await prisma.$queryRaw`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'consultas' AND column_name = 'modelo' AND is_nullable = 'YES'`;
    assert.equal(n, 1);
  });

  it('el seed coincide con el catálogo: solo gpt-4o-mini habilitado al principio', async () => {
    const filas = await prisma.modeloChat.findMany({ where: { id: { in: MODELOS_DEL_CATALOGO.map((m) => m.id) } } });
    assert.equal(filas.length, MODELOS_DEL_CATALOGO.length);
    for (const f of filas) {
      const m = modeloDelCatalogo(f.id);
      assert.deepEqual(
        { proveedor: f.proveedor, modeloApi: f.modeloApi, nombre: f.nombreVisible, parametros: f.parametros, precios: f.precios },
        { proveedor: m.proveedor, modeloApi: m.modeloApi, nombre: m.nombre, parametros: m.parametros, precios: m.precios },
        f.id,
      );
    }
    assert.deepEqual(MODELOS_DEL_CATALOGO.filter((m) => m.habilitado).map((m) => m.id), ['gpt-4o-mini']);
    assert.deepEqual(filas.filter((f) => f.habilitado).map((f) => f.id), ['gpt-4o-mini']);
  });

  it('el CHECK rechaza un proveedor fuera de la lista y una segunda fila de configuración', async () => {
    await assert.rejects(prisma.$executeRaw`INSERT INTO modelo_chat (id, proveedor, modelo_api, nombre_visible) VALUES ('x-prueba-check', 'otro', 'x', 'x')`);
    await assert.rejects(prisma.$executeRaw`INSERT INTO configuracion_chat (id, modelo_activo_id) VALUES (2, 'gpt-4o-mini')`);
  });
});
