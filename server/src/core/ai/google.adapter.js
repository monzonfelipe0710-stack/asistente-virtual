import { GoogleGenAI, ApiError } from '@google/genai';
import { ErrorProveedorIA } from './errores.js';
import { crearInactividad, incompleta, maxTokensDe, maxTokensDeTipeo, negativa, tiemposDe } from './comun.js';

let cliente = null;
const clienteGoogle = () => (cliente ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

const REINTENTABLES = [408, 429, 500, 502, 503, 504];

// El estado de Google (RESOURCE_EXHAUSTED, FAILED_PRECONDITION...) viene dentro del mensaje.
const estadoDe = (err) => String(err?.message ?? '').match(/"status"\s*:\s*"([A-Z_]+)"/)?.[1] ?? null;

const describir = (err) => {
  if (err instanceof ApiError) return ['ApiError', err.status, estadoDe(err)].filter(Boolean).join(' ');
  return [err?.name ?? 'Error', err?.code ?? err?.cause?.code].filter(Boolean).join(' ');
};

const clasificar = (err) => {
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return { tipo: 'timeout' };
  if (err instanceof TypeError) return { tipo: 'transitorio' };
  if (!(err instanceof ApiError)) return { tipo: 'otro' };
  const estado = estadoDe(err);
  if (err.status === 402 || estado === 'FAILED_PRECONDITION') return { tipo: 'cuota', sinCredito: true };
  if (err.status === 504 || estado === 'DEADLINE_EXCEEDED') return { tipo: 'timeout' };
  if (REINTENTABLES.includes(err.status)) return { tipo: 'transitorio' };
  if ([401, 403, 404].includes(err.status)) return { tipo: 'configuracion' };
  return { tipo: 'solicitud' };
};

const comoFalla = (err, signal, operacion) => {
  if (signal?.aborted) return signal.reason;
  if (err instanceof ErrorProveedorIA) return err;
  return new ErrorProveedorIA(describir(err), { operacion, original: err, ...clasificar(err) });
};

// El pensamiento de Flash-Lite no se apaga del todo: minimal es lo más bajo.
const pedidoDe = (modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, maxTokens, temperatura, timeout }) => {
  const p = modelo.parametros ?? {};
  const tiempos = tiemposDe(modelo, { sinReintentos: sinReintentos || Boolean(timeout) });
  return {
    model: modelo.modeloApi,
    contents: turnos.map((t) => ({ role: t.rol === 'usuario' ? 'user' : 'model', parts: [{ text: t.texto }] })),
    config: {
      systemInstruction: instruccionSistema,
      maxOutputTokens: maxTokens ?? maxTokensDe(modelo),
      ...(p.temperature != null && { temperature: temperatura ?? p.temperature }),
      ...(p.thinkingLevel && { thinkingConfig: { thinkingLevel: p.thinkingLevel.toUpperCase() } }),
      ...(esquema && { responseMimeType: 'application/json', responseJsonSchema: esquema.schema }),
      abortSignal: signal,
      httpOptions: {
        timeout: timeout ?? tiempos.timeout,
        retryOptions: { attempts: tiempos.maxRetries + 1, initialDelay: 0.5, maxDelay: 2, httpStatusCodes: REINTENTABLES },
      },
    },
  };
};

const usoDe = (modelo, operacion, u) =>
  u && {
    modelo,
    operacion,
    entrada: u.promptTokenCount ?? 0,
    cacheada: u.cachedContentTokenCount ?? 0,
    salida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    razonamiento: u.thoughtsTokenCount ?? 0,
  };

const BLOQUEOS = new Set(['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'LANGUAGE']);
const revisarFin = (finishReason, bloqueo, operacion) => {
  if (bloqueo || BLOQUEOS.has(finishReason)) throw negativa(operacion);
  if (finishReason === 'STOP') return;
  throw incompleta(finishReason, operacion, finishReason ? 'contenido' : 'transitorio');
};

const generar = async (pedido, signal, operacion) => {
  try {
    return await clienteGoogle().models.generateContent(pedido);
  } catch (err) {
    throw comoFalla(err, signal, operacion);
  }
};

export const chatGoogle = {
  async generarRespuesta(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    const r = await generar(pedidoDe(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos }), signal, 'chat');
    alUsar?.(usoDe(modelo.id, 'chat', r.usageMetadata));
    revisarFin(r.candidates?.[0]?.finishReason, r.promptFeedback?.blockReason, 'chat');
    return r.text ?? '';
  },

  async corregirTexto(modelo, { instruccionSistema, texto, signal, timeout, alUsar }) {
    const pedido = pedidoDe(modelo, { instruccionSistema, turnos: [{ rol: 'usuario', texto }], signal, maxTokens: maxTokensDeTipeo(modelo, texto), temperatura: 0, timeout });
    const r = await generar(pedido, signal, 'tipeo');
    alUsar?.(usoDe(modelo.id, 'tipeo', r.usageMetadata));
    revisarFin(r.candidates?.[0]?.finishReason, r.promptFeedback?.blockReason, 'tipeo');
    return r.text ?? '';
  },

  async *generarRespuestaStream(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    const { senal, rearmar, limpiar } = crearInactividad(signal, 'chat_stream');
    let finishReason = null;
    let bloqueo = null;
    let uso = null;
    try {
      const stream = await clienteGoogle().models.generateContentStream(pedidoDe(modelo, { instruccionSistema, turnos, esquema, signal: senal, sinReintentos }));
      rearmar();
      for await (const pedazo of stream) {
        rearmar();
        finishReason = pedazo.candidates?.[0]?.finishReason ?? finishReason;
        bloqueo = pedazo.promptFeedback?.blockReason ?? bloqueo;
        if (pedazo.usageMetadata) uso = pedazo.usageMetadata;
        const texto = pedazo.text;
        if (texto) yield texto;
      }
    } catch (err) {
      throw comoFalla(err, senal, 'chat_stream');
    } finally {
      limpiar();
    }
    alUsar?.(usoDe(modelo.id, 'chat_stream', uso));
    if (senal.aborted) throw senal.reason;
    revisarFin(finishReason, bloqueo, 'chat_stream');
  },
};
