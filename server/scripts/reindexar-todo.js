// Regenera el embedding de todo el catálogo (publicados y borradores) con el texto actual de
// `textoDeTramite`. Hace falta después de cambiar ese texto.
//
//   node scripts/reindexar-todo.js --estimar      cantidad, tokens y costo aproximados, sin llamar a la API
//   node scripts/reindexar-todo.js                reindexa en lotes de 100
//   node scripts/reindexar-todo.js --desde 412    retoma desde ese id (lo indica si un lote falla)
//   node scripts/reindexar-todo.js --lote 50
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import { reindexarCatalogo } from '../src/services/embedding.service.js';
import { marcarCatalogoCambiado } from '../src/services/version-catalogo.service.js';
import { esSinCredito } from '../src/core/ai/errores.js';
import { MENSAJE_SIN_CREDITO, SALIDA_SIN_CREDITO } from './lib/sin-credito.js';

const valor = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? undefined : Number(process.argv[i + 1]);
};

const estimar = process.argv.includes('--estimar');
const desde = valor('--desde') ?? 0;
const lote = valor('--lote') ?? 100;

try {
  const inicio = Date.now();
  const r = await reindexarCatalogo({ estimar, desde, lote });
  const costo = `USD ${r.costoUsd.toFixed(5)}`;
  if (estimar) {
    console.log(`${r.tramites} trámites en ${r.lotes} lotes, ${r.caracteres} caracteres, ~${r.tokens} tokens, ~${costo}`);
  } else {
    console.log(`Listo: ${r.tramites} trámites, ${r.tokens} tokens, ${costo}, ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
    const version = await marcarCatalogoCambiado().catch(() => null);
    console.log(version
      ? `Catálogo en la versión ${version}: el servidor en marcha vacía su caché en unos segundos.`
      : 'No se pudo marcar el cambio del catálogo (¿falta la migración catalogo_version?): reiniciá el servidor.');
  }
} catch (e) {
  console.error(e.message);
  if (e.cause) console.error('Causa:', e.cause.message);
  if (esSinCredito(e)) console.error(MENSAJE_SIN_CREDITO);
  process.exitCode = esSinCredito(e) ? SALIDA_SIN_CREDITO : 1;
} finally {
  await prisma.$disconnect();
}
