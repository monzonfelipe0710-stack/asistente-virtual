import { APIError, APIConnectionError, APIConnectionTimeoutError } from 'openai';
import { openai } from '../../config/openai.js';
import { TIEMPOS_IA } from '../../config/ia.js';
import { combinarSenales } from '../../utils/plazo.js';
import { ErrorProveedorIA } from './errores.js';

// Red de seguridad, no un recorte: la respuesta más larga medida queda muy por debajo. Una salida
// cortada por el tope (finish_reason "length") es una falla: no se cachea ni se registra.
export const MAX_TOKENS_RESPUESTA = 1500;

// El modelo de embeddings queda fijo: cambiarlo invalida los vectores ya guardados
// (otro espacio vectorial) y rompe la búsqueda sin dar error. Se cambia solo con una
// migración + re-embeddear todo, no por configuración.
const MODELO_EMBEDDING = 'text-embedding-3-small';
const DIMENSIONES_EMBEDDING = 1536;
const SIN_CREDITO = new Set(['insufficient_quota', 'credit_balance_exhausted']);

const construirMensajes = (instruccionSistema, turnos) => [
  { role: 'system', content: instruccionSistema },
  ...turnos.map((t) => ({
    role: t.rol === 'usuario' ? 'user' : 'assistant',
    content: t.texto,
  })),
];

// Solo tipo y código: los mensajes pueden traer partes del pedido, de la respuesta o de la clave.
// Los de red (TypeError de fetch: "terminated", "fetch failed") son fijos y se dejan.
const describir = (err) => {
  if (err instanceof APIError) return `${err.constructor.name}${err.status ? ` ${err.status}` : ''}`;
  const codigo = err?.code ?? err?.cause?.code;
  return [err?.name ?? 'Error', codigo, err instanceof TypeError ? err.message : null].filter(Boolean).join(' ');
};

const clasificar = (err) => {
  if (err instanceof APIConnectionTimeoutError) return { tipo: 'timeout' };
  if (err instanceof APIConnectionError || err instanceof TypeError) return { tipo: 'transitorio' };
  if (!(err instanceof APIError)) return { tipo: 'otro' };
  if ([err.code, err.type, err.error?.code, err.error?.type].some((c) => SIN_CREDITO.has(c))) return { tipo: 'cuota', sinCredito: true };
  if (err.status === 429 || err.status === 408 || err.status === 409 || err.status >= 500) return { tipo: 'transitorio' };
  if (err.status === 401 || err.status === 403 || err.status === 404) return { tipo: 'configuracion' };
  return { tipo: 'solicitud' };
};

// Un abort propio (plazo, desconexión, inactividad) sale con su motivo; lo demás, como falla del proveedor.
const comoFalla = (err, signal, operacion) => {
  if (signal?.aborted) return signal.reason;
  if (err instanceof ErrorProveedorIA) return err;
  return new ErrorProveedorIA(describir(err), { operacion, original: err, ...clasificar(err) });
};

const incompleta = (finishReason, operacion) =>
  new ErrorProveedorIA(`respuesta incompleta (finish_reason: ${finishReason ?? 'ninguno'})`, { operacion, tipo: finishReason ? 'contenido' : 'transitorio' });

const negativa = (operacion) => new ErrorProveedorIA('el modelo se negó a responder (refusal)', { operacion, tipo: 'contenido' });

const usoDe = (modelo, operacion, u) =>
  u && {
    modelo,
    operacion,
    entrada: u.prompt_tokens ?? 0,
    cacheada: u.prompt_tokens_details?.cached_tokens ?? 0,
    salida: u.completion_tokens ?? 0,
    razonamiento: u.completion_tokens_details?.reasoning_tokens ?? 0,
  };

// gpt-4o-mini no acepta reasoning_effort; un modelo de razonamiento acepta temperature solo con
// reasoning_effort "none". Cada modelo manda lo que tiene en `parametros`.
const cuerpoDe = (modelo, { temperatura, maxTokens } = {}) => {
  const p = modelo.parametros ?? {};
  return {
    model: modelo.modeloApi,
    max_completion_tokens: maxTokens ?? p.maxTokens ?? MAX_TOKENS_RESPUESTA,
    ...(p.temperature != null && { temperature: temperatura ?? p.temperature }),
    ...(p.reasoningEffort && { reasoning_effort: p.reasoningEffort }),
  };
};

const opcionesDe = (modelo, { signal, sinReintentos }) => ({
  timeout: TIEMPOS_IA.chatDelEntorno.timeout ?? modelo.parametros?.timeoutMs ?? TIEMPOS_IA.chat.timeout,
  maxRetries: sinReintentos ? 0 : TIEMPOS_IA.chatDelEntorno.maxRetries ?? modelo.parametros?.reintentos ?? TIEMPOS_IA.chat.maxRetries,
  signal,
});

export const embeddingsOpenai = {
  async generarEmbedding(texto, { signal, alUsar } = {}) {
    try {
      const r = await openai.embeddings.create(
        { model: MODELO_EMBEDDING, input: texto },
        { ...TIEMPOS_IA.embedding, signal },
      );
      alUsar?.({ modelo: MODELO_EMBEDDING, operacion: 'embedding', entrada: r.usage?.total_tokens ?? 0, cacheada: 0, salida: 0 });
      return r.data[0].embedding;
    } catch (err) {
      throw comoFalla(err, signal, 'embedding');
    }
  },

  // Para reindexar en lotes: un pedido con varios textos tarda más que uno solo.
  async generarEmbeddings(textos, { signal, timeout = TIEMPOS_IA.embedding.timeout * 5 } = {}) {
    try {
      const r = await openai.embeddings.create(
        { model: MODELO_EMBEDDING, input: textos },
        { ...TIEMPOS_IA.embedding, timeout, signal },
      );
      return {
        vectores: [...r.data].sort((a, b) => a.index - b.index).map((d) => d.embedding),
        tokens: r.usage?.total_tokens ?? null,
      };
    } catch (err) {
      throw comoFalla(err, signal, 'embedding_lote');
    }
  },

  infoEmbedding: { modelo: MODELO_EMBEDDING, dimensiones: DIMENSIONES_EMBEDDING },
};

export const chatOpenai = {
  async generarRespuesta(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    let completion;
    try {
      completion = await openai.chat.completions.create(
        {
          ...cuerpoDe(modelo),
          messages: construirMensajes(instruccionSistema, turnos),
          ...(esquema && { response_format: { type: 'json_schema', json_schema: esquema } }),
        },
        opcionesDe(modelo, { signal, sinReintentos }),
      );
    } catch (err) {
      throw comoFalla(err, signal, 'chat');
    }
    alUsar?.(usoDe(modelo.id, 'chat', completion.usage));
    const { finish_reason: finishReason, message } = completion.choices[0];
    if (message.refusal) throw negativa('chat');
    if (finishReason !== 'stop') throw incompleta(finishReason, 'chat');
    return message.content;
  },

  // Una llamada corta, sin reintentos y con su propio timeout: devuelve el texto tal cual.
  async corregirTexto(modelo, { instruccionSistema, texto, signal, timeout, alUsar }) {
    let completion;
    try {
      completion = await openai.chat.completions.create(
        {
          ...cuerpoDe(modelo, { temperatura: 0, maxTokens: Math.min(modelo.parametros?.maxTokens ?? MAX_TOKENS_RESPUESTA, Math.ceil(texto.length / 2) + 20) }),
          messages: [{ role: 'system', content: instruccionSistema }, { role: 'user', content: texto }],
        },
        { timeout, maxRetries: 0, signal },
      );
    } catch (err) {
      throw comoFalla(err, signal, 'tipeo');
    }
    alUsar?.(usoDe(modelo.id, 'tipeo', completion.usage));
    const { finish_reason: finishReason, message } = completion.choices[0];
    if (message.refusal) throw negativa('tipeo');
    if (finishReason !== 'stop') throw incompleta(finishReason, 'tipeo');
    return message.content;
  },

  // El SDK termina el stream sin error si se corta sin [DONE] o si se lo aborta: por eso un abort
  // propio se relanza con su motivo y sin finish_reason "stop" la respuesta se da por incompleta.
  // Con `esquema`, una negativa del modelo (refusal) también es una falla.
  async *generarRespuestaStream(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    const inactividad = new AbortController();
    const senal = combinarSenales(signal, inactividad.signal);
    let temporizador;
    const rearmar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(
        () => inactividad.abort(new ErrorProveedorIA('stream inactivo', { operacion: 'chat_stream', tipo: 'timeout' })),
        TIEMPOS_IA.inactividadStream,
      );
    };

    let finishReason = null;
    let uso = null;
    try {
      const stream = await openai.chat.completions.create(
        {
          ...cuerpoDe(modelo),
          stream: true,
          stream_options: { include_usage: true },
          messages: construirMensajes(instruccionSistema, turnos),
          ...(esquema && { response_format: { type: 'json_schema', json_schema: esquema } }),
        },
        opcionesDe(modelo, { signal: senal, sinReintentos }),
      );
      rearmar();
      for await (const chunk of stream) {
        rearmar();
        if (chunk.usage) uso = chunk.usage;
        const opcion = chunk.choices?.[0];
        finishReason = opcion?.finish_reason ?? finishReason;
        if (opcion?.delta?.refusal) throw negativa('chat_stream');
        const delta = opcion?.delta?.content ?? '';
        if (delta) yield delta;
      }
    } catch (err) {
      throw comoFalla(err, senal, 'chat_stream');
    } finally {
      clearTimeout(temporizador);
    }

    alUsar?.(usoDe(modelo.id, 'chat_stream', uso));
    if (senal.aborted) throw senal.reason;
    if (finishReason !== 'stop') throw incompleta(finishReason, 'chat_stream');
  },
};
