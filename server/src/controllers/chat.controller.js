import * as chatService from '../services/chat.service.js';
import { ClienteDesconectadoError } from '../utils/plazo.js';
import { z } from 'zod';

// `tipo` es el que devolvió cada respuesta del asistente ("tipo" de POST /api/chat, "tipoRespuesta"
// del evento `fin`): una pista del cliente, no un dato confiable. Uno desconocido, o en un mensaje
// del usuario, se descarta sin error; sin él todo funciona como antes.
const mensajeSchema = z
  .object({
    rol: z.enum(['usuario', 'asistente']),
    texto: z.string().min(1, 'El texto es obligatorio').max(2000),
    tipo: z.enum(['respuesta', 'aclaracion', 'conversacion']).optional().catch(undefined),
  })
  .transform(({ tipo, ...mensaje }) => (mensaje.rol === 'asistente' && tipo ? { ...mensaje, tipo } : mensaje));

export const consultaMultivueltaSchema = z.object({
  pregunta: z.string().min(1).max(500).optional(),
  mensajes: z.array(mensajeSchema).min(1).max(20).optional(),
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
