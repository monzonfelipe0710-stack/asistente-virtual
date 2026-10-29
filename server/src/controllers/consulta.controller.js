import * as metricaService from '../services/metrica.service.js';
import prisma from '../config/prisma.js';
import { z } from 'zod';

const calificacionSchema = z
  .object({
    calificacion: z.union([z.literal(0), z.literal(1)]),
    motivo: z.string().trim().max(300, 'El motivo es demasiado largo.').optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.calificacion === 0 && !datos.motivo) {
      ctx.addIssue({
        code: 'custom',
        path: ['motivo'],
        message: 'Contanos brevemente por qué no te sirvió la respuesta.',
      });
    }
  });

const parsearId = (valor) => {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador de la consulta no es válido.');
    error.statusCode = 400;
    throw error;
  }
  return id;
};

const guardarCalificacion = async (id, { calificacion, motivo }) => {
  return prisma.consulta.update({
    where: { id },
    data: {
      calificacion,
      motivoCalificacion: calificacion === 0 ? motivo : null,
    },
    select: { id: true, calificacion: true, motivoCalificacion: true },
  });
};

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
};

export const calificarConsulta = async (req, res) => {
  const id = parsearId(req.params.id);
  const datos = calificacionSchema.parse(req.body);

  const consulta = await prisma.consulta.findFirst({
    where: { id, usuarioId: req.usuario.id },
    select: { id: true },
  });

  if (!consulta) {
    const error = new Error('Consulta no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  res.json(await guardarCalificacion(id, datos));
};

export const calificarConsultaPublica = async (req, res) => {
  const id = parsearId(req.params.id);
  const datos = calificacionSchema.parse(req.body);

  // Este endpoint solo permite calificar consultas anónimas; no expone consultas de cuentas.
  const consulta = await prisma.consulta.findFirst({
    where: { id, usuarioId: null },
    select: { id: true },
  });

  if (!consulta) {
    const error = new Error('Consulta anónima no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  res.json(await guardarCalificacion(id, datos));
};
