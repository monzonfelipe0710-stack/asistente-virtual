import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import prisma from '../config/prisma.js';
import { r2, R2_BUCKET } from '../config/r2.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as cache from './cache.service.js';
import { esUrlHttp } from '../validators/documento.validator.js';
import { TOPES_CAMPOS, sanitizarTexto } from './sanitizacion.service.js';
import { EXTENSIONES } from '../config/multer.js';

// Sin el campo archivo: la key de R2 no sale del server. La URL externa es pública.
const PUBLICO = { id: true, nombre: true, tipo: true, urlExterna: true, createdAt: true };

export const listarPorTramite = async (tramiteId) => {
  return prisma.documento.findMany({
    where: { tramiteId },
    select: PUBLICO,
    orderBy: { createdAt: 'desc' },
  });
};

export const obtenerTramite = async (id) => {
  return prisma.tramite.findUnique({
    where: { id },
    select: { id: true, publicado: true, sectorId: true },
  });
};

export const obtenerPorId = async (id) => {
  return prisma.documento.findUnique({ where: {id} });
};

const subirArchivoAR2 = async (archivo) => {
  const key = `documentos/${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: archivo.buffer,
    ContentType: archivo.mimetype,
  }));
  return key;
};

const borrarDeR2 = (key) => r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));

export const subirDocumento = async (archivo, datos) => {
  const key = await subirArchivoAR2(archivo);
  let documento;
  try {
    documento = await prisma.documento.create({
      data: {
        nombre: datos.nombre || sanitizarTexto(archivo.originalname, { multilinea: false, tope: TOPES_CAMPOS.documento }) || 'Documento',
        archivo: key,
        tipo: archivo.mimetype,
        tramiteId: datos.tramiteId,
      },
      select: { ...PUBLICO, tramiteId: true },
    });
  } catch (error) {
    await eliminarArchivos([key]);
    throw error;
  }
  cache.limpiar();
  return documento;
};

export const crearEnlace = async ({ nombre, urlExterna, tramiteId }) => {
  const documento = await prisma.documento.create({
    data: { nombre, urlExterna, tipo: null, tramiteId },
    select: { ...PUBLICO, tramiteId: true },
  });
  cache.limpiar();
  return documento;
};

// `archivo` (multer) o `urlExterna` reemplazan lo que tenía el documento; la clave anterior en
// R2 se borra recién después de actualizar el registro.
export const actualizarDocumento = async (documento, { nombre, urlExterna, archivo }) => {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (archivo) {
    Object.assign(data, { archivo: await subirArchivoAR2(archivo), urlExterna: null, tipo: archivo.mimetype });
  } else if (urlExterna !== undefined) {
    Object.assign(data, { urlExterna, archivo: null, tipo: null });
  }

  let actualizado;
  try {
    actualizado = await prisma.documento.update({ where: { id: documento.id }, data, select: { ...PUBLICO, tramiteId: true } });
  } catch (error) {
    if (archivo) await eliminarArchivos([data.archivo]);
    throw error;
  }
  if (documento.archivo && data.archivo !== undefined && data.archivo !== documento.archivo) {
    await eliminarArchivos([documento.archivo]);
  }
  cache.limpiar();
  return actualizado;
};

// Un enlace externo se devuelve tal cual (si es http/https); un archivo, con una URL firmada de R2.
export const generarUrlDescarga = async (documento) => {
  if (documento.urlExterna) {
    if (!esUrlHttp(documento.urlExterna)) {
      const error = new Error('El enlace del documento no es válido.');
      error.statusCode = 409;
      throw error;
    }
    return documento.urlExterna;
  }

  const comando = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: documento.archivo,
  });

  return getSignedUrl(r2, comando, {expiresIn: 300 });
};

export const eliminarDocumento = async (documento) => {
  const eliminado = await prisma.documento.delete({ where: { id: documento.id } });
  await eliminarArchivos([documento.archivo]);
  cache.limpiar();
  return eliminado;
};

// Borra de R2 los archivos de documentos cuyos registros ya se eliminaron (por
// ejemplo, en cascada al borrar un trámite). Un fallo solo se loguea: el registro
// ya no existe y no tiene sentido revertir la operación por un archivo huérfano.
export const eliminarArchivos = async (keys) => {
  const conArchivo = keys.filter(Boolean);
  const resultados = await Promise.allSettled(conArchivo.map(borrarDeR2));

  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Error al borrar de R2 el archivo ${conArchivo[i]}`, r.reason?.message);
    }
  });
};
