// Despublica una lista explícita de trámites por id e incrementa la versión del catálogo para que
// los servidores vacíen su caché. Informa qué hizo con cada id; no borra nada.
//
//   node scripts/despublicarTramites.js 173 174 176 [--dry-run]
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import { marcarCatalogoCambiado } from '../src/services/version-catalogo.service.js';

const args = process.argv.slice(2);
const SIMULAR = args.includes('--dry-run');
const ids = args.filter((a) => !a.startsWith('--')).map(Number);

try {
  if (ids.length === 0 || ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new Error('Indicá los ids a despublicar como enteros positivos: node scripts/despublicarTramites.js 173 174');
  }
  const encontrados = await prisma.tramite.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, publicado: true, sector: { select: { nombre: true } } },
  });
  const porId = new Map(encontrados.map((t) => [t.id, t]));
  const aDespublicar = encontrados.filter((t) => t.publicado).map((t) => t.id);

  if (!SIMULAR && aDespublicar.length > 0) {
    await prisma.tramite.updateMany({ where: { id: { in: aDespublicar }, publicado: true }, data: { publicado: false } });
  }

  console.log(SIMULAR ? 'Simulación (no se cambió nada):' : 'Resultado:');
  for (const id of ids) {
    const t = porId.get(id);
    const accion = !t ? 'no existe' : !t.publicado ? 'ya estaba sin publicar' : SIMULAR ? 'se despublicaría' : 'despublicado';
    console.log(`  - ${id} ${t ? `${t.nombre} [${t.sector?.nombre ?? 'sin sector'}]` : ''}: ${accion}`);
  }
  console.log(`${aDespublicar.length} ${SIMULAR ? 'a despublicar' : 'despublicados'} de ${ids.length} indicados.`);

  if (!SIMULAR && aDespublicar.length > 0) {
    const version = await marcarCatalogoCambiado();
    console.log(version
      ? `Catálogo en la versión ${version}: los servidores vacían su caché en unos segundos.`
      : 'No se pudo marcar el cambio del catálogo (falta la fila de catalogo_version): reiniciá el servidor.');
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
