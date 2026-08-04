export const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      const error = new Error ('No autorizado.');
      error.statusCode = 401;
      throw error;
    }
  

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    const error = new Error('No cuentas con los permisos necesarios para esta acción.');
    error.statusCode = 403;
    throw error;;
  }

  next();
  };
};