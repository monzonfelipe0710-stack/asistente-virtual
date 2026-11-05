import { describirJurisdiccion } from './jurisdiccion.service.js';

// Un trámite con el mismo nombre en distintos organismos llega de la búsqueda como un grupo de
// variantes. Cada variante tiene un par (jurisdicción, localidad) efectivo; si el grupo tiene más
// de un par y la persona no dijo cuál, el grupo queda sin resolver y el servidor le pregunta.

const normalizar = (texto) =>
  ` ${String(texto ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;

const PALABRAS_DE_JURISDICCION = [
  ['municipal', 'MUNICIPAL'],
  ['municipalidad', 'MUNICIPAL'],
  ['municipio', 'MUNICIPAL'],
  ['provincial', 'PROVINCIAL'],
  ['nacional', 'NACIONAL'],
];

// La última mención gana; si dos terminan en el mismo lugar, la más larga ("Villa Formosa" sobre
// "Formosa"). "provincia de Formosa" no cuenta como la localidad Formosa.
const ultimaMencion = (texto, opciones) => {
  let mejor = null;
  for (const [frase, valor] of opciones) {
    const buscada = normalizar(frase);
    let desde = texto.lastIndexOf(buscada);
    while (desde !== -1 && texto.slice(0, desde + 1).endsWith(' provincia de ')) {
      desde = desde === 0 ? -1 : texto.lastIndexOf(buscada, desde - 1);
    }
    if (desde === -1) continue;
    const fin = desde + buscada.length;
    if (!mejor || fin > mejor.fin || (fin === mejor.fin && buscada.length > mejor.largo)) {
      mejor = { valor, fin, largo: buscada.length };
    }
  }
  return mejor?.valor ?? null;
};

// Qué jurisdicción y qué localidad nombró la persona, entre las localidades conocidas.
export const loQueNombro = (texto, localidades) => {
  const normalizado = normalizar(texto);
  return {
    localidad: ultimaMencion(normalizado, [...localidades].map((l) => [l, l])),
    jurisdiccion: ultimaMencion(normalizado, PALABRAS_DE_JURISDICCION),
  };
};

export const localidadesConocidas = (jurisdicciones) =>
  new Set([...jurisdicciones.values()].map((j) => j.localidad).filter(Boolean));

const mismaLocalidad = (a, b) => normalizar(a) === normalizar(b);
const clavePar = ({ jurisdiccion, localidad }) => `${jurisdiccion}|${localidad ? normalizar(localidad) : ''}`;

// Las variantes vienen ordenadas por puntaje: la primera de cada par es su representante.
const paresDe = (grupo, jurisdicciones) => {
  const pares = new Map();
  for (const v of grupo.variantes ?? [{ id: grupo.id, sectorId: null }]) {
    const j = jurisdicciones.get(v.sectorId) ?? { jurisdiccion: 'PROVINCIAL', localidad: null };
    const par = { id: v.id, jurisdiccion: j.jurisdiccion, localidad: j.localidad };
    if (!pares.has(clavePar(par))) pares.set(clavePar(par), par);
  }
  return [...pares.values()];
};

const cumple = (par, nombrado) =>
  (!nombrado.localidad || (par.localidad && mismaLocalidad(par.localidad, nombrado.localidad))) &&
  (!nombrado.jurisdiccion || par.jurisdiccion === nombrado.jurisdiccion);

// Para cada grupo: { id } si queda una sola variante (la de lo que nombró la persona, o la única),
// o un grupo sin resolver con sus pares como opciones. `noEncontrado` es lo que la persona nombró
// cuando ninguna variante lo cumple.
export const resolverGrupos = (grupos, jurisdicciones, nombrado) =>
  grupos.map((grupo) => {
    const pares = paresDe(grupo, jurisdicciones);
    if (pares.length === 1) return { id: pares[0].id };

    const nombroAlgo = Boolean(nombrado.localidad || nombrado.jurisdiccion);
    const elegidos = nombroAlgo ? pares.filter((p) => cumple(p, nombrado)) : pares;
    if (elegidos.length === 1) return { id: elegidos[0].id };

    return {
      id: grupo.id,
      nombre: grupo.nombre,
      sinResolver: true,
      opciones: elegidos.length > 0 ? elegidos : pares,
      noEncontrado: nombroAlgo && elegidos.length === 0 ? nombrado : null,
    };
  });

const etiquetaDeOpcion = (nombre, { jurisdiccion, localidad }) => {
  if (jurisdiccion === 'MUNICIPAL' && localidad) return `${nombre} en ${localidad}`;
  return `${nombre} ${describirJurisdiccion({ jurisdiccion, localidad })}`;
};

const cualDeJurisdiccion = ({ jurisdiccion, localidad }) => {
  if (jurisdiccion === 'MUNICIPAL' && localidad) return `el de la Municipalidad de ${localidad}`;
  return `el trámite ${describirJurisdiccion({ jurisdiccion, localidad })}`;
};

const unirConO = (partes) => (partes.length < 2 ? partes.join('') : `${partes.slice(0, -1).join(', ')} o ${partes.at(-1)}`);

const describirNoEncontrado = ({ localidad, jurisdiccion }) =>
  [jurisdiccion && describirJurisdiccion({ jurisdiccion, localidad: null }), localidad && `para ${localidad}`].filter(Boolean).join(' ');

// La pregunta sale armada por el servidor, sin el modelo: por localidad si todas las opciones son
// de la misma jurisdicción y, si no, por jurisdicción. Cada opción trae un texto que, mandado
// como pregunta, ya resuelve el grupo.
export const aclaracionDeGrupo = (grupo) => {
  const { nombre, opciones, noEncontrado } = grupo;
  const jurisdicciones = new Set(opciones.map((o) => o.jurisdiccion));
  const aviso = noEncontrado ? `No tengo cargado «${nombre}» ${describirNoEncontrado(noEncontrado)}. ` : '';

  let pregunta;
  if (jurisdicciones.size === 1 && opciones.every((o) => o.localidad)) {
    const localidades = opciones.map((o) => o.localidad);
    pregunta =
      `«${nombre}» depende de cada ${opciones[0].jurisdiccion === 'MUNICIPAL' ? 'municipio' : 'localidad'}. ` +
      `¿De qué localidad lo necesitás? Está cargado para: ${unirConO(localidades)}. ` +
      `Podés escribir, por ejemplo, «${etiquetaDeOpcion(nombre, opciones[0]).toLowerCase()}».`;
  } else {
    pregunta = `Hay más de un trámite «${nombre}». ¿Necesitás ${unirConO(opciones.map(cualDeJurisdiccion))}?`;
  }

  return {
    texto: aviso + pregunta,
    opciones: opciones.map((o) => ({ id: o.id, nombre: etiquetaDeOpcion(nombre, o), jurisdiccion: o.jurisdiccion, localidad: o.localidad })),
  };
};

// Para el contexto del modelo: sin descripción, para que no use los datos de una variante.
export const formatearGrupo = ({ id, nombre, opciones }) =>
  [
    `Trámite (id ${id}): ${nombre}`,
    `Está cargado para varias jurisdicciones o localidades: ${opciones.map((o) => describirJurisdiccion(o)).join('; ')}.`,
    'La persona no dijo cuál: si pregunta por este trámite, el sistema le pregunta cuál necesita.',
  ].join('\n');
