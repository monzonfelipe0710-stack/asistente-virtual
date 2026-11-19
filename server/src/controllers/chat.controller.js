import * as chatService from '../services/chat.service.js';
import { ClienteDesconectadoError } from '../utils/plazo.js';
import { z } from 'zod';
import { LIMITES_CHAT } from '../config/chat.js';

// `tipo` es el que devolvió cada respuesta del asistente ("tipo" de POST /api/chat, "tipoRespuesta"
// del evento `fin`): una pista del cliente, no un dato confiable. Uno desconocido, o en un mensaje
// del usuario, se descarta sin error; sin él todo funciona como antes.
// Solo hay dos roles y lo que no es del esquema se descarta: un mensaje no puede traer otro rol ni
// instrucciones. El texto de la persona tiene el mismo tope que la pregunta.
const { pregunta: MAX_PREGUNTA, textoAsistente: MAX_ASISTENTE, mensajes: MAX_MENSAJES } = LIMITES_CHAT;
const mensajeSchema = z
  .object({
    rol: z.enum(['usuario', 'asistente'], { error: 'El rol de cada mensaje tiene que ser "usuario" o "asistente".' }),
    texto: z.string({ error: 'El texto es obligatorio' }).min(1, 'El texto es obligatorio'),
    tipo: z.enum(['respuesta', 'aclaracion', 'conversacion']).optional().catch(undefined),
  })
  .refine((m) => m.texto.length <= (m.rol === 'usuario' ? MAX_PREGUNTA : MAX_ASISTENTE), {
    error: (issue) => `Cada mensaje puede tener hasta ${issue.input.rol === 'usuario' ? MAX_PREGUNTA : MAX_ASISTENTE} caracteres.`,
  })
  .transform(({ tipo, ...mensaje }) => (mensaje.rol === 'asistente' && tipo ? { ...mensaje, tipo } : mensaje));

export const consultaMultivueltaSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta no puede estar vacía.').max(MAX_PREGUNTA, `La pregunta puede tener hasta ${MAX_PREGUNTA} caracteres.`).optional(),
  mensajes: z.array(mensajeSchema).min(1, 'Faltan los mensajes.').max(MAX_MENSAJES, `La conversación puede tener hasta ${MAX_MENSAJES} mensajes.`).optional(),
}).refine((d) => d.pregunta || d.mensajes, { message: 'Falta la pregunta o los mensajes.' });

export const consultar = async (req, res) => {
  const datos = consultaMultivueltaSchema.parse(req.body);
  const mensajes = datos.mensajes ?? [{ rol: 'usuario', texto: datos.pregunta }];

  if (mensajes[mensajes.length - 1].rol !== 'usuario') {
    const error = new Error('El último mensaje debe ser del usuario.');
    error.statusCode = 400;
    throw error;
  }

  const resultado = await chatService.responderConsulta(mensajes, req.usuario ?? null);
  res.json(resultado);
};

export const consultarStream = async (req, res) => {
  const datos = consultaMultivueltaSchema.parse(req.body);
  const mensajes = datos.mensajes ?? [{ rol: 'usuario', texto: datos.pregunta }];

  if (mensajes[mensajes.length - 1].rol !== 'usuario') {
    const error = new Error('El último mensaje debe ser del usuario.');
    error.statusCode = 400;
    throw error;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // `close` también llega al terminar bien: solo es desconexión si la respuesta no se cerró.
  // Se cancela la llamada al modelo para no seguir gastando tokens.
  const cancelacion = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) cancelacion.abort(new ClienteDesconectadoError());
  });

  try {
    const eventos = chatService.responderConsultaStream(mensajes, req.usuario ?? null, { signal: cancelacion.signal });
    for await (const evento of eventos) {
      if (cancelacion.signal.aborted) break;
      res.write(`data: ${JSON.stringify(evento)}\n\n`);
    }
  } catch (err) {
    if (cancelacion.signal.aborted) return;
    // La causa de una falla del modelo ya quedó en el log del servicio.
    const noDisponible = err instanceof chatService.AsistenteNoDisponibleError;
    if (!noDisponible) console.error('Error en streaming del chat:', err);
    const mensaje = noDisponible ? err.message : 'Ocurrió un error procesando la consulta.';
    res.write(`data: ${JSON.stringify({ tipo: 'error', mensaje })}\n\n`);
  } finally {
    res.end();
  }
};
