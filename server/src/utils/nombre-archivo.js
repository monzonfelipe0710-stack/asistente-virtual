import { EXTENSIONES } from '../config/multer.js';

const rango = (desde, hasta) => `${String.fromCharCode(desde)}-${String.fromCharCode(hasta)}`;
// Controles C0 y C1 y las marcas de dirección (LRM, RLM, LRE a RLO, LRI a PDI).
const INVISIBLES = [rango(0x00, 0x1f), rango(0x7f, 0x9f), rango(0x200e, 0x200f), rango(0x202a, 0x202e), rango(0x2066, 0x2069)].join('');
const PROHIBIDOS = new RegExp(`[${INVISIBLES}<>:"/\\|?*;%]+`, 'g');
const COMBINACION = new RegExp(`[${rango(0x300, 0x36f)}]`, 'g');
const LARGO_MAXIMO = 120;

// Nombre para el Content-Disposition: sin rutas, controles ni marcas de dirección, con la extensión
// que corresponde al tipo guardado (no la que traiga el nombre).
export const nombreDeDescarga = (nombre, tipo) => {
  const extension = EXTENSIONES[tipo];
  let base = String(nombre ?? '').normalize('NFC').replace(PROHIBIDOS, ' ').replace(/\s+/g, ' ').trim();
  if (extension && base.toLowerCase().endsWith(`.${extension}`)) base = base.slice(0, -(extension.length + 1));
  base = base.replace(/^[.\s]+|[.\s]+$/g, '').slice(0, LARGO_MAXIMO).trim() || 'documento';
  return extension ? `${base}.${extension}` : base;
};

const RFC5987 = (texto) => encodeURIComponent(texto).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// Descarga con nombre: versión ASCII para clientes viejos y la UTF-8 (RFC 6266) para el resto.
export const disposicionDeDescarga = (nombre) => {
  const ascii = nombre.normalize('NFD').replace(COMBINACION, '').replace(/[^\x20-\x7e]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${RFC5987(nombre)}`;
};
