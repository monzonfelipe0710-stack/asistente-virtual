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

// Por si el modelo igual empieza el cuerpo con el saludo que ya agrega el servidor.
export const quitarSaludoRepetido = (texto, saludo) => {
  if (!saludo) return texto;
  const patron = new RegExp(`^¡?\\s*${escaparRegex(saludo)}\\s*[!.,]+\\s*`, 'iu');
  const sinSaludo = texto.replace(patron, '');
  return sinSaludo === texto ? texto : conMayuscula(sinSaludo);
};
