// Mide la latencia de punta a punta y el tamaño de la instrucción de sistema que le llega al modelo
// para una pregunta, y repite unas frases N veces mostrando el tipo y el texto de cada respuesta.
// Llama a OpenAI de verdad; las consultas que registra se borran por id al terminar.
//
//   node scripts/medir-prompt.js [--corridas 5] [--pregunta "cómo saco el pasaporte"] [--frase "..."]... [--todas]
// Cada corrida muestra las correcciones de la verificación de la salida; --todas muestra el texto de
// todas las respuestas de la pregunta, no solo la primera.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { ia } from '../src/core/ai/index.js';
import { openai } from '../src/config/openai.js';
import { responderConsulta } from '../src/services/chat.service.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 5);
const PREGUNTA = argumento('--pregunta')[0] ?? 'cómo saco el pasaporte';
const FRASES = argumento('--frase');
const MOSTRAR_TODAS = process.argv.includes('--todas');

const tamanos = [];
const original = ia.generarRespuesta.bind(ia);
ia.generarRespuesta = async (pedido) => {
  tamanos.push(pedido.instruccionSistema?.length ?? 0);
  return original(pedido);
};

// OpenAI cachea el prefijo del pedido (desde 1024 tokens): se lee del uso de cada llamada.
const usos = [];
const crear = openai.chat.completions.create.bind(openai.chat.completions);
openai.chat.completions.create = async (...argumentos) => {
  const r = await crear(...argumentos);
  if (r?.usage) usos.push({ entrada: r.usage.prompt_tokens, cacheados: r.usage.prompt_tokens_details?.cached_tokens ?? 0 });
  return r;
};

// Correcciones de la verificación de la salida en cada respuesta.
const correcciones = [];
const conVerificacion = { alCorregirSalida: (c) => correcciones.push(c) };
const describirCorrecciones = () => {
  const texto = correcciones.length === 0 ? 'sin correcciones' : correcciones.map((c) => `${c.capa}: "${c.original.slice(0, 120)}"`).join('; ');
  correcciones.length = 0;
  return texto;
};

const desde = (await prisma.consulta.aggregate({ _max: { id: true } }))._max.id ?? 0;
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

try {
  const tiempos = [];
  for (let i = 0; i < CORRIDAS; i++) {
    cache.limpiar();
    tamanos.length = 0;
    const desdeUso = usos.length;
    const t0 = performance.now();
    const r = await responderConsulta([{ rol: 'usuario', texto: PREGUNTA }], null, conVerificacion);
    tiempos.push(performance.now() - t0);
    const tokens = usos.slice(desdeUso).map((u) => `${u.entrada} (${u.cacheados} cacheados)`).join('+');
    const tramite = r.tramitesEncontrados?.[0]?.id ?? '-';
    console.log(`[${PREGUNTA}] ${i + 1}: ${Math.round(tiempos.at(-1))} ms, prompt ${tamanos.join('+')} caracteres, ${tokens} tokens de entrada, tipo ${r.tipo}, tramite ${tramite}, verificación: ${describirCorrecciones()}`);
    if (i === 0 || MOSTRAR_TODAS) console.log(`  ${String(r.respuesta ?? r.texto ?? '').replace(/\n/g, ' / ').slice(0, 600)}`);
  }
  console.log(`Latencia mediana: ${Math.round(mediana(tiempos))} ms (min ${Math.round(Math.min(...tiempos))}, max ${Math.round(Math.max(...tiempos))})`);
  const entrada = usos.reduce((s, u) => s + u.entrada, 0);
  const cacheados = usos.reduce((s, u) => s + u.cacheados, 0);
  const sinLaPrimera = usos.slice(1);
  const proporcion = (xs) => (xs.reduce((s, u) => s + u.cacheados, 0) / Math.max(1, xs.reduce((s, u) => s + u.entrada, 0))) * 100;
  console.log(`Tokens de entrada: ${entrada}, cacheados ${cacheados} (${proporcion(usos).toFixed(1)} %; sin la primera llamada, ${proporcion(sinLaPrimera).toFixed(1)} %)`);

  for (const frase of FRASES) {
    for (let i = 0; i < CORRIDAS; i++) {
      cache.limpiar();
      const desdeUso = usos.length;
      const r = await responderConsulta([{ rol: 'usuario', texto: frase }], null, conVerificacion);
      const tokens = usos.slice(desdeUso).map((u) => `${u.entrada} (${u.cacheados} cacheados)`).join('+');
      console.log(`[${frase}] ${i + 1}: ${tokens} tokens de entrada, tipo ${r.tipo}, tramite ${r.tramitesEncontrados?.[0]?.id ?? '-'}, verificación: ${describirCorrecciones()}: ${String(r.respuesta ?? r.texto ?? '').replace(/\n/g, ' / ').slice(0, 300)}`);
    }
  }
} finally {
  await prisma.consulta.deleteMany({ where: { id: { gt: desde } } });
  await prisma.$disconnect();
}
