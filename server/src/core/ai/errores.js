// Falla del proveedor de IA (o una respuesta que no se puede usar). `causa` va al log: no lleva
// datos de la persona ni el mensaje del proveedor. `tipo`: transitorio, cuota, timeout, contenido,
// solicitud, configuracion u otro. Habilitan el modelo de respaldo los tres primeros y una clave
// rechazada (401/403, `claveRechazada`), que es de configuración.
export class ErrorProveedorIA extends Error {
  constructor(causa, { operacion, original, tipo = 'otro', sinCredito = false, claveRechazada = false } = {}) {
    super(`Falla del proveedor de IA: ${causa}`, original ? { cause: original } : undefined);
    this.name = 'ErrorProveedorIA';
    this.causa = causa;
    this.operacion = operacion;
    this.tipo = tipo;
    this.sinCredito = sinCredito;
    this.claveRechazada = claveRechazada;
  }
}

export const TIPOS_CON_RESPALDO = new Set(['transitorio', 'cuota', 'timeout']);

// La cuenta del proveedor se quedó sin crédito: no es una falla pasajera, reintentar no sirve. Busca en
// toda la cadena de causas (AsistenteNoDisponibleError → ErrorProveedorIA → error del SDK).
const SIN_CREDITO = new Set(['insufficient_quota', 'credit_balance_exhausted']);
export const esSinCredito = (err) => {
  for (let e = err, i = 0; e && i < 10; e = e.cause, i++) {
    if (e.sinCredito === true) return true;
    if ([e.code, e.type, e.error?.code, e.error?.type].some((c) => SIN_CREDITO.has(c))) return true;
  }
  return false;
};
