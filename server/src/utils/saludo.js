const SALUDO_POR_DEFECTO = 'Hola';
const LARGO_MAXIMO = 30;

// Agradecimientos y despedidas no son saludo de entrada: no se antepone "¡Gracias!" a la respuesta.
const NO_SON_SALUDO = /^(muchas\s+)?gracias$|^chau$|^adi[oó]s$|^hasta\s+(luego|pronto|mañana)$|^nos\s+vemos$/i;

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const conMayuscula = (texto) => texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);

// Lo que devuelve el modelo, sin los signos que agrega componerSaludo. "" si no hubo saludo;
// "Hola" si trae algo que no sea letras, espacios o ¿¡, o si es demasiado largo.
export const sanitizarSaludo = (saludo) => {
  const limpio = String(saludo ?? '')
    .normalize('NFC')
    .trim()
    .replace(/^¡+/, '')
    .replace(/[!.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!limpio || NO_SON_SALUDO.test(limpio)) return '';
  if (limpio.length > LARGO_MAXIMO || !/^[\p{L} ¿¡]+$/u.test(limpio)) return SALUDO_POR_DEFECTO;
  return conMayuscula(limpio);
};

export const componerSaludo = (saludo, nombre) => (saludo ? `¡${saludo}${nombre ? `, ${nombre}` : ''}! ` : '');

const sinTildes = (texto) => texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const SALUDO_EN_MENSAJE = /(?<![\p{L}\p{N}])(hola|buen dia|buenos dias|buenas|que tal|saludos)(?![\p{L}\p{N}])/u;

// El servidor solo saluda si la persona saludó, aunque el modelo haya devuelto un saludo.
export const contieneSaludo = (mensaje) => SALUDO_EN_MENSAJE.test(sinTildes(String(mensaje ?? '')));

const SALUDOS = String.raw`hola|buen\s+d[ií]a|buenos\s+d[ií]as|buenas(?:\s+(?:tardes|noches))?|qu[eé]\s+tal|saludos`;
const MAXIMO_SALUDOS_INICIALES = 2;

// El saludo lo pone el servidor: si el modelo igual empieza el cuerpo con uno o dos ("¡Buenas!
// ¡Hola!"), se sacan. Solo cuentan si los sigue un signo: "Buenas noticias" no es un saludo.
export const quitarSaludosIniciales = (texto, saludo = '') => {
  const alternativas = saludo ? `${SALUDOS}|${escaparRegex(saludo)}` : SALUDOS;
  const patron = new RegExp(String.raw`^[¡¿]?\s*(?:${alternativas})\s*[!.,?]+\s*`, 'iu');
  let sinSaludo = texto;
  for (let i = 0; i < MAXIMO_SALUDOS_INICIALES; i++) sinSaludo = sinSaludo.replace(patron, '');
  return sinSaludo === texto ? texto : conMayuscula(sinSaludo);
};

// Un mensaje hecho solo de saludos, agradecimientos, despedidas o un "ok": se contesta con una frase
// amable y breve, sin trámites. Si el mensaje trae cualquier otra palabra, null.
const PALABRAS_DE_CORTESIA = {
  gracias: ['gracias', 'muchas', 'muchisimas', 'mil', 'genio', 'genia'],
  despedida: ['chau', 'chao', 'adios', 'hasta', 'luego', 'pronto', 'manana', 'nos', 'vemos'],
  // "sí", "dale" o "claro" no: después de una pregunta del asistente son una respuesta.
  acuerdo: ['ok', 'okey', 'oka', 'okay', 'listo', 'perfecto', 'genial', 'buenisimo', 'joya', 'barbaro', 'entendido'],
  saludo: ['hola', 'buenas', 'buen', 'buenos', 'dia', 'dias', 'tardes', 'noches', 'que', 'tal', 'saludos'],
};
const CATEGORIA_DE = new Map(Object.entries(PALABRAS_DE_CORTESIA).flatMap(([categoria, palabras]) => palabras.map((p) => [p, categoria])));
const RESPUESTA_DE_CORTESIA = {
  gracias: '¡De nada! Cuando quieras, preguntame por otro trámite.',
  despedida: '¡Que andes bien! Cuando necesites, preguntame por un trámite.',
  acuerdo: '¡Listo! Si necesitás algo más, preguntame por un trámite.',
  saludo: '¿En qué trámite te puedo ayudar?',
};

// Devuelve { texto, saludo } (el saludo, si el mensaje saluda, para componerlo con el nombre).
export const respuestaDeCortesia = (mensaje) => {
  const palabras = sinTildes(String(mensaje ?? '')).match(/\p{L}+/gu) ?? [];
  if (palabras.length === 0 || palabras.length > 6 || !palabras.every((p) => CATEGORIA_DE.has(p))) return null;
  const categorias = new Set(palabras.map((p) => CATEGORIA_DE.get(p)));
  const categoria = ['gracias', 'despedida', 'acuerdo', 'saludo'].find((c) => categorias.has(c));
  // "buen" o "tardes" sueltos, sin un saludo entero, no alcanzan.
  if (categoria === 'saludo' && !SALUDO_EN_MENSAJE.test(sinTildes(mensaje))) return null;
  return { texto: RESPUESTA_DE_CORTESIA[categoria], saludo: categorias.has('saludo') ? saludoDe(sinTildes(mensaje)) : '' };
};
const SALUDOS_DE_CORTESIA = [[/buen(?:os)? dias?/, 'Buen día'], [/buenas tardes/, 'Buenas tardes'], [/buenas noches/, 'Buenas noches'], [/buenas/, 'Buenas']];
const saludoDe = (texto) => SALUDOS_DE_CORTESIA.find(([patron]) => patron.test(texto))?.[1] ?? 'Hola';
