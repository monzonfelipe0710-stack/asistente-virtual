import prisma from '../config/prisma.js';
import * as cache from './cache.service.js';

// El catálogo cambia también desde otros procesos (el import, otra instancia del server). Cada
// cambio incrementa una versión en la base; el server la lee como mucho cada CHEQUEO_MS antes de
// usar la caché y, si la ve distinta, la vacía.
const CHEQUEO_MS = Number(process.env.CACHE_CHEQUEO_MS ?? 5000);

let versionLocal = null;
let ultimoChequeo = 0;
let chequeoEnCurso = null;
let avisado = false;

const avisarUnaVez = (accion, err) => {
  if (avisado) return;
  avisado = true;
  console.error(`No se pudo ${accion} la versión del catálogo (¿falta aplicar la migración catalogo_version?): ${err.message}`);
};

export const leerVersion = async () => {
  const [fila] = await prisma.$queryRaw`SELECT version FROM catalogo_version WHERE id = 1`;
  return fila ? String(fila.version) : null;
};

// Lo llama quien escribe el catálogo fuera de un request del server (el import) y, vía
// cache.limpiar(), cada escritura del panel.
export const marcarCatalogoCambiado = async () => {
  const [fila] = await prisma.$queryRaw`
    UPDATE catalogo_version SET version = version + 1, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = 1 RETURNING version`;
  return fila ? String(fila.version) : null;
};

export const asegurarCacheVigente = async ({ ahora = Date.now() } = {}) => {
  if (ahora - ultimoChequeo < CHEQUEO_MS) return;
  chequeoEnCurso ??= (async () => {
    try {
      const version = await leerVersion();
      if (versionLocal !== null && version !== versionLocal) cache.limpiar({ propagar: false });
      versionLocal = version;
    } catch (err) {
      avisarUnaVez('leer', err);
    } finally {
      ultimoChequeo = Date.now();
      chequeoEnCurso = null;
    }
  })();
  await chequeoEnCurso;
};

export const propagarInvalidacion = () => {
  marcarCatalogoCambiado().catch((err) => avisarUnaVez('incrementar', err));
};

cache.alLimpiar(propagarInvalidacion);

export const reiniciarParaTests = () => {
  versionLocal = null;
  ultimoChequeo = 0;
  chequeoEnCurso = null;
};
