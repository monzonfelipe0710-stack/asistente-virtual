import { enteroDeEntorno } from '../config/ia.js';

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

// Cada respuesta es del modelo que la generó: con otro modelo activo no se sirve.
const claveDe = (pregunta, modeloId) => `${modeloId}|${normalizar(pregunta)}`;

export const obtener = (pregunta, modeloId) => {
  const clave = claveDe(pregunta, modeloId);
  const entrada = cache.get(clave);
  if (!entrada) return null;
  if (Date.now() > entrada.expira) {
    cache.delete(clave);
    return null;
  }
  return entrada.valor;
};

export const guardar = (pregunta, modeloId, valor) => {
  const clave = claveDe(pregunta, modeloId);
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

// Embeddings de las preguntas del chat (ver busqueda.service.js). No dependen del catálogo (el
// modelo de embeddings es fijo), así que limpiar() no los toca: sirven también después de que
// cambia el catálogo. Float32Array porque pgvector guarda float4: no se pierde nada y ocupa la mitad.
const TTL_EMBEDDINGS_MS = Number(process.env.CACHE_EMBEDDINGS_TTL_MS ?? 60 * 60 * 1000);
const MAX_EMBEDDINGS = Number(process.env.CACHE_EMBEDDINGS_MAX ?? 200);
const embeddings = new Map();

// Solo mayúsculas y espacios: el texto que va al embedding es el mismo salvo por eso.
export const claveDeEmbedding = (texto) => texto.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

export const obtenerEmbedding = (texto) => {
  const clave = claveDeEmbedding(texto);
  const entrada = embeddings.get(clave);
  if (!entrada) return null;
  embeddings.delete(clave);
  if (Date.now() > entrada.expira) return null;
  embeddings.set(clave, entrada);
  return Array.from(entrada.vector);
};

export const guardarEmbedding = (texto, vector) => {
  if (MAX_EMBEDDINGS <= 0) return;
  const clave = claveDeEmbedding(texto);
  embeddings.delete(clave);
  if (embeddings.size >= MAX_EMBEDDINGS) embeddings.delete(embeddings.keys().next().value);
  embeddings.set(clave, { vector: Float32Array.from(vector), expira: Date.now() + TTL_EMBEDDINGS_MS });
};

export const limpiarEmbeddings = () => embeddings.clear();
export const cantidadDeEmbeddings = () => embeddings.size;

// version-catalogo.service.js registra acá el aviso a los demás procesos. Con `propagar: false`
// (lo usa ese mismo módulo al ver una versión nueva) se vacía solo la caché local.
let alInvalidar = null;
export const alLimpiar = (fn) => {
  alInvalidar = fn;
};

export const limpiar = (opciones) => {
  cache.clear();
  catalogo = null;
  jurisdicciones = null;
  if (opciones?.propagar !== false) alInvalidar?.();
};
