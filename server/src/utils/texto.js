const FIN_DE_ORACION = /[.!?…\n]/;

// Posición justo después del último fin de oración dentro de los primeros `limite`
// caracteres; 0 si no hay ninguno.
export const finDeUltimaOracion = (texto, limite = texto.length) => {
  for (let i = Math.min(limite, texto.length) - 1; i >= 0; i--) {
    if (FIN_DE_ORACION.test(texto[i])) return i + 1;
  }
  return 0;
};

// Corta en la última oración completa que entra en el tope. Si no hay ninguna, en la
// última palabra completa, con "…".
export const cortarEnOracion = (texto, tope) => {
  if (texto.length <= tope) return texto;
  const corte = finDeUltimaOracion(texto, tope);
  if (corte > 0) return texto.slice(0, corte).trimEnd();
  const espacio = texto.lastIndexOf(' ', tope - 1);
  return `${texto.slice(0, espacio > 0 ? espacio : tope - 1).trimEnd()}…`;
};

// Recorta un texto largo con "…": en el último fin de oración seguido de un espacio (así no corta
// "1.500") si deja al menos la mitad del tope, y si no en la última palabra completa.
export const recortarEnOracion = (texto, tope) => {
  if (texto.length <= tope) return texto;
  const fines = [...texto.slice(0, tope + 1).matchAll(/[.!?…](?=\s)|\n/g)].map((m) => m.index + 1);
  let corte = fines.at(-1) ?? 0;
  if (corte < tope / 2) {
    const espacio = texto.lastIndexOf(' ', tope);
    corte = espacio > 0 ? espacio : tope;
  }
  return `${texto.slice(0, corte).trimEnd()}…`;
};

// Junta los renglones con "; " mientras entren en el tope, sin partir ninguno (un renglón es un ítem
// con su monto). Devuelve el texto y cuántos renglones quedaron afuera.
export const juntarRenglones = (texto, tope, separador = '; ') => {
  const renglones = texto.split('\n').map((r) => r.trim()).filter(Boolean);
  const entran = [];
  let largo = 0;
  for (const renglon of renglones) {
    const conEste = largo + (entran.length > 0 ? separador.length : 0) + renglon.length;
    if (conEste > tope) break;
    entran.push(renglon);
    largo = conEste;
  }
  return { texto: entran.join(separador), faltan: renglones.length - entran.length };
};

export const normalizarNombre = (nombre) =>
  String(nombre ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
