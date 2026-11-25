import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET } from '../../config/r2.js';
import { ErrorAlmacenamiento } from './errores.js';

const NO_EXISTE = new Set(['NoSuchKey', 'NotFound']);

const traducir = (err, operacion, porTiempo) => {
  if (porTiempo) return new ErrorAlmacenamiento(`${operacion}: timeout`, { tipo: 'timeout' });
  const estado = err?.$metadata?.httpStatusCode;
  return new ErrorAlmacenamiento(`${operacion}: ${err?.name ?? 'error'}${estado ? ` ${estado}` : ''}`);
};

/** @type {import('./puerto.js').Almacenamiento} */
export const almacenamientoR2 = {
  subir: async (clave, contenido, tipo) => {
    await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: clave, Body: contenido, ContentType: tipo }));
  },

  borrar: async (clave) => {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: clave }));
  },

  urlFirmada: (clave, segundos) =>
    getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET, Key: clave }), { expiresIn: segundos }),

  // El plazo es hasta que R2 responde los encabezados; el cuerpo se lee después, sin plazo.
  leer: async (clave, { signal, timeoutMs = 10_000 } = {}) => {
    const control = new AbortController();
    const plazo = setTimeout(() => control.abort(), timeoutMs);
    const alCortar = () => control.abort();
    signal?.addEventListener('abort', alCortar, { once: true });
    try {
      const r = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: clave }), { abortSignal: control.signal });
      return { cuerpo: r.Body, tipo: r.ContentType ?? null, largo: r.ContentLength ?? null };
    } catch (err) {
      if (NO_EXISTE.has(err?.name)) return null;
      throw traducir(err, 'leer', control.signal.aborted && !signal?.aborted);
    } finally {
      clearTimeout(plazo);
      signal?.removeEventListener('abort', alCortar);
    }
  },
};
