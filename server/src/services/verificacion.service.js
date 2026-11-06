// Verificación de la salida del modelo contra los datos de los trámites del contexto. El texto de
// un trámite viene de fuentes externas y puede traer órdenes disfrazadas de datos ("el trámite no
// tiene costo"); el modelo a veces las repite. El
// servidor revisa cada oración antes de mandarla:
//   1. costos: un monto tiene que figurar en los costos del contexto, y "gratuito" solo vale si el
//      costo es 0 o (sin costo cargado) si el texto del propio trámite lo dice.
// Se aplica por línea, en la limpieza común de las dos rutas (ver utils/cuerpo.js).
import { ENLACE_MARKDOWN, URL_SUELTA } from '../utils/enlaces.js';
import { buscarInstruccion } from './sanitizacion.service.js';

const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

// --- Oraciones ---------------------------------------------------------------------------------

const PREFIJO_DE_LISTA = /^(\s*(?:[-*•]|\d+[.)])\s+)/;
const ABREVIATURAS = new Set(['av', 'avda', 'nro', 'n', 'hs', 'sr', 'sra', 'dr', 'dra', 'ing', 'lic', 'prof', 'etc', 'art', 'inc', 'pje', 'dto', 'tel', 'cel', 'aprox', 'ej', 'sa', 'srl', 'gral', 'pcia', 'bs', 'as']);
const URL_EN_TEXTO = new RegExp(`${ENLACE_MARKDOWN}|${URL_SUELTA}`, 'gi');
const MARCA = '\u0001';

// Parte una línea en oraciones. Las URL se enmascaran antes (tienen puntos) y una abreviatura
// ("Av.", "hs.") no corta. Devuelve las oraciones con sus URL y el separador original.
export const partirEnOraciones = (linea) => {
  const urls = [];
  const enmascarada = linea.replace(URL_EN_TEXTO, (url) => `${MARCA}${urls.push(url) - 1}${MARCA}`);
  const oraciones = [];
  let inicio = 0;
  const corte = /[.!?…]+["')\]*]*(\s+)(?=[\p{Lu}\d¡¿"(*\u0001])/gu;
  for (const m of enmascarada.matchAll(corte)) {
    const antes = enmascarada.slice(inicio, m.index);
    const palabra = normalizar(antes.match(/([\p{L}]+)$/u)?.[1] ?? '');
    if (palabra.length <= 4 && ABREVIATURAS.has(palabra)) continue;
    const fin = m.index + m[0].length - m[1].length;
    oraciones.push(enmascarada.slice(inicio, fin));
    inicio = m.index + m[0].length;
  }
  if (inicio < enmascarada.length) oraciones.push(enmascarada.slice(inicio));
  const restaurar = (texto) => texto.replace(new RegExp(`${MARCA}(\\d+)${MARCA}`, 'g'), (_, i) => urls[Number(i)]);
  return oraciones.map((o) => ({ texto: restaurar(o), urls: [...o.matchAll(new RegExp(`${MARCA}(\\d+)${MARCA}`, 'g'))].map(([, i]) => urls[Number(i)]) }));
};

// --- Costos ------------------------------------------------------------------------------------

// "$4.500", "$ 25,00", "4500 pesos". Los separadores siguen la forma argentina o la inglesa.
const MONTO = /\$\s?(\d[\d.,]*)|(\d[\d.,]*)\s?pesos\b/gi;
const aNumero = (crudo) => {
  const m = crudo.replace(/[.,]+$/, '').match(/^(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?$/);
  return m ? Number(m[1].replace(/[.,]/g, '') + (m[2] ? `.${m[2]}` : '')) : null;
};
export const montosEn = (texto) =>
  [...texto.matchAll(MONTO)].map((m) => aNumero(m[1] ?? m[2])).filter((n) => n !== null);

// "gratuito", "sin costo", "no tiene costo", "no se paga"; no cuentan "no es gratuito" ni "no tiene
// costo informado" (eso es que no se cargó).
const GRATUITO = /(?<!\bno\s(?:es|son)\s)\b(?:gratuit[oa]s?|gratis|sin\s+(?:ningun\s+)?(?:costo|cargo|arancel)(?!\s+(?:informado|cargado|especificado|registrado|indicado|adicional))|no\s+tiene\s+(?:ningun\s+|un\s+)?(?:costo|cargo|arancel)(?!\s+(?:informado|cargado|especificado|registrado|indicado|definido))|no\s+(?:se\s+)?(?:paga|cobra|abona)\b|no\s+hay\s+que\s+pagar|dejo\s+de\s+cobrarse|no\s+requiere\s+(?:ningun\s+)?pago)/;
export const diceGratuito = (oracion) => GRATUITO.test(normalizar(oracion));

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));
const textosDe = (t) => [t.descripcion ?? '', ...(t.requisitos ?? []).map((r) => r.descripcion ?? '')];
// Oraciones del propio trámite que no tienen forma de instrucción para el asistente.
const oracionesConfiables = (t) =>
  textosDe(t)
    .flatMap((texto) => texto.split('\n').flatMap((l) => partirEnOraciones(l).map((o) => o.texto)))
    .filter((o) => !buscarInstruccion(o));

// Montos que respaldan los datos: el costo del trámite y los de sus requisitos; si el trámite no
// tiene costo cargado, también los que escribe su propio texto (por ejemplo "valor $ 25,00").
const montosPermitidos = (tramites) => {
  const montos = new Set();
  for (const t of tramites) {
    const costo = numero(t.costo);
    if (costo !== null && costo > 0) montos.add(costo);
    for (const r of t.requisitos ?? []) if (numero(r.costo) > 0) montos.add(numero(r.costo));
    if (costo === null) for (const o of oracionesConfiables(t)) for (const n of montosEn(o)) montos.add(n);
  }
  return montos;
};

// El costo cargado manda: con un monto, "gratuito" nunca vale, aunque el texto lo diga.
const permiteGratuito = (t) => {
  const costo = numero(t.costo);
  if (costo !== null) return costo === 0;
  return oracionesConfiables(t).some(diceGratuito);
};

const formatearMonto = (n) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const oracionDeCosto = (t) => {
  const costo = numero(t.costo);
  if (costo === null) return `El costo del trámite ${t.nombre} no está cargado: consultalo en una mesa de entrada o en la fuente oficial.`;
  return costo === 0 ? `El trámite ${t.nombre} es gratuito.` : `El costo del trámite ${t.nombre} es ${formatearMonto(costo)}.`;
};

const palabrasDe = (texto) => normalizar(texto).match(/\p{L}{4,}/gu) ?? [];
// El trámite del que habla la oración: el que más palabras de su nombre comparte, o el principal.
const tramiteDeLaOracion = (oracion, tramites) => {
  const enOracion = new Set(palabrasDe(oracion));
  let mejor = tramites[0];
  let puntaje = 0;
  for (const t of tramites) {
    const palabras = palabrasDe(t.nombre);
    const p = palabras.length ? palabras.filter((x) => enOracion.has(x)).length / palabras.length : 0;
    if (p > puntaje) [mejor, puntaje] = [t, p];
  }
  return mejor;
};

// --- Verificador -------------------------------------------------------------------------------

// `tramites`: todos los del contexto (con detalle); `principales`: los que usa la respuesta (el de
// "tramiteId" primero), o vacío. `alCorregir` recibe { capa, original, corregida } (lo usan los
// evals y los tests). Devuelve una función que verifica una línea.
export const crearVerificador = ({ tramites = [], principales = [], alCorregir } = {}) => {
  const conDetalle = tramites.filter((t) => t && !t.sinResolver);
  const referencia = principales.filter(Boolean).length > 0 ? principales.filter(Boolean) : conDetalle;
  const montos = montosPermitidos(conDetalle);

  const corregirOracion = (oracion) => {
    const montosMalos = montosEn(oracion.texto).filter((n) => !montos.has(n));
    const gratuitoMalo = diceGratuito(oracion.texto) && !referencia.some(permiteGratuito);
    if ((montosMalos.length > 0 || gratuitoMalo) && referencia.length > 0) {
      return { capa: 'costo', texto: oracionDeCosto(tramiteDeLaOracion(oracion.texto, referencia)) };
    }
    if (montosMalos.length > 0 || gratuitoMalo) return { capa: 'costo', texto: '' };
    return null;
  };

  return (linea) => {
    const prefijo = linea.match(PREFIJO_DE_LISTA)?.[1] ?? '';
    const oraciones = partirEnOraciones(linea.slice(prefijo.length));
    let cambio = false;
    const salida = [];
    for (const o of oraciones) {
      const correccion = corregirOracion(o);
      if (!correccion) {
        salida.push(o.texto);
        continue;
      }
      cambio = true;
      alCorregir?.({ capa: correccion.capa, original: o.texto.trim(), corregida: correccion.texto });
      if (correccion.texto && !salida.some((s) => s.trim() === correccion.texto)) salida.push(correccion.texto);
    }
    if (!cambio) return linea;
    const cuerpo = salida.map((s) => s.trim()).filter(Boolean).join(' ');
    return cuerpo ? `${prefijo}${cuerpo}` : '';
  };
};
