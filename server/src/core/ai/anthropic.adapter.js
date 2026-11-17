import Anthropic, { APIError, APIConnectionError, APIConnectionTimeoutError } from '@anthropic-ai/sdk';
import { fetchConEsperaAcotada } from '../../config/openai.js';
import { ErrorProveedorIA } from './errores.js';
import { crearInactividad, incompleta, maxTokensDe, maxTokensDeTipeo, negativa, tiemposDe } from './comun.js';

let cliente = null;
const clienteAnthropic = () => (cliente ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, fetch: fetchConEsperaAcotada }));

const tipoDeError = (err) => err.type ?? err.error?.error?.type ?? err.error?.type ?? null;

// Solo clase, estado y tipo: el mensaje puede traer partes del pedido o de la clave.
const describir = (err) => {
  if (err instanceof APIError) return [err.constructor.name, err.status, tipoDeError(err)].filter(Boolean).join(' ');
  return [err?.name ?? 'Error', err?.code ?? err?.cause?.code].filter(Boolean).join(' ');
};

const SIN_CREDITO = /credit balance|spend limit/i;
const clasificar = (err) => {
  if (err instanceof APIConnectionTimeoutError) return { tipo: 'timeout' };
  if (err instanceof APIConnectionError || err instanceof TypeError) return { tipo: 'transitorio' };
  if (!(err instanceof APIError)) return { tipo: 'otro' };
  const tipo = tipoDeError(err);
  if (err.status === 402 || tipo === 'billing_error') return { tipo: 'cuota', sinCredito: true };
  if (err.status === 400 && SIN_CREDITO.test(err.error?.error?.message ?? '')) return { tipo: 'cuota', sinCredito: true };
  if (tipo === 'timeout_error' || err.status === 504) return { tipo: 'timeout' };
  if (['overloaded_error', 'api_error', 'rate_limit_error'].includes(tipo)) return { tipo: 'transitorio' };
  if ([408, 409, 429, 529].includes(err.status) || err.status >= 500) return { tipo: 'transitorio' };
  if ([401, 403, 404].includes(err.status)) return { tipo: 'configuracion' };
  return { tipo: 'solicitud' };
};

const comoFalla = (err, signal, operacion) => {
  if (signal?.aborted) return signal.reason;
  if (err instanceof ErrorProveedorIA) return err;
  return new ErrorProveedorIA(describir(err), { operacion, original: err, ...clasificar(err) });
};

// Haiku 5.5 piensa por defecto (effort medium): se apaga con thinking disabled y effort low. No
// acepta temperature; un modelo que la tenga en sus parámetros la manda.
const cuerpoDe = (modelo, { instruccionSistema, turnos, esquema, maxTokens }) => {
  const p = modelo.parametros ?? {};
  return {
    model: modelo.modeloApi,
    max_tokens: maxTokens ?? maxTokensDe(modelo),
    system: instruccionSistema,
    messages: turnos.map((t) => ({ role: t.rol === 'usuario' ? 'user' : 'assistant', content: t.texto })),
    ...(p.thinking && { thinking: { type: p.thinking } }),
    ...(p.temperature != null && { temperature: p.temperature }),
    ...((esquema || p.effort) && {
      output_config: { ...(p.effort && { effort: p.effort }), ...(esquema && { format: { type: 'json_schema', schema: esquema.schema } }) },
    }),
  };
};

const usoDe = (modelo, operacion, u) =>
  u && {
    modelo,
    operacion,
    entrada: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
    cacheada: u.cache_read_input_tokens ?? 0,
    salida: u.output_tokens ?? 0,
  };

const revisarFin = (stopReason, operacion) => {
  if (stopReason === 'end_turn') return;
  if (stopReason === 'refusal') throw negativa(operacion);
  throw incompleta(stopReason, operacion, stopReason ? 'contenido' : 'transitorio');
};

const textoDe = (r) => r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');

const pedir = async (modelo, cuerpo, { signal, sinReintentos, operacion, timeout }) => {
  try {
    const tiempos = tiemposDe(modelo, { sinReintentos });
    return await clienteAnthropic().messages.create(cuerpo, { ...tiempos, ...(timeout && { timeout, maxRetries: 0 }), signal });
  } catch (err) {
    throw comoFalla(err, signal, operacion);
  }
};

export const chatAnthropic = {
  async generarRespuesta(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    const r = await pedir(modelo, cuerpoDe(modelo, { instruccionSistema, turnos, esquema }), { signal, sinReintentos, operacion: 'chat' });
    alUsar?.(usoDe(modelo.id, 'chat', r.usage));
    revisarFin(r.stop_reason, 'chat');
    return textoDe(r);
  },

  async corregirTexto(modelo, { instruccionSistema, texto, signal, timeout, alUsar }) {
    const cuerpo = cuerpoDe(modelo, { instruccionSistema, turnos: [{ rol: 'usuario', texto }], maxTokens: maxTokensDeTipeo(modelo, texto) });
    const r = await pedir(modelo, cuerpo, { signal, operacion: 'tipeo', timeout });
    alUsar?.(usoDe(modelo.id, 'tipeo', r.usage));
    revisarFin(r.stop_reason, 'tipeo');
    return textoDe(r);
  },

  async *generarRespuestaStream(modelo, { instruccionSistema, turnos, esquema, signal, sinReintentos, alUsar }) {
    const { senal, rearmar, limpiar } = crearInactividad(signal, 'chat_stream');
    let stopReason = null;
    let uso = null;
    try {
      const stream = await pedir(modelo, { ...cuerpoDe(modelo, { instruccionSistema, turnos, esquema }), stream: true }, { signal: senal, sinReintentos, operacion: 'chat_stream' });
      rearmar();
      for await (const evento of stream) {
        rearmar();
        if (evento.type === 'message_start') uso = { ...evento.message.usage };
        else if (evento.type === 'message_delta') {
          stopReason = evento.delta?.stop_reason ?? stopReason;
          uso = { ...uso, ...evento.usage };
        } else if (evento.type === 'content_block_delta' && evento.delta?.type === 'text_delta' && evento.delta.text) {
          yield evento.delta.text;
        }
      }
    } catch (err) {
      throw comoFalla(err, senal, 'chat_stream');
    } finally {
      limpiar();
    }
    alUsar?.(usoDe(modelo.id, 'chat_stream', uso));
    if (senal.aborted) throw senal.reason;
    revisarFin(stopReason, 'chat_stream');
  },
};
