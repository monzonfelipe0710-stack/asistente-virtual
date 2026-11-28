// Mantiene despiertos la base y el server durante una demo: cada N minutos hace un SELECT 1 a la
// base del .env, un GET a /api/health y un GET a /api/tramites/publicados (que pasa por el pool de
// Prisma del server: el SELECT 1 de este proceso no evita que esas conexiones se corten), y corta
// solo al pasar la duración máxima (o con Ctrl+C).
// Neon Free suspende la base tras 5 minutos sin actividad; mientras esto corre, la base no se
// suspende y consume horas de cómputo (ver docs/estado-actual-backend.md, "Latencia de demo").
//
//   node scripts/calentar.js [--cada 4] [--duracion 120] [--url http://localhost:3000]
//
//   --cada      minutos entre pings (default 4; tiene que ser menor que 5 para que Neon no suspenda)
//   --duracion  minutos hasta cortar solo (default 120)
//   --url       base del server (default SERVIDOR_URL o http://localhost:$PORT)
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const numero = (nombre, porDefecto) => {
  const valor = Number(argumento(nombre)[0] ?? porDefecto);
  if (!(valor > 0)) throw new Error(`${nombre}: tiene que ser un número de minutos mayor que 0.`);
  return valor;
};

const CADA_MIN = numero('--cada', 4);
const DURACION_MIN = numero('--duracion', 120);
const URL_SERVER = (argumento('--url')[0] ?? process.env.SERVIDOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '');
const TIMEOUT_MS = 30_000;

const hora = () => new Date().toLocaleTimeString('es-AR', { hour12: false });

const medir = async (fn) => {
  const inicio = performance.now();
  try {
    await fn();
    return `ok ${Math.round(performance.now() - inicio)} ms`;
  } catch (err) {
    return `FALLA ${Math.round(performance.now() - inicio)} ms (${err.cause?.code ?? err.name}: ${err.message})`;
  }
};

const pingBase = () => medir(() => prisma.$queryRaw`SELECT 1`);
const pingServer = (ruta) =>
  medir(async () => {
    const res = await fetch(`${URL_SERVER}${ruta}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.arrayBuffer();
  });

let numeroPing = 0;
const ping = async () => {
  numeroPing++;
  const [base, server, pool] = await Promise.all([pingBase(), pingServer('/api/health'), pingServer('/api/tramites/publicados')]);
  console.log(`[${hora()}] #${numeroPing}  base: ${base}  |  health: ${server}  |  base vía server: ${pool}`);
};

let intervalo;
let corte;
const terminar = async (motivo) => {
  clearInterval(intervalo);
  clearTimeout(corte);
  console.log(`[${hora()}] Fin (${motivo}) tras ${numeroPing} pings.`);
  await prisma.$disconnect();
  process.exit(0);
};

console.log(
  `[${hora()}] Calentando cada ${CADA_MIN} min durante ${DURACION_MIN} min (hasta las ${new Date(Date.now() + DURACION_MIN * 60_000).toLocaleTimeString('es-AR', { hour12: false })}).`,
);
console.log(`  base: ${new URL(process.env.DATABASE_URL).hostname}  |  server: ${URL_SERVER}  |  Ctrl+C para cortar antes.`);
if (CADA_MIN >= 5) console.warn('  Aviso: con --cada 5 o más, Neon Free puede suspender la base entre pings.');

await ping();
intervalo = setInterval(ping, CADA_MIN * 60_000);
corte = setTimeout(() => terminar('duración máxima'), DURACION_MIN * 60_000);
process.on('SIGINT', () => terminar('Ctrl+C'));
