// Precalienta la caché de respuestas del server antes de una demo: manda cada pregunta del guion a
// /api/chat, en serie, para que en la demo la misma pregunta salga de la caché (unos 300 ms en vez
// de 2 a 3 s). La caché es en memoria de ese proceso del server, vale para las dos rutas (normal y
// stream), dura CACHE_TTL_MS (1 hora) y se vacía si cambia el catálogo; las aclaraciones y las
// conversaciones (saludos, preguntas fuera de tema) no se cachean.
//
//   node scripts/precalentar-guion.js <archivo> [--url http://localhost:3000] [--pausa 7000] [--borrar]
//
//   <archivo>  una pregunta por línea, tal como se va a escribir en la demo; las vacías y las que
//              empiezan con # se ignoran. No se commitea (server/guion*.txt está en .gitignore).
//   --pausa    ms entre preguntas (default 7000): el chat limita a CHAT_LIMITE_POR_MINUTO por IP.
//   --borrar   al final borra de la base del .env las consultas que registró el precalentado (solo
//              si el texto coincide con la pregunta enviada): cuentan en "más consultados". También las
//              aclaraciones anónimas de esas preguntas registradas desde que arrancó (no devuelven id).
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []))[0];
const ARCHIVO = process.argv[2];
if (!ARCHIVO || ARCHIVO.startsWith('--')) {
  console.error('Uso: node scripts/precalentar-guion.js <archivo> [--url http://localhost:3000] [--pausa 7000] [--borrar]');
  process.exit(1);
}
const URL_SERVER = (argumento('--url') ?? process.env.SERVIDOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '');
const PAUSA_MS = Number(argumento('--pausa') ?? 7000);
const BORRAR = process.argv.includes('--borrar');
const TIMEOUT_MS = 30_000;
const POR_HORA = Number(process.env.CHAT_LIMITE_POR_HORA ?? 100);

const preguntas = readFileSync(ARCHIVO, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
if (preguntas.length === 0) {
  console.error(`${ARCHIVO} no tiene preguntas.`);
  process.exit(1);
}
console.log(`${preguntas.length} preguntas contra ${URL_SERVER}, ${PAUSA_MS} ms entre cada una.`);
if (preguntas.length > POR_HORA / 2) console.warn(`  Aviso: usan ${preguntas.length} de los ${POR_HORA} pedidos por hora de esta IP; la demo desde la misma IP comparte ese cupo.`);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const registradas = [];
const aclaradas = new Set();
const comienzo = new Date();
const resumen = { cacheadas: 0, sinCache: 0, fallas: 0 };

for (const [i, pregunta] of preguntas.entries()) {
  if (i > 0) await esperar(PAUSA_MS);
  const inicio = performance.now();
  let linea;
  try {
    const res = await fetch(`${URL_SERVER}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pregunta }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Math.round(performance.now() - inicio);
    if (res.status === 429) {
      console.error(`[${i + 1}/${preguntas.length}] 429: se llegó al límite del chat para esta IP. Se corta acá; subí --pausa o esperá.`);
      resumen.fallas++;
      break;
    }
    const cuerpo = await res.json().catch(() => null);
    if (!res.ok || !cuerpo) {
      linea = `FALLA HTTP ${res.status} (${ms} ms)`;
      resumen.fallas++;
    } else if (cuerpo.tipo === 'aclaracion' || cuerpo.conversacional) {
      linea = `${cuerpo.tipo === 'aclaracion' ? 'aclaración' : 'conversación'}, no se cachea (${ms} ms)`;
      resumen.sinCache++;
      if (cuerpo.tipo === 'aclaracion') aclaradas.add(pregunta);
    } else {
      linea = `${cuerpo.encontrado ? 'respuesta' : 'sin trámite'}, cacheada (${ms} ms)`;
      resumen.cacheadas++;
      if (cuerpo.consultaId) registradas.push({ id: cuerpo.consultaId, pregunta });
    }
  } catch (err) {
    linea = `FALLA ${Math.round(performance.now() - inicio)} ms (${err.cause?.code ?? err.name})`;
    resumen.fallas++;
  }
  console.log(`[${i + 1}/${preguntas.length}] ${pregunta} → ${linea}`);
}

console.log(`Cacheadas: ${resumen.cacheadas}, sin caché (aclaraciones y conversaciones): ${resumen.sinCache}, fallas: ${resumen.fallas}.`);
console.log('La caché vence en CACHE_TTL_MS (1 hora por defecto) y se vacía si se edita el catálogo o se reinicia el server.');

if (BORRAR && (registradas.length > 0 || aclaradas.size > 0)) {
  const { default: prisma } = await import('../src/config/prisma.js');
  try {
    const filas = await prisma.consulta.findMany({ where: { id: { in: registradas.map((r) => r.id) } }, select: { id: true, textoConsulta: true } });
    const texto = new Map(filas.map((f) => [f.id, f.textoConsulta]));
    const ids = registradas.filter((r) => texto.get(r.id) === r.pregunta).map((r) => r.id);
    const { count } = await prisma.consulta.deleteMany({ where: { id: { in: ids } } });
    console.log(`Consultas del precalentado borradas: ${count} de ${registradas.length}${count < registradas.length ? ' (las demás no coinciden con la base del .env: no se tocaron)' : ''}.`);
    if (aclaradas.size > 0) {
      const { count: aclaraciones } = await prisma.consulta.deleteMany({
        where: { tipo: 'aclaracion', usuarioId: null, textoConsulta: { in: [...aclaradas] }, fecha: { gte: comienzo } },
      });
      console.log(`Aclaraciones del precalentado borradas: ${aclaraciones}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
