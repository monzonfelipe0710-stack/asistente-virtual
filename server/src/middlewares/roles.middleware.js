export const autorizar = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      const error = new Error('No autorizado.');
      error.statusCode = 401;
      throw error;
    }

    if (req.usuario.rol === 'SUPERUSUARIO') return next();

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      const error = new Error('No cuentas con los permisos necesarios para esta acción.');
      error.statusCode = 403;
      throw error;
    }

    next();
  };
};
