// Una variable vacía, ausente o inválida deja el valor por defecto.
export const enteroDeEntorno = (nombre, porDefecto, minimo) => {
  const crudo = process.env[nombre]?.trim();
  if (!crudo) return porDefecto;
  const valor = Number(crudo);
  if (Number.isInteger(valor) && valor >= minimo) return valor;
  console.warn(`${nombre}="${crudo}" no es válido: se usa ${porDefecto}.`);
  return porDefecto;
};

// STREAM_INCREMENTAL (por defecto true): las dos rutas del chat pasan la salida del modelo por el
// mismo camino, de a oración (ver services/salida.service.js). Con false vuelve el de antes.
export const streamIncremental = () => !['false', '0', 'no'].includes(process.env.STREAM_INCREMENTAL?.trim().toLowerCase());

// STREAM_ESQUEMA (por defecto true): el streaming pide el mismo JSON con esquema que la ruta sin
// streaming y lee el texto de "respuesta" a medida que llega (ver utils/lector-json.js). Con false
// vuelve el formato anterior (una línea META y después el texto). Solo aplica con STREAM_INCREMENTAL.
export const streamEsquema = () => !['false', '0', 'no'].includes(process.env.STREAM_ESQUEMA?.trim().toLowerCase());

// TIPEO_REESCRITURA (por defecto true): si la búsqueda no encuentra nada parecido, el modelo corrige
// la ortografía de la consulta y se busca de nuevo (ver services/tipeo.service.js).
export const tipeoReescritura = () => !['false', '0', 'no'].includes(process.env.TIPEO_REESCRITURA?.trim().toLowerCase());

// CHAT_LOG_LATENCIA=true: una línea por consulta con los ms de cada etapa (ver chat.service.js).
export const logLatencia = () => ['true', '1', 'si', 'sí'].includes(process.env.CHAT_LOG_LATENCIA?.trim().toLowerCase());

// El timeout y los reintentos del chat son de cada modelo (config/modelos-chat.json); estas variables,
// si están definidas, los pisan para todos.
const chatDelEntorno = {
  timeout: enteroDeEntorno('OPENAI_TIMEOUT_CHAT_MS', null, 1),
  maxRetries: enteroDeEntorno('OPENAI_REINTENTOS_CHAT', null, 0),
};

export const TIEMPOS_IA = {
  embedding: {
    timeout: enteroDeEntorno('OPENAI_TIMEOUT_EMBEDDING_MS', 4000, 1),
    maxRetries: enteroDeEntorno('OPENAI_REINTENTOS_EMBEDDING', 1, 0),
  },
  chatDelEntorno,
  chat: {
    timeout: chatDelEntorno.timeout ?? 8000,
    maxRetries: chatDelEntorno.maxRetries ?? 1,
  },
  plazoChat: enteroDeEntorno('CHAT_PLAZO_MS', 18000, 1),
  inactividadStream: enteroDeEntorno('CHAT_INACTIVIDAD_STREAM_MS', 10000, 1),
  tipeo: enteroDeEntorno('TIPEO_TIMEOUT_MS', 3000, 1),
  esperaMaximaReintento: enteroDeEntorno('OPENAI_ESPERA_MAXIMA_REINTENTO_MS', 2000, 0),
};
