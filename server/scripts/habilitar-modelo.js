// Habilita (o deshabilita) un modelo de chat para que el superusuario lo pueda elegir. Es la única
// forma de habilitarlo: pide confirmación escribiendo el id del modelo en una terminal.
//
//   node scripts/habilitar-modelo.js <modelo>                 exige una evaluación registrada que cumpla el criterio
//   node scripts/habilitar-modelo.js <modelo> --deshabilitar  no se puede con el modelo activo ni con el por defecto
//
// La evaluación la registra scripts/evaluar-modelo.js <modelo> --registrar.
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import prisma from '../src/config/prisma.js';
import { tieneClave } from '../src/config/modelos-chat.js';

const MODELO = process.argv[2];
const DESHABILITAR = process.argv.includes('--deshabilitar');
const salir = async (mensaje) => {
  console.error(mensaje);
  await prisma.$disconnect();
  process.exit(1);
};

if (!MODELO || MODELO.startsWith('--')) await salir('Uso: node scripts/habilitar-modelo.js <modelo> [--deshabilitar]');
const modelo = await prisma.modeloChat.findUnique({ where: { id: MODELO } });
if (!modelo) await salir(`El modelo ${MODELO} no está en modelo_chat.`);
const config = await prisma.configuracionChat.findUnique({ where: { id: 1 } });

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URL).hostname;
  } catch {
    return '(desconocido)';
  }
})();
console.log(`Base: ${host}`);
console.log(`Modelo: ${modelo.nombreVisible} (${modelo.id}, ${modelo.proveedor}), ${modelo.habilitado ? 'habilitado' : 'deshabilitado'}.`);

if (DESHABILITAR) {
  if (!modelo.habilitado) await salir('Ya está deshabilitado.');
  if (modelo.esPorDefecto) await salir('Es el modelo por defecto: no se deshabilita.');
  if (config?.modeloActivoId === modelo.id) await salir('Es el modelo activo: primero hay que elegir otro desde el panel.');
} else {
  if (modelo.habilitado) await salir('Ya está habilitado.');
  const e = modelo.estadoEval;
  if (!e) await salir('No tiene una evaluación registrada: corré scripts/evaluar-modelo.js con --registrar.');
  console.log(`Evaluación del ${e.fecha}: ${e.criterio?.cumple ? 'cumple' : 'NO cumple'} el criterio (base: ${e.criterio?.base?.modelo ?? '-'}).`);
  for (const ruta of ['normal', 'stream']) {
    const c = e.resumen?.evalChat?.[ruta];
    const s = e.resumen?.seguridad?.[ruta];
    console.log(`  ${ruta}: eval-chat ${c ? `${c.ok}/${c.total}` : '-'} casos 3/3, ${c?.sinSalidaValida ?? '-'} sin salida válida; seguridad: ${s?.llegaALaPersona ?? '-'} llegan a la persona`);
  }
  console.log(`  costo medido: ${e.costoPor1000 ?? '-'} USD por 1000 respuestas`);
  for (const m of e.criterio?.motivos ?? []) console.log(`  - ${m}`);
  if (!e.criterio?.cumple) await salir('La evaluación no cumple el criterio: no se habilita.');
  if (!tieneClave(modelo.proveedor)) console.warn(`Aviso: en este entorno falta la clave de ${modelo.proveedor}; el server que lo use la necesita.`);
}

if (!process.stdin.isTTY) await salir('Hace falta una terminal para confirmar: no se cambió nada.');
const rl = createInterface({ input: process.stdin, output: process.stdout });
const respuesta = (await rl.question(`Para ${DESHABILITAR ? 'deshabilitarlo' : 'habilitarlo'}, escribí el id del modelo (${modelo.id}): `)).trim();
rl.close();
if (respuesta !== modelo.id) await salir('No coincide: no se cambió nada.');

await prisma.modeloChat.update({ where: { id: modelo.id }, data: { habilitado: !DESHABILITAR } });
console.log(`${modelo.id} quedó ${DESHABILITAR ? 'deshabilitado' : 'habilitado'}. Los servidores lo ven en hasta 30 s.`);
await prisma.$disconnect();
