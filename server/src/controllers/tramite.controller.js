import * as tramiteService from '../services/tramite.service.js';
import { crearTramiteSchema, actualizarTramiteSchema } from '../validators/tramite.validator.js';
import * as usuarioService from '../services/usuario.service.js';

export const crear = async (req, res) => {
  const datos = crearTramiteSchema.parse(req.body);
  const encargadoId = req.usuario.id;

  const tieneAcceso = await usuarioService.usuarioTieneSector(req.usuario.id, datos.sectorId);
  if (!tieneAcceso) {
    const error = new Error('No tenés asignado el sector indicado para el trámite.');
    error.statusCode = 403;
    throw error;
  }

  const tramite = await tramiteService.crearTramite(datos, encargadoId);
  res.status(201).json(tramite);
};

export const listar = async (req, res) => {
  const tramites = await tramiteService.listarTramites();
  res.json(tramites);
}

export const listarPublicados = async (req, res) => {
  const tramites = await tramiteService.listarPublicados();
  res.json(tramites);
};

export const obtener = async (req, res) => {
  const id = Number(req.params.id);
  const tramite = await tramiteService.obtenerTramitePorId(id);

  if (!tramite) {
    const error = new Error('Trámite no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  res.json(tramite);
};

export const actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const datos = actualizarTramiteSchema.parse(req.body);

  if (datos.sectorId !== undefined) {
    const tieneAcceso = await usuarioService.usuarioTieneSector(req.usuario.id, datos.sectorId);
    if (!tieneAcceso) {
      const error = new Error('No podés mover el trámite a un sector que no tenés asignado.');
      error.statusCode = 403;
      throw error;
    }
  }

  const tramite = await tramiteService.actualizarTramite(id, datos);
  res.json(tramite);
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.id);
  await tramiteService.eliminarTramite(id);
  res.status(204).send();
};

// Publicar y despublicar no pasan por puedeGestionarTramite (el supervisor aprueba
// trámites de cualquier sector), así que el 404 se resuelve acá.
const verificarExistencia = async (id) => {
  const tramite = await tramiteService.obtenerTramitePorId(id);
  if (!tramite) {
    const error = new Error('Trámite no encontrado.');
    error.statusCode = 404;
    throw error;
  }
};

export const publicar = async (req, res) => {
  const id = Number(req.params.id);
  await verificarExistencia(id);
  const tramite = await tramiteService.cambiarPublicacion(id, true);
  res.json({ mensaje: 'Trámite publicado', tramite });
};

export const despublicar = async (req, res) => {
  const id = Number(req.params.id);
  await verificarExistencia(id);
  const tramite = await tramiteService.cambiarPublicacion(id, false);
  res.json({ mensaje: 'Trámite despublicado', tramite });
};