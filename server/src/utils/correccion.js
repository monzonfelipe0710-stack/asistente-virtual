// Corrección de errores de tipeo para la parte léxica de la búsqueda: "psporte" no comparte raíz con
// "pasaporte" y el embedding de la palabra mal escrita queda lejos, así que el trámite no llegaba.
// El vocabulario son las palabras de los nombres de los trámites publicados. Una palabra de la
// consulta que no está en el vocabulario se compara con él; la más cercana (1 edición con 5 o 6
// letras, 2 con 7 o más; una transposición cuenta como 1) se agrega al texto, sin sacar la original.

export const normalizarPalabra = (texto) => texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
export const palabrasDe = (texto) => normalizarPalabra(texto).match(/\p{L}+/gu) ?? [];

// Palabras comunes de una consulta: no son errores de un nombre de trámite.
const COMUNES = new Set([
  'hola', 'buenas', 'buenos', 'buen', 'gracias', 'favor', 'porque', 'donde', 'cuando', 'cuanto', 'cuanta',
  'cuantos', 'cuantas', 'quiero', 'queria', 'necesito', 'necesitaria', 'tengo', 'puedo', 'podria', 'sacar',
  'hacer', 'tramitar', 'tramite', 'tramites', 'sobre', 'entre', 'desde', 'hasta', 'tiene', 'tienen', 'saber',
  'quisiera', 'informacion', 'decime', 'dime', 'cuesta', 'sale', 'renovar', 'pedir', 'solicitar', 'obtener',
  'urgente', 'ahora', 'tarde', 'noches', 'mucho', 'todos', 'todas', 'algun', 'alguna', 'otro', 'otra',
]);

const MISMO_SONIDO = [new Set(['s', 'c', 'z']), new Set(['b', 'v'])];
const empiezaIgual = (a, b) => a[0] === b[0] || MISMO_SONIDO.some((g) => g.has(a[0]) && g.has(b[0]));

// Distancia de edición con transposiciones de letras vecinas (Damerau, versión restringida).
export const distancia = (a, b, tope = Infinity) => {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimo = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      minimo = Math.min(minimo, d[i][j]);
    }
    if (minimo > tope) return tope + 1;
  }
  return d[a.length][b.length];
};

export const crearVocabulario = (nombres) => new Set(nombres.flatMap(palabrasDe).filter((p) => p.length >= 4));

const toleranciaPara = (palabra) => (palabra.length >= 7 ? 2 : palabra.length >= 5 ? 1 : 0);

// Las correcciones de una palabra: las del vocabulario a la menor distancia (como mucho dos).
export const corregirPalabra = (palabra, vocabulario) => {
  const tolerancia = toleranciaPara(palabra);
  if (tolerancia === 0 || vocabulario.has(palabra) || COMUNES.has(palabra)) return [];
  let mejor = tolerancia + 1;
  let cercanas = [];
  for (const candidata of vocabulario) {
    if (!empiezaIgual(palabra, candidata)) continue;
    const d = distancia(palabra, candidata, Math.min(tolerancia, mejor));
    if (d < mejor) [mejor, cercanas] = [d, [candidata]];
    else if (d === mejor) cercanas.push(candidata);
  }
  return mejor <= tolerancia ? cercanas.slice(0, 2) : [];
};

// El texto para la parte léxica: el original y, al final, las correcciones.
export const textoLexico = (texto, vocabulario) => {
  const correcciones = [...new Set(palabrasDe(texto).flatMap((p) => corregirPalabra(p, vocabulario)))];
  return correcciones.length > 0 ? `${texto} ${correcciones.join(' ')}` : texto;
};
