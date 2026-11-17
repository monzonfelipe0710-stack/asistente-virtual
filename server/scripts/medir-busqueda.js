// Mide dónde queda un trámite en la búsqueda del chat, sin tocar la base: para cada pregunta, el
// puesto de su grupo de nombre, su puntaje, el del primero y si llega a los candidatos del modelo
// (entre los primeros N grupos y con al menos PROPORCION_DEL_PRIMERO del primero). Sirve para
// medir antes y después de cambiar el texto de un trámite (por ejemplo, nombres alternativos).
//
//   node scripts/medir-busqueda.js [--tramite "Solicitud Partida de Nacimiento, Matrimonio o Defunción"]
//                                  [--pregunta "..."]... [--grupos 3]... [--impacto]
//
// Con varios --grupos compara cuántos grupos pasan al modelo (3 es el de buscarTramites). Con
// --impacto, además, las preguntas de eval-chat y eval-seguridad (A, B y C) cuyos candidatos cambian
// contra 3 grupos. Solo lee la base; llama a OpenAI para los embeddings.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prisma from '../src/config/prisma.js';
import { generarEmbedding } from '../src/services/embedding.service.js';
import { PROPORCION_DEL_PRIMERO, puntuarGrupos, soloLosCercanos } from '../src/services/busqueda.service.js';
import { obtenerJurisdicciones } from '../src/services/jurisdiccion.service.js';
import { localidadesConocidas, quitarLocalidades } from '../src/services/variantes.service.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const TRAMITE = argumento('--tramite')[0] ?? 'Solicitud Partida de Nacimiento, Matrimonio o Defunción';
const PREGUNTAS = argumento('--pregunta').length > 0 ? argumento('--pregunta') : [
  'partida de nacimiento',
  'acta de nacimiento',
  'quiero la partida de nacimiento de mi hijo',
  'certificado de nacimiento',
  'partida de matrimonio',
  'partida de defunción',
];
const ACTUAL = 3;
const GRUPOS = [...new Set([ACTUAL, ...argumento('--grupos').map(Number)])];
const IMPACTO = process.argv.includes('--impacto');
const PROFUNDIDAD = 60;

const [objetivo] = await prisma.tramite.findMany({ where: { nombre: TRAMITE, publicado: true }, select: { id: true } });
if (!objetivo) throw new Error(`No hay un trámite publicado "${TRAMITE}".`);
const localidades = localidadesConocidas(await obtenerJurisdicciones());

// Lo que hace el chat: la búsqueda va sin las localidades nombradas. Un ranking por pregunta.
const rankings = new Map();
const ranking = async (pregunta) => {
  if (!rankings.has(pregunta)) {
    const texto = quitarLocalidades(pregunta, localidades) || pregunta;
    rankings.set(pregunta, await puntuarGrupos(texto, await generarEmbedding(texto), { limite: PROFUNDIDAD }));
  }
  return rankings.get(pregunta);
};
const candidatos = (grupos, n) => soloLosCercanos(grupos.slice(0, n));
const tiene = (g) => g.variantes.some((x) => x.id === objetivo.id);
const f3 = (x) => (x == null ? '-' : x.toFixed(3));

console.log(`Trámite #${objetivo.id} "${TRAMITE}"\n`);
const filas = [];
for (const pregunta of PREGUNTAS) {
  const grupos = await ranking(pregunta);
  const i = grupos.findIndex(tiene);
  filas.push({
    pregunta,
    puesto: i === -1 ? `>${PROFUNDIDAD}` : i + 1,
    puntaje: f3(grupos[i]?.mejor),
    primero: `${f3(grupos[0]?.mejor)} #${grupos[0]?.id}`,
    tercero: `${f3(grupos[2]?.mejor)} #${grupos[2]?.id}`,
    proporcion: i === -1 ? '-' : `${Math.round((100 * grupos[i].mejor) / grupos[0].mejor)} %`,
    ...Object.fromEntries(GRUPOS.map((n) => [`llega (${n})`, candidatos(grupos, n).some(tiene) ? 'sí' : 'no'])),
  });
}
console.table(filas);
console.log(`(llega (N): entre los primeros N grupos y con al menos el ${PROPORCION_DEL_PRIMERO * 100} % del puntaje del primero)`);

if (IMPACTO) {
  // Las preguntas de los evals, como las lee medir-tipeo.js: los turnos de la persona van juntos.
  const leer = (archivo) => readFileSync(fileURLToPath(new URL(archivo, import.meta.url)), 'utf8');
  const comillas = (s) => [...s.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
  const textos = new Set();
  for (const linea of leer('./eval-chat.js').split('\n')) {
    if (/catalogo: '(?:sintetico|municipal)'/.test(linea)) continue;
    const turnos = linea.match(/turnos: \[([^\]]+)\]/);
    const pregunta = linea.match(/pregunta: '((?:[^'\\]|\\.)*)'/) ?? linea.match(/pregunta: "((?:[^"\\]|\\.)*)"/);
    if (turnos) textos.add(comillas(turnos[1]).join(' '));
    else if (pregunta) textos.add(pregunta[1].replace(/\\'/g, "'"));
  }
  for (const m of leer('./eval-seguridad.js').matchAll(/\{ grupo: '([ABC])', caso: '((?:[^'\\]|\\.)*)'(?:, turnos: \[([^\]]+)\])?/g)) {
    textos.add(m[3] ? comillas(m[3]).join(' ') : m[2].replace(/\\'/g, "'"));
  }
  console.log(`\nImpacto sobre ${textos.size} preguntas de los evals (candidatos que cambian contra ${ACTUAL} grupos):`);
  for (const n of GRUPOS.filter((g) => g !== ACTUAL)) {
    const cambios = [];
    for (const t of textos) {
      const grupos = await ranking(t);
      const antes = candidatos(grupos, ACTUAL).map((g) => g.id).join(' ');
      const ahora = candidatos(grupos, n).map((g) => g.id).join(' ');
      if (ahora !== antes) cambios.push(`"${t}": ${antes || '(ninguno)'} → ${ahora || '(ninguno)'}`);
    }
    console.log(`\n${n} grupos: ${cambios.length} cambian`);
    for (const c of cambios) console.log(`  - ${c}`);
  }
}

await prisma.$disconnect();
