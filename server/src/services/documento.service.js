import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import prisma from '../config/prisma.js';
import { r2, R2_BUCKET } from '../config/r2.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as cache from './cache.service.js';

export const listarPorTramite = async (tramiteId) => {
  return prisma.documento.findMany({
    where: { tramiteId },
    orderBy: { createdAt: 'desc' },
  });
};

export const obtenerPorId = async (id) => {
  return prisma.documento.findUnique({ where: {id} });
};

export const subirDocumento = async (archivo, datos) => {
  const extension = archivo.originalname.split('.').pop();
  const key = `documentos/${randomUUID()}.${extension}`;
  
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: archivo.buffer,
    ContentType: archivo.mimetype,
  }));
  
  const documento = await prisma.documento.create({
    data: {
      nombre: datos.nombre || archivo.originalname,
      archivo: key,
      tipo: archivo.mimetype,
      tramiteId: datos.tramiteId,
    },
  });
  cache.limpiar();
  return documento;
};

export const generarUrlDescarga = async (key) => {
  const comando = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2, comando, {expiresIn: 300 });
};

export const eliminarDocumento = async (documento) => {
  await r2.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: documento.archivo,
  }));

  const eliminado = await prisma.documento.delete({ where: { id: documento.id } });
  cache.limpiar();
  return eliminado;
};

// Borra de R2 los archivos de documentos cuyos registros ya se eliminaron (por
// ejemplo, en cascada al borrar un trámite). Un fallo solo se loguea: el registro
// ya no existe y no tiene sentido revertir la operación por un archivo huérfano.
export const eliminarArchivos = async (keys) => {
  const resultados = await Promise.allSettled(
    keys.map((key) => r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })))
  );

  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Error al borrar de R2 el archivo ${keys[i]}`, r.reason?.message);
    }
  });
};