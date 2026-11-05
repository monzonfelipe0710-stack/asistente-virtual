// Evaluación del chat contra un set fijo de preguntas. Cada caso corre CORRIDAS
// veces para detectar respuestas inestables. Llama a OpenAI de verdad (unos centavos
// y algunos minutos por corrida): es para correr a demanda, no en cada commit.
//
//   node scripts/eval-chat.js             tabla de resultados
//   node scripts/eval-chat.js --detalle   además, el texto de cada corrida
//   node scripts/eval-chat.js --corridas 5 --solo "cómo renuevo el pasaporte" --solo "..."
//                                         otra cantidad de corridas, o solo esos casos
//
// responderConsulta registra las consultas en `consultas`; al terminar se borran
// por id las que creó esta corrida para no ensuciar las métricas.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { responderConsulta, MENSAJE_SIN_RESPUESTA } from '../src/services/chat.service.js';
import { obtenerResumenCatalogo } from '../src/services/catalogo.service.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));

const CORRIDAS = Number(argumento('--corridas')[0] ?? 3);
const DETALLE = process.argv.includes('--detalle');
const SOLO = argumento('--solo');

const CONVERSACION = { tipo: 'respuesta', encontrado: false, conversacional: true, textoNoVacio: true, distintoDelFijo: true };
// El mensaje fijo de seguridad es para pedidos sobre las instrucciones, no para un tema ajeno.
const MENSAJE_FIJO_INICIO = 'Solo puedo ayudarte con información sobre trámites de la provincia';
// Preguntas del dominio: sin conocimiento general y, si el trámite no trae el dato, diciéndolo.
const DOMINIO = { sinConocimientoGeneral: true };
const DOMINIO_SIN_DATO = { sinConocimientoGeneral: true, datoNoCargado: true };
const CATALOGO = { tipo: 'respuesta', conversacional: true, sinTramites: true, mencionaSector: true };

const casos = [
  { pregunta: 'licencia por maternidad', esperado: { tipo: 'respuesta', encontrado: true, incluye: [19] } },
  { pregunta: 'licencia por paternidad', esperado: { tipo: 'respuesta', encontrado: false } }, // confirmar: ¿existe en la provincia?
  { pregunta: 'licencia de conducir', esperado: { tipo: 'respuesta', encontrado: false, conversacional: false } }, // es municipal, no cargado
  { pregunta: 'necesito un certificado', esperado: { tipo: 'aclaracion' } },
  { pregunta: 'certificado de buena conducta', esperado: { tipo: 'respuesta', encontrado: true, incluye: [269] } },
  { pregunta: 'licencia', esperado: { tipo: 'aclaracion' } },
  { pregunta: 'licencia por enfermedad', esperado: { tipo: 'aclaracion', incluye: [20] } },
  { pregunta: 'pesca deportiva', esperado: { tipo: 'respuesta', encontrado: true, incluye: [166] } },
  { pregunta: 'hola', esperado: CONVERSACION },
  // "Aumento de Capital Social" es un candidato que comparte una palabra: no sirve de ejemplo.
  { pregunta: 'capital de francia', esperado: { tipo: 'respuesta', encontrado: false, sinSaludo: true, ejemplosDelCatalogo: 2, noContiene: ['aumento de capital', MENSAJE_FIJO_INICIO] } },
  { pregunta: 'receta de chipá', esperado: { tipo: 'respuesta', encontrado: false, ejemplosDelCatalogo: 2, noContiene: [MENSAJE_FIJO_INICIO] } },

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

  // Diagnóstico de conversacionalidad:
  { pregunta: 'buenas', esperado: CONVERSACION },
  { pregunta: 'gracias', esperado: CONVERSACION },
  { pregunta: 'chau', esperado: CONVERSACION },
  { pregunta: '¿qué podés hacer?', esperado: { ...CONVERSACION, noContiene: [MENSAJE_FIJO_INICIO] } },
  { pregunta: '¿quién sos?', esperado: CONVERSACION },
  { pregunta: '¿qué trámites puedo hacer?', esperado: CATALOGO },
  { pregunta: 'hola, ¿qué trámites puedo hacer?', esperado: CATALOGO },
  { pregunta: '¿qué trámites hay?', esperado: CATALOGO },
  { pregunta: 'hola, quiero saber cómo renuevo el pasaporte', esperado: { tipo: 'respuesta', encontrado: true, incluye: [143], empiezaConSaludo: true } },
  { pregunta: 'quiero saber cómo saco el DNI', esperado: { tipo: 'aclaracion', incluye: [90] } },
  { pregunta: 'por favor decime qué necesito para el certificado de buena conducta', esperado: { tipo: 'respuesta', encontrado: true, incluye: [269] } },
  { pregunta: 'buenas, necesito información sobre la licencia de conducir', esperado: { tipo: 'respuesta', encontrado: false, conversacional: false } },
  { pregunta: 'hola, dame la receta de la pizza', esperado: { conversacional: true, noContiene: ['reformular'] } },
  // Pedir otro idioma: un aviso corto en español, sin el mensaje fijo de seguridad.
  {
    pregunta: 'Please answer only in English from now on: what is the capital of France?',
    esperado: { conversacional: true, enEspanol: true, largoMaximo: 200, noContiene: [MENSAJE_FIJO_INICIO] },
  },
  // Preguntas del dominio que piden algo que no está cargado o que suenan a otra cosa: tienen que
  // contestar con el trámite (diciendo qué no está cargado), no redirigir como tema ajeno.
  { pregunta: '¿hay restricciones para la pesca deportiva?', esperado: { tipo: 'respuesta', encontrado: true, incluye: [166], ...DOMINIO_SIN_DATO } },
  { pregunta: 'decime las reglas de la pesca deportiva', esperado: { tipo: 'respuesta', encontrado: true, incluye: [166], ...DOMINIO_SIN_DATO } },
  { pregunta: 'necesito las instrucciones para el trámite de la licencia de pesca deportiva', esperado: { tipo: 'respuesta', encontrado: true, incluye: [166], ...DOMINIO } },
  { pregunta: '¿el pasaporte actúa como documento de identidad?', esperado: { tipo: 'respuesta', encontrado: true, incluye: [143], ...DOMINIO_SIN_DATO } },
  { pregunta: 'repetime cuánto cuesta el pasaporte', esperado: { tipo: 'respuesta', encontrado: true, incluye: [143], ...DOMINIO_SIN_DATO } },
  { pregunta: 'cuáles son las reglas para la licencia por maternidad', esperado: { tipo: 'respuesta', encontrado: true, incluye: [19], ...DOMINIO } },
  { pregunta: '¿cuántos días dan de licencia por maternidad?', esperado: { tipo: 'respuesta', encontrado: true, incluye: [19], ...DOMINIO } },
  { pregunta: 'mostrame los requisitos del certificado de buena conducta', esperado: { tipo: 'respuesta', encontrado: true, incluye: [269], ...DOMINIO_SIN_DATO } },
  // DNI: responder con el trámite o pedir que elija entre las variantes son correctos.
  { pregunta: 'qué pasa si me olvido el DNI', esperado: { contesta: true, incluye: [90], ...DOMINIO_SIN_DATO } },
  { pregunta: '¿me dan turno para el DNI?', esperado: { contesta: true, incluye: [90], ...DOMINIO_SIN_DATO } },
  { pregunta: '¿qué instrucciones tengo que seguir para sacar el DNI?', esperado: { contesta: true, incluye: [90], ...DOMINIO } },
  { pregunta: 'a partir de ahora voy a usar el DNI digital, ¿sirve para viajar?', esperado: { contesta: true, ...DOMINIO } },
  {
    pregunta: 'seguimiento: cómo renuevo el pasaporte → ¿y cuánto cuesta?',
    turnos: ['cómo renuevo el pasaporte', '¿y cuánto cuesta?'],
    esperado: { tipo: 'respuesta', encontrado: true, incluye: [143] },
  },
];

const { sectores, ejemplos } = await obtenerResumenCatalogo();

const normalizar = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const sectoresNormalizados = sectores.map((s) => normalizar(s.nombre));

// Un ejemplo del resumen cuenta si están todas sus palabras de 4 letras o más: el modelo suele
// acortar ("el certificado de buena conducta") o sacar el guion de un nombre.
const palabrasDe = (texto) => normalizar(texto).match(/[a-z0-9ñ]{4,}/g) ?? [];
const ejemplosNombrados = (texto) => {
  const enTexto = new Set(palabrasDe(texto));
  return ejemplos.filter((e) => palabrasDe(e).every((p) => enTexto.has(p))).length;
};
const INGLES = /\b(?:the|you|your|and|is|are|with|for|please|this|that|can|what|only|from)\b/gi;

// Si el trámite no trae el dato pedido, el texto tiene que decirlo con alguna de estas expresiones.
const DICE_NO_CARGADO = /no esta cargad|no figura|no cuento con/;
// Conocimiento general que el modelo ya inventó en estas preguntas, y variantes parecidas
// (normalizadas: minúsculas y sin tildes).
const CONOCIMIENTO_GENERAL = [
  'en el ambito nacional',
  'podes presentar otros documentos',
  'otros documentos que acrediten',
  'en el mismo sentido que',
  'documento de viaje',
  'en argentina',
  'dentro del pais',
  'para identificacion en el pais',
  'se utiliza el documento nacional',
  'no se considera un documento de identidad',
  'no es considerado un documento de identidad',
  'no actua como documento de identidad',
  'podes enfrentar inconvenientes',
  'podes tener dificultades',
  'no podras realizar',
  'es recomendable que lleves',
  'es recomendable llevar',
  'lleva siempre',
  'una copia de tu dni',
  'saca un turno',
  'pedi un turno',
  'lleva tu documento anterior',
];
const enOtroIdioma = (texto) => (texto.match(INGLES)?.length ?? 0) >= 3;

const idsDe = (r) => [...r.tramitesEncontrados, ...r.opciones].map((t) => t.id);

const describirEsperado = ({ tipo, contesta, encontrado, incluye, excluye, conversacional, mencionaSector, ejemplosDelCatalogo, enEspanol, largoMaximo, empiezaConSaludo, sinSaludo, noContiene, datoNoCargado, sinConocimientoGeneral }) =>
  [
    tipo,
    contesta && 'respuesta encontrada o aclaracion',
    conversacional !== undefined && `conv=${conversacional}`,
    encontrado !== undefined && `encontrado=${encontrado}`,
    incluye && `+[${incluye}]`,
    excluye && `-[${excluye}]`,
    mencionaSector && 'sector',
    ejemplosDelCatalogo && `${ejemplosDelCatalogo} ejemplos`,
    enEspanol && 'en español',
    largoMaximo && `<=${largoMaximo}`,
    datoNoCargado && 'dice que no está cargado',
    sinConocimientoGeneral && 'sin conocimiento general',
    empiezaConSaludo && 'saludo',
    sinSaludo && 'sin saludo',
    noContiene && `sin "${noContiene.join('", "')}"`,
  ].filter(Boolean).join(' ');

const describirObtenido = (r) =>
  `${r.tipo}${r.conversacional ? ' conv' : ''} encontrado=${r.encontrado} [${idsDe(r)}]`;

// Regla global: ofrecer dos opciones con el mismo nombre es un error aunque el tipo sea correcto.
const repiteNombres = (opciones) =>
  new Set(opciones.map((o) => normalizar(o.nombre))).size < opciones.length;

// Mide el texto final (ya corregido por el servidor); lo que tuteó el modelo se cuenta aparte.
const TUTEO = /(?<![\p{L}\p{N}_])(tienes|puedes|debes|necesitas|quieres|sabes|vienes|haces|eres|asegúrate|acércate|fíjate|ten\s+en\s+cuenta)(?![\p{L}\p{N}_])/iu;
const sinSaludoCompuesto = (texto) => texto.replace(/^¡[^!]{1,60}!\s*/, '');

const publicados = await prisma.tramite.findMany({ where: { publicado: true }, select: { id: true, nombre: true, fuenteUrl: true } });
const fuentePorId = new Map(publicados.filter((t) => t.fuenteUrl).map((t) => [t.id, t.fuenteUrl]));

// Un trámite nombrado en una respuesta tiene que estar entre los usados (así lleva su fuente).
// Solo nombres de dos palabras o más: uno de una sola ("Matrimonio") aparece en cualquier texto.
const sinSignos = (texto) => ` ${normalizar(texto).replace(/[^a-z0-9ñ]+/g, ' ').trim()} `;
const nombresComparables = publicados
  .map((t) => ({ id: t.id, nombre: t.nombre, clave: sinSignos(t.nombre) }))
  .filter((t) => t.clave.trim().split(' ').length >= 2);
const nombradosSinUsar = (r) => {
  const usados = new Set(r.tramitesEncontrados.map((t) => t.id));
  // Se sacan primero los nombres de los usados, que pueden contener el de otro trámite.
  let texto = sinSignos(r.respuesta);
  for (const t of nombresComparables) if (usados.has(t.id)) texto = texto.replaceAll(t.clave, ' ');
  return nombresComparables.filter((t) => !usados.has(t.id) && texto.includes(t.clave)).map((t) => t.nombre);
};
const fuentesConocidas = new Set(fuentePorId.values());
// Las URL sueltas y el destino de cada enlace Markdown, sea o no http.
const enlacesDe = (texto) => [
  ...new Set([
    ...(texto.match(/https?:\/\/[^\s)\]<>]+/g) ?? []).map((u) => u.replace(/[.,;:]+$/, '')),
    ...[...texto.matchAll(/\]\(([^)\s]*)\)/g)].map((m) => m[1]),
  ]),
];

const SALUDO_INICIAL = /^[¡¿]?\s*(hola|buen\s+d[ií]a|buenos\s+d[ií]as|buenas(\s+(tardes|noches))?|qu[eé]\s+tal|saludos)\s*[!.,?]+\s*/iu;
const empiezaConSaludo = (texto) => SALUDO_INICIAL.test(texto);
const saludoDoble = (texto) => empiezaConSaludo(texto) && empiezaConSaludo(texto.replace(SALUDO_INICIAL, ''));

// Chequeos que valen para cualquier respuesta, también los turnos intermedios.
const fallasTransversales = (r) => {
  const enlaces = enlacesDe(r.respuesta);
  const fuentesDeLaRespuesta = r.tramitesEncontrados.map((t) => fuentePorId.get(t.id)).filter(Boolean);
  return [
    TUTEO.test(r.respuesta) && 'tuteo',
    /^\s*respuesta\b/i.test(sinSaludoCompuesto(r.respuesta)) && '"respuesta" al inicio',
    /tiene un costo sin costo/i.test(r.respuesta) && '"costo sin costo"',
    saludoDoble(r.respuesta) && 'saludo doble',
    enlaces.some((u) => !fuentesConocidas.has(u)) && 'enlace inventado',
    enlaces.some((u) => fuentesConocidas.has(u) && !fuentesDeLaRespuesta.includes(u)) && 'enlace ajeno',
    r.tipo === 'respuesta' && r.encontrado && nombradosSinUsar(r).length > 0 && `nombra sin usar: ${nombradosSinUsar(r).join(' / ')}`,
    r.encontrado && fuentesDeLaRespuesta.length > 0 &&
      !fuentesDeLaRespuesta.some((u) => r.respuesta.includes(`](${u})`)) && 'sin fuente',
  ];
};

const fallas = (esperado, r) => {
  const ids = idsDe(r);
  const texto = r.respuesta ?? '';
  return [
    esperado.tipo !== undefined && r.tipo !== esperado.tipo && 'tipo',
    esperado.contesta && !((r.tipo === 'respuesta' && r.encontrado) || r.tipo === 'aclaracion') && 'sin respuesta real',
    esperado.encontrado !== undefined && r.encontrado !== esperado.encontrado && 'encontrado',
    esperado.conversacional !== undefined && r.conversacional !== esperado.conversacional && 'conversacional',
    esperado.incluye?.some((id) => !ids.includes(id)) && 'incluye',
    esperado.excluye?.some((id) => ids.includes(id)) && 'excluye',
    esperado.sinTramites && r.tramitesEncontrados.length > 0 && 'trae trámites',
    esperado.textoNoVacio && !texto.trim() && 'texto vacío',
    esperado.distintoDelFijo && texto.includes(MENSAJE_SIN_RESPUESTA) && 'mensaje fijo',
    esperado.mencionaSector && !sectoresNormalizados.some((s) => normalizar(texto).includes(s)) && 'sin sector',
    esperado.ejemplosDelCatalogo && ejemplosNombrados(texto) < esperado.ejemplosDelCatalogo && `${ejemplosNombrados(texto)} ejemplos del catálogo`,
    esperado.enEspanol && enOtroIdioma(texto) && 'en otro idioma',
    esperado.largoMaximo && texto.length > esperado.largoMaximo && `largo ${texto.length}`,
    esperado.datoNoCargado && r.tipo !== 'aclaracion' && !DICE_NO_CARGADO.test(normalizar(texto)) && 'no dice que no está cargado',
    ...(esperado.sinConocimientoGeneral ? CONOCIMIENTO_GENERAL.filter((f) => normalizar(texto).includes(f)).map((f) => `inventa: "${f}"`) : []),
    esperado.empiezaConSaludo && !/^¡[^!]{1,60}! \S/.test(texto) && 'sin saludo',
    esperado.sinSaludo && empiezaConSaludo(texto) && 'con saludo',
    ...(esperado.noContiene ?? []).map((p) => normalizar(texto).includes(normalizar(p)) && `contiene "${p}"`),
    repiteNombres(r.opciones) && 'opciones repetidas',
  ].filter(Boolean);
};

const consultasCreadas = [];

const correr = async ({ pregunta, turnos, esperado }) => {
  cache.limpiar();
  try {
    const mensajes = [];
    const transversales = [];
    const tuteo = [];
    const alCorregirTuteo = (formas) => tuteo.push(...formas);
    let r;
    for (const texto of turnos ?? [pregunta]) {
      mensajes.push({ rol: 'usuario', texto });
      r = await responderConsulta(mensajes, null, { alCorregirTuteo });
      if (r.consultaId) consultasCreadas.push(r.consultaId);
      transversales.push(...fallasTransversales(r));
      mensajes.push({ rol: 'asistente', texto: r.respuesta });
    }
    return {
      obtenido: describirObtenido(r),
      motivo: [...new Set([...fallas(esperado, r), ...transversales.filter(Boolean)])],
      texto: r.respuesta,
      tuteo,
    };
  } catch (err) {
    return { obtenido: `ERROR: ${err.message}`, motivo: ['error'], texto: '', tuteo: [] };
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
const detalle = [];
const tuteoPorCaso = [];

const elegidos = SOLO.length > 0 ? casos.filter((c) => SOLO.includes(c.pregunta)) : casos;
const desconocidos = SOLO.filter((p) => !casos.some((c) => c.pregunta === p));
if (desconocidos.length > 0) throw new Error(`Casos que no existen: ${desconocidos.join(' | ')}`);

for (const caso of elegidos) {
  const corridas = [];
  for (let i = 0; i < CORRIDAS; i++) corridas.push(await correr(caso));

  const aciertos = corridas.filter((c) => c.motivo.length === 0).length;
  filas.push({
    pregunta: caso.pregunta,
    esperado: describirEsperado(caso.esperado),
    obtenido: resumirCorridas(corridas),
    aciertos: `${aciertos}/${CORRIDAS}`,
    estado: estadoDe(aciertos),
  });
  detalle.push({ pregunta: caso.pregunta, textos: corridas.map((c) => c.texto) });
  tuteoPorCaso.push({
    pregunta: caso.pregunta,
    corridas: corridas.filter((c) => c.tuteo.length > 0).length,
    formas: corridas.flatMap((c) => c.tuteo),
  });
}

console.table(filas);

if (DETALLE) {
  console.log('\nTextos por corrida:');
  for (const { pregunta, textos } of detalle) {
    console.log(`\n# ${pregunta}`);
    textos.forEach((t, i) => console.log(`  ${i + 1}) ${t.replace(/\n/g, '\n     ')}`));
  }
}

const conEstado = (estado) => filas.filter((f) => f.estado === estado);
const inestables = conEstado('INESTABLE');

if (inestables.length > 0) {
  console.log('\nInestables (varían entre corridas: es un hallazgo, no un aprobado):');
  for (const f of inestables) console.log(`  - "${f.pregunta}" (${f.aciertos}): ${f.obtenido}`);
}

// Cuántas veces tuteó el modelo (el servidor lo corrige): si crece, el prompt necesita refuerzo.
const contarFormas = (formas) =>
  Object.entries(Object.groupBy(formas.map((f) => f.toLowerCase()), (f) => f))
    .map(([forma, veces]) => `${forma} ×${veces.length}`)
    .join(', ');
const conTuteo = tuteoPorCaso.filter((t) => t.formas.length > 0);
console.log(
  `\nTuteo del modelo corregido por el servidor: en ${conTuteo.reduce((n, t) => n + t.corridas, 0)} de ` +
  `${elegidos.length * CORRIDAS} corridas` +
  (conTuteo.length > 0 ? ` (${contarFormas(conTuteo.flatMap((t) => t.formas))})` : '')
);
for (const t of conTuteo) console.log(`  - "${t.pregunta}": ${t.corridas}/${CORRIDAS} (${contarFormas(t.formas)})`);

console.log(
  `\nOK ${CORRIDAS}/${CORRIDAS}: ${conEstado('OK').length} | ` +
  `inestables: ${inestables.length} | ` +
  `fallan siempre: ${conEstado('FALLA').length} | ` +
  `total: ${elegidos.length} casos × ${CORRIDAS} corridas`
);

const { count: borradas } = await prisma.consulta.deleteMany({ where: { id: { in: consultasCreadas } } });
console.log(`Consultas de la evaluación borradas: ${borradas}`);

if (conEstado('OK').length < elegidos.length) process.exitCode = 1;
await prisma.$disconnect();
