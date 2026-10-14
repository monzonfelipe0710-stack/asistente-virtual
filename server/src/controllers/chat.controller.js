import * as chatService from '../services/chat.service.js';
import { z } from 'zod';

const consultaSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta es obligatoria').max(500, 'La pregunta es demasiado larga'),
});

export const consultar = async (req, res) => {
  const { pregunta } = consultaSchema.parse(req.body);

  const resultado = await chatService.responderConsulta(pregunta);

  res.json(resultado);
};