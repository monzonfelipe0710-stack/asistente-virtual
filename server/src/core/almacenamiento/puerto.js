/**
 * Puerto de almacenamiento de archivos (hoy, Cloudflare R2). La clave es interna: no sale del
 * servidor. Las fallas del proveedor llegan como ErrorAlmacenamiento, sin la clave ni el bucket.
 *
 * @typedef {{ cuerpo: import('node:stream').Readable, tipo: string | null, largo: number | null }} Objeto
 *
 * @typedef {Object} Almacenamiento
 * @property {(clave: string, contenido: Buffer, tipo: string) => Promise<void>} subir
 * @property {(clave: string) => Promise<void>} borrar
 * @property {(clave: string, segundos: number) => Promise<string>} urlFirmada
 * @property {(clave: string, opciones?: { signal?: AbortSignal, timeoutMs?: number }) => Promise<Objeto | null>} leer
 *   null si el objeto no existe.
 */
export {};
