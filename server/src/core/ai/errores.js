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
