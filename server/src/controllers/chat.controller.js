import * as chatService from '../services/chat.service.js';
import { z } from 'zod';

const mensajeSchema = z.object({
  rol: z.enum(['usuario', 'asistente']),
  texto: z.string().min(1, 'El texto es obligatorio').max(2000),
});

const consultaMultivueltaSchema = z.object({
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

  const resultado = await chatService.responderConsulta(mensajes, req.usuario?.id ?? null);
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

  let clienteDesconectado = false;
  res.on('close', () => { clienteDesconectado = true; });

  try {
    for await (const evento of chatService.responderConsultaStream(mensajes, req.usuario?.id ?? null)) {
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
