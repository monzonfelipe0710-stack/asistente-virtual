// Red de seguridad para el idioma: el prompt pide responder siempre en español, pero si el texto
// del modelo sale predominantemente en inglés o en portugués se reemplaza entero. Se cuentan
// palabras funcionales de cada idioma que no existen en español (o que en español son raras), así
// que un nombre en inglés ("Wi-Fi", "Free Shop") o una palabra suelta no alcanzan.
export const MENSAJE_SOLO_ESPANOL = 'Por ahora solo atiendo en español. ¿Te ayudo con algún trámite?';

const INGLES = new Set([
  'the', 'and', 'is', 'are', 'was', 'you', 'your', 'to', 'of', 'for', 'with', 'this', 'that', 'if', 'have',
  'can', 'about', 'any', 'feel', 'free', 'please', 'here', 'i', "i'm", 'we', 'it', 'be', 'on', 'will',
  'would', 'what', 'which', 'there', 'they', 'from', 'or', 'my', 'our', 'an', 'at', 'by', 'do', 'not', 'only',
]);
const PORTUGUES = new Set([
  'você', 'voce', 'não', 'nao', 'é', 'são', 'uma', 'um', 'com', 'do', 'da', 'dos', 'das', 'ao', 'em',
  'isso', 'essa', 'esse', 'seu', 'sua', 'também', 'muito', 'obrigado', 'pode', 'posso', 'qualquer',
  'mais', 'onde', 'quando', 'informações', 'ajudar', 'estou',
]);
// Las del español que no se comparten con el portugués ("de", "que", "para" y "por" sí).
const ESPANOL = new Set([
  'el', 'la', 'los', 'las', 'del', 'y', 'en', 'un', 'una', 'es', 'con', 'su', 'sus', 'lo', 'al', 'más',
  'como', 'hay', 'podés', 'tenés', 'este', 'esta', 'pero', 'le', 'les', 'tu', 'tus', 'muy', 'también',
  'trámite', 'trámites', 'cuando', 'donde', 'dónde', 'información',
]);

const MINIMO = 5;
const PROPORCION = 3;

const contar = (texto) => {
  const palabras = texto.toLocaleLowerCase('es').normalize('NFC').match(/[\p{L}][\p{L}'’]*/gu) ?? [];
  const cuantas = (conjunto) => palabras.filter((p) => conjunto.has(p.replace('’', "'"))).length;
  return { espanol: cuantas(ESPANOL), ingles: cuantas(INGLES), portugues: cuantas(PORTUGUES) };
};

export const esOtroIdioma = (texto) => {
  const { espanol, ingles, portugues } = contar(texto);
  return [ingles, portugues].some((n) => n >= MINIMO && n >= PROPORCION * Math.max(espanol, 1));
};

// Para el streaming: un texto corto que ya se ve en español se puede mandar sin esperar más.
export const pareceEspanol = (texto) => {
  const { espanol, ingles, portugues } = contar(texto);
  return espanol >= 2 && ingles === 0 && portugues === 0;
};
