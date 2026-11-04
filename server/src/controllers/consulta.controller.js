import * as metricaService from '../services/metrica.service.js';
import * as consultaService from '../services/consulta.service.js';
import { calificarSchema } from '../validators/consulta.validator.js';

const noEncontrada = () => {
  const error = new Error('Consulta no encontrada.');
  error.statusCode = 404;
  return error;
};

export const misConsultas = async (req, res) => {
  const consultas = await metricaService.consultasDeUsuario(req.usuario.id);
  res.json(consultas);
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
