import * as sectorService from '../services/sector.service.js';
import { actualizarSectorSchema, crearSectorSchema } from '../validators/sector.validator.js';

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

export const actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const datos = actualizarSectorSchema.parse(req.body);
  const existente = await sectorService.obtenerSectorPorId(id);
  if (!existente) {
    const e = new Error('Sector no encontrado.')
    e.statusCode = 404;
    throw e;
  }
  // Solo el update puede cerrar un ciclo: un sector recién creado todavía no
  // tiene descendientes que puedan apuntarle de vuelta. Se saltea cuando el
  // campo no vino (no se toca el padre) o vino null (pasa a ser raíz), porque
  // ninguno de los dos casos puede formar un bucle.
  if (datos.parentId != null && await sectorService.generariaCiclo(id, datos.parentId)) {
    const e = new Error('El sector no puede depender de sí mismo ni de uno de sus descendientes.');
    e.statusCode = 409;
    throw e;
  }

  res.json(await sectorService.actualizarSector(id, datos));
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);
  await sectorService.eliminarSector(id);
  res.status(204).send();
};