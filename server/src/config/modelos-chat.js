import { readFileSync } from 'node:fs';

const CATALOGO = JSON.parse(readFileSync(new URL('./modelos-chat.json', import.meta.url), 'utf8'));

export const CLAVE_POR_PROVEEDOR = { openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', google: 'GEMINI_API_KEY' };

export const MODELOS_DEL_CATALOGO = CATALOGO.modelos;
export const PERFIL_CONSULTA = CATALOGO.perfilConsulta;

export const modeloDelCatalogo = (id) => CATALOGO.modelos.find((m) => m.id === id) ?? null;

export const proveedorConocido = (proveedor) => Object.hasOwn(CLAVE_POR_PROVEEDOR, proveedor);

export const tieneClave = (proveedor) => proveedorConocido(proveedor) && Boolean(process.env[CLAVE_POR_PROVEEDOR[proveedor]]?.trim());

const avisados = new Set();
export const avisarUnaVez = (clave, mensaje) => {
  if (avisados.has(clave)) return;
  avisados.add(clave);
  console.warn(mensaje);
};

export const idPorDefectoDelEntorno = () => {
  const pedido = process.env.MODELO_CHAT_POR_DEFECTO?.trim() || process.env.OPENAI_MODELO_CHAT?.trim();
  if (!pedido || modeloDelCatalogo(pedido)) return pedido || CATALOGO.porDefecto;
  avisarUnaVez(`por-defecto:${pedido}`, `MODELO_CHAT_POR_DEFECTO="${pedido}" no está en el catálogo: se usa ${CATALOGO.porDefecto}.`);
  return CATALOGO.porDefecto;
};

export const idForzado = () => {
  const forzado = process.env.MODELO_CHAT_FORZADO?.trim();
  if (!forzado) return null;
  if (process.env.NODE_ENV === 'production') {
    avisarUnaVez('forzado-produccion', 'MODELO_CHAT_FORZADO se ignora en producción.');
    return null;
  }
  return forzado;
};

const redondear = (x) => Math.round(x * 1000) / 1000;

// Cota superior en USD por 1000 consultas: toda la entrada sin caché.
export const costoPor1000 = (precios, perfil = PERFIL_CONSULTA) => {
  const entrada = precios?.entradaNoCacheada ?? precios?.entrada;
  if (entrada == null || precios?.salida == null) return null;
  return redondear(((perfil.entrada * entrada + perfil.salida * precios.salida) / 1e6) * 1000);
};

export const costoDeUso = (precios, { entrada = 0, cacheada = 0, salida = 0 }) => {
  const noCacheada = precios?.entradaNoCacheada ?? precios?.entrada ?? 0;
  const cacheadaPrecio = precios?.entradaCacheada ?? noCacheada;
  return ((entrada - cacheada) * noCacheada + cacheada * cacheadaPrecio + salida * (precios?.salida ?? 0)) / 1e6;
};
