const ID_MAXIMO = 2147483647; // tope de Int en Postgres

export const esIdValido = (valor) => /^[1-9]\d*$/.test(valor) && Number(valor) <= ID_MAXIMO;

// Para router.param: un id que no es entero positivo responde 404 antes de que un
// NaN o un número fuera de rango llegue a Prisma y termine en 500.
export const validarId = (mensaje) => (req, res, next, valor) => {
  if (esIdValido(valor)) return next();

  const error = new Error(mensaje);
  error.statusCode = 404;
  next(error);
};
