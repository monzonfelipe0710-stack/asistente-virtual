// Sondeo de modelos de chat (etapa 1 del selector de modelo): prueba cada modelo candidato contra el
// pipeline real, sin cambiar el código de producción ni escribir en la base.
//
//   node scripts/sondear-modelos.js [--corridas 5] [--modelo gpt-6-luna]... [--pregunta "..."]...
//                                   [--sin-errores] [--estimar] [--parametros '{"reasoning_effort":"medium"}']
//
// --parametros reemplaza o agrega parámetros de las corridas (en el formato del proveedor), por
// ejemplo para medir un modelo de razonamiento con su esfuerzo por defecto. Un valor null lo saca.
// - Los modelos y sus precios (con fecha y fuente) están en scripts/lib/modelos-candidatos.json. Solo
//   se sondean los que tienen su clave en el entorno (OPENAI_API_KEY, ANTHROPIC_API_KEY,
//   GEMINI_API_KEY); los demás se saltean con un aviso. La búsqueda usa los embeddings de OpenAI, así
//   que OPENAI_API_KEY hace falta siempre. Las claves no se imprimen.
// - Los prompts son los reales: cada pregunta pasa por responderConsulta y responderConsultaStream
//   (regla de entrada, búsqueda real, contexto, prompt y esquema), y la llamada al modelo se
//   intercepta para quedarse con la instrucción y el esquema antes de que el chat llame a OpenAI. Así
//   no se llega al registro: no se escribe nada en la base.
// - Por modelo: parámetros (temperature 0,3, tope de salida, razonamiento), ruta normal con el
//   esquema estricto, stream con el esquema de "respuesta" al final leído con el lector incremental
//   del chat (utils/lector-json.js), latencia (mediana del primer texto y total), tokens, costo por
//   1000 consultas, calidad básica (esquema, tipo, tramiteId, voseo) y cómo se ven los errores
//   (timeout y clave inválida; cuota y refusal según la documentación, ver docs/estado-actual-backend.md).
// - Tope de gasto: SONDEO_TOPE_USD (default 1,00, total). Se estima antes de correr y se aborta si la
//   estimación lo pasa, apenas el gasto real lo pasa, o ante un error de cuota o facturación
//   (CorridaSinCredito, código de salida 2). --estimar solo imprime la estimación.
//
// El resultado queda en server/eval-resultados/sondeo-modelos-<fecha>.json (ignorado por git).
import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import prisma from '../src/config/prisma.js';
import * as cache from '../src/services/cache.service.js';
import { ia } from '../src/core/ai/index.js';
import { responderConsulta, responderConsultaStream } from '../src/services/chat.service.js';
import { crearLectorDeSalida } from '../src/utils/lector-json.js';
import { corregirTuteo } from '../src/utils/voseo.js';
import { MAX_TOKENS_RESPUESTA } from '../src/core/ai/openai.adapter.js';
import { CorridaSinCredito, SALIDA_SIN_CREDITO, cortarSiSinCredito } from './lib/sin-credito.js';

const argumento = (nombre) => process.argv.flatMap((a, i) => (a === nombre ? [process.argv[i + 1]] : []));
const CORRIDAS = Number(argumento('--corridas')[0] ?? 5);
const SOLO_MODELOS = argumento('--modelo');
const SIN_ERRORES = process.argv.includes('--sin-errores');
const SOLO_ESTIMAR = process.argv.includes('--estimar');
const PARAMETROS_EXTRA = JSON.parse(argumento('--parametros')[0] ?? '{}');
const TOPE_USD = (() => {
  const crudo = process.env.SONDEO_TOPE_USD?.trim().replace(',', '.');
  const valor = Number(crudo);
  return crudo && Number.isFinite(valor) && valor > 0 ? valor : 1;
})();
const TEMPERATURA = 0.3;
const TIMEOUT_MS = 30000;
const ANTHROPIC_VERSION = '2026-10-21';

// Mezcla de respuesta, aclaración y conversación, con el tipo que espera eval-chat.
const PREGUNTAS = argumento('--pregunta').length > 0
  ? argumento('--pregunta').map((texto) => ({ texto, tipo: null }))
  : [
    { texto: 'certificado de buena conducta', tipo: 'respuesta' },
    { texto: 'cómo renuevo el pasaporte', tipo: 'respuesta' },
    { texto: 'necesito un certificado', tipo: 'aclaracion' },
    { texto: 'cómo saco la licencia de pesca', tipo: 'aclaracion' },
    { texto: '¿qué podés hacer?', tipo: 'conversacion' },
  ];

const CONFIG = JSON.parse(readFileSync(fileURLToPath(new URL('./lib/modelos-candidatos.json', import.meta.url)), 'utf8'));
const elegidos = CONFIG.modelos.filter((m) => SOLO_MODELOS.length === 0 || SOLO_MODELOS.includes(m.id));
const habilitados = elegidos.filter((m) => process.env[m.clave]);
for (const m of elegidos.filter((x) => !process.env[x.clave])) console.warn(`Se saltea ${m.id}: falta ${m.clave} en el entorno.`);
if (!process.env.OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY: la búsqueda del chat la necesita para los embeddings.');

const mediana = (xs) => {
  const o = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (o.length === 0) return null;
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2);
};

// --- Gasto -------------------------------------------------------------------------------------
class TopeSuperado extends Error {}
let gasto = 0;
const costoDe = (modelo, u) => {
  const p = modelo.precio;
  const cacheada = u.cacheada ?? 0;
  return ((u.entrada - cacheada) * p.entradaNoCacheada + cacheada * p.entradaCacheada + u.salida * p.salida) / 1e6;
};
const sumarGasto = (modelo, u) => {
  if (!u) return 0;
  const costo = costoDe(modelo, u);
  gasto += costo;
  if (gasto > TOPE_USD) throw new TopeSuperado(`Se pasó el tope de gasto (SONDEO_TOPE_USD ${TOPE_USD}): van ${gasto.toFixed(4)} USD.`);
  return costo;
};

// Falta de crédito en Anthropic o Google (la de OpenAI la reconoce cortarSiSinCredito).
const cortarSiSinCreditoOtro = (err) => {
  const { status, tipo, estado, mensaje = '' } = err?.detalle ?? {};
  if (status === 402 || tipo === 'billing_error' || (status === 400 && /credit balance|spend limit/i.test(mensaje))
    || (estado === 'RESOURCE_EXHAUSTED' && /prepay|credit|billing/i.test(mensaje)) || estado === 'FAILED_PRECONDITION') {
    throw new CorridaSinCredito(err);
  }
};

// --- Prompts reales ----------------------------------------------------------------------------
class Captura extends Error {
  constructor(pedido) {
    super('captura');
    this.pedido = pedido;
  }
}
const original = { generarRespuesta: ia.generarRespuesta, generarRespuestaStream: ia.generarRespuestaStream, corregirTexto: ia.corregirTexto };
ia.generarRespuesta = async (pedido) => { throw new Captura(pedido); };
ia.generarRespuestaStream = (pedido) => (async function* () { throw new Captura(pedido); })();
// La corrección de tipeo sigue con la búsqueda original (las preguntas están bien escritas).
ia.corregirTexto = async () => { throw new Error('sin corrección en el sondeo'); };

const capturar = async (texto, ruta) => {
  cache.limpiar({ propagar: false });
  const mensajes = [{ rol: 'usuario', texto }];
  try {
    if (ruta === 'normal') await responderConsulta(mensajes);
    else for await (const _ of responderConsultaStream(mensajes)) { /* nada */ }
  } catch (err) {
    if (err instanceof Captura) return err.pedido;
    throw err;
  }
  return null; // la regla de entrada la frenó o salió de la caché: no llega al modelo
};
const idsDelContexto = (instruccion) => {
  const contexto = instruccion.split('Contexto (trámites candidatos):')[1] ?? '';
  return new Set([...contexto.matchAll(/\(id (\d+)\)/g)].map((m) => Number(m[1])));
};

// --- SSE para fetch ----------------------------------------------------------------------------
async function* eventosSse(respuesta) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const pedazo of respuesta.body) {
    buffer += decoder.decode(pedazo, { stream: true });
    let corte;
    while ((corte = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const bloque = buffer.slice(0, corte);
      buffer = buffer.slice(corte).replace(/^\r?\n\r?\n/, '');
      let evento = 'message';
      const datos = [];
      for (const linea of bloque.split(/\r?\n/)) {
        if (linea.startsWith('event:')) evento = linea.slice(6).trim();
        else if (linea.startsWith('data:')) datos.push(linea.slice(5).trimStart());
      }
      if (datos.length > 0) yield { evento, datos: datos.join('\n') };
    }
  }
}

// Error HTTP de Anthropic o Google, con lo justo para mapearlo (sin claves ni el pedido).
class ErrorHttp extends Error {
  constructor(proveedor, status, cuerpo) {
    const e = cuerpo?.error ?? {};
    const detalle = { status, tipo: e.type ?? null, estado: e.status ?? null, codigo: e.code ?? null, mensaje: String(e.message ?? '').slice(0, 160) };
    super(`${proveedor} ${status} ${detalle.tipo ?? detalle.estado ?? ''}`.trim());
    this.name = 'ErrorHttp';
    this.detalle = detalle;
  }
}
const pedirHttp = async (proveedor, url, init) => {
  const r = await fetch(url, init);
  if (r.ok) return r;
  let cuerpo = null;
  try { cuerpo = await r.json(); } catch { /* sin cuerpo JSON */ }
  throw new ErrorHttp(proveedor, r.status, cuerpo);
};

// --- Proveedores -------------------------------------------------------------------------------
// Cada uno: normal(...) → { texto, fin, refusal, usage }; stream(...) → generador de { texto } y al
// final { fin, refusal, usage }. usage: { entrada, cacheada, salida, razonamiento }.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: TIMEOUT_MS });

const usoOpenai = (u) => u && ({
  entrada: u.prompt_tokens,
  cacheada: u.prompt_tokens_details?.cached_tokens ?? 0,
  salida: u.completion_tokens,
  razonamiento: u.completion_tokens_details?.reasoning_tokens ?? 0,
});
const mensajesOpenai = (instruccion, turnos) => [
  { role: 'system', content: instruccion },
  ...turnos.map((t) => ({ role: t.rol === 'usuario' ? 'user' : 'assistant', content: t.texto })),
];

const PROVEEDORES = {
  openai: {
    parametros: (modelo, { temperatura }) => ({ ...modelo.parametros, ...(temperatura && { temperature: TEMPERATURA }) }),
    async normal(modelo, { instruccion, turnos, esquema, params, maxTokens = MAX_TOKENS_RESPUESTA, signal }) {
      const c = await openai.chat.completions.create({
        model: modelo.id,
        max_completion_tokens: maxTokens,
        messages: mensajesOpenai(instruccion, turnos),
        ...(esquema && { response_format: { type: 'json_schema', json_schema: esquema } }),
        ...params,
      }, { signal });
      const op = c.choices[0];
      return { texto: op.message.content ?? '', fin: op.finish_reason, refusal: op.message.refusal ?? null, usage: usoOpenai(c.usage) };
    },
    async *stream(modelo, { instruccion, turnos, esquema, params }) {
      const s = await openai.chat.completions.create({
        model: modelo.id,
        max_completion_tokens: MAX_TOKENS_RESPUESTA,
        stream: true,
        stream_options: { include_usage: true },
        messages: mensajesOpenai(instruccion, turnos),
        response_format: { type: 'json_schema', json_schema: esquema },
        ...params,
      });
      let fin = null;
      let refusal = null;
      let usage = null;
      for await (const chunk of s) {
        if (chunk.usage) usage = usoOpenai(chunk.usage);
        const op = chunk.choices[0];
        if (!op) continue;
        fin = op.finish_reason ?? fin;
        if (op.delta?.refusal) refusal = (refusal ?? '') + op.delta.refusal;
        if (op.delta?.content) yield { texto: op.delta.content };
      }
      yield { fin, refusal, usage };
    },
  },

  anthropic: {
    parametros: (modelo, { temperatura }) => ({
      ...(modelo.parametros.thinking && { thinking: { type: modelo.parametros.thinking } }),
      ...(modelo.parametros.effort && { effort: modelo.parametros.effort }),
      ...(temperatura && { temperature: TEMPERATURA }),
    }),
    cuerpo(modelo, { instruccion, turnos, esquema, params, maxTokens = MAX_TOKENS_RESPUESTA }) {
      const { effort, ...resto } = params;
      return {
        model: modelo.id,
        max_tokens: maxTokens,
        system: instruccion,
        messages: turnos.map((t) => ({ role: t.rol === 'usuario' ? 'user' : 'assistant', content: t.texto })),
        ...((esquema || effort) && { output_config: { ...(esquema && { format: { type: 'json_schema', schema: esquema.schema } }), ...(effort && { effort }) } }),
        ...resto,
      };
    },
    pedir(cuerpo, signal) {
      return pedirHttp('anthropic', 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
      });
    },
    uso: (u) => u && ({
      entrada: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
      cacheada: u.cache_read_input_tokens ?? 0,
      salida: u.output_tokens ?? 0,
      razonamiento: null,
    }),
    async normal(modelo, args) {
      const r = await (await this.pedir(this.cuerpo(modelo, args), args.signal)).json();
      const texto = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      return { texto, fin: r.stop_reason, refusal: r.stop_reason === 'refusal' ? texto : null, usage: this.uso(r.usage) };
    },
    async *stream(modelo, args) {
      const r = await this.pedir({ ...this.cuerpo(modelo, args), stream: true });
      let fin = null;
      const u = {};
      for await (const { evento, datos } of eventosSse(r)) {
        const d = JSON.parse(datos);
        if (evento === 'error') throw new ErrorHttp('anthropic', 200, d);
        if (evento === 'message_start') Object.assign(u, d.message.usage);
        if (evento === 'message_delta') {
          fin = d.delta?.stop_reason ?? fin;
          Object.assign(u, d.usage);
        }
        if (evento === 'content_block_delta' && d.delta?.type === 'text_delta') yield { texto: d.delta.text };
      }
      yield { fin, refusal: fin === 'refusal' ? 'refusal' : null, usage: this.uso(u) };
    },
  },

  google: {
    parametros: (modelo, { temperatura }) => ({ ...modelo.parametros, ...(temperatura && { temperature: TEMPERATURA }) }),
    cuerpo(modelo, { instruccion, turnos, esquema, params, maxTokens = MAX_TOKENS_RESPUESTA }) {
      const { thinkingLevel, temperature } = params;
      return {
        systemInstruction: { parts: [{ text: instruccion }] },
        contents: turnos.map((t) => ({ role: t.rol === 'usuario' ? 'user' : 'model', parts: [{ text: t.texto }] })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(temperature !== undefined && { temperature }),
          ...(thinkingLevel && { thinkingConfig: { thinkingLevel } }),
          ...(esquema && { responseFormat: { text: { mimeType: 'APPLICATION_JSON', schema: esquema.schema } } }),
        },
      };
    },
    pedir(modelo, metodo, cuerpo, signal) {
      return pedirHttp('google', `https://generativelanguage.googleapis.com/v1beta/models/${modelo.id}:${metodo}`, {
        method: 'POST',
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
      });
    },
    uso: (u) => u && ({
      entrada: u.promptTokenCount ?? 0,
      cacheada: u.cachedContentTokenCount ?? 0,
      salida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      razonamiento: u.thoughtsTokenCount ?? 0,
    }),
    textoDe: (r) => (r.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join(''),
    async normal(modelo, args) {
      const r = await (await this.pedir(modelo, 'generateContent', this.cuerpo(modelo, args), args.signal)).json();
      const fin = r.candidates?.[0]?.finishReason ?? r.promptFeedback?.blockReason ?? null;
      return { texto: this.textoDe(r), fin, refusal: /SAFETY|BLOCK|PROHIBITED/.test(fin ?? '') ? fin : null, usage: this.uso(r.usageMetadata) };
    },
    async *stream(modelo, args) {
      const r = await this.pedir(modelo, 'streamGenerateContent?alt=sse', this.cuerpo(modelo, args));
      let fin = null;
      let usage = null;
      for await (const { datos } of eventosSse(r)) {
        const d = JSON.parse(datos);
        fin = d.candidates?.[0]?.finishReason ?? d.promptFeedback?.blockReason ?? fin;
        if (d.usageMetadata) usage = this.uso(d.usageMetadata);
        const texto = this.textoDe(d);
        if (texto) yield { texto };
      }
      yield { fin, refusal: /SAFETY|BLOCK|PROHIBITED/.test(fin ?? '') ? fin : null, usage };
    },
  },
};
// El fin "normal" de cada API.
const FIN_OK = { openai: 'stop', anthropic: 'end_turn', google: 'STOP' };

// --- Validación de la salida -------------------------------------------------------------------
const TIPOS = ['respuesta', 'aclaracion', 'conversacion'];
const esEnteros = (xs) => Array.isArray(xs) && xs.every(Number.isInteger);
const validar = (texto, esquema, ids, tipoEsperado) => {
  let obj;
  try {
    obj = JSON.parse(texto);
  } catch {
    return { obj: null, esquemaOk: false, problemas: ['JSON inválido'] };
  }
  const problemas = [];
  const claves = Object.keys(esquema.schema.properties);
  const sobran = Object.keys(obj).filter((k) => !claves.includes(k));
  const faltan = claves.filter((k) => !(k in obj));
  if (sobran.length) problemas.push(`claves de más: ${sobran.join(', ')}`);
  if (faltan.length) problemas.push(`faltan: ${faltan.join(', ')}`);
  if (!TIPOS.includes(obj.tipo)) problemas.push(`tipo inválido: ${obj.tipo}`);
  if (typeof obj.saludo !== 'string' || typeof obj.respuesta !== 'string') problemas.push('saludo o respuesta no son texto');
  if (!(obj.tramiteId === null || Number.isInteger(obj.tramiteId))) problemas.push('tramiteId no es entero ni null');
  if (!esEnteros(obj.tramitesUsados) || !esEnteros(obj.opciones)) problemas.push('tramitesUsados u opciones no son listas de enteros');
  const esquemaOk = problemas.length === 0;
  // Coherencia con el contexto (lo que el chat después valida y descarta).
  if (Number.isInteger(obj.tramiteId) && !ids.has(obj.tramiteId)) problemas.push(`tramiteId ${obj.tramiteId} fuera del contexto`);
  if (esEnteros(obj.opciones) && obj.opciones.some((id) => !ids.has(id))) problemas.push('opciones fuera del contexto');
  const tuteo = typeof obj.respuesta === 'string' ? corregirTuteo(obj.respuesta).formas : [];
  return { obj, esquemaOk, problemas, tuteo, tipoEsperado: tipoEsperado ? obj.tipo === tipoEsperado : null };
};

// --- Corridas ----------------------------------------------------------------------------------
const correrNormal = async (modelo, prov, pedido, params, pregunta) => {
  const inicio = Date.now();
  const r = await prov.normal(modelo, { instruccion: pedido.instruccionSistema, turnos: pedido.turnos, esquema: pedido.esquema, params });
  const total = Date.now() - inicio;
  const costo = sumarGasto(modelo, r.usage);
  const v = validar(r.texto, pedido.esquema, idsDelContexto(pedido.instruccionSistema), pregunta.tipo);
  return { ruta: 'normal', total, primerTexto: total, fin: r.fin, finOk: r.fin === FIN_OK[modelo.proveedor], refusal: r.refusal, usage: r.usage, costo, ...v, texto: r.texto };
};

const correrStream = async (modelo, prov, pedido, params, pregunta) => {
  const campos = Object.keys(pedido.esquema.schema.properties);
  const lector = crearLectorDeSalida({ campoTexto: 'respuesta', camposMeta: campos.filter((c) => c !== 'respuesta') });
  const inicio = Date.now();
  let primerToken = null;
  let primerTexto = null;
  let metaEn = null;
  let piezas = 0;
  let crudo = '';
  let cierre = {};
  for await (const parte of prov.stream(modelo, { instruccion: pedido.instruccionSistema, turnos: pedido.turnos, esquema: pedido.esquema, params })) {
    if (parte.texto === undefined) {
      cierre = parte;
      continue;
    }
    primerToken ??= Date.now() - inicio;
    crudo += parte.texto;
    const { meta, texto } = lector.agregar(parte.texto);
    if (meta) metaEn = Date.now() - inicio;
    if (texto) {
      primerTexto ??= Date.now() - inicio;
      piezas++;
    }
  }
  const total = Date.now() - inicio;
  const costo = sumarGasto(modelo, cierre.usage);
  const leido = lector.cerrar();
  const v = validar(crudo, pedido.esquema, idsDelContexto(pedido.instruccionSistema), pregunta.tipo);
  const enOrden = v.obj ? Object.keys(v.obj).join(',') === campos.join(',') : false;
  return {
    ruta: 'stream', total, primerToken, primerTexto, metaEn, piezas, fin: cierre.fin, finOk: cierre.fin === FIN_OK[modelo.proveedor],
    refusal: cierre.refusal, usage: cierre.usage, costo, ...v, enOrden, lectorOk: leido !== null, texto: crudo,
  };
};

// Parámetros: una llamada corta por variante (sin esquema), para ver qué acepta cada API.
const describirError = (err) => {
  if (err?.detalle) return `${err.detalle.status} ${err.detalle.tipo ?? err.detalle.estado ?? ''} ${err.detalle.mensaje}`.trim();
  if (err?.status) return `${err.status} ${err.code ?? err.type ?? ''} ${String(err.error?.message ?? err.message).slice(0, 160)}`.trim();
  return `${err?.name ?? 'Error'} ${err?.code ?? err?.cause?.code ?? ''} ${String(err?.message ?? '').slice(0, 120)}`.trim();
};
const PREGUNTA_CORTA = { instruccionSistema: 'Respondé en una oración, en español rioplatense.', turnos: [{ rol: 'usuario', texto: '¿Qué es un trámite?' }], esquema: null };
const probarParametros = async (modelo, prov) => {
  const variantes = {
    openai: [
      { nombre: 'temperature 0,3 + parámetros del sondeo', params: prov.parametros(modelo, { temperatura: true }) },
      { nombre: 'temperature 0,3 sin bajar el razonamiento', params: { temperature: TEMPERATURA }, soloSi: modelo.parametros.reasoning_effort },
      { nombre: 'razonamiento por defecto (sin reasoning_effort)', params: {}, soloSi: modelo.parametros.reasoning_effort },
      { nombre: 'reasoning_effort low', params: { reasoning_effort: 'low' }, soloSi: modelo.parametros.reasoning_effort },
    ],
    anthropic: [
      { nombre: 'thinking disabled + effort low', params: prov.parametros(modelo, { temperatura: false }) },
      { nombre: 'temperature 0,3', params: prov.parametros(modelo, { temperatura: true }) },
      { nombre: 'pensamiento adaptativo por defecto', params: {} },
    ],
    google: [
      { nombre: 'thinkingLevel minimal + temperature 0,3', params: prov.parametros(modelo, { temperatura: true }) },
      { nombre: 'pensamiento por defecto', params: {} },
    ],
  }[modelo.proveedor].filter((v) => v.soloSi === undefined || v.soloSi);
  const filas = [];
  for (const v of [...variantes, { nombre: 'tope de salida 16 tokens', params: prov.parametros(modelo, { temperatura: false }), maxTokens: 16 }]) {
    const inicio = Date.now();
    try {
      const r = await prov.normal(modelo, { instruccion: PREGUNTA_CORTA.instruccionSistema, turnos: PREGUNTA_CORTA.turnos, esquema: null, params: v.params, maxTokens: v.maxTokens ?? 300 });
      sumarGasto(modelo, r.usage);
      filas.push({ variante: v.nombre, acepta: 'sí', ms: Date.now() - inicio, fin: r.fin, salida: r.usage?.salida, razonamiento: r.usage?.razonamiento });
    } catch (err) {
      cortarSiSinCredito(err);
      cortarSiSinCreditoOtro(err);
      if (err instanceof TopeSuperado) throw err;
      filas.push({ variante: v.nombre, acepta: 'no', error: describirError(err) });
    }
  }
  return filas;
};

// Errores: un timeout y una clave inválida, para ver qué forma tiene cada uno.
const probarErrores = async (modelo, prov) => {
  const filas = [];
  const args = { instruccion: PREGUNTA_CORTA.instruccionSistema, turnos: PREGUNTA_CORTA.turnos, esquema: null, params: prov.parametros(modelo, { temperatura: false }), maxTokens: 50 };
  try {
    await prov.normal(modelo, { ...args, signal: AbortSignal.timeout(5) });
    filas.push({ caso: 'timeout (5 ms)', resultado: 'no cortó' });
  } catch (err) {
    filas.push({ caso: 'timeout (5 ms)', resultado: describirError(err) });
  }
  const falsa = 'clave-invalida-del-sondeo';
  const claveReal = process.env[modelo.clave];
  try {
    process.env[modelo.clave] = falsa;
    if (modelo.proveedor === 'openai') await new OpenAI({ apiKey: falsa, maxRetries: 0 }).chat.completions.create({ model: modelo.id, messages: [{ role: 'user', content: 'hola' }], max_completion_tokens: 5 });
    else await prov.normal(modelo, args);
    filas.push({ caso: 'clave inválida', resultado: 'no falló' });
  } catch (err) {
    filas.push({ caso: 'clave inválida', resultado: describirError(err).replace(falsa, '<clave falsa>') });
  } finally {
    process.env[modelo.clave] = claveReal;
  }
  return filas;
};

// --- Programa ----------------------------------------------------------------------------------
console.log(`Modelos: ${habilitados.map((m) => m.id).join(', ') || '(ninguno)'} · ${PREGUNTAS.length} preguntas × ${CORRIDAS} corridas × 2 rutas · tope ${TOPE_USD} USD`);
if (habilitados.length === 0) process.exit(0);

console.log('\nArmando los prompts reales (búsqueda real, sin llamar al modelo de la respuesta)...');
const pedidos = [];
for (const pregunta of PREGUNTAS) {
  const normal = await capturar(pregunta.texto, 'normal');
  const stream = await capturar(pregunta.texto, 'stream');
  if (!normal || !stream) {
    console.warn(`  "${pregunta.texto}" no llega al modelo (regla de entrada o caché): se saltea`);
    continue;
  }
  pedidos.push({ pregunta, normal, stream });
  console.log(`  "${pregunta.texto}": ${normal.instruccionSistema.length} caracteres, candidatos ${[...idsDelContexto(normal.instruccionSistema)].join(' ') || '(ninguno)'}`);
}
Object.assign(ia, original);

// Estimación: ~3,5 caracteres por token de entrada (castellano, conservador) y 400 de salida.
const llamadasPorModelo = pedidos.length * CORRIDAS * 2 + 8;
const entradaMedia = Math.round(pedidos.reduce((n, p) => n + p.normal.instruccionSistema.length, 0) / Math.max(1, pedidos.length) / 3.5);
const estimaciones = habilitados.map((m) => ({
  modelo: m.id,
  llamadas: llamadasPorModelo,
  'entrada estimada (tokens/llamada)': entradaMedia,
  'USD (sin caché)': Number((llamadasPorModelo * costoDe(m, { entrada: entradaMedia, cacheada: 0, salida: 400 })).toFixed(4)),
}));
console.log('\nEstimación del gasto:');
console.table(estimaciones);
const estimado = estimaciones.reduce((n, e) => n + e['USD (sin caché)'], 0);
console.log(`Total estimado: ${estimado.toFixed(4)} USD (tope ${TOPE_USD} USD)`);
if (estimado > TOPE_USD) {
  console.error('La estimación pasa el tope: bajá --corridas o subí SONDEO_TOPE_USD. No se corrió nada.');
  process.exit(1);
}
if (SOLO_ESTIMAR) {
  await prisma.$disconnect();
  process.exit(0);
}

const resultado = { fecha: new Date().toISOString(), corridas: CORRIDAS, tope: TOPE_USD, estimado, modelos: [] };
let corte = null;
try {
  for (const modelo of habilitados) {
    const prov = PROVEEDORES[modelo.proveedor];
    console.log(`\n=== ${modelo.id} (${modelo.proveedor}) ===`);
    const parametros = await probarParametros(modelo, prov);
    console.table(parametros);
    const aceptaTemperatura = parametros[0].acepta === 'sí';
    const params = prov.parametros(modelo, { temperatura: modelo.proveedor !== 'anthropic' && aceptaTemperatura });
    for (const [clave, valor] of Object.entries(PARAMETROS_EXTRA)) {
      if (valor === null) delete params[clave];
      else params[clave] = valor;
    }
    console.log(`Parámetros de las corridas: ${JSON.stringify(params)}`);

    const corridas = [];
    for (const p of pedidos) {
      for (let i = 0; i < CORRIDAS; i++) {
        for (const [ruta, correr, pedido] of [['normal', correrNormal, p.normal], ['stream', correrStream, p.stream]]) {
          try {
            corridas.push({ pregunta: p.pregunta.texto, ...(await correr(modelo, prov, pedido, params, p.pregunta)) });
          } catch (err) {
            cortarSiSinCredito(err);
            cortarSiSinCreditoOtro(err);
            if (err instanceof TopeSuperado) throw err;
            corridas.push({ pregunta: p.pregunta.texto, ruta, error: describirError(err) });
          }
        }
      }
      process.stdout.write('.');
    }
    console.log('');

    const errores = SIN_ERRORES ? [] : await probarErrores(modelo, prov);
    resultado.modelos.push({ id: modelo.id, proveedor: modelo.proveedor, params, parametros, corridas, errores });

    // Resumen por ruta.
    const filas = [];
    for (const ruta of ['normal', 'stream']) {
      const cs = corridas.filter((c) => c.ruta === ruta);
      const ok = cs.filter((c) => !c.error);
      const usos = ok.map((c) => c.usage).filter(Boolean);
      const costoMedio = ok.reduce((n, c) => n + (c.costo ?? 0), 0) / Math.max(1, ok.length);
      filas.push({
        ruta,
        corridas: cs.length,
        errores: cs.length - ok.length,
        'esquema ok': ok.filter((c) => c.esquemaOk).length,
        'fallan validación': ok.filter((c) => c.problemas.length > 0).length,
        'tipo esperado': ok.filter((c) => c.tipoEsperado === true).length,
        tuteo: ok.filter((c) => c.tuteo.length > 0).length,
        'fin ok': ok.filter((c) => c.finOk).length,
        refusal: ok.filter((c) => c.refusal).length,
        ...(ruta === 'stream' && {
          'en orden': ok.filter((c) => c.enOrden).length,
          'lector ok': ok.filter((c) => c.lectorOk).length,
          'piezas (mediana)': mediana(ok.map((c) => c.piezas)),
          'primer token ms': mediana(ok.map((c) => c.primerToken)),
        }),
        'primer texto ms': mediana(ok.map((c) => c.primerTexto)),
        'total ms': mediana(ok.map((c) => c.total)),
        'entrada (mediana)': mediana(usos.map((u) => u.entrada)),
        'cacheada (mediana)': mediana(usos.map((u) => u.cacheada)),
        'salida (mediana)': mediana(usos.map((u) => u.salida)),
        'razonamiento (mediana)': mediana(usos.map((u) => u.razonamiento)),
        'USD / 1000': Number((costoMedio * 1000).toFixed(3)),
      });
    }
    console.table(filas);
    resultado.modelos.at(-1).resumen = filas;
    const problemas = corridas.filter((c) => c.error || c.problemas?.length || c.tuteo?.length || c.tipoEsperado === false);
    for (const c of problemas) {
      console.log(`  - [${c.ruta}] "${c.pregunta}": ${c.error ?? [...(c.problemas ?? []), ...(c.tuteo?.length ? [`tuteo: ${c.tuteo.join(', ')}`] : []), ...(c.tipoEsperado === false ? [`tipo ${c.obj?.tipo}`] : [])].join('; ')}`);
    }
    if (errores.length) console.table(errores);
  }
} catch (err) {
  if (!(err instanceof CorridaSinCredito) && !(err instanceof TopeSuperado)) throw err;
  corte = err;
  console.error(`\n${err.message}`);
}

resultado.gasto = Number(gasto.toFixed(4));
resultado.valido = corte === null;
console.log(`\nGasto real (según el uso informado y los precios de modelos-candidatos.json): ${gasto.toFixed(4)} USD`);
const CARPETA = fileURLToPath(new URL('../eval-resultados/', import.meta.url));
mkdirSync(CARPETA, { recursive: true });
const archivo = join(CARPETA, `sondeo-modelos-${resultado.fecha.replace(/[:.]/g, '-')}.json`);
writeFileSync(archivo, JSON.stringify(resultado, null, 1));
console.log(`Resultado en ${archivo}`);
await prisma.$disconnect();

if (corte instanceof CorridaSinCredito) process.exitCode = SALIDA_SIN_CREDITO;
else if (corte) process.exitCode = 1;
