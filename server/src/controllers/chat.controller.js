import * as chatService from '../services/chat.service.js';
import prisma from '../config/prisma.js';
import { z } from 'zod';

const consultaSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta es obligatoria').max(500, 'La pregunta es demasiado larga'),
});

export const consultar = async (req, res) => {
  const { pregunta } = consultaSchema.parse(req.body);

  const resultado = await chatService.responderConsulta(
    pregunta,
    req.usuario?.id ?? null,
    req.file ?? null,
  );

  res.json(resultado);
};

export const obtenerChecklist = async (req, res) => {
  const tramiteId = Number(req.params.tramiteId);
  if (!Number.isSafeInteger(tramiteId) || tramiteId < 1) {
    const error = new Error('El identificador del trámite no es válido.');
    error.statusCode = 400;
    throw error;
  }

  const tramite = await prisma.tramite.findFirst({
    where: { id: tramiteId, publicado: true },
    include: {
      requisitos: { orderBy: { id: 'asc' } },
      mesas: { include: { mesa: true } },
      documentos: { select: { nombre: true } },
    },
  });

  if (!tramite) {
    const error = new Error('Trámite no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    ...tramite,
    mesas: tramite.mesas.map(({ mesa }) => mesa),
  });
};
