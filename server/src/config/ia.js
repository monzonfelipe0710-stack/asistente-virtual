// Una variable vacía, ausente o inválida deja el valor por defecto.
const enteroDeEntorno = (nombre, porDefecto, minimo) => {
  const crudo = process.env[nombre]?.trim();
  if (!crudo) return porDefecto;
  const valor = Number(crudo);
  if (Number.isInteger(valor) && valor >= minimo) return valor;
  console.warn(`${nombre}="${crudo}" no es válido: se usa ${porDefecto}.`);
  return porDefecto;
};

export const TIEMPOS_IA = {
  embedding: {
    timeout: enteroDeEntorno('OPENAI_TIMEOUT_EMBEDDING_MS', 4000, 1),
    maxRetries: enteroDeEntorno('OPENAI_REINTENTOS_EMBEDDING', 1, 0),
  },
  chat: {
    timeout: enteroDeEntorno('OPENAI_TIMEOUT_CHAT_MS', 8000, 1),
    maxRetries: enteroDeEntorno('OPENAI_REINTENTOS_CHAT', 1, 0),
  },
  plazoChat: enteroDeEntorno('CHAT_PLAZO_MS', 18000, 1),
  esperaMaximaReintento: enteroDeEntorno('OPENAI_ESPERA_MAXIMA_REINTENTO_MS', 2000, 0),
};
