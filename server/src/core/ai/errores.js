// Falla del proveedor de IA (o una respuesta que no se puede usar). `causa` va al log: no lleva
// datos de la persona.
export class ErrorProveedorIA extends Error {
  constructor(causa, { operacion, original } = {}) {
    super(`Falla del proveedor de IA: ${causa}`, original ? { cause: original } : undefined);
    this.name = 'ErrorProveedorIA';
    this.causa = causa;
    this.operacion = operacion;
  }
}

// La cuenta de OpenAI se quedó sin crédito: no es una falla pasajera, reintentar no sirve. Busca en
// toda la cadena de causas (AsistenteNoDisponibleError → ErrorProveedorIA → APIError del SDK).
const SIN_CREDITO = new Set(['insufficient_quota', 'credit_balance_exhausted']);
export const esSinCredito = (err) => {
  for (let e = err, i = 0; e && i < 10; e = e.cause, i++) {
    if ([e.code, e.type, e.error?.code, e.error?.type].some((c) => SIN_CREDITO.has(c))) return true;
  }
  return false;
};
