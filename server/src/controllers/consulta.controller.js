import * as metricaService from '../services/metrica.service.js';
import prisma from '../config/prisma.js';
import { z } from 'zod';
import * as consultaService from '../services/consulta.service.js';
import { calificarSchema, filtroCalificacionesSchema } from '../validators/consulta.validator.js';

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

const guardarCalificacionPublica = async (id, { calificacion, motivo }) => {
  return prisma.consulta.update({
    where: { id },
    data: {
      calificacion,
      motivoCalificacion: calificacion === 0 ? motivo : null,
    },
    select: { id: true, calificacion: true, motivoCalificacion: true },
  });
};

const noEncontrada = () => {
  const error = new Error('Consulta no encontrada.');
  error.statusCode = 404;
  return error;
};

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
};

export const calificarConsultaPublica = async (req, res) => {
  const id = parsearId(req.params.id);
  const datos = calificacionSchema.parse(req.body);

  const consulta = await prisma.consulta.findFirst({
    where: { id, usuarioId: null },
    select: { id: true },
  });

  if (!consulta) {
    const error = new Error('Consulta anónima no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  res.json(await guardarCalificacionPublica(id, datos));
};

// 404 y no 403 cuando no está autorizado: no revela qué ids existen.
export const calificar = async (req, res) => {
  const { calificacion, motivo, token } = calificarSchema.parse(req.body);
  const id = Number(req.params.id);

  const consulta = await consultaService.buscarParaCalificar(id);
  const esDueno = req.usuario != null && consulta?.usuarioId === req.usuario.id;
  if (!consulta || !(esDueno || consultaService.tokenCoincide(token, consulta.calificarToken))) {
    throw noEncontrada();
  }

  const motivoFinal = calificacion === 0 && motivo ? motivo : null;
  if (!(await consultaService.guardarCalificacion(id, calificacion, motivoFinal))) {
    const error = new Error('La consulta ya fue calificada.');
    error.statusCode = 409;
    throw error;
  }

  res.json({ consultaId: id, calificacion });
};

// req.sectorIds lo fija alcanceSectores: el ADM ve los trámites de sus sectores.
export const calificaciones = async (req, res) => {
  const filtros = filtroCalificacionesSchema.parse(req.query);
  res.json(await consultaService.listarCalificaciones({ ...filtros, sectorIds: req.sectorIds }));
};

export const quitarDelHistorial = async (req, res) => {
  if (!(await consultaService.quitarDelHistorial(Number(req.params.id), req.usuario.id))) {
    throw noEncontrada();
  }
  res.status(204).send();
};
