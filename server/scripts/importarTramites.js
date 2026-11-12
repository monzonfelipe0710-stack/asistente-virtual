// Importa el catálogo. Formato del JSON y opciones: README, sección "Importar el catálogo".
//
//   node scripts/importarTramites.js [archivo] [--dry-run] [--lote n] [--completa [--despublicar-faltantes]]
//   node scripts/importarTramites.js --municipal [archivo] [--dry-run] [--lote n] [--sin-despublicar]
//
// Es idempotente y reanudable: si una corrida se corta, se vuelve a correr la misma. Con --completa
// despublica los trámites que el sitio ya no lista (ver el README). Con --municipal importa el JSON
// de formosatuciudad.gob.ar y despublica los faltantes de esa fuente solo si es seguro.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import prisma from '../src/config/prisma.js';
import { importarCatalogo, formatearInforme, opcionesMunicipales } from '../src/services/importacion.service.js';

const args = process.argv.slice(2);
const bandera = (nombre) => args.includes(nombre);
const valor = (nombre) => {
  const i = args.indexOf(nombre);
  return i === -1 ? undefined : args[i + 1];
};
const posicionales = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--lote');

const MUNICIPAL = bandera('--municipal');
const ARCHIVO = posicionales[0]
  ?? new URL(`../../ingestion/data/${MUNICIPAL ? 'tramites_municipal' : 'tramites_normalizado'}.json`, import.meta.url);
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

const informeMunicipal = ({ sinDespublicar, noReconocidas, errores }) => [
  `Despublicación de faltantes de formosatuciudad.gob.ar: ${sinDespublicar ? `no se aplica (${sinDespublicar})` : 'se aplica'}`,
  ...noReconocidas.map((f) => `  - no reconocida: ${f.titulo} <${f.url}>: ${f.motivo}`),
  ...errores.map((f) => `  - con error: ${f.titulo} <${f.url}>: ${f.motivo}`),
].join('\n');

try {
  if (!Number.isInteger(opciones.lote) || opciones.lote < 1) throw new Error('--lote tiene que ser un entero positivo.');
  const datos = JSON.parse(readFileSync(ARCHIVO, 'utf-8'));
  let municipal = null;
  if (MUNICIPAL) {
    if (opciones.completa || opciones.despublicarFaltantes) throw new Error('Con --municipal la despublicación la decide el importador: usá --sin-despublicar para no aplicarla.');
    municipal = opcionesMunicipales(datos, { despublicar: !bandera('--sin-despublicar') });
    Object.assign(opciones, municipal.opciones);
    console.log(informeMunicipal(municipal));
  }
  const informe = await importarCatalogo(datos, opciones);
  console.log(formatearInforme(informe));
  if (!informe.simulado) console.log(await avisoDeCache(informe));
  if (informe.fallidos.length > 0 || municipal?.noReconocidas.length > 0 || municipal?.errores.length > 0) process.exitCode = 1;
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
