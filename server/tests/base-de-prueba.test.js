import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { revisarBaseDePrueba } from './helpers/base-de-prueba.js';

// El guardia que impide correr los tests contra una base que no es local, corridos como se corran.
const SERVIDOR = fileURLToPath(new URL('..', import.meta.url));
const REMOTA = 'postgresql://usuario:clave@ep-falsa-123.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const LOCAL = 'postgresql://postgres:temporal@localhost:55432/postgres';

// Un archivo de tests corrido con node --test directo, sin pasar por npm test.
const correrDirecto = (archivo, env) => {
  const entorno = { ...process.env, ...env };
  if (!('TESTS_BASE_NO_LOCAL' in env)) delete entorno.TESTS_BASE_NO_LOCAL;
  // Dentro de una corrida de node --test, el hijo se reportaría como subtest y saldría con 0.
  delete entorno.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', archivo], { cwd: SERVIDOR, encoding: 'utf8', env: entorno });
};

describe('guardia de la base de los tests', () => {
  it('se niega con una base remota y deja pasar las locales', () => {
    assert.match(revisarBaseDePrueba(REMOTA, undefined), /no es local \(ep-falsa-123\.sa-east-1\.aws\.neon\.tech\)/);
    for (const url of [LOCAL, 'postgresql://u:p@127.0.0.1:5432/db', 'postgresql://u:p@[::1]:5432/db']) assert.equal(revisarBaseDePrueba(url, undefined), null, url);
  });

  it('una base remota solo vale si se pide con su host', () => {
    assert.equal(revisarBaseDePrueba(REMOTA, 'ep-falsa-123.sa-east-1.aws.neon.tech'), null);
    assert.ok(revisarBaseDePrueba(REMOTA, 'otra-base.neon.tech'));
    assert.ok(revisarBaseDePrueba(REMOTA, 'true'));
  });

  it('corrido con node --test directo contra una base remota, el archivo no ejecuta ningún test', () => {
    const r = correrDirecto('tests/texto.test.js', { DATABASE_URL: REMOTA });
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /Los tests no corren contra una base que no es local/);
    assert.doesNotMatch(r.stdout, /ℹ pass [1-9]/);
  });

  it('el mismo archivo corre con una base local o con la remota pedida explícitamente', () => {
    assert.equal(correrDirecto('tests/texto.test.js', { DATABASE_URL: LOCAL }).status, 0);
    assert.equal(correrDirecto('tests/texto.test.js', { DATABASE_URL: REMOTA, TESTS_BASE_NO_LOCAL: 'ep-falsa-123.sa-east-1.aws.neon.tech' }).status, 0);
  });

  it('todos los archivos de tests importan el guardia antes que cualquier otra cosa', () => {
    const archivos = readdirSync(new URL('.', import.meta.url)).filter((f) => f.endsWith('.test.js'));
    assert.ok(archivos.length > 40);
    for (const f of archivos) {
      const primera = readFileSync(new URL(f, import.meta.url), 'utf8').split(/\r?\n/)[0];
      assert.equal(primera, "import './helpers/base-de-prueba.js';", f);
    }
  });
});
