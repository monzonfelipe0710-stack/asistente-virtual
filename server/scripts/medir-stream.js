// Mide el tiempo hasta el primer delta del streaming y hasta el fin, con STREAM_INCREMENTAL en true y
// en false, alternando las dos en cada corrida (así una racha lenta de OpenAI les toca a las dos).
// Llama a OpenAI de verdad, en serie; las consultas que registra se borran por id al terminar.
//
//   node scripts/medir-stream.js [--corridas 10] [--pregunta "..."]...
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { responderConsultaStream } from '../src/services/chat.service.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 10);
const PREGUNTAS = argumento('--pregunta').length > 0 ? argumento('--pregunta') : [
  'cómo saco el pasaporte',
  'certificado de buena conducta',
  'cuánto cuesta la habilitación comercial de un local de 500 m² en la ciudad de Formosa',
];

const consultasCreadas = [];
const mediana = (xs) => {
  const orden = [...xs].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

const medir = async (pregunta, incremental) => {
  process.env.STREAM_INCREMENTAL = String(incremental);
  cache.limpiar();
  const inicio = performance.now();
  let primero = null;
  let deltas = 0;
  let fin = null;
  for await (const e of responderConsultaStream([{ rol: 'usuario', texto: pregunta }])) {
    if (e.tipo === 'delta') {
      primero ??= performance.now() - inicio;
      deltas++;
    } else fin = e;
  }
  if (fin?.consultaId) consultasCreadas.push(fin.consultaId);
  return { primero, total: performance.now() - inicio, deltas, encontrado: fin?.encontrado };
};

try {
  const filas = [];
  for (const pregunta of PREGUNTAS) {
    const tiempos = { true: [], false: [] };
    for (let i = 0; i < CORRIDAS; i++) {
      for (const incremental of i % 2 ? [false, true] : [true, false]) {
        const r = await medir(pregunta, incremental);
        tiempos[incremental].push(r);
        console.log(`[${pregunta}] ${incremental ? 'incremental' : 'anterior   '} ${i + 1}: primer delta ${Math.round(r.primero)} ms, fin ${Math.round(r.total)} ms, ${r.deltas} deltas, encontrado ${r.encontrado}`);
      }
    }
    for (const incremental of [true, false]) {
      const xs = tiempos[incremental];
      filas.push({
        pregunta,
        modo: incremental ? 'incremental' : 'anterior',
        'primer delta mediana (ms)': Math.round(mediana(xs.map((x) => x.primero))),
        'primer delta máximo (ms)': Math.round(Math.max(...xs.map((x) => x.primero))),
        'fin mediana (ms)': Math.round(mediana(xs.map((x) => x.total))),
        'deltas mediana': mediana(xs.map((x) => x.deltas)),
      });
    }
  }
  console.table(filas);
} finally {
  delete process.env.STREAM_INCREMENTAL;
  const { count } = await prisma.consulta.deleteMany({ where: { id: { in: consultasCreadas } } });
  console.log(`Consultas de la medición borradas: ${count}`);
  await prisma.$disconnect();
}
