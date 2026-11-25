import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Sinónimos curados a mano para la búsqueda del chat (ver server/README.md, "Sinónimos de
// búsqueda"). Nunca toca el texto que ve la persona ni el historial: solo se usa para buscar.
const archivo = join(dirname(fileURLToPath(import.meta.url)), '../data/sinonimos-curados.json');
export const GRUPOS_SINONIMOS = JSON.parse(readFileSync(archivo, 'utf-8')).grupos;

// Rango Unicode de las marcas de combinación (0x0300 a 0x036f), sin escribirlas literalmente.
const MARCAS_DE_COMBINACION = new RegExp(`[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`, 'g');
const sinAcentos = (texto) => texto.normalize('NFD').replace(MARCAS_DE_COMBINACION, '');
const normalizar = (palabra) => sinAcentos(palabra).toLowerCase();

const palabrasDe = (texto) => (texto.match(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/g) ?? []).map(normalizar);

// Un grupo se activa cuando aparece (como palabra completa, sin importar mayúsculas ni tildes)
// alguno de sus `terminos` y, si tiene `requiere`, también alguna de esas palabras de contexto.
// Al activarse agrega al final los `terminos` que no estén ya presentes. El `requiere` evita
// contaminar consultas ajenas: "partida"/"acta"/"certificado" solo cruzan entre sí cuando el
// mensaje habla de "nacimiento", nunca en "certificado de antecedentes" ni "acta de matrimonio".
// Sin ninguna activación, devuelve `texto` sin cambios.
export const expandirConSinonimos = (texto) => {
  const palabras = new Set(palabrasDe(texto));
  const extras = [];
  for (const grupo of GRUPOS_SINONIMOS) {
    const normalizados = grupo.terminos.map(normalizar);
    const requiere = (grupo.requiere ?? []).map(normalizar);
    const hayTermino = normalizados.some((t) => palabras.has(t));
    const hayContexto = requiere.length === 0 || requiere.some((t) => palabras.has(t));
    if (!hayTermino || !hayContexto) continue;
    for (const [i, t] of normalizados.entries()) {
      if (!palabras.has(t) && !extras.includes(grupo.terminos[i])) extras.push(grupo.terminos[i]);
    }
  }
  return extras.length ? `${texto} ${extras.join(' ')}` : texto;
};
