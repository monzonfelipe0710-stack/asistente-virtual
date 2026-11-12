// Compara dos corridas de eval-chat guardadas en server/eval-resultados/ e imprime qué casos cambiaron.
//
//   node scripts/comparar-evals.js                  las dos últimas corridas de la carpeta
//   node scripts/comparar-evals.js <a.json> <b.json> esas dos (a es la anterior)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA = fileURLToPath(new URL('../eval-resultados/', import.meta.url));

const leer = (ruta) => ({ ruta, ...JSON.parse(readFileSync(ruta, 'utf-8')) });

const elegir = () => {
  const args = process.argv.slice(2);
  if (args.length === 2) return args.map(leer);
  if (args.length !== 0) throw new Error('Se pasan dos archivos o ninguno.');
  const archivos = readdirSync(CARPETA).filter((f) => /^eval-chat-.*\.json$/.test(f)).map((f) => leer(join(CARPETA, f)));
  if (archivos.length < 2) throw new Error(`Hacen falta dos corridas en ${CARPETA} (hay ${archivos.length}).`);
  return archivos.sort((x, y) => x.fecha.localeCompare(y.fecha)).slice(-2);
};

const comparar = (antes, despues) => {
  const previos = new Map(antes.casos.map((c) => [c.id, c]));
  const actuales = new Map(despues.casos.map((c) => [c.id, c]));
  const cambios = [];
  for (const [id, c] of actuales) {
    const p = previos.get(id);
    if (!p) cambios.push({ id, tipo: 'nuevo', ahora: c });
    else if (p.paso !== c.paso) cambios.push({ id, tipo: c.paso ? 'ahora pasa' : 'ahora falla', antes: p, ahora: c });
    else if (p.aciertos !== c.aciertos) cambios.push({ id, tipo: 'cambió la cantidad de aciertos', antes: p, ahora: c });
  }
  for (const [id, p] of previos) if (!actuales.has(id)) cambios.push({ id, tipo: 'ya no está', antes: p });
  return cambios;
};

// Corridas que terminaron en error de API (las corridas viejas no traen la cuenta: se lee de `obtenido`).
export const erroresDeApi = (caso) => caso.erroresDeApi ?? [...(caso.obtenido ?? '').matchAll(/ERROR:[^|]*?×(\d+)/g)].reduce((n, m) => n + Number(m[1]), 0);

try {
  const [antes, despues] = elegir();
  const invalida = [antes, despues].find((r) => r.valida === false);
  if (invalida) throw new Error(`${invalida.ruta} está marcada como inválida (${invalida.invalida}): no se compara.`);
  const conErrores = (r) => r.casos.reduce((n, c) => n + erroresDeApi(c), 0);
  const linea = (r) => `${r.fecha} (${r.modo}${r.stream ? ', stream' : ''}, ${r.corridas} corridas): ${r.ok}/${r.total} OK, ${conErrores(r)} corridas con error de API`;
  console.log(`Antes:   ${linea(antes)}\nDespués: ${linea(despues)}\n`);
  if (conErrores(antes) + conErrores(despues) > 0) console.log('Ojo: una corrida con error de API cuenta como falla y no dice nada del chat.\n');
  const cambios = comparar(antes, despues);
  if (cambios.length === 0) console.log('Ningún caso cambió.');
  for (const c of cambios) {
    const de = c.antes ? `${c.antes.aciertos}/${antes.corridas}` : '-';
    const a = c.ahora ? `${c.ahora.aciertos}/${despues.corridas}` : '-';
    console.log(`- [${c.tipo}] ${(c.ahora ?? c.antes).pregunta}: ${de} → ${a}`);
    if (c.ahora && !c.ahora.paso) console.log(`    ahora: ${c.ahora.obtenido}`);
    for (const f of (c.tipo === 'ahora falla' ? c.ahora.fallados ?? [] : []).slice(0, 1)) {
      console.log(`    respuesta fallada (${f.motivo.join(', ')}): ${f.respuesta.replace(/\s+/g, ' ').slice(0, 300)}`);
    }
  }
  const anteriores = new Map(antes.casos.map((c) => [c.id, c]));
  const siguenFallando = despues.casos.filter((c) => !c.paso && anteriores.get(c.id)?.paso === false);
  if (siguenFallando.length > 0) console.log(`\nSiguen sin pasar en las dos: ${siguenFallando.map((c) => c.pregunta).join(' | ')}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
