import * as tramiteService from '../services/tramite.service.js';
import { crearTramiteSchema, actualizarTramiteSchema } from '../validators/tramite.validator.js';

export const crear = async (req, res) => {
  const datos = crearTramiteSchema.parse(req.body);
  const encargadoId = req.usuario.id;

  const tramite = await tramiteService.crearTramite(datos, encargadoId);
  res.status(201).json(tramite);
};

export const listar = async (req, res) => {
  const tramites = await tramiteService.listarTramites();
  res.json(tramites);
}

export const obtener = async (req, res) => {
  const id = Number(req.params.id);
  const tramite = await tramiteService.obtenerTramitePorId(id);

  if (!tramite) {
    const error = new Error('Tramite no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  res.json(tramite);
};

export const actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const datos = actualizarTramiteSchema.parse(req.body);

  const tramite = await tramiteService.actualizarTramite(id, datos);
  res.json(tramite);
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);
  await tramiteService.eliminarTramite(id);
  res.status(204).send();
};