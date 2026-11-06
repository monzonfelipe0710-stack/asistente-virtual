// Los enlaces del chat los pone el servidor: los que escribe el modelo se sacan (podrían ser
// inventados) y se agregan los de la fuente oficial de cada trámite usado.

export const ENLACE_MARKDOWN = String.raw`!?\[[^\]\n]*\]\([^)\n]*\)`;
export const URL_SUELTA =String.raw`<?(?:https?:\/\/|www\.)[^\s<>()\[\]]*[^\s<>()\[\].,;:!?]>?`;

// Con el enlace se va el ":" que lo anunciaba: "consultá la fuente oficial: [x](url)." queda
// "consultá la fuente oficial.".
const ENLACE = new RegExp(String.raw`[ \t]*:?[ \t]*(?:${ENLACE_MARKDOWN}|${URL_SUELTA})`, 'gi');

export const quitarEnlaces = (texto) => texto.replace(ENLACE, '');

// Parte el texto en pedazos: los de índice impar son enlaces o URL, los pares, el resto.
export const separarEnlaces = (texto) => texto.split(new RegExp(`(${ENLACE_MARKDOWN}|${URL_SUELTA})`, 'i'));

export const esUrlHttp = (url) => {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const escaparTextoDeEnlace = (texto) => texto.replace(/[[\]\\]/g, '\\$&');
const escaparUrl = (url) => new URL(url).href.replace(/\(/g, '%28').replace(/\)/g, '%29');

// Una línea por trámite con fuente http(s); "" si ninguno tiene.
export const componerFuentes = (tramites) =>
  tramites
    .filter((t) => t.fuenteUrl && esUrlHttp(t.fuenteUrl))
    .map((t) => `[Fuente oficial: ${escaparTextoDeEnlace(t.nombre)}](${escaparUrl(t.fuenteUrl)})`)
    .join('\n');

export const conFuentes = (cuerpo, tramites) => {
  const fuentes = componerFuentes(tramites);
  if (!fuentes) return cuerpo;
  return cuerpo ? `${cuerpo}\n\n${fuentes}` : fuentes;
};
