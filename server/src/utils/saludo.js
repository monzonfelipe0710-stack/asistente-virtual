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
