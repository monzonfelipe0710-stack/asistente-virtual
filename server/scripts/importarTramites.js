import 'dotenv/config';
import { readFileSync } from 'node:fs';
import prisma from '../src/config/prisma.js';
import { importarCatalogo } from '../src/services/importacion.service.js';

// Formato del JSON: README, sección "Importar el catálogo".
const ARCHIVO = process.argv[2]
  ?? new URL('../../ingestion/data/tramites_normalizado.json', import.meta.url);

try {
  await importarCatalogo(JSON.parse(readFileSync(ARCHIVO, 'utf-8')));
  console.log('Listo. El servidor en marcha sigue con la caché anterior hasta reiniciarlo o hasta que venza (1 hora).');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
