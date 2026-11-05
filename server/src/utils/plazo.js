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

export const combinarSenales = (...senales) => {
  const presentes = senales.filter(Boolean);
  return presentes.length === 1 ? presentes[0] : AbortSignal.any(presentes);
};
