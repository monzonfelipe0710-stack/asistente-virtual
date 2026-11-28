// Control de falsos positivos de la verificación de la salida del chat (ver
// src/services/verificacion.service.js) contra el catálogo real: toma el texto de cada trámite
// publicado (la descripción y los requisitos) como si fuera la respuesta del modelo sobre ese mismo
// trámite y cuenta las oraciones que cada capa cambiaría. Es solo lectura.
//
//   node scripts/medir-verificacion.js            resumen por capa
//   node scripts/medir-verificacion.js --detalle  además, cada oración modificada
//
// Lo esperado: 0 en datos sensibles y en costos. En enlaces cuenta las URL de las descripciones que
// no son la fuente oficial del trámite (en una respuesta, esa oración se saca entera).
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import { cargarDetalle } from '../src/services/chat.service.js';
import { crearVerificador } from '../src/services/verificacion.service.js';

const DETALLE = process.argv.includes('--detalle');

const ids = (await prisma.tramite.findMany({ where: { publicado: true }, select: { id: true }, orderBy: { id: 'asc' } })).map((t) => t.id);
const tramites = await cargarDetalle(ids);

const correcciones = [];
let lineas = 0;
for (const t of tramites) {
  const verificar = crearVerificador({ tramites: [t], principales: [t], alCorregir: (c) => correcciones.push({ tramite: t, ...c }) });
  const textos = [t.descripcion, ...t.requisitos.map((r) => r.descripcion)];
  for (const linea of textos.flatMap((texto) => (texto ?? '').split('\n')).filter((l) => l.trim())) {
    lineas++;
    verificar(linea);
  }
}

const porCapa = Object.groupBy(correcciones, (c) => c.capa);
console.log(`Trámites publicados: ${tramites.length}; líneas revisadas: ${lineas}`);
for (const capa of ['datos', 'costo', 'enlace']) {
  const lista = porCapa[capa] ?? [];
  console.log(`  ${capa}: ${lista.length} oraciones en ${new Set(lista.map((c) => c.tramite.id)).size} trámites`);
  if (DETALLE || capa !== 'enlace') {
    for (const c of lista) console.log(`    - [${c.tramite.id}] ${c.tramite.nombre}: "${c.original.slice(0, 160)}"${c.corregida ? ` → "${c.corregida}"` : ''}`);
  }
}

if ((porCapa.datos?.length ?? 0) + (porCapa.costo?.length ?? 0) > 0) process.exitCode = 1;
await prisma.$disconnect();
