// Condiciones para importar la fuente municipal en una base, y el control posterior. Solo lee.
//
//   node scripts/verificar-import-municipal.js --antes <estado.json> [--informe <informe.md>] [archivo]
//       simula la importación (--dry-run), evalúa las condiciones, guarda los conteos y la huella de
//       los trámites que no son de la fuente municipal en <estado.json>; sale con 1 si alguna falla
//   node scripts/verificar-import-municipal.js --despues <estado.json>
//       compara con lo guardado: misma huella del resto del catálogo, versión del catálogo mayor y
//       ningún trámite publicado sin embedding; sale con 1 si algo no se cumple
import 'dotenv/config';
import crypto from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import prisma from '../src/config/prisma.js';
import { BASE_MUNICIPAL, formatearInforme, importarCatalogo, opcionesMunicipales } from '../src/services/importacion.service.js';
import { leerSectoresParaResolver, nombreConRaiz, resolverJurisdicciones } from '../src/services/jurisdiccion.service.js';
import { textoDeTramite } from '../src/services/embedding.service.js';

const args = process.argv.slice(2);
const valor = (nombre) => (args.includes(nombre) ? args[args.indexOf(nombre) + 1] : undefined);
const ANTES = valor('--antes');
const DESPUES = valor('--despues');
const INFORME = valor('--informe');
const usados = new Set([ANTES, DESPUES, INFORME].filter(Boolean));
const ARCHIVO = args.find((a) => !a.startsWith('--') && !usados.has(a)) ?? new URL('../../ingestion/data/tramites_municipal.json', import.meta.url);

const CORREO_PERSONAL = /@(?:gmail|hotmail|yahoo|outlook|live|icloud|protonmail)\./i;
const CORREO = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const CELULAR = /\b(?:cel(?:ular)?|whats?app|wsp)\b\.?\s*:?\s*\+?[\d(]|(?<![\d-])(?:\+?54\s?9?\s?)?\(?0?370\)?[\s.-]?(?:4[\s.-]?\d{6}|\d{6})(?![\d-])|\b15[\s-]?\d{6}\b/i;

const conteos = async () => {
  const [fila] = await prisma.$queryRaw`
    SELECT
      (SELECT count(*)::int FROM tramites) AS tramites,
      (SELECT count(*)::int FROM tramites WHERE publicado) AS publicados,
      (SELECT count(*)::int FROM tramites WHERE fuente_url LIKE ${`${BASE_MUNICIPAL}%`}) AS municipales,
      (SELECT count(*)::int FROM tramites WHERE publicado AND embedding IS NULL) AS "publicadosSinEmbedding",
      (SELECT count(*)::int FROM sectores) AS sectores,
      (SELECT count(*)::int FROM mesas_entrada) AS mesas,
      (SELECT coalesce(max(version), 0)::text FROM catalogo_version) AS "catalogoVersion"`;
  return fila;
};

// Huella de todo lo que no es de la fuente municipal: los campos guardados y el texto que iría al
// embedding con el organismo resuelto como hoy.
const huellaDelResto = async () => {
  const jurisdicciones = resolverJurisdicciones(await leerSectoresParaResolver());
  const tramites = await prisma.tramite.findMany({
    where: { OR: [{ fuenteUrl: null }, { NOT: { fuenteUrl: { startsWith: BASE_MUNICIPAL } } }] },
    include: { requisitos: { orderBy: { id: 'asc' } }, mesas: { orderBy: { mesaId: 'asc' } }, documentos: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  const hash = crypto.createHash('sha256');
  let conRaiz = 0;
  for (const t of tramites) {
    const organismo = jurisdicciones.get(t.sectorId);
    if (organismo && nombreConRaiz(organismo) !== organismo.nombre) conRaiz++;
    hash.update(JSON.stringify([
      t.id, t.nombre, t.descripcion, t.costo?.toString() ?? null, t.costoDetalle, t.informacionAdicional, t.publicado, t.fuenteUrl,
      t.sectorId, t.updatedAt.toISOString(), t.requisitos.map((r) => r.descripcion), t.mesas.map((m) => m.mesaId),
      t.documentos.map((d) => [d.nombre, d.urlExterna, d.archivo]), textoDeTramite(t, organismo),
    ]));
  }
  return { cantidad: tramites.length, hash: hash.digest('hex'), conTextoCambiadoPorLaRaiz: conRaiz };
};

const textos = (t) => [
  t.nombre, t.descripcion, t.detalle?.requisitos, t.detalle?.observaciones,
  ...(t.detalle?.secciones ?? []).map((s) => s.texto),
  ...(t.detalle?.costos ?? []).flatMap((c) => [c.concepto, c.importe]),
  ...(t.detalle?.oficinas ?? []).flatMap((o) => [o.nombre, o.domicilio, o.horario, o.telefono, o.email]),
].filter((x) => typeof x === 'string');

const datosPersonales = (datos) => datos.tramites.flatMap((t) => textos(t).flatMap((x) => [
  ...[...x.matchAll(CORREO)].map((m) => m[0]).filter((c) => CORREO_PERSONAL.test(c) || !/\.go[bv]\.ar$/i.test(c)).map((c) => `${t.nombre}: correo ${c.replace(/^[^@]+/, '***')}`),
  ...(CELULAR.test(x) ? [`${t.nombre}: teléfono celular en «${x.match(CELULAR)[0].replace(/\d/g, '*')}»`] : []),
]));

const informeMd = (r, datos, estado, condiciones) => [
  '# Dry-run de la importación municipal',
  '',
  `Base: ${/neon.tech$/.test(new URL(process.env.DATABASE_URL).hostname) ? 'la del .env (Neon)' : new URL(process.env.DATABASE_URL).hostname}. JSON consultado el ${datos.consultadoEl}.`,
  '',
  '## Condiciones',
  '',
  ...condiciones.map((c) => `- ${c.ok ? 'OK' : 'FALLA'}: ${c.nombre} (${c.detalle})`),
  '',
  '## Conteos antes',
  '',
  ...Object.entries(estado.conteos).map(([k, v]) => `- ${k}: ${v}`),
  `- huella del resto del catálogo: ${estado.huella.cantidad} trámites, ${estado.huella.hash.slice(0, 16)}…`,
  '',
  '## Informe del importador (simulación)',
  '',
  '```',
  formatearInforme(r),
  '```',
  '',
  '## Sectores a crear',
  '',
  ...r.sectorIds.filter((s) => typeof s.id !== 'number').map((s) => `- ${s.nombre}${s.padre ? ` (padre: ${s.padre})` : ''}`),
  '',
].join('\n');

try {
  if (ANTES) {
    const datos = JSON.parse(readFileSync(ARCHIVO, 'utf-8'));
    const { opciones } = opcionesMunicipales(datos);
    const estado = { conteos: await conteos(), huella: await huellaDelResto() };
    const r = await importarCatalogo(datos, { ...opciones, simular: true, log: { log: () => {}, warn: () => {} } });
    const nuevos = r.sectorIds.filter((s) => typeof s.id !== 'number');
    const esperados = datos.sectores.map((s) => s.nombre);
    const personales = datosPersonales(datos);
    const provincialesEnConflicto = r.conflictos.filter((c) => !c.fuenteUrl?.startsWith(BASE_MUNICIPAL) || c.existenteId);
    const marcados = r.paraRevisar;
    const condiciones = [
      { nombre: '0 fichas no reconocidas', ok: (datos.noReconocidas ?? []).length === 0 && (datos.errores ?? []).length === 0, detalle: `${(datos.noReconocidas ?? []).length} no reconocidas, ${(datos.errores ?? []).length} con error` },
      { nombre: 'marcados por sanitización: 0, o hasta 3 y sin publicar', ok: marcados.length === 0 || (marcados.length <= 3 && marcados.every((p) => /sin publicar/.test(p.accion))), detalle: `${marcados.length} marcados` },
      { nombre: 'entre 60 y 85 trámites a crear', ok: r.creados.length >= 60 && r.creados.length <= 85, detalle: `${r.creados.length} a crear, ${r.actualizados.length} a actualizar, ${r.sinCambios} sin cambios` },
      { nombre: 'sectores a crear: la Municipalidad y sus 10 secretarías', ok: nuevos.length === 11 && esperados.length === 11 && nuevos.every((s) => esperados.includes(s.nombre)), detalle: `${nuevos.length} a crear de ${esperados.length} del JSON` },
      { nombre: '0 conflictos con trámites provinciales', ok: r.conflictos.length === 0 && r.fallidos.length === 0, detalle: `${r.conflictos.length} conflictos (${provincialesEnConflicto.length} con trámites existentes), ${r.fallidos.length} fallidos` },
      { nombre: 'sin correos personales ni celulares en los textos', ok: personales.length === 0, detalle: personales.length === 0 ? 'ninguno' : personales.join('; ') },
      { nombre: 'el texto del embedding del resto del catálogo no cambia por el organismo raíz', ok: estado.huella.conTextoCambiadoPorLaRaiz === 0, detalle: `${estado.huella.conTextoCambiadoPorLaRaiz} trámites con organismo raíz` },
    ];
    writeFileSync(ANTES, JSON.stringify({ ...estado, fecha: new Date().toISOString() }, null, 1));
    const md = informeMd(r, datos, estado, condiciones);
    if (INFORME) writeFileSync(INFORME, md);
    console.log(md);
    if (condiciones.some((c) => !c.ok)) process.exitCode = 1;
  } else if (DESPUES) {
    const antes = JSON.parse(readFileSync(DESPUES, 'utf-8'));
    const ahora = { conteos: await conteos(), huella: await huellaDelResto() };
    const controles = [
      { nombre: 'el resto del catálogo no cambió (misma huella)', ok: ahora.huella.hash === antes.huella.hash && ahora.huella.cantidad === antes.huella.cantidad },
      { nombre: 'la versión del catálogo aumentó', ok: BigInt(ahora.conteos.catalogoVersion) > BigInt(antes.conteos.catalogoVersion) },
      { nombre: 'ningún trámite publicado sin embedding', ok: ahora.conteos.publicadosSinEmbedding === 0 },
    ];
    console.log(JSON.stringify({ antes: antes.conteos, ahora: ahora.conteos, huellaAntes: antes.huella, huellaAhora: ahora.huella }, null, 1));
    for (const c of controles) console.log(`${c.ok ? 'OK' : 'FALLA'}: ${c.nombre}`);
    if (controles.some((c) => !c.ok)) process.exitCode = 1;
  } else {
    throw new Error('Falta --antes <estado.json> o --despues <estado.json>.');
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
