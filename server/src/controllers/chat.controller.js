import * as chatService from '../services/chat.service.js';
import { z } from 'zod';

const consultaSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta es obligatoria').max(500, 'La pregunta es demasiado larga'),
});

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
