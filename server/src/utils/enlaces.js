// Los enlaces del chat los pone el servidor: los que escribe el modelo se sacan (podrían ser
// inventados) y se agregan los de la fuente oficial de cada trámite usado.

export const ENLACE_MARKDOWN = String.raw`!?\[[^\]\n]*\]\([^)\n]*\)`;
export const URL_SUELTA =String.raw`<?(?:https?:\/\/|www\.)[^\s<>()\[\]]*[^\s<>()\[\].,;:!?]>?`;
// Un dominio sin "www" ni "http" ("pagos-formosa.example.org") también es un enlace: el modelo lo
// copia así de la descripción. No cuenta el de un correo ("registrocivil@formosa.gob.ar").
export const DOMINIO_SUELTO = String.raw`(?<![@\w.\/-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|io|info|online|site|app|xyz|ar)(?:\/[^\s<>()\[\]]*[^\s<>()\[\].,;:!?])?(?![\w@-])`;

// Con el enlace se va el ":" que lo anunciaba: "consultá la fuente oficial: [x](url)." queda
// "consultá la fuente oficial.".
const ENLACE = new RegExp(String.raw`[ \t]*:?[ \t]*(?:${ENLACE_MARKDOWN}|${URL_SUELTA})`, 'gi');

// Los que quitarEnlaces saca. Un dominio suelto queda: la verificación ya comprobó que es oficial.
const SE_QUITA = new RegExp(String.raw`^(?:${ENLACE_MARKDOWN}|${URL_SUELTA})$`, 'i');
export const seQuitaDelTexto = (enlace) => SE_QUITA.test(enlace);

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
