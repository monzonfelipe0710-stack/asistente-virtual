import * as chatService from '../services/chat.service.js';
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
  const { pregunta } = consultaSchema.parse(req.body);

  const resultado = await chatService.responderConsulta(pregunta, req.usuario?.id ?? null);

  res.json(resultado);
};

export const consultarStream = async (req, res) => {
  const { pregunta } = consultaSchema.parse(req.body);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let clienteDesconectado = false;
  res.on('close', () => { clienteDesconectado = true; });

  try {
    for await (const evento of chatService.responderConsultaStream(pregunta, req.usuario?.id ?? null)) {
      if (clienteDesconectado) break;
      res.write(`data: ${JSON.stringify(evento)}\n\n`);
    }
  } catch (err) {
    console.error('Error en streaming del chat:', err.message);
    if (!clienteDesconectado) {
      res.write(`data: ${JSON.stringify({ tipo: 'error', mensaje: 'Ocurrió un error procesando la consulta.' })}\n\n`);
    }
  } finally {
    res.end();
  }
};
