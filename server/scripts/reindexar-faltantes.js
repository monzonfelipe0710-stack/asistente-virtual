import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import { indexarTramite } from '../src/services/embedding.service.js';

const faltantes = await prisma.$queryRaw`SELECT id FROM tramites WHERE embedding IS NULL ORDER BY id`;
console.log(`Sin embedding: ${faltantes.length}`);

let fallidos = 0;
for (const { id } of faltantes) {
  try {
    await indexarTramite(id);
    console.log(`✓ ${id}`);
  } catch (e) {
    fallidos++;
    console.error(`✗ ${id}: ${e.message}`);
  }
}

if (fallidos > 0) process.exitCode = 1;
await prisma.$disconnect();
