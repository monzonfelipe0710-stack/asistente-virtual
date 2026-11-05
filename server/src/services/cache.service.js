const TTL_MS = Number(process.env.CACHE_TTL_MS ?? 60 * 60 * 1000);
const MAX_ENTRADAS = Number(process.env.CACHE_MAX ?? 500);

const cache = new Map();

export const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const obtener = (pregunta) => {
  const clave = normalizar(pregunta);
  const entrada = cache.get(clave);
  if (!entrada) return null;
  if (Date.now() > entrada.expira) {
    cache.delete(clave);
    return null;
  }
  return entrada.valor;
};

export const guardar = (pregunta, valor) => {
  const clave = normalizar(pregunta);
  if (cache.size >= MAX_ENTRADAS && !cache.has(clave)) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(clave, { valor, expira: Date.now() + TTL_MS });
};

// El resumen del catálogo se invalida junto con las respuestas: los dos dependen de los trámites.
let catalogo = null;

export const obtenerCatalogo = () => (catalogo && Date.now() <= catalogo.expira ? catalogo.valor : null);

export const guardarCatalogo = (valor) => {
  catalogo = { valor, expira: Date.now() + TTL_MS };
};

// La jurisdicción y la localidad efectivas de cada sector (ver jurisdiccion.service.js).
let jurisdicciones = null;

export const obtenerJurisdicciones = () =>
  jurisdicciones && Date.now() <= jurisdicciones.expira ? jurisdicciones.valor : null;

export const guardarJurisdicciones = (valor) => {
  jurisdicciones = { valor, expira: Date.now() + TTL_MS };
};

export const limpiar = () => {
  cache.clear();
  catalogo = null;
  jurisdicciones = null;
};
