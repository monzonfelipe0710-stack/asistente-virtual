// Texto de fuentes externas (el importador y la carga manual): se limpia antes de guardarlo y se
// buscan frases con forma de instrucción dirigida al modelo. Ese texto le llega al modelo como
// contexto, así que una descripción no puede traer órdenes para el asistente.

export const TOPES_CAMPOS = {
  nombre: 300,
  descripcion: 10000,
  requisito: 1000,
  dondeSeConsigue: 500,
  mesa: 300,
  localidad: 120,
  documento: 200,
};

const codigos = (lista) => lista.map((c) => (Array.isArray(c) ? `${String.fromCharCode(c[0])}-${String.fromCharCode(c[1])}` : String.fromCharCode(c))).join('');

// Controles C0 y C1 menos el tab y el salto de línea; ancho cero, marcas y overrides de dirección,
// guion suave y BOM.
const CONTROL = new RegExp(`[${codigos([[0x00, 0x08], 0x0b, 0x0c, [0x0e, 0x1f], [0x7f, 0x9f]])}]`, 'g');
const INVISIBLES = new RegExp(`[${codigos([0xad, [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0x2066, 0x2069], 0xfeff])}]`, 'g');
const ESPACIOS = new RegExp(`[\\t${codigos([0xa0, 0x1680, [0x2000, 0x200a], 0x202f, 0x205f, 0x3000])}]`, 'g');

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', laquo: '«', raquo: '»', hellip: '…' };
const decodificarEntidades = (texto) =>
  texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entera, cuerpo) => {
    if (cuerpo[0] === '#') {
      const codigo = cuerpo[1].toLowerCase() === 'x' ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
      return Number.isInteger(codigo) && codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : '';
    }
    return ENTIDADES[cuerpo.toLowerCase()] ?? entera;
  });

const BLOQUES = /<(script|style|noscript|template|iframe|object)\b[\s\S]*?(?:<\/\1\s*>|$)/gi;
const COMENTARIOS = /<!--[\s\S]*?(?:-->|$)/g;
const SALTOS = /<\/?(?:br|p|div|li|tr|h[1-6]|ul|ol|table)\b[^>]*>/gi;
const ETIQUETAS = /<\/?[a-z][^>]*>|<![a-z][^>]*>/gi;

// Las entidades se decodifican y se vuelve a limpiar: "&lt;script&gt;" no sobrevive como etiqueta.
const quitarHtml = (texto) => {
  let anterior;
  let actual = texto;
  for (let vuelta = 0; vuelta < 3 && actual !== anterior; vuelta++) {
    anterior = actual;
    actual = decodificarEntidades(actual.replace(BLOQUES, ' ').replace(COMENTARIOS, ' ').replace(SALTOS, '\n').replace(ETIQUETAS, ' '));
  }
  return actual;
};

const recortar = (texto, tope) => {
  if (texto.length <= tope) return texto;
  const espacio = texto.lastIndexOf(' ', tope - 1);
  return `${texto.slice(0, espacio > tope / 2 ? espacio : tope - 1).trimEnd()}…`;
};

// `multilinea` conserva los saltos de línea (como mucho una línea en blanco seguida); si no, todo
// queda en una línea. Devuelve el texto limpio y si hubo que recortarlo.
export const limpiarTexto = (valor, { tope = Infinity, multilinea = true } = {}) => {
  const limpio = quitarHtml(String(valor ?? '').normalize('NFC'))
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLES, '')
    .replace(CONTROL, '')
    .replace(ESPACIOS, ' ')
    .split('\n')
    .map((linea) => linea.replace(/ {2,}/g, ' ').trim())
    .join(multilinea ? '\n' : ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
  const texto = recortar(limpio, tope);
  return { texto, recortado: texto !== limpio };
};

export const sanitizarTexto = (valor, opciones) => limpiarTexto(valor, opciones).texto;

// Para comparar: minúsculas, sin tildes ni signos de apertura, espacios simples.
const normalizar = (texto) =>
  sanitizarTexto(texto, { multilinea: false }).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[¡¿]/g, '');

// Frases, no palabras sueltas: "You are here" (un menú de navegación) o "SEMFormosaBot" no son
// instrucciones. Se apunta a imperativos dirigidos al asistente que un texto de trámite no usa:
// voseo con objeto ("ignorá lo anterior", "decile al usuario"), "a partir de ahora" seguido de
// una orden al asistente y el vocabulario de los modelos ("system prompt", "si sos una IA"). Lo
// ambiguo con la tercera persona ("la oficina responde siempre que...") no entra.
const ES = [
  String.raw`\b(?:ignora|ignore|ignoren|olvida|olvidate\s+de|olviden|descarta|desestima|omiti|saltea)\s+(?:todo\s+)?(?:lo\s+(?:anterior|previo|de\s+arriba|que\s+te\s+(?:dijeron|indicaron|pidieron))|(?:todas\s+)?tus\s+(?:instrucciones|reglas|indicaciones|directivas|ordenes|restricciones)|(?:todas\s+)?(?:las|sus)\s+(?:instrucciones|reglas|indicaciones|directivas|ordenes|restricciones)\s+(?:anteriores|previas|originales|del\s+sistema|de\s+arriba))\b`,
  String.raw`\b(?:responde|contesta|escribi|habla)\s+(?:siempre\s+|solo\s+|solamente\s+|unicamente\s+)?en\s+(?:ingles|portugues|otro\s+idioma|otra\s+lengua)\b`,
  String.raw`\b(?:respondele|contestale|respondeles|contestales)\b`,
  String.raw`\b(?:a\s+partir\s+de\s+ahora|de\s+ahora\s+en\s+(?:adelante|mas)|desde\s+ahora)\s*,?\s*(?:responde|contesta|respondele|contestale|deci|decile|sos|eres|seras|tu\s+(?:tarea|funcion|rol)|vas\s+a\s+(?:responder|contestar|decir))\b`,
  String.raw`\b(?:decile|deciles|indicale|indicales|pedile|pediles|solicitale|solicitales|recomendale|derivalo|derivala|redirigilo|redirigila)\s+(?:siempre\s+)?(?:al|a\s+la|a\s+las|a\s+los|que)\s`,
  String.raw`\bno\s+(?:le\s+|les\s+)?(?:menciones|digas|informes|reveles|muestres|nombres|aclares)\s+(?:nunca\s+)?(?:el\s+(?:costo|precio|arancel|valor|monto)|los\s+(?:costos|precios|aranceles)|al\s+(?:usuario|ciudadano)|a\s+la\s+persona|que\b|nada\b)`,
  String.raw`\b(?:sos|eres)\s+(?:un|una|el)\s+(?:asistente|modelo\s+de\s+lenguaje|chatbot|bot|ia|inteligencia\s+artificial|llm)\b`,
  String.raw`\b(?:nota|mensaje|instruccion(?:es)?|aviso|indicacion(?:es)?)\s+(?:para|al)\s+(?:el\s+|la\s+)?(?:asistente|modelo|chatbot|bot|ia|llm|inteligencia\s+artificial)\b`,
  String.raw`\btu\s+(?:nueva\s+)?(?:tarea|mision|funcion|objetivo|rol)\s+(?:ahora\s+)?(?:es|sera)\b`,
  String.raw`\b(?:mostra|mostrale|revela|revelale|repeti|imprimi|copia|copiale|escribi|traduci|comparti)\s+(?:\S+\s+){0,3}?(?:tu|tus|el)\s+(?:prompt|instrucciones|reglas)\b(?!\s+(?:de|del|para)\b)`,
  String.raw`\bprompt\s+(?:del|de)\s+sistema\b`,
];
// El voseo con tilde es imperativo sin ambigüedad: "respondé siempre", "contestá solo".
const ES_CON_TILDE = [
  String.raw`(?:^|[^\p{L}])(?:respondé|contestá|respondele|contestale)\s+(?:siempre|solamente|únicamente|sólo|solo|exclusivamente)(?![\p{L}])`,
  String.raw`(?:^|[^\p{L}])(?:ignorá|olvidá|descartá|desestimá|omití)\s+(?:todo\s+)?(?:lo\s+anterior|lo\s+previo|lo\s+de\s+arriba)(?![\p{L}])`,
];
const EN = [
  String.raw`\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:of\s+)?(?:the\s+|your\s+|my\s+)?(?:previous|prior|above|earlier|preceding|original|system)\s+(?:\w+\s+)?(?:instructions|prompts?|messages?|rules|directions|guidelines|text)\b`,
  String.raw`\b(?:ignore|forget|disregard)\s+(?:all\s+)?your\s+(?:instructions|rules|guidelines|prompt)\b`,
  String.raw`\b(?:always|only)\s+(?:respond|reply|answer)\s+(?:in|with)\b|\b(?:respond|reply|answer)\s+(?:only\s+)?(?:in|with)\s+(?:english|portuguese|spanish|another\s+language)\b`,
  String.raw`\bfrom\s+now\s+on\s*,?\s*(?:you|respond|reply|answer|always|never|act)\b`,
  String.raw`\b(?:if\s+)?you\s+are\s+(?:now\s+)?(?:an?\s+)?(?:ai|large\s+language\s+model|language\s+model|llm|chatbot|virtual\s+assistant|ai\s+assistant)\b`,
  String.raw`\b(?:do\s+not|don't|never)\s+(?:mention|reveal|tell|disclose|show|say)\s+(?:the\s+)?(?:user|cost|price|fee|that)\b`,
  String.raw`\b(?:tell|ask|instruct|direct|redirect|send)\s+the\s+user\s+(?:to|for|that)\b`,
  String.raw`\bsystem\s?prompt\b|\bnew\s+instructions\s*:`,
  String.raw`\b(?:note|message|instructions?)\s+(?:to|for)\s+(?:the\s+)?(?:ai|assistant|model|chatbot|llm)\b`,
];
const PT = [
  String.raw`\b(?:ignore|esqueca|esquece|desconsidere|descarte)\s+(?:todas\s+)?(?:as\s+)?(?:suas\s+)?(?:instrucoes|regras|orientacoes|diretrizes)\b`,
  String.raw`\b(?:ignore|esqueca|desconsidere)\s+(?:tudo\s+)?o\s+que\s+(?:foi\s+dito|esta\s+acima|vem\s+antes)\b`,
  String.raw`\bresponda\s+(?:sempre|somente|apenas)\b`,
  String.raw`\ba\s+partir\s+de\s+agora\s*,?\s*(?:voce|responda|seja|sempre|nunca|aja)\b`,
  String.raw`\bnao\s+(?:mencione|revele|informe|diga|mostre)\s+(?:o\s+(?:custo|preco|valor)|ao\s+usuario|que\b)`,
  String.raw`\b(?:se\s+)?voce\s+e\s+(?:um|uma)\s+(?:ia|assistente|modelo\s+de\s+linguagem|chatbot)\b`,
  String.raw`\bprompt\s+do\s+sistema\b`,
];
const ROLES = /(?:^|\n)\s*(?:system|assistant|developer)\s*:\s*\S|<\|(?:im_start|im_end|im_sep|system|user|assistant|endoftext)\|>|\[\/?inst\]|<<\/?sys>>/;

const PATRONES = [
  ...ES.map((fuente) => ({ idioma: 'es', regex: new RegExp(fuente) })),
  ...EN.map((fuente) => ({ idioma: 'en', regex: new RegExp(fuente) })),
  ...PT.map((fuente) => ({ idioma: 'pt', regex: new RegExp(fuente) })),
];
const PATRONES_CON_TILDE = ES_CON_TILDE.map((fuente) => ({ idioma: 'es', regex: new RegExp(fuente, 'u') }));

// La primera frase con forma de instrucción para el modelo, o null.
export const buscarInstruccion = (texto) => {
  const crudo = String(texto ?? '');
  const rol = sanitizarTexto(crudo).toLowerCase().match(ROLES);
  if (rol) return { idioma: 'rol', frase: rol[0].trim() };
  const conTilde = sanitizarTexto(crudo, { multilinea: false }).toLowerCase();
  const normalizado = normalizar(crudo);
  for (const [texto, patrones] of [[conTilde, PATRONES_CON_TILDE], [normalizado, PATRONES]]) {
    for (const { idioma, regex } of patrones) {
      const m = texto.match(regex);
      if (m) return { idioma, frase: m[0].replace(/^[^\p{L}]+/u, '').trim() };
    }
  }
  return null;
};

// Las frases sospechosas de cada campo: [{ campo, frase, idioma }].
export const instruccionesEn = (campos) =>
  Object.entries(campos).flatMap(([campo, valor]) => {
    const hallazgo = valor ? buscarInstruccion(valor) : null;
    return hallazgo ? [{ campo, ...hallazgo }] : [];
  });
