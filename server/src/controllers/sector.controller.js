import * as sectorService from '../services/sector.services.js';
import { crearSectorSchema, actualizarSectorSchema, crearSectorSchema } from '../validators/sector.validator.js';

export const crear = async (req, res) => {
  const datos = crearSectorSchema.parse(req.body);
  const sector = await sectorService.crearSector(datos);
  res.status(201).json(sector);
};

export const listar = async (req, res) => {
  const sectores = await sectorService.listarSectores();
  res.json(sectores);
};

export const obtener = async (req, res) => {
  const id = Number(req.params.id);
  const sector = await sectorService.obtenerSectorPorId(id);

  if (!sector) {
    const error = new Error('Sector no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  res.json(sector);
};

const actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const datos = actualizarSectorSchema.parse(req.body);
  const sector = await sectorService.obtenerSectorPorId(id);
  res.json(sector);
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);
  await sectorService.eliminarSector(id);
  res.status(204).send();
};