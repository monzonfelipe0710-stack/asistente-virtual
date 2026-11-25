import * as documentoService from '../services/documento.service.js';
import { usuarioTieneSector } from '../services/usuario.service.js';
import { buscarInstruccion } from '../services/sanitizacion.service.js';
import { subirDocumentoSchema, actualizarDocumentoSchema } from '../validators/documento.validator.js';

const conEstado = (statusCode, mensaje) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const noEncontrado = (mensaje) => conEstado(404, mensaje);

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

// Un documento es un archivo (multipart, campo `archivo`) o un enlace (`urlExterna`), nunca los dos.
export const subir = async (req, res) => {
  const { nombre, urlExterna } = subirDocumentoSchema.parse(req.body ?? {});
  if (req.file && urlExterna) throw conEstado(400, 'Enviá un archivo o una URL externa, no los dos.');
  if (!req.file && !urlExterna) throw conEstado(400, 'No se envió ningún archivo ni URL externa.');
  if (urlExterna && !nombre) throw conEstado(400, 'Un enlace necesita un nombre.');
  // Sin nombre se usa el del archivo, que también le llega al modelo: se revisa como cualquier texto.
  const hallazgo = req.file && !nombre ? buscarInstruccion(req.file.originalname) : null;
  if (hallazgo) {
    throw conEstado(400, `El nombre del archivo tiene una frase con forma de instrucción para el asistente ("${hallazgo.frase}"). Mandá un nombre para el documento.`);
  }

  const documento = req.file
    ? await documentoService.subirDocumento(req.file, { nombre, tramiteId: req.tramite.id })
    : await documentoService.crearEnlace({ nombre, urlExterna, tramiteId: req.tramite.id });

  res.status(201).json(documento);
};

export const actualizar = async (req, res) => {
  const documento = await obtenerDocumentoDelTramite(req);
  const { nombre, urlExterna } = actualizarDocumentoSchema.parse(req.body ?? {});
  if (req.file && urlExterna) throw conEstado(400, 'Enviá un archivo o una URL externa, no los dos.');
  if (!req.file && urlExterna === undefined && nombre === undefined) throw conEstado(400, 'No hay nada para actualizar.');

  res.json(await documentoService.actualizarDocumento(documento, { nombre, urlExterna, archivo: req.file }));
};

export const listar = async (req, res) => {
  const tramite = await obtenerTramiteVisible(req);
  const documentos = await documentoService.listarPorTramite(tramite.id);
  res.json(documentos);
};

export const descargar = async (req, res) => {
  await obtenerTramiteVisible(req);
  const documento = await obtenerDocumentoDelTramite(req);
  const url = await documentoService.generarUrlDescarga(documento);
  res.json({ url, externa: Boolean(documento.urlExterna) });
};

export const eliminar = async (req, res) => {
  const documento = await obtenerDocumentoDelTramite(req);
  await documentoService.eliminarDocumento(documento);
  res.status(204).send();
};
