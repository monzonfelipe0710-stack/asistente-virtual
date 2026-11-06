// Importa el catálogo. Formato del JSON y opciones: README, sección "Importar el catálogo".
//
//   node scripts/importarTramites.js [archivo] [--dry-run] [--lote n] [--completa [--despublicar-faltantes]]
//
// Es idempotente y reanudable: si una corrida se corta, se vuelve a correr la misma. Con --completa
// despublica los trámites que el sitio ya no lista (ver el README).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import prisma from '../src/config/prisma.js';
import { importarCatalogo, formatearInforme } from '../src/services/importacion.service.js';

const args = process.argv.slice(2);
const bandera = (nombre) => args.includes(nombre);
const valor = (nombre) => {
  const i = args.indexOf(nombre);
  return i === -1 ? undefined : args[i + 1];
};
const posicionales = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--lote');

const ARCHIVO = posicionales[0] ?? new URL('../../ingestion/data/tramites_normalizado.json', import.meta.url);
const opciones = {
  simular: bandera('--dry-run'),
  completa: bandera('--completa'),
  despublicarFaltantes: bandera('--despublicar-faltantes'),
  lote: Number(valor('--lote') ?? 100),
};

// La caché la invalida la versión del catálogo en la base; el health solo sirve para avisar.
const servidorResponde = async (base) => {
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
};

const avisoDeCache = async ({ cache }) => {
  const base = process.env.SERVIDOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  if (cache.error) return `No se pudo marcar el cambio del catálogo (${cache.error}). ¿Falta aplicar la migración catalogo_version? Reiniciá el servidor para que no responda con la caché anterior.`;
  if (!cache.invalidada) return 'Sin cambios: la caché del servidor sigue siendo válida.';
  return (await servidorResponde(base))
    ? `Catálogo en la versión ${cache.version}: el servidor en ${base} vacía su caché en unos segundos (CACHE_CHEQUEO_MS, 5 s por defecto).`
    : `Catálogo en la versión ${cache.version}. No hay servidor respondiendo en ${base}: el que arranque empieza sin caché, y uno en otra dirección también la vacía solo (la versión está en la base).`;
};

try {
  if (!Number.isInteger(opciones.lote) || opciones.lote < 1) throw new Error('--lote tiene que ser un entero positivo.');
  const informe = await importarCatalogo(JSON.parse(readFileSync(ARCHIVO, 'utf-8')), opciones);
  console.log(formatearInforme(informe));
  if (!informe.simulado) console.log(await avisoDeCache(informe));
  if (informe.fallidos.length > 0) process.exitCode = 1;
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
