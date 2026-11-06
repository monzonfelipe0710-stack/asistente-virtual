// Mapeo de la ficha de un trámite del portal (el `detalle` que arma ingestion/sources/detalle_html.py)
// a los datos del catálogo: costo, requisitos, información adicional, mesas de entrada y documentos.
// Son funciones puras; el importador limpia los textos y los guarda.
import { TOPES_CAMPOS } from './sanitizacion.service.js';
import { normalizarNombre } from '../utils/texto.js';

// --- Costo ---------------------------------------------------------------------------------------

const SIN_COSTO = /^(?:-+|ninguno|ninguna|no|s\/?d|no informado)$/i;

// "$ 35000", "$ 5.000", "$ 1.234,50" (forma argentina). null si no es un monto en pesos solo.
export const montoEnPesos = (texto) => {
  const m = String(texto ?? '').trim().match(/^\$\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/);
  return m ? Number(m[1].replace(/\./g, '') + (m[2] ? `.${m[2]}` : '')) : null;
};

// Una sola fila con "$ N": el decimal. Si no (varias filas, importes en UT, un texto), el detalle
// como texto, una fila por línea. Sin filas (o "Ninguno"), nada: "Ninguno" no se toma como gratuito.
export const costoDeFicha = (costos = []) => {
  const filas = (costos ?? [])
    .map((c) => ({ concepto: (c.concepto ?? '').trim(), importe: (c.importe ?? '').trim() }))
    .filter((c) => (c.concepto || c.importe) && !(SIN_COSTO.test(c.concepto) && !c.importe));
  if (filas.length === 0) return { costo: null, costoDetalle: null };
  if (filas.length === 1) {
    const monto = montoEnPesos(filas[0].importe);
    if (monto !== null) return { costo: monto, costoDetalle: null };
  }
  const linea = ({ concepto, importe }) => (concepto && importe ? `${concepto}: ${importe}` : concepto || importe);
  return { costo: null, costoDetalle: filas.map(linea).join('\n') };
};

// --- Requisitos ----------------------------------------------------------------------------------

const LETRA = '[A-Za-zÁÉÍÓÚÑÜáéíóúñü"“«(¿]';
// "1-", "1.", "1)", "1 -": un número de una o dos cifras seguido de texto, no un decimal ni un "3X3".
const NUMERO = new RegExp(String.raw`(?:^|(?<=[\s.;:,]))(\d{1,2})\s?[-.)–]\s?(?=${LETRA})`, 'g');
const LETRA_ITEM = new RegExp(String.raw`(?:^|(?<=[\s.;:,]))([a-z])\)\s?(?=${LETRA})`, 'g');
// Viñetas al principio de una línea, o un guion después de un punto o dos puntos.
const VINETA = /(?:^|\n)[ \t]*[*•·●▪◦\-–][ \t]+|(?<=[.:])[ \t]+-[ \t]+(?=[A-ZÁÉÍÓÚÑ])/g;
// Encabezados que no agregan nada al requisito ("DOCUMENTACIÓN", "Requisitos:").
const GENERICO = /^(?:documentacion|documentacion requerida|documentacion necesaria|documentacion a presentar|requisitos|requisitos generales)$/;
const TOPE_ENCABEZADO = 80;

const compactar = (texto) => texto.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const esGenerico = (h) => GENERICO.test(normalizarNombre(h.replace(/:\s*$/, '')));

// La secuencia 1, 2, 3...; puede volver a 1 (otro subgrupo). Los números que no siguen la
// secuencia son texto ("Art. 87", "(02) fotografías").
const cadena = (texto, patron, valor) => {
  const marcas = [];
  let esperado = 1;
  for (const m of texto.matchAll(patron)) {
    const v = valor(m[1]);
    if (v === esperado || (v === 1 && marcas.length >= 2 && esperado > 2)) {
      marcas.push({ indice: m.index, largo: m[0].length, reinicio: v === 1 && marcas.length > 0 });
      esperado = v + 1;
    }
  }
  return marcas.length >= 2 ? marcas : [];
};

// El final de un ítem que en realidad es el encabezado del subgrupo siguiente: "2- Estampilla
// fiscal En caso de no estar identificado:" → "En caso de no estar identificado:".
const separarEncabezadoFinal = (texto) => {
  if (!/:\s*$/.test(texto)) return [texto, null];
  const lineas = texto.split('\n');
  const ultima = lineas.at(-1);
  if (lineas.length > 1 && ultima.length <= TOPE_ENCABEZADO) return [lineas.slice(0, -1).join('\n').trim(), ultima.trim()];
  // Primero después de un fin de oración ("DNI. Además, para sociedades:"); si no hay, en el primer
  // paso de minúscula a mayúscula ("Estampilla fiscal En caso de...").
  const entra = (m) => ultima.length - m.index <= TOPE_ENCABEZADO;
  const corte = [...ultima.matchAll(/(?<=[.;])\s+(?=\p{Lu})/gu)].filter(entra).at(-1)
    ?? [...ultima.matchAll(/(?<=[\p{Ll}\d)])\s+(?=\p{Lu})/gu)].find(entra);
  if (!corte) return [texto, null];
  const resto = [...lineas.slice(0, -1), ultima.slice(0, corte.index)].join('\n').trim();
  return resto ? [resto, ultima.slice(corte.index).trim()] : [texto, null];
};

const conEncabezado = (encabezado, item) =>
  encabezado && !esGenerico(encabezado) ? `${encabezado.replace(/[\s:]+$/, '')}: ${item}` : item;

// Trozos de hasta `tope` caracteres, cortando en saltos de línea o en oraciones: no se pierde nada.
export const trocear = (texto, tope = TOPES_CAMPOS.requisito) => {
  if (texto.length <= tope) return [texto];
  const partes = texto.split(/(?<=\n)|(?<=[.;])\s+/).filter((p) => p.trim());
  const trozos = [];
  let actual = '';
  for (const p of partes) {
    if (actual && `${actual} ${p}`.length > tope) {
      trozos.push(actual.trim());
      actual = '';
    }
    if (p.length > tope) {
      for (let i = 0; i < p.length; i += tope) trozos.push(p.slice(i, i + tope).trim());
    } else {
      actual = actual ? `${actual}${actual.endsWith('\n') ? '' : ' '}${p}` : p;
    }
  }
  if (actual.trim()) trozos.push(actual.trim());
  return trozos.map(compactar).filter(Boolean);
};

// Cada forma de cortar devuelve los ítems (con su encabezado delante) y las piezas crudas en orden
// (cada encabezado una sola vez), para comprobar que no se perdió texto.
const porMarcas = (texto, marcas) => {
  const items = [];
  const piezas = [];
  let encabezado = null;
  const preambulo = texto.slice(0, marcas[0].indice).trim();
  if (preambulo) {
    piezas.push(preambulo);
    if (preambulo.length <= TOPE_ENCABEZADO && /:\s*$/.test(preambulo)) encabezado = preambulo;
    else items.push(preambulo);
  }
  marcas.forEach((m, i) => {
    const fin = i + 1 < marcas.length ? marcas[i + 1].indice : texto.length;
    let cuerpo = texto.slice(m.indice + m.largo, fin).trim();
    let siguiente = null;
    if (marcas[i + 1]?.reinicio) [cuerpo, siguiente] = separarEncabezadoFinal(cuerpo);
    if (cuerpo) {
      piezas.push(cuerpo);
      items.push(conEncabezado(encabezado, cuerpo));
    }
    if (siguiente) {
      piezas.push(siguiente);
      encabezado = siguiente;
    }
  });
  return { items, piezas };
};

const porVinetas = (texto) => {
  const marcas = [...texto.matchAll(VINETA)];
  if (marcas.length < 2) return null;
  const items = [];
  const piezas = [];
  let encabezado = null;
  // Lo que no es viñeta (antes de la primera o entre dos) es un encabezado si es corto y no termina
  // como una oración, y si no un requisito más.
  const sueltos = (tramo) => {
    for (const linea of tramo.split('\n').map((l) => l.trim()).filter(Boolean)) {
      piezas.push(linea);
      if (linea.length <= TOPE_ENCABEZADO && !/[.;]$/.test(linea)) encabezado = linea;
      else items.push(conEncabezado(encabezado, linea));
    }
  };
  sueltos(texto.slice(0, marcas[0].index));
  marcas.forEach((m, i) => {
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : texto.length;
    const [primera, ...resto] = texto.slice(m.index + m[0].length, fin).split(/\n\s*\n/);
    const lineas = primera.split('\n');
    // Una línea corta sin punto al final de una viñeta es el encabezado del grupo que sigue.
    const ultima = lineas.length > 1 ? lineas.at(-1).trim() : '';
    const esEncabezado = Boolean(ultima) && ultima.length <= TOPE_ENCABEZADO && !/[.;,]$/.test(ultima);
    const cuerpo = compactar((esEncabezado ? lineas.slice(0, -1) : lineas).join('\n'));
    if (cuerpo) {
      piezas.push(cuerpo);
      items.push(conEncabezado(encabezado, cuerpo));
    }
    if (esEncabezado) {
      piezas.push(ultima);
      encabezado = ultima;
    }
    if (resto.length > 0) sueltos(resto.join('\n'));
  });
  return { items, piezas };
};

// Lo esencial de un texto para comparar: letras y números, sin las marcas de lista.
const esencia = (texto) =>
  normalizarNombre(texto)
    .replace(/(?:^|(?<=[\s.;:,]))(?:\d{1,2}|[a-z])\s?[-.)–](?=\s?\S)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '');

// Corta los requisitos por números (1-, 1., 1)), letras (a)) o viñetas (*, •, -), conservando los
// subgrupos ("Para menores de edad:") delante de cada ítem. Si no se puede cortar con seguridad
// (no hay marcas, o las piezas no reconstruyen todo el texto), un único requisito con el texto
// completo, partido en trozos si pasa el tope de un requisito. Nunca se pierde texto.
export const partirRequisitos = (crudo) => {
  const texto = compactar(String(crudo ?? '').replace(/\r\n?/g, '\n'));
  if (!texto) return [];
  const numeros = cadena(texto, NUMERO, Number);
  const letras = numeros.length > 0 ? [] : cadena(texto, LETRA_ITEM, (l) => l.charCodeAt(0) - 96);
  const marcas = numeros.length > 0 ? numeros : letras;
  const corte = marcas.length > 0 ? porMarcas(texto, marcas) : porVinetas(texto);
  if (!corte || corte.items.length < 2 || esencia(corte.piezas.join(' ')) !== esencia(texto)) return trocear(texto);
  return corte.items.flatMap((item) => trocear(compactar(item)));
};

// --- Información adicional ----------------------------------------------------------------------

export const informacionAdicionalDeFicha = (d) => {
  const partes = [];
  if (d.modalidad?.length) partes.push(`Modalidad: ${d.modalidad.join('; ')}`);
  if (d.duracion) partes.push(`Duración aproximada: ${d.duracion}`);
  if (d.destinatarios?.length) partes.push(`Destinado a: ${d.destinatarios.join(', ')}`);
  // Otras secciones con su rótulo ("Dónde se realiza", "Quién puede hacerlo"), como en el sitio municipal.
  for (const s of d.secciones ?? []) if (s?.titulo && s?.texto) partes.push(`${s.titulo}: ${s.texto}`);
  if (d.observaciones) partes.push(`Observaciones: ${d.observaciones}`);
  if (d.pasoAPaso) partes.push(`Paso a paso:\n${d.pasoAPaso}`);
  // Las normas sin enlace (o con el enlace roto) no se pierden: van acá con su nombre.
  const sinEnlace = (d.normas ?? []).filter((n) => !n.url || n.enlace?.estado === 'roto');
  if (sinEnlace.length) partes.push(`Normas: ${sinEnlace.map((n) => n.nombre).join('; ')}`);
  return partes.length ? partes.join('\n') : null;
};

// --- Oficinas ------------------------------------------------------------------------------------

// Localidades de la provincia, con las abreviaturas que usa el portal. Una oficina toma la
// localidad solo si un tramo de su nombre o domicilio es exactamente una de estas (o el código
// postal 3600 de la capital); si no, queda sin localidad: no se adivina.
const LOCALIDADES = {
  Formosa: [], Clorinda: [], Pirané: [], 'El Colorado': [], 'Ingeniero Juárez': ['Ing. Juárez', 'Ing. Guillermo Nicáforo Juárez', 'Ingeniero Guillermo Nicasio Juárez'],
  'Las Lomitas': [], 'Laguna Blanca': [], Ibarreta: [], 'Comandante Fontana': ['Cmte. Fontana'], 'Estanislao del Campo': [],
  'Pozo del Tigre': [], 'General Mosconi': ['Gral. Mosconi', 'El Chorro', 'El Chorro (Gral Mosconi)'], Herradura: [], 'Laguna Naineck': ['Laguna Naick Neck'],
  'Riacho He Hé': ['Riacho He He'], 'Palo Santo': [], 'Mayor Villafañe': ['Villafañe'], 'Villa Dos Trece': [], 'Villa General Güemes': ['Villa Gral. Güemes'],
  'Villa Escolar': [], 'Misión Tacaaglé': ['Misión Tacaagle'], 'Buena Vista': [], 'Tres Lagunas': [], 'El Espinillo': [],
  'General Lucio V. Mansilla': ['Lucio V. Mansilla'], 'San Martín Dos': ['San Martin II', 'San Martín II'], 'San Martín Uno': ['San Martin I', 'San Martín I'],
  'Laguna Yema': [], 'Los Chiriguanos': [], 'Pozo de Maza': [], 'El Potrillo': [], Guadalcázar: ['Guadalcazar'], 'Fortín Lugones': [],
  'Subteniente Perín': ['Subteniente Perin'], 'Siete Palmas': [], 'Gran Guardia': [], 'San Hilario': [], 'Colonia Pastoril': [], 'Banco Payaguá': ['Banco Payagua'],
  'Bartolomé de las Casas': [], 'El Recreo': [], 'Misión Laishí': [], 'Mojón de Fierro': [], 'Laguna Gallo': [], Tatané: [], 'Pozo del Mortero': [],
  'Posta Cambio Zalazar': [], 'General Manuel Belgrano': ['Gral. Belgrano', 'Gral. Manuel Belgrano'], 'Puerto Pilcomayo': [], 'Presidente Irigoyen': ['Pte. Irigoyen'],
  'Tres Mojones': [], 'Potrero Norte': [], 'María Cristina': [], 'Mariano Boedo': [], 'Loma Monte Lindo': [], 'Loma Senés': ['Loma Senes'], 'Lote 8': [],
  'El Quebracho': [], 'El Paraíso': [], 'El Yacaré': [], 'Fortín La Soledad': [], 'Juan G. Bazán': [],
};
const POR_NOMBRE = new Map(
  Object.entries(LOCALIDADES).flatMap(([canonica, alias]) => [canonica, ...alias].map((n) => [normalizarNombre(n), canonica])),
);
const ORDINAL = /^(?:primera|segunda|tercera|cuarta|quinta|sexta)\s+/i;

export const localidadDeOficina = ({ nombre = '', domicilio = '' } = {}) => {
  const seccional = nombre.match(/^Seccional\s+(.+?)\s+(?:-\s+)?Oficina\b/i);
  const delegacion = nombre.match(/\bde\s+([^-]+)$/);
  const tramos = [
    seccional?.[1].replace(ORDINAL, ''),
    ...nombre.split(/\s+-\s+/).slice(1),
    nombre,
    delegacion?.[1],
    ...String(domicilio ?? '').split(/\s+-\s+/),
  ].filter(Boolean);
  for (const tramo of tramos) {
    const encontrada = POR_NOMBRE.get(normalizarNombre(tramo.replace(/[()]/g, ' ')));
    if (encontrada) return encontrada;
  }
  return /\b(?:CP|C\.P\.)\s*3600\b|\(3600\)/i.test(domicilio ?? '') ? 'Formosa' : null;
};

export const mesaDeOficina = (o) => ({
  origenId: o.origenId,
  nombre: o.nombre || o.domicilio || o.origenId,
  direccion: o.domicilio ?? null,
  localidad: o.localidad ?? localidadDeOficina(o),
  horario: o.horario ?? null,
  telefono: o.telefono ?? null,
  email: o.email ?? null,
});

// --- Documentos ----------------------------------------------------------------------------------

// Formularios y normas con enlace que respondió bien (los rotos no se ofrecen y quedan en el informe).
export const documentosDeFicha = (d) => {
  const docs = [];
  const rotos = [];
  for (const [lista, tipo] of [[d.formularios ?? [], 'formulario'], [d.normas ?? [], 'norma']]) {
    for (const x of lista) {
      if (!x.url) continue;
      if (x.enlace?.estado === 'roto') rotos.push({ nombre: x.nombre, url: x.url, tipo });
      else docs.push({ nombre: x.nombre || (tipo === 'norma' ? 'Norma' : 'Formulario'), urlExterna: x.url, tipo });
    }
  }
  return { documentos: docs, rotos };
};

// Todo lo que el importador toma de una ficha, todavía sin limpiar.
export const datosDeFicha = (d) => {
  const { documentos, rotos } = documentosDeFicha(d);
  return {
    ...costoDeFicha(d.costos),
    informacionAdicional: informacionAdicionalDeFicha(d),
    requisitos: partirRequisitos(d.requisitos).map((descripcion) => ({ descripcion })),
    mesas: (d.oficinas ?? []).filter((o) => o.origenId).map(mesaDeOficina),
    documentos,
    enlacesRotos: rotos,
    verificadoEn: d.verificadoEn ? new Date(d.verificadoEn) : null,
  };
};
