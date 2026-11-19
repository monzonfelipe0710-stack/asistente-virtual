import * as metricaService from '../services/metrica.service.js';
import * as consultaService from '../services/consulta.service.js';
import * as usuarioService from '../services/usuario.service.js';
import { calificarSchema, filtroCalificacionesSchema } from '../validators/consulta.validator.js';

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

// Mismo alcance que métricas con alcance=propias: el ADM ve los trámites de sus sectores.
export const calificaciones = async (req, res) => {
  const filtros = filtroCalificacionesSchema.parse(req.query);
  const sectorIds = req.usuario.rol === 'SUPERUSUARIO'
    ? null
    : (await usuarioService.listarSectoresDeUsuario(req.usuario.id)).map((s) => s.id);

  res.json(await consultaService.listarCalificaciones({ ...filtros, sectorIds }));
};

export const quitarDelHistorial = async (req, res) => {
  if (!(await consultaService.quitarDelHistorial(Number(req.params.id), req.usuario.id))) {
    throw noEncontrada();
  }
  res.status(204).send();
};
