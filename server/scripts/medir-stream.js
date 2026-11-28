// Mide el streaming en cada modo: el tiempo hasta el primer delta y hasta el fin, las llamadas al
// modelo y los tokens por consulta. Los modos se alternan en cada corrida (así una racha lenta de
// OpenAI les toca a todos). Llama a OpenAI de verdad, en serie; las consultas que registra se borran
// por id al terminar.
//
//   node scripts/medir-stream.js [--corridas 10] [--pregunta "..."]... [--modos esquema,meta,anterior]
//
//   esquema   STREAM_ESQUEMA=true: el JSON con esquema, leído de a pedazos (default)
//   meta      STREAM_ESQUEMA=false: la línea META y el texto
//   anterior  STREAM_INCREMENTAL=false: la línea META y el texto de a líneas completas
import 'dotenv/config';
import { esSinCredito } from '../src/core/ai/errores.js';
import { MENSAJE_SIN_CREDITO, SALIDA_SIN_CREDITO } from './lib/sin-credito.js';
import prisma from '../src/config/prisma.js';
import { openai } from '../src/config/openai.js';
import * as cache from '../src/services/cache.service.js';
import { responderConsultaStream } from '../src/services/chat.service.js';

const MODOS = {
  esquema: { STREAM_INCREMENTAL: 'true', STREAM_ESQUEMA: 'true' },
  meta: { STREAM_INCREMENTAL: 'true', STREAM_ESQUEMA: 'false' },
  anterior: { STREAM_INCREMENTAL: 'false', STREAM_ESQUEMA: 'false' },
};

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 10);
const ELEGIDOS = (argumento('--modos')[0] ?? 'esquema,meta').split(',');
for (const modo of ELEGIDOS) if (!MODOS[modo]) throw new Error(`--modos ${modo}: los modos son ${Object.keys(MODOS).join(', ')}.`);
const PREGUNTAS = argumento('--pregunta').length > 0 ? argumento('--pregunta') : [
  'cómo saco el pasaporte',
  'certificado de buena conducta',
  'cuánto cuesta la habilitación comercial de un local de 500 m² en la ciudad de Formosa',
];

// Cada llamada al modelo de la consulta en curso deja sus tokens (en streaming hay que pedirlos).
let uso = null;
const crearOriginal = openai.chat.completions.create.bind(openai.chat.completions);
openai.chat.completions.create = async (parametros, opciones) => {
  const llamada = { entrada: 0, salida: 0 };
  uso?.push(llamada);
  const anotar = (u) => {
    if (!u) return;
    llamada.entrada = u.prompt_tokens;
    llamada.salida = u.completion_tokens;
  };
  if (!parametros.stream) {
    const respuesta = await crearOriginal(parametros, opciones);
    anotar(respuesta.usage);
    return respuesta;
  }
  const stream = await crearOriginal({ ...parametros, stream_options: { include_usage: true } }, opciones);
  return (async function* () {
    for await (const pedazo of stream) {
      anotar(pedazo.usage);
      yield pedazo;
    }
  })();
};

const consultasCreadas = [];
const mediana = (xs) => {
  const orden = [...xs].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};
const promedio = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const medir = async (pregunta, modo) => {
  Object.assign(process.env, MODOS[modo]);
  cache.limpiar();
  uso = [];
  const inicio = performance.now();
  let primero = null;
  let deltas = 0;
  let fin = null;
  for await (const e of responderConsultaStream([{ rol: 'usuario', texto: pregunta }], null, { alRegistrarAclaracion: (id) => consultasCreadas.push(id) })) {
    if (e.tipo === 'delta') {
      primero ??= performance.now() - inicio;
      deltas++;
    } else fin = e;
  }
  const total = performance.now() - inicio;
  if (fin?.consultaId) consultasCreadas.push(fin.consultaId);
  const llamadas = uso;
  uso = null;
  return {
    primero, total, deltas, encontrado: fin?.encontrado, llamadas: llamadas.length,
    entrada: llamadas.reduce((n, l) => n + l.entrada, 0), salida: llamadas.reduce((n, l) => n + l.salida, 0),
  };
};

const fila = (pregunta, modo, xs) => ({
  pregunta: pregunta.length > 44 ? `${pregunta.slice(0, 43)}…` : pregunta,
  modo,
  consultas: xs.length,
  'primer delta mediana (ms)': Math.round(mediana(xs.map((x) => x.primero))),
  'primer delta máximo (ms)': Math.round(Math.max(...xs.map((x) => x.primero))),
  'fin mediana (ms)': Math.round(mediana(xs.map((x) => x.total))),
  'fin máximo (ms)': Math.round(Math.max(...xs.map((x) => x.total))),
  'deltas mediana': mediana(xs.map((x) => x.deltas)),
  'llamadas al modelo': Number(promedio(xs.map((x) => x.llamadas)).toFixed(2)),
  'tokens de entrada': Math.round(promedio(xs.map((x) => x.entrada))),
  'tokens de salida': Math.round(promedio(xs.map((x) => x.salida))),
});

try {
  const filas = [];
  const todas = Object.fromEntries(ELEGIDOS.map((m) => [m, []]));
  let fallidas = 0;
  for (const pregunta of PREGUNTAS) {
    const tiempos = Object.fromEntries(ELEGIDOS.map((m) => [m, []]));
    for (let i = 0; i < CORRIDAS; i++) {
      const orden = ELEGIDOS.map((_, j) => ELEGIDOS[(i + j) % ELEGIDOS.length]);
      for (const modo of orden) {
        try {
          const r = await medir(pregunta, modo);
          tiempos[modo].push(r);
          console.log(`[${pregunta}] ${modo.padEnd(8)} ${i + 1}: primer delta ${Math.round(r.primero)} ms, fin ${Math.round(r.total)} ms, ${r.deltas} deltas, ${r.llamadas} llamadas, tokens ${r.entrada}+${r.salida}, encontrado ${r.encontrado}`);
        } catch (err) {
          if (esSinCredito(err)) throw err;
          fallidas++;
          console.log(`[${pregunta}] ${modo.padEnd(8)} ${i + 1}: ERROR ${err.message}`);
        }
      }
    }
    for (const modo of ELEGIDOS) {
      if (tiempos[modo].length > 0) filas.push(fila(pregunta, modo, tiempos[modo]));
      todas[modo].push(...tiempos[modo]);
    }
  }
  for (const modo of ELEGIDOS) if (todas[modo].length > 0) filas.push(fila('TODAS', modo, todas[modo]));
  console.table(filas);
  if (fallidas > 0) console.log(`Consultas que terminaron en error (no cuentan en la tabla): ${fallidas}`);
} catch (err) {
  if (!esSinCredito(err)) throw err;
  console.error(`\n${MENSAJE_SIN_CREDITO}`);
  process.exitCode = SALIDA_SIN_CREDITO;
} finally {
  delete process.env.STREAM_INCREMENTAL;
  delete process.env.STREAM_ESQUEMA;
  const { count } = await prisma.consulta.deleteMany({ where: { id: { in: consultasCreadas } } });
  console.log(`Consultas de la medición borradas: ${count}`);
  await prisma.$disconnect();
}
