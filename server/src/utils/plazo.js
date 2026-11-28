// Para lo que no acepta un AbortSignal (las consultas de Prisma): la operación sigue, pero
// quien espera se entera del corte en el momento.
export const conSenal = (promesa, signal) => {
  if (!signal) return promesa;
  if (signal.aborted) {
    promesa.catch(() => {});
    return Promise.reject(signal.reason);
  }
  return new Promise((resolver, rechazar) => {
    const alAbortar = () => rechazar(signal.reason);
    signal.addEventListener('abort', alAbortar, { once: true });
    promesa.then(resolver, rechazar).finally(() => signal.removeEventListener('abort', alAbortar));
  });
};

export class ClienteDesconectadoError extends Error {
  constructor() {
    super('El cliente se desconectó antes de recibir la respuesta.');
    this.name = 'ClienteDesconectadoError';
  }
}

export const combinarSenales = (...senales) => {
  const presentes = senales.filter(Boolean);
  return presentes.length === 1 ? presentes[0] : AbortSignal.any(presentes);
};

// Un plazo que además sabe cuándo vence: el reintento ante una caída de la base (reintento-base.js)
// lo consulta para no esperar si después no queda tiempo para la consulta.
const vencimientos = new WeakMap();

export const crearPlazoConVencimiento = (ms, signal) => {
  const plazo = combinarSenales(AbortSignal.timeout(ms), signal);
  vencimientos.set(plazo, Date.now() + ms);
  return plazo;
};

// Los ms que le quedan al plazo, o null si la señal no vino de crearPlazoConVencimiento.
export const msRestantes = (signal) => (signal && vencimientos.has(signal) ? vencimientos.get(signal) - Date.now() : null);
