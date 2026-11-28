// Mide el chat por etapas (ruta de stream, en serie, con la caché de respuestas y de embeddings
// vacía en cada consulta; el catálogo y las jurisdicciones quedan cacheados, como en el server) leyendo la línea "Chat latencia:" de CHAT_LOG_LATENCIA, y los tokens
// cacheados del proveedor. Llama a OpenAI de verdad; las consultas que registra se borran por id.
//
//   node scripts/medir-etapas.js [--modelo gpt-6-luna] [--corridas 1] [--pausa ms] [--salida archivo.json]
//
// --pausa: espera entre consultas, como el tiempo que tarda una persona en escribir la siguiente.
import 'dotenv/config';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []))[0];
const MODELO = argumento('--modelo') ?? 'gpt-6-luna';
const CORRIDAS = Number(argumento('--corridas') ?? 1);
const SALIDA = argumento('--salida');
const PAUSA = Number(argumento('--pausa') ?? 0);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const CARPETA = mkdtempSync(join(tmpdir(), 'medir-etapas-'));
const ARCHIVO_USO = join(CARPETA, 'uso.jsonl');
process.env.CHAT_LOG_LATENCIA = 'true';
process.env.MODELO_CHAT_FORZADO = MODELO;
process.env.IA_REGISTRO_USO = ARCHIVO_USO;

const { default: prisma } = await import('../src/config/prisma.js');
const cache = await import('../src/services/cache.service.js');
const { responderConsultaStream } = await import('../src/services/chat.service.js');

const GRUPOS = {
  tramite: [
    'cómo saco el pasaporte', 'cuánto cuesta el pasaporte', 'certificado de buena conducta', 'requisitos de la pesca deportiva',
    'partida de nacimiento', 'licencia por maternidad', 'cómo renuevo el pasaporte', 'dónde saco el pasaporte en Clorinda',
    'renovar licencia de conducir', 'qué necesito para el certificado de antecedentes penales', 'habilitación comercial de un local en Formosa', 'inscripción de un vehículo',
  ],
  aclaracion: ['perdí mi DNI', 'DNI', 'turno médico', 'licencia', 'necesito una licencia por enfermedad', 'matrimonio'],
  fueraDeTema: ['capital de francia', 'receta de milanesa', 'resultado del partido de fútbol', 'hola, ¿qué podés hacer?', 'gracias', 'cuánto sale un pasaje a Buenos Aires'],
  tipeo: ['necesito renovar el psporte', 'pasaporet', 'como saco el pasaprote', 'partida de nacimento', 'certificado de buena condcuta', 'licensia de conducir'],
};
const CALENTAMIENTO = ['cómo saco el pasaporte', 'certificado de buena conducta'];

const lineas = [];
const infoOriginal = console.info;
console.info = (...a) => {
  const t = String(a[0]);
  if (t.startsWith('Chat latencia: ')) lineas.push(JSON.parse(t.slice('Chat latencia: '.length)));
  else infoOriginal(...a);
};

const creadas = [];
const consultar = async (texto) => {
  cache.limpiarRespuestas();
  cache.limpiarEmbeddings();
  const antes = lineas.length;
  let fin = null;
  for await (const e of responderConsultaStream([{ rol: 'usuario', texto }], null, { alRegistrarAclaracion: (id) => creadas.push(id) })) if (e.tipo === 'fin') fin = e;
  if (fin?.consultaId) creadas.push(fin.consultaId);
  return { linea: lineas[antes] ?? null, tipo: fin?.tipoRespuesta };
};
const usos = () => (existsSync(ARCHIVO_USO) ? readFileSync(ARCHIVO_USO, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

const percentil = (xs, p) => {
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.ceil((p / 100) * o.length) - 1)];
};
const resumir = (xs) => (xs.length ? { n: xs.length, mediana: Math.round(percentil(xs, 50)), p95: Math.round(percentil(xs, 95)), max: Math.round(Math.max(...xs)) } : null);

try {
  for (const q of CALENTAMIENTO) await consultar(q);
  const desdeUso = usos().length;
  lineas.length = 0;
  const medidas = [];
  for (let i = 0; i < CORRIDAS; i++) {
    for (const [grupo, preguntas] of Object.entries(GRUPOS)) {
      for (const q of preguntas) {
        if (PAUSA > 0) await esperar(PAUSA);
        const r = await consultar(q);
        if (!r.linea) continue;
        medidas.push({ grupo, tipo: r.tipo, ...r.linea });
        console.log(`[${grupo}] ${q}: total ${r.linea.total} ms, primer token ${r.linea.primerToken ?? '-'}, primer texto ${r.linea.primerTexto ?? '-'}, ${r.tipo}`);
      }
    }
  }
  const etapas = {};
  for (const m of medidas) for (const [e, ms] of Object.entries(m.etapas)) (etapas[e] ??= []).push(ms);
  const tabla = {
    total: resumir(medidas.map((m) => m.total)),
    'primer token del modelo (desde el inicio)': resumir(medidas.filter((m) => m.primerToken != null).map((m) => m.primerToken)),
    'primer texto a la persona': resumir(medidas.filter((m) => m.primerTexto != null).map((m) => m.primerTexto)),
    'verificación (dentro de modelo)': resumir(medidas.filter((m) => m.verificacion != null).map((m) => m.verificacion)),
    ...Object.fromEntries(Object.entries(etapas).map(([e, xs]) => [`etapa ${e}`, resumir(xs)])),
  };
  console.table(tabla);
  const u = usos().slice(desdeUso);
  const porOperacion = {};
  for (const x of u) {
    const o = (porOperacion[x.operacion] ??= { llamadas: 0, entrada: 0, cacheada: 0, salida: 0, razonamiento: 0 });
    o.llamadas++;
    o.entrada += x.entrada;
    o.cacheada += x.cacheada ?? 0;
    o.salida += x.salida;
    o.razonamiento += x.razonamiento ?? 0;
  }
  for (const o of Object.values(porOperacion)) o.pctCacheada = o.entrada ? Math.round((o.cacheada / o.entrada) * 1000) / 10 : 0;
  console.table(porOperacion);
  console.log(`Consultas medidas: ${medidas.length} con modelo ${MODELO}${PAUSA > 0 ? `, ${PAUSA} ms entre consultas` : ''}.`);
  if (SALIDA) writeFileSync(SALIDA, JSON.stringify({ modelo: MODELO, pausa: PAUSA, fecha: new Date().toISOString(), tabla, porOperacion, medidas }, null, 1));
} finally {
  if (creadas.length > 0) await prisma.consulta.deleteMany({ where: { id: { in: creadas } } });
  rmSync(CARPETA, { recursive: true, force: true });
  await prisma.$disconnect();
}
