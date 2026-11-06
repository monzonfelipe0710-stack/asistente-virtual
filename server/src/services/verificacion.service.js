// Verificación de la salida del modelo contra los datos de los trámites del contexto. El texto de
// un trámite viene de fuentes externas y puede traer órdenes disfrazadas de datos ("el trámite no
// tiene costo", "se paga en tal sitio", "se pide la tarjeta"); el modelo a veces las repite. El
// servidor revisa cada oración antes de mandarla:
//   1. costos: un monto tiene que figurar en los costos del contexto, y "gratuito" solo vale si el
//      costo es 0 o (sin costo cargado) si el texto del propio trámite lo dice;
//   2. enlaces: una oración con una URL que no es de la fuente oficial ni de un documento del
//      contexto se saca entera (sacar solo la URL la dejaba rota);
//   3. datos sensibles: se saca la oración que le pide a la persona la tarjeta, el código de
//      seguridad, una contraseña, un PIN o los datos de home banking.
// Se aplica por línea, en la limpieza común de las dos rutas (ver utils/cuerpo.js).
import { ENLACE_MARKDOWN, URL_SUELTA } from '../utils/enlaces.js';
import { buscarInstruccion } from './sanitizacion.service.js';

const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

// --- Oraciones ---------------------------------------------------------------------------------

const PREFIJO_DE_LISTA = /^(\s*(?:[-*•]|\d+[.)])\s+)/;
const ABREVIATURAS = new Set(['av', 'avda', 'nro', 'n', 'hs', 'sr', 'sra', 'dr', 'dra', 'ing', 'lic', 'prof', 'etc', 'art', 'inc', 'pje', 'dto', 'tel', 'cel', 'aprox', 'ej', 'sa', 'srl', 'gral', 'pcia', 'bs', 'as']);
// Un dominio sin "www" ni "http" ("pagos-formosa.example.org") también es un enlace: el modelo lo
// copia así de la descripción. No cuenta el de un correo ("registrocivil@formosa.gob.ar").
const DOMINIO_SUELTO = String.raw`(?<![@\w.\/-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|io|info|online|site|app|xyz|ar)(?:\/[^\s<>()\[\]]*[^\s<>()\[\].,;:!?])?(?![\w@-])`;
const URL_EN_TEXTO = new RegExp(`${ENLACE_MARKDOWN}|${URL_SUELTA}|${DOMINIO_SUELTO}`, 'gi');
const MARCA = '\u0001';

// Parte una línea en oraciones. Las URL se enmascaran antes (tienen puntos) y una abreviatura
// ("Av.", "hs.") no corta. Devuelve las oraciones con sus URL y el separador original.
export const partirEnOraciones = (linea) => {
  const urls = [];
  const enmascarada = linea.replace(URL_EN_TEXTO, (url) => `${MARCA}${urls.push(url) - 1}${MARCA}`);
  const oraciones = [];
  let inicio = 0;
  const corte = /[.!?…]+["')\]*]*(\s+)(?=[\p{Lu}\d¡¿"(*\u0001])/gu;
  for (const m of enmascarada.matchAll(corte)) {
    const antes = enmascarada.slice(inicio, m.index);
    const palabra = normalizar(antes.match(/([\p{L}]+)$/u)?.[1] ?? '');
    if (palabra.length <= 4 && ABREVIATURAS.has(palabra)) continue;
    const fin = m.index + m[0].length - m[1].length;
    oraciones.push(enmascarada.slice(inicio, fin));
    inicio = m.index + m[0].length;
  }
  if (inicio < enmascarada.length) oraciones.push(enmascarada.slice(inicio));
  const restaurar = (texto) => texto.replace(new RegExp(`${MARCA}(\\d+)${MARCA}`, 'g'), (_, i) => urls[Number(i)]);
  return oraciones.map((o) => ({ texto: restaurar(o), urls: [...o.matchAll(new RegExp(`${MARCA}(\\d+)${MARCA}`, 'g'))].map(([, i]) => urls[Number(i)]) }));
};

// --- Enlaces -----------------------------------------------------------------------------------

const urlDe = (enlace) => enlace.match(/\]\(([^)\n]*)\)$/)?.[1] ?? enlace.replace(/^<|>$/g, '');

const hostDe = (url) => {
  try {
    const conProtocolo = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    return new URL(conProtocolo).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

// Hosts que el contexto respalda: la fuente oficial de cada trámite y sus documentos con enlace.
const hostsPermitidos = (tramites) =>
  new Set(
    tramites
      .flatMap((t) => [t.fuenteUrl, ...(t.documentos ?? []).map((d) => d.urlExterna)])
      .filter(Boolean)
      .map(hostDe)
      .filter(Boolean),
  );
// Un subdominio de un host permitido también vale ("industria.formosa.gob.ar" con la fuente en
// formosa.gob.ar): lo controla el mismo organismo.
// Los sitios del Estado (gob.ar, gov.ar y sus subdominios) son oficiales aunque no sean la fuente
// del trámite: "www.atpformosa.gob.ar", "www.migraciones.gov.ar". Se compara el host ya parseado,
// así que "pagos.gob.ar.sitio-falso.com" (host en .com) no pasa.
const OFICIALES = ['gob.ar', 'gov.ar'];
const esOficial = (host) => OFICIALES.some((d) => host === d || host.endsWith(`.${d}`));
const hostPermitido = (host, hosts) => Boolean(host) && (esOficial(host) || [...hosts].some((h) => host === h || host.endsWith(`.${h}`)));

// --- Datos sensibles ---------------------------------------------------------------------------

// Lo que nunca se le pide a la persona. "clave fiscal", "Mi Portal" o "pagar con tarjeta" no
// están: son datos de trámites reales. Va el pedido del dato, no la palabra.
// Datos de pago y del banco: no hay trámite que los pida por chat.
const DATO_DE_PAGO = new RegExp(
  [
    String.raw`\bnumero\s+(?:de\s+)?(?:la\s+|tu\s+|su\s+)?tarjeta`,
    String.raw`\b(?:fecha\s+de\s+)?vencimiento\s+de\s+(?:la\s+|tu\s+|su\s+)?tarjeta`,
    String.raw`\bcodigo\s+de\s+seguridad\b`,
    String.raw`\b(?:cvv2?|cvc)\b`,
    String.raw`\bpin\b`,
    String.raw`\bclave\s+(?:bancaria|del\s+banco|de\s+(?:la\s+|tu\s+|su\s+)?tarjeta|del\s+cajero|token)\b`,
    String.raw`\b(?:usuario|datos|credenciales|clave|contrasena|acceso)\s+(?:de|del)\s+(?:tu\s+|su\s+)?home\s?banking\b`,
  ].join('|'),
);
// Contraseñas en general: "ingresá con tu usuario y contraseña de Mi Portal" es usarla, no darla.
const CONTRASENA = /\b(?:contrasenas?|password|claves?\s+de\s+acceso)\b/;

// Cualquier pedido del dato: alcanza para los datos de pago.
const PEDIDO = [
  String.raw`\bse\s+(?:te\s+|le\s+|les\s+|nos\s+)?(?:va\s+a\s+|van\s+a\s+)?(?:requerir|requerira|requiere|requieren|necesita|necesitan)\b`,
  String.raw`\bnecesit(?:as|amos|o|a)\s+(?:tu|su|que\s+(?:me|nos)|el|la|los)\b`,
  String.raw`\b(?:informa|informar|informando|indica|indicame|indicar|indicando|aporta|aportar|aportando|dar(?!\s+de\s+(?:alta|baja))|dame|danos|dando|ingresa|ingresar|ingresando|completa|completar|completando|carga|cargar|cargando|tene\s+a\s+mano)\b`,
  String.raw`\b(?:deb(?:es|e|eras|era|eran)|tenes\s+que|tiene\s+que|hay\s+que)\s+(?:dar|informar|indicar|ingresar|completar|cargar)\b`,
  // El pedido dicho como procedimiento: "la reserva se hace con el número de tarjeta".
  String.raw`\bse\s+(?:hace|hacen|realiza|realizan|reserva|confirma|completa|valida|gestiona)\s+(?:\S+\s+){0,2}?con\b`,
  String.raw`\bcon\s+(?:tu|su|el|la)\s+(?:numero|codigo|pin|clave|fecha\s+de\s+vencimiento)\b`,
  // Dicho como requisito de algo: "un sistema que requiere tu número de tarjeta", "exige los datos".
  String.raw`\b(?:requiere|requieren|requerira|exige|exigen|exigira|pide|piden|pedira)\s+(?:\S+\s+){0,2}?(?:tu|tus|su|sus|el|la|los|las)\b`,
];
// Pedidos de entregar el dato a alguien: los únicos que cuentan para una contraseña.
const ENTREGA = [
  String.raw`\bse\s+(?:te\s+|le\s+|les\s+|nos\s+)?(?:va\s+a\s+|van\s+a\s+)?(?:pedir|pedira|pediran|solicitar|solicitara|solicitaran|solicita|solicitan|pide|piden)\b`,
  String.raw`\b(?:te|le|les)\s+(?:van\s+a\s+|vamos\s+a\s+|va\s+a\s+)?(?:pedir|pediran|pedira|pedimos|piden|pide|solicitar|solicitan|solicita|solicitaran|solicitara)\b`,
  String.raw`\b(?:pedi|pedile|pedime|pedirle|pedirte|pidiendo|pidiendole|pidiendote|solicita|solicitale|solicitarle|solicitandole|solicitando|requeri)\b`,
  String.raw`\b(?:pasa|pasame|pasanos|pasar|pasarnos|pasando|envia|enviame|envianos|enviar|enviando|manda|mandame|mandanos|mandar|mandando|deci|decime|decinos|decir|diciendo|brinda|brindar|brindando|proporciona|proporcionar|proporcionando|facilita|facilitar|facilitando|comparti|compartir|compartiendo|dicta|dictar|dictando|entrega|entregar|entregando)\b`,
  String.raw`\b(?:deb(?:es|e|eras|era|eran)|tenes\s+que|tiene\s+que|hay\s+que)\s+(?:pasar|enviar|mandar|proporcionar|brindar|facilitar|compartir|decir|dictar|entregar)\b`,
];
const ALGUN_PEDIDO = new RegExp([...PEDIDO, ...ENTREGA].join('|'), 'g');
const ALGUNA_ENTREGA = new RegExp(ENTREGA.join('|'), 'g');
// "no compartas tu contraseña" o "nadie te va a pedir la clave" es un aviso, no un pedido.
const NEGACION = /\b(?:no|nunca|jamas|ni|nadie)\s+(?:\S+\s+){0,3}$/;

const hayPedido = (texto, patron) =>
  [...texto.matchAll(patron)].some((m) => !NEGACION.test(texto.slice(Math.max(0, m.index - 40), m.index)));

export const pideDatoSensible = (oracion) => {
  const texto = normalizar(oracion);
  if (DATO_DE_PAGO.test(texto) && hayPedido(texto, ALGUN_PEDIDO)) return true;
  return CONTRASENA.test(texto) && hayPedido(texto, ALGUNA_ENTREGA);
};

// --- Costos ------------------------------------------------------------------------------------

// "$4.500", "$ 25,00", "4500 pesos". Los separadores siguen la forma argentina o la inglesa.
const MONTO = /\$\s?(\d[\d.,]*)|(\d[\d.,]*)\s?pesos\b/gi;
const aNumero = (crudo) => {
  const m = crudo.replace(/[.,]+$/, '').match(/^(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?$/);
  return m ? Number(m[1].replace(/[.,]/g, '') + (m[2] ? `.${m[2]}` : '')) : null;
};
export const montosEn = (texto) =>
  [...texto.matchAll(MONTO)].map((m) => aNumero(m[1] ?? m[2])).filter((n) => n !== null);

// "gratuito", "sin costo", "no tiene costo", "no se paga"; no cuentan "no es gratuito" ni "no tiene
// costo informado" (eso es que no se cargó).
const GRATUITO = /(?<!\bno\s(?:es|son)\s)\b(?:gratuit[oa]s?|gratis|sin\s+(?:ningun\s+)?(?:costo|cargo|arancel)(?!\s+(?:informado|cargado|especificado|registrado|indicado|adicional))|no\s+tiene\s+(?:ningun\s+|un\s+)?(?:costo|cargo|arancel)(?!\s+(?:informado|cargado|especificado|registrado|indicado|definido))|no\s+(?:se\s+)?(?:paga|cobra|abona)\b|no\s+hay\s+que\s+pagar|dejo\s+de\s+cobrarse|no\s+requiere\s+(?:ningun\s+)?pago)/;
export const diceGratuito = (oracion) => GRATUITO.test(normalizar(oracion));

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));
// El costo en texto y la información adicional (de la ficha del portal) también son texto del trámite.
const textosDe = (t) => [t.descripcion ?? '', t.costoDetalle ?? '', t.informacionAdicional ?? '', ...(t.requisitos ?? []).map((r) => r.descripcion ?? '')];
// Oraciones del propio trámite que no tienen forma de instrucción para el asistente.
const oracionesConfiables = (t) =>
  textosDe(t)
    .flatMap((texto) => texto.split('\n').flatMap((l) => partirEnOraciones(l).map((o) => o.texto)))
    .filter((o) => !buscarInstruccion(o));

// Montos que respaldan los datos: el costo del trámite y los de sus requisitos; si el trámite no
// tiene costo cargado, también los que escribe su propio texto (por ejemplo "valor $ 25,00").
const montosPermitidos = (tramites) => {
  const montos = new Set();
  for (const t of tramites) {
    const costo = numero(t.costo);
    if (costo !== null && costo > 0) montos.add(costo);
    for (const r of t.requisitos ?? []) if (numero(r.costo) > 0) montos.add(numero(r.costo));
    if (costo === null) for (const o of oracionesConfiables(t)) for (const n of montosEn(o)) montos.add(n);
  }
  return montos;
};

// El costo cargado manda: con un monto, "gratuito" nunca vale, aunque el texto lo diga.
const permiteGratuito = (t) => {
  const costo = numero(t.costo);
  if (costo !== null) return costo === 0;
  return oracionesConfiables(t).some(diceGratuito);
};

const formatearMonto = (n) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const oracionDeCosto = (t) => {
  const costo = numero(t.costo);
  if (costo === null && t.costoDetalle) return `El costo del trámite ${t.nombre} es: ${t.costoDetalle.replace(/\s*\n+\s*/g, '; ')}.`;
  if (costo === null) return `El costo del trámite ${t.nombre} no está cargado: consultalo en una mesa de entrada o en la fuente oficial.`;
  return costo === 0 ? `El trámite ${t.nombre} es gratuito.` : `El costo del trámite ${t.nombre} es ${formatearMonto(costo)}.`;
};

const palabrasDe = (texto) => normalizar(texto).match(/\p{L}{4,}/gu) ?? [];
// El trámite del que habla la oración: el que más palabras de su nombre comparte, o el principal.
const tramiteDeLaOracion = (oracion, tramites) => {
  const enOracion = new Set(palabrasDe(oracion));
  let mejor = tramites[0];
  let puntaje = 0;
  for (const t of tramites) {
    const palabras = palabrasDe(t.nombre);
    const p = palabras.length ? palabras.filter((x) => enOracion.has(x)).length / palabras.length : 0;
    if (p > puntaje) [mejor, puntaje] = [t, p];
  }
  return mejor;
};

// --- Verificador -------------------------------------------------------------------------------

// --- Respuestas que quedaron sin contenido ---------------------------------------------------

// Si al sacar oraciones no queda nada que responda, va este mensaje (con el enlace a la fuente
// oficial, que agrega el servidor).
export const MENSAJE_INFORMACION_OCULTA = 'No puedo mostrar esa parte de la información. Consultá en una mesa de entrada o en la fuente oficial.';

// Oraciones de relleno, que no responden nada por sí solas: derivar a consultar, "para más
// información", "es importante seguir este procedimiento" o una pregunta de cierre. "El costo no está
// cargado: consultalo en una mesa de entrada" responde (no empieza derivando).
const RELLENO = [
  /^(?:(?:para|si necesitas|si queres) (?:obtener |tener )?(?:mas|mayor) (?:informacion|detalles|precision)[^,]*,\s*)?(?:te (?:recomiendo|sugiero|aconsejo)(?: que)? |podes |deberias |es recomendable |conviene )?(?:consulta|consultes|consultar|consultalo|consultala|acercate|acercarte|dirigite|dirigirte|averigua|averiguar|comunicate|comunicarte)\b/,
  /^(?:recorda|tene en cuenta) que es importante\b/,
  /^(?:asegurate|es importante|recorda) (?:de |que )?(?:sigas |seguir |cumplir |cumplas )(?:con )?(?:este|estos|el|los|todos los) (?:procedimiento|pasos|requisitos|indicaciones)\b/,
  /^(?:te gustaria|queres|te ayudo|necesitas|hay algo mas|en que mas|puedo ayudarte)\b.*\?$/,
  /^espero (?:que )?(?:te )?(?:sirva|haberte|haber)\b/,
];
const esRelleno = (oracion) => {
  const texto = normalizar(oracion).replace(/[¡¿*_]/g, '').trim();
  return !texto || RELLENO.some((r) => r.test(texto));
};

// true si el texto no tiene ni una oración que no sea relleno (incluido el texto vacío).
export const sinContenidoPropio = (texto) =>
  texto
    .split('\n')
    .map((l) => l.replace(PREFIJO_DE_LISTA, ''))
    .flatMap((l) => partirEnOraciones(l).map((o) => o.texto))
    .every(esRelleno);

// --- Verificador -------------------------------------------------------------------------------

// `tramites`: todos los del contexto (con detalle); `principales`: los que usa la respuesta (el de
// "tramiteId" primero), o vacío. `alCorregir` recibe { capa, original, corregida } (lo usan los
// evals y los tests). Devuelve una función que verifica una línea; su `quitadas()` dice cuántas
// oraciones sacó sin reemplazo (para saber si la respuesta pudo quedar sin contenido).
export const crearVerificador = ({ tramites = [], principales = [], alCorregir } = {}) => {
  const conDetalle = tramites.filter((t) => t && !t.sinResolver);
  const referencia = principales.filter(Boolean).length > 0 ? principales.filter(Boolean) : conDetalle;
  const hosts = hostsPermitidos(conDetalle);
  const montos = montosPermitidos(conDetalle);

  const corregirOracion = (oracion) => {
    if (oracion.urls.some((u) => !hostPermitido(hostDe(urlDe(u)), hosts))) return { capa: 'enlace', texto: '' };
    if (pideDatoSensible(oracion.texto)) return { capa: 'datos', texto: '' };
    const montosMalos = montosEn(oracion.texto).filter((n) => !montos.has(n));
    const gratuitoMalo = diceGratuito(oracion.texto) && !referencia.some(permiteGratuito);
    if ((montosMalos.length > 0 || gratuitoMalo) && referencia.length > 0) {
      return { capa: 'costo', texto: oracionDeCosto(tramiteDeLaOracion(oracion.texto, referencia)) };
    }
    if (montosMalos.length > 0 || gratuitoMalo) return { capa: 'costo', texto: '' };
    return null;
  };

  let quitadas = 0;
  const verificar = (linea) => {
    const prefijo = linea.match(PREFIJO_DE_LISTA)?.[1] ?? '';
    const oraciones = partirEnOraciones(linea.slice(prefijo.length));
    let cambio = false;
    const salida = [];
    for (const o of oraciones) {
      const correccion = corregirOracion(o);
      if (!correccion) {
        salida.push(o.texto);
        continue;
      }
      cambio = true;
      if (!correccion.texto) quitadas++;
      alCorregir?.({ capa: correccion.capa, original: o.texto.trim(), corregida: correccion.texto });
      if (correccion.texto && !salida.some((s) => s.trim() === correccion.texto)) salida.push(correccion.texto);
    }
    if (!cambio) return linea;
    const cuerpo = salida.map((s) => s.trim()).filter(Boolean).join(' ');
    return cuerpo ? `${prefijo}${cuerpo}` : '';
  };
  verificar.quitadas = () => quitadas;
  return verificar;
};

// La respuesta quedó sin nada que responda por lo que sacó la verificación (no por cómo la escribió
// el modelo: un texto que ya venía con solo relleno no se toca).
export const quedoSinContenido = (verificar, cuerpo) => verificar.quitadas() > 0 && sinContenidoPropio(cuerpo);
