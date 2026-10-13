import * as documentoService from '../services/documento.service.js';

// Busca el documento :docId y exige que pertenezca al trámite :id de la URL. Sin
// este chequeo, el dueño de un trámite podía operar sobre documentos de otro
// trámite con solo cambiar el docId, porque esPropietario valida el :id y nada más.
const obtenerDocumentoDelTramite = async (req) => {
  const id = Number(req.params.docId);
  const tramiteId = Number(req.params.id);
  const documento = await documentoService.obtenerPorId(id);

  if (!documento || documento.tramiteId !== tramiteId) {
    const error = new Error('Documento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return documento;
};

export const subir = async (req, res) => {
  if (!req.file) {
    const error = new Error('No se envió ningún archivo.');
    error.statusCode = 400;
    throw error;
  }

  const documento = await documentoService.subirDocumento(req.file, {
    nombre: req.body.nombre,
    tramiteId: req.tramite.id,
  });

  res.status(201).json(documento);
};

export const listar = async (req, res) => {
  const tramiteId = Number(req.params.id);
  const documentos = await documentoService.listarPorTramite(tramiteId);
  res.json(documentos);
};

export const descargar = async (req, res) => {
  const documento = await obtenerDocumentoDelTramite(req);
  const url = await documentoService.generarUrlDescarga(documento.archivo);
  res.json({ url });
};

export const eliminar = async (req, res) => {
  const documento = await obtenerDocumentoDelTramite(req);
  await documentoService.eliminarDocumento(documento);
  res.status(204).send();
};
