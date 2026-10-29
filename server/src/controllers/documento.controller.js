import * as documentoService from '../services/documento.service.js';
import { usuarioTieneSector } from '../services/usuario.service.js';
import { subirDocumentoSchema } from '../validators/documento.validator.js';

const noEncontrado = (mensaje) => {
  const error = new Error(mensaje);
  error.statusCode = 404;
  return error;
};

const puedeVerBorrador = async (usuario, tramite) => {
  if (usuario?.rol === 'SUPERUSUARIO') return true;
  if (usuario?.rol === 'ADMINISTRADOR') return usuarioTieneSector(usuario.id, tramite.sectorId);
  return false;
};

// Los documentos siguen la visibilidad de su trámite: si está publicado son públicos;
// si es un borrador, solo los ve el SUPERUSUARIO o un ADMINISTRADOR de su sector.
// A cualquier otro se le responde 404 (no 403) para no revelar que el borrador existe.
const obtenerTramiteVisible = async (req) => {
  const tramite = await documentoService.obtenerTramite(Number(req.params.id));

  if (!tramite || (!tramite.publicado && !(await puedeVerBorrador(req.usuario, tramite)))) {
    throw noEncontrado('Trámite no encontrado.');
  }

  return tramite;
};

// Busca el documento :docId y exige que pertenezca al trámite :id de la URL. Sin
// este chequeo, el dueño de un trámite podía operar sobre documentos de otro
// trámite con solo cambiar el docId, porque puedeGestionarTramite valida el :id y nada más.
const obtenerDocumentoDelTramite = async (req) => {
  const id = Number(req.params.docId);
  const tramiteId = Number(req.params.id);
  const documento = await documentoService.obtenerPorId(id);

  if (!documento || documento.tramiteId !== tramiteId) {
    throw noEncontrado('Documento no encontrado.');
  }

  return documento;
};

export const subir = async (req, res) => {
  if (!req.file) {
    const error = new Error('No se envió ningún archivo.');
    error.statusCode = 400;
    throw error;
  }

  const { nombre } = subirDocumentoSchema.parse(req.body ?? {});

  const documento = await documentoService.subirDocumento(req.file, {
    nombre,
    tramiteId: req.tramite.id,
  });

  res.status(201).json(documento);
};

export const listar = async (req, res) => {
  const tramite = await obtenerTramiteVisible(req);
  const documentos = await documentoService.listarPorTramite(tramite.id);
  res.json(documentos);
};

export const descargar = async (req, res) => {
  await obtenerTramiteVisible(req);
  const documento = await obtenerDocumentoDelTramite(req);
  const url = await documentoService.generarUrlDescarga(documento.archivo);
  res.json({ url });
};

export const eliminar = async (req, res) => {
  const documento = await obtenerDocumentoDelTramite(req);
  await documentoService.eliminarDocumento(documento);
  res.status(204).send();
};
