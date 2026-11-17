// Primer import de cada archivo de tests: corridos como se corran (npm test, node --test, un archivo
// suelto), se niegan a ejecutarse contra una base que no sea local. Lee el .env como dotenv/config
// (sin pisar lo que ya está en el entorno), porque Prisma también lo leería si falta la variable.
// Para otra base hay que pedirlo con TESTS_BASE_NO_LOCAL=<host de la base> (npm run test:real lo
// pone después de la confirmación).
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export const hostDeLaBase = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export const revisarBaseDePrueba = (url = process.env.DATABASE_URL, permitida = process.env.TESTS_BASE_NO_LOCAL) => {
  const host = hostDeLaBase(url);
  if (host === null || LOCALES.has(host)) return null;
  if (permitida && permitida === host) return null;
  return `Los tests no corren contra una base que no es local (${host}). Usá npm test (base temporal de Docker) o, si es a propósito, TESTS_BASE_NO_LOCAL=${host}.`;
};

const problema = revisarBaseDePrueba();
if (problema) throw new Error(problema);

// El modelo del chat no depende de la configuración de la base compartida (los archivos corren en
// paralelo y uno de ellos cambia el modelo activo): los tests de la resolución lo sacan.
process.env.MODELO_CHAT_FORZADO ??= 'gpt-4o-mini';
