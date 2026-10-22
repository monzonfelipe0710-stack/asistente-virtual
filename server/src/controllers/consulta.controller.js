import * as metricaService from '../services/metrica.service.js';
import prisma from '../config/prisma.js';

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
};

export const resumenConsultas = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(400).json({ error: 'ID de usuario no encontrado' });
    }

    // Versión simplificada - obtenemos las consultas y contamos en memoria
    const consultas = await prisma.consulta.findMany({
      where: { usuarioId },
      select: { encontrado: true },
    });

    const total = consultas.length;
    const encontradas = consultas.filter(c => c.encontrado).length;
    const noEncontradas = total - encontradas;

    res.json({
      total,
      encontradas,
      noEncontradas,
    });
  } catch (error) {
    console.error('Error en resumenConsultas:', error);
    // Devolvemos ceros si hay error para no romper la app
    res.json({
      total: 0,
      encontradas: 0,
      noEncontradas: 0,
    });
  }
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