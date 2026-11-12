import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import { indexarTramite } from '../src/services/embedding.service.js';
import { marcarCatalogoCambiado } from '../src/services/version-catalogo.service.js';
import { esSinCredito } from '../src/core/ai/errores.js';
import { MENSAJE_SIN_CREDITO, SALIDA_SIN_CREDITO } from './lib/sin-credito.js';

const faltantes = await prisma.$queryRaw`SELECT id FROM tramites WHERE embedding IS NULL ORDER BY id`;
console.log(`Sin embedding: ${faltantes.length}`);

let fallidos = 0;
let exitosos = 0;
for (const { id } of faltantes) {
  try {
    await indexarTramite(id);
    exitosos++;
    console.log(`✓ ${id}`);
  } catch (e) {
    fallidos++;
    if (esSinCredito(e)) {
      console.error(MENSAJE_SIN_CREDITO);
      process.exitCode = SALIDA_SIN_CREDITO;
      break;
    }
    console.error(`✗ ${id}: ${e.message}`);
  }
}

if (exitosos > 0) await marcarCatalogoCambiado().catch(() => console.error('No se pudo marcar el cambio del catálogo: reiniciá el servidor.'));
if (fallidos > 0) process.exitCode ||= 1;
await prisma.$disconnect();
