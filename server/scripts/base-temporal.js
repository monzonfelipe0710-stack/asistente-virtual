// Arma la base temporal de Docker para las pruebas con datos sintéticos (eval-chat --catalogo
// sintetico, eval-seguridad --grupo D y E): crea el contenedor chatap-temporal (Postgres con
// pgvector en localhost:55432), aplica las migraciones e importa el catálogo real. El contenedor
// es --rm: se pierde al reiniciar la PC o al detenerlo, y este script lo vuelve a armar.
//
//   node scripts/base-temporal.js               crea el contenedor si no está, migra e importa
//   node scripts/base-temporal.js --sintetico   además importa el catálogo sintético de 8 municipios
//   node scripts/base-temporal.js --municipal   además importa ingestion/data/tramites_municipal.json
//                                               (eval-chat --catalogo municipal)
//   node scripts/base-temporal.js --recrear     borra el contenedor y lo arma de cero
//
// Nunca usa la base del .env: todo corre con DATABASE_URL apuntando a la temporal, y al final
// imprime esa URL para usarla en los evals. Importar genera embeddings (llama a OpenAI).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENEDOR = 'chatap-temporal';
const PUERTO = 55432;
const CLAVE = 'temporal';
const IMAGEN = 'pgvector/pgvector:pg17';
const URL_TEMPORAL = `postgresql://postgres:${CLAVE}@localhost:${PUERTO}/postgres`;

const SERVIDOR = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const SINTETICO = args.includes('--sintetico');
const MUNICIPAL = args.includes('--municipal');
const RECREAR = args.includes('--recrear');

const env = { ...process.env, DATABASE_URL: URL_TEMPORAL };

const correr = (comando, argumentos, { silencioso = false } = {}) => {
  const r = spawnSync(comando, argumentos, { cwd: SERVIDOR, env, stdio: silencioso ? 'pipe' : 'inherit', encoding: 'utf8' });
  if (r.error) throw r.error;
  return r;
};
const exigir = (r, que) => {
  if (r.status !== 0) {
    console.error(r.stderr ?? '');
    throw new Error(`Falló: ${que} (código ${r.status}).`);
  }
  return r;
};

const docker = (...argumentos) => correr('docker', argumentos, { silencioso: true });

if (docker('info').status !== 0) {
  throw new Error('Docker no responde: abrí Docker Desktop y esperá a que diga que está corriendo.');
}

const corriendo = () => docker('ps', '--filter', `name=^${CONTENEDOR}$`, '--format', '{{.Names}}').stdout.trim() === CONTENEDOR;

if (RECREAR && corriendo()) {
  console.log(`Borrando el contenedor ${CONTENEDOR}...`);
  exigir(docker('rm', '-f', CONTENEDOR), 'borrar el contenedor');
}

if (corriendo()) {
  console.log(`El contenedor ${CONTENEDOR} ya está corriendo.`);
} else {
  console.log(`Creando el contenedor ${CONTENEDOR} (${IMAGEN}) en el puerto ${PUERTO}...`);
  exigir(
    docker('run', '-d', '--rm', '--name', CONTENEDOR, '-e', `POSTGRES_PASSWORD=${CLAVE}`, '-p', `${PUERTO}:5432`, IMAGEN),
    'crear el contenedor',
  );
}

// pg_isready responde antes de que acepte conexiones de afuera: se espera un SELECT real.
console.log('Esperando a que Postgres acepte conexiones...');
const listo = () => docker('exec', CONTENEDOR, 'psql', '-U', 'postgres', '-h', '127.0.0.1', '-tAc', 'select 1').stdout?.trim() === '1';
const limite = Date.now() + 90_000;
while (!listo()) {
  if (Date.now() > limite) throw new Error('Postgres no respondió en 90 segundos.');
  await new Promise((resolver) => setTimeout(resolver, 1000));
}

console.log('Aplicando las migraciones...');
// La CLI de Prisma se corre con este mismo Node: npx en Windows pide una shell.
exigir(correr(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']), 'aplicar las migraciones');

console.log('Importando el catálogo real...');
exigir(correr(process.execPath, ['scripts/importarTramites.js']), 'importar el catálogo real');

if (MUNICIPAL) {
  console.log('Importando el catálogo municipal...');
  exigir(correr(process.execPath, ['scripts/importarTramites.js', '--municipal']), 'importar el catálogo municipal');
}

if (SINTETICO) {
  const carpeta = mkdtempSync(join(tmpdir(), 'catalogo-sintetico-'));
  try {
    const archivo = join(carpeta, 'catalogo-sintetico.json');
    console.log('Generando e importando el catálogo sintético...');
    exigir(correr(process.execPath, ['scripts/generar-catalogo-sintetico.js', archivo]), 'generar el catálogo sintético');
    exigir(correr(process.execPath, ['scripts/importarTramites.js', archivo]), 'importar el catálogo sintético');
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
}

const publicados = docker('exec', CONTENEDOR, 'psql', '-U', 'postgres', '-tAc', 'select count(*) from tramites where publicado').stdout.trim();
console.log(`\nBase temporal lista: ${publicados} trámites publicados.`);
console.log(`Para usarla:  DATABASE_URL="${URL_TEMPORAL}" node scripts/eval-seguridad.js --grupo D --grupo E`);
