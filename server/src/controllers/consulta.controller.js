import * as metricaService from '../services/metrica.service.js';
import prisma from '../config/prisma.js';
import { z } from 'zod';

const calificacionSchema = z.object({
  calificacion: z.union([z.literal(0), z.literal(1)]),
});

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
};

export const resumenConsultas = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(400).json({ error: 'ID de usuario no encontrado' });
  }

  const consultas = await prisma.consulta.findMany({
    where: { usuarioId },
    select: { encontrado: true },
  });

  const total = consultas.length;
  const encontradas = consultas.filter((c) => c.encontrado).length;

  res.json({
    total,
    encontradas,
    noEncontradas: total - encontradas,
  });
};

export const obtenerConsulta = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador de la consulta no es válido.');
    error.statusCode = 400;
    throw error;
  }

  const consulta = await prisma.consulta.findFirst({
    where: { id, usuarioId: req.usuario.id },
    select: {
      id: true,
      textoConsulta: true,
      encontrado: true,
      calificacion: true,
      fecha: true,
      tramite: { select: { id: true, nombre: true } },
    },
  });

  if (!consulta) {
    const error = new Error('Consulta no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  res.json(consulta);
};

export const calificarConsulta = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador de la consulta no es válido.');
    error.statusCode = 400;
    throw error;
  }

  const { calificacion } = calificacionSchema.parse(req.body);
  const consulta = await prisma.consulta.findFirst({
    where: { id, usuarioId: req.usuario.id },
    select: { id: true },
  });

  if (!consulta) {
    const error = new Error('Consulta no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  const actualizada = await prisma.consulta.update({
    where: { id },
    data: { calificacion },
    select: { id: true, calificacion: true },
  });

  res.json(actualizada);
};

export const calificarConsultaPublica = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador de la consulta no es válido.');
    error.statusCode = 400;
    throw error;
  }

  const { calificacion } = calificacionSchema.parse(req.body);
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

  const actualizada = await prisma.consulta.update({
    where: { id },
    data: { calificacion },
    select: { id, calificacion: true },
  });

  res.json(actualizada);
};

export const eliminarConsulta = async (req, res) => {
  const { id } = req.params;

  const consulta = await prisma.consulta.findUnique({
    where: { id: parseInt(id) },
  });

  if (!consulta) {
    return res.status(404).json({ error: 'Consulta no encontrada' });
  }

  if (consulta.usuarioId !== req.usuario.id) {
    return res.status(403).json({ error: 'No autorizado para eliminar esta consulta' });
  }

  await prisma.consulta.delete({
    where: { id: parseInt(id) },
  });

  res.json({ message: 'Consulta eliminada correctamente' });
};