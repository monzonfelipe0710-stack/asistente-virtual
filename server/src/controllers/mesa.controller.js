import * as mesaService from '../services/mesa.service.js';
import { crearMesaSchema, actualizarMesaSchema } from '../validators/mesa.validator.js';

export const listar = async (req, res) => {
  res.json(await mesaService.listarMesas());
};

export const obtener = async (req, res) => {
  const mesa = await mesaService.obtenerMesa(Number(req.params.id));
  if (!mesa) {
    const error = new Error('Mesa de entrada no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  res.json(mesa);
};

export const crear = async (req, res) => {
  const datos = crearMesaSchema.parse(req.body);

  if (datos.sectorId != null && !(await mesaService.sectorExiste(datos.sectorId))) {
    const error = new Error('El sector indicado no existe.');
    error.statusCode = 400;
    throw error;
  }

  const mesa = await mesaService.crearMesa(datos);
  res.status(201).json({ mensaje: 'Mesa de entrada creada.', mesa });
};

export const actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const datos = actualizarMesaSchema.parse(req.body);

  if (!(await mesaService.obtenerMesa(id))) {
    const error = new Error('Mesa de entrada no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  if (datos.sectorId != null && !(await mesaService.sectorExiste(datos.sectorId))) {
    const error = new Error('El sector indicado no existe.');
    error.statusCode = 400;
    throw error;
  }

  const mesa = await mesaService.actualizarMesa(id, datos);
  res.json({ mensaje: 'Mesa de entrada actualizada.', mesa });
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);

  if (!(await mesaService.obtenerMesa(id))) {
    const error = new Error('Mesa de entrada no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  if (await mesaService.contarTramitesDeMesa(id) > 0) {
    const error = new Error('No se puede eliminar: la mesa tiene trámites asociados.');
    error.statusCode = 409;
    throw error;
  }

  await mesaService.eliminarMesa(id);
  res.json({ mensaje: 'Mesa de entrada eliminada.' });
};
