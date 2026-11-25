// `tipo`: timeout u proveedor. `causa` va al log: nunca la clave, el bucket ni el mensaje del SDK.
export class ErrorAlmacenamiento extends Error {
  constructor(causa, { tipo = 'proveedor', original } = {}) {
    super(`Falla del almacenamiento: ${causa}`, original ? { cause: original } : undefined);
    this.name = 'ErrorAlmacenamiento';
    this.causa = causa;
    this.tipo = tipo;
  }
}
