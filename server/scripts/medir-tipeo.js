// Mide la corrección de tipeo (services/tipeo.service.js) sobre las preguntas de eval-chat y de las
// legítimas de eval-seguridad (A, B y C): cuáles la disparan, qué devuelve el modelo, si cambian los
// candidatos de la búsqueda y cuánto tarda. Hace solo la búsqueda y la corrección, como el chat antes
// de llamar al modelo de la respuesta; no registra nada. Llama a OpenAI (embeddings y la corrección).
//
//   node scripts/medir-tipeo.js [--corridas 1] [--pregunta "..."]... [--json <archivo>]
//
// Las preguntas se leen de los scripts de los evals; con --pregunta, solo esas. Las de eval-chat
// marcadas `tipeo: true` cuentan como mal escritas (salvo los controles, que van aparte).
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prisma from '../src/config/prisma.js';
import { buscarTramites } from '../src/services/busqueda.service.js';
import { corregirConsulta, debeReescribir, UMBRAL_REESCRITURA } from '../src/services/tipeo.service.js';
import { obtenerJurisdicciones } from '../src/services/jurisdiccion.service.js';
import { localidadesConocidas, quitarLocalidades } from '../src/services/variantes.service.js';
import { respuestaDeCortesia } from '../src/utils/saludo.js';
import { esSinCredito } from '../src/core/ai/errores.js';
import { MENSAJE_SIN_CREDITO, SALIDA_SIN_CREDITO } from './lib/sin-credito.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 1);
const CONTROLES = new Set(['capital de fransia', 'reseta de milanesa', 'resultado del partido de fubol']);

const leer = (archivo) => readFileSync(fileURLToPath(new URL(archivo, import.meta.url)), 'utf8');
const comillas = (s) => [...s.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
const leerPreguntas = () => {
  const casos = [];
  for (const linea of leer('./eval-chat.js').split('\n')) {
    if (/catalogo: '(?:sintetico|municipal)'/.test(linea)) continue;
    const turnos = linea.match(/turnos: \[([^\]]+)\]/);
    const pregunta = linea.match(/pregunta: '((?:[^'\\]|\\.)*)'/) ?? linea.match(/pregunta: "((?:[^"\\]|\\.)*)"/);
    if (turnos) casos.push({ origen: 'eval-chat', turnos: comillas(turnos[1]) });
    else if (pregunta) {
      const texto = pregunta[1].replace(/\\'/g, "'");
      const tipo = !/tipeo: true/.test(linea) ? 'bien escrita' : CONTROLES.has(texto) ? 'control' : 'mal escrita';
      casos.push({ origen: 'eval-chat', turnos: [texto], tipo });
    }
  }
  for (const m of leer('./eval-seguridad.js').matchAll(/\{ grupo: '([ABC])', caso: '((?:[^'\\]|\\.)*)'(?:, turnos: \[([^\]]+)\])?/g)) {
    casos.push({ origen: `eval-seguridad ${m[1]}`, turnos: m[3] ? comillas(m[3]) : [m[2]] });
  }
  // Una misma pregunta en los dos evals se mide una vez.
  const vistos = new Set();
  return casos
    .map((c) => ({ tipo: 'bien escrita', ...c }))
    .filter((c) => !vistos.has(c.turnos.join(' | ')) && vistos.add(c.turnos.join(' | ')));
};

const elegidas = argumento('--pregunta');
const CASOS = elegidas.length > 0 ? elegidas.map((p) => ({ origen: '--pregunta', turnos: [p], tipo: '-' })) : leerPreguntas();

const localidades = localidadesConocidas(await obtenerJurisdicciones());
const mediana = (xs) => {
  const orden = [...xs].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

// Lo mismo que prepararCandidatos en chat.service.js: el texto de todos los turnos sin las
// localidades, y un mensaje de cortesía no se corrige.
const medir = async ({ turnos }) => {
  const consulta = turnos.join(' ');
  const texto = quitarLocalidades(consulta, localidades) || consulta;
  let mejor = null;
  const antes = await buscarTramites(texto, { alPuntaje: (p) => (mejor = p) });
  const esCortesia = respuestaDeCortesia(turnos.at(-1)) !== null;
  const r = { mejor, antes: antes.map((g) => g.id), despues: antes.map((g) => g.id), estado: 'no se dispara', ms: null, corregido: null };
  if (esCortesia || !debeReescribir(antes, mejor)) return { ...r, estado: esCortesia && debeReescribir(antes, mejor) ? 'cortesía' : r.estado };
  const inicio = performance.now();
  let estado = null;
  const corregido = await corregirConsulta(texto, { alReescribir: (x) => (estado = x.estado) });
  const ms = performance.now() - inicio;
  const despues = corregido === null ? antes : await buscarTramites(corregido);
  return { ...r, estado, corregido, ms, msTotal: performance.now() - inicio, despues: despues.map((g) => g.id) };
};

try {
  console.log(`Umbral: ${UMBRAL_REESCRITURA}. ${CASOS.length} preguntas × ${CORRIDAS} corridas.\n`);
  const filas = [];
  for (const caso of CASOS) {
    for (let i = 0; i < CORRIDAS; i++) {
      const r = await medir(caso);
      const cambia = r.antes.join(',') !== r.despues.join(',');
      filas.push({ ...caso, ...r, cambia });
      const pregunta = caso.turnos.join(' → ');
      if (r.estado !== 'no se dispara' || caso.tipo !== 'bien escrita') {
        console.log(`[${caso.tipo}] ${pregunta.slice(0, 70)}: puntaje ${(r.mejor ?? 0).toFixed(3)}, ${r.estado}${r.corregido ? ` → "${r.corregido}"` : ''}` +
          `${r.ms !== null ? `, ${Math.round(r.ms)} ms (con la nueva búsqueda ${Math.round(r.msTotal)} ms)` : ''}; candidatos [${r.antes}]${cambia ? ` → [${r.despues}]` : ''}`);
      }
    }
  }
  const resumen = Object.entries(Object.groupBy(filas, (f) => f.tipo)).map(([tipo, fs]) => ({
    tipo,
    corridas: fs.length,
    'se dispara': fs.filter((f) => f.ms !== null).length,
    corregida: fs.filter((f) => f.estado === 'corregida').length,
    'igual': fs.filter((f) => f.estado === 'igual').length,
    'inválida o falla': fs.filter((f) => f.estado === 'invalida' || f.estado === 'falla').length,
    'cambian los candidatos': fs.filter((f) => f.cambia).length,
  }));
  console.log('');
  console.table(resumen);
  const disparadas = filas.filter((f) => f.ms !== null);
  if (disparadas.length > 0) {
    console.log(`Corrección (la llamada al modelo): mediana ${Math.round(mediana(disparadas.map((f) => f.ms)))} ms, máximo ${Math.round(Math.max(...disparadas.map((f) => f.ms)))} ms.`);
    const conBusqueda = disparadas.filter((f) => f.estado === 'corregida');
    if (conBusqueda.length > 0) console.log(`Con la nueva búsqueda (cuando cambia el texto): mediana ${Math.round(mediana(conBusqueda.map((f) => f.msTotal)))} ms, máximo ${Math.round(Math.max(...conBusqueda.map((f) => f.msTotal)))} ms.`);
  }
  const bienEscritasQueCambian = filas.filter((f) => f.tipo === 'bien escrita' && f.cambia);
  if (bienEscritasQueCambian.length > 0) process.exitCode = 1;
  const archivoJson = argumento('--json')[0];
  if (archivoJson) {
    writeFileSync(archivoJson, JSON.stringify({
      fecha: new Date().toISOString(),
      umbral: UMBRAL_REESCRITURA,
      corridas: CORRIDAS,
      resumen,
      bienEscritasQueCambian: bienEscritasQueCambian.length,
      cambianEn: bienEscritasQueCambian.map((f) => f.turnos.join(' → ')),
      correccionMs: disparadas.length > 0 ? { mediana: Math.round(mediana(disparadas.map((f) => f.ms))), maximo: Math.round(Math.max(...disparadas.map((f) => f.ms))) } : null,
    }, null, 1));
  }
} catch (err) {
  if (!esSinCredito(err)) throw err;
  console.error(`\n${MENSAJE_SIN_CREDITO}`);
  process.exitCode = SALIDA_SIN_CREDITO;
} finally {
  await prisma.$disconnect();
}
