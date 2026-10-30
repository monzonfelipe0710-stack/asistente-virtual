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

// Cada palabra tipeada del nombre tiene que estar en el nombre del padrón, y lo
// mismo con el apellido. Permite escribir solo parte de un nombre compuesto o en
// otro orden, sin tildes y en cualquier combinación de mayúsculas.
export const coincideConPadron = (tipeado, padron) =>
  todasIncluidas(tipeado.nombre, padron.nombre) && todasIncluidas(tipeado.apellido, padron.apellido);
