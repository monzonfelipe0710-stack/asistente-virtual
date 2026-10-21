import * as chatService from '../services/chat.service.js';
import prisma from '../config/prisma.js';
import { z } from 'zod';

export const consultaSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta es obligatoria').max(500, 'La pregunta es demasiado larga'),
});

export const consultar = async (req, res) => {
  const { pregunta } = consultaSchema.parse(req.body);

  const resultado = await chatService.responderConsulta(pregunta, req.usuario?.id ?? null);

  res.json(resultado);
};

export const checklist = async (req, res) => {
  const id = Number(req.params.tramiteId);

  const tramite = await prisma.tramite.findUnique({
    where: { id, publicado: true },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      costo: true,
      requisitos: {
        select: { descripcion: true, dondeSeConsigue: true, costo: true },
        orderBy: { id: 'asc' },
      },
      mesas: {
        select: { mesa: { select: { nombre: true, direccion: true, localidad: true } } },
      },
      documentos: { select: { id: true, nombre: true } },
    },
  });

  if (!tramite) {
    return res.status(404).json({ error: 'Trámite no encontrado.' });
  }

  res.json({
    ...tramite,
    costo: tramite.costo == null || Number(tramite.costo) === 0 ? null : Number(tramite.costo),
    mesas: tramite.mesas.map((m) => m.mesa),
  });
};