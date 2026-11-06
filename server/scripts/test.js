// Corre los tests. Por defecto contra una base de prueba, nunca contra la real:
//
//   npm test [-- archivos...]       DATABASE_URL_TEST si está definida; si no, la base temporal de
//                                   Docker (chatap-temporal), que se arma o se pone al día con
//                                   scripts/base-temporal.js (migraciones y catálogo real)
//   npm run test:real [-- archivos] contra la base del .env, para verificar las migraciones antes
//                                   de un deploy: pide confirmación escribiendo el host de la base
//                                   y se niega a correr sin una terminal donde confirmarlo
//
// Los tests leen DATABASE_URL: este script la fija antes de lanzarlos y `dotenv` no la pisa.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const SERVIDOR = fileURLToPath(new URL('..', import.meta.url));
const URL_TEMPORAL = 'postgresql://postgres:temporal@localhost:55432/postgres';
const args = process.argv.slice(2);
const REAL = args.includes('--real');
const archivos = args.filter((a) => a !== '--real');

// La del .env se lee aparte, sin cargarla en el entorno: solo sirve para no confundirlas.
const DEL_ENV = dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), processEnv: {}, quiet: true }).parsed?.DATABASE_URL ?? null;

const hostDe = (url) => {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return null;
  }
};
const salir = (mensaje) => {
  console.error(mensaje);
  process.exit(1);
};

let url;
if (REAL) {
  if (!DEL_ENV) salir('No hay DATABASE_URL en el .env.');
  if (!process.stdin.isTTY) salir('test:real necesita una terminal para confirmar: no corre sin confirmación.');
  const host = new URL(DEL_ENV).hostname;
  console.log(`Vas a correr los tests contra la base REAL (${host}).`);
  console.log('Crean y borran sus propios datos, pero la base es la de producción.');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = (await rl.question(`Para confirmar, escribí el host (${host}): `)).trim();
  rl.close();
  if (respuesta !== host) salir('No coincide: no se corrió nada.');
  url = DEL_ENV;
} else {
  url = process.env.DATABASE_URL_TEST || URL_TEMPORAL;
  if (DEL_ENV && hostDe(url) === hostDe(DEL_ENV)) {
    salir('DATABASE_URL_TEST apunta a la misma base que el .env (la real). Para eso está npm run test:real.');
  }
  if (url === URL_TEMPORAL) {
    console.log('Preparando la base temporal (chatap-temporal)...');
    const r = spawnSync(process.execPath, ['scripts/base-temporal.js'], { cwd: SERVIDOR, encoding: 'utf8' });
    if (r.status !== 0) salir(`No se pudo preparar la base temporal:\n${r.stdout}${r.stderr}`);
  }
}

console.log(`Tests contra ${hostDe(url)}${REAL ? ' (REAL)' : ''}`);
const r = spawnSync(
  process.execPath,
  ['--test', '--experimental-test-module-mocks', ...(archivos.length > 0 ? archivos : ['tests/**/*.test.js'])],
  { cwd: SERVIDOR, stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } },
);

// Los del scraper (ingestion/, Python, sin red ni base) van con la corrida completa.
let python = 0;
if (archivos.length === 0) {
  const INGESTION = fileURLToPath(new URL('../../ingestion/', import.meta.url));
  const interprete = [join(INGESTION, '.venv', 'Scripts', 'python.exe'), join(INGESTION, '.venv', 'bin', 'python')].find(existsSync);
  if (interprete) {
    console.log('\nTests del scraper (ingestion/tests)...');
    python = spawnSync(interprete, ['-m', 'unittest', 'discover', '-s', 'tests'], { cwd: INGESTION, stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).status ?? 1;
  } else {
    console.log('\nSin ingestion/.venv: no se corren los tests del scraper (ver el README, "Importar el catálogo").');
  }
}
process.exit((r.status ?? 1) || python);
