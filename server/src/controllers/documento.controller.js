import * as documentoService from '../services/documento.service.js';

export const subir = async (req, res) => {
  if (!req.file) {
    const error = new Error('No se envio ningun archivo.');
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
  const id = Number(req.params.docId);
  const documento = await documentoService.obtenerPorId(id);

  if (!documento) {
    const error = new Error('Documento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const url = await documentoService.generarUrlDescarga(documento.archivo);
  res.json({ url });
};

export const eliminar = async (req, res) => {
  const id = Number(req.params.docId);
  const documento = await documentoService.obtenerPorId(id);

  if (!documento) {
    const error = new Error('Documento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  await documentoService.eliminarDocumento(documento);
  res.status(204).send();
};