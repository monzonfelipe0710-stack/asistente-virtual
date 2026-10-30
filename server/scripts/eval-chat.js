// Evaluación del chat contra un set fijo de preguntas. Cada caso corre CORRIDAS
// veces para detectar respuestas inestables. Llama a OpenAI de verdad (unos centavos
// y algunos minutos por corrida): es para correr a demanda, no en cada commit.
//
//   node scripts/eval-chat.js
//
// responderConsulta registra cada pregunta en `consultas`; al terminar se borran
// las filas que creó esta corrida para no ensuciar las métricas.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { responderConsulta } from '../src/services/chat.service.js';

const CORRIDAS = 3;

const casos = [
  { pregunta: 'licencia por maternidad', esperado: { tipo: 'respuesta', encontrado: true, incluye: [19] } },
  { pregunta: 'licencia por paternidad', esperado: { tipo: 'respuesta', encontrado: false } }, // confirmar: ¿existe en la provincia?
  { pregunta: 'licencia de conducir', esperado: { tipo: 'respuesta', encontrado: false } }, // es municipal, no cargado
  { pregunta: 'necesito un certificado', esperado: { tipo: 'aclaracion' } },
  { pregunta: 'certificado de buena conducta', esperado: { tipo: 'respuesta', encontrado: true, incluye: [269] } },
  { pregunta: 'licencia', esperado: { tipo: 'aclaracion' } },
  { pregunta: 'licencia por enfermedad', esperado: { tipo: 'aclaracion', incluye: [20] } },
  { pregunta: 'pesca deportiva', esperado: { tipo: 'respuesta', encontrado: true, incluye: [166] } },
  { pregunta: 'hola', esperado: { tipo: 'respuesta', encontrado: false } },
  { pregunta: 'capital de francia', esperado: { tipo: 'respuesta', encontrado: false } },
  { pregunta: 'receta de chipá', esperado: { tipo: 'respuesta', encontrado: false } },

  // Caso B (no existe → debe dar no-encontrado, hoy falla):
  { pregunta: 'qué necesito para la licencia por paternidad', esperado: { tipo: 'respuesta', encontrado: false } },

  // Variantes naturales de casos que ya teníamos:
  { pregunta: 'cómo saco la licencia de conducir', esperado: { tipo: 'respuesta', encontrado: false } },
  { pregunta: 'qué necesito para la licencia por maternidad', esperado: { tipo: 'respuesta', encontrado: true, incluye: [19] } }, // ojo: hoy puede dar aclaración entre 19 y 28 (duplicados → caso del #2)
  { pregunta: 'dónde tramito el certificado de buena conducta', esperado: { tipo: 'respuesta', encontrado: true, incluye: [269] } },
  { pregunta: 'necesito sacar un certificado', esperado: { tipo: 'aclaracion' } },
  { pregunta: 'cómo saco la licencia de pesca', esperado: { tipo: 'aclaracion' } }, // pesca deportiva vs turística
  { pregunta: 'cómo hago para una licencia médica', esperado: { tipo: 'aclaracion', incluye: [20] } }, // largo vs corto tratamiento (duplicados 21-26)
  { pregunta: 'cómo renuevo el pasaporte', esperado: { tipo: 'respuesta', encontrado: true, incluye: [143] } }, // lo tramita el Registro Civil provincial
  { pregunta: 'cómo saco el DNI', esperado: { tipo: 'aclaracion', incluye: [90] } }, // nuevo ejemplar, DNI en celular, recién nacido
  // Nata agrega 10-15 más con trámites reales del catálogo que conozca
];

const idsDe = (r) => [...r.tramitesEncontrados, ...r.opciones].map((t) => t.id);

const describirEsperado = ({ tipo, encontrado, incluye, excluye }) =>
  [
    tipo,
    encontrado !== undefined && `encontrado=${encontrado}`,
    incluye && `+[${incluye}]`,
    excluye && `-[${excluye}]`,
  ].filter(Boolean).join(' ');

const describirObtenido = (r) => `${r.tipo} encontrado=${r.encontrado} [${idsDe(r)}]`;

const normalizarNombre = (nombre) =>
  nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

// Regla global: ofrecer dos opciones con el mismo nombre es un error aunque el tipo sea correcto.
const repiteNombres = (opciones) =>
  new Set(opciones.map((o) => normalizarNombre(o.nombre))).size < opciones.length;

const fallas = (esperado, r) => {
  const ids = idsDe(r);
  return [
    r.tipo !== esperado.tipo && 'tipo',
    esperado.encontrado !== undefined && r.encontrado !== esperado.encontrado && 'encontrado',
    esperado.incluye?.some((id) => !ids.includes(id)) && 'incluye',
    esperado.excluye?.some((id) => ids.includes(id)) && 'excluye',
    repiteNombres(r.opciones) && 'opciones repetidas',
  ].filter(Boolean);
};

const [{ max: ultimaConsultaPrevia }] = await prisma.$queryRaw`
  SELECT coalesce(max(id), 0)::int AS max FROM consultas
`;

const correr = async (pregunta, esperado) => {
  cache.limpiar();
  try {
    const r = await responderConsulta([{ rol: 'usuario', texto: pregunta }]);
    return { obtenido: describirObtenido(r), motivo: fallas(esperado, r) };
  } catch (err) {
    return { obtenido: `ERROR: ${err.message}`, motivo: ['error'] };
  }
};

// Agrupa las corridas iguales: "aclaracion encontrado=false [18,28] ×2 ✗(tipo)".
const resumirCorridas = (corridas) => {
  const grupos = new Map();
  for (const { obtenido, motivo } of corridas) {
    const clave = motivo.length === 0 ? `${obtenido} ✓` : `${obtenido} ✗(${motivo.join(', ')})`;
    grupos.set(clave, (grupos.get(clave) ?? 0) + 1);
  }
  return [...grupos].map(([clave, n]) => `${clave} ×${n}`).join(' | ');
};

const estadoDe = (aciertos) => {
  if (aciertos === CORRIDAS) return 'OK';
  if (aciertos === 0) return 'FALLA';
  return 'INESTABLE';
};

const filas = [];

for (const { pregunta, esperado } of casos) {
  const corridas = [];
  for (let i = 0; i < CORRIDAS; i++) corridas.push(await correr(pregunta, esperado));

  const aciertos = corridas.filter((c) => c.motivo.length === 0).length;
  filas.push({
    pregunta,
    esperado: describirEsperado(esperado),
    obtenido: resumirCorridas(corridas),
    aciertos: `${aciertos}/${CORRIDAS}`,
    estado: estadoDe(aciertos),
  });
}

console.table(filas);

const conEstado = (estado) => filas.filter((f) => f.estado === estado);
const inestables = conEstado('INESTABLE');

if (inestables.length > 0) {
  console.log('\nInestables (varían entre corridas: es un hallazgo, no un aprobado):');
  for (const f of inestables) console.log(`  - "${f.pregunta}" (${f.aciertos}): ${f.obtenido}`);
}

console.log(
  `\nOK ${CORRIDAS}/${CORRIDAS}: ${conEstado('OK').length} | ` +
  `inestables: ${inestables.length} | ` +
  `fallan siempre: ${conEstado('FALLA').length} | ` +
  `total: ${casos.length} casos × ${CORRIDAS} corridas`
);

// registrarConsulta no se espera dentro de responderConsulta: margen para que la última termine.
await new Promise((r) => setTimeout(r, 1500));
const borradas = await prisma.$executeRaw`
  DELETE FROM consultas
  WHERE id > ${ultimaConsultaPrevia}
    AND usuario_id IS NULL
    AND texto_consulta = ANY(${casos.map((c) => c.pregunta)})
`;
console.log(`Consultas de la evaluación borradas: ${borradas}`);

if (conEstado('OK').length < casos.length) process.exitCode = 1;
await prisma.$disconnect();
