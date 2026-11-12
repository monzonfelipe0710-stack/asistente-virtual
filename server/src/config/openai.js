import OpenAi from 'openai';
import { TIEMPOS_IA } from './ia.js';

const esperaPedida = (headers) => {
  const ms = Number.parseFloat(headers.get('retry-after-ms') ?? '');
  if (!Number.isNaN(ms)) return ms;
  const valor = headers.get('retry-after');
  if (!valor) return null;
  const segundos = Number.parseFloat(valor);
  return Number.isNaN(segundos) ? Date.parse(valor) - Date.now() : segundos * 1000;
};

// El SDK espera lo que diga el retry-after, sin tope: se recorta para no pasarse del plazo del chat.
export const fetchConEsperaAcotada = async (url, init) => {
  const respuesta = await fetch(url, init);
  if (respuesta.ok) return respuesta;
  const espera = esperaPedida(respuesta.headers);
  if (espera === null || espera <= TIEMPOS_IA.esperaMaximaReintento) return respuesta;

  const headers = new Headers(respuesta.headers);
  headers.delete('retry-after');
  headers.set('retry-after-ms', String(TIEMPOS_IA.esperaMaximaReintento));
  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers });
};

export const openai = new OpenAi({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: TIEMPOS_IA.chat.timeout,
  maxRetries: TIEMPOS_IA.chat.maxRetries,
  fetch: fetchConEsperaAcotada,
});
