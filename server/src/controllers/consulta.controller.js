import * as metricaService from '../services/metrica.service.js';

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
};

export const calificar = async (req, res) => {
  const id = Number(req.params.id);
  const { calificacion } = req.body;

  if (![0, 1].includes(calificacion)) {
    return res.status(400).json({ error: 'La calificación debe ser 1 (positiva) o 0 (negativa).' });
  }

  const actualizada = await metricaService.calificarConsulta(id, req.usuario.id, calificacion);
  if (!actualizada) {
    return res.status(404).json({ error: 'Consulta no encontrada.' });
  }
  res.json(actualizada);
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'El identificador de la consulta no es válido.' });
  }

  const eliminada = await metricaService.eliminarConsulta(id, req.usuario.id);
  if (!eliminada) {
    return res.status(404).json({ error: 'Consulta no encontrada.' });
  }
  res.json({ ok: true });
};

export const resumen = async (req, res) => {
  const datos = await metricaService.resumenActividad(req.usuario.id);
  res.json(datos);
};
