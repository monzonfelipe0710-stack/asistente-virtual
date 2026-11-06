// Mide la latencia de punta a punta y el tamaño de la instrucción de sistema que le llega al modelo
// para una pregunta, y repite unas frases N veces mostrando el tipo y el texto de cada respuesta.
// Llama a OpenAI de verdad; las consultas que registra se borran por id al terminar.
//
//   node scripts/medir-prompt.js [--corridas 5] [--pregunta "cómo saco el pasaporte"] [--frase "..."]...
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { ia } from '../src/core/ai/index.js';
import { responderConsulta } from '../src/services/chat.service.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 5);
const PREGUNTA = argumento('--pregunta')[0] ?? 'cómo saco el pasaporte';
const FRASES = argumento('--frase');

const tamanos = [];
const original = ia.generarRespuesta.bind(ia);
ia.generarRespuesta = async (pedido) => {
  tamanos.push(pedido.instruccionSistema?.length ?? 0);
  return original(pedido);
};

const desde = (await prisma.consulta.aggregate({ _max: { id: true } }))._max.id ?? 0;
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

try {
  const tiempos = [];
  for (let i = 0; i < CORRIDAS; i++) {
    cache.limpiar();
    tamanos.length = 0;
    const t0 = performance.now();
    const r = await responderConsulta([{ rol: 'usuario', texto: PREGUNTA }]);
    tiempos.push(performance.now() - t0);
    console.log(`[${PREGUNTA}] ${i + 1}: ${Math.round(tiempos.at(-1))} ms, prompt ${tamanos.join('+')} caracteres, tipo ${r.tipo}, tramite ${r.tramiteId ?? '-'}`);
    if (i === 0) console.log(`  ${String(r.respuesta ?? r.texto ?? '').replace(/\n/g, ' / ').slice(0, 600)}`);
  }
  console.log(`Latencia mediana: ${Math.round(mediana(tiempos))} ms (min ${Math.round(Math.min(...tiempos))}, max ${Math.round(Math.max(...tiempos))})`);

  for (const frase of FRASES) {
    for (let i = 0; i < CORRIDAS; i++) {
      cache.limpiar();
      const r = await responderConsulta([{ rol: 'usuario', texto: frase }]);
      console.log(`[${frase}] ${i + 1}: tipo ${r.tipo}, tramite ${r.tramiteId ?? '-'}: ${String(r.respuesta ?? r.texto ?? '').replace(/\n/g, ' / ').slice(0, 300)}`);
    }
  }
} finally {
  await prisma.consulta.deleteMany({ where: { id: { gt: desde } } });
  await prisma.$disconnect();
}
