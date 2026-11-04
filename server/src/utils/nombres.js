const palabras = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const todasIncluidas = (tipeado, padron) => {
  const tipeadas = palabras(tipeado);
  const delPadron = new Set(palabras(padron));
  return tipeadas.length > 0 && tipeadas.every((p) => delPadron.has(p));
};

// "MARÍA JOSÉ GÓMEZ" → "María". null si no hay una primera palabra con letras.
export const primerNombre = (nombreCompleto) => {
  const [primera] = String(nombreCompleto ?? '').trim().split(/\s+/);
  if (!primera || !/\p{L}/u.test(primera)) return null;
  return primera
    .toLocaleLowerCase('es')
    .split('-')
    .map((parte) => parte.charAt(0).toLocaleUpperCase('es') + parte.slice(1))
    .join('-');
};

// Cada palabra tipeada del nombre tiene que estar en el nombre del padrón, y lo
// mismo con el apellido. Permite escribir solo parte de un nombre compuesto o en
// otro orden, sin tildes y en cualquier combinación de mayúsculas.
export const coincideConPadron = (tipeado, padron) =>
  todasIncluidas(tipeado.nombre, padron.nombre) && todasIncluidas(tipeado.apellido, padron.apellido);
